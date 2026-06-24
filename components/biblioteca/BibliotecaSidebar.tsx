'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from '@carbon/icons-react';
import FileTypeIcon from './FileTypeIcon';
import { useClients } from '@/contexts/ClientsContext';

const TYPE_OPTIONS: { key: string; label: string; fileType?: string; docType?: 'reuniao' }[] = [
  { key: 'pdf', label: 'PDF', fileType: 'pdf' },
  { key: 'image', label: 'Imagem', fileType: 'png' },
  { key: 'audio', label: 'Audio', fileType: 'mp3' },
  { key: 'video', label: 'Video', fileType: 'mp4' },
  { key: 'text', label: 'Texto', fileType: 'txt' },
  { key: 'reuniao', label: 'Reuniões', docType: 'reuniao' },
];

interface BibliotecaSidebarProps {
  selectedScopes: string[];
  onScopesChange: (v: string[]) => void;
  selectedTypes: string[];
  onTypesChange: (v: string[]) => void;
  selectedTags: string[];
  onTagsChange: (v: string[]) => void;
  popularTags: string[];
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

export default function BibliotecaSidebar({
  selectedScopes,
  onScopesChange,
  selectedTypes,
  onTypesChange,
  selectedTags,
  onTagsChange,
  popularTags,
}: BibliotecaSidebarProps) {
  const { clients } = useClients();
  const scopeOptions = [
    { key: 'suno', label: 'Suno', color: 'var(--sun)' },
    ...clients.map((c) => ({ key: c.slug, label: c.name, color: c.color })),
  ];

  const activeCount =
    selectedScopes.length + selectedTypes.length + selectedTags.length;

  const toggleScope = (key: string) => {
    if (selectedScopes.includes(key)) {
      onScopesChange(selectedScopes.filter((s) => s !== key));
    } else {
      onScopesChange([...selectedScopes, key]);
    }
  };

  const toggleType = (key: string) => {
    if (selectedTypes.includes(key)) {
      onTypesChange(selectedTypes.filter((t) => t !== key));
    } else {
      onTypesChange([...selectedTypes, key]);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const clearAll = () => {
    onScopesChange([]);
    onTypesChange([]);
    onTagsChange([]);
  };

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
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
              Limpar filtros
            </button>
          </>
        ) : (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Filtros</span>
        )}
      </div>

      {/* Escopo */}
      <CollapsibleSection title="Escopo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {scopeOptions.map((scope) => {
            const checked = selectedScopes.includes(scope.key);
            return (
              <label
                key={scope.key}
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
                      <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="var(--void)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleScope(scope.key)}
                  style={{ display: 'none' }}
                />
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: scope.color,
                    flexShrink: 0,
                  }}
                />
                {scope.label}
              </label>
            );
          })}
        </div>
      </CollapsibleSection>

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
                      <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="var(--void)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleType(type.key)}
                  style={{ display: 'none' }}
                />
                <FileTypeIcon fileType={type.fileType} docType={type.docType} size={14} />
                {type.label}
              </label>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* Conteúdo */}
      <CollapsibleSection title="Conteúdo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {(() => {
            const checked = selectedTags.includes('reuniao');
            return (
              <label
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
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    border: checked ? '1.5px solid var(--sun)' : '1.5px solid var(--border-subtle)',
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
                      <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="var(--void)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleTag('reuniao')}
                  style={{ display: 'none' }}
                />
                Reuniões
              </label>
            );
          })()}
        </div>
      </CollapsibleSection>

      {/* Tags populares */}
      {popularTags.length > 0 && (
        <CollapsibleSection title="Tags populares">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {popularTags.slice(0, 8).map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  aria-pressed={active}
                  style={{
                    fontSize: '0.6rem',
                    padding: '3px 8px',
                    borderRadius: 9999,
                    border: `1px solid ${active ? 'var(--sun)' : 'var(--border-subtle)'}`,
                    backgroundColor: active ? 'rgba(255,200,1,0.1)' : 'transparent',
                    color: active ? 'var(--sun)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </CollapsibleSection>
      )}
    </aside>
  );
}
