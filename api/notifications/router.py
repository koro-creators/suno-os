"""
FastAPI router para Sistema de Notificações (Phase 20 — stub in-memory).

Notificações são criadas internamente pelos routers de Aprovação e Reuniões.
Endpoints públicos permitem que clientes listem e marquem notificações como lidas.

Caixa-preta (RN-009/011): acesso filtrado por user_id; 404 para notificações
de outros usuários.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Notifications"])

# ---------------------------------------------------------------------------
# In-memory store (Phase 20 — substituir por DB na Phase D+)
# ---------------------------------------------------------------------------

_notifications: dict[str, dict] = {}

# Notification shape:
# {
#   "id": str,
#   "user_id": str,       # recipient
#   "type": str,          # "approval_requested" | "approval_decision" | "changes_requested"
#   "title": str,
#   "body": str,
#   "submission_id": str | None,
#   "read": bool,
#   "created_at": str,    # ISO
# }


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
) -> dict:
    """
    Cria uma notificação sem passar por autenticação HTTP.

    Destinado a chamadas internas de outros routers (ex: approval, reunioes).
    Não deve ser exposto diretamente como endpoint público.
    """
    notif_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    notif = {
        "id": notif_id,
        "user_id": user_id,
        "type": notif_type,
        "title": title,
        "body": body,
        "submission_id": submission_id,
        "read": False,
        "created_at": now,
    }
    _notifications[notif_id] = notif
    logger.info(
        "Notification created: id=%s type=%s user=%s",
        notif_id,
        notif_type,
        user_id,
    )
    return notif


# ---------------------------------------------------------------------------
# API — GET /notifications/
# ---------------------------------------------------------------------------


@router.get("/", response_model=list[NotificationResponse])
async def list_notifications(user_id: str) -> list[NotificationResponse]:
    """
    Listar notificações do usuário (filtradas por user_id).

    Caixa-preta: retorna apenas notificações do user_id informado.
    Notificações de outros usuários são invisíveis (não 403, apenas ausentes).
    """
    results = [n for n in _notifications.values() if n["user_id"] == user_id]
    results.sort(key=lambda n: n["created_at"], reverse=True)
    return [NotificationResponse(**n) for n in results]


# ---------------------------------------------------------------------------
# API — PATCH /notifications/{notif_id}/read
# ---------------------------------------------------------------------------


@router.patch("/{notif_id}/read", response_model=NotificationResponse)
async def mark_notification_read(notif_id: str, user_id: str) -> NotificationResponse:
    """
    Marcar uma notificação como lida.

    Caixa-preta: 404 se a notificação não existe OU pertence a outro usuário.
    """
    notif = _notifications.get(notif_id)
    if not notif or notif["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")

    notif["read"] = True
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
) -> NotificationResponse:
    """
    Criar notificação via API (uso interno / testes).

    Em produção, notificações são criadas pelos routers de Aprovação e Reuniões
    chamando `_create_notification_internal` diretamente.
    """
    notif = _create_notification_internal(
        user_id=user_id,
        notif_type=notif_type,
        title=title,
        body=body,
        submission_id=submission_id,
    )
    return NotificationResponse(**notif)
