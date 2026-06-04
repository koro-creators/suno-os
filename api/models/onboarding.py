"""SQLAlchemy models para Onboarding/Wiki (SPEC-015 / A-8).

Espelha 005_onboarding_wiki.sql (+ 014_onboarding_fixes). Tipos portáveis
(Uuid/JSON genéricos) para Postgres + SQLite. `client_id` é UUID (FK lógica para
clients.id); declarado sem ForeignKey no ORM (denormalizado, padrão caixa-preta).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, Integer, String, Text, UniqueConstraint, Uuid

from .base import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class WikiEntity(Base):
    __tablename__ = "wiki_entities"
    __table_args__ = (UniqueConstraint("client_id", "entity_type", name="wiki_entities_client_type_uc"),)

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    client_id = Column(Uuid, nullable=False, index=True)
    entity_type = Column(String(30), nullable=False)
    content = Column(Text, nullable=False, default="")
    provenance = Column(JSON, nullable=False, default=list)
    # pending | generated | accepted | regenerating
    status = Column(String(20), nullable=False, default="pending")
    # seed_auto | hitl | capture
    badge = Column(String(30), nullable=False, default="seed_auto")
    updated_by = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "client_id": str(self.client_id),
            "entity_type": self.entity_type,
            "content": self.content or "",
            "provenance": self.provenance or [],
            "status": self.status,
            "badge": self.badge,
            "updated_by": self.updated_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class OnboardingJob(Base):
    __tablename__ = "onboarding_jobs"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    client_id = Column(Uuid, nullable=False, unique=True, index=True)
    # pending | running | done | error
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
    client_id = Column(Uuid, nullable=False, index=True)
    entity_type = Column(String(30), nullable=False)
    # accept | edit_accept | reject_regenerate | direct_edit | reunion_context_added
    action = Column(String(40), nullable=False)
    before_content = Column(Text, nullable=True)
    after_content = Column(Text, nullable=True)
    user_id = Column(Text, nullable=False)
    timestamp_utc = Column(DateTime(timezone=True), default=_now)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "client_id": str(self.client_id),
            "entity_type": self.entity_type,
            "action": self.action,
            "before_content": self.before_content,
            "after_content": self.after_content,
            "user_id": self.user_id,
            "timestamp_utc": self.timestamp_utc.isoformat() if self.timestamp_utc else None,
        }
