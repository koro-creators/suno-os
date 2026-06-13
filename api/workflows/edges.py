"""Workflow edges CRUD service (SPEC-005 Phase B / TASK-B01).

Edges are first-class citizens in the canvas data model (constitution §2.1).
This module owns:
  • bulk replacement of edges for a workflow (POST /edges)
  • read-only listing (GET /edges)
  • single-edge deletion (DELETE /edges/{edge_id})

Persistence note. Until the workflow router migrates from its in-memory dict
(`_workflows`) to SQLAlchemy, edges are stored alongside each workflow record
under `_workflows[wf_id]['edges']` as a list of dicts matching SCH WorkflowEdge.
The shape of those records is intentionally identical to `WorkflowEdge`
schemas so that swapping the storage backend later is a no-op for callers.

Validation is intentionally minimal here — heavy graph validation
(cycles, fan-in without merge, …) lives in `validator.py` and is invoked
from the PUT handler (TASK-B01b). This module enforces only the structural
invariants that the data layer would enforce in DB:

  1. workflow exists (404 caixa-preta otherwise)
  2. each edge references step IDs that exist in the workflow definition
  3. tuple uniqueness `(workflow, src, src_handle, tgt, tgt_handle)`
  4. handle vocabulary (Pydantic Literal already enforces; defensive re-check
     for direct internal callers that bypass the schema layer)

Anything richer (acyclicity, RBAC on tools, fan-in policy) belongs to
`validator.py` because it is graph-shape concerns, not edge-shape concerns.
"""

from __future__ import annotations

import uuid
from typing import Iterable

from .schemas import WorkflowEdge

ALLOWED_SOURCE_HANDLES = frozenset(
    {"out", "error", "then", "else", "approved", "rejected", "modified"}
)
ALLOWED_TARGET_HANDLES = frozenset({"in"})
# `condition` aceita 2 entradas nomeadas adicionais: `in_a` (CAMPO) e
# `in_b` (VALOR) — ver .claude/rules/canvas-conventions.md.
ALLOWED_TARGET_HANDLES_BY_TYPE: dict[str, frozenset[str]] = {
    "condition": frozenset({"in", "in_a", "in_b"}),
}


class EdgeValidationError(ValueError):
    """Raised when bulk-replace receives malformed edges.

    The router translates this into a 400 with a structured payload so the
    canvas can revert the offending change client-side (UX §4 of spec.md).
    """

    def __init__(self, detail: str, *, edge_index: int | None = None) -> None:
        super().__init__(detail)
        self.detail = detail
        self.edge_index = edge_index


def _step_ids(workflow: dict) -> set[str]:
    """Collect step IDs declared in the workflow's JSONB definition."""
    return {step["id"] for step in workflow["definition"].get("steps", [])}


def _check_handles(edge: WorkflowEdge, steps_by_id: dict[str, dict], *, idx: int) -> None:
    if edge.source_handle not in ALLOWED_SOURCE_HANDLES:
        raise EdgeValidationError(
            f"edge[{idx}]: source_handle '{edge.source_handle}' "
            f"not in {sorted(ALLOWED_SOURCE_HANDLES)}",
            edge_index=idx,
        )
    target_step = steps_by_id.get(edge.target_step_id)
    allowed_target = (
        ALLOWED_TARGET_HANDLES_BY_TYPE.get(target_step["type"], ALLOWED_TARGET_HANDLES)
        if target_step is not None
        else ALLOWED_TARGET_HANDLES
    )
    if edge.target_handle not in allowed_target:
        raise EdgeValidationError(
            f"edge[{idx}]: target_handle '{edge.target_handle}' "
            f"not in {sorted(allowed_target)}",
            edge_index=idx,
        )


def _check_step_refs(edge: WorkflowEdge, step_ids: set[str], *, idx: int) -> None:
    if edge.source_step_id not in step_ids:
        raise EdgeValidationError(
            f"edge[{idx}]: source_step_id '{edge.source_step_id}' not in workflow steps",
            edge_index=idx,
        )
    if edge.target_step_id not in step_ids:
        raise EdgeValidationError(
            f"edge[{idx}]: target_step_id '{edge.target_step_id}' not in workflow steps",
            edge_index=idx,
        )


def _check_unique(edges: Iterable[WorkflowEdge]) -> None:
    seen: set[tuple[str, str, str, str]] = set()
    for idx, edge in enumerate(edges):
        key = (
            edge.source_step_id,
            edge.source_handle,
            edge.target_step_id,
            edge.target_handle,
        )
        if key in seen:
            raise EdgeValidationError(
                f"edge[{idx}]: duplicate (source={edge.source_step_id}/{edge.source_handle} → "
                f"target={edge.target_step_id}/{edge.target_handle})",
                edge_index=idx,
            )
        seen.add(key)


def get_edges(workflow_id: str, store: dict) -> list[dict]:
    """Return the edges of a workflow as plain dicts.

    The `store` argument is the in-memory `_workflows` dict from `router.py`,
    passed in to keep this module pure and trivially testable.
    """
    workflow = store.get(workflow_id)
    if workflow is None:
        raise KeyError(workflow_id)
    return list(workflow.get("edges", []))


def set_edges(
    workflow_id: str,
    edges: list[WorkflowEdge],
    store: dict,
) -> list[dict]:
    """Bulk-replace edges of a workflow. Returns the persisted edges with
    server-assigned `edge_id`s.

    Atomicity: this builds the new list in memory first, so a validation
    failure leaves the existing edges intact (no partial replace).
    """
    workflow = store.get(workflow_id)
    if workflow is None:
        raise KeyError(workflow_id)

    step_ids = _step_ids(workflow)
    steps_by_id = {s["id"]: s for s in workflow["definition"].get("steps", [])}
    for idx, edge in enumerate(edges):
        _check_step_refs(edge, step_ids, idx=idx)
        _check_handles(edge, steps_by_id, idx=idx)
    _check_unique(edges)

    persisted: list[dict] = []
    for edge in edges:
        persisted.append(
            {
                "edge_id": edge.edge_id or str(uuid.uuid4()),
                "source_step_id": edge.source_step_id,
                "source_handle": edge.source_handle,
                "target_step_id": edge.target_step_id,
                "target_handle": edge.target_handle,
            }
        )

    workflow["edges"] = persisted
    return list(persisted)


def delete_edge(workflow_id: str, edge_id: str, store: dict) -> bool:
    """Remove a single edge from the workflow. Returns True if removed,
    False if not found (caller decides whether to 404)."""
    workflow = store.get(workflow_id)
    if workflow is None:
        raise KeyError(workflow_id)

    before = workflow.get("edges", [])
    after = [e for e in before if e.get("edge_id") != edge_id]
    if len(after) == len(before):
        return False
    workflow["edges"] = after
    return True
