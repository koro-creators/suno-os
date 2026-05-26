'use client';

import { CheckCircle, XCircle, RotateCcw, Send, RefreshCcw } from 'lucide-react';
import type { ApprovalEvent } from '@/lib/approval-types';

interface CommentThreadProps {
  events: ApprovalEvent[];
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ACTION_CONFIG = {
  SUBMITTED: {
    label: 'Submetido para aprovação',
    icon: Send,
    color: 'var(--text-muted)',
  },
  RESUBMITTED: {
    label: 'Resubmetido após revisão',
    icon: RefreshCcw,
    color: '#F97316',
  },
  APPROVE: {
    label: 'Aprovado',
    icon: CheckCircle,
    color: '#22C55E',
  },
  REQUEST_CHANGES: {
    label: 'Revisão solicitada',
    icon: RotateCcw,
    color: '#F97316',
  },
  REJECT: {
    label: 'Rejeitado',
    icon: XCircle,
    color: '#EF4444',
  },
} as const;

export default function CommentThread({ events }: CommentThreadProps) {
  if (events.length === 0) {
    return (
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '8px 0' }}>
        Nenhum histórico disponível.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {events.map((evt, idx) => {
        const cfg = ACTION_CONFIG[evt.action] ?? ACTION_CONFIG.SUBMITTED;
        const Icon = cfg.icon;
        const isLast = idx === events.length - 1;

        return (
          <div key={evt.id} style={{ display: 'flex', gap: 10 }}>
            {/* Timeline line + icon */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: `${cfg.color}18`,
                  border: `1px solid ${cfg.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={12} strokeWidth={1.5} style={{ color: cfg.color }} />
              </div>
              {!isLast && (
                <div
                  style={{
                    width: 1,
                    flex: 1,
                    minHeight: 16,
                    backgroundColor: 'var(--border-subtle)',
                    margin: '2px 0',
                  }}
                />
              )}
            </div>

            {/* Content */}
            <div style={{ paddingBottom: isLast ? 0 : 16, paddingTop: 2, flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                <span
                  style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-primary)' }}
                >
                  {evt.user_name}
                </span>
                <span style={{ fontSize: '0.7rem', color: cfg.color }}>
                  {cfg.label}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {formatDateTime(evt.timestamp)}
                </span>
              </div>

              {evt.comment && (
                <blockquote
                  style={{
                    margin: '6px 0 0',
                    padding: '6px 10px',
                    borderLeft: `2px solid ${cfg.color}60`,
                    backgroundColor: 'var(--nebula)',
                    borderRadius: '0 6px 6px 0',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    fontStyle: 'italic',
                  }}
                >
                  {evt.comment}
                </blockquote>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
