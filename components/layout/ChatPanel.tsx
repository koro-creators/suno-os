'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chat, Close, Send, Sun } from '@carbon/icons-react';
import { useToolStream } from '@/hooks/useToolStream';

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
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevIsStreamingRef = useRef(false);

  const { text: streamingText, isStreaming, error, startStream } = useToolStream();

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
    });
  }, [inputValue, isStreaming, startStream]);

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
        {/* Toggle button */}
        <button
          aria-label={isOpen ? 'Fechar chat' : 'Abrir chat'}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((v) => !v)}
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
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: isOpen ? 'var(--text-secondary)' : 'var(--sun)',
            flexShrink: 0,
            zIndex: 10,
            borderRadius: 0,
            transition: 'color 150ms ease, background-color 150ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--sun)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = isOpen ? 'var(--text-secondary)' : 'var(--sun)';
          }}
        >
          {!isOpen && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: 'var(--sun)',
                animation: 'chat-pulse 2s ease-in-out infinite',
              }}
            />
          )}
          {isOpen ? <Close size={14} /> : <Chat size={14} />}
        </button>

        {/* Panel content */}
        <div
          style={{
            width: 320,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
            transition: 'opacity 150ms ease',
            paddingLeft: 40,
          }}
        >
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
      </aside>
    </>
  );
}
