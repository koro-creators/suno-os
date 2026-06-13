/**
 * ConditionNode — branching diamond (SPEC-005 TASK-C04). Yellow accent.
 * Handles: 2× target (`in_a` = CAMPO, `in_b` = VALOR — both optional,
 * legacy `in` edges are treated as `in_a`), 2× source (`then` green,
 * `else` grey).
 */
'use client';

import { Branch } from '@carbon/icons-react';
import { Position, type NodeProps } from '@xyflow/react';
import { NodeShell, type ExecutionStatus, type HandleSpec } from './NodeShell';

interface ConditionNodeData {
  type: 'condition';
  name: string;
  condition?: { field?: string; operator?: string; value?: unknown };
  _executionStatus?: ExecutionStatus;
  [key: string]: unknown;
}

const BORDER = '#F59E0B';

export default function ConditionNode({ data, selected }: NodeProps) {
  const d = data as ConditionNodeData;
  const cond = d.condition;
  const preview = cond?.field
    ? `${cond.field} ${cond.operator ?? '=='} ${String(cond.value ?? '?')}`
    : 'sem regra';
  const sources: HandleSpec[] = [
    { id: 'then', color: '#22C55E', label: 'então' },
    { id: 'else', color: 'var(--text-muted)', label: 'senão' },
  ];
  const targets: HandleSpec[] = [
    { id: 'in_a', color: 'var(--text-muted)', label: 'campo', position: Position.Left },
    { id: 'in_b', color: 'var(--text-muted)', label: 'valor', position: Position.Left },
  ];
  return (
    <NodeShell
      title={d.name}
      preview={preview}
      Icon={Branch}
      borderColor={BORDER}
      accentColor="rgba(245,158,11,0.15)"
      sourceHandles={sources}
      targetHandles={targets}
      selected={selected}
      executionStatus={d._executionStatus}
    />
  );
}
