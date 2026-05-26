import Link from 'next/link';
import { ArrowLeft } from '@carbon/icons-react';

interface BackButtonProps {
  href: string;
  label: string;
}

export default function BackButton({ href, label }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-xs text-text-muted border border-orbit-line rounded-pill px-3 py-1.5 cursor-pointer hover:text-text-secondary hover:border-orbit-hover transition-colors"
    >
      <ArrowLeft size={14} />
      <span>{label}</span>
    </Link>
  );
}
