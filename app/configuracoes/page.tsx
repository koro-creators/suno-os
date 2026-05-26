'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/layout/AppHeader';
import UsuariosTab from '@/components/admin/configuracoes/UsuariosTab';
import IntegracoesTab from '@/components/admin/configuracoes/IntegracoesTab';
import SkillsDefaultsTab from '@/components/admin/configuracoes/SkillsDefaultsTab';
import AuditoriaTab from '@/components/admin/configuracoes/AuditoriaTab';

const TABS = ['Usuários', 'Integrações', 'Skills/Modelos', 'Auditoria'] as const;
type Tab = (typeof TABS)[number];

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Usuários');
  const { isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/404');
  }, [isAdmin, loading, router]);

  // While loading or if not admin, render nothing (redirect is in-flight)
  if (loading || !isAdmin) return null;

  return (
    <>
      <AppHeader
        breadcrumbs={[{ label: 'Configurações', href: '/configuracoes' }]}
        rightLabel="Admin"
      />
      <main
        id="main-content"
        className="page-enter"
        style={{ flex: 1, overflow: 'auto', padding: 24 }}
      >
        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            marginBottom: 24,
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                borderBottom:
                  activeTab === tab ? '2px solid var(--sun)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'color 150ms ease',
                marginBottom: -1,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'Usuários' && <UsuariosTab />}
        {activeTab === 'Integrações' && <IntegracoesTab />}
        {activeTab === 'Skills/Modelos' && <SkillsDefaultsTab />}
        {activeTab === 'Auditoria' && <AuditoriaTab />}
      </main>
    </>
  );
}
