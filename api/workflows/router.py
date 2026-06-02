"""FastAPI router for Workflow CRUD + execution endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from .schemas import (
    AutoLayoutResponse,
    MigrateV2Response,
    ResumeRunRequest,
    RunWorkflowRequest,
    RunWorkflowResponse,
    SetEdgesRequest,
    StepLogResponse,
    ValidateWorkflowResponse,
    WorkflowCreate,
    WorkflowDetailResponse,
    WorkflowEdge,
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
# Validation helpers
# ---------------------------------------------------------------------------


def _validate_workflow_steps(workflow_id: str, steps: list[dict]) -> list[str]:
    """Validate workflow steps. Returns list of error messages."""
    errors = []
    for step in steps:
        if step.get("type") == "workflow":
            ref_id = step.get("workflow_id")
            if not ref_id:
                errors.append(
                    f"Step '{step.get('name', step.get('id', '?'))}': "
                    "workflow_id is required for type 'workflow'"
                )
            elif ref_id == workflow_id:
                errors.append(
                    f"Step '{step.get('name', step.get('id', '?'))}': "
                    "circular reference \u2014 cannot reference self"
                )
    return errors


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

    # Validate workflow step references (circular, missing workflow_id)
    step_dicts = [s.model_dump() for s in req.steps]
    step_errors = _validate_workflow_steps(wf_id, step_dicts)
    if step_errors:
        raise HTTPException(status_code=422, detail=step_errors)

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
    """Update an existing workflow.

    SPEC-005 TASK-B01b: when steps change, run `hard_validate_for_put` against
    the *resulting* state. Hard findings (cycle, unauthorized_tool,
    max_nodes_exceeded, edge_to_nonexistent_handle, no_entry_node) block the
    save with 400 and a structured payload so the canvas can revert.
    Soft findings (fan_in_without_merge, merge_with_zero_inputs) do NOT block
    save — they show up as warnings on POST /validate.
    """
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
        step_dicts = [s.model_dump() for s in req.steps]
        step_errors = _validate_workflow_steps(workflow_id, step_dicts)
        if step_errors:
            raise HTTPException(status_code=422, detail=step_errors)
        wf["definition"]["steps"] = step_dicts

        # SPEC-005 TASK-B01b: hard validation against the new step set.
        # Edges aren't part of the PUT body in this endpoint (canvas uses
        # dedicated /edges endpoints), so we validate against whatever edges
        # are currently persisted plus the new steps.
        from .validator import hard_validate_for_put

        hard_errors = hard_validate_for_put(wf)
        if hard_errors:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "validation_failed",
                    "errors": [e.model_dump() for e in hard_errors],
                },
            )
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
    run_ids_to_remove = [r["id"] for r in _runs.values() if r["workflow_id"] == workflow_id]
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

    # Execute asynchronously via executor (SPEC-005-aware: pass edges if v2).
    try:
        from .executor import WorkflowExecutor

        executor = WorkflowExecutor()
        result = await executor.run(
            workflow_id=workflow_id,
            run_id=run_id,
            definition=wf["definition"],
            overrides=req.input_overrides,
            edges=wf.get("edges"),
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


# ---------------------------------------------------------------------------
# Schedule endpoints
# ---------------------------------------------------------------------------


@router.post("/{workflow_id}/schedule")
async def create_schedule(workflow_id: str) -> dict:
    """Create or update a Cloud Scheduler job for this workflow."""
    wf = _workflows.get(workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if not wf.get("schedule_cron"):
        raise HTTPException(
            status_code=400,
            detail="Workflow has no schedule configured",
        )

    from config import settings

    from .scheduler import WorkflowScheduler

    scheduler = WorkflowScheduler(
        project_id=settings.GCP_PROJECT_ID or "",
        location=settings.GCP_REGION,
        api_base_url=f"http://localhost:{settings.API_PORT}",
    )
    result = await scheduler.create_or_update(
        workflow_id=workflow_id,
        cron=wf["schedule_cron"],
        timezone=wf.get("schedule_timezone", "America/Sao_Paulo"),
    )

    wf["schedule_enabled"] = True
    wf["updated_at"] = _now()
    return result


@router.delete("/{workflow_id}/schedule")
async def delete_schedule(workflow_id: str) -> dict:
    """Delete the Cloud Scheduler job for this workflow."""
    wf = _workflows.get(workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    from config import settings

    from .scheduler import WorkflowScheduler

    scheduler = WorkflowScheduler(
        project_id=settings.GCP_PROJECT_ID or "",
        location=settings.GCP_REGION,
    )
    await scheduler.delete(workflow_id=workflow_id)

    wf["schedule_enabled"] = False
    wf["updated_at"] = _now()
    return {"deleted": True, "workflow_id": workflow_id}


# ---------------------------------------------------------------------------
# Templates endpoint
# ---------------------------------------------------------------------------

_TEMPLATES = [
    {
        "id": "template-report-mensal",
        "name": "Relatorio Mensal",
        "description": "Gera report de performance e envia para Slack",
        "steps": [
            {
                "id": "s1",
                "name": "Buscar dados",
                "type": "tool",
                "tool_name": "query_data",
                "config": {"query": "metricas do mes"},
            },
            {
                "id": "s2",
                "name": "Gerar analise",
                "type": "llm",
                "prompt": "Analise os dados: {{previous}}",
                "config": {},
            },
            {
                "id": "s3",
                "name": "Enviar para Slack",
                "type": "action",
                "tool_name": "send_slack",
                "config": {"channel": "#reports"},
            },
        ],
    },
    {
        "id": "template-briefing-criativo",
        "name": "Briefing Criativo",
        "description": "Coleta dados do cliente, pesquisa referencias e gera briefing completo",
        "steps": [
            {
                "id": "s1",
                "name": "Coletar dados do cliente",
                "type": "tool",
                "tool_name": "search_knowledge",
                "config": {"query": "dados do cliente"},
            },
            {
                "id": "s2",
                "name": "Pesquisar referencias",
                "type": "tool",
                "tool_name": "search_knowledge",
                "config": {"query": "referencias criativas"},
            },
            {
                "id": "s3",
                "name": "Gerar briefing",
                "type": "llm",
                "prompt": (
                    "Com base nos dados: {{steps.s1}} e referencias: {{steps.s2}}, "
                    "gere um briefing criativo."
                ),
                "config": {},
            },
            {
                "id": "s4",
                "name": "Revisao humana",
                "type": "hitl",
                "config": {"review_instructions": "Valide o briefing gerado"},
            },
        ],
    },
    {
        "id": "template-monitor-social",
        "name": "Monitor de Redes Sociais",
        "description": "Monitora mencoes, analisa sentimento e dispara alerta se negativo",
        "steps": [
            {
                "id": "s1",
                "name": "Coletar mencoes",
                "type": "tool",
                "tool_name": "search_knowledge",
                "config": {"query": "mencoes recentes"},
            },
            {
                "id": "s2",
                "name": "Analisar sentimento",
                "type": "llm",
                "prompt": "Analise o sentimento: {{previous}}",
                "config": {},
            },
            {
                "id": "s3",
                "name": "Registrar resultado",
                "type": "action",
                "tool_name": "log_result",
                "config": {},
            },
        ],
    },
    {
        "id": "template-pesquisa-mercado",
        "name": "Pesquisa de Mercado",
        "description": "Busca tendencias, analisa concorrentes e gera insights acionaveis",
        "steps": [
            {
                "id": "s1",
                "name": "Buscar tendencias",
                "type": "tool",
                "tool_name": "search_knowledge",
                "config": {"query": "tendencias de mercado"},
            },
            {
                "id": "s2",
                "name": "Analisar concorrentes",
                "type": "tool",
                "tool_name": "search_knowledge",
                "config": {"query": "analise concorrentes"},
            },
            {
                "id": "s3",
                "name": "Gerar insights",
                "type": "llm",
                "prompt": "Insights sobre {{steps.s1}} e {{steps.s2}}",
                "config": {},
            },
            {
                "id": "s4",
                "name": "Revisar insights",
                "type": "hitl",
                "config": {"review_instructions": "Valide os insights"},
            },
            {
                "id": "s5",
                "name": "Enviar por email",
                "type": "action",
                "tool_name": "send_email",
                "config": {"to": "team@example.com"},
            },
        ],
    },
]


@router.get("/templates/list")
async def list_templates() -> list[dict]:
    """Return available workflow templates."""
    return _TEMPLATES


# ---------------------------------------------------------------------------
# SPEC-005 (Workflow Builder Canvas) — endpoint skeletons
# Phase A delivers these as 501 Not Implemented; Phase B fills in real bodies.
# Each handler asserts the workflow exists (404 caixa-preta) before bowing out
# with 501, so the contract surface is real even though behaviour is stubbed.
# ---------------------------------------------------------------------------


def _require_workflow(workflow_id: str) -> dict:
    wf = _workflows.get(workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf


@router.get("/{workflow_id}/edges")
async def get_workflow_edges(workflow_id: str) -> list[WorkflowEdge]:
    """List edges of a workflow (SPEC-005 TASK-B01)."""
    _require_workflow(workflow_id)
    from .edges import get_edges as _get_edges

    raw = _get_edges(workflow_id, _workflows)
    return [WorkflowEdge(**e) for e in raw]


@router.post("/{workflow_id}/edges")
async def set_workflow_edges(workflow_id: str, req: SetEdgesRequest) -> list[WorkflowEdge]:
    """Bulk-replace edges of a workflow (SPEC-005 TASK-B01).

    Validation is structural (handles, step refs, uniqueness). Graph-shape
    validation (cycles, fan-in without merge, …) lives in `validator.py` and
    is enforced on PUT /api/workflows/{id} (TASK-B01b).
    """
    _require_workflow(workflow_id)
    from .edges import EdgeValidationError
    from .edges import set_edges as _set_edges

    try:
        persisted = _set_edges(workflow_id, req.edges, _workflows)
    except EdgeValidationError as err:
        raise HTTPException(
            status_code=400,
            detail={"error": str(err), "edge_index": err.edge_index},
        ) from err

    # Bump updated_at so concurrent-edit banner (FR-WBC-13) reflects the change.
    _workflows[workflow_id]["updated_at"] = _now()
    return [WorkflowEdge(**e) for e in persisted]


@router.delete("/{workflow_id}/edges/{edge_id}", status_code=204)
async def delete_workflow_edge(workflow_id: str, edge_id: str) -> None:
    """Delete a single edge by ID (SPEC-005 TASK-B01)."""
    _require_workflow(workflow_id)
    from .edges import delete_edge as _delete_edge

    removed = _delete_edge(workflow_id, edge_id, _workflows)
    if not removed:
        raise HTTPException(status_code=404, detail="Edge not found")
    _workflows[workflow_id]["updated_at"] = _now()


@router.post("/{workflow_id}/auto-layout")
async def auto_layout_workflow(workflow_id: str) -> AutoLayoutResponse:
    """Compute a server-side layered layout for the workflow graph (TASK-B02)."""
    wf = _require_workflow(workflow_id)
    from .auto_layout import layered_layout

    positions = layered_layout(
        wf["definition"].get("steps", []),
        wf.get("edges", []),
    )
    return AutoLayoutResponse(positions=positions)


@router.post("/{workflow_id}/validate")
async def validate_workflow(workflow_id: str) -> ValidateWorkflowResponse:
    """Validate the workflow graph (TASK-B03).

    Returns hard findings as `errors` and soft findings as `warnings` so the
    canvas can render them differently (errors block run; warnings hint).
    """
    wf = _require_workflow(workflow_id)
    from .validator import validate

    errors, warnings = validate(wf)
    return ValidateWorkflowResponse(errors=errors, warnings=warnings)


@router.post("/{workflow_id}/migrate-v2")
async def migrate_workflow_v2(workflow_id: str) -> MigrateV2Response:
    """Idempotently migrate a v1 workflow to the canvas v2 format (TASK-B06)."""
    _require_workflow(workflow_id)
    from .migration_v1_v2 import migrate_workflow

    result = migrate_workflow(workflow_id, _workflows)
    if result.migrated:
        _workflows[workflow_id]["updated_at"] = _now()
    return MigrateV2Response(
        migrated=result.migrated,
        edges_created=result.edges_created,
        steps_with_position=result.steps_with_position,
    )
