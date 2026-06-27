"""Workflow tools relacionados a reuniões: ler atas e gerar documentos de conhecimento."""

from __future__ import annotations

import datetime

from langchain_core.tools import tool
from pydantic import BaseModel, Field

from .base import register_tool, workflow_tool


@workflow_tool("ler_atas_reunioes", context_bound=True)
def ler_atas_reunioes(context: dict) -> str:
    """Lê o conteúdo da ata de reunião identificada pelo gatilho. Use esta ferramenta para obter o texto da ata antes de qualquer análise."""  # noqa: E501
    config_overrides: dict = context.get("config_overrides") or {}
    trigger_doc: dict = config_overrides.get("trigger_doc") or {}

    title: str = trigger_doc.get("title") or "Ata de reunião"
    content: str = trigger_doc.get("content") or ""

    if not content:
        return "Nenhum conteúdo de ata disponível para esta reunião."

    return f"=== {title} ===\n\n{content}"


# ---------------------------------------------------------------------------
# gerar_pdf — regular LangChain tool (LLM passes all args)
# ---------------------------------------------------------------------------


class GerarPdfInput(BaseModel):
    titulo: str = Field(description="Título descritivo criado a partir do conteúdo da ata — NÃO peça ao usuário")  # noqa: E501
    conteudo: str = Field(description="Resumo estruturado do conhecimento extraído da ata — NÃO peça ao usuário")  # noqa: E501
    cliente_slug: str = Field(description="Slug da empresa mencionada na ata (ex: 'automaserv'). Use 'suno' se não identificar — NÃO peça ao usuário")  # noqa: E501
    cliente_nome: str = Field(description="Nome completo da empresa identificada na ata. Use 'Suno' se não identificar — NÃO peça ao usuário")  # noqa: E501


@tool("gerar_pdf", args_schema=GerarPdfInput)
def _gerar_pdf(titulo: str, conteudo: str, cliente_slug: str, cliente_nome: str) -> dict:
    """Gera o documento de conhecimento em PDF. CHAME ESTA FERRAMENTA imediatamente após analisar a ata — NÃO pergunte ao usuário nenhuma informação. Derive todos os argumentos do conteúdo da ata: crie o titulo, escreva o conteudo estruturado, identifique cliente_slug e cliente_nome da empresa mencionada (use 'suno'/'Suno' como fallback). O arquivo será salvo ou baixado pelo step de ação conectado."""  # noqa: E501
    timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    slug = titulo.lower().replace(" ", "-").replace("/", "-")[:40]
    filename = f"{slug}-{timestamp}.pdf"
    return {
        "titulo": titulo,
        "conteudo": conteudo,
        "cliente_slug": cliente_slug,
        "cliente_nome": cliente_nome,
        "filename": filename,
        "saved_to": "base",
        "status": "gerado",
    }


register_tool("gerar_pdf", _gerar_pdf)
