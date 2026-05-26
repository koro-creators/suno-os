'use client';

import { useEffect, useRef, KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const {
    query,
    setQuery,
    groups,
    selectedIndex,
    setSelectedIndex,
    navigateSelected,
  } = useGlobalSearch();

  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  // Save focus and auto-focus input when opening; restore focus and reset query on close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      // Small defer to ensure the panel is visible before focusing
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
      // Restore focus on close
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen, setQuery]);

  const allItems = groups.flatMap((g) => g.items);

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(Math.min(selectedIndex + 1, allItems.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(Math.max(selectedIndex - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      navigateSelected();
      onClose();
      return;
    }
  }

  const hasResults = groups.length > 0;
  const showEmpty = query.length >= 2 && !hasResults;

  // Flat index offset per group for computing global selectedIndex
  let flatOffset = 0;

  return (
    <div
      style={{ display: isOpen ? 'block' : 'none' }}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 1000,
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Busca global"
        style={{
          position: 'fixed',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 560,
          maxHeight: 480,
          background: 'var(--deep)',
          borderRadius: 12,
          border: '1px solid var(--border-subtle)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
      >
        {/* Input row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <Search size={14} strokeWidth={1.5} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar clientes, skills, documentos..."
            aria-label="Buscar"
            aria-autocomplete="list"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
            }}
          />
          {query.length > 0 && (
            <button
              onClick={() => setQuery('')}
              aria-label="Limpar busca"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Results area */}
        <div
          role="listbox"
          aria-label="Resultados da busca"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: hasResults || showEmpty ? '8px 0' : 0,
          }}
        >
          {showEmpty && (
            <div
              style={{
                padding: '24px 16px',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                textAlign: 'center',
              }}
            >
              Nenhum resultado para &laquo;{query}&raquo;
            </div>
          )}

          {groups.map((group) => {
            const groupOffset = flatOffset;
            flatOffset += group.items.length;

            return (
              <div key={group.type}>
                {/* Group label */}
                <div
                  style={{
                    padding: '6px 16px 4px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                  }}
                >
                  {group.label}
                </div>

                {/* Group items */}
                {group.items.map((item, itemIdx) => {
                  const flatIdx = groupOffset + itemIdx;
                  const isSelected = flatIdx === selectedIndex;

                  return (
                    <div
                      key={item.id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        setSelectedIndex(flatIdx);
                        navigateSelected();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(flatIdx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 16px',
                        cursor: 'pointer',
                        borderRadius: 8,
                        margin: '0 8px',
                        background: isSelected ? 'var(--nebula)' : 'transparent',
                        transition: 'background 150ms ease',
                      }}
                    >
                      {/* Color dot for clients */}
                      {item.type === 'client' && item.color && (
                        <span
                          aria-hidden="true"
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: item.color,
                            flexShrink: 0,
                          }}
                        />
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.label}
                        </div>
                        {item.sublabel && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                              marginTop: 1,
                            }}
                          >
                            {item.sublabel}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hints */}
        <div
          aria-hidden="true"
          style={{
            padding: '8px 16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: 12,
            color: 'var(--text-muted)',
            fontSize: 11,
          }}
        >
          <span>↑↓ navegar</span>
          <span>·</span>
          <span>Enter confirmar</span>
          <span>·</span>
          <span>Esc fechar</span>
        </div>
      </div>
    </div>
  );
}
