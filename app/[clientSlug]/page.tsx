'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import OrbitalSystem from '@/components/solar/OrbitalSystem';
import FilterPills from '@/components/solar/FilterPills';
import { getClientBySlug, getSkillTypeColor } from '@/lib/utils';
import { SkillType } from '@/lib/types';

export default function ClientPage({
  params,
}: {
  params: { clientSlug: string };
}) {
  const { clientSlug } = params;
  const router = useRouter();
  const client = getClientBySlug(clientSlug);

  if (!client) {
    redirect('/');
  }

  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filteredSkills = activeFilter
    ? client.skills.filter((s) => s.type === activeFilter)
    : client.skills;

  // Distribute skills evenly across 3 orbits with angular offsets
  const orbitOffsets = [40, 85, 10];
  const items = filteredSkills.map((skill, idx) => {
    const orbitIndex = idx % 3;
    const skillsInOrbit = filteredSkills.filter((_, i) => i % 3 === orbitIndex);
    const positionInOrbit = skillsInOrbit.indexOf(skill);
    const offset = orbitOffsets[orbitIndex] ?? 0;
    const angle = offset + (360 / skillsInOrbit.length) * positionInOrbit;
    const skillColor = getSkillTypeColor(skill.type);
    const size = 32 + (skill.moons.length / 3) * 4; // 32-36px based on moons

    return {
      id: skill.slug,
      label: skill.name,
      color: skillColor,
      size: Math.min(36, Math.max(32, size)),
      orbitIndex,
      angle,
      children: skill.moons.map((moon) => ({
        id: moon.id,
        color: skillColor,
        size: moon.name.length > 5 ? 9 : 8,
      })),
      skill,
    };
  });

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-void">
      <AppHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: client.name, href: `/${clientSlug}` },
        ]}
        rightLabel={`${client.skills.length} skills`}
      />

      <div className="flex-1 relative min-h-0">
        <OrbitalSystem
          center={{ label: client.name, color: client.color, size: 60 }}
          orbitRadii={[90, 160, 220]}
          items={items}
          showChildLabels={false}
          onItemClick={(id) => router.push(`/${clientSlug}/${id}`)}
        />

        <FilterPills
          types={['criacao', 'midia', 'planejamento']}
          activeType={activeFilter}
          onFilter={setActiveFilter}
        />
      </div>
    </main>
  );
}
