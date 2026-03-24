'use client';

import { useState, useRef, useCallback } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
}

export default function TagInput({ tags, onChange, suggestions }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (trimmed && !tags.includes(trimmed)) {
        onChange([...tags, trimmed]);
      }
      setInputValue('');
      setShowDropdown(false);
    },
    [tags, onChange],
  );

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const filtered = inputValue
    ? suggestions
        .filter(
          (s) =>
            s.toLowerCase().includes(inputValue.toLowerCase()) &&
            !tags.includes(s),
        )
        .slice(0, 5)
    : [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Tag pills */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {tags.map((tag, i) => (
            <span
              key={tag}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.65rem',
                padding: '2px 8px',
                borderRadius: 9999,
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              {tag}
              <button
                onClick={() => removeTag(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.7rem',
                  lineHeight: 1,
                }}
                aria-label={`Remove ${tag}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        aria-label="Tags"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setShowDropdown(true);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => {
          // Delay so click on dropdown registers
          setTimeout(() => setShowDropdown(false), 150);
        }}
        placeholder="Adicionar tag..."
        style={{
          width: '100%',
          backgroundColor: 'transparent',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: '0.75rem',
          color: 'var(--text-primary)',
          outline: 'none',
        }}
        onFocusCapture={(e) => {
          e.currentTarget.style.borderColor = 'var(--sun)';
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />

      {/* Dropdown */}
      {showDropdown && filtered.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            backgroundColor: 'var(--deep)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            overflow: 'hidden',
            zIndex: 10,
          }}
        >
          {filtered.map((s) => (
            <button
              key={s}
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(s);
                inputRef.current?.focus();
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                padding: '6px 12px',
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
