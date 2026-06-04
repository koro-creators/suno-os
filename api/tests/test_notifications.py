"""Testes de Notificações (B-4) — DB-backed. SQLite em memória por teste.

Cobre create/list/mark-read + caixa-preta (filtro por user_id).
"""

from __future__ import annotations

import pytest
from api.models.base import Base
from api.models.notification import Notification
from api.notifications.router import get_session, router
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


@pytest.fixture
def client() -> TestClient:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine, tables=[Notification.__table__])
    TestSession = sessionmaker(bind=engine)

    def _override():
        s = TestSession()
        try:
            yield s
        finally:
            s.close()

    app = FastAPI()
    app.include_router(router, prefix="/api/notifications")
    app.dependency_overrides[get_session] = _override
    c = TestClient(app)
    c._engine = engine
    return c


def _create(client, user_id="ana", **over):
    params = {
        "user_id": user_id,
        "notif_type": "approval_decision",
        "title": "Aprovada",
        "body": "Sua submissão foi aprovada.",
    }
    params.update(over)
    return client.post("/api/notifications/", params=params)


def test_create_returns_201(client):
    resp = _create(client)
    assert resp.status_code == 201
    body = resp.json()
    assert body["user_id"] == "ana"
    assert body["read"] is False
    assert body["id"]


def test_list_filters_by_user(client):
    _create(client, user_id="ana")
    _create(client, user_id="ana")
    _create(client, user_id="carlos")

    ana = client.get("/api/notifications/", params={"user_id": "ana"}).json()
    assert len(ana) == 2
    assert all(n["user_id"] == "ana" for n in ana)

    carlos = client.get("/api/notifications/", params={"user_id": "carlos"}).json()
    assert len(carlos) == 1


def test_mark_read(client):
    nid = _create(client, user_id="ana").json()["id"]
    resp = client.patch(f"/api/notifications/{nid}/read", params={"user_id": "ana"})
    assert resp.status_code == 200
    assert resp.json()["read"] is True


def test_mark_read_cross_user_404(client):
    nid = _create(client, user_id="ana").json()["id"]
    # carlos tenta marcar notificação da ana → 404 caixa-preta
    resp = client.patch(f"/api/notifications/{nid}/read", params={"user_id": "carlos"})
    assert resp.status_code == 404


def test_mark_read_unknown_404(client):
    resp = client.patch("/api/notifications/nao-uuid/read", params={"user_id": "ana"})
    assert resp.status_code == 404
