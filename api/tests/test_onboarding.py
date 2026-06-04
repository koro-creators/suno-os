"""Testes de Onboarding/Wiki (SPEC-015 / A-8) — DB-backed (SQLite em memória).

Cobre o fluxo síncrono: criar cliente, status (entidades derivadas), gate HITL
(6 aceitas → cliente ACTIVE) e wiki. O fluxo async do Oráculo não é exercitado
aqui (depende de LLM); os testes setam as entidades como 'generated' direto no DB.
"""

from __future__ import annotations

import pytest
from api.clientes import repository as clients_repo
from api.models.base import Base
from api.models.client import Client
from api.models.onboarding import EntityHitlEvent, OnboardingJob, WikiEntity
from api.onboarding import repository
from api.onboarding.constants import ONTOLOGY_ENTITY_TYPES
from api.onboarding.router import get_session, router
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


@pytest.fixture
def ctx():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(
        engine,
        tables=[
            Client.__table__,
            OnboardingJob.__table__,
            WikiEntity.__table__,
            EntityHitlEvent.__table__,
        ],
    )
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
    client = TestClient(app)
    return client, TestSession


def _create(client, slug="cogna", name="Cogna"):
    return client.post("/api/clients", json={"name": name, "slug": slug})


def _mark_all_generated(TestSession, slug):
    s = TestSession()
    try:
        c = clients_repo.get_by_slug(s, slug)
        for et in ONTOLOGY_ENTITY_TYPES:
            e = repository.get_entity(s, str(c.id), et)
            repository.update_entity(s, e, status="generated", content=f"conteudo {et}")
    finally:
        s.close()


def test_create_client_pre_active(ctx):
    client, _ = ctx
    resp = _create(client)
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "PRE_ACTIVE"
    assert body["slug"] == "cogna"
    assert body["job_id"]


def test_status_lists_six_pending(ctx):
    client, _ = ctx
    _create(client)
    st = client.get("/api/clients/cogna/onboarding/status").json()
    assert st["total_entities"] == 6
    assert st["entities_done"] == 0
    assert set(st["entities"].values()) == {"pending"}
    assert st["client_status"] == "PRE_ACTIVE"


def test_status_unknown_slug_404(ctx):
    client, _ = ctx
    assert client.get("/api/clients/naoexiste/onboarding/status").status_code == 404


def test_validate_pending_entity_409(ctx):
    client, _ = ctx
    _create(client)
    # entidade ainda 'pending' (Oráculo não rodou) → 409
    resp = client.post("/api/clients/cogna/entities/Persona/validate", json={"action": "accept"})
    assert resp.status_code == 409


def test_hitl_gate_transitions_to_active(ctx):
    client, TestSession = ctx
    _create(client)
    _mark_all_generated(TestSession, "cogna")

    last = None
    for et in ONTOLOGY_ENTITY_TYPES:
        last = client.post(
            f"/api/clients/cogna/entities/{et}/validate", json={"action": "accept"}
        ).json()

    # última aceitação fecha o gate → ACTIVE
    assert last["client_status"] == "ACTIVE"
    st = client.get("/api/clients/cogna/onboarding/status").json()
    assert st["client_status"] == "ACTIVE"


def test_edit_accept_sets_hitl_badge(ctx):
    client, TestSession = ctx
    _create(client)
    _mark_all_generated(TestSession, "cogna")
    resp = client.post(
        "/api/clients/cogna/entities/Persona/validate",
        json={"action": "edit_accept", "edited_content": "Persona editada"},
    ).json()
    assert resp["status"] == "accepted"
    assert resp["badge"] == "hitl"


def test_wiki_returns_only_accepted_by_default(ctx):
    client, TestSession = ctx
    _create(client)
    _mark_all_generated(TestSession, "cogna")
    client.post("/api/clients/cogna/entities/Persona/validate", json={"action": "accept"})

    default = client.get("/api/clients/cogna/wiki").json()
    assert len(default["entities"]) == 1
    assert default["entities"][0]["entity_type"] == "Persona"

    full = client.get("/api/clients/cogna/wiki?include_generated=true").json()
    assert len(full["entities"]) == 6
