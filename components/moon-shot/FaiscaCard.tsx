'use client';

/**
 * FaiscaCard — card individual de provocação criativa (Faísca).
 *
 * Atende SPEC-004 §FR-012 (apresentação) e §FR-013 (feedback).
 *
 * Vocabulário Suno: provocação = Faísca; salvar = "Manter na fogueira" (metaphor); thumbs up/down.
 *
 * RN-014: marcado como AIBadge "faisca" por padrão.
 */

import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import AIBadge from './AIBadge';
import AgentPersonaBadge, { type AgentPersona } from './AgentPersonaBadge';
import BisociationZoneBadge from './BisociationZoneBadge';

export interface ConceptCombined {
  name: string;
  domain: string; // ex: 'cinema', 'antropologia', 'engenharia'
}

export interface FaiscaData {
  id: string;
  title: string;
  concepts: ConceptCombined[];
  narrative: string;
  zone: 'adjacente' | 'sweet-spot' | 'radical';
  agentPersona: AgentPersona;
}

interface FaiscaCardProps {
  faisca: FaiscaData;
  onStar?: (id: string) => void;
  onThumbsUp?: (id: string) => void;
  onThumbsDown?: (id: string) => void;
  starred?: boolean;
}

export default function FaiscaCard({
  faisca,
  onStar,
  onThumbsUp,
  onThumbsDown,
  starred = false,
}: FaiscaCardProps) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  return (
    <article
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 16,
        backgroundColor: 'var(--deep)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        minWidth: 320,
        maxWidth: 380,
        transition: 'border-color 150ms ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--twilight)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
    >
      {/* Header: zona + persona */}
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
        <BisociationZoneBadge zone={faisca.zone} />
        <AgentPersonaBadge persona={faisca.agentPersona} />
      </header>

      {/* Título da Faísca */}
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 1.3,
          color: 'var(--text-primary)',
          margin: 0,
        }}
      >
        {faisca.title}
      </h3>

      {/* Conceitos combinados */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {faisca.concepts.map((c, i) => (
          <span
            key={i}
            style={{
              padding: '3px 10px',
              backgroundColor: 'var(--nebula)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 9999,
              fontSize: 11,
              lineHeight: 1.4,
            }}
            title={`Domínio: ${c.domain}`}
          >
            {c.name}
            <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontSize: 10 }}>
              · {c.domain}
            </span>
          </span>
        ))}
      </div>

      {/* Narrativa de conexão */}
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: 'var(--text-secondary)',
          margin: 0,
        }}
      >
        {faisca.narrative}
      </p>

      {/* Footer: AIBadge + ações */}
      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 4,
          paddingTop: 10,
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <AIBadge state="faisca" size="small" showLabel />

        <div style={{ display: 'flex', gap: 4 }}>
          {/* Thumbs down */}
          <button
            onClick={() => {
              setFeedback('down');
              onThumbsDown?.(faisca.id);
            }}
            aria-label="Não foi útil"
            aria-pressed={feedback === 'down'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              backgroundColor: feedback === 'down' ? 'rgba(239,68,68,0.15)' : 'transparent',
              color: feedback === 'down' ? '#EF4444' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            <ThumbsDown size={14} strokeWidth={1.5} />
          </button>

          {/* Thumbs up */}
          <button
            onClick={() => {
              setFeedback('up');
              onThumbsUp?.(faisca.id);
            }}
            aria-label="Foi útil"
            aria-pressed={feedback === 'up'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              backgroundColor: feedback === 'up' ? 'rgba(16,185,129,0.15)' : 'transparent',
              color: feedback === 'up' ? '#10B981' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            <ThumbsUp size={14} strokeWidth={1.5} />
          </button>

          {/* Star (manter na fogueira) */}
          <button
            onClick={() => onStar?.(faisca.id)}
            aria-label={starred ? 'Remover dos favoritos' : 'Manter na fogueira'}
            aria-pressed={starred}
            title={starred ? 'Remover dos favoritos' : 'Manter na fogueira'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              backgroundColor: starred ? 'rgba(255,200,1,0.15)' : 'transparent',
              color: starred ? 'var(--sun)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            <Star size={14} strokeWidth={1.5} fill={starred ? 'var(--sun)' : 'none'} />
          </button>
        </div>
      </footer>
    </article>
  );
}
