'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { BibliotecaItem } from '@/lib/types';
import { chatResponsesByMoon } from '@/data/chat-responses';
import { useStreamingText } from '@/hooks/useStreamingText';
import MessageBubble from './MessageBubble';
import StreamingIndicator from './StreamingIndicator';
import ChatInput from './ChatInput';
import ContextSidebar from './ContextSidebar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  highlight?: { label: string; body: string };
}

interface ChatInterfaceProps {
  moonSlug: string;
  clientSlug: string;
  biblioteca: BibliotecaItem[];
}

const DEFAULT_AGENTES = ['Copywriter', 'Revisor'];

const GENERIC_FALLBACK: { content: string; highlight?: { label: string; body: string } } = {
  content:
    'Entendido. Estou analisando o contexto e preparando uma resposta personalizada com base na biblioteca do cliente e nas melhores praticas do setor.',
};

export default function ChatInterface({ moonSlug, clientSlug, biblioteca }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingHighlight, setPendingHighlight] = useState<{ label: string; body: string } | undefined>();
  const { text: streamingText, isStreaming, startStreaming } = useStreamingText();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const responseIndexRef = useRef<Record<string, number>>({});

  // Auto-scroll to bottom when messages change or while streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // When streaming completes, add the full assistant message
  const prevIsStreamingRef = useRef(false);
  useEffect(() => {
    if (prevIsStreamingRef.current && !isStreaming && streamingText) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: streamingText, highlight: pendingHighlight },
      ]);
      setPendingHighlight(undefined);
    }
    prevIsStreamingRef.current = isStreaming;
  }, [isStreaming, streamingText, pendingHighlight]);

  const handleSend = useCallback(
    (text: string) => {
      if (isStreaming) return;

      // Add user message
      setMessages((prev) => [...prev, { role: 'user', content: text }]);

      // Look up mock response
      // Try client-specific key first, then generic moon key
      const clientKey = `${clientSlug}-${moonSlug}`;
      const responses = chatResponsesByMoon[clientKey] ?? chatResponsesByMoon[moonSlug];

      let response;
      if (responses && responses.length > 0) {
        // Cycle through responses
        const key = clientKey in chatResponsesByMoon ? clientKey : moonSlug;
        const idx = responseIndexRef.current[key] ?? 0;
        response = responses[idx % responses.length];
        responseIndexRef.current[key] = idx + 1;
      } else {
        response = GENERIC_FALLBACK;
      }

      // Store highlight for when streaming completes
      setPendingHighlight(response.highlight);

      // Start streaming after 500ms delay
      setTimeout(() => {
        startStreaming(response.content, 40);
      }, 500);
    },
    [isStreaming, clientSlug, moonSlug, startStreaming],
  );

  return (
    <div className="grid h-full" style={{ gridTemplateColumns: '1fr 280px' }}>
      {/* Left: Chat area */}
      <div className="flex flex-col overflow-hidden">
        {/* Message list */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-lg">
          {messages.map((msg, i) => (
            <MessageBubble key={i} role={msg.role} content={msg.content} highlight={msg.highlight} />
          ))}

          {/* Streaming message or indicator */}
          {isStreaming && streamingText && (
            <MessageBubble role="assistant" content={streamingText} />
          )}
          {isStreaming && !streamingText && <StreamingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 px-lg pb-lg">
          <ChatInput onSend={handleSend} disabled={isStreaming} />
        </div>
      </div>

      {/* Right: Context sidebar */}
      <ContextSidebar biblioteca={biblioteca} agentes={DEFAULT_AGENTES} />
    </div>
  );
}
