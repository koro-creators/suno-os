'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Chat, Close, Send, Sun, TrashCan } from '@carbon/icons-react';
import { useToolStream } from '@/hooks/useToolStream';
import { getClientBySlug } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const pulseKeyframes = `
@keyframes chat-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
`;

export default function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevIsStreamingRef = useRef(false);

  const { text: streamingText, isStreaming, error, conversationId, startStream } = useToolStream();

  // Scope to the client whose page is currently open (e.g. /samsung -> Samsung).
  // Pages outside `/[clientSlug]` (home, /skills, /clientes, etc.) resolve to
  // `undefined`, and the consultor keeps its general "any registered client" mode.
  const pathname = usePathname();
  const clientSlug = pathname?.split('/').filter(Boolean)[0] ?? null;
  const scopedClient = clientSlug ? getClientBySlug(clientSlug) : undefined;
  const scopeKey = scopedClient?.slug ?? null;

  const clientScopePrompt = scopedClient
    ? `O usuário está navegando na página do cliente "${scopedClient.name}". ` +
      `Responda exclusivamente sobre este cliente. Se a pergunta mencionar outro cliente ` +
      `ou assunto fora deste contexto, explique que você está respondendo no contexto de ` +
      `${scopedClient.name} e que, para falar de outro cliente, é preciso abrir a página dele.`
    : undefined;

  // The conversation_id to continue, scoped to the current client page.
  const [scopedConversationId, setScopedConversationId] = useState<string | null>(null);

  // Per-scope history cache — keeps each page's conversation alive across
  // navigation instead of wiping it. Keyed by client slug ('__general__' for
  // pages outside `/[clientSlug]`, e.g. home). Lives in a ref so switching
  // scopes doesn't trigger extra renders; latest messages/conversationId are
  // tracked via refs to avoid stale closures when the scope changes.
  const scopeCacheRef = useRef<Record<string, { messages: Message[]; conversationId: string | null }>>({});
  const messagesRef = useRef(messages);
  const scopedConversationIdRef = useRef(scopedConversationId);
  const prevScopeKeyRef = useRef(scopeKey);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    scopedConversationIdRef.current = scopedConversationId;
  }, [scopedConversationId]);

  useEffect(() => {
    if (prevScopeKeyRef.current === scopeKey) return;

    const prevKey = prevScopeKeyRef.current ?? '__general__';
    scopeCacheRef.current[prevKey] = {
      messages: messagesRef.current,
      conversationId: scopedConversationIdRef.current,
    };

    const nextKey = scopeKey ?? '__general__';
    const cached = scopeCacheRef.current[nextKey];
    setMessages(cached?.messages ?? []);
    setScopedConversationId(cached?.conversationId ?? null);

    prevScopeKeyRef.current = scopeKey;
  }, [scopeKey]);

  useEffect(() => {
    if (conversationId) {
      setScopedConversationId(conversationId);
    }
  }, [conversationId]);

  // "Limpar conversa" — starts a fresh conversation in the current scope and
  // forgets its cached history (so navigating away and back won't restore it).
  const handleClear = useCallback(() => {
    const key = scopeKey ?? '__general__';
    delete scopeCacheRef.current[key];
    setMessages([]);
    setScopedConversationId(null);
  }, [scopeKey]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 220);
    }
  }, [isOpen]);

  // When streaming finishes, commit the assistant message
  useEffect(() => {
    if (prevIsStreamingRef.current && !isStreaming && streamingText) {
      setMessages((prev) => [...prev, { role: 'assistant', text: streamingText }]);
    }
    prevIsStreamingRef.current = isStreaming;
  }, [isStreaming, streamingText]);

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isStreaming) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInputValue('');

    startStream({
      message: text,
      skillSlug: 'consultor',
      model: 'gemini-flash',
      conversationId: scopedConversationId,
      systemPrompt: clientScopePrompt,
    });
  }, [inputValue, isStreaming, scopedConversationId, clientScopePrompt, startStream]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <style>{pulseKeyframes}</style>
      <aside
        role="complementary"
        aria-label="Chat rápido"
        style={{
          width: isOpen ? 320 : 40,
          flexShrink: 0,
          backgroundColor: 'var(--deep)',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 200ms ease',
          overflow: 'hidden',
          zIndex: 40,
          position: 'relative',
        }}
      >
        {!isOpen ? (
          /* Collapsed strip — normal-flow flex item, fills the aside via
             stretch/flex:1 (no absolute positioning, no transform). */
          <div
            role="button"
            tabIndex={0}
            aria-label="Abrir chat"
            onClick={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
              }
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--sun)',
              position: 'relative',
              outline: 'none',
              transition: 'background-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
            }}
          >
            <span style={{ position: 'relative', display: 'flex' }}>
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: 'var(--sun)',
                  animation: 'chat-pulse 2s ease-in-out infinite',
                }}
              />
              <Chat size={14} />
            </span>
          </div>
        ) : (
          /* Panel content */
          <div
            style={{
              width: 320,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              paddingLeft: 40,
              position: 'relative',
            }}
          >
            <div
              role="button"
              tabIndex={0}
              aria-label="Fechar chat"
              aria-expanded={isOpen}
              onClick={() => setIsOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsOpen(false);
                }
              }}
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                transform: 'translateY(-50%)',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                zIndex: 10,
                outline: 'none',
                transition: 'color 150ms ease, background-color 150ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.color = 'var(--sun)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.color = 'var(--text-secondary)';
              }}
            >
              <Close size={14} />
            </div>

          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '16px 16px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              flexShrink: 0,
            }}
          >
            <Sun size={14} style={{ color: 'var(--sun)', flexShrink: 0 }} />
            <span
              style={{
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-secondary)',
                userSelect: 'none',
              }}
            >
              Oráculo
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: '#22C55E',
                  flexShrink: 0,
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  fontSize: '0.5rem',
                  color: '#22C55E',
                  userSelect: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Online
              </span>
            </div>
            <button
              type="button"
              onClick={handleClear}
              disabled={messages.length === 0 && !isStreaming}
              aria-label="Limpar conversa"
              title="Limpar conversa"
              style={{
                marginLeft: 'auto',
                width: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                borderRadius: 6,
                cursor: messages.length === 0 && !isStreaming ? 'default' : 'pointer',
                color: messages.length === 0 && !isStreaming ? 'var(--text-muted)' : 'var(--text-secondary)',
                opacity: messages.length === 0 && !isStreaming ? 0.4 : 1,
                flexShrink: 0,
                transition: 'color 150ms ease, background-color 150ms ease',
              }}
              onMouseEnter={(e) => {
                if (messages.length === 0 && !isStreaming) return;
                (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--nebula)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color =
                  messages.length === 0 && !isStreaming ? 'var(--text-muted)' : 'var(--text-secondary)';
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              }}
            >
              <TrashCan size={14} />
            </button>
          </div>

          {/* Message list */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {messages.length === 0 && !isStreaming && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.65rem',
                  textAlign: 'center',
                  userSelect: 'none',
                  padding: '0 16px',
                }}
              >
                Faça uma pergunta para começar
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '7px 11px',
                      borderRadius:
                        msg.role === 'user'
                          ? '12px 12px 4px 12px'
                          : '12px 12px 12px 4px',
                      backgroundColor:
                        msg.role === 'user' ? 'var(--nebula)' : 'var(--deep)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.72rem',
                      lineHeight: 1.5,
                      color:
                        msg.role === 'user'
                          ? 'var(--text-primary)'
                          : 'var(--text-secondary)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {isStreaming && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '7px 11px',
                    borderRadius: '12px 12px 12px 4px',
                    backgroundColor: 'var(--deep)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.72rem',
                    lineHeight: 1.5,
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {streamingText || (
                    <span style={{ opacity: 0.5 }}>
                      <span style={{ animation: 'chat-pulse 1s ease-in-out infinite' }}>●</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {error && !isStreaming && (
              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  backgroundColor: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  fontSize: '0.65rem',
                  color: '#f87171',
                }}
              >
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '10px 12px',
              borderTop: '1px solid var(--border-subtle)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'var(--nebula)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 9999,
                padding: '5px 5px 5px 12px',
                transition: 'border-color 150ms ease',
              }}
            >
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte algo..."
                disabled={isStreaming}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.72rem',
                  color: 'var(--text-primary)',
                  minWidth: 0,
                }}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isStreaming}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  backgroundColor:
                    inputValue.trim() && !isStreaming ? 'var(--sun)' : 'var(--border-subtle)',
                  border: 'none',
                  cursor: inputValue.trim() && !isStreaming ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background-color 150ms ease',
                  color: inputValue.trim() && !isStreaming ? '#000' : 'var(--text-muted)',
                }}
              >
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>
        )}
      </aside>
    </>
  );
}
