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

import { BaseEdge, getBezierPath, Position, type EdgeProps } from '@xyflow/react';

const HANDLE_COLOR: Record<string, string> = {
  out: '#22C55E',
  approved: '#22C55E',
  then: '#22C55E',
  error: '#EF4444',
  rejected: '#EF4444',
  else: 'var(--text-muted)',
  modified: '#F59E0B',
};

const STUB = 20; // straight run out of source/target before the path turns
const CLEARANCE = 90; // vertical drop below the row when looping back
const RADIUS = 8;

/** Orthogonal path through `points`, with rounded corners at interior points. */
function roundedOrthogonalPath(points: { x: number; y: number }[], r: number): string {
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const next = points[i + 1];
    const inDir = { x: Math.sign(cur.x - prev.x), y: Math.sign(cur.y - prev.y) };
    const outDir = { x: Math.sign(next.x - cur.x), y: Math.sign(next.y - cur.y) };
    const before = { x: cur.x - inDir.x * r, y: cur.y - inDir.y * r };
    const after = { x: cur.x + outDir.x * r, y: cur.y + outDir.y * r };
    d += ` L ${before.x},${before.y} Q ${cur.x},${cur.y} ${after.x},${after.y}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x},${last.y}`;
  return d;
}

export default function CustomEdge(props: EdgeProps) {
  const {
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    sourceHandleId, markerEnd,
  } = props;

  let path: string;

  // Loop-back case: the target sits behind the source (to the left, given
  // source exits right / target enters left). A direct bezier here would
  // cut a diagonal straight across whatever node sits between them. Instead,
  // drop below the whole row and come back — never crosses a node body.
  const isLoopBack =
    sourcePosition === Position.Right &&
    targetPosition === Position.Left &&
    targetX < sourceX + 2 * STUB;

  if (isLoopBack) {
    const detourY = Math.max(sourceY, targetY) + CLEARANCE;
    path = roundedOrthogonalPath(
      [
        { x: sourceX, y: sourceY },
        { x: sourceX + STUB, y: sourceY },
        { x: sourceX + STUB, y: detourY },
        { x: targetX - STUB, y: detourY },
        { x: targetX - STUB, y: targetY },
        { x: targetX, y: targetY },
      ],
      RADIUS,
    );
  } else {
    [path] = getBezierPath({
      sourceX, sourceY, targetX, targetY,
      sourcePosition, targetPosition,
    });
  }

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
