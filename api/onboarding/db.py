"""
SPEC-015 — Async DB helpers for onboarding persistence.

All functions try PostgreSQL first; fall back to None so callers
can degrade to the in-memory store (same pattern as knowledge/router.py).
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Session factory (lazy — mirrors chat/knowledge/router.py pattern)
# ---------------------------------------------------------------------------


async def _get_session():
    """Return an async SQLAlchemy session, or None if DB is unavailable."""
    try:
        from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
        from sqlalchemy.orm import sessionmaker

        from config import settings

        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        return factory()
    except Exception as exc:
        logger.warning("Onboarding DB session unavailable: %s", exc)
        return None


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Client CRUD
# ---------------------------------------------------------------------------


async def db_create_client(data: dict) -> dict | None:
    """Insert a new client row. Returns client dict or None on failure."""
    session = await _get_session()
    if session is None:
        return None

    try:
        from models.onboarding import Client

        async with session:
            client = Client(
                id=uuid.UUID(data["id"]),
                slug=data["slug"],
                name=data["name"],
                color=data.get("color", "#FFC801"),
                description=data.get("description", ""),
                sponsor_name=data.get("sponsor_name", ""),
                sponsor_email=data.get("sponsor_email", ""),
                oracle_config=data.get("oracle_config", {}),
                selected_doc_ids=data.get("selected_doc_ids", []),
                status=data.get("status", "PRE_ACTIVE"),
                pre_active_since=_now() if data.get("status") == "PRE_ACTIVE" else None,
            )
            session.add(client)
            await session.commit()
            await session.refresh(client)
            return client.as_dict()
    except Exception as exc:
        logger.warning("db_create_client failed: %s", exc)
        return None


async def db_get_client_by_slug(slug: str) -> dict | None:
    session = await _get_session()
    if session is None:
        return None

    try:
        from sqlalchemy import select

        from models.onboarding import Client

        async with session:
            result = await session.execute(select(Client).where(Client.slug == slug))
            client = result.scalar_one_or_none()
            return client.as_dict() if client else None
    except Exception as exc:
        logger.warning("db_get_client_by_slug failed: %s", exc)
        return None


async def db_list_clients(status: str | None = None) -> list[dict] | None:
    session = await _get_session()
    if session is None:
        return None

    try:
        from sqlalchemy import select

        from models.onboarding import Client

        async with session:
            q = select(Client)
            if status:
                q = q.where(Client.status == status)
            q = q.order_by(Client.created_at.desc())
            result = await session.execute(q)
            return [c.as_dict() for c in result.scalars().all()]
    except Exception as exc:
        logger.warning("db_list_clients failed: %s", exc)
        return None


async def db_update_client_status(client_id: str, status: str) -> bool:
    session = await _get_session()
    if session is None:
        return False

    try:
        from sqlalchemy import update

        from models.onboarding import Client

        async with session:
            await session.execute(
                update(Client)
                .where(Client.id == uuid.UUID(client_id))
                .values(status=status, updated_at=_now())
            )
            await session.commit()
            return True
    except Exception as exc:
        logger.warning("db_update_client_status failed: %s", exc)
        return False


# ---------------------------------------------------------------------------
# OnboardingJob CRUD
# ---------------------------------------------------------------------------


async def db_create_job(data: dict) -> dict | None:
    session = await _get_session()
    if session is None:
        return None

    try:
        from models.onboarding import OnboardingJob

        async with session:
            job = OnboardingJob(
                id=uuid.UUID(data["id"]),
                client_id=uuid.UUID(data["client_id"]),
                entities=data.get("entities", {}),
                total_entities=data.get("total_entities", 6),
                eta_hours=data.get("eta_hours", 24),
            )
            session.add(job)
            await session.commit()
            await session.refresh(job)
            return job.as_dict()
    except Exception as exc:
        logger.warning("db_create_job failed: %s", exc)
        return None


async def db_get_job(client_id: str) -> dict | None:
    session = await _get_session()
    if session is None:
        return None

    try:
        from sqlalchemy import select

        from models.onboarding import OnboardingJob

        async with session:
            result = await session.execute(
                select(OnboardingJob).where(OnboardingJob.client_id == uuid.UUID(client_id))
            )
            job = result.scalar_one_or_none()
            return job.as_dict() if job else None
    except Exception as exc:
        logger.warning("db_get_job failed: %s", exc)
        return None


async def db_update_job(client_id: str, fields: dict[str, Any]) -> bool:
    session = await _get_session()
    if session is None:
        return False

    try:
        from sqlalchemy import update

        from models.onboarding import OnboardingJob

        async with session:
            await session.execute(
                update(OnboardingJob)
                .where(OnboardingJob.client_id == uuid.UUID(client_id))
                .values(**fields)
            )
            await session.commit()
            return True
    except Exception as exc:
        logger.warning("db_update_job failed: %s", exc)
        return False


# ---------------------------------------------------------------------------
# WikiEntity CRUD
# ---------------------------------------------------------------------------


async def db_create_wiki_entities(client_id: str, entity_types: list[str]) -> bool:
    session = await _get_session()
    if session is None:
        return False

    try:
        from models.onboarding import WikiEntity

        async with session:
            for et in entity_types:
                entity = WikiEntity(
                    client_id=uuid.UUID(client_id),
                    entity_type=et,
                )
                session.add(entity)
            await session.commit()
            return True
    except Exception as exc:
        logger.warning("db_create_wiki_entities failed: %s", exc)
        return False


async def db_get_wiki_entity(client_id: str, entity_type: str) -> dict | None:
    session = await _get_session()
    if session is None:
        return None

    try:
        from sqlalchemy import select

        from models.onboarding import WikiEntity

        async with session:
            result = await session.execute(
                select(WikiEntity).where(
                    WikiEntity.client_id == uuid.UUID(client_id),
                    WikiEntity.entity_type == entity_type,
                )
            )
            e = result.scalar_one_or_none()
            return e.as_dict() if e else None
    except Exception as exc:
        logger.warning("db_get_wiki_entity failed: %s", exc)
        return None


async def db_update_wiki_entity(client_id: str, entity_type: str, fields: dict[str, Any]) -> bool:
    session = await _get_session()
    if session is None:
        return False

    try:
        from sqlalchemy import update

        from models.onboarding import WikiEntity

        async with session:
            await session.execute(
                update(WikiEntity)
                .where(
                    WikiEntity.client_id == uuid.UUID(client_id),
                    WikiEntity.entity_type == entity_type,
                )
                .values(**fields, updated_at=_now())
            )
            await session.commit()
            return True
    except Exception as exc:
        logger.warning("db_update_wiki_entity failed: %s", exc)
        return False


async def db_list_wiki_entities(
    client_id: str, include_generated: bool = False
) -> list[dict] | None:
    session = await _get_session()
    if session is None:
        return None

    try:
        from sqlalchemy import select

        from models.onboarding import WikiEntity

        async with session:
            statuses = ["accepted", "generated"] if include_generated else ["accepted"]
            result = await session.execute(
                select(WikiEntity).where(
                    WikiEntity.client_id == uuid.UUID(client_id),
                    WikiEntity.status.in_(statuses),
                )
            )
            return [e.as_dict() for e in result.scalars().all()]
    except Exception as exc:
        logger.warning("db_list_wiki_entities failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# EntityHitlEvent (append-only audit log)
# ---------------------------------------------------------------------------


async def db_append_hitl_event(event: dict) -> bool:
    session = await _get_session()
    if session is None:
        return False

    try:
        from models.onboarding import EntityHitlEvent

        async with session:
            row = EntityHitlEvent(
                id=uuid.UUID(event["id"]),
                client_id=uuid.UUID(event["client_id"]),
                entity_type=event["entity_type"],
                action=event["action"],
                before_content=event.get("before_content"),
                after_content=event.get("after_content"),
                user_id=event.get("user_id", "system"),
            )
            session.add(row)
            await session.commit()
            return True
    except Exception as exc:
        logger.warning("db_append_hitl_event failed: %s", exc)
        return False


async def db_list_hitl_events(client_id: str) -> list[dict] | None:
    session = await _get_session()
    if session is None:
        return None

    try:
        from sqlalchemy import select

        from models.onboarding import EntityHitlEvent

        async with session:
            result = await session.execute(
                select(EntityHitlEvent)
                .where(EntityHitlEvent.client_id == uuid.UUID(client_id))
                .order_by(EntityHitlEvent.timestamp_utc)
            )
            return [e.as_dict() for e in result.scalars().all()]
    except Exception as exc:
        logger.warning("db_list_hitl_events failed: %s", exc)
        return None
