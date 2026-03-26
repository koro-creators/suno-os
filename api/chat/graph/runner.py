"""
Graph Runner -- executes the sunOS chat LangGraph.

Two modes:
1. run_chat() -- full invoke, returns complete response (for non-streaming)
2. run_chat_stream() -- async generator yielding SSE events
"""

from __future__ import annotations

import json
import logging
import uuid
from dataclasses import dataclass, field
from typing import Any, AsyncGenerator

from langchain_core.messages import AIMessage, HumanMessage

from chat.graph.builder import build_chat_graph
from chat.graph.state import SunosChatState
from config import settings

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
    """Instantiate the appropriate LangChain LLM based on model name."""
    model_id = MODEL_MAP.get(model, "gemini-2.5-flash")

    if model_id.startswith("gemini"):
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model=model_id,
            temperature=temperature,
            google_api_key=settings.GOOGLE_API_KEY,
        )
    elif model_id.startswith("gpt"):
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=model_id,
            temperature=temperature,
            api_key=settings.OPENAI_API_KEY,
        )
    elif model_id.startswith("claude"):
        from langchain_anthropic import ChatAnthropic

        return ChatAnthropic(
            model=model_id,
            temperature=temperature,
            api_key=settings.ANTHROPIC_API_KEY,
        )

    # Fallback
    from langchain_google_genai import ChatGoogleGenerativeAI

    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=temperature,
        google_api_key=settings.GOOGLE_API_KEY,
    )


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
) -> SunosChatState:
    """Construct the initial SunosChatState for a new turn."""
    conv_id = conversation_id or str(uuid.uuid4())

    return SunosChatState(
        messages=[HumanMessage(content=message)],
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
    """
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

    try:
        async for chunk in graph.astream(state, config={"recursion_limit": 20}):
            # chunk is a dict of node_name -> state update
            for node_name, node_state in chunk.items():
                messages = node_state.get("messages", [])
                for msg in messages:
                    if isinstance(msg, AIMessage):
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
                            yield SSEEvent(
                                event="text",
                                data={"content": msg.content},
                            )

        yield SSEEvent(
            event="done",
            data={"conversation_id": conv_id, "tokens_used": 0},
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
