'use client';

import { useState } from 'react';
import { OverflowMenuHorizontal } from '@carbon/icons-react';
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
  if (minutes < 60) return `${minutes}min atras`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atras`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1d atras';
  if (days < 30) return `${days}d atras`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}m atras`;
  const years = Math.floor(months / 12);
  return `${years}a atras`;
}

type SortField = 'title' | 'updatedAt';
type SortDir = 'asc' | 'desc';

interface BibliotecaTableProps {
  documents: BibliotecaDocument[];
  onRowClick: (doc: BibliotecaDocument) => void;
  onEdit: (doc: BibliotecaDocument) => void;
  onDelete: (doc: BibliotecaDocument) => void;
}

export default function BibliotecaTable({
  documents,
  onRowClick,
  onEdit,
  onDelete,
}: BibliotecaTableProps) {
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'title' ? 'asc' : 'desc');
    }
  };

  const sorted = [...documents].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'title') {
      cmp = a.title.localeCompare(b.title);
    } else {
      cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' \u2191' : ' \u2193';
  };

  const thStyle: React.CSSProperties = {
    fontSize: '0.55rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: 'var(--text-muted)',
    padding: '10px 8px',
    textAlign: 'left',
    borderBottom: '1px solid var(--border-subtle)',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    color: 'var(--text-primary)',
    padding: '0 8px',
    borderBottom: '1px solid var(--border-subtle)',
    height: 48,
    verticalAlign: 'middle',
  };

  const metaTdStyle: React.CSSProperties = {
    ...tdStyle,
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'auto',
        }}
      >
        <thead>
          <tr>
            <th style={{ ...thStyle, width: 32, padding: '10px 4px 10px 8px' }}></th>
            <th
              style={{ ...thStyle, cursor: 'pointer' }}
              onClick={() => toggleSort('title')}
            >
              Titulo{sortIndicator('title')}
            </th>
            <th style={thStyle} className="hide-mobile">Tags</th>
            <th style={thStyle} className="hide-mobile">Escopo</th>
            <th
              style={{ ...thStyle, cursor: 'pointer' }}
              onClick={() => toggleSort('updatedAt')}
            >
              Atualizado{sortIndicator('updatedAt')}
            </th>
            <th style={thStyle}>Status</th>
            <th style={{ ...thStyle, width: 40, textAlign: 'center' }}></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((doc) => {
            const statusColor =
              doc.status === 'ready' ? '#10B981' : doc.status === 'error' ? '#EF4444' : '#F59E0B';
            const statusLabel =
              doc.status === 'ready' ? 'Pronto' : doc.status === 'error' ? 'Erro' : 'Processando';
            const isHovered = hoveredRow === doc.id;
            const isMenuOpen = menuOpenId === doc.id;

            return (
              <tr
                key={doc.id}
                role="button"
                tabIndex={0}
                style={{
                  cursor: 'pointer',
                  backgroundColor: isHovered ? 'var(--surface-hover)' : 'transparent',
                  transition: 'background-color 150ms ease',
                  outline: 'none',
                }}
                onMouseEnter={() => setHoveredRow(doc.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onRowClick(doc)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onRowClick(doc);
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15) inset';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Type icon */}
                <td style={{ ...tdStyle, width: 32, padding: '0 4px 0 8px' }}>
                  <FileTypeIcon fileType={doc.fileType} docType={doc.docType} size={16} />
                </td>

                {/* Title */}
                <td style={{ ...tdStyle, fontWeight: 500 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 320 }}>
                    {doc.title}
                  </span>
                </td>

                {/* Tags */}
                <td style={metaTdStyle} className="hide-mobile">
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
                    {doc.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '0.6rem',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-muted)',
                          borderRadius: 9999,
                          padding: '1px 6px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {doc.tags.length > 3 && (
                      <span
                        style={{
                          fontSize: '0.6rem',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        +{doc.tags.length - 3}
                      </span>
                    )}
                  </div>
                </td>

                {/* Scope */}
                <td style={metaTdStyle} className="hide-mobile">
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {doc.scope.map((s) => (
                      <span
                        key={s}
                        title={s}
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          backgroundColor: CLIENT_COLORS[s] ?? 'var(--text-muted)',
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  </div>
                </td>

                {/* Updated */}
                <td style={metaTdStyle}>{timeAgo(doc.updatedAt)}</td>

                {/* Status */}
                <td style={metaTdStyle}>
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
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {statusLabel}
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td
                  style={{ ...metaTdStyle, width: 40, textAlign: 'center', position: 'relative' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(isMenuOpen ? null : doc.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 4,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                    aria-label="Acoes"
                  >
                    <OverflowMenuHorizontal size={16} />
                  </button>

                  {/* Dropdown menu */}
                  {isMenuOpen && (
                    <>
                      {/* Invisible backdrop to close menu */}
                      <div
                        style={{ position: 'fixed', inset: 0, zIndex: 80 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(null);
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          zIndex: 81,
                          backgroundColor: 'var(--deep)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 8,
                          padding: 4,
                          minWidth: 120,
                          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(null);
                            onEdit(doc);
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            padding: '6px 10px',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            borderRadius: 4,
                            transition: 'background-color 150ms ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(null);
                            onDelete(doc);
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            padding: '6px 10px',
                            fontSize: '0.75rem',
                            color: '#EF4444',
                            cursor: 'pointer',
                            borderRadius: 4,
                            transition: 'background-color 150ms ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Inline style for responsive hiding */}
      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
