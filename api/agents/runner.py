"""Agent runner — executa o grafo do agente como BackgroundTask. DB-backed (A-5).

`execute_run` roda como FastAPI BackgroundTask (thread pool), depois que a sessão
de request já fechou — então abre a própria sessão para atualizar o run no banco.
A criação/leitura de runs vive em `agents.repository`.
"""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone

from langchain_core.messages import HumanMessage

try:
    from agents import repository
    from core.db import _get_sessionmaker
except ImportError:  # test import root (repo root on sys.path)
    from api.agents import repository
    from api.core.db import _get_sessionmaker

logger = logging.getLogger(__name__)

TIMEOUT_SECONDS = 600  # 10 min per SPEC-021 CA-14


def execute_run(run_id: str, agent: dict) -> None:
    """Synchronous runner invoked as a BackgroundTask. Persiste status/saída em DB.

    Best-effort: roda fora do request (sessão própria); qualquer falha de DB é
    logada e engolida para nunca quebrar o caller (a resposta 202 já foi enviada).
    """
    try:
        session = _get_sessionmaker()()
    except Exception as exc:  # noqa: BLE001
        logger.warning("execute_run: DB indisponível para run %s: %s", run_id, exc)
        return
    try:
        run = repository.get_run(session, run_id)
        if not run:
            return

        repository.update_run(session, run_id, status="running")
        start = time.monotonic()

        try:
            from .graph import build_agent_graph
            from .memory import load_memory_context
            from .skill_loader import skill_to_tool

            skill_tools = [skill_to_tool(slug) for slug in (agent.get("assigned_skills") or [])]
            memory_ctx = load_memory_context(agent["id"])
            graph = build_agent_graph(
                instructions=agent.get("instructions", ""),
                skill_tools=skill_tools,
                memory_context=memory_ctx,
            )

            input_text = run["input"].get("text", "")
            state = graph.invoke({"messages": [HumanMessage(content=input_text)]})
            last_msg = state["messages"][-1]
            output_text = getattr(last_msg, "content", str(last_msg))

            repository.update_run(
                session,
                run_id,
                status="completed",
                output={"text": output_text},
                duration_ms=int((time.monotonic() - start) * 1000),
                finished_at=datetime.now(timezone.utc),
            )
        except Exception as exc:  # noqa: BLE001
            repository.update_run(
                session,
                run_id,
                status="failed",
                duration_ms=int((time.monotonic() - start) * 1000),
                finished_at=datetime.now(timezone.utc),
                error_message=str(exc),
            )
    except Exception as exc:  # noqa: BLE001 — falha de DB (get/update): nunca quebra o caller
        logger.warning("execute_run: erro de DB no run %s: %s", run_id, exc)
    finally:
        session.close()
