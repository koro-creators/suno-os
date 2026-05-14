/**
 * CanvasStatusBanner — auto-save / validation status + concurrent-edit warning
 * (SPEC-005 TASK-C15).
 *
 * Three banner kinds, mutually exclusive priority:
 *
 *   1. Concurrent edit (FR-WBC-13). If `concurrentEditWithinMin <= 5`, show
 *      amber banner: "Outro usuário editou há Xmin". Highest priority — the
 *      user might be about to overwrite someone else's work.
 *   2. Validation error. If validate() returned hard errors, red banner with
 *      the count + first error detail.
 *   3. Auto-save status. Default — green when saved, grey when idle/dirty,
 *      blue when saving, red when error.
 *
 * The banner is `aria-live="polite"` so screen readers announce changes
 * without interrupting; the concurrent edit case bumps to `assertive`.
 */
'use client';

import type { CSSProperties } from 'react';
import { CircleAlert, CheckCircle2, Loader2, Users } from 'lucide-react';
import type { AutoSaveStatus } from '@/hooks/useWorkflowAutoSave';

interface BannerProps {
  saveStatus: AutoSaveStatus;
  savedAt: Date | null;
  saveError: Error | null;
  hardErrorCount?: number;
  hardErrorSample?: string;
  concurrentEditUser?: string | null;
  concurrentEditWithinMin?: number | null;
}

const BAR: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 12px',
  fontSize: 12,
  borderTop: '1px solid var(--border-subtle)',
  borderBottom: '1px solid var(--border-subtle)',
};

function formatTime(d: Date) {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function CanvasStatusBanner({
  saveStatus,
  savedAt,
  saveError,
  hardErrorCount = 0,
  hardErrorSample,
  concurrentEditUser,
  concurrentEditWithinMin,
}: BannerProps) {
  // Priority 1 — concurrent edit warning.
  if (concurrentEditUser && concurrentEditWithinMin !== null && concurrentEditWithinMin !== undefined && concurrentEditWithinMin <= 5) {
    return (
      <div role="status" aria-live="assertive" style={{ ...BAR, background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
        <Users size={14} strokeWidth={1.5} />
        <span>
          {concurrentEditUser} editou há {concurrentEditWithinMin}min. Salvar pode sobrescrever alterações.
        </span>
      </div>
    );
  }

  // Priority 2 — validation hard errors.
  if (hardErrorCount > 0) {
    return (
      <div role="alert" aria-live="assertive" style={{ ...BAR, background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
        <CircleAlert size={14} strokeWidth={1.5} />
        <span>
          {hardErrorCount === 1 ? '1 erro de validação' : `${hardErrorCount} erros de validação`}
          {hardErrorSample ? ` — ${hardErrorSample}` : ''}
        </span>
      </div>
    );
  }

  // Priority 3 — auto-save status.
  switch (saveStatus) {
    case 'saving':
      return (
        <div role="status" aria-live="polite" style={{ ...BAR, background: 'rgba(59,130,246,0.10)', color: '#3B82F6' }}>
          <Loader2 size={14} strokeWidth={1.5} className="spin" />
          <span>Salvando…</span>
        </div>
      );
    case 'saved':
      return (
        <div role="status" aria-live="polite" style={{ ...BAR, background: 'rgba(34,197,94,0.10)', color: '#22C55E' }}>
          <CheckCircle2 size={14} strokeWidth={1.5} />
          <span>Salvo às {savedAt ? formatTime(savedAt) : '...'}</span>
        </div>
      );
    case 'error':
      return (
        <div role="alert" style={{ ...BAR, background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
          <CircleAlert size={14} strokeWidth={1.5} />
          <span>Erro ao salvar — {saveError?.message ?? 'tente novamente'}</span>
        </div>
      );
    case 'dirty':
      return (
        <div role="status" aria-live="polite" style={{ ...BAR, background: 'transparent', color: 'var(--text-muted)' }}>
          <span>Editando…</span>
        </div>
      );
    case 'idle':
    default:
      return (
        <div role="status" style={{ ...BAR, background: 'transparent', color: 'var(--text-muted)' }}>
          <span>Pronto</span>
        </div>
      );
  }
}
