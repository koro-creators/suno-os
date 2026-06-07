"""Wiki search tool — queries wiki_entities joined with clients by client name."""

from __future__ import annotations

import logging

from langchain_core.tools import tool

from core.db import get_sync_session

logger = logging.getLogger(__name__)


@tool
def search_wiki(client_name: str) -> str:
    """Search the wiki_entities database for a client by name.

    Returns all entity content (Posicionamento, Persona, Produto, etc.) for the
    matched client. Use this tool before answering any question about a client.

    Args:
        client_name: Full or partial name of the client to search for.
    """
    from sqlalchemy import text

    db = get_sync_session()

    try:
        rows = db.execute(
            text("""
                SELECT c.name, we.entity_type, we.content, we.status
                FROM wiki_entities we
                JOIN clients c ON c.id = we.client_id
                WHERE c.name ILIKE :pattern
                ORDER BY we.entity_type
            """),
            {"pattern": f"%{client_name}%"},
        ).fetchall()

        if not rows:
            return f"Nenhuma informação encontrada para o cliente '{client_name}'."

        client_found = rows[0][0]
        parts = [f"# {client_found}\n"]

        for _, entity_type, content, status in rows:
            if status in ("generated", "accepted"):
                parts.append(f"## {entity_type}\n{content}")

        if len(parts) == 1:
            return (
                f"Cliente '{client_found}' encontrado, mas sem informações disponíveis ainda "
                f"(todas as entidades estão com status pendente)."
            )

        return "\n\n".join(parts)

    except Exception as exc:
        logger.error("wiki_search: DB error: %s", exc)
        return f"Erro ao consultar a base de dados: {exc}"
    finally:
        db.close()
