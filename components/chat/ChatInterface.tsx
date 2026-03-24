'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BibliotecaDocument } from '@/lib/biblioteca-types';
import { MessageFeedback, SessionFeedback } from '@/lib/feedback-types';
import { chatResponsesByMoon } from '@/data/chat-responses';
import { useStreamingText } from '@/hooks/useStreamingText';
import MessageBubble from './MessageBubble';
import StreamingIndicator from './StreamingIndicator';
import ChatInput from './ChatInput';
import ContextSidebar from './ContextSidebar';
import PromptTemplateBar from './PromptTemplateBar';
import VariationCards from './VariationCards';
import { getTemplatesForChat } from '@/data/prompt-templates';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  highlight?: { label: string; body: string };
}

interface ChatInterfaceProps {
  moonSlug: string;
  skillSlug: string;
  clientSlug: string;
  documents: BibliotecaDocument[];
  initialActiveDocIds: string[];
}

const DEFAULT_AGENTES = ['Copywriter', 'Revisor'];

const GENERIC_FALLBACK: { content: string; highlight?: { label: string; body: string } } = {
  content:
    'Entendido. Estou analisando o contexto e preparando uma resposta personalizada com base na biblioteca do cliente e nas melhores praticas do setor.',
};

export default function ChatInterface({ moonSlug, skillSlug, clientSlug, documents, initialActiveDocIds }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeDocIds, setActiveDocIds] = useState<string[]>(initialActiveDocIds);
  const [pendingHighlight, setPendingHighlight] = useState<{ label: string; body: string } | undefined>();
  const [savedMessages, setSavedMessages] = useState<Set<number>>(new Set());
  const [variations, setVariations] = useState<Record<number, {
    variants: string[];
    selectedIndex: number;
    originalHighlight?: { label: string; body: string };
  }>>({});
  const [feedbacks, setFeedbacks] = useState<Record<number, MessageFeedback>>({});
  const [sessionFeedback, setSessionFeedback] = useState<SessionFeedback | null>(null);

  const templates = getTemplatesForChat(skillSlug, moonSlug);
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

  function handleGenerateVariation(msgIndex: number) {
    const msg = messages[msgIndex];
    // Find matching response from mock data
    const clientKey = `${clientSlug}-${moonSlug}`;
    const responses = chatResponsesByMoon[clientKey] ?? chatResponsesByMoon[moonSlug];
    const matchedResponse = responses?.find(r =>
      msg.content.includes(r.content.substring(0, 40))
    );

    const variantTexts = matchedResponse?.variants ?? [
      `Versão alternativa: ${msg.content.substring(0, 80)}...`,
      `Outra abordagem: ${msg.content.substring(0, 80)}...`,
    ];

    setVariations(prev => ({
      ...prev,
      [msgIndex]: {
        variants: variantTexts,
        selectedIndex: 0,
        originalHighlight: msg.highlight,
      },
    }));
  }

  function toggleSave(msgIndex: number) {
    setSavedMessages(prev => {
      const next = new Set(prev);
      if (next.has(msgIndex)) next.delete(msgIndex);
      else next.add(msgIndex);
      return next;
    });
  }

  return (
    <div className="grid h-full" style={{ gridTemplateColumns: '1fr 280px' }}>
      {/* Left: Chat area */}
      <div className="flex flex-col overflow-hidden">
        {/* Message list */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-lg">
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-1 items-center justify-center">
              <PromptTemplateBar templates={templates} onSelect={(prompt) => handleSend(prompt)} />
            </div>
          )}

          {messages.map((msg, i) => {
            const isAssistant = msg.role === 'assistant';
            const isLastAndStreaming = false; // completed messages are never streaming
            const hasFollowingUserMsg = messages.slice(i + 1).some((m) => m.role === 'user');
            return (
              <React.Fragment key={i}>
                <MessageBubble
                  role={msg.role}
                  content={msg.content}
                  highlight={msg.highlight}
                  showActions={isAssistant && !isLastAndStreaming}
                  onGenerateVariation={() => handleGenerateVariation(i)}
                  onSave={() => toggleSave(i)}
                  isSaved={savedMessages.has(i)}
                  msgIndex={i}
                  feedback={feedbacks[i] || { rating: null, comment: '' }}
                  onFeedbackChange={(f) => setFeedbacks((prev) => ({ ...prev, [i]: f }))}
                  hasFollowingUserMessage={hasFollowingUserMsg}
                />
                {isAssistant && variations[i] && (
                  <VariationCards
                    original={msg.content}
                    originalHighlight={variations[i].originalHighlight}
                    variants={variations[i].variants}
                    selectedIndex={variations[i].selectedIndex}
                    onSelect={(idx) => setVariations(prev => ({
                      ...prev,
                      [i]: { ...prev[i], selectedIndex: idx },
                    }))}
                  />
                )}
              </React.Fragment>
            );
          })}

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
      <ContextSidebar
        documents={documents}
        activeDocIds={activeDocIds}
        onToggleDoc={(id) => setActiveDocIds((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id])}
        onAddDoc={(id) => setActiveDocIds((prev) => prev.includes(id) ? prev : [...prev, id])}
        agentes={DEFAULT_AGENTES}
        messages={messages}
        feedbacks={feedbacks}
        sessionFeedback={sessionFeedback}
        onSessionFeedback={setSessionFeedback}
      />
    </div>
  );
}
