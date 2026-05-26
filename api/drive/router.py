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

import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
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
# In-memory stub store
# Maps user_id → {connected, email, last_sync, doc_count}
# TODO(SPEC-006 Fase B): replace with real DB queries via SQLAlchemy +
#   drive_tokens table (migration 005_drive_tokens.sql).
# ---------------------------------------------------------------------------

_stub_connections: dict[str, dict] = {}


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
    # Placeholder — real credentials not yet configured (Phase 18 scaffolding)
    placeholder_url = (
        "https://accounts.google.com/o/oauth2/auth"
        "?TODO=configure_credentials"
        "&scope=https://www.googleapis.com/auth/drive.readonly"
        "&hd=sunounited.com"
    )
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


@router.post("/sync", response_model=DriveSyncResponse, summary="Trigger sync manual")
async def drive_sync(current_user: str = Depends(get_current_user)) -> DriveSyncResponse:
    """Trigger a manual Drive sync for the authenticated user.

    TODO(SPEC-006 Fase B): enqueue a Celery/Cloud Tasks job that:
      1. Reads the user's drive_tokens row (decrypting via KMS).
      2. Runs google.drive.files.list for full sync, OR changes.list with
         stored pageToken for incremental sync (RN-030 — incremental is
         mandatory after first full sync).
      3. Updates drive_documents table and doc_count.
      4. Records last_sync timestamp on drive_syncs row.
    """
    stub_job_id = f"stub-job-{uuid.uuid4().hex[:8]}"
    logger.info("drive_sync: stub job enqueued for user=%s job_id=%s", current_user, stub_job_id)
    return DriveSyncResponse(status="sync_started", job_id=stub_job_id)


@router.delete("/disconnect", response_model=DriveDisconnectResponse, summary="Desconectar Drive")
async def drive_disconnect(current_user: str = Depends(get_current_user)) -> DriveDisconnectResponse:
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
