'use client';

/**
 * FaiscaPanel — container que renderiza 3-5 FaiscaCards.
 *
 * Atende SPEC-004 §FR-012 (apresentação de provocações) e §FR-014 (controle de intensidade).
 *
 * Layout: scroll horizontal em desktop com snap; vertical em mobile.
 */

import { useState } from 'react';
import { RefreshCw, X, Download } from 'lucide-react';
import FaiscaCard, { type FaiscaData } from './FaiscaCard';

export type IntensityMode = 'adjacente' | 'equilibrado' | 'radical';

interface FaiscaPanelProps {
  faiscas: FaiscaData[];
  intensity?: IntensityMode;
  onIntensityChange?: (m: IntensityMode) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onClose?: () => void;
  isLoading?: boolean;
}

const INTENSITY_LABELS: Record<IntensityMode, string> = {
  adjacente: 'Adjacente',
  equilibrado: 'Equilibrado',
  radical: 'Radical',
};

export default function FaiscaPanel({
  faiscas,
  intensity = 'equilibrado',
  onIntensityChange,
  onRefresh,
  onExport,
  onClose,
  isLoading = false,
}: FaiscaPanelProps) {
  const [starred, setStarred] = useState<Set<string>>(new Set());

  const toggleStar = (id: string) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section
      aria-label="Painel de Faíscas — provocações criativas"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 24,
        backgroundColor: 'var(--void)',
        borderRadius: 12,
      }}
    >
      {/* Header: título + intensidade + ações */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {isLoading ? 'Devorando referências…' : `${faiscas.length} Faíscas`}
          </h2>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              margin: '4px 0 0 0',
            }}
          >
            Estímulos para você criar — não são peças finais
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Intensidade selector */}
          <div
            role="radiogroup"
            aria-label="Intensidade criativa"
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--nebula)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 9999,
              padding: 2,
            }}
          >
            {(Object.keys(INTENSITY_LABELS) as IntensityMode[]).map((mode) => (
              <button
                key={mode}
                role="radio"
                aria-checked={intensity === mode}
                onClick={() => onIntensityChange?.(mode)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: intensity === mode ? 'var(--sun)' : 'transparent',
                  color: intensity === mode ? 'var(--void)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {INTENSITY_LABELS[mode]}
              </button>
            ))}
          </div>

          {/* Refresh */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              aria-label="Gerar mais Faíscas"
              title="Gerar mais Faíscas"
              disabled={isLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
                transition: 'all 150ms ease',
              }}
            >
              <RefreshCw size={14} strokeWidth={1.5} />
            </button>
          )}

          {/* Export (manter favoritos) */}
          {onExport && starred.size > 0 && (
            <button
              onClick={onExport}
              aria-label="Manter na fogueira"
              title={`Manter ${starred.size} faísca${starred.size > 1 ? 's' : ''} na fogueira`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                backgroundColor: 'var(--sun)',
                color: 'var(--void)',
                border: 'none',
                borderRadius: 9999,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'opacity 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <Download size={14} strokeWidth={1.5} />
              Manter ({starred.size})
            </button>
          )}

          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Fechar painel"
              title="Fechar"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </header>

      {/* Cards em scroll horizontal */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 8,
          scrollSnapType: 'x mandatory',
        }}
      >
        {faiscas.map((f) => (
          <div key={f.id} style={{ flex: '0 0 auto', scrollSnapAlign: 'start' }}>
            <FaiscaCard
              faisca={f}
              starred={starred.has(f.id)}
              onStar={toggleStar}
            />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!isLoading && faiscas.length === 0 && (
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          Nenhuma faísca ainda. Devore um briefing para começar.
        </div>
      )}
    </section>
  );
}
