'use client';

import { useRouter } from 'next/navigation';
import { Layers, Play, Time } from '@carbon/icons-react';
import { Workflow } from '@/lib/workflow-types';
import { clients } from '@/data/clients';

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--text-muted)',
  active: '#22C55E',
  paused: '#F59E0B',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  paused: 'Pausado',
};

export default function WorkflowCard({ workflow }: { workflow: Workflow }) {
  const router = useRouter();
  const statusColor = STATUS_COLORS[workflow.status] || 'var(--text-muted)';
  const client = clients.find((c) => c.id === workflow.client_id);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/workflows/${workflow.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(`/workflows/${workflow.id}`);
      }}
      style={{
        backgroundColor: 'var(--deep)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: 16,
        cursor: 'pointer',
        transition: 'border-color 150ms ease',
        outline: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--twilight)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header: name + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
          {workflow.name}
        </span>
        <span
          style={{
            fontSize: '0.65rem',
            color: statusColor,
            backgroundColor: `${statusColor}15`,
            padding: '2px 8px',
            borderRadius: 9999,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {STATUS_LABELS[workflow.status] || workflow.status}
        </span>
      </div>

      {/* Client badge */}
      {client && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: '0.65rem',
            color: 'var(--text-secondary)',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: client.color,
              flexShrink: 0,
            }}
          />
          {client.name}
        </span>
      )}

      {/* Description */}
      <span
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: 1.4,
        }}
      >
        {workflow.description}
      </span>

      {/* Badges row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
          }}
        >
          <Layers size={12} />
          {workflow.steps_count} steps
        </span>
        {workflow.schedule && workflow.schedule.enabled && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.7rem',
              color: 'var(--sun)',
            }}
          >
            <Time size={12} />
            {workflow.schedule.cron}
          </span>
        )}
        {workflow.last_run && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.7rem',
              color: workflow.last_run.status === 'completed' ? '#22C55E' : workflow.last_run.status === 'failed' ? '#EF4444' : 'var(--text-muted)',
            }}
          >
            <Play size={12} />
            {workflow.last_run.status === 'completed' ? 'Sucesso' : workflow.last_run.status === 'failed' ? 'Falhou' : workflow.last_run.status}
          </span>
        )}
      </div>

      {/* Footer */}
      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
        por {workflow.created_by} · {new Date(workflow.updated_at).toLocaleDateString('pt-BR')}
      </span>
    </div>
  );
}
