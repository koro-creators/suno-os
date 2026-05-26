"""SQLAlchemy model for Drive OAuth tokens.

Stores per-user OAuth credentials for Google Drive integration (SPEC-006 FA-14).

Security notes:
- access_token and refresh_token are stored as plaintext strings here.
  In production (Fase D+), they MUST be encrypted via Cloud KMS before
  persistence. The column names are intentionally kept as-is so the
  KMS encrypt/decrypt wrapping can be added transparently.
  TODO: wrap with KMS encryption before Fase D (PRE-01 gate).
- user_id stores a Firebase UID (string) — no FK to a users table
  since Firebase manages the user registry outside PostgreSQL.
- Cross-client guard: email column is denormalized to allow cheap
  filtering without JOINs (constitution §2.2).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID

from models.base import Base


class DriveToken(Base):
    """OAuth tokens for a user's Google Drive connection."""

    __tablename__ = "drive_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Firebase UID — TEXT, no FK (Firebase manages user registry)
    user_id = Column(Text, nullable=False, index=True, unique=True)

    # OAuth credentials
    # TODO(SPEC-006 Fase D): wrap both columns with Cloud KMS encrypt/decrypt
    #   before any production deploy. Plaintext tokens violate NFR-008 + INT-14.
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)

    # When the current access_token expires (UTC)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Google account email confirmed during OAuth callback
    email = Column(String(254), nullable=True)

    # Whether the token has been revoked (FR-178 exclusion flow)
    revoked_at = Column(DateTime(timezone=True), nullable=True)

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

    def __repr__(self) -> str:
        return (
            f"<DriveToken id={self.id!r} user_id={self.user_id!r} "
            f"email={self.email!r} revoked={self.revoked_at is not None}>"
        )
