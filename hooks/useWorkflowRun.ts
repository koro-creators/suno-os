'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiAvailable, getApiUrl, getAuthToken } from '@/lib/api';

interface WorkflowRunSSEState {
  status: 'idle' | 'connecting' | 'running' | 'completed' | 'failed';
  stepEvents: Array<{ step_id: string; output: unknown }>;
  error: string | null;
}

/**
 * Hook that connects to the SSE stream of a workflow run in progress
 * and updates status in real time.
 */
export function useWorkflowRun(workflowId: string | null, runId: string | null) {
  const [state, setState] = useState<WorkflowRunSSEState>({
    status: 'idle',
    stepEvents: [],
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const connect = useCallback(async () => {
    if (!workflowId || !runId || !apiAvailable()) return;

    // Abort previous connection
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: 'connecting', stepEvents: [], error: null });

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = getApiUrl(`/api/workflows/${workflowId}/runs/${runId}/stream`);
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        setState((prev) => ({ ...prev, status: 'failed', error: `HTTP ${response.status}` }));
        return;
      }

      setState((prev) => ({ ...prev, status: 'running' }));

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

          let eventType = 'message';
          let eventData = '';
          for (const line of trimmed.split('\n')) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim();
            else if (line.startsWith('data: ')) eventData = line.slice(6);
          }

          if (!eventData) continue;

          try {
            const parsed = JSON.parse(eventData);

            if (eventType === 'step_completed') {
              setState((prev) => ({
                ...prev,
                stepEvents: [...prev.stepEvents, { step_id: parsed.step_id, output: parsed.output }],
              }));
            } else if (eventType === 'workflow_completed') {
              setState((prev) => ({ ...prev, status: 'completed' }));
            } else if (eventType === 'workflow_failed') {
              setState((prev) => ({ ...prev, status: 'failed', error: parsed.error }));
            }
          } catch {
            // skip malformed events
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setState((prev) => ({ ...prev, status: 'failed', error: String(err) }));
      }
    }
  }, [workflowId, runId]);

  const disconnect = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { ...state, connect, disconnect };
}
