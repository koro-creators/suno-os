'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasText = value.trim().length > 0;

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  }, [value]);

  const handleSubmit = () => {
    if (!hasText || disabled) return;
    onSend(value.trim());
    setValue('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{
      position: 'relative',
      backgroundColor: 'var(--deep)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 16,
      transition: 'border-color 200ms ease, box-shadow 200ms ease',
    }}>
      <label htmlFor="chat-input" className="sr-only">Mensagem</label>
      <textarea
        ref={textareaRef}
        id="chat-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Como posso ajudar?"
        disabled={disabled}
        rows={1}
        style={{
          width: '100%',
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          padding: '12px 48px 12px 16px',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          color: 'var(--text-primary)',
          minHeight: 44,
          maxHeight: 160,
          overflow: 'auto',
        }}
        onFocus={(e) => {
          const container = e.currentTarget.parentElement as HTMLDivElement;
          container.style.borderColor = 'var(--sun)';
          container.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.1)';
        }}
        onBlur={(e) => {
          const container = e.currentTarget.parentElement as HTMLDivElement;
          container.style.borderColor = 'var(--border-subtle)';
          container.style.boxShadow = 'none';
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={!hasText || disabled}
        aria-label="Enviar mensagem"
        style={{
          position: 'absolute',
          right: 8,
          bottom: 8,
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 9999,
          border: 'none',
          backgroundColor: hasText && !disabled ? 'var(--sun)' : 'transparent',
          color: hasText && !disabled ? 'var(--void)' : 'var(--text-muted)',
          cursor: hasText && !disabled ? 'pointer' : 'default',
          transition: 'all 200ms ease',
          opacity: hasText && !disabled ? 1 : 0.4,
        }}
      >
        <Send size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
