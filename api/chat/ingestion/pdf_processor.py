"""PDF document processor.

Extracts text with pdfplumber, chunks by sections, embeds, and upserts.
Falls back to placeholder text if pdfplumber is unavailable.
"""

from __future__ import annotations

import logging
from typing import List

logger = logging.getLogger(__name__)

# Chunking parameters
MAX_CHUNK_TOKENS = 1000
OVERLAP_TOKENS = 200
CHARS_PER_TOKEN = 4


def _estimate_tokens(text: str) -> int:
    return len(text) // CHARS_PER_TOKEN


def _extract_text_from_pdf(file_path: str) -> str:
    """Extract all text from a PDF using pdfplumber."""
    try:
        import pdfplumber

        text_parts = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        return "\n\n".join(text_parts)
    except ImportError:
        logger.warning("pdfplumber not installed, returning placeholder")
        return f"[PDF content placeholder — pdfplumber not installed for: {file_path}]"
    except Exception as exc:
        logger.error("Failed to extract PDF text: %s", exc)
        return f"[PDF extraction error: {exc}]"


def chunk_by_sections(text: str) -> List[str]:
    """Chunk text by ~1000 tokens with ~200 token overlap."""
    if not text.strip():
        return []

    max_chars = MAX_CHUNK_TOKENS * CHARS_PER_TOKEN
    overlap_chars = OVERLAP_TOKENS * CHARS_PER_TOKEN

    chunks: List[str] = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = start + max_chars

        # Try to break at paragraph boundary
        if end < text_len:
            break_pos = text.rfind("\n\n", start, end)
            if break_pos > start + max_chars // 2:
                end = break_pos + 2
            else:
                # Try sentence boundary
                break_pos = text.rfind(". ", start, end)
                if break_pos > start + max_chars // 2:
                    end = break_pos + 2

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        # Move forward with overlap
        start = end - overlap_chars if end < text_len else text_len

    return chunks


async def process_pdf(doc_id: str, file_path: str) -> None:
    """Process a PDF document: extract, chunk, embed, upsert."""
    from chat.knowledge.embeddings import embed_texts
    from chat.knowledge.vector_store import upsert_chunks

    # Extract text
    full_text = _extract_text_from_pdf(file_path)

    # Store content_text
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
                    {"content": full_text, "doc_id": doc_id},
                )
                await session.commit()
            finally:
                await session.close()
    except Exception as exc:
        logger.warning("Failed to store PDF content_text: %s", exc)

    # Generate thumbnail
    try:
        from chat.ingestion.thumbnail import generate_thumbnail

        await generate_thumbnail(doc_id, file_path, "pdf")
    except Exception as exc:
        logger.warning("Thumbnail generation failed: %s", exc)

    # Chunk
    text_chunks = chunk_by_sections(full_text)
    logger.info("Document %s: %d chunks from PDF", doc_id, len(text_chunks))

    if not text_chunks:
        return

    # Embed
    embeddings = embed_texts(text_chunks)

    # Upsert
    chunk_dicts = [
        {
            "chunk_index": i,
            "content": chunk,
            "embedding": embedding,
            "metadata": {"source": "pdf", "chunk_method": "sections_with_overlap"},
        }
        for i, (chunk, embedding) in enumerate(zip(text_chunks, embeddings))
    ]

    await upsert_chunks(doc_id, chunk_dicts)
