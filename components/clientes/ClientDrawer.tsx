'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Close, Launch, TrashCan, User } from '@carbon/icons-react';
import { ClientAdmin } from '@/lib/client-types';
import { useSkills } from '@/contexts/SkillsContext';
import { useBiblioteca } from '@/contexts/BibliotecaContext';

const SKILL_TYPE_COLORS: Record<string, string> = {
  criacao: 'var(--criacao, #FFC801)',
  midia: 'var(--midia, #3B82F6)',
  planejamento: 'var(--planejamento, #10B981)',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}m`;
  const years = Math.floor(months / 12);
  return `${years}a`;
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '0.55rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: 'var(--text-muted)',
  margin: '0 0 8px 0',
};

interface ClientDrawerProps {
  client: ClientAdmin | null;
  onClose: () => void;
  onDelete: (client: ClientAdmin) => void;
}

export default function ClientDrawer({
  client,
  onClose,
  onDelete,
}: ClientDrawerProps) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const { skills } = useSkills();
  const { documents } = useBiblioteca();
  // Two-click confirm para ação destrutiva (mesmo padrão de ClientEditor):
  // 1º clique vira "Confirmar?", 2º arquiva de fato.
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Reseta a confirmação ao trocar de cliente ou fechar o drawer.
  useEffect(() => {
    setDeleteConfirm(false);
  }, [client]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (client) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [client, handleKeyDown]);

  const handleDeleteClick = () => {
    if (!client) return;
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    onDelete(client);
  };

  if (!client) return null;

  const scoreColor =
    client.metrics.averageScore >= 4.0
      ? 'var(--sun)'
      : client.metrics.averageScore >= 3.0
        ? 'var(--text-secondary)'
        : 'var(--text-muted)';

  const assignedSkillObjects = skills.filter((s) =>
    client.assignedSkills.includes(s.id),
  );

  const documentCount = documents.filter((doc) =>
    doc.scope.includes(client.slug),
  ).length;

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
        aria-label={client.name}
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
          animation: 'drawer-slide-in 200ms ease forwards',
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
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: client.color,
              flexShrink: 0,
            }}
          />
          <h2
            style={{
              flex: 1,
              fontSize: '1.2rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {client.name}
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
          {/* Description */}
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {client.description}
          </p>

          {/* Contact */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Contato: {client.contact}
            </span>
          </div>

          {/* Metrics */}
          <div>
            <p style={sectionLabelStyle}>Metricas</p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {/* Total Sessoes */}
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--nebula)',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    fontSize: '1.4rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.2,
                  }}
                >
                  {client.metrics.totalSessions}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Total Sessoes
                </span>
              </div>

              {/* Total Feedbacks */}
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--nebula)',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    fontSize: '1.4rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.2,
                  }}
                >
                  {client.metrics.totalFeedbacks}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Total Feedbacks
                </span>
              </div>

              {/* Score Medio */}
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--nebula)',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    fontSize: '1.4rem',
                    fontWeight: 600,
                    color: scoreColor,
                    lineHeight: 1.2,
                  }}
                >
                  &#9733; {client.metrics.averageScore.toFixed(1)}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Score Medio
                </span>
              </div>

              {/* Skill Mais Usado */}
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--nebula)',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {client.metrics.topSkill}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Skill Mais Usado
                </span>
              </div>

              {/* Ultima Atividade */}
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--nebula)',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  gridColumn: '1 / -1',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                  }}
                >
                  ha {timeAgo(client.metrics.lastActivity)}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Ultima Atividade
                </span>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <p style={sectionLabelStyle}>Skills ({assignedSkillObjects.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {assignedSkillObjects.length === 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Nenhuma skill atribuida.
                </span>
              )}
              {assignedSkillObjects.map((skill) => (
                <div
                  key={skill.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    backgroundColor: 'var(--nebula)',
                    borderRadius: 6,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: SKILL_TYPE_COLORS[skill.type] ?? 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', flex: 1 }}>
                    {skill.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.55rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: 9999,
                      color:
                        skill.status === 'active'
                          ? '#10B981'
                          : skill.status === 'draft'
                            ? '#F59E0B'
                            : 'var(--text-muted)',
                      border: `1px solid ${
                        skill.status === 'active'
                          ? '#10B98133'
                          : skill.status === 'draft'
                            ? '#F59E0B33'
                            : 'var(--border-subtle)'
                      }`,
                      backgroundColor:
                        skill.status === 'active'
                          ? '#10B98111'
                          : skill.status === 'draft'
                            ? '#F59E0B11'
                            : 'transparent',
                    }}
                  >
                    {skill.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Biblioteca */}
          <div>
            <p style={sectionLabelStyle}>Biblioteca</p>
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'var(--nebula)',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                {documentCount} {documentCount === 1 ? 'documento' : 'documentos'}
              </span>
              <a
                href={`/biblioteca?scope=${client.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  router.push(`/biblioteca?scope=${client.slug}`);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.75rem',
                  color: 'var(--sun)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'opacity 150ms ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none';
                }}
              >
                Ver na Biblioteca
                <Launch size={12} />
              </a>
            </div>
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
            onClick={() => {
              onClose();
              router.push(`/clientes/${client.id}`);
            }}
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
            Abrir Editor
          </button>
          <button
            onClick={handleDeleteClick}
            title={deleteConfirm ? 'Clique para confirmar' : 'Excluir cliente'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              justifyContent: 'center',
              backgroundColor: deleteConfirm ? '#EF444415' : 'transparent',
              border: `1px solid ${deleteConfirm ? '#EF4444' : 'var(--border-subtle)'}`,
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: '0.8rem',
              color: '#EF4444',
              cursor: 'pointer',
              transition: 'border-color 150ms ease, background-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#EF444466';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = deleteConfirm ? '#EF4444' : 'var(--border-subtle)';
            }}
          >
            <TrashCan size={14} />
            {deleteConfirm ? 'Confirmar exclusão?' : 'Excluir'}
          </button>
        </div>

        {/* Slide-in animation */}
        <style>{`
          @keyframes drawer-slide-in {
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
