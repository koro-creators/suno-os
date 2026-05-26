'use client';

const DEFAULT_TABS = ['Identidade', 'Skills', 'Biblioteca', 'Métricas'];

interface ClientEditorTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  /** Override the tab list — used to add admin-only tabs (e.g. 'Drive'). */
  tabs?: string[];
}

export default function ClientEditorTabs({
  activeTab,
  onTabChange,
  tabs = DEFAULT_TABS,
}: ClientEditorTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Seções do cliente"
      style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: 24,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab)}
            onKeyDown={(e) => {
              const idx = tabs.indexOf(tab);
              if (e.key === 'ArrowRight') onTabChange(tabs[(idx + 1) % tabs.length]);
              if (e.key === 'ArrowLeft') onTabChange(tabs[(idx - 1 + tabs.length) % tabs.length]);
            }}
            style={{
              padding: '10px 16px',
              fontSize: '0.8rem',
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--sun)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'color 150ms ease, border-color 150ms ease',
            }}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
