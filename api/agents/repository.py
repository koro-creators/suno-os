"""Repository de Agents (SPEC-021 / A-5).

Primitivas SQLAlchemy para agents / agent_runs / agent_schedules. Retorna dicts
no shape esperado pelos schemas/endpoints. `last_run_at` é derivado de agent_runs
(não é coluna em agents).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

try:
    from models.agents import Agent, AgentRun, AgentSchedule
except ImportError:  # test import root (repo root on sys.path)
    from api.models.agents import Agent, AgentRun, AgentSchedule


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _coerce(value) -> uuid.UUID | None:
    try:
        return uuid.UUID(str(value))
    except (ValueError, TypeError):
        return None


# ---------------------------------------------------------------------------
# Agents
# ---------------------------------------------------------------------------


def _last_run_at(session: Session, agent_id) -> datetime | None:
    return (
        session.query(func.max(AgentRun.started_at))
        .filter(AgentRun.agent_id == agent_id, AgentRun.triggered_by != "preview")
        .scalar()
    )


def list_agents(session: Session, status: str | None = None, q: str | None = None) -> list[dict]:
    query = session.query(Agent)
    if status:
        query = query.filter(Agent.status == status)
    if q:
        query = query.filter(Agent.name.ilike(f"%{q}%"))
    agents = query.order_by(Agent.created_at.desc()).all()
    return [a.to_dict(last_run_at=_last_run_at(session, a.id)) for a in agents]


def create_agent(session: Session, *, name: str, icon: str, instructions: str, status: str) -> dict:
    agent = Agent(id=uuid.uuid4(), name=name, icon=icon, instructions=instructions, status=status)
    session.add(agent)
    session.commit()
    session.refresh(agent)
    return agent.to_dict()


def _get(session: Session, agent_id: str) -> Agent | None:
    aid = _coerce(agent_id)
    if aid is None:
        return None
    return session.get(Agent, aid)


def get_agent(session: Session, agent_id: str) -> dict | None:
    agent = _get(session, agent_id)
    if agent is None:
        return None
    return agent.to_dict(last_run_at=_last_run_at(session, agent.id))


def agent_exists(session: Session, agent_id: str) -> bool:
    return _get(session, agent_id) is not None


def update_agent(session: Session, agent_id: str, updates: dict) -> dict | None:
    agent = _get(session, agent_id)
    if agent is None:
        return None
    for key in ("name", "icon", "instructions", "status"):
        if updates.get(key) is not None:
            setattr(agent, key, updates[key])
    session.commit()
    session.refresh(agent)
    return agent.to_dict(last_run_at=_last_run_at(session, agent.id))


def archive_agent(session: Session, agent_id: str) -> dict | None:
    return update_agent(session, agent_id, {"status": "archived"})


# ---------------------------------------------------------------------------
# Runs
# ---------------------------------------------------------------------------


def create_run(
    session: Session,
    *,
    agent_id: str,
    triggered_by: str,
    input_text: str,
    client_id: str | None = None,
) -> dict:
    run = AgentRun(
        id=uuid.uuid4(),
        agent_id=_coerce(agent_id),
        client_id=_coerce(client_id) if client_id else None,
        triggered_by=triggered_by,
        status="pending",
        input={"text": input_text},
    )
    session.add(run)
    session.commit()
    session.refresh(run)
    return run.to_dict()


def get_run(session: Session, run_id: str) -> dict | None:
    rid = _coerce(run_id)
    if rid is None:
        return None
    run = session.get(AgentRun, rid)
    return run.to_dict() if run else None


def list_runs(session: Session, agent_id: str, limit: int = 50, offset: int = 0) -> list[dict]:
    aid = _coerce(agent_id)
    if aid is None:
        return []
    runs = (
        session.query(AgentRun)
        .filter(AgentRun.agent_id == aid)
        .order_by(AgentRun.started_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [r.to_dict() for r in runs]


def delete_expired_previews(session: Session, cutoff: datetime) -> int:
    """Remove preview runs com started_at anterior ao cutoff. Retorna a contagem."""
    rows = (
        session.query(AgentRun)
        .filter(AgentRun.triggered_by == "preview", AgentRun.started_at < cutoff)
        .all()
    )
    for r in rows:
        session.delete(r)
    session.commit()
    return len(rows)


def update_run(session: Session, run_id: str, **fields) -> None:
    rid = _coerce(run_id)
    if rid is None:
        return
    run = session.get(AgentRun, rid)
    if run is None:
        return
    for key, value in fields.items():
        setattr(run, key, value)
    session.commit()


# ---------------------------------------------------------------------------
# Schedules
# ---------------------------------------------------------------------------


def get_schedule(session: Session, agent_id: str) -> dict | None:
    aid = _coerce(agent_id)
    if aid is None:
        return None
    sch = session.query(AgentSchedule).filter(AgentSchedule.agent_id == aid).first()
    return sch.to_dict() if sch else None


def upsert_schedule(
    session: Session,
    *,
    agent_id: str,
    enabled: bool,
    frequency: str,
    days_of_week: list[int] | None,
    time_of_day: str | None,
    timezone: str,
) -> dict:
    aid = _coerce(agent_id)
    sch = session.query(AgentSchedule).filter(AgentSchedule.agent_id == aid).first()
    if sch is None:
        sch = AgentSchedule(id=uuid.uuid4(), agent_id=aid)
        session.add(sch)
    sch.enabled = enabled
    sch.frequency = frequency
    sch.days_of_week = days_of_week
    sch.time_of_day = time_of_day
    sch.timezone = timezone
    session.commit()
    session.refresh(sch)
    return sch.to_dict()


def set_schedule_last_run(session: Session, agent_id: str, when: datetime) -> None:
    aid = _coerce(agent_id)
    sch = session.query(AgentSchedule).filter(AgentSchedule.agent_id == aid).first()
    if sch:
        sch.last_run_at = when
        session.commit()


def list_enabled_schedules(session: Session) -> list[dict]:
    rows = session.query(AgentSchedule).filter(AgentSchedule.enabled.is_(True)).all()
    return [{"agent_id": str(s.agent_id), **s.to_dict()} for s in rows]
