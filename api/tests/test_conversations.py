"""Testes dos endpoints de conversas (Phase 11 persistence).

Regressão A-3 (docs/tasks/persistence-migration.md): os endpoints tinham um
param ``request: Any`` que o FastAPI interpretava como query param obrigatório
→ TODO request retornava 422 e o frontend engolia como "sem histórico".

Os testes exercem o caminho de fallback in-memory (DB indisponível na suite),
que é o mesmo shape de resposta do caminho Postgres.
"""

from __future__ import annotations

from datetime import datetime, timezone

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from chat.conversations.router import _memory_store, _store_conversation_memory, router


@pytest.fixture
def client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/api")
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_memory_store():
    _memory_store.clear()
    yield
    _memory_store.clear()


def _seed_conversation(conv_id: str, user_id: str) -> None:
    _store_conversation_memory(
        conversation_id=conv_id,
        user_id=user_id,
        skill_slug="copy-social",
        messages=[
            {"role": "user", "content": "oi", "timestamp": datetime.now(timezone.utc).isoformat()},
            {"role": "assistant", "content": "olá!", "timestamp": None},
        ],
    )


def test_list_conversations_does_not_422(client):
    """Regressão A-3: sem query param fantasma 'request'."""
    res = client.get("/api/conversations", headers={"X-User-ID": "u1"})
    assert res.status_code == 200
    assert res.json() == {"items": [], "total": 0}


def test_get_conversation_does_not_422(client):
    """Regressão A-3: 404 (não 422) para conversa desconhecida."""
    res = client.get("/api/conversations/unknown-id", headers={"X-User-ID": "u1"})
    assert res.status_code == 404


def test_endpoints_require_auth(client):
    assert client.get("/api/conversations").status_code == 401
    assert client.get("/api/conversations/any-id").status_code == 401


def test_get_conversation_roundtrip(client):
    _seed_conversation("conv-1", "u1")
    res = client.get("/api/conversations/conv-1", headers={"X-User-ID": "u1"})
    assert res.status_code == 200
    body = res.json()
    assert body["id"] == "conv-1"
    assert [m["content"] for m in body["messages"]] == ["oi", "olá!"]


def test_get_conversation_of_other_user_is_404(client):
    """Caixa-preta RN-010: conversa de outro usuário → 404, nunca 403."""
    _seed_conversation("conv-1", "u1")
    res = client.get("/api/conversations/conv-1", headers={"X-User-ID": "u2"})
    assert res.status_code == 404


def test_list_conversations_filters_by_user(client):
    _seed_conversation("conv-1", "u1")
    _seed_conversation("conv-2", "u2")
    res = client.get("/api/conversations", headers={"X-User-ID": "u1"})
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == "conv-1"
