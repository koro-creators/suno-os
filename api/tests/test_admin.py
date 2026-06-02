"""Phase 11 — Backend tests for Admin API (SPEC-022 Fase A in-memory).

Covers:
  - Users: list, filter, patch role/status, invite
  - Integrations: list, update (masked value)
  - Skills defaults: list, update
  - Audit log: list, filter by user/action/date
"""

from __future__ import annotations

import pytest
from api.admin.router import (
    _audit_log,
    _integrations,
    _users,
    router,
)
from fastapi import FastAPI
from fastapi.testclient import TestClient

# Snapshot of initial seed data to restore between tests
_USERS_SEED = {
    "uid-1": {
        "uid": "uid-1",
        "name": "Heitor Miranda",
        "email": "heitor@suno.com.br",
        "role": "admin",
        "is_active": True,
        "last_access": "2026-05-26T14:00:00Z",
        "created_at": "2026-01-10T09:00:00Z",
    },
    "uid-2": {
        "uid": "uid-2",
        "name": "Ana Silva",
        "email": "ana@suno.com.br",
        "role": "creator",
        "is_active": True,
        "last_access": "2026-05-25T10:30:00Z",
        "created_at": "2026-02-14T11:00:00Z",
    },
    "uid-3": {
        "uid": "uid-3",
        "name": "Carlos Melo",
        "email": "carlos@suno.com.br",
        "role": "viewer",
        "is_active": False,
        "last_access": "2026-05-10T08:00:00Z",
        "created_at": "2026-03-01T09:00:00Z",
    },
}

_INTEGRATIONS_SEED = {
    "gemini_api_key": {
        "key": "gemini_api_key",
        "name": "Gemini API",
        "description": "Chave de API do Google Gemini para geração de conteúdo",
        "configured": False,
        "value_masked": None,
    },
    "openai_api_key": {
        "key": "openai_api_key",
        "name": "OpenAI API",
        "description": "Chave de API da OpenAI (GPT-4o, DALL-E)",
        "configured": False,
        "value_masked": None,
    },
}


@pytest.fixture(autouse=True)
def reset_admin_store():
    """Restore the in-memory stores to seed state before each test."""
    import copy

    _users.clear()
    _users.update(copy.deepcopy(_USERS_SEED))
    _integrations.clear()
    _integrations.update(copy.deepcopy(_INTEGRATIONS_SEED))
    _audit_log.clear()
    yield
    _users.clear()
    _users.update(copy.deepcopy(_USERS_SEED))
    _integrations.clear()
    _integrations.update(copy.deepcopy(_INTEGRATIONS_SEED))
    _audit_log.clear()


@pytest.fixture(autouse=True)
def _force_admin_mock_mode(monkeypatch):
    """Pin admin auth to mock mode for the CRUD/audit suite.

    The CI image installs firebase_admin, which flips
    ``_FIREBASE_ADMIN_AVAILABLE`` to True; ``_require_admin`` then rejects the
    unauthenticated TestClient with 404 (caixa-preta). These tests exercise the
    in-memory CRUD/audit logic, not Firebase verification, so we force the
    no-Firebase fallback path the same way a dev environment without
    credentials behaves.
    """
    monkeypatch.setattr("api.admin.router._FIREBASE_ADMIN_AVAILABLE", False)


@pytest.fixture
def client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/api/admin")
    return TestClient(app)


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


def test_list_users_returns_all_three(client):
    resp = client.get("/api/admin/users")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 3
    assert len(body["items"]) == 3


def test_list_users_filter_active(client):
    resp = client.get("/api/admin/users?status=active")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2
    assert all(u["is_active"] for u in body["items"])


def test_list_users_filter_suspended(client):
    resp = client.get("/api/admin/users?status=suspended")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert not body["items"][0]["is_active"]


def test_patch_user_role(client):
    resp = client.patch("/api/admin/users/uid-2", json={"role": "admin"})
    assert resp.status_code == 200
    assert resp.json()["role"] == "admin"


def test_patch_user_suspend(client):
    resp = client.patch("/api/admin/users/uid-1", json={"is_active": False})
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False


def test_patch_unknown_user_returns_404(client):
    resp = client.patch("/api/admin/users/uid-999", json={"role": "viewer"})
    assert resp.status_code == 404


def test_invite_user_returns_201(client):
    resp = client.post(
        "/api/admin/users/invite",
        json={"email": "novo@suno.com.br", "role": "creator"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "invited"
    assert "uid" in body


def test_invite_user_appears_in_list(client):
    client.post("/api/admin/users/invite", json={"email": "test@suno.com.br"})
    resp = client.get("/api/admin/users")
    assert resp.json()["total"] == 4


# ---------------------------------------------------------------------------
# Integrations
# ---------------------------------------------------------------------------


def test_list_integrations_returns_two(client):
    resp = client.get("/api/admin/integrations")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 2
    keys = {i["key"] for i in items}
    assert "gemini_api_key" in keys
    assert "openai_api_key" in keys


def test_list_integrations_never_exposes_value(client):
    resp = client.get("/api/admin/integrations")
    for item in resp.json():
        assert item["value_masked"] is None


def test_update_integration_masks_value(client):
    resp = client.put(
        "/api/admin/integrations/gemini_api_key",
        json={"value": "AIzaSy-test-key-1234"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["key"] == "gemini_api_key"
    assert body["status"] == "saved"
    assert body["value_masked"].startswith("***...")
    assert body["value_masked"].endswith("1234")


def test_update_integration_marks_configured(client):
    client.put("/api/admin/integrations/gemini_api_key", json={"value": "key-ABCD"})
    resp = client.get("/api/admin/integrations")
    gemini = next(i for i in resp.json() if i["key"] == "gemini_api_key")
    assert gemini["configured"] is True


def test_update_unknown_integration_returns_404(client):
    resp = client.put("/api/admin/integrations/unknown_key", json={"value": "x"})
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Skills defaults
# ---------------------------------------------------------------------------


def test_list_skill_defaults_returns_three(client):
    resp = client.get("/api/admin/skills/defaults")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 3
    slugs = {s["skill_slug"] for s in items}
    assert "copy-social" in slugs


def test_update_skill_default_changes_model(client):
    resp = client.put(
        "/api/admin/skills/defaults/copy-social",
        json={"model": "gpt-4o", "temperature": 0.5, "max_tokens": 1024},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["model"] == "gpt-4o"
    assert body["temperature"] == 0.5
    assert body["max_tokens"] == 1024


def test_update_unknown_skill_default_returns_404(client):
    resp = client.put(
        "/api/admin/skills/defaults/unknown-skill",
        json={"model": "gpt-4o", "temperature": 0.5, "max_tokens": 1024},
    )
    assert resp.status_code == 404


def test_update_skill_default_temperature_out_of_range(client):
    resp = client.put(
        "/api/admin/skills/defaults/copy-social",
        json={"model": "gpt-4o", "temperature": 3.0, "max_tokens": 1024},
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------


def test_audit_log_empty_after_reset(client):
    resp = client.get("/api/admin/audit-log")
    assert resp.status_code == 200
    assert resp.json()["total"] == 0


def test_audit_log_records_user_invite(client):
    client.post("/api/admin/users/invite", json={"email": "audit@suno.com.br"})
    resp = client.get("/api/admin/audit-log")
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["action"] == "user_invited"


def test_audit_log_records_integration_update(client):
    client.put("/api/admin/integrations/gemini_api_key", json={"value": "key-XY"})
    resp = client.get("/api/admin/audit-log")
    assert resp.json()["total"] == 1
    assert resp.json()["items"][0]["action"] == "integration_updated"


def test_audit_log_filter_by_action(client):
    client.post("/api/admin/users/invite", json={"email": "a@suno.com.br"})
    client.put("/api/admin/integrations/openai_api_key", json={"value": "key-ZZ"})
    resp = client.get("/api/admin/audit-log?action=user_invited")
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["action"] == "user_invited"


def test_audit_log_pagination(client):
    for i in range(5):
        client.post("/api/admin/users/invite", json={"email": f"u{i}@suno.com.br"})
    resp = client.get("/api/admin/audit-log?per_page=2&page=1")
    body = resp.json()
    assert body["total"] == 5
    assert len(body["items"]) == 2
