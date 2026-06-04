"""SQLAlchemy models for SPEC-015 — Onboarding com Oráculo do Cliente.

Tables: clients, wiki_entities, entity_hitl_events, onboarding_jobs
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from models.base import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Client(Base):
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(200), nullable=False)
    color = Column(String(20), nullable=False, default="#FFC801")
    description = Column(Text, nullable=False, default="")
    sponsor_name = Column(String(200), nullable=False, default="")
    sponsor_email = Column(String(200), nullable=False, default="")
    oracle_config = Column(JSONB, nullable=False, default=dict)
    selected_doc_ids = Column(JSONB, nullable=False, default=list)
    # DRAFT | PRE_ACTIVE | ACTIVE | ARCHIVED | CANCELLED
    status = Column(String(20), nullable=False, default="PRE_ACTIVE", index=True)
    pre_active_since = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)

    wiki_entities: list[WikiEntity] = relationship(
        "WikiEntity",
        back_populates="client",
        cascade="all, delete-orphan",
        order_by="WikiEntity.entity_type",
    )
    onboarding_job: OnboardingJob | None = relationship(
        "OnboardingJob",
        back_populates="client",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def as_dict(self) -> dict:
        return {
            "id": str(self.id),
            "slug": self.slug,
            "name": self.name,
            "color": self.color,
            "description": self.description,
            "sponsor_name": self.sponsor_name,
            "sponsor_email": self.sponsor_email,
            "oracle_config": self.oracle_config or {},
            "selected_doc_ids": self.selected_doc_ids or [],
            "status": self.status,
            "pre_active_since": self.pre_active_since.isoformat() if self.pre_active_since else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class WikiEntity(Base):
    __tablename__ = "wiki_entities"
    __table_args__ = (UniqueConstraint("client_id", "entity_type", name="wiki_entities_client_type_uc"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Posicionamento | Persona | Competidor | Produto | TomDeVoz | Briefing
    entity_type = Column(String(30), nullable=False)
    content = Column(Text, nullable=False, default="")
    provenance = Column(JSONB, nullable=False, default=list)
    # pending | generated | accepted | regenerating
    status = Column(String(20), nullable=False, default="pending")
    # seed_auto | hitl | capture
    badge = Column(String(30), nullable=False, default="seed_auto")
    updated_by = Column(String(255), nullable=True)  # Firebase UID
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)

    client: Client = relationship("Client", back_populates="wiki_entities")

    def as_dict(self) -> dict:
        return {
            "id": str(self.id),
            "client_id": str(self.client_id),
            "entity_type": self.entity_type,
            "content": self.content,
            "provenance": self.provenance or [],
            "status": self.status,
            "badge": self.badge,
            "updated_by": self.updated_by,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class EntityHitlEvent(Base):
    """Append-only audit log — no DELETE, no UPDATE (constitution §2.4)."""

    __tablename__ = "entity_hitl_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    entity_type = Column(String(30), nullable=False)
    # accept | edit_accept | reject_regenerate | direct_edit | reunion_context_added
    action = Column(String(40), nullable=False)
    before_content = Column(Text, nullable=True)
    after_content = Column(Text, nullable=True)
    user_id = Column(String(255), nullable=False)  # Firebase UID or "system"
    timestamp_utc = Column(DateTime(timezone=True), nullable=False, default=_now)

    def as_dict(self) -> dict:
        return {
            "id": str(self.id),
            "client_id": str(self.client_id),
            "entity_type": self.entity_type,
            "action": self.action,
            "before_content": self.before_content,
            "after_content": self.after_content,
            "user_id": self.user_id,
            "timestamp_utc": self.timestamp_utc.isoformat(),
        }


class OnboardingJob(Base):
    __tablename__ = "onboarding_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    # pending | running | done | error
    drive_sync_status = Column(String(20), nullable=False, default="pending")
    oracle_status = Column(String(20), nullable=False, default="pending")
    current_entity = Column(String(30), nullable=True)
    entities_done = Column(Integer, nullable=False, default=0)
    total_entities = Column(Integer, nullable=False, default=6)
    # {"Posicionamento": "pending", "Persona": "generated", ...}
    entities = Column(JSONB, nullable=False, default=dict)
    error_detail = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    eta_hours = Column(Integer, nullable=False, default=24)

    client: Client = relationship("Client", back_populates="onboarding_job")

    def as_dict(self) -> dict:
        return {
            "id": str(self.id),
            "client_id": str(self.client_id),
            "drive_sync_status": self.drive_sync_status,
            "oracle_status": self.oracle_status,
            "current_entity": self.current_entity,
            "entities_done": self.entities_done,
            "total_entities": self.total_entities,
            "entities": self.entities or {},
            "error_detail": self.error_detail,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "eta_hours": self.eta_hours,
        }
