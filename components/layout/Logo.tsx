import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: string;
}

export default function Logo({ size = 'text-lg' }: LogoProps) {
  return (
    <Link href="/" className={cn('cursor-pointer', size)}>
      <span className="font-light">sun</span>
      <span className="font-semibold">OS</span>
      <span className="text-sun">.</span>
    </Link>
  );
}
