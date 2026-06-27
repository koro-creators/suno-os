/**
 * ActionNode — side-effecting action step (SPEC-005 TASK-C05). Green swatch.
 * typeLabel reflects the action channel (Slack / Email / WhatsApp / Telegram).
 */
'use client';

import { CloudUpload, Download, Flash } from '@carbon/icons-react';
import type { CarbonIconType } from '@carbon/icons-react';
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

const ACTION_META: Record<string, { label: string; Icon: CarbonIconType; border: string }> = {
  salvar_pdf: { label: 'Salvar PDF no Drive', Icon: CloudUpload, border: '#3B82F6' },
  baixar_pdf: { label: 'Baixar PDF',          Icon: Download,    border: '#8B5CF6' },
  slack:      { label: 'Slack',               Icon: Flash,       border: '#22C55E' },
  email:      { label: 'Email',               Icon: Flash,       border: '#22C55E' },
  whatsapp:   { label: 'WhatsApp',            Icon: Flash,       border: '#22C55E' },
  telegram:   { label: 'Telegram',            Icon: Flash,       border: '#22C55E' },
};

const DEFAULT_META = { label: 'Ação', Icon: Flash, border: '#22C55E' };

export default function ActionNode({ data, selected }: NodeProps) {
  const d = data as ActionNodeData;
  const { label: typeLabel, Icon, border: BORDER } = ACTION_META[d.action_type as string] ?? DEFAULT_META;
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
      Icon={Icon}
      borderColor={BORDER}
      sourceHandles={sources}
      selected={selected}
      executionStatus={d._executionStatus}
      shape="square"
    />
  );
}
