import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Navegação" className="flex items-center gap-2 text-sm">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.href} className="flex items-center gap-2">
            {i > 0 && <span className="text-text-muted">/</span>}
            <Link
              href={item.href}
              className={
                isLast
                  ? 'text-text-primary flex items-center gap-1.5'
                  : 'text-text-muted hover:text-text-secondary cursor-pointer transition-colors'
              }
            >
              {isLast && (
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: 'var(--sun)',
                    boxShadow: '0 0 6px rgba(255, 200, 1, 0.6)',
                    flexShrink: 0,
                  }}
                />
              )}
              {item.label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
