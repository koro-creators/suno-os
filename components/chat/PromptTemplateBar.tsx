'use client';

import { PromptTemplate } from '@/lib/types';

interface PromptTemplateBarProps {
  templates: PromptTemplate[];
  onSelect: (prompt: string) => void;
}

export default function PromptTemplateBar({ templates, onSelect }: PromptTemplateBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <span
        style={{
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        Comece com um template
      </span>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
          maxWidth: 500,
          width: '100%',
        }}
      >
        {templates.map((template) => (
          <div
            key={template.id}
            role="button"
            tabIndex={0}
            aria-label={template.label}
            onClick={() => onSelect(template.prompt)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(template.prompt);
              }
            }}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '10px 14px',
              cursor: 'pointer',
              transition: 'background 150ms, border-color 150ms',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.background = 'var(--surface-hover)';
              el.style.borderColor = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.background = 'transparent';
              el.style.borderColor = 'var(--border-subtle)';
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.5)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}
            >
              {template.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
