"""Testes do repository de clientes (SPEC-022 Fase B / A-1).

DB SQLite em memória por teste — sem mockar dados. Valida CRUD + status.
"""

from __future__ import annotations

import pytest
from api.clientes import repository
from api.models.base import Base
from api.models.client import Client
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


@pytest.fixture
def session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine, tables=[Client.__table__])
    s = sessionmaker(bind=engine)()
    yield s
    s.close()
    engine.dispose()


def test_create_and_get_by_slug(session):
    created = repository.create_client(session, name="Vivo", slug="vivo", color="#8B5CF6")
    assert created["slug"] == "vivo"
    assert created["status"] == "PRE_ACTIVE"
    assert created["id"]

    found = repository.get_by_slug(session, "vivo")
    assert found is not None
    assert found.name == "Vivo"


def test_get_by_slug_missing_returns_none(session):
    assert repository.get_by_slug(session, "inexistente") is None


def test_list_clients_sorted_by_name(session):
    repository.create_client(session, name="Samsung", slug="samsung")
    repository.create_client(session, name="Americanas", slug="americanas")
    items = repository.list_clients(session)
    assert [c["name"] for c in items] == ["Americanas", "Samsung"]


def test_update_status(session):
    created = repository.create_client(session, name="Sicredi", slug="sicredi")
    updated = repository.update_status(session, created["id"], "ACTIVE")
    assert updated["status"] == "ACTIVE"


def test_update_unknown_returns_none(session):
    assert repository.update(session, "nao-existe", {"name": "x"}) is None


def test_update_fields(session):
    created = repository.create_client(session, name="Vivo", slug="vivo")
    updated = repository.update(
        session,
        created["id"],
        {"sponsor_name": "Fulano", "selected_doc_ids": ["doc-1", "doc-2"]},
    )
    assert updated["sponsor_name"] == "Fulano"
    assert updated["selected_doc_ids"] == ["doc-1", "doc-2"]
