'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { clients } from '@/data/clients';
import AppHeader from '@/components/layout/AppHeader';

// Sort clients by skill count — fewer skills closer to sun
const sorted = [...clients].sort((a, b) => a.skills.length - b.skills.length);

// Planet sizes: 40-110px based on skill count (like Solar Series)
function planetSize(skillCount: number): number {
  const min = 3, max = 6;
  const clamped = Math.max(min, Math.min(max, skillCount));
  return 40 + ((clamped - min) / (max - min)) * 70;
}

const totalSkills = clients.reduce((sum, c) => sum + c.skills.length, 0);

export default function Home() {
  const router = useRouter();

  return (
    <main className="page-enter flex flex-col h-screen overflow-hidden bg-void">
      <AppHeader
        breadcrumbs={[{ label: 'Home', href: '/' }]}
        rightLabel="7 biomas"
      />

      <div id="main-content" className="flex-1 relative min-h-0">
        {/* Sun — anchored to left edge, half visible */}
        <div
          style={{
            position: 'absolute',
            left: -280,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 620,
            height: 620,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 55% 45%, color-mix(in srgb, var(--sun) 60%, white) 0%, var(--sun) 40%, color-mix(in srgb, var(--sun) 70%, black) 100%)',
            boxShadow: '0 0 150px color-mix(in srgb, var(--sun) 35%, transparent), 0 0 400px color-mix(in srgb, var(--sun) 15%, transparent)',
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: '2.2rem',
              letterSpacing: '-0.02em',
              color: 'var(--void)',
              userSelect: 'none',
              marginLeft: 240,
            }}
          >
            <span style={{ fontWeight: 300 }}>sun</span>
            <span style={{ fontWeight: 700 }}>OS</span>
            <span style={{ opacity: 0.4 }}>.</span>
          </span>
        </div>

        {/* Sun center X coordinate */}
        {(() => {
          // Sun center = left(-280) + 620/2 = 30px from left edge
          const sunCenterX = 30;
          // Planet orbit radii — each planet sits at this distance from sun center
          const orbitRadii = sorted.map((_, idx) => 440 + idx * 130);
          // Slight vertical offsets for organic feel
          const yOffsets = [0, 0, 0, 0, 0, 0, 0];

          return (
            <>
              {/* Orbit semicircles — aligned to each planet */}
              {orbitRadii.map((radius, idx) => {
                const diameter = radius * 2;
                return (
                  <div
                    key={`orbit-semi-${idx}`}
                    style={{
                      position: 'absolute',
                      left: sunCenterX - radius,
                      top: `calc(50% - ${radius}px)`,
                      width: diameter,
                      height: diameter,
                      borderRadius: '50%',
                      border: '1px solid rgba(255,200,1,0.1)',
                      boxShadow: '0 0 8px rgba(255,200,1,0.02), inset 0 0 8px rgba(255,200,1,0.01)',
                      pointerEvents: 'none',
                      zIndex: 1,
                    }}
                  />
                );
              })}

              {/* Planets — absolute positioned on their orbit */}
              {sorted.map((client, idx) => {
                const size = planetSize(client.skills.length);
                const radius = orbitRadii[idx];
                // Planet X = sunCenterX + radius (rightmost point of the semicircle)
                const planetX = sunCenterX + radius;
                const yOffset = yOffsets[idx] ?? 0;

                return (
                  <Planet
                    key={client.slug}
                    client={client}
                    size={size}
                    planetX={planetX}
                    yOffset={yOffset}
                    delay={idx * 80}
                    onClick={() => router.push(`/${client.slug}`)}
                  />
                );
              })}
            </>
          );
        })()}

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
          <div style={{ fontSize: '3rem', fontWeight: 200, color: 'rgba(255,255,255,0.05)', lineHeight: 1, letterSpacing: '-0.02em' }}>01</div>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.18)', marginTop: 4 }}>Sistema Solar</div>
          <div style={{ fontSize: '0.45rem', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.1)', marginTop: 3 }}>{clients.length} biomas &middot; {totalSkills} skills</div>
        </div>
      </div>
    </main>
  );
}

// Planet component with label on top + connector line
function Planet({
  client,
  size,
  planetX,
  yOffset,
  delay,
  onClick,
}: {
  client: typeof clients[number];
  size: number;
  planetX: number;
  yOffset: number;
  delay: number;
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const metaRef = useRef<HTMLSpanElement>(null);
  const [navigating, setNavigating] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);
  const ambientGlow = `0 0 8px color-mix(in srgb, ${client.color} 20%, transparent)`;

  const handleClick = () => {
    setNavigating(true);
    onClick();
  };

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
      aria-label={`${client.name} — ${client.skills.length} skills`}
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
          ref.current.style.boxShadow = `0 0 24px color-mix(in srgb, ${client.color} 45%, transparent), 0 0 60px color-mix(in srgb, ${client.color} 18%, transparent)`;
        }
        if (labelRef.current) labelRef.current.style.color = 'var(--text-primary)';
        if (metaRef.current) metaRef.current.style.color = 'var(--text-secondary)';
      }}
      onMouseLeave={() => {
        if (ref.current) {
          ref.current.style.transform = 'scale(1)';
          ref.current.style.boxShadow = ambientGlow;
        }
        if (labelRef.current) labelRef.current.style.color = 'var(--text-secondary)';
        if (metaRef.current) metaRef.current.style.color = 'var(--text-muted)';
      }}
    >
      {/* Label + meta + connector — positioned above the circle */}
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
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-secondary)',
            transition: 'color 200ms ease',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            marginBottom: 2,
          }}
        >
          {client.name}
        </span>
        <span
          ref={metaRef}
          className="solar-meta"
          style={{
            fontSize: '0.5rem',
            letterSpacing: '0.04em',
            color: 'var(--text-muted)',
            transition: 'color 200ms ease',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            marginBottom: 4,
          }}
        >
          {client.skills.length} skills
        </span>
        <div
          style={{
            width: 1,
            height: 20,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.04) 100%)',
          }}
        />
      </div>

      {/* Planet circle — this is what aligns to the orbit */}
      <div
        ref={ref}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, color-mix(in srgb, ${client.color} 60%, white) 0%, ${client.color} 50%, color-mix(in srgb, ${client.color} 70%, black) 100%)`,
          boxShadow: focusVisible ? `${ambientGlow}, 0 0 0 3px rgba(255,200,1,0.5)` : ambientGlow,
          transition: 'transform 200ms ease-out, box-shadow 200ms ease-out',
        }}
      />
    </div>
  );
}
