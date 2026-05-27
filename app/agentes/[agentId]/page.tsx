'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Play, Close } from '@carbon/icons-react';
import AppHeader from '@/components/layout/AppHeader';
import AgenteEditorTabs from '@/components/admin/agentes/AgenteEditorTabs';
import { useAgents } from '@/contexts/AgentsContext';
import { AgentRun } from '@/lib/agents-types';

const ACTIVE_STATUSES: AgentRun['status'][] = ['pending', 'running'];

export default function AgentEditorPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { agents, runAgent, listRuns } = useAgents();

  const agent = agents.find((a) => a.id === agentId);

  // Preview panel state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewInput, setPreviewInput] = useState('');
  const [previewRunId, setPreviewRunId] = useState<string | null>(null);
  const [previewRun, setPreviewRun] = useState<AgentRun | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    if (!previewRunId || !agentId) return;

    const check = () => {
      const run = listRuns(agentId).find((r) => r.id === previewRunId);
      setPreviewRun(run ?? null);
      if (run && !ACTIVE_STATUSES.includes(run.status)) clearPoll();
    };

    check();
    pollRef.current = setInterval(check, 2000);
    return clearPoll;
  }, [previewRunId, agentId, listRuns]);

  const handlePreviewSubmit = () => {
    if (!agentId || !previewInput.trim()) return;
    setIsSubmitting(true);
    setPreviewRun(null);
    const { run_id } = runAgent(agentId, previewInput.trim(), 'preview');
    setPreviewRunId(run_id);
    setIsSubmitting(false);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    clearPoll();
    setPreviewRunId(null);
    setPreviewRun(null);
    setPreviewInput('');
    setIsSubmitting(false);
  };

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

  const isRunning = previewRun && ACTIVE_STATUSES.includes(previewRun.status);
  const outputText =
    previewRun?.output && typeof previewRun.output.text === 'string'
      ? previewRun.output.text
      : null;

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
        style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column' }}
      >
        {/* Editor header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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

          {/* Preview button */}
          <button
            onClick={() => setPreviewOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--sun)',
              color: '#000',
              border: 'none',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 150ms ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '0.85';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            }}
          >
            <Play size={14} />
            Preview
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', gap: 20, minHeight: 0 }}>
          {/* Editor tabs */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <AgenteEditorTabs agent={agent} />
          </div>

          {/* Preview panel */}
          {previewOpen && (
            <div
              style={{
                width: 360,
                flexShrink: 0,
                backgroundColor: 'var(--deep)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Panel header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <span
                  style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}
                >
                  Preview / Testar
                </span>
                <button
                  onClick={handlePreviewClose}
                  aria-label="Fechar preview"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 4,
                    transition: 'color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                  }}
                >
                  <Close size={16} />
                </button>
              </div>

              {/* Input area */}
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label
                  style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                >
                  Input
                </label>
                <textarea
                  value={previewInput}
                  onChange={(e) => setPreviewInput(e.target.value)}
                  placeholder="Digite uma instrução para o agente..."
                  rows={4}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--nebula)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)',
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    transition: 'border-color 150ms ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--twilight)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePreviewSubmit();
                  }}
                />
                <button
                  onClick={handlePreviewSubmit}
                  disabled={!previewInput.trim() || isSubmitting || !!isRunning}
                  style={{
                    background: 'var(--sun)',
                    color: '#000',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: !previewInput.trim() || isSubmitting || isRunning ? 'not-allowed' : 'pointer',
                    opacity: !previewInput.trim() || isSubmitting || isRunning ? 0.5 : 1,
                    transition: 'opacity 150ms ease',
                    alignSelf: 'flex-end',
                  }}
                >
                  {isRunning ? 'Executando…' : 'Executar'}
                </button>
              </div>

              {/* Output area */}
              {previewRun && (
                <div
                  style={{
                    flex: 1,
                    padding: '0 16px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    overflow: 'auto',
                  }}
                >
                  <div
                    style={{
                      height: 1,
                      backgroundColor: 'var(--border-subtle)',
                      margin: '0 0 8px',
                    }}
                  />

                  {isRunning && (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: '#3B82F6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#3B82F6',
                          animation: 'pulse 1s ease-in-out infinite',
                        }}
                      />
                      {previewRun.status === 'pending' ? 'Aguardando…' : 'Processando…'}
                    </div>
                  )}

                  {previewRun.status === 'failed' && (
                    <div>
                      <p
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          color: '#EF4444',
                          margin: '0 0 4px',
                        }}
                      >
                        Erro
                      </p>
                      <p
                        style={{
                          fontSize: '0.78rem',
                          color: '#EF4444',
                          margin: 0,
                          fontFamily: 'monospace',
                          wordBreak: 'break-word',
                        }}
                      >
                        {previewRun.error_message ?? 'Falha desconhecida'}
                      </p>
                    </div>
                  )}

                  {outputText && (
                    <div>
                      <p
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          color: 'var(--text-muted)',
                          margin: '0 0 4px',
                        }}
                      >
                        Resposta · {previewRun.duration_ms != null ? `${(previewRun.duration_ms / 1000).toFixed(1)}s` : ''}
                      </p>
                      <p
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-primary)',
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.6,
                        }}
                      >
                        {outputText}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </>
  );
}
