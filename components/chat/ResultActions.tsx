'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Sparkles, Bookmark, BookmarkCheck, ThumbsUp, ThumbsDown } from 'lucide-react';
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

const iconBtnBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  borderRadius: 6,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  transition: 'color 150ms ease, background-color 150ms ease',
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

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  const handleCopy = useCallback(() => {
    const text = content + (highlightBody ? '\n\n' + highlightBody : '');
    navigator.clipboard.writeText(text);
    setCopied(true);
  }, [content, highlightBody]);

  const handleHoverEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
  };

  const handleHoverLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    e.currentTarget.style.outline = 'none';
    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.3)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div className="orbit-appear" style={{ position: 'relative', marginTop: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 6 }}>
        {/* Copy */}
        <button
          style={{ ...iconBtnBase, color: copied ? 'var(--planejamento)' : 'var(--text-muted)' }}
          onClick={handleCopy}
          onMouseEnter={handleHoverEnter}
          onMouseLeave={handleHoverLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
          title={copied ? 'Copiado!' : 'Copiar'}
          aria-label={copied ? 'Copiado' : 'Copiar'}
        >
          {copied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
        </button>

        {/* Generate variation */}
        <button
          style={{ ...iconBtnBase, color: 'var(--text-muted)' }}
          onClick={onGenerateVariation}
          onMouseEnter={handleHoverEnter}
          onMouseLeave={handleHoverLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
          title="Gerar variação"
          aria-label="Gerar variação"
        >
          <Sparkles size={14} strokeWidth={1.5} />
        </button>

        {/* Save / Bookmark */}
        <button
          style={{ ...iconBtnBase, color: isSaved ? 'var(--sun)' : 'var(--text-muted)' }}
          onClick={onSave}
          onMouseEnter={handleHoverEnter}
          onMouseLeave={handleHoverLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
          title={isSaved ? 'Salvo' : 'Salvar'}
          aria-label={isSaved ? 'Salvo na Biblioteca' : 'Salvar na Biblioteca'}
        >
          {isSaved ? <BookmarkCheck size={14} strokeWidth={1.5} /> : <Bookmark size={14} strokeWidth={1.5} />}
        </button>

        {/* Thumbs up */}
        <button
          style={{
            ...iconBtnBase,
            color: feedback?.rating === 'up' ? 'var(--planejamento)' : 'var(--text-muted)',
          }}
          aria-pressed={feedback?.rating === 'up'}
          aria-label="Aprovar"
          title="Aprovar"
          onClick={() => {
            if (onFeedbackChange && feedback) {
              onFeedbackChange({
                ...feedback,
                rating: feedback.rating === 'up' ? null : 'up',
              });
            }
          }}
          onMouseEnter={handleHoverEnter}
          onMouseLeave={handleHoverLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <ThumbsUp size={14} strokeWidth={1.5} />
        </button>

        {/* Thumbs down */}
        <button
          style={{
            ...iconBtnBase,
            color: feedback?.rating === 'down' ? '#EF4444' : 'var(--text-muted)',
          }}
          aria-pressed={feedback?.rating === 'down'}
          aria-label="Rejeitar"
          title="Rejeitar"
          onClick={() => {
            if (onFeedbackChange && feedback) {
              onFeedbackChange({
                ...feedback,
                rating: feedback.rating === 'down' ? null : 'down',
              });
            }
          }}
          onMouseEnter={handleHoverEnter}
          onMouseLeave={handleHoverLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <ThumbsDown size={14} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
