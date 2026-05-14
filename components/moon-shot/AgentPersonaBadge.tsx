'use client';

/**
 * AgentPersonaBadge — exibe qual persona de agente gerou a provocação.
 *
 * Atende SPEC-004 §FR-009 — personas brasileiras com paradigmas de raciocínio distintos
 * (DMAD-style: cognitivamente diversos, não estilisticamente diversos).
 *
 * NÃO é caixa-preta: mostra a persona (afim disso é da Suno e os creators podem aprender),
 * mas NÃO mostra o prompt nem o reasoning interno (caixa-preta — RN-009).
 */

import {
  Utensils,
  MessageSquareWarning,
  Shapes,
  PartyPopper,
  Crown,
  Eye,
} from 'lucide-react';

export type AgentPersona =
  | 'antropofaga'
  | 'cetico'
  | 'constraint-queen'
  | 'carnavalesco'
  | 'ancia'
  | 'estranho';

interface AgentPersonaBadgeProps {
  persona: AgentPersona;
  showLabel?: boolean;
}

const PERSONA_CONFIG: Record<
  AgentPersona,
  { label: string; tooltip: string; Icon: typeof Utensils; color: string }
> = {
  antropofaga: {
    label: 'Antropófaga',
    tooltip: 'Devora referências culturais e regurgita transformadas. Inspirada em Oswald de Andrade.',
    Icon: Utensils,
    color: '#FFC801', // sun
  },
  cetico: {
    label: 'Cético',
    tooltip: 'Raciocínio dialético — opõe e questiona toda premissa do briefing.',
    Icon: MessageSquareWarning,
    color: '#3B82F6',
  },
  'constraint-queen': {
    label: 'Constraint Queen',
    tooltip: 'Inversão por restrição — "e se o orçamento fosse zero?", "e se o Pix não existisse?". Jeitinho brasileiro.',
    Icon: Shapes,
    color: '#10B981',
  },
  carnavalesco: {
    label: 'Carnavalesco',
    tooltip: 'Bisociação por reversão e excesso. Mistura registros incompatíveis.',
    Icon: PartyPopper,
    color: '#EC4899',
  },
  ancia: {
    label: 'Anciã',
    tooltip: 'Recuperação analógica — "o que Olivetto / Serpa / Bernbach fariam?". Sabedoria de cases passados.',
    Icon: Crown,
    color: '#A855F7',
  },
  estranho: {
    label: 'O Estranho',
    tooltip: 'Maximização de distância semântica — busca o conceito mais inesperado que ainda faz sentido.',
    Icon: Eye,
    color: '#64748B',
  },
};

export default function AgentPersonaBadge({
  persona,
  showLabel = true,
}: AgentPersonaBadgeProps) {
  const cfg = PERSONA_CONFIG[persona];
  return (
    <span
      role="img"
      aria-label={`Persona do agente: ${cfg.label}`}
      title={cfg.tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 6px',
        backgroundColor: 'var(--nebula)',
        color: cfg.color,
        border: `1px solid ${cfg.color}33`,
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        cursor: 'help',
        transition: 'all 150ms ease',
      }}
    >
      <cfg.Icon size={12} strokeWidth={1.5} />
      {showLabel && <span>{cfg.label}</span>}
    </span>
  );
}
