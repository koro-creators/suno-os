'use client';

import { Image } from '@carbon/icons-react';
import { type NodeProps } from '@xyflow/react';
import { NodeShell, type ExecutionStatus } from './NodeShell';

interface ArquivosNodeData {
  type: 'arquivos';
  name: string;
  drive_file_id?: string;
  drive_file_name?: string;
  _executionStatus?: ExecutionStatus;
  [key: string]: unknown;
}

const BORDER = '#34A853';

export default function ArquivosNode({ data, selected }: NodeProps) {
  const d = data as ArquivosNodeData;
  const preview = d.drive_file_name || d.drive_file_id || undefined;
  return (
    <NodeShell
      title={d.name}
      typeLabel="Google Drive"
      preview={preview}
      Icon={Image}
      borderColor={BORDER}
      sourceHandles={[
        { id: 'out', color: '#22C55E', label: 'imagem' },
      ]}
      selected={selected}
      executionStatus={d._executionStatus}
      shape="square"
    />
  );
}
