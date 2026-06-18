'use client';

/**
 * CanvasContextMenu — floating palette triggered by right-click on empty canvas.
 *
 * Expandable items open a SECOND COLUMN to the right instead of pushing items
 * downward, so the main list never requires scrolling. If the sub-column would
 * overflow the right viewport edge, the whole menu shifts left to fit.
 *
 * Clicking a non-expandable item or any sub-item fires onSelect and closes.
 */

import { useEffect, useRef, useState } from 'react';
import { ChevronRight } from '@carbon/icons-react';
import { useAgents } from '@/contexts/AgentsContext';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import { listAvailableTools, type ToolDescriptor } from '@/lib/api';
import {
  buildSubItems,
  STEP_CATALOG,
  type StepPayload,
} from '../shared/step-catalog';

// Re-exportado para compatibilidade com WorkflowCanvas.tsx (importa { type ContextMenuPayload }).
export type { StepPayload as ContextMenuPayload } from '../shared/step-catalog';

const MAIN_W = 232;
const SUB_W = 200;
const GAP = 4;

export interface CanvasContextMenuProps {
  screenPosition: { x: number; y: number };
  currentWorkflowId?: string;
  onSelect: (payload: StepPayload) => void;
  onClose: () => void;
}

export default function CanvasContextMenu({
  screenPosition,
  currentWorkflowId,
  onSelect,
  onClose,
}: CanvasContextMenuProps) {
  const { agents } = useAgents();
  const { workflows } = useWorkflows();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [tools, setTools] = useState<ToolDescriptor[]>([]);
  const [toolsLoading, setToolsLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    listAvailableTools()
      .then((list) => { if (!cancelled) { setTools(list); setToolsLoading(false); } })
      .catch(() => { if (!cancelled) setToolsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const id = window.setTimeout(() => window.addEventListener('mousedown', handler), 0);
    return () => { window.clearTimeout(id); window.removeEventListener('mousedown', handler); };
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const activeAgents = agents.filter((a) => a.status === 'active');
  const activeWorkflows = workflows.filter(
    (w) => w.status === 'active' && w.id !== currentWorkflowId,
  );

  const vw = typeof window !== 'undefined' ? window.innerWidth  : 1920;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;

  // Shift the whole menu left when the sub-column would overflow the right edge.
  const totalW = expandedKey ? MAIN_W + GAP + SUB_W : MAIN_W;
  const left = Math.min(screenPosition.x + 2, vw - totalW - 8);
  const top  = Math.min(screenPosition.y + 2, vh - 60);

  const expandedItem = expandedKey ? STEP_CATALOG.find((i) => i.key === expandedKey) : null;
  const subItems     = expandedKey ? buildSubItems(expandedKey, tools, activeAgents, activeWorkflows) : null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Adicionar step"
      onMouseLeave={() => setExpandedKey(null)}
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 9999,
        display: 'flex',
        gap: GAP,
        transition: 'left 120ms ease',
      }}
    >
      {/* Column 1 — main list */}
      <div
        style={{
          width: MAIN_W,
          background: 'var(--void)',
          border: '1px solid var(--twilight)',
          borderRadius: 10,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.25)',
          padding: '8px 8px 6px',
        }}
      >
        <p
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            color: 'var(--text-muted)',
            margin: '0 0 8px 2px',
          }}
        >
          Tipos de step
        </p>

        {STEP_CATALOG.map((item) => {
          const active = expandedKey === item.key;
          return (
            <button
              key={item.key}
              role="menuitem"
              aria-expanded={item.expandable ? active : undefined}
              onMouseEnter={() => {
                if (item.expandable) setExpandedKey(item.key);
              }}
              onClick={() => {
                if (!item.expandable) {
                  onSelect(item.payload);
                  onClose();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                width: '100%',
                padding: '7px 8px',
                borderRadius: 7,
                border: `1px solid ${active ? '#F59E0B' : 'var(--border-subtle)'}`,
                background: active ? 'rgba(245,158,11,0.06)' : 'var(--deep)',
                marginBottom: 4,
                cursor: 'pointer',
                textAlign: 'left',
                color: 'inherit',
                transition: 'border-color 150ms ease, background 150ms ease',
              }}
            >
              <item.Icon size={14} color={active ? '#F59E0B' : item.color} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: active ? '#F59E0B' : 'var(--text-primary)' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                  {item.description}
                </div>
              </div>
              {item.expandable && (
                <ChevronRight
                  size={13}
                  style={{ color: active ? '#F59E0B' : 'var(--text-muted)', flexShrink: 0, marginTop: 2, transition: 'color 150ms ease' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Column 2 — sub-items flyout */}
      {expandedKey && (
        <div
          key={expandedKey}
          style={{
            width: SUB_W,
            background: 'var(--void)',
            border: '1px solid var(--twilight)',
            borderRadius: 10,
            boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.25)',
            padding: '8px 8px 6px',
            overflowY: 'auto',
            maxHeight: 'min(520px, 80vh)',
            animation: 'sunos-ctx-flyout 120ms ease',
          }}
        >
          <p
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              color: 'var(--text-muted)',
              margin: '0 0 8px 2px',
              fontWeight: 600,
            }}
          >
            {expandedItem?.label}
          </p>

          {expandedKey === 'st-tool' && toolsLoading && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 4px' }}>Carregando…</p>
          )}
          {expandedKey === 'st-llm' && activeAgents.length === 0 && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 4px' }}>Nenhum agente ativo.</p>
          )}
          {expandedKey === 'st-workflow' && activeWorkflows.length === 0 && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 4px' }}>Nenhum workflow disponível.</p>
          )}

          {subItems?.map((sub) => (
            <button
              key={sub.key}
              role="menuitem"
              onClick={() => { onSelect(sub.payload); onClose(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '5px 7px',
                borderRadius: 7,
                border: '1px solid transparent',
                background: 'var(--nebula)',
                marginBottom: 3,
                cursor: 'pointer',
                textAlign: 'left',
                color: 'inherit',
                transition: 'background 100ms ease, border-color 100ms ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = 'var(--deep)';
                el.style.borderColor = 'var(--twilight)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = 'var(--nebula)';
                el.style.borderColor = 'transparent';
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: 'var(--deep)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {sub.icon ? (
                  <span style={{ fontSize: 11, color: sub.iconColor ?? 'var(--text-primary)', fontWeight: 600 }}>
                    {sub.icon}
                  </span>
                ) : sub.Icon ? (
                  <sub.Icon size={13} color={sub.iconColor ?? 'var(--text-muted)'} />
                ) : null}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {sub.label}
                </div>
                {sub.description && (
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {sub.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <style jsx global>{`
        @keyframes sunos-ctx-flyout {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
