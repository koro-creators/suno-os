'use client';

import { MeetingSegment } from '@/lib/meeting-types';

interface Props {
  segment: MeetingSegment;
  onToggle: (id: string, selected: boolean) => void;
  onContextChange: (id: string, note: string) => void;
}

export default function TrechoCard({ segment, onToggle, onContextChange }: Props) {
  return (
    <div
      style={{
        border: `1px solid ${segment.selected ? 'var(--sun)' : 'var(--border-subtle)'}`,
        borderRadius: 12,
        padding: 16,
        backgroundColor: segment.selected ? 'rgba(255,200,1,0.04)' : 'var(--deep)',
        transition: 'border-color 150ms ease, background-color 150ms ease',
      }}
    >
      {/* Checkbox + text */}
      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={segment.selected}
          onChange={(e) => onToggle(segment.id, e.target.checked)}
          style={{
            width: 16,
            height: 16,
            accentColor: 'var(--sun)',
            marginTop: 2,
            flexShrink: 0,
            cursor: 'pointer',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {segment.start_time && (
              <span
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'monospace',
                  backgroundColor: 'var(--nebula)',
                  padding: '1px 6px',
                  borderRadius: 4,
                }}
              >
                {segment.start_time}
              </span>
            )}
            <span
              style={{
                fontSize: '0.65rem',
                color: segment.selected ? 'var(--sun)' : 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 500,
              }}
            >
              {segment.selected ? 'Incluir na Wiki' : 'Incluir?'}
            </span>
          </div>
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {segment.text}
          </p>
        </div>
      </label>

      {/* Context note — only shown when selected */}
      {segment.selected && (
        <div style={{ marginTop: 12, paddingLeft: 28 }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              marginBottom: 4,
            }}
          >
            Contexto (opcional)
          </label>
          <textarea
            value={segment.context_note}
            onChange={(e) => onContextChange(segment.id, e.target.value)}
            placeholder="Adicione contexto para quem revisar na Wiki..."
            rows={2}
            style={{
              width: '100%',
              backgroundColor: 'var(--nebula)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: '0.8rem',
              color: 'var(--text-primary)',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
              lineHeight: 1.5,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--sun)';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
}
