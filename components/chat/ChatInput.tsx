'use client';

import { useState, useCallback } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div
      className="flex items-center gap-sm px-md py-sm"
      style={{
        backgroundColor: 'var(--deep)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Como posso ajudar?"
        disabled={disabled}
        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="flex shrink-0 items-center justify-center rounded-full bg-sun text-void transition-opacity disabled:opacity-40"
        style={{ width: 32, height: 32 }}
        aria-label="Enviar mensagem"
      >
        <Send size={16} />
      </button>
    </div>
  );
}
