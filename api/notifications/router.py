"""
FastAPI router para Sistema de Notificações (Phase 20 — stub in-memory).

Notificações são criadas internamente pelos routers de Aprovação e Reuniões.
Endpoints públicos permitem que clientes listem e marquem notificações como lidas.

Caixa-preta (RN-009/011): acesso filtrado por user_id; 404 para notificações
de outros usuários.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

try:
    from core.db import get_session
    from notifications import repository
except ImportError:  # test import root (repo root on sys.path)
    from api.core.db import get_session
    from api.notifications import repository

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Notifications"])


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    body: str
    submission_id: Optional[str] = None
    read: bool
    created_at: str


# ---------------------------------------------------------------------------
# Internal helper — usado pelos outros routers sem autenticação
# ---------------------------------------------------------------------------


def _create_notification_internal(
    user_id: str,
    notif_type: str,
    title: str,
    body: str,
    submission_id: Optional[str] = None,
) -> Optional[dict]:
    """
    Cria uma notificação sem passar por autenticação HTTP.

    Destinado a chamadas internas de outros routers (ex: approval, reunioes),
    que não têm uma Session em mãos. Abre a própria sessão curta e persiste em
    DB. Best-effort: nunca propaga erro (notificação não pode quebrar o fluxo
    principal); se o banco estiver fora, loga e retorna None.
    """
    try:
        try:
            from core.db import _get_sessionmaker
        except ImportError:  # test import root
            from api.core.db import _get_sessionmaker

        session = _get_sessionmaker()()
        try:
            notif = repository.create(
                session,
                user_id=user_id,
                type=notif_type,
                title=title,
                body=body,
                submission_id=submission_id,
            )
            logger.info(
                "Notification created: id=%s type=%s user=%s", notif["id"], notif_type, user_id
            )
            return notif
        finally:
            session.close()
    except Exception as exc:
        logger.warning("Notification persist failed (best-effort): %s", exc)
        return None


# ---------------------------------------------------------------------------
# API — GET /notifications/
# ---------------------------------------------------------------------------


@router.get("/", response_model=list[NotificationResponse])
async def list_notifications(
    user_id: str,
    session: Session = Depends(get_session),
) -> list[NotificationResponse]:
    """
    Listar notificações do usuário (filtradas por user_id).

    Caixa-preta: retorna apenas notificações do user_id informado.
    Notificações de outros usuários são invisíveis (não 403, apenas ausentes).
    """
    results = repository.list_for_user(session, user_id)
    return [NotificationResponse(**n) for n in results]


# ---------------------------------------------------------------------------
# API — PATCH /notifications/{notif_id}/read
# ---------------------------------------------------------------------------


@router.patch("/{notif_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notif_id: str,
    user_id: str,
    session: Session = Depends(get_session),
) -> NotificationResponse:
    """
    Marcar uma notificação como lida.

    Caixa-preta: 404 se a notificação não existe OU pertence a outro usuário.
    """
    notif = repository.mark_read(session, notif_id, user_id)
    if notif is None:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    logger.info("Notification %s marked as read by user %s", notif_id, user_id)
    return NotificationResponse(**notif)


# ---------------------------------------------------------------------------
# API — POST /notifications/
# ---------------------------------------------------------------------------


@router.post("/", response_model=NotificationResponse, status_code=201)
async def create_notification(
    user_id: str,
    notif_type: str,
    title: str,
    body: str,
    submission_id: Optional[str] = None,
    session: Session = Depends(get_session),
) -> NotificationResponse:
    """
    Criar notificação via API (uso interno / testes).

    Em produção, notificações são criadas pelos routers de Aprovação e Reuniões
    chamando `_create_notification_internal` diretamente.
    """
    notif = repository.create(
        session,
        user_id=user_id,
        type=notif_type,
        title=title,
        body=body,
        submission_id=submission_id,
    )
    return NotificationResponse(**notif)
