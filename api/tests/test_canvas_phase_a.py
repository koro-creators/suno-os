"""SPEC-005 Phase A — smoke tests (updated for Phase B).

Phase A stubs that previously returned 501 have been replaced by real Phase B
implementations (commit feat(SPEC-005): backend canvas v2 — Fases A+B).

Verifies that:
  • Canvas endpoints exist and return 2xx on present workflows, 404 on
    missing ones (caixa-preta rule — RN-009/010/011).
  • Pydantic schemas import cleanly and reject invalid handles / kinds.
  • Fixtures populate the in-memory store as expected.

Behavioural coverage (validator, migration, edges CRUD, auto-layout) lives in
test_canvas_phase_b.py.
"""

from __future__ import annotations

import pytest
from api.workflows.router import router
from api.workflows.schemas import (
    SetEdgesRequest,
    WorkflowEdge,
    WorkflowStepV2,
)
from api.workflows.schemas import (
    ValidationError as WfValidationError,
)
from fastapi import FastAPI
from fastapi.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/api/workflows")
    return TestClient(app)


# ---------------------------------------------------------------------------
# Endpoint contract (TASK-A04 — updated: Phase B stubs replaced with real impl)
# ---------------------------------------------------------------------------


def test_get_edges_returns_200_on_existing_workflow(client, seed_workflow_v2_linear):
    """Phase B: GET /edges returns the persisted edge list, not 501."""
    response = client.get(f"/api/workflows/{seed_workflow_v2_linear}/edges")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)


def test_get_edges_returns_404_on_missing_workflow(client):
    response = client.get("/api/workflows/00000000-0000-0000-0000-000000000000/edges")
    assert response.status_code == 404


def test_set_edges_returns_200_on_existing_workflow(client, seed_workflow_v2_linear):
    """Phase B: POST /edges bulk-replaces and returns the new edge list."""
    body = SetEdgesRequest(
        edges=[
            WorkflowEdge(
                source_step_id="s1",
                source_handle="out",
                target_step_id="s2",
                target_handle="in",
            )
        ]
    ).model_dump()
    response = client.post(f"/api/workflows/{seed_workflow_v2_linear}/edges", json=body)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_delete_edge_404_on_missing_workflow(client):
    response = client.delete("/api/workflows/00000000-0000-0000-0000-000000000000/edges/abc")
    assert response.status_code == 404


@pytest.mark.parametrize(
    "path",
    ["auto-layout", "validate", "migrate-v2"],
)
def test_post_endpoints_return_200_on_existing(client, seed_workflow_v2_linear, path):
    """Phase B: all three canvas POST endpoints return 200 (not 501)."""
    response = client.post(f"/api/workflows/{seed_workflow_v2_linear}/{path}")
    assert response.status_code == 200


# ---------------------------------------------------------------------------
# Schemas (TASK-A03)
# ---------------------------------------------------------------------------


def test_workflow_edge_rejects_invalid_source_handle():
    with pytest.raises(ValueError):
        WorkflowEdge(
            source_step_id="a",
            source_handle="success",  # removed in SPEC-005 constitution §2
            target_step_id="b",
            target_handle="in",
        )


def test_workflow_edge_accepts_all_seven_canonical_handles():
    handles = ["out", "error", "then", "else", "approved", "rejected", "modified"]
    for h in handles:
        edge = WorkflowEdge(
            source_step_id="a",
            source_handle=h,
            target_step_id="b",
            target_handle="in",
        )
        assert edge.source_handle == h


def test_validation_error_rejects_unknown_kind():
    with pytest.raises(ValueError):
        WfValidationError(kind="invalid_kind", detail="x")


def test_workflow_step_v2_carries_position_and_merge_policy():
    step = WorkflowStepV2(
        id="m1",
        name="merge",
        type="merge",
        config={},
        position_x=10,
        position_y=20,
        merge_policy="all",
    )
    assert (step.position_x, step.position_y) == (10, 20)
    assert step.merge_policy == "all"


# ---------------------------------------------------------------------------
# Fixtures (TASK-A09)
# ---------------------------------------------------------------------------


def test_seed_v1_legacy_has_no_edges_no_positions(seed_workflow_v1_legacy):
    from api.workflows import router as wf_router

    wf = wf_router._workflows[seed_workflow_v1_legacy]
    assert wf["definition"]["metadata"]["canvas_v2_migrated"] is False
    assert wf["edges"] == []
    for step in wf["definition"]["steps"]:
        assert "position_x" not in step


def test_seed_v2_linear_has_two_edges(seed_workflow_v2_linear):
    from api.workflows import router as wf_router

    wf = wf_router._workflows[seed_workflow_v2_linear]
    assert wf["definition"]["metadata"]["canvas_v2_migrated"] is True
    assert len(wf["edges"]) == 2
    assert all(e["source_handle"] == "out" for e in wf["edges"])


def test_seed_v2_fanout_merge_has_seven_edges_and_one_merge_step(
    seed_workflow_v2_fanout_merge,
):
    from api.workflows import router as wf_router

    wf = wf_router._workflows[seed_workflow_v2_fanout_merge]
    assert len(wf["edges"]) == 7
    merge_steps = [s for s in wf["definition"]["steps"] if s["type"] == "merge"]
    assert len(merge_steps) == 1
    assert merge_steps[0]["merge_policy"] == "all"
