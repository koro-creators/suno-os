/**
 * NodePalette — sidebar sources for canvas drag-and-drop (SPEC-005 TASK-C08).
 *
 * Expandable items (Tool / Agente / Ação / Sub-workflow / Merge) open a
 * second column to the RIGHT instead of pushing the main list downward,
 * so the palette never needs a vertical scrollbar.
 */
'use client';

import { useEffect, useState } from 'react';
import {
  CarbonIconType,
  Branch,
  ChevronLeft,
  ChevronRight,
  Flash,
  Flow,
  Merge,
  Star,
  Tools,
  UserFollow,
} from '@carbon/icons-react';
import { useAgents } from '@/contexts/AgentsContext';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import { listAvailableTools, type ToolDescriptor } from '@/lib/api';

interface DragPayload {
  step_type: 'tool' | 'llm' | 'condition' | 'action' | 'hitl' | 'workflow' | 'merge';
  tool_name?: string;
  agent_id?: string;
  condition_operator?: 'if_else';
  action_type?: 'slack' | 'email' | 'whatsapp' | 'telegram';
  workflow_id?: string;
  merge_policy?: 'all' | 'any';
  name?: string;
  default_config?: Record<string, unknown>;
}

interface PaletteItem {
  key: string;
  label: string;
  description: string;
  Icon: CarbonIconType;
  color: string;
  payload: DragPayload;
  expandable?: boolean;
}

interface SubItem {
  key: string;
  icon?: string;
  Icon?: CarbonIconType;
  iconColor?: string;
  label: string;
  description?: string;
  payload: DragPayload;
}

const TOOL_CATEGORY_COLOR: Record<ToolDescriptor['category'], string> = {
  criacao: 'var(--criacao)',
  midia: 'var(--midia)',
  planejamento: 'var(--planejamento)',
  controle: 'var(--text-muted)',
};

const STEP_TYPES: PaletteItem[] = [
  {
    key: 'st-tool',
    label: 'Tool',
    description: 'Chama uma ferramenta do catálogo.',
    Icon: Tools,
    color: '#3B82F6',
    payload: { step_type: 'tool' },
    expandable: true,
  },
  {
    key: 'st-llm',
    label: 'Agente',
    description: 'Compor texto com um agente ou prompt manual.',
    Icon: Star,
    color: '#8B5CF6',
    payload: { step_type: 'llm' },
    expandable: true,
  },
  {
    key: 'st-condition',
    label: 'Condição',
    description: 'Branch then/else por valor comparado.',
    Icon: Branch,
    color: '#F59E0B',
    payload: { step_type: 'condition', condition_operator: 'if_else' },
  },
  {
    key: 'st-action',
    label: 'Ação',
    description: 'Slack, email, WhatsApp, Telegram.',
    Icon: Flash,
    color: '#22C55E',
    payload: { step_type: 'action' },
    expandable: true,
  },
  {
    key: 'st-hitl',
    label: 'Aprovação humana',
    description: 'Pausa para revisão (HITL).',
    Icon: UserFollow,
    color: 'var(--sun)',
    payload: { step_type: 'hitl' },
  },
  {
    key: 'st-workflow',
    label: 'Sub-workflow',
    description: 'Chama outro workflow.',
    Icon: Flow,
    color: '#EC4899',
    payload: { step_type: 'workflow' },
    expandable: true,
  },
  {
    key: 'st-merge',
    label: 'Merge',
    description: 'Aguarda fan-in (all / any).',
    Icon: Merge,
    color: 'var(--text-muted)',
    payload: { step_type: 'merge' },
    expandable: true,
  },
];

function PaletteRow({
  item,
  active,
  onHover,
}: {
  item: PaletteItem;
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

function PaletteSubRow({ item }: { item: SubItem }) {
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

  const subItemsFor = (key: string): SubItem[] | null => {
    if (key === 'st-tool') {
      return tools.map((t) => ({
        key: `tool-${t.tool_name}`,
        Icon: Tools,
        iconColor: TOOL_CATEGORY_COLOR[t.category],
        label: t.label,
        description: t.description,
        payload: {
          step_type: 'tool',
          tool_name: t.tool_name,
          name: t.label,
          default_config: t.default_config,
        },
      }));
    }
    if (key === 'st-llm') {
      return activeAgents.map((a) => ({
        key: `agent-${a.id}`,
        icon: a.icon,
        label: a.name,
        description: 'Agente · aba Agentes',
        payload: { step_type: 'llm', agent_id: a.id, name: a.name },
      }));
    }
    if (key === 'st-action') {
      return [
        {
          key: 'action-slack',
          icon: '#',
          iconColor: '#4A154B',
          label: 'Slack',
          description: 'Enviar mensagem para canal',
          payload: { step_type: 'action' as const, action_type: 'slack' as const, name: 'Slack' },
        },
        {
          key: 'action-email',
          icon: '@',
          iconColor: '#6366F1',
          label: 'Email',
          description: 'Enviar e-mail',
          payload: { step_type: 'action' as const, action_type: 'email' as const, name: 'Email' },
        },
        {
          key: 'action-whatsapp',
          icon: 'W',
          iconColor: '#25D366',
          label: 'WhatsApp',
          description: 'Enviar mensagem WhatsApp',
          payload: { step_type: 'action' as const, action_type: 'whatsapp' as const, name: 'WhatsApp' },
        },
        {
          key: 'action-telegram',
          icon: '✈',
          iconColor: '#2CA5E0',
          label: 'Telegram',
          description: 'Enviar mensagem Telegram',
          payload: { step_type: 'action' as const, action_type: 'telegram' as const, name: 'Telegram' },
        },
      ];
    }
    if (key === 'st-workflow') {
      return activeWorkflows.map((w) => ({
        key: `wf-${w.id}`,
        Icon: Flow,
        iconColor: '#EC4899',
        label: w.name,
        description: w.description || 'Sub-workflow',
        payload: { step_type: 'workflow' as const, workflow_id: w.id, name: w.name },
      }));
    }
    if (key === 'st-merge') {
      return [
        {
          key: 'merge-all',
          icon: '∀',
          iconColor: 'var(--text-secondary)',
          label: 'Todos (all)',
          description: 'Avança quando todos os branches chegarem',
          payload: { step_type: 'merge' as const, merge_policy: 'all' as const, name: 'Merge · all' },
        },
        {
          key: 'merge-any',
          icon: '∃',
          iconColor: 'var(--text-secondary)',
          label: 'Qualquer um (any)',
          description: 'Avança com o primeiro branch que chegar',
          payload: { step_type: 'merge' as const, merge_policy: 'any' as const, name: 'Merge · any' },
        },
      ];
    }
    return null;
  };

  const expandedItem = expandedKey ? STEP_TYPES.find((i) => i.key === expandedKey) : null;
  const subItems = expandedKey ? subItemsFor(expandedKey) : null;

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
        {STEP_TYPES.map((item) => (
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
        {STEP_TYPES.map((item) => (
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
