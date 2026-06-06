"""
Graph Builder -- assembles the sunOS chat StateGraph.

Topology:
    START
      |
      v
    top_supervisor -- conditional edges --> orchestrator (todos os intents)
                                        --> respond (se já há AIMessage)
      |
    orchestrator --> respond --> END
"""

from __future__ import annotations

import logging
from functools import partial
from typing import Any

from langchain_core.messages import AIMessage
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from chat.graph.orchestrator import orchestrator_node
from chat.graph.state import SunosChatState
from chat.graph.top_supervisor import route_to_intent, top_supervisor

logger = logging.getLogger(__name__)


async def _respond_node(state: SunosChatState) -> SunosChatState:
    """Ensure the last message is an AIMessage (fallback if needed)."""
    messages = state.get("messages", [])
    if messages and isinstance(messages[-1], AIMessage):
        return state

    fallback = AIMessage(
        content="Desculpe, nao consegui processar sua solicitacao. Tente novamente."
    )
    return {**state, "messages": messages + [fallback]}


def build_chat_graph(llm: Any, agents: dict[str, Any] | None = None) -> CompiledStateGraph:
    """Build and compile the sunOS chat graph.

    Args:
        llm: LangChain LLM instance for the TopSupervisor.
        agents: Dict mapping agent name -> BaseAgent instance.

    Returns:
        Compiled LangGraph StateGraph ready for invoke/astream.
    """
    if agents is None:
        agents = {}

    graph = StateGraph(SunosChatState)

    graph.add_node("top_supervisor", partial(top_supervisor, llm=llm))
    graph.add_node("orchestrator", partial(orchestrator_node, agents=agents))
    graph.add_node("respond", _respond_node)

    graph.add_edge(START, "top_supervisor")

    graph.add_conditional_edges(
        "top_supervisor",
        route_to_intent,
        {
            "criacao":      "orchestrator",
            "midia":        "orchestrator",
            "planejamento": "orchestrator",
            "conversation": "orchestrator",
            "respond":      "respond",
        },
    )

    graph.add_edge("orchestrator", "respond")
    graph.add_edge("respond", END)

    compiled = graph.compile()
    logger.info("Chat graph compiled successfully")
    return compiled
