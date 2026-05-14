"""SPEC-005 Phase A — smoke tests.

Verifies that:
  • The new endpoint stubs exist and return 501 on present workflows, 404 on
    missing ones (caixa-preta).
  • Pydantic schemas import cleanly and reject invalid handles / kinds.
  • Fixtures populate the in-memory store as expected.

These tests don't exercise real behaviour (Phase B does that). Their job is
to lock in the contract surface so a Phase B regression on the API shape is
caught early.
"""

from __future__ import annotations

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.workflows.router import router
from api.workflows.schemas import (
    SetEdgesRequest,
    ValidationError as WfValidationError,
    WorkflowEdge,
    WorkflowStepV2,
)


@pytest.fixture
def client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/api/workflows")
    return TestClient(app)


# ---------------------------------------------------------------------------
# Endpoint stubs (TASK-A04)
# ---------------------------------------------------------------------------


def test_get_edges_returns_501_on_existing_workflow(client, seed_workflow_v2_linear):
    response = client.get(f"/api/workflows/{seed_workflow_v2_linear}/edges")
    assert response.status_code == 501
    assert "Phase B" in response.json()["detail"]


def test_get_edges_returns_404_on_missing_workflow(client):
    response = client.get("/api/workflows/00000000-0000-0000-0000-000000000000/edges")
    assert response.status_code == 404


def test_set_edges_returns_501_on_existing_workflow(client, seed_workflow_v2_linear):
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
    assert response.status_code == 501


def test_delete_edge_404_on_missing_workflow(client):
    response = client.delete(
        "/api/workflows/00000000-0000-0000-0000-000000000000/edges/abc"
    )
    assert response.status_code == 404


@pytest.mark.parametrize(
    "path",
    ["auto-layout", "validate", "migrate-v2"],
)
def test_post_endpoints_return_501_on_existing(client, seed_workflow_v2_linear, path):
    response = client.post(f"/api/workflows/{seed_workflow_v2_linear}/{path}")
    assert response.status_code == 501


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
