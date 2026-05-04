"""Pydantic models for chat endpoints."""

from typing import Literal

from pydantic import BaseModel, Field

# Type aliases for shared enums (RN-007/008 — fix INC-API-07/08)
ChatModel = Literal["gemini-flash", "gemini-pro", "gpt-4o", "claude"]
ImageModel = Literal["imagen-4-standard", "imagen-4-fast", "imagen-4-ultra", "nano-banana", "dall-e-3"]
AspectRatio = Literal["1:1", "16:9", "9:16", "4:3"]
ContentType = Literal["social_post", "article", "caption", "email", "script", "custom"]
Tone = Literal["formal", "casual", "professional", "creative", "friendly"]
Length = Literal["short", "medium", "long"]
TargetTool = Literal["chat", "image", "video", "text"]


class ChatRequest(BaseModel):
    """Request body for POST /api/chat/stream."""

    message: str
    conversation_id: str | None = None
    skill_slug: str = "conversation"
    model: ChatModel = "gemini-flash"
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=4096, ge=1, le=32768)
    system_prompt: str | None = None
    context_documents: list[str] = Field(default_factory=list)
    web_search: bool = False
    # client_slug: opcional na fase atual; SERÁ OBRIGATÓRIO no Piloto (RN-010, INC-API-03)
    # Quando informado, restringe context injection ao cliente correspondente.
    client_slug: str | None = Field(
        default=None,
        description="Multi-tenant slug do cliente (Vivo, Sicredi, Americanas, etc.). Opcional na fase atual; obrigatório a partir do Piloto.",
    )


class TextGenRequest(BaseModel):
    """Request body for POST /api/chat/generate-text."""

    prompt: str
    content_type: ContentType = "social_post"
    tone: Tone = "creative"
    length: Length = "medium"
    variations: int = Field(default=1, ge=1, le=4)
    skill_slug: str | None = None
    model: ChatModel = "gemini-flash"
    context_documents: list[str] = Field(default_factory=list)
    client_slug: str | None = None


class TextGenResponse(BaseModel):
    texts: list[str]
    model: str
    tokens_used: int


class ImageGenRequest(BaseModel):
    """Request body for POST /api/chat/generate-image."""

    prompt: str
    model: ImageModel = "imagen-4-standard"
    aspect_ratio: AspectRatio = "1:1"
    quantity: int = Field(default=1, ge=1, le=4)
    style: str | None = None
    enhance_prompt: bool = True
    client_slug: str | None = None


class ImageResult(BaseModel):
    url: str
    width: int
    height: int


class ImageGenResponse(BaseModel):
    images: list[ImageResult]
    model: str
    enhanced_prompt: str | None = None


class EnhancePromptRequest(BaseModel):
    """Request body for POST /api/chat/enhance-prompt."""

    prompt: str
    target_tool: TargetTool = "chat"
    context: str | None = None


class EnhancePromptResponse(BaseModel):
    enhanced_prompt: str
    suggestions: list[str]
    reasoning: str
