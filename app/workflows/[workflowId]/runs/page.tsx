'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Play } from '@carbon/icons-react';
import AppHeader from '@/components/layout/AppHeader';
import WorkflowRunTimeline from '@/components/workflows/WorkflowRunTimeline';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import { apiAvailable, listWorkflowRuns } from '@/lib/api';
import { WorkflowRun } from '@/lib/workflow-types';

// Mock runs for dev — in production would come from API
const MOCK_RUNS: Record<string, WorkflowRun[]> = {
  'wf-report-mensal': [
    {
      id: 'run-001',
      workflow_id: 'wf-report-mensal',
      status: 'completed',
      trigger: 'manual',
      started_at: '2026-04-01T12:00:00Z',
      completed_at: '2026-04-01T12:30:00Z',
      error: null,
      steps_output: {},
      step_logs: [
        { id: 'sl-1', step_id: 's1', step_name: 'Buscar dados', status: 'completed', input: null, output: null, error: null, duration_ms: 1200, started_at: '2026-04-01T12:00:00Z', completed_at: '2026-04-01T12:00:01Z' },
        { id: 'sl-2', step_id: 's2', step_name: 'Gerar analise', status: 'completed', input: null, output: null, error: null, duration_ms: 8500, started_at: '2026-04-01T12:00:02Z', completed_at: '2026-04-01T12:00:10Z' },
        { id: 'sl-3', step_id: 's3', step_name: 'Revisao humana', status: 'completed', input: null, output: null, error: null, duration_ms: 120000, started_at: '2026-04-01T12:00:11Z', completed_at: '2026-04-01T12:02:11Z' },
        { id: 'sl-4', step_id: 's4', step_name: 'Enviar para Slack', status: 'completed', input: null, output: null, error: null, duration_ms: 450, started_at: '2026-04-01T12:02:12Z', completed_at: '2026-04-01T12:02:12Z' },
      ],
    },
    {
      id: 'run-000',
      workflow_id: 'wf-report-mensal',
      status: 'failed',
      trigger: 'scheduler',
      started_at: '2026-03-01T09:00:00Z',
      completed_at: '2026-03-01T09:02:00Z',
      error: 'Timeout ao buscar dados',
      steps_output: {},
      step_logs: [
        { id: 'sl-5', step_id: 's1', step_name: 'Buscar dados', status: 'failed', input: null, output: null, error: 'Timeout', duration_ms: 120000, started_at: '2026-03-01T09:00:00Z', completed_at: '2026-03-01T09:02:00Z' },
      ],
    },
  ],
  'wf-monitor-social': [
    {
      id: 'run-002',
      workflow_id: 'wf-monitor-social',
      status: 'completed',
      trigger: 'scheduler',
      started_at: '2026-04-14T08:00:00Z',
      completed_at: '2026-04-14T08:02:00Z',
      error: null,
      steps_output: {},
      step_logs: [],
    },
  ],
};

export default function WorkflowRunsPage() {
  const params = useParams();
  const router = useRouter();
  const { workflows, runWorkflow } = useWorkflows();

  const workflowId = params.workflowId as string;
  const workflow = workflows.find((w) => w.id === workflowId);
  const [runs, setRuns] = useState<WorkflowRun[]>(MOCK_RUNS[workflowId] || []);

  const loadRuns = useCallback(async () => {
    if (!apiAvailable()) {
      setRuns(MOCK_RUNS[workflowId] || []);
      return;
    }
    try {
      setRuns(await listWorkflowRuns(workflowId));
    } catch {
      setRuns(MOCK_RUNS[workflowId] || []); // graceful fallback
    }
  }, [workflowId]);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  // Trigger a run, then refresh the history once it completes server-side.
  const handleRun = useCallback(async () => {
    await runWorkflow(workflowId);
    await loadRuns();
  }, [runWorkflow, workflowId, loadRuns]);

  if (!workflow) {
    return (
      <>
        <AppHeader
          breadcrumbs={[
            { label: 'Workflows', href: '/workflows' },
            { label: 'Nao encontrado', href: '#' },
          ]}
        />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Workflow nao encontrado</p>
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
          { label: 'Execucoes', href: `/workflows/${workflow.id}/runs` },
        ]}
      />
      <main
        id="main-content"
        className="page-enter"
        style={{ flex: 1, overflow: 'auto', padding: 24 }}
      >
        {/* Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
              Execucoes
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Historico de runs de &quot;{workflow.name}&quot;
            </p>
          </div>
          <button
            onClick={handleRun}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#22C55E',
              color: '#fff',
              border: 'none',
              borderRadius: 9999,
              padding: '8px 16px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <Play size={14} />
            Executar Agora
          </button>
        </div>

        <WorkflowRunTimeline runs={runs} />
      </main>
    </>
  );
}
