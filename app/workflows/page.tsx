'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import WorkflowCard from '@/components/workflows/WorkflowCard';
import WorkflowTemplates from '@/components/workflows/WorkflowTemplates';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import { WORKFLOW_TEMPLATES } from '@/data/workflow-templates';

export default function WorkflowsPage() {
  const router = useRouter();
  const { workflows } = useWorkflows();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filtered = useMemo(() => {
    return workflows.filter((w) => {
      if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && w.status !== statusFilter) return false;
      return true;
    });
  }, [workflows, search, statusFilter]);

  return (
    <>
      <AppHeader
        breadcrumbs={[{ label: 'Workflows', href: '/workflows' }]}
        rightLabel="Admin"
      />
      <main
        id="main-content"
        className="page-enter"
        style={{ flex: 1, overflow: 'auto', padding: 24 }}
      >
        {/* Title section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
              Workflows
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Automacoes e pipelines de IA
            </p>
          </div>
          <button
            onClick={() => router.push('/workflows/new')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'var(--sun)',
              color: 'var(--void)',
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
            <Plus size={14} strokeWidth={2} />
            Novo Workflow
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', maxWidth: 320 }}>
            <Search
              size={14}
              strokeWidth={1.5}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Buscar workflow..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: 9999,
                padding: '8px 12px 8px 32px',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--sun)';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['', 'draft', 'active', 'paused'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.7rem',
                  borderRadius: 9999,
                  border: statusFilter === s ? '1px solid var(--sun)' : '1px solid var(--border-subtle)',
                  backgroundColor: statusFilter === s ? 'rgba(255,200,1,0.1)' : 'transparent',
                  color: statusFilter === s ? 'var(--sun)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {s === '' ? 'Todos' : s === 'draft' ? 'Rascunho' : s === 'active' ? 'Ativo' : 'Pausado'}
              </button>
            ))}
          </div>
        </div>

        {/* Templates */}
        {WORKFLOW_TEMPLATES.length > 0 && (
          <WorkflowTemplates templates={WORKFLOW_TEMPLATES} />
        )}

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {filtered.map((workflow) => (
            <WorkflowCard key={workflow.id} workflow={workflow} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 48 }}>
            Nenhum workflow encontrado.
          </p>
        )}
      </main>
    </>
  );
}
