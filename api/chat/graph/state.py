from __future__ import annotations

from typing import Annotated

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict


class SunosChatState(TypedDict):
    """Shared state passed between all nodes in the sunOS chat graph."""

    # Conversation history
    messages: Annotated[list[BaseMessage], add_messages]

    # Routing (2 levels)
    current_intent: str  # "criacao" | "midia" | "planejamento" | "conversation"
    current_agent: str  # agent ativo

    # Skill context
    active_skill: str | None  # "copy-social" | "plano-de-midia" | etc.
    skill_references: list[str]  # conteúdo carregado dos references/

    # Context
    context_documents: list[str]  # documentos da Biblioteca ativos
    system_prompt: str | None  # systemPrompt override do SkillAdmin

    # Session
    conversation_id: str
    model: str
    temperature: float
    max_tokens: int
    web_search: bool

    # Results
    generated_images: list[dict]
    generated_texts: list[str]
