'use client';

/**
 * WikiTab — Wiki Ontológica embutida no editor do cliente.
 *
 * Mostra as 6 entidades geradas pelo Oráculo no onboarding (SPEC-015),
 * incluindo as ainda não validadas (include_generated=true), com CTA para a
 * página de validação HITL quando houver pendências.
 *
 * Fetch local (não usa o estado global do OnboardingOraculoContext, que é
 * compartilhado com o fluxo do wizard e pode conter a wiki de outro cliente).
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Book, WarningAlt } from '@carbon/icons-react';
import type { EntityStatus, OntologyEntityType, WikiEntity } from '@/lib/onboarding-types';
import { WikiOntologicaProvider } from '@/contexts/WikiOntologicaContext';
import WikiEntityCard from '@/components/wiki/WikiEntityCard';
import { apiAvailable, getApiUrl, getAuthToken } from '@/lib/api';

interface WikiTabProps {
  clientSlug: string;
}

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

async function fetchWiki(slug: string): Promise<WikiEntity[] | '404' | null> {
  try {
    const headers: Record<string, string> = {};
    const token = await getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(getApiUrl(`/api/clients/${slug}/wiki?include_generated=true`), {
      headers,
    });
    if (res.status === 404) return '404';
    if (!res.ok) return null;
    const data = await res.json();
    return (data.entities || []).map((e: Record<string, unknown>) => ({
      id: e.id as string,
      clientId: e.client_id as string,
      entityType: e.entity_type as OntologyEntityType,
      content: e.content as string,
      provenance: (e.provenance as Array<{ source: string; excerpt?: string }>) || [],
      status: e.status as EntityStatus,
      badge: e.badge as WikiEntity['badge'],
      createdAt: e.created_at as string,
      updatedAt: e.updated_at as string,
    }));
  } catch {
    return null;
  }
}

export default function WikiTab({ clientSlug }: WikiTabProps) {
  const router = useRouter();
  const [entities, setEntities] = useState<WikiEntity[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    if (!apiAvailable()) {
      setState('error');
      return;
    }
    let cancelled = false;
    fetchWiki(clientSlug).then((result) => {
      if (cancelled) return;
      if (result === '404') setState('not-found');
      else if (result === null) setState('error');
      else {
        setEntities(result);
        setState('ready');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [clientSlug]);

  if (!apiAvailable()) {
    return (
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Backend não disponível (modo mock) — a Wiki Ontológica é carregada da API.
      </p>
    );
  }

  if (state === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 720 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              height: 56,
              borderRadius: 12,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--deep)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    );
  }

  if (state === 'not-found' || state === 'error') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          padding: 40,
          color: 'var(--text-muted)',
        }}
      >
        <Book size={28} />
        <p style={{ fontSize: '0.85rem', margin: 0 }}>
          {state === 'not-found' ? 'Wiki não disponível para este cliente.' : 'Não foi possível carregar a Wiki.'}
        </p>
      </div>
    );
  }

  const pendingCount = entities.filter((e) => e.status === 'generated').length;

  if (entities.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          padding: 40,
          color: 'var(--text-muted)',
        }}
      >
        <Book size={28} />
        <p style={{ fontSize: '0.85rem', margin: 0 }}>Nenhuma entidade gerada ainda.</p>
        <p style={{ fontSize: '0.75rem', margin: 0 }}>
          As 6 entidades são geradas pelo Oráculo durante o onboarding do cliente.
        </p>
      </div>
    );
  }

  return (
    <WikiOntologicaProvider>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
        {/* Resumo + CTA de validação */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, flex: 1 }}>
            Perfil semântico gerado pelo Oráculo —{' '}
            {entities.length - pendingCount} aprovada{entities.length - pendingCount === 1 ? '' : 's'}
            {pendingCount > 0 && `, ${pendingCount} aguardando validação`}.
          </p>
          {pendingCount > 0 && (
            <button
              onClick={() => router.push(`/clientes/${clientSlug}/onboarding/validate`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,200,1,0.3)',
                backgroundColor: 'rgba(255,200,1,0.08)',
                color: 'var(--sun)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <WarningAlt size={13} />
              Validar pendentes
            </button>
          )}
        </div>

        {/* Entity cards (ordem ontológica canônica vem do backend) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entities.map((entity) => (
            <WikiEntityCard key={entity.id} entity={entity} />
          ))}
        </div>
      </div>
    </WikiOntologicaProvider>
  );
}
