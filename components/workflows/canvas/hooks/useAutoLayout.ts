/**
 * useAutoLayout — dagre dynamic-import wrapper (SPEC-005 TASK-C13).
 *
 * Lives inside `components/workflows/canvas/` so the ESLint rule allows the
 * static import of `dagre` and `@xyflow/react`. The hook itself is pure —
 * it returns a function the toolbar can call ("Reorganizar" button).
 *
 * Determinism: dagre's default behaviour is deterministic given fixed
 * `rankdir`, `ranksep`, `nodesep`, and a stable node iteration order. We
 * sort nodes/edges by id before feeding them in.
 */
import { useCallback } from 'react';
import dagre from 'dagre';
import type { Edge, Node } from '@xyflow/react';

const NODE_W = 220;
const NODE_H = 80;

export function useAutoLayout() {
  /**
   * Runs dagre over `nodes`/`edges` and returns a copy of `nodes` with
   * fresh `position` fields. Pure — caller decides whether to setState.
   */
  const applyAutoLayout = useCallback(
    (nodes: Node[], edges: Edge[]): Node[] => {
      const g = new dagre.graphlib.Graph({ multigraph: false, compound: false });
      g.setDefaultEdgeLabel(() => ({}));
      g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 60 });

      const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
      const sortedEdges = [...edges].sort((a, b) =>
        (a.source + a.target).localeCompare(b.source + b.target),
      );

      for (const node of sortedNodes) {
        g.setNode(node.id, { width: NODE_W, height: NODE_H });
      }
      for (const edge of sortedEdges) {
        g.setEdge(edge.source, edge.target);
      }

      dagre.layout(g);

      return sortedNodes.map((node) => {
        const dagreNode = g.node(node.id);
        if (!dagreNode) return node;
        return {
          ...node,
          // dagre returns the centre — ReactFlow expects the top-left.
          position: {
            x: dagreNode.x - NODE_W / 2,
            y: dagreNode.y - NODE_H / 2,
          },
        };
      });
    },
    [],
  );

  return { applyAutoLayout };
}
