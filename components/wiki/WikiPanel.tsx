'use client';

/**
 * SPEC-015 — WikiPanel: container for the Wiki Ontológica.
 * ADR-LOCAL-05: Wiki is a view of wiki_entities — not Biblioteca.
 * Caixa-preta: this page is 404 for Operacional role.
 */

import { BookOpen } from 'lucide-react';
import type { WikiEntity } from '@/lib/onboarding-types';
import { WikiOntologicaProvider } from '@/contexts/WikiOntologicaContext';
import WikiEntityCard from './WikiEntityCard';

interface Props {
  clientName: string;
  entities: WikiEntity[];
}

export default function WikiPanel({ clientName, entities }: Props) {
  if (entities.length === 0) {
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
          <BookOpen size={32} strokeWidth={1} />
          <p style={{ fontSize: '0.9rem' }}>Nenhuma entidade aprovada ainda.</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Complete a validação HITL para ver a Wiki Ontológica.
          </p>
        </div>
      </WikiOntologicaProvider>
    );
  }

  return (
    <WikiOntologicaProvider>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <BookOpen size={18} strokeWidth={1.5} style={{ color: 'var(--sun)' }} />
              <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Wiki Ontológica
              </h1>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Perfil semântico de <strong style={{ color: 'var(--text-secondary)' }}>{clientName}</strong> —{' '}
              {entities.length} entidade{entities.length !== 1 ? 's' : ''} aprovada{entities.length !== 1 ? 's' : ''}.
            </p>
          </div>

          {/* Entity cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entities.map((entity) => (
              <WikiEntityCard key={entity.id} entity={entity} />
            ))}
          </div>
        </div>
      </div>
    </WikiOntologicaProvider>
  );
}
