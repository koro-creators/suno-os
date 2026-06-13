/**
 * ToolNode — tool step (SPEC-005 TASK-C02).
 *
 * Visual: blue accent (#3B82F6). Handles: 1× target (`in`, left), 1× source
 * (`out`, right, green); the optional `error` source handle is rendered only
 * when an edge ligada nele exists — discovery via `data._hasErrorEdge` flag
 * stamped by WorkflowCanvas when computing nodeTypes input.
 */
'use client';

import { Tools } from '@carbon/icons-react';
import type { NodeProps } from '@xyflow/react';
import { NodeShell, type ExecutionStatus, type HandleSpec } from './NodeShell';

interface ToolNodeData {
  type: 'tool';
  name: string;
  tool_name?: string;
  config?: Record<string, unknown>;
  _hasErrorEdge?: boolean;
  _executionStatus?: ExecutionStatus;
  [key: string]: unknown;
}

const BORDER = '#3B82F6';

export default function ToolNode({ data, selected }: NodeProps) {
  const d = data as ToolNodeData;
  const sources: HandleSpec[] = [
    { id: 'out', color: '#22C55E', label: 'sucesso' },
  ];
  if (d._hasErrorEdge) {
    sources.push({ id: 'error', color: '#EF4444', label: 'erro' });
  }
  return (
    <NodeShell
      title={d.name}
      preview={d.tool_name ?? 'sem tool selecionada'}
      Icon={Tools}
      borderColor={BORDER}
      accentColor="rgba(59,130,246,0.15)"
      sourceHandles={sources}
      selected={selected}
      executionStatus={d._executionStatus}
    />
  );
}
