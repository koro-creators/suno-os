'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Attachment, Close, Send } from '@carbon/icons-react';
import FileTypeIcon from '@/components/biblioteca/FileTypeIcon';

const ACCEPTED_TYPES = '.pdf,.docx,.txt,.md,.png,.jpg,.webp,.mp3,.wav,.mp4,.mov';
const MAX_FILES = 5;

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    setAttachments([]);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    setAttachments((prev) => {
      const combined = [...prev, ...newFiles];
      return combined.slice(0, MAX_FILES);
    });
    // Reset input so same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileExtension = (name: string): string => {
    const parts = name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  return (
    <div
      data-chat-input-container
      style={{
        position: 'relative',
        backgroundColor: 'var(--deep)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
        transition: 'border-color 200ms ease, box-shadow 200ms ease',
      }}
    >
      {/* Attachment chips */}
      {attachments.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 4,
          padding: '8px 12px 0',
        }}>
          {attachments.map((file, i) => {
            const ext = getFileExtension(file.name);
            return (
              <span
                key={`${file.name}-${i}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  backgroundColor: 'var(--nebula)', borderRadius: 6,
                  padding: '2px 6px 2px 8px', fontSize: '0.6rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <FileTypeIcon fileType={ext} size={10} />
                {file.name.substring(0, 20)}{file.name.length > 20 ? '...' : ''}
                <button
                  onClick={() => removeFile(i)}
                  aria-label={`Remover ${file.name}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 14, height: 14, borderRadius: '50%',
                    border: 'none', backgroundColor: 'transparent',
                    color: 'var(--text-muted)', cursor: 'pointer',
                    padding: 0, transition: 'color 150ms ease',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
                >
                  <Close size={10} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

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
          padding: '12px 48px 12px 44px',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          color: 'var(--text-primary)',
          minHeight: 44,
          maxHeight: 160,
          overflow: 'auto',
        }}
        onFocus={(e) => {
          const container = e.currentTarget.closest('[data-chat-input-container]') as HTMLDivElement | null;
          if (container) {
            container.style.borderColor = 'var(--sun)';
            container.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.1)';
          }
        }}
        onBlur={(e) => {
          const container = e.currentTarget.closest('[data-chat-input-container]') as HTMLDivElement | null;
          if (container) {
            container.style.borderColor = 'var(--border-subtle)';
            container.style.boxShadow = 'none';
          }
        }}
      />

      {/* Attachment button — left side */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || attachments.length >= MAX_FILES}
        aria-label="Anexar arquivo"
        style={{
          position: 'absolute',
          left: 10,
          bottom: 10,
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 9999,
          border: 'none',
          backgroundColor: 'transparent',
          color: attachments.length >= MAX_FILES ? 'var(--text-muted)' : 'var(--text-secondary)',
          cursor: disabled || attachments.length >= MAX_FILES ? 'default' : 'pointer',
          transition: 'color 150ms ease',
          opacity: disabled || attachments.length >= MAX_FILES ? 0.4 : 1,
          padding: 0,
        }}
        onMouseEnter={(e) => {
          if (!disabled && attachments.length < MAX_FILES) {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && attachments.length < MAX_FILES) {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
          }
        }}
      >
        <Attachment size={14} />
      </button>

      {/* Send button — right side */}
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
        <Send size={14} />
      </button>
    </div>
  );
}
