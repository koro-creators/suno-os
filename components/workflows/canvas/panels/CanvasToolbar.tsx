/**
 * CanvasToolbar — top toolbar of the canvas (SPEC-005 TASK-C10).
 *
 * Buttons:
 *   • Voltar / Avançar     — undo/redo over the history stack kept by the
 *                             parent canvas (drag, connect, delete, drop,
 *                             auto-layout, config edits).
 *   • Zoom in / out / fit  — driven by ReactFlow's `useReactFlow` instance.
 *   • Reorganizar          — calls the auto-layout hook from useAutoLayout.
 *   • Validar              — runs `validateWorkflow` (server) and surfaces
 *                             a modal-less inline summary.
 *   • Executar             — disabled until validate passes; opens a
 *                             confirm dialog before POST /run.
 *
 * The toolbar deliberately doesn't carry its own state for validation
 * results — those flow through the parent canvas so the banner can show
 * them too. This component is purely controls + visual feedback.
 */
'use client';

import { Maximize, Play, Redo, Renew, SecurityServices, TrashCan, Undo, ZoomIn, ZoomOut } from '@carbon/icons-react';
import { useReactFlow } from '@xyflow/react';
import type { CSSProperties } from 'react';

interface ToolbarProps {
  onAutoLayout: () => void;
  onValidate: () => void;
  onExecute: () => void;
  validating?: boolean;
  validationOk?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onDeleteSelected: () => void;
  canDelete?: boolean;
}

const BTN: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  fontSize: 12,
  borderRadius: 8,
  border: '1px solid var(--border-subtle)',
  background: 'var(--deep)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  transition: 'border-color 150ms ease',
};

export default function CanvasToolbar({
  onAutoLayout,
  onValidate,
  onExecute,
  validating,
  validationOk,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onDeleteSelected,
  canDelete,
}: ToolbarProps) {
  const flow = useReactFlow();
  return (
    <div
      role="toolbar"
      aria-label="Controles do canvas"
      style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 6,
        padding: 6,
        background: 'var(--void)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        zIndex: 10,
      }}
    >
      <button
        style={{ ...BTN, opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'not-allowed' }}
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Voltar"
      >
        <Undo size={14} /> Voltar
      </button>
      <button
        style={{ ...BTN, opacity: canRedo ? 1 : 0.4, cursor: canRedo ? 'pointer' : 'not-allowed' }}
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Avançar"
      >
        <Redo size={14} /> Avançar
      </button>
      <button
        style={{ ...BTN, opacity: canDelete ? 1 : 0.4, cursor: canDelete ? 'pointer' : 'not-allowed' }}
        onClick={onDeleteSelected}
        disabled={!canDelete}
        aria-label="Apagar node selecionado"
      >
        <TrashCan size={14} /> Apagar
      </button>
      <button style={BTN} onClick={() => flow.zoomIn()} aria-label="Aproximar">
        <ZoomIn size={14} />
      </button>
      <button style={BTN} onClick={() => flow.zoomOut()} aria-label="Afastar">
        <ZoomOut size={14} />
      </button>
      <button style={BTN} onClick={() => flow.fitView({ padding: 0.2 })} aria-label="Ajustar à tela">
        <Maximize size={14} />
      </button>
      <button style={BTN} onClick={onAutoLayout}>
        <Renew size={14} /> Reorganizar
      </button>
      <button style={BTN} onClick={onValidate} disabled={validating}>
        <SecurityServices size={14} /> {validating ? 'Validando…' : 'Validar'}
      </button>
      <button
        style={{
          ...BTN,
          background: validationOk ? '#22C55E' : 'var(--deep)',
          color: validationOk ? '#fff' : 'var(--text-muted)',
          borderColor: validationOk ? '#22C55E' : 'var(--border-subtle)',
          cursor: validationOk ? 'pointer' : 'not-allowed',
          fontWeight: 500,
        }}
        onClick={() => {
          if (validationOk) onExecute();
        }}
        disabled={!validationOk}
      >
        <Play size={14} /> Executar
      </button>
    </div>
  );
}
