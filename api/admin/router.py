"""
Admin router — SPEC-022 (Configurações Admin)

Middleware: _require_admin verifica Firebase Custom Claim admin=true (com fallback mock).
Caixa-preta: resposta 404 para não-admins (nunca 403) — RN-009/010/011.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Annotated, Literal, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

try:
    from admin import repository
    from admin.db import get_session
except ImportError:  # test import root (repo root on sys.path)
    from api.admin import repository
    from api.admin.db import get_session

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Admin"])

# ---------------------------------------------------------------------------
# Firebase Admin SDK — real verification with graceful dev fallback
# ---------------------------------------------------------------------------

UserRole = Literal["admin", "creator", "viewer"]

_FIREBASE_ADMIN_AVAILABLE: bool = False

try:
    import firebase_admin  # noqa: F401
    from firebase_admin import auth as firebase_auth

    _FIREBASE_ADMIN_AVAILABLE = True
except ImportError:
    logger.warning("firebase_admin not installed — admin auth in mock mode")


def _require_admin(session: Session, authorization: str | None = None) -> str | None:
    """
    Autenticação via Firebase (só prova identidade) + AUTORIZAÇÃO via nosso banco.

    O Firebase apenas verifica o token e devolve uid/email. A permissão (role
    'admin') vem da tabela `users` do Postgres — NÃO de custom claim do Firebase.
    Assim, "dar acesso" = uma linha em users (role='admin'), gerida por nós.

    Falls back to mock (allow all) when Firebase not configured (dev/testes).
    Caixa-preta: always 404, never 403 — RN-009/010/011.
    """
    if not _FIREBASE_ADMIN_AVAILABLE:
        logger.debug("Firebase Admin SDK not available — admin auth in mock mode")
        return None

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=404, detail="Not found")

    token = authorization.removeprefix("Bearer ").strip()

    try:
        from core.firebase import get_firebase_app

        app = get_firebase_app()
    except Exception as exc:
        logger.warning("Firebase app init failed — falling back to mock mode: %s", exc)
        return None

    try:
        decoded = firebase_auth.verify_id_token(token, app=app)
    except (
        firebase_auth.InvalidIdTokenError,
        firebase_auth.ExpiredIdTokenError,
        firebase_auth.RevokedIdTokenError,
        firebase_auth.CertificateFetchError,
    ):
        raise HTTPException(status_code=404, detail="Not found")
    except Exception as exc:
        logger.warning("Firebase token verification error: %s", exc)
        raise HTTPException(status_code=404, detail="Not found")

    # Autorização: role vem do NOSSO banco (users), resolvido por uid ou email.
    user = repository.get_user_for_auth(session, decoded.get("uid"), decoded.get("email"))
    if not user or user.get("role") != "admin" or not user.get("is_active"):
        raise HTTPException(status_code=404, detail="Not found")

    return decoded.get("uid")


def _sync_users_from_firebase(session: Session) -> int:
    """Upsert real users from Firebase Auth into the users table.

    No-op (returns 0) if Firebase Admin SDK is not configured.
    """
    if not _FIREBASE_ADMIN_AVAILABLE:
        return 0

    try:
        from core.firebase import get_firebase_app

        app = get_firebase_app()
    except Exception as exc:
        logger.warning("Firebase app init failed during user sync: %s", exc)
        return 0

    def _ms_to_dt(ms: int | None) -> datetime | None:
        if ms is None:
            return None
        return datetime.fromtimestamp(ms / 1000, tz=timezone.utc)

    try:
        page = firebase_auth.list_users(app=app)
        count = 0
        for user in page.users:
            custom_claims = user.custom_claims or {}
            role: UserRole = custom_claims.get("role", "viewer")

            repository.upsert_user(
                session,
                uid=user.uid,
                email=user.email or "",
                name=user.display_name or user.email or user.uid,
                role=role,
                is_active=not user.disabled,
                last_access=_ms_to_dt(user.user_metadata.last_sign_in_time),
                created_at=_ms_to_dt(user.user_metadata.creation_time),
            )
            count += 1

        logger.info("Synced %d users from Firebase Auth", count)
        return count
    except Exception as exc:
        logger.warning("Firebase user sync failed: %s", exc)
        return 0


# ---------------------------------------------------------------------------
# In-memory store (Fase A) — apenas integrations (chaves de API; persistência
# real exige criptografia/KMS — ver Bucket B). Demais já no Postgres:
#   - users          → users           (011_users.sql)
#   - audit          → audit_events    (009_admin_panel.sql)
#   - skill defaults → skill_defaults  (017_skill_defaults.sql)
# ---------------------------------------------------------------------------

_integrations: dict[str, dict] = {
    "gemini_api_key": {
        "key": "gemini_api_key",
        "name": "Gemini API",
        "description": "Chave de API do Google Gemini para geração de conteúdo",
        "configured": False,
        "value_masked": None,
    },
    "openai_api_key": {
        "key": "openai_api_key",
        "name": "OpenAI API",
        "description": "Chave de API da OpenAI (GPT-4o, DALL-E)",
        "configured": False,
        "value_masked": None,
    },
}

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class UserUpdate(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None


class UserInvite(BaseModel):
    email: str = Field(..., min_length=3)
    role: UserRole = "creator"


class IntegrationUpdate(BaseModel):
    value: str = Field(..., min_length=1)


class SkillDefaultUpdate(BaseModel):
    model: str
    temperature: float = Field(..., ge=0.0, le=2.0)
    max_tokens: int = Field(..., ge=256)


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


@router.get("/users")
async def list_users(
    status: Annotated[str | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=100)] = 25,
    authorization: Annotated[str | None, Header()] = None,
    session: Session = Depends(get_session),
) -> dict:
    _require_admin(session, authorization)
    items, total = repository.list_users(session, status=status, page=page, per_page=per_page)
    return {"items": items, "total": total}


@router.patch("/users/{uid}")
async def update_user(
    uid: str,
    data: UserUpdate,
    authorization: Annotated[str | None, Header()] = None,
    session: Session = Depends(get_session),
) -> dict:
    actor = _require_admin(session, authorization)
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    user = repository.update_user(session, uid, updates)
    if user is None:
        raise HTTPException(status_code=404, detail="Not found")
    action = "user_role_updated" if "role" in updates else "user_suspended"
    repository.record_audit(
        session,
        actor_uid=actor,
        actor_email=None,
        action=action,
        resource_type="user",
        resource_id=uid,
        detail={"uid": uid},
    )
    return user


@router.post("/users/invite", status_code=201)
async def invite_user(
    data: UserInvite,
    authorization: Annotated[str | None, Header()] = None,
    session: Session = Depends(get_session),
) -> dict:
    actor = _require_admin(session, authorization)
    new_uid = repository.create_invited_user(session, data.email, data.role)
    repository.record_audit(
        session,
        actor_uid=actor,
        actor_email=None,
        action="user_invited",
        resource_type="user",
        resource_id=new_uid,
        detail={"email": data.email, "role": data.role},
    )
    return {"status": "invited", "uid": new_uid}


@router.post("/users/sync")
async def sync_users_from_firebase(
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
):
    """Sync user list from Firebase Auth into the DB. No-op in mock mode."""
    _require_admin(session, authorization)
    count = _sync_users_from_firebase(session)
    return {"synced": count, "mode": "firebase" if count > 0 else "mock"}


# ---------------------------------------------------------------------------
# Integrations
# ---------------------------------------------------------------------------


@router.get("/integrations")
async def list_integrations(
    authorization: Annotated[str | None, Header()] = None,
    session: Session = Depends(get_session),
) -> list[dict]:
    _require_admin(session, authorization)
    return [
        {**v, "value_masked": v.get("value_masked")}  # never return raw value
        for v in _integrations.values()
    ]


@router.put("/integrations/{key}")
async def update_integration(
    key: str,
    data: IntegrationUpdate,
    authorization: Annotated[str | None, Header()] = None,
    session: Session = Depends(get_session),
) -> dict:
    actor = _require_admin(session, authorization)
    if key not in _integrations:
        raise HTTPException(status_code=404, detail="Not found")
    last4 = data.value[-4:] if len(data.value) >= 4 else data.value
    _integrations[key]["configured"] = True
    _integrations[key]["value_masked"] = f"***...{last4}"
    repository.record_audit(
        session,
        actor_uid=actor,
        actor_email=None,
        action="integration_updated",
        resource_type="integration",
        resource_id=key,
        detail={"key": key},
    )
    return {"key": key, "status": "saved", "value_masked": f"***...{last4}"}


# ---------------------------------------------------------------------------
# Skills defaults
# ---------------------------------------------------------------------------


@router.get("/skills/defaults")
async def get_skill_defaults(
    authorization: Annotated[str | None, Header()] = None,
    session: Session = Depends(get_session),
) -> list[dict]:
    _require_admin(session, authorization)
    return repository.list_skill_defaults(session)


@router.put("/skills/defaults/{skill_slug}")
async def update_skill_default(
    skill_slug: str,
    data: SkillDefaultUpdate,
    authorization: Annotated[str | None, Header()] = None,
    session: Session = Depends(get_session),
) -> dict:
    actor = _require_admin(session, authorization)
    updated = repository.update_skill_default(
        session,
        skill_slug,
        model=data.model,
        temperature=data.temperature,
        max_tokens=data.max_tokens,
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Not found")
    repository.record_audit(
        session,
        actor_uid=actor,
        actor_email=None,
        action="skill_default_updated",
        resource_type="skill",
        resource_id=skill_slug,
        detail={"slug": skill_slug, "model": data.model},
    )
    return updated


# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------


@router.get("/audit-log")
async def get_audit_log(
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=100)] = 50,
    user: Annotated[str | None, Query()] = None,
    action: Annotated[str | None, Query()] = None,
    from_date: Annotated[str | None, Query()] = None,
    to_date: Annotated[str | None, Query()] = None,
    authorization: Annotated[str | None, Header()] = None,
    session: Session = Depends(get_session),
) -> dict:
    _require_admin(session, authorization)
    items, total = repository.list_audit(
        session,
        page=page,
        per_page=per_page,
        user=user,
        action=action,
        from_date=from_date,
        to_date=to_date,
    )
    return {"items": items, "total": total}
