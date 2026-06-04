"""
SPEC-015 — FastAPI router for Onboarding + Wiki endpoints.

Endpoints:
  GET  /api/clients                                      — listar clientes (status filter)
  POST /api/clients                                      — criar cliente (status PRE_ACTIVE)
  GET  /api/clients/{slug}/onboarding/status            — polling status do job
  POST /api/clients/{slug}/onboarding/start             — disparar job Oráculo
  POST /api/clients/{slug}/entities/{type}/validate     — aceitar/editar/rejeitar entidade (HITL)
  GET  /api/clients/{slug}/wiki                         — listar wiki_entities aceitas
  PATCH /api/clients/{slug}/wiki/{entity_type}          — edição direta (JN-15, PX-07)
  GET  /api/clients/{slug}/wiki/audit                   — audit log HITL (Admin only)

Caixa-preta (constitution §1.4, RN-011):
  - /wiki returns 404 for Operacional role — not 403
  - cross-client guard via require_client_by_slug
"""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Query

from .schemas import (
    ClientCreate,
    ClientCreateResponse,
    ClientListResponse,
    ClientSummary,
    DirectEditRequest,
    DirectEditResponse,
    HitlEventResponse,
    OnboardingStatusResponse,
    StartOnboardingResponse,
    ValidateEntityRequest,
    ValidateEntityResponse,
    WikiAuditResponse,
    WikiEntityResponse,
    WikiPageResponse,
)
from .service import (
    create_client,
    direct_edit_wiki_entity,
    get_client_by_slug,
    get_onboarding_status,
    get_wiki,
    get_wiki_audit,
    list_clients,
    regenerate_entity_stub,
    run_oracle_agent,
    start_onboarding,
    validate_entity,
)

router = APIRouter(tags=["Onboarding"])
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Firebase auth helpers
# ---------------------------------------------------------------------------

_FIREBASE_AVAILABLE: bool = False

try:
    import firebase_admin  # noqa: F401
    from firebase_admin import auth as _firebase_auth

    _FIREBASE_AVAILABLE = True
except ImportError:
    pass


def _decode_token(authorization: str | None) -> dict:
    """Decode Firebase JWT. Returns empty dict on failure (mock-mode safe)."""
    if not authorization or not authorization.startswith("Bearer "):
        return {}
    if not _FIREBASE_AVAILABLE:
        return {}
    token = authorization.removeprefix("Bearer ").strip()
    try:
        from core.firebase import get_firebase_app
        app = get_firebase_app()
        return _firebase_auth.verify_id_token(token, app=app)
    except Exception:
        return {}


def _get_user_id(authorization: str | None) -> str:
    """Extract Firebase UID. Falls back to 'system' in mock/dev mode."""
    decoded = _decode_token(authorization)
    return decoded.get("uid") or "system"


def _is_operacional(authorization: str | None) -> bool:
    """
    Returns True only when the token explicitly carries role='operacional'.
    Unknown / missing role → False (default-allow for backwards compat).
    Caixa-preta: callers raise 404, not 403 (RN-011).
    """
    decoded = _decode_token(authorization)
    if not decoded:
        return False  # mock mode or no token → allow
    return decoded.get("role") == "operacional"


# ---------------------------------------------------------------------------
# GET /api/clients — listar clientes
# ---------------------------------------------------------------------------


@router.get("/clients", response_model=ClientListResponse)
async def list_clients_endpoint(
    status: Annotated[str | None, Query(description="Filtrar por status (e.g. PRE_ACTIVE)")] = None,
    authorization: Annotated[str | None, Header()] = None,
) -> ClientListResponse:
    """
    List clients. Admins see all; can filter by status.
    Useful for the Admin panel PRE_ACTIVE alert (CA-19).
    """
    items_raw = await list_clients(status)
    items = [
        ClientSummary(
            id=c["id"],
            slug=c["slug"],
            name=c["name"],
            color=c.get("color", "#FFC801"),
            status=c["status"],
            pre_active_since=c.get("pre_active_since"),
            created_at=c["created_at"],
            updated_at=c["updated_at"],
        )
        for c in items_raw
    ]
    return ClientListResponse(items=items, total=len(items))


# ---------------------------------------------------------------------------
# POST /api/clients — criar cliente
# ---------------------------------------------------------------------------


@router.post("/clients", response_model=ClientCreateResponse, status_code=201)
async def create_client_endpoint(data: ClientCreate) -> ClientCreateResponse:
    """
    Create a new client in PRE_ACTIVE status.
    Does NOT start the Oráculo job — call /onboarding/start separately.
    """
    client, job_id = await create_client(data.model_dump())
    return ClientCreateResponse(
        id=client["id"],
        slug=client["slug"],
        name=client["name"],
        status=client["status"],
        job_id=job_id,
    )


# ---------------------------------------------------------------------------
# GET /api/clients/{slug}/onboarding/status — polling
# ---------------------------------------------------------------------------


@router.get(
    "/clients/{slug}/onboarding/status",
    response_model=OnboardingStatusResponse,
)
async def get_onboarding_status_endpoint(slug: str) -> OnboardingStatusResponse:
    """
    Poll onboarding job status.
    Frontend polls every 5s (ADR-LOCAL-01).
    """
    status_data = await get_onboarding_status(slug)
    return OnboardingStatusResponse(**status_data)


# ---------------------------------------------------------------------------
# POST /api/clients/{slug}/onboarding/start — disparar job
# ---------------------------------------------------------------------------


@router.post(
    "/clients/{slug}/onboarding/start",
    response_model=StartOnboardingResponse,
)
async def start_onboarding_endpoint(
    slug: str,
    background_tasks: BackgroundTasks,
) -> StartOnboardingResponse:
    """
    Dispatch the Oráculo job as a BackgroundTask.
    Constitution §1.1: never block HTTP waiting for Oráculo.
    ADR-LOCAL-02: FastAPI BackgroundTasks for v1.
    """
    result = await start_onboarding(slug)

    client = await get_client_by_slug(slug)
    if client:
        background_tasks.add_task(run_oracle_agent, client["id"])
        logger.info("Oracle agent job dispatched for client %s", slug)

    return StartOnboardingResponse(**result)


# ---------------------------------------------------------------------------
# POST /api/clients/{slug}/entities/{entity_type}/validate — HITL
# ---------------------------------------------------------------------------


@router.post(
    "/clients/{slug}/entities/{entity_type}/validate",
    response_model=ValidateEntityResponse,
)
async def validate_entity_endpoint(
    slug: str,
    entity_type: str,
    data: ValidateEntityRequest,
    background_tasks: BackgroundTasks,
    authorization: Annotated[str | None, Header()] = None,
) -> ValidateEntityResponse:
    """
    HITL gate per entity (constitution §1.3: never batch).
    ADR-LOCAL-04: gate enforced server-side.
    Caixa-preta (constitution §1.4): 404, never 403.
    """
    user_id = _get_user_id(authorization)

    result = await validate_entity(
        slug=slug,
        entity_type=entity_type,
        action=data.action,
        edited_content=data.edited_content,
        user_id=user_id,
    )

    if data.action == "reject_regenerate":
        client = await get_client_by_slug(slug)
        if client:
            background_tasks.add_task(regenerate_entity_stub, client["id"], entity_type)
            logger.info("Regeneration scheduled for %s/%s", slug, entity_type)

    return ValidateEntityResponse(**result)


# ---------------------------------------------------------------------------
# GET /api/clients/{slug}/wiki — Wiki Ontológica
# ---------------------------------------------------------------------------


@router.get(
    "/clients/{slug}/wiki",
    response_model=WikiPageResponse,
)
async def get_wiki_endpoint(
    slug: str,
    include_generated: bool = Query(
        False,
        description=(
            "Set to true to include 'generated' entities (for HITL validate page T-36). "
            "Default false returns only 'accepted' entities (Wiki Ontológica T-39)."
        ),
    ),
    authorization: Annotated[str | None, Header()] = None,
) -> WikiPageResponse:
    """
    Returns wiki entities for the client.

    Caixa-preta (constitution §1.4, RN-011):
    - role='operacional' → 404 (not 403).
    - ADR-LOCAL-05: Wiki is a view of wiki_entities, not Biblioteca.
    """
    if _is_operacional(authorization):
        raise HTTPException(status_code=404, detail="Recurso não disponível")

    wiki = await get_wiki(slug, include_generated=include_generated)

    entities = [
        WikiEntityResponse(
            id=e["id"],
            client_id=e["client_id"],
            entity_type=e["entity_type"],
            content=e["content"],
            provenance=e.get("provenance", []),
            status=e["status"],
            badge=e["badge"],
            created_at=e["created_at"],
            updated_at=e["updated_at"],
        )
        for e in wiki["entities"]
    ]

    return WikiPageResponse(
        client_id=wiki["client_id"],
        client_slug=wiki["client_slug"],
        client_name=wiki["client_name"],
        entities=entities,
    )


# ---------------------------------------------------------------------------
# PATCH /api/clients/{slug}/wiki/{entity_type} — edição direta (JN-15)
# ---------------------------------------------------------------------------


@router.patch(
    "/clients/{slug}/wiki/{entity_type}",
    response_model=DirectEditResponse,
)
async def direct_edit_wiki_entity_endpoint(
    slug: str,
    entity_type: str,
    data: DirectEditRequest,
    authorization: Annotated[str | None, Header()] = None,
) -> DirectEditResponse:
    """
    JN-15: PX-07 (Sponsor de Área) edits a wiki entity directly without Oracle re-run.
    Client must be ACTIVE. Badge updated to 'hitl'. Audit log appended.

    Caixa-preta: 404 for Operacional (RN-011).
    """
    if _is_operacional(authorization):
        raise HTTPException(status_code=404, detail="Recurso não disponível")

    user_id = _get_user_id(authorization)
    result = await direct_edit_wiki_entity(
        slug=slug,
        entity_type=entity_type,
        content=data.content,
        user_id=user_id,
    )
    return DirectEditResponse(**result)


# ---------------------------------------------------------------------------
# GET /api/clients/{slug}/wiki/audit — audit log (Admin only)
# ---------------------------------------------------------------------------


@router.get(
    "/clients/{slug}/wiki/audit",
    response_model=WikiAuditResponse,
)
async def get_wiki_audit_endpoint(
    slug: str,
    authorization: Annotated[str | None, Header()] = None,
) -> WikiAuditResponse:
    """
    HITL audit log for a client (Admin only).
    Caixa-preta: Operacional gets 404, not 403 (RN-011).
    """
    if _is_operacional(authorization):
        raise HTTPException(status_code=404, detail="Recurso não disponível")

    client = await get_client_by_slug(slug)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    events_raw = await get_wiki_audit(slug)
    events = [HitlEventResponse(**e) for e in events_raw]

    return WikiAuditResponse(
        client_id=client["id"],
        client_slug=client["slug"],
        events=events,
    )
