/**
 * MergeNode — fan-in node (SPEC-005 TASK-C06). Slate swatch.
 * typeLabel shows the active merge policy (all / any).
 */
'use client';

import { Merge } from '@carbon/icons-react';
import type { NodeProps } from '@xyflow/react';
import { NodeShell, type ExecutionStatus, type HandleSpec } from './NodeShell';

interface MergeNodeData {
  type: 'merge';
  name: string;
  merge_policy?: 'all' | 'any';
  _executionStatus?: ExecutionStatus;
  [key: string]: unknown;
}

const BORDER = '#64748B';

export default function MergeNode({ data, selected }: NodeProps) {
  const d = data as MergeNodeData;
  const policy = d.merge_policy ?? 'all';
  const sources: HandleSpec[] = [
    { id: 'out', color: '#22C55E', label: 'merged' },
  ];
  return (
    <NodeShell
      title={d.name}
      typeLabel={policy === 'all' ? 'Aguardar todos' : 'Primeiro vence'}
      Icon={Merge}
      borderColor={BORDER}
      sourceHandles={sources}
      selected={selected}
      executionStatus={d._executionStatus}
      shape="square"
    />
  );
}
