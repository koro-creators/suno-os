'use client';

/**
 * DriveTab — pasta do Drive da Suno configurada por cliente (recorte da SPEC-006).
 *
 * Fluxo: o admin compartilha a pasta do cliente com a service account (Leitor),
 * cola a URL aqui e sincroniza. Os docs entram na Biblioteca com scope do
 * cliente e alimentam o contexto do chat. Sem OAuth, sem tokens armazenados.
 */

import { useState, useEffect, useCallback } from 'react';
import { Checkmark, Copy, FolderOpen, Renew, TrashCan } from '@carbon/icons-react';
import {
  apiAvailable,
  getClientDrive,
  setClientDriveFolder,
  syncClientDrive,
  disconnectClientDrive,
  type ClientDriveStatus,
  type ClientDriveSyncResult,
} from '@/lib/api';

interface DriveTabProps {
  clientSlug: string;
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'nunca';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}m atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

export default function DriveTab({ clientSlug }: DriveTabProps) {
  const [status, setStatus] = useState<ClientDriveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [folderInput, setFolderInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<ClientDriveSyncResult | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    const s = await getClientDrive(clientSlug);
    setStatus(s);
    setLoading(false);
  }, [clientSlug]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSave = async () => {
    if (!folderInput.trim()) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSyncResult(null);
    try {
      await setClientDriveFolder(clientSlug, folderInput.trim());
      setFolderInput('');
      await fetchStatus();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao configurar a pasta.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    setSyncResult(null);
    try {
      const result = await syncClientDrive(clientSlug);
      setSyncResult(result);
      await fetchStatus();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao sincronizar.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setErrorMessage(null);
    setSyncResult(null);
    try {
      await disconnectClientDrive(clientSlug);
      await fetchStatus();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao remover a pasta.');
    }
  };

  const handleCopyEmail = async () => {
    if (!status?.sa_email) return;
    try {
      await navigator.clipboard.writeText(status.sa_email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível — sem feedback
    }
  };

  if (!apiAvailable()) {
    return (
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Backend não disponível (modo mock). Configure NEXT_PUBLIC_API_URL para usar o Drive.
      </p>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: 'var(--deep)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: 24,
          height: 140,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
        Fonte de contexto — pasta deste cliente no Drive da Suno. Os documentos sincronizados
        entram na Biblioteca com o escopo do cliente e alimentam o chat.
      </p>

      {/* Passo 1 — compartilhar com a service account */}
      <div
        style={{
          backgroundColor: 'var(--deep)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 6px' }}>
          1. Compartilhe a pasta com a conta de serviço (como Leitor)
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <code
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--nebula)',
              padding: '6px 10px',
              borderRadius: 8,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {status?.sa_email}
          </code>
          <button
            onClick={handleCopyEmail}
            aria-label="Copiar e-mail da conta de serviço"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'transparent',
              color: copied ? 'var(--sun)' : 'var(--text-secondary)',
              fontSize: '0.7rem',
              cursor: 'pointer',
              transition: 'color 150ms ease',
            }}
          >
            {copied ? <Checkmark size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Passo 2 — colar a URL da pasta */}
      {!status?.configured && (
        <div
          style={{
            backgroundColor: 'var(--deep)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: 16,
          }}
        >
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 6px' }}>
            2. Cole o link da pasta
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: '0.75rem',
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
            <button
              onClick={handleSave}
              disabled={isSaving || !folderInput.trim()}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: 'var(--sun)',
                color: '#000',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: isSaving || !folderInput.trim() ? 'not-allowed' : 'pointer',
                opacity: isSaving || !folderInput.trim() ? 0.5 : 1,
                transition: 'opacity 150ms ease',
              }}
            >
              {isSaving ? 'Validando…' : 'Conectar pasta'}
            </button>
          </div>
        </div>
      )}

      {/* Pasta conectada */}
      {status?.configured && (
        <div
          style={{
            backgroundColor: 'var(--deep)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <FolderOpen size={20} style={{ color: 'var(--sun)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {status.folder_name}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Último sync: {relativeTime(status.last_sync)}
              {status.doc_count != null && ` · ${status.doc_count} documento${status.doc_count === 1 ? '' : 's'}`}
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: 'var(--sun)',
              color: '#000',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              opacity: isSyncing ? 0.6 : 1,
            }}
          >
            <Renew size={14} />
            {isSyncing ? 'Sincronizando…' : 'Sincronizar'}
          </button>
          <button
            onClick={handleDisconnect}
            aria-label="Remover pasta"
            title="Remover pasta (documentos já sincronizados permanecem)"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: 8,
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <TrashCan size={14} />
          </button>
        </div>
      )}

      {/* Resultado do sync */}
      {syncResult && (
        <div
          role="status"
          style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(255,200,1,0.06)',
            border: '1px solid rgba(255,200,1,0.2)',
            borderRadius: 8,
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
          }}
        >
          Sync concluído: {syncResult.synced} novo{syncResult.synced === 1 ? '' : 's'},{' '}
          {syncResult.updated} atualizado{syncResult.updated === 1 ? '' : 's'}
          {syncResult.skipped > 0 &&
            ` · ${syncResult.skipped} sem texto extraível (entram só com link)`}
          {syncResult.truncated &&
            ' · pasta com mais arquivos que o limite por sync — rode novamente'}
        </div>
      )}

      {/* Erro */}
      {errorMessage && (
        <div
          role="alert"
          style={{
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
    </div>
  );
}
