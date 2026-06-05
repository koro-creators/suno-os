"""SQLAlchemy model para defaults de modelo por skill (Bucket B).

Espelha 017_skill_defaults.sql. Migra o store in-memory `_skill_defaults` do
admin. PK é o slug da skill (não Firebase/UUID).
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Integer, String

from .base import Base


class SkillDefault(Base):
    __tablename__ = "skill_defaults"

    skill_slug = Column(String(100), primary_key=True)
    skill_name = Column(String(200), nullable=False)
    model = Column(String(50), nullable=False)
    temperature = Column(Float, nullable=False, default=0.7)
    max_tokens = Column(Integer, nullable=False, default=2048)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def to_dict(self) -> dict:
        return {
            "skill_slug": self.skill_slug,
            "skill_name": self.skill_name,
            "model": self.model,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
