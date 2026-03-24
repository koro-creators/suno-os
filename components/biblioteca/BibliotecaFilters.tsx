'use client';

import { Search } from 'lucide-react';
import ScopePills from './ScopePills';

interface BibliotecaFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  selectedScopes: string[];
  onScopesChange: (v: string[]) => void;
  selectedTags: string[];
  onTagsChange: (v: string[]) => void;
  availableTags: string[];
}

export default function BibliotecaFilters({
  search,
  onSearchChange,
  selectedScopes,
  onScopesChange,
  selectedTags,
  onTagsChange,
  availableTags,
}: BibliotecaFiltersProps) {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const visibleTags = availableTags.filter((t) => t.trim() !== '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Row 1: ScopePills + Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <ScopePills selected={selectedScopes} onChange={onScopesChange} />

        <div style={{ position: 'relative', flex: '0 1 240px' }}>
          <Search
            size={13}
            strokeWidth={1.5}
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
            placeholder="Buscar documento..."
            aria-label="Buscar documento"
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
      </div>

      {/* Row 2: Tag cloud */}
      {visibleTags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {visibleTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
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
      )}
    </div>
  );
}
