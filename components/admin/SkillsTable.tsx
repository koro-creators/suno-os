'use client';

import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { SkillAdmin } from '@/lib/admin-types';

const TYPE_COLORS: Record<string, string> = {
  criacao: 'var(--criacao)',
  midia: 'var(--midia)',
  planejamento: 'var(--planejamento)',
};

const STATUS_STYLES: Record<string, { label: string; color: string; border: string }> = {
  active: { label: 'Ativo', color: '#10B981', border: '#10B98140' },
  draft: { label: 'Rascunho', color: 'var(--sun)', border: 'rgba(255,200,1,0.25)' },
  archived: { label: 'Arquivado', color: 'var(--text-muted)', border: 'var(--border-subtle)' },
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

type SortField = 'name' | 'score' | 'updatedAt';
type SortDir = 'asc' | 'desc';

interface SkillsTableProps {
  skills: SkillAdmin[];
  onSelect: (skill: SkillAdmin) => void;
  onArchiveToggle: (skill: SkillAdmin) => void;
  onDelete: (skill: SkillAdmin) => void;
  onEdit: (skill: SkillAdmin) => void;
}

export default function SkillsTable({
  skills,
  onSelect,
  onArchiveToggle,
  onDelete,
  onEdit,
}: SkillsTableProps) {
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'name' ? 'asc' : 'desc');
    }
  };

  const sorted = [...skills].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'name') {
      cmp = a.name.localeCompare(b.name);
    } else if (sortField === 'score') {
      cmp = a.averageScore - b.averageScore;
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
            <th style={{ ...thStyle, width: 28, padding: '10px 4px 10px 8px' }}></th>
            <th
              style={{ ...thStyle, cursor: 'pointer' }}
              onClick={() => toggleSort('name')}
            >
              Nome{sortIndicator('name')}
            </th>
            <th style={thStyle}>Status</th>
            <th style={thStyle} className="skills-hide-mobile">Modelo</th>
            <th style={thStyle} className="skills-hide-mobile">Clientes</th>
            <th style={thStyle} className="skills-hide-mobile">Moons</th>
            <th
              style={{ ...thStyle, cursor: 'pointer' }}
              onClick={() => toggleSort('score')}
            >
              Score{sortIndicator('score')}
            </th>
            <th
              style={{ ...thStyle, cursor: 'pointer' }}
              onClick={() => toggleSort('updatedAt')}
            >
              Atualizado{sortIndicator('updatedAt')}
            </th>
            <th style={{ ...thStyle, width: 40, textAlign: 'center' }}></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((skill) => {
            const typeColor = TYPE_COLORS[skill.type];
            const statusInfo = STATUS_STYLES[skill.status];
            const isHovered = hoveredRow === skill.id;
            const isMenuOpen = menuOpenId === skill.id;

            const scoreColor =
              skill.totalFeedbacks === 0
                ? 'var(--text-muted)'
                : skill.averageScore >= 4.0
                  ? 'var(--sun)'
                  : skill.averageScore >= 3.0
                    ? 'var(--text-secondary)'
                    : 'var(--text-muted)';

            return (
              <tr
                key={skill.id}
                role="button"
                tabIndex={0}
                style={{
                  cursor: 'pointer',
                  backgroundColor: isHovered ? 'var(--surface-hover)' : 'transparent',
                  transition: 'background-color 150ms ease',
                  outline: 'none',
                }}
                onMouseEnter={() => setHoveredRow(skill.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onSelect(skill)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSelect(skill);
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15) inset';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Type dot */}
                <td style={{ ...tdStyle, width: 28, padding: '0 4px 0 8px' }}>
                  <span
                    style={{
                      display: 'block',
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      backgroundColor: typeColor,
                    }}
                  />
                </td>

                {/* Name */}
                <td style={{ ...tdStyle, fontWeight: 500 }}>
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                      maxWidth: 260,
                    }}
                  >
                    {skill.name}
                  </span>
                </td>

                {/* Status badge */}
                <td style={metaTdStyle}>
                  <span
                    style={{
                      fontSize: '0.55rem',
                      fontWeight: 500,
                      padding: '1px 6px',
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
                    }}
                  >
                    {statusInfo.label}
                  </span>
                </td>

                {/* Model */}
                <td style={metaTdStyle} className="skills-hide-mobile">
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.65rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {skill.model}
                  </span>
                </td>

                {/* Clients count */}
                <td style={metaTdStyle} className="skills-hide-mobile">
                  {skill.assignedClients.length}
                </td>

                {/* Moons count */}
                <td style={metaTdStyle} className="skills-hide-mobile">
                  {skill.moons.length}
                </td>

                {/* Score */}
                <td style={metaTdStyle}>
                  <span style={{ color: scoreColor }}>
                    {skill.totalFeedbacks > 0
                      ? `\u2605 ${skill.averageScore.toFixed(1)}`
                      : '\u2014'}
                  </span>
                </td>

                {/* Updated */}
                <td style={metaTdStyle}>{timeAgo(skill.updatedAt)}</td>

                {/* Actions */}
                <td
                  style={{ ...metaTdStyle, width: 40, textAlign: 'center', position: 'relative' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(isMenuOpen ? null : skill.id);
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
                    <MoreHorizontal size={16} strokeWidth={1.5} />
                  </button>

                  {/* Dropdown menu */}
                  {isMenuOpen && (
                    <>
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
                          minWidth: 130,
                          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(null);
                            onEdit(skill);
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
                            onArchiveToggle(skill);
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
                          {skill.status === 'archived' ? 'Ativar' : 'Arquivar'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(null);
                            onDelete(skill);
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

      <style>{`
        @media (max-width: 768px) {
          .skills-hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
