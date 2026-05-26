/**
 * NodePalette — sidebar sources for canvas drag-and-drop (SPEC-005 TASK-C08).
 *
 * Two stacks:
 *   1. Step types — always available regardless of role (Tool / LLM /
 *      Condition / Action / HITL / SubWorkflow / Merge).
 *   2. Tools — fetched from /api/tools?for_user=current (TASK-C08b). The
 *      list is server-filtered by RBAC so we never display a tool the user
 *      can't use (FR-WBC-12).
 *
 * Drag mechanics: each item sets `dataTransfer` with a JSON payload the
 * canvas's onDrop reads (in WorkflowCanvas.tsx). Drop fires on the canvas
 * pane; the canvas converts screen coords to flow coords with
 * `screenToFlowPosition` before adding the new node.
 */
'use client';

import { useEffect, useState } from 'react';
import { CarbonIconType, Branch, Flash, Flow, Merge, Star, Tools, UserFollow } from '@carbon/icons-react';
import { listAvailableTools, type ToolDescriptor } from '@/lib/api';

interface DragPayload {
  source: 'step-type' | 'tool';
  step_type: 'tool' | 'llm' | 'condition' | 'action' | 'hitl' | 'workflow' | 'merge';
  tool_name?: string;
  default_config?: Record<string, unknown>;
}

interface PaletteItem {
  key: string;
  label: string;
  description: string;
  Icon: CarbonIconType;
  color: string;
  payload: DragPayload;
}

const STEP_TYPES: PaletteItem[] = [
  {
    key: 'st-tool',
    label: 'Tool',
    description: 'Chama uma ferramenta do catálogo.',
    Icon: Tools,
    color: '#3B82F6',
    payload: { source: 'step-type', step_type: 'tool' },
  },
  {
    key: 'st-llm',
    label: 'LLM',
    description: 'Compor texto com prompt.',
    Icon: Star,
    color: '#8B5CF6',
    payload: { source: 'step-type', step_type: 'llm' },
  },
  {
    key: 'st-condition',
    label: 'Condição',
    description: 'Branch then/else por valor.',
    Icon: Branch,
    color: '#F59E0B',
    payload: { source: 'step-type', step_type: 'condition' },
  },
  {
    key: 'st-action',
    label: 'Ação',
    description: 'Side-effect (Slack, email…).',
    Icon: Flash,
    color: '#22C55E',
    payload: { source: 'step-type', step_type: 'action' },
  },
  {
    key: 'st-hitl',
    label: 'Aprovação humana',
    description: 'Pausa para revisão (HITL).',
    Icon: UserFollow,
    color: 'var(--sun)',
    payload: { source: 'step-type', step_type: 'hitl' },
  },
  {
    key: 'st-workflow',
    label: 'Sub-workflow',
    description: 'Chama outro workflow.',
    Icon: Flow,
    color: '#EC4899',
    payload: { source: 'step-type', step_type: 'workflow' },
  },
  {
    key: 'st-merge',
    label: 'Merge',
    description: 'Aguarda fan-in (all/any).',
    Icon: Merge,
    color: 'var(--text-muted)',
    payload: { source: 'step-type', step_type: 'merge' },
  },
];

function PaletteRow({ item }: { item: PaletteItem }) {
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
        alignItems: 'flex-start',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid var(--border-subtle)',
        background: 'var(--deep)',
        marginBottom: 6,
        cursor: 'grab',
        transition: 'border-color 150ms ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--twilight)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
      }}
    >
      <item.Icon size={14} color={item.color} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
          {item.label}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.description}</span>
      </div>
    </div>
  );
}

const CATEGORY_LABEL: Record<ToolDescriptor['category'], string> = {
  criacao: 'Criação',
  midia: 'Mídia',
  planejamento: 'Planejamento',
  controle: 'Controle',
};

export default function NodePalette() {
  const [tools, setTools] = useState<ToolDescriptor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listAvailableTools()
      .then((list) => {
        if (cancelled) return;
        setTools(list);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Bucket tools by category for sectioned rendering.
  const toolsByCategory = tools.reduce<Record<string, ToolDescriptor[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  return (
    <aside
      aria-label="Paleta de nodes"
      style={{
        width: 240,
        minWidth: 240,
        height: '100%',
        background: 'var(--void)',
        borderRight: '1px solid var(--border-subtle)',
        padding: 12,
        overflowY: 'auto',
      }}
    >
      <h2
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: 'var(--text-muted)',
          marginBottom: 8,
        }}
      >
        Tipos de step
      </h2>
      {STEP_TYPES.map((item) => (
        <PaletteRow key={item.key} item={item} />
      ))}

      <h2
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: 'var(--text-muted)',
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        Tools
      </h2>
      {loading && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Carregando…</p>
      )}
      {error && (
        <p style={{ fontSize: 11, color: '#EF4444' }} role="alert">
          {error}
        </p>
      )}
      {!loading && !error &&
        Object.entries(toolsByCategory).map(([category, list]) => (
          <div key={category}>
            <h3
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginTop: 12,
                marginBottom: 4,
              }}
            >
              {CATEGORY_LABEL[category as ToolDescriptor['category']] ?? category}
            </h3>
            {list.map((tool) => {
              const item: PaletteItem = {
                key: `tool-${tool.tool_name}`,
                label: tool.label,
                description: tool.description,
                Icon: Tools,
                color: '#3B82F6',
                payload: {
                  source: 'tool',
                  step_type: 'tool',
                  tool_name: tool.tool_name,
                  default_config: tool.default_config,
                },
              };
              return <PaletteRow key={item.key} item={item} />;
            })}
          </div>
        ))}
    </aside>
  );
}
