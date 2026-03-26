"""Chat API router — endpoints for sunOS chat, text gen, image gen."""

import logging

from fastapi import APIRouter

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
    """Chat streaming endpoint (SSE). Placeholder — implemented in Phase C."""
    # Phase C will add: graph runner + SSE streaming
    return {"status": "not_implemented", "message": "Chat streaming will be implemented in Phase C"}


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
    """List conversations. Placeholder — implemented in Phase C."""
    return {"conversations": []}
