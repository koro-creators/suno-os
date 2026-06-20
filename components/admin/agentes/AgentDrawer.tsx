'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Close } from '@carbon/icons-react';
import { Agent, AgentStatus } from '@/lib/agents-types';

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'var(--text-muted)' },
  active: { label: 'Ativo', color: 'var(--sun)' },
  inactive: { label: 'Inativo', color: 'var(--text-secondary)' },
  archived: { label: 'Arquivado', color: 'var(--text-muted)' },
};

interface AgentDrawerProps {
  agent: Agent | null;
  onClose: () => void;
}

export default function AgentDrawer({ agent, onClose }: AgentDrawerProps) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (agent) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [agent, handleKeyDown]);

  if (!agent) return null;

  const status = STATUS_CONFIG[agent.status];
  const instructions = agent.instructions ?? '';
  const previewInstructions =
    instructions.length > 200
      ? instructions.slice(0, 200) + '…'
      : instructions;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose();
        }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 90,
        }}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={agent.name}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 400,
          maxWidth: '100vw',
          backgroundColor: 'var(--deep)',
          borderLeft: '1px solid var(--border-subtle)',
          zIndex: 91,
          display: 'flex',
          flexDirection: 'column',
          animation: 'agent-drawer-slide-in 200ms ease forwards',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{agent.icon}</span>
          <h2
            style={{
              flex: 1,
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {agent.name}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              borderRadius: 4,
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <Close size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status badge */}
          <div>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: status.color,
                padding: '3px 8px',
                borderRadius: 9999,
                border: `1px solid ${status.color}44`,
                backgroundColor: `${status.color}11`,
              }}
            >
              {status.label}
            </span>
          </div>

          {/* Instructions preview */}
          <div>
            <p
              style={{
                fontSize: '0.6rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--text-muted)',
                margin: '0 0 6px',
              }}
            >
              Instruções
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              {previewInstructions}
            </p>
          </div>

          {/* Metadata */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}
          >
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--nebula)',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {agent.skill_count}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Skills</span>
            </div>
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--nebula)',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {agent.client_count}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Clientes</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            padding: '14px 20px',
            borderTop: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => {
              onClose();
              router.push(`/agentes/${agent.id}`);
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--sun)',
              color: 'var(--void)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Editar
          </button>
        </div>

        <style>{`
          @keyframes agent-drawer-slide-in {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
      </div>
    </>
  );
}
