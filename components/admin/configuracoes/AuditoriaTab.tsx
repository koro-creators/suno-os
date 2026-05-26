'use client';

import { useState } from 'react';

interface AuditEvent {
  id: string;
  created_at: string;
  actor_email: string;
  action: string;
  resource_type: string;
  detail: Record<string, string>;
}

const MOCK_EVENTS: AuditEvent[] = [
  {
    id: '1',
    created_at: '2026-05-26T14:30:00Z',
    actor_email: 'heitor@suno.com.br',
    action: 'user_invited',
    resource_type: 'user',
    detail: { email: 'novo@suno.com.br' },
  },
  {
    id: '2',
    created_at: '2026-05-26T10:00:00Z',
    actor_email: 'heitor@suno.com.br',
    action: 'integration_updated',
    resource_type: 'integration',
    detail: { key: 'gemini_api_key' },
  },
  {
    id: '3',
    created_at: '2026-05-25T16:00:00Z',
    actor_email: 'ana@suno.com.br',
    action: 'skill_default_updated',
    resource_type: 'skill',
    detail: { slug: 'copy-social' },
  },
];

const ACTION_LABELS: Record<string, string> = {
  user_invited: 'Convite enviado',
  user_suspended: 'Suspensão',
  user_role_updated: 'Papel alterado',
  integration_updated: 'Integração atualizada',
  skill_default_updated: 'Default de skill editado',
};

const ACTION_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'user_invited', label: 'Convite' },
  { value: 'user_suspended', label: 'Suspensão' },
  { value: 'integration_updated', label: 'Integração' },
  { value: 'skill_default_updated', label: 'Skill/Modelo' },
];

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDetail(detail: Record<string, string>): string {
  return Object.entries(detail)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
}

export default function AuditoriaTab() {
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const filtered = MOCK_EVENTS.filter((e) => {
    const matchUser = !userFilter || e.actor_email.includes(userFilter.toLowerCase());
    const matchAction = !actionFilter || e.action === actionFilter;
    return matchUser && matchAction;
  });

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: '0.8rem',
    color: 'var(--text-primary)',
    outline: 'none',
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Filtrar por email..."
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          style={{ ...inputStyle, width: 200 }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--sun)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer', width: 180 }}
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {(userFilter || actionFilter) && (
          <button
            onClick={() => {
              setUserFilter('');
              setActionFilter('');
            }}
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Limpar
          </button>
        )}
      </div>

      {/* Table */}
      <div
        style={{
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '140px 160px 1fr 100px 1fr',
            padding: '8px 16px',
            backgroundColor: 'var(--deep)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {['Data/Hora', 'Usuário', 'Ação', 'Recurso', 'Detalhes'].map((h) => (
            <span
              key={h}
              style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}
            >
              {h}
            </span>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Nenhum evento encontrado
            </span>
          </div>
        )}

        {filtered.map((event) => {
          const detail = formatDetail(event.detail);
          return (
            <div
              key={event.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 160px 1fr 100px 1fr',
                padding: '10px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                transition: 'background-color 150ms ease',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--nebula)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {formatDateTime(event.created_at)}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {event.actor_email}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                {ACTION_LABELS[event.action] ?? event.action}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: 9999,
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  display: 'inline-block',
                  width: 'fit-content',
                }}
              >
                {event.resource_type}
              </span>
              <span
                title={detail}
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {detail}
              </span>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 12 }}>
        Tabela read-only — sem ações de edição ou exclusão (append-only).
      </p>
    </div>
  );
}
