"""Image document processor.

Uses Gemini Vision for captioning and tag extraction.
Creates a single chunk from the caption, embeds, and upserts.
Falls back to placeholder text when Gemini is unavailable.
"""

from __future__ import annotations

import logging

from config import settings

logger = logging.getLogger(__name__)


def _caption_image(file_path: str) -> str:
    """Generate caption and tags for an image using Gemini Vision."""
    try:
        import google.generativeai as genai

        if not settings.GOOGLE_API_KEY:
            raise RuntimeError("GOOGLE_API_KEY not set")

        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")

        image_file = genai.upload_file(file_path)
        response = model.generate_content(
            [
                "Descreva esta imagem em detalhes em portugues. Inclua:\n"
                "1. Descricao geral da cena\n"
                "2. Elementos visuais principais (cores, objetos, pessoas)\n"
                "3. Texto visivel na imagem (se houver)\n"
                "4. Tags relevantes (separadas por virgula)\n"
                "5. Contexto provavel (publicidade, editorial, social media, etc.)",
                image_file,
            ]
        )
        return response.text
    except ImportError:
        logger.warning("google-generativeai not installed, returning placeholder")
        return f"[Image caption placeholder — Gemini indisponivel para: {file_path}]"
    except Exception as exc:
        logger.error("Image captioning failed: %s", exc)
        return f"[Analise de imagem falhou: {exc}]"


async def process_image(doc_id: str, file_path: str) -> None:
    """Process an image: caption, embed, upsert + thumbnail."""
    from chat.knowledge.embeddings import embed_texts
    from chat.knowledge.vector_store import upsert_chunks

    # Caption
    caption = _caption_image(file_path)

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
                    {"content": caption, "doc_id": doc_id},
                )
                await session.commit()
            finally:
                await session.close()
    except Exception as exc:
        logger.warning("Failed to store image caption: %s", exc)

    # Generate thumbnail
    try:
        from chat.ingestion.thumbnail import generate_thumbnail

        # Detect actual file type from path
        ext = file_path.rsplit(".", 1)[-1].lower() if "." in file_path else "png"
        await generate_thumbnail(doc_id, file_path, ext)
    except Exception as exc:
        logger.warning("Image thumbnail generation failed: %s", exc)

    # Single chunk from caption
    if not caption.strip():
        return

    embeddings = embed_texts([caption])

    chunk_dicts = [
        {
            "chunk_index": 0,
            "content": caption,
            "embedding": embeddings[0],
            "metadata": {"source": "image", "chunk_method": "caption"},
        }
    ]

    await upsert_chunks(doc_id, chunk_dicts)
