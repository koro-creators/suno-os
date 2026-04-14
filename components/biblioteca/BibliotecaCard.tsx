'use client';

import Image from 'next/image';
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
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'há 1d';
  if (days < 30) return `há ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `há ${months}m`;
  const years = Math.floor(months / 12);
  return `há ${years}a`;
}

interface BibliotecaCardProps {
  doc: BibliotecaDocument;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleteConfirm?: boolean;
}

export default function BibliotecaCard({
  doc,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  isDeleteConfirm,
}: BibliotecaCardProps) {
  const maxVisibleTags = 3;
  const visibleTags = isExpanded ? doc.tags : doc.tags.slice(0, maxVisibleTags);
  const extraTagsCount = doc.tags.length - maxVisibleTags;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onToggleExpand();
  };

  // ---------- Expanded state ----------
  if (isExpanded) {
    return (
      <div
        style={{
          gridColumn: '1 / -1',
          backgroundColor: 'var(--deep)',
          border: '1px solid var(--twilight)',
          borderRadius: 12,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          outline: 'none',
        }}
      >
        {/* Top bar: title + action buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            {doc.title}
          </span>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              onClick={onEdit}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.7rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 6,
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
            >
              Editar
            </button>
            <button
              onClick={onDelete}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.7rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 6,
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = '#EF4444';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
            >
              {isDeleteConfirm ? 'Confirmar?' : 'Excluir'}
            </button>
            <button
              onClick={onToggleExpand}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 6,
                lineHeight: 1,
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
        </div>

        {/* Full content */}
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6,
          }}
        >
          {doc.content}
        </div>

        {/* Scope as full names */}
        {doc.scope.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {doc.scope.map((s) => (
              <span
                key={s}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.65rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: CLIENT_COLORS[s] ?? 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                />
                {s}
              </span>
            ))}
          </div>
        )}

        {/* All tags */}
        {doc.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {doc.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '0.6rem',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  borderRadius: 9999,
                  padding: '1px 6px',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Links section */}
        {doc.links.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Links
            </span>
            {doc.links.map((link, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{link.label}:</span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.75rem', color: 'var(--sun)', textDecoration: 'none' }}
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
        )}

        {/* Files section */}
        {doc.files.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Arquivos
            </span>
            {doc.files.map((file, i) => (
              <span key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {file.name} · {file.type} · {file.size}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          {doc.links.length} links · {doc.files.length} arquivos · Editado {timeAgo(doc.updatedAt)}
        </div>
      </div>
    );
  }

  // ---------- Collapsed state ----------
  const statusColor = doc.status === 'ready' ? '#10B981' : doc.status === 'error' ? '#EF4444' : '#F59E0B';
  const statusLabel = doc.status === 'ready' ? 'Pronto' : doc.status === 'error' ? 'Erro' : 'Processando...';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggleExpand}
      onKeyDown={handleKeyDown}
      style={{
        backgroundColor: 'var(--deep)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: 16,
        cursor: 'pointer',
        transition: 'border-color 150ms ease',
        outline: 'none',
        display: 'flex',
        gap: 12,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--twilight)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.2)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Thumbnail / FileTypeIcon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 8,
          backgroundColor: 'var(--nebula)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {doc.thumbnailUrl ? (
          <Image
            src={doc.thumbnailUrl}
            alt={doc.title}
            width={80}
            height={80}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
          />
        ) : (
          <FileTypeIcon fileType={doc.fileType} size={28} />
        )}
      </div>

      {/* Content area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
        {/* Title + badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            {doc.title}
          </span>
          {doc.fileType && (
            <span
              style={{
                fontSize: '0.55rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                padding: '1px 6px',
                borderRadius: 9999,
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                letterSpacing: '0.04em',
              }}
            >
              {doc.fileType}
            </span>
          )}
          {doc.status && (
            <span
              style={{
                fontSize: '0.55rem',
                fontWeight: 500,
                padding: '1px 6px',
                borderRadius: 9999,
                color: statusColor,
                border: `1px solid ${statusColor}33`,
                backgroundColor: `${statusColor}11`,
              }}
            >
              {statusLabel}
            </span>
          )}
        </div>

        {/* Content preview — 2 lines max */}
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.5,
          }}
        >
          {doc.content}
        </div>

        {/* Scope dots */}
        {doc.scope.length > 0 && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {doc.scope.map((s) => (
              <span
                key={s}
                title={s}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: CLIENT_COLORS[s] ?? 'var(--text-muted)',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        )}

        {/* Tags */}
        {doc.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {visibleTags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '0.6rem',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  borderRadius: 9999,
                  padding: '1px 6px',
                }}
              >
                {tag}
              </span>
            ))}
            {extraTagsCount > 0 && (
              <span
                style={{
                  fontSize: '0.6rem',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  borderRadius: 9999,
                  padding: '1px 6px',
                }}
              >
                +{extraTagsCount}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>
            {doc.links.length} links · {doc.files.length} arquivos
          </span>
          <span>Editado {timeAgo(doc.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
