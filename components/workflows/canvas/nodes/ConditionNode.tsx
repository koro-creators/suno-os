/**
 * ConditionNode — branching step (SPEC-005 TASK-C04). Amber swatch.
 * Always Se/Senão (if_else): 2× target (in_a, in_b) + 2× source (then, else).
 */
'use client';

import { Branch } from '@carbon/icons-react';
import { Position, type NodeProps } from '@xyflow/react';
import { NodeShell, type ExecutionStatus, type HandleSpec } from './NodeShell';

interface ConditionNodeData {
  type: 'condition';
  name: string;
  _executionStatus?: ExecutionStatus;
  [key: string]: unknown;
}

const BORDER = '#F59E0B';

const sources: HandleSpec[] = [
  { id: 'then', color: '#22C55E', label: 'então' },
  { id: 'else', color: 'var(--text-muted)', label: 'senão' },
];

const targets: HandleSpec[] = [
  { id: 'in_a', color: 'var(--text-muted)', label: 'entrada A', position: Position.Left },
  { id: 'in_b', color: 'var(--text-muted)', label: 'entrada B', position: Position.Left },
];

export default function ConditionNode({ data, selected }: NodeProps) {
  const d = data as ConditionNodeData;

  return (
    <NodeShell
      title={d.name}
      typeLabel="Se / Senão"
      Icon={Branch}
      borderColor={BORDER}
      sourceHandles={sources}
      targetHandles={targets}
      selected={selected}
      executionStatus={d._executionStatus}
      shape="diamond"
    />
  );
}
