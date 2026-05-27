'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Settings, Sun } from '@carbon/icons-react';
import Logo from './Logo';
import Breadcrumb from './Breadcrumb';
import { useTheme } from './ThemeProvider';

interface AppHeaderProps {
  breadcrumbs: { label: string; href: string }[];
  rightLabel?: string;
  rightSection?: ReactNode;
}

export default function AppHeader({ breadcrumbs, rightLabel, rightSection }: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-lg py-sm"
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        backgroundColor: 'var(--header-bg)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <Logo />

      <Breadcrumb items={breadcrumbs} />

      <div className="flex items-center gap-3">
        {rightSection}
        {rightLabel && (
          <span
            className="text-text-muted uppercase select-none"
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.12em',
              padding: '0.25rem 0.6rem',
              border: '1px solid var(--border-subtle)',
              borderRadius: '9999px',
            }}
          >
            {rightLabel}
          </span>
        )}

        {/* Skills */}
        <button
          aria-label="Skills"
          title="Skills"
          onClick={() => router.push('/skills')}
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: '9999px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'color 200ms ease, border-color 200ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
          }}
        >
          <Settings size={12} />
        </button>

        {/* Theme toggle */}
        <button
          aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          onClick={toggleTheme}
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: '9999px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'color 200ms ease, border-color 200ms ease, transform 200ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'rotate(180deg)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'rotate(0deg)';
          }}
        >
          {theme === 'dark' ? (
            <Sun size={12} />
          ) : (
            <Moon size={12} />
          )}
        </button>

        {/* Avatar */}
        <div
          className="rounded-full bg-nebula flex-shrink-0"
          style={{
            width: 28,
            height: 28,
            border: '1px solid var(--border-subtle)',
          }}
        />
      </div>
    </header>
  );
}
