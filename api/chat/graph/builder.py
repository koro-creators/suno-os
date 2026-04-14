"""
Graph Builder -- assembles the sunOS chat StateGraph.

Topology:
    START
      |
      v
    top_supervisor -- conditional edges --> orchestrator (criacao/midia/planejamento)
      |                                 --> conversation
      |
      +-------------------------------> respond --> END

    orchestrator / conversation loop back to top_supervisor.
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


# ---------------------------------------------------------------------------
# Leaf nodes
# ---------------------------------------------------------------------------


async def _conversation_node(state: SunosChatState, agents: dict[str, Any]) -> SunosChatState:
    """Handle conversation intent directly via the conversational agent."""
    agent = agents.get("conversational")
    if agent is None:
        logger.error("Builder: conversational agent not found")
        return state

    state = {**state, "current_agent": "conversational"}

    try:
        return await agent.invoke(state)
    except Exception as exc:
        logger.error("Builder: conversational agent raised: %s", exc)
        return state


async def _respond_node(state: SunosChatState) -> SunosChatState:
    """Ensure the last message is an AIMessage (fallback if needed)."""
    messages = state.get("messages", [])
    if messages and isinstance(messages[-1], AIMessage):
        return state

    # Fallback: produce a generic response
    fallback = AIMessage(
        content="Desculpe, nao consegui processar sua solicitacao. Tente novamente."
    )
    return {**state, "messages": messages + [fallback]}


# ---------------------------------------------------------------------------
# Builder
# ---------------------------------------------------------------------------


def build_chat_graph(llm: Any, agents: dict[str, Any] | None = None) -> CompiledStateGraph:
    """Build and compile the sunOS chat graph.

    Args:
        llm: LangChain LLM instance for the TopSupervisor.
        agents: Dict mapping agent name -> BaseAgent instance.
                Expected keys: "content_creator", "conversational".

    Returns:
        Compiled LangGraph StateGraph ready for invoke/astream.
    """
    if agents is None:
        agents = {}

    graph = StateGraph(SunosChatState)

    # -- Register nodes --
    graph.add_node("top_supervisor", partial(top_supervisor, llm=llm))
    graph.add_node("orchestrator", partial(orchestrator_node, agents=agents))
    graph.add_node("conversation", partial(_conversation_node, agents=agents))
    graph.add_node("respond", _respond_node)

    # -- Edges --
    graph.add_edge(START, "top_supervisor")

    graph.add_conditional_edges(
        "top_supervisor",
        route_to_intent,
        {
            "criacao": "orchestrator",
            "midia": "orchestrator",
            "planejamento": "orchestrator",
            "conversation": "conversation",
            "respond": "respond",
        },
    )

    # orchestrator and conversation go to respond → END
    graph.add_edge("orchestrator", "respond")
    graph.add_edge("conversation", "respond")

    # respond goes to END
    graph.add_edge("respond", END)

    compiled = graph.compile()
    logger.info("Chat graph compiled successfully")
    return compiled
