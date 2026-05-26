'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { AgentRun } from '@/lib/agents-types';
import { mockAgentRuns } from '@/data/agents-admin';

const PAGE_SIZE = 20;

type RunStatus = AgentRun['status'];

const STATUS_CONFIG: Record<RunStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pendente',  color: '#F59E0B', bg: '#F59E0B22' },
  running:   { label: 'Executando', color: '#3B82F6', bg: '#3B82F622' },
  completed: { label: 'Concluído', color: '#10B981', bg: '#10B98122' },
  failed:    { label: 'Falhou',    color: '#EF4444', bg: '#EF444422' },
  timed_out: { label: 'Timeout',   color: '#6B7280', bg: '#6B728022' },
};

function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const TRIGGER_LABELS: Record<AgentRun['triggered_by'], string> = {
  manual: 'Manual',
  schedule: 'Agendado',
  preview: 'Preview',
};

interface Props {
  agentId: string;
}

export default function AtividadeTab({ agentId }: Props) {
  const [page] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allRuns = mockAgentRuns[agentId] ?? [];
  const total = allRuns.length;
  const runs = allRuns.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (total === 0) {
    return (
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 16 }}>
        Nenhuma execução registrada.
      </p>
    );
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 16px' }}>
        {total} {total === 1 ? 'execução' : 'execuções'} registradas.
      </p>

      <div
        style={{
          backgroundColor: 'var(--deep)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 100px 80px 90px 100px',
            padding: '8px 14px',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '0.65rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
          }}
        >
          <span>Data / Hora</span>
          <span>Status</span>
          <span>Duração</span>
          <span>Trigger</span>
          <span>Cliente</span>
        </div>

        {runs.map((run, idx) => {
          const status = STATUS_CONFIG[run.status];
          const isExpanded = expandedId === run.id;
          const isLast = idx === runs.length - 1;

          return (
            <div key={run.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedId(isExpanded ? null : run.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedId(isExpanded ? null : run.id);
                  }
                }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 80px 90px 100px',
                  padding: '10px 14px',
                  borderBottom: isLast && !isExpanded ? 'none' : '1px solid var(--border-subtle)',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'background-color 150ms ease',
                  alignItems: 'center',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--nebula)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isExpanded ? (
                    <ChevronDown size={12} strokeWidth={1.5} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  ) : (
                    <ChevronRight size={12} strokeWidth={1.5} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  )}
                  {formatDatetime(run.started_at)}
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: status.color,
                    backgroundColor: status.bg,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                  }}
                >
                  {status.label}
                </span>
                <span>{formatDuration(run.duration_ms)}</span>
                <span>{TRIGGER_LABELS[run.triggered_by]}</span>
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {run.client_id ?? '—'}
                </span>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: 'var(--nebula)',
                    borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {run.error_message && (
                    <div>
                      <p style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', color: '#EF4444', margin: '0 0 4px' }}>
                        Erro
                      </p>
                      <p style={{ fontSize: '0.78rem', color: '#EF4444', margin: 0, fontFamily: 'monospace' }}>
                        {run.error_message}
                      </p>
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 4px' }}>
                      Input
                    </p>
                    <pre style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-secondary)',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: 120,
                      overflow: 'auto',
                    }}>
                      {JSON.stringify(run.input, null, 2).slice(0, 500)}
                      {JSON.stringify(run.input, null, 2).length > 500 ? '…' : ''}
                    </pre>
                  </div>
                  {run.output && (
                    <div>
                      <p style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 4px' }}>
                        Output
                      </p>
                      <pre style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-secondary)',
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: 120,
                        overflow: 'auto',
                      }}>
                        {JSON.stringify(run.output, null, 2).slice(0, 500)}
                        {JSON.stringify(run.output, null, 2).length > 500 ? '…' : ''}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {total > PAGE_SIZE && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 12 }}>
          Mostrando {Math.min(PAGE_SIZE, total)} de {total}. Paginação em desenvolvimento.
        </p>
      )}
    </div>
  );
}
