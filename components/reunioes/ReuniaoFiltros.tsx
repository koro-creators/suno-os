'use client';

import { Search } from '@carbon/icons-react';
import { MeetingStatus } from '@/lib/meeting-types';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  clientFilter: string;
  onClientChange: (v: string) => void;
  statusFilter: MeetingStatus | '';
  onStatusChange: (v: MeetingStatus | '') => void;
  availableClients: string[];
}

const STATUS_OPTIONS: Array<{ value: MeetingStatus | ''; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'pending_review', label: 'Aguardando Curadoria' },
  { value: 'curated', label: 'Curado' },
  { value: 'archived', label: 'Arquivado' },
];

export default function ReuniaoFiltros({
  search,
  onSearchChange,
  clientFilter,
  onClientChange,
  statusFilter,
  onStatusChange,
  availableClients,
}: Props) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Buscar reunião..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: 9999,
            padding: '8px 12px 8px 32px',
            fontSize: '0.8rem',
            color: 'var(--text-primary)',
            outline: 'none',
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

      {/* Client filter */}
      {availableClients.length > 0 && (
        <select
          value={clientFilter}
          onChange={(e) => onClientChange(e.target.value)}
          style={{
            backgroundColor: 'var(--deep)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 9999,
            padding: '8px 12px',
            fontSize: '0.8rem',
            color: clientFilter ? 'var(--text-primary)' : 'var(--text-muted)',
            outline: 'none',
            cursor: 'pointer',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--sun)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          <option value="">Todos os clientes</option>
          {availableClients.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      )}

      {/* Status filter pills */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStatusChange(opt.value)}
            style={{
              padding: '6px 12px',
              fontSize: '0.7rem',
              borderRadius: 9999,
              border: statusFilter === opt.value ? '1px solid var(--sun)' : '1px solid var(--border-subtle)',
              backgroundColor: statusFilter === opt.value ? 'rgba(255,200,1,0.1)' : 'transparent',
              color: statusFilter === opt.value ? 'var(--sun)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
