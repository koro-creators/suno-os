"""Repository de Aprovação Hierárquica (SPEC-004 / FA-13 / A-6).

Lógica SQLAlchemy pura para `approval_submissions` + `approval_events`.
Retorna dicts no shape dos schemas de resposta, para o router montá-los sem
mudança. O cross-client guard (caixa-preta) fica no router, pois depende do
actor (admin vê todos).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

try:
    from approval.models import ApprovalEvent, ApprovalSubmission
except ImportError:  # test import root (repo root on sys.path)
    from api.approval.models import ApprovalEvent, ApprovalSubmission


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _coerce_id(value: str) -> uuid.UUID | None:
    try:
        return uuid.UUID(str(value))
    except (ValueError, TypeError):
        return None


def _val(x):
    """Aceita enum Pydantic (str) ou str cru e devolve a string."""
    return getattr(x, "value", x)


def _sub_to_dict(s: ApprovalSubmission) -> dict:
    return {
        "id": str(s.id),
        "client_id": s.client_id,
        "client_name": s.client_name,
        "skill_slug": s.skill_slug,
        "skill_name": s.skill_name,
        "subject_type": s.subject_type,
        "subject_id": s.subject_id,
        "content": s.content,
        "status": s.status,
        "urgency": s.urgency,
        "submitted_by": s.submitted_by,
        "submitted_by_name": s.submitted_by_name,
        "assigned_approver": s.assigned_approver,
        "comment": s.comment,
        "round": s.round,
        "created_at": s.created_at,
        "updated_at": s.updated_at,
    }


def _evt_to_dict(e: ApprovalEvent) -> dict:
    return {
        "id": str(e.id),
        "submission_id": str(e.submission_id),
        "action": e.action,
        "comment": e.comment,
        "user_id": e.user_id,
        "user_name": e.user_name,
        "timestamp": e.timestamp,
    }


def create_submission(
    session: Session,
    *,
    client_id: str,
    skill_slug: str,
    subject_type,
    subject_id: str,
    content: str,
    urgency,
    submitted_by: str,
    submitted_by_name: str,
    comment: str | None,
) -> dict:
    sub = ApprovalSubmission(
        id=uuid.uuid4(),
        client_id=client_id,
        client_name=client_id,  # Phase 20: sem lookup de nome
        skill_slug=skill_slug,
        skill_name=skill_slug,
        subject_type=_val(subject_type),
        subject_id=subject_id,
        content=content,
        status="PENDING_VALIDATION",
        urgency=_val(urgency),
        submitted_by=submitted_by,
        submitted_by_name=submitted_by_name,
        assigned_approver=None,
        comment=comment,
        round=1,
    )
    session.add(sub)
    session.commit()
    session.refresh(sub)
    return _sub_to_dict(sub)


def get_submission(session: Session, submission_id: str) -> dict | None:
    sid = _coerce_id(submission_id)
    if sid is None:
        return None
    sub = session.get(ApprovalSubmission, sid)
    return _sub_to_dict(sub) if sub else None


def list_submissions(
    session: Session,
    client_id: str | None = None,
    skill_slug: str | None = None,
    urgency=None,
    status=None,
) -> list[dict]:
    query = session.query(ApprovalSubmission)
    if client_id:
        query = query.filter(ApprovalSubmission.client_id == client_id)
    if skill_slug:
        query = query.filter(ApprovalSubmission.skill_slug == skill_slug)
    if urgency:
        query = query.filter(ApprovalSubmission.urgency == _val(urgency))
    if status:
        query = query.filter(ApprovalSubmission.status == _val(status))
    subs = query.order_by(ApprovalSubmission.created_at.desc()).all()
    return [_sub_to_dict(s) for s in subs]


def update_submission(
    session: Session,
    submission_id: str,
    *,
    status=None,
    assigned_approver: str | None = None,
) -> dict | None:
    sid = _coerce_id(submission_id)
    if sid is None:
        return None
    sub = session.get(ApprovalSubmission, sid)
    if sub is None:
        return None
    if status is not None:
        sub.status = _val(status)
    if assigned_approver is not None:
        sub.assigned_approver = assigned_approver
    session.commit()
    session.refresh(sub)
    return _sub_to_dict(sub)


def add_event(
    session: Session,
    *,
    submission_id: str,
    action,
    comment: str | None,
    user_id: str,
    user_name: str,
) -> dict:
    evt = ApprovalEvent(
        id=uuid.uuid4(),
        submission_id=submission_id,
        action=_val(action),
        comment=comment,
        user_id=user_id,
        user_name=user_name,
    )
    session.add(evt)
    session.commit()
    session.refresh(evt)
    return _evt_to_dict(evt)


def list_events(session: Session, submission_id: str) -> list[dict]:
    events = (
        session.query(ApprovalEvent)
        .filter(ApprovalEvent.submission_id == submission_id)
        .order_by(ApprovalEvent.timestamp.asc())
        .all()
    )
    return [_evt_to_dict(e) for e in events]
