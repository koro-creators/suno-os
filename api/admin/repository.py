"""Repository for admin access data — users + audit (SPEC-022 Fase B).

Toda a lógica de DB da "parte de acesso" vive aqui, isolada do router para
ser testável e reaproveitável. As funções recebem uma ``Session`` já aberta
(injetada via ``admin.db.get_session``) e fazem commit quando mutam dados.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy.orm import Session

try:
    from models.audit import AuditEvent
    from models.user import User
except ImportError:  # test import root (repo root on sys.path)
    from api.models.audit import AuditEvent
    from api.models.user import User

# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


def list_users(
    session: Session,
    status: str | None = None,
    page: int = 1,
    per_page: int = 25,
) -> tuple[list[dict], int]:
    query = session.query(User)
    if status == "active":
        query = query.filter(User.is_active.is_(True))
    elif status in ("inactive", "suspended"):
        query = query.filter(User.is_active.is_(False))

    total = query.count()
    items = (
        query.order_by(User.created_at.asc()).offset((page - 1) * per_page).limit(per_page).all()
    )
    return [u.to_dict() for u in items], total


def update_user(session: Session, uid: str, updates: dict) -> dict | None:
    """Patch role/is_active. Returns the updated dict, or None if not found."""
    user = session.get(User, uid)
    if user is None:
        return None
    if updates.get("role") is not None:
        user.role = updates["role"]
    if updates.get("is_active") is not None:
        user.is_active = updates["is_active"]
    session.commit()
    session.refresh(user)
    return user.to_dict()


def create_invited_user(session: Session, email: str, role: str) -> str:
    """Insert an invited user and return its generated uid."""
    new_uid = str(uuid.uuid4())
    session.add(
        User(
            uid=new_uid,
            email=email,
            name=email.split("@")[0],
            role=role,
            is_active=True,
            last_access=None,
        )
    )
    session.commit()
    return new_uid


def upsert_user(
    session: Session,
    *,
    uid: str,
    email: str,
    name: str | None,
    role: str,
    is_active: bool,
    last_access: datetime | None,
    created_at: datetime | None,
) -> None:
    """Insert or update a user from a Firebase sync."""
    user = session.get(User, uid)
    if user is None:
        user = User(uid=uid)
        if created_at is not None:
            user.created_at = created_at
        session.add(user)
    user.email = email
    user.name = name
    user.role = role
    user.is_active = is_active
    user.last_access = last_access
    session.commit()


# ---------------------------------------------------------------------------
# Audit
# ---------------------------------------------------------------------------


def record_audit(
    session: Session,
    *,
    actor_uid: str | None,
    actor_email: str | None,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    detail: dict | None = None,
) -> None:
    session.add(
        AuditEvent(
            actor_uid=actor_uid or "mock-admin",
            actor_email=actor_email,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            detail=detail or {},
        )
    )
    session.commit()


def list_audit(
    session: Session,
    page: int = 1,
    per_page: int = 50,
    user: str | None = None,
    action: str | None = None,
    from_date: str | None = None,
    to_date: str | None = None,
) -> tuple[list[dict], int]:
    query = session.query(AuditEvent)
    if user:
        query = query.filter(AuditEvent.actor_email.ilike(f"%{user}%"))
    if action:
        query = query.filter(AuditEvent.action == action)
    if from_date:
        query = query.filter(AuditEvent.created_at >= datetime.fromisoformat(from_date))
    if to_date:
        end = datetime.fromisoformat(to_date).replace(hour=23, minute=59, second=59)
        query = query.filter(AuditEvent.created_at <= end)

    total = query.count()
    items = (
        query.order_by(AuditEvent.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return [e.to_dict() for e in items], total
