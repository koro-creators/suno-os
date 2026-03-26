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
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
