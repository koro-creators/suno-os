"""Knowledge search tools for LangChain agents.

Provides semantic search, full document reading, and related-document discovery.
"""

from __future__ import annotations

import asyncio
import logging
from typing import List, Optional

from langchain_core.tools import tool

logger = logging.getLogger(__name__)


def _run_async(coro):
    """Run an async coroutine from a sync context (LangChain tool invocation)."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures

            with concurrent.futures.ThreadPoolExecutor() as pool:
                return pool.submit(asyncio.run, coro).result()
        return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)


@tool
def search_knowledge(
    query: str,
    scope: Optional[List[str]] = None,
    file_type: Optional[str] = None,
    limit: int = 5,
) -> str:
    """Busca documentos relevantes na base de conhecimento.

    Args:
        query: A busca em linguagem natural.
        scope: Lista de escopos para filtrar (ex: ["santander", "vivo"]).
        file_type: Tipo de arquivo para filtrar (ex: "pdf", "mp3").
        limit: Número máximo de resultados.

    Returns:
        Documentos relevantes formatados com título, tipo, score e preview.
    """
    from chat.knowledge.embeddings import embed_query
    from chat.knowledge.vector_store import search_similar

    query_embedding = embed_query(query)
    results = _run_async(
        search_similar(query_embedding, limit=limit, scope=scope, file_type=file_type)
    )

    if not results:
        return "Nenhum documento encontrado na base de conhecimento para essa busca."

    parts = [f"Encontrados {len(results)} documento(s) relevantes:\n"]
    for i, r in enumerate(results, 1):
        score_pct = f"{r['score'] * 100:.0f}%"
        preview = r["content"][:200].replace("\n", " ")
        parts.append(
            f"{i}. [{r['file_type'].upper()}] {r['title']} (relevancia: {score_pct})\n"
            f"   ID: {r['document_id']}\n"
            f"   Preview: {preview}...\n"
        )

    return "\n".join(parts)


@tool
def read_full_document(doc_id: str) -> str:
    """Le o conteudo completo de um documento da Biblioteca.

    Args:
        doc_id: UUID do documento a ser lido.

    Returns:
        Conteudo completo do documento.
    """
    from chat.knowledge.vector_store import _get_async_session

    async def _read():
        session = await _get_async_session()
        if session is None:
            return "Erro: banco de dados indisponivel."
        try:
            from sqlalchemy import text

            result = await session.execute(
                text(
                    "SELECT title, file_type, content_text, tags, scope "
                    "FROM knowledge_documents WHERE id = :doc_id"
                ),
                {"doc_id": doc_id},
            )
            row = result.fetchone()
            if not row:
                return f"Documento {doc_id} nao encontrado."

            parts = [
                f"# {row.title}",
                f"Tipo: {row.file_type.upper()}",
            ]
            if row.tags:
                parts.append(f"Tags: {', '.join(row.tags)}")
            if row.scope:
                parts.append(f"Escopo: {', '.join(row.scope)}")
            parts.append(f"\n{row.content_text or '(sem conteudo de texto)'}")
            return "\n".join(parts)
        except Exception as exc:
            logger.error("Failed to read document: %s", exc)
            return f"Erro ao ler documento: {exc}"
        finally:
            await session.close()

    return _run_async(_read())


@tool
def find_related_documents(doc_id: str, limit: int = 3) -> str:
    """Encontra documentos relacionados baseado em similaridade vetorial.

    Args:
        doc_id: UUID do documento de referencia.
        limit: Numero maximo de documentos relacionados.

    Returns:
        Lista de documentos relacionados com score de similaridade.
    """
    from chat.knowledge.vector_store import get_document_chunks, search_similar

    async def _find_related():
        chunks = await get_document_chunks(doc_id)
        if not chunks:
            return f"Documento {doc_id} nao tem chunks para comparacao."

        # Compute average embedding from document chunks
        embeddings = [c["embedding"] for c in chunks if c.get("embedding")]
        if not embeddings:
            return "Documento sem embeddings para busca de similares."

        # Average the embeddings
        dim = len(embeddings[0]) if embeddings else 768
        avg_embedding = [0.0] * dim
        for emb in embeddings:
            if isinstance(emb, (list, tuple)):
                for j in range(min(len(emb), dim)):
                    avg_embedding[j] += emb[j]
        if embeddings:
            avg_embedding = [v / len(embeddings) for v in avg_embedding]

        # Search excluding the source document
        results = await search_similar(avg_embedding, limit=limit + 5)

        # Filter out the source document
        related = [r for r in results if r["document_id"] != doc_id][:limit]

        if not related:
            return "Nenhum documento relacionado encontrado."

        parts = [f"Documentos relacionados a {doc_id}:\n"]
        for i, r in enumerate(related, 1):
            score_pct = f"{r['score'] * 100:.0f}%"
            parts.append(
                f"{i}. [{r['file_type'].upper()}] {r['title']} (similaridade: {score_pct})\n"
                f"   ID: {r['document_id']}\n"
            )

        return "\n".join(parts)

    return _run_async(_find_related())


# Convenience list for registration
KNOWLEDGE_TOOLS = [search_knowledge, read_full_document, find_related_documents]
