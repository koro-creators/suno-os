"""Workflow tool: consultar_ontologia — state-bound, reads client ontology."""

from .base import workflow_tool

try:
    from core.db import _get_sessionmaker
    from onboarding.service import get_ontology_text
except ImportError:
    from api.core.db import _get_sessionmaker
    from api.onboarding.service import get_ontology_text


@workflow_tool("consultar_ontologia", state_bound=True)
def consultar_ontologia(client_id: str | None) -> str:
    """Carrega ontologia do cliente: posicionamento, persona, competidores, produto, tom de voz."""
    if not client_id:
        return "(nenhum cliente associado a este workflow)"
    session = _get_sessionmaker()()
    try:
        text = get_ontology_text(session, client_id)
    finally:
        session.close()
    return text or "(ontologia ainda não disponível para este cliente)"
