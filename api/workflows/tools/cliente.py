"""Workflow tool: consultar_cliente — state-bound, reads client profile fields."""
from .base import workflow_tool

try:
    from core.db import _get_sessionmaker
except ImportError:
    from api.core.db import _get_sessionmaker

from sqlalchemy import text as sa_text

_COR_NAMES = {
    "#EF4444": "vermelho", "#8B5CF6": "roxo", "#F97316": "laranja",
    "#06B6D4": "ciano", "#22C55E": "verde", "#F472B6": "rosa",
    "#A3E635": "verde-limão", "#FFC801": "amarelo",
}


@workflow_tool("consultar_cliente", state_bound=True)
def consultar_cliente(client_id: str | None) -> str:
    """Retorna nome, slug, descrição, cor de identidade visual, sponsor e status do cliente."""
    if not client_id:
        return "(nenhum cliente associado a este workflow)"
    session = _get_sessionmaker()()
    try:
        row = session.execute(
            sa_text(
                "SELECT name, slug, description, color, sponsor_name, sponsor_email, status "
                "FROM clients WHERE id = :cid LIMIT 1"
            ),
            {"cid": client_id},
        ).fetchone()
    finally:
        session.close()

    if not row:
        return "(cliente não encontrado)"

    name, slug, description, color, sponsor_name, sponsor_email, status = row
    lines = [f"Nome: {name}", f"Slug: {slug}", f"Status: {status}"]
    if description:
        lines.append(f"Descrição: {description}")
    if color:
        lines.append(f"Cor: {_COR_NAMES.get((color or '').upper(), color)} ({color})")
    if sponsor_name or sponsor_email:
        sponsor = " — ".join(filter(None, [sponsor_name, sponsor_email]))
        lines.append(f"Sponsor: {sponsor}")
    return "\n".join(lines)
