/**
 * SubWorkflowNode — chamada a outro workflow (SPEC-005 TASK-C05). Pink swatch.
 */
'use client';

import { Flow } from '@carbon/icons-react';
import type { NodeProps } from '@xyflow/react';
import { NodeShell, type ExecutionStatus, type HandleSpec } from './NodeShell';

interface SubWorkflowNodeData {
  type: 'workflow';
  name: string;
  workflow_id?: string;
  _hasErrorEdge?: boolean;
  _executionStatus?: ExecutionStatus;
  [key: string]: unknown;
}

const BORDER = '#EC4899';

export default function SubWorkflowNode({ data, selected }: NodeProps) {
  const d = data as SubWorkflowNodeData;
  const sources: HandleSpec[] = [
    { id: 'out', color: '#22C55E', label: 'sucesso' },
  ];
  if (d._hasErrorEdge) {
    sources.push({ id: 'error', color: '#EF4444', label: 'erro' });
  }
  return (
    <NodeShell
      title={d.name}
      typeLabel="Sub-workflow"
      Icon={Flow}
      borderColor={BORDER}
      sourceHandles={sources}
      selected={selected}
      executionStatus={d._executionStatus}
      shape="square"
    >
      {/* Nested indicator */}
      <div
        style={{
          margin: '2px 8px 8px',
          padding: '2px 6px',
          border: '1px dashed rgba(236,72,153,0.30)',
          borderRadius: 5,
          fontSize: 8.5,
          color: 'var(--text-muted)',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {d.workflow_id ? '⊃ aninhado' : 'selecionar…'}
      </div>
    </NodeShell>
  );
}
