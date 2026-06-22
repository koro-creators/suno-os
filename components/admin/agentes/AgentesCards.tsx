'use client';

import { Agent, AgentStatus } from '@/lib/agents-types';

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'var(--text-muted)' },
  active: { label: 'Ativo', color: 'var(--sun)' },
  inactive: { label: 'Inativo', color: 'var(--text-secondary)' },
  archived: { label: 'Arquivado', color: 'var(--text-muted)' },
};

function formatLastRun(lastRunAt: string | null): string {
  if (!lastRunAt) return 'Nunca executado';
  const diff = Date.now() - new Date(lastRunAt).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'há 1d';
  if (days < 30) return `há ${days}d`;
  const months = Math.floor(days / 30);
  return `há ${months}m`;
}

interface AgentesCardsProps {
  agents: Agent[];
  onSelect: (agent: Agent) => void;
}

export default function AgentesCards({ agents, onSelect }: AgentesCardsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}
    >
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} onSelect={onSelect} />
      ))}
    </div>
  );
}

function AgentCard({ agent, onSelect }: { agent: Agent; onSelect: (a: Agent) => void }) {
  const status = STATUS_CONFIG[agent.status];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(agent)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(agent);
        }
      }}
      style={{
        backgroundColor: 'var(--deep)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: 16,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'border-color 150ms ease, background-color 150ms ease',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,200,1,0.4)';
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--nebula)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--deep)';
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Header: icon + name + status */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span
          style={{
            fontSize: 32,
            lineHeight: 1,
            flexShrink: 0,
            userSelect: 'none',
          }}
        >
          {agent.icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {agent.name}
          </div>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: status.color,
            }}
          >
            {status.label}
          </span>
        </div>
      </div>

      {/* Instructions preview */}
      <p
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          margin: 0,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: 1.5,
        }}
      >
        {agent.instructions ?? ''}
      </p>

      {/* Metadata row */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 10,
          marginTop: 2,
        }}
      >
        <span>
          {agent.skill_count} {agent.skill_count === 1 ? 'skill' : 'skills'}
        </span>
        <span>·</span>
        <span>
          {agent.client_count} {agent.client_count === 1 ? 'cliente' : 'clientes'}
        </span>
        <span style={{ marginLeft: 'auto' }}>{formatLastRun(agent.last_run_at)}</span>
      </div>
    </div>
  );
}
