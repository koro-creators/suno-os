"""Server-side JIT migration v1 → v2 (SPEC-005 TASK-B06).

A v1 workflow has implicit linkage (`step.next_step` + `step.condition.then|else`)
and no canvas coordinates. A v2 workflow has explicit edges in
`workflow_edges` and `position_x/y` baked into each step's JSONB record.

This migration is invoked when the canvas opens a workflow whose
`definition.metadata.canvas_v2_migrated` is not `True`. It is also invoked
in batch by the production migration script (`api/scripts/migrate_workflows_v1_to_v2.py`,
TASK-D01).

Properties:

  • Idempotent — re-running on an already-migrated workflow is a no-op.
  • Atomic at the workflow level — the in-memory store is updated as a
    single mutation, so a partial state cannot be observed.
  • Deterministic — uses `auto_layout.layered_layout` whose ordering is
    stable; same input → same output coordinates and edge order.
  • Lossless — `next_step` and `condition.then|else` are NOT removed
    from the JSONB definition. They live alongside the new edges/positions
    for one release (constitution §11) so a rollback is trivial. Drop
    happens in Phase D / E (TASK-E08 sunset).

Handle mapping (constitution §2.4):
  • `step.next_step → t` becomes edge (step, "out") → (t, "in") for ANY type.
  • `step.condition.then → a` becomes edge (step, "then") → (a, "in").
  • `step.condition.else → b` becomes edge (step, "else") → (b, "in").
  • HITL `next_step` becomes (step, "approved") → (t, "in") — historical
    "happy path" of HITL was implicit approval.

The compiled v2 graph for a *linear* v1 workflow is byte-equivalent to its
v1 compilation (CA-26). The migration preserves source order so this holds.
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass

from .auto_layout import layered_layout

logger = logging.getLogger(__name__)


@dataclass
class MigrationResult:
    migrated: bool
    edges_created: int
    steps_with_position: int
    skipped_reason: str | None = None


def _is_already_migrated(workflow: dict) -> bool:
    metadata = workflow["definition"].get("metadata") or {}
    return bool(metadata.get("canvas_v2_migrated"))


def _build_edges_from_v1(steps: list[dict]) -> list[dict]:
    """Translate v1 implicit linkage into explicit edges.

    Returns plain dicts shaped like SCH WorkflowEdge so the caller can drop
    them straight into `workflow["edges"]`.
    """
    edges: list[dict] = []

    def _new_edge(src: str, handle: str, tgt: str) -> dict:
        return {
            "edge_id": str(uuid.uuid4()),
            "source_step_id": src,
            "source_handle": handle,
            "target_step_id": tgt,
            "target_handle": "in",
        }

    for step in steps:
        sid = step["id"]
        stype = step["type"]
        if step.get("condition"):
            cond = step["condition"]
            then_target = cond.get("then")
            else_target = cond.get("else")
            if then_target:
                edges.append(_new_edge(sid, "then", then_target))
            if else_target:
                edges.append(_new_edge(sid, "else", else_target))
            continue
        next_step = step.get("next_step")
        if next_step:
            # HITL nodes treat `next_step` as the approved branch (constitution §2.4).
            handle = "approved" if stype == "hitl" else "out"
            edges.append(_new_edge(sid, handle, next_step))
    return edges


def migrate_workflow(workflow_id: str, store: dict) -> MigrationResult:
    """Migrate one workflow in-place (in-memory store).

    Returns a MigrationResult describing what changed. Raises KeyError if
    the workflow_id is unknown — caller decides whether to 404.
    """
    workflow = store.get(workflow_id)
    if workflow is None:
        raise KeyError(workflow_id)

    if _is_already_migrated(workflow):
        return MigrationResult(
            migrated=False,
            edges_created=0,
            steps_with_position=0,
            skipped_reason="already_migrated",
        )

    steps: list[dict] = workflow["definition"].get("steps", [])

    # 1. Build edges from v1 linkage.
    edges = _build_edges_from_v1(steps)

    # 2. Auto-layout positions over the same edge set.
    positions = layered_layout(steps, edges)

    # 3. Apply positions to each step (in JSONB definition).
    steps_with_position = 0
    for step in steps:
        pos = positions.get(step["id"])
        if pos is None:
            continue
        step["position_x"] = pos["x"]
        step["position_y"] = pos["y"]
        steps_with_position += 1

    # 4. Persist edges + flip the metadata flag atomically (in-memory).
    metadata = workflow["definition"].setdefault("metadata", {})
    metadata["canvas_v2_migrated"] = True
    workflow["edges"] = edges

    logger.info(
        "migrate_workflow(%s): edges=%d positions=%d",
        workflow_id,
        len(edges),
        steps_with_position,
    )
    return MigrationResult(
        migrated=True,
        edges_created=len(edges),
        steps_with_position=steps_with_position,
    )
