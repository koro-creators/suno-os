'use client';

import { Document, InProgress, Renew, Time } from '@carbon/icons-react';

export interface DriveSyncStatusProps {
  lastSync: string | null;
  docCount: number;
  isSyncing: boolean;
  onSync: () => void;
  /** Whether a Drive connection exists at all (disables sync if false) */
  connected: boolean;
}

export default function DriveSyncStatus({
  lastSync,
  docCount,
  isSyncing,
  onSync,
  connected,
}: DriveSyncStatusProps) {
  const lastSyncFormatted = lastSync
    ? new Date(lastSync).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
    : 'Nunca';

  return (
    <div
      style={{
        backgroundColor: 'var(--deep)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Renew size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <h2
          style={{
            fontSize: '0.8rem',
            fontWeight: 500,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          Sync Status
        </h2>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        {/* Last sync */}
        <div
          style={{
            backgroundColor: 'var(--nebula)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Time size={12} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Última sincronização
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {lastSyncFormatted}
          </span>
        </div>

        {/* Doc count */}
        <div
          style={{
            backgroundColor: 'var(--nebula)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Document size={12} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Documentos indexados
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {docCount.toLocaleString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Sync button */}
      <div>
        <button
          onClick={onSync}
          disabled={isSyncing || !connected}
          title={!connected ? 'Conecte o Google Drive antes de sincronizar' : undefined}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'transparent',
            color: connected ? 'var(--text-secondary)' : 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: '0.75rem',
            fontWeight: 500,
            cursor: isSyncing || !connected ? 'not-allowed' : 'pointer',
            opacity: isSyncing || !connected ? 0.6 : 1,
            transition: 'color 150ms ease, border-color 150ms ease',
          }}
          onMouseEnter={(e) => {
            if (!isSyncing && connected) {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--twilight)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = connected ? 'var(--text-secondary)' : 'var(--text-muted)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          {isSyncing ? (
            <InProgress size={14} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Renew size={14} />
          )}
          {isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}
        </button>
      </div>
    </div>
  );
}
