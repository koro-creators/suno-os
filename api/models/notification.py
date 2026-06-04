"""SQLAlchemy model para notificações (B-4). Espelha 013_notifications.sql.

Tipos portáveis (Uuid genérico) para Postgres + SQLite. `created_at` é
serializado como ISO string (o schema de resposta usa str).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, String, Text, Uuid

from .base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(String(255), nullable=False, index=True)
    type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    submission_id = Column(String(255), nullable=True)
    read = Column(Boolean, nullable=False, default=False)
    created_at = Column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "user_id": self.user_id,
            "type": self.type,
            "title": self.title,
            "body": self.body,
            "submission_id": self.submission_id,
            "read": self.read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
