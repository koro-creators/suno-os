"""Embedding wrapper for Gemini text-embedding-004 (768 dims).

Falls back to zero vectors when the Gemini API is unavailable (local dev).
"""

from __future__ import annotations

import logging
from typing import List

from config import settings

logger = logging.getLogger(__name__)

EMBEDDING_DIM = 768
MODEL_NAME = "models/text-embedding-004"


def _get_client():
    """Lazily initialise the Gemini generative-AI client."""
    try:
        import google.generativeai as genai

        if not settings.GOOGLE_API_KEY:
            raise RuntimeError("GOOGLE_API_KEY not set")
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        return genai
    except Exception as exc:
        logger.warning("Gemini embedding client unavailable: %s", exc)
        return None


def embed_text(text: str) -> List[float]:
    """Embed a single text string into a 768-dim vector.

    Returns a zero vector if the Gemini API is unavailable.
    """
    client = _get_client()
    if client is None:
        logger.debug("Returning zero vector (Gemini unavailable)")
        return [0.0] * EMBEDDING_DIM

    try:
        result = client.embed_content(
            model=MODEL_NAME,
            content=text,
            task_type="retrieval_document",
        )
        return result["embedding"]
    except Exception as exc:
        logger.error("Embedding failed: %s", exc)
        return [0.0] * EMBEDDING_DIM


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Embed multiple texts. Falls back to zero vectors on failure."""
    client = _get_client()
    if client is None:
        logger.debug("Returning zero vectors (Gemini unavailable)")
        return [[0.0] * EMBEDDING_DIM for _ in texts]

    try:
        result = client.embed_content(
            model=MODEL_NAME,
            content=texts,
            task_type="retrieval_document",
        )
        return result["embedding"]
    except Exception as exc:
        logger.error("Batch embedding failed: %s", exc)
        return [[0.0] * EMBEDDING_DIM for _ in texts]


def embed_query(text: str) -> List[float]:
    """Embed a search query (uses retrieval_query task type).

    Returns a zero vector if the Gemini API is unavailable.
    """
    client = _get_client()
    if client is None:
        logger.debug("Returning zero vector (Gemini unavailable)")
        return [0.0] * EMBEDDING_DIM

    try:
        result = client.embed_content(
            model=MODEL_NAME,
            content=text,
            task_type="retrieval_query",
        )
        return result["embedding"]
    except Exception as exc:
        logger.error("Query embedding failed: %s", exc)
        return [0.0] * EMBEDDING_DIM
