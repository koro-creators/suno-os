'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const NAV_ITEMS = ['Dashboard', 'Clientes', 'Skills', 'Biblioteca'];

const RECENT_ITEMS = [
  'Santander · Copy Social',
  'Vivo · Plano de Mídia',
  'BMG · Brief Builder',
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside
      role="complementary"
      aria-label="Menu lateral"
      style={{
        width: isOpen ? 260 : 40,
        flexShrink: 0,
        backgroundColor: 'var(--deep)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 200ms ease',
        overflow: 'hidden',
        zIndex: 40,
        position: 'relative',
      }}
    >
      {/* Toggle button — always visible, vertically centered */}
      <button
        aria-label={isOpen ? 'Fechar menu lateral' : 'Abrir menu lateral'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        style={{
          position: 'absolute',
          top: '50%',
          right: 0,
          transform: 'translateY(-50%)',
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          flexShrink: 0,
          zIndex: 10,
          borderRadius: 0,
          transition: 'color 150ms ease, background-color 150ms ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--deep)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        }}
      >
        {isOpen ? (
          <ChevronLeft size={14} strokeWidth={1.5} />
        ) : (
          <ChevronRight size={14} strokeWidth={1.5} />
        )}
      </button>

      {/* Content — only rendered/visible when open */}
      <div
        style={{
          width: 260,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 150ms ease',
          paddingTop: 24,
          paddingBottom: 24,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* NAVEGAÇÃO section */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: '0.55rem',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'var(--text-muted)',
              padding: '0 16px 8px',
            }}
          >
            Navegação
          </div>
          {NAV_ITEMS.map((item) => (
            <NavItem key={item} label={item} />
          ))}
        </div>

        {/* RECENTES section */}
        <div>
          <div
            style={{
              fontSize: '0.55rem',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'var(--text-muted)',
              padding: '0 16px 8px',
            }}
          >
            Recentes
          </div>
          {RECENT_ITEMS.map((item) => (
            <NavItem key={item} label={item} />
          ))}
        </div>
      </div>
    </aside>
  );
}

function NavItem({ label }: { label: string }) {
  return (
    <div
      role="button"
      tabIndex={0}
      style={{
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        padding: '8px 16px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'color 150ms ease',
        userSelect: 'none',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.color = 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.color = 'var(--text-secondary)';
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLDivElement).style.color = 'var(--text-primary)';
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLDivElement).style.color = 'var(--text-secondary)';
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
        }
      }}
    >
      {label}
    </div>
  );
}
