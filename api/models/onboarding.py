"""SQLAlchemy models para Onboarding/Wiki (SPEC-015 / A-8).

Espelha 005_onboarding_wiki.sql (+ 014_onboarding_fixes). Tipos portáveis
(Uuid/JSON genéricos) para Postgres + SQLite. `client_id` é UUID (FK lógica para
clients.id); declarado sem ForeignKey no ORM (denormalizado, padrão caixa-preta).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, Integer, String, Text, Uuid

from .base import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class WikiEntity(Base):
    __tablename__ = "wiki_entities"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    client_id = Column(Uuid, nullable=False, index=True)
    entity_type = Column(String(30), nullable=False)
    content = Column(Text, nullable=False, default="")
    provenance = Column(JSON, nullable=False, default=list)
    status = Column(String(20), nullable=False, default="pending")
    badge = Column(String(30), nullable=False, default="seed_auto")
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)
    updated_by = Column(Text, nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "client_id": str(self.client_id),
            "entity_type": self.entity_type,
            "content": self.content or "",
            "provenance": self.provenance or [],
            "status": self.status,
            "badge": self.badge,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class OnboardingJob(Base):
    __tablename__ = "onboarding_jobs"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    client_id = Column(Uuid, nullable=False, unique=True, index=True)
    drive_sync_status = Column(String(20), default="pending")
    oracle_status = Column(String(20), default="pending")
    current_entity = Column(String(30), nullable=True)
    entities_done = Column(Integer, default=0)
    error_detail = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    eta_hours = Column(Integer, default=24)


class EntityHitlEvent(Base):
    """Append-only audit (constitution §2.4). user_id = Firebase UID (TEXT)."""

    __tablename__ = "entity_hitl_events"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    client_id = Column(Uuid, nullable=False)
    entity_type = Column(String(30), nullable=False)
    action = Column(String(30), nullable=False)
    before_content = Column(Text, nullable=True)
    after_content = Column(Text, nullable=True)
    user_id = Column(Text, nullable=False)
    timestamp_utc = Column(DateTime(timezone=True), default=_now)
