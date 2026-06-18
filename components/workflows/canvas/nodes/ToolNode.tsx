/**
 * ToolNode — tool step (SPEC-005 TASK-C02). Blue swatch.
 * Single connection point: `out` source (right). Connects to an LLM node's
 * bottom tool_0/1/2 target handles — Tool feeds data INTO the agent, not the
 * other way around. No target handles (tools are pure data sources).
 */
'use client';

import { Tools } from '@carbon/icons-react';
import { Position, type NodeProps } from '@xyflow/react';
import { NodeShell, type ExecutionStatus } from './NodeShell';

interface ToolNodeData {
  type: 'tool';
  name: string;
  tool_name?: string;
  _executionStatus?: ExecutionStatus;
  [key: string]: unknown;
}

const BORDER = '#3B82F6';

export default function ToolNode({ data, selected }: NodeProps) {
  const d = data as ToolNodeData;
  return (
    <NodeShell
      title={d.name}
      typeLabel={d.tool_name ?? 'Ferramenta'}
      Icon={Tools}
      borderColor={BORDER}
      sourceHandles={[{ id: 'out', color: '#22C55E', label: 'para agente', position: Position.Top }]}
      targetHandles={[]}
      selected={selected}
      executionStatus={d._executionStatus}
      shape="circle"
    />
  );
}
