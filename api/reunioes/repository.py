"""Repository de reuniões (SPEC-016 / A-7).

Lógica SQLAlchemy pura para `meetings` + `meeting_segments`. Caixa-preta:
toda leitura/escrita filtra por `client_id` (RN-010). Retorna dicts no mesmo
shape do antigo store in-memory, para o router montar os schemas sem mudança.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

try:
    from models.meetings import Meeting, MeetingSegment
except ImportError:  # test import root (repo root on sys.path)
    from api.models.meetings import Meeting, MeetingSegment


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _coerce_id(meeting_id: str) -> uuid.UUID | None:
    """Path params chegam como str; UUID inválido vira None → 404 caixa-preta."""
    try:
        return uuid.UUID(str(meeting_id))
    except (ValueError, TypeError):
        return None


def _segment_to_dict(seg: MeetingSegment) -> dict:
    return {
        "id": str(seg.id),
        "meeting_id": str(seg.meeting_id),
        "text": seg.text,
        "start_time": seg.start_time,
        "selected": seg.selected,
        "context_note": seg.context_note or "",
        "curated_by": seg.curated_by,
        "curated_at": seg.curated_at,
    }


def _meeting_to_dict(m: Meeting) -> dict:
    return {
        "id": str(m.id),
        "client_id": m.client_id,
        "title": m.title,
        "meet_link": m.meet_link,
        "transcript": m.transcript,
        "status": m.status,
        "created_by": m.created_by,
        "created_at": m.created_at,
        "updated_at": m.updated_at,
        "duration_minutes": m.duration_minutes,
        "participants": m.participants,
        "segments": [_segment_to_dict(s) for s in m.segments],
    }


def list_meetings(session: Session, client_id: str, status: str | None = None) -> list[dict]:
    query = session.query(Meeting).filter(Meeting.client_id == client_id)
    if status:
        query = query.filter(Meeting.status == status)
    meetings = query.order_by(Meeting.created_at.desc()).all()
    return [_meeting_to_dict(m) for m in meetings]


def get_meeting(session: Session, meeting_id: str, client_id: str) -> dict | None:
    """Caixa-preta: filtra client_id na query. Retorna None se não achar."""
    mid = _coerce_id(meeting_id)
    if mid is None:
        return None
    meeting = (
        session.query(Meeting).filter(Meeting.id == mid, Meeting.client_id == client_id).first()
    )
    return _meeting_to_dict(meeting) if meeting else None


def create_meeting(
    session: Session,
    *,
    client_id: str,
    title: str,
    transcript: str,
    meet_link: str | None,
    duration_minutes: int | None,
    participants: list | None,
    created_by: str,
    segments: list[dict],
) -> dict:
    meeting = Meeting(
        id=uuid.uuid4(),
        client_id=client_id,
        title=title,
        meet_link=meet_link,
        transcript=transcript,
        status="pending_review",
        duration_minutes=duration_minutes,
        participants=participants,
        created_by=created_by,
    )
    session.add(meeting)
    for seg in segments:
        session.add(
            MeetingSegment(
                id=uuid.uuid4(),
                meeting_id=meeting.id,
                client_id=client_id,  # gap fix: denormaliza client_id no segment
                text=seg["text"],
                start_time=seg.get("start_time"),
                selected=False,
                context_note="",
            )
        )
    session.commit()
    session.refresh(meeting)
    return _meeting_to_dict(meeting)


def curate_meeting(
    session: Session,
    *,
    meeting_id: str,
    client_id: str,
    segment_updates: dict[str, dict],
    curated_by: str,
) -> dict | None:
    """Aplica seleção/nota aos segmentos e marca a reunião como 'curated'.

    `segment_updates`: {segment_id: {"selected": bool, "context_note": str}}.
    """
    mid = _coerce_id(meeting_id)
    if mid is None:
        return None
    meeting = (
        session.query(Meeting).filter(Meeting.id == mid, Meeting.client_id == client_id).first()
    )
    if meeting is None:
        return None

    now = _now()
    for seg in meeting.segments:
        upd = segment_updates.get(str(seg.id))
        if upd:
            seg.selected = upd["selected"]
            seg.context_note = upd.get("context_note", "")
            seg.curated_by = curated_by
            seg.curated_at = now
    meeting.status = "curated"
    session.commit()
    session.refresh(meeting)
    return _meeting_to_dict(meeting)


def update_status(session: Session, meeting_id: str, client_id: str, status: str) -> dict | None:
    mid = _coerce_id(meeting_id)
    if mid is None:
        return None
    meeting = (
        session.query(Meeting).filter(Meeting.id == mid, Meeting.client_id == client_id).first()
    )
    if meeting is None:
        return None
    meeting.status = status
    session.commit()
    session.refresh(meeting)
    return _meeting_to_dict(meeting)
