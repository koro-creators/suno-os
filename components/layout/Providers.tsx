'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { SkillsProvider } from '@/contexts/SkillsContext';
import { BibliotecaProvider } from '@/contexts/BibliotecaContext';
import { ClientsProvider } from '@/contexts/ClientsContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SkillsProvider>
        <BibliotecaProvider>
          <ClientsProvider>
            {children}
          </ClientsProvider>
        </BibliotecaProvider>
      </SkillsProvider>
    </ThemeProvider>
  );
}
