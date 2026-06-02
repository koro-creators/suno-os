'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckmarkFilled } from '@carbon/icons-react';
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
 *
 * Phase 20: abas Pendentes / Histórico + agrupamento por cliente no Histórico.
 */

type TabView = 'pendentes' | 'historico';

const PENDING_STATUSES = new Set(['PENDING_APPROVAL', 'PENDING_VALIDATION']);
const HISTORY_STATUSES = new Set(['APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'EXPIRED']);

export default function AprovacoesPage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const { submissions, getFiltered } = useApprovals();
  const [filters, setFilters] = useState<ApprovalFilters>({});
  const [activeTab, setActiveTab] = useState<TabView>('pendentes');

  // Caixa-preta: redirect 404 para não-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/404');
    }
  }, [authLoading, isAdmin, router]);

  // Reset status filter when switching tabs so cross-tab filter doesn't yield empty results
  const handleTabChange = (tab: TabView) => {
    setActiveTab(tab);
    setFilters((prev) => ({ ...prev, status: undefined }));
  };

  // All submissions with dropdown filters applied (no tab filter yet)
  const filteredByDropdowns = useMemo(() => getFiltered(filters), [getFiltered, filters]);

  // Then apply tab as a coarse filter on top
  const filtered = useMemo(() => {
    return filteredByDropdowns.filter((s) => {
      if (activeTab === 'pendentes') return PENDING_STATUSES.has(s.status);
      return HISTORY_STATUSES.has(s.status);
    });
  }, [filteredByDropdowns, activeTab]);

  // Opções únicas para filtros — derived from all submissions (not filtered)
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

  // Histórico: agrupar por cliente, ordenado por updated_at desc dentro de cada grupo
  const historyGroups = useMemo(() => {
    if (activeTab !== 'historico') return [];

    const groupMap = new Map<string, { client_name: string; items: typeof filtered }>();
    filtered.forEach((s) => {
      const existing = groupMap.get(s.client_id);
      if (existing) {
        existing.items.push(s);
      } else {
        groupMap.set(s.client_id, { client_name: s.client_name, items: [s] });
      }
    });

    // Sort items within each group by updated_at desc
    groupMap.forEach((group) => {
      group.items.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
    });

    // Sort groups by most recent updated_at desc
    return Array.from(groupMap.entries())
      .map(([client_id, { client_name, items }]) => ({ client_id, client_name, items }))
      .sort(
        (a, b) =>
          new Date(b.items[0].updated_at).getTime() - new Date(a.items[0].updated_at).getTime(),
      );
  }, [activeTab, filtered]);

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
            marginBottom: 20,
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

        {/* Tab navigation */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 20,
          }}
        >
          {(
            [
              { id: 'pendentes', label: 'Pendentes' },
              { id: 'historico', label: 'Histórico' },
            ] as { id: TabView; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                backgroundColor: activeTab === tab.id ? 'var(--nebula)' : 'transparent',
                border: `1px solid ${activeTab === tab.id ? 'var(--twilight)' : 'var(--border-subtle)'}`,
                borderRadius: 9999,
                padding: '6px 16px',
                fontSize: '0.78rem',
                fontWeight: activeTab === tab.id ? 500 : 400,
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
              }}
            >
              {tab.label}
            </button>
          ))}
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

        {/* Lista — Pendentes */}
        {activeTab === 'pendentes' && (
          <>
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
                <CheckmarkFilled
                  size={32}
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
          </>
        )}

        {/* Lista — Histórico agrupado por cliente */}
        {activeTab === 'historico' && (
          <>
            {historyGroups.length === 0 ? (
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
                <CheckmarkFilled
                  size={32}
                  style={{ color: 'var(--text-muted)', opacity: 0.5 }}
                />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  {Object.values(filters).some(Boolean)
                    ? 'Nenhuma submissão encontrada com esses filtros.'
                    : 'Nenhuma submissão concluída ainda.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {historyGroups.map(({ client_id, client_name, items }) => (
                  <section key={client_id}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 14,
                      }}
                    >
                      <div
                        style={{
                          width: 3,
                          height: 14,
                          backgroundColor: 'var(--sun)',
                          borderRadius: 2,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {client_name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          opacity: 0.6,
                        }}
                      >
                        {items.length} {items.length === 1 ? 'aprovação' : 'aprovações'}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: 1,
                          backgroundColor: 'var(--border-subtle)',
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: 16,
                      }}
                    >
                      {items.map((sub) => (
                        <AprovacaoCard key={sub.id} submission={sub} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
