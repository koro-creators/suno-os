'use client';

import { HardDrive } from 'lucide-react';
import { useAgents } from '@/contexts/AgentsContext';
import { Agent } from '@/lib/agents-types';

interface AppDef {
  id: string;
  app_type: string;
  label: string;
  description: string;
}

const APP_CATALOG: AppDef[] = [
  {
    id: 'drive-suno',
    app_type: 'google_drive',
    label: 'Drive Suno',
    description: 'Acesso de leitura a arquivos do Google Drive da conta Suno.',
  },
];

interface Props {
  agent: Agent;
}

export default function AppsTab({ agent }: Props) {
  const { toggleApp } = useAgents();
  const apps = agent.apps ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
        Conecte apps externos para que o agente possa utilizá-los durante execuções.
      </p>

      {APP_CATALOG.map((appDef) => {
        const conn = apps.find((a) => a.app_type === appDef.app_type);
        const isConnected = !!conn;
        const isEnabled = conn?.enabled ?? false;

        return (
          <div
            key={appDef.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              backgroundColor: 'var(--deep)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: 'var(--nebula)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <HardDrive size={14} strokeWidth={1.5} style={{ color: 'var(--text-secondary)' }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                {appDef.label}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {isConnected ? (isEnabled ? 'Ativo' : 'Desativado') : 'Não configurado'}
              </div>
            </div>

            {isConnected ? (
              <button
                type="button"
                role="switch"
                aria-checked={isEnabled}
                onClick={() => {
                  if (conn) toggleApp(agent.id, conn.id, !isEnabled);
                }}
                style={{
                  width: 40,
                  height: 22,
                  borderRadius: 9999,
                  backgroundColor: isEnabled ? 'var(--sun)' : 'var(--nebula)',
                  border: `1px solid ${isEnabled ? 'var(--sun)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  position: 'relative',
                  flexShrink: 0,
                  transition: 'background-color 150ms ease',
                  padding: 0,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: isEnabled ? 20 : 2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: isEnabled ? 'var(--void)' : 'var(--text-muted)',
                    transition: 'left 150ms ease',
                  }}
                />
              </button>
            ) : (
              <span
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                Instalar em /configuracoes
              </span>
            )}
          </div>
        );
      })}

      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '8px 0 0' }}>
        OAuth e credenciais são configurados em{' '}
        <span style={{ color: 'var(--text-secondary)' }}>/configuracoes</span>. Nenhum segredo é
        exposto no frontend.
      </p>
    </div>
  );
}
