"""pgvector operations for knowledge chunks.

Provides upsert, similarity search, and deletion.
Falls back to empty results when the database is unavailable.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any, Dict, List, Optional

from config import settings

logger = logging.getLogger(__name__)


async def _get_async_session():
    """Create an async SQLAlchemy session. Returns None if DB is unavailable."""
    try:
        from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
        from sqlalchemy.orm import sessionmaker

        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        return async_session()
    except Exception as exc:
        logger.warning("Database connection unavailable: %s", exc)
        return None


async def upsert_chunks(
    doc_id: str,
    chunks: List[Dict[str, Any]],
) -> None:
    """Insert chunks with embeddings into knowledge_chunks.

    Each chunk dict should have: content, embedding, chunk_index, metadata (optional).
    """
    session = await _get_async_session()
    if session is None:
        logger.warning("Skipping upsert_chunks — no DB connection")
        return

    try:
        from sqlalchemy import text

        # Delete existing chunks for this document first
        await session.execute(
            text("DELETE FROM knowledge_chunks WHERE document_id = :doc_id"),
            {"doc_id": doc_id},
        )

        for chunk in chunks:
            chunk_id = str(uuid.uuid4())
            embedding = chunk.get("embedding", [])
            metadata = chunk.get("metadata", {})

            await session.execute(
                text(
                    """
                    INSERT INTO knowledge_chunks (id, document_id, chunk_index, content, embedding, metadata)
                    VALUES (:id, :doc_id, :chunk_index, :content, :embedding, :metadata)
                    """
                ),
                {
                    "id": chunk_id,
                    "doc_id": doc_id,
                    "chunk_index": chunk["chunk_index"],
                    "content": chunk["content"],
                    "embedding": str(embedding),
                    "metadata": metadata,
                },
            )

        # Update document chunks_count
        await session.execute(
            text(
                "UPDATE knowledge_documents SET chunks_count = :count, updated_at = NOW() WHERE id = :doc_id"
            ),
            {"count": len(chunks), "doc_id": doc_id},
        )

        await session.commit()
        logger.info("Upserted %d chunks for document %s", len(chunks), doc_id)
    except Exception as exc:
        logger.error("Failed to upsert chunks: %s", exc)
        await session.rollback()
    finally:
        await session.close()


async def search_similar(
    query_embedding: List[float],
    limit: int = 5,
    scope: Optional[List[str]] = None,
    file_type: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Search for similar chunks using cosine distance.

    Returns list of dicts with: chunk_id, document_id, title, file_type, content, score.
    """
    session = await _get_async_session()
    if session is None:
        logger.warning("Returning empty results — no DB connection")
        return []

    try:
        from sqlalchemy import text

        # Build WHERE clauses
        conditions = []
        params: Dict[str, Any] = {
            "embedding": str(query_embedding),
            "limit": limit,
        }

        if scope:
            conditions.append("d.scope && :scope")
            params["scope"] = scope

        if file_type:
            conditions.append("d.file_type = :file_type")
            params["file_type"] = file_type

        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)

        query = text(
            f"""
            SELECT
                c.id as chunk_id,
                c.document_id,
                d.title,
                d.file_type,
                c.content,
                c.chunk_index,
                1 - (c.embedding <=> :embedding) as score
            FROM knowledge_chunks c
            JOIN knowledge_documents d ON c.document_id = d.id
            {where_clause}
            ORDER BY c.embedding <=> :embedding
            LIMIT :limit
            """
        )

        result = await session.execute(query, params)
        rows = result.fetchall()

        return [
            {
                "chunk_id": str(row.chunk_id),
                "document_id": str(row.document_id),
                "title": row.title,
                "file_type": row.file_type,
                "content": row.content,
                "chunk_index": row.chunk_index,
                "score": float(row.score) if row.score else 0.0,
            }
            for row in rows
        ]
    except Exception as exc:
        logger.error("Similarity search failed: %s", exc)
        return []
    finally:
        await session.close()


async def delete_by_document(doc_id: str) -> None:
    """Delete all chunks belonging to a document."""
    session = await _get_async_session()
    if session is None:
        logger.warning("Skipping delete_by_document — no DB connection")
        return

    try:
        from sqlalchemy import text

        await session.execute(
            text("DELETE FROM knowledge_chunks WHERE document_id = :doc_id"),
            {"doc_id": doc_id},
        )
        await session.commit()
        logger.info("Deleted chunks for document %s", doc_id)
    except Exception as exc:
        logger.error("Failed to delete chunks: %s", exc)
        await session.rollback()
    finally:
        await session.close()


async def get_document_chunks(doc_id: str) -> List[Dict[str, Any]]:
    """Get all chunks for a document, ordered by chunk_index."""
    session = await _get_async_session()
    if session is None:
        return []

    try:
        from sqlalchemy import text

        result = await session.execute(
            text(
                """
                SELECT id, chunk_index, content, embedding, metadata
                FROM knowledge_chunks
                WHERE document_id = :doc_id
                ORDER BY chunk_index
                """
            ),
            {"doc_id": doc_id},
        )
        rows = result.fetchall()
        return [
            {
                "id": str(row.id),
                "chunk_index": row.chunk_index,
                "content": row.content,
                "embedding": row.embedding,
                "metadata": row.metadata,
            }
            for row in rows
        ]
    except Exception as exc:
        logger.error("Failed to get document chunks: %s", exc)
        return []
    finally:
        await session.close()
