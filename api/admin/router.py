"""
Admin router — SPEC-022 (Configurações Admin)

Caixa-preta: 404 para não-admins (RN-009/010/011). In-memory mock store (Fase A).
Firebase Custom Claim verification deferred to Fase B (PRE: Firebase Admin SDK).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated, Literal

from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter(tags=["Admin"])

# ---------------------------------------------------------------------------
# Auth guard (mock — real Firebase Custom Claim verification in Fase B)
# ---------------------------------------------------------------------------


def _require_admin(authorization: str | None = None) -> None:  # noqa: ARG001
    """Mock guard. Production: verify Firebase Custom Claim admin=true → 404 if absent."""
    pass


# ---------------------------------------------------------------------------
# In-memory stores (Fase A — replace with DB in Fase B)
# ---------------------------------------------------------------------------

UserRole = Literal["admin", "creator", "viewer"]

_users: dict[str, dict] = {
    "uid-1": {
        "uid": "uid-1",
        "name": "Heitor Miranda",
        "email": "heitor@suno.com.br",
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
        items = [u for u in items if u["is_active"]]
    elif status == "suspended":
        items = [u for u in items if not u["is_active"]]
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


# ---------------------------------------------------------------------------
# Integrations
# ---------------------------------------------------------------------------


@router.get("/integrations")
async def list_integrations(
    authorization: Annotated[str | None, Header()] = None,
) -> list[dict]:
    _require_admin(authorization)
    return [
        {**v, "value_masked": None}  # never return value to frontend
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
