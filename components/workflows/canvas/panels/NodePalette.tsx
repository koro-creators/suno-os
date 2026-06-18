/**
 * NodePalette — sidebar sources for canvas drag-and-drop (SPEC-005 TASK-C08).
 *
 * Expandable items (Tool / Agente / Ação / Sub-workflow / Merge) open a
 * second column to the RIGHT instead of pushing the main list downward,
 * so the palette never needs a vertical scrollbar.
 */
'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from '@carbon/icons-react';
import { useAgents } from '@/contexts/AgentsContext';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import { listAvailableTools, type ToolDescriptor } from '@/lib/api';
import {
  buildSubItems,
  STEP_CATALOG,
  type StepCatalogItem,
  type StepSubItem,
} from '../shared/step-catalog';

function PaletteRow({
  item,
  active,
  onHover,
}: {
  item: StepCatalogItem;
  active?: boolean;
  onHover?: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      draggable={!item.expandable}
      aria-label={item.expandable ? `Expandir ${item.label}` : `Arrastar ${item.label} para a tela do workflow`}
      aria-expanded={item.expandable ? active : undefined}
      onMouseEnter={item.expandable ? onHover : undefined}
      onKeyDown={
        item.expandable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onHover?.();
              }
            }
          : undefined
      }
      onDragStart={
        !item.expandable
          ? (e) => {
              e.dataTransfer.setData('application/sunos-canvas', JSON.stringify(item.payload));
              e.dataTransfer.effectAllowed = 'move';
            }
          : undefined
      }
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '8px 10px',
        borderRadius: 8,
        border: `1px solid ${active ? '#F59E0B' : 'var(--border-subtle)'}`,
        background: active ? 'rgba(245,158,11,0.06)' : 'var(--deep)',
        marginBottom: 6,
        cursor: item.expandable ? 'default' : 'grab',
        transition: 'border-color 150ms ease, background 150ms ease',
      }}
    >
      <item.Icon size={14} color={active ? '#F59E0B' : item.color} style={{ marginTop: 1, flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: active ? '#F59E0B' : 'var(--text-primary)' }}>
          {item.label}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.description}
        </span>
      </div>
      {item.expandable && (
        <ChevronRight
          size={12}
          style={{
            color: active ? '#F59E0B' : 'var(--text-muted)',
            flexShrink: 0,
            marginTop: 2,
            transition: 'color 150ms ease',
          }}
        />
      )}
    </div>
  );
}

function PaletteSubRow({ item }: { item: StepSubItem }) {
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      aria-label={`Arrastar ${item.label} para a tela do workflow`}
      onDragStart={(e) => {
        e.dataTransfer.setData('application/sunos-canvas', JSON.stringify(item.payload));
        e.dataTransfer.effectAllowed = 'move';
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        borderRadius: 8,
        border: '1px solid transparent',
        background: 'var(--nebula)',
        marginBottom: 4,
        cursor: 'grab',
        transition: 'background 150ms ease, border-color 150ms ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.background = 'var(--deep)';
        el.style.borderColor = 'var(--twilight)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.background = 'var(--nebula)';
        el.style.borderColor = 'transparent';
      }}
    >
      <span
        aria-hidden="true"
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--deep)',
        }}
      >
        {item.icon ? (
          <span style={{ fontSize: 12, lineHeight: 1, color: item.iconColor ?? 'var(--text-primary)', fontWeight: 600 }}>
            {item.icon}
          </span>
        ) : item.Icon ? (
          <item.Icon size={14} color={item.iconColor ?? 'var(--text-muted)'} />
        ) : null}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 500,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.label}
        </span>
        {item.description && (
          <span
            style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.description}
          </span>
        )}
      </div>
    </div>
  );
}

export default function NodePalette({ currentWorkflowId }: { currentWorkflowId?: string }) {
  const { agents } = useAgents();
  const { workflows } = useWorkflows();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [tools, setTools] = useState<ToolDescriptor[]>([]);
  const [toolsLoading, setToolsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listAvailableTools()
      .then((list) => {
        if (cancelled) return;
        setTools(list);
        setToolsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setToolsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeAgents = agents.filter((a) => a.status === 'active');
  const activeWorkflows = workflows.filter(
    (w) => w.status === 'active' && w.id !== currentWorkflowId,
  );

  const expandedItem = expandedKey ? STEP_CATALOG.find((i) => i.key === expandedKey) : null;
  const subItems = expandedKey ? buildSubItems(expandedKey, tools, activeAgents, activeWorkflows) : null;

  // ── Collapsed strip (icon-only, still draggable) ─────────────────────────
  if (collapsed) {
    return (
      <aside
        aria-label="Paleta de nodes (retraída)"
        style={{
          width: 50,
          minWidth: 50,
          height: '100%',
          background: 'var(--void)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8px 0',
          gap: 5,
          overflowY: 'auto',
        }}
      >
        <button
          onClick={() => setCollapsed(false)}
          title="Expandir paleta"
          aria-label="Expandir paleta de nodes"
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            background: 'var(--deep)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            marginBottom: 4,
            flexShrink: 0,
          }}
        >
          <ChevronRight size={14} />
        </button>
        {STEP_CATALOG.map((item) => (
          <div
            key={item.key}
            draggable={!item.expandable}
            title={item.expandable ? `${item.label} — expanda a paleta para selecionar` : item.label}
            aria-label={item.expandable ? `Expandir paleta para ver ${item.label}` : `Arrastar ${item.label} para a tela do workflow`}
            onDragStart={
              !item.expandable
                ? (e) => {
                    e.dataTransfer.setData('application/sunos-canvas', JSON.stringify(item.payload));
                    e.dataTransfer.effectAllowed = 'move';
                  }
                : undefined
            }
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--deep)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: item.expandable ? 'default' : 'grab',
              flexShrink: 0,
              opacity: item.expandable ? 0.45 : 1,
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (!item.expandable) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--twilight)';
            }}
            onMouseLeave={(e) => {
              if (!item.expandable) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
            }}
          >
            <item.Icon size={14} color={item.color} />
          </div>
        ))}
      </aside>
    );
  }

  // ── Expanded palette — two-column layout ─────────────────────────────────
  return (
    <aside
      aria-label="Paleta de nodes"
      style={{
        display: 'flex',
        height: '100%',
        background: 'var(--void)',
        borderRight: '1px solid var(--border-subtle)',
      }}
      onMouseLeave={() => setExpandedKey(null)}
    >
      {/* Column 1 — main list */}
      <div
        style={{
          width: 220,
          minWidth: 220,
          display: 'flex',
          flexDirection: 'column',
          padding: 12,
          borderRight: expandedKey ? '1px solid var(--border-subtle)' : 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <h2
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: 'var(--text-muted)',
              margin: 0,
            }}
          >
            Steps
          </h2>
          <button
            onClick={() => { setCollapsed(true); setExpandedKey(null); }}
            title="Retrair paleta"
            aria-label="Retrair paleta de nodes"
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              border: '1px solid var(--border-subtle)',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={12} />
          </button>
        </div>
        {STEP_CATALOG.map((item) => (
          <PaletteRow
            key={item.key}
            item={item}
            active={expandedKey === item.key}
            onHover={() => setExpandedKey(item.key)}
          />
        ))}
      </div>

      {/* Column 2 — sub-items flyout (opens to the right) */}
      {expandedKey && (
        <div
          key={expandedKey}
          style={{
            width: 200,
            minWidth: 200,
            display: 'flex',
            flexDirection: 'column',
            padding: 12,
            overflowY: 'auto',
            animation: 'sunos-palette-flyout 150ms ease',
          }}
        >
          <p
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: 'var(--text-muted)',
              margin: '0 0 10px',
              fontWeight: 600,
            }}
          >
            {expandedItem?.label}
          </p>
          {expandedKey === 'st-tool' && toolsLoading && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0' }}>Carregando…</p>
          )}
          {expandedKey === 'st-llm' && activeAgents.length === 0 && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0' }}>
              Nenhum agente ativo na aba Agentes.
            </p>
          )}
          {expandedKey === 'st-workflow' && activeWorkflows.length === 0 && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0' }}>
              Nenhum workflow ativo disponível.
            </p>
          )}
          {subItems?.map((sub) => (
            <PaletteSubRow key={sub.key} item={sub} />
          ))}
        </div>
      )}

      <style jsx global>{`
        @keyframes sunos-palette-flyout {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </aside>
  );
}
