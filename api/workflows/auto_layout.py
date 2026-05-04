"""Server-side layered layout for workflow graphs (SPEC-005 TASK-B02).

ADR-LOCAL-02 of the canvas SPEC: pure-Python layered layout (~100 LoC) over a
subprocess to dagre.js (rejected: cross-runtime cost) or networkx (rejected:
overkill for ≤20-node DAGs and adds a heavy dep). The algorithm is a
two-pass simplified Sugiyama:

  1. Layer assignment via stable BFS topological order (rank = longest
     path from any entry node). Stable iteration is critical for
     determinism — the spec promises identical coordinates for identical
     definitions (constitution §2; CA-30).
  2. Coordinate assignment: x = column_index_in_layer * X_STEP,
     y = layer * Y_STEP. No barycenter crossing-reduction in V1 — the
     20-node ceiling (FR-WBC-12 max_nodes_exceeded) keeps the visual
     mess bounded; a future revision can add it.

Determinism notes:
  • Steps and edges are sorted by ID before traversal.
  • Layer fill order follows source-step-id sort, so two definitions with
    identical structure produce identical positions even if the caller
    inserted edges in a different order.

Public API:
  layered_layout(steps, edges) -> dict[str, dict[str, int]]
      e.g. { "s1": {"x": 0, "y": 0}, "s2": {"x": 220, "y": 0}, ... }

The migration JIT (TASK-B06) consumes this to populate `position_x/y` for
v1 workflows being upgraded; the canvas frontend can also call it via
POST /auto-layout to "Reorganizar".
"""

from __future__ import annotations

from collections import defaultdict, deque
from typing import Iterable

X_STEP = 220  # px between columns (constitution §5.1; node width 220)
Y_STEP = 120  # px between layers (height 80 + padding)


def layered_layout(
    steps: Iterable[dict], edges: Iterable[dict]
) -> dict[str, dict[str, int]]:
    """Compute (x, y) for each step deterministically.

    `steps` is the JSONB step list (each dict has at least an `id`).
    `edges` is the persisted edge list (each dict has `source_step_id`,
    `target_step_id`).
    """
    step_ids: list[str] = sorted(step["id"] for step in steps)
    if not step_ids:
        return {}

    out_adj: dict[str, list[str]] = defaultdict(list)
    in_degree: dict[str, int] = {sid: 0 for sid in step_ids}
    edge_pairs = sorted(
        (e["source_step_id"], e["target_step_id"]) for e in edges
    )
    for src, tgt in edge_pairs:
        if src not in in_degree or tgt not in in_degree:
            # Edge points to a step that no longer exists; ignore for layout.
            continue
        out_adj[src].append(tgt)
        in_degree[tgt] += 1
    # Sort adjacency lists for deterministic traversal.
    for sid in out_adj:
        out_adj[sid].sort()

    # Layer (rank) assignment via Kahn-style BFS. Entry nodes have rank 0;
    # every other node sits at max(predecessor rank) + 1.
    rank: dict[str, int] = {}
    queue: deque[str] = deque(sorted(sid for sid, deg in in_degree.items() if deg == 0))
    if not queue:
        # Cyclic graph — caller should have rejected this via validator. Fall
        # back to alphabetic order to avoid raising; layout is "best effort".
        for i, sid in enumerate(step_ids):
            rank[sid] = i
    else:
        for sid in queue:
            rank[sid] = 0
        remaining_in = dict(in_degree)
        while queue:
            cur = queue.popleft()
            for nxt in out_adj.get(cur, []):
                rank[nxt] = max(rank.get(nxt, 0), rank[cur] + 1)
                remaining_in[nxt] -= 1
                if remaining_in[nxt] == 0:
                    queue.append(nxt)
        # Steps unreachable from any entry (orphans) get a layer at the
        # bottom so they remain visible to the user.
        max_rank = max(rank.values(), default=0)
        for sid in step_ids:
            rank.setdefault(sid, max_rank + 1)

    # Bucket by layer; columns are filled in step-id order.
    by_layer: dict[int, list[str]] = defaultdict(list)
    for sid in step_ids:
        by_layer[rank[sid]].append(sid)

    positions: dict[str, dict[str, int]] = {}
    for layer, members in by_layer.items():
        for col, sid in enumerate(members):
            positions[sid] = {"x": col * X_STEP, "y": layer * Y_STEP}
    return positions
