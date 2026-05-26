'use client';

import { ChevronDown } from 'lucide-react';
import type { ApprovalFilters, ApprovalStatus, Urgency } from '@/lib/approval-types';

interface AprovacaoFiltersProps {
  filters: ApprovalFilters;
  clientOptions: { id: string; name: string }[];
  skillOptions: { slug: string; name: string }[];
  onChange: (filters: ApprovalFilters) => void;
}

const STATUS_OPTIONS: { value: ApprovalStatus | ''; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'PENDING_VALIDATION', label: 'Validando' },
  { value: 'PENDING_APPROVAL', label: 'Aguardando aprovação' },
  { value: 'CHANGES_REQUESTED', label: 'Revisão solicitada' },
  { value: 'APPROVED', label: 'Aprovado' },
  { value: 'REJECTED', label: 'Rejeitado' },
  { value: 'EXPIRED', label: 'Expirado' },
];

const URGENCY_OPTIONS: { value: Urgency | ''; label: string }[] = [
  { value: '', label: 'Toda urgência' },
  { value: 'high', label: 'Alta' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Baixa' },
];

const selectStyle: React.CSSProperties = {
  backgroundColor: 'var(--deep)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 8,
  padding: '6px 28px 6px 10px',
  fontSize: '0.78rem',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
  minWidth: 140,
  transition: 'border-color 150ms ease',
};

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      {children}
      <ChevronDown
        size={12}
        strokeWidth={1.5}
        style={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-muted)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export default function AprovacaoFilters({
  filters,
  clientOptions,
  skillOptions,
  onChange,
}: AprovacaoFiltersProps) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Cliente */}
      <SelectWrapper>
        <select
          value={filters.client_id ?? ''}
          onChange={(e) => onChange({ ...filters, client_id: e.target.value || undefined })}
          style={selectStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--sun)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <option value="">Todos os clientes</option>
          {clientOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </SelectWrapper>

      {/* Skill */}
      <SelectWrapper>
        <select
          value={filters.skill_slug ?? ''}
          onChange={(e) => onChange({ ...filters, skill_slug: e.target.value || undefined })}
          style={selectStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--sun)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <option value="">Todas as skills</option>
          {skillOptions.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </SelectWrapper>

      {/* Urgência */}
      <SelectWrapper>
        <select
          value={filters.urgency ?? ''}
          onChange={(e) =>
            onChange({ ...filters, urgency: (e.target.value as Urgency) || undefined })
          }
          style={selectStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--sun)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          {URGENCY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </SelectWrapper>

      {/* Status */}
      <SelectWrapper>
        <select
          value={filters.status ?? ''}
          onChange={(e) =>
            onChange({ ...filters, status: (e.target.value as ApprovalStatus) || undefined })
          }
          style={selectStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--sun)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </SelectWrapper>

      {/* Clear */}
      {Object.values(filters).some(Boolean) && (
        <button
          onClick={() => onChange({})}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'color 150ms ease, border-color 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--twilight)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
