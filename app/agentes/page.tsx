'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Add, Bot, Search } from '@carbon/icons-react';
import AppHeader from '@/components/layout/AppHeader';
import AgentesCards from '@/components/admin/agentes/AgentesCards';
import AgentDrawer from '@/components/admin/agentes/AgentDrawer';
import EmptyState from '@/components/ui/EmptyState';
import { useAgents } from '@/contexts/AgentsContext';
import { Agent, AgentStatus } from '@/lib/agents-types';

type FilterStatus = 'all' | AgentStatus;

const FILTER_PILLS: { label: string; value: FilterStatus }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Rascunho', value: 'draft' },
  { label: 'Ativo', value: 'active' },
  { label: 'Inativo', value: 'inactive' },
  { label: 'Arquivado', value: 'archived' },
];

export default function AgentesPage() {
  const router = useRouter();
  const { agents } = useAgents();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search 300ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const filtered = useMemo(() => {
    return agents.filter((a) => {
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      if (
        debouncedSearch.length >= 2 &&
        !a.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
        return false;
      return true;
    });
  }, [agents, filterStatus, debouncedSearch]);

  return (
    <>
      <AppHeader
        breadcrumbs={[{ label: 'Agentes', href: '/agentes' }]}
        rightLabel="Admin"
      />
      <main
        id="main-content"
        className="page-enter"
        style={{ flex: 1, overflow: 'auto', padding: 24 }}
      >
        {/* Title row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 24,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 300,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Agentes
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {filtered.length} {filtered.length === 1 ? 'agente' : 'agentes'}
            </p>
          </div>
          <button
            onClick={() => router.push('/agentes/new')}
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
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            }}
          >
            <Add size={14} />
            Novo Agente
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 320, marginBottom: 16 }}>
          <Search
            size={14}
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
            placeholder="Buscar agente..."
            aria-label="Buscar agente"
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

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {FILTER_PILLS.map((pill) => {
            const isActive = filterStatus === pill.value;
            return (
              <button
                key={pill.value}
                onClick={() => setFilterStatus(pill.value)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 9999,
                  fontSize: '0.75rem',
                  border: `1px solid ${isActive ? 'var(--sun)' : 'var(--border-subtle)'}`,
                  backgroundColor: isActive ? 'rgba(255,200,1,0.12)' : 'transparent',
                  color: isActive ? 'var(--sun)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  fontWeight: isActive ? 500 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--twilight)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      'var(--border-subtle)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                  }
                }}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Empty state */}
        {agents.length === 0 && (
          <EmptyState
            icon={Bot}
            title="Nenhum agente criado"
            description="Crie seu primeiro agente de IA para automatizar tarefas e fluxos de trabalho."
            action={{ label: 'Novo Agente', onClick: () => router.push('/agentes/new') }}
          />
        )}

        {/* Cards grid */}
        {agents.length > 0 && filtered.length > 0 && (
          <AgentesCards agents={filtered} onSelect={setSelectedAgent} />
        )}

        {/* No results after filter */}
        {agents.length > 0 && filtered.length === 0 && (
          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              marginTop: 48,
            }}
          >
            Nenhum agente encontrado.
          </p>
        )}
      </main>

      <AgentDrawer agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </>
  );
}
