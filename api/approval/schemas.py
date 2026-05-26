"""
Pydantic schemas para Aprovação Hierárquica (SPEC-004 / FA-13).
SCH-013 / SCH-014 / SCH-015 simplificados para Phase 20.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums de domínio (UPPER_SNAKE_CASE conforme constitution §5.3)
# ---------------------------------------------------------------------------


class ApprovalStatus(str, Enum):
    PENDING_VALIDATION = "PENDING_VALIDATION"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    CHANGES_REQUESTED = "CHANGES_REQUESTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class DecisionType(str, Enum):
    APPROVE = "APPROVE"
    REQUEST_CHANGES = "REQUEST_CHANGES"
    REJECT = "REJECT"


class SubjectType(str, Enum):
    spark = "spark"
    turn = "turn"
    workflow_output = "workflow_output"


class Urgency(str, Enum):
    low = "low"
    normal = "normal"
    high = "high"


class EventAction(str, Enum):
    SUBMITTED = "SUBMITTED"
    RESUBMITTED = "RESUBMITTED"
    APPROVE = "APPROVE"
    REQUEST_CHANGES = "REQUEST_CHANGES"
    REJECT = "REJECT"


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------


class ApprovalSubmitRequest(BaseModel):
    """POST /api/approvals — submeter conteúdo para aprovação."""

    client_id: str = Field(..., description="ID do cliente (deve bater com claim JWT)")
    skill_slug: str
    subject_type: SubjectType
    subject_id: str
    content: str = Field(..., min_length=1, description="Conteúdo a ser aprovado (subject_snapshot)")
    urgency: Urgency = Urgency.normal
    comment: Optional[str] = None


class ApprovalDecisionRequest(BaseModel):
    """POST /api/approvals/{id}/approve|request-revision|reject"""

    comment: Optional[str] = None


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class ApprovalSubmissionResponse(BaseModel):
    """SCH-013 — ApprovalRequest response."""

    id: str
    client_id: str
    client_name: str
    skill_slug: str
    skill_name: str
    subject_type: SubjectType
    subject_id: str
    content: str
    status: ApprovalStatus
    urgency: Urgency
    submitted_by: str
    submitted_by_name: str
    assigned_approver: Optional[str] = None
    comment: Optional[str] = None
    round: int
    created_at: datetime
    updated_at: datetime


class ApprovalEventResponse(BaseModel):
    """SCH-014 — ApprovalDecision/Event response (append-only)."""

    id: str
    submission_id: str
    action: EventAction
    comment: Optional[str] = None
    user_id: str
    user_name: str
    timestamp: datetime


class ApprovalHistoryResponse(BaseModel):
    """SCH-015 — Histórico de eventos de uma submission."""

    submission_id: str
    events: list[ApprovalEventResponse]
