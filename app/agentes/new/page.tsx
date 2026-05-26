'use client';

import AppHeader from '@/components/layout/AppHeader';
import AgentNewForm from '@/components/admin/agentes/AgentNewForm';

export default function AgentNewPage() {
  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: 'Agentes', href: '/agentes' },
          { label: 'Novo Agente', href: '/agentes/new' },
        ]}
      />
      <main
        id="main-content"
        className="page-enter"
        style={{ flex: 1, overflow: 'auto', padding: 24 }}
      >
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: 300,
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Novo Agente
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Configure a identidade e instruções do agente.
          </p>
        </div>
        <AgentNewForm />
      </main>
    </>
  );
}
