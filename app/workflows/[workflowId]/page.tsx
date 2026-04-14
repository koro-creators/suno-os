'use client';

import { useParams, useRouter } from 'next/navigation';
import { Play, History } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import WorkflowBuilder from '@/components/workflows/WorkflowBuilder';
import { useWorkflows } from '@/contexts/WorkflowsContext';

export default function WorkflowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { workflows, updateWorkflow, deleteWorkflow, runWorkflow } = useWorkflows();

  const workflowId = params.workflowId as string;
  const workflow = workflows.find((w) => w.id === workflowId);

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
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 12 }}>Workflow nao encontrado</p>
            <button
              onClick={() => router.push('/workflows')}
              style={{
                fontSize: '0.8rem',
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Voltar ao catalogo
            </button>
          </div>
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
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                fontSize: '0.75rem',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'border-color 150ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--twilight)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)';
              }}
            >
              <History size={14} strokeWidth={1.5} />
              Historico
            </button>
            <button
              onClick={() => runWorkflow(workflow.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                fontSize: '0.75rem',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#22C55E',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'opacity 150ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = '1';
              }}
            >
              <Play size={14} strokeWidth={1.5} />
              Executar Agora
            </button>
          </div>
        }
      />
      <WorkflowBuilder
        initial={workflow}
        onSave={(data) => updateWorkflow(workflow.id, data)}
        onDelete={() => {
          deleteWorkflow(workflow.id);
          router.push('/workflows');
        }}
      />
    </>
  );
}
