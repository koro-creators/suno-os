"""Tests for Agents CRUD and scheduler integration — SPEC-021 Phase 22.

Run with:
  PYTHONPATH=<worktree-root> uv run --directory api pytest tests/test_agents.py -q

Note: The scheduler is NOT started in these tests — register/unregister ops
are called directly against the AsyncIOScheduler instance without .start().
APScheduler supports this (jobs are queued and only fire when started).
"""

from __future__ import annotations

import pytest

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


def _get_all_agents_stores() -> list[dict]:
    """Return all loaded _agents dicts across import path variants.

    Because pytest uses PYTHONPATH=<worktree-root>, both 'agents.router'
    (used by main.py/FastAPI) and 'api.agents.router' (used by direct
    test imports) may be loaded as separate module objects with separate
    _agents dicts. We clear both to avoid cross-test contamination.
    """
    import sys  # noqa: PLC0415

    stores = []
    for mod_name in ("agents.router", "api.agents.router"):
        mod = sys.modules.get(mod_name)
        if mod is not None:
            stores.append(mod._agents)  # type: ignore[attr-defined]
    if not stores:
        # Fallback: import fresh
        from api.agents import router as ag_router

        stores.append(ag_router._agents)
    return stores


def _get_live_agents_store() -> dict:
    """Return the canonical _agents dict — prefer the one main.py loaded."""
    import sys  # noqa: PLC0415

    # Prefer the module loaded by main.py so TestClient and direct tests share state
    for candidate in ("agents.router", "api.agents.router"):
        mod = sys.modules.get(candidate)
        if mod is not None:
            return mod._agents  # type: ignore[attr-defined]
    from api.agents import router as ag_router

    return ag_router._agents


@pytest.fixture(autouse=True)
def reset_agents_store():
    """Clear the in-memory agents store and schedule state before each test."""
    from api.agents import scheduler as ag_scheduler

    def _clear():
        for store in _get_all_agents_stores():
            store.clear()
        ag_scheduler._schedules.clear()
        for job in ag_scheduler.scheduler.get_jobs():
            ag_scheduler.scheduler.remove_job(job.id)

    _clear()
    yield
    _clear()


def _make_agent(name: str = "Test Agent", status: str = "draft") -> dict:
    """Insert an agent into the in-memory store (canonical module) and return it."""
    import uuid
    from datetime import datetime, timezone

    agent_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    agent: dict = {
        "id": agent_id,
        "name": name,
        "icon": "🤖",
        "instructions": "",
        "status": status,
        "skill_count": 0,
        "client_count": 0,
        "last_run_at": None,
        "created_at": now,
        "updated_at": now,
    }
    # Insert into ALL loaded stores to handle dual-import-path scenario
    for store in _get_all_agents_stores():
        store[agent_id] = agent
    return agent


# ---------------------------------------------------------------------------
# Agent CRUD
# ---------------------------------------------------------------------------


class TestAgentCRUD:
    def test_list_agents_empty(self):
        assert _get_live_agents_store() == {}

    def test_create_agent_populates_store(self):
        agent = _make_agent("My Agent")
        store = _get_live_agents_store()
        assert agent["id"] in store
        assert store[agent["id"]]["name"] == "My Agent"

    def test_require_agent_raises_404(self):
        import sys

        from fastapi import HTTPException

        mod = sys.modules.get("agents.router") or sys.modules.get("api.agents.router")
        if mod is None:
            from api.agents import router as mod  # type: ignore[assignment]

        with pytest.raises(HTTPException) as exc_info:
            mod._require_agent("nonexistent-id")
        assert exc_info.value.status_code == 404

    def test_require_agent_returns_agent(self):
        import sys

        mod = sys.modules.get("agents.router") or sys.modules.get("api.agents.router")
        if mod is None:
            from api.agents import router as mod  # type: ignore[assignment]

        agent = _make_agent("Known Agent")
        result = mod._require_agent(agent["id"])
        assert result["name"] == "Known Agent"


# ---------------------------------------------------------------------------
# Scheduler — register / unregister
# ---------------------------------------------------------------------------


class TestSchedulerRegisterUnregister:
    def test_register_hourly_adds_job(self):
        from api.agents.scheduler import _schedules, register_agent_schedule, scheduler

        agent = _make_agent("Hourly Agent")
        agent_id = agent["id"]

        register_agent_schedule(
            agent_id=agent_id,
            frequency="hourly",
            days_of_week=None,
            time_of_day=None,
            timezone_str="America/Sao_Paulo",
        )

        assert scheduler.get_job(agent_id) is not None
        assert _schedules[agent_id]["enabled"] is True
        assert _schedules[agent_id]["frequency"] == "hourly"

    def test_register_daily_adds_job(self):
        from api.agents.scheduler import _schedules, register_agent_schedule, scheduler

        agent = _make_agent("Daily Agent")
        agent_id = agent["id"]

        register_agent_schedule(
            agent_id=agent_id,
            frequency="daily",
            days_of_week=[0, 1, 2, 3, 4],  # Mon–Fri
            time_of_day="08:30",
            timezone_str="America/Sao_Paulo",
        )

        job = scheduler.get_job(agent_id)
        assert job is not None
        assert _schedules[agent_id]["frequency"] == "daily"
        assert _schedules[agent_id]["days_of_week"] == [0, 1, 2, 3, 4]
        assert _schedules[agent_id]["time_of_day"] == "08:30"

    def test_register_replaces_existing_job(self):
        from api.agents.scheduler import register_agent_schedule, scheduler

        agent = _make_agent("Replaced Agent")
        agent_id = agent["id"]

        register_agent_schedule(agent_id, "hourly", None, None, "UTC")
        register_agent_schedule(agent_id, "daily", [0], "09:00", "UTC")

        # Still only one job
        jobs = [j for j in scheduler.get_jobs() if j.id == agent_id]
        assert len(jobs) == 1

    def test_unregister_removes_job(self):
        from api.agents.scheduler import (
            _schedules,
            register_agent_schedule,
            scheduler,
            unregister_agent_schedule,
        )

        agent = _make_agent("Unregister Agent")
        agent_id = agent["id"]

        register_agent_schedule(agent_id, "hourly", None, None, "UTC")
        assert scheduler.get_job(agent_id) is not None

        unregister_agent_schedule(agent_id)

        assert scheduler.get_job(agent_id) is None
        assert agent_id not in _schedules

    def test_unregister_noop_when_not_registered(self):
        from api.agents.scheduler import unregister_agent_schedule

        # Should not raise
        unregister_agent_schedule("ghost-agent-id")


# ---------------------------------------------------------------------------
# Scheduler — run_scheduled_agent (async)
# ---------------------------------------------------------------------------


class TestRunScheduledAgent:
    @pytest.mark.asyncio
    async def test_skips_missing_agent(self):
        from api.agents.scheduler import run_scheduled_agent

        # Should not raise, just log a warning
        await run_scheduled_agent("nonexistent-id")

    @pytest.mark.asyncio
    async def test_skips_inactive_agent(self):
        from api.agents.scheduler import run_scheduled_agent

        agent = _make_agent("Inactive Agent", status="inactive")
        agent_id = agent["id"]

        await run_scheduled_agent(agent_id)

        # last_run_at should remain None (not updated)
        live = _get_live_agents_store()
        assert live[agent_id]["last_run_at"] is None

    @pytest.mark.asyncio
    async def test_updates_last_run_at_for_active_agent(self):
        from api.agents.scheduler import run_scheduled_agent

        agent = _make_agent("Active Agent", status="active")
        agent_id = agent["id"]
        assert agent["last_run_at"] is None

        await run_scheduled_agent(agent_id)

        live = _get_live_agents_store()
        assert live[agent_id]["last_run_at"] is not None


# ---------------------------------------------------------------------------
# Scheduler — load_active_schedules_from_store
# ---------------------------------------------------------------------------


class TestLoadActiveSchedules:
    @pytest.mark.asyncio
    async def test_load_empty_store_does_nothing(self):
        from api.agents.scheduler import load_active_schedules_from_store, scheduler

        await load_active_schedules_from_store()
        assert scheduler.get_jobs() == []

    @pytest.mark.asyncio
    async def test_load_replays_enabled_schedules(self):
        from api.agents.scheduler import (
            _schedules,
            load_active_schedules_from_store,
            scheduler,
        )

        # Pre-populate _schedules as if a prior session had registered them
        _schedules["agent-abc"] = {
            "enabled": True,
            "frequency": "hourly",
            "days_of_week": None,
            "time_of_day": None,
            "timezone": "UTC",
        }

        await load_active_schedules_from_store()

        assert scheduler.get_job("agent-abc") is not None


# ---------------------------------------------------------------------------
# HTTP endpoint — PATCH /api/agents/{id}/schedule
# ---------------------------------------------------------------------------


class TestScheduleEndpoint:
    """Integration tests for the PATCH /schedule HTTP endpoint via TestClient.

    Agents are created via HTTP POST so they land in the same module instance
    the app uses (agents.router._agents, not api.agents.router._agents).
    """

    def _client(self):
        from fastapi.testclient import TestClient

        from main import app  # noqa: PLC0415

        return TestClient(app, raise_server_exceptions=True)

    def _create_agent(self, client, name: str = "Test", status: str = "draft") -> str:
        """Create an agent via HTTP POST and return its id."""
        resp = client.post("/api/agents/", json={"name": name, "status": status})
        assert resp.status_code == 201, resp.text
        return resp.json()["id"]

    def test_patch_schedule_404_on_unknown_agent(self):
        client = self._client()
        resp = client.patch(
            "/api/agents/nonexistent-id/schedule",
            json={"enabled": True, "frequency": "hourly"},
        )
        assert resp.status_code == 404

    def test_patch_schedule_enables(self):
        """PATCH /schedule with enabled=True returns 200 and correct response shape."""
        client = self._client()
        agent_id = self._create_agent(client, "Endpoint Agent", status="active")

        resp = client.patch(
            f"/api/agents/{agent_id}/schedule",
            json={
                "enabled": True,
                "frequency": "daily",
                "days_of_week": [0, 1, 2, 3, 4],
                "time_of_day": "10:00",
                "timezone": "America/Sao_Paulo",
            },
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["id"] == agent_id
        assert body["enabled"] is True
        assert body["frequency"] == "daily"
        assert body["days_of_week"] == [0, 1, 2, 3, 4]
        assert body["time_of_day"] == "10:00"
        assert body["timezone"] == "America/Sao_Paulo"

        # Roundtrip: GET should now show enabled=True
        get_resp = client.get(f"/api/agents/{agent_id}/schedule")
        assert get_resp.status_code == 200
        assert get_resp.json()["enabled"] is True

    def test_patch_schedule_disables(self):
        """PATCH /schedule with enabled=False returns 200 and enabled=False."""
        client = self._client()
        agent_id = self._create_agent(client, "Disable Agent", status="active")

        # First enable, then disable
        client.patch(
            f"/api/agents/{agent_id}/schedule",
            json={"enabled": True, "frequency": "hourly"},
        )

        resp = client.patch(
            f"/api/agents/{agent_id}/schedule",
            json={"enabled": False, "frequency": "hourly"},
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["enabled"] is False

        # GET should confirm disabled
        get_resp = client.get(f"/api/agents/{agent_id}/schedule")
        assert get_resp.status_code == 200
        assert get_resp.json()["enabled"] is False

    def test_get_schedule_returns_defaults_when_not_set(self):
        client = self._client()
        agent_id = self._create_agent(client, "No Schedule Agent")

        resp = client.get(f"/api/agents/{agent_id}/schedule")

        assert resp.status_code == 200
        body = resp.json()
        assert body["enabled"] is False
        assert body["id"] == agent_id
