'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import ChatInterface from '@/components/chat/ChatInterface';
import { getClientBySlug, getSkillBySlug, getSkillTypeColor } from '@/lib/utils';
import { useBiblioteca } from '@/contexts/BibliotecaContext';
import { useSkills } from '@/contexts/SkillsContext';
import type { Moon } from '@/lib/types';

const typeLabels: Record<string, string> = {
  criacao: 'Criação',
  midia: 'Mídia',
  planejamento: 'Planejamento',
};

/* ─── Moon Chips ─────────────────────────────────── */

function MoonChips({ moons, selected, onSelect }: {
  moons: Moon[];
  selected: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div style={{
      display: 'flex', gap: 6, padding: '8px 24px',
      borderBottom: '1px solid var(--border-subtle)',
      overflowX: 'auto',
    }}>
      {moons.map((moon) => {
        const isActive = moon.slug === selected;
        return (
          <button
            key={moon.slug}
            onClick={() => onSelect(moon.slug)}
            title={moon.description}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 9999,
              fontSize: '0.7rem', fontWeight: 500,
              border: `1px solid ${isActive ? 'var(--sun)' : 'var(--border-subtle)'}`,
              backgroundColor: isActive ? 'rgba(255,200,1,0.1)' : 'transparent',
              color: isActive ? 'var(--sun)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {isActive && (
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                backgroundColor: 'var(--sun)',
              }} />
            )}
            {moon.name}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Skill Page (Level 3 — Chat with Moon Chips) ── */

export default function SkillPage({
  params,
}: {
  params: { clientSlug: string; skillSlug: string };
}) {
  const { clientSlug, skillSlug } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { documents } = useBiblioteca();
  const { skills: adminSkills } = useSkills();

  const client = getClientBySlug(clientSlug);
  if (!client) {
    redirect('/');
  }

  const skill = getSkillBySlug(clientSlug, skillSlug);
  if (!skill) {
    redirect(`/${clientSlug}`);
  }

  const skillColor = getSkillTypeColor(skill.type);

  // Dynamic moons: prefer moons from SkillsContext (editable admin data) over
  // static moons from data/clients.ts. Fall back when admin skill is not found,
  // not assigned to this client, not active, or has no moons configured.
  const adminSkill = adminSkills.find(
    (s) =>
      s.slug === skillSlug &&
      s.assignedClients.includes(clientSlug) &&
      s.status === 'active' &&
      s.moons.length > 0
  );
  const moons: Moon[] = adminSkill?.moons ?? skill.moons;

  // Resolve initial moon from query param or default to first
  const moonParam = searchParams.get('moon');
  const initialMoon = moons.find((m) => m.slug === moonParam) ?? moons[0];

  const [selectedMoonSlug, setSelectedMoonSlug] = useState(initialMoon?.slug ?? '');

  const selectedMoon = moons.find((m) => m.slug === selectedMoonSlug) ?? moons[0];

  // Auto-select documents based on scope and tags
  const candidateDocs = documents.filter(
    (d) => d.scope.includes(clientSlug) || d.scope.includes('suno')
  );
  const autoActiveIds = candidateDocs
    .filter(
      (d) =>
        d.tags.includes(skill.type) ||
        d.tags.includes('tom-de-voz')
    )
    .map((d) => d.id);

  const handleMoonSelect = useCallback((slug: string) => {
    setSelectedMoonSlug(slug);
    // Update URL query param without full navigation
    router.replace(`/${clientSlug}/${skillSlug}?moon=${slug}`, { scroll: false });
  }, [clientSlug, skillSlug, router]);

  return (
    <main className="page-enter flex flex-col h-screen bg-space">
      <AppHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: client.name, href: `/${clientSlug}` },
          { label: skill.name, href: `/${clientSlug}/${skillSlug}` },
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
          key={selectedMoonSlug}
          moonSlug={selectedMoonSlug}
          skillSlug={skillSlug}
          clientSlug={clientSlug}
          clientName={client.name}
          clientColor={client.color}
          documents={candidateDocs}
          initialActiveDocIds={autoActiveIds}
          moons={moons}
          onMoonSelect={handleMoonSelect}
        />
      </div>
    </main>
  );
}
