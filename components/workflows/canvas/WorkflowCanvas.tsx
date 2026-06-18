/**
 * WorkflowCanvas — root of the canvas module (SPEC-005 TASK-C01 + C14 + C19).
 *
 * This file owns the @xyflow/react instance and is the single point of
 * static import for `@xyflow/react` (the ESLint rule + bash check enforce
 * that). The owning page (`app/workflows/[workflowId]/page.tsx`) is the
 * only other module that touches it — and only via `next/dynamic`, which
 * keeps the heavy chunk out of unrelated routes (constitution §5.1 +
 * NFR-WBC-02).
 *
 * Responsibilities:
 *
 *   • Render the canvas with custom node types + custom edge type.
 *   • Synchronise canvas state (nodes/edges) ↔ workflow definition through
 *     a debounced auto-save (useWorkflowAutoSave).
 *   • Block illegal edges via useGraphValidation (cycle detection +
 *     handle-vocabulary check).
 *   • Drag-and-drop from NodePalette: onDrop creates a node at the screen
 *     coordinate.
 *   • Mobile read-only mode (FR-WBC-19 + TODO-DESIGN-D): when viewport
 *     width < 768px, disable all interactions and show a banner.
 *
 * This is a Client Component because @xyflow/react needs DOM measurement
 * and gesture handling that don't survive SSR. SSR is opted out at the
 * page level via `dynamic(() => ..., { ssr: false })`.
 */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  useViewport,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
  type IsValidConnection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  apiAvailable,
  setWorkflowEdges,
  validateWorkflow,
  autoLayoutWorkflow,
  runWorkflow,
  getWorkflowRun,
} from '@/lib/api';
import type { WorkflowEdge, WorkflowStepV2 } from '@/lib/workflow-types';
import { useWorkflowAutoSave } from '@/hooks/useWorkflowAutoSave';
import { useGraphValidation } from './hooks/useGraphValidation';
import { useAutoLayout } from './hooks/useAutoLayout';
import { useWorkflows } from '@/contexts/WorkflowsContext';

import type { ExecutionStatus } from './nodes/NodeShell';
import ToolNode from './nodes/ToolNode';
import LLMNode from './nodes/LLMNode';
import ConditionNode from './nodes/ConditionNode';
import ActionNode from './nodes/ActionNode';
import HITLNode from './nodes/HITLNode';
import SubWorkflowNode from './nodes/SubWorkflowNode';
import MergeNode from './nodes/MergeNode';
import CustomEdge from './edges/CustomEdge';
import NodePalette from './panels/NodePalette';
import NodeConfigDrawer from './panels/NodeConfigDrawer';
import CanvasToolbar from './panels/CanvasToolbar';
import CanvasStatusBanner from './panels/CanvasStatusBanner';
import CanvasContextMenu, { type ContextMenuPayload } from './panels/CanvasContextMenu';

const NODE_TYPES = {
  tool: ToolNode,
  llm: LLMNode,
  condition: ConditionNode,
  action: ActionNode,
  hitl: HITLNode,
  workflow: SubWorkflowNode,
  merge: MergeNode,
};

const EDGE_TYPES = {
  custom: CustomEdge,
};

interface WorkflowCanvasProps {
  workflowId: string;
  initialSteps: WorkflowStepV2[];
  initialEdges: WorkflowEdge[];
  /** Used by NodeConfigDrawer to filter available sub-workflow targets. */
  currentWorkflowId?: string;
  /** Persists step changes via PUT /api/workflows/{id}. */
  onPersistSteps: (steps: WorkflowStepV2[]) => Promise<void>;
  /**
   * If the workflow record carries `updated_by` and `updated_at` near now,
   * the banner shows the concurrent-edit warning (FR-WBC-13).
   */
  concurrentEdit?: { user: string; minutesAgo: number } | null;
}

function stepsToNodes(steps: WorkflowStepV2[], edges: WorkflowEdge[]): Node[] {
  // Stamp _hasErrorEdge on data so node renderers can show the optional
  // error handle only when something is actually plugged into it.
  const hasErrorEdge = new Set<string>();
  for (const e of edges) if (e.source_handle === 'error') hasErrorEdge.add(e.source_step_id);
  return steps.map((s) => ({
    id: s.id,
    type: s.type,
    position: { x: s.position_x ?? 0, y: s.position_y ?? 0 },
    data: { ...s, _hasErrorEdge: hasErrorEdge.has(s.id) },
  }));
}

function workflowEdgesToFlowEdges(edges: WorkflowEdge[], steps: WorkflowStepV2[]): Edge[] {
  // Edges persisted before SPEC-005's in_a/in_b handles use the legacy `in`
  // target handle. ConditionNode no longer renders an `in` handle (it has
  // in_a/in_b instead), so remap `in` -> `in_a` for condition targets to
  // keep those edges attached to a real handle on load.
  const conditionIds = new Set(steps.filter((s) => s.type === 'condition').map((s) => s.id));
  return edges.map((e, idx) => ({
    id: e.edge_id ?? `e-${idx}-${e.source_step_id}-${e.target_step_id}`,
    source: e.source_step_id,
    target: e.target_step_id,
    sourceHandle: e.source_handle,
    targetHandle: conditionIds.has(e.target_step_id) && e.target_handle === 'in' ? 'in_a' : e.target_handle,
    type: 'custom',
  }));
}

function flowEdgesToWorkflowEdges(flowEdges: Edge[]): WorkflowEdge[] {
  return flowEdges.map((e) => ({
    edge_id: e.id.startsWith('e-') ? undefined : e.id,
    source_step_id: e.source,
    source_handle: (e.sourceHandle ?? 'out') as WorkflowEdge['source_handle'],
    target_step_id: e.target,
    target_handle: (e.targetHandle ?? 'in') as WorkflowEdge['target_handle'],
  }));
}

function CanvasInner(props: WorkflowCanvasProps) {
  const { workflowId, initialSteps, initialEdges, currentWorkflowId, onPersistSteps, concurrentEdit } = props;
  const flow = useReactFlow();
  const { zoom } = useViewport();

  const [nodes, setNodes] = useState<Node[]>(() => stepsToNodes(initialSteps, initialEdges));
  const [edges, setEdges] = useState<Edge[]>(() => workflowEdgesToFlowEdges(initialEdges, initialSteps));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Per-node execution status shown on the canvas after "Executar" (FR: visual
  // feedback of the run). Reset to null whenever the graph mutates.
  const [executing, setExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<Record<string, ExecutionStatus> | null>(null);

  // Mouse position (in flow coordinates) for the small readout beside the minimap.
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  // Context menu: shown when the user right-clicks on empty canvas space.
  const [contextMenu, setContextMenu] = useState<{
    screenPos: { x: number; y: number };
    flowPos: { x: number; y: number };
  } | null>(null);
  const onPaneMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = flow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setMousePosition({ x: Math.round(pos.x), y: Math.round(pos.y) });
    },
    [flow],
  );

  // Mobile read-only detection (TASK-C19).
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const { wouldCreateCycle, isHandleAllowed, findings } = useGraphValidation(
    nodes as Node<{ type: WorkflowStepV2['type'] }>[],
    edges,
  );
  const { applyAutoLayout } = useAutoLayout();

  // Auto-save: debounce edges (saved via /edges endpoint) and steps (PUT).
  const persistSteps = useCallback(
    async (latestNodes: Node[]) => {
      const stepsToSave: WorkflowStepV2[] = latestNodes.map((n) => {
        const data = (n.data ?? {}) as Partial<WorkflowStepV2> & { type?: string };
        return {
          ...(data as WorkflowStepV2),
          id: n.id,
          type: (data.type ?? 'tool') as WorkflowStepV2['type'],
          position_x: Math.round(n.position.x),
          position_y: Math.round(n.position.y),
          // Required-by-WorkflowStep but optional in WorkflowStepV2.
          name: (data.name as string) ?? n.id,
          config: (data.config as Record<string, unknown>) ?? {},
        };
      });
      // Mock mode: persist steps to localStorage so dynamically added nodes
      // (e.g. Tool nodes) survive page reload — analogous to edge persistence.
      if (!apiAvailable()) {
        try {
          localStorage.setItem(
            `sunos-steps-v2-${workflowId}`,
            JSON.stringify(stepsToSave),
          );
        } catch { /* localStorage unavailable */ }
      }
      await onPersistSteps(stepsToSave);
    },
    [onPersistSteps, workflowId],
  );

  const persistEdges = useCallback(
    async (latestEdges: Edge[]) => {
      if (!apiAvailable()) {
        // Mock mode: save to localStorage so edges survive page refresh.
        try {
          localStorage.setItem(
            `sunos-edges-v2-${workflowId}`,
            JSON.stringify(flowEdgesToWorkflowEdges(latestEdges)),
          );
        } catch {
          // localStorage unavailable (private browsing with storage blocked)
        }
        return;
      }
      // Fire steps and edges in parallel — the backend no longer hard-rejects
      // edges for unknown step refs (_check_step_refs removed), so ordering
      // no longer matters. Parallel saves also mean both requests are in-flight
      // at the same time, reducing the window where a page reload (F5) can
      // cancel one but not the other.
      try {
        await Promise.all([
          persistSteps(nodesRef.current),
          setWorkflowEdges(workflowId, flowEdgesToWorkflowEdges(latestEdges)),
        ]);
      } catch (err) {
        if (err instanceof TypeError) return;
        throw err;
      }
    },
    [workflowId, persistSteps],
  );

  const stepsAutoSave = useWorkflowAutoSave<Node[]>({
    saveFn: persistSteps,
  });
  const edgesAutoSave = useWorkflowAutoSave<Edge[]>({
    saveFn: persistEdges,
  });

  // Validation status — validationOk is lifted to WorkflowsContext so the
  // history page can read the same value and gate its "Executar Agora" button.
  const { validationOk: validationOkMap, setValidationOk: setValidationOkCtx } = useWorkflows();
  const validationOk = validationOkMap[workflowId] ?? false;
  const setValidationOk = (ok: boolean) => setValidationOkCtx(workflowId, ok);

  const [validating, setValidating] = useState(false);
  const [hardErrorCount, setHardErrorCount] = useState(0);
  const [hardErrorSample, setHardErrorSample] = useState<string | undefined>();

  // Undo/redo (FR-WBC toolbar "Voltar"/"Avançar"): snapshot nodes+edges before
  // a user action (drag, connect, delete, drop, auto-layout, config edit) so
  // it can be restored. Refs keep the latest state available to pushHistory
  // without retriggering the callbacks that call it on every render.
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  const MAX_HISTORY = 50;
  const historyRef = useRef<{ past: { nodes: Node[]; edges: Edge[] }[]; future: { nodes: Node[]; edges: Edge[] }[] }>({
    past: [],
    future: [],
  });
  const [, setHistoryVersion] = useState(0);

  const pushHistory = useCallback(() => {
    historyRef.current = {
      past: [...historyRef.current.past, { nodes: nodesRef.current, edges: edgesRef.current }].slice(-MAX_HISTORY),
      future: [],
    };
    setHistoryVersion((v) => v + 1);
  }, []);

  const onUndo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (past.length === 0) return;
    const snapshot = past[past.length - 1];
    historyRef.current = {
      past: past.slice(0, -1),
      future: [{ nodes: nodesRef.current, edges: edgesRef.current }, ...future],
    };
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    stepsAutoSave.markDirty(snapshot.nodes);
    edgesAutoSave.markDirty(snapshot.edges);
    setValidationOk(false);
    setExecutionStatus(null);
    setHistoryVersion((v) => v + 1);
  }, [stepsAutoSave, edgesAutoSave]);

  const onRedo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (future.length === 0) return;
    const snapshot = future[0];
    historyRef.current = {
      past: [...past, { nodes: nodesRef.current, edges: edgesRef.current }],
      future: future.slice(1),
    };
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    stepsAutoSave.markDirty(snapshot.nodes);
    edgesAutoSave.markDirty(snapshot.edges);
    setValidationOk(false);
    setExecutionStatus(null);
    setHistoryVersion((v) => v + 1);
  }, [stepsAutoSave, edgesAutoSave]);

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  // Delete the currently selected node (and any edges touching it). Used by
  // the toolbar "Apagar" button and the Delete/Backspace keyboard shortcut.
  const onDeleteSelected = useCallback(() => {
    if (!selectedNodeId || isMobile) return;
    pushHistory();
    setNodes((cur) => {
      const next = cur.filter((n) => n.id !== selectedNodeId);
      stepsAutoSave.markDirty(next);
      return next;
    });
    setEdges((cur) => {
      const next = cur.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId);
      edgesAutoSave.markDirty(next);
      return next;
    });
    setSelectedNodeId(null);
    setValidationOk(false);
    setExecutionStatus(null);
  }, [selectedNodeId, isMobile, stepsAutoSave, edgesAutoSave, pushHistory]);

  // Delete/Backspace deletes the selected node, unless the user is typing in
  // a form field (e.g. the NodeConfigDrawer's inputs/textareas).
  useEffect(() => {
    if (isMobile) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      if (!selectedNodeId) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;
      e.preventDefault();
      onDeleteSelected();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isMobile, selectedNodeId, onDeleteSelected]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (isMobile) return;
      if (changes.some((c) => c.type === 'remove')) pushHistory();
      setNodes((cur) => {
        const next = applyNodeChanges(changes, cur);
        stepsAutoSave.markDirty(next);
        // Reset validation status whenever the graph mutates so the user
        // re-runs Validate before Executar lights up.
        setValidationOk(false);
        setExecutionStatus(null);
        return next;
      });
    },
    [isMobile, stepsAutoSave, pushHistory],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (isMobile) return;
      if (changes.some((c) => c.type === 'remove')) pushHistory();
      setEdges((cur) => {
        const next = applyEdgeChanges(changes, cur);
        edgesAutoSave.markDirty(next);
        setValidationOk(false);
        setExecutionStatus(null);
        return next;
      });
    },
    [isMobile, edgesAutoSave, pushHistory],
  );

  const onNodeDragStart = useCallback(() => {
    if (isMobile) return;
    pushHistory();
  }, [isMobile, pushHistory]);

  // Save the final position once the drag ends.  We can't rely solely on
  // onNodesChange because calling markDirty inside a setNodes updater is a
  // React 18 side-effect anti-pattern (may fire twice in Strict Mode and
  // misses the definitive drag-end position). nodesRef is always up-to-date
  // by the time this fires (React commits state before calling drag-stop).
  const onNodeDragStop = useCallback(() => {
    if (isMobile) return;
    stepsAutoSave.markDirty(nodesRef.current);
  }, [isMobile, stepsAutoSave]);

  const isValidConnection: IsValidConnection = useCallback(
    (connection) => {
      // ReactFlow passes a Connection or an Edge; both have source/target.
      const src = (connection as Connection).source;
      const tgt = (connection as Connection).target;
      const handle = (connection as Connection).sourceHandle;
      if (!src || !tgt) return false;
      const sourceNode = nodes.find((n) => n.id === src);
      const sourceType = (sourceNode?.data as { type?: WorkflowStepV2['type'] })?.type;
      if (!isHandleAllowed(sourceType, handle)) return false;
      if (wouldCreateCycle(src, tgt)) return false;
      return true;
    },
    [nodes, isHandleAllowed, wouldCreateCycle],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (isMobile) return;
      pushHistory();
      // Compute next outside the updater so markDirty + forceSave can run
      // synchronously with the correct payload — avoids the 500ms debounce
      // window where the user could navigate away before the save fires.
      const next = addEdge({ ...connection, type: 'custom' }, edgesRef.current);
      setEdges(next);
      setValidationOk(false);
      setExecutionStatus(null);
      edgesAutoSave.markDirty(next);
      void edgesAutoSave.forceSave();
    },
    [isMobile, edgesAutoSave, pushHistory],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (isMobile) return;
      const raw = e.dataTransfer.getData('application/sunos-canvas');
      if (!raw) return;
      let payload: {
        step_type: WorkflowStepV2['type'];
        tool_name?: string;
        agent_id?: string;
        condition_operator?: string;
        action_type?: string;
        workflow_id?: string;
        merge_policy?: 'all' | 'any';
        name?: string;
        default_config?: Record<string, unknown>;
      };
      try {
        payload = JSON.parse(raw);
      } catch {
        return;
      }
      const position = flow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const id = `${payload.step_type}-${Date.now()}`;
      const newNode: Node = {
        id,
        type: payload.step_type,
        position,
        data: {
          type: payload.step_type,
          name: payload.name ?? payload.tool_name ?? payload.step_type,
          tool_name: payload.tool_name,
          agent_id: payload.agent_id,
          condition_operator: payload.condition_operator ?? (payload.step_type === 'condition' ? 'if_else' : undefined),
          action_type: payload.action_type,
          workflow_id: payload.workflow_id,
          config: payload.default_config ?? {},
          merge_policy: payload.step_type === 'merge' ? (payload.merge_policy ?? 'all') : undefined,
        },
      };
      setContextMenu(null);
      pushHistory();
      setNodes((cur) => {
        const next = [...cur, newNode];
        stepsAutoSave.markDirty(next);
        return next;
      });
      setValidationOk(false);
      setExecutionStatus(null);
    },
    [isMobile, flow, stepsAutoSave, pushHistory],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const onPaneContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (isMobile) return;
      const flowPos = flow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setContextMenu({ screenPos: { x: e.clientX, y: e.clientY }, flowPos });
    },
    [isMobile, flow],
  );

  const addNodeFromContextMenu = useCallback(
    (payload: ContextMenuPayload) => {
      if (!contextMenu) return;
      const id = `${payload.step_type}-${Date.now()}`;
      const newNode: Node = {
        id,
        type: payload.step_type,
        position: contextMenu.flowPos,
        data: {
          type: payload.step_type,
          name: payload.name ?? payload.tool_name ?? payload.step_type,
          tool_name: payload.tool_name,
          agent_id: payload.agent_id,
          condition_operator:
            payload.condition_operator ?? (payload.step_type === 'condition' ? 'if_else' : undefined),
          action_type: payload.action_type,
          workflow_id: payload.workflow_id,
          config: payload.default_config ?? {},
          merge_policy: payload.step_type === 'merge' ? (payload.merge_policy ?? 'all') : undefined,
        },
      };
      pushHistory();
      setNodes((cur) => {
        const next = [...cur, newNode];
        stepsAutoSave.markDirty(next);
        return next;
      });
      setValidationOk(false);
      setExecutionStatus(null);
    },
    [contextMenu, stepsAutoSave, pushHistory],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setContextMenu(null);
  }, []);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setContextMenu(null);
  }, []);

  // Drawer edits collapse into a single undo step per node selection: the
  // first change after selecting a node snapshots the pre-edit state, and
  // subsequent edits while that drawer stays open don't add more steps.
  const drawerHistoryPushedRef = useRef<string | null>(null);
  useEffect(() => {
    drawerHistoryPushedRef.current = null;
  }, [selectedNodeId]);

  const onDrawerChange = useCallback(
    (id: string, updates: Record<string, unknown>) => {
      if (drawerHistoryPushedRef.current !== id) {
        pushHistory();
        drawerHistoryPushedRef.current = id;
      }
      setNodes((cur) => {
        const next = cur.map((n) => (n.id === id ? { ...n, data: { ...(n.data ?? {}), ...updates } } : n));
        stepsAutoSave.markDirty(next);
        setValidationOk(false);
        setExecutionStatus(null);
        return next;
      });
    },
    [stepsAutoSave, pushHistory],
  );

  const onAutoLayoutClick = useCallback(async () => {
    pushHistory();
    // Prefer server-side (deterministic Python algorithm); fall back to
    // dagre (frontend) if API not available or call fails.
    if (apiAvailable()) {
      try {
        const result = await autoLayoutWorkflow(workflowId);
        setNodes((cur) => {
          const next = cur.map((n) => {
            const pos = result.positions[n.id];
            return pos ? { ...n, position: { x: pos.x, y: pos.y } } : n;
          });
          stepsAutoSave.markDirty(next);
          return next;
        });
        return;
      } catch {
        // fall through to local dagre
      }
    }
    setNodes((cur) => {
      const next = applyAutoLayout(cur, edges);
      stepsAutoSave.markDirty(next);
      return next;
    });
  }, [workflowId, applyAutoLayout, edges, stepsAutoSave, pushHistory]);

  const onValidateClick = useCallback(async () => {
    setValidating(true);
    try {
      if (apiAvailable()) {
        // Flush current canvas state to the server before asking it to validate.
        // We call markDirty first with the current refs so that `latest.current`
        // is never null — even on a fresh page load where no edit triggered
        // markDirty yet. Without this, forceSave returns early and the server
        // validates stale DB state, causing false-positive `isolated_node` for
        // edges that exist in React state but weren't persisted (e.g. after a
        // prior 422 error-stall).
        stepsAutoSave.markDirty(nodesRef.current);
        edgesAutoSave.markDirty(edgesRef.current);
        await Promise.all([stepsAutoSave.forceSave(), edgesAutoSave.forceSave()]);
        const result = await validateWorkflow(workflowId);
        // Treat both hard errors and soft warnings as findings for the
        // validate button — warnings (isolated_node, fan-in, etc.) should
        // be visible to the user even though they don't block auto-save.
        const errs = [...(result.errors ?? []), ...(result.warnings ?? [])];
        setHardErrorCount(errs.length);
        setHardErrorSample(errs[0]?.detail);
        setValidationOk(errs.length === 0);
      } else {
        // Mock-mode: rely on local findings only (cycle/handle/etc.).
        // `findings` already covers fan-in/merge; cycle is implicit since
        // `isValidConnection` prevented its creation. Treat absence of
        // mergeWithZeroInputs as ok for a Validate flash.
        const localOk =
          findings.mergeWithZeroInputs.length === 0 &&
          findings.fanInWithoutMerge.length === 0 &&
          findings.isolatedNodes.length === 0;
        setHardErrorCount(localOk ? 0 : findings.mergeWithZeroInputs.length + findings.fanInWithoutMerge.length + findings.isolatedNodes.length);
        setHardErrorSample(localOk ? undefined : 'Validação local — corrija avisos acima.');
        setValidationOk(localOk);
      }
    } catch (err) {
      setHardErrorCount(1);
      setHardErrorSample(err instanceof Error ? err.message : String(err));
      setValidationOk(false);
    } finally {
      setValidating(false);
    }
  }, [workflowId, findings, stepsAutoSave, edgesAutoSave, nodesRef, edgesRef]);

  // "Executar": runs the workflow (blocking server-side) and paints each
  // node's final status (completed/failed) once the run finishes. All nodes
  // flash "running" while the request is in flight as a coarse live signal —
  // true per-step streaming would require wiring the SSE /runs/{id}/stream
  // endpoint (see canvas-conventions.md pendências).
  const onExecuteClick = useCallback(async () => {
    if (executing) return;
    setExecuting(true);
    setExecutionStatus(
      Object.fromEntries(nodesRef.current.map((n) => [n.id, 'running' as ExecutionStatus])),
    );
    try {
      if (apiAvailable()) {
        const result = await runWorkflow(workflowId);
        const run = await getWorkflowRun(workflowId, result.run_id);
        const next: Record<string, ExecutionStatus> = {};
        for (const log of run.step_logs) {
          next[log.step_id] = log.status === 'failed' ? 'failed' : 'completed';
        }
        setExecutionStatus(next);
      } else {
        // Mock-mode: no backend to execute against — nothing actually ran,
        // so drop the "running" flash without faking a result.
        setExecutionStatus(null);
      }
    } catch {
      setExecutionStatus(
        Object.fromEntries(nodesRef.current.map((n) => [n.id, 'failed' as ExecutionStatus])),
      );
    } finally {
      setExecuting(false);
    }
  }, [executing, workflowId]);

  // Surface the most recent error from either auto-save channel.
  const saveStatus = stepsAutoSave.status === 'saving' || edgesAutoSave.status === 'saving'
    ? 'saving'
    : stepsAutoSave.status === 'error' || edgesAutoSave.status === 'error'
      ? 'error'
      : stepsAutoSave.status === 'dirty' || edgesAutoSave.status === 'dirty'
        ? 'dirty'
        : stepsAutoSave.status === 'saved' || edgesAutoSave.status === 'saved'
          ? 'saved'
          : 'idle';
  const savedAt = stepsAutoSave.savedAt ?? edgesAutoSave.savedAt;
  const saveError = stepsAutoSave.lastError ?? edgesAutoSave.lastError;

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  // Stamp each node with its execution status (if any) for NodeShell to render.
  const nodesWithStatus = useMemo(() => {
    if (!executionStatus) return nodes;
    return nodes.map((n) => ({
      ...n,
      data: { ...(n.data ?? {}), _executionStatus: executionStatus[n.id] },
    }));
  }, [nodes, executionStatus]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <CanvasStatusBanner
        saveStatus={saveStatus}
        savedAt={savedAt}
        saveError={saveError}
        hardErrorCount={hardErrorCount}
        hardErrorSample={hardErrorSample}
        concurrentEditUser={concurrentEdit?.user ?? null}
        concurrentEditWithinMin={concurrentEdit?.minutesAgo ?? null}
      />
      {isMobile && (
        <div
          role="alert"
          style={{
            padding: '8px 12px',
            fontSize: 12,
            background: 'rgba(245,158,11,0.15)',
            color: '#F59E0B',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          Edição apenas em desktop. Modo de leitura ativo (telas &lt;768px).
        </div>
      )}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {!isMobile && <NodePalette currentWorkflowId={currentWorkflowId} />}
        <div
          className="sunos-canvas-pane"
          style={{ flex: 1, position: 'relative', background: 'var(--void)' }}
          ref={wrapperRef}
          onMouseMove={onPaneMouseMove}
          onMouseLeave={() => setMousePosition(null)}
        >
          <CanvasToolbar
            onAutoLayout={onAutoLayoutClick}
            onValidate={onValidateClick}
            onExecute={onExecuteClick}
            executing={executing}
            validating={validating}
            validationOk={validationOk}
            onUndo={onUndo}
            onRedo={onRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            onDeleteSelected={onDeleteSelected}
            canDelete={!!selectedNodeId}
          />
          <ReactFlow
            nodes={nodesWithStatus}
            edges={edges}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStart={onNodeDragStart}
            onNodeDragStop={onNodeDragStop}
            isValidConnection={isValidConnection}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onPaneContextMenu={onPaneContextMenu}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodesDraggable={!isMobile}
            nodesConnectable={!isMobile}
            elementsSelectable={!isMobile}
            connectionRadius={40}
            fitView
            style={{ background: 'var(--void)' }}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={24} size={1.5} color="rgba(148,178,255,0.18)" />
            <MiniMap
              pannable
              zoomable
              onClick={(_, position) => flow.setCenter(position.x, position.y, { zoom: flow.getZoom(), duration: 400 })}
              style={{ width: 207, height: 145, background: '#000000', border: '1px solid var(--border-subtle)', borderRadius: 8, marginBottom: 45 }}
              maskColor="rgba(0,0,0,0.65)"
              maskStrokeColor="var(--sun)"
              maskStrokeWidth={1}
              nodeColor="var(--nebula)"
              nodeStrokeColor="var(--border-subtle)"
              nodeBorderRadius={4}
            />
          </ReactFlow>
          {/* Mouse-position readout below the minimap (bottom-right, aligned
              with minimap width of 207px + 15px panel margin). */}
          <div
            style={{
              position: 'absolute',
              bottom: 15,
              right: 15,
              zIndex: 10,
              width: 207,
              padding: '4px 8px',
              fontSize: 11,
              fontFamily: 'monospace',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              background: 'var(--deep)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              color: 'var(--text-secondary)',
            }}
          >
            X: {mousePosition?.x ?? '—'} · Y: {mousePosition?.y ?? '—'} · Z: {zoom.toFixed(2)}
          </div>
          {/* Edges must render above node cards: dagre-laid-out edges can
              otherwise pass underneath neighbouring step cards and look
              "cut off". @xyflow stacks `.react-flow__edges` below
              `.react-flow__nodes` by default; flip that for this canvas. */}
          {/* Empty-canvas hint — visible only when workflow has no steps yet */}
          {nodes.length === 0 && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 5,
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  border: '2px dashed rgba(148,178,255,0.20)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  opacity: 0.35,
                }}
              >
                ↙
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, opacity: 0.5, fontWeight: 500 }}>
                arraste aqui
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, opacity: 0.35 }}>
                ou clique no canvas para escolher um step
              </p>
            </div>
          )}
          <style jsx global>{`
            .sunos-canvas-pane .react-flow__edges {
              z-index: 1000;
            }
            @keyframes sunos-node-pulse {
              0%, 100% { box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
              50% { box-shadow: 0 0 0 5px rgba(59,130,246,0.35); }
            }
            @keyframes sunos-diamond-pulse {
              0%, 100% { filter: drop-shadow(0 0 3px rgba(59,130,246,0.25)); }
              50%       { filter: drop-shadow(0 0 9px rgba(59,130,246,0.65)); }
            }
          `}</style>
        </div>
        {contextMenu && !isMobile && (
          <CanvasContextMenu
            screenPosition={contextMenu.screenPos}
            currentWorkflowId={currentWorkflowId}
            onSelect={addNodeFromContextMenu}
            onClose={closeContextMenu}
          />
        )}
        {!isMobile && selectedNode && (
          <NodeConfigDrawer
            node={selectedNode}
            onChange={onDrawerChange}
            onClose={() => setSelectedNodeId(null)}
            currentWorkflowId={currentWorkflowId}
          />
        )}
      </div>
      {/* Findings preview (lightweight read-only summary; full UI is V2). */}
      {(findings.fanInWithoutMerge.length > 0 || findings.mergeWithZeroInputs.length > 0 || findings.isolatedNodes.length > 0) && (
        <div
          role="status"
          style={{
            padding: '4px 12px',
            fontSize: 11,
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {findings.isolatedNodes.length > 0 && (
            <span style={{ color: '#EF4444' }}>{findings.isolatedNodes.length} step{findings.isolatedNodes.length > 1 ? 's' : ''} solto{findings.isolatedNodes.length > 1 ? 's' : ''} · </span>
          )}
          {findings.fanInWithoutMerge.length > 0 && (
            <span>{findings.fanInWithoutMerge.length} fan-in sem merge · </span>
          )}
          {findings.mergeWithZeroInputs.length > 0 && (
            <span>{findings.mergeWithZeroInputs.length} merge sem entrada</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
