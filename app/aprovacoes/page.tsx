'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import AprovacaoCard from '@/components/aprovacoes/AprovacaoCard';
import AprovacaoFilters from '@/components/aprovacoes/AprovacaoFilters';
import { useAuth } from '@/contexts/AuthContext';
import { useApprovals } from '@/contexts/ApprovalsContext';
import type { ApprovalFilters } from '@/lib/approval-types';

/**
 * T-29 — Inbox do Aprovador (SPEC-004 / FA-13).
 *
 * Acesso restrito a P3 (Líder) e P4 (Admin).
 * Caixa-preta (RN-009/011): não-admin é redirecionado para /404 sem mensagem
 * de "acesso negado" — não revela existência da rota.
 *
 * TODO(FA-09): quando RBAC granular for implementado, substituir `isAdmin`
 * por role check Líder|Admin com claims do JWT.
 */
export default function AprovacoesPage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const { submissions, getFiltered } = useApprovals();
  const [filters, setFilters] = useState<ApprovalFilters>({});

  // Caixa-preta: redirect 404 para não-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/404');
    }
  }, [authLoading, isAdmin, router]);

  const filtered = useMemo(() => getFiltered(filters), [getFiltered, filters]);

  // Opções únicas para filtros
  const clientOptions = useMemo(() => {
    const seen = new Map<string, string>();
    submissions.forEach((s) => seen.set(s.client_id, s.client_name));
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [submissions]);

  const skillOptions = useMemo(() => {
    const seen = new Map<string, string>();
    submissions.forEach((s) => seen.set(s.skill_slug, s.skill_name));
    return Array.from(seen.entries()).map(([slug, name]) => ({ slug, name }));
  }, [submissions]);

  const pendingCount = useMemo(
    () =>
      submissions.filter(
        (s) => s.status === 'PENDING_APPROVAL' || s.status === 'PENDING_VALIDATION',
      ).length,
    [submissions],
  );

  if (authLoading) {
    return (
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
        }}
      >
        Carregando…
      </main>
    );
  }

  if (!isAdmin) return null;

  return (
    <>
      <AppHeader
        breadcrumbs={[{ label: 'Aprovações', href: '/aprovacoes' }]}
        rightLabel="Admin"
      />
      <main
        id="main-content"
        className="page-enter"
        style={{ flex: 1, overflow: 'auto', padding: 24 }}
      >
        {/* Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 24,
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 300,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.2,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              Aprovações
              {pendingCount > 0 && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    backgroundColor: 'var(--sun)',
                    color: 'var(--void)',
                    borderRadius: 9999,
                    padding: '2px 8px',
                    verticalAlign: 'middle',
                  }}
                >
                  {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
                </span>
              )}
            </h1>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                margin: '4px 0 0',
              }}
            >
              {filtered.length} {filtered.length === 1 ? 'submissão' : 'submissões'}
              {Object.values(filters).some(Boolean) ? ' (filtrada)' : ''}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ marginBottom: 20 }}>
          <AprovacaoFilters
            filters={filters}
            clientOptions={clientOptions}
            skillOptions={skillOptions}
            onChange={setFilters}
          />
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <CheckCircle
              size={32}
              strokeWidth={1}
              style={{ color: 'var(--text-muted)', opacity: 0.5 }}
            />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              {Object.values(filters).some(Boolean)
                ? 'Nenhuma submissão encontrada com esses filtros.'
                : 'Nada pendente. Bom trabalho.'}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}
          >
            {filtered.map((sub) => (
              <AprovacaoCard key={sub.id} submission={sub} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
