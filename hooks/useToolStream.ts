'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { apiAvailable, consumeSSE, SSEEvent } from '@/lib/api';

interface UseToolStreamReturn {
  text: string;
  isStreaming: boolean;
  error: string | null;
  conversationId: string | null;
  startStream: (params: StreamParams) => void;
  startMockStream: (fullText: string, delayMs?: number) => void;
}

interface StreamParams {
  message: string;
  skillSlug: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  contextDocuments?: string[];
  conversationId?: string | null;
  webSearch?: boolean;
}

export function useToolStream(): UseToolStreamReturn {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  /** Stream from the real API backend via SSE. */
  const startStream = useCallback(
    (params: StreamParams) => {
      if (!apiAvailable()) return;

      cleanup();
      setText('');
      setError(null);
      setIsStreaming(true);

      const body = {
        message: params.message,
        skill_slug: params.skillSlug,
        model: params.model || 'gemini-flash',
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 4096,
        system_prompt: params.systemPrompt || null,
        context_documents: params.contextDocuments || [],
        conversation_id: params.conversationId || null,
        web_search: params.webSearch || false,
      };

      (async () => {
        try {
          let accumulated = '';
          for await (const event of consumeSSE('/api/chat/stream', body)) {
            switch (event.event) {
              case 'text':
                accumulated += (event.data.content as string) || '';
                setText(accumulated);
                break;
              case 'done':
                if (event.data.conversation_id) {
                  setConversationId(event.data.conversation_id as string);
                }
                break;
              case 'error':
                setError((event.data.message as string) || 'Unknown error');
                break;
            }
          }
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            setError((err as Error).message || 'Stream failed');
          }
        } finally {
          setIsStreaming(false);
        }
      })();
    },
    [cleanup],
  );

  /** Mock streaming — word-by-word reveal of pre-built text (fallback). */
  const startMockStream = useCallback(
    (fullText: string, delayMs = 40) => {
      cleanup();
      setText('');
      setError(null);
      setIsStreaming(true);

      const tokens = fullText.split(/\s+/).filter(Boolean);
      if (tokens.length === 0) {
        setText('');
        setIsStreaming(false);
        return;
      }

      let index = 0;
      const tick = () => {
        index += 1;
        setText(tokens.slice(0, index).join(' '));

        if (index >= tokens.length) {
          setIsStreaming(false);
          timeoutRef.current = null;
          return;
        }
        timeoutRef.current = setTimeout(tick, delayMs);
      };
      timeoutRef.current = setTimeout(tick, delayMs);
    },
    [cleanup],
  );

  return { text, isStreaming, error, conversationId, startStream, startMockStream };
}
