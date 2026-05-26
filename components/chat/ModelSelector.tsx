'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from '@carbon/icons-react';

interface ModelOption {
  id: string;
  label: string;
  provider: string;
  color: string;
  description: string;
}

const MODELS: ModelOption[] = [
  { id: 'gemini-flash', label: 'Gemini Flash', provider: 'Google', color: '#10B981', description: 'Rápido e econômico' },
  { id: 'gemini-pro', label: 'Gemini Pro', provider: 'Google', color: '#10B981', description: 'Avançado, mais preciso' },
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI', color: '#8B5CF6', description: 'Multimodal, versátil' },
  { id: 'claude', label: 'Claude Sonnet', provider: 'Anthropic', color: '#F59E0B', description: 'Criativo, longo contexto' },
];

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = MODELS.find(m => m.id === value) || MODELS[0];

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger — pill badge */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          backgroundColor: 'var(--deep)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 9999, padding: '4px 10px 4px 8px',
          fontSize: '0.65rem', color: 'var(--text-secondary)',
          cursor: 'pointer', transition: 'border-color 150ms ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--twilight)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)'; }}
      >
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          backgroundColor: selected.color, flexShrink: 0,
        }} />
        {selected.label}
        <ChevronDown size={10} style={{
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 150ms ease',
          color: 'var(--text-muted)',
        }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0,
          marginBottom: 6, width: 240,
          backgroundColor: 'var(--deep)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 10, padding: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          zIndex: 50,
        }}>
          {MODELS.map((model) => {
            const isSelected = model.id === value;
            return (
              <button
                key={model.id}
                onClick={() => { onChange(model.id); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', textAlign: 'left',
                  padding: '8px 10px', borderRadius: 8,
                  backgroundColor: isSelected ? 'var(--surface-hover)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  transition: 'background-color 150ms ease',
                }}
                onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--surface-hover)'; }}
                onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: model.color, flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {model.label}
                    </span>
                    <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>
                      {model.provider}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                    {model.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
