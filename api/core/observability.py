"""Observabilidade opcional via Langfuse — LOCAL-ONLY por enquanto.

Desenhado para **nunca quebrar prod**:
- Gated por ``settings.LANGFUSE_ENABLED`` (default False). Com a flag off, o pacote
  ``langfuse`` nem é importado — zero efeito colateral em produção.
- Lazy-import + try/except em tudo: erro de init/rede vira no-op silencioso.
- ``trace_generation`` é um context manager async que rende ``None`` quando desligado;
  o caller checa ``if gen:`` antes de usar.

Reutilizável por qualquer parte do backend (Oráculo, chat, etc.).
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Optional

logger = logging.getLogger(__name__)

_client: Any = None
_init_tried = False

_TRUTHY = {"1", "true", "yes", "on"}


def langfuse_enabled() -> bool:
    """Gate explícito (env). Lê os.environ direto — mesma fonte do SDK do langfuse."""
    return (
        os.environ.get("LANGFUSE_ENABLED", "").strip().lower() in _TRUTHY
        and bool(os.environ.get("LANGFUSE_PUBLIC_KEY"))
        and bool(os.environ.get("LANGFUSE_SECRET_KEY"))
    )


def _get_client() -> Any:
    """Singleton do client Langfuse. None se desligado ou se a init falhar."""
    global _client, _init_tried
    if not langfuse_enabled():
        return None
    if _init_tried:
        return _client
    _init_tried = True
    try:
        from langfuse import get_client  # import tardio: só quando habilitado

        _client = get_client()  # lê LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST do ambiente
        logger.info("Langfuse habilitado (host=%s)", os.environ.get("LANGFUSE_HOST", "?"))
    except Exception as exc:  # noqa: BLE001 — observabilidade nunca quebra o app
        logger.warning("Langfuse desabilitado (init falhou): %s", exc)
        _client = None
    return _client


@asynccontextmanager
async def trace_generation(
    name: str,
    model: Optional[str] = None,
    input: Any = None,
    metadata: Optional[dict] = None,
):
    """Span de 'generation' do Langfuse. No-op (yield None) se desligado/erro.

    Uso::

        async with trace_generation("oracle:Persona", model="x", input=prompt) as gen:
            resp = await llm.ainvoke(...)
            if gen:
                gen.update(output=resp.content)
    """
    client = _get_client()
    if client is None:
        yield None
        return

    cm = None
    obs = None
    try:
        cm = client.start_as_current_observation(
            as_type="generation", name=name, model=model, input=input, metadata=metadata
        )
        obs = cm.__enter__()
    except Exception as exc:  # noqa: BLE001
        logger.debug("Langfuse: falha ao abrir span (%s)", exc)
        yield None
        return

    try:
        yield obs
    finally:
        try:
            cm.__exit__(None, None, None)
            client.flush()
        except Exception:  # noqa: BLE001
            pass
