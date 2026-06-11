"""Drive da Suno por cliente — pasta configurada + sync read-only.

Recorte da SPEC-006 (decisão 10/06/2026): em vez de OAuth por usuário +
ACL∩RBAC + delta sync, o admin compartilha a pasta do cliente (no Drive da
Suno) com a service account do Cloud Run e cola a URL aqui. O sync exporta
os docs como texto e os ingere na Biblioteca com scope=[slug].

Endpoints (admin-only, caixa-preta 404 — RN-009/011):
  GET    /api/clients/{slug}/drive         — status (pasta, último sync, docs)
  PUT    /api/clients/{slug}/drive/folder  — configura/valida a pasta
  POST   /api/clients/{slug}/drive/sync    — sincroniza agora
  DELETE /api/clients/{slug}/drive/folder  — desconfigura (docs ficam)
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

try:
    from admin.repository import get_user_for_auth
    from clientes import repository as clients_repo
    from core.db import get_session
    from drive import google_drive
    from drive.google_drive import DriveAccessError
    from drive.ingest import count_drive_documents, upsert_drive_document
except ImportError:  # test import root (repo root on sys.path)
    from api.admin.repository import get_user_for_auth
    from api.clientes import repository as clients_repo
    from api.core.db import get_session
    from api.drive import google_drive
    from api.drive.google_drive import DriveAccessError
    from api.drive.ingest import count_drive_documents, upsert_drive_document

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Drive"])


# ---------------------------------------------------------------------------
# Auth — mesmo padrão do approval router (Firebase autentica, role vem do DB)
# ---------------------------------------------------------------------------


def _resolve_admin(session: Session, request: Request, authorization: Optional[str]) -> str:
    """Resolve o uid de um admin autenticado. Caixa-preta: 404, nunca 403."""
    if authorization and authorization.startswith("Bearer "):
        try:
            import firebase_admin.auth as fb_auth

            try:
                from core.firebase import get_firebase_app
            except ImportError:  # test import root
                from api.core.firebase import get_firebase_app

            token = authorization.removeprefix("Bearer ").strip()
            decoded = fb_auth.verify_id_token(token, app=get_firebase_app())
            user = get_user_for_auth(session, decoded.get("uid"), decoded.get("email"))
            if user and user.get("role") == "admin" and user.get("is_active"):
                return decoded.get("uid", "unknown")
        except Exception:
            pass

    try:
        from config import settings
    except ImportError:  # test import root
        from api.config import settings

    if settings.DEBUG and request.headers.get("X-Debug-Admin") == "true":
        return "debug-admin"

    raise HTTPException(status_code=404, detail="Not found")


def _require_client(session: Session, slug: str) -> dict:
    client = clients_repo.get_by_slug(session, slug)
    if client is None:
        raise HTTPException(status_code=404, detail="Not found")
    return client.to_dict()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class DriveStatus(BaseModel):
    configured: bool
    folder_id: str | None
    folder_name: str | None
    last_sync: str | None
    doc_count: int | None
    sa_email: str


class SetFolderRequest(BaseModel):
    folder: str  # URL ou ID da pasta


class SetFolderResponse(BaseModel):
    folder_id: str
    folder_name: str


class SyncResponse(BaseModel):
    synced: int  # docs novos
    updated: int  # docs atualizados
    skipped: int  # arquivos sem texto extraível (entram como metadata-only)
    total: int  # arquivos vistos na pasta
    truncated: bool  # pasta tinha mais que o limite por sync


def _sa_email() -> str:
    try:
        from config import settings
    except ImportError:
        from api.config import settings
    return settings.DRIVE_SA_EMAIL


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/clients/{slug}/drive", response_model=DriveStatus)
async def drive_status(
    slug: str,
    request: Request,
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> DriveStatus:
    _resolve_admin(session, request, authorization)
    client = _require_client(session, slug)
    return DriveStatus(
        configured=bool(client.get("drive_folder_id")),
        folder_id=client.get("drive_folder_id"),
        folder_name=client.get("drive_folder_name"),
        last_sync=client.get("drive_last_sync"),
        doc_count=count_drive_documents(session, slug),
        sa_email=_sa_email(),
    )


@router.put("/clients/{slug}/drive/folder", response_model=SetFolderResponse)
async def set_drive_folder(
    slug: str,
    data: SetFolderRequest,
    request: Request,
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> SetFolderResponse:
    """Valida o acesso à pasta (já compartilhada com a SA) e a vincula ao cliente."""
    _resolve_admin(session, request, authorization)
    client = _require_client(session, slug)

    folder_id = google_drive.extract_folder_id(data.folder)
    if not folder_id:
        raise HTTPException(status_code=400, detail="Link de pasta do Drive inválido")

    try:
        folder = google_drive.get_folder(folder_id)
    except DriveAccessError as exc:
        raise HTTPException(status_code=400, detail=exc.reason)

    clients_repo.set_drive_folder(
        session,
        client["id"],
        folder_id=folder["id"],
        folder_name=folder["name"],
        last_sync=None,
    )
    logger.info("Drive: pasta %s vinculada ao cliente %s", folder["id"], slug)
    return SetFolderResponse(folder_id=folder["id"], folder_name=folder["name"])


@router.post("/clients/{slug}/drive/sync", response_model=SyncResponse)
async def sync_drive(
    slug: str,
    request: Request,
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> SyncResponse:
    """Sincroniza a pasta agora (inline, até MAX_FILES_PER_SYNC arquivos)."""
    actor_uid = _resolve_admin(session, request, authorization)
    client = _require_client(session, slug)

    folder_id = client.get("drive_folder_id")
    if not folder_id:
        raise HTTPException(status_code=400, detail="Nenhuma pasta do Drive configurada")

    try:
        files, truncated = google_drive.list_folder_files(folder_id)
    except DriveAccessError as exc:
        raise HTTPException(status_code=400, detail=exc.reason)

    synced = updated = skipped = 0
    for file in files:
        text = google_drive.fetch_file_text(file)
        if text is None:
            skipped += 1
        inserted = upsert_drive_document(
            session,
            client_slug=slug,
            file=file,
            text=text,
            created_by=f"drive-sync:{actor_uid}",
        )
        if inserted:
            synced += 1
        else:
            updated += 1

    clients_repo.set_drive_folder(
        session,
        client["id"],
        folder_id=folder_id,
        folder_name=client.get("drive_folder_name"),
        last_sync=datetime.now(timezone.utc),
    )
    if truncated:
        logger.warning(
            "Drive: pasta %s do cliente %s tem mais que %d arquivos — sync truncado",
            folder_id,
            slug,
            google_drive.MAX_FILES_PER_SYNC,
        )
    return SyncResponse(
        synced=synced, updated=updated, skipped=skipped, total=len(files), truncated=truncated
    )


@router.delete("/clients/{slug}/drive/folder", status_code=204)
async def disconnect_drive_folder(
    slug: str,
    request: Request,
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> None:
    """Remove o vínculo da pasta. Docs já sincronizados permanecem na Biblioteca."""
    _resolve_admin(session, request, authorization)
    client = _require_client(session, slug)
    clients_repo.set_drive_folder(
        session, client["id"], folder_id=None, folder_name=None, last_sync=None
    )
