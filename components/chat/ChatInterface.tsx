'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BibliotecaDocument } from '@/lib/biblioteca-types';
import { MessageFeedback, SessionFeedback } from '@/lib/feedback-types';
import { chatResponsesByMoon } from '@/data/chat-responses';
import { useToolStream } from '@/hooks/useToolStream';
import { apiAvailable, getApiUrl } from '@/lib/api';
import { useSkills } from '@/contexts/SkillsContext';
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
  clientName?: string;
  clientColor?: string;
  documents: BibliotecaDocument[];
  initialActiveDocIds: string[];
}

const DEFAULT_AGENTES = ['Copywriter', 'Revisor'];

const GENERIC_FALLBACK: { content: string; highlight?: { label: string; body: string } } = {
  content:
    'Entendido. Estou analisando o contexto e preparando uma resposta personalizada com base na biblioteca do cliente e nas melhores praticas do setor.',
};

export default function ChatInterface({ moonSlug, skillSlug, clientSlug, clientName, clientColor, documents, initialActiveDocIds }: ChatInterfaceProps) {
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
  const { text: streamingText, isStreaming, startStream, startMockStream } = useToolStream();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const responseIndexRef = useRef<Record<string, number>>({});

  // Get skill admin config (systemPrompt, model, temperature) if available
  const { skills: skillsAdmin } = useSkills();
  const skillConfig = skillsAdmin.find((s) => s.slug === skillSlug);

  // Auto-scroll to bottom when messages change or while streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // When streaming completes, add the full assistant message
  const prevIsStreamingRef = useRef(false);
  useEffect(() => {
    if (prevIsStreamingRef.current && !isStreaming && streamingText) {
      const newMsgIndex = messages.length;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: streamingText, highlight: pendingHighlight },
      ]);
      setPendingHighlight(undefined);

      // Auto-generate variations for copy-social using the completed text directly
      if (skillSlug === 'copy-social' && apiAvailable()) {
        const completedText = streamingText;
        setTimeout(async () => {
          try {
            const response = await fetch(getApiUrl('/api/chat/generate-text'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: `Crie 2 variações alternativas do seguinte texto, mantendo o mesmo objetivo e tom mas com abordagens criativas diferentes:\n\n${completedText}`,
                content_type: 'custom',
                tone: 'creative',
                length: 'medium',
                variations: 2,
                skill_slug: skillSlug,
                model: skillConfig?.model || 'gemini-flash',
              }),
            });
            const data = await response.json();
            setVariations(prev => ({
              ...prev,
              [newMsgIndex]: {
                variants: data.texts || [],
                selectedIndex: 0,
              },
            }));
          } catch {
            // Silently skip auto-variations on error
          }
        }, 500);
      }
    }
    prevIsStreamingRef.current = isStreaming;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming, streamingText, pendingHighlight]);

  const handleSend = useCallback(
    (text: string) => {
      if (isStreaming) return;

      // Add user message
      setMessages((prev) => [...prev, { role: 'user', content: text }]);

      // Build context from active documents
      const activeDocContents = documents
        .filter((d) => activeDocIds.includes(d.id))
        .map((d) => d.content)
        .filter(Boolean);

      // Try real API first, fallback to mock
      if (apiAvailable()) {
        startStream({
          message: text,
          skillSlug,
          model: skillConfig?.model || 'gemini-flash',
          temperature: skillConfig?.temperature ?? 0.7,
          maxTokens: skillConfig?.maxTokens ?? 4096,
          systemPrompt: skillConfig?.systemPrompt || undefined,
          contextDocuments: activeDocContents,
        });
      } else {
        // Mock fallback — same logic as before
        const clientKey = `${clientSlug}-${moonSlug}`;
        const responses = chatResponsesByMoon[clientKey] ?? chatResponsesByMoon[moonSlug];

        let response;
        if (responses && responses.length > 0) {
          const key = clientKey in chatResponsesByMoon ? clientKey : moonSlug;
          const idx = responseIndexRef.current[key] ?? 0;
          response = responses[idx % responses.length];
          responseIndexRef.current[key] = idx + 1;
        } else {
          response = GENERIC_FALLBACK;
        }

        setPendingHighlight(response.highlight);
        setTimeout(() => {
          startMockStream(response.content, 40);
        }, 500);
      }
    },
    [isStreaming, clientSlug, moonSlug, skillSlug, documents, activeDocIds, skillConfig, startStream, startMockStream],
  );

  async function handleGenerateVariation(msgIndex: number) {
    const msg = messages[msgIndex];

    if (apiAvailable()) {
      try {
        const response = await fetch(getApiUrl('/api/chat/generate-text'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Crie 2 variações alternativas do seguinte texto, mantendo o mesmo objetivo e tom mas com abordagens criativas diferentes:\n\n${msg.content}`,
            content_type: 'custom',
            tone: 'creative',
            length: 'medium',
            variations: 2,
            skill_slug: skillSlug,
            model: skillConfig?.model || 'gemini-flash',
          }),
        });
        const data = await response.json();
        const variantTexts = data.texts || [];

        setVariations(prev => ({
          ...prev,
          [msgIndex]: {
            variants: variantTexts,
            selectedIndex: 0,
            originalHighlight: msg.highlight,
          },
        }));
      } catch {
        // Fallback to simple variations
        setVariations(prev => ({
          ...prev,
          [msgIndex]: {
            variants: [
              `Versão alternativa: ${msg.content.substring(0, 200)}...`,
              `Outra abordagem: ${msg.content.substring(0, 200)}...`,
            ],
            selectedIndex: 0,
            originalHighlight: msg.highlight,
          },
        }));
      }
    } else {
      // Mock fallback
      const clientKey = `${clientSlug}-${moonSlug}`;
      const responses = chatResponsesByMoon[clientKey] ?? chatResponsesByMoon[moonSlug];
      const matchedResponse = responses?.find(r =>
        msg.content.includes(r.content.substring(0, 40))
      );
      setVariations(prev => ({
        ...prev,
        [msgIndex]: {
          variants: matchedResponse?.variants ?? [
            `Versão alternativa: ${msg.content.substring(0, 200)}...`,
            `Outra abordagem: ${msg.content.substring(0, 200)}...`,
          ],
          selectedIndex: 0,
          originalHighlight: msg.highlight,
        },
      }));
    }
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
            const hasVars = !!(variations[i] && variations[i].variants.length > 0);
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
                  skillSlug={skillSlug}
                  moonSlug={moonSlug}
                  clientName={clientName}
                  clientColor={clientColor}
                  hasVariations={hasVars}
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
                    skillSlug={skillSlug}
                    moonSlug={moonSlug}
                    clientName={clientName}
                    clientColor={clientColor}
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
