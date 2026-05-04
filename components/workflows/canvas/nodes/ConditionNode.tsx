/**
 * ConditionNode — branching diamond (SPEC-005 TASK-C04). Yellow accent.
 * Handles: 1× target (`in`), 2× source (`then` green, `else` grey).
 */
'use client';

import { GitBranch } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import { NodeShell, type HandleSpec } from './NodeShell';

interface ConditionNodeData {
  type: 'condition';
  name: string;
  condition?: { field?: string; operator?: string; value?: unknown };
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
  return (
    <NodeShell
      title={d.name}
      preview={preview}
      Icon={GitBranch}
      borderColor={BORDER}
      accentColor="rgba(245,158,11,0.15)"
      sourceHandles={sources}
      selected={selected}
    />
  );
}
