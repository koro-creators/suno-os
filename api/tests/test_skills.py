"""Testes do catálogo de Skills (feature SPEC-017) — DB-backed (SQLite)."""

from __future__ import annotations

import pytest
from api.models.base import Base
from api.models.skill import Skill
from api.skills.router import get_session, router
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
    Base.metadata.create_all(engine, tables=[Skill.__table__])
    TestSession = sessionmaker(bind=engine)

    def _override():
        s = TestSession()
        try:
            yield s
        finally:
            s.close()

    app = FastAPI()
    app.include_router(router, prefix="/api/skills")
    app.dependency_overrides[get_session] = _override
    return TestClient(app)


def _create(client, **over):
    payload = {
        "name": "Copy Social",
        "slug": "copy-social",
        "type": "criacao",
        "description": "Copies para redes sociais",
        "icon": "MessageSquare",
        "status": "active",
        "systemPrompt": "Você é um copywriter.",
        "model": "gpt-4o",
        "temperature": 0.8,
        "maxTokens": 2048,
        "moons": [{"id": "m1", "name": "Feed", "slug": "feed", "description": "Feed"}],
        "assignedClients": ["vivo", "santander"],
    }
    payload.update(over)
    return client.post("/api/skills/", json=payload)


def test_create_returns_201_camelcase(client):
    resp = _create(client)
    assert resp.status_code == 201
    body = resp.json()
    assert body["id"].startswith("skill-")
    assert body["systemPrompt"] == "Você é um copywriter."
    assert body["maxTokens"] == 2048
    assert body["assignedClients"] == ["vivo", "santander"]
    assert body["moons"][0]["slug"] == "feed"


def test_list_and_filter(client):
    _create(client, slug="a", name="A", type="criacao", status="active")
    _create(client, slug="b", name="B", type="midia", status="draft")
    assert len(client.get("/api/skills/").json()) == 2
    actives = client.get("/api/skills/?status=active").json()
    assert len(actives) == 1 and actives[0]["slug"] == "a"
    midia = client.get("/api/skills/?type=midia").json()
    assert len(midia) == 1 and midia[0]["slug"] == "b"


def test_get_unknown_404(client):
    assert client.get("/api/skills/nope").status_code == 404


def test_update_partial(client):
    sid = _create(client).json()["id"]
    resp = client.patch(f"/api/skills/{sid}", json={"status": "draft", "temperature": 0.2})
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "draft"
    assert body["temperature"] == 0.2
    assert body["name"] == "Copy Social"  # inalterado


def test_update_unknown_404(client):
    assert client.patch("/api/skills/nope", json={"status": "draft"}).status_code == 404


def test_delete(client):
    sid = _create(client).json()["id"]
    assert client.delete(f"/api/skills/{sid}").status_code == 204
    assert client.get(f"/api/skills/{sid}").status_code == 404


def test_delete_unknown_404(client):
    assert client.delete("/api/skills/nope").status_code == 404
