'use client';

import { Shield } from 'lucide-react';
import { SkillAdmin } from '@/lib/admin-types';

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'transparent',
  border: '1px solid var(--border-subtle)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: '0.8rem',
  color: 'var(--text-primary)',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.7rem',
  color: 'var(--text-secondary)',
  marginBottom: 4,
  fontWeight: 500,
};

function focusRing(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'var(--sun)';
  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
}

function blurRing(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'var(--border-subtle)';
  e.currentTarget.style.boxShadow = 'none';
}

const MODEL_OPTIONS = [
  { label: 'Gemini Pro', value: 'gemini-pro' },
  { label: 'Gemini Flash', value: 'gemini-flash' },
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'Claude', value: 'claude' },
];

interface ConfigTabProps {
  data: SkillAdmin;
  onChange: (patch: Partial<SkillAdmin>) => void;
}

export default function ConfigTab({ data, onChange }: ConfigTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
      <div>
        <label htmlFor="system-prompt" style={labelStyle}>System Prompt</label>
        <textarea
          id="system-prompt"
          value={data.systemPrompt}
          onChange={(e) => onChange({ systemPrompt: e.target.value })}
          rows={15}
          style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.75rem', resize: 'vertical' }}
          onFocus={focusRing as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
          onBlur={blurRing as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
        />
      </div>

      <div>
        <label htmlFor="model" style={labelStyle}>Modelo</label>
        <select
          id="model"
          value={data.model}
          onChange={(e) => onChange({ model: e.target.value })}
          style={{ ...inputStyle, cursor: 'pointer' }}
          onFocus={focusRing as unknown as React.FocusEventHandler<HTMLSelectElement>}
          onBlur={blurRing as unknown as React.FocusEventHandler<HTMLSelectElement>}
        >
          {MODEL_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="temperature" style={labelStyle}>
          Temperatura: {data.temperature.toFixed(1)}
        </label>
        <input
          id="temperature"
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={data.temperature}
          onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--sun)' }}
        />
      </div>

      <div>
        <label htmlFor="max-tokens" style={labelStyle}>Max Tokens</label>
        <input
          id="max-tokens"
          type="number"
          value={data.maxTokens}
          onChange={(e) => onChange({ maxTokens: parseInt(e.target.value) || 0 })}
          style={inputStyle}
          onFocus={focusRing}
          onBlur={blurRing}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.7rem' }}>
        <Shield size={12} strokeWidth={1.5} />
        Configurações protegidas — não visíveis no frontend público
      </div>
    </div>
  );
}
