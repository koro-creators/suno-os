"""Ingestão de arquivos do Drive em knowledge_documents (Biblioteca).

Upsert idempotente: o id do documento é derivado do file id do Drive
(uuid5), então re-sync atualiza em vez de duplicar. Docs entram com
scope=[slug do cliente] — o ContextSidebar do chat e a Biblioteca já
filtram por scope (caixa-preta por construção).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

try:
    from drive.google_drive import file_type_label
    from models.knowledge import KnowledgeDocument
except ImportError:  # test import root (repo root on sys.path)
    from api.drive.google_drive import file_type_label
    from api.models.knowledge import KnowledgeDocument

_DRIVE_TAG = "drive"


def drive_doc_id(file_id: str) -> uuid.UUID:
    """ID determinístico do knowledge_document a partir do file id do Drive."""
    return uuid.uuid5(uuid.NAMESPACE_URL, f"sunos-drive:{file_id}")


def upsert_drive_document(
    session: Session,
    *,
    client_slug: str,
    file: dict,
    text: str | None,
    created_by: str,
) -> bool:
    """Upsert de um arquivo do Drive. Retorna True se inseriu, False se atualizou.

    Arquivos sem texto extraível (binários) entram como metadata-only
    (status='ready', content vazio) — aparecem na Biblioteca com link pro Drive.
    """
    now = datetime.now(timezone.utc)
    doc_id = drive_doc_id(file["id"])
    mime = file.get("mimeType", "")

    existing = session.get(KnowledgeDocument, doc_id)
    if existing is not None:
        existing.title = file.get("name") or existing.title
        existing.description = text
        existing.content_text = text
        existing.file_url = file.get("webViewLink")
        existing.status = "ready"
        existing.updated_at = now
        session.commit()
        return False

    doc = KnowledgeDocument(
        id=doc_id,
        title=file.get("name") or "Documento do Drive",
        description=text,
        content_text=text,
        file_type=file_type_label(mime),
        file_size=int(file["size"]) if file.get("size") else None,
        file_url=file.get("webViewLink"),
        tags=[_DRIVE_TAG],
        scope=[client_slug],
        status="ready",
        created_by=created_by,
        created_at=now,
        updated_at=now,
    )
    session.add(doc)
    session.commit()
    return True


def count_drive_documents(session: Session, client_slug: str) -> int | None:
    """Conta docs sincronizados do Drive para o cliente. None se não suportado.

    Usa operador de array do Postgres; em SQLite (testes) degrada para None
    em vez de quebrar o endpoint de status.
    """
    try:
        return (
            session.query(KnowledgeDocument)
            .filter(
                KnowledgeDocument.tags.any(_DRIVE_TAG),
                KnowledgeDocument.scope.any(client_slug),
            )
            .count()
        )
    except Exception:
        session.rollback()
        return None
