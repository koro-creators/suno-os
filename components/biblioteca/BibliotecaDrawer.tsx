'use client';

import { useEffect, useCallback, useRef } from 'react';
import { X, ExternalLink, Edit2, Trash2, Link } from 'lucide-react';
import { BibliotecaDocument } from '@/lib/biblioteca-types';
import FileTypeIcon from './FileTypeIcon';

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

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '0.55rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: 'var(--text-muted)',
  margin: '0 0 8px 0',
};

interface BibliotecaDrawerProps {
  doc: BibliotecaDocument | null;
  onClose: () => void;
  onEdit: (doc: BibliotecaDocument) => void;
  onDelete: (doc: BibliotecaDocument) => void;
}

export default function BibliotecaDrawer({
  doc,
  onClose,
  onEdit,
  onDelete,
}: BibliotecaDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (doc) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [doc, handleKeyDown]);

  if (!doc) return null;

  const statusColor =
    doc.status === 'ready' ? '#10B981' : doc.status === 'error' ? '#EF4444' : '#F59E0B';
  const statusLabel =
    doc.status === 'ready' ? 'Pronto' : doc.status === 'error' ? 'Erro' : 'Processando';

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
        aria-label={doc.title}
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
          <FileTypeIcon fileType={doc.fileType} size={24} />
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
            {doc.title}
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
          {/* Metadata row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {doc.fileType && (
              <span
                style={{
                  fontSize: '0.55rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 9999,
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.04em',
                }}
              >
                {doc.fileType}
              </span>
            )}
            {doc.fileSize && (
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {formatFileSize(doc.fileSize)}
              </span>
            )}
            {doc.status && (
              <span
                style={{
                  fontSize: '0.55rem',
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: 9999,
                  color: statusColor,
                  border: `1px solid ${statusColor}33`,
                  backgroundColor: `${statusColor}11`,
                }}
              >
                {statusLabel}
              </span>
            )}
            <span
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                marginLeft: 'auto',
              }}
            >
              Editado {timeAgo(doc.updatedAt)}
            </span>
          </div>

          {/* Scope */}
          {doc.scope.length > 0 && (
            <div>
              <p style={sectionLabelStyle}>Escopo</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {doc.scope.map((s) => (
                  <span
                    key={s}
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
                        backgroundColor: CLIENT_COLORS[s] ?? 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {doc.tags.length > 0 && (
            <div>
              <p style={sectionLabelStyle}>Tags</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {doc.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '0.6rem',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      borderRadius: 9999,
                      padding: '2px 8px',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Content preview */}
          {doc.content && (
            <div>
              <p style={sectionLabelStyle}>Conteudo</p>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                  maxHeight: 320,
                  overflowY: 'auto',
                  padding: '12px 14px',
                  backgroundColor: 'var(--nebula)',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {doc.content}
              </div>
            </div>
          )}

          {/* Links */}
          {doc.links.length > 0 && (
            <div>
              <p style={sectionLabelStyle}>Links</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {doc.links.map((link, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <ExternalLink size={12} strokeWidth={1.5} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                      {link.label}:
                    </span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--sun)',
                        textDecoration: 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none';
                      }}
                    >
                      {link.url}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {doc.files.length > 0 && (
            <div>
              <p style={sectionLabelStyle}>Arquivos</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {doc.files.map((file, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      padding: '8px 10px',
                      backgroundColor: 'var(--nebula)',
                      borderRadius: 6,
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <FileTypeIcon fileType={file.type.toLowerCase()} size={16} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', flex: 1 }}>
                      {file.name}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                      {file.type} {file.size && `\u00B7 ${file.size}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            onClick={() => onEdit(doc)}
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
            <Edit2 size={14} strokeWidth={1.5} />
            Editar
          </button>
          <button
            onClick={() => {
              const url = `${window.location.origin}/biblioteca?doc=${doc.id}`;
              navigator.clipboard.writeText(url);
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
            <Link size={14} strokeWidth={1.5} />
            Copiar link
          </button>
          <button
            onClick={() => onDelete(doc)}
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
