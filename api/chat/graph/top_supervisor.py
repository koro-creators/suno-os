"""
TopSupervisor -- routes user intent to the correct orchestrator path.

Intents:
- criacao: Copy Social, Roteiro de Video, Texto de Radio
- midia: Plano de Midia, Report Performance
- planejamento: Persona Sintetica, Brief Builder, Analise de Mercado
- conversation: General questions, greetings, off-topic
"""

from __future__ import annotations

import json
import logging
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from chat.graph.state import SunosChatState

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Skill slug -> intent mapping (short-circuit, no LLM needed)
# ---------------------------------------------------------------------------

_SKILL_INTENT_MAP: dict[str, str] = {
    "copy-social": "criacao",
    "roteiro-de-video": "criacao",
    "texto-de-radio": "criacao",
    "plano-de-midia": "midia",
    "report-performance": "midia",
    "persona-sintetica": "planejamento",
    "brief-builder": "planejamento",
    "analise-de-mercado": "planejamento",
}

_VALID_INTENTS = {"criacao", "midia", "planejamento", "conversation"}

# ---------------------------------------------------------------------------
# System prompt for LLM-based classification
# ---------------------------------------------------------------------------

_CLASSIFICATION_PROMPT = """\
Voce e o roteador do sunOS, a plataforma de IA da Suno United Creators.

Classifique a mensagem do usuario em uma das seguintes intencoes:

1. **criacao** — O usuario quer criar conteudo textual: copy para redes sociais, \
roteiro de video, texto de radio, headlines, etc.
2. **midia** — O usuario quer planejar midia, gerar relatorios de performance, \
analisar metricas de campanha.
3. **planejamento** — O usuario quer construir personas sinteticas, criar briefs \
de campanha, fazer analise de mercado ou concorrencia.
4. **conversation** — Conversa geral, saudacoes, perguntas sobre o sistema, \
assuntos fora do escopo das ferramentas acima.

Responda APENAS com JSON no formato: {"intent": "<intencao>"}
"""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _parse_top_routing(text: str) -> str:
    """Extract intent from LLM response text, with robust fallbacks."""
    # Try JSON parse first
    try:
        data = json.loads(text)
        intent = data.get("intent", "").strip().lower()
        if intent in _VALID_INTENTS:
            return intent
    except (json.JSONDecodeError, AttributeError):
        pass

    # Try to find JSON in the text
    for start_char in ("{",):
        idx = text.find(start_char)
        if idx != -1:
            end = text.find("}", idx)
            if end != -1:
                try:
                    data = json.loads(text[idx : end + 1])
                    intent = data.get("intent", "").strip().lower()
                    if intent in _VALID_INTENTS:
                        return intent
                except (json.JSONDecodeError, AttributeError):
                    pass

    # Keyword fallback
    text_lower = text.lower()
    for intent in ("criacao", "midia", "planejamento", "conversation"):
        if intent in text_lower:
            return intent

    return "conversation"


# ---------------------------------------------------------------------------
# Node function
# ---------------------------------------------------------------------------


async def top_supervisor(state: SunosChatState, llm: Any) -> SunosChatState:
    """Route user intent. Short-circuits if skill_slug is known, else uses LLM."""

    # If last message is already an AIMessage, route to respond
    messages = state.get("messages", [])
    if messages and isinstance(messages[-1], AIMessage):
        return {**state, "current_intent": "respond"}

    # Short-circuit: known skill slug
    skill_slug = state.get("active_skill")
    if skill_slug and skill_slug in _SKILL_INTENT_MAP:
        intent = _SKILL_INTENT_MAP[skill_slug]
        logger.info("TopSupervisor: short-circuit skill=%s -> intent=%s", skill_slug, intent)
        return {**state, "current_intent": intent}

    # LLM classification
    last_human = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage):
            last_human = msg.content
            break

    if not last_human:
        return {**state, "current_intent": "conversation"}

    classification_messages = [
        SystemMessage(content=_CLASSIFICATION_PROMPT),
        HumanMessage(content=last_human),
    ]

    try:
        response = await llm.ainvoke(classification_messages)
        intent = _parse_top_routing(response.content or "")
    except Exception as exc:
        logger.error("TopSupervisor: LLM classification failed: %s", exc)
        intent = "conversation"

    logger.info("TopSupervisor: LLM classified intent=%s", intent)
    return {**state, "current_intent": intent}


def route_to_intent(state: SunosChatState) -> str:
    """Conditional edge function: returns the current_intent for graph routing."""
    return state.get("current_intent", "conversation")
