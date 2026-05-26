"""
SQLAlchemy models para Aprovação Hierárquica (SPEC-004 / FA-13).
ENT-36 + ENT-37 simplificados para Phase 20.

Nota: Phase 20 usa in-memory store no router.
Estes models são para quando DB persistence chegar (Phase D+).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID

from models.base import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class ApprovalSubmission(Base):
    """
    ENT-36 simplificado — submissão de conteúdo para aprovação.

    Invariante: content (subject_snapshot) é imutável após INSERT.
    Trigger PG 'approval_requests_snapshot_lock' bloqueia UPDATE (migration 007).
    """

    __tablename__ = "approval_submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(String(255), nullable=False, index=True)
    client_name = Column(String(255), nullable=False)
    skill_slug = Column(String(100), nullable=False)
    skill_name = Column(String(255), nullable=False)
    subject_type = Column(
        Enum("spark", "turn", "workflow_output", name="subject_type_enum"),
        nullable=False,
    )
    subject_id = Column(String(255), nullable=False)
    # subject_snapshot.content — imutável após INSERT (trigger PG)
    content = Column(Text, nullable=False)
    status = Column(
        Enum(
            "PENDING_VALIDATION",
            "PENDING_APPROVAL",
            "CHANGES_REQUESTED",
            "APPROVED",
            "REJECTED",
            "EXPIRED",
            name="approval_status_enum",
        ),
        nullable=False,
        default="PENDING_VALIDATION",
    )
    urgency = Column(
        Enum("low", "normal", "high", name="urgency_enum"),
        nullable=False,
        default="normal",
    )
    submitted_by = Column(String(255), nullable=False)
    submitted_by_name = Column(String(255), nullable=False)
    assigned_approver = Column(String(255), nullable=True)
    comment = Column(Text, nullable=True)
    round = Column(Integer, nullable=False, default=1)
    # Flag para ADR-LOCAL-04: chain quebrado exige atenção admin
    requires_admin_attention = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)


class ApprovalEvent(Base):
    """
    ENT-37 simplificado — eventos de decisão (append-only).

    Invariante: imutável após INSERT.
    Trigger PG 'approval_events_no_modify' bloqueia UPDATE/DELETE (migration 007).
    """

    __tablename__ = "approval_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(String(255), nullable=False, index=True)
    action = Column(
        Enum(
            "SUBMITTED",
            "RESUBMITTED",
            "APPROVE",
            "REQUEST_CHANGES",
            "REJECT",
            name="event_action_enum",
        ),
        nullable=False,
    )
    comment = Column(Text, nullable=True)
    user_id = Column(String(255), nullable=False)
    user_name = Column(String(255), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=_now)
