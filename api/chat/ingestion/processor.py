"""Document processing dispatcher.

Detects file type and routes to the appropriate processor.
Updates document status to 'ready' or 'error' when done.
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

# File type → processor mapping
TEXT_TYPES = {"txt", "md"}
PDF_TYPES = {"pdf"}
IMAGE_TYPES = {"png", "jpg", "jpeg", "webp"}
AUDIO_TYPES = {"mp3", "wav"}
VIDEO_TYPES = {"mp4", "mov"}


async def _get_document(doc_id: str) -> dict | None:
    """Fetch document record from DB."""
    try:
        from sqlalchemy import text

        from chat.knowledge.router import _get_db_session

        session = await _get_db_session()
        if session is None:
            return None

        try:
            result = await session.execute(
                text(
                    "SELECT id, title, file_type, file_url, content_text FROM knowledge_documents WHERE id = :doc_id"
                ),
                {"doc_id": doc_id},
            )
            row = result.fetchone()
            if not row:
                return None
            return {
                "id": str(row.id),
                "title": row.title,
                "file_type": row.file_type,
                "file_url": row.file_url,
                "content_text": row.content_text,
            }
        finally:
            await session.close()
    except Exception as exc:
        logger.error("Failed to fetch document %s: %s", doc_id, exc)
        return None


async def _update_status(doc_id: str, status: str, error_message: str | None = None) -> None:
    """Update document status in the DB."""
    try:
        from sqlalchemy import text

        from chat.knowledge.router import _get_db_session

        session = await _get_db_session()
        if session is None:
            return

        try:
            await session.execute(
                text(
                    """
                    UPDATE knowledge_documents
                    SET status = :status, error_message = :error_message, updated_at = NOW()
                    WHERE id = :doc_id
                    """
                ),
                {"status": status, "error_message": error_message, "doc_id": doc_id},
            )
            await session.commit()
        finally:
            await session.close()
    except Exception as exc:
        logger.error("Failed to update status for %s: %s", doc_id, exc)


async def process_document(doc_id: str) -> None:
    """Main dispatcher: detect file type and call the appropriate processor."""
    logger.info("Starting processing for document %s", doc_id)

    doc = await _get_document(doc_id)
    if doc is None:
        logger.error("Document %s not found, cannot process", doc_id)
        return

    file_type = doc["file_type"].lower()
    file_url = doc.get("file_url", "")

    try:
        if file_type in TEXT_TYPES:
            from chat.ingestion.text_processor import process_text

            # For text files, read the content from the file
            content = ""
            if file_url:
                try:
                    with open(file_url, "r", encoding="utf-8") as f:
                        content = f.read()
                except Exception:
                    content = doc.get("content_text", "") or ""
            else:
                content = doc.get("content_text", "") or ""

            await process_text(doc_id, content)

        elif file_type in PDF_TYPES:
            from chat.ingestion.pdf_processor import process_pdf

            await process_pdf(doc_id, file_url or "")

        elif file_type in IMAGE_TYPES:
            from chat.ingestion.image_processor import process_image

            await process_image(doc_id, file_url or "")

        elif file_type in AUDIO_TYPES:
            from chat.ingestion.audio_processor import process_audio

            await process_audio(doc_id, file_url or "")

        elif file_type in VIDEO_TYPES:
            from chat.ingestion.video_processor import process_video

            await process_video(doc_id, file_url or "")

        else:
            logger.warning("Unsupported file type '%s' for document %s", file_type, doc_id)
            await _update_status(doc_id, "error", f"Tipo de arquivo '{file_type}' nao suportado")
            return

        await _update_status(doc_id, "ready")
        logger.info("Document %s processed successfully", doc_id)

    except Exception as exc:
        logger.error("Processing failed for document %s: %s", doc_id, exc)
        await _update_status(doc_id, "error", str(exc))
