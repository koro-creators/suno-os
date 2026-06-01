"""
Conversations router — Phase 11 persistence endpoints.

GET /api/conversations          List conversations for the authenticated user.
GET /api/conversations/{id}     Retrieve a single conversation with its messages.

Security (caixa-preta / RN-009):
  - Unauthorized requests receive 401.
  - Requests for a conversation that does not belong to the current user receive
    404 (NOT 403) — the caller must not be able to infer the existence of other
    users' conversations.
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel

from core.auth import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/conversations", tags=["Conversations"])


# Dependency de usuário: JWT Firebase em produção; X-User-ID apenas como
# fallback dev/teste — ver core/auth.py.


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class ConversationSummary(BaseModel):
    """Lightweight conversation record for list responses."""

    id: str
    skill_slug: str | None
    title: str | None
    last_message_at: datetime | None
    message_count: int


class MessageRecord(BaseModel):
    """A single chat message."""

    role: str
    content: str
    timestamp: datetime | None = None
    agent_name: str | None = None


class ConversationDetail(BaseModel):
    """Full conversation record including messages."""

    id: str
    skill_slug: str | None
    title: str | None
    created_at: datetime | None
    last_message_at: datetime | None
    messages: list[MessageRecord]


class ConversationListResponse(BaseModel):
    items: list[ConversationSummary]
    total: int


# ---------------------------------------------------------------------------
# In-memory fallback store (used when DB is not available)
# ---------------------------------------------------------------------------

# The in-memory store lives here so the router can be imported without a running
# PostgreSQL instance.  The runner writes to this dict when DB is unavailable.
_memory_store: dict[str, dict] = {}


def _store_conversation_memory(
    conversation_id: str,
    user_id: str,
    skill_slug: str | None,
    messages: list[dict],
) -> None:
    """Upsert a conversation into the in-memory fallback store."""
    import datetime as _dt

    existing = _memory_store.get(conversation_id, {})
    _memory_store[conversation_id] = {
        "id": conversation_id,
        "user_id": user_id,
        "skill_slug": skill_slug,
        "title": existing.get("title"),
        "created_at": existing.get("created_at", _dt.datetime.now(_dt.timezone.utc)),
        "last_message_at": _dt.datetime.now(_dt.timezone.utc),
        "messages": messages,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


def _get_db_session():
    """Yield a SQLAlchemy session. Returns None when DB is not reachable."""
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        from config import settings

        engine = create_engine(
            settings.DATABASE_URL.replace("+asyncpg", ""),
            pool_pre_ping=True,
            connect_args={"connect_timeout": 3},
        )
        Session = sessionmaker(bind=engine)
        session = Session()
        try:
            yield session
        finally:
            session.close()
    except Exception as exc:
        logger.debug("DB not available, using in-memory store: %s", exc)
        yield None


@router.get("", response_model=ConversationListResponse)
async def list_conversations(
    skill_slug: str | None = Query(default=None, description="Filter by skill slug"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user_id: str = Depends(get_current_user_id),
) -> ConversationListResponse:
    """List conversations for the authenticated user.

    Supports optional filtering by ``skill_slug`` and pagination via
    ``limit`` / ``offset``.
    """
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        from config import settings
        from models.conversation import Conversation

        engine = create_engine(
            settings.DATABASE_URL.replace("+asyncpg", ""),
            pool_pre_ping=True,
            connect_args={"connect_timeout": 3},
        )
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()

        try:
            query = db.query(Conversation).filter(Conversation.user_id == user_id)
            if skill_slug:
                query = query.filter(Conversation.skill_slug == skill_slug)

            total = query.count()
            conversations = (
                query.order_by(Conversation.last_message_at.desc().nullslast())
                .offset(offset)
                .limit(limit)
                .all()
            )

            items = [
                ConversationSummary(
                    id=conv.id,
                    skill_slug=conv.skill_slug,
                    title=conv.title,
                    last_message_at=conv.last_message_at,
                    message_count=len(conv.messages) if conv.messages else 0,
                )
                for conv in conversations
            ]
            return ConversationListResponse(items=items, total=total)
        finally:
            db.close()

    except Exception as exc:
        logger.warning("DB unavailable for list_conversations, using memory store: %s", exc)

    # Fallback: in-memory store
    user_convs = [
        v
        for v in _memory_store.values()
        if v.get("user_id") == user_id and (skill_slug is None or v.get("skill_slug") == skill_slug)
    ]
    user_convs.sort(key=lambda c: c.get("last_message_at") or 0, reverse=True)
    total = len(user_convs)
    page = user_convs[offset : offset + limit]

    items = [
        ConversationSummary(
            id=c["id"],
            skill_slug=c.get("skill_slug"),
            title=c.get("title"),
            last_message_at=c.get("last_message_at"),
            message_count=len(c.get("messages", [])),
        )
        for c in page
    ]
    return ConversationListResponse(items=items, total=total)


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
) -> ConversationDetail:
    """Retrieve a conversation with full message history.

    Returns 404 for both "not found" and "belongs to another user" cases
    (caixa-preta pattern — RN-009/010).
    """
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        from config import settings
        from models.conversation import Conversation

        engine = create_engine(
            settings.DATABASE_URL.replace("+asyncpg", ""),
            pool_pre_ping=True,
            connect_args={"connect_timeout": 3},
        )
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()

        try:
            # Filter by both id AND user_id — single query, no 403 information leak
            conv = (
                db.query(Conversation)
                .filter(
                    Conversation.id == conversation_id,
                    Conversation.user_id == user_id,
                )
                .first()
            )

            if conv is None:
                raise HTTPException(status_code=404, detail="Conversation not found")

            # Prefer the chat_messages relationship (normalized history,
            # already ordered by created_at). Fall back to the legacy JSONB
            # `messages` column for conversations persisted before the
            # chat_messages swap.
            raw_messages: list[dict] = []
            if conv.messages:
                for msg in conv.messages:
                    raw_messages.append(
                        {
                            "role": msg.role,
                            "content": msg.content,
                            "timestamp": msg.created_at.isoformat() if msg.created_at else None,
                            "agent_name": msg.agent_name,
                        }
                    )
            elif hasattr(conv, "messages_json") and conv.messages_json:
                raw_messages = conv.messages_json

            message_records = [
                MessageRecord(
                    role=m.get("role", "unknown"),
                    content=m.get("content", ""),
                    timestamp=m.get("timestamp"),
                    agent_name=m.get("agent_name"),
                )
                for m in raw_messages
            ]

            return ConversationDetail(
                id=conv.id,
                skill_slug=conv.skill_slug,
                title=conv.title,
                created_at=conv.created_at,
                last_message_at=conv.last_message_at,
                messages=message_records,
            )
        finally:
            db.close()

    except HTTPException:
        raise
    except Exception as exc:
        logger.warning(
            "DB unavailable for get_conversation %s, using memory store: %s",
            conversation_id,
            exc,
        )

    # Fallback: in-memory store
    entry = _memory_store.get(conversation_id)
    if entry is None or entry.get("user_id") != user_id:
        # Caixa-preta: 404 regardless of reason
        raise HTTPException(status_code=404, detail="Conversation not found")

    message_records = [
        MessageRecord(
            role=m.get("role", "unknown"),
            content=m.get("content", ""),
            timestamp=m.get("timestamp"),
            agent_name=m.get("agent_name"),
        )
        for m in entry.get("messages", [])
    ]

    return ConversationDetail(
        id=entry["id"],
        skill_slug=entry.get("skill_slug"),
        title=entry.get("title"),
        created_at=entry.get("created_at"),
        last_message_at=entry.get("last_message_at"),
        messages=message_records,
    )
