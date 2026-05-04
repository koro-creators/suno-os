/**
 * CustomEdge — handle-aware edge colour (SPEC-005 TASK-C07).
 *
 * The colour palette is the same one used in node handles, so the user can
 * read the graph without legend lookups:
 *
 *   out / approved / then  → green (#22C55E)
 *   error / rejected       → red   (#EF4444)
 *   else                   → grey  (var(--text-muted))
 *   modified               → amber (#F59E0B)
 *
 * The edge type is registered as `'custom'` in WorkflowCanvas; ReactFlow
 * picks it for any edge whose `type` field equals that. We default the
 * source handle colour from `sourceHandleId` because in v2 every edge
 * carries which handle it left from.
 */
'use client';

import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

const HANDLE_COLOR: Record<string, string> = {
  out: '#22C55E',
  approved: '#22C55E',
  then: '#22C55E',
  error: '#EF4444',
  rejected: '#EF4444',
  else: 'var(--text-muted)',
  modified: '#F59E0B',
};

export default function CustomEdge(props: EdgeProps) {
  const {
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    sourceHandleId, markerEnd,
  } = props;

  const [path] = getBezierPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
  });

  const stroke = HANDLE_COLOR[sourceHandleId ?? 'out'] ?? '#22C55E';

  return (
    <BaseEdge
      id={props.id}
      path={path}
      markerEnd={markerEnd}
      style={{ stroke, strokeWidth: 1.5 }}
    />
  );
}
