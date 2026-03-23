'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';
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
    <main className="flex flex-col h-screen overflow-hidden bg-void">
      <AppHeader
        breadcrumbs={[{ label: 'Home', href: '/' }]}
        rightLabel="7 biomas"
      />

      <div className="flex-1 relative min-h-0 flex items-center">
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

        {/* Orbit semicircles — centered on sun position, right half visible */}
        {sorted.map((_, idx) => {
          // Sun center is at x=30 (620/2 - 280), semicircles radiate from there
          const radius = 350 + idx * 130;
          const diameter = radius * 2;
          return (
            <div
              key={`orbit-semi-${idx}`}
              style={{
                position: 'absolute',
                left: 30 - radius,
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

        {/* Planets — horizontal row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            marginLeft: 360,
            marginRight: 40,
            flex: 1,
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {sorted.map((client, idx) => {
            const size = planetSize(client.skills.length);
            // Slight vertical offset for organic feel
            const yOffset = [12, -18, 8, -25, 15, -12, 20][idx] ?? 0;

            return (
              <Planet
                key={client.slug}
                client={client}
                size={size}
                yOffset={yOffset}
                delay={idx * 80}
                onClick={() => router.push(`/${client.slug}`)}
              />
            );
          })}
        </div>

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
  yOffset,
  delay,
  onClick,
}: {
  client: typeof clients[number];
  size: number;
  yOffset: number;
  delay: number;
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const metaRef = useRef<HTMLSpanElement>(null);
  const ambientGlow = `0 0 8px color-mix(in srgb, ${client.color} 20%, transparent)`;

  return (
    <div
      className="orbit-appear planet-float"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        cursor: 'pointer',
        transform: `translateY(${yOffset}px)`,
        animationDelay: `${delay}ms`,
      }}
      onClick={onClick}
      onMouseEnter={() => {
        if (ref.current) {
          ref.current.style.transform = 'scale(1.08)';
          ref.current.style.boxShadow = `0 0 24px color-mix(in srgb, ${client.color} 45%, transparent), 0 0 60px color-mix(in srgb, ${client.color} 18%, transparent)`;
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
      {/* Label on top */}
      <span
        ref={labelRef}
        style={{
          fontSize: '0.65rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-secondary)',
          transition: 'color 200ms ease',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          marginBottom: 4,
        }}
      >
        {client.name}
      </span>

      {/* Meta (appears on hover) */}
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
        {client.skills.length} skills
      </span>

      {/* Connector line */}
      <div
        style={{
          width: 1,
          height: 24,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.04) 100%)',
          marginBottom: 6,
        }}
      />

      {/* Planet circle */}
      <div
        ref={ref}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, color-mix(in srgb, ${client.color} 60%, white) 0%, ${client.color} 50%, color-mix(in srgb, ${client.color} 70%, black) 100%)`,
          boxShadow: ambientGlow,
          transition: 'transform 200ms ease-out, box-shadow 200ms ease-out',
          flexShrink: 0,
        }}
      />
    </div>
  );
}
