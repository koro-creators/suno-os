/**
 * ActionNode — side-effecting action step (SPEC-005 TASK-C05). Green swatch.
 * typeLabel reflects the action channel (Slack / Email / WhatsApp / Telegram).
 */
'use client';

import { Flash } from '@carbon/icons-react';
import type { NodeProps } from '@xyflow/react';
import { NodeShell, type ExecutionStatus, type HandleSpec } from './NodeShell';

interface ActionNodeData {
  type: 'action';
  name: string;
  action_type?: string;
  _hasErrorEdge?: boolean;
  _executionStatus?: ExecutionStatus;
  [key: string]: unknown;
}

const BORDER = '#22C55E';

const ACTION_LABEL: Record<string, string> = {
  slack:    'Slack',
  email:    'Email',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
};

export default function ActionNode({ data, selected }: NodeProps) {
  const d = data as ActionNodeData;
  const typeLabel = ACTION_LABEL[d.action_type as string] ?? 'Ação';
  const sources: HandleSpec[] = [
    { id: 'out', color: '#22C55E', label: 'sucesso' },
  ];
  if (d._hasErrorEdge) {
    sources.push({ id: 'error', color: '#EF4444', label: 'erro' });
  }
  return (
    <NodeShell
      title={d.name}
      typeLabel={typeLabel}
      Icon={Flash}
      borderColor={BORDER}
      sourceHandles={sources}
      selected={selected}
      executionStatus={d._executionStatus}
      shape="square"
    />
  );
}
