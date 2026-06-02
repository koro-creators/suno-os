"""FastAPI router for Meetings (Reunioes) endpoints — SPEC-016 Phase 21.

Caixa-preta: all queries filter by client_id from request context (stubbed as
X-Client-ID header for Phase 21). Cross-client requests return 404, never 403.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Header, HTTPException

from .schemas import (
    CurateRequest,
    CurateResponse,
    MeetingCreate,
    MeetingListResponse,
    MeetingResponse,
    MeetingSegmentResponse,
    MeetingUpdate,
)

# FA-15: Oráculo integration (graceful guard — silently disabled if onboarding not present)
try:
    from onboarding.service import add_reunion_context_to_oraculo

    _ORACULO_AVAILABLE = True
except ImportError:
    _ORACULO_AVAILABLE = False

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Meetings"])

# ---------------------------------------------------------------------------
# In-memory store (Phase 21 stub — replace with DB in Phase D)
# ---------------------------------------------------------------------------
_meetings: dict[str, dict] = {}


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


def _require_meeting(meeting_id: str, client_id: str) -> dict:
    """Fetch meeting by ID, applying caixa-preta cross-client guard (RN-010/011).

    Returns 404 regardless of whether the meeting exists or belongs to another
    client — never distinguishes the two cases to the caller.
    """
    meeting = _meetings.get(meeting_id)
    if not meeting or meeting["client_id"] != client_id:
        raise HTTPException(status_code=404, detail="Reuniao nao encontrada")
    return meeting


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
) -> MeetingListResponse:
    """List meetings for the current client.

    Filtered by client_id from X-Client-ID header (Phase 21 stub).
    """
    client_id = _get_client_id(x_client_id)
    items = [m for m in _meetings.values() if m["client_id"] == client_id]
    if status:
        items = [m for m in items if m["status"] == status]
    items.sort(key=lambda m: m["created_at"], reverse=True)
    return MeetingListResponse(
        meetings=[_meeting_to_response(m) for m in items],
        total=len(items),
    )


@router.post("/", status_code=201)
async def create_meeting(
    req: MeetingCreate,
    x_client_id: Optional[str] = Header(default=None),
) -> MeetingResponse:
    """Create a new meeting (opt-in). source_type = UPLOAD only in Phase 21."""
    client_id = _get_client_id(x_client_id)
    if req.client_id != client_id and client_id != "default":
        # Cross-client guard: 404 not 403 (caixa-preta, RN-011)
        raise HTTPException(status_code=404, detail="Reuniao nao encontrada")

    now = _now()
    meeting_id = str(uuid.uuid4())
    segments = _split_transcript_into_segments(meeting_id, req.transcript)

    meeting: dict = {
        "id": meeting_id,
        "client_id": req.client_id,
        "title": req.title,
        "meet_link": req.meet_link,
        "transcript": req.transcript,
        "status": "pending_review",
        "created_by": "admin",  # TODO: resolve from JWT
        "created_at": now,
        "updated_at": now,
        "duration_minutes": req.duration_minutes,
        "participants": req.participants,
        "segments": segments,
    }

    _meetings[meeting_id] = meeting
    return _meeting_to_response(meeting)


@router.get("/{meeting_id}")
async def get_meeting(
    meeting_id: str,
    x_client_id: Optional[str] = Header(default=None),
) -> MeetingResponse:
    """Get meeting detail with transcript and segments.

    Returns 404 for meetings belonging to other clients (caixa-preta, RN-011).
    """
    client_id = _get_client_id(x_client_id)
    meeting = _require_meeting(meeting_id, client_id)
    return _meeting_to_response(meeting)


@router.post("/{meeting_id}/curate")
async def curate_meeting(
    meeting_id: str,
    req: CurateRequest,
    x_client_id: Optional[str] = Header(default=None),
) -> CurateResponse:
    """Save selected segments for Wiki review (HITL pre-step).

    Marks status as 'curated'. HITL review before actual Wiki merge is
    mandatory per SPEC-016 constitution §1.4 — this endpoint only signals
    readiness for review, not direct insertion into the knowledge base.
    """
    client_id = _get_client_id(x_client_id)
    meeting = _require_meeting(meeting_id, client_id)

    now = _now()
    segment_updates = {s.id: s for s in req.segments}
    updated_segments = []
    for seg in meeting.get("segments", []):
        update = segment_updates.get(seg["id"])
        if update:
            updated_segments.append(
                {
                    **seg,
                    "selected": update.selected,
                    "context_note": update.context_note,
                    "curated_by": "admin",  # TODO: resolve from JWT
                    "curated_at": now,
                }
            )
        else:
            updated_segments.append(seg)

    meeting["segments"] = updated_segments
    meeting["status"] = "curated"
    meeting["updated_at"] = now

    selected_count = sum(1 for s in updated_segments if s.get("selected"))

    # FA-15: Feed selected segments into client's Oráculo Briefings context
    if _ORACULO_AVAILABLE and selected_count > 0:
        try:
            add_reunion_context_to_oraculo(
                client_id=meeting["client_id"],
                meeting_id=meeting_id,
                selected_segments=updated_segments,
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
) -> MeetingResponse:
    """Update meeting status (e.g. archive)."""
    client_id = _get_client_id(x_client_id)
    meeting = _require_meeting(meeting_id, client_id)

    if req.status is not None:
        meeting["status"] = req.status
    meeting["updated_at"] = _now()
    return _meeting_to_response(meeting)
