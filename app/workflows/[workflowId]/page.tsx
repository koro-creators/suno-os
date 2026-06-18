'use client';

/**
 * Workflow editor page (SPEC-005 TASK-C16 + entry of TASK-C01).
 *
 * Loads the canvas as a dynamic import so `@xyflow/react` and `dagre` only
 * ship in the chunk for this route (constitution §5.1 + NFR-WBC-02). On
 * first render of a v1 workflow (no `canvas_v2_migrated` flag), shows an
 * "Atualizando workflow…" overlay and POSTs `/migrate-v2` before mounting
 * the canvas. Mock-mode skips the migration call but still adapts the
 * shape so the canvas can render without server backing.
 */

import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { RecentlyViewed } from '@carbon/icons-react';
import AppHeader from '@/components/layout/AppHeader';
import { useClients } from '@/contexts/ClientsContext';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import { apiAvailable, getWorkflowDetail, getWorkflowEdges, migrateWorkflowV2 } from '@/lib/api';
import type {
  Workflow,
  WorkflowEdge,
  WorkflowStep,
  WorkflowStepV2,
} from '@/lib/workflow-types';

// Lazy-load the canvas (heavy chunk: @xyflow/react + dagre) — guarded by
// the ESLint rule + canvas-imports check so no other route ever pulls it.
const WorkflowCanvas = dynamic(
  () => import('@/components/workflows/canvas/WorkflowCanvas'),
  { ssr: false, loading: () => <CanvasSkeleton /> },
);

function CanvasSkeleton() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: 12,
      }}
    >
      Carregando canvas…
    </div>
  );
}

function buildEdgesFromV1(steps: WorkflowStep[]): WorkflowEdge[] {
  // Mirror of api/workflows/migration_v1_v2.py — kept in sync intentionally
  // so the JIT migration of mock-mode workflows produces the same shape the
  // server would. Keep the two implementations close (they will diverge if
  // we add new step types — bother the next person to update both).
  const out: WorkflowEdge[] = [];
  let counter = 0;
  for (const step of steps) {
    if (step.condition) {
      const t = step.condition.then;
      const e = step.condition.else;
      if (t) {
        out.push({
          edge_id: `mock-${++counter}`,
          source_step_id: step.id,
          source_handle: 'then',
          target_step_id: t,
          target_handle: 'in',
        });
      }
      if (e) {
        out.push({
          edge_id: `mock-${++counter}`,
          source_step_id: step.id,
          source_handle: 'else',
          target_step_id: e,
          target_handle: 'in',
        });
      }
    } else if (step.next_step) {
      const handle: WorkflowEdge['source_handle'] = step.type === 'hitl' ? 'approved' : 'out';
      out.push({
        edge_id: `mock-${++counter}`,
        source_step_id: step.id,
        source_handle: handle,
        target_step_id: step.next_step,
        target_handle: 'in',
      });
    }
  }
  return out;
}

function buildPositions(steps: WorkflowStep[]): Record<string, { x: number; y: number }> {
  // Tiny deterministic layout for mock-mode: chain steps left→right at fixed
  // 220-px columns. Server-side migrate-v2 returns proper layered coords.
  const positions: Record<string, { x: number; y: number }> = {};
  steps.forEach((s, i) => {
    positions[s.id] = { x: i * 220, y: 0 };
  });
  return positions;
}

interface CanvasPayload {
  steps: WorkflowStepV2[];
  edges: WorkflowEdge[];
}

export default function WorkflowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { workflows, updateWorkflow, deleteWorkflow } = useWorkflows();
  const { clients } = useClients();
  const workflowId = params.workflowId as string;

  const ctxWorkflow = workflows.find((w) => w.id === workflowId);

  // `undefined` = still resolving; `null` = confirmed not found.
  // Real-mode resolves via getWorkflowDetail (decoupled from the async list
  // load, which omits steps); mock-mode resolves from the context fixtures.
  const [workflow, setWorkflow] = useState<Workflow | null | undefined>(ctxWorkflow);
  const [migrationState, setMigrationState] = useState<'idle' | 'migrating' | 'ready'>('idle');
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [payload, setPayload] = useState<CanvasPayload | null>(null);

  // Build the canvas payload either from server (real-mode) or local (mock-mode).
  // Dependency is workflowId (stable string), not workflow (object recreated on
  // every auto-save), to prevent an infinite re-migration loop.
  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      setMigrationError(null);
      let wf: Workflow | null | undefined = ctxWorkflow;
      let persistedEdges: WorkflowEdge[] | null = null;

      if (apiAvailable()) {
        // Real-mode: migrate to v2 if needed, then fetch the full detail
        // (the list endpoint omits steps) plus the persisted edges. On failure,
        // fall back to whatever the context held (canvas-conventions.md §mock-mode).
        try {
          setMigrationState('migrating');
          await migrateWorkflowV2(workflowId);
        } catch (err) {
          if (cancelled) return;
          setMigrationError(err instanceof Error ? err.message : String(err));
        }
        try {
          wf = await getWorkflowDetail(workflowId);
          persistedEdges = await getWorkflowEdges(workflowId);
        } catch {
          wf = ctxWorkflow ?? null;
        }
      } else {
        // Mock mode: load edges from localStorage (saved by WorkflowCanvas persistEdges).
        try {
          const stored = localStorage.getItem(`sunos-edges-v2-${workflowId}`);
          if (stored) persistedEdges = JSON.parse(stored) as WorkflowEdge[];
        } catch {
          // ignore malformed JSON or unavailable localStorage
        }
        // Mock mode: load steps from localStorage (saved by WorkflowCanvas persistSteps).
        // Overrides the context fixture so dynamically added nodes (e.g. Tool)
        // survive page reload — same pattern as edge persistence.
        try {
          const storedSteps = localStorage.getItem(`sunos-steps-v2-${workflowId}`);
          if (storedSteps && wf) {
            const parsedSteps = JSON.parse(storedSteps) as WorkflowStepV2[];
            wf = { ...wf, steps: parsedSteps as unknown as WorkflowStep[] };
          }
        } catch {
          // ignore malformed JSON or unavailable localStorage
        }
      }

      if (cancelled) return;
      setWorkflow(wf ?? null);
      if (!wf) {
        setMigrationState('ready');
        return;
      }

      const steps = wf.steps as WorkflowStep[];
      const v2Steps: WorkflowStepV2[] = steps.map((s, i) => {
        const sv2 = s as Partial<WorkflowStepV2>;
        // Use persisted positions (x or y defined). Fall back to a tidy row
        // only for genuinely unpositioned steps (backend returns no position fields).
        const hasSaved = sv2.position_x !== undefined || sv2.position_y !== undefined;
        return {
          ...s,
          position_x: hasSaved ? (sv2.position_x ?? 0) : i * 300,
          position_y: hasSaved ? (sv2.position_y ?? 0) : 0,
        };
      });
      // Prefer the edges persisted in workflow_edges (v2). Only synthesize from
      // v1 linkage (next_step/condition) when there are no stored edges yet.
      const v2Edges =
        persistedEdges && persistedEdges.length > 0
          ? persistedEdges
          : buildEdgesFromV1(steps);
      setPayload({ steps: v2Steps, edges: v2Edges });
      setMigrationState('ready');
    }

    void prepare();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  // Editable workflow name (header). Synced from the loaded workflow and
  // committed on blur/Enter via updateWorkflow (already wired end-to-end).
  const [nameDraft, setNameDraft] = useState('');
  useEffect(() => {
    setNameDraft(workflow?.name ?? '');
  }, [workflow?.id, workflow?.name]);

  const commitNameDraft = () => {
    if (!workflow) return;
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== workflow.name) {
      updateWorkflow(workflow.id, { name: trimmed });
    } else {
      setNameDraft(workflow.name);
    }
  };

  // Editable client_scope (header). Same local-draft pattern as nameDraft —
  // `workflow` doesn't re-sync after updateWorkflow, so the <select> needs
  // its own state or it snaps back to the stale value.
  const [clientIdDraft, setClientIdDraft] = useState('');
  useEffect(() => {
    setClientIdDraft(workflow?.client_scope?.[0] ?? '');
  }, [workflow?.id, workflow?.client_scope]);

  const onPersistSteps = useMemo(
    () => async (steps: WorkflowStepV2[]) => {
      if (!workflow) return;
      try {
        // Await so the auto-save hook sees HTTP errors (400/422) as real failures.
        // WorkflowStepV2 is a strict superset of WorkflowStep — cast is safe;
        // position_x/position_y survive JSON serialisation to the backend.
        await updateWorkflow(workflow.id, { steps: steps as unknown as WorkflowStep[] });
      } catch (err) {
        // TypeError = network unreachable. Steps are preserved in canvas state;
        // swallow silently. Re-throw HTTP errors so the banner shows them.
        if (err instanceof TypeError) return;
        throw err;
      }
    },
    [updateWorkflow, workflow],
  );

  if (workflow === undefined) {
    return (
      <>
        <AppHeader breadcrumbs={[{ label: 'Workflows', href: '/workflows' }]} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Carregando workflow…</p>
        </div>
      </>
    );
  }

  if (workflow === null) {
    return (
      <>
        <AppHeader
          breadcrumbs={[
            { label: 'Workflows', href: '/workflows' },
            { label: 'Não encontrado', href: '#' },
          ]}
        />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Workflow não encontrado</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: 'Workflows', href: '/workflows' },
          { label: workflow.name, href: `/workflows/${workflow.id}` },
        ]}
        rightSection={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              aria-label="Nome do workflow"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitNameDraft}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                } else if (e.key === 'Escape') {
                  setNameDraft(workflow.name);
                  e.currentTarget.blur();
                }
              }}
              style={{
                fontSize: 12,
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                background: 'var(--deep)',
                color: 'var(--text-primary)',
                minWidth: 200,
              }}
            />
            <select
              aria-label="Cliente do workflow"
              value={clientIdDraft}
              onChange={(e) => {
                const value = e.target.value;
                setClientIdDraft(value);
                updateWorkflow(workflow.id, { client_scope: value ? [value] : [] });
              }}
              style={{
                fontSize: 12,
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                background: 'var(--deep)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              <option value="">— Sem cliente —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => router.push(`/workflows/${workflow.id}/runs`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 12px', fontSize: 12, borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                background: 'transparent', color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <RecentlyViewed size={14} />
              Histórico
            </button>
            <button
              onClick={() => {
                deleteWorkflow(workflow.id);
                router.push('/workflows');
              }}
              style={{
                padding: '6px 12px', fontSize: 12, borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                background: 'transparent', color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Apagar
            </button>
          </div>
        }
      />

      {migrationState === 'migrating' && (
        <div
          role="status"
          style={{
            padding: '12px 16px',
            fontSize: 12,
            background: 'rgba(59,130,246,0.10)',
            color: '#3B82F6',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          Atualizando workflow para o novo canvas…
        </div>
      )}
      {migrationError && migrationState === 'ready' && (
        <div
          role="status"
          style={{
            padding: '10px 16px',
            fontSize: 12,
            background: 'rgba(245,158,11,0.12)',
            color: '#F59E0B',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          Backend indisponível — exibindo versão local do canvas
        </div>
      )}

      {migrationState === 'ready' && payload && (
        <WorkflowCanvas
          workflowId={workflow.id}
          currentWorkflowId={workflow.id}
          initialSteps={payload.steps}
          initialEdges={payload.edges}
          onPersistSteps={onPersistSteps}
        />
      )}
    </>
  );
}
