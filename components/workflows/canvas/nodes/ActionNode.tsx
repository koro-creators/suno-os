/**
 * ActionNode — side-effecting action step (SPEC-005 TASK-C05). Green accent.
 * Same handles as ToolNode (out + optional error).
 */
'use client';

import { Zap } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import { NodeShell, type HandleSpec } from './NodeShell';

interface ActionNodeData {
  type: 'action';
  name: string;
  tool_name?: string;
  _hasErrorEdge?: boolean;
  [key: string]: unknown;
}

const BORDER = '#22C55E';

export default function ActionNode({ data, selected }: NodeProps) {
  const d = data as ActionNodeData;
  const sources: HandleSpec[] = [
    { id: 'out', color: '#22C55E', label: 'sucesso' },
  ];
  if (d._hasErrorEdge) {
    sources.push({ id: 'error', color: '#EF4444', label: 'erro' });
  }
  return (
    <NodeShell
      title={d.name}
      preview={d.tool_name ?? 'sem action'}
      Icon={Zap}
      borderColor={BORDER}
      accentColor="rgba(34,197,94,0.15)"
      sourceHandles={sources}
      selected={selected}
    />
  );
}
