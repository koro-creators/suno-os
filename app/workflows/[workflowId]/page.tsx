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
import { Play, RecentlyViewed } from '@carbon/icons-react';
import AppHeader from '@/components/layout/AppHeader';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import { apiAvailable, migrateWorkflowV2 } from '@/lib/api';
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
  const { workflows, updateWorkflow, deleteWorkflow, runWorkflow } = useWorkflows();
  const workflowId = params.workflowId as string;

  const workflow = workflows.find((w) => w.id === workflowId);

  const [migrationState, setMigrationState] = useState<'idle' | 'migrating' | 'ready'>('idle');
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [payload, setPayload] = useState<CanvasPayload | null>(null);

  // Build the canvas payload either from server (real-mode) or local (mock-mode).
  // Depends on workflowId (stable string) not the workflow object, which changes
  // reference every time WorkflowsContext updates (e.g. auto-save), causing a loop.
  useEffect(() => {
    if (!workflow) return;
    const wf = workflow;
    let cancelled = false;

    async function prepare() {
      setMigrationError(null);
      if (apiAvailable()) {
        try {
          setMigrationState('migrating');
          await migrateWorkflowV2(wf.id);
        } catch (err) {
          if (cancelled) return;
          // 404 = endpoint not implemented yet / workflow not in DB — expected in
          // dev/mock mode. Don't surface as "backend indisponível".
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes('404')) {
            setMigrationError(msg);
          }
        }
      }
      const steps = wf.steps as WorkflowStep[];
      const positions = buildPositions(steps);
      const v2Steps: WorkflowStepV2[] = steps.map((s) => ({
        ...s,
        position_x: positions[s.id]?.x ?? 0,
        position_y: positions[s.id]?.y ?? 0,
      }));
      const v2Edges = buildEdgesFromV1(steps);
      if (cancelled) return;
      setPayload({ steps: v2Steps, edges: v2Edges });
      setMigrationState('ready');
    }

    void prepare();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  const onPersistSteps = useMemo(
    () => async (steps: WorkflowStepV2[]) => {
      if (!workflow) return;
      // Strip canvas-only fields before persisting in the local context's
      // WorkflowStep shape; positions live alongside in `definition.steps[]`
      // when persistence reaches the backend (cf. api/workflows/migration_v1_v2.py).
      const stripped: WorkflowStep[] = steps.map((s) => {
        const { position_x: _x, position_y: _y, merge_policy, ...rest } = s;
        return { ...rest, ...(merge_policy ? ({ merge_policy } as Partial<WorkflowStep>) : {}) } as WorkflowStep;
      });
      updateWorkflow(workflow.id, { steps: stripped });
    },
    [updateWorkflow, workflow],
  );

  if (!workflow) {
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
          <div style={{ display: 'flex', gap: 8 }}>
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
          onExecute={() => runWorkflow(workflow.id)}
        />
      )}
    </>
  );
}
