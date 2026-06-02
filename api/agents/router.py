"""FastAPI router for Agents — SPEC-021 FA-17 (Fases A + C in-memory)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query

from .runner import create_run, execute_run, get_run, list_runs
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

# ---------------------------------------------------------------------------
# In-memory store (Fase A dev — replace with DB in Fase C)
# Caixa-preta: all endpoints return 404, never 403 (constitution §3.1)
# ---------------------------------------------------------------------------
_agents: dict[str, dict] = {}


def _require_agent(agent_id: str) -> dict:
    """Return agent or raise 404 (caixa-preta — never 403)."""
    agent = _agents.get(agent_id)
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
) -> list[dict]:
    """List agents with optional status/search filters."""
    items = list(_agents.values())
    if status:
        items = [a for a in items if a.get("status") == status]
    if q:
        items = [a for a in items if q.lower() in a.get("name", "").lower()]
    return items


@router.post("/", status_code=201, response_model=AgentDetail)
async def create_agent(data: AgentCreate) -> dict:
    """Create a new agent (status defaults to 'draft')."""
    now = datetime.now(timezone.utc).isoformat()
    agent_id = str(uuid.uuid4())
    agent: dict = {
        "id": agent_id,
        "name": data.name,
        "icon": data.icon,
        "instructions": data.instructions,
        "status": data.status,
        "skill_count": 0,
        "client_count": 0,
        "last_run_at": None,
        "created_at": now,
        "updated_at": now,
    }
    _agents[agent_id] = agent
    return agent


@router.get("/{agent_id}", response_model=AgentDetail)
async def get_agent(agent_id: str) -> dict:
    """Get agent detail. Returns 404 for unauthorized access (caixa-preta)."""
    return _require_agent(agent_id)


@router.patch("/{agent_id}", response_model=AgentDetail)
async def update_agent(agent_id: str, data: AgentUpdate) -> dict:
    """Partial update. PATCH with status='archived' is a soft delete."""
    agent = _require_agent(agent_id)
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if updates:
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        agent.update(updates)
    return agent


@router.delete("/{agent_id}", response_model=dict)
async def delete_agent(agent_id: str) -> dict:
    """Soft delete — sets status to 'archived'. History is preserved."""
    agent = _require_agent(agent_id)
    agent["status"] = "archived"
    agent["updated_at"] = datetime.now(timezone.utc).isoformat()
    return {"status": "archived"}


# ---------------------------------------------------------------------------
# Runs — TASK-C05, C06, C08
# ---------------------------------------------------------------------------


@router.post("/{agent_id}/run", status_code=202, response_model=RunResponse)
async def run_agent(
    agent_id: str,
    data: AgentRunRequest,
    background_tasks: BackgroundTasks,
    triggered_by: Annotated[str, Query()] = "manual",
) -> dict:
    """Dispatch agent execution as a background task.

    Returns 202 immediately with run_id. Poll GET /runs/{run_id} for status.
    Caixa-preta: archived agent → 404 (never expose 'archived' state to caller).
    """
    agent = _require_agent(agent_id)
    if agent.get("status") == "archived":
        raise HTTPException(status_code=404, detail="Not found")

    valid_triggers = {"manual", "preview"}
    safe_trigger = triggered_by if triggered_by in valid_triggers else "manual"

    if safe_trigger == "preview":
        from .preview import create_preview_run

        run = create_preview_run(agent_id, data.input)
    else:
        run = create_run(
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
) -> list[dict]:
    """List runs for an agent (newest first). Caixa-preta: 404 for unknown agent."""
    _require_agent(agent_id)
    return list_runs(agent_id, limit=limit, offset=offset)


@router.get("/{agent_id}/runs/{run_id}", response_model=AgentRunDetail)
async def get_agent_run(agent_id: str, run_id: str) -> dict:
    """Get run detail including input/output. Caixa-preta: 404 for unknown."""
    _require_agent(agent_id)
    run = get_run(run_id)
    if not run or run.get("agent_id") != agent_id:
        raise HTTPException(status_code=404, detail="Not found")
    return run


# ---------------------------------------------------------------------------
# Schedule sub-resource (Phase 22 — SPEC-021)
# ---------------------------------------------------------------------------


@router.patch("/{agent_id}/schedule", response_model=AgentScheduleOut)
async def update_agent_schedule(agent_id: str, data: AgentScheduleConfig) -> dict:
    """Activate or deactivate the agent's recurring schedule."""
    _require_agent(agent_id)

    from .scheduler import (  # noqa: PLC0415
        _schedules,
        register_agent_schedule,
        unregister_agent_schedule,
    )

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

    cfg = _schedules.get(agent_id, {})
    return {
        "id": agent_id,
        "frequency": cfg.get("frequency", data.frequency),
        "days_of_week": cfg.get("days_of_week"),
        "time_of_day": cfg.get("time_of_day"),
        "minute_offset": 0,
        "timezone": cfg.get("timezone", data.timezone),
        "enabled": cfg.get("enabled", False),
        "last_run_at": None,
        "next_run_at": None,
    }


@router.get("/{agent_id}/schedule", response_model=AgentScheduleOut)
async def get_agent_schedule(agent_id: str) -> dict:
    """Return current schedule state for an agent."""
    _require_agent(agent_id)

    from .scheduler import _schedules  # noqa: PLC0415

    cfg = _schedules.get(agent_id)
    if cfg is None:
        return {
            "id": agent_id,
            "frequency": "daily",
            "days_of_week": None,
            "time_of_day": None,
            "minute_offset": 0,
            "timezone": "America/Sao_Paulo",
            "enabled": False,
            "last_run_at": None,
            "next_run_at": None,
        }

    return {
        "id": agent_id,
        "frequency": cfg["frequency"],
        "days_of_week": cfg.get("days_of_week"),
        "time_of_day": cfg.get("time_of_day"),
        "minute_offset": 0,
        "timezone": cfg.get("timezone", "America/Sao_Paulo"),
        "enabled": cfg.get("enabled", False),
        "last_run_at": None,
        "next_run_at": None,
    }
