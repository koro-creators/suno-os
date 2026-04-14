"""Text/Markdown document processor.

Chunks by paragraphs, merges small chunks, embeds, and upserts.
"""

from __future__ import annotations

import logging
from typing import List

logger = logging.getLogger(__name__)

# Minimum tokens per chunk before merging with the next
MIN_CHUNK_TOKENS = 100
# Approximate characters per token
CHARS_PER_TOKEN = 4


def _estimate_tokens(text: str) -> int:
    """Rough token estimate based on character count."""
    return len(text) // CHARS_PER_TOKEN


def chunk_by_paragraph(content: str) -> List[str]:
    """Split content by double newlines and merge small chunks.

    Paragraphs below MIN_CHUNK_TOKENS are merged with the next paragraph.
    """
    raw_paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]

    if not raw_paragraphs:
        return [content.strip()] if content.strip() else []

    chunks: List[str] = []
    current = ""

    for para in raw_paragraphs:
        if current:
            current += "\n\n" + para
        else:
            current = para

        if _estimate_tokens(current) >= MIN_CHUNK_TOKENS:
            chunks.append(current)
            current = ""

    # Don't lose the trailing text
    if current:
        if chunks:
            # Merge with last chunk if it's small
            chunks[-1] += "\n\n" + current
        else:
            chunks.append(current)

    return chunks


async def process_text(doc_id: str, content: str) -> None:
    """Process a text/markdown document: chunk, embed, upsert."""
    from chat.knowledge.embeddings import embed_texts
    from chat.knowledge.vector_store import upsert_chunks

    if not content.strip():
        logger.warning("Empty content for document %s, skipping", doc_id)
        return

    # Store content_text in the document
    try:
        from sqlalchemy import text as sql_text

        from chat.knowledge.router import _get_db_session

        session = await _get_db_session()
        if session:
            try:
                await session.execute(
                    sql_text(
                        "UPDATE knowledge_documents SET content_text = :content WHERE id = :doc_id"
                    ),
                    {"content": content, "doc_id": doc_id},
                )
                await session.commit()
            finally:
                await session.close()
    except Exception as exc:
        logger.warning("Failed to store content_text: %s", exc)

    # Chunk
    text_chunks = chunk_by_paragraph(content)
    logger.info("Document %s: %d chunks from text", doc_id, len(text_chunks))

    if not text_chunks:
        return

    # Embed
    embeddings = embed_texts(text_chunks)

    # Prepare chunk dicts for upsert
    chunk_dicts = [
        {
            "chunk_index": i,
            "content": chunk,
            "embedding": embedding,
            "metadata": {"source": "text", "chunk_method": "paragraph"},
        }
        for i, (chunk, embedding) in enumerate(zip(text_chunks, embeddings))
    ]

    # Upsert to vector store
    await upsert_chunks(doc_id, chunk_dicts)
