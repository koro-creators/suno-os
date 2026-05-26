"""FastAPI router for Agents CRUD — SPEC-021 FA-17 (Fase A in-memory mock)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from .schemas import AgentCreate, AgentDetail, AgentSummary, AgentUpdate

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
