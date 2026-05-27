'use client';

import { useState } from 'react';
import { CheckmarkFilled, ChevronDown, ChevronRight, ErrorFilled, InProgress, Time } from '@carbon/icons-react';
import { WorkflowRun, StepLog } from '@/lib/workflow-types';

const RUN_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  completed: { color: '#22C55E', label: 'Concluido' },
  failed: { color: '#EF4444', label: 'Falhou' },
  running: { color: '#3B82F6', label: 'Executando' },
  paused: { color: '#F59E0B', label: 'Pausado' },
  pending: { color: 'var(--text-muted)', label: 'Pendente' },
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckmarkFilled size={14} style={{ color: '#22C55E' }} />;
  if (status === 'failed') return <ErrorFilled size={14} style={{ color: '#EF4444' }} />;
  if (status === 'running') return <InProgress size={14} style={{ color: '#3B82F6' }} />;
  if (status === 'paused') return <Time size={14} style={{ color: '#F59E0B' }} />;
  return <Time size={14} style={{ color: 'var(--text-muted)' }} />;
}

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return '-';
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const ms = end - start;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function StepLogItem({ log }: { log: StepLog }) {
  const cfg = RUN_STATUS_CONFIG[log.status] || RUN_STATUS_CONFIG.pending;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 12px',
        borderLeft: `2px solid ${cfg.color}`,
        marginLeft: 14,
      }}
    >
      <StatusIcon status={log.status} />
      <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', flex: 1 }}>
        {log.step_name || log.step_id}
      </span>
      {log.duration_ms != null && (
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{log.duration_ms}ms</span>
      )}
      {log.error && (
        <span style={{ fontSize: '0.65rem', color: '#EF4444', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {log.error}
        </span>
      )}
    </div>
  );
}

function RunItem({ run }: { run: WorkflowRun }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = RUN_STATUS_CONFIG[run.status] || RUN_STATUS_CONFIG.pending;

  return (
    <div
      style={{
        backgroundColor: 'var(--deep)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Run header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          cursor: 'pointer',
          transition: 'background-color 150ms ease',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--nebula)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
        }}
      >
        {expanded ? (
          <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        ) : (
          <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        )}
        <StatusIcon status={run.status} />
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 500,
            color: cfg.color,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {cfg.label}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flex: 1 }}>
          {run.trigger}
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {formatDuration(run.started_at, run.completed_at)}
        </span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          {run.started_at ? new Date(run.started_at).toLocaleString('pt-BR') : '-'}
        </span>
      </div>

      {/* Expanded step logs */}
      {expanded && (
        <div style={{ padding: '4px 0 10px', borderTop: '1px solid var(--border-subtle)' }}>
          {run.step_logs.length === 0 ? (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '8px 14px', margin: 0 }}>
              Sem logs de steps detalhados.
            </p>
          ) : (
            run.step_logs.map((log) => <StepLogItem key={log.id} log={log} />)
          )}
          {run.error && (
            <div style={{ padding: '8px 14px', marginLeft: 14 }}>
              <span style={{ fontSize: '0.7rem', color: '#EF4444' }}>Erro: {run.error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkflowRunTimeline({ runs }: { runs: WorkflowRun[] }) {
  if (runs.length === 0) {
    return (
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 48 }}>
        Nenhuma execucao encontrada.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {runs.map((run) => (
        <RunItem key={run.id} run={run} />
      ))}
    </div>
  );
}
