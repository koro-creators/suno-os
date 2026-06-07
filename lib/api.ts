/**
 * HTTP client for the sunOS API backend.
 *
 * When NEXT_PUBLIC_API_URL is not set, apiAvailable() returns false
 * and the frontend falls back to mock streaming.
 */

import type { SkillAdmin } from './admin-types';
import type { ClientAdmin } from './client-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function apiAvailable(): boolean {
  return !!API_URL;
}

export function getApiUrl(path: string): string {
  return `${API_URL}${path}`;
}

/** Get the Firebase JWT token for authenticated API requests. */
export async function getAuthToken(): Promise<string | null> {
  try {
    const { getFirebase } = await import('@/lib/firebase');
    const { auth } = getFirebase();
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

/** Build headers with optional auth token. */
async function getHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = await getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/** SSE event parsed from the backend stream. */
export interface SSEEvent {
  event: string; // "text" | "sources" | "tool_call" | "tool_result" | "done" | "error"
  data: Record<string, unknown>;
}

/** Parse a single SSE event string into an SSEEvent object. */
function parseSSEEvent(raw: string): SSEEvent | null {
  let event = 'message';
  let data = '';

  for (const line of raw.split('\n')) {
    if (line.startsWith('event: ')) {
      event = line.slice(7).trim();
    } else if (line.startsWith('data: ')) {
      data = line.slice(6);
    }
  }

  if (!data) return null;

  try {
    return { event, data: JSON.parse(data) };
  } catch {
    return { event, data: { raw: data } };
  }
}

/**
 * Consume an SSE stream from the backend.
 * Yields parsed SSEEvent objects as they arrive.
 */
export async function* consumeSSE(
  path: string,
  body: Record<string, unknown>,
): AsyncGenerator<SSEEvent> {
  const url = getApiUrl(path);
  const headers = await getHeaders();
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    yield {
      event: 'error',
      data: { message: `API error: ${response.status} ${response.statusText}` },
    };
    return;
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop()!;

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const event = parseSSEEvent(trimmed);
      if (event) yield event;
    }
  }

  // Process any remaining buffer
  if (buffer.trim()) {
    const event = parseSSEEvent(buffer.trim());
    if (event) yield event;
  }
}

/* ------------------------------------------------------------------ */
/*  Batch endpoint types                                              */
/* ------------------------------------------------------------------ */

export interface TextGenParams {
  prompt: string;
  content_type?: string;
  tone?: string;
  length?: string;
  variations?: number;
  skill_slug?: string;
  model?: string;
  context_documents?: string[];
}

export interface TextGenResponse {
  texts: string[];
  model: string;
  tokens_used: number;
}

export interface ImageGenParams {
  prompt: string;
  model?: string;
  aspect_ratio?: string;
  quantity?: number;
  style?: string | null;
  enhance_prompt?: boolean;
}

export interface ImageResult {
  url: string;
  width: number;
  height: number;
}

export interface ImageGenResponse {
  images: ImageResult[];
  model: string;
  enhanced_prompt: string | null;
}

export interface EnhancePromptParams {
  prompt: string;
  target_tool?: string;
  context?: string | null;
}

export interface EnhancePromptResponse {
  enhanced_prompt: string;
  suggestions: string[];
  reasoning: string;
}

/* ------------------------------------------------------------------ */
/*  Batch endpoint functions                                          */
/* ------------------------------------------------------------------ */

/** Generate text variations via the batch endpoint. */
export async function generateText(params: TextGenParams): Promise<TextGenResponse> {
  const url = getApiUrl('/api/chat/generate-text');
  const headers = await getHeaders();
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: params.prompt,
      content_type: params.content_type ?? 'social_post',
      tone: params.tone ?? 'creative',
      length: params.length ?? 'medium',
      variations: params.variations ?? 1,
      skill_slug: params.skill_slug ?? null,
      model: params.model ?? 'gemini-flash',
      context_documents: params.context_documents ?? [],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/** Generate images via the batch endpoint. */
export async function generateImage(params: ImageGenParams): Promise<ImageGenResponse> {
  const url = getApiUrl('/api/chat/generate-image');
  const headers = await getHeaders();
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: params.prompt,
      model: params.model ?? 'imagen-4-standard',
      aspect_ratio: params.aspect_ratio ?? '1:1',
      quantity: params.quantity ?? 1,
      style: params.style ?? null,
      enhance_prompt: params.enhance_prompt ?? true,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/** Enhance a prompt for better results. */
export async function enhancePrompt(params: EnhancePromptParams): Promise<EnhancePromptResponse> {
  const url = getApiUrl('/api/chat/enhance-prompt');
  const headers = await getHeaders();
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: params.prompt,
      target_tool: params.target_tool ?? 'chat',
      context: params.context ?? null,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// SPEC-005 — Workflow Canvas API (Phase A stubs; backend returns 501 until B)
// ---------------------------------------------------------------------------

import type {
  AutoLayoutResponse,
  MigrateV2Response,
  ValidateWorkflowResponse,
  WorkflowEdge,
} from '@/lib/workflow-types';

async function workflowFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = getApiUrl(path);
  const headers = await getHeaders();
  const response = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Workflow API ${response.status}: ${text || response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function getWorkflowEdges(workflowId: string): Promise<WorkflowEdge[]> {
  return workflowFetch<WorkflowEdge[]>(`/api/workflows/${workflowId}/edges`);
}

export async function setWorkflowEdges(
  workflowId: string,
  edges: WorkflowEdge[],
): Promise<WorkflowEdge[]> {
  return workflowFetch<WorkflowEdge[]>(`/api/workflows/${workflowId}/edges`, {
    method: 'POST',
    body: JSON.stringify({ edges }),
  });
}

export async function deleteWorkflowEdge(workflowId: string, edgeId: string): Promise<void> {
  const url = getApiUrl(`/api/workflows/${workflowId}/edges/${edgeId}`);
  const headers = await getHeaders();
  const response = await fetch(url, { method: 'DELETE', headers });
  if (!response.ok && response.status !== 204) {
    throw new Error(`Workflow API ${response.status}: ${response.statusText}`);
  }
}

export async function autoLayoutWorkflow(workflowId: string): Promise<AutoLayoutResponse> {
  return workflowFetch<AutoLayoutResponse>(`/api/workflows/${workflowId}/auto-layout`, {
    method: 'POST',
  });
}

export async function validateWorkflow(workflowId: string): Promise<ValidateWorkflowResponse> {
  return workflowFetch<ValidateWorkflowResponse>(`/api/workflows/${workflowId}/validate`, {
    method: 'POST',
  });
}

export async function migrateWorkflowV2(workflowId: string): Promise<MigrateV2Response> {
  return workflowFetch<MigrateV2Response>(`/api/workflows/${workflowId}/migrate-v2`, {
    method: 'POST',
  });
}

// ---------------------------------------------------------------------------
// SPEC-006 — Drive Read-Only (Phase 18 scaffolding)
// ---------------------------------------------------------------------------

export interface DriveStatusResponse {
  connected: boolean;
  email: string | null;
  last_sync: string | null;
  doc_count: number;
}

export interface DriveAuthResponse {
  auth_url: string;
}

export interface DriveSyncResponse {
  status: string;
  job_id: string;
}

async function driveFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = getApiUrl(path);
  const headers = await getHeaders();
  const response = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Drive API ${response.status}: ${text || response.statusText}`);
  }
  return response.json() as Promise<T>;
}

/** Get the current Drive OAuth connection status. */
export async function getDriveStatus(): Promise<DriveStatusResponse> {
  if (!apiAvailable()) {
    // Mock-mode: no connection
    return { connected: false, email: null, last_sync: null, doc_count: 0 };
  }
  return driveFetch<DriveStatusResponse>('/api/drive/status');
}

/** Start the Drive OAuth flow — returns the authorization URL. */
export async function startDriveAuth(): Promise<DriveAuthResponse> {
  if (!apiAvailable()) {
    return { auth_url: '#mock-oauth-not-available' };
  }
  return driveFetch<DriveAuthResponse>('/api/drive/auth');
}

/** Trigger a manual Drive sync. */
export async function triggerDriveSync(): Promise<DriveSyncResponse> {
  if (!apiAvailable()) {
    return { status: 'sync_started', job_id: 'mock-job-id' };
  }
  return driveFetch<DriveSyncResponse>('/api/drive/sync', { method: 'POST' });
}

/** Revoke the Drive OAuth connection. */
export async function disconnectDrive(): Promise<void> {
  if (!apiAvailable()) return;
  await driveFetch<{ status: string }>('/api/drive/disconnect', { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// SPEC-004 — Approval Hierarchy API (Phase 20)
// ---------------------------------------------------------------------------

import type {
  ApprovalSubmission,
  ApprovalEvent,
  ApprovalFilters,
  ApprovalSubmitPayload,
  ApprovalDecisionPayload,
} from '@/lib/approval-types';

async function approvalFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = getApiUrl(path);
  const headers = await getHeaders();
  const response = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Approval API ${response.status}: ${text || response.statusText}`);
  }
  return response.json() as Promise<T>;
}

/** Listar submissions do inbox com filtros opcionais. */
export async function getApprovalInbox(filters?: ApprovalFilters): Promise<ApprovalSubmission[]> {
  const params = new URLSearchParams();
  if (filters?.client_id) params.set('client_id', filters.client_id);
  if (filters?.skill_slug) params.set('skill_slug', filters.skill_slug);
  if (filters?.urgency) params.set('urgency', filters.urgency);
  if (filters?.status) params.set('status', filters.status);
  const qs = params.toString();
  return approvalFetch<ApprovalSubmission[]>(`/api/approvals${qs ? `?${qs}` : ''}`);
}

/** Buscar detalhe de uma submission. */
export async function getApprovalRequest(id: string): Promise<ApprovalSubmission> {
  return approvalFetch<ApprovalSubmission>(`/api/approvals/${id}`);
}

/** Submeter conteúdo para aprovação. */
export async function submitApproval(payload: ApprovalSubmitPayload): Promise<ApprovalSubmission> {
  return approvalFetch<ApprovalSubmission>('/api/approvals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Aprovar uma submission. */
export async function approveApproval(id: string, comment?: string): Promise<ApprovalSubmission> {
  return approvalFetch<ApprovalSubmission>(`/api/approvals/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  });
}

/** Solicitar revisão de uma submission. */
export async function requestRevision(id: string, comment?: string): Promise<ApprovalSubmission> {
  return approvalFetch<ApprovalSubmission>(`/api/approvals/${id}/request-revision`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  });
}

/** Rejeitar uma submission. */
export async function rejectApproval(id: string, comment?: string): Promise<ApprovalSubmission> {
  return approvalFetch<ApprovalSubmission>(`/api/approvals/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  });
}

/** Buscar histórico de eventos de uma submission. */
export async function getApprovalHistory(id: string): Promise<ApprovalEvent[]> {
  const data = await approvalFetch<{ submission_id: string; events: ApprovalEvent[] }>(
    `/api/approvals/${id}/history`,
  );
  return data.events;
}

/** Decisão unificada — delega para o endpoint correto. */
export async function decideApproval(
  id: string,
  payload: ApprovalDecisionPayload,
): Promise<ApprovalSubmission> {
  if (payload.decision === 'APPROVE') return approveApproval(id, payload.comment);
  if (payload.decision === 'REQUEST_CHANGES') return requestRevision(id, payload.comment);
  return rejectApproval(id, payload.comment);
}

// ---------------------------------------------------------------------------
// SPEC-005 TASK-C08b — tool catalog filtered by user RBAC
// ---------------------------------------------------------------------------

export interface ToolDescriptor {
  tool_name: string;
  label: string;
  category: 'criacao' | 'midia' | 'planejamento' | 'controle';
  description: string;
  default_config: Record<string, unknown>;
  role_restriction: string[] | null;
}

// ---------------------------------------------------------------------------
// Phase 11 — Conversation persistence (GET only; backend saves via chat runner)
// ---------------------------------------------------------------------------

export interface ConversationMessage {
  role: string;
  content: string;
  timestamp: string | null;
}

export interface ConversationDetail {
  id: string;
  skill_slug: string | null;
  title: string | null;
  messages: ConversationMessage[];
}

export async function getConversation(
  id: string,
  userId: string,
): Promise<ConversationDetail | null> {
  if (!apiAvailable()) return null;
  const url = getApiUrl(`/api/conversations/${id}`);
  const headers = await getHeaders();
  headers['X-User-ID'] = userId;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    return res.json() as Promise<ConversationDetail>;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Admin — Users (DB-backed; autorização via users.role no backend)
// ---------------------------------------------------------------------------

export interface AdminUser {
  uid: string;
  name: string | null;
  email: string;
  role: 'admin' | 'creator' | 'viewer';
  is_active: boolean;
  last_access: string | null;
  created_at?: string | null;
}

export async function listAdminUsers(status?: string): Promise<AdminUser[]> {
  if (!apiAvailable()) return [];
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const url = getApiUrl(`/api/admin/users${qs}`);
  const headers = await getHeaders();
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? []) as AdminUser[];
  } catch {
    return [];
  }
}

export async function updateAdminUser(
  uid: string,
  updates: { role?: 'admin' | 'creator' | 'viewer'; is_active?: boolean },
): Promise<AdminUser | null> {
  if (!apiAvailable()) return null;
  const url = getApiUrl(`/api/admin/users/${uid}`);
  const headers = await getHeaders();
  headers['Content-Type'] = 'application/json';
  try {
    const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(updates) });
    if (!res.ok) return null;
    return (await res.json()) as AdminUser;
  } catch {
    return null;
  }
}

export async function inviteAdminUser(
  email: string,
  role: 'admin' | 'creator' | 'viewer',
): Promise<{ status: string; uid: string } | null> {
  if (!apiAvailable()) return null;
  const url = getApiUrl('/api/admin/users/invite');
  const headers = await getHeaders();
  headers['Content-Type'] = 'application/json';
  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ email, role }) });
    if (!res.ok) return null;
    return (await res.json()) as { status: string; uid: string };
  } catch {
    return null;
  }
}

export async function listAvailableTools(): Promise<ToolDescriptor[]> {
  if (!apiAvailable()) {
    // Mock fallback: front-end can still render the palette during dev
    // when NEXT_PUBLIC_API_URL is unset.
    return [
      {
        tool_name: 'search_knowledge',
        label: 'Buscar conhecimento',
        category: 'criacao',
        description: 'Pesquisa Biblioteca + web (mock).',
        default_config: { query: '' },
        role_restriction: null,
      },
      {
        tool_name: 'log_result',
        label: 'Registrar resultado',
        category: 'planejamento',
        description: 'Persistência simples (mock).',
        default_config: {},
        role_restriction: null,
      },
    ];
  }
  return workflowFetch<ToolDescriptor[]>('/api/tools?for_user=current');
}

// ---------------------------------------------------------------------------
// Skills catalog (SPEC-017) — DB-backed CRUD
// ---------------------------------------------------------------------------

/** Lista skills do backend. Retorna null em mock-mode (sem API). */
export async function listSkills(): Promise<SkillAdmin[] | null> {
  if (!apiAvailable()) return null;
  try {
    const res = await fetch(getApiUrl('/api/skills/'), { headers: await getHeaders() });
    if (!res.ok) return null;
    return (await res.json()) as SkillAdmin[];
  } catch {
    return null;
  }
}

/** Cria skill. Retorna a skill criada (com id do server) ou null em falha. */
export async function createSkillApi(data: Omit<SkillAdmin, 'id'>): Promise<SkillAdmin | null> {
  if (!apiAvailable()) return null;
  try {
    const res = await fetch(getApiUrl('/api/skills/'), {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return (await res.json()) as SkillAdmin;
  } catch {
    return null;
  }
}

/** Atualiza skill (PATCH parcial). Best-effort: retorna null em falha. */
export async function updateSkillApi(
  id: string,
  data: Partial<SkillAdmin>,
): Promise<SkillAdmin | null> {
  if (!apiAvailable()) return null;
  try {
    const res = await fetch(getApiUrl(`/api/skills/${id}`), {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return (await res.json()) as SkillAdmin;
  } catch {
    return null;
  }
}

/** Remove skill. Retorna true se removida (204). */
export async function deleteSkillApi(id: string): Promise<boolean> {
  if (!apiAvailable()) return false;
  try {
    const res = await fetch(getApiUrl(`/api/skills/${id}`), {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Clientes (admin) — listagem DB-backed
// ---------------------------------------------------------------------------

/** Linha crua do backend (snake_case) — Client.to_dict(). */
interface ClientApiRow {
  id: string;
  name: string;
  slug: string;
  status?: string;
  color?: string | null;
  description?: string | null;
  sponsor_name?: string | null;
  sponsor_email?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Mapeia o shape do banco para o ClientAdmin do front (métricas zeradas — ainda não há analytics). */
function mapClientRow(r: ClientApiRow): ClientAdmin {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    color: r.color || '#FFC801',
    description: r.description || '',
    contact: r.sponsor_email || r.sponsor_name || '',
    assignedSkills: [],
    metrics: {
      totalSessions: 0,
      totalFeedbacks: 0,
      averageScore: 0,
      topSkill: '',
      lastActivity: r.updated_at || '',
    },
    createdAt: r.created_at || '',
    updatedAt: r.updated_at || '',
    status: (r.status as ClientAdmin['status']) || 'ACTIVE',
  };
}

/** Lista clientes do banco. null em mock-mode (sem API). */
export async function listClients(): Promise<ClientAdmin[] | null> {
  if (!apiAvailable()) return null;
  try {
    const res = await fetch(getApiUrl('/api/clients'), { headers: await getHeaders() });
    if (!res.ok) return null;
    const rows = (await res.json()) as ClientApiRow[];
    return rows.map(mapClientRow);
  } catch {
    return null;
  }
}

/**
 * Gera o Oráculo de um cliente legado (sem ontologia) — cria job + dispara geração.
 * `allowedDomains` restringe a busca web (vazio = sem pesquisa). Retorna ok/erro.
 */
export async function backfillOnboarding(
  slug: string,
  allowedDomains: string[],
  language = 'pt-BR',
): Promise<{ ok: boolean; status: number }> {
  if (!apiAvailable()) return { ok: false, status: 0 };
  try {
    const res = await fetch(getApiUrl(`/api/clients/${slug}/onboarding/backfill`), {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ allowed_domains: allowedDomains, language }),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}
