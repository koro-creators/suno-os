"""Conversational Agent — handles general questions, greetings, off-topic.

When a skill is active, runs ReAct with skill-specific tools and prompt.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from langchain_core.messages import AIMessage, SystemMessage, ToolMessage

from chat.agents.base import MAX_REACT_ROUNDS, BaseAgent
from chat.graph.state import SunosChatState
from chat.tools.wiki_search import search_wiki

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

# System prompts por skill ativa
_SKILL_PROMPTS: dict[str, str] = {
    "consultor": (
        "Você é um sistema de consulta restrito da Suno United Creators.\n\n"
        "REGRAS ABSOLUTAS — sem exceções, sem flexibilidade:\n\n"
        "1. Você SOMENTE pode falar sobre clientes cadastrados na base de dados.\n"
        "2. Para toda mensagem que mencionar um cliente, chame a ferramenta search_wiki.\n"
        "3. Se a mensagem NÃO mencionar um cliente cadastrado — seja matemática, programação, "
        "história, curiosidades ou qualquer outro assunto — responda APENAS com a frase exata: "
        "'Não há informações sobre isso na base de dados.'\n"
        "4. Se search_wiki não retornar conteúdo útil, responda APENAS: "
        "'Não há informações sobre isso na base de dados.'\n"
        "5. NUNCA use conhecimento próprio. NUNCA responda perguntas gerais.\n"
        "6. Responda sempre em Português (Brasil)."
    ),
}


# Tools disponíveis por skill ativa
def _get_skill_tools(skill_slug: str) -> list:
    if skill_slug == "consultor":
        return [search_wiki]
    return []


class ConversationalAgent(BaseAgent):
    """Handles general questions and, when a skill is active, runs ReAct with skill tools."""

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
            state["messages"] = state.get("messages", []) + [AIMessage(content=FALLBACK_MESSAGE)]
            state["current_agent"] = self.name
            return state

        active_skill = state.get("active_skill")

        if active_skill and active_skill in _SKILL_PROMPTS:
            # Skill mode: ReAct loop com tools e prompt específico da skill
            skill_prompt = _SKILL_PROMPTS[active_skill]

            # Escopo de cliente (ex.: usuário navegando em /samsung) — o frontend
            # envia via system_prompt; some às regras da skill sem afrouxá-las.
            scope_override = state.get("system_prompt")
            if scope_override:
                skill_prompt = f"{skill_prompt}\n\n## Contexto da navegação\n\n{scope_override}"

            tools = _get_skill_tools(active_skill)

            messages: list = [SystemMessage(content=skill_prompt)]
            for msg in state.get("messages", []):
                messages.append(msg)

            bound_llm = llm.bind_tools(tools) if tools else llm
            tool_map = {t.name: t for t in tools}

            for _round in range(MAX_REACT_ROUNDS):
                response = await bound_llm.ainvoke(messages)
                messages.append(response)

                tool_calls = getattr(response, "tool_calls", None) or []
                if not tool_calls:
                    break

                for call in tool_calls:
                    tool_fn = tool_map.get(call.get("name", ""))
                    try:
                        result = (
                            tool_fn.invoke(call.get("args", {}))
                            if tool_fn
                            else {"error": "tool not found"}
                        )
                    except Exception as exc:
                        result = {"error": str(exc)}

                    result_str = (
                        result if isinstance(result, str) else json.dumps(result, default=str)
                    )
                    messages.append(
                        ToolMessage(
                            content=result_str,
                            tool_call_id=call.get("id", ""),
                            name=call.get("name", ""),
                        )
                    )

            final_text = ""
            for msg in reversed(messages):
                if isinstance(msg, AIMessage):
                    final_text = msg.content or ""
                    break
        state["messages"] = state.get("messages", []) + [AIMessage(content=final_text)]
        state["current_agent"] = self.name
        return state
