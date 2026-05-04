/**
 * SubWorkflowNode — chamada a outro workflow (SPEC-005 TASK-C05). Pink accent.
 */
'use client';

import { Workflow } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import { NodeShell, type HandleSpec } from './NodeShell';

interface SubWorkflowNodeData {
  type: 'workflow';
  name: string;
  workflow_id?: string;
  _hasErrorEdge?: boolean;
  [key: string]: unknown;
}

const BORDER = '#EC4899';

export default function SubWorkflowNode({ data, selected }: NodeProps) {
  const d = data as SubWorkflowNodeData;
  const preview = d.workflow_id ? `→ ${d.workflow_id.slice(0, 18)}…` : 'sub-workflow não selecionado';
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
      Icon={Workflow}
      borderColor={BORDER}
      accentColor="rgba(236,72,153,0.15)"
      sourceHandles={sources}
      selected={selected}
    />
  );
}
