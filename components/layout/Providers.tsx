'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { SkillsProvider } from '@/contexts/SkillsContext';
import { BibliotecaProvider } from '@/contexts/BibliotecaContext';
import { ClientsProvider } from '@/contexts/ClientsContext';
import { WorkflowsProvider } from '@/contexts/WorkflowsContext';
import { ApprovalsProvider } from '@/contexts/ApprovalsContext';
import { MeetingsProvider } from '@/contexts/MeetingsContext';
import { OnboardingOraculoProvider } from '@/contexts/OnboardingOraculoContext';
import AuthGuard from './AuthGuard';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGuard>
          <SkillsProvider>
            <BibliotecaProvider>
              <ClientsProvider>
                <WorkflowsProvider>
                  <ApprovalsProvider>
                    <MeetingsProvider>
                      <OnboardingOraculoProvider>
                        {children}
                      </OnboardingOraculoProvider>
                    </MeetingsProvider>
                  </ApprovalsProvider>
                </WorkflowsProvider>
              </ClientsProvider>
            </BibliotecaProvider>
          </SkillsProvider>
        </AuthGuard>
      </AuthProvider>
    </ThemeProvider>
  );
}
