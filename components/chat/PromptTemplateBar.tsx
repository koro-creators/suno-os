'use client';

import { Chat } from '@carbon/icons-react';
import { PromptTemplate } from '@/lib/types';

interface MoonOption {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface PromptTemplateBarProps {
  templates: PromptTemplate[];
  onSelect: (prompt: string) => void;
  moons?: MoonOption[];
  selectedMoon?: string;
  onMoonSelect?: (slug: string) => void;
}

export default function PromptTemplateBar({
  templates,
  onSelect,
  moons,
  selectedMoon,
  onMoonSelect,
}: PromptTemplateBarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, maxWidth: 640, width: '100%' }}>
      {/* Moon chips */}
      {moons && moons.length > 1 && onMoonSelect && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.14em',
            color: 'var(--text-muted)',
          }}>
            Formato
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {moons.map((moon) => {
              const isActive = moon.slug === selectedMoon;
              return (
                <button
                  key={moon.slug}
                  onClick={() => onMoonSelect(moon.slug)}
                  title={moon.description}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 14px', borderRadius: 9999,
                    fontSize: '0.7rem', fontWeight: 500,
                    border: `1px solid ${isActive ? 'var(--sun)' : 'var(--border-subtle)'}`,
                    backgroundColor: isActive ? 'rgba(255,200,1,0.1)' : 'transparent',
                    color: isActive ? 'var(--sun)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--twilight)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  {isActive && (
                    <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: 'var(--sun)' }} />
                  )}
                  {moon.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Templates */}
      {templates.length > 0 && (
        <>
          <span style={{
            fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.12em',
            color: 'var(--text-muted)',
          }}>
            Comece com um template
          </span>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 8, width: '100%',
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
                <Chat size={14} style={{ color: 'var(--sun)', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
