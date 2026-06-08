"""Repository de Workflows (SPEC-005 / A-4).

Converte ORM ↔ dict no MESMO shape do antigo store in-memory, para que toda a
lógica (validator, migration_v1_v2, auto_layout, edges, compiler) continue
operando sobre dicts sem mudança. Edges vivem em tabela separada (workflow_edges)
e são montadas no dict do workflow em `get_workflow`.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

try:
    from models.workflows import StepLog, Workflow, WorkflowEdge, WorkflowRun
except ImportError:  # test import root (repo root on sys.path)
    from api.models.workflows import StepLog, Workflow, WorkflowEdge, WorkflowRun


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _coerce(value) -> uuid.UUID | None:
    try:
        return uuid.UUID(str(value))
    except (ValueError, TypeError):
        return None


# ---------------------------------------------------------------------------
# Serialization ORM → dict (shape do store in-memory)
# ---------------------------------------------------------------------------


def _edge_to_dict(e: WorkflowEdge) -> dict:
    return {
        "edge_id": str(e.edge_id),
        "source_step_id": e.source_step_id,
        "source_handle": e.source_handle,
        "target_step_id": e.target_step_id,
        "target_handle": e.target_handle,
    }


def _wf_to_dict(wf: Workflow, edges: list[WorkflowEdge] | None = None) -> dict:
    return {
        "id": str(wf.id),
        "name": wf.name,
        "description": wf.description,
        "created_by": wf.created_by,
        "definition": wf.definition or {},
        "schedule_cron": wf.schedule_cron,
        "schedule_timezone": wf.schedule_timezone,
        "schedule_enabled": wf.schedule_enabled,
        "client_scope": wf.client_scope or [],
        "default_model": wf.default_model,
        "max_execution_time": wf.max_execution_time,
        "status": wf.status,
        "updated_by": wf.updated_by,
        "created_at": wf.created_at,
        "updated_at": wf.updated_at,
        "edges": [_edge_to_dict(e) for e in (edges or [])],
    }


def _run_to_dict(run: WorkflowRun) -> dict:
    return {
        "id": str(run.id),
        "workflow_id": str(run.workflow_id),
        "status": run.status,
        "trigger": run.trigger,
        "started_at": run.started_at,
        "completed_at": run.completed_at,
        "error": run.error,
        "steps_output": run.steps_output or {},
        "checkpoint_data": run.checkpoint_data,
        "created_at": run.created_at,
    }


def _steplog_to_dict(sl: StepLog) -> dict:
    return {
        "id": str(sl.id),
        "step_id": sl.step_id,
        "step_name": sl.step_name,
        "status": sl.status,
        "input": sl.input,
        "output": sl.output,
        "error": sl.error,
        "duration_ms": sl.duration_ms,
        "started_at": sl.started_at,
        "completed_at": sl.completed_at,
    }


# ---------------------------------------------------------------------------
# Workflows
# ---------------------------------------------------------------------------


def _get(session: Session, workflow_id: str) -> Workflow | None:
    wid = _coerce(workflow_id)
    if wid is None:
        return None
    return session.get(Workflow, wid)


def _edges_of(session: Session, workflow_id: str) -> list[WorkflowEdge]:
    wid = _coerce(workflow_id)
    return (
        session.query(WorkflowEdge)
        .filter(WorkflowEdge.workflow_id == wid)
        .order_by(WorkflowEdge.created_at.asc())
        .all()
    )


def get_workflow(session: Session, workflow_id: str) -> dict | None:
    wf = _get(session, workflow_id)
    if wf is None:
        return None
    return _wf_to_dict(wf, _edges_of(session, workflow_id))


def workflow_exists(session: Session, workflow_id: str) -> bool:
    return _get(session, workflow_id) is not None


def list_workflows(
    session: Session, status: str | None = None, created_by: str | None = None
) -> list[dict]:
    query = session.query(Workflow)
    if status:
        query = query.filter(Workflow.status == status)
    if created_by:
        query = query.filter(Workflow.created_by == created_by)
    wfs = query.order_by(Workflow.created_at.desc()).all()
    return [_wf_to_dict(w) for w in wfs]  # sem edges (lista não precisa)


def latest_run(session: Session, workflow_id: str) -> dict | None:
    wid = _coerce(workflow_id)
    run = (
        session.query(WorkflowRun)
        .filter(WorkflowRun.workflow_id == wid)
        .order_by(WorkflowRun.created_at.desc())
        .first()
    )
    return _run_to_dict(run) if run else None


def create_workflow(session: Session, wf_dict: dict) -> dict:
    """Cria um Workflow a partir de um dict (sem edges)."""
    wf = Workflow(
        id=_coerce(wf_dict["id"]) or uuid.uuid4(),
        name=wf_dict["name"],
        description=wf_dict.get("description"),
        created_by=wf_dict.get("created_by", "admin"),
        definition=wf_dict.get("definition", {}),
        schedule_cron=wf_dict.get("schedule_cron"),
        schedule_timezone=wf_dict.get("schedule_timezone", "America/Sao_Paulo"),
        schedule_enabled=wf_dict.get("schedule_enabled", False),
        client_scope=wf_dict.get("client_scope", []),
        default_model=wf_dict.get("default_model", "gemini-flash"),
        max_execution_time=wf_dict.get("max_execution_time", 300),
        status=wf_dict.get("status", "draft"),
        updated_by=wf_dict.get("updated_by"),
    )
    session.add(wf)
    session.commit()
    return get_workflow(session, str(wf.id))


def update_workflow(session: Session, workflow_id: str, fields: dict) -> dict | None:
    wf = _get(session, workflow_id)
    if wf is None:
        return None
    for key in (
        "name",
        "description",
        "definition",
        "schedule_cron",
        "schedule_timezone",
        "schedule_enabled",
        "status",
        "updated_by",
        "default_model",
        "max_execution_time",
    ):
        if key in fields and fields[key] is not None:
            setattr(wf, key, fields[key])
    session.commit()
    return get_workflow(session, workflow_id)


def save_definition(session: Session, workflow_id: str, definition: dict) -> None:
    wf = _get(session, workflow_id)
    if wf is None:
        return
    wf.definition = definition
    session.commit()


def touch(session: Session, workflow_id: str) -> None:
    wf = _get(session, workflow_id)
    if wf is not None:
        wf.updated_at = _now()
        session.commit()


def delete_workflow(session: Session, workflow_id: str) -> bool:
    wf = _get(session, workflow_id)
    if wf is None:
        return False
    wid = _coerce(workflow_id)
    # cascade manual (models portáveis sem FK ON DELETE)
    run_ids = [r.id for r in session.query(WorkflowRun).filter(WorkflowRun.workflow_id == wid)]
    if run_ids:
        session.query(StepLog).filter(StepLog.run_id.in_(run_ids)).delete(synchronize_session=False)
        session.query(WorkflowRun).filter(WorkflowRun.workflow_id == wid).delete(
            synchronize_session=False
        )
    session.query(WorkflowEdge).filter(WorkflowEdge.workflow_id == wid).delete(
        synchronize_session=False
    )
    session.delete(wf)
    session.commit()
    return True


# ---------------------------------------------------------------------------
# Edges (replace bulk; dict shape vem da lógica em edges.py)
# ---------------------------------------------------------------------------


def replace_edges(session: Session, workflow_id: str, edges: list[dict]) -> None:
    wid = _coerce(workflow_id)
    session.query(WorkflowEdge).filter(WorkflowEdge.workflow_id == wid).delete(
        synchronize_session=False
    )
    for e in edges:
        session.add(
            WorkflowEdge(
                edge_id=_coerce(e.get("edge_id")) or uuid.uuid4(),
                workflow_id=wid,
                source_step_id=e["source_step_id"],
                source_handle=e["source_handle"],
                target_step_id=e["target_step_id"],
                target_handle=e.get("target_handle", "in"),
            )
        )
    session.commit()


# ---------------------------------------------------------------------------
# Runs + step logs
# ---------------------------------------------------------------------------


def create_run(session: Session, run_dict: dict) -> dict:
    run = WorkflowRun(
        id=_coerce(run_dict["id"]) or uuid.uuid4(),
        workflow_id=_coerce(run_dict["workflow_id"]),
        status=run_dict.get("status", "running"),
        trigger=run_dict.get("trigger", "manual"),
        started_at=run_dict.get("started_at"),
        completed_at=run_dict.get("completed_at"),
        error=run_dict.get("error"),
        steps_output=run_dict.get("steps_output", {}),
        checkpoint_data=run_dict.get("checkpoint_data"),
    )
    session.add(run)
    session.commit()
    return _run_to_dict(run)


def get_run(session: Session, run_id: str) -> dict | None:
    rid = _coerce(run_id)
    if rid is None:
        return None
    run = session.get(WorkflowRun, rid)
    return _run_to_dict(run) if run else None


def list_runs(session: Session, workflow_id: str) -> list[dict]:
    wid = _coerce(workflow_id)
    runs = (
        session.query(WorkflowRun)
        .filter(WorkflowRun.workflow_id == wid)
        .order_by(WorkflowRun.created_at.desc())
        .all()
    )
    return [_run_to_dict(r) for r in runs]


def update_run(session: Session, run_id: str, **fields) -> dict | None:
    rid = _coerce(run_id)
    run = session.get(WorkflowRun, rid) if rid else None
    if run is None:
        return None
    for key, value in fields.items():
        setattr(run, key, value)
    session.commit()
    return _run_to_dict(run)


def create_step_logs(session: Session, run_id: str, logs: list[dict]) -> None:
    """Persist a batch of per-step execution logs for a run (single commit)."""
    rid = _coerce(run_id)
    if rid is None or not logs:
        return
    for sl in logs:
        session.add(
            StepLog(
                id=uuid.uuid4(),
                run_id=rid,
                step_id=sl["step_id"],
                step_name=sl.get("step_name"),
                status=sl.get("status", "completed"),
                input=sl.get("input"),
                output=sl.get("output"),
                error=sl.get("error"),
                duration_ms=sl.get("duration_ms"),
                started_at=sl.get("started_at"),
                completed_at=sl.get("completed_at"),
            )
        )
    session.commit()


def list_step_logs(session: Session, run_id: str) -> list[dict]:
    rid = _coerce(run_id)
    logs = (
        session.query(StepLog)
        .filter(StepLog.run_id == rid)
        .order_by(StepLog.started_at.asc().nullslast())
        .all()
    )
    return [_steplog_to_dict(s) for s in logs]


# ---------------------------------------------------------------------------
# Seed helper (testes/fixtures): grava um workflow dict completo + edges
# ---------------------------------------------------------------------------


def upsert_from_dict(session: Session, wf_dict: dict) -> str:
    create_workflow(session, wf_dict)
    edges = wf_dict.get("edges") or []
    if edges:
        replace_edges(session, wf_dict["id"], edges)
    return wf_dict["id"]
