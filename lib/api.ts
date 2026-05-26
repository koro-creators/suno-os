/**
 * HTTP client for the sunOS API backend.
 *
 * When NEXT_PUBLIC_API_URL is not set, apiAvailable() returns false
 * and the frontend falls back to mock streaming.
 */

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
