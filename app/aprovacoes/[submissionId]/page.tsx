'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Clock, AlertCircle, RotateCcw, User, FileText } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import ReviewPanel from '@/components/aprovacoes/ReviewPanel';
import CommentThread from '@/components/aprovacoes/CommentThread';
import { useAuth } from '@/contexts/AuthContext';
import { useApprovals } from '@/contexts/ApprovalsContext';
import type { ApprovalSubmission, ApprovalEvent, DecisionType, Urgency } from '@/lib/approval-types';

/**
 * T-30 — Tela de Review de Aprovação (SPEC-004 / FA-13).
 *
 * Caixa-preta (RN-009/011): não-admin → redirect /404 sem mensagem.
 * Polling 30s conforme ADR-LOCAL-02.
 */

const URGENCY_COLOR: Record<Urgency, string> = {
  low: 'var(--text-muted)',
  normal: 'var(--text-secondary)',
  high: '#EF4444',
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SubmissionReviewPage() {
  const router = useRouter();
  const { submissionId } = useParams<{ submissionId: string }>();
  const { isAdmin, loading: authLoading } = useAuth();
  const { getSubmission, getEvents } = useApprovals();

  const [submission, setSubmission] = useState<ApprovalSubmission | undefined>(undefined);
  const [events, setEvents] = useState<ApprovalEvent[]>([]);
  const [notFound, setNotFound] = useState(false);

  // Caixa-preta: redirect 404 para não-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/404');
    }
  }, [authLoading, isAdmin, router]);

  const loadData = useCallback(() => {
    if (!submissionId) return;
    const sub = getSubmission(submissionId);
    if (!sub) {
      setNotFound(true);
      return;
    }
    setSubmission(sub);
    setEvents(getEvents(submissionId));
  }, [submissionId, getSubmission, getEvents]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling 30s (ADR-LOCAL-02)
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        loadData();
      }
    }, 30_000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadData();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadData]);

  function handleDecisionComplete(_decision: DecisionType) {
    // Recarrega os dados após decisão
    loadData();
  }

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

  if (notFound) {
    return (
      <>
        <AppHeader
          breadcrumbs={[
            { label: 'Aprovações', href: '/aprovacoes' },
            { label: 'Não encontrado', href: '/aprovacoes' },
          ]}
          rightLabel="Admin"
        />
        <main
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12,
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
          }}
        >
          <FileText size={32} strokeWidth={1} style={{ opacity: 0.4 }} />
          <p>Submissão não encontrada.</p>
          <button
            onClick={() => router.push('/aprovacoes')}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            Voltar para Aprovações
          </button>
        </main>
      </>
    );
  }

  if (!submission) {
    return (
      <>
        <AppHeader
          breadcrumbs={[{ label: 'Aprovações', href: '/aprovacoes' }, { label: 'Carregando…', href: '/aprovacoes' }]}
          rightLabel="Admin"
        />
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
      </>
    );
  }

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: 'Aprovações', href: '/aprovacoes' },
          { label: submission.skill_name, href: `/aprovacoes/${submission.id}` },
        ]}
        rightLabel="Admin"
      />
      <main
        id="main-content"
        className="page-enter"
        style={{ flex: 1, overflow: 'auto', padding: 24 }}
      >
        {/* Back */}
        <button
          onClick={() => router.push('/aprovacoes')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: '0.78rem',
            padding: 0,
            marginBottom: 20,
            transition: 'color 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          Voltar para Aprovações
        </button>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 340px',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {/* Left: conteúdo + histórico */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            {/* Header card */}
            <div
              style={{
                backgroundColor: 'var(--deep)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 4,
                    }}
                  >
                    {submission.client_name}
                  </div>
                  <h2
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {submission.skill_name}
                  </h2>
                </div>
                {submission.urgency === 'high' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: URGENCY_COLOR[submission.urgency],
                      flexShrink: 0,
                    }}
                  >
                    <AlertCircle size={13} strokeWidth={1.5} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>Alta urgência</span>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 16,
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <User size={11} strokeWidth={1.5} />
                  {submission.submitted_by_name}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={11} strokeWidth={1.5} />
                  {formatDateTime(submission.created_at)}
                </span>
                {submission.round > 1 && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: '#F97316',
                    }}
                  >
                    <RotateCcw size={11} strokeWidth={1.5} />
                    Round {submission.round} de 3
                  </span>
                )}
              </div>

              {submission.comment && (
                <blockquote
                  style={{
                    margin: 0,
                    padding: '8px 12px',
                    borderLeft: '2px solid var(--sun)',
                    backgroundColor: 'rgba(255,200,1,0.05)',
                    borderRadius: '0 6px 6px 0',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                  }}
                >
                  {submission.comment}
                </blockquote>
              )}
            </div>

            {/* Conteúdo completo */}
            <div
              style={{
                backgroundColor: 'var(--deep)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Conteúdo submetido
              </div>
              <div style={{ padding: 20 }}>
                {/* TODO: render markdown formatting when content uses structured formatting.
                    New deps are prohibited (CLAUDE.md) — react-markdown is out for Phase 20.
                    For Phase D+, evaluate a zero-dep markdown renderer or a light remark plugin. */}
                <pre
                  style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'inherit',
                  }}
                >
                  {submission.content}
                </pre>
              </div>
            </div>

            {/* Histórico */}
            {events.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--deep)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    fontSize: '0.72rem',
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Histórico
                </div>
                <div style={{ padding: '16px 16px 12px' }}>
                  <CommentThread events={events} />
                </div>
              </div>
            )}
          </div>

          {/* Right: painel de decisão (sticky) */}
          <div style={{ position: 'sticky', top: 24 }}>
            <ReviewPanel
              submission={submission}
              onDecisionComplete={handleDecisionComplete}
            />
          </div>
        </div>
      </main>
    </>
  );
}
