'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageFeedback } from '@/lib/feedback-types';

interface FeedbackInlineProps {
  feedback: MessageFeedback;
  onChange: (f: MessageFeedback) => void;
  collapsed?: boolean;
}

export default function FeedbackInline({
  feedback,
  onChange,
  collapsed,
}: FeedbackInlineProps) {
  const [editing, setEditing] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const visible = !collapsed && feedback.rating !== null;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  if (!visible) return null;

  const showText = feedback.comment && !focused && !editing;

  return (
    <div
      style={{
        overflow: 'hidden',
        maxHeight: visible ? 40 : 0,
        transition: 'max-height 150ms ease',
        marginTop: 6,
      }}
    >
      {showText ? (
        <span
          onClick={() => setEditing(true)}
          style={{
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            cursor: 'pointer',
          }}
        >
          {feedback.comment}
        </span>
      ) : (
        <input
          ref={inputRef}
          type="text"
          placeholder="Comentário opcional..."
          value={feedback.comment}
          onChange={(e) =>
            onChange({ ...feedback, comment: e.target.value })
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setEditing(false);
          }}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: '0.7rem',
            color: 'var(--text-primary)',
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
            transition: 'border-color 150ms, box-shadow 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--sun)';
            e.currentTarget.style.boxShadow =
              '0 0 0 2px rgba(255,200,1,0.15)';
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      )}
    </div>
  );
}
