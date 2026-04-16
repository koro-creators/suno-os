'use client';

import { MessageSquare } from 'lucide-react';
import { PromptTemplate } from '@/lib/types';

interface PromptTemplateBarProps {
  templates: PromptTemplate[];
  onSelect: (prompt: string) => void;
}

export default function PromptTemplateBar({ templates, onSelect }: PromptTemplateBarProps) {
  if (templates.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <span style={{
        fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em',
        color: 'var(--text-muted)',
      }}>
        Comece com um template
      </span>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 8, maxWidth: 600, width: '100%',
      }}>
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.prompt)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              backgroundColor: 'var(--deep)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12, padding: '12px 14px',
              cursor: 'pointer', textAlign: 'left',
              transition: 'border-color 200ms ease, background-color 200ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--twilight)';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--deep)';
            }}
          >
            <MessageSquare size={14} strokeWidth={1.5} style={{ color: 'var(--sun)', flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
