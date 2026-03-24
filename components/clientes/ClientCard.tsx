'use client';

import { useRouter } from 'next/navigation';
import { ClientAdmin } from '@/lib/client-types';

export default function ClientCard({
  client,
  documentCount,
}: {
  client: ClientAdmin;
  documentCount: number;
}) {
  const router = useRouter();

  const scoreColor =
    client.metrics.averageScore >= 4.0
      ? 'var(--sun)'
      : client.metrics.averageScore >= 3.0
        ? 'var(--text-secondary)'
        : 'var(--text-muted)';

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/clientes/${client.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(`/clientes/${client.id}`);
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
        gap: 8,
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

      {/* Description */}
      <span
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
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
        ★ {client.metrics.averageScore.toFixed(1)} · {client.metrics.totalSessions} sessões
      </span>

      {/* Footer */}
      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
        Contato: {client.contact}
      </span>
    </div>
  );
}
