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
  2. tuple uniqueness `(workflow, src, src_handle, tgt, tgt_handle)`
  3. handle vocabulary when the target step IS known; skips when step is absent
     (race-condition tolerance: step PUT and edge POST can arrive out of order
      when the canvas saves immediately on `onConnect`; /validate enforces
      graph correctness at run-time)

Note: step-ref existence is NOT enforced here. The compiler and validator
handle dangling edges gracefully, and enforcing it at the edge layer caused
400 errors under normal canvas usage (step save and edge save racing).

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
# Per-type overrides for target handles.
# `condition` aceita in_a (CAMPO) + in_b (VALOR); `in` como legado v1→v2.
# `llm` aceita `in` (controle de fluxo) + tool_0/1/2 (saídas de tool nodes).
# ver .claude/rules/canvas-conventions.md.
ALLOWED_TARGET_HANDLES_BY_TYPE: dict[str, frozenset[str]] = {
    "condition": frozenset({"in", "in_a", "in_b"}),
    "llm": frozenset({"in", "tool_0", "tool_1", "tool_2"}),
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



def _check_handles(edge: WorkflowEdge, steps_by_id: dict[str, dict], *, idx: int) -> None:
    if edge.source_handle not in ALLOWED_SOURCE_HANDLES:
        raise EdgeValidationError(
            f"edge[{idx}]: source_handle '{edge.source_handle}' "
            f"not in {sorted(ALLOWED_SOURCE_HANDLES)}",
            edge_index=idx,
        )
    target_step = steps_by_id.get(edge.target_step_id)
    if target_step is None:
        # Step not found — may be a race condition where the step PUT and
        # edge POST arrive in the wrong order. Skip target-handle validation
        # here; the compiler handles dangling edges gracefully (skips them),
        # and the /validate endpoint enforces graph correctness at run time.
        return
    allowed_target = ALLOWED_TARGET_HANDLES_BY_TYPE.get(target_step["type"], ALLOWED_TARGET_HANDLES)
    if edge.target_handle not in allowed_target:
        raise EdgeValidationError(
            f"edge[{idx}]: target_handle '{edge.target_handle}' not in {sorted(allowed_target)}",
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

    steps_by_id = {s["id"]: s for s in workflow["definition"].get("steps", [])}
    for idx, edge in enumerate(edges):
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
