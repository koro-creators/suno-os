'use client';

/**
 * SPEC-015 — EntityValidationCard: HITL validation per entity.
 * Constitution §1.3: HITL is per-entity, never batch. No "accept all" button.
 */

import { useState } from 'react';
import { CheckCircle, Edit3, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import type { HITLAction, OntologyEntityType, EntityStatus, EntityBadge } from '@/lib/onboarding-types';

interface Props {
  entityType: OntologyEntityType;
  content: string;
  status: EntityStatus;
  badge: EntityBadge;
  onValidate: (action: HITLAction, editedContent?: string) => Promise<void>;
}

export default function EntityValidationCard({ entityType, content, status, badge, onValidate }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isPending, setIsPending] = useState(false);

  const isAccepted = status === 'accepted';
  const isRegenerating = status === 'regenerating';
  const isGenerated = status === 'generated';

  const handleAction = async (action: HITLAction) => {
    if (isPending) return;
    setIsPending(true);
    try {
      if (action === 'edit_accept') {
        await onValidate(action, editedContent);
        setIsEditing(false);
      } else {
        await onValidate(action);
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${isAccepted ? 'rgba(34,197,94,0.3)' : 'var(--border-subtle)'}`,
        backgroundColor: isAccepted ? 'rgba(34,197,94,0.03)' : 'var(--deep)',
        transition: 'all 200ms ease',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setIsExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsExpanded((v) => !v); } }}
      >
        {/* Status icon */}
        <span style={{ flexShrink: 0 }}>
          {isAccepted ? (
            <CheckCircle size={16} strokeWidth={1.5} style={{ color: '#22C55E' }} />
          ) : isRegenerating ? (
            <span style={{ display: 'inline-flex', animation: 'spin 1s linear infinite' }}>
              <RefreshCw size={16} strokeWidth={1.5} style={{ color: '#F97316' }} />
            </span>
          ) : (
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: '2px solid var(--border-subtle)',
                display: 'inline-block',
              }}
            />
          )}
        </span>

        {/* Entity type */}
        <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)' }}>
          {entityType}
        </span>

        {/* Badge */}
        {isAccepted && (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 9999,
              fontSize: '0.62rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              backgroundColor: badge === 'hitl'
                ? 'rgba(139,92,246,0.12)'
                : 'rgba(34,197,94,0.12)',
              color: badge === 'hitl' ? '#8B5CF6' : '#22C55E',
              border: `1px solid ${badge === 'hitl' ? 'rgba(139,92,246,0.25)' : 'rgba(34,197,94,0.25)'}`,
            }}
          >
            {badge === 'hitl' ? 'editado' : 'auto'}
          </span>
        )}

        {/* Expand toggle */}
        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          {isExpanded ? <ChevronUp size={14} strokeWidth={1.5} /> : <ChevronDown size={14} strokeWidth={1.5} />}
        </span>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div
          style={{
            padding: '0 16px 16px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {/* Content area */}
          <div style={{ paddingTop: 14 }}>
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={8}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--twilight)',
                  backgroundColor: 'var(--nebula)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none',
                  resize: 'vertical',
                  boxShadow: '0 0 0 2px rgba(255,200,1,0.15)',
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  backgroundColor: 'var(--nebula)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                {content || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Conteúdo não disponível</span>}
              </div>
            )}
          </div>

          {/* Action bar */}
          {!isAccepted && !isRegenerating && isGenerated && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 12,
                flexWrap: 'wrap',
              }}
            >
              {isEditing ? (
                <>
                  <button
                    onClick={() => handleAction('edit_accept')}
                    disabled={isPending}
                    style={actionButtonStyle('#22C55E', isPending)}
                  >
                    <CheckCircle size={12} strokeWidth={1.5} />
                    Aceitar edição
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setEditedContent(content); }}
                    disabled={isPending}
                    style={actionButtonStyle('var(--text-secondary)', isPending, true)}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleAction('accept')}
                    disabled={isPending}
                    style={actionButtonStyle('#22C55E', isPending)}
                  >
                    <CheckCircle size={12} strokeWidth={1.5} />
                    Aceitar
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    disabled={isPending}
                    style={actionButtonStyle('#8B5CF6', isPending)}
                  >
                    <Edit3 size={12} strokeWidth={1.5} />
                    Editar + Aceitar
                  </button>
                  <button
                    onClick={() => handleAction('reject_regenerate')}
                    disabled={isPending}
                    style={actionButtonStyle('#EF4444', isPending)}
                  >
                    <RefreshCw size={12} strokeWidth={1.5} />
                    Rejeitar + Regenerar
                  </button>
                </>
              )}
            </div>
          )}

          {isRegenerating && (
            <div
              style={{
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.78rem',
                color: '#F97316',
              }}
            >
              <span style={{ display: 'inline-flex', animation: 'spin 1s linear infinite' }}>
                <RefreshCw size={13} strokeWidth={1.5} />
              </span>
              Regenerando... aguarde.
            </div>
          )}

          {isAccepted && (
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.75rem',
                color: '#22C55E',
              }}
            >
              <CheckCircle size={12} strokeWidth={1.5} />
              Entidade aprovada
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function actionButtonStyle(color: string, disabled: boolean, ghost = false): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 8,
    border: `1px solid ${ghost ? 'var(--border-subtle)' : `${color}55`}`,
    backgroundColor: ghost ? 'transparent' : `${color}14`,
    color: ghost ? 'var(--text-secondary)' : color,
    fontSize: '0.78rem',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 150ms ease',
  };
}
