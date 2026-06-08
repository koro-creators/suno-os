"""
Graph Runner -- executes the sunOS chat LangGraph.

Two modes:
1. run_chat() -- full invoke, returns complete response (for non-streaming)
2. run_chat_stream() -- async generator yielding SSE events

Phase 11 addition: best-effort conversation persistence after each stream
completes.  Failures are caught and logged — they never interrupt the user.
"""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, AsyncGenerator

from langchain_core.messages import AIMessage, HumanMessage
from sqlalchemy import text

from chat.conversations.router import _memory_store
from chat.graph.builder import build_chat_graph
from chat.graph.state import SunosChatState
from config import settings
from core.db import get_sync_session

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model map
# ---------------------------------------------------------------------------

MODEL_MAP: dict[str, str] = {
    "gemini-flash": "gemini-2.5-flash",
    "gemini-pro": "gemini-2.5-pro",
    "gpt-4o": "gpt-4o",
    "claude": "claude-sonnet-4",
}


def _get_llm(model: str = "gemini-flash", temperature: float = 0.7) -> Any:
    """Instantiate the appropriate LangChain LLM based on model name.

    Falls back to Gemini Flash if the requested model's API key is not configured.
    """
    model_id = MODEL_MAP.get(model, "gemini-2.5-flash")

    if model_id.startswith("gpt") and settings.OPENAI_API_KEY:
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=model_id,
            temperature=temperature,
            api_key=settings.OPENAI_API_KEY,
        )
    elif model_id.startswith("claude") and settings.ANTHROPIC_API_KEY:
        from langchain_anthropic import ChatAnthropic

        return ChatAnthropic(
            model=model_id,
            temperature=temperature,
            api_key=settings.ANTHROPIC_API_KEY,
        )
    elif model_id.startswith("gemini") and settings.GOOGLE_API_KEY:
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model=model_id,
            temperature=temperature,
            google_api_key=settings.GOOGLE_API_KEY,
        )

    # Fallback: always use Gemini Flash if available
    if settings.GOOGLE_API_KEY:
        if model != "gemini-flash":
            logger.warning(
                "API key for model '%s' not configured, falling back to Gemini Flash", model
            )
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=temperature,
            google_api_key=settings.GOOGLE_API_KEY,
        )

    raise ValueError("No LLM API key configured. Set GOOGLE_API_KEY in .env")


# ---------------------------------------------------------------------------
# SSE Event
# ---------------------------------------------------------------------------


@dataclass
class SSEEvent:
    """Server-Sent Event payload for streaming responses."""

    event: str  # "text", "sources", "tool_call", "tool_result", "done", "error"
    data: dict = field(default_factory=dict)

    def to_sse(self) -> str:
        """Serialize to SSE wire format."""
        return f"event: {self.event}\ndata: {json.dumps(self.data, ensure_ascii=False)}\n\n"


# ---------------------------------------------------------------------------
# Initial state builder
# ---------------------------------------------------------------------------


def _build_initial_state(
    message: str,
    skill_slug: str = "conversation",
    conversation_id: str | None = None,
    model: str = "gemini-flash",
    temperature: float = 0.7,
    max_tokens: int = 4096,
    system_prompt: str | None = None,
    context_documents: list[str] | None = None,
    web_search: bool = False,
    history: list[Any] | None = None,
) -> SunosChatState:
    """Construct the initial SunosChatState for a new turn.

    `history` carries prior turns (already trimmed to MAX_HISTORY_MESSAGES) so
    the agent has memory of the conversation — it is prepended to the new
    HumanMessage rather than replacing it.
    """
    conv_id = conversation_id or str(uuid.uuid4())

    return SunosChatState(
        messages=[*(history or []), HumanMessage(content=message)],
        current_intent="",
        current_agent="",
        active_skill=skill_slug if skill_slug != "conversation" else None,
        skill_references=[],
        context_documents=context_documents or [],
        system_prompt=system_prompt,
        conversation_id=conv_id,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        web_search=web_search,
        generated_images=[],
        generated_texts=[],
    )


# ---------------------------------------------------------------------------
# Conversation memory — load prior turns so the agent has context
# ---------------------------------------------------------------------------

# Bounds how many prior messages are replayed into the LLM each turn, to keep
# token usage predictable as conversations grow.
MAX_HISTORY_MESSAGES = 20


async def _load_conversation_history(conversation_id: str | None) -> list[Any]:
    """Load prior turns for `conversation_id` as LangChain messages.

    Best-effort and symmetric to `_persist_conversation`: tries the
    `conversations.messages` JSONB column first, falls back to the in-memory
    store, and returns [] (never raises) for new or unknown conversations so a
    cold cache never breaks the chat.
    """
    if not conversation_id:
        return []

    def _sync_load() -> list[dict] | None:
        try:
            db = get_sync_session()
            try:
                row = db.execute(
                    text("SELECT messages FROM conversations WHERE id = :id"),
                    {"id": conversation_id},
                ).first()
                return row[0] if row else None
            finally:
                db.close()
        except Exception as db_exc:
            logger.debug("DB history load failed for conversation %s: %s", conversation_id, db_exc)
            return None

    raw_messages = await asyncio.to_thread(_sync_load)

    if raw_messages is None:
        cached = _memory_store.get(conversation_id)
        raw_messages = cached.get("messages", []) if cached else []

    history: list[Any] = []
    for idx, entry in enumerate(raw_messages[-MAX_HISTORY_MESSAGES:]):
        role = entry.get("role")
        content = entry.get("content", "")
        # Stable, deterministic id (preserved by LangGraph's add_messages reducer)
        # so the streaming loop can recognize these as already-seen and skip
        # re-emitting them as new "text" events — see seen_message_ids below.
        msg_id = f"hist-{conversation_id}-{idx}"
        if role == "user":
            history.append(HumanMessage(content=content, id=msg_id))
        elif role == "assistant":
            history.append(AIMessage(content=content, id=msg_id))

    return history


# ---------------------------------------------------------------------------
# Conversation persistence (best-effort, Phase 11)
# ---------------------------------------------------------------------------


async def _persist_conversation(
    conversation_id: str,
    skill_slug: str,
    user_message: str,
    assistant_message: str,
) -> None:
    """Upsert the human + assistant turn into persistent storage.

    This is intentionally best-effort: any exception is caught and logged
    so it never interrupts the streaming response reaching the client.

    Strategy:
      1. Try PostgreSQL via SQLAlchemy (sync, wrapped in asyncio.to_thread).
      2. Fall back to the in-memory store in chat.conversations.router so the
         data survives at least for the duration of the process.
    """
    now = datetime.now(timezone.utc)
    new_messages = [
        {"role": "user", "content": user_message, "timestamp": now.isoformat()},
        {"role": "assistant", "content": assistant_message, "timestamp": now.isoformat()},
    ]

    def _sync_persist() -> bool:
        """Run DB upsert synchronously (called inside asyncio.to_thread)."""
        try:
            db = get_sync_session()
            try:
                # Upsert: append new messages to the JSONB column (migration 004).
                # Uses a raw SQL statement for JSONB concatenation to avoid
                # loading the full array into Python on every turn.
                db.execute(
                    text(
                        """
                        INSERT INTO conversations
                            (id, user_id, skill_slug, messages, created_at, last_message_at)
                        VALUES (:id, :user_id, :skill_slug, CAST(:messages AS jsonb), :now, :now)
                        ON CONFLICT (id) DO UPDATE
                        SET messages = conversations.messages || CAST(:messages AS jsonb),
                            last_message_at = :now
                        """
                    ),
                    {
                        "id": conversation_id,
                        "user_id": "anonymous",  # replaced when auth wired up
                        "skill_slug": skill_slug,
                        "messages": json.dumps(new_messages),
                        "now": now,
                    },
                )
                db.commit()
                return True
            finally:
                db.close()
        except Exception as db_exc:
            logger.debug("DB persist failed for conversation %s: %s", conversation_id, db_exc)
            return False

    persisted_to_db = await asyncio.to_thread(_sync_persist)

    if not persisted_to_db:
        # Fallback: write into the in-memory store so GET /conversations works
        # within the same process even without a DB.
        try:
            existing = _memory_store.get(conversation_id, {})
            existing_messages: list[dict] = list(existing.get("messages", []))
            existing_messages.extend(new_messages)
            _memory_store[conversation_id] = {
                "id": conversation_id,
                "user_id": existing.get("user_id", "anonymous"),
                "skill_slug": skill_slug,
                "title": existing.get("title"),
                "created_at": existing.get("created_at", now),
                "last_message_at": now,
                "messages": existing_messages,
            }
        except Exception as mem_exc:
            logger.warning(
                "In-memory persist also failed for conversation %s: %s",
                conversation_id,
                mem_exc,
            )


# ---------------------------------------------------------------------------
# Streaming runner
# ---------------------------------------------------------------------------


async def run_chat_stream(
    message: str,
    skill_slug: str = "conversation",
    conversation_id: str | None = None,
    model: str = "gemini-flash",
    temperature: float = 0.7,
    max_tokens: int = 4096,
    system_prompt: str | None = None,
    context_documents: list[str] | None = None,
    web_search: bool = False,
) -> AsyncGenerator[SSEEvent, None]:
    """Execute the chat graph with SSE streaming.

    Yields SSEEvent objects for each meaningful chunk from the graph.
    After the stream completes, attempts best-effort persistence of the
    conversation turn (user message + assistant response) to the database.
    """
    history = await _load_conversation_history(conversation_id)

    state = _build_initial_state(
        message=message,
        skill_slug=skill_slug,
        conversation_id=conversation_id,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        system_prompt=system_prompt,
        context_documents=context_documents,
        web_search=web_search,
        history=history,
    )

    conv_id = state["conversation_id"]
    llm = _get_llm(model, temperature)

    # Build agents -- lazy import to avoid circular deps
    agents: dict[str, Any] = {}
    try:
        from chat.agents.content_creator import ContentCreatorAgent

        agents["content_creator"] = ContentCreatorAgent(llm=llm)
    except ImportError:
        logger.warning("ContentCreatorAgent not available yet")

    try:
        from chat.agents.conversational import ConversationalAgent

        agents["conversational"] = ConversationalAgent(llm=llm)
    except ImportError:
        logger.warning("ConversationalAgent not available yet")

    graph = build_chat_graph(llm, agents)

    # Pre-seed with AIMessages already in the initial state (replayed history)
    # so the loop below only streams genuinely new responses — otherwise every
    # past assistant turn would be re-emitted as "text" on each new message.
    seen_message_ids: set[str] = {
        getattr(msg, "id", None) or id(msg)
        for msg in state.get("messages", [])
        if isinstance(msg, AIMessage)
    }
    collected_text_parts: list[str] = []  # Phase 11: accumulate for persistence

    try:
        async for chunk in graph.astream(state, config={"recursion_limit": 20}):
            # chunk is a dict of node_name -> state update
            for node_name, node_state in chunk.items():
                messages = node_state.get("messages", [])
                for msg in messages:
                    if not isinstance(msg, AIMessage):
                        continue
                    # Deduplicate by message id
                    msg_id = getattr(msg, "id", None) or id(msg)
                    if msg_id in seen_message_ids:
                        continue
                    seen_message_ids.add(msg_id)

                    # Check for tool calls
                    tool_calls = getattr(msg, "tool_calls", None) or []
                    if tool_calls:
                        for tc in tool_calls:
                            yield SSEEvent(
                                event="tool_call",
                                data={
                                    "tool": tc.get("name", ""),
                                    "args": tc.get("args", {}),
                                    "id": tc.get("id", ""),
                                },
                            )
                    # Yield text content
                    if msg.content:
                        content = msg.content
                        # Handle content that may be a list of dicts (Gemini format)
                        if isinstance(content, list):
                            text_parts = []
                            for part in content:
                                if isinstance(part, dict) and "text" in part:
                                    text_parts.append(part["text"])
                                elif isinstance(part, str):
                                    text_parts.append(part)
                            content = "".join(text_parts)
                        collected_text_parts.append(content)
                        yield SSEEvent(
                            event="text",
                            data={"content": content},
                        )

        yield SSEEvent(
            event="done",
            data={"conversation_id": conv_id, "tokens_used": 0},
        )

        # Phase 11: best-effort persistence — never raises to caller
        try:
            full_assistant_response = "".join(collected_text_parts)
            if full_assistant_response:
                asyncio.ensure_future(
                    _persist_conversation(
                        conversation_id=conv_id,
                        skill_slug=skill_slug,
                        user_message=message,
                        assistant_message=full_assistant_response,
                    )
                )
        except Exception as persist_exc:
            logger.warning(
                "Failed to schedule conversation persistence for %s: %s",
                conv_id,
                persist_exc,
            )

    except Exception as exc:
        logger.error("run_chat_stream error: %s", exc, exc_info=True)
        yield SSEEvent(
            event="error",
            data={"message": str(exc)},
        )


# ---------------------------------------------------------------------------
# Non-streaming runner
# ---------------------------------------------------------------------------


async def run_chat(
    message: str,
    skill_slug: str = "conversation",
    conversation_id: str | None = None,
    model: str = "gemini-flash",
    temperature: float = 0.7,
    max_tokens: int = 4096,
    system_prompt: str | None = None,
    context_documents: list[str] | None = None,
    web_search: bool = False,
) -> dict[str, Any]:
    """Execute the chat graph and return the final response.

    Collects all streaming events and returns a consolidated result.
    """
    final_text_parts: list[str] = []
    tool_calls: list[dict] = []
    conv_id = conversation_id
    error: str | None = None

    async for event in run_chat_stream(
        message=message,
        skill_slug=skill_slug,
        conversation_id=conversation_id,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        system_prompt=system_prompt,
        context_documents=context_documents,
        web_search=web_search,
    ):
        if event.event == "text":
            final_text_parts.append(event.data.get("content", ""))
        elif event.event == "tool_call":
            tool_calls.append(event.data)
        elif event.event == "done":
            conv_id = event.data.get("conversation_id", conv_id)
        elif event.event == "error":
            error = event.data.get("message", "Unknown error")

    return {
        "text": "".join(final_text_parts),
        "conversation_id": conv_id,
        "tool_calls": tool_calls,
        "error": error,
    }
