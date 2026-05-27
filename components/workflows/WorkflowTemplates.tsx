'use client';

import { useRouter } from 'next/navigation';
import { Document, Layers } from '@carbon/icons-react';
import { WorkflowTemplate } from '@/lib/workflow-types';

interface WorkflowTemplatesProps {
  templates: WorkflowTemplate[];
}

export default function WorkflowTemplates({ templates }: WorkflowTemplatesProps) {
  const router = useRouter();

  if (templates.length === 0) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-primary)', marginBottom: 12 }}>
        Templates
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 12,
        }}
      >
        {templates.map((template) => (
          <div
            key={template.id}
            style={{
              backgroundColor: 'var(--deep)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--twilight)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Document size={14} style={{ color: 'var(--sun)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                {template.name}
              </span>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.4,
              }}
            >
              {template.description}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                }}
              >
                <Layers size={12} />
                {template.steps.length} steps
              </span>
              <button
                onClick={() => router.push(`/workflows/new?template=${template.id}`)}
                style={{
                  fontSize: '0.7rem',
                  padding: '4px 10px',
                  borderRadius: 9999,
                  border: '1px solid var(--sun)',
                  backgroundColor: 'transparent',
                  color: 'var(--sun)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'background-color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,200,1,0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                }}
              >
                Usar Template
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
