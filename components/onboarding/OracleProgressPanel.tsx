'use client';

/**
 * SPEC-015 — OracleProgressPanel: progress per entity with status icons.
 * ADR-LOCAL-01: polling-based, 5s interval.
 */

import { CheckCircle, Circle, Loader, AlertCircle } from 'lucide-react';
import type { OnboardingJobStatus, OntologyEntityType } from '@/lib/onboarding-types';
import { ONTOLOGY_ENTITY_TYPES } from '@/lib/onboarding-types';

interface Props {
  status: OnboardingJobStatus;
}

function EntityRow({ entityType, status, isCurrent }: {
  entityType: OntologyEntityType;
  status: string;
  isCurrent: boolean;
}) {
  const iconProps = { size: 14, strokeWidth: 1.5 };

  let icon: React.ReactNode;
  let color: string;

  if (status === 'generated' || status === 'accepted') {
    icon = <CheckCircle {...iconProps} />;
    color = '#22C55E';
  } else if (isCurrent) {
    icon = (
      <span style={{ display: 'inline-flex', animation: 'spin 1s linear infinite' }}>
        <Loader {...iconProps} />
      </span>
    );
    color = 'var(--sun)';
  } else if (status === 'regenerating') {
    icon = (
      <span style={{ display: 'inline-flex', animation: 'spin 1s linear infinite' }}>
        <Loader {...iconProps} />
      </span>
    );
    color = '#F97316';
  } else {
    icon = <Circle {...iconProps} />;
    color = 'var(--text-muted)';
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 8,
        backgroundColor: isCurrent ? 'rgba(255,200,1,0.05)' : 'transparent',
        border: `1px solid ${isCurrent ? 'rgba(255,200,1,0.2)' : 'var(--border-subtle)'}`,
        transition: 'all 200ms ease',
      }}
    >
      <span style={{ color, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: '0.85rem', color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
        {entityType}
      </span>
      <span
        style={{
          fontSize: '0.65rem',
          color: isCurrent ? 'var(--sun)' : color === 'var(--text-muted)' ? 'var(--text-muted)' : color,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {isCurrent ? 'gerando...' : status === 'generated' || status === 'accepted' ? 'pronto' : status === 'regenerating' ? 'regenerando...' : 'aguardando'}
      </span>
    </div>
  );
}

export default function OracleProgressPanel({ status }: Props) {
  const percent = status.totalEntities > 0
    ? Math.round((status.entitiesDone / status.totalEntities) * 100)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Phase status */}
      <div style={{ display: 'flex', gap: 12 }}>
        <PhaseChip
          label="Drive Sync"
          status={status.driveSyncStatus}
        />
        <PhaseChip
          label="Oráculo"
          status={status.oracleStatus}
        />
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {status.entitiesDone} de {status.totalEntities} entidades
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {percent}%
          </span>
        </div>
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
              width: `${percent}%`,
              backgroundColor: 'var(--sun)',
              borderRadius: 9999,
              transition: 'width 400ms ease',
            }}
          />
        </div>
      </div>

      {/* Entity rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {ONTOLOGY_ENTITY_TYPES.map((et) => (
          <EntityRow
            key={et}
            entityType={et}
            status={status.entities[et] ?? 'pending'}
            isCurrent={status.currentEntity === et}
          />
        ))}
      </div>

      {/* Error */}
      {status.errorDetail && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 8,
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
          }}
        >
          <AlertCircle size={14} strokeWidth={1.5} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: '0.78rem', color: '#EF4444' }}>{status.errorDetail}</span>
        </div>
      )}

      {/* ETA */}
      {status.oracleStatus !== 'done' && (
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Tempo estimado: até {status.etaHours}h. Esta página atualiza automaticamente.
        </p>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function PhaseChip({ label, status }: { label: string; status: string }) {
  const colors = {
    pending: { bg: 'var(--nebula)', border: 'var(--border-subtle)', text: 'var(--text-muted)' },
    running: { bg: 'rgba(255,200,1,0.08)', border: 'rgba(255,200,1,0.25)', text: 'var(--sun)' },
    done: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', text: '#22C55E' },
    error: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#EF4444' },
  };
  const c = colors[status as keyof typeof colors] ?? colors.pending;

  return (
    <div
      style={{
        padding: '5px 12px',
        borderRadius: 9999,
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        fontSize: '0.72rem',
        color: c.text,
        fontWeight: 500,
      }}
    >
      {label}: {status}
    </div>
  );
}
