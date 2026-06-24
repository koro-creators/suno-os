'use client';

import { useState } from 'react';
import { Agent } from '@/lib/agents-types';
import ConfiguracaoTab from './tabs/ConfiguracaoTab';
import SkillsTab from './tabs/SkillsTab';
import AppsTab from './tabs/AppsTab';
import MemoriaTab from './tabs/MemoriaTab';
import AgendamentoTab from './tabs/AgendamentoTab';
import AtividadeTab from './tabs/AtividadeTab';
import ClientesTab from './tabs/ClientesTab';
import PreviewTab from './tabs/PreviewTab';

const TABS = [
  'Configuração',
  'Skills',
  'Apps',
  'Memória',
  'Agendamento',
  'Atividade',
  'Clientes',
  'Preview',
] as const;

type Tab = (typeof TABS)[number];

interface Props {
  agent: Agent;
}

export default function AgenteEditorTabs({ agent }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Configuração');

  return (
    <div>
      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Seções do agente"
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 24,
          overflowX: 'auto',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          const isPreview = tab === 'Preview';
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab)}
              onKeyDown={(e) => {
                const idx = TABS.indexOf(tab);
                if (e.key === 'ArrowRight')
                  setActiveTab(TABS[(idx + 1) % TABS.length]);
                if (e.key === 'ArrowLeft')
                  setActiveTab(TABS[(idx - 1 + TABS.length) % TABS.length]);
              }}
              style={{
                padding: '10px 16px',
                fontSize: '0.8rem',
                color: isActive
                  ? isPreview ? 'var(--sun)' : 'var(--text-primary)'
                  : 'var(--text-muted)',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: isActive
                  ? '2px solid var(--sun)'
                  : '2px solid transparent',
                cursor: 'pointer',
                transition: 'color 150ms ease, border-color 150ms ease',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      {activeTab === 'Configuração' && <ConfiguracaoTab agent={agent} />}
      {activeTab === 'Skills' && <SkillsTab agent={agent} />}
      {activeTab === 'Apps' && <AppsTab agent={agent} />}
      {activeTab === 'Memória' && <MemoriaTab agent={agent} />}
      {activeTab === 'Agendamento' && <AgendamentoTab agent={agent} />}
      {activeTab === 'Atividade' && <AtividadeTab agentId={agent.id} />}
      {activeTab === 'Clientes' && <ClientesTab agent={agent} />}
      {activeTab === 'Preview' && <PreviewTab agent={agent} />}
    </div>
  );
}
