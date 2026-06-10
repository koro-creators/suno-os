"""Resolução do usuário autenticado a partir do request.

Ordem de resolução:
1. ``Authorization: Bearer <Firebase ID token>`` — verificado via Firebase Admin SDK.
2. ``X-User-ID`` header — fallback apenas fora de produção (dev local + testes),
   para que a API continue testável sem Firebase rodando.

Em produção o fallback é desabilitado: sem JWT válido → 401.
"""

from __future__ import annotations

import logging

from fastapi import HTTPException, Request

logger = logging.getLogger(__name__)


def _decode_bearer_token(authorization: str) -> dict | None:
    """Verifica o Bearer token com Firebase; retorna o payload ou None se inválido."""
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        return None

    from firebase_admin import auth as firebase_auth

    from core.firebase import get_firebase_app

    try:
        return firebase_auth.verify_id_token(token, app=get_firebase_app())
    except Exception as exc:
        logger.debug("Firebase token verification failed: %s", exc)
        return None


def resolve_user_id(request: Request) -> str | None:
    """Resolve o uid do usuário sem levantar exceção (None quando não autenticado)."""
    authorization = request.headers.get("Authorization", "")
    if authorization.startswith("Bearer "):
        decoded = _decode_bearer_token(authorization)
        if decoded:
            return decoded.get("uid")
        # JWT presente mas inválido: não cair para X-User-ID (evita spoof).
        return None

    from config import settings

    if settings.ENVIRONMENT != "production":
        user_id = request.headers.get("X-User-ID", "").strip()
        if user_id:
            return user_id

    return None


async def get_current_user_id(request: Request) -> str:
    """Dependency FastAPI: uid do usuário autenticado ou 401."""
    user_id = resolve_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user_id
