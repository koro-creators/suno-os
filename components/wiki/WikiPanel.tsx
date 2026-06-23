'use client';

/**
 * SPEC-015 — WikiPanel: container da Wiki Ontológica.
 * ADR-LOCAL-05: Wiki é view de wiki_entities — não da Biblioteca.
 * Caixa-preta: CONTRACTED_SCOPE ausente da nav para não-admins (RN-009).
 */

import { useState } from 'react';
import { Book } from '@carbon/icons-react';
import type { WikiEntity } from '@/lib/onboarding-types';
import { ENTITY_LABELS, ENTITY_ADMIN_ONLY, ENTITY_CONDITIONAL } from '@/lib/onboarding-types';
import { useAuth } from '@/contexts/AuthContext';
import { WikiOntologicaProvider } from '@/contexts/WikiOntologicaContext';
import WikiEntityCard from './WikiEntityCard';

interface Props {
  clientName: string;
  entities: WikiEntity[];
}

export default function WikiPanel({ clientName, entities }: Props) {
  const { isAdmin } = useAuth();

  // Filtrar entidades visíveis (RN-009: CONTRACTED_SCOPE hidden for non-admin)
  const visibleEntities = entities.filter(
    (e) => isAdmin || !ENTITY_ADMIN_ONLY.has(e.entityType)
  );

  const [activeType, setActiveType] = useState<string | null>(
    visibleEntities[0]?.entityType ?? null
  );

  if (visibleEntities.length === 0) {
    return (
      <WikiOntologicaProvider>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12,
            color: 'var(--text-muted)',
          }}
        >
          <Book size={32} />
          <p style={{ fontSize: '0.9rem' }}>Nenhuma entidade aprovada ainda.</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Complete a validação HITL para ver a Wiki Ontológica.
          </p>
        </div>
      </WikiOntologicaProvider>
    );
  }

  const activeEntity = visibleEntities.find((e) => e.entityType === activeType) ?? visibleEntities[0];

  return (
    <WikiOntologicaProvider>
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Nav lateral */}
        <nav
          style={{
            width: 210,
            flexShrink: 0,
            borderRight: '1px solid var(--border-subtle)',
            overflowY: 'auto',
            padding: '16px 0',
          }}
        >
          <p
            style={{
              fontSize: '0.62rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0 16px 8px',
            }}
          >
            Entidades
          </p>
          {visibleEntities.map((entity) => {
            const isActive = entity.entityType === (activeEntity?.entityType);
            const isConditional = ENTITY_CONDITIONAL.has(entity.entityType);
            const isEmpty = !entity.content || entity.content.trim() === '';
            const label = ENTITY_LABELS[entity.entityType] ?? entity.entityType;

            return (
              <button
                key={entity.entityType}
                onClick={() => setActiveType(entity.entityType)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 16px',
                  border: 'none',
                  borderLeft: `2px solid ${isActive ? 'var(--sun)' : 'transparent'}`,
                  backgroundColor: isActive ? 'rgba(255,200,1,0.06)' : 'transparent',
                  color: isConditional && isEmpty
                    ? 'var(--text-muted)'
                    : isActive
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  lineHeight: 1.4,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {label}
                {isConditional && isEmpty && (
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.6rem',
                      color: 'var(--text-muted)',
                      marginTop: 1,
                    }}
                  >
                    sem dados
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Conteúdo principal */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <Book size={16} style={{ color: 'var(--sun)' }} />
                <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Wiki Ontológica
                </h1>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Perfil semântico de{' '}
                <strong style={{ color: 'var(--text-secondary)' }}>{clientName}</strong> —{' '}
                {visibleEntities.length} entidade{visibleEntities.length !== 1 ? 's' : ''} aprovada{visibleEntities.length !== 1 ? 's' : ''}.
              </p>
            </div>

            {/* Card da entidade ativa */}
            {activeEntity && (
              <WikiEntityCard key={activeEntity.id} entity={activeEntity} />
            )}
          </div>
        </div>
      </div>
    </WikiOntologicaProvider>
  );
}
