"""FastAPI router for Workflow CRUD + execution endpoints (SPEC-005 / A-4: DB-backed).

A persistência vive em workflows/repository.py. A lógica de canvas (validator,
migration_v1_v2, auto_layout, edges, compiler) opera sobre DICTS — então este
router carrega o workflow como dict do DB, roda a lógica num store temporário
``{id: wf}`` e persiste de volta. Assim a lógica permanece intacta.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

try:
    from core.db import get_session
    from workflows import repository
except ImportError:  # test import root (repo root on sys.path)
    from api.core.db import get_session
    from api.workflows import repository

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
# Validation helpers (lógica pura — inalterada)
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
                    "circular reference — cannot reference self"
                )
    return errors


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _last_run_summary(session: Session, workflow_id: str) -> WorkflowRunSummary | None:
    latest = repository.latest_run(session, workflow_id)
    if not latest:
        return None
    return WorkflowRunSummary(
        run_id=latest["id"],
        status=latest["status"],
        completed_at=latest.get("completed_at"),
    )


def _workflow_to_response(w: dict, last_run: WorkflowRunSummary | None) -> WorkflowResponse:
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


def _workflow_to_detail(w: dict, last_run: WorkflowRunSummary | None) -> WorkflowDetailResponse:
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


def _require_workflow(session: Session, workflow_id: str) -> dict:
    wf = repository.get_workflow(session, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf


# ---------------------------------------------------------------------------
# CRUD endpoints
# ---------------------------------------------------------------------------


@router.get("/")
async def list_workflows(
    status: str | None = None,
    creator: str | None = None,
    session: Session = Depends(get_session),
) -> WorkflowListResponse:
    """List all workflows, optionally filtered by status or creator."""
    items = repository.list_workflows(session, status=status, created_by=creator)
    return WorkflowListResponse(
        workflows=[_workflow_to_response(w, _last_run_summary(session, w["id"])) for w in items],
        total=len(items),
    )


@router.post("/", status_code=201)
async def create_workflow(
    req: WorkflowCreate, session: Session = Depends(get_session)
) -> WorkflowDetailResponse:
    """Create a new workflow. Maximum 20 steps allowed."""
    if len(req.steps) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 steps per workflow")

    now = _now()
    wf_id = str(uuid.uuid4())

    step_dicts = [s.model_dump() for s in req.steps]
    step_errors = _validate_workflow_steps(wf_id, step_dicts)
    if step_errors:
        raise HTTPException(status_code=422, detail=step_errors)

    definition = {
        "steps": step_dicts,
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

    created = repository.create_workflow(session, wf)
    return _workflow_to_detail(created, None)


@router.get("/{workflow_id}")
async def get_workflow(
    workflow_id: str, session: Session = Depends(get_session)
) -> WorkflowDetailResponse:
    """Get a workflow by ID."""
    wf = _require_workflow(session, workflow_id)
    return _workflow_to_detail(wf, _last_run_summary(session, workflow_id))


@router.put("/{workflow_id}")
async def update_workflow(
    workflow_id: str, req: WorkflowUpdate, session: Session = Depends(get_session)
) -> WorkflowDetailResponse:
    """Update an existing workflow (SPEC-005 TASK-B01b: hard validation no PUT)."""
    wf = _require_workflow(session, workflow_id)

    fields: dict = {}
    if req.name is not None:
        fields["name"] = req.name
    if req.description is not None:
        fields["description"] = req.description
    if req.steps is not None:
        if len(req.steps) > 20:
            raise HTTPException(status_code=400, detail="Maximum 20 steps per workflow")
        step_dicts = [s.model_dump() for s in req.steps]
        step_errors = _validate_workflow_steps(workflow_id, step_dicts)
        if step_errors:
            raise HTTPException(status_code=422, detail=step_errors)
        wf["definition"]["steps"] = step_dicts

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
        fields["definition"] = wf["definition"]
    if req.schedule is not None:
        fields["schedule_cron"] = req.schedule.cron
        fields["schedule_timezone"] = req.schedule.timezone
        fields["schedule_enabled"] = req.schedule.enabled
    if req.status is not None:
        if req.status not in ("draft", "active", "paused"):
            raise HTTPException(status_code=400, detail="Invalid status")
        fields["status"] = req.status
    if req.client_scope is not None:
        fields["client_scope"] = req.client_scope
    if req.default_model is not None:
        wf["definition"]["default_model"] = req.default_model
        fields["default_model"] = req.default_model
        fields["definition"] = wf["definition"]
    if req.max_execution_time is not None:
        wf["definition"]["max_execution_time"] = req.max_execution_time
        fields["max_execution_time"] = req.max_execution_time
        fields["definition"] = wf["definition"]

    updated = repository.update_workflow(session, workflow_id, fields)
    return _workflow_to_detail(updated, _last_run_summary(session, workflow_id))


@router.delete("/{workflow_id}", status_code=204)
async def delete_workflow(workflow_id: str, session: Session = Depends(get_session)):
    """Delete a workflow and all associated runs (cascade)."""
    if not repository.delete_workflow(session, workflow_id):
        raise HTTPException(status_code=404, detail="Workflow not found")


# ---------------------------------------------------------------------------
# Execution endpoints
# ---------------------------------------------------------------------------


@router.post("/{workflow_id}/run")
async def run_workflow(
    workflow_id: str,
    req: RunWorkflowRequest = RunWorkflowRequest(),
    session: Session = Depends(get_session),
) -> RunWorkflowResponse:
    """Trigger a new workflow run."""
    wf = _require_workflow(session, workflow_id)

    now = _now()
    run_id = str(uuid.uuid4())
    repository.create_run(
        session,
        {
            "id": run_id,
            "workflow_id": workflow_id,
            "status": "running",
            "trigger": "manual",
            "started_at": now,
        },
    )

    status = "completed"
    error = None
    steps_output: dict = {}
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
        steps_output = result.get("steps_output", {})
    except Exception as e:  # noqa: BLE001
        status = "failed"
        error = str(e)

    repository.update_run(
        session,
        run_id,
        status=status,
        completed_at=_now(),
        steps_output=steps_output,
        error=error,
    )

    return RunWorkflowResponse(run_id=run_id, status=status, started_at=now)


def _run_to_response(session: Session, run: dict) -> WorkflowRunResponse:
    return WorkflowRunResponse(
        id=run["id"],
        workflow_id=run["workflow_id"],
        status=run["status"],
        trigger=run["trigger"],
        started_at=run.get("started_at"),
        completed_at=run.get("completed_at"),
        error=run.get("error"),
        steps_output=run.get("steps_output", {}),
        step_logs=[StepLogResponse(**sl) for sl in repository.list_step_logs(session, run["id"])],
    )


@router.get("/{workflow_id}/runs")
async def list_runs(
    workflow_id: str, session: Session = Depends(get_session)
) -> WorkflowRunListResponse:
    """List all runs for a workflow."""
    if not repository.workflow_exists(session, workflow_id):
        raise HTTPException(status_code=404, detail="Workflow not found")
    runs = repository.list_runs(session, workflow_id)
    return WorkflowRunListResponse(
        runs=[_run_to_response(session, r) for r in runs],
        total=len(runs),
    )


@router.get("/{workflow_id}/runs/{run_id}")
async def get_run(
    workflow_id: str, run_id: str, session: Session = Depends(get_session)
) -> WorkflowRunResponse:
    """Get details of a specific run."""
    run = repository.get_run(session, run_id)
    if not run or run["workflow_id"] != workflow_id:
        raise HTTPException(status_code=404, detail="Run not found")
    return _run_to_response(session, run)


@router.post("/{workflow_id}/runs/{run_id}/resume")
async def resume_run(
    workflow_id: str,
    run_id: str,
    req: ResumeRunRequest,
    session: Session = Depends(get_session),
) -> WorkflowRunResponse:
    """Resume a paused run (HITL interrupt/resume)."""
    run = repository.get_run(session, run_id)
    if not run or run["workflow_id"] != workflow_id:
        raise HTTPException(status_code=404, detail="Run not found")
    if run["status"] != "paused":
        raise HTTPException(status_code=400, detail="Run is not paused")

    error = None if req.approved else (req.feedback or "Rejected during human review")
    run = repository.update_run(
        session,
        run_id,
        status="completed" if req.approved else "failed",
        completed_at=_now(),
        error=error,
    )
    return _run_to_response(session, run)


@router.get("/{workflow_id}/runs/{run_id}/stream")
async def stream_run(workflow_id: str, run_id: str, session: Session = Depends(get_session)):
    """Stream workflow execution via SSE."""
    wf = _require_workflow(session, workflow_id)

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
async def create_schedule(workflow_id: str, session: Session = Depends(get_session)) -> dict:
    """Create or update a Cloud Scheduler job for this workflow."""
    wf = _require_workflow(session, workflow_id)
    if not wf.get("schedule_cron"):
        raise HTTPException(status_code=400, detail="Workflow has no schedule configured")

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

    repository.update_workflow(session, workflow_id, {"schedule_enabled": True})
    return result


@router.delete("/{workflow_id}/schedule")
async def delete_schedule(workflow_id: str, session: Session = Depends(get_session)) -> dict:
    """Delete the Cloud Scheduler job for this workflow."""
    _require_workflow(session, workflow_id)

    from config import settings

    from .scheduler import WorkflowScheduler

    scheduler = WorkflowScheduler(
        project_id=settings.GCP_PROJECT_ID or "",
        location=settings.GCP_REGION,
    )
    await scheduler.delete(workflow_id=workflow_id)

    repository.update_workflow(session, workflow_id, {"schedule_enabled": False})
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
# SPEC-005 (Workflow Builder Canvas) — edges / auto-layout / validate / migrate
# A lógica opera sobre dicts; carregamos do DB, rodamos num store temporário e
# persistimos de volta.
# ---------------------------------------------------------------------------


@router.get("/{workflow_id}/edges")
async def get_workflow_edges(
    workflow_id: str, session: Session = Depends(get_session)
) -> list[WorkflowEdge]:
    """List edges of a workflow (SPEC-005 TASK-B01)."""
    wf = _require_workflow(session, workflow_id)
    return [WorkflowEdge(**e) for e in wf.get("edges", [])]


@router.post("/{workflow_id}/edges")
async def set_workflow_edges(
    workflow_id: str, req: SetEdgesRequest, session: Session = Depends(get_session)
) -> list[WorkflowEdge]:
    """Bulk-replace edges of a workflow (SPEC-005 TASK-B01)."""
    wf = _require_workflow(session, workflow_id)
    from .edges import EdgeValidationError
    from .edges import set_edges as _set_edges

    store = {workflow_id: wf}
    try:
        persisted = _set_edges(workflow_id, req.edges, store)
    except EdgeValidationError as err:
        raise HTTPException(
            status_code=400,
            detail={"error": str(err), "edge_index": err.edge_index},
        ) from err

    repository.replace_edges(session, workflow_id, persisted)
    repository.touch(session, workflow_id)
    return [WorkflowEdge(**e) for e in persisted]


@router.delete("/{workflow_id}/edges/{edge_id}", status_code=204)
async def delete_workflow_edge(
    workflow_id: str, edge_id: str, session: Session = Depends(get_session)
) -> None:
    """Delete a single edge by ID (SPEC-005 TASK-B01)."""
    wf = _require_workflow(session, workflow_id)
    from .edges import delete_edge as _delete_edge

    store = {workflow_id: wf}
    removed = _delete_edge(workflow_id, edge_id, store)
    if not removed:
        raise HTTPException(status_code=404, detail="Edge not found")
    repository.replace_edges(session, workflow_id, store[workflow_id]["edges"])
    repository.touch(session, workflow_id)


@router.post("/{workflow_id}/auto-layout")
async def auto_layout_workflow(
    workflow_id: str, session: Session = Depends(get_session)
) -> AutoLayoutResponse:
    """Compute a server-side layered layout for the workflow graph (TASK-B02)."""
    wf = _require_workflow(session, workflow_id)
    from .auto_layout import layered_layout

    positions = layered_layout(wf["definition"].get("steps", []), wf.get("edges", []))
    return AutoLayoutResponse(positions=positions)


@router.post("/{workflow_id}/validate")
async def validate_workflow(
    workflow_id: str, session: Session = Depends(get_session)
) -> ValidateWorkflowResponse:
    """Validate the workflow graph (TASK-B03)."""
    wf = _require_workflow(session, workflow_id)
    from .validator import validate

    errors, warnings = validate(wf)
    return ValidateWorkflowResponse(errors=errors, warnings=warnings)


@router.post("/{workflow_id}/migrate-v2")
async def migrate_workflow_v2(
    workflow_id: str, session: Session = Depends(get_session)
) -> MigrateV2Response:
    """Idempotently migrate a v1 workflow to the canvas v2 format (TASK-B06)."""
    wf = _require_workflow(session, workflow_id)
    from .migration_v1_v2 import migrate_workflow

    store = {workflow_id: wf}
    result = migrate_workflow(workflow_id, store)
    if result.migrated:
        repository.save_definition(session, workflow_id, store[workflow_id]["definition"])
        repository.replace_edges(session, workflow_id, store[workflow_id].get("edges", []))
        repository.touch(session, workflow_id)
    return MigrateV2Response(
        migrated=result.migrated,
        edges_created=result.edges_created,
        steps_with_position=result.steps_with_position,
    )
