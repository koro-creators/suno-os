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
  // Map skill count (3-6) to size (28-36)
  const min = 3, max = 6;
  const clamped = Math.max(min, Math.min(max, skillCount));
  return 28 + ((clamped - min) / (max - min)) * 8;
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

  const items = Array.from(perOrbit.entries()).flatMap(([orbitIndex, entries]) => {
    const count = entries.length;
    return entries.map((entry, i) => {
      const angle = (360 / count) * i;
      return {
        id: entry.client.slug,
        label: entry.client.name,
        color: entry.client.color,
        size: planetSize(entry.client.skills.length),
        orbitIndex,
        angle,
        labelPosition: getLabelPosition(angle) as 'top' | 'bottom' | 'left' | 'right',
      };
    });
  });

  return (
    <main className="flex flex-col min-h-screen bg-space">
      <AppHeader
        breadcrumbs={[{ label: 'Home', href: '/' }]}
        rightLabel="7 biomas"
      />

      <div className="flex-1 relative">
        <OrbitalSystem
          center={{ label: 'Suno', color: 'var(--sun)', size: 52 }}
          orbitRadii={[80, 140, 200]}
          items={items}
          onItemClick={(id) => router.push(`/${id}`)}
        />
      </div>
    </main>
  );
}
