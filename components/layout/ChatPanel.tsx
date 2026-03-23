'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const PLACEHOLDER_MESSAGES: Message[] = [
  { role: 'user', text: 'Resumo do Santander' },
  {
    role: 'assistant',
    text: 'Santander tem 6 skills ativos com 18 áreas. Último uso há 2h.',
  },
];

const pulseKeyframes = `
@keyframes chat-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
`;

export default function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);

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
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 200ms ease',
          overflow: 'hidden',
          zIndex: 40,
          position: 'relative',
        }}
      >
        {/* Toggle button — vertically centered */}
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
            color: 'var(--text-muted)',
            flexShrink: 0,
            zIndex: 10,
            borderRadius: 0,
            transition: 'color 150ms ease, background-color 150ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--deep)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}
        >
          {/* Notification dot — only shown when collapsed */}
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
          {isOpen ? (
            <X size={14} strokeWidth={1.5} />
          ) : (
            <MessageCircle size={14} strokeWidth={1.5} />
          )}
        </button>

        {/* Panel content — only interactive when open */}
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
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0,
            }}
          >
            {/* Sun dot */}
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: 'var(--sun)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-secondary)',
                userSelect: 'none',
              }}
            >
              Chat Rápido
            </span>
            {/* Online indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginLeft: 4,
              }}
            >
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
            {PLACEHOLDER_MESSAGES.map((msg, idx) => (
              <div key={idx}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '7px 11px',
                      borderRadius:
                        msg.role === 'user'
                          ? '12px 12px 4px 12px'
                          : '12px 12px 12px 4px',
                      backgroundColor:
                        msg.role === 'user'
                          ? 'var(--nebula)'
                          : 'rgba(255,255,255,0.04)',
                      border:
                        msg.role === 'user'
                          ? '1px solid rgba(255,255,255,0.08)'
                          : '1px solid rgba(255,255,255,0.05)',
                      fontSize: '0.72rem',
                      lineHeight: 1.5,
                      color:
                        msg.role === 'user'
                          ? 'var(--text-primary)'
                          : 'var(--text-secondary)',
                      userSelect: 'none',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
                {/* Timestamp */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginTop: 3,
                    paddingLeft: msg.role === 'assistant' ? 4 : 0,
                    paddingRight: msg.role === 'user' ? 4 : 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.5rem',
                      color: 'var(--text-muted)',
                      userSelect: 'none',
                    }}
                  >
                    {msg.role === 'user' ? 'agora' : '2s'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Input area */}
          <div
            style={{
              padding: '12px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '9999px',
                padding: '7px 14px',
                opacity: 0.5,
                cursor: 'not-allowed',
              }}
            >
              <span
                style={{
                  fontSize: '0.6rem',
                  color: 'var(--text-muted)',
                  userSelect: 'none',
                  textAlign: 'center',
                }}
              >
                ⌘K para chat rápido
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
