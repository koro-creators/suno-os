"""Busca web do Oráculo via Tavily (A2/A3).

Graceful por design: sem ``TAVILY_API_KEY`` → ``[]`` (o Oráculo cai no
conhecimento do próprio LLM). Erros de rede → ``[]`` (best-effort, nunca levanta).
A busca é **restrita aos ``allowed_domains``** configurados no wizard (A3) — regra
de produto: domínios vazios = sem pesquisa web.
"""

from __future__ import annotations

import logging
import os

import httpx

logger = logging.getLogger(__name__)

_TAVILY_URL = "https://api.tavily.com/search"


async def tavily_search(
    query: str,
    allowed_domains: list[str] | None = None,
    max_results: int = 4,
) -> list[dict]:
    """Pesquisa no Tavily restrita a ``allowed_domains``.

    Retorna lista de ``{"title", "url", "content"}``. Lista vazia se não houver
    chave, se ``allowed_domains`` for vazio, ou em caso de erro (best-effort).
    """
    if not allowed_domains:
        return []  # regra de produto: sem domínios = sem busca web

    api_key = os.environ.get("TAVILY_API_KEY", "").strip()
    if not api_key:
        logger.info("Tavily: TAVILY_API_KEY ausente — pulando busca web")
        return []

    payload = {
        "query": query,
        "search_depth": "basic",
        "max_results": max_results,
        "include_domains": allowed_domains,
        "include_answer": False,
    }
    headers = {"Authorization": f"Bearer {api_key}"}

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(_TAVILY_URL, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:  # noqa: BLE001 — best-effort, nunca quebra o Oráculo
        logger.warning("Tavily: busca falhou para %r (%s)", query[:60], exc)
        return []

    results: list[dict] = []
    for r in data.get("results", []):
        results.append(
            {
                "title": (r.get("title") or "").strip(),
                "url": (r.get("url") or "").strip(),
                "content": (r.get("content") or "").strip()[:500],
            }
        )
    logger.info(
        "Tavily: %d resultados para %r (domínios=%s)", len(results), query[:60], allowed_domains
    )
    return results
