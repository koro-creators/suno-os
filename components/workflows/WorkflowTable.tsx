'use client';

import { useState } from 'react';
import { Layers, OverflowMenuHorizontal } from '@carbon/icons-react';
import { Workflow } from '@/lib/workflow-types';
import { clients } from '@/data/clients';

/* ---------- helpers ---------- */

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

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

function humanizeCron(cron: string): string {
  const parts = cron.split(' ');
  if (parts.length < 5) return cron;
  const [minute, hour, dayOfMonth, , dayOfWeek] = parts;

  const h = hour !== '*' ? `${hour}h` : '';

  // Every N hours: "0 */4 * * *" -> "A cada 4h"
  if (hour.startsWith('*/')) {
    const interval = hour.replace('*/', '');
    return `A cada ${interval}h`;
  }

  // Daily: "0 7 * * *" -> "Diario 7h"
  if (dayOfMonth === '*' && dayOfWeek === '*' && hour !== '*') {
    return `Diario ${h}`;
  }

  // Monthly: "0 9 1 * *" -> "Dia 1, 9h"
  if (dayOfMonth !== '*' && dayOfWeek === '*') {
    return `Dia ${dayOfMonth}, ${h}`;
  }

  // Specific weekday: "0 9 * * 1" -> "Seg 9h"
  if (dayOfWeek !== '*' && dayOfMonth === '*') {
    const days = dayOfWeek.split(',').map((d) => WEEKDAYS[parseInt(d, 10)] ?? d).join(', ');
    return `${days} ${h}`.trim();
  }

  return cron;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--sun)',
  active: '#22C55E',
  paused: 'var(--text-muted)',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  paused: 'Pausado',
};

const RUN_COLORS: Record<string, string> = {
  completed: '#22C55E',
  failed: '#EF4444',
};

const RUN_LABELS: Record<string, string> = {
  completed: 'Sucesso',
  failed: 'Falhou',
};

/* ---------- types ---------- */

type SortField = 'name' | 'status' | 'lastRun';
type SortDir = 'asc' | 'desc';

interface WorkflowTableProps {
  workflows: Workflow[];
  onSelect: (workflow: Workflow) => void;
  onEdit: (workflow: Workflow) => void;
  onDelete: (workflow: Workflow) => void;
}

/* ---------- component ---------- */

export default function WorkflowTable({
  workflows,
  onSelect,
  onEdit,
  onDelete,
}: WorkflowTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
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

  const sorted = [...workflows].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'name') {
      cmp = a.name.localeCompare(b.name);
    } else if (sortField === 'status') {
      cmp = a.status.localeCompare(b.status);
    } else {
      const aTime = a.last_run?.completed_at ? new Date(a.last_run.completed_at).getTime() : 0;
      const bTime = b.last_run?.completed_at ? new Date(b.last_run.completed_at).getTime() : 0;
      cmp = aTime - bTime;
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
            <th
              style={{ ...thStyle, cursor: 'pointer' }}
              onClick={() => toggleSort('name')}
            >
              Nome{sortIndicator('name')}
            </th>
            <th
              style={{ ...thStyle, cursor: 'pointer' }}
              onClick={() => toggleSort('status')}
            >
              Status{sortIndicator('status')}
            </th>
            <th style={thStyle} className="wf-hide-mobile">Agendamento</th>
            <th style={thStyle} className="wf-hide-mobile">Cliente</th>
            <th style={thStyle} className="wf-hide-mobile">Steps</th>
            <th
              style={{ ...thStyle, cursor: 'pointer' }}
              onClick={() => toggleSort('lastRun')}
            >
              Ultima Exec.{sortIndicator('lastRun')}
            </th>
            <th style={{ ...thStyle, width: 40, textAlign: 'center' }}></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((wf) => {
            const statusColor = STATUS_COLORS[wf.status] || 'var(--text-muted)';
            const statusLabel = STATUS_LABELS[wf.status] || wf.status;
            const client = clients.find((c) => c.id === wf.client_id);
            const isHovered = hoveredRow === wf.id;
            const isMenuOpen = menuOpenId === wf.id;

            const scheduleLabel =
              wf.schedule && wf.schedule.enabled
                ? humanizeCron(wf.schedule.cron)
                : 'Manual';

            const runStatus = wf.last_run?.status ?? null;
            const runColor = runStatus ? (RUN_COLORS[runStatus] ?? 'var(--text-muted)') : null;
            const runLabel = runStatus ? (RUN_LABELS[runStatus] ?? runStatus) : null;

            return (
              <tr
                key={wf.id}
                role="button"
                tabIndex={0}
                style={{
                  cursor: 'pointer',
                  backgroundColor: isHovered ? 'var(--surface-hover)' : 'transparent',
                  transition: 'background-color 150ms ease',
                  outline: 'none',
                }}
                onMouseEnter={() => setHoveredRow(wf.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onSelect(wf)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSelect(wf);
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15) inset';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Name */}
                <td style={{ ...tdStyle, fontWeight: 500 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 260 }}>
                    {wf.name}
                  </span>
                </td>

                {/* Status */}
                <td style={metaTdStyle}>
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
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {statusLabel}
                  </span>
                </td>

                {/* Schedule */}
                <td style={metaTdStyle} className="wf-hide-mobile">
                  {scheduleLabel}
                </td>

                {/* Client */}
                <td style={metaTdStyle} className="wf-hide-mobile">
                  {client && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          backgroundColor: client.color,
                          flexShrink: 0,
                        }}
                      />
                      {client.name}
                    </span>
                  )}
                </td>

                {/* Steps count */}
                <td style={metaTdStyle} className="wf-hide-mobile">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Layers size={12} />
                    {wf.steps_count}
                  </span>
                </td>

                {/* Last run */}
                <td style={metaTdStyle}>
                  {wf.last_run && wf.last_run.completed_at ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span>{timeAgo(wf.last_run.completed_at)}</span>
                      {runColor && runLabel && (
                        <span
                          style={{
                            fontSize: '0.55rem',
                            fontWeight: 500,
                            padding: '1px 6px',
                            borderRadius: 9999,
                            color: runColor,
                            border: `1px solid ${runColor}33`,
                            backgroundColor: `${runColor}11`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {runLabel}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>
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
                      setMenuOpenId(isMenuOpen ? null : wf.id);
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
                          minWidth: 120,
                          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(null);
                            onEdit(wf);
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
                            onDelete(wf);
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
          .wf-hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
