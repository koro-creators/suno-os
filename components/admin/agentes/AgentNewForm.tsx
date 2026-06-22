'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAgents } from '@/contexts/AgentsContext';
import { AgentStatus } from '@/lib/agents-types';

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

export default function AgentNewForm() {
  const router = useRouter();
  const { createAgent } = useAgents();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🤖');
  const [customIcon, setCustomIcon] = useState('');
  const [instructions, setInstructions] = useState('');
  const [status] = useState<AgentStatus>('draft');
  const [errors, setErrors] = useState<{ name?: string; instructions?: string }>({});

  const effectiveIcon = customIcon.trim() || icon;

  function validate(): boolean {
    const errs: { name?: string; instructions?: string } = {};
    if (!name.trim()) errs.name = 'Nome é obrigatório.';
    else if (name.length > 120) errs.name = 'Nome deve ter no máximo 120 caracteres.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const agent = await createAgent({
      name: name.trim(),
      icon: effectiveIcon,
      instructions: instructions.trim(),
      status,
    });
    router.push(`/agentes/${agent.id}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 600,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* Name */}
      <div>
        <label htmlFor="agent-name" style={labelStyle}>
          Nome <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <input
          id="agent-name"
          type="text"
          placeholder="Ex: Resumidor de Briefings"
          value={name}
          maxLength={120}
          onChange={(e) => setName(e.target.value)}
          style={{
            ...inputStyle,
            borderColor: errors.name ? '#EF4444' : 'var(--border-subtle)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = errors.name ? '#EF4444' : 'var(--sun)';
            e.currentTarget.style.boxShadow = errors.name
              ? '0 0 0 2px rgba(239,68,68,0.15)'
              : '0 0 0 2px rgba(255,200,1,0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = errors.name ? '#EF4444' : 'var(--border-subtle)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        {errors.name && (
          <p style={{ fontSize: '0.75rem', color: '#EF4444', margin: '4px 0 0' }}>{errors.name}</p>
        )}
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
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 150ms ease',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ou texto livre:</span>
          <input
            type="text"
            placeholder="Ex: KR"
            value={customIcon}
            maxLength={10}
            onChange={(e) => setCustomIcon(e.target.value)}
            style={{
              ...inputStyle,
              width: 80,
              padding: '6px 10px',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--sun)';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {effectiveIcon && (
            <span style={{ fontSize: 24, lineHeight: 1 }}>{effectiveIcon}</span>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label htmlFor="agent-instructions" style={labelStyle}>
          Instruções (System Prompt)
        </label>
        <textarea
          id="agent-instructions"
          placeholder="Descreva o comportamento e papel deste agente..."
          value={instructions}
          rows={5}
          onChange={(e) => setInstructions(e.target.value)}
          style={{
            ...inputStyle,
            resize: 'vertical',
            lineHeight: 1.6,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--sun)';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Status note */}
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
        O agente será criado com status <strong>Rascunho</strong>. Ative-o na aba Configuração após
        configurar skills e apps.
      </p>

      {/* Submit */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
        <button
          type="submit"
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
          Criar Agente
        </button>
        <button
          type="button"
          onClick={() => router.push('/agentes')}
          style={{
            padding: '10px 16px',
            fontSize: '0.85rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'border-color 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--twilight)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
