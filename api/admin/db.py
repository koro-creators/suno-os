"""Sessão de DB do admin router — re-exporta o `get_session` compartilhado.

A implementação vive em `api/core/db.py` (reaproveitada por todos os routers
que persistem em DB). Mantido aqui por compatibilidade: o admin router importa
`get_session` deste módulo.
"""

from __future__ import annotations

try:
    from core.db import _get_sessionmaker, get_session
except ImportError:  # test import root (repo root on sys.path)
    from api.core.db import _get_sessionmaker, get_session

__all__ = ["get_session", "_get_sessionmaker"]
