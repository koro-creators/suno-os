'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, ExternalLink, Copy, Trash2 } from 'lucide-react';
import { SkillAdmin } from '@/lib/admin-types';

const TYPE_COLORS: Record<string, string> = {
  criacao: 'var(--criacao)',
  midia: 'var(--midia)',
  planejamento: 'var(--planejamento)',
};

const TYPE_LABELS: Record<string, string> = {
  criacao: 'Criacao',
  midia: 'Midia',
  planejamento: 'Planejamento',
};

const STATUS_STYLES: Record<string, { label: string; color: string; border: string }> = {
  active: { label: 'Ativo', color: '#10B981', border: '#10B98140' },
  draft: { label: 'Rascunho', color: 'var(--sun)', border: 'rgba(255,200,1,0.25)' },
  archived: { label: 'Arquivado', color: 'var(--text-muted)', border: 'var(--border-subtle)' },
};

const CLIENT_COLORS: Record<string, string> = {
  santander: '#EF4444',
  vivo: '#8B5CF6',
  americanas: '#F97316',
  mrv: '#06B6D4',
  sicredi: '#22C55E',
  bmg: '#F472B6',
  stone: '#A3E635',
  suno: 'var(--sun)',
  samsung: '#3B82F6',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `ha ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `ha ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ha 1d';
  if (days < 30) return `ha ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `ha ${months}m`;
  const years = Math.floor(months / 12);
  return `ha ${years}a`;
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '0.55rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: 'var(--text-muted)',
  margin: '0 0 8px 0',
};

interface SkillDrawerProps {
  skill: SkillAdmin | null;
  onClose: () => void;
  onDelete: (skill: SkillAdmin) => void;
}

export default function SkillDrawer({
  skill,
  onClose,
  onDelete,
}: SkillDrawerProps) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (skill) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [skill, handleKeyDown]);

  if (!skill) return null;

  const typeColor = TYPE_COLORS[skill.type];
  const typeLabel = TYPE_LABELS[skill.type];
  const statusInfo = STATUS_STYLES[skill.status];
  const currentVersion = skill.versions[0]?.version ?? 1;

  const scoreColor =
    skill.totalFeedbacks === 0
      ? 'var(--text-muted)'
      : skill.averageScore >= 4.0
        ? 'var(--sun)'
        : skill.averageScore >= 3.0
          ? 'var(--text-secondary)'
          : 'var(--text-muted)';

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
          transition: 'opacity 200ms ease',
        }}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={skill.name}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 480,
          maxWidth: '100vw',
          backgroundColor: 'var(--deep)',
          borderLeft: '1px solid var(--border-subtle)',
          zIndex: 91,
          display: 'flex',
          flexDirection: 'column',
          animation: 'skill-drawer-slide-in 200ms ease forwards',
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
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: typeColor,
              flexShrink: 0,
            }}
          />
          <h2
            style={{
              flex: 1,
              fontSize: '0.95rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {skill.name}
          </h2>
          <span
            style={{
              fontSize: '0.55rem',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: 9999,
              color: statusInfo.color,
              border: `1px solid ${statusInfo.border}`,
              backgroundColor:
                skill.status === 'active'
                  ? '#10B98111'
                  : skill.status === 'draft'
                    ? 'rgba(255,200,1,0.07)'
                    : 'transparent',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {statusInfo.label}
          </span>
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
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Quick info */}
          <div>
            <p style={sectionLabelStyle}>Configuracao</p>
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
                <div
                  style={{
                    fontSize: '0.55rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                  }}
                >
                  Modelo
                </div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  {skill.model}
                </div>
              </div>
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--nebula)',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.55rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                  }}
                >
                  Temperatura
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-primary)' }}>
                  {skill.temperature}
                </div>
              </div>
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--nebula)',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.55rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                  }}
                >
                  Max Tokens
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-primary)' }}>
                  {skill.maxTokens.toLocaleString()}
                </div>
              </div>
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--nebula)',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.55rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                  }}
                >
                  Tipo
                </div>
                <div style={{ fontSize: '0.7rem', color: typeColor }}>
                  {typeLabel}
                </div>
              </div>
            </div>
          </div>

          {/* Score */}
          <div>
            <p style={sectionLabelStyle}>Score</p>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 300,
                  color: scoreColor,
                }}
              >
                {skill.totalFeedbacks > 0
                  ? `\u2605 ${skill.averageScore.toFixed(1)}`
                  : '\u2014'}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {skill.totalFeedbacks > 0
                  ? `${skill.totalFeedbacks} feedbacks`
                  : 'Sem avaliacoes'}
              </span>
            </div>
          </div>

          {/* Moons */}
          {skill.moons.length > 0 && (
            <div>
              <p style={sectionLabelStyle}>
                Moons ({skill.moons.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {skill.moons.map((moon) => (
                  <div
                    key={moon.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    />
                    {moon.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assigned clients */}
          {skill.assignedClients.length > 0 && (
            <div>
              <p style={sectionLabelStyle}>
                Clientes ({skill.assignedClients.length})
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {skill.assignedClients.map((client) => (
                  <span
                    key={client}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: '0.7rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: CLIENT_COLORS[client] ?? 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    />
                    {client}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* System prompt preview */}
          {skill.systemPrompt && (
            <div>
              <p style={sectionLabelStyle}>System Prompt</p>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.7rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                  maxHeight: 160,
                  overflowY: 'auto',
                  padding: '12px 14px',
                  backgroundColor: 'var(--nebula)',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {skill.systemPrompt.length > 200
                  ? skill.systemPrompt.slice(0, 200) + '...'
                  : skill.systemPrompt}
              </div>
            </div>
          )}

          {/* Version */}
          <div
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
            }}
          >
            v{currentVersion} &middot; Editado {timeAgo(skill.updatedAt)}
          </div>
        </div>

        {/* Actions footer */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '14px 20px',
            borderTop: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => router.push(`/skills/${skill.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flex: 1,
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
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            <ExternalLink size={14} strokeWidth={1.5} />
            Abrir Editor
          </button>
          <button
            onClick={() => {
              /* Duplicate logic can be added here */
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--twilight)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <Copy size={14} strokeWidth={1.5} />
            Duplicar
          </button>
          <button
            onClick={() => onDelete(skill)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: '0.8rem',
              color: '#EF4444',
              cursor: 'pointer',
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#EF444466';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <Trash2 size={14} strokeWidth={1.5} />
            Excluir
          </button>
        </div>

        {/* Slide-in animation */}
        <style>{`
          @keyframes skill-drawer-slide-in {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @media (max-width: 768px) {
            [role="dialog"][aria-modal="true"] {
              width: 60% !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}
