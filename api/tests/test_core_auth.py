"""Testes de core/auth.py — resolução do usuário (JWT Firebase + fallback dev).

Contrato (pré-piloto, multiusuário):
  1. Bearer token válido → uid do Firebase (fonte canônica).
  2. Bearer token inválido → 401, SEM cair para X-User-ID (anti-spoof).
  3. Sem Bearer, fora de produção → X-User-ID é aceito (dev local + testes).
  4. Sem Bearer, em produção → X-User-ID é ignorado → 401.
  5. Sem credencial nenhuma → 401.
"""

from __future__ import annotations

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from core import auth as core_auth
from core.auth import get_current_user_id


@pytest.fixture
def client() -> TestClient:
    app = FastAPI()

    @app.get("/whoami")
    async def whoami(user_id: str = Depends(get_current_user_id)) -> dict:
        return {"user_id": user_id}

    return TestClient(app)


def test_valid_bearer_token_returns_uid(client, monkeypatch):
    monkeypatch.setattr(
        core_auth, "_decode_bearer_token", lambda authorization: {"uid": "firebase-uid-123"}
    )
    res = client.get("/whoami", headers={"Authorization": "Bearer good-token"})
    assert res.status_code == 200
    assert res.json() == {"user_id": "firebase-uid-123"}


def test_valid_bearer_wins_over_x_user_id(client, monkeypatch):
    """Com JWT presente, o X-User-ID é ignorado — uid vem do token."""
    monkeypatch.setattr(
        core_auth, "_decode_bearer_token", lambda authorization: {"uid": "firebase-uid-123"}
    )
    res = client.get(
        "/whoami",
        headers={"Authorization": "Bearer good-token", "X-User-ID": "spoofed"},
    )
    assert res.status_code == 200
    assert res.json() == {"user_id": "firebase-uid-123"}


def test_invalid_bearer_does_not_fall_back_to_x_user_id(client, monkeypatch):
    """Token inválido → 401 mesmo com X-User-ID presente (anti-spoof)."""
    monkeypatch.setattr(core_auth, "_decode_bearer_token", lambda authorization: None)
    res = client.get(
        "/whoami",
        headers={"Authorization": "Bearer bad-token", "X-User-ID": "spoofed"},
    )
    assert res.status_code == 401


def test_x_user_id_fallback_outside_production(client):
    """Sem JWT, ENVIRONMENT=local (default) aceita X-User-ID — mantém dev/testes."""
    res = client.get("/whoami", headers={"X-User-ID": "dev-user"})
    assert res.status_code == 200
    assert res.json() == {"user_id": "dev-user"}


def test_x_user_id_rejected_in_production(client, monkeypatch):
    import config

    monkeypatch.setattr(config.settings, "ENVIRONMENT", "production")
    res = client.get("/whoami", headers={"X-User-ID": "dev-user"})
    assert res.status_code == 401


def test_no_credentials_returns_401(client):
    res = client.get("/whoami")
    assert res.status_code == 401


def test_decode_bearer_token_handles_firebase_failure(monkeypatch):
    """Falha na verificação Firebase → None (vira 401 na dependency)."""
    monkeypatch.setattr("core.firebase.get_firebase_app", lambda: None)

    def _boom(token, app=None):
        raise ValueError("invalid token")

    monkeypatch.setattr("firebase_admin.auth.verify_id_token", _boom)
    assert core_auth._decode_bearer_token("Bearer whatever") is None


def test_decode_bearer_token_empty_token_returns_none():
    assert core_auth._decode_bearer_token("Bearer ") is None
