'use client';

/**
 * SPEC-015 — WikiEntityCard: expandable card for an approved entity.
 * ADR-LOCAL-05: Wiki is a view of wiki_entities (not Biblioteca).
 */

import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { WikiEntity } from '@/lib/onboarding-types';
import { useWikiOntologica } from '@/contexts/WikiOntologicaContext';
import WikiEntityBadge from './WikiEntityBadge';

interface Props {
  entity: WikiEntity;
}

export default function WikiEntityCard({ entity }: Props) {
  const { isExpanded, toggleEntity } = useWikiOntologica();
  const expanded = isExpanded(entity.entityType);

  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--deep)',
        overflow: 'hidden',
        transition: 'border-color 150ms ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--twilight)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
      }}
    >
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={() => toggleEntity(entity.entityType)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleEntity(entity.entityType);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          cursor: 'pointer',
          userSelect: 'none',
          outline: 'none',
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15) inset';
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        }}
      >
        <span
          style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            flex: 1,
          }}
        >
          {entity.entityType}
        </span>

        <WikiEntityBadge badge={entity.badge} />

        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          {expanded
            ? <ChevronUp size={14} strokeWidth={1.5} />
            : <ChevronDown size={14} strokeWidth={1.5} />
          }
        </span>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div
          style={{
            padding: '0 16px 16px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {/* Content */}
          <div
            style={{
              paddingTop: 14,
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}
          >
            {entity.content}
          </div>

          {/* Provenance */}
          {entity.provenance.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 8,
                }}
              >
                Fontes
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {entity.provenance.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      padding: '6px 10px',
                      borderRadius: 6,
                      backgroundColor: 'var(--nebula)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <ExternalLink
                      size={12}
                      strokeWidth={1.5}
                      style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-secondary)',
                          fontFamily: 'monospace',
                          wordBreak: 'break-all',
                        }}
                      >
                        {p.source}
                      </div>
                      {p.excerpt && (
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            marginTop: 2,
                            fontStyle: 'italic',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          &ldquo;{p.excerpt}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Updated at */}
          <p
            style={{
              marginTop: 12,
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              textAlign: 'right',
            }}
          >
            Atualizado em {new Date(entity.updatedAt).toLocaleDateString('pt-BR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      )}
    </div>
  );
}
