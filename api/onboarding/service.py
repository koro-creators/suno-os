"""
SPEC-015 — Onboarding service: HITL gate, status management, ACTIVE transition.

A-8: persistido em Postgres (onboarding_jobs / wiki_entities / entity_hitl_events
+ clients). Funções síncronas recebem uma ``Session`` (injetada no router via
core.db.get_session). As tasks async (BackgroundTasks) não têm sessão de request,
então abrem a própria (best-effort).

ADR-LOCAL-04: HITL gate enforced server-side.
Constitution §1.2: Status PRE_ACTIVE/ACTIVE é hard gate.
"""

from __future__ import annotations

import asyncio
import logging

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .constants import ONTOLOGY_ENTITY_TYPES, ORACLE_STUB_DELAY_SECONDS
from .oracle_agent import invoke_oracle

try:
    from clientes import repository as clients_repo
except ImportError:  # test import root
    from api.clientes import repository as clients_repo

from . import repository

logger = logging.getLogger(__name__)


def _now_iso() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


def _open_session() -> Session:
    """Sessão própria para BackgroundTasks (sem sessão de request)."""
    try:
        from core.db import _get_sessionmaker
    except ImportError:  # test import root
        from api.core.db import _get_sessionmaker
    return _get_sessionmaker()()


def _oracle_now():
    from datetime import datetime, timezone

    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Client helpers
# ---------------------------------------------------------------------------


def get_client_by_slug(session: Session, slug: str) -> dict | None:
    return repository.get_client_by_slug(session, slug)


def require_client_by_slug(session: Session, slug: str) -> dict:
    """Returns client or raises 404 (caixa-preta: never 403)."""
    client = repository.get_client_by_slug(session, slug)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return client


def list_clients(session: Session, status: str | None = None) -> list[dict]:
    items = clients_repo.list_clients(session)
    if status:
        items = [c for c in items if c.get("status") == status]
    return items


def create_client(session: Session, data: dict) -> tuple[dict, str]:
    client = clients_repo.create_client(
        session,
        name=data["name"],
        slug=data["slug"],
        status="PRE_ACTIVE",
        color=data.get("color", "#FFC801"),
        description=data.get("description", ""),
        sponsor_name=data.get("sponsor_name", ""),
        sponsor_email=data.get("sponsor_email", ""),
        oracle_config=data.get("oracle_config", {}),
        selected_doc_ids=data.get("selected_doc_ids", []),
    )
    client_id = client["id"]
    job_id = repository.create_job(session, client_id)

    for entity_type in ONTOLOGY_ENTITY_TYPES:
        repository.create_entity_placeholder(session, client_id, entity_type)

    return client, job_id


def get_onboarding_status(session: Session, slug: str) -> dict:
    client = require_client_by_slug(session, slug)
    client_id = client["id"]
    job = repository.get_job(session, client_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job de onboarding não encontrado")

    entities = repository.entities_status_map(session, client_id)
    return {
        "client_id": client_id,
        "client_slug": client["slug"],
        "client_status": client["status"],
        "drive_sync_status": job.drive_sync_status,
        "oracle_status": job.oracle_status,
        "current_entity": job.current_entity,
        "entities_done": job.entities_done or 0,
        "total_entities": len(ONTOLOGY_ENTITY_TYPES),
        "entities": entities,
        "error_detail": job.error_detail,
        "eta_hours": job.eta_hours or 24,
    }


def start_onboarding(session: Session, slug: str) -> dict:
    client = require_client_by_slug(session, slug)
    job = repository.get_job(session, client["id"])
    if not job:
        raise HTTPException(status_code=404, detail="Job de onboarding não encontrado")
    return {"job_id": str(job.id), "status": "started", "eta_hours": job.eta_hours or 24}


# ---------------------------------------------------------------------------
# Oracle BackgroundTask (async — abre a própria sessão)
# ---------------------------------------------------------------------------


async def run_oracle_agent(client_id: str) -> None:
    """Oracle agent (LangGraph/Gemini com fallback local). Persiste progresso em DB."""
    session = _open_session()
    try:
        client = clients_repo.get(session, client_id)
        job = repository.get_job(session, client_id)
        if not job or not client:
            logger.error("Oracle agent: client_id %s not found", client_id)
            return

        logger.info("Oracle agent started for client %s", client.slug)
        repository.update_job(
            session, client_id, drive_sync_status="running", started_at=_oracle_now()
        )

        await asyncio.sleep(ORACLE_STUB_DELAY_SECONDS)
        repository.update_job(session, client_id, drive_sync_status="done", oracle_status="running")

        client_name = client.name
        oracle_config = client.oracle_config or {}
        allowed_domains: list[str] = oracle_config.get("allowed_domains") or []

        for entity_type in ONTOLOGY_ENTITY_TYPES:
            repository.update_job(session, client_id, current_entity=entity_type)
            await asyncio.sleep(ORACLE_STUB_DELAY_SECONDS)

            entity = repository.get_entity(session, client_id, entity_type)
            if entity:
                try:
                    # CA-20: invoke_oracle returns (content, provenance) tuple
                    content, provenance = await invoke_oracle(
                        client_id=client_id,
                        client_name=client_name,
                        entity_type=entity_type,
                        brand_context="",
                        wizard_briefing="",
                        allowed_domains=allowed_domains,
                    )
                except Exception as exc:
                    logger.warning(
                        "Oracle agent: invoke_oracle failed for %s/%s (%s)",
                        client.slug,
                        entity_type,
                        exc,
                    )
                    from .oracle_agent import _fallback_content

                    content = _fallback_content(entity_type, client_name)
                    provenance = [
                        {
                            "source_type": "briefing",
                            "reference": "Fallback local",
                            "cited_excerpt": f"Gerado localmente para {entity_type}",
                        }
                    ]

                repository.update_entity(
                    session,
                    entity,
                    status="generated",
                    content=content,
                    provenance=provenance,
                )

            repository.increment_entities_done(session, client_id)
            logger.info("Oracle agent: entity %s generated for %s", entity_type, client.slug)

        repository.update_job(
            session,
            client_id,
            current_entity=None,
            oracle_status="done",
            completed_at=_oracle_now(),
        )
        logger.info("Oracle agent completed for client %s", client.slug)
    except Exception as exc:  # noqa: BLE001 — background task: log e segue
        logger.error("Oracle agent crashed for client %s: %s", client_id, exc)
    finally:
        session.close()


# ---------------------------------------------------------------------------
# HITL validation (ADR-LOCAL-04: server-side gate)
# ---------------------------------------------------------------------------


def validate_entity(
    session: Session,
    slug: str,
    entity_type: str,
    action: str,
    edited_content: str | None,
    user_id: str,
) -> dict:
    client = require_client_by_slug(session, slug)
    client_id = client["id"]

    if entity_type not in ONTOLOGY_ENTITY_TYPES:
        raise HTTPException(status_code=400, detail=f"Tipo de entidade inválido: {entity_type}")

    entity = repository.get_entity(session, client_id, entity_type)
    if not entity:
        raise HTTPException(status_code=404, detail="Entidade não encontrada")

    if entity.status not in ("generated", "accepted"):
        raise HTTPException(
            status_code=409,
            detail=f"Entidade {entity_type} ainda não foi gerada pelo Oráculo",
        )

    before_content = entity.content

    if action == "accept":
        repository.update_entity(session, entity, status="accepted", badge="seed_auto")
    elif action == "edit_accept":
        if not edited_content:
            raise HTTPException(
                status_code=422, detail="edited_content é obrigatório para edit_accept"
            )
        repository.update_entity(
            session, entity, content=edited_content, status="accepted", badge="hitl"
        )
    elif action == "reject_regenerate":
        repository.update_entity(session, entity, status="regenerating", badge="seed_auto")
    else:
        raise HTTPException(status_code=400, detail=f"Ação inválida: {action}")

    repository.add_hitl_event(
        session,
        client_id=client_id,
        entity_type=entity_type,
        action=action,
        before_content=before_content,
        after_content=entity.content,
        user_id=user_id,
    )

    # HITL gate: todas as 6 entidades aceitas? (ADR-LOCAL-04)
    client_status_result = None
    if action in ("accept", "edit_accept"):
        status_map = repository.entities_status_map(session, client_id)
        all_accepted = all(s == "accepted" for s in status_map.values())
        if all_accepted and client["status"] == "PRE_ACTIVE":
            repository.set_client_status(session, client_id, "ACTIVE")
            client_status_result = "ACTIVE"
            logger.info("Client %s transitioned to ACTIVE after HITL gate", slug)

    return {
        "entity_type": entity_type,
        "status": entity.status,
        "badge": entity.badge,
        "client_status": client_status_result,
    }


def direct_edit_wiki_entity(
    session: Session,
    slug: str,
    entity_type: str,
    content: str,
    user_id: str,
) -> dict:
    """JN-15: Sponsor edits wiki entity directly, without re-running the Oracle."""
    client = require_client_by_slug(session, slug)
    client_id = client["id"]

    if client["status"] != "ACTIVE":
        raise HTTPException(status_code=409, detail="Wiki só disponível para clientes ACTIVE")

    if entity_type not in ONTOLOGY_ENTITY_TYPES:
        raise HTTPException(status_code=400, detail=f"Tipo de entidade inválido: {entity_type}")

    entity = repository.get_entity(session, client_id, entity_type)
    if not entity:
        raise HTTPException(status_code=404, detail="Entidade não encontrada")

    if entity.status != "accepted":
        raise HTTPException(
            status_code=409, detail="Entidade deve estar aceita antes de edição direta"
        )

    before_content = entity.content
    repository.update_entity(session, entity, content=content, badge="hitl", updated_by=user_id)

    repository.add_hitl_event(
        session,
        client_id=client_id,
        entity_type=entity_type,
        action="direct_edit",
        before_content=before_content,
        after_content=content,
        user_id=user_id,
    )

    return {
        "entity_type": entity_type,
        "content": content,
        "badge": entity.badge,
        "status": entity.status,
    }


def get_wiki_audit(session: Session, slug: str) -> list[dict]:
    """Returns HITL audit log for a client (Admin only)."""
    client = require_client_by_slug(session, slug)
    return repository.list_hitl_events(session, client["id"])


def add_reunion_context_to_oraculo(
    client_id: str,
    meeting_id: str,
    selected_segments: list[dict],
) -> None:
    """FA-15: injeta segmentos curados de reunião no contexto Briefings do cliente.

    Chamado pelo router de reuniões (sem sessão) — abre a própria. Best-effort:
    nunca levanta.
    """
    session = _open_session()
    try:
        entity = repository.get_entity(session, client_id, "Histórico de Campanhas")
        if not entity:
            return  # caixa-preta: silently skip
        reunion_text = "\n\n".join(
            seg.get("text", "") for seg in selected_segments if seg.get("selected")
        )
        if not reunion_text:
            return
        new_content = (entity.content or "") + f"\n\n[Reunião {meeting_id}]:\n{reunion_text}"
        repository.update_entity(session, entity, content=new_content)
        logger.info(
            "FA-15: reunion %s context added to Histórico de Campanhas for client %s",
            meeting_id,
            client_id,
        )
    except Exception as exc:  # noqa: BLE001 — best-effort
        logger.warning("FA-15: failed to add reunion context (non-fatal): %s", exc)
    finally:
        session.close()


async def regenerate_entity_stub(client_id: str, entity_type: str) -> None:
    """Regeneração de entidade após rejeição HITL — oracle com fallback."""
    await asyncio.sleep(ORACLE_STUB_DELAY_SECONDS * 2)
    session = _open_session()
    try:
        client = clients_repo.get(session, client_id)
        entity = repository.get_entity(session, client_id, entity_type)
        if not entity:
            return
        client_name = client.name if client else client_id
        oracle_config = (client.oracle_config or {}) if client else {}
        allowed_domains: list[str] = oracle_config.get("allowed_domains") or []
        try:
            # CA-20: invoke_oracle returns (content, provenance) tuple
            content, provenance = await invoke_oracle(
                client_id=client_id,
                client_name=client_name,
                entity_type=entity_type,
                brand_context="",
                wizard_briefing="",
                allowed_domains=allowed_domains,
            )
        except Exception as exc:
            logger.warning(
                "Oracle agent: regeneration failed for %s/%s (%s)", client_id, entity_type, exc
            )
            from .oracle_agent import _fallback_content

            content = _fallback_content(entity_type, client_name)
            provenance = [
                {
                    "source_type": "briefing",
                    "reference": "Fallback local",
                    "cited_excerpt": f"Regenerado localmente para {entity_type}",
                }
            ]

        repository.update_entity(
            session,
            entity,
            status="generated",
            content=content,
            badge="seed_auto",
            provenance=provenance,
        )
        logger.info("Oracle agent: entity %s regenerated for client %s", entity_type, client_id)
    except Exception as exc:  # noqa: BLE001 — background task
        logger.error("Regeneration crashed for %s/%s: %s", client_id, entity_type, exc)
    finally:
        session.close()


# ---------------------------------------------------------------------------
# Wiki
# ---------------------------------------------------------------------------


def get_wiki(session: Session, slug: str, include_generated: bool = False) -> dict:
    """Wiki entities do cliente. include_generated controla visibilidade (T-36/T-39)."""
    client = require_client_by_slug(session, slug)
    client_id = client["id"]

    visible = {"accepted", "generated"} if include_generated else {"accepted"}
    rows = repository.list_entities(session, client_id, statuses=visible)
    order = {et: i for i, et in enumerate(ONTOLOGY_ENTITY_TYPES)}
    rows.sort(key=lambda e: order.get(e.entity_type, 99))

    return {
        "client_id": client_id,
        "client_slug": client["slug"],
        "client_name": client["name"],
        "entities": [e.to_dict() for e in rows],
    }
