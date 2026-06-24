/**
 * HITLNode — human-in-the-loop review step (SPEC-005 TASK-C05). Sun/yellow swatch.
 * Handles: 1× target (`in`), 3× source (`approved` / `rejected` / `modified`).
 */
'use client';

import { UserFollow } from '@carbon/icons-react';
import type { NodeProps } from '@xyflow/react';
import { NodeShell, type ExecutionStatus, type HandleSpec } from './NodeShell';

interface HITLNodeData {
  type: 'hitl';
  name: string;
  config?: { review_instructions?: string };
  _executionStatus?: ExecutionStatus;
  [key: string]: unknown;
}

const BORDER = '#FFC801';

export default function HITLNode({ data, selected }: NodeProps) {
  const d = data as HITLNodeData;
  const sources: HandleSpec[] = [
    { id: 'approved', color: '#22C55E', label: 'aprovado' },
    { id: 'rejected', color: '#EF4444', label: 'rejeitado' },
    { id: 'modified', color: '#F59E0B', label: 'modificado' },
  ];
  return (
    <NodeShell
      title={d.name}
      typeLabel="Aprovação Humana"
      Icon={UserFollow}
      borderColor={BORDER}
      sourceHandles={sources}
      selected={selected}
      executionStatus={d._executionStatus}
      shape="square"
    >
      {/* Output lane labels — align visually with the 3 source handles */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '2px 7px 8px',
          borderTop: '1px solid rgba(255,200,1,0.10)',
        }}
      >
        <span style={{ fontSize: 7.5, color: '#22C55E', fontWeight: 500 }}>✓ sim</span>
        <span style={{ fontSize: 7.5, color: '#EF4444', fontWeight: 500 }}>✗ não</span>
        <span style={{ fontSize: 7.5, color: '#F59E0B', fontWeight: 500 }}>~ mod</span>
      </div>
    </NodeShell>
  );
}
