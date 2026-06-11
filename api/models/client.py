"""SQLAlchemy model para clientes (multi-tenant).

Espelha a tabela `clients` (000_base + 005_onboarding + 012_clients_extend).
É o alvo das FKs `client_id` das demais tabelas. `data/clients.ts` continua
sendo o source do sistema solar no frontend; aqui ficam os clientes de negócio.

Tipos genéricos (String id, JSON) para rodar em Postgres e SQLite (testes).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, String, Text

from .base import Base

VALID_STATUS = ("PRE_ACTIVE", "ACTIVE", "INACTIVE")


class Client(Base):
    __tablename__ = "clients"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    slug = Column(String(120), unique=True)
    status = Column(String(20), nullable=False, default="PRE_ACTIVE")
    color = Column(String(20), nullable=True)
    description = Column(Text, nullable=True)
    sponsor_name = Column(String(200), nullable=True)
    sponsor_email = Column(String(254), nullable=True)
    oracle_config = Column(JSON, nullable=True)
    selected_doc_ids = Column(JSON, nullable=True)
    drive_folder_id = Column(Text, nullable=True)
    drive_folder_name = Column(Text, nullable=True)
    drive_last_sync = Column(DateTime(timezone=True), nullable=True)
    pre_active_since = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "name": self.name,
            "slug": self.slug,
            "status": self.status,
            "color": self.color,
            "description": self.description,
            "sponsor_name": self.sponsor_name,
            "sponsor_email": self.sponsor_email,
            "oracle_config": self.oracle_config or {},
            "selected_doc_ids": self.selected_doc_ids or [],
            "drive_folder_id": self.drive_folder_id,
            "drive_folder_name": self.drive_folder_name,
            "drive_last_sync": self.drive_last_sync.isoformat() if self.drive_last_sync else None,
            "pre_active_since": self.pre_active_since.isoformat()
            if self.pre_active_since
            else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return f"<Client id={self.id!r} slug={self.slug!r} status={self.status!r}>"
