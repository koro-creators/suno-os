/**
 * LLMNode — LLM step (SPEC-005 TASK-C03). Purple accent. Same handles as ToolNode.
 */
'use client';

import { Star } from '@carbon/icons-react';
import type { NodeProps } from '@xyflow/react';
import { NodeShell, type HandleSpec } from './NodeShell';

interface LLMNodeData {
  type: 'llm';
  name: string;
  prompt?: string;
  _hasErrorEdge?: boolean;
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
  return (
    <NodeShell
      title={d.name}
      preview={preview}
      Icon={Star}
      borderColor={BORDER}
      accentColor="rgba(139,92,246,0.15)"
      sourceHandles={sources}
      selected={selected}
    />
  );
}
