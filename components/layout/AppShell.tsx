'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import ChatPanel from './ChatPanel';
import GlobalSearch from '@/components/ui/GlobalSearch';

const PUBLIC_PATHS = ['/login'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!isPublic && !loading && !user) {
      router.replace('/login');
    }
  }, [isPublic, loading, user, router]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (loading || !user) {
    // Sem auth: mostra conteúdo + ChatPanel fixo (sempre visível)
    return (
      <>
        <div style={{ paddingRight: 40 }}>{children}</div>
        <ChatPanel />
      </>
    );
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:py-2 focus:px-4 focus:rounded"
        style={{ backgroundColor: '#FFC801', color: '#080D14' }}
      >
        Pular para conteúdo
      </a>
      <div className="flex h-screen" style={{ paddingRight: 40 }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </div>
      <ChatPanel />
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
