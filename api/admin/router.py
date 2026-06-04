"""
Admin router — SPEC-022 (Configurações Admin)

Middleware: _require_admin verifica Firebase Custom Claim admin=true (com fallback mock).
Caixa-preta: resposta 404 para não-admins (nunca 403) — RN-009/010/011.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Annotated, Literal, Optional

from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Admin"])

# ---------------------------------------------------------------------------
# Firebase Admin SDK — real verification with graceful dev fallback
# ---------------------------------------------------------------------------

UserRole = Literal["admin", "creator", "viewer"]

_FIREBASE_ADMIN_AVAILABLE: bool = False

# Emails que sempre recebem acesso admin independente de custom claim Firebase
_ADMIN_EMAIL_ALLOWLIST: frozenset[str] = frozenset({"luis.felipesouza@rede.ulbra.br"})

try:
    import firebase_admin  # noqa: F401
    from firebase_admin import auth as firebase_auth

    _FIREBASE_ADMIN_AVAILABLE = True
except ImportError:
    logger.warning("firebase_admin not installed — admin auth in mock mode")


def _require_admin(authorization: str | None = None) -> str | None:
    """
    Verify Firebase JWT and check admin custom claim.
    Falls back to mock (allow all) when Firebase not configured.
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

    if not decoded.get("admin") and decoded.get("email") not in _ADMIN_EMAIL_ALLOWLIST:
        raise HTTPException(status_code=404, detail="Not found")

    return decoded["uid"]


def _sync_users_from_firebase() -> int:
    """Pull real users from Firebase Auth into _users store. No-op if Firebase not configured."""
    if not _FIREBASE_ADMIN_AVAILABLE:
        return 0

    try:
        from core.firebase import get_firebase_app

        app = get_firebase_app()
    except Exception as exc:
        logger.warning("Firebase app init failed during user sync: %s", exc)
        return 0

    try:
        page = firebase_auth.list_users(app=app)
        count = 0
        for user in page.users:
            custom_claims = user.custom_claims or {}
            role: UserRole = custom_claims.get("role", "viewer")

            def _ms_to_iso(ms: int | None) -> str | None:
                if ms is None:
                    return None
                return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).isoformat()

            _users[user.uid] = {
                "uid": user.uid,
                "name": user.display_name or user.email or user.uid,
                "email": user.email or "",
                "role": role,
                "is_active": not user.disabled,
                "last_access": _ms_to_iso(user.user_metadata.last_sign_in_time),
                "created_at": _ms_to_iso(user.user_metadata.creation_time),
            }
            count += 1

        logger.info("Synced %d users from Firebase Auth", count)
        return count
    except Exception as exc:
        logger.warning("Firebase user sync failed (using mock data): %s", exc)
        return 0


# ---------------------------------------------------------------------------
# In-memory stores (Fase A — seeded with mock data; overwritten by Firebase sync)
# ---------------------------------------------------------------------------

_users: dict[str, dict] = {
    "uid-1": {
        "uid": "uid-1",
        "name": "Heitor Miranda1",
        "email": "luis.felipesouza@rede.ulbra.br",
        "role": "admin",
        "is_active": True,
        "last_access": "2026-05-26T14:00:00Z",
        "created_at": "2026-01-10T09:00:00Z",
    },
    "uid-2": {
        "uid": "uid-2",
        "name": "Ana Silva",
        "email": "ana@suno.com.br",
        "role": "creator",
        "is_active": True,
        "last_access": "2026-05-25T10:30:00Z",
        "created_at": "2026-02-14T11:00:00Z",
    },
    "uid-3": {
        "uid": "uid-3",
        "name": "Carlos Melo",
        "email": "carlos@suno.com.br",
        "role": "viewer",
        "is_active": False,
        "last_access": "2026-05-10T08:00:00Z",
        "created_at": "2026-03-01T09:00:00Z",
    },
}

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

_skill_defaults: dict[str, dict] = {
    "copy-social": {
        "skill_slug": "copy-social",
        "skill_name": "Copy Social",
        "model": "gemini-2.5-flash",
        "temperature": 0.7,
        "max_tokens": 2048,
        "updated_at": "2026-05-26T10:00:00Z",
    },
    "plano-de-midia": {
        "skill_slug": "plano-de-midia",
        "skill_name": "Plano de Mídia",
        "model": "gemini-2.5-flash",
        "temperature": 0.3,
        "max_tokens": 4096,
        "updated_at": "2026-05-26T10:00:00Z",
    },
    "briefing": {
        "skill_slug": "briefing",
        "skill_name": "Briefing",
        "model": "gpt-4o",
        "temperature": 0.5,
        "max_tokens": 2048,
        "updated_at": "2026-05-26T10:00:00Z",
    },
}

_audit_log: list[dict] = [
    {
        "id": "al-1",
        "created_at": "2026-05-26T14:30:00Z",
        "actor_email": "heitor@suno.com.br",
        "action": "user_invited",
        "resource_type": "user",
        "detail": {"email": "novo@suno.com.br"},
    },
    {
        "id": "al-2",
        "created_at": "2026-05-26T10:00:00Z",
        "actor_email": "heitor@suno.com.br",
        "action": "integration_updated",
        "resource_type": "integration",
        "detail": {"key": "gemini_api_key"},
    },
    {
        "id": "al-3",
        "created_at": "2026-05-25T16:00:00Z",
        "actor_email": "ana@suno.com.br",
        "action": "skill_default_updated",
        "resource_type": "skill",
        "detail": {"slug": "copy-social"},
    },
]


def _add_audit(actor: str, action: str, resource_type: str, detail: dict) -> None:
    _audit_log.insert(
        0,
        {
            "id": str(uuid.uuid4()),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "actor_email": actor,
            "action": action,
            "resource_type": resource_type,
            "detail": detail,
        },
    )


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
) -> dict:
    _require_admin(authorization)
    items = list(_users.values())
    if status == "active":
        items = [u for u in items if u.get("is_active")]
    elif status in ("inactive", "suspended"):
        items = [u for u in items if not u.get("is_active")]
    total = len(items)
    start = (page - 1) * per_page
    return {"items": items[start : start + per_page], "total": total}


@router.patch("/users/{uid}")
async def update_user(
    uid: str,
    data: UserUpdate,
    authorization: Annotated[str | None, Header()] = None,
) -> dict:
    _require_admin(authorization)
    user = _users.get(uid)
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    user.update(updates)
    action = "user_role_updated" if "role" in updates else "user_suspended"
    _add_audit("admin", action, "user", {"uid": uid})
    return user


@router.post("/users/invite", status_code=201)
async def invite_user(
    data: UserInvite,
    authorization: Annotated[str | None, Header()] = None,
) -> dict:
    _require_admin(authorization)
    new_uid = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    user = {
        "uid": new_uid,
        "name": data.email.split("@")[0],
        "email": data.email,
        "role": data.role,
        "is_active": True,
        "last_access": None,
        "created_at": now,
    }
    _users[new_uid] = user
    _add_audit("admin", "user_invited", "user", {"email": data.email, "role": data.role})
    return {"status": "invited", "uid": new_uid}


@router.post("/users/sync")
async def sync_users_from_firebase(
    authorization: Optional[str] = Header(default=None),
):
    """Sync user list from Firebase Auth. No-op in mock mode."""
    _require_admin(authorization)
    count = _sync_users_from_firebase()
    return {"synced": count, "mode": "firebase" if count > 0 else "mock"}


# ---------------------------------------------------------------------------
# Integrations
# ---------------------------------------------------------------------------


@router.get("/integrations")
async def list_integrations(
    authorization: Annotated[str | None, Header()] = None,
) -> list[dict]:
    _require_admin(authorization)
    return [
        {**v, "value_masked": v.get("value_masked")}  # never return raw value
        for v in _integrations.values()
    ]


@router.put("/integrations/{key}")
async def update_integration(
    key: str,
    data: IntegrationUpdate,
    authorization: Annotated[str | None, Header()] = None,
) -> dict:
    _require_admin(authorization)
    if key not in _integrations:
        raise HTTPException(status_code=404, detail="Not found")
    last4 = data.value[-4:] if len(data.value) >= 4 else data.value
    _integrations[key]["configured"] = True
    _integrations[key]["value_masked"] = f"***...{last4}"
    _add_audit("admin", "integration_updated", "integration", {"key": key})
    return {"key": key, "status": "saved", "value_masked": f"***...{last4}"}


# ---------------------------------------------------------------------------
# Skills defaults
# ---------------------------------------------------------------------------


@router.get("/skills/defaults")
async def get_skill_defaults(
    authorization: Annotated[str | None, Header()] = None,
) -> list[dict]:
    _require_admin(authorization)
    return list(_skill_defaults.values())


@router.put("/skills/defaults/{skill_slug}")
async def update_skill_default(
    skill_slug: str,
    data: SkillDefaultUpdate,
    authorization: Annotated[str | None, Header()] = None,
) -> dict:
    _require_admin(authorization)
    if skill_slug not in _skill_defaults:
        raise HTTPException(status_code=404, detail="Not found")
    _skill_defaults[skill_slug].update(
        {
            "model": data.model,
            "temperature": data.temperature,
            "max_tokens": data.max_tokens,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    _add_audit("admin", "skill_default_updated", "skill", {"slug": skill_slug, "model": data.model})
    return _skill_defaults[skill_slug]


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
) -> dict:
    _require_admin(authorization)
    items = list(_audit_log)
    if user:
        items = [e for e in items if user.lower() in e["actor_email"].lower()]
    if action:
        items = [e for e in items if e["action"] == action]
    if from_date:
        items = [e for e in items if e["created_at"] >= from_date]
    if to_date:
        items = [e for e in items if e["created_at"] <= to_date + "T23:59:59Z"]
    total = len(items)
    start = (page - 1) * per_page
    return {"items": items[start : start + per_page], "total": total}
