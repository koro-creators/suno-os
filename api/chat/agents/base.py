from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage

from chat.graph.state import SunosChatState
from chat.skills import SkillContent

logger = logging.getLogger(__name__)

MAX_REACT_ROUNDS = 5


class BaseAgent(ABC):
    """Abstract base class that every sunOS chat sub-agent must implement."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique identifier for this agent (used in SunosChatState.current_agent)."""

    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """System prompt injected into the LLM for this agent's persona."""

    @abstractmethod
    def get_tools(self) -> list:
        """Return the list of LangChain tools available to this agent."""

    def get_skill_references(self) -> list[str]:
        """Return skill reference names to load into the system prompt."""
        return []

    @abstractmethod
    async def invoke(self, state: SunosChatState) -> SunosChatState:
        """Process the current state and return an updated state."""

    def _build_system_prompt_with_skills(self, skill_content: SkillContent | None = None) -> str:
        """Build the full system prompt enriched with skill references."""
        base = self.system_prompt

        if skill_content is None:
            return base

        parts = [base, "\n\n## Skill Knowledge\n\n", skill_content.overview]
        if skill_content.references:
            parts.append("\n\n---\n\n")
            parts.append("\n\n---\n\n".join(skill_content.references))

        return "".join(parts)

    async def run_react(
        self,
        state: SunosChatState,
        llm: Any,
        *,
        skill_content: SkillContent | None = None,
        extra_context: str = "",
    ) -> tuple[str, list[dict[str, Any]]]:
        """Run a ReAct loop: LLM decides which tools to call.

        Returns (final_text, tool_results).
        """
        tools = self.get_tools()
        tool_map = {t.name: t for t in tools}
        bound_llm = llm.bind_tools(tools)

        full_prompt = self._build_system_prompt_with_skills(skill_content)
        messages: list = [SystemMessage(content=full_prompt)]

        if extra_context:
            messages.append(HumanMessage(content=extra_context))

        for msg in state.get("messages", []):
            messages.append(msg)

        all_tool_results: list[dict[str, Any]] = []

        for _round in range(MAX_REACT_ROUNDS):
            response = await bound_llm.ainvoke(messages)
            messages.append(response)

            tool_calls = getattr(response, "tool_calls", None) or []
            if not tool_calls:
                break

            for call in tool_calls:
                tool_name = call.get("name", "")
                tool_args = call.get("args", {})
                tool_call_id = call.get("id", "")

                tool_fn = tool_map.get(tool_name)
                if tool_fn:
                    try:
                        result = tool_fn.invoke(tool_args)
                    except Exception as exc:
                        logger.error("%s: tool '%s' raised: %s", self.name, tool_name, exc)
                        result = {"error": str(exc)}
                else:
                    result = {"error": f"Tool '{tool_name}' not found"}

                if isinstance(result, str):
                    try:
                        result_dict = json.loads(result)
                    except (json.JSONDecodeError, TypeError):
                        result_dict = {"raw": result}
                elif isinstance(result, dict):
                    result_dict = result
                else:
                    result_dict = {"raw": str(result)}

                all_tool_results.append(
                    {"tool_name": tool_name, "args": tool_args, "result": result_dict}
                )

                messages.append(
                    ToolMessage(
                        content=json.dumps(result_dict, default=str),
                        tool_call_id=tool_call_id,
                        name=tool_name,
                    )
                )
        else:
            logger.warning("%s: ReAct loop hit max rounds (%d)", self.name, MAX_REACT_ROUNDS)

        final_text = ""
        for msg in reversed(messages):
            if isinstance(msg, AIMessage):
                final_text = msg.content or ""
                break

        return final_text, all_tool_results
