'use client';

import { useParams } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import AgenteEditorTabs from '@/components/admin/agentes/AgenteEditorTabs';
import { useAgents } from '@/contexts/AgentsContext';

export default function AgentEditorPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { agents } = useAgents();

  const agent = agents.find((a) => a.id === agentId);

  if (!agent) {
    return (
      <>
        <AppHeader breadcrumbs={[{ label: 'Agentes', href: '/agentes' }]} />
        <main
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Agente não encontrado.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: 'Agentes', href: '/agentes' },
          { label: agent.name, href: `/agentes/${agent.id}` },
        ]}
      />
      <main
        id="main-content"
        className="page-enter"
        style={{ flex: 1, overflow: 'auto', padding: 24 }}
      >
        {/* Editor header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 32, lineHeight: 1 }}>{agent.icon}</span>
          <div>
            <h1
              style={{
                fontSize: '1.4rem',
                fontWeight: 300,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {agent.name}
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              {agent.skill_count} {agent.skill_count === 1 ? 'skill' : 'skills'} ·{' '}
              {agent.client_count} {agent.client_count === 1 ? 'cliente' : 'clientes'}
            </p>
          </div>
        </div>

        <AgenteEditorTabs agent={agent} />
      </main>
    </>
  );
}
