"""Video document processor.

Uses Gemini multimodal for transcription + keyframe description.
Chunks by segments, embeds, upserts, and generates thumbnail.
Falls back to placeholder text when Gemini is unavailable.
"""

from __future__ import annotations

import logging
from typing import List

from config import settings

logger = logging.getLogger(__name__)

SEGMENT_CHARS = 1800


def _transcribe_video(file_path: str) -> str:
    """Transcribe video using Gemini Flash multimodal."""
    try:
        import google.generativeai as genai

        if not settings.GOOGLE_API_KEY:
            raise RuntimeError("GOOGLE_API_KEY not set")

        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")

        video_file = genai.upload_file(file_path)
        response = model.generate_content(
            [
                "Analise este video. Faca uma transcricao do audio e descreva os elementos visuais "
                "importantes (cenas, textos na tela, graficos). Organize por timestamps a cada 2 minutos.",
                video_file,
            ]
        )
        return response.text
    except ImportError:
        logger.warning("google-generativeai not installed, returning placeholder")
        return f"[Video analysis placeholder — Gemini indisponivel para: {file_path}]"
    except Exception as exc:
        logger.error("Video transcription failed: %s", exc)
        return f"[Analise de video falhou: {exc}]"


def chunk_by_segments(text: str) -> List[str]:
    """Chunk transcription by ~2min segments."""
    if not text.strip():
        return []

    chunks: List[str] = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = start + SEGMENT_CHARS

        if end < text_len:
            break_pos = text.rfind(". ", start, end)
            if break_pos > start + SEGMENT_CHARS // 2:
                end = break_pos + 2

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end

    return chunks


async def process_video(doc_id: str, file_path: str) -> None:
    """Process a video document: transcribe, chunk, embed, upsert + thumbnail."""
    from chat.knowledge.embeddings import embed_texts
    from chat.knowledge.vector_store import upsert_chunks

    # Transcribe
    transcript = _transcribe_video(file_path)

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
        logger.warning("Failed to store video transcript: %s", exc)

    # Generate thumbnail from keyframe
    try:
        from chat.ingestion.thumbnail import generate_thumbnail

        await generate_thumbnail(doc_id, file_path, "mp4")
    except Exception as exc:
        logger.warning("Video thumbnail generation failed: %s", exc)

    # Chunk
    text_chunks = chunk_by_segments(transcript)
    logger.info("Document %s: %d chunks from video", doc_id, len(text_chunks))

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
            "metadata": {"source": "video", "chunk_method": "time_segments"},
        }
        for i, (chunk, embedding) in enumerate(zip(text_chunks, embeddings))
    ]

    await upsert_chunks(doc_id, chunk_dicts)
