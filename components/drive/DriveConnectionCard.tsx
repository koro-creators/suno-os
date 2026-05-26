'use client';

import { HardDrive, LinkIcon, Unlink, Loader2 } from 'lucide-react';

export interface DriveConnectionCardProps {
  connected: boolean;
  email: string | null;
  lastSync: string | null;
  isLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function DriveConnectionCard({
  connected,
  email,
  lastSync,
  isLoading,
  onConnect,
  onDisconnect,
}: DriveConnectionCardProps) {
  const lastSyncFormatted = lastSync
    ? new Date(lastSync).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : null;

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
        <HardDrive size={14} strokeWidth={1.5} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <h2
          style={{
            fontSize: '0.8rem',
            fontWeight: 500,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          Status da conexão
        </h2>
        {connected && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '0.65rem',
              color: '#4ade80',
              backgroundColor: 'rgba(74,222,128,0.08)',
              border: '1px solid rgba(74,222,128,0.2)',
              borderRadius: 9999,
              padding: '2px 8px',
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Conectado
          </span>
        )}
        {!connected && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--nebula)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 9999,
              padding: '2px 8px',
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Desconectado
          </span>
        )}
      </div>

      {/* Body */}
      {connected && email ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
            {email}
          </p>
          {lastSyncFormatted && (
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
              Última sincronização: {lastSyncFormatted}
            </p>
          )}
        </div>
      ) : (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
          Nenhuma conta Google Drive conectada. Apenas contas{' '}
          <span style={{ color: 'var(--text-secondary)' }}>@sunounited.com</span> são aceitas.
        </p>
      )}

      {/* Action */}
      <div>
        {!connected ? (
          <button
            onClick={onConnect}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'var(--sun)',
              color: 'var(--void)',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'opacity 150ms ease',
            }}
          >
            {isLoading ? (
              <Loader2 size={14} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <LinkIcon size={14} strokeWidth={1.5} />
            )}
            Conectar Google Drive (@sunounited)
          </button>
        ) : (
          <button
            onClick={onDisconnect}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'color 150ms ease, border-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--twilight)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            {isLoading ? (
              <Loader2 size={14} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Unlink size={14} strokeWidth={1.5} />
            )}
            Desconectar
          </button>
        )}
      </div>
    </div>
  );
}
