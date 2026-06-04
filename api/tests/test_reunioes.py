"""Testes do domínio Reuniões (SPEC-016 / A-7) — DB-backed.

SQLite em memória por teste via dependency_overrides[get_session]. Cobre os 5
endpoints + caixa-preta cross-client (RN-010/011).
"""

from __future__ import annotations

import pytest
from api.models.base import Base
from api.models.meetings import Meeting, MeetingSegment
from api.reunioes.router import get_session, router
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
    Base.metadata.create_all(engine, tables=[Meeting.__table__, MeetingSegment.__table__])
    TestSession = sessionmaker(bind=engine)

    def _override():
        s = TestSession()
        try:
            yield s
        finally:
            s.close()

    app = FastAPI()
    app.include_router(router, prefix="/api/meetings")
    app.dependency_overrides[get_session] = _override
    c = TestClient(app)
    c._engine = engine  # keep alive
    return c


def _create(client, *, client_id="vivo", header="vivo", title="Kickoff"):
    return client.post(
        "/api/meetings/",
        json={
            "title": title,
            "client_id": client_id,
            "transcript": "Primeiro trecho.\n\nSegundo trecho.\n\nTerceiro trecho.",
            "duration_minutes": 30,
            "participants": ["Ana", "Carlos"],
        },
        headers={"X-Client-ID": header},
    )


def test_create_splits_segments(client):
    resp = _create(client)
    assert resp.status_code == 201
    body = resp.json()
    assert body["client_id"] == "vivo"
    assert body["status"] == "pending_review"
    assert len(body["segments"]) == 3
    assert all(seg["selected"] is False for seg in body["segments"])


def test_create_cross_client_guard(client):
    # header vivo, body americanas → 404 caixa-preta
    resp = _create(client, client_id="americanas", header="vivo")
    assert resp.status_code == 404


def test_list_filters_by_client(client):
    _create(client, client_id="vivo", header="vivo")
    _create(client, client_id="americanas", header="americanas")

    vivo = client.get("/api/meetings/", headers={"X-Client-ID": "vivo"}).json()
    assert vivo["total"] == 1
    assert vivo["meetings"][0]["client_id"] == "vivo"

    ame = client.get("/api/meetings/", headers={"X-Client-ID": "americanas"}).json()
    assert ame["total"] == 1


def test_get_detail_and_cross_client_404(client):
    mid = _create(client, header="vivo").json()["id"]

    ok = client.get(f"/api/meetings/{mid}", headers={"X-Client-ID": "vivo"})
    assert ok.status_code == 200

    blocked = client.get(f"/api/meetings/{mid}", headers={"X-Client-ID": "americanas"})
    assert blocked.status_code == 404  # caixa-preta: não revela existência


def test_get_unknown_returns_404(client):
    resp = client.get("/api/meetings/nao-uuid", headers={"X-Client-ID": "vivo"})
    assert resp.status_code == 404


def test_curate_marks_selected_and_status(client):
    created = _create(client, header="vivo").json()
    seg_id = created["segments"][0]["id"]

    resp = client.post(
        f"/api/meetings/{created['id']}/curate",
        json={"segments": [{"id": seg_id, "selected": True, "context_note": "importante"}]},
        headers={"X-Client-ID": "vivo"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["selected_count"] == 1
    assert body["status"] == "curated"

    detail = client.get(f"/api/meetings/{created['id']}", headers={"X-Client-ID": "vivo"}).json()
    assert detail["status"] == "curated"
    seg = next(s for s in detail["segments"] if s["id"] == seg_id)
    assert seg["selected"] is True
    assert seg["context_note"] == "importante"
    assert seg["curated_at"] is not None


def test_patch_archive(client):
    mid = _create(client, header="vivo").json()["id"]
    resp = client.patch(
        f"/api/meetings/{mid}",
        json={"status": "archived"},
        headers={"X-Client-ID": "vivo"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "archived"
