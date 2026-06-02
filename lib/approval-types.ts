/**
 * Tipos compartilhados para Aprovação Hierárquica (SPEC-004 / FA-13).
 * Enums em UPPER_SNAKE_CASE conforme constitution §5.3.
 */

export type ApprovalStatus =
  | 'PENDING_VALIDATION'
  | 'PENDING_APPROVAL'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED';

export type DecisionType = 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT';

export type SubjectType = 'spark' | 'turn' | 'workflow_output';

export type Urgency = 'low' | 'normal' | 'high';

export type Severity = 'error' | 'warning' | 'info';

export interface Finding {
  severity: Severity;
  span: { start: number; end: number };
  message: string;
  suggestion?: string;
}

/** Submissão de conteúdo para aprovação (ENT-36 simplificado). */
export interface ApprovalSubmission {
  id: string;
  client_id: string;
  client_name: string;
  skill_slug: string;
  skill_name: string;
  subject_type: SubjectType;
  subject_id: string;
  content: string;           // subject_snapshot.content (truncável na listagem)
  original_content?: string; // conteúdo antes da última edição (para diff before/after)
  status: ApprovalStatus;
  urgency: Urgency;
  submitted_by: string;      // user id
  submitted_by_name: string;
  assigned_approver?: string;
  comment?: string;
  round: number;             // 1..3 (anti-loop RN-025)
  created_at: string;        // ISO 8601
  updated_at: string;        // ISO 8601
}

/** Evento de decisão humana (append-only — ENT-37 simplificado). */
export interface ApprovalEvent {
  id: string;
  submission_id: string;
  action: DecisionType | 'SUBMITTED' | 'RESUBMITTED';
  comment?: string;
  user_id: string;
  user_name: string;
  timestamp: string; // ISO 8601
}

/** Payload para criar uma submissão. */
export interface ApprovalSubmitPayload {
  client_id: string;
  skill_slug: string;
  subject_type: SubjectType;
  subject_id: string;
  content: string;
  urgency?: Urgency;
  comment?: string;
}

/** Payload para tomar uma decisão sobre uma submissão. */
export interface ApprovalDecisionPayload {
  decision: DecisionType;
  comment?: string;
}

/** Filtros do inbox. */
export interface ApprovalFilters {
  client_id?: string;
  skill_slug?: string;
  urgency?: Urgency;
  status?: ApprovalStatus;
}
