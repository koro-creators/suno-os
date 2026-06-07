"""Garante que a observabilidade Langfuse é prod-safe: desligada por padrão.

Sem LANGFUSE_ENABLED (caso de prod hoje), nada é ativado nem importado.
"""

from __future__ import annotations

import pytest
from api.core import observability


@pytest.mark.asyncio
async def test_desligado_por_padrao(monkeypatch):
    monkeypatch.delenv("LANGFUSE_ENABLED", raising=False)
    assert observability.langfuse_enabled() is False
    # context manager vira no-op (yield None) — caller não quebra
    async with observability.trace_generation("x", model="m", input="i") as gen:
        assert gen is None


@pytest.mark.asyncio
async def test_enabled_exige_chaves(monkeypatch):
    monkeypatch.setenv("LANGFUSE_ENABLED", "true")
    monkeypatch.delenv("LANGFUSE_PUBLIC_KEY", raising=False)
    monkeypatch.delenv("LANGFUSE_SECRET_KEY", raising=False)
    # flag on mas sem chaves → continua desligado (não tenta inicializar)
    assert observability.langfuse_enabled() is False
