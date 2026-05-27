"""Phase 11 — Backend tests for Agents API (SPEC-021 Fase A+C in-memory).

Covers:
  - Agent CRUD (create, list, get, patch, delete)
  - Caixa-preta: unknown IDs → 404 (never 403)
  - Run dispatch: POST /{id}/run → 202 + run_id
  - Run listing: GET /{id}/runs → list
  - Run detail: GET /{id}/runs/{run_id} → full record
"""

from __future__ import annotations

import pytest
from api.agents import router as agents_router_module
from api.agents.router import router
from fastapi import FastAPI
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def reset_agents_store():
    """Clear agents and runs before each test."""
    agents_router_module.router  # imported for side-effect; store lives in router module
    from api.agents.router import _agents
    from api.agents.runner import _runs, _runs_by_agent

    _agents.clear()
    _runs.clear()
    _runs_by_agent.clear()
    yield
    _agents.clear()
    _runs.clear()
    _runs_by_agent.clear()


@pytest.fixture
def client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/api/agents")
    return TestClient(app)


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------


def test_list_agents_empty(client):
    resp = client.get("/api/agents/")
    assert resp.status_code == 200
    assert resp.json() == []


def test_create_agent_returns_201(client):
    resp = client.post("/api/agents/", json={"name": "Copywriter", "icon": "✍️"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Copywriter"
    assert "id" in body


def test_list_agents_after_create(client):
    client.post("/api/agents/", json={"name": "Agent A"})
    client.post("/api/agents/", json={"name": "Agent B"})
    resp = client.get("/api/agents/")
    assert len(resp.json()) == 2


def test_get_agent_returns_detail(client):
    create = client.post("/api/agents/", json={"name": "Revisor"}).json()
    agent_id = create["id"]
    resp = client.get(f"/api/agents/{agent_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == agent_id


def test_get_unknown_agent_returns_404(client):
    resp = client.get("/api/agents/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


def test_patch_agent_updates_name(client):
    create = client.post("/api/agents/", json={"name": "Old Name"}).json()
    agent_id = create["id"]
    resp = client.patch(f"/api/agents/{agent_id}", json={"name": "New Name"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"


def test_patch_unknown_agent_returns_404(client):
    resp = client.patch(
        "/api/agents/00000000-0000-0000-0000-000000000000", json={"name": "X"}
    )
    assert resp.status_code == 404


def test_delete_agent_soft_archives(client):
    create = client.post("/api/agents/", json={"name": "Temp"}).json()
    agent_id = create["id"]
    resp = client.delete(f"/api/agents/{agent_id}")
    assert resp.status_code == 200
    assert resp.json()["status"] == "archived"
    # Soft delete — agent still exists but is archived
    detail = client.get(f"/api/agents/{agent_id}").json()
    assert detail["status"] == "archived"


def test_delete_unknown_agent_returns_404(client):
    resp = client.delete("/api/agents/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Run dispatch
# ---------------------------------------------------------------------------


def test_run_dispatch_returns_202_with_run_id(client):
    create = client.post("/api/agents/", json={"name": "Runner"}).json()
    agent_id = create["id"]
    resp = client.post(f"/api/agents/{agent_id}/run", json={"input": "Hello"})
    assert resp.status_code == 202
    body = resp.json()
    assert "run_id" in body


def test_run_dispatch_unknown_agent_returns_404(client):
    resp = client.post(
        "/api/agents/00000000-0000-0000-0000-000000000000/run",
        json={"input": "test"},
    )
    assert resp.status_code == 404


def test_list_runs_empty_for_new_agent(client):
    create = client.post("/api/agents/", json={"name": "No Runs"}).json()
    agent_id = create["id"]
    resp = client.get(f"/api/agents/{agent_id}/runs")
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_runs_after_dispatch(client):
    create = client.post("/api/agents/", json={"name": "Runner 2"}).json()
    agent_id = create["id"]
    client.post(f"/api/agents/{agent_id}/run", json={"input": "Hello"})
    resp = client.get(f"/api/agents/{agent_id}/runs")
    assert resp.status_code == 200
    runs = resp.json()
    assert len(runs) == 1
    assert runs[0]["status"] in ("pending", "running", "completed", "failed")


def test_get_run_detail(client):
    create = client.post("/api/agents/", json={"name": "Detail Agent"}).json()
    agent_id = create["id"]
    run_id = client.post(f"/api/agents/{agent_id}/run", json={"input": "Test"}).json()["run_id"]
    resp = client.get(f"/api/agents/{agent_id}/runs/{run_id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == run_id
    assert "input" in body


def test_get_run_wrong_agent_returns_404(client):
    """Run ID from agent A should not be accessible via agent B (caixa-preta)."""
    agent_a = client.post("/api/agents/", json={"name": "A"}).json()["id"]
    agent_b = client.post("/api/agents/", json={"name": "B"}).json()["id"]
    run_id = client.post(f"/api/agents/{agent_a}/run", json={"input": "Hi"}).json()["run_id"]
    resp = client.get(f"/api/agents/{agent_b}/runs/{run_id}")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Search / filter
# ---------------------------------------------------------------------------


def test_list_agents_filter_by_status(client):
    client.post("/api/agents/", json={"name": "Draft Agent", "status": "draft"})
    client.post("/api/agents/", json={"name": "Active Agent", "status": "active"})
    resp = client.get("/api/agents/?status=active")
    assert resp.status_code == 200
    items = resp.json()
    assert all(a["status"] == "active" for a in items)


def test_list_agents_search_by_name(client):
    client.post("/api/agents/", json={"name": "Copywriter Pro"})
    client.post("/api/agents/", json={"name": "Revisor"})
    resp = client.get("/api/agents/?q=Copy")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert "Copy" in items[0]["name"]
