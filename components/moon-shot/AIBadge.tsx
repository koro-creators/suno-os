'use client';

/**
 * AIBadge — marcação visual obrigatória de outputs gerados por IA.
 *
 * Atende RN-014 (BRD Parte 4) e FR-012 (SPEC-004 Moon Shot).
 *
 * Estados:
 *  - 'faisca'    → output bruto da IA (estímulo, não peça final). Cor: --sun (amarelo).
 *  - 'brasa'     → output editado/integrado pelo creator. Cor: laranja.
 *  - 'validado'  → output aprovado e integrado em entregável final. Cor: verde.
 *
 * Vocabulário Suno: Faísca → Brasa → Validado (Glossário §1).
 */

import { CheckmarkFilled, Fire, Star } from '@carbon/icons-react';

export type AIBadgeState = 'faisca' | 'brasa' | 'validado';
export type AIBadgeSize = 'small' | 'medium';

interface AIBadgeProps {
  state: AIBadgeState;
  size?: AIBadgeSize;
  showLabel?: boolean;
  tooltip?: string;
}

const STATE_CONFIG: Record<
  AIBadgeState,
  { label: string; color: string; bg: string; Icon: typeof Star; defaultTooltip: string }
> = {
  faisca: {
    label: 'Faísca',
    color: 'var(--sun)',
    bg: 'rgba(255, 200, 1, 0.12)',
    Icon: Star,
    defaultTooltip: 'Estímulo gerado por IA — matéria-prima para o creator. Não é peça final.',
  },
  brasa: {
    label: 'Brasa',
    color: '#F97316',
    bg: 'rgba(249, 115, 22, 0.12)',
    Icon: Fire,
    defaultTooltip: 'Output editado e integrado pelo creator — em refinamento.',
  },
  validado: {
    label: 'Validado',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
    Icon: CheckmarkFilled,
    defaultTooltip: 'Output aprovado e integrado em entregável final.',
  },
};

export default function AIBadge({
  state,
  size = 'small',
  showLabel = true,
  tooltip,
}: AIBadgeProps) {
  const cfg = STATE_CONFIG[state];
  const iconSize = size === 'small' ? 12 : 14;
  const fontSize = size === 'small' ? 11 : 12;
  const padX = size === 'small' ? 6 : 8;
  const padY = size === 'small' ? 2 : 4;

  return (
    <span
      role="img"
      aria-label={`Output IA — estado ${cfg.label}`}
      title={tooltip ?? cfg.defaultTooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: `${padY}px ${padX}px`,
        backgroundColor: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}33`,
        borderRadius: 9999,
        fontSize,
        fontWeight: 500,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        cursor: tooltip || cfg.defaultTooltip ? 'help' : 'default',
        transition: 'all 150ms ease',
      }}
    >
      <cfg.Icon size={iconSize} />
      {showLabel && <span>{cfg.label}</span>}
    </span>
  );
}
