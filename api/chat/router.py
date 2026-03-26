"""Chat API router — SSE streaming + endpoints."""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from chat.schemas.chat import (
    ChatRequest,
    EnhancePromptRequest,
    EnhancePromptResponse,
    TextGenRequest,
    TextGenResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Chat"])


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Chat streaming endpoint via SSE."""
    from chat.graph.runner import run_chat_stream

    async def event_generator():
        async for event in run_chat_stream(
            message=request.message,
            skill_slug=request.skill_slug,
            conversation_id=request.conversation_id,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            system_prompt=request.system_prompt,
            context_documents=request.context_documents,
            web_search=request.web_search,
        ):
            yield f"event: {event.event}\ndata: {json.dumps(event.data)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/chat/generate-text")
async def generate_text(request: TextGenRequest) -> TextGenResponse:
    """Text generation endpoint. Placeholder — implemented in Phase E."""
    return TextGenResponse(texts=["placeholder"], model=request.model, tokens_used=0)


@router.post("/chat/enhance-prompt")
async def enhance_prompt(request: EnhancePromptRequest) -> EnhancePromptResponse:
    """Prompt enhancement endpoint. Placeholder — implemented in Phase E."""
    return EnhancePromptResponse(
        enhanced_prompt=request.prompt,
        suggestions=[],
        reasoning="Placeholder — will be implemented in Phase E",
    )


@router.get("/chat/conversations")
async def list_conversations():
    """List conversations. Placeholder — needs DB session dependency."""
    return {"conversations": []}
