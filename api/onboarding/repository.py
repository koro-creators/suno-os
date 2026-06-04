"""Repository de Onboarding/Wiki (SPEC-015 / A-8).

Primitivas SQLAlchemy para onboarding_jobs / wiki_entities / entity_hitl_events.
Operações de cliente reusam `clientes.repository`. A orquestração (gate HITL,
transição PRE_ACTIVE→ACTIVE) fica no service.
"""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

try:
    from clientes import repository as clients_repo
    from models.onboarding import EntityHitlEvent, OnboardingJob, WikiEntity
except ImportError:  # test import root (repo root on sys.path)
    from api.clientes import repository as clients_repo
    from api.models.onboarding import EntityHitlEvent, OnboardingJob, WikiEntity

from .constants import ONTOLOGY_ENTITY_TYPES


def _coerce(value) -> uuid.UUID | None:
    try:
        return uuid.UUID(str(value))
    except (ValueError, TypeError):
        return None


# ---------------------------------------------------------------------------
# Clients (delegado ao repo de clientes)
# ---------------------------------------------------------------------------


def get_client_by_slug(session: Session, slug: str) -> dict | None:
    client = clients_repo.get_by_slug(session, slug)
    return client.to_dict() if client else None


def set_client_status(session: Session, client_id: str, status: str) -> None:
    clients_repo.update_status(session, client_id, status)


# ---------------------------------------------------------------------------
# Onboarding job
# ---------------------------------------------------------------------------


def create_job(session: Session, client_id: str) -> str:
    job = OnboardingJob(
        id=uuid.uuid4(),
        client_id=_coerce(client_id),
        drive_sync_status="pending",
        oracle_status="pending",
        entities_done=0,
        eta_hours=24,
    )
    session.add(job)
    session.commit()
    return str(job.id)


def get_job(session: Session, client_id: str) -> OnboardingJob | None:
    cid = _coerce(client_id)
    if cid is None:
        return None
    return session.query(OnboardingJob).filter(OnboardingJob.client_id == cid).first()


def update_job(session: Session, client_id: str, **fields) -> None:
    job = get_job(session, client_id)
    if job is None:
        return
    for key, value in fields.items():
        setattr(job, key, value)
    session.commit()


def increment_entities_done(session: Session, client_id: str) -> None:
    job = get_job(session, client_id)
    if job is None:
        return
    job.entities_done = (job.entities_done or 0) + 1
    session.commit()


# ---------------------------------------------------------------------------
# Wiki entities
# ---------------------------------------------------------------------------


def create_entity_placeholder(session: Session, client_id: str, entity_type: str) -> None:
    session.add(
        WikiEntity(
            id=uuid.uuid4(),
            client_id=_coerce(client_id),
            entity_type=entity_type,
            content="",
            provenance=[],
            status="pending",
            badge="seed_auto",
        )
    )
    session.commit()


def get_entity(session: Session, client_id: str, entity_type: str) -> WikiEntity | None:
    cid = _coerce(client_id)
    if cid is None:
        return None
    return (
        session.query(WikiEntity)
        .filter(WikiEntity.client_id == cid, WikiEntity.entity_type == entity_type)
        .first()
    )


def update_entity(session: Session, entity: WikiEntity, **fields) -> None:
    for key, value in fields.items():
        setattr(entity, key, value)
    session.commit()


def list_entities(
    session: Session, client_id: str, statuses: set[str] | None = None
) -> list[WikiEntity]:
    cid = _coerce(client_id)
    if cid is None:
        return []
    query = session.query(WikiEntity).filter(WikiEntity.client_id == cid)
    if statuses:
        query = query.filter(WikiEntity.status.in_(statuses))
    return query.all()


def entities_status_map(session: Session, client_id: str) -> dict[str, str]:
    """{entity_type: status} para os 6 tipos (default 'pending')."""
    rows = {e.entity_type: e.status for e in list_entities(session, client_id)}
    return {et: rows.get(et, "pending") for et in ONTOLOGY_ENTITY_TYPES}


# ---------------------------------------------------------------------------
# HITL audit (append-only)
# ---------------------------------------------------------------------------


def add_hitl_event(
    session: Session,
    *,
    client_id: str,
    entity_type: str,
    action: str,
    before_content: str | None,
    after_content: str | None,
    user_id: str,
) -> None:
    session.add(
        EntityHitlEvent(
            id=uuid.uuid4(),
            client_id=_coerce(client_id),
            entity_type=entity_type,
            action=action,
            before_content=before_content,
            after_content=after_content,
            user_id=user_id,
        )
    )
    session.commit()


def list_hitl_events(session: Session, client_id: str) -> list[dict]:
    coerced = _coerce(client_id)
    rows = (
        session.query(EntityHitlEvent)
        .filter(EntityHitlEvent.client_id == coerced)
        .order_by(EntityHitlEvent.timestamp_utc.asc())
        .all()
    )
    return [r.to_dict() for r in rows]
