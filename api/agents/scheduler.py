"""APScheduler integration for agent scheduled runs — SPEC-021 / A-5 (DB-backed).

Os JOBS vivos do APScheduler ficam em memória (objetos do scheduler), mas a
CONFIG dos schedules é persistida em `agent_schedules` (via agents.repository).
No startup, `load_active_schedules_from_store` lê o DB e re-registra os jobs —
então schedules sobrevivem a restart.

Frequency mapping:
  - "hourly" → IntervalTrigger(hours=1)
  - "daily"  → CronTrigger(day_of_week=<days>, hour=<HH>, minute=<MM>, tz=<tz>)
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

try:
    from agents import repository
    from core.db import _get_sessionmaker
except ImportError:  # test import root
    from api.agents import repository
    from api.core.db import _get_sessionmaker

logger = logging.getLogger(__name__)

# Single scheduler instance — started/stopped by main.py lifespan.
scheduler = AsyncIOScheduler()


# ---------------------------------------------------------------------------
# Internal runner (called by APScheduler jobs)
# ---------------------------------------------------------------------------


async def run_scheduled_agent(agent_id: str) -> None:
    """Executa um run disparado pelo scheduler. Pula se o agente não existe/não ativo.

    Persiste um agent_run (triggered_by='schedule') e executa o grafo numa thread
    (não bloqueia o event loop do AsyncIOScheduler).
    """
    session = _get_sessionmaker()()
    try:
        agent = repository.get_agent(session, agent_id)
        if not agent:
            logger.warning("Scheduled run skipped: agent %s not found", agent_id)
            return
        if agent.get("status") != "active":
            logger.info("Scheduled run skipped: agent %s status=%s", agent_id, agent.get("status"))
            return
        run = repository.create_run(
            session, agent_id=agent_id, triggered_by="schedule", input_text=""
        )
        repository.set_schedule_last_run(session, agent_id, datetime.now(timezone.utc))
    finally:
        session.close()

    from .runner import execute_run

    logger.info("Scheduled run dispatched: agent_id=%s run_id=%s", agent_id, run["id"])
    await asyncio.to_thread(execute_run, run["id"], agent)


# ---------------------------------------------------------------------------
# Trigger building + job lifecycle
# ---------------------------------------------------------------------------


def _build_trigger(
    frequency: str, days_of_week: list[int] | None, time_of_day: str | None, timezone_str: str
):
    if frequency == "hourly":
        return IntervalTrigger(hours=1, timezone=timezone_str)

    hour, minute = 9, 0
    if time_of_day:
        try:
            parts = time_of_day.split(":")
            hour, minute = int(parts[0]), int(parts[1]) if len(parts) > 1 else 0
        except (ValueError, IndexError):
            logger.warning("Invalid time_of_day '%s', defaulting to 09:00", time_of_day)

    _day_names = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    if days_of_week:
        dow_str = ",".join(_day_names[d] for d in days_of_week if 0 <= d <= 6)
    else:
        dow_str = "mon-sun"

    return CronTrigger(day_of_week=dow_str, hour=hour, minute=minute, timezone=timezone_str)


def register_agent_schedule(
    agent_id: str,
    frequency: str,
    days_of_week: list[int] | None,
    time_of_day: str | None,
    timezone_str: str,
) -> None:
    """Registra/substitui o job vivo do agente no APScheduler (config persiste no DB)."""
    trigger = _build_trigger(frequency, days_of_week, time_of_day, timezone_str)

    if scheduler.get_job(agent_id) is not None:
        scheduler.remove_job(agent_id)

    scheduler.add_job(
        run_scheduled_agent,
        trigger=trigger,
        id=agent_id,
        args=[agent_id],
        replace_existing=True,
        misfire_grace_time=300,
    )
    logger.info(
        "Agent schedule registered: agent_id=%s frequency=%s days=%s time=%s tz=%s",
        agent_id,
        frequency,
        days_of_week,
        time_of_day,
        timezone_str,
    )


def unregister_agent_schedule(agent_id: str) -> None:
    """Remove o job vivo do agente. No-op se não registrado."""
    if scheduler.get_job(agent_id):
        scheduler.remove_job(agent_id)
        logger.info("Agent schedule removed: agent_id=%s", agent_id)


async def load_active_schedules_from_store() -> None:
    """Re-registra no APScheduler todos os schedules enabled do banco (no startup)."""
    try:
        session = _get_sessionmaker()()
    except Exception as exc:  # noqa: BLE001 — startup tolerante a DB fora
        logger.warning("Could not load schedules (DB unavailable): %s", exc)
        return
    try:
        enabled = repository.list_enabled_schedules(session)
    finally:
        session.close()

    loaded = 0
    for cfg in enabled:
        register_agent_schedule(
            agent_id=cfg["agent_id"],
            frequency=cfg["frequency"],
            days_of_week=cfg.get("days_of_week"),
            time_of_day=cfg.get("time_of_day"),
            timezone_str=cfg.get("timezone", "America/Sao_Paulo"),
        )
        loaded += 1
    logger.info("Loaded %d active agent schedule(s) from DB", loaded)
