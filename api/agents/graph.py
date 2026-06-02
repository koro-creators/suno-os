"""LangGraph ReAct agent graph — SPEC-021 TASK-C03."""

from __future__ import annotations

import operator
from typing import Annotated, Any, Sequence, TypedDict

from langchain_core.messages import BaseMessage, SystemMessage
from langchain_core.tools import BaseTool
from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolNode

from config import settings

_MODEL_MAP = {
    "gemini-flash": "gemini-2.5-flash",
    "gemini-pro": "gemini-2.5-pro",
    "gpt-4o": "gpt-4o",
    "claude": "claude-sonnet-4-5",
}


def _get_llm(temperature: float = 0.3) -> Any:
    """Instantiate LLM using project-level API keys (same pattern as chat/graph/runner.py)."""
    import logging

    logger = logging.getLogger(__name__)
    model_id = _MODEL_MAP.get(settings.DEFAULT_MODEL, "gemini-2.5-flash")

    if model_id.startswith("gemini") and settings.GOOGLE_API_KEY:
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model=model_id,
            temperature=temperature,
            google_api_key=settings.GOOGLE_API_KEY,
        )

    if model_id.startswith("gpt") and settings.OPENAI_API_KEY:
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=model_id,
            temperature=temperature,
            api_key=settings.OPENAI_API_KEY,
        )

    if model_id.startswith("claude") and settings.ANTHROPIC_API_KEY:
        from langchain_anthropic import ChatAnthropic

        return ChatAnthropic(
            model=model_id,
            temperature=temperature,
            api_key=settings.ANTHROPIC_API_KEY,
        )

    # Fallback: Gemini Flash
    if settings.GOOGLE_API_KEY:
        logger.warning("Falling back to gemini-2.5-flash for agent graph")
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=temperature,
            google_api_key=settings.GOOGLE_API_KEY,
        )

    raise ValueError("No LLM API key configured. Set GOOGLE_API_KEY (or OPENAI_API_KEY) in .env")


class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]


def build_agent_graph(
    instructions: str,
    skill_tools: list[BaseTool],
    memory_context: str,
) -> Any:
    """Build and compile a LangGraph ReAct graph for an agent.

    Nodes:
      - agent: LLM with tools bound (if any skills assigned)
      - tools: ToolNode executing skill tools
    Routing: agent → tools (if tool_calls present) → agent, or agent → END.
    """
    llm_base = _get_llm()
    llm = llm_base.bind_tools(skill_tools) if skill_tools else llm_base

    system_parts = [instructions or "You are a helpful AI assistant."]
    if memory_context:
        system_parts.append(f"\n## Context from Memory Files\n{memory_context}")
    system_prompt = "\n".join(system_parts)

    def agent_node(state: AgentState) -> dict:
        messages = [SystemMessage(content=system_prompt), *list(state["messages"])]
        response = llm.invoke(messages)
        return {"messages": [response]}

    def should_continue(state: AgentState) -> str:
        last = state["messages"][-1]
        if skill_tools and hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return END

    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)

    if skill_tools:
        graph.add_node("tools", ToolNode(skill_tools))
        graph.add_conditional_edges(
            "agent",
            should_continue,
            {"tools": "tools", END: END},
        )
        graph.add_edge("tools", "agent")
    else:
        graph.add_edge("agent", END)

    graph.set_entry_point("agent")
    return graph.compile()
