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

  // 1 moon per orbit — proportional sizes
  const MOON_ORBIT_START = 130;
  const MOON_ORBIT_STEP = 50;
  const moonOrbitRadii = moons.map((_, i) => MOON_ORBIT_START + i * MOON_ORBIT_STEP);
  const moonAngles = [40, 170, 300, 100, 230];

  const items = moons.map((moon, idx) => {
    const angle = moonAngles[idx] ?? idx * 72;
    return {
      id: moon.slug,
      label: moon.name,
      color: skillColor,
      size: 40 + (idx % 2) * 15,
      orbitIndex: idx,
      angle,
      labelPosition: (angle > 90 && angle < 270 ? 'left' : 'right') as 'left' | 'right',
    };
  });

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

      <div id="main-content" className="flex-1 relative min-h-0">
        <OrbitalSystem
          center={{ label: skill.name, color: skillColor, size: 140 }}
          orbitRadii={moonOrbitRadii}
          items={items}
          showChildLabels={true}
          onItemClick={(id) => router.push(`/${clientSlug}/${skillSlug}/${id}`)}
        />

        {/* Skill type badge below center */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% + 50px)',
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
            03
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
            Skill
          </div>
          <div
            style={{
              fontSize: '0.45rem',
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.1)',
              marginTop: 3,
            }}
          >
            {typeLabels[skill.type] || skill.type} &middot; {moons.length} áreas
          </div>
        </div>
      </div>
    </main>
  );
}
