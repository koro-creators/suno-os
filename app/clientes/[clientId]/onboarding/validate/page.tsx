'use client';

/**
 * SPEC-015 — T-36: HITL gate page.
 * Lists 6 entity validation cards.
 * "Finalizar" only enabled when all 6 are accepted.
 * Constitution §1.3: HITL per entity — no "Aceitar tudo" button.
 * ADR-LOCAL-04: gate enforced server-side.
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import EntityValidationCard from '@/components/onboarding/EntityValidationCard';
import { useOnboardingOraculo } from '@/contexts/OnboardingOraculoContext';
import { ONTOLOGY_ENTITY_TYPES, type EntityBadge, type EntityStatus, type HITLAction, type OntologyEntityType, type WikiEntity } from '@/lib/onboarding-types';
import { apiAvailable } from '@/lib/api';

interface LocalEntityState {
  content: string;
  status: EntityStatus;
  badge: EntityBadge;
}

function buildInitialEntityState(jobStatus: { entities: Record<OntologyEntityType, EntityStatus> } | null): Record<OntologyEntityType, LocalEntityState> {
  return Object.fromEntries(
    ONTOLOGY_ENTITY_TYPES.map((et) => [
      et,
      {
        content: jobStatus
          ? `[Conteúdo gerado pelo Oráculo para ${et}]`
          : '',
        status: (jobStatus?.entities[et] ?? 'pending') as EntityStatus,
        badge: 'seed_auto' as EntityBadge,
      },
    ])
  ) as Record<OntologyEntityType, LocalEntityState>;
}

export default function OnboardingValidatePage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;

  const { jobStatus, validateEntity, loadWiki, wikiEntities, error } = useOnboardingOraculo();

  const [entityStates, setEntityStates] = useState<Record<OntologyEntityType, LocalEntityState>>(
    () => buildInitialEntityState(jobStatus)
  );
  const [isFinishing, setIsFinishing] = useState(false);
  const [wikiLoaded, setWikiLoaded] = useState(false);

  // Populate entity states from jobStatus when available
  useEffect(() => {
    if (jobStatus) {
      setEntityStates((prev) => {
        const next = { ...prev };
        for (const et of ONTOLOGY_ENTITY_TYPES) {
          const jsStatus = jobStatus.entities[et];
          if (jsStatus && next[et].status === 'pending') {
            next[et] = {
              ...next[et],
              status: jsStatus,
              content: `[Conteúdo gerado pelo Oráculo para ${et} — cliente ${jobStatus.clientSlug}]`,
            };
          }
        }
        return next;
      });
    }
  }, [jobStatus]);

  // Load wiki entities on mount (to get actual content from API)
  useEffect(() => {
    if (!wikiLoaded) {
      setWikiLoaded(true);
      loadWiki(clientId).then(() => {
        // handled by wikiEntities update below
      });
    }
  }, [clientId, loadWiki, wikiLoaded]);

  // Sync entity content from wiki entities when loaded
  useEffect(() => {
    if (wikiEntities.length > 0) {
      setEntityStates((prev) => {
        const next = { ...prev };
        for (const entity of wikiEntities) {
          if (entity.entityType in next) {
            next[entity.entityType] = {
              content: entity.content,
              status: entity.status,
              badge: entity.badge,
            };
          }
        }
        return next;
      });
    }
  }, [wikiEntities]);

  const handleValidate = useCallback(
    async (entityType: OntologyEntityType, action: HITLAction, editedContent?: string) => {
      const result = await validateEntity(clientId, entityType, action, editedContent);
      if (result) {
        setEntityStates((prev) => ({
          ...prev,
          [entityType]: {
            content: editedContent ?? prev[entityType].content,
            status: result.status,
            badge: result.badge,
          },
        }));

        // If last entity accepted → ACTIVE → redirect to wiki
        if (result.clientStatus === 'ACTIVE') {
          router.push(`/clientes/${clientId}/wiki`);
        }
      }
    },
    [clientId, validateEntity, router]
  );

  const allAccepted = ONTOLOGY_ENTITY_TYPES.every(
    (et) => entityStates[et]?.status === 'accepted'
  );

  const handleFinish = async () => {
    if (!allAccepted || isFinishing) return;
    setIsFinishing(true);
    // Navigate to wiki — backend transition to ACTIVE already happened on last entity accept
    router.push(`/clientes/${clientId}/wiki`);
  };

  const acceptedCount = ONTOLOGY_ENTITY_TYPES.filter(
    (et) => entityStates[et]?.status === 'accepted'
  ).length;

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: 'Clientes', href: '/clientes' },
          { label: clientId, href: `/clientes/${clientId}` },
          { label: 'Validação HITL', href: '#' },
        ]}
      />
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px 24px',
        }}
      >
        <div style={{ maxWidth: 660, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 8,
              }}
            >
              Validar entidades ontológicas
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Revise e aprove cada entidade gerada pelo Oráculo.
              {' '}<strong style={{ color: 'var(--text-secondary)' }}>
                {acceptedCount} de {ONTOLOGY_ENTITY_TYPES.length}
              </strong> aprovadas.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: '10px 14px',
                borderRadius: 8,
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#EF4444',
                fontSize: '0.8rem',
              }}
            >
              {error}
            </div>
          )}

          {/* Progress bar */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                height: 4,
                borderRadius: 9999,
                backgroundColor: 'var(--nebula)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(acceptedCount / ONTOLOGY_ENTITY_TYPES.length) * 100}%`,
                  backgroundColor: allAccepted ? '#22C55E' : 'var(--sun)',
                  borderRadius: 9999,
                  transition: 'width 300ms ease, background-color 300ms ease',
                }}
              />
            </div>
          </div>

          {/* Entity cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {ONTOLOGY_ENTITY_TYPES.map((et) => {
              const state = entityStates[et];
              return (
                <EntityValidationCard
                  key={et}
                  entityType={et}
                  content={state.content}
                  status={state.status}
                  badge={state.badge}
                  onValidate={(action, editedContent) =>
                    handleValidate(et, action, editedContent)
                  }
                />
              );
            })}
          </div>

          {/* Finalizar button */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              paddingTop: 20,
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={handleFinish}
              disabled={!allAccepted || isFinishing}
              title={!allAccepted ? 'Aprove todas as 6 entidades para finalizar' : 'Finalizar onboarding'}
              style={{
                padding: '10px 28px',
                borderRadius: 8,
                border: allAccepted ? '1px solid #22C55E' : '1px solid var(--border-subtle)',
                backgroundColor: allAccepted ? 'rgba(34,197,94,0.12)' : 'var(--nebula)',
                color: allAccepted ? '#22C55E' : 'var(--text-muted)',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: allAccepted && !isFinishing ? 'pointer' : 'not-allowed',
                transition: 'all 200ms ease',
                opacity: isFinishing ? 0.7 : 1,
              }}
            >
              {isFinishing ? 'Finalizando...' : 'Finalizar Onboarding'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
