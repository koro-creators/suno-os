'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { SkillsProvider } from '@/contexts/SkillsContext';
import { BibliotecaProvider } from '@/contexts/BibliotecaContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SkillsProvider>
        <BibliotecaProvider>
          {children}
        </BibliotecaProvider>
      </SkillsProvider>
    </ThemeProvider>
  );
}
