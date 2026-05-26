'use client';

import { Search } from '@carbon/icons-react';
import { SkillType } from '@/lib/types';

interface SkillFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  activeType: SkillType | null;
  onTypeChange: (v: SkillType | null) => void;
  activeStatus: string | null;
  onStatusChange: (v: string | null) => void;
}

const TYPES: { label: string; value: SkillType; color: string }[] = [
  { label: 'Criação', value: 'criacao', color: 'var(--criacao)' },
  { label: 'Mídia', value: 'midia', color: 'var(--midia)' },
  { label: 'Planejamento', value: 'planejamento', color: 'var(--planejamento)' },
];

const STATUSES = [
  { label: 'Ativo', value: 'active' },
  { label: 'Rascunho', value: 'draft' },
  { label: 'Arquivado', value: 'archived' },
];

export default function SkillFilters({
  search,
  onSearchChange,
  activeType,
  onTypeChange,
  activeStatus,
  onStatusChange,
}: SkillFiltersProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: '0 1 240px' }}>
        <Search
          size={13}
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
          placeholder="Buscar skill..."
          aria-label="Buscar skill"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: 9999,
            padding: '7px 12px 7px 32px',
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

      <div style={{ display: 'flex', gap: 4 }}>
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => onTypeChange(activeType === t.value ? null : t.value)}
            style={{
              fontSize: '0.7rem',
              padding: '4px 10px',
              borderRadius: 9999,
              border: `1px solid ${activeType === t.value ? t.color : 'var(--border-subtle)'}`,
              backgroundColor: activeType === t.value ? `${t.color}18` : 'transparent',
              color: activeType === t.value ? t.color : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => onStatusChange(activeStatus === s.value ? null : s.value)}
            style={{
              fontSize: '0.7rem',
              padding: '4px 10px',
              borderRadius: 9999,
              border: `1px solid ${activeStatus === s.value ? 'var(--text-secondary)' : 'var(--border-subtle)'}`,
              backgroundColor: activeStatus === s.value ? 'var(--surface-hover)' : 'transparent',
              color: activeStatus === s.value ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
