'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Shuffle, Bookmark, BookmarkCheck, ThumbsUp, ThumbsDown } from 'lucide-react';
import { MessageFeedback } from '@/lib/feedback-types';

interface ResultActionsProps {
  content: string;
  highlightBody?: string;
  onGenerateVariation: () => void;
  onSave: () => void;
  isSaved: boolean;
  feedback?: MessageFeedback;
  onFeedbackChange?: (f: MessageFeedback) => void;
}

const buttonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: '0.65rem',
  color: 'var(--text-muted)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  transition: 'color 150ms',
  padding: 0,
};

export default function ResultActions({
  content,
  highlightBody,
  onGenerateVariation,
  onSave,
  isSaved,
  feedback,
  onFeedbackChange,
}: ResultActionsProps) {
  const [copied, setCopied] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  useEffect(() => {
    if (savedFlash) {
      const t = setTimeout(() => setSavedFlash(false), 2000);
      return () => clearTimeout(t);
    }
  }, [savedFlash]);

  const handleCopy = useCallback(() => {
    const text = content + (highlightBody ? '\n\n' + highlightBody : '');
    navigator.clipboard.writeText(text);
    setCopied(true);
  }, [content, highlightBody]);

  const handleSave = useCallback(() => {
    onSave();
    setSavedFlash(true);
  }, [onSave]);

  const handleHover = (e: React.MouseEvent<HTMLButtonElement>, enter: boolean) => {
    e.currentTarget.style.color = enter ? 'var(--text-secondary)' : 'var(--text-muted)';
  };

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    e.currentTarget.style.outline = 'none';
    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.5)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div className="orbit-appear" style={{ position: 'relative', marginTop: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 16 }}>
        <button
          style={buttonStyle}
          onClick={handleCopy}
          onMouseEnter={(e) => handleHover(e, true)}
          onMouseLeave={(e) => handleHover(e, false)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>

        <button
          style={buttonStyle}
          onClick={onGenerateVariation}
          onMouseEnter={(e) => handleHover(e, true)}
          onMouseLeave={(e) => handleHover(e, false)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <Shuffle size={14} />
          Gerar variação
        </button>

        <button
          style={buttonStyle}
          onClick={handleSave}
          onMouseEnter={(e) => handleHover(e, true)}
          onMouseLeave={(e) => handleHover(e, false)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          {isSaved ? 'Salvo' : 'Salvar'}
        </button>

        <button
          style={{
            ...buttonStyle,
            color: feedback?.rating === 'up' ? 'var(--planejamento)' : buttonStyle.color,
          }}
          aria-pressed={feedback?.rating === 'up'}
          aria-label="Aprovar"
          onClick={() => {
            if (onFeedbackChange && feedback) {
              onFeedbackChange({
                ...feedback,
                rating: feedback.rating === 'up' ? null : 'up',
              });
            }
          }}
          onMouseEnter={(e) => {
            if (feedback?.rating !== 'up') handleHover(e, true);
          }}
          onMouseLeave={(e) => {
            if (feedback?.rating !== 'up') handleHover(e, false);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <ThumbsUp size={14} strokeWidth={1.5} />
        </button>

        <button
          style={{
            ...buttonStyle,
            color: feedback?.rating === 'down' ? '#EF4444' : buttonStyle.color,
          }}
          aria-pressed={feedback?.rating === 'down'}
          aria-label="Rejeitar"
          onClick={() => {
            if (onFeedbackChange && feedback) {
              onFeedbackChange({
                ...feedback,
                rating: feedback.rating === 'down' ? null : 'down',
              });
            }
          }}
          onMouseEnter={(e) => {
            if (feedback?.rating !== 'down') handleHover(e, true);
          }}
          onMouseLeave={(e) => {
            if (feedback?.rating !== 'down') handleHover(e, false);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <ThumbsDown size={14} strokeWidth={1.5} />
        </button>
      </div>

      {savedFlash && (
        <span
          style={{
            fontSize: '0.55rem',
            color: 'var(--text-muted)',
            marginTop: 4,
            display: 'block',
          }}
        >
          Salvo na Biblioteca
        </span>
      )}
    </div>
  );
}
