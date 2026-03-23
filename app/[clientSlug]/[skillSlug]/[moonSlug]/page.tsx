'use client';

import React from 'react';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import ChatInterface from '@/components/chat/ChatInterface';
import { bibliotecaByClient } from '@/data/biblioteca';
import { getClientBySlug, getSkillBySlug, getMoonBySlug, getSkillTypeColor } from '@/lib/utils';

const typeLabels: Record<string, string> = {
  criacao: 'Criacao',
  midia: 'Midia',
  planejamento: 'Planejamento',
};

export default function MoonPage({
  params,
}: {
  params: { clientSlug: string; skillSlug: string; moonSlug: string };
}) {
  const { clientSlug, skillSlug, moonSlug } = params;

  const client = getClientBySlug(clientSlug);
  if (!client) {
    redirect('/');
  }

  const skill = getSkillBySlug(clientSlug, skillSlug);
  if (!skill) {
    redirect(`/${clientSlug}`);
  }

  const moon = getMoonBySlug(clientSlug, skillSlug, moonSlug);
  if (!moon) {
    redirect(`/${clientSlug}/${skillSlug}`);
  }

  const skillColor = getSkillTypeColor(skill.type);

  return (
    <main className="flex flex-col h-screen bg-space">
      <AppHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: client.name, href: `/${clientSlug}` },
          { label: skill.name, href: `/${clientSlug}/${skillSlug}` },
          { label: moon.name, href: `/${clientSlug}/${skillSlug}/${moonSlug}` },
        ]}
        rightSection={
          <div className="flex items-center gap-2">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: skillColor,
                boxShadow: `0 0 10px color-mix(in srgb, ${skillColor} 60%, transparent)`,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span
              className="text-text-muted uppercase select-none"
              style={{
                fontSize: '0.6rem',
                letterSpacing: '0.12em',
              }}
            >
              {typeLabels[skill.type] || skill.type}
            </span>
          </div>
        }
      />

      <div id="main-content" className="flex-1 overflow-hidden">
        <ChatInterface
          moonSlug={moonSlug}
          clientSlug={clientSlug}
          biblioteca={bibliotecaByClient[clientSlug] || []}
        />
      </div>
    </main>
  );
}
