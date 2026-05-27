'use client';

/**
 * Drive Suno — Cleanup Report + Curadoria de Sugestões (Phase 18 / SPEC-006).
 *
 * Acesso restrito a Líder e Admin (isAdmin).
 * Caixa-preta (RN-009/011): não-admin é redirecionado para /404 sem mensagem
 * de "acesso negado" — não revela existência da rota.
 *
 * Mock-mode degradation: quando NEXT_PUBLIC_API_URL não está configurado,
 * a página renderiza dados locais sem chamadas ao backend (padrão apiAvailable()).
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CloudUpload,
  Warning,
  CheckmarkFilled,
  Close,
  Time,
  CloudOffline,
} from '@carbon/icons-react';
import AppHeader from '@/components/layout/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { apiAvailable, getApiUrl } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CleanupSummary {
  duplicates: number;
  no_access: number;
  outdated: number;
  total_issues: number;
}

interface DuplicateFile {
  id: string;
  name: string;
  copies: number;
  latest_at?: string;
}

interface NoAccessFile {
  id: string;
  name: string;
  owner?: string;
}

interface OutdatedFile {
  id: string;
  name: string;
  days_stale: number;
  last_modified?: string;
}

interface CleanupReport {
  generated_at: string;
  summary: CleanupSummary;
  duplicates: DuplicateFile[];
  no_access: NoAccessFile[];
  outdated: OutdatedFile[];
}

interface CurationSuggestion {
  id: string;
  file_id: string;
  file_name: string;
  relevance: 'high' | 'medium' | 'low';
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
}

// ---------------------------------------------------------------------------
// Mock data (fallback when API not available)
// ---------------------------------------------------------------------------

const MOCK_CLEANUP: CleanupReport = {
  generated_at: new Date().toISOString(),
  summary: { duplicates: 3, no_access: 2, outdated: 5, total_issues: 10 },
  duplicates: [
    { id: 'd1', name: 'Briefing Santander Q1.pdf', copies: 2, latest_at: '2026-04-10T14:00:00Z' },
    { id: 'd2', name: 'Plano de Mídia Maio.xlsx', copies: 3, latest_at: '2026-05-01T09:00:00Z' },
    { id: 'd3', name: 'Copy Instagram Semana 14.docx', copies: 2, latest_at: '2026-05-18T11:00:00Z' },
  ],
  no_access: [
    { id: 'n1', name: 'Estratégia 2025 (restrito).pdf', owner: 'externo@cliente.com' },
    { id: 'n2', name: 'Contrato NDA.docx', owner: 'juridico@suno.com.br' },
  ],
  outdated: [
    { id: 'o1', name: 'Persona Ana (2024).pdf', days_stale: 345 },
    { id: 'o2', name: 'Briefing Q3 2024.pptx', days_stale: 267 },
    { id: 'o3', name: 'Calendário Editorial Jan.xlsx', days_stale: 115 },
    { id: 'o4', name: 'Guia de Voz Suno 2023.pdf', days_stale: 541 },
    { id: 'o5', name: 'Benchmarking Concorrentes.pptx', days_stale: 72 },
  ],
};

const MOCK_SUGGESTIONS: CurationSuggestion[] = [
  {
    id: 'sug-1',
    file_id: 'file-s1',
    file_name: 'Briefing Santander Q2 2026.pdf',
    relevance: 'high',
    reason: 'Briefing recente com dados de campanha',
    status: 'pending',
  },
  {
    id: 'sug-2',
    file_id: 'file-s2',
    file_name: 'Personas Atualizadas Maio 2026.pptx',
    relevance: 'high',
    reason: 'Personas atualizadas — substitui versão de 2024',
    status: 'pending',
  },
  {
    id: 'sug-3',
    file_id: 'file-s3',
    file_name: 'Tom de Voz Global Suno.pdf',
    relevance: 'medium',
    reason: 'Guia de tom aplicável a todos os clientes',
    status: 'pending',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relevancePill(relevance: CurationSuggestion['relevance']) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    high: { label: 'Alta', color: 'var(--sun)', bg: 'rgba(255,200,1,0.12)' },
    medium: { label: 'Média', color: 'var(--text-secondary)', bg: 'var(--nebula)' },
    low: { label: 'Baixa', color: 'var(--text-muted)', bg: 'var(--nebula)' },
  };
  const { label, color, bg } = map[relevance] ?? map.low;
  return (
    <span
      style={{
        fontSize: '0.65rem',
        fontWeight: 600,
        color,
        background: bg,
        borderRadius: 9999,
        padding: '2px 8px',
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--deep)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flex: '1 1 160px',
      }}
    >
      <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: '0.8rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        margin: '0 0 12px',
      }}
    >
      {children}
    </h2>
  );
}

function FileRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        fontSize: '0.8rem',
        color: 'var(--text-primary)',
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DrivePage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();

  const [cleanup, setCleanup] = useState<CleanupReport | null>(null);
  const [suggestions, setSuggestions] = useState<CurationSuggestion[]>([]);
  const [loadingCleanup, setLoadingCleanup] = useState(true);
  const [loadingSugg, setLoadingSugg] = useState(true);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  // Caixa-preta: redirect 404 para não-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/404');
    }
  }, [authLoading, isAdmin, router]);

  // Fetch cleanup report
  useEffect(() => {
    async function fetchCleanup() {
      if (!apiAvailable()) {
        setCleanup(MOCK_CLEANUP);
        setLoadingCleanup(false);
        return;
      }
      try {
        const res = await fetch(getApiUrl('/api/drive/cleanup-report'), {
          headers: { 'X-User-ID': 'dev-user' },
        });
        if (res.ok) {
          setCleanup(await res.json());
        } else {
          setCleanup(MOCK_CLEANUP);
        }
      } catch {
        setCleanup(MOCK_CLEANUP);
      } finally {
        setLoadingCleanup(false);
      }
    }
    if (!authLoading && isAdmin) fetchCleanup();
  }, [authLoading, isAdmin]);

  // Fetch curation suggestions
  useEffect(() => {
    async function fetchSuggestions() {
      if (!apiAvailable()) {
        setSuggestions(MOCK_SUGGESTIONS);
        setLoadingSugg(false);
        return;
      }
      try {
        const res = await fetch(getApiUrl('/api/drive/curation-suggestions'), {
          headers: { 'X-User-ID': 'dev-user' },
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions ?? []);
        } else {
          setSuggestions(MOCK_SUGGESTIONS);
        }
      } catch {
        setSuggestions(MOCK_SUGGESTIONS);
      } finally {
        setLoadingSugg(false);
      }
    }
    if (!authLoading && isAdmin) fetchSuggestions();
  }, [authLoading, isAdmin]);

  async function handleDecision(suggestionId: string, status: 'accepted' | 'rejected') {
    setDecidingId(suggestionId);
    if (apiAvailable()) {
      try {
        await fetch(getApiUrl(`/api/drive/curation-suggestions/${suggestionId}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-User-ID': 'dev-user' },
          body: JSON.stringify({ status }),
        });
      } catch {
        // swallow — optimistic update is applied below regardless
      }
    }
    setSuggestions((prev) =>
      prev.map((s) => (s.id === suggestionId ? { ...s, status } : s)),
    );
    setDecidingId(null);
  }

  if (authLoading) {
    return (
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
        }}
      >
        Carregando…
      </main>
    );
  }

  if (!isAdmin) return null;

  return (
    <>
      <AppHeader
        breadcrumbs={[{ label: 'Drive Suno', href: '/drive' }]}
        rightLabel="Admin"
      />
      <main
        id="main-content"
        className="page-enter"
        style={{ flex: 1, overflow: 'auto', padding: 24 }}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                            */}
        {/* ---------------------------------------------------------------- */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 4,
            }}
          >
            <CloudUpload size={20} style={{ color: 'var(--sun)', flexShrink: 0 }} />
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 300,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Drive Suno
            </h1>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 30px' }}>
            {apiAvailable()
              ? 'Conectado ao backend — dados reais via Drive API.'
              : 'Modo mock — configure NEXT_PUBLIC_API_URL para dados reais.'}
          </p>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Cleanup Report                                                    */}
        {/* ---------------------------------------------------------------- */}
        <section style={{ marginBottom: 40 }}>
          <SectionTitle>Cleanup Report</SectionTitle>

          {loadingCleanup ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Carregando relatório…</p>
          ) : cleanup ? (
            <>
              {/* Summary cards */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                <SummaryCard
                  label="Duplicatas"
                  value={cleanup.summary.duplicates}
                  icon={<Warning size={18} />}
                />
                <SummaryCard
                  label="Sem acesso"
                  value={cleanup.summary.no_access}
                  icon={<CloudOffline size={18} />}
                />
                <SummaryCard
                  label="Desatualizados"
                  value={cleanup.summary.outdated}
                  icon={<Time size={18} />}
                />
                <SummaryCard
                  label="Total de problemas"
                  value={cleanup.summary.total_issues}
                  icon={<Warning size={18} />}
                />
              </div>

              {/* Duplicatas */}
              {cleanup.duplicates.length > 0 && (
                <div
                  style={{
                    background: 'var(--deep)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      padding: '10px 16px',
                      background: 'var(--nebula)',
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Warning size={14} />
                    Arquivos duplicados
                  </div>
                  {cleanup.duplicates.map((file) => (
                    <FileRow key={file.id}>
                      <Warning size={14} style={{ color: 'var(--sun)', flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{file.name}</span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          background: 'var(--nebula)',
                          borderRadius: 9999,
                          padding: '2px 8px',
                        }}
                      >
                        {file.copies} cópias
                      </span>
                    </FileRow>
                  ))}
                </div>
              )}

              {/* Sem acesso */}
              {cleanup.no_access.length > 0 && (
                <div
                  style={{
                    background: 'var(--deep)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      padding: '10px 16px',
                      background: 'var(--nebula)',
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <CloudOffline size={14} />
                    Sem acesso
                  </div>
                  {cleanup.no_access.map((file) => (
                    <FileRow key={file.id}>
                      <CloudOffline size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{file.name}</span>
                      {file.owner && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {file.owner}
                        </span>
                      )}
                    </FileRow>
                  ))}
                </div>
              )}

              {/* Desatualizados */}
              {cleanup.outdated.length > 0 && (
                <div
                  style={{
                    background: 'var(--deep)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 16px',
                      background: 'var(--nebula)',
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Time size={14} />
                    Arquivos desatualizados
                  </div>
                  {cleanup.outdated.map((file) => (
                    <FileRow key={file.id}>
                      <Time size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{file.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {file.days_stale}d sem atualização
                      </span>
                    </FileRow>
                  ))}
                </div>
              )}

              <p
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginTop: 10,
                  textAlign: 'right',
                }}
              >
                Relatório gerado em{' '}
                {new Date(cleanup.generated_at).toLocaleString('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </p>
            </>
          ) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Não foi possível carregar o relatório.
            </p>
          )}
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Curadoria de Sugestões                                           */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <SectionTitle>Curadoria de Sugestões</SectionTitle>
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              margin: '0 0 16px',
            }}
          >
            Arquivos sugeridos para ingestão na Biblioteca. Aceite ou rejeite cada item.
          </p>

          {loadingSugg ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Carregando sugestões…
            </p>
          ) : suggestions.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Nenhuma sugestão pendente.
            </p>
          ) : (
            <div
              style={{
                background: 'var(--deep)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {suggestions.map((sug, idx) => (
                <div
                  key={sug.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom:
                      idx < suggestions.length - 1
                        ? '1px solid var(--border-subtle)'
                        : 'none',
                    opacity: sug.status !== 'pending' ? 0.55 : 1,
                    transition: 'opacity 150ms ease',
                  }}
                >
                  {/* File info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-primary)',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {sug.file_name}
                      </span>
                      {relevancePill(sug.relevance)}
                    </div>
                    <p
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        margin: 0,
                      }}
                    >
                      {sug.reason}
                    </p>
                  </div>

                  {/* Status badge or action buttons */}
                  {sug.status === 'accepted' ? (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.72rem',
                        color: '#4ade80',
                        flexShrink: 0,
                      }}
                    >
                      <CheckmarkFilled size={14} />
                      Aceito
                    </span>
                  ) : sug.status === 'rejected' ? (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    >
                      <Close size={14} />
                      Rejeitado
                    </span>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => handleDecision(sug.id, 'accepted')}
                        disabled={decidingId === sug.id}
                        aria-label={`Aceitar ${sug.file_name}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '5px 12px',
                          borderRadius: 8,
                          border: '1px solid rgba(74,222,128,0.3)',
                          background: 'rgba(74,222,128,0.08)',
                          color: '#4ade80',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          transition: 'background 150ms ease',
                        }}
                      >
                        <CheckmarkFilled size={14} />
                        Aceitar
                      </button>
                      <button
                        onClick={() => handleDecision(sug.id, 'rejected')}
                        disabled={decidingId === sug.id}
                        aria-label={`Rejeitar ${sug.file_name}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '5px 12px',
                          borderRadius: 8,
                          border: '1px solid rgba(239,68,68,0.3)',
                          background: 'rgba(239,68,68,0.08)',
                          color: '#f87171',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          transition: 'background 150ms ease',
                        }}
                      >
                        <Close size={14} />
                        Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
