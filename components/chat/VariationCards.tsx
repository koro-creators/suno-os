'use client';

import { useState } from 'react';
import SocialPreview, { getSocialFormat } from './SocialPreview';

type PreviewFormat = 'feed' | 'carousel' | 'stories' | 'post';

interface VariationCardsProps {
  original: string;
  originalHighlight?: { label: string; body: string };
  variants: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  skillSlug?: string;
  moonSlug?: string;
  clientName?: string;
  clientColor?: string;
}

interface CardData {
  label: string;
  text: string;
  highlight?: { label: string; body: string };
}

export default function VariationCards({
  original,
  originalHighlight,
  variants,
  selectedIndex,
  onSelect,
  skillSlug,
  moonSlug,
  clientName,
  clientColor,
}: VariationCardsProps) {
  const socialFormat = skillSlug && moonSlug ? getSocialFormat(skillSlug, moonSlug) : null;
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const cards: CardData[] = [
    { label: 'V1 · Original', text: original, highlight: originalHighlight },
    ...variants.map((v, i) => ({ label: `V${i + 2}`, text: v })),
  ];

  // Social preview mode
  // Carousel/feed: stack vertically | Stories/post: side by side horizontally
  if (socialFormat) {
    const isVerticalLayout = socialFormat === 'carousel' || socialFormat === 'feed';

    return (
      <div style={{ width: '100%', marginTop: 12 }}>
        <div style={{
          display: 'flex',
          flexDirection: isVerticalLayout ? 'column' : 'row',
          gap: isVerticalLayout ? 16 : 10,
          overflowX: isVerticalLayout ? undefined : 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingBottom: 4,
        }}>
          {cards.map((card, index) => {
            const selected = index === selectedIndex;
            return (
              <div
                key={index}
                onClick={() => onSelect(index)}
                style={{
                  cursor: 'pointer',
                  position: 'relative',
                  flexShrink: isVerticalLayout ? undefined : 0,
                  borderLeft: isVerticalLayout ? `2px solid ${selected ? 'var(--sun)' : 'var(--border-subtle)'}` : undefined,
                  border: !isVerticalLayout ? `2px solid ${selected ? 'var(--sun)' : 'transparent'}` : undefined,
                  borderRadius: !isVerticalLayout ? 8 : undefined,
                  paddingLeft: isVerticalLayout ? 10 : undefined,
                  transition: 'border-color 150ms ease',
                }}
              >
                {/* Label */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  marginBottom: 6,
                  ...(isVerticalLayout ? {} : { position: 'absolute' as const, top: 6, left: 6, zIndex: 1 }),
                }}>
                  <span style={{
                    fontSize: '0.55rem', fontWeight: 600,
                    color: selected ? 'var(--sun)' : 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    ...(isVerticalLayout ? {} : { backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 3, padding: '1px 5px' }),
                  }}>
                    {card.label}
                  </span>
                  {selected && (
                    <span style={{
                      fontSize: '0.45rem', fontWeight: 600,
                      backgroundColor: 'var(--sun)', color: 'var(--void)',
                      borderRadius: 3, padding: '1px 5px',
                    }}>
                      Selecionada
                    </span>
                  )}
                </div>

                <SocialPreview
                  content={card.text}
                  format={socialFormat}
                  clientName={clientName || 'Marca'}
                  clientColor={clientColor || '#8B5CF6'}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Variações de resposta"
      style={{ width: '100%', marginTop: 12 }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}
        className="variation-grid"
      >
        {cards.map((card, index) => {
          const selected = index === selectedIndex;
          return (
            <div
              key={index}
              role="radio"
              aria-checked={selected}
              tabIndex={0}
              onClick={() => onSelect(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(index);
                }
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = 'none';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.5)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
              style={{
                position: 'relative',
                background: 'var(--deep)',
                border: `1px solid ${selected ? 'var(--sun)' : 'var(--border-subtle)'}`,
                borderRadius: 10,
                padding: 14,
                cursor: 'pointer',
              }}
            >
              {selected && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: 'var(--sun)',
                    color: 'var(--void)',
                    fontSize: '0.5rem',
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontWeight: 600,
                  }}
                >
                  Selecionada
                </span>
              )}

              {/* Header */}
              <span
                style={{
                  fontSize: '0.6rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  display: 'block',
                }}
              >
                {card.label}
              </span>

              {/* Body */}
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginTop: 6,
                  ...(expandedIndex === index ? {} : {
                    display: '-webkit-box',
                    WebkitLineClamp: 5,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                  }),
                }}
              >
                {card.text}
              </p>

              {card.text.length > 200 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedIndex(expandedIndex === index ? null : index);
                  }}
                  style={{
                    fontSize: '0.6rem',
                    color: 'var(--sun)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 0',
                    marginTop: 4,
                  }}
                >
                  {expandedIndex === index ? 'Ver menos' : 'Ver mais'}
                </button>
              )}

              {/* Highlight for V1 */}
              {index === 0 && card.highlight && (
                <div
                  style={{
                    borderLeft: '2px solid var(--sun)',
                    background: 'rgba(255,200,1,0.04)',
                    borderRadius: '0 6px 6px 0',
                    padding: '6px 10px',
                    marginTop: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.6rem',
                      color: 'var(--sun)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 600,
                      display: 'block',
                    }}
                  >
                    {card.highlight.label}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      display: 'block',
                      marginTop: 2,
                    }}
                  >
                    {card.highlight.body}
                  </span>
                </div>
              )}

              {/* Footer */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(index);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = 'none';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.5)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
                style={{
                  fontSize: '0.65rem',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 9999,
                  padding: '4px 12px',
                  background: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  marginTop: 8,
                  transition: 'border-color 150ms, color 150ms',
                }}
              >
                Usar esta
              </button>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .variation-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
