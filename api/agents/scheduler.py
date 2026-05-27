"""APScheduler integration for agent scheduled runs — SPEC-021 Phase 22.

Uses AsyncIOScheduler so jobs run inside the same event loop as FastAPI.
The `_schedules` dict holds schedule state independently of the `_agents`
dict in router.py, keeping schedule config orthogonal to agent CRUD.

Job lifecycle:
  - register_agent_schedule()   — add/replace job in scheduler + store state
  - unregister_agent_schedule() — remove job from scheduler + clear state
  - load_active_schedules_from_store() — replay on startup

Frequency mapping:
  - "hourly" → IntervalTrigger(hours=1)
  - "daily"  → CronTrigger(day_of_week=<days>, hour=<HH>, minute=<MM>, tz=<tz>)
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

# Single scheduler instance — started/stopped by main.py lifespan.
scheduler = AsyncIOScheduler()

# Parallel schedule-state store keyed by agent_id.
# Schema: {agent_id: {"enabled": bool, "frequency": str, "days_of_week": list|None,
#                      "time_of_day": str|None, "timezone": str}}
_schedules: dict[str, dict] = {}


# ---------------------------------------------------------------------------
# Internal runner (called by APScheduler jobs)
# ---------------------------------------------------------------------------


def _get_agents_store() -> dict:
    """Return the live _agents dict from agents.router, handling both import paths.

    APScheduler calls run_scheduled_agent from the top-level scope. Whether the
    module was imported as 'agents.router' (production, cwd=api/) or
    'api.agents.router' (tests, PYTHONPATH=worktree root), we need the same
    dict object. We check sys.modules for whichever path is already loaded.
    """
    import sys  # noqa: PLC0415

    for candidate in ("api.agents.router", "agents.router"):
        mod = sys.modules.get(candidate)
        if mod is not None:
            return mod._agents  # type: ignore[attr-defined]

    # Last resort: import via the shorter path (production default).
    from agents import router as _router  # noqa: PLC0415

    return _router._agents


async def run_scheduled_agent(agent_id: str) -> None:
    """Execute an agent run triggered by the scheduler.

    Skips silently when the agent doesn't exist or is not 'active'.
    Updates last_run_at on the agent dict as a lightweight activity marker.
    Real LangGraph execution is a seam for a future phase.
    """
    _agents = _get_agents_store()
    agent = _agents.get(agent_id)
    if not agent:
        logger.warning(
            "Scheduled run skipped: agent %s not found in store", agent_id
        )
        return

    if agent.get("status") != "active":
        logger.info(
            "Scheduled run skipped: agent %s has status=%s (need 'active')",
            agent_id,
            agent.get("status"),
        )
        return

    now = datetime.now(timezone.utc).isoformat()
    agent["last_run_at"] = now

    logger.info(
        "Scheduled run dispatched: agent_id=%s triggered_by=schedule at %s",
        agent_id,
        now,
    )
    # TODO (Phase 22+): call real LangGraph runner here.
    # e.g. await agent_graph.ainvoke({"agent_id": agent_id, "triggered_by": "schedule"})


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def _build_trigger(frequency: str, days_of_week: list[int] | None, time_of_day: str | None, timezone_str: str):
    """Return the appropriate APScheduler trigger for the given config."""
    if frequency == "hourly":
        return IntervalTrigger(hours=1, timezone=timezone_str)

    # frequency == "daily"
    hour, minute = 9, 0  # sensible default when time_of_day not provided
    if time_of_day:
        try:
            parts = time_of_day.split(":")
            hour, minute = int(parts[0]), int(parts[1]) if len(parts) > 1 else 0
        except (ValueError, IndexError):
            logger.warning("Invalid time_of_day '%s', defaulting to 09:00", time_of_day)

    # days_of_week: list[int] 0=Mon…6=Sun  →  APScheduler day_of_week: "mon,tue,..."
    _day_names = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    if days_of_week:
        dow_str = ",".join(_day_names[d] for d in days_of_week if 0 <= d <= 6)
    else:
        dow_str = "mon-sun"  # every day

    return CronTrigger(
        day_of_week=dow_str,
        hour=hour,
        minute=minute,
        timezone=timezone_str,
    )


def register_agent_schedule(
    agent_id: str,
    frequency: str,
    days_of_week: list[int] | None,
    time_of_day: str | None,
    timezone_str: str,
) -> None:
    """Register or replace an agent's scheduled job.

    Safe to call when scheduler is not yet started (APScheduler queues jobs
    and executes them once start() is called).
    """
    trigger = _build_trigger(frequency, days_of_week, time_of_day, timezone_str)

    # Explicitly remove existing job before adding so replace_existing works
    # whether or not the scheduler is currently running (APScheduler's
    # replace_existing only works reliably when the scheduler is started).
    existing = scheduler.get_job(agent_id)
    if existing is not None:
        scheduler.remove_job(agent_id)

    scheduler.add_job(
        run_scheduled_agent,
        trigger=trigger,
        id=agent_id,
        args=[agent_id],
        replace_existing=True,
        misfire_grace_time=300,  # 5 min grace period for missed fires
    )

    _schedules[agent_id] = {
        "enabled": True,
        "frequency": frequency,
        "days_of_week": days_of_week,
        "time_of_day": time_of_day,
        "timezone": timezone_str,
    }

    logger.info(
        "Agent schedule registered: agent_id=%s frequency=%s days=%s time=%s tz=%s",
        agent_id,
        frequency,
        days_of_week,
        time_of_day,
        timezone_str,
    )


def unregister_agent_schedule(agent_id: str) -> None:
    """Remove an agent's scheduled job. No-op if not registered."""
    job = scheduler.get_job(agent_id)
    if job:
        scheduler.remove_job(agent_id)
        logger.info("Agent schedule removed: agent_id=%s", agent_id)
    else:
        logger.debug("unregister_agent_schedule: no job found for agent_id=%s", agent_id)

    _schedules.pop(agent_id, None)


async def load_active_schedules_from_store() -> None:
    """Re-register all schedules from _schedules on startup.

    In-memory phase: _schedules is reset on process restart so this is a
    no-op today. When DB persistence lands, this function should read the
    agents table and re-hydrate schedule state.
    """
    loaded = 0
    for agent_id, cfg in list(_schedules.items()):
        if cfg.get("enabled"):
            register_agent_schedule(
                agent_id=agent_id,
                frequency=cfg["frequency"],
                days_of_week=cfg.get("days_of_week"),
                time_of_day=cfg.get("time_of_day"),
                timezone_str=cfg.get("timezone", "America/Sao_Paulo"),
            )
            loaded += 1

    logger.info("Loaded %d active agent schedule(s) from store", loaded)
