import Logo from './Logo';
import Breadcrumb from './Breadcrumb';

interface AppHeaderProps {
  breadcrumbs: { label: string; href: string }[];
  rightLabel?: string;
}

export default function AppHeader({ breadcrumbs, rightLabel }: AppHeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-lg py-sm"
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(8, 13, 20, 0.7)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <Logo />

      <Breadcrumb items={breadcrumbs} />

      <div className="flex items-center gap-3">
        {rightLabel && (
          <span
            className="text-text-muted uppercase select-none"
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.12em',
              padding: '0.25rem 0.6rem',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '9999px',
            }}
          >
            {rightLabel}
          </span>
        )}

        <div
          className="rounded-full bg-nebula flex-shrink-0"
          style={{
            width: 28,
            height: 28,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        />
      </div>
    </header>
  );
}
