'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutDashboard, Users, Sparkles, BookOpen, type LucideIcon } from 'lucide-react';

interface NavItemDef {
  label: string;
  icon: LucideIcon;
}

interface RecentItemDef {
  label: string;
  color: string;
}

const NAV_ITEMS: NavItemDef[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Clientes', icon: Users },
  { label: 'Skills', icon: Sparkles },
  { label: 'Biblioteca', icon: BookOpen },
];

const RECENT_ITEMS: RecentItemDef[] = [
  { label: 'Santander · Copy Social', color: '#EF4444' },
  { label: 'Vivo · Plano de Mídia', color: '#8B5CF6' },
  { label: 'BMG · Brief Builder', color: '#F472B6' },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('Dashboard');

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
      {/* Collapsed icon strip — shown only when sidebar is closed */}
      {!isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 40,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            cursor: 'pointer',
          }}
          onClick={() => setIsOpen(true)}
        >
          {NAV_ITEMS.map(({ label, icon: Icon }) => {
            const isActive = activeItem === label;
            return (
              <div
                key={label}
                title={label}
                role="button"
                tabIndex={0}
                aria-label={label}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveItem(label);
                  setIsOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveItem(label);
                    setIsOpen(true);
                  }
                }}
                style={{
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isActive ? 'var(--sun)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  outline: 'none',
                  flexShrink: 0,
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.color = 'var(--text-secondary)';
                  }
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.03)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.color = isActive ? 'var(--sun)' : 'var(--text-muted)';
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                }}
              >
                <Icon size={14} strokeWidth={1.5} />
              </div>
            );
          })}
        </div>
      )}

      {/* Toggle button — shown only when open, vertically centered */}
      {isOpen && (
        <button
          aria-label="Fechar menu lateral"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(false)}
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
          <ChevronLeft size={14} strokeWidth={1.5} />
        </button>
      )}

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
          {NAV_ITEMS.map(({ label, icon }) => (
            <NavItem
              key={label}
              label={label}
              icon={icon}
              isActive={activeItem === label}
              onClick={() => setActiveItem(label)}
            />
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
          {RECENT_ITEMS.map(({ label, color }) => (
            <RecentItem key={label} label={label} color={color} />
          ))}
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      style={{
        fontSize: '0.75rem',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        padding: '10px 16px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'color 150ms ease, background-color 150ms ease',
        userSelect: 'none',
        outline: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderLeft: isActive ? '2px solid var(--sun)' : '2px solid transparent',
        backgroundColor: isActive ? 'rgba(255,200,1,0.04)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = isActive
          ? 'rgba(255,200,1,0.06)'
          : 'rgba(255,255,255,0.03)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = isActive
          ? 'rgba(255,200,1,0.04)'
          : 'transparent';
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLDivElement).style.color = 'var(--text-primary)';
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLDivElement).style.color = isActive
          ? 'var(--text-primary)'
          : 'var(--text-secondary)';
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <Icon
        size={14}
        strokeWidth={1.5}
        style={{ color: isActive ? 'var(--sun)' : 'inherit', flexShrink: 0 }}
      />
      {label}
    </div>
  );
}

function RecentItem({ label, color }: { label: string; color: string }) {
  return (
    <div
      role="button"
      tabIndex={0}
      style={{
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        padding: '10px 16px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'color 150ms ease, background-color 150ms ease',
        userSelect: 'none',
        outline: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.color = 'var(--text-primary)';
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.03)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.color = 'var(--text-secondary)';
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
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
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: color,
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      {label}
    </div>
  );
}
