'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const MOCK_RESPONSES = [
  'Olá! Posso ajudar com informações sobre clientes, skills e workflows do sunOS.',
  'Para acessar os detalhes de um cliente, clique no planeta correspondente no sistema solar.',
  'As skills são organizadas por tipo: Criação, Mídia e Planejamento.',
  'Você pode gerenciar skills, biblioteca e configurações pelo menu lateral.',
  'Para criar um novo cliente, acesse Clientes no menu lateral.',
];

export default function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [value, setValue] = useState('');
  const [streaming, setStreaming] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const mockIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasText = value.trim().length > 0;

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const mockStream = (text: string) => {
    setIsStreaming(true);
    setStreaming('');
    const words = text.split(' ');
    let i = 0;
    const tick = () => {
      i += 1;
      setStreaming(words.slice(0, i).join(' '));
      if (i >= words.length) {
        setIsStreaming(false);
        setMessages((prev) => [...prev, { role: 'assistant', text }]);
        setStreaming('');
        return;
      }
      timerRef.current = setTimeout(tick, 40);
    };
    timerRef.current = setTimeout(tick, 300);
  };

  const realStream = async (message: string): Promise<boolean> => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return false;
    setIsStreaming(true);
    setStreaming('');
    try {
      const res = await fetch(`${apiUrl}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, skill_slug: 'general', model: 'gemini-flash' }),
      });
      if (!res.ok || !res.body) return false;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      let buf = '';
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        buf += decoder.decode(chunk, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() ?? '';
        for (const part of parts) {
          const lines = part.split('\n');
          const eventLine = lines.find((l) => l.startsWith('event: '));
          const dataLine = lines.find((l) => l.startsWith('data: '));
          if (!dataLine) continue;
          const eventType = eventLine ? eventLine.slice(7).trim() : 'message';
          try {
            const json = JSON.parse(dataLine.slice(6));
            if (eventType === 'text') { full += json.content ?? ''; setStreaming(full); }
          } catch { /* ignore */ }
        }
      }
      setMessages((prev) => [...prev, { role: 'assistant', text: full || streaming }]);
      return true;
    } catch { return false; }
    finally { setIsStreaming(false); setStreaming(''); }
  };

  const handleSend = async () => {
    const text = value.trim();
    if (!text || isStreaming) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    const used = await realStream(text);
    if (!used) {
      const mock = MOCK_RESPONSES[mockIndexRef.current % MOCK_RESPONSES.length];
      mockIndexRef.current += 1;
      mockStream(mock);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div
      role="complementary"
      aria-label="Chat rápido"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: isOpen ? 320 : 40,
        backgroundColor: '#0F1923',
        borderLeft: '1px solid #263A4D',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'row',
        transition: 'width 200ms ease',
        overflow: 'hidden',
      }}
    >
      {/* Toggle strip — always 40px, never clipped */}
      <div style={{
        width: 40,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <button
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? 'Fechar chat' : 'Abrir chat'}
          style={{
            width: 40,
            height: 40,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFC801',
          }}
        >
          {isOpen ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M14 2H2a1 1 0 00-1 1v8a1 1 0 001 1h2v2.5l3-2.5H14a1 1 0 001-1V3a1 1 0 00-1-1z" />
            </svg>
          )}
        </button>
      </div>

      {/* Panel content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'opacity 150ms ease',
        minWidth: 0,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 12px 12px', borderBottom: '1px solid #263A4D', flexShrink: 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#FFC801' }} />
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94A3B8', userSelect: 'none' }}>
            Oráculo sun<span style={{ fontSize: '0.85rem' }}>OS</span>
          </span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#22C55E', display: 'inline-block', marginLeft: 'auto' }} />
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.length === 0 && !isStreaming && (
            <div style={{ fontSize: '0.65rem', color: '#475569', textAlign: 'center', marginTop: 20 }}>
              Pergunte qualquer coisa sobre o sunOS
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '85%',
                padding: '6px 10px',
                borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                backgroundColor: msg.role === 'user' ? '#1B2B3A' : '#0D1B26',
                border: '1px solid #263A4D',
                fontSize: '0.72rem',
                lineHeight: 1.5,
                color: msg.role === 'user' ? '#F1F5F9' : '#94A3B8',
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {(isStreaming && streaming) && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                maxWidth: '85%', padding: '6px 10px',
                borderRadius: '12px 12px 12px 4px',
                backgroundColor: '#0D1B26', border: '1px solid #263A4D',
                fontSize: '0.72rem', lineHeight: 1.5, color: '#94A3B8',
              }}>
                {streaming}
              </div>
            </div>
          )}
          {(isStreaming && !streaming) && (
            <div style={{ display: 'flex', gap: 4, padding: '4px 0' }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{
                  width: 4, height: 4, borderRadius: '50%',
                  backgroundColor: '#475569', display: 'inline-block',
                  opacity: 0.6,
                }} />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '8px', borderTop: '1px solid #263A4D', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 6,
            backgroundColor: '#1B2B3A', border: '1px solid #263A4D',
            borderRadius: 10, padding: '6px 6px 6px 10px',
          }}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte algo..."
              disabled={isStreaming}
              rows={1}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                resize: 'none', fontSize: '0.72rem', lineHeight: 1.5,
                color: '#F1F5F9', minHeight: 20, maxHeight: 80,
                overflow: 'auto', padding: 0,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!hasText || isStreaming}
              style={{
                width: 26, height: 26, borderRadius: '50%', border: 'none',
                backgroundColor: hasText && !isStreaming ? '#FFC801' : 'transparent',
                color: hasText && !isStreaming ? '#080D14' : '#475569',
                cursor: hasText && !isStreaming ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 150ms ease',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <path d="M5 1l4 4-4 4M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
