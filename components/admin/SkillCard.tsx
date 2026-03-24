'use client';

import { useRouter } from 'next/navigation';
import { SkillAdmin } from '@/lib/admin-types';

const TYPE_COLORS: Record<string, string> = {
  criacao: 'var(--criacao)',
  midia: 'var(--midia)',
  planejamento: 'var(--planejamento)',
};

const TYPE_LABELS: Record<string, string> = {
  criacao: 'Criação',
  midia: 'Mídia',
  planejamento: 'Planejamento',
};

const STATUS_STYLES: Record<string, { color: string; border: string }> = {
  active: { color: '#10B981', border: '#10B98140' },
  draft: { color: 'var(--sun)', border: 'rgba(255,200,1,0.25)' },
  archived: { color: 'var(--text-muted)', border: 'var(--border-subtle)' },
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  draft: 'Rascunho',
  archived: 'Arquivado',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'hoje';
  if (days === 1) return 'há 1d';
  if (days < 30) return `há ${days}d`;
  const months = Math.floor(days / 30);
  return `há ${months}m`;
}

export default function SkillCard({ skill }: { skill: SkillAdmin }) {
  const router = useRouter();
  const typeColor = TYPE_COLORS[skill.type];
  const statusStyle = STATUS_STYLES[skill.status];
  const currentVersion = skill.versions[0]?.version ?? 1;

  const scoreColor =
    skill.totalFeedbacks === 0
      ? 'var(--text-muted)'
      : skill.averageScore >= 4.0
        ? 'var(--sun)'
        : skill.averageScore >= 3.0
          ? 'var(--text-secondary)'
          : 'var(--text-muted)';

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/skills/${skill.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(`/skills/${skill.id}`);
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
      {/* Header: dot + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: typeColor,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
          {skill.name}
        </span>
      </div>

      {/* Type + Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontSize: '0.6rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: typeColor,
          }}
        >
          {TYPE_LABELS[skill.type]}
        </span>
        <span
          style={{
            fontSize: '0.55rem',
            padding: '1px 6px',
            borderRadius: 9999,
            border: `1px solid ${statusStyle.border}`,
            color: statusStyle.color,
          }}
        >
          {STATUS_LABELS[skill.status]}
        </span>
      </div>

      {/* Counters */}
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        {skill.assignedClients.length} clientes · {skill.moons.length} moons
      </span>

      {/* Score */}
      <span style={{ fontSize: '0.65rem', color: scoreColor }}>
        {skill.totalFeedbacks > 0
          ? `★ ${skill.averageScore.toFixed(1)} · ${skill.totalFeedbacks} feedbacks`
          : 'Sem avaliações'
        }
      </span>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
        }}
      >
        <span>Editado {timeAgo(skill.updatedAt)}</span>
        <span>v{currentVersion}</span>
      </div>
    </div>
  );
}
