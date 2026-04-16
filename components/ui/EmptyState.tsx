'use client';

import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', textAlign: 'center',
    }}>
      {icon && (
        <div style={{ marginBottom: 16, color: 'var(--text-muted)', opacity: 0.5 }}>
          {icon}
        </div>
      )}
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 4px', fontWeight: 500 }}>
        {title}
      </p>
      {description && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 16px', maxWidth: 320 }}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            backgroundColor: 'var(--sun)', color: 'var(--void)',
            border: 'none', borderRadius: 9999, padding: '8px 16px',
            fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
