'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from '@carbon/icons-react';
import { SkillType } from '@/lib/types';

const TYPE_OPTIONS: { key: SkillType; label: string; color: string }[] = [
  { key: 'criacao', label: 'Criacao', color: 'var(--criacao)' },
  { key: 'midia', label: 'Midia', color: 'var(--midia)' },
  { key: 'planejamento', label: 'Planejamento', color: 'var(--planejamento)' },
];

const STATUS_OPTIONS: { key: string; label: string }[] = [
  { key: 'active', label: 'Ativo' },
  { key: 'draft', label: 'Rascunho' },
  { key: 'archived', label: 'Arquivado' },
];

interface SkillsSidebarProps {
  selectedTypes: SkillType[];
  onTypesChange: (v: SkillType[]) => void;
  selectedStatuses: string[];
  onStatusesChange: (v: string[]) => void;
}

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '0.55rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: 'var(--text-muted)',
  margin: 0,
  padding: 0,
  userSelect: 'none',
};

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          ...sectionHeaderStyle,
        }}
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
        ) : (
          <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
        )}
        {title}
      </button>
      {open && children}
    </div>
  );
}

export default function SkillsSidebar({
  selectedTypes,
  onTypesChange,
  selectedStatuses,
  onStatusesChange,
}: SkillsSidebarProps) {
  const activeCount = selectedTypes.length + selectedStatuses.length;

  const toggleType = (key: SkillType) => {
    if (selectedTypes.includes(key)) {
      onTypesChange(selectedTypes.filter((t) => t !== key));
    } else {
      onTypesChange([...selectedTypes, key]);
    }
  };

  const toggleStatus = (key: string) => {
    if (selectedStatuses.includes(key)) {
      onStatusesChange(selectedStatuses.filter((s) => s !== key));
    } else {
      onStatusesChange([...selectedStatuses, key]);
    }
  };

  const clearAll = () => {
    onTypesChange([]);
    onStatusesChange([]);
  };

  return (
    <aside
      style={{
        width: 200,
        minWidth: 200,
        height: 'calc(100vh - 57px)',
        position: 'sticky',
        top: 57,
        overflowY: 'auto',
        padding: '20px 16px',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* Active filter count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {activeCount > 0 ? (
          <>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  backgroundColor: 'var(--sun)',
                  color: 'var(--void)',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                }}
              >
                {activeCount}
              </span>
              {activeCount === 1 ? 'filtro ativo' : 'filtros ativos'}
            </span>
            <button
              onClick={clearAll}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--sun)',
                fontSize: '0.65rem',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
                textUnderlineOffset: 2,
              }}
            >
              Limpar
            </button>
          </>
        ) : (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Filtros</span>
        )}
      </div>

      {/* Tipo */}
      <CollapsibleSection title="Tipo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TYPE_OPTIONS.map((type) => {
            const checked = selectedTypes.includes(type.key);
            return (
              <label
                key={type.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 4px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: checked ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'background-color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    border: checked
                      ? '1.5px solid var(--sun)'
                      : '1.5px solid var(--border-subtle)',
                    backgroundColor: checked ? 'var(--sun)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 150ms ease',
                  }}
                >
                  {checked && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path
                        d="M1.5 4L3.2 5.7L6.5 2.3"
                        stroke="var(--void)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleType(type.key)}
                  style={{ display: 'none' }}
                />
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: type.color,
                    flexShrink: 0,
                  }}
                />
                {type.label}
              </label>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* Status */}
      <CollapsibleSection title="Status">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {STATUS_OPTIONS.map((status) => {
            const checked = selectedStatuses.includes(status.key);
            return (
              <label
                key={status.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 4px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: checked ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'background-color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    border: checked
                      ? '1.5px solid var(--sun)'
                      : '1.5px solid var(--border-subtle)',
                    backgroundColor: checked ? 'var(--sun)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 150ms ease',
                  }}
                >
                  {checked && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path
                        d="M1.5 4L3.2 5.7L6.5 2.3"
                        stroke="var(--void)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleStatus(status.key)}
                  style={{ display: 'none' }}
                />
                {status.label}
              </label>
            );
          })}
        </div>
      </CollapsibleSection>
    </aside>
  );
}
