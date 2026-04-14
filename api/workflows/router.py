"""FastAPI router for Workflow CRUD + execution endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from fastapi.responses import StreamingResponse

from .schemas import (
    ResumeRunRequest,
    RunWorkflowRequest,
    RunWorkflowResponse,
    StepLogResponse,
    WorkflowCreate,
    WorkflowDetailResponse,
    WorkflowListResponse,
    WorkflowResponse,
    WorkflowRunListResponse,
    WorkflowRunResponse,
    WorkflowRunSummary,
    WorkflowUpdate,
)

router = APIRouter(tags=["Workflows"])

# ---------------------------------------------------------------------------
# In-memory store (dev — replace with DB later)
# ---------------------------------------------------------------------------
_workflows: dict[str, dict] = {}
_runs: dict[str, dict] = {}
_step_logs: dict[str, list] = {}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _workflow_to_response(w: dict) -> WorkflowResponse:
    # Find latest run for this workflow
    last_run = None
    wf_runs = [r for r in _runs.values() if r["workflow_id"] == w["id"]]
    if wf_runs:
        latest = max(wf_runs, key=lambda r: r["created_at"])
        last_run = WorkflowRunSummary(
            run_id=latest["id"],
            status=latest["status"],
            completed_at=latest.get("completed_at"),
        )

    return WorkflowResponse(
        id=w["id"],
        name=w["name"],
        description=w.get("description"),
        status=w["status"],
        steps_count=len(w["definition"].get("steps", [])),
        schedule_cron=w.get("schedule_cron"),
        schedule_enabled=w.get("schedule_enabled", False),
        last_run=last_run,
        created_by=w["created_by"],
        created_at=w["created_at"],
        updated_at=w["updated_at"],
    )


def _workflow_to_detail(w: dict) -> WorkflowDetailResponse:
    last_run = None
    wf_runs = [r for r in _runs.values() if r["workflow_id"] == w["id"]]
    if wf_runs:
        latest = max(wf_runs, key=lambda r: r["created_at"])
        last_run = WorkflowRunSummary(
            run_id=latest["id"],
            status=latest["status"],
            completed_at=latest.get("completed_at"),
        )

    return WorkflowDetailResponse(
        id=w["id"],
        name=w["name"],
        description=w.get("description"),
        status=w["status"],
        steps_count=len(w["definition"].get("steps", [])),
        schedule_cron=w.get("schedule_cron"),
        schedule_enabled=w.get("schedule_enabled", False),
        last_run=last_run,
        created_by=w["created_by"],
        created_at=w["created_at"],
        updated_at=w["updated_at"],
        definition=w["definition"],
        client_scope=w.get("client_scope", []),
        default_model=w.get("default_model", "gemini-flash"),
        max_execution_time=w.get("max_execution_time", 300),
    )


# ---------------------------------------------------------------------------
# CRUD endpoints
# ---------------------------------------------------------------------------


@router.get("/")
async def list_workflows(
    status: str | None = None,
    creator: str | None = None,
) -> WorkflowListResponse:
    """List all workflows, optionally filtered by status or creator."""
    items = list(_workflows.values())
    if status:
        items = [w for w in items if w["status"] == status]
    if creator:
        items = [w for w in items if w["created_by"] == creator]
    return WorkflowListResponse(
        workflows=[_workflow_to_response(w) for w in items],
        total=len(items),
    )


@router.post("/", status_code=201)
async def create_workflow(req: WorkflowCreate) -> WorkflowDetailResponse:
    """Create a new workflow. Maximum 20 steps allowed."""
    if len(req.steps) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 steps per workflow")

    now = _now()
    wf_id = str(uuid.uuid4())

    definition = {
        "steps": [s.model_dump() for s in req.steps],
        "default_model": req.default_model,
        "max_execution_time": req.max_execution_time,
    }

    wf = {
        "id": wf_id,
        "name": req.name,
        "description": req.description,
        "created_by": "admin",  # TODO: extract from auth
        "definition": definition,
        "schedule_cron": req.schedule.cron if req.schedule else None,
        "schedule_timezone": req.schedule.timezone if req.schedule else "America/Sao_Paulo",
        "schedule_enabled": req.schedule.enabled if req.schedule else False,
        "client_scope": req.client_scope,
        "default_model": req.default_model,
        "max_execution_time": req.max_execution_time,
        "status": "draft",
        "created_at": now,
        "updated_at": now,
    }

    _workflows[wf_id] = wf
    return _workflow_to_detail(wf)


@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str) -> WorkflowDetailResponse:
    """Get a workflow by ID."""
    wf = _workflows.get(workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return _workflow_to_detail(wf)


@router.put("/{workflow_id}")
async def update_workflow(workflow_id: str, req: WorkflowUpdate) -> WorkflowDetailResponse:
    """Update an existing workflow."""
    wf = _workflows.get(workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if req.name is not None:
        wf["name"] = req.name
    if req.description is not None:
        wf["description"] = req.description
    if req.steps is not None:
        if len(req.steps) > 20:
            raise HTTPException(status_code=400, detail="Maximum 20 steps per workflow")
        wf["definition"]["steps"] = [s.model_dump() for s in req.steps]
    if req.schedule is not None:
        wf["schedule_cron"] = req.schedule.cron
        wf["schedule_timezone"] = req.schedule.timezone
        wf["schedule_enabled"] = req.schedule.enabled
    if req.status is not None:
        if req.status not in ("draft", "active", "paused"):
            raise HTTPException(status_code=400, detail="Invalid status")
        wf["status"] = req.status
    if req.client_scope is not None:
        wf["client_scope"] = req.client_scope
    if req.default_model is not None:
        wf["default_model"] = req.default_model
        wf["definition"]["default_model"] = req.default_model
    if req.max_execution_time is not None:
        wf["max_execution_time"] = req.max_execution_time
        wf["definition"]["max_execution_time"] = req.max_execution_time

    wf["updated_at"] = _now()
    return _workflow_to_detail(wf)


@router.delete("/{workflow_id}", status_code=204)
async def delete_workflow(workflow_id: str):
    """Delete a workflow and all associated runs."""
    if workflow_id not in _workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Remove associated runs and step logs
    run_ids_to_remove = [
        r["id"] for r in _runs.values() if r["workflow_id"] == workflow_id
    ]
    for run_id in run_ids_to_remove:
        _step_logs.pop(run_id, None)
        _runs.pop(run_id, None)

    del _workflows[workflow_id]


# ---------------------------------------------------------------------------
# Execution endpoints
# ---------------------------------------------------------------------------


@router.post("/{workflow_id}/run")
async def run_workflow(
    workflow_id: str,
    req: RunWorkflowRequest = RunWorkflowRequest(),
) -> RunWorkflowResponse:
    """Trigger a new workflow run."""
    wf = _workflows.get(workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    now = _now()
    run_id = str(uuid.uuid4())
    run = {
        "id": run_id,
        "workflow_id": workflow_id,
        "status": "running",
        "trigger": "manual",
        "started_at": now,
        "completed_at": None,
        "error": None,
        "steps_output": {},
        "checkpoint_data": None,
        "created_at": now,
    }
    _runs[run_id] = run
    _step_logs[run_id] = []

    # Execute asynchronously via executor
    try:
        from .executor import WorkflowExecutor

        executor = WorkflowExecutor()
        result = await executor.run(
            workflow_id=workflow_id,
            run_id=run_id,
            definition=wf["definition"],
            overrides=req.input_overrides,
        )
        run["status"] = "completed"
        run["completed_at"] = _now()
        run["steps_output"] = result.get("steps_output", {})
    except Exception as e:
        run["status"] = "failed"
        run["completed_at"] = _now()
        run["error"] = str(e)

    return RunWorkflowResponse(
        run_id=run_id,
        status=run["status"],
        started_at=now,
    )


@router.get("/{workflow_id}/runs")
async def list_runs(workflow_id: str) -> WorkflowRunListResponse:
    """List all runs for a workflow."""
    if workflow_id not in _workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")

    wf_runs = [r for r in _runs.values() if r["workflow_id"] == workflow_id]
    wf_runs.sort(key=lambda r: r["created_at"], reverse=True)

    return WorkflowRunListResponse(
        runs=[
            WorkflowRunResponse(
                id=r["id"],
                workflow_id=r["workflow_id"],
                status=r["status"],
                trigger=r["trigger"],
                started_at=r.get("started_at"),
                completed_at=r.get("completed_at"),
                error=r.get("error"),
                steps_output=r.get("steps_output", {}),
                step_logs=[
                    StepLogResponse(
                        id=sl.get("id", ""),
                        step_id=sl.get("step_id", ""),
                        step_name=sl.get("step_name"),
                        status=sl.get("status", ""),
                        input=sl.get("input"),
                        output=sl.get("output"),
                        error=sl.get("error"),
                        duration_ms=sl.get("duration_ms"),
                        started_at=sl.get("started_at"),
                        completed_at=sl.get("completed_at"),
                    )
                    for sl in _step_logs.get(r["id"], [])
                ],
            )
            for r in wf_runs
        ],
        total=len(wf_runs),
    )


@router.get("/{workflow_id}/runs/{run_id}")
async def get_run(workflow_id: str, run_id: str) -> WorkflowRunResponse:
    """Get details of a specific run."""
    run = _runs.get(run_id)
    if not run or run["workflow_id"] != workflow_id:
        raise HTTPException(status_code=404, detail="Run not found")

    return WorkflowRunResponse(
        id=run["id"],
        workflow_id=run["workflow_id"],
        status=run["status"],
        trigger=run["trigger"],
        started_at=run.get("started_at"),
        completed_at=run.get("completed_at"),
        error=run.get("error"),
        steps_output=run.get("steps_output", {}),
        step_logs=[
            StepLogResponse(
                id=sl.get("id", ""),
                step_id=sl.get("step_id", ""),
                step_name=sl.get("step_name"),
                status=sl.get("status", ""),
                input=sl.get("input"),
                output=sl.get("output"),
                error=sl.get("error"),
                duration_ms=sl.get("duration_ms"),
                started_at=sl.get("started_at"),
                completed_at=sl.get("completed_at"),
            )
            for sl in _step_logs.get(run_id, [])
        ],
    )


@router.post("/{workflow_id}/runs/{run_id}/resume")
async def resume_run(
    workflow_id: str,
    run_id: str,
    req: ResumeRunRequest,
) -> WorkflowRunResponse:
    """Resume a paused run (HITL interrupt/resume)."""
    run = _runs.get(run_id)
    if not run or run["workflow_id"] != workflow_id:
        raise HTTPException(status_code=404, detail="Run not found")
    if run["status"] != "paused":
        raise HTTPException(status_code=400, detail="Run is not paused")

    # In a real implementation, we would resume the LangGraph checkpoint
    # with Command(resume={...}). For now, update status.
    run["status"] = "completed" if req.approved else "failed"
    run["completed_at"] = _now()
    if not req.approved:
        run["error"] = req.feedback or "Rejected during human review"

    return WorkflowRunResponse(
        id=run["id"],
        workflow_id=run["workflow_id"],
        status=run["status"],
        trigger=run["trigger"],
        started_at=run.get("started_at"),
        completed_at=run.get("completed_at"),
        error=run.get("error"),
        steps_output=run.get("steps_output", {}),
        step_logs=[],
    )


@router.get("/{workflow_id}/runs/{run_id}/stream")
async def stream_run(workflow_id: str, run_id: str):
    """Stream workflow execution via SSE."""
    wf = _workflows.get(workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    from .executor import WorkflowExecutor

    executor = WorkflowExecutor()

    async def event_generator():
        async for event in executor.run_stream(
            workflow_id=workflow_id,
            run_id=run_id,
            definition=wf["definition"],
        ):
            yield event.format()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
