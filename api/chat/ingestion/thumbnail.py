"""Thumbnail generation for knowledge documents.

Generates 120x120 WebP thumbnails for PDFs (first page), images, and video keyframes.
Falls back gracefully when Pillow or other dependencies are unavailable.
"""

from __future__ import annotations

import logging
import os

logger = logging.getLogger(__name__)

THUMBNAIL_SIZE = (120, 120)
LOCAL_STORAGE_DIR = "/tmp/sunos-knowledge/thumbnails"


def _ensure_thumbnail_dir() -> str:
    os.makedirs(LOCAL_STORAGE_DIR, exist_ok=True)
    return LOCAL_STORAGE_DIR


async def _update_thumbnail_url(doc_id: str, thumbnail_path: str) -> None:
    """Store thumbnail URL in the document record."""
    try:
        from sqlalchemy import text as sql_text

        from chat.knowledge.router import _get_db_session

        session = await _get_db_session()
        if session:
            try:
                await session.execute(
                    sql_text(
                        "UPDATE knowledge_documents SET thumbnail_url = :url WHERE id = :doc_id"
                    ),
                    {"url": thumbnail_path, "doc_id": doc_id},
                )
                await session.commit()
            finally:
                await session.close()
    except Exception as exc:
        logger.warning("Failed to update thumbnail URL: %s", exc)


def _generate_pdf_thumbnail(file_path: str, output_path: str) -> bool:
    """Render first page of PDF as thumbnail."""
    try:
        from PIL import Image  # noqa: F401  — availability probe; ImportError handled below

        # Try pdf2image first
        try:
            from pdf2image import convert_from_path

            images = convert_from_path(file_path, first_page=1, last_page=1, size=THUMBNAIL_SIZE)
            if images:
                images[0].save(output_path, "WEBP", quality=80)
                return True
        except ImportError:
            pass

        # Fallback: try pdfplumber + Pillow
        try:
            import pdfplumber

            with pdfplumber.open(file_path) as pdf:
                if pdf.pages:
                    page_image = pdf.pages[0].to_image(resolution=72)
                    img = page_image.original
                    img.thumbnail(THUMBNAIL_SIZE)
                    img.save(output_path, "WEBP", quality=80)
                    return True
        except (ImportError, Exception) as exc:
            logger.debug("pdfplumber thumbnail fallback failed: %s", exc)

        return False
    except ImportError:
        logger.warning("Pillow not installed, cannot generate PDF thumbnail")
        return False


def _generate_image_thumbnail(file_path: str, output_path: str) -> bool:
    """Resize image to thumbnail."""
    try:
        from PIL import Image

        img = Image.open(file_path)
        img.thumbnail(THUMBNAIL_SIZE)
        img.save(output_path, "WEBP", quality=80)
        return True
    except ImportError:
        logger.warning("Pillow not installed, cannot generate image thumbnail")
        return False
    except Exception as exc:
        logger.error("Image thumbnail failed: %s", exc)
        return False


def _generate_video_thumbnail(file_path: str, output_path: str) -> bool:
    """Extract keyframe from video for thumbnail."""
    try:
        import subprocess

        # Try ffmpeg for keyframe extraction
        result = subprocess.run(
            [
                "ffmpeg",
                "-i",
                file_path,
                "-vframes",
                "1",
                "-vf",
                f"scale={THUMBNAIL_SIZE[0]}:{THUMBNAIL_SIZE[1]}:force_original_aspect_ratio=decrease",
                "-y",
                output_path,
            ],
            capture_output=True,
            timeout=30,
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired, Exception) as exc:
        logger.warning("Video thumbnail failed (ffmpeg may not be installed): %s", exc)
        return False


async def generate_thumbnail(doc_id: str, file_path: str, file_type: str) -> str | None:
    """Generate a thumbnail for a document.

    Returns the thumbnail path if successful, None otherwise.
    """
    thumbnail_dir = _ensure_thumbnail_dir()
    output_path = os.path.join(thumbnail_dir, f"{doc_id}.webp")

    success = False

    if file_type == "pdf":
        success = _generate_pdf_thumbnail(file_path, output_path)
    elif file_type in ("png", "jpg", "jpeg", "webp"):
        success = _generate_image_thumbnail(file_path, output_path)
    elif file_type in ("mp4", "mov"):
        success = _generate_video_thumbnail(file_path, output_path)
    else:
        # No thumbnail for audio or other types
        return None

    if success:
        await _update_thumbnail_url(doc_id, output_path)
        logger.info("Thumbnail generated for document %s", doc_id)
        return output_path

    logger.info("No thumbnail generated for document %s (type: %s)", doc_id, file_type)
    return None
