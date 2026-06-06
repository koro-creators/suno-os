"""SQLAlchemy model para o catálogo de Skills (feature SPEC-017).

Espelha 018_skills.sql. Campos aninhados (moons/assigned_clients/versions) em
JSON. `to_dict` devolve **camelCase** para casar com o tipo SkillAdmin do
frontend (systemPrompt, maxTokens, assignedClients, averageScore, …).
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, Float, Integer, String, Text

from .base import Base


class Skill(Base):
    __tablename__ = "skills"

    id = Column(String, primary_key=True)
    name = Column(String(200), nullable=False)
    slug = Column(String(120), nullable=False, unique=True)
    type = Column(String(20), nullable=False)
    description = Column(Text, nullable=False, default="")
    icon = Column(String(60), nullable=True)
    status = Column(String(20), nullable=False, default="draft")
    system_prompt = Column(Text, nullable=False, default="")
    model = Column(String(50), nullable=True)
    temperature = Column(Float, nullable=False, default=0.7)
    max_tokens = Column(Integer, nullable=False, default=4096)
    moons = Column(JSON, nullable=False, default=list)
    assigned_clients = Column(JSON, nullable=False, default=list)
    versions = Column(JSON, nullable=False, default=list)
    created_by = Column(String(200), nullable=True)
    average_score = Column(Float, nullable=False, default=0)
    total_feedbacks = Column(Integer, nullable=False, default=0)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "type": self.type,
            "description": self.description,
            "icon": self.icon,
            "status": self.status,
            "systemPrompt": self.system_prompt or "",
            "model": self.model,
            "temperature": self.temperature,
            "maxTokens": self.max_tokens,
            "moons": self.moons or [],
            "assignedClients": self.assigned_clients or [],
            "versions": self.versions or [],
            "createdBy": self.created_by,
            "averageScore": self.average_score or 0,
            "totalFeedbacks": self.total_feedbacks or 0,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
