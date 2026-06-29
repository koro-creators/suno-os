/**
 * useGraphValidation — local DFS-based graph validation (SPEC-005 TASK-C12).
 *
 * Mirrors the cycle / fan-in / merge checks the backend (`api/workflows/validator.py`)
 * runs on PUT, but lives client-side so the canvas can reject illegal user
 * actions instantly (FR-WBC-03 + CA-07/08). Wrong moves never round-trip.
 *
 * Two distinct checks deliberately:
 *   - `wouldCreateCycle(srcId, tgtId)` returns true if adding an edge from
 *     src to tgt would close a cycle. Used by `isValidConnection` in
 *     ReactFlow's `onConnect` handler so the user sees the rejection
 *     while still dragging.
 *   - `getOrphanNodes()` / `getFanInWithoutMerge()` for the "Validar" button
 *     in CanvasToolbar — same DFS, runs over the current state without
 *     waiting for the network.
 *
 * The hook is intentionally pure-functional given its inputs; it uses
 * `useMemo` to keep adjacency caches stable across re-renders. State of
 * the canvas (`nodes`, `edges`) flows in from ReactFlow's `useNodesState`/
 * `useEdgesState` in the parent component.
 */
import { useMemo, useCallback } from 'react';
import type { Edge, Node } from '@xyflow/react';

interface NodeData {
  /** Step type — drives ALLOWED_SOURCE_HANDLES_BY_TYPE parity with backend. */
  type: 'tool' | 'llm' | 'condition' | 'action' | 'hitl' | 'workflow' | 'merge' | 'trigger' | 'arquivos';
  [key: string]: unknown;
}

const ALLOWED_SOURCE_HANDLES_BY_TYPE: Record<NodeData['type'], string[]> = {
  tool: ['out'], // tool emite só 'out' (para agente) — paridade com validator.py
  llm: ['out', 'error'],
  action: ['out', 'error'],
  workflow: ['out', 'error'],
  condition: ['then', 'else'],
  hitl: ['approved', 'rejected', 'modified'],
  merge: ['out'],
  trigger: ['out'], // trigger é entry node — sem target handles, emite 'out'
  arquivos: ['out'],
};

const LLM_CONTROL_HANDLE = 'in';
const LLM_TOOL_HANDLE = 'tool_0';

export function useGraphValidation(
  nodes: Node<NodeData>[],
  edges: Edge[],
) {
  // Reachability cache — { fromNodeId: Set<reachableNodeId> }.
  // Recomputed when edges change but stable across non-edge re-renders.
  const reachable = useMemo(() => {
    const adj = new Map<string, string[]>();
    for (const e of edges) {
      if (!adj.has(e.source)) adj.set(e.source, []);
      adj.get(e.source)!.push(e.target);
    }
    const cache = new Map<string, Set<string>>();
    function dfs(start: string): Set<string> {
      if (cache.has(start)) return cache.get(start)!;
      const seen = new Set<string>();
      const stack = [start];
      while (stack.length) {
        const cur = stack.pop()!;
        for (const tgt of adj.get(cur) || []) {
          if (!seen.has(tgt)) {
            seen.add(tgt);
            stack.push(tgt);
          }
        }
      }
      cache.set(start, seen);
      return seen;
    }
    return { dfs };
  }, [edges]);

  /**
   * `isValidConnection`-shaped predicate. Pass directly to ReactFlow.
   * Returns `false` to block the visual drop animation.
   */
  const wouldCreateCycle = useCallback(
    (sourceId: string, targetId: string): boolean => {
      if (sourceId === targetId) return true; // self-loop = trivial cycle
      // If target can already reach source, adding source→target closes a cycle.
      return reachable.dfs(targetId).has(sourceId);
    },
    [reachable],
  );

  /** True if the source step type allows the requested handle. */
  const isHandleAllowed = useCallback(
    (sourceType: NodeData['type'] | undefined, sourceHandle: string | null | undefined): boolean => {
      if (!sourceType) return false;
      const allowed = ALLOWED_SOURCE_HANDLES_BY_TYPE[sourceType] ?? [];
      // A null/undefined handle on the source side falls back to the type's
      // default handle. The canvas defaults to `out` for non-condition/HITL.
      const requested = sourceHandle ?? (sourceType === 'condition' ? 'then' : sourceType === 'hitl' ? 'approved' : 'out');
      return allowed.includes(requested);
    },
    [],
  );

  /** Collected canvas-local findings ready to render in the validation panel. */
  const findings = useMemo(() => {
    const inDegree = new Map<string, number>();
    const outDegree = new Map<string, number>();
    const inHandles = new Map<string, string[]>();
    for (const n of nodes) { inDegree.set(n.id, 0); outDegree.set(n.id, 0); }
    for (const e of edges) {
      inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
      outDegree.set(e.source, (outDegree.get(e.source) ?? 0) + 1);
      const handles = inHandles.get(e.target) ?? [];
      handles.push(e.targetHandle ?? 'in');
      inHandles.set(e.target, handles);
    }

    const orphans: string[] = []; // in-degree 0 — fine if there's at least one entry node
    const fanInWithoutMerge: string[] = [];
    const mergeWithZeroInputs: string[] = [];
    const isolatedNodes: string[] = [];

    for (const node of nodes) {
      const deg = inDegree.get(node.id) ?? 0;
      const outDeg = outDegree.get(node.id) ?? 0;
      const type = (node.data?.type ?? 'tool') as NodeData['type'];
      if (deg === 0 && outDeg === 0) isolatedNodes.push(node.id);
      if (deg === 0) orphans.push(node.id);
      if (type === 'merge') {
        if (deg === 0) mergeWithZeroInputs.push(node.id);
      } else if (type === 'condition') {
        // `condition` aceita 1 entrada (qualquer handle) ou 2 entradas via
        // handles distintos in_a (CAMPO) + in_b (VALOR). `in` legado conta
        // como in_a (paridade com validator.py).
        const handles = (inHandles.get(node.id) ?? [])
          .map((h) => (h === 'in' ? 'in_a' : h))
          .sort();
        const isDualInput = deg === 2 && handles[0] === 'in_a' && handles[1] === 'in_b';
        if (deg > 2 || (deg === 2 && !isDualInput)) fanInWithoutMerge.push(node.id);
      } else if (type === 'llm') {
        // llm aceita: no máximo 1 edge de controle ('in') + N edges de
        // ferramenta ('tool_0'). Múltiplos tools no mesmo handle são permitidos.
        const handles = inHandles.get(node.id) ?? [];
        const inCount = handles.filter((h) => h === LLM_CONTROL_HANDLE).length;
        const hasBadHandle = handles.some((h) => h !== LLM_CONTROL_HANDLE && h !== LLM_TOOL_HANDLE);
        if (inCount > 1 || hasBadHandle) fanInWithoutMerge.push(node.id);
      } else {
        if (deg > 1) fanInWithoutMerge.push(node.id);
      }
    }

    const hasEntry = orphans.length > 0;
    return {
      hasEntry,
      orphans,
      fanInWithoutMerge,
      mergeWithZeroInputs,
      isolatedNodes,
    };
  }, [nodes, edges]);

  return {
    wouldCreateCycle,
    isHandleAllowed,
    findings,
  };
}
