"""Preview runs — sandbox (triggered_by='preview'). DB-backed (A-5).

Preview runs ficam na mesma tabela agent_runs com triggered_by='preview'.
Cleanup por TTL roda no lifespan (main.py) e abre a própria sessão.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

try:
    from agents import repository
    from core.db import _get_sessionmaker
except ImportError:  # test import root
    from api.agents import repository
    from api.core.db import _get_sessionmaker

PREVIEW_TTL_HOURS = 1


def create_preview_run(session: Session, agent_id: str, input_text: str) -> dict:
    """Cria um preview run (TTL conceitual de 1h; limpeza por cleanup_expired_previews)."""
    return repository.create_run(
        session, agent_id=agent_id, triggered_by="preview", input_text=input_text
    )


def cleanup_expired_previews() -> int:
    """Remove preview runs além do TTL. Abre a própria sessão (chamado no lifespan)."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=PREVIEW_TTL_HOURS)
    try:
        session = _get_sessionmaker()()
    except Exception:
        return 0
    try:
        return repository.delete_expired_previews(session, cutoff)
    finally:
        session.close()
