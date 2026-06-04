"""SQLAlchemy model for the user access registry (SPEC-022 Fase B).

`uid` stores the Firebase UID — Firebase owns the auth registry, but this
row is the source of truth for the sunOS RBAC role + active status.

Tipos propositalmente genéricos (String/Boolean/DateTime) para que o mesmo
model rode contra Postgres (produção) e SQLite (testes) sem adaptação.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, String

from .base import Base

VALID_ROLES = ("admin", "creator", "viewer")


class User(Base):
    """A sunOS user with an RBAC role."""

    __tablename__ = "users"

    uid = Column(String, primary_key=True)
    email = Column(String(254), nullable=False, index=True, unique=True)
    name = Column(String(200), nullable=True)
    role = Column(String(20), nullable=False, default="viewer")
    is_active = Column(Boolean, nullable=False, default=True)
    last_access = Column(DateTime(timezone=True), nullable=True)
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
        """Serialize to the API shape used by the admin panel."""
        return {
            "uid": self.uid,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "is_active": self.is_active,
            "last_access": self.last_access.isoformat() if self.last_access else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<User uid={self.uid!r} email={self.email!r} role={self.role!r}>"
