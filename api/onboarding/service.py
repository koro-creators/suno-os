"""
SPEC-015 — Onboarding service: HITL gate, status management, ACTIVE transition.

ADR-LOCAL-04: HITL gate enforced server-side.
Constitution §1.2: Status PRE_ACTIVE/ACTIVE is a hard gate.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException

from .constants import ONTOLOGY_ENTITY_TYPES, ORACLE_STUB_DELAY_SECONDS
from .oracle_agent import invoke_oracle

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-memory store (v1 — matches workflows/router.py pattern)
# Replace with SQLAlchemy + PostgreSQL when DB persistence arrives.
# ---------------------------------------------------------------------------

_clients: dict[str, dict] = {}
_jobs: dict[str, dict] = {}
_wiki_entities: dict[str, dict] = {}  # key: "{client_id}:{entity_type}"
_hitl_events: list[dict] = []  # append-only audit log


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _now_iso() -> str:
    return _now().isoformat()


# ---------------------------------------------------------------------------
# Client helpers
# ---------------------------------------------------------------------------


def get_client_by_slug(slug: str) -> dict | None:
    for c in _clients.values():
        if c["slug"] == slug:
            return c
    return None


def require_client_by_slug(slug: str) -> dict:
    """Returns client or raises 404 (caixa-preta: never 403)."""
    client = get_client_by_slug(slug)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return client


def create_client(data: dict) -> dict:
    client_id = str(uuid.uuid4())
    job_id = str(uuid.uuid4())
    now = _now_iso()

    client = {
        "id": client_id,
        "slug": data["slug"],
        "name": data["name"],
        "color": data.get("color", "#FFC801"),
        "description": data.get("description", ""),
        "sponsor_name": data.get("sponsor_name", ""),
        "sponsor_email": data.get("sponsor_email", ""),
        "oracle_config": data.get("oracle_config", {}),
        "selected_doc_ids": data.get("selected_doc_ids", []),
        "status": "PRE_ACTIVE",
        "created_at": now,
        "updated_at": now,
    }

    job = {
        "id": job_id,
        "client_id": client_id,
        "drive_sync_status": "pending",
        "oracle_status": "pending",
        "current_entity": None,
        "entities_done": 0,
        "total_entities": len(ONTOLOGY_ENTITY_TYPES),
        "entities": {et: "pending" for et in ONTOLOGY_ENTITY_TYPES},
        "error_detail": None,
        "started_at": None,
        "completed_at": None,
        "eta_hours": 24,
    }

    _clients[client_id] = client
    _jobs[client_id] = job

    # Initialize wiki entities as placeholders
    for entity_type in ONTOLOGY_ENTITY_TYPES:
        key = f"{client_id}:{entity_type}"
        _wiki_entities[key] = {
            "id": str(uuid.uuid4()),
            "client_id": client_id,
            "entity_type": entity_type,
            "content": "",
            "provenance": [],
            "status": "pending",
            "badge": "seed_auto",
            "created_at": now,
            "updated_at": now,
        }

    return client, job_id


def get_onboarding_status(slug: str) -> dict:
    client = require_client_by_slug(slug)
    client_id = client["id"]
    job = _jobs.get(client_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job de onboarding não encontrado")

    return {
        "client_id": client_id,
        "client_slug": client["slug"],
        "client_status": client["status"],
        "drive_sync_status": job["drive_sync_status"],
        "oracle_status": job["oracle_status"],
        "current_entity": job["current_entity"],
        "entities_done": job["entities_done"],
        "total_entities": job["total_entities"],
        "entities": dict(job["entities"]),
        "error_detail": job["error_detail"],
        "eta_hours": job["eta_hours"],
    }


# ---------------------------------------------------------------------------
# Stub Oracle BackgroundTask
# Constitution §1.1: Job runs async; never blocks HTTP.
# ADR-LOCAL-02: FastAPI BackgroundTasks for v1.
# ---------------------------------------------------------------------------


async def run_oracle_agent(client_id: str) -> None:
    """
    Oracle agent: LangGraph StateGraph (Gemini Flash) for entity extraction.
    Falls back to rich local content if LLM unavailable.
    Keeps job status/progress logic identical to former stub.
    """
    job = _jobs.get(client_id)
    client = _clients.get(client_id)
    if not job or not client:
        logger.error("Oracle agent: client_id %s not found", client_id)
        return

    logger.info("Oracle agent started for client %s", client["slug"])
    job["drive_sync_status"] = "running"
    job["started_at"] = _now_iso()

    # Simulate Drive sync phase (brief delay — mirrors former stub cadence)
    await asyncio.sleep(ORACLE_STUB_DELAY_SECONDS)
    job["drive_sync_status"] = "done"
    job["oracle_status"] = "running"

    brand_context = client.get("brand_context", "")
    wizard_briefing = client.get("wizard_briefing", "")

    # Generate each entity sequentially
    for entity_type in ONTOLOGY_ENTITY_TYPES:
        job["current_entity"] = entity_type
        await asyncio.sleep(ORACLE_STUB_DELAY_SECONDS)  # keeps progressive UI polling

        key = f"{client_id}:{entity_type}"
        entity = _wiki_entities.get(key)
        if entity:
            try:
                content = await invoke_oracle(
                    client_id=client_id,
                    client_name=client["name"],
                    entity_type=entity_type,
                    brand_context=brand_context,
                    wizard_briefing=wizard_briefing,
                )
                provenance_source = "Oráculo Gemini"
            except Exception as exc:
                logger.warning(
                    "Oracle agent: invoke_oracle failed for %s/%s (%s)",
                    client["slug"], entity_type, exc,
                )
                from .oracle_agent import _fallback_content
                content = _fallback_content(entity_type, client["name"])
                provenance_source = "Fallback local"

            entity["status"] = "generated"
            entity["content"] = content
            entity["provenance"] = [
                {
                    "source": provenance_source,
                    "excerpt": f"Gerado a partir de brand_context + wizard_briefing para {entity_type}",
                }
            ]
            entity["updated_at"] = _now_iso()

        job["entities"][entity_type] = "generated"
        job["entities_done"] += 1
        logger.info("Oracle agent: entity %s generated for %s", entity_type, client["slug"])

    job["current_entity"] = None
    job["oracle_status"] = "done"
    job["completed_at"] = _now_iso()
    logger.info("Oracle agent completed for client %s", client["slug"])


def start_onboarding(slug: str) -> dict:
    client = require_client_by_slug(slug)
    client_id = client["id"]
    job = _jobs.get(client_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job de onboarding não encontrado")
    return {"job_id": job["id"], "status": "started", "eta_hours": job["eta_hours"]}


# ---------------------------------------------------------------------------
# HITL validation (ADR-LOCAL-04: server-side gate)
# ---------------------------------------------------------------------------


def validate_entity(slug: str, entity_type: str, action: str, edited_content: str | None, user_id: str) -> dict:
    client = require_client_by_slug(slug)
    client_id = client["id"]

    # Validate entity_type
    if entity_type not in ONTOLOGY_ENTITY_TYPES:
        raise HTTPException(status_code=400, detail=f"Tipo de entidade inválido: {entity_type}")

    key = f"{client_id}:{entity_type}"
    entity = _wiki_entities.get(key)
    if not entity:
        raise HTTPException(status_code=404, detail="Entidade não encontrada")

    if entity["status"] not in ("generated", "accepted"):
        raise HTTPException(
            status_code=409,
            detail=f"Entidade {entity_type} ainda não foi gerada pelo Oráculo"
        )

    before_content = entity["content"]
    now = _now_iso()

    if action == "accept":
        entity["status"] = "accepted"
        entity["badge"] = "seed_auto"
        entity["updated_at"] = now

    elif action == "edit_accept":
        if not edited_content:
            raise HTTPException(status_code=422, detail="edited_content é obrigatório para edit_accept")
        entity["content"] = edited_content
        entity["status"] = "accepted"
        entity["badge"] = "hitl"
        entity["updated_at"] = now

    elif action == "reject_regenerate":
        entity["status"] = "regenerating"
        entity["badge"] = "seed_auto"
        entity["updated_at"] = now
        # Schedule re-generation in background (handled by router via BackgroundTask)

    else:
        raise HTTPException(status_code=400, detail=f"Ação inválida: {action}")

    # Append-only audit log (constitution §2.4)
    _hitl_events.append({
        "id": str(uuid.uuid4()),
        "client_id": client_id,
        "entity_type": entity_type,
        "action": action,
        "before_content": before_content,
        "after_content": entity["content"],
        "user_id": user_id,
        "timestamp_utc": now,
    })

    # Check HITL gate: are ALL 6 entities accepted? (ADR-LOCAL-04)
    client_status_result = None
    if action in ("accept", "edit_accept"):
        all_entities = [
            _wiki_entities.get(f"{client_id}:{et}")
            for et in ONTOLOGY_ENTITY_TYPES
        ]
        all_accepted = all(e is not None and e["status"] == "accepted" for e in all_entities)
        if all_accepted and client["status"] == "PRE_ACTIVE":
            client["status"] = "ACTIVE"
            client["updated_at"] = now
            client_status_result = "ACTIVE"
            logger.info("Client %s transitioned to ACTIVE after HITL gate", slug)

    return {
        "entity_type": entity_type,
        "status": entity["status"],
        "badge": entity["badge"],
        "client_status": client_status_result,
    }


async def regenerate_entity_stub(client_id: str, entity_type: str) -> None:
    """Entity regeneration after HITL rejection — uses oracle agent with fallback."""
    await asyncio.sleep(ORACLE_STUB_DELAY_SECONDS * 2)
    client = _clients.get(client_id)
    key = f"{client_id}:{entity_type}"
    entity = _wiki_entities.get(key)
    if entity:
        client_name = client["name"] if client else client_id
        brand_context = client.get("brand_context", "") if client else ""
        wizard_briefing = client.get("wizard_briefing", "") if client else ""
        try:
            content = await invoke_oracle(
                client_id=client_id,
                client_name=client_name,
                entity_type=entity_type,
                brand_context=brand_context,
                wizard_briefing=wizard_briefing,
            )
            provenance_source = "Oráculo Gemini"
        except Exception as exc:
            logger.warning(
                "Oracle agent: regeneration failed for %s/%s (%s)", client_id, entity_type, exc
            )
            from .oracle_agent import _fallback_content
            content = _fallback_content(entity_type, client_name)
            provenance_source = "Fallback local"

        entity["status"] = "generated"
        entity["content"] = content
        entity["provenance"] = [
            {
                "source": provenance_source,
                "excerpt": f"Regenerado após rejeição HITL de {entity_type}",
            }
        ]
        entity["badge"] = "seed_auto"
        entity["updated_at"] = _now_iso()
    if client_id in _jobs:
        _jobs[client_id]["entities"][entity_type] = "generated"
    logger.info("Oracle agent: entity %s regenerated for client %s", entity_type, client_id)


# ---------------------------------------------------------------------------
# Wiki
# ---------------------------------------------------------------------------


def get_wiki(slug: str, include_generated: bool = False) -> dict:
    """
    Returns wiki entities for a client.

    include_generated=False (default): only ``accepted`` entities — used by the
    Wiki Ontológica page (T-39, caixa-preta view).
    include_generated=True: ``generated`` + ``accepted`` entities — used by the
    HITL validate page (T-36) so reviewers can read the Oracle stub content
    before approving.

    Caixa-preta: caller (router) enforces 404 for unauthorized access.
    ADR-LOCAL-05: Wiki is a view of wiki_entities — not Biblioteca.
    """
    client = require_client_by_slug(slug)
    client_id = client["id"]

    visible_statuses = {"accepted", "generated"} if include_generated else {"accepted"}

    entities = []
    for entity_type in ONTOLOGY_ENTITY_TYPES:
        key = f"{client_id}:{entity_type}"
        entity = _wiki_entities.get(key)
        if entity and entity["status"] in visible_statuses:
            entities.append(entity)

    return {
        "client_id": client_id,
        "client_slug": client["slug"],
        "client_name": client["name"],
        "entities": entities,
    }
