/**
 * HITLNode — human-in-the-loop review step (SPEC-005 TASK-C05).
 *
 * Sun-coloured (Suno brand) because aprovação humana é o ponto de
 * intersecção entre a esteira automatizada e o vocabulário Suno.
 * Handles: 1× target (`in`), 3× source (`approved` / `rejected` / `modified`).
 */
'use client';

import { UserFollow } from '@carbon/icons-react';
import type { NodeProps } from '@xyflow/react';
import { NodeShell, type HandleSpec } from './NodeShell';

interface HITLNodeData {
  type: 'hitl';
  name: string;
  config?: { review_instructions?: string };
  [key: string]: unknown;
}

const BORDER = 'var(--sun)';

export default function HITLNode({ data, selected }: NodeProps) {
  const d = data as HITLNodeData;
  const preview = d.config?.review_instructions ?? 'aprovação humana';
  const sources: HandleSpec[] = [
    { id: 'approved', color: '#22C55E', label: 'aprovado' },
    { id: 'rejected', color: '#EF4444', label: 'rejeitado' },
    { id: 'modified', color: '#F59E0B', label: 'modificado' },
  ];
  return (
    <NodeShell
      title={d.name}
      preview={preview}
      Icon={UserFollow}
      borderColor={BORDER}
      accentColor="rgba(255,200,1,0.15)"
      sourceHandles={sources}
      selected={selected}
    />
  );
}
