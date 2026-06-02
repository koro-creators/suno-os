"""Pydantic v2 schemas for the Meetings (Reunioes) module — SPEC-016 Phase 21."""

from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Enums / literals
# ---------------------------------------------------------------------------

MeetingStatus = Literal["pending_review", "curated", "archived"]


# ---------------------------------------------------------------------------
# Segment
# ---------------------------------------------------------------------------


class MeetingSegmentResponse(BaseModel):
    id: str
    meeting_id: str
    text: str
    start_time: Optional[str] = None  # HH:MM:SS
    selected: bool = False
    context_note: str = ""
    curated_by: Optional[str] = None
    curated_at: Optional[datetime] = None


class SegmentCurateItem(BaseModel):
    id: str
    selected: bool
    context_note: str = ""


# ---------------------------------------------------------------------------
# Meeting
# ---------------------------------------------------------------------------


class MeetingCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    client_id: str = Field(..., min_length=1)
    meet_link: Optional[str] = None
    transcript: str = Field(..., min_length=1)
    duration_minutes: Optional[int] = Field(None, ge=1, le=720)
    participants: Optional[list[str]] = None


class MeetingUpdate(BaseModel):
    status: Optional[MeetingStatus] = None


class MeetingResponse(BaseModel):
    id: str
    client_id: str
    title: str
    meet_link: Optional[str] = None
    transcript: str
    status: MeetingStatus
    created_by: str
    created_at: datetime
    updated_at: datetime
    duration_minutes: Optional[int] = None
    participants: Optional[list[str]] = None
    segments: list[MeetingSegmentResponse] = []


class MeetingListResponse(BaseModel):
    meetings: list[MeetingResponse]
    total: int


# ---------------------------------------------------------------------------
# Curation
# ---------------------------------------------------------------------------


class CurateRequest(BaseModel):
    segments: list[SegmentCurateItem]


class CurateResponse(BaseModel):
    meeting_id: str
    selected_count: int
    status: MeetingStatus
    message: str
