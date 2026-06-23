'use client';

/**
 * SPEC-015 — Step 4: Summary + "Iniciar Oráculo" confirmation.
 */

import { Document, Globe, Time, User } from '@carbon/icons-react';
import { useOnboardingOraculo } from '@/contexts/OnboardingOraculoContext';
import { ONTOLOGY_ENTITY_TYPES, ENTITY_LABELS } from '@/lib/onboarding-types';

const DEPTH_LABELS = { shallow: 'Rápida (~5 min)', standard: 'Padrão (~15 min)', deep: 'Profunda (~30 min)' };

export default function WizardStep4Confirm() {
  const { wizardState } = useOnboardingOraculo();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          Confirmar e Iniciar
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Revise as configurações antes de iniciar o Oráculo do Cliente.
        </p>
      </div>

      {/* Client summary card */}
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--nebula)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: wizardState.color,
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {wizardState.name || '—'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              /{wizardState.slug || '—'}
            </div>
          </div>
        </div>
        {wizardState.description && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            {wizardState.description}
          </p>
        )}
      </div>

      {/* Config summary */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Sponsor */}
        {wizardState.sponsorName && (
          <SummaryRow
            icon={<User size={14} />}
            label="Sponsor"
            value={`${wizardState.sponsorName}${wizardState.sponsorEmail ? ` — ${wizardState.sponsorEmail}` : ''}`}
          />
        )}

        {/* Oracle depth */}
        <SummaryRow
          icon={<Time size={14} />}
          label="Profundidade"
          value={DEPTH_LABELS[wizardState.oracleConfig.depth]}
        />

        {/* Language */}
        <SummaryRow
          icon={<Globe size={14} />}
          label="Idioma"
          value={wizardState.oracleConfig.language === 'pt-BR' ? 'Português (BR)' : 'English (US)'}
        />

        {/* Domains */}
        <SummaryRow
          icon={<Globe size={14} />}
          label="Domínios"
          value={
            wizardState.oracleConfig.allowedDomains.length > 0
              ? wizardState.oracleConfig.allowedDomains.join(', ')
              : 'Nenhum (pesquisa web desabilitada)'
          }
        />

        {/* Drive folder */}
        <SummaryRow
          icon={<Document size={14} />}
          label="Pasta Drive"
          value={wizardState.driveFolderName
            ? `${wizardState.driveFolderName} (sincroniza ao criar)`
            : 'Nenhuma'}
        />
      </div>

      {/* Entities to be generated */}
      <div
        style={{
          padding: 16,
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--deep)',
        }}
      >
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Entidades a gerar ({ONTOLOGY_ENTITY_TYPES.length})
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ONTOLOGY_ENTITY_TYPES.map((et) => (
            <span
              key={et}
              style={{
                padding: '3px 10px',
                borderRadius: 9999,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--nebula)',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
              }}
            >
              {ENTITY_LABELS[et]}
            </span>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div
        style={{
          padding: '10px 14px',
          borderRadius: 8,
          backgroundColor: 'rgba(255,200,1,0.06)',
          border: '1px solid rgba(255,200,1,0.2)',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
        }}
      >
        Ao confirmar, o Oráculo iniciará em segundo plano. Você será redirecionado para acompanhar
        o progresso. O cliente ficará em status <strong style={{ color: 'var(--sun)' }}>PRE_ACTIVE</strong> até
        a validação HITL de todas as entidades.
      </div>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 8,
        backgroundColor: 'var(--nebula)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <span style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0, width: 80 }}>
        {label}
      </span>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
        {value}
      </span>
    </div>
  );
}
