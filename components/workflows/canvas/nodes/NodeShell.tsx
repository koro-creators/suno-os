/**
 * NodeShell — visual scaffold reused by the 7 canvas node types (TASK-C02..C06).
 *
 * Three visual shapes:
 *   rect   — LLM/Agente: wide rectangular card (220px). Default.
 *   square — Condition/Action/HITL/SubWorkflow/Merge: compact 88×88 square.
 *   circle — Tool: 64px circle, icon-only, label below.
 *
 * All shapes share handle rendering logic and execution-status indicators.
 */
'use client';

import type { CarbonIconType } from '@carbon/icons-react';
import { Handle, Position } from '@xyflow/react';
import type { CSSProperties, ReactNode } from 'react';

export interface HandleSpec {
  id: string;
  label?: string;
  color: string;
  position?: Position;
}

export type ExecutionStatus = 'running' | 'completed' | 'failed';
export type NodeShape = 'rect' | 'square' | 'circle' | 'diamond';

export interface NodeShellProps {
  title: string;
  typeLabel?: string;
  preview?: string;
  Icon: CarbonIconType;
  borderColor: string;
  sourceHandles: HandleSpec[];
  targetHandles?: HandleSpec[];
  selected?: boolean;
  executionStatus?: ExecutionStatus;
  children?: ReactNode;
  shape?: NodeShape;
}

const EXECUTION_COLOR: Record<ExecutionStatus, string> = {
  running: '#3B82F6',
  completed: '#22C55E',
  failed: '#EF4444',
};

const CARD_BASE: CSSProperties = {
  borderRadius: 12,
  background: 'var(--deep)',
  color: 'var(--text-primary)',
  fontSize: 12,
  display: 'flex',
  flexDirection: 'column',
  cursor: 'pointer',
  overflow: 'hidden',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
};

export function NodeShell({
  title,
  typeLabel,
  preview,
  Icon,
  borderColor,
  sourceHandles,
  targetHandles,
  selected,
  executionStatus,
  children,
  shape = 'rect',
}: NodeShellProps) {
  const tgts: HandleSpec[] = targetHandles ?? [
    { id: 'in', color: 'var(--text-muted)', position: Position.Left, label: 'in' },
  ];
  const statusColor = executionStatus ? EXECUTION_COLOR[executionStatus] : undefined;
  const borderVal = statusColor ?? (selected ? 'var(--sun)' : 'var(--border-subtle)');
  const shadowVal = statusColor
    ? `0 0 0 2px ${statusColor}33`
    : selected
      ? '0 0 0 2px rgba(255,200,1,0.15)'
      : '0 2px 8px rgba(0,0,0,0.18)';
  const ariaLabel = executionStatus
    ? `Workflow node ${title} — execução ${executionStatus}`
    : `Workflow node ${title}`;

  // ── Circle shape (Tool nodes) ────────────────────────────────────────────
  if (shape === 'circle') {
    return (
      <div
        role="group"
        aria-label={ariaLabel}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}
      >
        {/* Circle with handles positioned inside it */}
        <div
          style={{
            position: 'relative',
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: borderColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2.5px solid ${statusColor ?? (selected ? 'var(--sun)' : borderColor)}`,
            boxShadow: statusColor
              ? `0 0 0 3px ${statusColor}33`
              : selected
                ? '0 0 0 3px rgba(255,200,1,0.22)'
                : '0 2px 10px rgba(0,0,0,0.22)',
            cursor: 'pointer',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
            animation: executionStatus === 'running' ? 'sunos-node-pulse 1.4s ease-in-out infinite' : undefined,
          }}
        >
          <Icon size={22} color="white" />
          {tgts.map((tgt, idx) => (
            <Handle
              key={`tgt-${tgt.id}`}
              id={tgt.id}
              type="target"
              position={tgt.position ?? Position.Left}
              style={{
                background: tgt.color,
                width: 12,
                height: 12,
                top: tgts.length === 1 ? '50%' : `${(100 / (tgts.length + 1)) * (idx + 1)}%`,
              }}
              aria-label={`Entrada ${tgt.label ?? tgt.id}`}
            />
          ))}
          {sourceHandles.map((src, idx, arr) => {
            const pos = src.position ?? Position.Right;
            const isTopBottom = pos === Position.Top || pos === Position.Bottom;
            const pct = arr.length === 1 ? '50%' : `${(100 / (arr.length + 1)) * (idx + 1)}%`;
            return (
              <Handle
                key={`src-${src.id}`}
                id={src.id}
                type="source"
                position={pos}
                style={{
                  background: src.color,
                  width: 12,
                  height: 12,
                  ...(isTopBottom ? { left: pct } : { top: pct }),
                }}
                aria-label={`Saída ${src.label ?? src.id}`}
              />
            );
          })}
        </div>

        {/* Label below circle */}
        <div
          style={{
            marginTop: 5,
            fontSize: 10,
            fontWeight: 500,
            color: 'var(--text-primary)',
            textAlign: 'center',
            maxWidth: 80,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        {typeLabel && (
          <div
            style={{
              fontSize: 9,
              color: 'var(--text-muted)',
              textAlign: 'center',
              maxWidth: 80,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {typeLabel}
          </div>
        )}
      </div>
    );
  }

  // ── Diamond shape (Condition — classic flowchart decision symbol) ────────
  if (shape === 'diamond') {
    const rightSrcs = sourceHandles.filter((s) => (s.position ?? Position.Right) !== Position.Bottom);
    return (
      <div
        role="group"
        aria-label={ariaLabel}
        style={{
          width: 112,
          height: 112,
          position: 'relative',
          cursor: 'pointer',
          filter: statusColor
            ? `drop-shadow(0 0 7px ${statusColor}99)`
            : selected
              ? 'drop-shadow(0 0 7px rgba(255,200,1,0.6))'
              : undefined,
          transition: 'filter 150ms ease',
          animation: executionStatus === 'running' ? 'sunos-diamond-pulse 1.4s ease-in-out infinite' : undefined,
        }}
      >
        {/* Target handles */}
        {tgts.map((tgt, idx) => (
          <Handle
            key={`tgt-${tgt.id}`}
            id={tgt.id}
            type="target"
            position={tgt.position ?? Position.Left}
            style={{
              background: tgt.color,
              width: 12,
              height: 12,
              zIndex: 2,
              top: tgts.length === 1 ? '50%' : `${(100 / (tgts.length + 1)) * (idx + 1)}%`,
            }}
            aria-label={`Entrada ${tgt.label ?? tgt.id}`}
          />
        ))}

        {/* Diamond body (clip-path = rhombus) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: 'polygon(50% 2%, 98% 50%, 50% 98%, 2% 50%)',
            background: statusColor ?? borderColor,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
          }}
        >
          <Icon size={18} color="white" />
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: 'white',
              textAlign: 'center',
              maxWidth: 62,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </div>
          {typeLabel && (
            <div
              style={{
                fontSize: 7.5,
                color: 'rgba(255,255,255,0.75)',
                textAlign: 'center',
                maxWidth: 54,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {typeLabel}
            </div>
          )}
        </div>

        {/* Execution-status dot — rendered outside the clip-path so it stays visible */}
        {statusColor && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: statusColor,
              zIndex: 3,
            }}
          />
        )}

        {/* Source handles */}
        {rightSrcs.map((src, idx, arr) => (
          <Handle
            key={`src-${src.id}`}
            id={src.id}
            type="source"
            position={src.position ?? Position.Right}
            style={{
              background: src.color,
              width: 12,
              height: 12,
              zIndex: 2,
              top: arr.length === 1 ? '50%' : `${(100 / (arr.length + 1)) * (idx + 1)}%`,
            }}
            aria-label={`Saída ${src.label ?? src.id}`}
          />
        ))}
      </div>
    );
  }

  // ── Square shape (Action / HITL / SubWorkflow / Merge) ────────────────────
  if (shape === 'square') {
    const rightSrcs = sourceHandles.filter((s) => (s.position ?? Position.Right) !== Position.Bottom);
    const bottomSrcs = sourceHandles.filter((s) => s.position === Position.Bottom);
    return (
      // Outer wrapper has NO position set — handles escape to the ReactFlow node
      // wrapper as their containing block (same pattern as rect shape), so they
      // aren't clipped by any child overflow:hidden. Inner card gets its own
      // overflow:hidden only for the border-radius corner clipping of the swatch.
      <div
        role="group"
        aria-label={ariaLabel}
        style={{
          width: 88,
          minHeight: 88,
          cursor: 'pointer',
        }}
      >
        {/* Target handles — zIndex ensures they paint above the inner card */}
        {tgts.map((tgt, idx) => (
          <Handle
            key={`tgt-${tgt.id}`}
            id={tgt.id}
            type="target"
            position={tgt.position ?? Position.Left}
            style={{
              background: tgt.color,
              width: 12,
              height: 12,
              zIndex: 1,
              top: tgts.length === 1 ? '50%' : `${(100 / (tgts.length + 1)) * (idx + 1)}%`,
            }}
            aria-label={`Entrada ${tgt.label ?? tgt.id}`}
          />
        ))}

        {/* Inner card: overflow hidden so the colored swatch clips to border-radius */}
        <div
          style={{
            width: '100%',
            minHeight: 88,
            borderRadius: 12,
            background: 'var(--deep)',
            border: `1px solid ${borderVal}`,
            boxShadow: shadowVal,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
            animation: executionStatus === 'running' ? 'sunos-node-pulse 1.4s ease-in-out infinite' : undefined,
          }}
        >
          {/* Colored icon swatch — top half */}
          <div
            style={{
              height: 46,
              background: borderColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            <Icon size={20} color="white" />
            {statusColor && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: statusColor,
                }}
              />
            )}
          </div>

          {/* Label area — bottom */}
          <div style={{ padding: '5px 8px', textAlign: 'center', flex: 1 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 10,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </div>
            {typeLabel && (
              <div
                style={{
                  fontSize: 9,
                  color: 'var(--text-muted)',
                  marginTop: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {typeLabel}
              </div>
            )}
          </div>

          {children}
        </div>

        {/* Source handles — right side */}
        {rightSrcs.map((src, idx, arr) => (
          <Handle
            key={`src-${src.id}`}
            id={src.id}
            type="source"
            position={src.position ?? Position.Right}
            style={{
              background: src.color,
              width: 12,
              height: 12,
              zIndex: 1,
              top: arr.length === 1 ? '50%' : `${(100 / (arr.length + 1)) * (idx + 1)}%`,
            }}
            aria-label={`Saída ${src.label ?? src.id}`}
          />
        ))}

        {/* Source handles — bottom */}
        {bottomSrcs.map((src, idx, arr) => (
          <Handle
            key={`src-${src.id}`}
            id={src.id}
            type="source"
            position={Position.Bottom}
            style={{
              background: src.color,
              width: 10,
              height: 10,
              zIndex: 1,
              left: `${(100 / (arr.length + 1)) * (idx + 1)}%`,
              bottom: 0,
            }}
            aria-label={`Saída ${src.label ?? src.id}`}
          />
        ))}
      </div>
    );
  }

  // ── Rect shape (default — LLM/Agente) ────────────────────────────────────
  const leftTgts = tgts.filter((t) => (t.position ?? Position.Left) !== Position.Bottom);
  const bottomTgts = tgts.filter((t) => t.position === Position.Bottom);
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      style={{
        ...CARD_BASE,
        width: 220,
        minHeight: 80,
        border: `1px solid ${borderVal}`,
        boxShadow: shadowVal,
        animation: executionStatus === 'running' ? 'sunos-node-pulse 1.4s ease-in-out infinite' : undefined,
      }}
    >
      {/* Target handles — left side */}
      {leftTgts.map((tgt, idx) => (
        <Handle
          key={`tgt-${tgt.id}`}
          id={tgt.id}
          type="target"
          position={tgt.position ?? Position.Left}
          style={{
            background: tgt.color,
            width: 14,
            height: 14,
            top: leftTgts.length === 1 ? '50%' : `${30 + idx * 25}%`,
          }}
          aria-label={`Entrada ${tgt.label ?? tgt.id}`}
        />
      ))}

      {/* Target handles — bottom (tool input slots on LLM node) */}
      {bottomTgts.map((tgt, idx, arr) => (
        <Handle
          key={`tgt-${tgt.id}`}
          id={tgt.id}
          type="target"
          position={Position.Bottom}
          style={{
            background: tgt.color,
            width: 12,
            height: 12,
            left: `${(100 / (arr.length + 1)) * (idx + 1)}%`,
            bottom: 0,
          }}
          aria-label={`Entrada ${tgt.label ?? tgt.id}`}
        />
      ))}

      {/* Header: colored swatch + title/typeLabel */}
      <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid var(--border-subtle)' }}>
        <div
          aria-hidden="true"
          style={{
            width: 44,
            flexShrink: 0,
            background: borderColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} color="white" />
        </div>
        <div style={{ padding: '7px 10px', flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 12,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
          {typeLabel && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
              {typeLabel}
            </div>
          )}
        </div>
        {statusColor && (
          <span
            aria-hidden="true"
            style={{
              alignSelf: 'center',
              marginRight: 10,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: statusColor,
              flexShrink: 0,
            }}
          />
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div
          style={{
            padding: '7px 12px',
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

      {/* Source handles — right side */}
      {sourceHandles
        .filter((s) => (s.position ?? Position.Right) !== Position.Bottom)
        .map((src, idx, arr) => (
          <Handle
            key={`src-${src.id}`}
            id={src.id}
            type="source"
            position={src.position ?? Position.Right}
            style={{
              background: src.color,
              width: 14,
              height: 14,
              top: arr.length === 1 ? '50%' : `${30 + idx * 25}%`,
            }}
            aria-label={`Saída ${src.label ?? src.id}`}
          />
        ))}

      {/* Source handles — bottom (tool slots on LLM node) */}
      {sourceHandles
        .filter((s) => s.position === Position.Bottom)
        .map((src, idx, arr) => (
          <Handle
            key={`src-${src.id}`}
            id={src.id}
            type="source"
            position={Position.Bottom}
            style={{
              background: src.color,
              width: 12,
              height: 12,
              left: `${(100 / (arr.length + 1)) * (idx + 1)}%`,
              bottom: 0,
            }}
            aria-label={`Saída ${src.label ?? src.id}`}
          />
        ))}
    </div>
  );
}
