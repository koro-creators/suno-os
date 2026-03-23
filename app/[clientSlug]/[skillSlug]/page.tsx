'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import BackButton from '@/components/layout/BackButton';
import OrbitalSystem from '@/components/solar/OrbitalSystem';
import { getClientBySlug, getSkillBySlug, getSkillTypeColor } from '@/lib/utils';

const typeLabels: Record<string, string> = {
  criacao: 'Criacao',
  midia: 'Midia',
  planejamento: 'Planejamento',
};

export default function SkillPage({
  params,
}: {
  params: { clientSlug: string; skillSlug: string };
}) {
  const { clientSlug, skillSlug } = params;
  const router = useRouter();
  const client = getClientBySlug(clientSlug);
  const skill = getSkillBySlug(clientSlug, skillSlug);

  if (!client || !skill) {
    redirect(`/${clientSlug}`);
  }

  const skillColor = getSkillTypeColor(skill.type);
  const moons = skill.moons;

  // Distribute moons across 2 orbits: if <=3, orbit 0 only; if >3, distribute
  const items = moons.map((moon, idx) => {
    const orbitIndex = moons.length <= 3 ? 0 : idx < Math.ceil(moons.length / 2) ? 0 : 1;
    const moonsInOrbit = moons.filter((_, i) => {
      if (moons.length <= 3) return true;
      const oi = i < Math.ceil(moons.length / 2) ? 0 : 1;
      return oi === orbitIndex;
    });
    const positionInOrbit = moonsInOrbit.indexOf(moon);
    const orbitOffset = orbitIndex === 0 ? 45 : 20;
    const angle = orbitOffset + (360 / moonsInOrbit.length) * positionInOrbit;

    return {
      id: moon.slug,
      label: moon.name,
      color: skillColor,
      size: 24 + (idx % 2) * 4, // 24-28px
      orbitIndex,
      angle,
      labelPosition: (idx % 2 === 0 ? 'bottom' : 'top') as 'top' | 'bottom',
    };
  });

  const orbitRadii = moons.length <= 3 ? [80] : [80, 140];

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-void">
      <AppHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: client.name, href: `/${clientSlug}` },
          { label: skill.name, href: `/${clientSlug}/${skillSlug}` },
        ]}
        rightLabel={typeLabels[skill.type] || skill.type}
      />

      <div className="px-lg pt-sm">
        <BackButton href={`/${clientSlug}`} label={client.name} />
      </div>

      <div className="flex-1 relative min-h-0">
        <OrbitalSystem
          center={{ label: skill.name, color: skillColor, size: 56 }}
          orbitRadii={orbitRadii}
          items={items}
          showChildLabels={true}
          onItemClick={(id) => router.push(`/${clientSlug}/${skillSlug}/${id}`)}
        />

        {/* Skill type badge below center */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% + 44px)',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            zIndex: 10,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: skillColor,
              boxShadow: `0 0 10px color-mix(in srgb, ${skillColor} 60%, transparent)`,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '0.6rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {typeLabels[skill.type] || skill.type} &middot; {moons.length} areas
          </span>
        </div>
      </div>
    </main>
  );
}
