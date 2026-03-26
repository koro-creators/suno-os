"""Conversational Agent — handles general questions, greetings, off-topic. No tools."""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.messages import AIMessage, SystemMessage

from chat.agents.base import BaseAgent
from chat.graph.state import SunosChatState

logger = logging.getLogger(__name__)

FALLBACK_MESSAGE = (
    "Olá! Sou o sunOS, assistente de IA da Suno United Creators. "
    "No momento não consigo processar sua mensagem pois o modelo de linguagem "
    "não está configurado.\n\n"
    "Posso te ajudar com as seguintes skills quando estiver online:\n"
    "- **Criação**: copy para redes sociais, roteiros, textos publicitários\n"
    "- **Mídia**: planos de mídia, estratégias de comunicação\n"
    "- **Planejamento**: briefings, análises de mercado, personas\n\n"
    "Tente novamente em instantes ou entre em contato com o suporte."
)


class ConversationalAgent(BaseAgent):
    """Handles general questions, greetings, and off-topic requests. No tools."""

    def __init__(self, llm: Any = None):
        self._llm = llm

    @property
    def name(self) -> str:
        return "conversational"

    @property
    def system_prompt(self) -> str:
        return (
            "Você é o sunOS, assistente de IA da plataforma interna da Suno United Creators, "
            "uma agência de publicidade e comunicação integrada.\n\n"
            "## Sobre a Plataforma\n\n"
            "O sunOS organiza skills (habilidades) de IA por cliente, usando uma metáfora "
            "de sistema solar. Cada cliente é um planeta e cada skill é uma lua.\n\n"
            "## Skills Disponíveis\n\n"
            "- **Criação**: copy para redes sociais, roteiros, textos publicitários, scripts\n"
            "- **Mídia**: planos de mídia, estratégias de comunicação, análise de canais\n"
            "- **Planejamento**: briefings criativos, análises de mercado, personas, relatórios\n\n"
            "## Diretrizes\n\n"
            "- Sempre responda em Português (Brasil)\n"
            "- Seja prestativo e amigável\n"
            "- Se o usuário quiser criar conteúdo, sugira que selecione uma skill específica\n"
            "- Explique as funcionalidades da plataforma quando perguntado\n"
            "- Não invente informações sobre clientes ou projetos reais\n"
            "- Mantenha um tom profissional mas acessível\n"
        )

    def get_tools(self) -> list:
        return []

    async def invoke(self, state: SunosChatState) -> SunosChatState:
        llm = self._llm
        if llm is None:
            state["messages"] = state.get("messages", []) + [
                AIMessage(content=FALLBACK_MESSAGE)
            ]
            state["current_agent"] = self.name
            return state

        # Build messages: SystemMessage + conversation history
        messages = [SystemMessage(content=self.system_prompt)]
        for msg in state.get("messages", []):
            messages.append(msg)

        # Simple LLM call (no ReAct, no tools)
        response = await llm.ainvoke(messages)

        state["messages"] = state.get("messages", []) + [
            AIMessage(content=response.content or "")
        ]
        state["current_agent"] = self.name

        return state
