'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Globe, Users, BookOpen, Sparkles, Zap, Settings, Video, LogOut, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigationHistory } from '@/hooks/useNavigationHistory';

interface NavItemDef {
  label: string;
  icon: LucideIcon;
  href?: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItemDef[] = [
  { label: 'Home', icon: Globe, href: '/' },
  { label: 'Clientes', icon: Users, href: '/clientes', adminOnly: true },
  { label: 'Skills', icon: Sparkles, href: '/skills', adminOnly: true },
  { label: 'Biblioteca', icon: BookOpen, href: '/biblioteca', adminOnly: true },
  { label: 'Workflows', icon: Zap, href: '/workflows', adminOnly: true },
  { label: 'Reunioes', icon: Video, href: '/reunioes', adminOnly: true },
  { label: 'Configurações', icon: Settings, href: '/configuracoes', adminOnly: true },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('Home');
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, role, signOut } = useAuth();
  const { recents } = useNavigationHistory();

  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  const handleNavClick = (item: NavItemDef) => {
    setActiveItem(item.label);
    if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <aside
      role="complementary"
      aria-label="Menu lateral"
      style={{
        width: isOpen ? 260 : 40,
        flexShrink: 0,
        backgroundColor: 'var(--deep)',
        borderRight: '1px solid var(--border-subtle)',
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
          {visibleNavItems.map((item) => {
            const { label, icon: Icon } = item;
            const isActive = activeItem === label || (item.href && pathname.startsWith(item.href));
            return (
              <div
                key={label}
                title={label}
                role="button"
                tabIndex={0}
                aria-label={label}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavClick(item);
                  setIsOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNavClick(item);
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
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--surface-hover)';
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
          {visibleNavItems.map((item) => (
            <NavItem
              key={item.label}
              label={item.label}
              icon={item.icon}
              isActive={activeItem === item.label || !!(item.href && pathname.startsWith(item.href))}
              onClick={() => handleNavClick(item)}
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
          {recents.length === 0 ? (
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                padding: '10px 16px',
                whiteSpace: 'nowrap',
              }}
            >
              Nenhuma visita recente
            </div>
          ) : (
            recents.map(({ label, color, href }) => (
              <RecentItem key={href} label={label} color={color} />
            ))
          )}
        </div>
      </div>

      {/* User profile — bottom of sidebar, only when open */}
      {isOpen && user && (
        <div
          style={{
            marginTop: 'auto',
            padding: '12px 16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: 260,
            flexShrink: 0,
          }}
        >
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              referrerPolicy="no-referrer"
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: 'var(--sun)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                fontWeight: 600,
                color: 'var(--void)',
                flexShrink: 0,
              }}
            >
              {(user.displayName || user.email || '?')[0].toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.displayName || user.email}
            </div>
            <div
              style={{
                fontSize: '0.55rem',
                color: isAdmin ? 'var(--sun)' : 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {role}
            </div>
          </div>
          <button
            onClick={signOut}
            title="Sair"
            aria-label="Sair"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 4,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <LogOut size={14} strokeWidth={1.5} />
          </button>
        </div>
      )}
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
          : 'var(--surface-hover)';
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
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--surface-hover)';
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
