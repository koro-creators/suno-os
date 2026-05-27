'use client';

import type { CarbonIconType } from '@carbon/icons-react';

export interface EmptyStateProps {
  icon: CarbonIconType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ marginBottom: 16, color: 'var(--text-muted)' }}>
        <Icon size={48} />
      </div>

      <p
        style={{
          fontSize: 18,
          fontWeight: 500,
          color: 'var(--text-primary)',
          margin: '0 0 8px',
          lineHeight: 1.3,
        }}
      >
        {title}
      </p>

      <p
        style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          margin: '0 0 24px',
          maxWidth: 320,
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--sun)',
            color: '#000',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'opacity 150ms ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
