/**
 * NodeShell — visual scaffold reused by the 7 canvas node types (TASK-C02..C06).
 *
 * Each step type has its own colour and handle layout but shares the chrome:
 * rounded card, header with icon + title, a single-line preview, focus ring
 * matching `boxShadow: '0 0 0 2px rgba(255,200,1,0.15)'` (CLAUDE.md design system).
 *
 * Why one shell instead of seven full components: half a kilobyte of styling
 * was duplicated across 7 files in a draft pass; promoting to a shell cut
 * each node down to ~30 lines, made the colour/handle vocabulary the only
 * thing each node owns, and kept ARIA labels DRY.
 */
'use client';

import type { CarbonIconType } from '@carbon/icons-react';
import { Handle, Position } from '@xyflow/react';
import type { CSSProperties, ReactNode } from 'react';

export interface HandleSpec {
  id: string;
  /** Visible label shown next to the handle on hover. */
  label?: string;
  color: string; // CSS colour for the handle dot
  /** ReactFlow Position; default = right for source, left for target. */
  position?: Position;
}

/** Per-node execution state, stamped on `data._executionStatus` while a run is in flight. */
export type ExecutionStatus = 'running' | 'completed' | 'failed';

export interface NodeShellProps {
  title: string;
  preview?: string;
  Icon: CarbonIconType;
  borderColor: string;
  /** Background colour at 10% opacity over `--deep` for the card. */
  accentColor: string;
  sourceHandles: HandleSpec[];
  /** Target handles default to the canonical `in` on the left if omitted. */
  targetHandles?: HandleSpec[];
  selected?: boolean;
  /** Visual overlay showing the node's status during/after "Executar". */
  executionStatus?: ExecutionStatus;
  /** Optional extra slot below the preview (e.g. badge for confidence). */
  children?: ReactNode;
}

const EXECUTION_COLOR: Record<ExecutionStatus, string> = {
  running: '#3B82F6',
  completed: '#22C55E',
  failed: '#EF4444',
};

const CARD_BASE: CSSProperties = {
  width: 220,
  minHeight: 80,
  borderRadius: 12,
  background: 'var(--deep)',
  color: 'var(--text-primary)',
  boxShadow: '0 1px 0 var(--border-subtle)',
  fontSize: 12,
  display: 'flex',
  flexDirection: 'column',
  cursor: 'pointer',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
};

export function NodeShell({
  title,
  preview,
  Icon,
  borderColor,
  accentColor,
  sourceHandles,
  targetHandles,
  selected,
  executionStatus,
  children,
}: NodeShellProps) {
  const tgts: HandleSpec[] = targetHandles ?? [
    { id: 'in', color: 'var(--text-muted)', position: Position.Left, label: 'in' },
  ];
  const statusColor = executionStatus ? EXECUTION_COLOR[executionStatus] : undefined;
  return (
    <div
      role="group"
      aria-label={
        executionStatus
          ? `Workflow node ${title} — execução ${executionStatus}`
          : `Workflow node ${title}`
      }
      style={{
        ...CARD_BASE,
        border: `1px solid ${statusColor ?? (selected ? 'var(--sun)' : borderColor)}`,
        boxShadow: statusColor
          ? `0 0 0 2px ${statusColor}33`
          : selected
            ? '0 0 0 2px rgba(255,200,1,0.15)'
            : '0 1px 0 var(--border-subtle)',
        animation: executionStatus === 'running' ? 'sunos-node-pulse 1.4s ease-in-out infinite' : undefined,
      }}
    >
      {tgts.map((tgt, idx) => (
        <Handle
          key={`tgt-${tgt.id}`}
          id={tgt.id}
          type="target"
          position={tgt.position ?? Position.Left}
          style={{
            background: tgt.color,
            width: 10,
            height: 10,
            top: tgts.length === 1 ? '50%' : `${30 + idx * 25}%`,
          }}
          aria-label={`Entrada ${tgt.label ?? tgt.id}`}
        />
      ))}
      <div
        style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: `1px solid ${accentColor}`,
        }}
      >
        <Icon size={14} color={borderColor} />
        <span style={{ fontWeight: 500 }}>{title}</span>
        {statusColor && (
          <span
            aria-hidden="true"
            style={{
              marginLeft: 'auto',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: statusColor,
            }}
          />
        )}
      </div>
      {preview && (
        <div
          style={{
            padding: '8px 12px',
            color: 'var(--text-secondary)',
            fontSize: 11,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {preview}
        </div>
      )}
      {children}
      {sourceHandles.map((src, idx) => (
        <Handle
          key={`src-${src.id}`}
          id={src.id}
          type="source"
          position={src.position ?? Position.Right}
          style={{
            background: src.color,
            width: 10,
            height: 10,
            top: sourceHandles.length === 1 ? '50%' : `${30 + idx * 25}%`,
          }}
          aria-label={`Saída ${src.label ?? src.id}`}
        />
      ))}
    </div>
  );
}
