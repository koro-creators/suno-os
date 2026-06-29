/**
 * TriggerNode — step de entrada (SPEC-005). Anel azul-claro.
 * Sem target handles — é sempre o ponto de partida do workflow.
 * Sub-tipos: 'evento' (disparo por evento externo).
 */
'use client';

import { EventSchedule } from '@carbon/icons-react';
import { Position, type NodeProps } from '@xyflow/react';
import { NodeShell, type ExecutionStatus } from './NodeShell';

interface TriggerNodeData {
  type: 'trigger';
  name: string;
  trigger_type?: 'nova_reuniao';
  config?: Record<string, unknown>;
  _executionStatus?: ExecutionStatus;
  [key: string]: unknown;
}

const BORDER = '#0EA5E9';

export default function TriggerNode({ data, selected }: NodeProps) {
  const d = data as TriggerNodeData;
  const resolvedType = d.trigger_type ?? d.config?.['trigger_type'];
  return (
    <NodeShell
      title={d.name}
      typeLabel={resolvedType === 'nova_reuniao' ? 'Nova reunião' : 'Trigger'}
      Icon={EventSchedule}
      borderColor={BORDER}
      sourceHandles={[{ id: 'out', color: '#22C55E', label: 'iniciar', position: Position.Right }]}
      targetHandles={[]}
      selected={selected}
      executionStatus={d._executionStatus}
      shape="circle"
    />
  );
}
