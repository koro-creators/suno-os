/**
 * LLMNode — Agente IA step (SPEC-005 TASK-C03). Purple swatch.
 * Target handles: `in` (left, enables the block), tool_0/1/2 (bottom, receive
 * tool outputs as inputs). Source handles: `out` (right, activates next step),
 * optional `error` (right, red).
 */
'use client';

import { Star, Tools } from '@carbon/icons-react';
import { Position, type NodeProps } from '@xyflow/react';
import { NodeShell, type ExecutionStatus, type HandleSpec } from './NodeShell';

interface LLMNodeData {
  type: 'llm';
  name: string;
  prompt?: string;
  agent_id?: string;
  _hasErrorEdge?: boolean;
  _executionStatus?: ExecutionStatus;
  [key: string]: unknown;
}

const BORDER = '#8B5CF6';

export default function LLMNode({ data, selected }: NodeProps) {
  const d = data as LLMNodeData;
  const preview = d.prompt
    ? d.prompt.length > 60
      ? `${d.prompt.slice(0, 60)}…`
      : d.prompt
    : 'sem prompt';
  const sources: HandleSpec[] = [
    { id: 'out', color: '#22C55E', label: 'sucesso' },
  ];
  if (d._hasErrorEdge) {
    sources.push({ id: 'error', color: '#EF4444', label: 'erro' });
  }
  const targets: HandleSpec[] = [
    { id: 'in', color: 'var(--text-muted)', position: Position.Left, label: 'in' },
    { id: 'tool_0', color: '#A78BFA', position: Position.Bottom, label: 'ferramenta 1' },
    { id: 'tool_1', color: '#A78BFA', position: Position.Bottom, label: 'ferramenta 2' },
    { id: 'tool_2', color: '#A78BFA', position: Position.Bottom, label: 'ferramenta 3' },
  ];
  return (
    <NodeShell
      title={d.name}
      typeLabel="Agente IA"
      preview={preview}
      Icon={Star}
      borderColor={BORDER}
      sourceHandles={sources}
      targetHandles={targets}
      selected={selected}
      executionStatus={d._executionStatus}
    >
      <div
        style={{
          padding: '4px 12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          borderTop: '1px solid rgba(139,92,246,0.12)',
        }}
      >
        <Tools size={10} color="var(--text-muted)" />
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Ferramentas</span>
        <div style={{ display: 'flex', gap: 18, marginLeft: 'auto' }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#A78BFA', opacity: 0.45 }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </NodeShell>
  );
}
