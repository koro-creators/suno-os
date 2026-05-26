'use client';

/**
 * /configuracoes/drive — Google Drive OAuth configuration page.
 *
 * Caixa-preta / RBAC: This path is registered as admin-only in AuthGuard.
 * Non-admin users are redirected to / (not /404, not "acesso negado").
 *
 * SPEC-006 FA-14 Phase 18 scaffolding.
 * Real OAuth credentials are not yet configured — stubs will show the UI
 * shape correctly. The "Conectar" button will redirect to a placeholder URL
 * until GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET are set in api/.env.
 */

import { useState, useEffect, useCallback } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import DriveConnectionCard from '@/components/drive/DriveConnectionCard';
import DriveSyncStatus from '@/components/drive/DriveSyncStatus';
import {
  apiAvailable,
  getDriveStatus,
  startDriveAuth,
  triggerDriveSync,
  disconnectDrive,
  type DriveStatusResponse,
} from '@/lib/api';

const MOCK_STATUS: DriveStatusResponse = {
  connected: false,
  email: null,
  last_sync: null,
  doc_count: 0,
};

export default function DriveConfigPage() {
  const [status, setStatus] = useState<DriveStatusResponse>(MOCK_STATUS);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch Drive status on mount
  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    setErrorMessage(null);
    try {
      const s = await getDriveStatus();
      setStatus(s);
    } catch {
      setErrorMessage('Não foi possível carregar o status do Drive.');
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Connect: initiate OAuth flow
  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMessage(null);
    try {
      const { auth_url } = await startDriveAuth();
      const isPlaceholder =
        !auth_url ||
        auth_url === '#mock-oauth-not-available' ||
        auth_url === '#oauth-not-configured';
      if (!isPlaceholder) {
        window.location.href = auth_url;
      } else {
        // Backend sentinel or mock-mode: credentials not configured yet
        setErrorMessage(
          apiAvailable()
            ? 'Credenciais OAuth não configuradas. Configure GOOGLE_OAUTH_CLIENT_ID e GOOGLE_OAUTH_CLIENT_SECRET em api/.env.'
            : 'Backend não disponível (modo mock). Configure NEXT_PUBLIC_API_URL para conectar.',
        );
      }
    } catch {
      setErrorMessage('Erro ao iniciar autenticação. Tente novamente.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect: revoke OAuth token
  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setErrorMessage(null);
    try {
      await disconnectDrive();
      setStatus(MOCK_STATUS);
    } catch {
      setErrorMessage('Erro ao desconectar. Tente novamente.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Manual sync trigger
  const handleSync = async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      await triggerDriveSync();
      // Refetch status to get updated last_sync / doc_count after brief delay
      setTimeout(() => {
        fetchStatus();
      }, 1500);
    } catch {
      setErrorMessage('Erro ao iniciar sincronização. Tente novamente.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: 'Configurações', href: '/configuracoes' },
          { label: 'Google Drive', href: '/configuracoes/drive' },
        ]}
        rightLabel="Admin"
      />

      <main
        id="main-content"
        className="page-enter"
        style={{ flex: 1, overflow: 'auto', padding: 24 }}
      >
        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 300,
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Google Drive
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Fonte de contexto — Drive interno @sunounited
          </p>
        </div>

        {/* Loading skeleton */}
        {loadingStatus && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 16,
            }}
          >
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{
                  backgroundColor: 'var(--deep)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  padding: 24,
                  height: 160,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        )}

        {/* Cards */}
        {!loadingStatus && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 16,
            }}
          >
            <DriveConnectionCard
              connected={status.connected}
              email={status.email}
              lastSync={status.last_sync}
              isLoading={isConnecting || isDisconnecting}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />

            <DriveSyncStatus
              connected={status.connected}
              lastSync={status.last_sync}
              docCount={status.doc_count}
              isSyncing={isSyncing}
              onSync={handleSync}
            />
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div
            role="alert"
            style={{
              marginTop: 16,
              padding: '10px 14px',
              backgroundColor: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8,
              fontSize: '0.75rem',
              color: '#f87171',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Scaffolding notice */}
        <div
          style={{
            marginTop: 24,
            padding: '10px 14px',
            backgroundColor: 'rgba(255,200,1,0.04)',
            border: '1px solid rgba(255,200,1,0.12)',
            borderRadius: 8,
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
          }}
        >
          <strong style={{ color: 'var(--sun)' }}>Phase 18 scaffolding</strong> — OAuth flow está
          implementado mas o handshake real requer credenciais configuradas no backend (
          <code style={{ fontSize: '0.68rem' }}>GOOGLE_OAUTH_CLIENT_ID</code> +{' '}
          <code style={{ fontSize: '0.68rem' }}>GOOGLE_OAUTH_CLIENT_SECRET</code> em{' '}
          <code style={{ fontSize: '0.68rem' }}>api/.env</code>). Veja SPEC-006 FA-14.
        </div>
      </main>
    </>
  );
}
