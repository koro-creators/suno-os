'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Branch, CheckmarkFilled, Close, Edit, Flash, Idea, Link, Pause, Play, Tools, TouchInteraction, TrashCan } from '@carbon/icons-react';
import { Workflow, WorkflowStep } from '@/lib/workflow-types';
import { clients } from '@/data/clients';

/* ---------- helpers ---------- */

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

function humanizeCron(cron: string): string {
  const parts = cron.split(' ');
  if (parts.length < 5) return cron;
  const [, hour, dayOfMonth, , dayOfWeek] = parts;

  const h = hour !== '*' ? `${hour}h` : '';

  if (hour.startsWith('*/')) {
    const interval = hour.replace('*/', '');
    return `A cada ${interval}h`;
  }

  if (dayOfMonth === '*' && dayOfWeek === '*' && hour !== '*') {
    return `Diario ${h}`;
  }

  if (dayOfMonth !== '*' && dayOfWeek === '*') {
    return `Dia ${dayOfMonth}, ${h}`;
  }

  if (dayOfWeek !== '*' && dayOfMonth === '*') {
    const days = dayOfWeek.split(',').map((d) => WEEKDAYS[parseInt(d, 10)] ?? d).join(', ');
    return `${days} ${h}`.trim();
  }

  return cron;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `ha ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `ha ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ha 1d';
  if (days < 30) return `ha ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `ha ${months}m`;
  const years = Math.floor(months / 12);
  return `ha ${years}a`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  return `${mins}min ${secs % 60}s`;
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  tool: <Tools size={14} />,
  llm: <Idea size={14} />,
  hitl: <TouchInteraction size={14} />,
  condition: <Branch size={14} />,
  action: <Flash size={14} />,
  workflow: <Link size={14} />,
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--sun)',
  active: '#22C55E',
  paused: 'var(--text-muted)',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  paused: 'Pausado',
};

const RUN_COLORS: Record<string, string> = {
  completed: '#22C55E',
  failed: '#EF4444',
};

const RUN_LABELS: Record<string, string> = {
  completed: 'Sucesso',
  failed: 'Falhou',
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '0.55rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: 'var(--text-muted)',
  margin: '0 0 8px 0',
};

/* ---------- types ---------- */

interface WorkflowDrawerProps {
  workflow: Workflow | null;
  onClose: () => void;
  onRun: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

/* ---------- component ---------- */

export default function WorkflowDrawer({
  workflow,
  onClose,
  onRun,
  onToggleStatus,
  onDelete,
}: WorkflowDrawerProps) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (workflow) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [workflow, handleKeyDown]);

  if (!workflow) return null;

  const statusColor = STATUS_COLORS[workflow.status] || 'var(--text-muted)';
  const statusLabel = STATUS_LABELS[workflow.status] || workflow.status;
  const client = clients.find((c) => c.id === workflow.client_id);

  const scheduleLabel =
    workflow.schedule && workflow.schedule.enabled
      ? humanizeCron(workflow.schedule.cron)
      : 'Manual';

  // Mock: generate last 3 runs from last_run data
  const mockRuns: { date: string; status: string; duration: number }[] = [];
  if (workflow.last_run && workflow.last_run.completed_at) {
    const base = new Date(workflow.last_run.completed_at).getTime();
    mockRuns.push(
      { date: workflow.last_run.completed_at, status: workflow.last_run.status, duration: 45000 },
      { date: new Date(base - 7 * 24 * 60 * 60 * 1000).toISOString(), status: 'completed', duration: 38000 },
      { date: new Date(base - 14 * 24 * 60 * 60 * 1000).toISOString(), status: 'completed', duration: 52000 },
    );
  }

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose();
        }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 90,
          transition: 'opacity 200ms ease',
        }}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={workflow.name}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 480,
          maxWidth: '100vw',
          backgroundColor: 'var(--deep)',
          borderLeft: '1px solid var(--border-subtle)',
          zIndex: 91,
          display: 'flex',
          flexDirection: 'column',
          animation: 'wf-drawer-slide-in 200ms ease forwards',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              flex: 1,
              fontSize: '1.2rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {workflow.name}
          </h2>
          <span
            style={{
              fontSize: '0.55rem',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: 9999,
              color: statusColor,
              border: `1px solid ${statusColor}33`,
              backgroundColor: `${statusColor}11`,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {statusLabel}
          </span>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              borderRadius: 4,
              transition: 'color 150ms ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <Close size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Description */}
          {workflow.description && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {workflow.description}
            </p>
          )}

          {/* Client */}
          {client && (
            <div>
              <p style={sectionLabelStyle}>Cliente</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: client.color,
                    flexShrink: 0,
                  }}
                />
                {client.name}
              </span>
            </div>
          )}

          {/* Schedule */}
          <div>
            <p style={sectionLabelStyle}>Agendamento</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {scheduleLabel}
            </span>
            {workflow.schedule && workflow.schedule.enabled && (
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                ({workflow.schedule.timezone})
              </span>
            )}
          </div>

          {/* Steps */}
          <div>
            <p style={sectionLabelStyle}>Steps ({workflow.steps.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {workflow.steps.map((step: WorkflowStep, i: number) => (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    backgroundColor: 'var(--nebula)',
                    borderRadius: 6,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      minWidth: 16,
                      textAlign: 'center',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>
                    {STEP_ICONS[step.type] || <Flash size={14} />}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', flex: 1 }}>
                    {step.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.55rem',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {step.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Last runs */}
          {mockRuns.length > 0 && (
            <div>
              <p style={sectionLabelStyle}>Ultimas Execucoes</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {mockRuns.map((run, i) => {
                  const color = RUN_COLORS[run.status] ?? 'var(--text-muted)';
                  const label = RUN_LABELS[run.status] ?? run.status;
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '6px 10px',
                        backgroundColor: 'var(--nebula)',
                        borderRadius: 6,
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <CheckmarkFilled size={12} style={{ color, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', flex: 1 }}>
                        {timeAgo(run.date)}
                      </span>
                      <span
                        style={{
                          fontSize: '0.55rem',
                          fontWeight: 500,
                          padding: '1px 6px',
                          borderRadius: 9999,
                          color,
                          border: `1px solid ${color}33`,
                          backgroundColor: `${color}11`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {label}
                      </span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                        {formatDuration(run.duration)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Actions footer */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '14px 20px',
            borderTop: '1px solid var(--border-subtle)',
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          {/* Executar Agora */}
          <button
            onClick={() => onRun(workflow.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flex: 1,
              justifyContent: 'center',
              backgroundColor: 'var(--sun)',
              color: 'var(--void)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            <Play size={14} />
            Executar Agora
          </button>

          {/* Editar */}
          <button
            onClick={() => router.push(`/workflows/${workflow.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--twilight)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <Edit size={14} />
            Editar
          </button>

          {/* Pausar / Ativar */}
          <button
            onClick={() => onToggleStatus(workflow.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--twilight)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            {workflow.status === 'active' ? (
              <>
                <Pause size={14} />
                Pausar
              </>
            ) : (
              <>
                <Play size={14} />
                Ativar
              </>
            )}
          </button>

          {/* Excluir */}
          <button
            onClick={() => onDelete(workflow.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: '0.8rem',
              color: '#EF4444',
              cursor: 'pointer',
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#EF444466';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <TrashCan size={14} />
            Excluir
          </button>
        </div>

        {/* Slide-in animation */}
        <style>{`
          @keyframes wf-drawer-slide-in {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @media (max-width: 768px) {
            [role="dialog"][aria-modal="true"] {
              width: 60% !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}
