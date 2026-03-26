"""
Orchestrator -- loads skill references and delegates to the right agent.

For each intent, it:
1. Loads the skill using SkillLoader
2. Selects the agent (content_creator or conversational)
3. Invokes the agent with skill content injected
"""

from __future__ import annotations

import logging
from typing import Any

from chat.graph.state import SunosChatState
from chat.skills import skill_loader

logger = logging.getLogger(__name__)

# Intent -> agent name mapping
_INTENT_AGENT_MAP: dict[str, str] = {
    "criacao": "content_creator",
    "midia": "content_creator",
    "planejamento": "content_creator",
    "conversation": "conversational",
}


async def orchestrator_node(state: SunosChatState, agents: dict[str, Any]) -> SunosChatState:
    """Load skill references and delegate to the appropriate agent.

    Args:
        state: Current graph state.
        agents: Dict mapping agent name -> agent instance (BaseAgent subclass).

    Returns:
        Updated state from the agent invocation.
    """
    intent = state.get("current_intent", "conversation")
    agent_name = _INTENT_AGENT_MAP.get(intent, "conversational")

    agent = agents.get(agent_name)
    if agent is None:
        logger.error("Orchestrator: agent '%s' not found in agents dict", agent_name)
        return state

    # Load skill content if active_skill is set
    active_skill = state.get("active_skill")
    skill_content = None
    skill_refs: list[str] = []

    if active_skill:
        skill_content = skill_loader.load(active_skill)
        if skill_content:
            skill_refs = skill_content.references
            logger.info(
                "Orchestrator: loaded skill=%s (%d references)",
                active_skill,
                len(skill_refs),
            )
        else:
            logger.warning("Orchestrator: skill '%s' not found", active_skill)

    # Update state with skill references
    updated_state: SunosChatState = {
        **state,
        "current_agent": agent_name,
        "skill_references": skill_refs,
    }

    # Invoke the agent
    logger.info(
        "Orchestrator: intent=%s -> agent=%s, skill=%s",
        intent,
        agent_name,
        active_skill,
    )

    try:
        result_state = await agent.invoke(updated_state)
    except Exception as exc:
        logger.error("Orchestrator: agent '%s' raised: %s", agent_name, exc)
        return updated_state

    return result_state
