'use client';

import React, { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import BackButton from '@/components/layout/BackButton';
import { getClientBySlug, getSkillBySlug, getSkillTypeColor } from '@/lib/utils';
import type { Moon } from '@/lib/types';

const typeLabels: Record<string, string> = {
  criacao: 'Criação',
  midia: 'Mídia',
  planejamento: 'Planejamento',
};

// Moon size: 40-55px
function moonSize(idx: number): number {
  return 40 + (idx % 2) * 15;
}

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

  // Sun center X = left(-180) + 400/2 = 20px from left edge
  const sunCenterX = 20;
  const ORBIT_START = 380;
  const ORBIT_STEP = 150;
  const orbitRadii = moons.map((_, i) => ORBIT_START + i * ORBIT_STEP);
  const yOffsets = [0, 0, 0, 0, 0];

  return (
    <main className="page-enter flex flex-col h-screen overflow-hidden bg-void">
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
        {/* Skill center — anchored to left edge */}
        <div
          style={{
            position: 'absolute',
            left: -180,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: `radial-gradient(circle at 55% 45%, color-mix(in srgb, ${skillColor} 60%, white) 0%, ${skillColor} 40%, color-mix(in srgb, ${skillColor} 70%, black) 100%)`,
            boxShadow: `0 0 100px color-mix(in srgb, ${skillColor} 25%, transparent), 0 0 250px color-mix(in srgb, ${skillColor} 10%, transparent)`,
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              marginLeft: 160,
              textAlign: 'center',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--void)',
                lineHeight: 1.2,
              }}
            >
              {skill.name}
            </div>
            <div
              style={{
                fontSize: '0.55rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'color-mix(in srgb, var(--void) 70%, transparent)',
                marginTop: 4,
              }}
            >
              {typeLabels[skill.type]} · {moons.length} áreas
            </div>
          </div>
        </div>

        {/* Orbit semicircles */}
        {orbitRadii.map((radius, idx) => {
          const diameter = radius * 2;
          return (
            <div
              key={`orbit-${idx}`}
              className="orbit-ring-pulse"
              style={{
                position: 'absolute',
                left: sunCenterX - radius,
                top: `calc(50% - ${radius}px)`,
                width: diameter,
                height: diameter,
                borderRadius: '50%',
                border: `1px solid color-mix(in srgb, ${skillColor} 12%, transparent)`,
                boxShadow: `0 0 8px color-mix(in srgb, ${skillColor} 3%, transparent)`,
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          );
        })}

        {/* Moon planets */}
        {moons.map((moon, idx) => {
          const size = moonSize(idx);
          const radius = orbitRadii[idx];
          const planetX = sunCenterX + radius;
          const yOffset = yOffsets[idx] ?? 0;

          return (
            <MoonPlanet
              key={moon.slug}
              moon={moon}
              size={size}
              color={skillColor}
              planetX={planetX}
              yOffset={yOffset}
              delay={idx * 80}
              onClick={() => router.push(`/${clientSlug}/${skillSlug}/${moon.slug}`)}
            />
          );
        })}

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
          <div style={{ fontSize: '3rem', fontWeight: 200, color: 'rgba(255,255,255,0.05)', lineHeight: 1, letterSpacing: '-0.02em' }}>03</div>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.18)', marginTop: 4 }}>Skill</div>
          <div style={{ fontSize: '0.45rem', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.1)', marginTop: 3 }}>
            {typeLabels[skill.type]} · {moons.length} áreas
          </div>
        </div>
      </div>
    </main>
  );
}

function MoonPlanet({
  moon,
  size,
  color,
  planetX,
  yOffset,
  delay,
  onClick,
}: {
  moon: Moon;
  size: number;
  color: string;
  planetX: number;
  yOffset: number;
  delay: number;
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [navigating, setNavigating] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);
  const ambientGlow = `0 0 8px color-mix(in srgb, ${color} 20%, transparent)`;

  const handleClick = useCallback(() => {
    setNavigating(true);
    onClick();
  }, [onClick]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="orbit-appear"
      role="button"
      tabIndex={0}
      aria-label={`${moon.name} — ${moon.description}`}
      style={{
        position: 'absolute',
        left: planetX - size / 2,
        top: `calc(50% - ${size / 2}px)`,
        width: size,
        height: size,
        cursor: navigating ? 'wait' : 'pointer',
        animationDelay: `${delay}ms`,
        zIndex: 10,
        opacity: navigating ? 0.5 : 1,
        outline: 'none',
        transition: 'opacity 200ms ease',
        pointerEvents: navigating ? 'none' : 'auto',
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={() => setFocusVisible(true)}
      onBlur={() => setFocusVisible(false)}
      onMouseEnter={() => {
        if (ref.current) {
          ref.current.style.transform = 'scale(1.08)';
          ref.current.style.boxShadow = `0 0 24px color-mix(in srgb, ${color} 45%, transparent), 0 0 60px color-mix(in srgb, ${color} 18%, transparent)`;
        }
        if (labelRef.current) labelRef.current.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={() => {
        if (ref.current) {
          ref.current.style.transform = 'scale(1)';
          ref.current.style.boxShadow = ambientGlow;
        }
        if (labelRef.current) labelRef.current.style.color = 'var(--text-secondary)';
      }}
    >
      {/* Label + connector — above the circle */}
      <div
        style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 6,
          pointerEvents: 'none',
        }}
      >
        <span
          ref={labelRef}
          className="solar-label"
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
          {moon.name}
        </span>
        <div
          style={{
            width: 1,
            height: 20,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.04) 100%)',
          }}
        />
      </div>

      {/* Moon circle — aligned to orbit */}
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
