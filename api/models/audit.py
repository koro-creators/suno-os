"""SQLAlchemy model for admin audit events.

Maps the ``audit_events`` table criada em 009_admin_panel.sql. Append-only:
sem UPDATE/DELETE via app (a Fase A mantinha isto em memória).

Tipos genéricos (String id, JSON detail) para rodar em Postgres e SQLite.
No Postgres a coluna física é UUID/JSONB; o driver aceita o cast a partir
dos valores string/json enviados pelo ORM.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, String, Text

from .base import Base


class AuditEvent(Base):
    """A single admin action recorded for audit."""

    __tablename__ = "audit_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_uid = Column(Text, nullable=False)
    actor_email = Column(String(200), nullable=True)
    action = Column(String(80), nullable=False)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(Text, nullable=True)
    detail = Column(JSON, nullable=True, default=dict)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "actor_uid": self.actor_uid,
            "actor_email": self.actor_email,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "detail": self.detail or {},
        }

    def __repr__(self) -> str:
        return f"<AuditEvent action={self.action!r} actor={self.actor_uid!r}>"
