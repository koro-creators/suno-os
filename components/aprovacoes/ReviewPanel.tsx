'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import type { ApprovalSubmission, DecisionType } from '@/lib/approval-types';
import { useApprovals } from '@/contexts/ApprovalsContext';

interface ReviewPanelProps {
  submission: ApprovalSubmission;
  onDecisionComplete?: (decision: DecisionType) => void;
}

type ActionState = 'idle' | 'confirming' | 'saving' | 'done' | 'error';

export default function ReviewPanel({ submission, onDecisionComplete }: ReviewPanelProps) {
  const { decide } = useApprovals();
  const [pendingDecision, setPendingDecision] = useState<DecisionType | null>(null);
  const [comment, setComment] = useState('');
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const isPending =
    submission.status === 'PENDING_APPROVAL' || submission.status === 'PENDING_VALIDATION';

  function handleSelectDecision(d: DecisionType) {
    setPendingDecision(d);
    setActionState('confirming');
    setComment('');
    setErrorMsg('');
  }

  function handleCancel() {
    setPendingDecision(null);
    setActionState('idle');
    setComment('');
    setErrorMsg('');
  }

  async function handleConfirm() {
    if (!pendingDecision) return;
    setActionState('saving');
    setErrorMsg('');
    try {
      await decide(submission.id, { decision: pendingDecision, comment: comment || undefined });
      setActionState('done');
      onDecisionComplete?.(pendingDecision);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erro ao registrar decisão.');
      setActionState('error');
    }
  }

  if (!isPending) {
    return (
      <div
        style={{
          backgroundColor: 'var(--deep)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: 16,
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
        }}
      >
        Esta submissão já foi{' '}
        <strong style={{ color: 'var(--text-secondary)' }}>
          {submission.status === 'APPROVED'
            ? 'aprovada'
            : submission.status === 'REJECTED'
              ? 'rejeitada'
              : submission.status === 'EXPIRED'
                ? 'expirada'
                : 'processada'}
        </strong>
        . Nenhuma ação disponível.
      </div>
    );
  }

  if (actionState === 'done') {
    return (
      <div
        style={{
          backgroundColor: 'var(--deep)',
          border: '1px solid #22C55E40',
          borderRadius: 12,
          padding: 16,
          textAlign: 'center',
        }}
      >
        <CheckCircle size={24} strokeWidth={1.5} style={{ color: '#22C55E', marginBottom: 8 }} />
        <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', margin: 0 }}>
          Decisão registrada com sucesso.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--deep)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '0.78rem',
          fontWeight: 500,
          color: 'var(--text-primary)',
        }}
      >
        Decisão de aprovação
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Action buttons */}
        {actionState === 'idle' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <ActionButton
              icon={<CheckCircle size={13} strokeWidth={1.5} />}
              label="Aprovar"
              color="#22C55E"
              onClick={() => handleSelectDecision('APPROVE')}
            />
            <ActionButton
              icon={<RotateCcw size={13} strokeWidth={1.5} />}
              label="Solicitar revisão"
              color="#F97316"
              onClick={() => handleSelectDecision('REQUEST_CHANGES')}
            />
            <ActionButton
              icon={<XCircle size={13} strokeWidth={1.5} />}
              label="Rejeitar"
              color="#EF4444"
              onClick={() => handleSelectDecision('REJECT')}
            />
          </div>
        )}

        {/* Confirmation form */}
        {(actionState === 'confirming' || actionState === 'saving' || actionState === 'error') &&
          pendingDecision && (
            <>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  padding: '8px 12px',
                  backgroundColor: 'var(--nebula)',
                  borderRadius: 8,
                  borderLeft: `3px solid ${
                    pendingDecision === 'APPROVE'
                      ? '#22C55E'
                      : pendingDecision === 'REJECT'
                        ? '#EF4444'
                        : '#F97316'
                  }`,
                }}
              >
                Confirmar:{' '}
                <strong>
                  {pendingDecision === 'APPROVE'
                    ? 'Aprovar'
                    : pendingDecision === 'REQUEST_CHANGES'
                      ? 'Solicitar revisão'
                      : 'Rejeitar'}
                </strong>
                {pendingDecision === 'REJECT' && (
                  <span style={{ color: '#EF4444', marginLeft: 4 }}>(irreversível)</span>
                )}
              </div>

              <textarea
                placeholder={
                  pendingDecision === 'APPROVE'
                    ? 'Comentário opcional...'
                    : 'Comentário / motivo (recomendado)...'
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                style={{
                  backgroundColor: 'var(--nebula)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  transition: 'border-color 150ms ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sun)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                disabled={actionState === 'saving'}
              />

              {actionState === 'error' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.75rem',
                    color: '#EF4444',
                  }}
                >
                  <AlertTriangle size={12} strokeWidth={1.5} />
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleConfirm}
                  disabled={actionState === 'saving'}
                  style={{
                    flex: 1,
                    backgroundColor:
                      pendingDecision === 'APPROVE'
                        ? '#22C55E'
                        : pendingDecision === 'REJECT'
                          ? '#EF4444'
                          : '#F97316',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    cursor: actionState === 'saving' ? 'not-allowed' : 'pointer',
                    opacity: actionState === 'saving' ? 0.7 : 1,
                    transition: 'opacity 150ms ease',
                  }}
                >
                  {actionState === 'saving' ? 'Registrando…' : 'Confirmar'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={actionState === 'saving'}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'color 150ms ease, border-color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.borderColor = 'var(--twilight)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        backgroundColor: `${color}18`,
        border: `1px solid ${color}40`,
        borderRadius: 8,
        padding: '7px 12px',
        fontSize: '0.78rem',
        fontWeight: 500,
        color,
        cursor: 'pointer',
        transition: 'background-color 150ms ease, border-color 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `${color}28`;
        e.currentTarget.style.borderColor = `${color}80`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = `${color}18`;
        e.currentTarget.style.borderColor = `${color}40`;
      }}
    >
      {icon}
      {label}
    </button>
  );
}
