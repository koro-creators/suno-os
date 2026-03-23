'use client';

interface FilterPillsProps {
  types: string[];
  activeType: string | null;
  onFilter: (type: string | null) => void;
}

export default function FilterPills({ types, activeType, onFilter }: FilterPillsProps) {
  const allTypes = ['Todos', ...types];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '1.25rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '0.5rem',
        zIndex: 20,
      }}
    >
      {allTypes.map((type) => {
        const value = type === 'Todos' ? null : type;
        const isActive = activeType === value;

        return (
          <button
            key={type}
            onClick={() => onFilter(value)}
            style={{
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0.3rem 0.75rem',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              background: isActive ? 'rgba(255, 200, 1, 0.08)' : 'transparent',
              border: `1px solid ${isActive ? 'var(--sun)' : 'rgba(255, 255, 255, 0.1)'}`,
              color: isActive ? 'var(--sun)' : 'var(--text-muted)',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                const el = e.currentTarget;
                el.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                el.style.color = 'var(--text-secondary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                const el = e.currentTarget;
                el.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                el.style.color = 'var(--text-muted)';
              }
            }}
          >
            {type}
          </button>
        );
      })}
    </div>
  );
}
