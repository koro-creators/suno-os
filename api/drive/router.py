"""
Drive API router — SPEC-006 FA-14, Phase 18 scaffolding.

All endpoints are stubs. The OAuth flow shape is correct but the handshake
will NOT complete until real credentials are configured in api/.env:
  GOOGLE_OAUTH_CLIENT_ID=<from Google Cloud Console>
  GOOGLE_OAUTH_CLIENT_SECRET=<from Google Cloud Console>
  GOOGLE_OAUTH_REDIRECT_URI=<e.g. http://localhost:8080/api/drive/callback>

Security model (constitution §2.2 + caixa-preta RN-011):
- All endpoints require authentication (X-User-ID header → Firebase UID).
  TODO: replace X-User-ID stub with real Firebase JWT verification (Fase D).
- 404 is returned when the user has no token (not 403) — caixa-preta.
- Drive scope is ALWAYS drive.readonly + drive.metadata.readonly — never write.
- TODO(Fase D, NFR-008): wrap token persistence with Cloud KMS encryption.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/drive", tags=["Drive"])


# ---------------------------------------------------------------------------
# Auth dependency — mirrors conversations/router.py stub pattern
# TODO(SPEC-006 Fase D): replace with real Firebase JWT verification
# ---------------------------------------------------------------------------


async def get_current_user(request: Request) -> str:
    """Extract authenticated user ID from request.

    Stub implementation reads the ``X-User-ID`` header.
    Must be replaced with Firebase Admin SDK token verification before
    any production deploy (PRE-03 gate).

    Returns:
        Firebase UID string.

    Raises:
        HTTPException 401 if no user ID is present.
    """
    user_id = request.headers.get("X-User-ID", "").strip()
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user_id


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class DriveStatusResponse(BaseModel):
    connected: bool
    email: Optional[str] = None
    last_sync: Optional[str] = None
    doc_count: int = 0


class DriveAuthResponse(BaseModel):
    auth_url: str


class DriveCallbackResponse(BaseModel):
    status: str
    message: str


class DriveSyncResponse(BaseModel):
    status: str
    job_id: str


class DriveDisconnectResponse(BaseModel):
    status: str


# ---------------------------------------------------------------------------
# In-memory stub stores
# TODO(SPEC-006 Fase B): replace with real DB queries via SQLAlchemy +
#   drive_tokens table (migration 005_drive_tokens.sql).
# ---------------------------------------------------------------------------

# Maps user_id → {connected, email, last_sync, doc_count}
_stub_connections: dict[str, dict] = {}

# Maps user_id → job dict {job_id, status, queued_at, done_at}
_sync_jobs: dict[str, dict] = {}

# Maps user_id → list of ingested file stubs
_files_store: dict[str, list] = {}

# Maps suggestion_id → "accepted" | "rejected"
_curation_decisions: dict[str, str] = {}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/status", response_model=DriveStatusResponse, summary="Status da conexão OAuth")
async def drive_status(current_user: str = Depends(get_current_user)) -> DriveStatusResponse:
    """Return the current Drive OAuth connection status for the authenticated user.

    Caixa-preta: returns { connected: false } (not 404) when no token exists,
    because the absence of a connection is not a secret — only document content is.
    """
    # TODO(SPEC-006 Fase B): query drive_tokens table for current_user
    conn = _stub_connections.get(current_user)
    if conn:
        return DriveStatusResponse(**conn)
    return DriveStatusResponse(connected=False)


@router.get("/auth", response_model=DriveAuthResponse, summary="Iniciar OAuth flow")
async def drive_auth_start(current_user: str = Depends(get_current_user)) -> DriveAuthResponse:
    """Return the Google OAuth authorization URL for Drive read-only access.

    Scope: drive.readonly + drive.metadata.readonly (constitution §1 princípio 1).
    NEVER include write/create/delete scopes — code review must block any PR
    that changes this.

    TODO(SPEC-006 Fase B): build real OAuth URL using google-auth-oauthlib:
      from google_auth_oauthlib.flow import Flow
      flow = Flow.from_client_config(
          {"client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
           "client_secret": settings.GOOGLE_OAUTH_CLIENT_SECRET, ...},
          scopes=["https://www.googleapis.com/auth/drive.readonly",
                  "https://www.googleapis.com/auth/drive.metadata.readonly"],
          redirect_uri=settings.GOOGLE_OAUTH_REDIRECT_URI,
      )
      auth_url, state = flow.authorization_url(
          access_type="offline",
          include_granted_scopes="true",
          state=current_user,  # pass user_id as state for callback correlation
          hd="sunounited.com",  # REST-08 v2: restrict to @sunounited accounts
      )
      return DriveAuthResponse(auth_url=auth_url)
    """
    # Placeholder — real credentials not yet configured (Phase 18 scaffolding).
    # Sentinel value "#oauth-not-configured" is recognized by the frontend
    # to show a "configure credentials" message instead of navigating to Google.
    placeholder_url = "#oauth-not-configured"
    logger.info("drive_auth_start: returning placeholder OAuth URL for user=%s", current_user)
    return DriveAuthResponse(auth_url=placeholder_url)


@router.get("/callback", response_model=DriveCallbackResponse, summary="Callback OAuth")
async def drive_auth_callback(
    code: str,
    state: str,
    request: Request,
) -> DriveCallbackResponse:
    """Exchange the OAuth authorization code for access + refresh tokens.

    The ``state`` param carries the user_id set in drive_auth_start.

    TODO(SPEC-006 Fase B): implement real token exchange:
      1. Validate `state` matches an in-flight OAuth session (CSRF protection).
      2. Exchange `code` for tokens via google-auth-oauthlib Flow.
      3. Verify token.hd == "sunounited.com" (REST-08 v2).
      4. TODO(NFR-008, Fase D): encrypt tokens via Cloud KMS before persist.
      5. Upsert drive_tokens row for the user.
      6. Redirect frontend to /configuracoes/drive with ?connected=true.
    """
    # Stub: simulate a successful token exchange
    user_id = state  # in real flow, validate state is a known pending session
    logger.info("drive_auth_callback: stub token exchange for user=%s", user_id)

    _stub_connections[user_id] = {
        "connected": True,
        "email": "stub@sunounited.com",
        "last_sync": None,
        "doc_count": 0,
    }

    return DriveCallbackResponse(
        status="ok",
        message="Drive connected (stub). Configure real OAuth credentials to complete the flow.",
    )


async def _run_sync_job(user_id: str, job_id: str) -> None:
    """Background task: simulate Drive sync with a 2-second delay.

    TODO(SPEC-006 Fase B): replace with real Drive API calls via
      google-auth-oauthlib + google-api-python-client.
    """
    await asyncio.sleep(2)
    now = datetime.now(timezone.utc).isoformat()
    _sync_jobs[user_id]["status"] = "done"
    _sync_jobs[user_id]["done_at"] = now
    _files_store[user_id] = [
        {"id": "stub-file-1", "name": "Briefing Santander Q1.pdf", "mime_type": "application/pdf"},
        {
            "id": "stub-file-2",
            "name": "Plano de Mídia Maio.xlsx",
            "mime_type": "application/vnd.ms-excel",
        },
        {"id": "stub-file-3", "name": "Tom de Voz Global Suno.pdf", "mime_type": "application/pdf"},
    ]
    if user_id in _stub_connections:
        _stub_connections[user_id]["last_sync"] = now
        _stub_connections[user_id]["doc_count"] = len(_files_store[user_id])
    logger.info("drive_sync: job done for user=%s job_id=%s", user_id, job_id)


@router.post("/sync", response_model=DriveSyncResponse, summary="Trigger sync manual")
async def drive_sync(
    background_tasks: BackgroundTasks,
    current_user: str = Depends(get_current_user),
) -> DriveSyncResponse:
    """Trigger a manual Drive sync for the authenticated user.

    Creates a job entry in ``_sync_jobs`` (status="queued") and fires the
    sync as a BackgroundTask.  Poll ``GET /drive/sync/status`` to track
    progress.

    TODO(SPEC-006 Fase B): replace BackgroundTasks with Cloud Tasks/Celery:
      1. Reads the user's drive_tokens row (decrypting via KMS).
      2. Runs google.drive.files.list for full sync, OR changes.list with
         stored pageToken for incremental sync (RN-030 — incremental is
         mandatory after first full sync).
      3. Updates drive_documents table and doc_count.
      4. Records last_sync timestamp on drive_syncs row.
    """
    job_id = f"job-{uuid.uuid4().hex[:8]}"
    _sync_jobs[current_user] = {
        "job_id": job_id,
        "status": "queued",
        "queued_at": datetime.now(timezone.utc).isoformat(),
        "done_at": None,
    }
    background_tasks.add_task(_run_sync_job, current_user, job_id)
    logger.info("drive_sync: job enqueued for user=%s job_id=%s", current_user, job_id)
    return DriveSyncResponse(status="queued", job_id=job_id)


@router.get("/sync/status", summary="Status do job de sync atual")
async def drive_sync_status(current_user: str = Depends(get_current_user)) -> dict:
    """Return the status of the most recent sync job for the authenticated user.

    Returns ``{status: "idle"}`` when no job has been triggered yet.
    """
    job = _sync_jobs.get(current_user)
    if not job:
        return {"status": "idle"}
    return job


@router.get("/cleanup-report", summary="Relatório de limpeza do Drive")
async def get_cleanup_report(current_user: str = Depends(get_current_user)) -> dict:
    """Simulate a cleanup report.

    Real implementation: query Drive API for stale/inaccessible files.
    Returns categorized issues for the Leader to review.

    Caixa-preta (RN-011): endpoint requires auth — non-authed callers get 401,
    never 403 (absence of data is not a secret).

    TODO(SPEC-006 Fase B): replace mock data with real Drive API + DB queries:
      - duplicates: files with identical MD5 checksums per user
      - no_access: drive_documents where last_access_check returned 403/404
      - outdated: drive_documents where modified_time < NOW() - 90 days
    """
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "duplicates": 3,
            "no_access": 2,
            "outdated": 5,
            "total_issues": 10,
        },
        "duplicates": [
            {
                "id": "file-d1",
                "name": "Briefing Santander Q1.pdf",
                "copies": 2,
                "latest_at": "2026-04-10T14:00:00Z",
            },
            {
                "id": "file-d2",
                "name": "Plano de Mídia Maio.xlsx",
                "copies": 3,
                "latest_at": "2026-05-01T09:00:00Z",
            },
            {
                "id": "file-d3",
                "name": "Copy Instagram Semana 14.docx",
                "copies": 2,
                "latest_at": "2026-05-18T11:00:00Z",
            },
        ],
        "no_access": [
            {
                "id": "file-n1",
                "name": "Estratégia 2025 (restrito).pdf",
                "owner": "externo@cliente.com",
            },
            {"id": "file-n2", "name": "Contrato NDA.docx", "owner": "juridico@suno.com.br"},
        ],
        "outdated": [
            {
                "id": "file-o1",
                "name": "Persona Ana (2024).pdf",
                "last_modified": "2024-06-15T10:00:00Z",
                "days_stale": 345,
            },
            {
                "id": "file-o2",
                "name": "Briefing Q3 2024.pptx",
                "last_modified": "2024-09-01T08:00:00Z",
                "days_stale": 267,
            },
            {
                "id": "file-o3",
                "name": "Calendário Editorial Jan.xlsx",
                "last_modified": "2026-01-31T16:00:00Z",
                "days_stale": 115,
            },
            {
                "id": "file-o4",
                "name": "Guia de Voz Suno 2023.pdf",
                "last_modified": "2023-12-01T09:00:00Z",
                "days_stale": 541,
            },
            {
                "id": "file-o5",
                "name": "Benchmarking Concorrentes.pptx",
                "last_modified": "2025-03-15T14:00:00Z",
                "days_stale": 72,
            },
        ],
    }


@router.get("/curation-suggestions", summary="Sugestões de curadoria para ingestão")
async def get_curation_suggestions(current_user: str = Depends(get_current_user)) -> dict:
    """Return suggested files for ingestion, categorized by relevance.

    The Leader can accept or reject each suggestion via PATCH.

    TODO(SPEC-006 Fase B): drive ML-based relevance scoring using file metadata
      + Biblioteca embeddings similarity.
    """
    # Merge persisted decisions into suggestions
    base_suggestions = [
        {
            "id": "sug-1",
            "file_id": "file-s1",
            "file_name": "Briefing Santander Q2 2026.pdf",
            "relevance": "high",
            "reason": "Briefing recente com dados de campanha",
            "status": "pending",
        },
        {
            "id": "sug-2",
            "file_id": "file-s2",
            "file_name": "Personas Atualizadas Maio 2026.pptx",
            "relevance": "high",
            "reason": "Personas atualizadas — substitui versão de 2024",
            "status": "pending",
        },
        {
            "id": "sug-3",
            "file_id": "file-s3",
            "file_name": "Tom de Voz Global Suno.pdf",
            "relevance": "medium",
            "reason": "Guia de tom aplicável a todos os clientes",
            "status": "pending",
        },
    ]
    suggestions = [
        {**s, "status": _curation_decisions.get(s["id"], s["status"])} for s in base_suggestions
    ]
    return {"suggestions": suggestions}


@router.patch("/curation-suggestions/{suggestion_id}", summary="Aceitar ou rejeitar sugestão")
async def decide_curation_suggestion(
    suggestion_id: str,
    decision: dict,
    current_user: str = Depends(get_current_user),
) -> dict:
    """Leader accepts or rejects a curation suggestion.

    Body: ``{"status": "accepted" | "rejected"}``

    Decision is persisted in-memory until restart.
    TODO(SPEC-006 Fase B): persist to drive_curation_decisions table.
    """
    status = decision.get("status")
    if status not in ("accepted", "rejected"):
        raise HTTPException(status_code=400, detail="status must be 'accepted' or 'rejected'")
    _curation_decisions[suggestion_id] = status
    logger.info(
        "curation_decision: user=%s suggestion=%s status=%s",
        current_user,
        suggestion_id,
        status,
    )
    return {"suggestion_id": suggestion_id, "status": status}


@router.delete("/disconnect", response_model=DriveDisconnectResponse, summary="Desconectar Drive")
async def drive_disconnect(
    current_user: str = Depends(get_current_user),
) -> DriveDisconnectResponse:
    """Revoke the Drive OAuth connection for the authenticated user.

    Follows FR-178: sets revoked_at timestamp; drive_documents for this user
    stop appearing in any query (implicit filter added in Fase B).

    TODO(SPEC-006 Fase B): update drive_tokens.revoked_at = NOW() for current_user.
    TODO(SPEC-006 Fase D): call Google OAuth revoke endpoint to invalidate the token
      server-side: POST https://oauth2.googleapis.com/revoke?token=<access_token>
    """
    _stub_connections.pop(current_user, None)
    logger.info("drive_disconnect: stub revoke for user=%s", current_user)
    return DriveDisconnectResponse(status="disconnected")
