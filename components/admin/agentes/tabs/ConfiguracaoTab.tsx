'use client';

import { useState } from 'react';
import { useAgents } from '@/contexts/AgentsContext';
import { Agent, AgentStatus } from '@/lib/agents-types';

const AGENT_ICON_PRESETS = [
  '🤖', '🧠', '⚡', '🎯', '📊', '✍️', '🎨', '📋',
  '🔍', '📬', '💡', '🛠️', '📣', '📈', '🗓️', '🔗',
  '🌐', '🧩', '🚀', '⭐',
];

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--nebula)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: '0.85rem',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
};

interface Props {
  agent: Agent;
}

export default function ConfiguracaoTab({ agent }: Props) {
  const { updateAgent, archiveAgent } = useAgents();

  const isArchived = agent.status === 'archived';

  const [name, setName] = useState(agent.name);
  const [icon, setIcon] = useState(
    AGENT_ICON_PRESETS.includes(agent.icon) ? agent.icon : '🤖',
  );
  const [customIcon, setCustomIcon] = useState(
    AGENT_ICON_PRESETS.includes(agent.icon) ? '' : agent.icon,
  );
  const [instructions, setInstructions] = useState(agent.instructions);
  const [status, setStatus] = useState<AgentStatus>(
    isArchived ? agent.status : (agent.status as Exclude<AgentStatus, 'archived'>),
  );
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [saved, setSaved] = useState(false);

  const effectiveIcon = customIcon.trim() || icon;

  function handleSave() {
    if (!name.trim()) return;
    updateAgent(agent.id, {
      name: name.trim(),
      icon: effectiveIcon,
      instructions: instructions.trim(),
      status: isArchived ? 'archived' : status,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleArchiveConfirm() {
    archiveAgent(agent.id);
    setShowArchiveModal(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
      {isArchived && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8,
            fontSize: '0.8rem',
            color: '#EF4444',
          }}
        >
          Este agente está arquivado e é somente leitura.
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="cfg-name" style={labelStyle}>
          Nome
        </label>
        <input
          id="cfg-name"
          type="text"
          value={name}
          maxLength={120}
          onChange={(e) => setName(e.target.value)}
          disabled={isArchived}
          style={{
            ...inputStyle,
            opacity: isArchived ? 0.6 : 1,
            cursor: isArchived ? 'not-allowed' : 'text',
          }}
          onFocus={(e) => {
            if (!isArchived) {
              e.currentTarget.style.borderColor = 'var(--sun)';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
          {name.length}/120
        </p>
      </div>

      {/* Icon picker */}
      <div>
        <label style={labelStyle}>Ícone</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {AGENT_ICON_PRESETS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              disabled={isArchived}
              onClick={() => {
                setIcon(emoji);
                setCustomIcon('');
              }}
              style={{
                width: 36,
                height: 36,
                fontSize: 18,
                borderRadius: 8,
                border: `2px solid ${
                  icon === emoji && !customIcon.trim() ? 'var(--sun)' : 'var(--border-subtle)'
                }`,
                backgroundColor:
                  icon === emoji && !customIcon.trim()
                    ? 'rgba(255,200,1,0.12)'
                    : 'var(--nebula)',
                cursor: isArchived ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isArchived ? 0.6 : 1,
                transition: 'all 150ms ease',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Texto livre:</span>
          <input
            type="text"
            value={customIcon}
            maxLength={10}
            disabled={isArchived}
            onChange={(e) => setCustomIcon(e.target.value)}
            style={{
              ...inputStyle,
              width: 80,
              padding: '6px 10px',
              opacity: isArchived ? 0.6 : 1,
              cursor: isArchived ? 'not-allowed' : 'text',
            }}
            onFocus={(e) => {
              if (!isArchived) {
                e.currentTarget.style.borderColor = 'var(--sun)';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <span style={{ fontSize: 24, lineHeight: 1 }}>{effectiveIcon}</span>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label htmlFor="cfg-instructions" style={labelStyle}>
          Instruções (System Prompt)
        </label>
        <textarea
          id="cfg-instructions"
          value={instructions}
          rows={6}
          disabled={isArchived}
          onChange={(e) => setInstructions(e.target.value)}
          style={{
            ...inputStyle,
            resize: 'vertical',
            lineHeight: 1.6,
            opacity: isArchived ? 0.6 : 1,
            cursor: isArchived ? 'not-allowed' : 'text',
          }}
          onFocus={(e) => {
            if (!isArchived) {
              e.currentTarget.style.borderColor = 'var(--sun)';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Status */}
      {!isArchived && (
        <div>
          <label style={labelStyle}>Status</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['draft', 'active', 'inactive'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 9999,
                  fontSize: '0.75rem',
                  border: `1px solid ${status === s ? 'var(--sun)' : 'var(--border-subtle)'}`,
                  backgroundColor: status === s ? 'rgba(255,200,1,0.12)' : 'var(--nebula)',
                  color: status === s ? 'var(--sun)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  fontWeight: status === s ? 500 : 400,
                }}
              >
                {s === 'draft' ? 'Rascunho' : s === 'active' ? 'Ativo' : 'Inativo'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {!isArchived && (
        <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
          <button
            type="button"
            onClick={handleSave}
            style={{
              flex: 1,
              backgroundColor: 'var(--sun)',
              color: 'var(--void)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            {saved ? 'Salvo ✓' : 'Salvar alterações'}
          </button>

          {(agent.status === 'active' || agent.status === 'inactive') && (
            <button
              type="button"
              onClick={() => setShowArchiveModal(true)}
              style={{
                padding: '10px 14px',
                fontSize: '0.8rem',
                backgroundColor: 'transparent',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: 8,
                color: '#EF4444',
                cursor: 'pointer',
                transition: 'border-color 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EF4444'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
            >
              Arquivar
            </button>
          )}
        </div>
      )}

      {/* Archive confirmation modal */}
      {showArchiveModal && (
        <>
          <div
            onClick={() => setShowArchiveModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 200,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'var(--deep)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: 24,
              zIndex: 201,
              width: 360,
              maxWidth: '90vw',
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: '1rem', color: 'var(--text-primary)' }}>
              Arquivar agente?
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              O agente será desativado e não poderá ser executado. O histórico de execuções é
              preservado. Esta ação pode ser revertida via suporte.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowArchiveModal(false)}
                style={{
                  padding: '8px 14px',
                  fontSize: '0.8rem',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleArchiveConfirm}
                style={{
                  padding: '8px 14px',
                  fontSize: '0.8rem',
                  backgroundColor: '#EF4444',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Arquivar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
