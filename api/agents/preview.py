"""Preview runs — sandbox execution with in-memory TTL (1h).

Cleanup task in main.py lifespan (TASK-C12).
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from .runner import _runs, create_run

PREVIEW_TTL_HOURS = 1

_preview_run_ids: set[str] = set()


def create_preview_run(agent_id: str, input_text: str) -> dict:
    """Create a preview run with a 1-hour TTL."""
    run = create_run(agent_id, triggered_by="preview", input_text=input_text)
    _preview_run_ids.add(run["id"])
    run["expires_at"] = (
        datetime.now(timezone.utc) + timedelta(hours=PREVIEW_TTL_HOURS)
    ).isoformat()
    return run


def cleanup_expired_previews() -> int:
    """Delete preview runs past their TTL. Returns count deleted."""
    now = datetime.now(timezone.utc)
    expired = [
        rid
        for rid in list(_preview_run_ids)
        if rid in _runs
        and "expires_at" in _runs[rid]
        and datetime.fromisoformat(_runs[rid]["expires_at"]) < now
    ]
    for rid in expired:
        _runs.pop(rid, None)
        _preview_run_ids.discard(rid)
    return len(expired)
