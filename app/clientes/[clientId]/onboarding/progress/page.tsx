'use client';

/**
 * SPEC-015 — T-35: Progresso do job Oráculo.
 * Polls GET /api/clients/{slug}/onboarding/status every 5s.
 * Redirects to /validate when all entities are generated.
 * ADR-LOCAL-01: polling, not SSE.
 */

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import OracleProgressPanel from '@/components/onboarding/OracleProgressPanel';
import { useOnboardingOraculo } from '@/contexts/OnboardingOraculoContext';

export default function OnboardingProgressPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;

  const { jobStatus, isPolling, startPolling, stopPolling, error } = useOnboardingOraculo();

  useEffect(() => {
    startPolling(clientId);
    return () => stopPolling();
  }, [clientId, startPolling, stopPolling]);

  // Redirect when all entities generated
  useEffect(() => {
    if (jobStatus?.oracleStatus === 'done') {
      router.push(`/clientes/${clientId}/onboarding/validate`);
    }
  }, [jobStatus, clientId, router]);

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: 'Clientes', href: '/clientes' },
          { label: clientId, href: `/clientes/${clientId}` },
          { label: 'Onboarding', href: '#' },
          { label: 'Progresso', href: '#' },
        ]}
      />
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '40px 24px',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 560,
          }}
        >
          {/* Title */}
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <h1
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 8,
              }}
            >
              Oráculo em execução
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Gerando entidades ontológicas para o cliente <strong>{clientId}</strong>.
              Esta página atualiza automaticamente.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                marginBottom: 20,
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

          {/* Progress panel */}
          {jobStatus ? (
            <div
              style={{
                padding: 24,
                borderRadius: 12,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--deep)',
              }}
            >
              <OracleProgressPanel status={jobStatus} />
            </div>
          ) : (
            <div
              style={{
                padding: 40,
                borderRadius: 12,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--deep)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                color: 'var(--text-muted)',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '2px solid var(--border-subtle)',
                  borderTopColor: 'var(--sun)',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span style={{ fontSize: '0.82rem' }}>Iniciando Oráculo...</span>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
