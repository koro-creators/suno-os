'use client';

/**
 * BisociationZoneBadge — exibe a zona da provocação em linguagem de negócio.
 *
 * Atende SPEC-004 §FR-011 (scoring de bisociação) e §FR-012 (não exibir scores numéricos).
 *
 * Caixa-preta: NÃO mostra valores cosseno; só a classificação humana-amigável.
 */

interface BisociationZoneBadgeProps {
  zone: 'adjacente' | 'sweet-spot' | 'radical';
}

const ZONE_CONFIG: Record<
  BisociationZoneBadgeProps['zone'],
  { label: string; tooltip: string; color: string; bg: string }
> = {
  adjacente: {
    label: 'Adjacente',
    tooltip: 'Combinação próxima ao briefing — segura e executável. Bom ponto de partida.',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
  },
  'sweet-spot': {
    label: 'Sweet Spot',
    tooltip: 'Distância ideal — surpreendente mas mappeável. A zona onde a bisociação paga.',
    color: 'var(--sun)',
    bg: 'rgba(255, 200, 1, 0.15)',
  },
  radical: {
    label: 'Radical',
    tooltip: 'Combinação mais ousada — exige construção criativa do creator para fazer sentido.',
    color: '#A855F7',
    bg: 'rgba(168, 85, 247, 0.12)',
  },
};

export default function BisociationZoneBadge({ zone }: BisociationZoneBadgeProps) {
  const cfg = ZONE_CONFIG[zone];
  return (
    <span
      role="img"
      aria-label={`Zona de bisociação: ${cfg.label}`}
      title={cfg.tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        backgroundColor: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}33`,
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        cursor: 'help',
        transition: 'all 150ms ease',
      }}
    >
      {cfg.label}
    </span>
  );
}
