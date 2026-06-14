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

/**
 * Tool steps wrap the tool's return value as `{ output: "<json string>" }`.
 * If that JSON has an image `url` (data URI or image file URL), return the
 * url plus a sanitized version of `output` for the raw JSON view — the
 * base64 payload of a data URI can be hundreds of KB and would otherwise
 * blow up the <pre> dump.
 */
function processOutput(output: unknown): { imageUrl: string | null; displayOutput: unknown } {
  if (!output || typeof output !== 'object') return { imageUrl: null, displayOutput: output };
  const inner = (output as { output?: unknown }).output;
  if (typeof inner !== 'string') return { imageUrl: null, displayOutput: output };

  let parsed: unknown;
  try {
    parsed = JSON.parse(inner);
  } catch {
    return { imageUrl: null, displayOutput: output };
  }
  if (!parsed || typeof parsed !== 'object') return { imageUrl: null, displayOutput: output };

  const url = (parsed as { url?: unknown }).url;
  if (typeof url !== 'string' || !(url.startsWith('data:image') || /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(url))) {
    return { imageUrl: null, displayOutput: output };
  }

  const sanitized = url.startsWith('data:image')
    ? { ...(parsed as Record<string, unknown>), url: `<imagem base64 omitida, ${url.length} caracteres>` }
    : parsed;
  return {
    imageUrl: url,
    displayOutput: { ...(output as Record<string, unknown>), output: JSON.stringify(sanitized, null, 2) },
  };
}

function StepLogItem({ log }: { log: StepLog }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = RUN_STATUS_CONFIG[log.status] || RUN_STATUS_CONFIG.pending;
  const hasResult = log.output != null || log.input != null;
  const { imageUrl, displayOutput } = processOutput(log.output);

  return (
    <div style={{ marginLeft: 14 }}>
      <div
        role={hasResult ? 'button' : undefined}
        tabIndex={hasResult ? 0 : undefined}
        onClick={hasResult ? () => setExpanded(!expanded) : undefined}
        onKeyDown={
          hasResult
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setExpanded(!expanded);
                }
              }
            : undefined
        }
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 12px',
          borderLeft: `2px solid ${cfg.color}`,
          cursor: hasResult ? 'pointer' : 'default',
          outline: 'none',
        }}
      >
        {hasResult ? (
          expanded ? (
            <ChevronDown size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          ) : (
            <ChevronRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          )
        ) : (
          <span style={{ width: 12, flexShrink: 0 }} />
        )}
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

      {expanded && (
        <div style={{ padding: '6px 12px 10px', marginLeft: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {log.input != null && (
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Input
              </span>
              <pre style={PRE_STYLE}>{JSON.stringify(log.input, null, 2)}</pre>
            </div>
          )}
          {log.output != null && (
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Resultado
              </span>
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Imagem gerada"
                  style={{
                    display: 'block',
                    maxWidth: '100%',
                    maxHeight: 320,
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    marginTop: 4,
                  }}
                />
              )}
              <pre style={PRE_STYLE}>{JSON.stringify(displayOutput, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const PRE_STYLE: React.CSSProperties = {
  margin: '4px 0 0',
  padding: '8px 10px',
  fontSize: '0.7rem',
  fontFamily: 'monospace',
  color: 'var(--text-secondary)',
  background: 'var(--void)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 8,
  overflowX: 'auto',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

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
