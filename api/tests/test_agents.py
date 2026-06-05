"""Testes de Agents (SPEC-021 / FA-17 / A-5) — DB-backed (SQLite em memória).

Cobre CRUD + runs + schedule via HTTP (dependency_overrides[get_session]),
o lifecycle de run direto no repository, e register/unregister no APScheduler.
O `execute_run` (BackgroundTask) é best-effort e não é exercitado aqui.
"""

from __future__ import annotations

import pytest
from api.agents import repository
from api.agents import scheduler as ag_scheduler
from api.agents.router import get_session, router
from api.models.agents import Agent, AgentRun, AgentSchedule
from api.models.base import Base
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


@pytest.fixture(autouse=True)
def _clear_scheduler_jobs():
    """Limpa jobs do APScheduler global antes/depois de cada teste."""
    for job in ag_scheduler.scheduler.get_jobs():
        ag_scheduler.scheduler.remove_job(job.id)
    yield
    for job in ag_scheduler.scheduler.get_jobs():
        ag_scheduler.scheduler.remove_job(job.id)


@pytest.fixture
def ctx():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(
        engine, tables=[Agent.__table__, AgentRun.__table__, AgentSchedule.__table__]
    )
    TestSession = sessionmaker(bind=engine)

    def _override():
        s = TestSession()
        try:
            yield s
        finally:
            s.close()

    app = FastAPI()
    app.include_router(router, prefix="/api/agents")
    app.dependency_overrides[get_session] = _override
    client = TestClient(app)
    return client, TestSession


def _create(client, name="Agente Teste", status="draft"):
    return client.post("/api/agents/", json={"name": name, "status": status})


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------


def test_create_and_list(ctx):
    client, _ = ctx
    resp = _create(client)
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Agente Teste"
    assert body["status"] == "draft"
    assert body["skill_count"] == 0

    lst = client.get("/api/agents/").json()
    assert len(lst) == 1


def test_get_unknown_404(ctx):
    client, _ = ctx
    assert client.get("/api/agents/nao-uuid").status_code == 404


def test_patch_updates_status(ctx):
    client, _ = ctx
    aid = _create(client).json()["id"]
    resp = client.patch(f"/api/agents/{aid}", json={"status": "active", "name": "Novo Nome"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "active"
    assert resp.json()["name"] == "Novo Nome"


def test_delete_archives(ctx):
    client, _ = ctx
    aid = _create(client).json()["id"]
    assert client.delete(f"/api/agents/{aid}").json()["status"] == "archived"
    assert client.get(f"/api/agents/{aid}").json()["status"] == "archived"


def test_list_filter_status(ctx):
    client, _ = ctx
    _create(client, name="A", status="draft")
    aid = _create(client, name="B", status="draft").json()["id"]
    client.patch(f"/api/agents/{aid}", json={"status": "active"})
    actives = client.get("/api/agents/?status=active").json()
    assert len(actives) == 1
    assert actives[0]["name"] == "B"


# ---------------------------------------------------------------------------
# Runs
# ---------------------------------------------------------------------------


def test_run_returns_202(ctx):
    client, _ = ctx
    aid = _create(client, status="active").json()["id"]
    resp = client.post(f"/api/agents/{aid}/run", json={"input": "olá"})
    assert resp.status_code == 202
    assert "run_id" in resp.json()


def test_run_archived_agent_404(ctx):
    client, _ = ctx
    aid = _create(client).json()["id"]
    client.delete(f"/api/agents/{aid}")  # archive
    assert client.post(f"/api/agents/{aid}/run", json={"input": "x"}).status_code == 404


def test_run_lifecycle_via_repository(ctx):
    client, TestSession = ctx
    aid = _create(client, status="active").json()["id"]
    s = TestSession()
    try:
        run = repository.create_run(s, agent_id=aid, triggered_by="manual", input_text="oi")
        assert run["status"] == "pending"
        repository.update_run(s, run["id"], status="completed", output={"text": "pronto"})
        fetched = repository.get_run(s, run["id"])
        assert fetched["status"] == "completed"
        assert fetched["output"] == {"text": "pronto"}
        runs = repository.list_runs(s, aid)
        assert len(runs) == 1
    finally:
        s.close()


def test_run_detail_cross_agent_404(ctx):
    client, TestSession = ctx
    aid = _create(client, status="active").json()["id"]
    s = TestSession()
    try:
        run = repository.create_run(s, agent_id=aid, triggered_by="manual", input_text="oi")
    finally:
        s.close()
    other = _create(client, name="Outro").json()["id"]
    assert client.get(f"/api/agents/{other}/runs/{run['id']}").status_code == 404
    assert client.get(f"/api/agents/{aid}/runs/{run['id']}").status_code == 200


# ---------------------------------------------------------------------------
# Schedule
# ---------------------------------------------------------------------------


def test_schedule_enable_disable(ctx):
    client, _ = ctx
    aid = _create(client, status="active").json()["id"]

    enabled = client.patch(
        f"/api/agents/{aid}/schedule",
        json={"enabled": True, "frequency": "daily", "time_of_day": "09:00"},
    ).json()
    assert enabled["enabled"] is True
    assert enabled["frequency"] == "daily"
    assert enabled["id"] == aid
    assert ag_scheduler.scheduler.get_job(aid) is not None

    got = client.get(f"/api/agents/{aid}/schedule").json()
    assert got["enabled"] is True
    assert got["time_of_day"] == "09:00"

    disabled = client.patch(f"/api/agents/{aid}/schedule", json={"enabled": False}).json()
    assert disabled["enabled"] is False
    assert ag_scheduler.scheduler.get_job(aid) is None


def test_schedule_default_when_absent(ctx):
    client, _ = ctx
    aid = _create(client).json()["id"]
    got = client.get(f"/api/agents/{aid}/schedule").json()
    assert got["enabled"] is False
    assert got["frequency"] == "daily"


# ---------------------------------------------------------------------------
# Scheduler (APScheduler job lifecycle)
# ---------------------------------------------------------------------------


def test_register_unregister_job(ctx):
    ag_scheduler.register_agent_schedule(
        agent_id="agent-x",
        frequency="hourly",
        days_of_week=None,
        time_of_day=None,
        timezone_str="America/Sao_Paulo",
    )
    assert ag_scheduler.scheduler.get_job("agent-x") is not None
    ag_scheduler.unregister_agent_schedule("agent-x")
    assert ag_scheduler.scheduler.get_job("agent-x") is None
