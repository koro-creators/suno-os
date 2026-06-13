/**
 * MergeNode — fan-in node (SPEC-005 TASK-C06).
 *
 * Hexagon-styled grey card. The single source handle (`out`) carries the
 * merged output forward. Multiple incoming edges are how the user expresses
 * fan-in; ReactFlow stacks targets when they share `in` handle id.
 *
 * `merge_policy` ∈ { 'all', 'any' } is set in the drawer (NodeConfigDrawer);
 * the value is shown as a badge below the title.
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

const BORDER = 'var(--text-muted)';

export default function MergeNode({ data, selected }: NodeProps) {
  const d = data as MergeNodeData;
  const policy = d.merge_policy ?? 'all';
  const sources: HandleSpec[] = [
    { id: 'out', color: '#22C55E', label: 'merged' },
  ];
  return (
    <NodeShell
      title={d.name}
      preview={`Aguardar ${policy === 'all' ? 'todas as entradas' : 'a primeira entrada (any)'}`}
      Icon={Merge}
      borderColor={BORDER}
      accentColor="rgba(255,255,255,0.06)"
      sourceHandles={sources}
      selected={selected}
      executionStatus={d._executionStatus}
    >
      <div
        style={{
          padding: '0 12px 8px',
          fontSize: 10,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        merge: {policy}
      </div>
    </NodeShell>
  );
}
