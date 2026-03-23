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

  // 1 skill per orbit — proportional sizes like Solar Series
  const SKILL_ORBIT_START = 170;
  const SKILL_ORBIT_STEP = 45;
  const skillOrbitRadii = filteredSkills.map((_, i) => SKILL_ORBIT_START + i * SKILL_ORBIT_STEP);
  const skillAngles = [30, 160, 280, 75, 210, 330, 120, 250];

  const items = filteredSkills.map((skill, idx) => {
    const skillColor = getSkillTypeColor(skill.type);
    const angle = skillAngles[idx] ?? idx * 51;
    // Bigger planets: 45-85px based on moon count
    const size = 45 + (skill.moons.length / 3) * 40;

    return {
      id: skill.slug,
      label: skill.name,
      color: skillColor,
      size: Math.min(85, Math.max(45, size)),
      orbitIndex: idx,
      angle,
      children: skill.moons.map((moon) => ({
        id: moon.id,
        color: skillColor,
        size: moon.name.length > 5 ? 11 : 10,
      })),
      skill,
    };
  });

  // Count total moons across all skills for metadata
  const totalAreas = client.skills.reduce((sum, s) => sum + s.moons.length, 0);

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
          center={{ label: client.name, color: client.color, size: 200 }}
          orbitRadii={skillOrbitRadii}
          items={items}
          showChildLabels={false}
          onItemClick={(id) => router.push(`/${clientSlug}/${id}`)}
        />

        <FilterPills
          types={['criacao', 'midia', 'planejamento']}
          activeType={activeFilter}
          onFilter={setActiveFilter}
        />

        {/* Improvement 6: Editorial typography block */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 28,
            textAlign: 'right',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              fontSize: '3rem',
              fontWeight: 200,
              color: 'rgba(255,255,255,0.05)',
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            02
          </div>
          <div
            style={{
              fontSize: '0.6rem',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'rgba(255,255,255,0.18)',
              marginTop: 4,
            }}
          >
            Bioma
          </div>
          <div
            style={{
              fontSize: '0.45rem',
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.1)',
              marginTop: 3,
            }}
          >
            {client.skills.length} skills &middot; {totalAreas} áreas
          </div>
        </div>
      </div>
    </main>
  );
}
