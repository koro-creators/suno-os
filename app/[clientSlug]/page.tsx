'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import FilterPills from '@/components/solar/FilterPills';
import { getClientBySlug, getSkillTypeColor } from '@/lib/utils';
import type { Skill } from '@/lib/types';

// Skill size based on moon count: 45-90px
function skillSize(moonCount: number): number {
  const min = 2, max = 3;
  const clamped = Math.max(min, Math.min(max, moonCount));
  return 45 + ((clamped - min) / (max - min)) * 45;
}

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

  const totalAreas = client.skills.reduce((sum, s) => sum + s.moons.length, 0);

  // Sun center X = left(-220) + 500/2 = 30px from left edge
  const sunCenterX = 30;
  const ORBIT_START = 300;
  const ORBIT_STEP = 140;
  const orbitRadii = filteredSkills.map((_, i) => ORBIT_START + i * ORBIT_STEP);
  const yOffsets = [12, -22, 16, -28, 20, -15, 24, -10];

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
        {/* Client center — anchored to left edge */}
        <div
          style={{
            position: 'absolute',
            left: -220,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: `radial-gradient(circle at 55% 45%, color-mix(in srgb, ${client.color} 60%, white) 0%, ${client.color} 40%, color-mix(in srgb, ${client.color} 70%, black) 100%)`,
            boxShadow: `0 0 120px color-mix(in srgb, ${client.color} 30%, transparent), 0 0 300px color-mix(in srgb, ${client.color} 12%, transparent)`,
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: '1.6rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--void)',
              userSelect: 'none',
              marginLeft: 200,
            }}
          >
            {client.name}
          </span>
        </div>

        {/* Orbit semicircles + skill planets */}
        {orbitRadii.map((radius, idx) => {
          const diameter = radius * 2;
          return (
            <div
              key={`orbit-${idx}`}
              style={{
                position: 'absolute',
                left: sunCenterX - radius,
                top: `calc(50% - ${radius}px)`,
                width: diameter,
                height: diameter,
                borderRadius: '50%',
                border: `1px solid color-mix(in srgb, ${client.color} 12%, transparent)`,
                boxShadow: `0 0 8px color-mix(in srgb, ${client.color} 3%, transparent)`,
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          );
        })}

        {filteredSkills.map((skill, idx) => {
          const size = skillSize(skill.moons.length);
          const radius = orbitRadii[idx];
          const planetX = sunCenterX + radius;
          const yOffset = yOffsets[idx] ?? 0;

          return (
            <SkillPlanet
              key={skill.slug}
              skill={skill}
              size={size}
              planetX={planetX}
              yOffset={yOffset}
              delay={idx * 80}
              onClick={() => router.push(`/${clientSlug}/${skill.slug}`)}
            />
          );
        })}

        <FilterPills
          types={['criacao', 'midia', 'planejamento']}
          activeType={activeFilter}
          onFilter={setActiveFilter}
        />

        {/* Editorial typography */}
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
          <div style={{ fontSize: '3rem', fontWeight: 200, color: 'rgba(255,255,255,0.05)', lineHeight: 1, letterSpacing: '-0.02em' }}>02</div>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.18)', marginTop: 4 }}>Bioma</div>
          <div style={{ fontSize: '0.45rem', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.1)', marginTop: 3 }}>
            {client.skills.length} skills &middot; {totalAreas} áreas
          </div>
        </div>
      </div>
    </main>
  );
}

function SkillPlanet({
  skill,
  size,
  planetX,
  yOffset,
  delay,
  onClick,
}: {
  skill: Skill;
  size: number;
  planetX: number;
  yOffset: number;
  delay: number;
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const metaRef = useRef<HTMLSpanElement>(null);
  const color = getSkillTypeColor(skill.type);
  const ambientGlow = `0 0 8px color-mix(in srgb, ${color} 20%, transparent)`;

  const typeLabel: Record<string, string> = {
    criacao: 'Criação',
    midia: 'Mídia',
    planejamento: 'Planejamento',
  };

  return (
    <div
      className="orbit-appear planet-float"
      style={{
        position: 'absolute',
        left: planetX - size / 2,
        top: '50%',
        transform: `translateY(calc(-50% + ${yOffset}px))`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        animationDelay: `${delay}ms`,
        zIndex: 10,
      }}
      onClick={onClick}
      onMouseEnter={() => {
        if (ref.current) {
          ref.current.style.transform = 'scale(1.08)';
          ref.current.style.boxShadow = `0 0 24px color-mix(in srgb, ${color} 45%, transparent), 0 0 60px color-mix(in srgb, ${color} 18%, transparent)`;
        }
        if (labelRef.current) labelRef.current.style.color = 'var(--text-primary)';
        if (metaRef.current) metaRef.current.style.color = 'var(--text-muted)';
      }}
      onMouseLeave={() => {
        if (ref.current) {
          ref.current.style.transform = 'scale(1)';
          ref.current.style.boxShadow = ambientGlow;
        }
        if (labelRef.current) labelRef.current.style.color = 'var(--text-secondary)';
        if (metaRef.current) metaRef.current.style.color = 'transparent';
      }}
    >
      {/* Label */}
      <span
        ref={labelRef}
        style={{
          fontSize: '0.6rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-secondary)',
          transition: 'color 200ms ease',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          marginBottom: 4,
        }}
      >
        {skill.name}
      </span>

      {/* Meta */}
      <span
        ref={metaRef}
        style={{
          fontSize: '0.5rem',
          letterSpacing: '0.04em',
          color: 'transparent',
          transition: 'color 200ms ease',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          marginBottom: 4,
        }}
      >
        {typeLabel[skill.type]} · {skill.moons.length} áreas
      </span>

      {/* Connector line */}
      <div
        style={{
          width: 1,
          height: 20,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.04) 100%)',
          marginBottom: 6,
        }}
      />

      {/* Planet */}
      <div
        ref={ref}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, color-mix(in srgb, ${color} 60%, white) 0%, ${color} 50%, color-mix(in srgb, ${color} 70%, black) 100%)`,
          boxShadow: ambientGlow,
          transition: 'transform 200ms ease-out, box-shadow 200ms ease-out',
          flexShrink: 0,
        }}
      />
    </div>
  );
}
