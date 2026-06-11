'use client';

/**
 * SPEC-015 — T-39: Wiki Ontológica.
 * Caixa-preta (constitution §1.4, RN-011):
 *   - Operacional role → 404 (not 403). Enforced by backend.
 *   - If backend returns 404, redirect to /404.
 * ADR-LOCAL-05: Wiki is a view of wiki_entities — not Biblioteca.
 */

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import WikiPanel from '@/components/wiki/WikiPanel';
import { useOnboardingOraculo } from '@/contexts/OnboardingOraculoContext';

export default function WikiPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;

  const { wikiEntities, loadWiki, error } = useOnboardingOraculo();

  useEffect(() => {
    loadWiki(clientId);
  }, [clientId, loadWiki]);

  // Caixa-preta: if 404 error from API, redirect to /404
  useEffect(() => {
    if (error === '404') {
      router.replace('/404');
    }
  }, [error, router]);

  // Derive client name from entities or use slug
  const clientName = wikiEntities[0]?.clientId
    ? clientId
    : clientId;

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: 'Clientes', href: '/clientes' },
          { label: clientId, href: `/clientes/${clientId}` },
          { label: 'Wiki Ontológica', href: '#' },
        ]}
      />
      {error && error !== '404' ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              padding: '12px 20px',
              borderRadius: 8,
              backgroundColor: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#EF4444',
              fontSize: '0.82rem',
            }}
          >
            {error}
          </div>
        </div>
      ) : (
        <>
          {/* Próximo passo pós-onboarding: a Wiki não é um beco sem saída */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              padding: '16px 24px 0',
              maxWidth: 768,
              margin: '0 auto',
              width: '100%',
            }}
          >
            <button
              onClick={() => router.push('/clientes')}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'border-color 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--twilight)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              Todos os clientes
            </button>
            <button
              onClick={() => router.push(`/clientes/${clientId}`)}
              style={{
                padding: '7px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: 'var(--sun)',
                color: '#000',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Abrir cliente →
            </button>
          </div>
          <WikiPanel clientName={clientName} entities={wikiEntities} />
        </>
      )}
    </>
  );
}
