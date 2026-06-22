"""Workflow Executor — runs compiled workflows with optional SSE streaming.

Supports:
- Full execution (run) — returns final result
- SSE streaming (run_stream) — yields events per step
- Per-step timeout
- Retry with exponential backoff for tool/action steps
- Rate limiting (max N executions per hour per workflow)
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from collections import defaultdict
from datetime import datetime, timezone
from typing import AsyncGenerator

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Rate limiter — in-memory, per workflow
# ---------------------------------------------------------------------------

_rate_limit_window: dict[str, list[float]] = defaultdict(list)
MAX_RUNS_PER_HOUR = 30


def _check_rate_limit(workflow_id: str) -> bool:
    """Return True if the workflow is within the rate limit."""
    now = time.time()
    window = _rate_limit_window[workflow_id]
    # Remove entries older than 1 hour
    _rate_limit_window[workflow_id] = [t for t in window if now - t < 3600]
    if len(_rate_limit_window[workflow_id]) >= MAX_RUNS_PER_HOUR:
        return False
    _rate_limit_window[workflow_id].append(now)
    return True


# ---------------------------------------------------------------------------
# Retry helper
# ---------------------------------------------------------------------------


async def _retry_with_backoff(
    coro_factory,
    max_retries: int = 3,
    base_delay: float = 1.0,
):
    """Execute an async callable with exponential backoff on failure."""
    last_error = None
    for attempt in range(max_retries + 1):
        try:
            return await coro_factory()
        except Exception as e:
            last_error = e
            if attempt < max_retries:
                delay = base_delay * (2**attempt)
                logger.warning(
                    "Retry %d/%d after %.1fs: %s",
                    attempt + 1,
                    max_retries,
                    delay,
                    str(e),
                )
                await asyncio.sleep(delay)
    raise last_error  # type: ignore[misc]


class SSEEvent:
    """A single Server-Sent Event."""

    def __init__(self, event: str, data: dict) -> None:
        self.event = event
        self.data = data

    def format(self) -> str:
        return f"event: {self.event}\ndata: {json.dumps(self.data)}\n\n"


class WorkflowExecutor:
    """Executes compiled workflow graphs with timeout, retry, and rate limiting."""

    def __init__(self) -> None:
        from .compiler import WorkflowCompiler

        self.compiler = WorkflowCompiler()

    async def run(
        self,
        workflow_id: str,
        run_id: str,
        definition: dict,
        overrides: dict | None = None,
        depth: int = 0,
        edges: list[dict] | None = None,
        client_id: str | None = None,
    ) -> dict:
        """Execute workflow fully and return the final state.

        SPEC-005: when `edges` is provided (or `definition.edges` is set),
        the compiler routes through the v2 path. Existing callers that pass
        `definition` only keep the v1 behaviour unchanged.
        """
        # Rate limit check
        if not _check_rate_limit(workflow_id):
            raise RuntimeError(
                f"Rate limit exceeded: max {MAX_RUNS_PER_HOUR} runs/hour for workflow {workflow_id}"
            )

        graph = self.compiler.compile(definition, edges=edges)
        max_time = definition.get("max_execution_time", 300)

        initial_state = {
            "workflow_id": workflow_id,
            "run_id": run_id,
            "client_id": client_id,
            "steps_output": {},
            "current_step": "",
            "status": "running",
            "messages": [],
            "human_input": None,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "model": definition.get("default_model", "gemini-flash"),
            "error": None,
            "_depth": depth,
            "config_overrides": {},
        }

        config = {"configurable": {"thread_id": run_id}}

        try:
            result = await asyncio.wait_for(
                graph.ainvoke(initial_state, config),
                timeout=max_time,
            )
            return result
        except asyncio.TimeoutError:
            raise RuntimeError(f"Workflow execution timed out after {max_time}s")

    async def run_with_logs(
        self,
        workflow_id: str,
        run_id: str,
        definition: dict,
        overrides: dict | None = None,
        depth: int = 0,
        edges: list[dict] | None = None,
        client_id: str | None = None,
    ) -> dict:
        """Execute a workflow and capture real per-step logs (timing/output/status).

        Mirrors ``run`` but drives the graph with ``astream`` so each step's
        completion is observed individually. Never raises: on timeout or a node
        exception it returns ``status="failed"`` with whatever logs were
        collected up to that point — so the runs history is always persistable.

        Returns ``{steps_output, step_logs, status, error}``.
        """
        if not _check_rate_limit(workflow_id):
            return {
                "steps_output": {},
                "step_logs": [],
                "status": "failed",
                "error": f"Rate limit exceeded: max {MAX_RUNS_PER_HOUR} runs/hour",
            }

        # compile() roda fora do try/except do _drive() abaixo; sem este guard,
        # um erro de compilacao (ex.: definicao malformada) propagaria e o
        # caller (router) nunca chamaria update_run — o registro do run ficaria
        # travado em "running" para sempre.
        try:
            graph = self.compiler.compile(definition, edges=edges)
        except Exception as e:  # noqa: BLE001 — capture so the run can be persisted as failed
            logger.error("Workflow %s compile failed: %s", workflow_id, e)
            return {
                "steps_output": {},
                "step_logs": [],
                "status": "failed",
                "error": f"Erro ao compilar workflow: {e}",
            }

        max_time = definition.get("max_execution_time", 300)

        initial_state = {
            "workflow_id": workflow_id,
            "run_id": run_id,
            "client_id": client_id,
            "steps_output": {},
            "current_step": "",
            "status": "running",
            "messages": [],
            "human_input": None,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "model": definition.get("default_model", "gemini-flash"),
            "error": None,
            "_depth": depth,
            "config_overrides": overrides or {},
        }
        config = {"configurable": {"thread_id": run_id}}

        step_names = {s["id"]: s.get("name") for s in definition.get("steps", [])}
        step_logs: list[dict] = []
        final_outputs: dict = {}
        logged_step_ids: set[str] = set()
        status = "completed"
        error: str | None = None
        last_ts = datetime.now(timezone.utc)

        async def _drive() -> None:
            nonlocal final_outputs, last_ts
            async for event in graph.astream(initial_state, config, stream_mode="updates"):
                now = datetime.now(timezone.utc)
                for node_name, update in event.items():
                    # Skip LangGraph internal channels (e.g. __interrupt__).
                    if node_name.startswith("__"):
                        continue
                    node_outputs = (
                        update.get("steps_output", {}) if isinstance(update, dict) else {}
                    )
                    final_outputs = {**final_outputs, **node_outputs}

                    # Embedded tool steps ran inside this node — their outputs
                    # appear in node_outputs alongside the main node output.
                    # Log them first (execution order), then log the main node.
                    for sid in node_outputs:
                        if sid in logged_step_ids or sid == node_name:
                            continue
                        traw = node_outputs[sid]
                        is_terr = isinstance(traw, dict) and bool(traw.get("error"))
                        tout_obj = traw if isinstance(traw, (dict, list)) else {"value": traw}
                        step_logs.append(
                            {
                                "step_id": sid,
                                "step_name": step_names.get(sid),
                                "status": "failed" if is_terr else "completed",
                                "output": tout_obj,
                                "error": traw.get("error") if is_terr else None,
                                "started_at": last_ts,
                                "completed_at": now,
                                "duration_ms": int((now - last_ts).total_seconds() * 1000),
                            }
                        )
                        logged_step_ids.add(sid)

                    raw = node_outputs.get(node_name)
                    is_err = isinstance(raw, dict) and bool(raw.get("error"))
                    # StepLog.output is JSON object — wrap scalars/strings.
                    out_obj = raw if isinstance(raw, (dict, list)) else {"value": raw}
                    step_logs.append(
                        {
                            "step_id": node_name,
                            "step_name": step_names.get(node_name),
                            "status": "failed" if is_err else "completed",
                            "output": out_obj,
                            "error": raw.get("error") if is_err else None,
                            "started_at": last_ts,
                            "completed_at": now,
                            "duration_ms": int((now - last_ts).total_seconds() * 1000),
                        }
                    )
                    logged_step_ids.add(node_name)
                    last_ts = now

        try:
            await asyncio.wait_for(_drive(), timeout=max_time)
        except asyncio.TimeoutError:
            status = "failed"
            error = f"Workflow execution timed out after {max_time}s"
        except Exception as e:  # noqa: BLE001 — capture so logs survive
            status = "failed"
            error = str(e)
            logger.error("Workflow %s run_with_logs failed: %s", workflow_id, error)

        if any(sl["status"] == "failed" for sl in step_logs) and status == "completed":
            status = "failed"

        return {
            "steps_output": final_outputs,
            "step_logs": step_logs,
            "status": status,
            "error": error,
        }

    async def run_stream(
        self,
        workflow_id: str,
        run_id: str,
        definition: dict,
        depth: int = 0,
        edges: list[dict] | None = None,
        client_id: str | None = None,
    ) -> AsyncGenerator[SSEEvent, None]:
        """Execute with streaming SSE events per step (SPEC-005-aware)."""
        # Rate limit check
        if not _check_rate_limit(workflow_id):
            yield SSEEvent(
                "workflow_failed",
                {"error": f"Rate limit exceeded: max {MAX_RUNS_PER_HOUR} runs/hour"},
            )
            return

        graph = self.compiler.compile(definition, edges=edges)
        max_time = definition.get("max_execution_time", 300)

        initial_state = {
            "workflow_id": workflow_id,
            "run_id": run_id,
            "client_id": client_id,
            "steps_output": {},
            "current_step": "",
            "status": "running",
            "messages": [],
            "human_input": None,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "model": definition.get("default_model", "gemini-flash"),
            "error": None,
            "_depth": depth,
            "config_overrides": {},
        }

        config = {"configurable": {"thread_id": run_id}}

        yield SSEEvent(
            "workflow_started",
            {"workflow_id": workflow_id, "run_id": run_id},
        )

        try:
            step_start = time.time()
            streamed_step_ids: set[str] = set()

            async for event in graph.astream(initial_state, config, stream_mode="updates"):
                # Check overall timeout
                elapsed = time.time() - step_start
                if elapsed > max_time:
                    yield SSEEvent(
                        "workflow_failed",
                        {"error": f"Workflow execution timed out after {max_time}s"},
                    )
                    return

                for node_name, update in event.items():
                    all_outputs = update.get("steps_output", {}) if isinstance(update, dict) else {}
                    # Yield embedded tool outputs first (they ran before the LLM).
                    for sid in all_outputs:
                        if sid in streamed_step_ids or sid == node_name:
                            continue
                        yield SSEEvent(
                            "step_completed",
                            {"step_id": sid, "output": all_outputs[sid]},
                        )
                        streamed_step_ids.add(sid)
                    yield SSEEvent(
                        "step_completed",
                        {"step_id": node_name, "output": all_outputs.get(node_name)},
                    )
                    streamed_step_ids.add(node_name)

            yield SSEEvent(
                "workflow_completed",
                {"workflow_id": workflow_id, "run_id": run_id},
            )
        except Exception as e:
            logger.error("Workflow %s stream failed: %s", workflow_id, str(e))
            yield SSEEvent("workflow_failed", {"error": str(e)})
