"""Testes do domínio Aprovações (SPEC-004 / FA-13 / A-6) — DB-backed.

SQLite em memória por teste. Auth via header X-Debug-Admin (DEBUG=True).
Cobre os 6 endpoints + anti-loop + caixa-preta (404 p/ não-admin).
"""

from __future__ import annotations

import pytest
from api.approval.models import ApprovalEvent, ApprovalSubmission
from api.approval.router import get_session, router
from api.models.base import Base
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

ADMIN = {"X-Debug-Admin": "true"}


@pytest.fixture
def client() -> TestClient:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine, tables=[ApprovalSubmission.__table__, ApprovalEvent.__table__])
    TestSession = sessionmaker(bind=engine)

    def _override():
        s = TestSession()
        try:
            yield s
        finally:
            s.close()

    app = FastAPI()
    app.include_router(router, prefix="/api")
    app.dependency_overrides[get_session] = _override
    c = TestClient(app)
    c._engine = engine
    return c


def _submit(client, **over):
    payload = {
        "client_id": "vivo",
        "skill_slug": "copy-social",
        "subject_type": "spark",
        "subject_id": "spark-1",
        "content": "Conteúdo para aprovar",
        "urgency": "normal",
    }
    payload.update(over)
    return client.post("/api/approvals", json=payload, headers=ADMIN)


def test_submit_returns_201_pending(client):
    resp = _submit(client)
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "PENDING_VALIDATION"
    assert body["client_id"] == "vivo"
    assert body["round"] == 1


def test_non_admin_gets_404(client):
    # sem header de admin → caixa-preta 404 (não 403)
    resp = client.get("/api/approvals")
    assert resp.status_code == 404


def test_list_and_filter(client):
    _submit(client, skill_slug="copy-social")
    _submit(client, skill_slug="plano-de-midia")
    all_items = client.get("/api/approvals", headers=ADMIN).json()
    assert len(all_items) == 2
    filtered = client.get("/api/approvals?skill_slug=copy-social", headers=ADMIN).json()
    assert len(filtered) == 1
    assert filtered[0]["skill_slug"] == "copy-social"


def test_get_detail_and_unknown_404(client):
    sid = _submit(client).json()["id"]
    assert client.get(f"/api/approvals/{sid}", headers=ADMIN).status_code == 200
    assert client.get("/api/approvals/nao-uuid", headers=ADMIN).status_code == 404


def test_approve_flow(client):
    sid = _submit(client).json()["id"]
    resp = client.post(f"/api/approvals/{sid}/approve", json={"comment": "ok"}, headers=ADMIN)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "APPROVED"
    assert body["assigned_approver"] == "debug-admin"


def test_reject_flow(client):
    sid = _submit(client).json()["id"]
    resp = client.post(
        f"/api/approvals/{sid}/reject", json={"comment": "fora do tom"}, headers=ADMIN
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "REJECTED"


def test_request_revision(client):
    sid = _submit(client).json()["id"]
    resp = client.post(
        f"/api/approvals/{sid}/request-revision", json={"comment": "ajustar"}, headers=ADMIN
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "CHANGES_REQUESTED"


def test_double_decision_returns_422(client):
    sid = _submit(client).json()["id"]
    client.post(f"/api/approvals/{sid}/approve", json={}, headers=ADMIN)
    again = client.post(f"/api/approvals/{sid}/approve", json={}, headers=ADMIN)
    assert again.status_code == 422


def test_history_append_only(client):
    sid = _submit(client).json()["id"]
    client.post(f"/api/approvals/{sid}/approve", json={"comment": "ok"}, headers=ADMIN)
    hist = client.get(f"/api/approvals/{sid}/history", headers=ADMIN).json()
    actions = [e["action"] for e in hist["events"]]
    assert actions == ["SUBMITTED", "APPROVE"]
