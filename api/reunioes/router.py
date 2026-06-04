"""FastAPI router for Meetings (Reunioes) endpoints — SPEC-016 Phase 21.

Caixa-preta: all queries filter by client_id from request context (stubbed as
X-Client-ID header for Phase 21). Cross-client requests return 404, never 403.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from .schemas import (
    CurateRequest,
    CurateResponse,
    MeetingCreate,
    MeetingListResponse,
    MeetingResponse,
    MeetingSegmentResponse,
    MeetingUpdate,
)

try:
    from core.db import get_session
    from reunioes import repository
except ImportError:  # test import root (repo root on sys.path)
    from api.core.db import get_session
    from api.reunioes import repository

# FA-15: Oráculo integration (graceful guard — silently disabled if onboarding not present)
try:
    from onboarding.service import add_reunion_context_to_oraculo

    _ORACULO_AVAILABLE = True
except ImportError:
    _ORACULO_AVAILABLE = False

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Meetings"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _split_transcript_into_segments(meeting_id: str, transcript: str) -> list[dict]:
    """Split transcript text into segments on double-newline boundaries."""
    chunks = [chunk.strip() for chunk in transcript.split("\n\n") if chunk.strip()]
    segments = []
    for i, text in enumerate(chunks):
        minutes = i * 3
        hh = minutes // 60
        mm = minutes % 60
        segments.append(
            {
                "id": f"seg-{meeting_id}-{i + 1}",
                "meeting_id": meeting_id,
                "text": text,
                "start_time": f"{hh:02d}:{mm:02d}:00",
                "selected": False,
                "context_note": "",
                "curated_by": None,
                "curated_at": None,
            }
        )
    return segments


def _get_client_id(x_client_id: Optional[str]) -> str:
    """Resolve the client_id from the request.

    Phase 21 stub: read from X-Client-ID header. Production will resolve from JWT.
    Returns 'default' if not provided (allows local dev without auth).
    """
    return x_client_id or "default"


def _meeting_to_response(m: dict) -> MeetingResponse:
    segments = [
        MeetingSegmentResponse(
            id=seg["id"],
            meeting_id=seg["meeting_id"],
            text=seg["text"],
            start_time=seg.get("start_time"),
            selected=seg.get("selected", False),
            context_note=seg.get("context_note", ""),
            curated_by=seg.get("curated_by"),
            curated_at=seg.get("curated_at"),
        )
        for seg in m.get("segments", [])
    ]
    return MeetingResponse(
        id=m["id"],
        client_id=m["client_id"],
        title=m["title"],
        meet_link=m.get("meet_link"),
        transcript=m["transcript"],
        status=m["status"],
        created_by=m["created_by"],
        created_at=m["created_at"],
        updated_at=m["updated_at"],
        duration_minutes=m.get("duration_minutes"),
        participants=m.get("participants"),
        segments=segments,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/")
async def list_meetings(
    status: Optional[str] = None,
    x_client_id: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> MeetingListResponse:
    """List meetings for the current client.

    Filtered by client_id from X-Client-ID header (Phase 21 stub).
    """
    client_id = _get_client_id(x_client_id)
    items = repository.list_meetings(session, client_id, status)
    return MeetingListResponse(
        meetings=[_meeting_to_response(m) for m in items],
        total=len(items),
    )


@router.post("/", status_code=201)
async def create_meeting(
    req: MeetingCreate,
    x_client_id: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> MeetingResponse:
    """Create a new meeting (opt-in). source_type = UPLOAD only in Phase 21."""
    client_id = _get_client_id(x_client_id)
    if req.client_id != client_id and client_id != "default":
        # Cross-client guard: 404 not 403 (caixa-preta, RN-011)
        raise HTTPException(status_code=404, detail="Reuniao nao encontrada")

    segments = _split_transcript_into_segments("seg", req.transcript)
    meeting = repository.create_meeting(
        session,
        client_id=req.client_id,
        title=req.title,
        transcript=req.transcript,
        meet_link=req.meet_link,
        duration_minutes=req.duration_minutes,
        participants=req.participants,
        created_by="admin",  # TODO: resolve from JWT
        segments=segments,
    )
    return _meeting_to_response(meeting)


@router.get("/{meeting_id}")
async def get_meeting(
    meeting_id: str,
    x_client_id: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> MeetingResponse:
    """Get meeting detail with transcript and segments.

    Returns 404 for meetings belonging to other clients (caixa-preta, RN-011).
    """
    client_id = _get_client_id(x_client_id)
    meeting = repository.get_meeting(session, meeting_id, client_id)
    if meeting is None:
        raise HTTPException(status_code=404, detail="Reuniao nao encontrada")
    return _meeting_to_response(meeting)


@router.post("/{meeting_id}/curate")
async def curate_meeting(
    meeting_id: str,
    req: CurateRequest,
    x_client_id: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> CurateResponse:
    """Save selected segments for Wiki review (HITL pre-step).

    Marks status as 'curated'. HITL review before actual Wiki merge is
    mandatory per SPEC-016 constitution §1.4 — this endpoint only signals
    readiness for review, not direct insertion into the knowledge base.
    """
    client_id = _get_client_id(x_client_id)
    segment_updates = {
        s.id: {"selected": s.selected, "context_note": s.context_note} for s in req.segments
    }
    meeting = repository.curate_meeting(
        session,
        meeting_id=meeting_id,
        client_id=client_id,
        segment_updates=segment_updates,
        curated_by="admin",  # TODO: resolve from JWT
    )
    if meeting is None:
        raise HTTPException(status_code=404, detail="Reuniao nao encontrada")

    selected_segments = [s for s in meeting["segments"] if s.get("selected")]
    selected_count = len(selected_segments)

    # FA-15: Feed selected segments into client's Oráculo Briefings context
    if _ORACULO_AVAILABLE and selected_count > 0:
        try:
            add_reunion_context_to_oraculo(
                client_id=meeting["client_id"],
                meeting_id=meeting_id,
                selected_segments=selected_segments,
            )
        except Exception:
            # Oráculo enrichment is best-effort — never blocks curation response
            logger.warning(
                "FA-15: failed to add reunion %s context to oráculo (non-fatal)",
                meeting_id,
            )

    return CurateResponse(
        meeting_id=meeting_id,
        selected_count=selected_count,
        status="curated",
        message=(
            f"{selected_count} trecho(s) enviado(s) para revisao HITL "
            "antes de entrar na Biblioteca."
        ),
    )


@router.patch("/{meeting_id}")
async def update_meeting_status(
    meeting_id: str,
    req: MeetingUpdate,
    x_client_id: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> MeetingResponse:
    """Update meeting status (e.g. archive)."""
    client_id = _get_client_id(x_client_id)
    if req.status is None:
        meeting = repository.get_meeting(session, meeting_id, client_id)
    else:
        meeting = repository.update_status(session, meeting_id, client_id, req.status)
    if meeting is None:
        raise HTTPException(status_code=404, detail="Reuniao nao encontrada")
    return _meeting_to_response(meeting)
