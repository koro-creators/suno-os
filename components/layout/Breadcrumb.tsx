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
    <nav className="flex items-center gap-2 text-sm">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.href} className="flex items-center gap-2">
            {i > 0 && <span className="text-text-muted">/</span>}
            <Link
              href={item.href}
              className={
                isLast
                  ? 'text-text-primary'
                  : 'text-text-muted hover:text-text-secondary cursor-pointer transition-colors'
              }
            >
              {item.label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
