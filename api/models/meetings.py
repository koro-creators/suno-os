"""SQLAlchemy 2.x models for Meetings (Reunioes) — SPEC-016 Phase 21.

Tables:
  meetings         — one per opt-in meeting capture
  meeting_segments — transcript segments extracted for curation

Design notes:
- client_id is denormalized in both tables for cheap cross-client guard
  (RN-010: filter by client_id in WHERE, never post-fetch check).
- transcript stored as TEXT (Gemini Meet stub — no GCS in Phase 21).
- audio_gcs_path kept as nullable for future Phase D integration.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import relationship

from models.base import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Meeting(Base):
    """A meeting capture (always opt-in per SPEC-016 constitution §1.1)."""

    __tablename__ = "meetings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Denormalized for cross-client guard (RN-010)
    client_id = Column(String(255), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    meet_link = Column(Text, nullable=True)

    # Plain transcript text — Gemini Meet stub (ADR-LOCAL-02 of SPEC-016)
    transcript = Column(Text, nullable=False, default="")

    # Future: audio stored only in GCS (SPEC-016 constitution §1.6)
    audio_gcs_path = Column(Text, nullable=True)

    # Status machine: pending_review → curated | archived
    status = Column(String(20), nullable=False, default="pending_review", index=True)

    duration_minutes = Column(Integer, nullable=True)

    # JSON array of participant names/emails
    participants = Column(JSONB, nullable=True)

    created_by = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)

    # Relationships
    segments: list[MeetingSegment] = relationship(
        "MeetingSegment",
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="MeetingSegment.created_at",
    )


class MeetingSegment(Base):
    """A transcript segment available for curation (selection → Wiki).

    Selected segments are submitted for HITL review before entering the
    knowledge base — auto-merge is forbidden (SPEC-016 constitution §1.4).
    """

    __tablename__ = "meeting_segments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    meeting_id = Column(
        UUID(as_uuid=True),
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Denormalized for cross-client guard (RN-010)
    client_id = Column(String(255), nullable=False, index=True)

    text = Column(Text, nullable=False)

    # HH:MM:SS offset in the source recording (optional)
    start_time = Column(String(10), nullable=True)

    # Curation outputs
    selected = Column(Boolean, nullable=False, default=False)
    context_note = Column(Text, nullable=True, default="")
    curated_by = Column(String(255), nullable=True)
    curated_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)

    # Relationship
    meeting: Meeting = relationship("Meeting", back_populates="segments")
