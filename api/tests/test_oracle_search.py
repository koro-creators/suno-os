"""Testes da busca web do Oráculo (A2/A3) e da montagem de provenance.

Offline: validam os caminhos graciosos (sem chave / sem domínios) sem tocar a rede.
"""

from __future__ import annotations

import pytest
from api.onboarding.service import _build_provenance
from api.onboarding.web_search import tavily_search


@pytest.mark.asyncio
async def test_tavily_sem_dominios_retorna_vazio():
    # regra de produto: domínios vazios = sem busca web (nem tenta a rede)
    assert await tavily_search("qualquer query", allowed_domains=[]) == []


@pytest.mark.asyncio
async def test_tavily_sem_chave_retorna_vazio(monkeypatch):
    monkeypatch.delenv("TAVILY_API_KEY", raising=False)
    assert await tavily_search("query", allowed_domains=["exemplo.com"]) == []


def test_provenance_com_sources_cita_urls():
    sources = [
        {"title": "Marca X", "url": "https://exemplo.com/sobre", "content": "trecho factual"},
    ]
    prov = _build_provenance(sources, "Oráculo Gemini", "Posicionamento")
    assert prov[0]["source"] == "https://exemplo.com/sobre"
    assert "trecho factual" in prov[0]["excerpt"]


def test_provenance_sem_sources_usa_origem_generica():
    prov = _build_provenance([], "Fallback local", "Persona")
    assert prov[0]["source"] == "Fallback local"
    assert "Persona" in prov[0]["excerpt"]
