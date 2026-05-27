'use client';

import { useRouter } from 'next/navigation';
import { CheckmarkFilled, ErrorFilled, Renew, Time, Timer, Warning } from '@carbon/icons-react';
import type { ApprovalSubmission, ApprovalStatus, Urgency } from '@/lib/approval-types';

interface AprovacaoCardProps {
  submission: ApprovalSubmission;
}

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; icon: typeof CheckmarkFilled }> = {
  PENDING_VALIDATION: { label: 'Validando', color: 'var(--text-muted)', icon: Timer },
  PENDING_APPROVAL: { label: 'Aguardando aprovação', color: '#FFC801', icon: Time },
  CHANGES_REQUESTED: { label: 'Revisão solicitada', color: '#F97316', icon: Renew },
  APPROVED: { label: 'Aprovado', color: '#22C55E', icon: CheckmarkFilled },
  REJECTED: { label: 'Rejeitado', color: '#EF4444', icon: ErrorFilled },
  EXPIRED: { label: 'Expirado', color: 'var(--text-muted)', icon: ErrorFilled },
};

const URGENCY_CONFIG: Record<Urgency, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'var(--text-muted)' },
  normal: { label: 'Normal', color: 'var(--text-secondary)' },
  high: { label: 'Alta', color: '#EF4444' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

export default function AprovacaoCard({ submission }: AprovacaoCardProps) {
  const router = useRouter();
  const statusCfg = STATUS_CONFIG[submission.status];
  const urgencyCfg = URGENCY_CONFIG[submission.urgency];
  const StatusIcon = statusCfg.icon;

  const isPending =
    submission.status === 'PENDING_APPROVAL' || submission.status === 'PENDING_VALIDATION';

  return (
    <div
      style={{
        backgroundColor: 'var(--deep)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'border-color 150ms ease, background-color 150ms ease',
        cursor: 'pointer',
      }}
      onClick={() => router.push(`/aprovacoes/${submission.id}`)}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--twilight)';
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--nebula)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--deep)';
      }}
    >
      {/* Header: cliente + skill */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 2,
            }}
          >
            {submission.client_name}
          </div>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {submission.skill_name}
          </div>
        </div>

        {/* Urgência + Status */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          {submission.urgency === 'high' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Warning size={11} style={{ color: urgencyCfg.color }} />
              <span style={{ fontSize: '0.65rem', color: urgencyCfg.color, fontWeight: 500 }}>
                {urgencyCfg.label}
              </span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              backgroundColor: `${statusCfg.color}18`,
              border: `1px solid ${statusCfg.color}40`,
              borderRadius: 9999,
              padding: '2px 8px',
            }}
          >
            <StatusIcon size={10} style={{ color: statusCfg.color }} />
            <span style={{ fontSize: '0.65rem', color: statusCfg.color, fontWeight: 500 }}>
              {statusCfg.label}
            </span>
          </div>
        </div>
      </div>

      {/* Conteúdo truncado */}
      <p
        style={{
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          margin: 0,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {truncate(submission.content, 180)}
      </p>

      {/* Footer: submitter + data + CTA */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 10,
          gap: 8,
        }}
      >
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {submission.submitted_by_name}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0 4px' }}>·</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {formatDate(submission.created_at)}
          </span>
          {submission.round > 1 && (
            <>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0 4px' }}>·</span>
              <span style={{ fontSize: '0.7rem', color: '#F97316' }}>
                Round {submission.round}
              </span>
            </>
          )}
        </div>

        {isPending && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/aprovacoes/${submission.id}`);
            }}
            style={{
              backgroundColor: 'var(--sun)',
              color: 'var(--void)',
              border: 'none',
              borderRadius: 9999,
              padding: '4px 12px',
              fontSize: '0.7rem',
              fontWeight: 500,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Revisar
          </button>
        )}
      </div>
    </div>
  );
}
