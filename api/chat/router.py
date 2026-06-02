"""Chat API router — SSE streaming + endpoints with error handling."""

from __future__ import annotations

import asyncio
import json
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from chat.schemas.chat import (
    ChatRequest,
    EnhancePromptRequest,
    EnhancePromptResponse,
    ImageGenRequest,
    ImageGenResponse,
    ImageResult,
    TextGenRequest,
    TextGenResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Chat"])

REQUEST_TIMEOUT = 60  # seconds


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Chat streaming endpoint via SSE."""
    from chat.graph.runner import run_chat_stream

    async def event_generator():
        try:
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
        except asyncio.TimeoutError:
            yield (
                f"event: error\ndata: "
                f"{json.dumps({'message': 'Request timed out. Please try again.'})}\n\n"
            )
        except Exception as exc:
            logger.error("chat_stream: %s", exc, exc_info=True)
            yield (
                f"event: error\ndata: "
                f"{json.dumps({'message': 'An error occurred. Please try again.'})}\n\n"
            )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/chat/generate-text")
async def generate_text_endpoint(request: TextGenRequest) -> TextGenResponse:
    """Generate text with variations."""
    from chat.tools.text_tools import generate_text

    try:
        texts = []
        for _ in range(request.variations):
            result = await asyncio.wait_for(
                asyncio.to_thread(
                    generate_text.invoke,
                    {
                        "prompt": request.prompt,
                        "content_type": request.content_type,
                        "tone": request.tone,
                        "length": request.length,
                        "model": request.model,
                    },
                ),
                timeout=REQUEST_TIMEOUT,
            )
            texts.append(result)

        return TextGenResponse(texts=texts, model=request.model, tokens_used=0)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Request timed out after 60s")
    except Exception as exc:
        logger.error("generate_text: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Text generation failed")


@router.post("/chat/enhance-prompt")
async def enhance_prompt_endpoint(request: EnhancePromptRequest) -> EnhancePromptResponse:
    """Enhance a prompt for better AI results."""
    from chat.tools.prompt_tools import enhance_prompt

    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(
                enhance_prompt.invoke,
                {
                    "prompt": request.prompt,
                    "target_tool": request.target_tool,
                    "context": request.context or "",
                },
            ),
            timeout=REQUEST_TIMEOUT,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Request timed out after 60s")
    except Exception as exc:
        logger.error("enhance_prompt: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Prompt enhancement failed")

    try:
        parsed = json.loads(result)
        return EnhancePromptResponse(
            enhanced_prompt=parsed.get("enhanced_prompt", request.prompt),
            suggestions=parsed.get("suggestions", []),
            reasoning=parsed.get("reasoning", ""),
        )
    except (json.JSONDecodeError, TypeError):
        return EnhancePromptResponse(
            enhanced_prompt=result if isinstance(result, str) else request.prompt,
            suggestions=[],
            reasoning="Could not parse enhancement result",
        )


@router.post("/chat/generate-image")
async def generate_image_endpoint(request: ImageGenRequest) -> ImageGenResponse:
    """Generate images."""
    from chat.tools.image_tools import generate_image

    try:
        images = []
        for _ in range(request.quantity):
            result_str = await asyncio.wait_for(
                asyncio.to_thread(
                    generate_image.invoke,
                    {
                        "prompt": request.prompt,
                        "model": request.model,
                        "aspect_ratio": request.aspect_ratio,
                        "style": request.style,
                    },
                ),
                timeout=REQUEST_TIMEOUT,
            )
            result = json.loads(result_str)
            images.append(
                ImageResult(url=result["url"], width=result["width"], height=result["height"])
            )

        return ImageGenResponse(images=images, model=request.model, enhanced_prompt=None)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Request timed out after 60s")
    except Exception as exc:
        logger.error("generate_image: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Image generation failed")


# NOTE: /api/conversations is handled by chat.conversations.router (Phase 11).
# The placeholder endpoint previously here has been replaced by the full
# implementation in chat/conversations/router.py.
