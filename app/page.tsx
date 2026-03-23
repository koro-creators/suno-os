'use client';

import { useRouter } from 'next/navigation';
import { clients } from '@/data/clients';
import AppHeader from '@/components/layout/AppHeader';
import OrbitalSystem from '@/components/solar/OrbitalSystem';

// Sort clients by skill count — fewer skills closer to sun
const sorted = [...clients].sort((a, b) => a.skills.length - b.skills.length);

// 1 planet per orbit — 7 orbits for 7 clients
// Sun is 320px (radius 160), orbits start at 210 and increase
const ORBIT_START = 210;
const ORBIT_STEP = 36;
const orbitRadii = sorted.map((_, i) => ORBIT_START + i * ORBIT_STEP);

// Each planet gets a unique angle — spread them organically
const planetAngles = [25, 155, 290, 70, 200, 340, 110];

function getLabelPosition(angle: number): 'top' | 'bottom' | 'left' | 'right' {
  const a = ((angle % 360) + 360) % 360;
  if (a >= 45 && a < 135) return 'bottom';
  if (a >= 135 && a < 225) return 'left';
  if (a >= 225 && a < 315) return 'top';
  return 'right';
}

function planetSize(skillCount: number): number {
  const min = 3, max = 6;
  const clamped = Math.max(min, Math.min(max, skillCount));
  return 32 + ((clamped - min) / (max - min)) * 12;
}

export default function Home() {
  const router = useRouter();

  const items = sorted.map((client, idx) => {
    const angle = planetAngles[idx] ?? idx * 51;
    return {
      id: client.slug,
      label: client.name,
      color: client.color,
      size: planetSize(client.skills.length),
      meta: `${client.skills.length} skills`,
      orbitIndex: idx,
      angle,
      labelPosition: getLabelPosition(angle) as 'top' | 'bottom' | 'left' | 'right',
    };
  });

  // Count total skills across all clients for metadata
  const totalSkills = clients.reduce((sum, c) => sum + c.skills.length, 0);

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-void">
      <AppHeader
        breadcrumbs={[{ label: 'Home', href: '/' }]}
        rightLabel="7 biomas"
      />

      <div className="flex-1 relative min-h-0">
        <OrbitalSystem
          center={{ label: 'Suno', color: 'var(--sun)', size: 320 }}
          orbitRadii={orbitRadii}
          items={items}
          onItemClick={(id) => router.push(`/${id}`)}
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
            01
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
            Sistema Solar
          </div>
          <div
            style={{
              fontSize: '0.45rem',
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.1)',
              marginTop: 3,
            }}
          >
            {clients.length} biomas &middot; {totalSkills} skills
          </div>
        </div>
      </div>
    </main>
  );
}
