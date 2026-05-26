"""
Admin router — SPEC-022 (Configurações Admin)

Middleware: require_admin_claim verifica Firebase Custom Claim admin=true.
Caixa-preta: resposta 404 para não-admins (nunca 403) — RN-009/010/011.
"""

from fastapi import APIRouter, HTTPException, Header
from typing import Optional

router = APIRouter(tags=["Admin"])


def _require_admin(authorization: Optional[str] = None):
    """
    Verifica Firebase Custom Claim admin=true.
    Em prod: from core.firebase import verify_id_token; claims = verify_id_token(token)
    Se claims.get('admin') não for True → 404 (caixa-preta, nunca 403).
    Mock: aceita qualquer token (scaffolding phase 23).
    """
    # TODO Phase 24: verify Firebase Custom Claim admin=true
    # if authorization:
    #     token = authorization.removeprefix("Bearer ")
    #     try:
    #         from core.firebase import verify_id_token
    #         claims = verify_id_token(token)
    #         if not claims.get("admin"):
    #             raise HTTPException(status_code=404, detail="Not found")
    #     except Exception:
    #         raise HTTPException(status_code=404, detail="Not found")
    pass


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


@router.get("/users")
async def list_users(
    page: int = 1,
    per_page: int = 25,
    status: Optional[str] = None,
    authorization: Optional[str] = Header(default=None),
):
    _require_admin(authorization)
    return {"items": [], "total": 0}


@router.patch("/users/{uid}")
async def update_user(
    uid: str,
    body: dict,
    authorization: Optional[str] = Header(default=None),
):
    _require_admin(authorization)
    return {"uid": uid, **body}


@router.post("/users/invite")
async def invite_user(
    body: dict,
    authorization: Optional[str] = Header(default=None),
):
    _require_admin(authorization)
    return {"status": "invited"}


# ---------------------------------------------------------------------------
# Integrations
# ---------------------------------------------------------------------------


@router.get("/integrations")
async def list_integrations(
    authorization: Optional[str] = Header(default=None),
):
    _require_admin(authorization)
    return [{"key": "gemini_api_key", "name": "Gemini API", "configured": False, "value_masked": None}]


@router.put("/integrations/{key}")
async def update_integration(
    key: str,
    body: dict,
    authorization: Optional[str] = Header(default=None),
):
    _require_admin(authorization)
    # Em prod: criptografar valor com Fernet + PLATFORM_SETTINGS_ENCRYPTION_KEY
    # e persistir em platform_settings. Nunca logar o valor.
    return {"key": key, "status": "saved"}


# ---------------------------------------------------------------------------
# Skills defaults
# ---------------------------------------------------------------------------


@router.get("/skills/defaults")
async def get_skill_defaults(
    authorization: Optional[str] = Header(default=None),
):
    _require_admin(authorization)
    return []


@router.put("/skills/defaults/{skill_slug}")
async def update_skill_default(
    skill_slug: str,
    body: dict,
    authorization: Optional[str] = Header(default=None),
):
    _require_admin(authorization)
    return {"skill_slug": skill_slug, **body}


# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------


@router.get("/audit-log")
async def get_audit_log(
    page: int = 1,
    per_page: int = 50,
    user: Optional[str] = None,
    action: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    authorization: Optional[str] = Header(default=None),
):
    _require_admin(authorization)
    return {"items": [], "total": 0}
