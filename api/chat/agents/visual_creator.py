"""VisualCreator ReAct Agent — handles visual content tasks (images, videos)."""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.messages import AIMessage

from chat.agents.base import BaseAgent
from chat.graph.state import SunosChatState
from chat.skills import SkillContent, skill_loader

logger = logging.getLogger(__name__)


class VisualCreatorAgent(BaseAgent):
    """ReAct agent for visual content — images and videos."""

    def __init__(self, llm: Any = None):
        self._llm = llm

    @property
    def name(self) -> str:
        return "visual_creator"

    @property
    def system_prompt(self) -> str:
        return (
            "Você é um especialista em criação de conteúdo visual da Suno United Creators, "
            "uma agência de publicidade e comunicação integrada. Seu nome é sunOS e você faz "
            "parte de uma plataforma interna de IA.\n\n"
            "## Suas Capacidades\n\n"
            "Você é especialista em:\n"
            "- Geração de imagens com IA (Imagen, Stable Diffusion, DALL-E)\n"
            "- Criação e refinamento de prompts visuais\n"
            "- Direção de arte e composição visual\n"
            "- Paletas de cores e estilos visuais\n"
            "- Adaptação de imagens para diferentes plataformas e formatos\n"
            "- Briefings visuais e moodboards\n\n"
            "## Uso de Ferramentas\n\n"
            "Use as ferramentas disponíveis quando necessário:\n"
            "- **generate_image**: para gerar imagens com IA via Vertex AI Imagen\n"
            "- **enhance_prompt**: para melhorar prompts visuais antes de gerar imagens\n\n"
            "## Diretrizes\n\n"
            "- Sempre responda em Português (Brasil)\n"
            "- Siga as diretrizes e referências da skill ativa\n"
            "- Antes de gerar uma imagem, refine o prompt para obter melhores resultados\n"
            "- Descreva elementos visuais com precisão: estilo, iluminação, composição\n"
            "- Sugira aspect ratios adequados para a plataforma de destino\n"
            "- Quando houver dúvida sobre o briefing visual, pergunte antes de criar\n"
        )

    def get_tools(self) -> list:
        from chat.tools.image_tools import generate_image
        from chat.tools.prompt_tools import enhance_prompt

        return [generate_image, enhance_prompt]

    async def invoke(self, state: SunosChatState) -> SunosChatState:
        llm = self._llm
        if llm is None:
            state["messages"] = state.get("messages", []) + [
                AIMessage(content="Erro: LLM não configurado para o agente visual_creator.")
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
                    "Skill '%s' not found, proceeding without skill context",
                    active_skill,
                )

        # 2. Build extra context
        ctx_parts: list[str] = []

        system_prompt_override = state.get("system_prompt")
        if system_prompt_override:
            ctx_parts.append(f"## Instruções Adicionais\n\n{system_prompt_override}")

        context_documents = state.get("context_documents") or []
        if context_documents:
            docs = "\n\n---\n\n".join(context_documents)
            ctx_parts.append(f"## Documentos de Contexto\n\n{docs}")

        extra_context = "\n\n".join(ctx_parts)

        # 3. Run ReAct loop
        final_text, tool_results = await self.run_react(
            state, llm, skill_content=skill_content, extra_context=extra_context
        )

        # 4. Return updated state
        state["messages"] = state.get("messages", []) + [AIMessage(content=final_text)]
        state["current_agent"] = self.name

        if tool_results:
            logger.info("VisualCreator used %d tool call(s)", len(tool_results))

        return state
