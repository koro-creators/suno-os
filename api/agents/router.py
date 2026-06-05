"""FastAPI router for Agents — SPEC-021 FA-17 (A-5: DB-backed).

Caixa-preta: todos os endpoints retornam 404, nunca 403 (constitution §3.1).
Persistência em agents / agent_runs / agent_schedules via agents.repository.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.orm import Session

try:
    from agents import repository
    from agents.runner import execute_run
    from core.db import get_session
except ImportError:  # test import root (repo root on sys.path)
    from api.agents import repository
    from api.agents.runner import execute_run
    from api.core.db import get_session

from .schemas import (
    AgentCreate,
    AgentDetail,
    AgentRunDetail,
    AgentRunRequest,
    AgentRunSummary,
    AgentScheduleConfig,
    AgentScheduleOut,
    AgentSummary,
    AgentUpdate,
    RunResponse,
)

router = APIRouter(tags=["Agents"])


def _require_agent(session: Session, agent_id: str) -> dict:
    """Return agent dict or raise 404 (caixa-preta — never 403)."""
    agent = repository.get_agent(session, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Not found")
    return agent


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------


@router.get("/", response_model=list[AgentSummary])
async def list_agents(
    status: str | None = None,
    q: str | None = None,
    session: Session = Depends(get_session),
) -> list[dict]:
    """List agents with optional status/search filters."""
    return repository.list_agents(session, status=status, q=q)


@router.post("/", status_code=201, response_model=AgentDetail)
async def create_agent(data: AgentCreate, session: Session = Depends(get_session)) -> dict:
    """Create a new agent (status defaults to 'draft')."""
    return repository.create_agent(
        session,
        name=data.name,
        icon=data.icon,
        instructions=data.instructions,
        status=data.status,
    )


@router.get("/{agent_id}", response_model=AgentDetail)
async def get_agent(agent_id: str, session: Session = Depends(get_session)) -> dict:
    """Get agent detail. Returns 404 for unauthorized access (caixa-preta)."""
    return _require_agent(session, agent_id)


@router.patch("/{agent_id}", response_model=AgentDetail)
async def update_agent(
    agent_id: str, data: AgentUpdate, session: Session = Depends(get_session)
) -> dict:
    """Partial update. PATCH with status='archived' is a soft delete."""
    _require_agent(session, agent_id)
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    return repository.update_agent(session, agent_id, updates)


@router.delete("/{agent_id}", response_model=dict)
async def delete_agent(agent_id: str, session: Session = Depends(get_session)) -> dict:
    """Soft delete — sets status to 'archived'. History is preserved."""
    _require_agent(session, agent_id)
    repository.archive_agent(session, agent_id)
    return {"status": "archived"}


# ---------------------------------------------------------------------------
# Runs
# ---------------------------------------------------------------------------


@router.post("/{agent_id}/run", status_code=202, response_model=RunResponse)
async def run_agent(
    agent_id: str,
    data: AgentRunRequest,
    background_tasks: BackgroundTasks,
    triggered_by: Annotated[str, Query()] = "manual",
    session: Session = Depends(get_session),
) -> dict:
    """Dispatch agent execution as a background task.

    Returns 202 immediately with run_id. Poll GET /runs/{run_id} for status.
    Caixa-preta: archived agent → 404.
    """
    agent = _require_agent(session, agent_id)
    if agent.get("status") == "archived":
        raise HTTPException(status_code=404, detail="Not found")

    valid_triggers = {"manual", "preview"}
    safe_trigger = triggered_by if triggered_by in valid_triggers else "manual"

    if safe_trigger == "preview":
        from .preview import create_preview_run

        run = create_preview_run(session, agent_id, data.input)
    else:
        run = repository.create_run(
            session,
            agent_id=agent_id,
            triggered_by=safe_trigger,
            input_text=data.input,
            client_id=data.client_id,
        )

    background_tasks.add_task(execute_run, run["id"], agent)
    return {"run_id": run["id"]}


@router.get("/{agent_id}/runs", response_model=list[AgentRunSummary])
async def list_agent_runs(
    agent_id: str,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
    session: Session = Depends(get_session),
) -> list[dict]:
    """List runs for an agent (newest first). Caixa-preta: 404 for unknown agent."""
    _require_agent(session, agent_id)
    return repository.list_runs(session, agent_id, limit=limit, offset=offset)


@router.get("/{agent_id}/runs/{run_id}", response_model=AgentRunDetail)
async def get_agent_run(
    agent_id: str, run_id: str, session: Session = Depends(get_session)
) -> dict:
    """Get run detail including input/output. Caixa-preta: 404 for unknown."""
    agent = _require_agent(session, agent_id)
    run = repository.get_run(session, run_id)
    if not run or run.get("agent_id") != agent["id"]:
        raise HTTPException(status_code=404, detail="Not found")
    return run


# ---------------------------------------------------------------------------
# Schedule sub-resource (Phase 22 — SPEC-021)
# ---------------------------------------------------------------------------


def _schedule_response(agent_id: str, sch: dict | None) -> dict:
    base = {
        "frequency": "daily",
        "days_of_week": None,
        "time_of_day": None,
        "minute_offset": 0,
        "timezone": "America/Sao_Paulo",
        "enabled": False,
        "last_run_at": None,
        "next_run_at": None,
    }
    if sch:
        base.update({k: sch.get(k) for k in base if k in sch})
    base["id"] = agent_id
    return base


@router.patch("/{agent_id}/schedule", response_model=AgentScheduleOut)
async def update_agent_schedule(
    agent_id: str, data: AgentScheduleConfig, session: Session = Depends(get_session)
) -> dict:
    """Activate or deactivate the agent's recurring schedule (config persiste em DB)."""
    _require_agent(session, agent_id)

    from .scheduler import register_agent_schedule, unregister_agent_schedule

    if data.enabled:
        register_agent_schedule(
            agent_id=agent_id,
            frequency=data.frequency,
            days_of_week=data.days_of_week,
            time_of_day=data.time_of_day,
            timezone_str=data.timezone,
        )
    else:
        unregister_agent_schedule(agent_id)

    sch = repository.upsert_schedule(
        session,
        agent_id=agent_id,
        enabled=data.enabled,
        frequency=data.frequency,
        days_of_week=data.days_of_week,
        time_of_day=data.time_of_day,
        timezone=data.timezone,
    )
    return _schedule_response(agent_id, sch)


@router.get("/{agent_id}/schedule", response_model=AgentScheduleOut)
async def get_agent_schedule(agent_id: str, session: Session = Depends(get_session)) -> dict:
    """Return current schedule state for an agent."""
    _require_agent(session, agent_id)
    sch = repository.get_schedule(session, agent_id)
    return _schedule_response(agent_id, sch)
