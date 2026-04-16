'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, LayoutGrid, List } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import WorkflowCard from '@/components/workflows/WorkflowCard';
import WorkflowTable from '@/components/workflows/WorkflowTable';
import WorkflowDrawer from '@/components/workflows/WorkflowDrawer';
import WorkflowTemplates from '@/components/workflows/WorkflowTemplates';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import { WORKFLOW_TEMPLATES } from '@/data/workflow-templates';
import { Workflow } from '@/lib/workflow-types';

type ViewMode = 'table' | 'grid';

export default function WorkflowsPage() {
  const router = useRouter();
  const { workflows, updateWorkflow, deleteWorkflow, runWorkflow } = useWorkflows();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const filtered = useMemo(() => {
    return workflows.filter((w) => {
      if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && w.status !== statusFilter) return false;
      return true;
    });
  }, [workflows, search, statusFilter]);

  const activeCount = workflows.filter((w) => w.status === 'active').length;

  function handleSelect(wf: Workflow) {
    setSelectedWorkflow(wf);
  }

  function handleEdit(wf: Workflow) {
    router.push(`/workflows/${wf.id}`);
  }

  function handleDelete(wf: Workflow) {
    deleteWorkflow(wf.id);
    if (selectedWorkflow?.id === wf.id) setSelectedWorkflow(null);
  }

  function handleDrawerRun(id: string) {
    console.log('[WorkflowDrawer] Executar agora:', id);
    runWorkflow(id);
    // Refresh selected workflow reference
    setSelectedWorkflow((prev) => {
      if (!prev || prev.id !== id) return prev;
      return workflows.find((w) => w.id === id) ?? prev;
    });
  }

  function handleDrawerToggleStatus(id: string) {
    const wf = workflows.find((w) => w.id === id);
    if (!wf) return;
    const newStatus = wf.status === 'active' ? 'paused' : 'active';
    updateWorkflow(id, { status: newStatus });
    if (selectedWorkflow?.id === id) {
      setSelectedWorkflow({ ...wf, status: newStatus });
    }
  }

  function handleDrawerDelete(id: string) {
    deleteWorkflow(id);
    setSelectedWorkflow(null);
  }

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
              {workflows.length} workflows &middot; {activeCount} ativos
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

        {/* Filters + View toggle */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', maxWidth: 320, flex: '1 1 200px' }}>
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

          {/* View toggle */}
          <div style={{ display: 'flex', gap: 2, marginLeft: 'auto' }}>
            <button
              onClick={() => setViewMode('table')}
              aria-label="Visualizacao em tabela"
              aria-pressed={viewMode === 'table'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px 0 0 8px',
                backgroundColor: viewMode === 'table' ? 'rgba(255,200,1,0.1)' : 'transparent',
                color: viewMode === 'table' ? 'var(--sun)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <List size={14} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Visualizacao em grid"
              aria-pressed={viewMode === 'grid'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                border: '1px solid var(--border-subtle)',
                borderLeft: 'none',
                borderRadius: '0 8px 8px 0',
                backgroundColor: viewMode === 'grid' ? 'rgba(255,200,1,0.1)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--sun)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <LayoutGrid size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Templates */}
        {WORKFLOW_TEMPLATES.length > 0 && (
          <WorkflowTemplates templates={WORKFLOW_TEMPLATES} />
        )}

        {/* Content: Table or Grid */}
        {viewMode === 'table' ? (
          <WorkflowTable
            workflows={filtered}
            onSelect={handleSelect}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
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
        )}

        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 48 }}>
            Nenhum workflow encontrado.
          </p>
        )}
      </main>

      {/* Side drawer */}
      <WorkflowDrawer
        workflow={selectedWorkflow}
        onClose={() => setSelectedWorkflow(null)}
        onRun={handleDrawerRun}
        onToggleStatus={handleDrawerToggleStatus}
        onDelete={handleDrawerDelete}
      />
    </>
  );
}
