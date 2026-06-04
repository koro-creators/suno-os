"""
SPEC-015 — FastAPI router for Onboarding + Wiki endpoints.

Endpoints:
  POST /api/clients                              — criar cliente (status PRE_ACTIVE)
  GET  /api/clients/{slug}/onboarding/status    — polling status do job
  POST /api/clients/{slug}/onboarding/start     — disparar job Oráculo
  POST /api/clients/{slug}/entities/{type}/validate — aceitar/editar/rejeitar entidade
  GET  /api/clients/{slug}/wiki                 — listar wiki_entities aceitas

Caixa-preta (constitution §1.4, RN-011):
  - Wiki endpoint returns 404 for Operacional role — not 403
  - Cross-client guard enforced via require_client_by_slug
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy.orm import Session

try:
    from core.db import get_session
except ImportError:  # test import root (repo root on sys.path)
    from api.core.db import get_session

from .schemas import (
    ClientCreate,
    ClientCreateResponse,
    OnboardingStatusResponse,
    StartOnboardingResponse,
    ValidateEntityRequest,
    ValidateEntityResponse,
    WikiEntityResponse,
    WikiPageResponse,
)
from .service import (
    create_client,
    get_onboarding_status,
    get_wiki,
    regenerate_entity_stub,
    run_oracle_agent,
    start_onboarding,
    validate_entity,
)

router = APIRouter(tags=["Onboarding"])
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# POST /api/clients — criar cliente
# ---------------------------------------------------------------------------


@router.post("/clients", response_model=ClientCreateResponse, status_code=201)
async def create_client_endpoint(
    data: ClientCreate,
    session: Session = Depends(get_session),
) -> ClientCreateResponse:
    """
    Create a new client in PRE_ACTIVE status.
    Does NOT start the Oráculo job — call /onboarding/start separately.
    """
    client, job_id = create_client(session, data.model_dump())
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
async def get_onboarding_status_endpoint(
    slug: str,
    session: Session = Depends(get_session),
) -> OnboardingStatusResponse:
    """
    Poll onboarding job status.
    Frontend polls every 5s (ADR-LOCAL-01).
    """
    status = get_onboarding_status(session, slug)
    return OnboardingStatusResponse(**status)


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
    session: Session = Depends(get_session),
) -> StartOnboardingResponse:
    """
    Dispatch the Oráculo stub job as a BackgroundTask.
    Constitution §1.1: never block HTTP waiting for Oráculo.
    ADR-LOCAL-02: FastAPI BackgroundTasks for v1.
    """
    result = start_onboarding(session, slug)

    # Get client_id for the background task
    from .service import get_client_by_slug

    client = get_client_by_slug(session, slug)
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
    session: Session = Depends(get_session),
) -> ValidateEntityResponse:
    """
    HITL gate per entity (constitution §1.3: never batch).
    ADR-LOCAL-04: gate enforced server-side.

    Caixa-preta (constitution §1.4): 404, never 403.
    """
    # TODO: extract real user_id from JWT — using placeholder for v1
    user_id = "system"

    result = validate_entity(
        session,
        slug=slug,
        entity_type=entity_type,
        action=data.action,
        edited_content=data.edited_content,
        user_id=user_id,
    )

    # If rejected, schedule regeneration
    if data.action == "reject_regenerate":
        from .service import get_client_by_slug

        client = get_client_by_slug(session, slug)
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
    session: Session = Depends(get_session),
    include_generated: bool = Query(
        False,
        description=(
            "Set to true to include 'generated' (not yet accepted) entities. "
            "Used by the HITL validate page so reviewers see Oracle stub content "
            "before approving. Default (false) returns only 'accepted' entities "
            "for the Wiki Ontológica page."
        ),
    ),
) -> WikiPageResponse:
    """
    Returns wiki entities for the client.

    include_generated=false (default): only accepted entities — Wiki Ontológica (T-39).
    include_generated=true: generated + accepted — HITL validate page (T-36).

    Caixa-preta (constitution §1.4, RN-011):
    - Operacional role → 404 (not 403). Caller must enforce role check here.
    - ADR-LOCAL-05: Wiki is a view of wiki_entities, not Biblioteca.

    TODO: enforce role check from JWT when Firebase auth is wired in.
    """
    wiki = get_wiki(session, slug, include_generated=include_generated)

    entities = [
        WikiEntityResponse(
            id=e["id"],
            client_id=e["client_id"],
            entity_type=e["entity_type"],
            content=e["content"],
            provenance=e["provenance"],
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
