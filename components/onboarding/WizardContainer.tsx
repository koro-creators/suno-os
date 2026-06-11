'use client';

/**
 * SPEC-015 — WizardContainer: controls 4-step wizard navigation.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingOraculo } from '@/contexts/OnboardingOraculoContext';
import { setClientDriveFolder, syncClientDrive } from '@/lib/api';
import { WIZARD_STEP_LABELS } from '@/lib/onboarding-types';
import WizardStep1Metadata from './WizardStep1Metadata';
import WizardStep2Oracle from './WizardStep2Oracle';
import WizardStep3Drive from './WizardStep3Drive';
import WizardStep4Confirm from './WizardStep4Confirm';

export default function WizardContainer() {
  const router = useRouter();
  const { wizardState, updateWizard, submitWizard, startOracle, error } = useOnboardingOraculo();
  const [confirmPhase, setConfirmPhase] = useState<'idle' | 'creating' | 'syncing'>('idle');

  const steps = [1, 2, 3, 4] as const;

  const handleNext = () => {
    if (wizardState.step < 4) {
      updateWizard({ step: (wizardState.step + 1) as 2 | 3 | 4 });
    }
  };

  const handleBack = () => {
    if (wizardState.step > 1) {
      updateWizard({ step: (wizardState.step - 1) as 1 | 2 | 3 });
    }
  };

  const handleConfirm = async () => {
    setConfirmPhase('creating');
    try {
      const created = await submitWizard();
      if (!created) return;

      // Pasta do Drive validada no passo 3: vincula + sincroniza antes do
      // Oráculo. Best-effort — falha aqui não bloqueia o onboarding (a pasta
      // pode ser reconectada depois no editor do cliente, aba Drive).
      if (wizardState.driveFolder) {
        setConfirmPhase('syncing');
        try {
          await setClientDriveFolder(created.slug, wizardState.driveFolder);
          await syncClientDrive(created.slug);
        } catch {
          // segue sem docs; editor do cliente permite reconectar
        }
      }

      const started = await startOracle(created.slug);
      if (!started) return;

      router.push(`/clientes/${created.slug}/onboarding/progress`);
    } finally {
      setConfirmPhase('idle');
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 24px',
        overflowY: 'auto',
      }}
    >
      {/* Step indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          marginBottom: 40,
        }}
      >
        {steps.map((s, idx) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  backgroundColor:
                    wizardState.step === s
                      ? 'var(--sun)'
                      : wizardState.step > s
                      ? 'var(--nebula)'
                      : 'var(--nebula)',
                  color:
                    wizardState.step === s
                      ? 'var(--void)'
                      : wizardState.step > s
                      ? 'var(--text-secondary)'
                      : 'var(--text-muted)',
                  border: wizardState.step === s
                    ? '2px solid var(--sun)'
                    : '1px solid var(--border-subtle)',
                  transition: 'all 200ms ease',
                }}
              >
                {wizardState.step > s ? '✓' : s}
              </div>
              <span
                style={{
                  fontSize: '0.6rem',
                  color: wizardState.step === s ? 'var(--text-primary)' : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.04em',
                }}
              >
                {WIZARD_STEP_LABELS[s]}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                style={{
                  width: 60,
                  height: 1,
                  backgroundColor: wizardState.step > s
                    ? 'var(--sun)'
                    : 'var(--border-subtle)',
                  marginBottom: 20,
                  transition: 'background-color 200ms ease',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div
        style={{
          width: '100%',
          maxWidth: 600,
          backgroundColor: 'var(--deep)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: '32px',
        }}
      >
        {wizardState.step === 1 && <WizardStep1Metadata />}
        {wizardState.step === 2 && <WizardStep2Oracle />}
        {wizardState.step === 3 && <WizardStep3Drive />}
        {wizardState.step === 4 && <WizardStep4Confirm />}

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 8,
              backgroundColor: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#EF4444',
              fontSize: '0.8rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 32,
            paddingTop: 24,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <button
            onClick={handleBack}
            disabled={wizardState.step === 1}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'transparent',
              color: wizardState.step === 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              cursor: wizardState.step === 1 ? 'not-allowed' : 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            Voltar
          </button>

          {wizardState.step < 4 ? (
            <button
              onClick={handleNext}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: '1px solid var(--sun)',
                backgroundColor: 'var(--sun)',
                color: 'var(--void)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={confirmPhase !== 'idle'}
              style={{
                padding: '8px 24px',
                borderRadius: 8,
                border: '1px solid var(--sun)',
                backgroundColor: 'var(--sun)',
                color: 'var(--void)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: confirmPhase !== 'idle' ? 'wait' : 'pointer',
                opacity: confirmPhase !== 'idle' ? 0.6 : 1,
                transition: 'all 150ms ease',
              }}
            >
              {confirmPhase === 'creating'
                ? 'Criando cliente…'
                : confirmPhase === 'syncing'
                ? 'Sincronizando Drive…'
                : 'Iniciar Oráculo'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
