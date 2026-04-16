'use client';

import { ClientAdmin } from '@/lib/client-types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}m`;
  const years = Math.floor(months / 12);
  return `${years}a`;
}

export default function ClientCard({
  client,
  documentCount,
  onSelect,
}: {
  client: ClientAdmin;
  documentCount: number;
  onSelect: (client: ClientAdmin) => void;
}) {
  const scoreColor =
    client.metrics.averageScore >= 4.0
      ? 'var(--sun)'
      : client.metrics.averageScore >= 3.0
        ? 'var(--text-secondary)'
        : 'var(--text-muted)';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(client)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(client);
        }
      }}
      style={{
        backgroundColor: 'var(--deep)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: 12,
        cursor: 'pointer',
        transition: 'border-color 150ms ease',
        outline: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--twilight)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.2)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header: color dot + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: client.color,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
          {client.name}
        </span>
      </div>

      {/* Description — single line, no truncation */}
      <span
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {client.description}
      </span>

      {/* Counters */}
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        {client.assignedSkills.length} skills · {documentCount} documentos
      </span>

      {/* Metrics */}
      <span style={{ fontSize: '0.65rem', color: scoreColor }}>
        &#9733; {client.metrics.averageScore.toFixed(1)} · {client.metrics.totalSessions} sessoes
      </span>

      {/* Last activity */}
      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
        Ultima atividade: ha {timeAgo(client.metrics.lastActivity)}
      </span>
    </div>
  );
}
