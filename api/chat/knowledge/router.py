"""Knowledge API router — upload, list, search, delete documents."""

from __future__ import annotations

import asyncio
import logging
import os
import uuid
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from chat.knowledge.schemas import (
    DocumentListResponse,
    DocumentResponse,
    SearchRequest,
    SearchResponse,
    SearchResult,
    UploadResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/knowledge", tags=["Knowledge"])

# Max upload size: 50 MB
MAX_UPLOAD_SIZE = 50 * 1024 * 1024
ALLOWED_EXTENSIONS = {
    "pdf",
    "docx",
    "txt",
    "md",
    "png",
    "jpg",
    "jpeg",
    "webp",
    "mp3",
    "wav",
    "mp4",
    "mov",
}

# Local storage fallback when GCS is not configured
LOCAL_STORAGE_DIR = "/tmp/sunos-knowledge"


def _ensure_local_storage() -> str:
    """Ensure local storage directory exists."""
    os.makedirs(LOCAL_STORAGE_DIR, exist_ok=True)
    return LOCAL_STORAGE_DIR


def _get_file_extension(filename: str) -> str:
    """Extract file extension (lowercase, without dot)."""
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


async def _get_db_session():
    """Get an async DB session, or None if unavailable."""
    try:
        from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
        from sqlalchemy.orm import sessionmaker

        from config import settings

        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        return async_session()
    except Exception as exc:
        logger.warning("DB session unavailable: %s", exc)
        return None


@router.post("/upload", response_model=UploadResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    tags: str = Form(""),
    scope: str = Form(""),
    description: str = Form(""),
):
    """Upload a document to the knowledge base.

    Validates file size and type, saves to storage, and triggers async processing.

    Validações de metadados (RN-006, FR-001 do SPEC-004):
    - tags: mínimo 2 (separadas por vírgula)
    - description: mínimo 50 caracteres
    """
    # Validate extension
    ext = _get_file_extension(file.filename or "")
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Tipo de arquivo '{ext}' nao permitido. "
                f"Tipos aceitos: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            ),
        )

    # Read file and check size
    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Arquivo excede o limite de {MAX_UPLOAD_SIZE // (1024 * 1024)}MB.",
        )

    # Parse comma-separated tags and scope
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
    scope_list = [s.strip() for s in scope.split(",") if s.strip()] if scope else []

    # RN-006 / INC-API-06: validação obrigatória de metadados
    if len(tag_list) < 2:
        raise HTTPException(
            status_code=400,
            detail=(
                "Metadados obrigatórios: forneça no mínimo 2 tags "
                "(separadas por vírgula). RN-006/FR-001."
            ),
        )
    if len(description.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Metadados obrigatórios: descrição com no mínimo 50 caracteres. RN-006/FR-001.",
        )

    # Save file locally (GCS fallback)
    doc_id = str(uuid.uuid4())
    storage_dir = _ensure_local_storage()
    file_path = os.path.join(storage_dir, f"{doc_id}.{ext}")

    with open(file_path, "wb") as f:
        f.write(content)

    # Create document in DB
    session = await _get_db_session()
    if session:
        try:
            from sqlalchemy import text

            await session.execute(
                text(
                    """
                    INSERT INTO knowledge_documents
                        (id, title, description, file_type, file_size, file_url,
                         tags, scope, status, created_by)
                    VALUES
                        (:id, :title, :description, :file_type, :file_size, :file_url,
                         :tags, :scope, 'processing', :created_by)
                    """
                ),
                {
                    "id": doc_id,
                    "title": title,
                    "description": description or None,
                    "file_type": ext,
                    "file_size": len(content),
                    "file_url": file_path,
                    "tags": tag_list,
                    "scope": scope_list,
                    "created_by": "api",
                },
            )
            await session.commit()
        except Exception as exc:
            logger.error("Failed to create document record: %s", exc)
            await session.rollback()
        finally:
            await session.close()

    # Trigger async processing
    try:
        from chat.ingestion.processor import process_document

        asyncio.create_task(process_document(doc_id))
    except Exception as exc:
        logger.error("Failed to start document processing: %s", exc)

    return UploadResponse(
        id=doc_id,
        title=title,
        file_type=ext,
        status="processing",
    )


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(
    scope: Optional[str] = None,
    file_type: Optional[str] = None,
    status: Optional[str] = None,
):
    """List documents with optional filters."""
    session = await _get_db_session()
    if session is None:
        return DocumentListResponse(documents=[], total=0)

    try:
        from sqlalchemy import text

        conditions = []
        params: dict = {}

        if scope:
            conditions.append(":scope = ANY(scope)")
            params["scope"] = scope

        if file_type:
            conditions.append("file_type = :file_type")
            params["file_type"] = file_type

        if status:
            conditions.append("status = :status")
            params["status"] = status

        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

        result = await session.execute(
            text(
                f"""
                SELECT id, title, description, file_type, file_size, file_url,
                       thumbnail_url, tags, scope, status, error_message,
                       chunks_count, created_by, created_at, updated_at
                FROM knowledge_documents
                {where_clause}
                ORDER BY created_at DESC
                """
            ),
            params,
        )
        rows = result.fetchall()

        documents = [
            DocumentResponse(
                id=str(row.id),
                title=row.title,
                description=row.description,
                file_type=row.file_type,
                file_size=row.file_size,
                file_url=row.file_url,
                thumbnail_url=row.thumbnail_url,
                tags=row.tags or [],
                scope=row.scope or [],
                status=row.status,
                error_message=row.error_message,
                chunks_count=row.chunks_count or 0,
                created_by=row.created_by,
                created_at=row.created_at,
                updated_at=row.updated_at,
            )
            for row in rows
        ]

        return DocumentListResponse(documents=documents, total=len(documents))
    except Exception as exc:
        logger.error("Failed to list documents: %s", exc)
        return DocumentListResponse(documents=[], total=0)
    finally:
        await session.close()


@router.get("/documents/{doc_id}", response_model=DocumentResponse)
async def get_document(doc_id: str):
    """Get a single document by ID."""
    session = await _get_db_session()
    if session is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    try:
        from sqlalchemy import text

        result = await session.execute(
            text(
                """
                SELECT id, title, description, file_type, file_size, file_url,
                       thumbnail_url, tags, scope, status, error_message,
                       chunks_count, created_by, created_at, updated_at
                FROM knowledge_documents
                WHERE id = :doc_id
                """
            ),
            {"doc_id": doc_id},
        )
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")

        return DocumentResponse(
            id=str(row.id),
            title=row.title,
            description=row.description,
            file_type=row.file_type,
            file_size=row.file_size,
            file_url=row.file_url,
            thumbnail_url=row.thumbnail_url,
            tags=row.tags or [],
            scope=row.scope or [],
            status=row.status,
            error_message=row.error_message,
            chunks_count=row.chunks_count or 0,
            created_by=row.created_by,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to get document: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to retrieve document")
    finally:
        await session.close()


@router.delete("/documents/{doc_id}", status_code=204)
async def delete_document(doc_id: str):
    """Delete a document and its chunks."""
    from chat.knowledge.vector_store import delete_by_document

    session = await _get_db_session()
    if session is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    try:
        from sqlalchemy import text

        # Get file path to delete from storage
        result = await session.execute(
            text("SELECT file_url, thumbnail_url FROM knowledge_documents WHERE id = :doc_id"),
            {"doc_id": doc_id},
        )
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")

        # Delete chunks
        await delete_by_document(doc_id)

        # Delete document record
        await session.execute(
            text("DELETE FROM knowledge_documents WHERE id = :doc_id"),
            {"doc_id": doc_id},
        )
        await session.commit()

        # Delete files from storage
        for path in [row.file_url, row.thumbnail_url]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    pass

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to delete document: %s", exc)
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete document")
    finally:
        await session.close()


@router.post("/search", response_model=SearchResponse)
async def search_documents(body: SearchRequest):
    """Semantic search across knowledge documents."""
    from chat.knowledge.embeddings import embed_query
    from chat.knowledge.vector_store import search_similar

    query_embedding = embed_query(body.query)
    results = await search_similar(
        query_embedding,
        limit=body.limit,
        scope=body.scope,
        file_type=body.file_type,
    )

    search_results = [
        SearchResult(
            chunk_id=r["chunk_id"],
            document_id=r["document_id"],
            title=r["title"],
            file_type=r["file_type"],
            content=r["content"],
            chunk_index=r["chunk_index"],
            score=r["score"],
        )
        for r in results
    ]

    return SearchResponse(
        results=search_results,
        total=len(search_results),
        query=body.query,
    )
