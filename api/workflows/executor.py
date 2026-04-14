"""Workflow Executor — runs compiled workflows with optional SSE streaming.

Supports:
- Full execution (run) — returns final result
- SSE streaming (run_stream) — yields events per step
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import AsyncGenerator


class SSEEvent:
    """A single Server-Sent Event."""

    def __init__(self, event: str, data: dict) -> None:
        self.event = event
        self.data = data

    def format(self) -> str:
        return f"event: {self.event}\ndata: {json.dumps(self.data)}\n\n"


class WorkflowExecutor:
    """Executes compiled workflow graphs."""

    def __init__(self) -> None:
        from .compiler import WorkflowCompiler

        self.compiler = WorkflowCompiler()

    async def run(
        self,
        workflow_id: str,
        run_id: str,
        definition: dict,
        overrides: dict | None = None,
    ) -> dict:
        """Execute workflow fully and return the final state."""
        graph = self.compiler.compile(definition)

        initial_state = {
            "workflow_id": workflow_id,
            "run_id": run_id,
            "steps_output": {},
            "current_step": "",
            "status": "running",
            "messages": [],
            "human_input": None,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "model": definition.get("default_model", "gemini-flash"),
            "error": None,
        }

        config = {"configurable": {"thread_id": run_id}}
        result = await graph.ainvoke(initial_state, config)
        return result

    async def run_stream(
        self,
        workflow_id: str,
        run_id: str,
        definition: dict,
    ) -> AsyncGenerator[SSEEvent, None]:
        """Execute with streaming SSE events per step."""
        graph = self.compiler.compile(definition)

        initial_state = {
            "workflow_id": workflow_id,
            "run_id": run_id,
            "steps_output": {},
            "current_step": "",
            "status": "running",
            "messages": [],
            "human_input": None,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "model": definition.get("default_model", "gemini-flash"),
            "error": None,
        }

        config = {"configurable": {"thread_id": run_id}}

        yield SSEEvent(
            "workflow_started",
            {"workflow_id": workflow_id, "run_id": run_id},
        )

        try:
            async for event in graph.astream(
                initial_state, config, stream_mode="updates"
            ):
                for node_name, update in event.items():
                    yield SSEEvent(
                        "step_completed",
                        {
                            "step_id": node_name,
                            "output": update.get("steps_output", {}).get(node_name),
                        },
                    )

            yield SSEEvent(
                "workflow_completed",
                {"workflow_id": workflow_id, "run_id": run_id},
            )
        except Exception as e:
            yield SSEEvent("workflow_failed", {"error": str(e)})
