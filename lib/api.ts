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
