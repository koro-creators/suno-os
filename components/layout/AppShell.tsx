'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import ChatPanel from './ChatPanel';

const PUBLIC_PATHS = ['/login'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.includes(pathname);

  // Public pages (login) render without app chrome
  if (isPublic || !user) {
    return <>{children}</>;
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded"
        style={{ backgroundColor: 'var(--sun)', color: 'var(--void)' }}
      >
        Pular para conteúdo
      </a>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>
        <ChatPanel />
      </div>
    </>
  );
}
