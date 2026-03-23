'use client';

import { useRouter } from 'next/navigation';
import { clients } from '@/data/clients';
import AppHeader from '@/components/layout/AppHeader';
import OrbitalSystem from '@/components/solar/OrbitalSystem';

// Distribute clients across orbits based on skill count
// Sort by skill count ascending to place fewer-skill clients on inner orbits
const sorted = [...clients].sort((a, b) => a.skills.length - b.skills.length);

// 2 inner, 3 middle, 2 outer
const orbitAssignments: { client: typeof clients[number]; orbitIndex: number }[] = [
  ...sorted.slice(0, 2).map((c) => ({ client: c, orbitIndex: 0 })),
  ...sorted.slice(2, 5).map((c) => ({ client: c, orbitIndex: 1 })),
  ...sorted.slice(5, 7).map((c) => ({ client: c, orbitIndex: 2 })),
];

function getLabelPosition(angle: number): 'top' | 'bottom' | 'left' | 'right' {
  // Normalize angle to 0-360
  const a = ((angle % 360) + 360) % 360;
  if (a >= 45 && a < 135) return 'bottom';
  if (a >= 135 && a < 225) return 'left';
  if (a >= 225 && a < 315) return 'top';
  return 'right';
}

function planetSize(skillCount: number): number {
  // Map skill count (3-6) to size (38-48)
  const min = 3, max = 6;
  const clamped = Math.max(min, Math.min(max, skillCount));
  return 38 + ((clamped - min) / (max - min)) * 10;
}

export default function Home() {
  const router = useRouter();

  // Compute even angle distribution per orbit
  const perOrbit: Map<number, typeof orbitAssignments> = new Map();
  for (const entry of orbitAssignments) {
    const list = perOrbit.get(entry.orbitIndex) || [];
    list.push(entry);
    perOrbit.set(entry.orbitIndex, list);
  }

  // Offset per orbit so planets don't align horizontally
  const orbitOffsets = [30, 70, 15];

  const items = Array.from(perOrbit.entries()).flatMap(([orbitIndex, entries]) => {
    const count = entries.length;
    const offset = orbitOffsets[orbitIndex] ?? 0;
    return entries.map((entry, i) => {
      const angle = offset + (360 / count) * i;
      return {
        id: entry.client.slug,
        label: entry.client.name,
        color: entry.client.color,
        size: planetSize(entry.client.skills.length),
        meta: `${entry.client.skills.length} skills`,
        orbitIndex,
        angle,
        labelPosition: getLabelPosition(angle) as 'top' | 'bottom' | 'left' | 'right',
      };
    });
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
          center={{ label: 'Suno', color: 'var(--sun)', size: 80 }}
          orbitRadii={[120, 200, 280]}
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
