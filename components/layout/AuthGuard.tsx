'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const PUBLIC_PATHS = ['/login'];
const ADMIN_PATHS = ['/skills', '/biblioteca', '/clientes'];

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Dev bypass — skip auth in local development
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev && !user && !loading) {
    return <>{children}</>;
  }

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const needsAdmin = isAdminPath(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) {
      router.replace('/login');
    }
    if (user && isPublic) {
      router.replace('/');
    }
    if (user && needsAdmin && !isAdmin) {
      router.replace('/');
    }
  }, [user, loading, isPublic, needsAdmin, isAdmin, router]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'var(--void)',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
        }}
      >
        Carregando...
      </div>
    );
  }

  if (!user && !isPublic) return null;
  if (user && isPublic) return null;
  if (user && needsAdmin && !isAdmin) return null;

  return <>{children}</>;
}
