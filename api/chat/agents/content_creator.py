"""ContentCreator ReAct Agent — handles creative content tasks with tools."""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.messages import AIMessage

from chat.agents.base import BaseAgent
from chat.graph.state import SunosChatState
from chat.skills import SkillContent, skill_loader

logger = logging.getLogger(__name__)


class ContentCreatorAgent(BaseAgent):
    """ReAct agent for creative content tasks — uses chat, text gen, and prompt tools."""

    def __init__(self, llm: Any = None):
        self._llm = llm

    @property
    def name(self) -> str:
        return "content_creator"

    @property
    def system_prompt(self) -> str:
        return (
            "Você é um produtor de conteúdo criativo da Suno United Creators, uma agência "
            "de publicidade e comunicação integrada. Seu nome é sunOS e você faz parte de "
            "uma plataforma interna de IA que organiza skills (habilidades) de criação "
            "por cliente.\n\n"
            "## Suas Capacidades\n\n"
            "Você pode criar:\n"
            "- Copy para redes sociais (Instagram, LinkedIn, Twitter/X, TikTok)\n"
            "- Planos de mídia e estratégias de comunicação\n"
            "- Roteiros para vídeos, podcasts e conteúdo audiovisual\n"
            "- Textos para rádio, spots e jingles\n"
            "- Personas e perfis de público-alvo\n"
            "- Briefings criativos e estratégicos\n"
            "- Análises de mercado e concorrência\n"
            "- Relatórios de performance e insights\n\n"
            "## Uso de Ferramentas\n\n"
            "Use as ferramentas disponíveis quando necessário:\n"
            "- **chat_completion**: para raciocínio profundo, análise complexa ou "
            "brainstorming interno\n"
            "- **generate_text**: para gerar conteúdo formatado e estruturado\n"
            "- **enhance_prompt**: para melhorar prompts antes de gerar conteúdo\n"
            "- **web_search**: para pesquisar tendências, referências e dados atualizados\n"
            "- **search_knowledge**: para buscar documentos relevantes na base de "
            "conhecimento (Biblioteca)\n"
            "- **read_full_document**: para ler o conteúdo completo de um documento da Biblioteca\n"
            "- **find_related_documents**: para encontrar documentos relacionados "
            "por similaridade\n\n"
            "## Diretrizes\n\n"
            "- Sempre responda em Português (Brasil)\n"
            "- Siga as diretrizes e referências da skill ativa\n"
            "- Seja criativo, mas estratégico — todo conteúdo deve ter propósito\n"
            "- Adapte o tom de voz ao cliente e à plataforma\n"
            "- Quando houver dúvida sobre o briefing, pergunte antes de criar\n"
            "- Entregue conteúdo pronto para uso, não rascunhos genéricos\n"
            "- Cite fontes quando usar dados de pesquisa\n"
        )

    def get_tools(self) -> list:
        from chat.knowledge.document_search import KNOWLEDGE_TOOLS
        from chat.tools import ALL_TOOLS

        return ALL_TOOLS + KNOWLEDGE_TOOLS

    async def invoke(self, state: SunosChatState) -> SunosChatState:
        llm = self._llm
        if llm is None:
            state["messages"] = state.get("messages", []) + [
                AIMessage(content="Erro: LLM não configurado para o agente content_creator.")
            ]
            state["current_agent"] = self.name
            return state

        # 1. Load skill content if active_skill is set
        skill_content: SkillContent | None = None
        active_skill = state.get("active_skill")
        if active_skill:
            skill_content = skill_loader.load(active_skill)
            if skill_content:
                logger.info(
                    "Loaded skill '%s' with %d references",
                    active_skill,
                    len(skill_content.references),
                )
            else:
                logger.warning(
                    "Skill '%s' not found, proceeding without skill context", active_skill
                )

        # 2. Build extra context from context_documents and system_prompt override
        ctx_parts: list[str] = []

        system_prompt_override = state.get("system_prompt")
        if system_prompt_override:
            ctx_parts.append(f"## Instruções Adicionais\n\n{system_prompt_override}")

        context_documents = state.get("context_documents") or []
        if context_documents:
            ctx_parts.append(
                "## Documentos de Contexto\n\n" + "\n\n---\n\n".join(context_documents)
            )

        extra_context = "\n\n".join(ctx_parts)

        # 3. Run ReAct loop
        final_text, tool_results = await self.run_react(
            state, llm, skill_content=skill_content, extra_context=extra_context
        )

        # 4. Return updated state
        state["messages"] = state.get("messages", []) + [AIMessage(content=final_text)]
        state["current_agent"] = self.name

        if tool_results:
            logger.info("ContentCreator used %d tool call(s)", len(tool_results))

        return state
