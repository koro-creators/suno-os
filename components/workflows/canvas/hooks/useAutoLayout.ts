/**
 * useAutoLayout — dagre dynamic-import wrapper (SPEC-005 TASK-C13).
 *
 * Layout strategy: left-to-right (LR) main flow, matching the n8n convention
 * where data flows from left to right and branches fan out vertically.
 *
 *   rankdir  LR  — columns = ranks; nodes in the same "depth" sit in the
 *                   same column, branches open vertically within a column.
 *   ranksep  180 — horizontal gap between columns (nodes are 220px wide).
 *   nodesep   70 — vertical gap between sibling nodes within a column.
 *
 * Isolated nodes (no edges) are placed in a tidy grid to the right of the
 * connected subgraph so they don't pile on (0, 0).
 *
 * Determinism: dagre is deterministic given fixed options and stable node
 * iteration order — we sort nodes/edges by id before feeding them in.
 */
import { useCallback } from 'react';
import dagre from 'dagre';
import type { Edge, Node } from '@xyflow/react';

const NODE_W = 220;
const NODE_H = 120; // taller after n8n-style header + preview redesign

export function useAutoLayout() {
  const applyAutoLayout = useCallback(
    (nodes: Node[], edges: Edge[]): Node[] => {
      if (nodes.length === 0) return nodes;

      const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
      const sortedEdges = [...edges].sort((a, b) =>
        (a.source + a.target).localeCompare(b.source + b.target),
      );

      // Separate connected vs isolated nodes so isolated ones get a grid.
      const connectedIds = new Set<string>();
      for (const e of sortedEdges) {
        connectedIds.add(e.source);
        connectedIds.add(e.target);
      }
      const connectedNodes = sortedNodes.filter((n) => connectedIds.has(n.id));
      const isolatedNodes  = sortedNodes.filter((n) => !connectedIds.has(n.id));

      // --- dagre pass for connected nodes ---
      const g = new dagre.graphlib.Graph({ multigraph: false, compound: false });
      g.setDefaultEdgeLabel(() => ({}));
      g.setGraph({ rankdir: 'LR', ranksep: 260, nodesep: 120 });

      for (const node of connectedNodes) {
        g.setNode(node.id, { width: NODE_W, height: NODE_H });
      }
      for (const edge of sortedEdges) {
        // Only add edge if both endpoints are in the connected set.
        if (connectedIds.has(edge.source) && connectedIds.has(edge.target)) {
          g.setEdge(edge.source, edge.target);
        }
      }

      dagre.layout(g);

      // Collect dagre positions (dagre returns centre; ReactFlow expects top-left).
      let maxX = 0;
      const positionedConnected = connectedNodes.map((node) => {
        const dn = g.node(node.id);
        if (!dn) return node;
        const x = dn.x - NODE_W / 2;
        const y = dn.y - NODE_H / 2;
        if (x + NODE_W > maxX) maxX = x + NODE_W;
        return { ...node, position: { x, y } };
      });

      // --- grid pass for isolated nodes ---
      const GRID_COLS = 3;
      const COL_GAP   = 40;
      const ROW_GAP   = 40;
      const startX     = connectedNodes.length > 0 ? maxX + 120 : 0;

      const positionedIsolated = isolatedNodes.map((node, i) => {
        const col = i % GRID_COLS;
        const row = Math.floor(i / GRID_COLS);
        return {
          ...node,
          position: {
            x: startX + col * (NODE_W + COL_GAP),
            y: row * (NODE_H + ROW_GAP),
          },
        };
      });

      // Merge back in original order.
      const positionMap = new Map<string, { x: number; y: number }>();
      for (const n of [...positionedConnected, ...positionedIsolated]) {
        positionMap.set(n.id, n.position);
      }
      return sortedNodes.map((n) => {
        const pos = positionMap.get(n.id);
        return pos ? { ...n, position: pos } : n;
      });
    },
    [],
  );

  return { applyAutoLayout };
}
