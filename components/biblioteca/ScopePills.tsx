'use client';

const SCOPES: { label: string; value: string; color: string }[] = [
  { label: 'Suno', value: 'suno', color: 'var(--sun)' },
  { label: 'Santander', value: 'santander', color: '#EF4444' },
  { label: 'Vivo', value: 'vivo', color: '#8B5CF6' },
  { label: 'Americanas', value: 'americanas', color: '#F97316' },
  { label: 'MRV', value: 'mrv', color: '#06B6D4' },
  { label: 'Sicredi', value: 'sicredi', color: '#22C55E' },
  { label: 'BMG', value: 'bmg', color: '#F472B6' },
  { label: 'Stone', value: 'stone', color: '#A3E635' },
];

interface ScopePillsProps {
  selected: string[];
  onChange: (scopes: string[]) => void;
}

export default function ScopePills({ selected, onChange }: ScopePillsProps) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {SCOPES.map((scope) => {
        const active = selected.includes(scope.value);
        return (
          <button
            key={scope.value}
            aria-pressed={active}
            onClick={() => toggle(scope.value)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.7rem',
              padding: '4px 10px',
              borderRadius: 9999,
              border: `1px solid ${active ? scope.color : 'var(--border-subtle)'}`,
              backgroundColor: active ? `${scope.color}18` : 'transparent',
              color: active ? scope.color : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: scope.color,
                flexShrink: 0,
              }}
            />
            {scope.label}
          </button>
        );
      })}
    </div>
  );
}
