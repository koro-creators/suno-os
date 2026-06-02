'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type {
  ApprovalSubmission,
  ApprovalEvent,
  ApprovalFilters,
  ApprovalDecisionPayload,
  ApprovalSubmitPayload,
} from '@/lib/approval-types';
import { initialSubmissions, initialApprovalEvents } from '@/data/approvals-admin';
import { apiAvailable, getApiUrl, getAuthToken } from '@/lib/api';

interface ApprovalsContextValue {
  submissions: ApprovalSubmission[];
  events: ApprovalEvent[];
  loading: boolean;
  error: string | null;
  /** Número de submissões aguardando aprovação (PENDING_APPROVAL) */
  pendingCount: number;
  /** Listar submissions (com filtros opcionais) — retorna subset local */
  getFiltered: (filters?: ApprovalFilters) => ApprovalSubmission[];
  /** Buscar detalhe de uma submission */
  getSubmission: (id: string) => ApprovalSubmission | undefined;
  /** Buscar histórico de eventos de uma submission */
  getEvents: (submissionId: string) => ApprovalEvent[];
  /** Submeter conteúdo para aprovação */
  submitForApproval: (payload: ApprovalSubmitPayload) => Promise<ApprovalSubmission>;
  /** Tomar decisão sobre uma submission */
  decide: (submissionId: string, payload: ApprovalDecisionPayload) => Promise<void>;
}

const ApprovalsContext = createContext<ApprovalsContextValue | null>(null);

export function ApprovalsProvider({ children }: { children: ReactNode }) {
  const [submissions, setSubmissions] = useState<ApprovalSubmission[]>(initialSubmissions);
  const [events, setEvents] = useState<ApprovalEvent[]>(initialApprovalEvents);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => submissions.filter((s) => s.status === 'PENDING_APPROVAL').length,
    [submissions],
  );

  const getFiltered = useCallback(
    (filters?: ApprovalFilters): ApprovalSubmission[] => {
      return submissions.filter((s) => {
        if (filters?.client_id && s.client_id !== filters.client_id) return false;
        if (filters?.skill_slug && s.skill_slug !== filters.skill_slug) return false;
        if (filters?.urgency && s.urgency !== filters.urgency) return false;
        if (filters?.status && s.status !== filters.status) return false;
        return true;
      });
    },
    [submissions],
  );

  const getSubmission = useCallback(
    (id: string): ApprovalSubmission | undefined => {
      return submissions.find((s) => s.id === id);
    },
    [submissions],
  );

  const getEvents = useCallback(
    (submissionId: string): ApprovalEvent[] => {
      return events
        .filter((e) => e.submission_id === submissionId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    },
    [events],
  );

  const submitForApproval = useCallback(
    async (payload: ApprovalSubmitPayload): Promise<ApprovalSubmission> => {
      if (apiAvailable()) {
        const token = await getAuthToken();
        const res = await fetch(getApiUrl('/api/approvals'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        const submission: ApprovalSubmission = await res.json();
        setSubmissions((prev) => [submission, ...prev]);
        return submission;
      }

      // Mock mode
      const now = new Date().toISOString();
      const newSubmission: ApprovalSubmission = {
        id: `sub-${crypto.randomUUID().slice(0, 8)}`,
        client_id: payload.client_id,
        client_name: payload.client_id,
        skill_slug: payload.skill_slug,
        skill_name: payload.skill_slug,
        subject_type: payload.subject_type,
        subject_id: payload.subject_id,
        content: payload.content,
        status: 'PENDING_VALIDATION',
        urgency: payload.urgency ?? 'normal',
        submitted_by: 'current-user',
        submitted_by_name: 'Usuário atual',
        comment: payload.comment,
        round: 1,
        created_at: now,
        updated_at: now,
      };
      const newEvent: ApprovalEvent = {
        id: `evt-${crypto.randomUUID().slice(0, 8)}`,
        submission_id: newSubmission.id,
        action: 'SUBMITTED',
        user_id: 'current-user',
        user_name: 'Usuário atual',
        timestamp: now,
      };
      setSubmissions((prev) => [newSubmission, ...prev]);
      setEvents((prev) => [...prev, newEvent]);
      return newSubmission;
    },
    [],
  );

  const decide = useCallback(
    async (submissionId: string, payload: ApprovalDecisionPayload): Promise<void> => {
      const now = new Date().toISOString();

      if (apiAvailable()) {
        const token = await getAuthToken();
        const endpoint =
          payload.decision === 'APPROVE'
            ? 'approve'
            : payload.decision === 'REQUEST_CHANGES'
              ? 'request-revision'
              : 'reject';
        const res = await fetch(getApiUrl(`/api/approvals/${submissionId}/${endpoint}`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ comment: payload.comment }),
        });
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        const updated: ApprovalSubmission = await res.json();
        setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? updated : s)));
        return;
      }

      // Mock mode
      const nextStatus =
        payload.decision === 'APPROVE'
          ? 'APPROVED'
          : payload.decision === 'REQUEST_CHANGES'
            ? 'CHANGES_REQUESTED'
            : 'REJECTED';

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId ? { ...s, status: nextStatus, updated_at: now } : s,
        ),
      );
      setEvents((prev) => [
        ...prev,
        {
          id: `evt-${crypto.randomUUID().slice(0, 8)}`,
          submission_id: submissionId,
          action: payload.decision,
          comment: payload.comment,
          user_id: 'current-user',
          user_name: 'Aprovador atual',
          timestamp: now,
        },
      ]);
    },
    [],
  );

  return (
    <ApprovalsContext.Provider
      value={{ submissions, events, loading, error, pendingCount, getFiltered, getSubmission, getEvents, submitForApproval, decide }}
    >
      {children}
    </ApprovalsContext.Provider>
  );
}

export function useApprovals() {
  const ctx = useContext(ApprovalsContext);
  if (!ctx) throw new Error('useApprovals must be used within ApprovalsProvider');
  return ctx;
}
