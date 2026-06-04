"""Repository de notificações (B-4). Caixa-preta: filtro por user_id."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

try:
    from models.notification import Notification
except ImportError:  # test import root (repo root on sys.path)
    from api.models.notification import Notification


def _coerce_id(value: str) -> uuid.UUID | None:
    try:
        return uuid.UUID(str(value))
    except (ValueError, TypeError):
        return None


def create(
    session: Session,
    *,
    user_id: str,
    type: str,
    title: str,
    body: str,
    submission_id: str | None = None,
) -> dict:
    notif = Notification(
        id=uuid.uuid4(),
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        submission_id=submission_id,
        read=False,
    )
    session.add(notif)
    session.commit()
    session.refresh(notif)
    return notif.to_dict()


def list_for_user(session: Session, user_id: str) -> list[dict]:
    notifs = (
        session.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return [n.to_dict() for n in notifs]


def mark_read(session: Session, notif_id: str, user_id: str) -> dict | None:
    """Caixa-preta: filtra user_id na query → 404 se não for do usuário."""
    nid = _coerce_id(notif_id)
    if nid is None:
        return None
    notif = (
        session.query(Notification)
        .filter(Notification.id == nid, Notification.user_id == user_id)
        .first()
    )
    if notif is None:
        return None
    notif.read = True
    session.commit()
    session.refresh(notif)
    return notif.to_dict()
