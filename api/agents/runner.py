"""Agent runner — executes agent graph synchronously as a BackgroundTask.

In-memory store (Fase C). DB persistence deferred to Fase D.
"""
from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone

from langchain_core.messages import HumanMessage

TIMEOUT_SECONDS = 600  # 10 min per SPEC-021 CA-14

# In-memory stores (Fase C — replace with DB in Fase D)
_runs: dict[str, dict] = {}
_runs_by_agent: dict[str, list[str]] = {}  # agent_id → ordered run IDs (newest first)


def create_run(
    agent_id: str,
    triggered_by: str,
    input_text: str,
    client_id: str | None = None,
) -> dict:
    """Create a new run record in pending state."""
    run_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    run = {
        "id": run_id,
        "agent_id": agent_id,
        "status": "pending",
        "triggered_by": triggered_by,
        "client_id": client_id,
        "duration_ms": None,
        "started_at": now,
        "finished_at": None,
        "input": {"text": input_text},
        "output": None,
        "error_message": None,
    }
    _runs[run_id] = run
    _runs_by_agent.setdefault(agent_id, []).insert(0, run_id)
    return run


def get_run(run_id: str) -> dict | None:
    return _runs.get(run_id)


def list_runs(agent_id: str, limit: int = 50, offset: int = 0) -> list[dict]:
    ids = _runs_by_agent.get(agent_id, [])
    return [_runs[rid] for rid in ids[offset : offset + limit] if rid in _runs]


def execute_run(run_id: str, agent: dict) -> None:
    """Synchronous runner invoked as FastAPI BackgroundTask (runs in thread pool).

    Timeout: LLM SDK-level only for Fase C. Hard 10-min threading timeout in Fase D.
    """
    run = _runs.get(run_id)
    if not run:
        return

    run["status"] = "running"
    start = time.monotonic()

    try:
        from .graph import build_agent_graph
        from .memory import load_memory_context
        from .skill_loader import skill_to_tool

        skill_tools = [
            skill_to_tool(slug) for slug in (agent.get("assigned_skills") or [])
        ]
        memory_ctx = load_memory_context(agent["id"])
        graph = build_agent_graph(
            instructions=agent.get("instructions", ""),
            skill_tools=skill_tools,
            memory_context=memory_ctx,
        )

        input_text = run["input"].get("text", "")
        state = graph.invoke({"messages": [HumanMessage(content=input_text)]})
        last_msg = state["messages"][-1]
        output_text = getattr(last_msg, "content", str(last_msg))

        elapsed_ms = int((time.monotonic() - start) * 1000)
        run.update(
            {
                "status": "completed",
                "output": {"text": output_text},
                "duration_ms": elapsed_ms,
                "finished_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    except Exception as exc:  # noqa: BLE001
        elapsed_ms = int((time.monotonic() - start) * 1000)
        run.update(
            {
                "status": "failed",
                "duration_ms": elapsed_ms,
                "finished_at": datetime.now(timezone.utc).isoformat(),
                "error_message": str(exc),
            }
        )
