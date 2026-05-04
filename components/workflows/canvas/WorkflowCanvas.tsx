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
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
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
} from '@/lib/api';
import type { WorkflowEdge, WorkflowStepV2 } from '@/lib/workflow-types';
import { useWorkflowAutoSave } from '@/hooks/useWorkflowAutoSave';
import { useGraphValidation } from './hooks/useGraphValidation';
import { useAutoLayout } from './hooks/useAutoLayout';

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
  /** Optional: triggered by toolbar's "Executar". */
  onExecute?: () => void;
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

function workflowEdgesToFlowEdges(edges: WorkflowEdge[]): Edge[] {
  return edges.map((e, idx) => ({
    id: e.edge_id ?? `e-${idx}-${e.source_step_id}-${e.target_step_id}`,
    source: e.source_step_id,
    target: e.target_step_id,
    sourceHandle: e.source_handle,
    targetHandle: e.target_handle,
    type: 'custom',
  }));
}

function flowEdgesToWorkflowEdges(flowEdges: Edge[]): WorkflowEdge[] {
  return flowEdges.map((e) => ({
    edge_id: e.id.startsWith('e-') ? undefined : e.id,
    source_step_id: e.source,
    source_handle: (e.sourceHandle ?? 'out') as WorkflowEdge['source_handle'],
    target_step_id: e.target,
    target_handle: 'in',
  }));
}

function CanvasInner(props: WorkflowCanvasProps) {
  const { workflowId, initialSteps, initialEdges, currentWorkflowId, onPersistSteps, onExecute, concurrentEdit } = props;
  const flow = useReactFlow();

  const [nodes, setNodes] = useState<Node[]>(() => stepsToNodes(initialSteps, initialEdges));
  const [edges, setEdges] = useState<Edge[]>(() => workflowEdgesToFlowEdges(initialEdges));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

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
      await onPersistSteps(stepsToSave);
    },
    [onPersistSteps],
  );

  const persistEdges = useCallback(
    async (latestEdges: Edge[]) => {
      // Mock-mode: edges live only in canvas state, not persisted server-side.
      // Real-mode: hit the backend /edges endpoint that landed in Phase B.
      if (!apiAvailable()) return;
      await setWorkflowEdges(workflowId, flowEdgesToWorkflowEdges(latestEdges));
    },
    [workflowId],
  );

  const stepsAutoSave = useWorkflowAutoSave<Node[]>({
    saveFn: persistSteps,
  });
  const edgesAutoSave = useWorkflowAutoSave<Edge[]>({
    saveFn: persistEdges,
  });

  // Validation status (server-side).
  const [validating, setValidating] = useState(false);
  const [validationOk, setValidationOk] = useState(false);
  const [hardErrorCount, setHardErrorCount] = useState(0);
  const [hardErrorSample, setHardErrorSample] = useState<string | undefined>();

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (isMobile) return;
      setNodes((cur) => {
        const next = applyNodeChanges(changes, cur);
        stepsAutoSave.markDirty(next);
        // Reset validation status whenever the graph mutates so the user
        // re-runs Validate before Executar lights up.
        setValidationOk(false);
        return next;
      });
    },
    [isMobile, stepsAutoSave],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (isMobile) return;
      setEdges((cur) => {
        const next = applyEdgeChanges(changes, cur);
        edgesAutoSave.markDirty(next);
        setValidationOk(false);
        return next;
      });
    },
    [isMobile, edgesAutoSave],
  );

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
      setEdges((cur) => {
        const next = addEdge({ ...connection, type: 'custom' }, cur);
        edgesAutoSave.markDirty(next);
        setValidationOk(false);
        return next;
      });
    },
    [isMobile, edgesAutoSave],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (isMobile) return;
      const raw = e.dataTransfer.getData('application/sunos-canvas');
      if (!raw) return;
      let payload: { step_type: WorkflowStepV2['type']; tool_name?: string; default_config?: Record<string, unknown> };
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
          name: payload.tool_name ?? payload.step_type,
          tool_name: payload.tool_name,
          config: payload.default_config ?? {},
          merge_policy: payload.step_type === 'merge' ? 'all' : undefined,
        },
      };
      setNodes((cur) => {
        const next = [...cur, newNode];
        stepsAutoSave.markDirty(next);
        return next;
      });
      setValidationOk(false);
    },
    [isMobile, flow, stepsAutoSave],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onDrawerChange = useCallback(
    (id: string, updates: Record<string, unknown>) => {
      setNodes((cur) => {
        const next = cur.map((n) => (n.id === id ? { ...n, data: { ...(n.data ?? {}), ...updates } } : n));
        stepsAutoSave.markDirty(next);
        setValidationOk(false);
        return next;
      });
    },
    [stepsAutoSave],
  );

  const onAutoLayoutClick = useCallback(async () => {
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
  }, [workflowId, applyAutoLayout, edges, stepsAutoSave]);

  const onValidateClick = useCallback(async () => {
    setValidating(true);
    try {
      if (apiAvailable()) {
        const result = await validateWorkflow(workflowId);
        const errs = result.errors ?? [];
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
          findings.fanInWithoutMerge.length === 0;
        setHardErrorCount(localOk ? 0 : findings.mergeWithZeroInputs.length + findings.fanInWithoutMerge.length);
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
  }, [workflowId, findings]);

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
        {!isMobile && <NodePalette />}
        <div style={{ flex: 1, position: 'relative' }} ref={wrapperRef}>
          <CanvasToolbar
            onAutoLayout={onAutoLayoutClick}
            onValidate={onValidateClick}
            onExecute={() => onExecute?.()}
            validating={validating}
            validationOk={validationOk}
          />
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onNodeClick={onNodeClick}
            onPaneClick={() => setSelectedNodeId(null)}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodesDraggable={!isMobile}
            nodesConnectable={!isMobile}
            elementsSelectable={!isMobile}
            fitView
          >
            <Background gap={16} />
            <MiniMap pannable zoomable />
            <Controls position="bottom-left" />
          </ReactFlow>
        </div>
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
      {(findings.fanInWithoutMerge.length > 0 || findings.mergeWithZeroInputs.length > 0) && (
        <div
          role="status"
          style={{
            padding: '4px 12px',
            fontSize: 11,
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
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
