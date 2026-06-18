"""Workflow graph validation (SPEC-005 TASK-B03).

Surfaces 7 ValidationError kinds (spec.md §6.3):
  • cycle                       — DFS 3-color detects back edges
  • fan_in_without_merge        — node with in-degree > 1 that is not type='merge'
                                   ('condition' is exempt up to in-degree 2 via
                                   the named in_a/in_b handles)
  • merge_with_zero_inputs      — type='merge' node with in-degree 0
  • edge_to_nonexistent_handle  — handle vocabulary mismatch with source step type
  • unauthorized_tool           — tool referenced not in user's RBAC scope
  • max_nodes_exceeded          — definition has > 20 steps
  • no_entry_node               — every node has at least one inbound edge

Public API:
  validate(workflow, *, allowed_tools=None)
      Full validation. Returns (errors, warnings) where errors fail save and
      warnings are surfaced as soft hints in the canvas.
  hard_validate_for_put(workflow, *, allowed_tools=None)
      Subset that PUT /api/workflows/{id} blocks on (TASK-B01b).
      Per design §6.3 + revisão crítica I5: cycle, unauthorized_tool,
      max_nodes_exceeded, edge_to_nonexistent_handle, no_entry_node.

Helpers (cycle_edges, has_cycle) are exposed for the canvas frontend hook
`useGraphValidation` reuse over HTTP — same algorithm both sides keeps
behaviour predictable.
"""

from __future__ import annotations

from collections import defaultdict
from typing import Iterable

from .schemas import ValidationError, ValidationErrorKind

MAX_NODES = 20  # constitution §3 of SPEC-003 + §3 SPEC-005 (max 20 nodes)

# Per-step-type, the set of source handles the step is allowed to emit.
ALLOWED_SOURCE_HANDLES_BY_TYPE: dict[str, frozenset[str]] = {
    "tool": frozenset({"out"}),  # tool emite só 'out' — paridade com useGraphValidation.ts
    "llm": frozenset({"out", "error"}),
    "action": frozenset({"out", "error"}),
    "workflow": frozenset({"out", "error"}),
    "condition": frozenset({"then", "else"}),
    "hitl": frozenset({"approved", "rejected", "modified"}),
    "merge": frozenset({"out"}),
}

_ALLOWED_LLM_TARGET_HANDLES = frozenset({"in", "tool_0", "tool_1", "tool_2"})

# A subset of validation kinds that the PUT handler treats as blocking.
HARD_KINDS: frozenset[ValidationErrorKind] = frozenset(
    {
        "cycle",
        "unauthorized_tool",
        "max_nodes_exceeded",
        "edge_to_nonexistent_handle",
        "no_entry_node",
    }
)
# Soft kinds: surfaced as warnings on PUT (never block save) and as findings
# on POST /validate. `isolated_node` is soft because edges are saved in a
# separate request from steps — the PUT validator reads DB edges which may
# lag behind the canvas state (race with setWorkflowEdges). Real-time
# feedback comes from the frontend hook instead.
SOFT_KINDS: frozenset[ValidationErrorKind] = frozenset(
    {"fan_in_without_merge", "merge_with_zero_inputs", "isolated_node"}
)


def _build_adjacency(
    edges: Iterable[dict],
) -> tuple[dict[str, list[tuple[str, str]]], dict[str, int]]:
    """Build (out_adj: src -> [(tgt, edge_id)], in_degree: step_id -> int)."""
    out_adj: dict[str, list[tuple[str, str]]] = defaultdict(list)
    in_degree: dict[str, int] = defaultdict(int)
    for edge in edges:
        out_adj[edge["source_step_id"]].append((edge["target_step_id"], edge.get("edge_id", "")))
        in_degree[edge["target_step_id"]] += 1
    return out_adj, in_degree


def _build_in_handles(edges: Iterable[dict]) -> dict[str, list[str]]:
    """Build {target_step_id: [target_handle, ...]} for per-step handle checks."""
    in_handles: dict[str, list[str]] = defaultdict(list)
    for edge in edges:
        in_handles[edge["target_step_id"]].append(edge["target_handle"])
    return in_handles


def _is_dual_condition_input(handles: list[str]) -> bool:
    """True if `handles` is exactly one `in_a` (CAMPO) + one `in_b` (VALOR).

    Legacy `in` edges (single-input migration default) count as `in_a`.
    """
    normalized = sorted("in_a" if h == "in" else h for h in handles)
    return normalized == ["in_a", "in_b"]


def has_cycle(edges: Iterable[dict]) -> bool:
    """Return True if the edge set contains any cycle (DFS 3-color)."""
    out_adj, _ = _build_adjacency(edges)
    state: dict[str, int] = {}  # 0=white, 1=gray, 2=black
    nodes = set(out_adj.keys()) | {tgt for _, tgt_list in out_adj.items() for tgt, _ in tgt_list}
    for node in nodes:
        if state.get(node, 0) != 0:
            continue
        stack = [(node, iter(out_adj.get(node, [])))]
        state[node] = 1
        while stack:
            cur, it = stack[-1]
            advanced = False
            for tgt, _ in it:
                color = state.get(tgt, 0)
                if color == 1:
                    return True
                if color == 0:
                    state[tgt] = 1
                    stack.append((tgt, iter(out_adj.get(tgt, []))))
                    advanced = True
                    break
            if not advanced:
                state[cur] = 2
                stack.pop()
    return False


def cycle_edges(edges: list[dict]) -> list[str]:
    """Return edge_ids that participate in any cycle.

    Best-effort: implementation is O(V+E) per node and bounded by MAX_NODES
    so even brute force is fine. Returns sorted unique IDs for determinism.
    """
    out_adj, _ = _build_adjacency(edges)
    cyclic: set[str] = set()
    for start in sorted({e["source_step_id"] for e in edges}):
        # Tarjan-lite: DFS from `start` looking for path back to `start`.
        stack: list[tuple[str, list[tuple[str, str]]]] = [(start, list(out_adj.get(start, [])))]
        path_edges: list[str] = []
        on_path: set[str] = {start}
        while stack:
            cur, neighbours = stack[-1]
            if not neighbours:
                stack.pop()
                if path_edges:
                    path_edges.pop()
                on_path.discard(cur)
                continue
            tgt, eid = neighbours.pop()
            if tgt == start:
                cyclic.add(eid)
                cyclic.update(path_edges)
                continue
            if tgt in on_path:
                cyclic.add(eid)
                continue
            stack.append((tgt, list(out_adj.get(tgt, []))))
            path_edges.append(eid)
            on_path.add(tgt)
    return sorted(cyclic)


def validate(
    workflow: dict,
    *,
    allowed_tools: set[str] | None = None,
) -> tuple[list[ValidationError], list[ValidationError]]:
    """Run all 7 checks. Return (errors, warnings).

    `errors` here means the union; the PUT handler then partitions by
    `HARD_KINDS` to decide what to block on. Soft kinds become `warnings`
    in the response payload of POST /validate.
    """
    steps = workflow["definition"].get("steps", [])
    edges = workflow.get("edges", [])
    findings: list[ValidationError] = []

    # 1. max_nodes_exceeded — early exit; canvas blocks creation past 20.
    if len(steps) > MAX_NODES:
        findings.append(
            ValidationError(
                kind="max_nodes_exceeded",
                detail=f"workflow has {len(steps)} steps (limit {MAX_NODES})",
            )
        )

    step_by_id = {s["id"]: s for s in steps}
    step_ids = set(step_by_id.keys())

    # Edges whose source or target references a step not in the current
    # definition are stale artifacts from the race between the step-save
    # (PUT /workflows/{id}) and the edge-save (POST /edges) — both fire in
    # parallel and a prior PUT failure could have left the definition behind.
    # Silently filter them out so they don't pollute real graph-logic checks;
    # they will be cleaned up on the next successful auto-save.
    valid_edges = [
        e
        for e in edges
        if e["source_step_id"] in step_ids and e["target_step_id"] in step_ids
    ]

    # 2. cycle (whole-graph, only real edges)
    if has_cycle(valid_edges):
        findings.append(
            ValidationError(
                kind="cycle",
                detail="cycle detected; workflows must be DAGs",
                edges=cycle_edges(valid_edges),
            )
        )

    # Build adjacency for subsequent per-step checks (only valid edges).
    out_adj, in_degree = _build_adjacency(valid_edges)
    in_handles = _build_in_handles(valid_edges)

    # 3. isolated_node — step with no inbound AND no outbound edges
    for step in steps:
        has_in = in_degree.get(step["id"], 0) > 0
        has_out = step["id"] in out_adj
        if not has_in and not has_out:
            findings.append(
                ValidationError(
                    kind="isolated_node",
                    detail=f"step '{step['id']}' ('{step.get('name', step['id'])}') "
                    "has no connections — connect or remove it",
                    step_id=step["id"],
                )
            )

    # 4. edge_to_nonexistent_handle — source_handle must be allowed for type
    for edge in valid_edges:
        src_step = step_by_id.get(edge["source_step_id"])
        if src_step is None:
            continue  # already filtered above; defensive guard only
        allowed = ALLOWED_SOURCE_HANDLES_BY_TYPE.get(src_step["type"], frozenset())
        if edge["source_handle"] not in allowed:
            findings.append(
                ValidationError(
                    kind="edge_to_nonexistent_handle",
                    detail=(
                        f"step '{src_step['id']}' (type={src_step['type']}) cannot emit "
                        f"handle '{edge['source_handle']}' — allowed: {sorted(allowed)}"
                    ),
                    step_id=src_step["id"],
                    edges=[edge.get("edge_id", "")],
                )
            )

    # 5. fan_in_without_merge — non-merge node with in-degree > 1
    # 6. merge_with_zero_inputs — merge node with in-degree 0
    # 7. no_entry_node — must have at least one node with in-degree 0
    has_entry = False
    for step in steps:
        deg = in_degree.get(step["id"], 0)
        if deg == 0:
            has_entry = True
        if step["type"] == "merge":
            if deg == 0:
                findings.append(
                    ValidationError(
                        kind="merge_with_zero_inputs",
                        detail=f"merge node '{step['id']}' has no inbound edges",
                        step_id=step["id"],
                    )
                )
        elif step["type"] == "condition":
            # `condition` aceita 1 entrada (CAMPO ou VALOR, qualquer handle)
            # ou 2 entradas via handles distintos in_a (CAMPO) + in_b (VALOR).
            step_in_handles = in_handles.get(step["id"], [])
            if deg > 2 or (deg == 2 and not _is_dual_condition_input(step_in_handles)):
                findings.append(
                    ValidationError(
                        kind="fan_in_without_merge",
                        detail=(
                            f"step '{step['id']}' (type=condition) has {deg} inbound edges; "
                            "condition accepts at most 2 (in_a + in_b)"
                        ),
                        step_id=step["id"],
                    )
                )
        elif step["type"] == "llm":
            # llm aceita: 1 edge de controle (in) + até 3 edges de tool (tool_0/1/2).
            # Todos os handles devem ser distintos e pertencer ao conjunto permitido.
            step_in_handles = in_handles.get(step["id"], [])
            unique_handles = set(step_in_handles)
            is_valid = (
                len(step_in_handles) <= 4
                and len(step_in_handles) == len(unique_handles)
                and unique_handles.issubset(_ALLOWED_LLM_TARGET_HANDLES)
            )
            if not is_valid:
                findings.append(
                    ValidationError(
                        kind="fan_in_without_merge",
                        detail=(
                            f"step '{step['id']}' (type=llm) has invalid inbound edges "
                            f"(handles={step_in_handles}); "
                            "allowed: at most 1×'in' + 3×'tool_0/1/2', all distinct"
                        ),
                        step_id=step["id"],
                    )
                )
        else:
            if deg > 1:
                findings.append(
                    ValidationError(
                        kind="fan_in_without_merge",
                        detail=(
                            f"step '{step['id']}' (type={step['type']}) has {deg} inbound edges; "
                            "fan-in requires an explicit merge node"
                        ),
                        step_id=step["id"],
                    )
                )
    if steps and not has_entry:
        findings.append(
            ValidationError(
                kind="no_entry_node",
                detail="every step has at least one inbound edge — no entry point exists",
            )
        )

    # 8. unauthorized_tool — tool_name must be in allowed_tools (if provided)
    if allowed_tools is not None:
        for step in steps:
            if step["type"] in {"tool", "action"}:
                tool_name = step.get("tool_name")
                if tool_name and tool_name not in allowed_tools:
                    findings.append(
                        ValidationError(
                            kind="unauthorized_tool",
                            detail=(
                                f"step '{step['id']}' uses tool '{tool_name}' which the "
                                "user is not authorized to invoke"
                            ),
                            step_id=step["id"],
                        )
                    )

    errors = [f for f in findings if f.kind in HARD_KINDS]
    warnings = [f for f in findings if f.kind in SOFT_KINDS]
    return errors, warnings


def hard_validate_for_put(
    workflow: dict,
    *,
    allowed_tools: set[str] | None = None,
) -> list[ValidationError]:
    """Subset that PUT /api/workflows/{id} blocks save on (TASK-B01b).

    Returns the list of HARD findings; an empty list means the PUT may
    proceed. The canvas auto-save handler displays these inline as toasts.
    """
    errors, _warnings = validate(workflow, allowed_tools=allowed_tools)
    return errors
