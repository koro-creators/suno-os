"""Sessão SQLAlchemy compartilhada (SPEC-022 Fase B).

Dependency `get_session` reaproveitável por qualquer router que persiste em DB.
Exige um Postgres acessível — NÃO há fallback in-memory mockado. Quando o banco
está inacessível, responde 503. Em testes, `get_session` é sobrescrito via
``app.dependency_overrides`` por uma sessão SQLite em memória.

Importe sempre `get_session` a partir do MÓDULO do router (que re-exporta isto),
para que o override em testes case com o objeto exato usado em ``Depends``.
"""

from __future__ import annotations

import logging

from fastapi import HTTPException

logger = logging.getLogger(__name__)

_SessionLocal = None


def _get_sessionmaker():
    """Lazily build (and cache) the sessionmaker bound to DATABASE_URL."""
    global _SessionLocal
    if _SessionLocal is None:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        try:
            from config import settings
        except ImportError:  # test import root (repo root on sys.path)
            from api.config import settings

        engine = create_engine(
            settings.DATABASE_URL.replace("+asyncpg", ""),
            pool_pre_ping=True,
            connect_args={"connect_timeout": 5},
        )
        _SessionLocal = sessionmaker(bind=engine)
    return _SessionLocal


def get_session():
    """FastAPI dependency yielding a SQLAlchemy session.

    Força a conexão no checkout; se o banco estiver inacessível, levanta 503
    — dados nunca são servidos de um mock (decisão SPEC-022 Fase B).
    """
    try:
        session = _get_sessionmaker()()
        session.connection()  # força conectar; levanta se o DB estiver fora
    except Exception as exc:
        logger.error("DB unavailable: %s", exc)
        raise HTTPException(status_code=503, detail="Service unavailable")

    try:
        yield session
    finally:
        session.close()
