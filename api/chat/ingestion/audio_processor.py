"""Audio document processor.

Uses Gemini Flash for transcription, chunks by ~2min segments, embeds, and upserts.
Falls back to placeholder text when Gemini is unavailable.
"""

from __future__ import annotations

import logging
from typing import List

from config import settings

logger = logging.getLogger(__name__)

# Approximate segment duration in characters (~2 min of speech ≈ 300 words ≈ 1800 chars)
SEGMENT_CHARS = 1800


def _transcribe_audio(file_path: str) -> str:
    """Transcribe audio using Gemini Flash multimodal."""
    try:
        import google.generativeai as genai

        if not settings.GOOGLE_API_KEY:
            raise RuntimeError("GOOGLE_API_KEY not set")

        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")

        audio_file = genai.upload_file(file_path)
        response = model.generate_content(
            [
                "Transcreva o audio a seguir em portugues. Inclua timestamps aproximados a cada 2 minutos.",
                audio_file,
            ]
        )
        return response.text
    except ImportError:
        logger.warning("google-generativeai not installed, returning placeholder")
        return f"[Transcricao placeholder — Gemini indisponivel para: {file_path}]"
    except Exception as exc:
        logger.error("Audio transcription failed: %s", exc)
        return f"[Transcricao falhou: {exc}]"


def chunk_by_segments(text: str) -> List[str]:
    """Chunk transcription by ~2min segments (estimated by character count)."""
    if not text.strip():
        return []

    chunks: List[str] = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = start + SEGMENT_CHARS

        # Try to break at sentence boundary
        if end < text_len:
            break_pos = text.rfind(". ", start, end)
            if break_pos > start + SEGMENT_CHARS // 2:
                end = break_pos + 2

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end

    return chunks


async def process_audio(doc_id: str, file_path: str) -> None:
    """Process an audio document: transcribe, chunk, embed, upsert."""
    from chat.knowledge.embeddings import embed_texts
    from chat.knowledge.vector_store import upsert_chunks

    # Transcribe
    transcript = _transcribe_audio(file_path)

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
                    {"content": transcript, "doc_id": doc_id},
                )
                await session.commit()
            finally:
                await session.close()
    except Exception as exc:
        logger.warning("Failed to store audio transcript: %s", exc)

    # Chunk
    text_chunks = chunk_by_segments(transcript)
    logger.info("Document %s: %d chunks from audio", doc_id, len(text_chunks))

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
            "metadata": {"source": "audio", "chunk_method": "time_segments"},
        }
        for i, (chunk, embedding) in enumerate(zip(text_chunks, embeddings))
    ]

    await upsert_chunks(doc_id, chunk_dicts)
