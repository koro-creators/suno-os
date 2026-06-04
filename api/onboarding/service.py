"""
SPEC-015 — Onboarding service: HITL gate, status management, ACTIVE transition.

ADR-LOCAL-04: HITL gate enforced server-side.
Constitution §1.2: Status PRE_ACTIVE/ACTIVE is a hard gate.

Persistence: DB-backed (PostgreSQL) with automatic in-memory fallback.
Pattern: try DB write-through; in-memory is the authoritative cache for the
process lifetime (BackgroundTask continuity). All mutating operations write
to both stores when DB is available.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException

from .constants import ONTOLOGY_ENTITY_TYPES, ORACLE_STUB_DELAY_SECONDS
from .db import (
    db_append_hitl_event,
    db_create_client,
    db_create_job,
    db_create_wiki_entities,
    db_get_client_by_slug,
    db_get_job,
    db_get_wiki_entity,
    db_list_clients,
    db_list_hitl_events,
    db_list_wiki_entities,
    db_update_client_status,
    db_update_job,
    db_update_wiki_entity,
)
from .oracle_agent import invoke_oracle

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-memory store — authoritative cache for background tasks
# Seeded on create_client; kept in sync with DB writes.
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


def _get_client_by_slug_memory(slug: str) -> dict | None:
    for c in _clients.values():
        if c["slug"] == slug:
            return c
    return None


async def get_client_by_slug(slug: str) -> dict | None:
    """Returns client dict from memory cache, falling back to DB."""
    client = _get_client_by_slug_memory(slug)
    if client:
        return client
    row = await db_get_client_by_slug(slug)
    if row:
        _clients[row["id"]] = row
    return row


async def require_client_by_slug(slug: str) -> dict:
    """Returns client or raises 404 (caixa-preta: never 403)."""
    client = await get_client_by_slug(slug)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return client


async def list_clients(status: str | None = None) -> list[dict]:
    """List clients, optionally filtered by status."""
    db_rows = await db_list_clients(status)
    if db_rows is not None:
        # Sync DB rows into memory cache
        for row in db_rows:
            _clients[row["id"]] = row
        return db_rows

    # In-memory fallback
    items = list(_clients.values())
    if status:
        items = [c for c in items if c.get("status") == status]
    return sorted(items, key=lambda c: c.get("created_at", ""), reverse=True)


async def create_client(data: dict) -> tuple[dict, str]:
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

    # Seed in-memory first (BackgroundTask depends on this)
    _clients[client_id] = client
    _jobs[client_id] = job
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

    # Write-through to DB (fire-and-forget — memory is authoritative)
    asyncio.create_task(_persist_new_client(client, job))

    return client, job_id


async def _persist_new_client(client: dict, job: dict) -> None:
    await db_create_client(client)
    await db_create_job(job)
    await db_create_wiki_entities(client["id"], ONTOLOGY_ENTITY_TYPES)


async def get_onboarding_status(slug: str) -> dict:
    client = await require_client_by_slug(slug)
    client_id = client["id"]
    job = _jobs.get(client_id)

    if not job:
        db_job = await db_get_job(client_id)
        if db_job:
            _jobs[client_id] = db_job
            job = db_job
        else:
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


async def start_onboarding(slug: str) -> dict:
    client = await require_client_by_slug(slug)
    client_id = client["id"]
    job = _jobs.get(client_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job de onboarding não encontrado")
    return {"job_id": job["id"], "status": "started", "eta_hours": job["eta_hours"]}


# ---------------------------------------------------------------------------
# Oracle BackgroundTask
# Constitution §1.1: Job runs async; never blocks HTTP.
# ADR-LOCAL-02: FastAPI BackgroundTasks for v1.
# ---------------------------------------------------------------------------


async def run_oracle_agent(client_id: str) -> None:
    """
    Oracle agent: LangGraph StateGraph (Gemini Flash) for entity extraction.
    Falls back to rich local content if LLM unavailable.
    """
    job = _jobs.get(client_id)
    client = _clients.get(client_id)
    if not job or not client:
        logger.error("Oracle agent: client_id %s not found in memory", client_id)
        return

    logger.info("Oracle agent started for client %s", client["slug"])
    job["drive_sync_status"] = "running"
    job["started_at"] = _now_iso()
    await db_update_job(client_id, {"drive_sync_status": "running", "started_at": _now()})

    await asyncio.sleep(ORACLE_STUB_DELAY_SECONDS)
    job["drive_sync_status"] = "done"
    job["oracle_status"] = "running"
    await db_update_job(client_id, {"drive_sync_status": "done", "oracle_status": "running"})

    brand_context = client.get("brand_context", "")
    wizard_briefing = client.get("wizard_briefing", "")
    # RN-033: allowed_domains from oracle_config (set in wizard step 2)
    oracle_config = client.get("oracle_config") or {}
    allowed_domains: list[str] = oracle_config.get("allowed_domains") or []

    for entity_type in ONTOLOGY_ENTITY_TYPES:
        job["current_entity"] = entity_type
        await db_update_job(client_id, {"current_entity": entity_type})
        await asyncio.sleep(ORACLE_STUB_DELAY_SECONDS)

        key = f"{client_id}:{entity_type}"
        entity = _wiki_entities.get(key)
        if entity:
            try:
                # invoke_oracle now returns (content, provenance) — CA-20
                content, provenance = await invoke_oracle(
                    client_id=client_id,
                    client_name=client["name"],
                    entity_type=entity_type,
                    brand_context=brand_context,
                    wizard_briefing=wizard_briefing,
                    allowed_domains=allowed_domains,
                )
            except Exception as exc:
                logger.warning("Oracle agent: invoke_oracle failed for %s/%s (%s)", client["slug"], entity_type, exc)
                from .oracle_agent import _fallback_content
                content = _fallback_content(entity_type, client["name"])
                provenance = [{"source_type": "briefing", "reference": "Fallback local", "cited_excerpt": f"Gerado localmente para {entity_type}"}]

            entity["status"] = "generated"
            entity["content"] = content
            entity["provenance"] = provenance
            entity["updated_at"] = _now_iso()

            await db_update_wiki_entity(
                client_id,
                entity_type,
                {"status": "generated", "content": content, "provenance": provenance},
            )

        job["entities"][entity_type] = "generated"
        job["entities_done"] += 1
        await db_update_job(
            client_id,
            {
                "entities": dict(job["entities"]),
                "entities_done": job["entities_done"],
            },
        )
        logger.info("Oracle agent: entity %s generated for %s", entity_type, client["slug"])

    job["current_entity"] = None
    job["oracle_status"] = "done"
    job["completed_at"] = _now_iso()
    await db_update_job(
        client_id,
        {"current_entity": None, "oracle_status": "done", "completed_at": _now()},
    )
    logger.info("Oracle agent completed for client %s", client["slug"])


# ---------------------------------------------------------------------------
# HITL validation (ADR-LOCAL-04: server-side gate)
# ---------------------------------------------------------------------------


async def validate_entity(
    slug: str, entity_type: str, action: str, edited_content: str | None, user_id: str
) -> dict:
    client = await require_client_by_slug(slug)
    client_id = client["id"]

    if entity_type not in ONTOLOGY_ENTITY_TYPES:
        raise HTTPException(status_code=400, detail=f"Tipo de entidade inválido: {entity_type}")

    key = f"{client_id}:{entity_type}"
    entity = _wiki_entities.get(key)

    if not entity:
        # Try loading from DB
        db_entity = await db_get_wiki_entity(client_id, entity_type)
        if db_entity:
            _wiki_entities[key] = db_entity
            entity = db_entity
        else:
            raise HTTPException(status_code=404, detail="Entidade não encontrada")

    if entity["status"] not in ("generated", "accepted"):
        raise HTTPException(
            status_code=409,
            detail=f"Entidade {entity_type} ainda não foi gerada pelo Oráculo",
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

    else:
        raise HTTPException(status_code=400, detail=f"Ação inválida: {action}")

    # Persist entity update
    await db_update_wiki_entity(
        client_id,
        entity_type,
        {"status": entity["status"], "badge": entity["badge"], "content": entity["content"]},
    )

    # Append-only audit log (constitution §2.4)
    event = {
        "id": str(uuid.uuid4()),
        "client_id": client_id,
        "entity_type": entity_type,
        "action": action,
        "before_content": before_content,
        "after_content": entity["content"],
        "user_id": user_id,
        "timestamp_utc": now,
    }
    _hitl_events.append(event)
    await db_append_hitl_event(event)

    # Check HITL gate: all 6 entities accepted? (ADR-LOCAL-04)
    client_status_result = None
    if action in ("accept", "edit_accept"):
        all_entities = [_wiki_entities.get(f"{client_id}:{et}") for et in ONTOLOGY_ENTITY_TYPES]
        all_accepted = all(e is not None and e["status"] == "accepted" for e in all_entities)
        if all_accepted and client["status"] == "PRE_ACTIVE":
            client["status"] = "ACTIVE"
            client["updated_at"] = now
            client_status_result = "ACTIVE"
            await db_update_client_status(client_id, "ACTIVE")
            logger.info("Client %s transitioned to ACTIVE after HITL gate", slug)

    return {
        "entity_type": entity_type,
        "status": entity["status"],
        "badge": entity["badge"],
        "client_status": client_status_result,
    }


async def direct_edit_wiki_entity(
    slug: str, entity_type: str, content: str, user_id: str
) -> dict:
    """
    JN-15: PX-07 (Sponsor) edits wiki entity directly, without re-running the Oracle.
    Updates badge to 'hitl', records audit event.
    """
    client = await require_client_by_slug(slug)
    client_id = client["id"]

    if client["status"] != "ACTIVE":
        raise HTTPException(status_code=409, detail="Wiki só disponível para clientes ACTIVE")

    if entity_type not in ONTOLOGY_ENTITY_TYPES:
        raise HTTPException(status_code=400, detail=f"Tipo de entidade inválido: {entity_type}")

    key = f"{client_id}:{entity_type}"
    entity = _wiki_entities.get(key)
    if not entity:
        db_entity = await db_get_wiki_entity(client_id, entity_type)
        if db_entity:
            _wiki_entities[key] = db_entity
            entity = db_entity
        else:
            raise HTTPException(status_code=404, detail="Entidade não encontrada")

    if entity["status"] != "accepted":
        raise HTTPException(status_code=409, detail="Entidade deve estar aceita antes de edição direta")

    before_content = entity["content"]
    now = _now_iso()

    entity["content"] = content
    entity["badge"] = "hitl"
    entity["updated_at"] = now

    await db_update_wiki_entity(
        client_id,
        entity_type,
        {"content": content, "badge": "hitl", "updated_by": user_id},
    )

    event = {
        "id": str(uuid.uuid4()),
        "client_id": client_id,
        "entity_type": entity_type,
        "action": "direct_edit",
        "before_content": before_content,
        "after_content": content,
        "user_id": user_id,
        "timestamp_utc": now,
    }
    _hitl_events.append(event)
    await db_append_hitl_event(event)

    return {
        "entity_type": entity_type,
        "content": content,
        "badge": entity["badge"],
        "status": entity["status"],
    }


async def get_wiki_audit(slug: str) -> list[dict]:
    """Returns HITL audit log for a client (Admin only)."""
    client = await require_client_by_slug(slug)
    client_id = client["id"]

    db_events = await db_list_hitl_events(client_id)
    if db_events is not None:
        return db_events

    # In-memory fallback
    return [e for e in _hitl_events if e.get("client_id") == client_id]


async def regenerate_entity_stub(client_id: str, entity_type: str) -> None:
    """Entity regeneration after HITL rejection."""
    await asyncio.sleep(ORACLE_STUB_DELAY_SECONDS * 2)
    client = _clients.get(client_id)
    key = f"{client_id}:{entity_type}"
    entity = _wiki_entities.get(key)
    if entity:
        client_name = client["name"] if client else client_id
        brand_context = client.get("brand_context", "") if client else ""
        wizard_briefing = client.get("wizard_briefing", "") if client else ""
        oracle_config = (client.get("oracle_config") or {}) if client else {}
        allowed_domains: list[str] = oracle_config.get("allowed_domains") or []
        try:
            content, provenance = await invoke_oracle(
                client_id=client_id,
                client_name=client_name,
                entity_type=entity_type,
                brand_context=brand_context,
                wizard_briefing=wizard_briefing,
                allowed_domains=allowed_domains,
            )
        except Exception as exc:
            logger.warning("Oracle agent: regeneration failed for %s/%s (%s)", client_id, entity_type, exc)
            from .oracle_agent import _fallback_content
            content = _fallback_content(entity_type, client_name)
            provenance = [{"source_type": "briefing", "reference": "Fallback local", "cited_excerpt": f"Regenerado localmente para {entity_type}"}]
        entity["status"] = "generated"
        entity["content"] = content
        entity["provenance"] = provenance
        entity["badge"] = "seed_auto"
        entity["updated_at"] = _now_iso()

        await db_update_wiki_entity(
            client_id,
            entity_type,
            {"status": "generated", "content": content, "provenance": provenance, "badge": "seed_auto"},
        )

    if client_id in _jobs:
        _jobs[client_id]["entities"][entity_type] = "generated"
        await db_update_job(client_id, {"entities": dict(_jobs[client_id]["entities"])})

    logger.info("Oracle agent: entity %s regenerated for client %s", entity_type, client_id)


def add_reunion_context_to_oraculo(
    client_id: str,
    meeting_id: str,
    selected_segments: list[dict],
) -> None:
    """
    FA-15: Feed curated meeting segments into client's oráculo context.
    Caixa-preta: silently skips if client not found — never raises.
    """
    client = _clients.get(client_id)
    if not client:
        return

    key = f"{client_id}:Briefing"
    entity = _wiki_entities.get(key)
    if not entity:
        return

    reunion_text = "\n\n".join(
        seg.get("text", "") for seg in selected_segments if seg.get("selected")
    )
    if not reunion_text:
        return

    existing = entity.get("content", "")
    entity["content"] = existing + f"\n\n[Reunião {meeting_id}]:\n{reunion_text}"
    entity["updated_at"] = _now_iso()

    _hitl_events.append(
        {
            "id": str(uuid.uuid4()),
            "client_id": client_id,
            "entity_type": "Briefing",
            "action": "reunion_context_added",
            "after_content": entity["content"],
            "user_id": "system",
            "timestamp_utc": _now_iso(),
        }
    )
    logger.info("FA-15: reunion %s context added to Briefing for client %s", meeting_id, client_id)


# ---------------------------------------------------------------------------
# Wiki
# ---------------------------------------------------------------------------


async def get_wiki(slug: str, include_generated: bool = False) -> dict:
    """
    Returns wiki entities for a client.

    include_generated=False (default): only ``accepted`` — Wiki Ontológica (T-39).
    include_generated=True: ``generated`` + ``accepted`` — HITL validate page (T-36).

    Caixa-preta: caller (router) enforces 404 for unauthorized access.
    ADR-LOCAL-05: Wiki is a view of wiki_entities, not Biblioteca.
    """
    client = await require_client_by_slug(slug)
    client_id = client["id"]

    db_entities = await db_list_wiki_entities(client_id, include_generated)
    if db_entities is not None:
        # Sync into memory cache
        for e in db_entities:
            _wiki_entities[f"{client_id}:{e['entity_type']}"] = e
        return {
            "client_id": client_id,
            "client_slug": client["slug"],
            "client_name": client["name"],
            "entities": db_entities,
        }

    # In-memory fallback
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
