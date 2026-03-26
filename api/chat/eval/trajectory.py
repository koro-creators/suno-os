"""
Trajectory evaluation -- checks if the agent followed the correct flow.
Used for CI validation that routing and agent selection work correctly.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class TrajectoryStep:
    node: str
    intent: str | None = None
    agent: str | None = None


@dataclass
class TrajectoryResult:
    passed: bool
    expected_flow: list[str]
    actual_flow: list[str]
    reasoning: str


def evaluate_trajectory(
    skill_slug: str,
    actual_steps: list[TrajectoryStep],
    expected_intent: str | None = None,
) -> TrajectoryResult:
    """Evaluate whether the agent trajectory followed the expected flow."""

    # Expected flows by skill type
    EXPECTED_FLOWS = {
        "criacao": ["top_supervisor", "orchestrator", "content_creator", "respond"],
        "midia": ["top_supervisor", "orchestrator", "content_creator", "respond"],
        "planejamento": ["top_supervisor", "orchestrator", "content_creator", "respond"],
        "conversation": ["top_supervisor", "conversation", "respond"],
    }

    # Determine expected intent from skill_slug
    SKILL_INTENT_MAP = {
        "copy-social": "criacao",
        "roteiro-de-video": "criacao",
        "texto-de-radio": "criacao",
        "plano-de-midia": "midia",
        "report-performance": "midia",
        "persona-sintetica": "planejamento",
        "brief-builder": "planejamento",
        "analise-de-mercado": "planejamento",
    }

    intent = expected_intent or SKILL_INTENT_MAP.get(skill_slug, "conversation")
    expected_flow = EXPECTED_FLOWS.get(intent, EXPECTED_FLOWS["conversation"])
    actual_flow = [step.node for step in actual_steps]

    # Check if actual flow matches expected (allowing extra loops)
    passed = True
    for expected_node in expected_flow:
        if expected_node not in actual_flow:
            passed = False
            break

    return TrajectoryResult(
        passed=passed,
        expected_flow=expected_flow,
        actual_flow=actual_flow,
        reasoning=f"Intent '{intent}': {'flow matches expected pattern' if passed else 'flow diverged from expected pattern'}",
    )
