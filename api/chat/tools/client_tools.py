"""Tool para buscar clientes na tabela clients."""

from __future__ import annotations

import logging

from langchain_core.tools import tool

from core.db import get_sync_session

logger = logging.getLogger(__name__)

# Cores do seletor de identidade (WizardStep1Metadata.tsx → RANDOM_COLORS)
_COR_NAMES: dict[str, str] = {
    "#EF4444": "vermelho",
    "#8B5CF6": "roxo",
    "#F97316": "laranja",
    "#06B6D4": "ciano",
    "#22C55E": "verde",
    "#F472B6": "rosa",
    "#A3E635": "verde-limão",
    "#FFC801": "amarelo",
}


def hex_para_cor(hex_color: str) -> str:
    """Converte um código hex para o nome de cor em português."""
    return _COR_NAMES.get(hex_color.upper() if hex_color else "", hex_color) or hex_color


@tool
def buscar_cliente(query: str) -> str:
    """Busca clientes cadastrados na plataforma sunOS pelo nome ou slug.

    Retorna nome, slug, descrição, cor, sponsor e status do cliente.
    Use quando o usuário perguntar sobre dados cadastrais de um cliente
    como nome, slug, cor de identificação ou contato sponsor.

    Args:
        query: Nome ou slug (parcial) do cliente a buscar.
    """
    db = get_sync_session()
    try:
        from sqlalchemy import text

        rows = db.execute(
            text("""
                SELECT name, slug, description, color, sponsor_name, sponsor_email, status
                FROM clients
                WHERE name ILIKE :pattern OR slug ILIKE :pattern
                ORDER BY name
                LIMIT 10
            """),
            {"pattern": f"%{query}%"},
        ).fetchall()

        if not rows:
            return f"Nenhum cliente encontrado para '{query}'."

        parts = []
        for name, slug, description, color, sponsor_name, sponsor_email, status in rows:
            lines = [f"**{name}** (slug: `{slug}`, status: {status})"]
            if description:
                lines.append(f"Descrição: {description}")
            if color:
                lines.append(f"Cor: {hex_para_cor(color)} ({color})")
            if sponsor_name or sponsor_email:
                sponsor = " — ".join(filter(None, [sponsor_name, sponsor_email]))
                lines.append(f"Sponsor: {sponsor}")
            parts.append("\n".join(lines))

        return "\n\n---\n\n".join(parts)

    except Exception as exc:
        logger.error("buscar_cliente: erro ao consultar DB: %s", exc)
        return f"Erro ao buscar cliente: {exc}"
    finally:
        db.close()
