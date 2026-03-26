"""Pydantic models for chat endpoints."""

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request body for POST /api/chat/stream."""

    message: str
    conversation_id: str | None = None
    skill_slug: str = "conversation"
    model: str = "gemini-flash"
    temperature: float = 0.7
    max_tokens: int = 4096
    system_prompt: str | None = None
    context_documents: list[str] = Field(default_factory=list)
    web_search: bool = False


class TextGenRequest(BaseModel):
    """Request body for POST /api/chat/generate-text."""

    prompt: str
    content_type: str = "social_post"
    tone: str = "creative"
    length: str = "medium"
    variations: int = Field(default=1, ge=1, le=4)
    skill_slug: str | None = None
    model: str = "gemini-flash"
    context_documents: list[str] = Field(default_factory=list)


class TextGenResponse(BaseModel):
    texts: list[str]
    model: str
    tokens_used: int


class ImageGenRequest(BaseModel):
    """Request body for POST /api/chat/generate-image."""

    prompt: str
    model: str = "imagen-4-standard"
    aspect_ratio: str = "1:1"
    quantity: int = Field(default=1, ge=1, le=4)
    style: str | None = None
    enhance_prompt: bool = True


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
    target_tool: str = "chat"
    context: str | None = None


class EnhancePromptResponse(BaseModel):
    enhanced_prompt: str
    suggestions: list[str]
    reasoning: str
