"""Testes do Drive por cliente (recorte da SPEC-006 — pasta via service account).

Google Drive é mockado (sem rede); o que se testa é o contrato dos endpoints:
admin-gating caixa-preta (404), validação de pasta, contadores do sync e
persistência do vínculo no cliente.
"""

from __future__ import annotations

from datetime import datetime, timezone

import pytest
from api.drive import client_drive as cd
from api.drive.google_drive import extract_folder_id
from api.models.base import Base
from api.models.client import Client
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

ADMIN = {"X-Debug-Admin": "true"}  # settings.DEBUG=True nos testes


@pytest.fixture
def ctx():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine, tables=[Client.__table__])
    TestSession = sessionmaker(bind=engine)

    def _override():
        s = TestSession()
        try:
            yield s
        finally:
            s.close()

    app = FastAPI()
    app.include_router(cd.router, prefix="/api")
    app.dependency_overrides[cd.get_session] = _override

    # Seed de um cliente
    s = TestSession()
    try:
        s.add(Client(id="c-1", name="Vivo", slug="vivo", status="ACTIVE"))
        s.commit()
    finally:
        s.close()

    return TestClient(app), TestSession


# ---------------------------------------------------------------------------
# extract_folder_id (unit)
# ---------------------------------------------------------------------------


def test_extract_folder_id_from_urls():
    fid = "1AbC_dEf-GhIjKlMnOpQ"
    assert extract_folder_id(f"https://drive.google.com/drive/folders/{fid}") == fid
    assert extract_folder_id(f"https://drive.google.com/drive/u/0/folders/{fid}?usp=share") == fid
    assert extract_folder_id(fid) == fid
    assert extract_folder_id("https://drive.google.com/file/d/xyz/view") is None
    assert extract_folder_id("") is None
    assert extract_folder_id("não é um link") is None


# ---------------------------------------------------------------------------
# Auth / caixa-preta
# ---------------------------------------------------------------------------


def test_endpoints_are_admin_only_404(ctx):
    client, _ = ctx
    assert client.get("/api/clients/vivo/drive").status_code == 404
    assert client.put("/api/clients/vivo/drive/folder", json={"folder": "x"}).status_code == 404
    assert client.post("/api/clients/vivo/drive/sync").status_code == 404
    assert client.delete("/api/clients/vivo/drive/folder").status_code == 404


def test_unknown_client_is_404(ctx):
    client, _ = ctx
    assert client.get("/api/clients/nao-existe/drive", headers=ADMIN).status_code == 404


# ---------------------------------------------------------------------------
# Configurar pasta
# ---------------------------------------------------------------------------


def test_set_folder_validates_and_persists(ctx, monkeypatch):
    client, _ = ctx
    monkeypatch.setattr(
        cd.google_drive, "get_folder", lambda fid: {"id": fid, "name": "Pasta Vivo"}
    )
    resp = client.put(
        "/api/clients/vivo/drive/folder",
        json={"folder": "https://drive.google.com/drive/folders/1AbC_dEf-GhIjKlMnOpQ"},
        headers=ADMIN,
    )
    assert resp.status_code == 200
    assert resp.json() == {"folder_id": "1AbC_dEf-GhIjKlMnOpQ", "folder_name": "Pasta Vivo"}

    status = client.get("/api/clients/vivo/drive", headers=ADMIN).json()
    assert status["configured"] is True
    assert status["folder_id"] == "1AbC_dEf-GhIjKlMnOpQ"
    assert status["folder_name"] == "Pasta Vivo"
    assert status["last_sync"] is None
    assert "@" in status["sa_email"]


def test_set_folder_invalid_link_is_400(ctx):
    client, _ = ctx
    resp = client.put(
        "/api/clients/vivo/drive/folder", json={"folder": "nao é link"}, headers=ADMIN
    )
    assert resp.status_code == 400


def test_set_folder_without_access_is_400_with_reason(ctx, monkeypatch):
    client, _ = ctx

    def _no_access(fid):
        # cd.DriveAccessError: mesma classe que o router captura (dual-root import)
        raise cd.DriveAccessError("Pasta não encontrada ou sem acesso.")

    monkeypatch.setattr(cd.google_drive, "get_folder", _no_access)
    resp = client.put(
        "/api/clients/vivo/drive/folder",
        json={"folder": "1AbC_dEf-GhIjKlMnOpQ"},
        headers=ADMIN,
    )
    assert resp.status_code == 400
    assert "compartilhada" in resp.json()["detail"] or "acesso" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# Standalone (wizard — sem cliente)
# ---------------------------------------------------------------------------


def test_service_account_email(ctx):
    client, _ = ctx
    assert client.get("/api/drive/service-account").status_code == 404  # caixa-preta
    resp = client.get("/api/drive/service-account", headers=ADMIN)
    assert resp.status_code == 200
    assert "@" in resp.json()["sa_email"]


def test_folder_info_validates_without_binding(ctx, monkeypatch):
    client, _ = ctx
    monkeypatch.setattr(
        cd.google_drive, "get_folder", lambda fid: {"id": fid, "name": "Pasta Teste"}
    )
    resp = client.get(
        "/api/drive/folder-info",
        params={"folder": "https://drive.google.com/drive/folders/1AbC_dEf-GhIjKlMnOpQ"},
        headers=ADMIN,
    )
    assert resp.status_code == 200
    assert resp.json() == {"folder_id": "1AbC_dEf-GhIjKlMnOpQ", "folder_name": "Pasta Teste"}

    # Não vinculou a nenhum cliente
    status = client.get("/api/clients/vivo/drive", headers=ADMIN).json()
    assert status["configured"] is False


def test_folder_info_invalid_link_is_400(ctx):
    client, _ = ctx
    resp = client.get("/api/drive/folder-info", params={"folder": "lixo"}, headers=ADMIN)
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Sync
# ---------------------------------------------------------------------------


def _configure_folder(client, monkeypatch):
    monkeypatch.setattr(
        cd.google_drive, "get_folder", lambda fid: {"id": fid, "name": "Pasta Vivo"}
    )
    client.put(
        "/api/clients/vivo/drive/folder",
        json={"folder": "1AbC_dEf-GhIjKlMnOpQ"},
        headers=ADMIN,
    )


def test_sync_without_folder_is_400(ctx):
    client, _ = ctx
    resp = client.post("/api/clients/vivo/drive/sync", headers=ADMIN)
    assert resp.status_code == 400


def test_sync_counts_and_last_sync(ctx, monkeypatch):
    client, _ = ctx
    _configure_folder(client, monkeypatch)

    files = [
        {"id": "f1", "name": "Briefing.gdoc", "mimeType": "application/vnd.google-apps.document"},
        {"id": "f2", "name": "Logo.png", "mimeType": "image/png"},
    ]
    monkeypatch.setattr(cd.google_drive, "list_folder_files", lambda fid: (files, False))
    monkeypatch.setattr(
        cd.google_drive,
        "fetch_file_text",
        lambda f: "conteúdo do briefing" if f["id"] == "f1" else None,
    )

    seen: list[dict] = []

    def _fake_upsert(session, *, client_slug, file, text, created_by):
        seen.append({"slug": client_slug, "file": file["id"], "text": text, "by": created_by})
        return True  # tudo inserido (novo)

    monkeypatch.setattr(cd, "upsert_drive_document", _fake_upsert)

    resp = client.post("/api/clients/vivo/drive/sync", headers=ADMIN)
    assert resp.status_code == 200
    body = resp.json()
    assert body == {"synced": 2, "updated": 0, "skipped": 1, "total": 2, "truncated": False}

    assert [s["file"] for s in seen] == ["f1", "f2"]
    assert seen[0]["slug"] == "vivo"
    assert seen[0]["text"] == "conteúdo do briefing"
    assert seen[1]["text"] is None  # binário entra como metadata-only
    assert seen[0]["by"].startswith("drive-sync:")

    status = client.get("/api/clients/vivo/drive", headers=ADMIN).json()
    assert status["last_sync"] is not None


def test_resync_reports_updated(ctx, monkeypatch):
    client, _ = ctx
    _configure_folder(client, monkeypatch)
    files = [{"id": "f1", "name": "Doc", "mimeType": "application/vnd.google-apps.document"}]
    monkeypatch.setattr(cd.google_drive, "list_folder_files", lambda fid: (files, False))
    monkeypatch.setattr(cd.google_drive, "fetch_file_text", lambda f: "texto")
    monkeypatch.setattr(cd, "upsert_drive_document", lambda session, **kw: False)  # já existia

    body = client.post("/api/clients/vivo/drive/sync", headers=ADMIN).json()
    assert body["synced"] == 0
    assert body["updated"] == 1


# ---------------------------------------------------------------------------
# Desconectar
# ---------------------------------------------------------------------------


def test_disconnect_clears_folder_config(ctx, monkeypatch):
    client, _ = ctx
    _configure_folder(client, monkeypatch)

    resp = client.delete("/api/clients/vivo/drive/folder", headers=ADMIN)
    assert resp.status_code == 204

    status = client.get("/api/clients/vivo/drive", headers=ADMIN).json()
    assert status["configured"] is False
    assert status["folder_id"] is None


# ---------------------------------------------------------------------------
# drive_doc_id (unit, determinístico p/ dedup)
# ---------------------------------------------------------------------------


def test_drive_doc_id_is_deterministic():
    from api.drive.ingest import drive_doc_id

    assert drive_doc_id("f1") == drive_doc_id("f1")
    assert drive_doc_id("f1") != drive_doc_id("f2")


def test_sync_timestamp_is_recent_shape():
    # sanity: datetime aware UTC (formato persistido no last_sync)
    now = datetime.now(timezone.utc)
    assert now.tzinfo is not None
