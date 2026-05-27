"""Pytest configuration and shared fixtures for the sunOS API.

SPEC-005 Phase A (TASK-A09) seeds three workflow shapes used across the
backend test suite:

  - seed_workflow_v1_legacy        — v1 shape (next_step + condition.then/else)
                                     no edges, no positions; mirrors what migrate_v2
                                     consumes as input.
  - seed_workflow_v2_linear        — v2 shape (canvas_v2_migrated=true);
                                     three steps in a line connected by `out` edges.
  - seed_workflow_v2_fanout_merge  — v2 shape; one entry node fans out to three
                                     parallel tools that converge on a MergeNode
                                     with merge_policy='all'.

Backend persistence is an in-memory dict in api/workflows/router.py (`_workflows`)
until DB plumbing lands. Fixtures clear the dict before each test, then seed
the requested shape, and yield the workflow_id for assertions.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Iterator

import pytest


def _now_iso() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# In-memory store reset
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def reset_workflow_store() -> Iterator[None]:
    """Reset the in-memory workflow/run/log dicts before each test."""
    from api.workflows import router as wf_router

    wf_router._workflows.clear()
    wf_router._runs.clear()
    wf_router._step_logs.clear()
    yield
    wf_router._workflows.clear()
    wf_router._runs.clear()
    wf_router._step_logs.clear()


@pytest.fixture(autouse=True)
def reset_agents_store() -> Iterator[None]:
    """Reset agent and run in-memory stores before each test."""
    try:
        from api.agents.router import _agents
        from api.agents.runner import _runs, _runs_by_agent

        _agents.clear()
        _runs.clear()
        _runs_by_agent.clear()
        yield
        _agents.clear()
        _runs.clear()
        _runs_by_agent.clear()
    except ImportError:
        yield


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _base_workflow(name: str, definition: dict[str, Any], canvas_v2: bool) -> dict[str, Any]:
    """Produce a workflow dict matching api/workflows/router.py's in-memory shape."""
    now = _now_iso()
    wf_id = str(uuid.uuid4())
    metadata = definition.setdefault("metadata", {})
    metadata["canvas_v2_migrated"] = canvas_v2

    return {
        "id": wf_id,
        "name": name,
        "description": f"Fixture for SPEC-005 tests: {name}",
        "created_by": "test-fixture",
        "definition": definition,
        "schedule_cron": None,
        "schedule_timezone": "America/Sao_Paulo",
        "schedule_enabled": False,
        "client_scope": ["test-client"],
        "default_model": "gemini-flash",
        "max_execution_time": 300,
        "status": "draft",
        "created_at": now,
        "updated_at": now,
        "updated_by": None,
        # SPEC-005 v2-only fields below; v1 fixture leaves these absent so callers
        # can detect "not yet migrated".
    }


def _install(workflow: dict[str, Any], edges: list[dict[str, Any]] | None = None) -> str:
    """Insert into the in-memory store and return workflow_id."""
    from api.workflows import router as wf_router

    workflow.setdefault("edges", edges or [])
    wf_router._workflows[workflow["id"]] = workflow
    return workflow["id"]


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def seed_workflow_v1_legacy() -> str:
    """3-step linear workflow in v1 shape (next_step linkage, no edges/positions).

    s1 (tool) → s2 (llm) → s3 (action)

    Used to drive migration JIT tests: input is canvas_v2_migrated=false, output
    after migrate-v2 should be three edges with source_handle='out'.
    """
    definition = {
        "steps": [
            {
                "id": "s1",
                "name": "Buscar dados",
                "type": "tool",
                "tool_name": "search_knowledge",
                "config": {"query": "fixture"},
                "next_step": "s2",
            },
            {
                "id": "s2",
                "name": "Resumir",
                "type": "llm",
                "prompt": "Resuma: {{previous}}",
                "config": {},
                "next_step": "s3",
            },
            {
                "id": "s3",
                "name": "Registrar",
                "type": "action",
                "tool_name": "log_result",
                "config": {},
            },
        ],
        "default_model": "gemini-flash",
        "max_execution_time": 300,
    }
    wf = _base_workflow("Linear v1 (legacy)", definition, canvas_v2=False)
    return _install(wf, edges=[])


@pytest.fixture
def seed_workflow_v2_linear() -> str:
    """3-step linear workflow already in v2 shape with positions and edges."""
    steps = [
        {
            "id": "s1",
            "name": "Buscar dados",
            "type": "tool",
            "tool_name": "search_knowledge",
            "config": {"query": "fixture"},
            "position_x": 0,
            "position_y": 0,
        },
        {
            "id": "s2",
            "name": "Resumir",
            "type": "llm",
            "prompt": "Resuma: {{previous}}",
            "config": {},
            "position_x": 220,
            "position_y": 0,
        },
        {
            "id": "s3",
            "name": "Registrar",
            "type": "action",
            "tool_name": "log_result",
            "config": {},
            "position_x": 440,
            "position_y": 0,
        },
    ]
    edges = [
        {
            "edge_id": str(uuid.uuid4()),
            "source_step_id": "s1",
            "source_handle": "out",
            "target_step_id": "s2",
            "target_handle": "in",
        },
        {
            "edge_id": str(uuid.uuid4()),
            "source_step_id": "s2",
            "source_handle": "out",
            "target_step_id": "s3",
            "target_handle": "in",
        },
    ]
    definition = {
        "steps": steps,
        "default_model": "gemini-flash",
        "max_execution_time": 300,
    }
    wf = _base_workflow("Linear v2", definition, canvas_v2=True)
    return _install(wf, edges=edges)


@pytest.fixture
def seed_workflow_v2_fanout_merge() -> str:
    """Fan-out 1→3 with explicit MergeNode (merge_policy='all').

    Layout:

        s_entry  ──out──►  t1 (tool) ──out──┐
                  ──out──►  t2 (tool) ──out──┼──►  m_merge (merge, all) ──out──► s_final (action)
                  ──out──►  t3 (tool) ──out──┘
    """
    steps = [
        {
            "id": "s_entry",
            "name": "Disparar",
            "type": "tool",
            "tool_name": "search_knowledge",
            "config": {"query": "entry"},
            "position_x": 0,
            "position_y": 0,
        },
        {
            "id": "t1",
            "name": "Branch A",
            "type": "tool",
            "tool_name": "search_knowledge",
            "config": {"query": "a"},
            "position_x": 220,
            "position_y": -120,
        },
        {
            "id": "t2",
            "name": "Branch B",
            "type": "tool",
            "tool_name": "search_knowledge",
            "config": {"query": "b"},
            "position_x": 220,
            "position_y": 0,
        },
        {
            "id": "t3",
            "name": "Branch C",
            "type": "tool",
            "tool_name": "search_knowledge",
            "config": {"query": "c"},
            "position_x": 220,
            "position_y": 120,
        },
        {
            "id": "m_merge",
            "name": "Aguardar todas",
            "type": "merge",
            "config": {},
            "position_x": 440,
            "position_y": 0,
            "merge_policy": "all",
        },
        {
            "id": "s_final",
            "name": "Registrar",
            "type": "action",
            "tool_name": "log_result",
            "config": {},
            "position_x": 660,
            "position_y": 0,
        },
    ]

    def _edge(src: str, tgt: str, handle: str = "out") -> dict[str, Any]:
        return {
            "edge_id": str(uuid.uuid4()),
            "source_step_id": src,
            "source_handle": handle,
            "target_step_id": tgt,
            "target_handle": "in",
        }

    edges = [
        _edge("s_entry", "t1"),
        _edge("s_entry", "t2"),
        _edge("s_entry", "t3"),
        _edge("t1", "m_merge"),
        _edge("t2", "m_merge"),
        _edge("t3", "m_merge"),
        _edge("m_merge", "s_final"),
    ]
    definition = {
        "steps": steps,
        "default_model": "gemini-flash",
        "max_execution_time": 300,
    }
    wf = _base_workflow("Fan-out + Merge all (v2)", definition, canvas_v2=True)
    return _install(wf, edges=edges)
