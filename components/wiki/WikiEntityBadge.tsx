'use client';

/**
 * SPEC-015 — WikiEntityBadge: badge indicating entity origin.
 */

import type { EntityBadge } from '@/lib/onboarding-types';

interface Props {
  badge: EntityBadge;
}

const BADGE_CONFIG: Record<EntityBadge, { label: string; bg: string; color: string; border: string }> = {
  seed_auto: {
    label: 'Oráculo',
    bg: 'rgba(255,200,1,0.08)',
    color: 'var(--sun)',
    border: 'rgba(255,200,1,0.25)',
  },
  hitl: {
    label: 'Editado',
    bg: 'rgba(139,92,246,0.08)',
    color: '#8B5CF6',
    border: 'rgba(139,92,246,0.25)',
  },
  capture: {
    label: 'Capturado',
    bg: 'rgba(6,182,212,0.08)',
    color: '#06B6D4',
    border: 'rgba(6,182,212,0.25)',
  },
};

export default function WikiEntityBadge({ badge }: Props) {
  const config = BADGE_CONFIG[badge];
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 9999,
        fontSize: '0.62rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        flexShrink: 0,
      }}
    >
      {config.label}
    </span>
  );
}
