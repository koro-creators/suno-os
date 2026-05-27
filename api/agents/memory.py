"""Memory context loader — loads agent memory files as LLM context string.

Fase D: read from GCS paths stored in agent_memory_files (TASK-D06).
Fase C: no-op — returns empty string.
"""
from __future__ import annotations


def load_memory_context(agent_id: str) -> str:  # noqa: ARG001
    """Return concatenated memory context for an agent.

    GCS integration deferred to Fase D (TASK-D06).
    """
    return ""
