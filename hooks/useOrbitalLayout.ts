'use client';

import { useMemo } from 'react';

export interface OrbitalItem {
  id: string;
  orbitIndex: number;
  angle?: number;
}

export interface Position {
  id: string;
  x: number;
  y: number;
}

export function calculatePosition(
  radius: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.round(radius * Math.cos(rad) * 100) / 100,
    y: Math.round(-radius * Math.sin(rad) * 100) / 100,
  };
}

export function useOrbitalLayout(
  items: OrbitalItem[],
  orbitRadii: number[],
): Position[] {
  return useMemo(() => {
    // Group items by orbit index
    const byOrbit = new Map<number, OrbitalItem[]>();
    for (const item of items) {
      const list = byOrbit.get(item.orbitIndex) ?? [];
      list.push(item);
      byOrbit.set(item.orbitIndex, list);
    }

    const positions: Position[] = [];

    const orbitKeys = Array.from(byOrbit.keys());
    for (let k = 0; k < orbitKeys.length; k++) {
      const orbitIndex = orbitKeys[k];
      const orbitItems = byOrbit.get(orbitIndex)!;
      const radius = orbitRadii[orbitIndex] ?? 100;
      // Deterministic offset based on orbit index so it looks organic
      const offset = orbitIndex * 37;
      const withoutAngle = orbitItems.filter((i: OrbitalItem) => i.angle === undefined);
      const withAngle = orbitItems.filter((i: OrbitalItem) => i.angle !== undefined);

      // Fixed-angle items
      for (const item of withAngle) {
        const pos = calculatePosition(radius, item.angle!);
        positions.push({ id: item.id, ...pos });
      }

      // Evenly distributed items
      const step = 360 / (withoutAngle.length || 1);
      for (let idx = 0; idx < withoutAngle.length; idx++) {
        const item = withoutAngle[idx];
        const angle = offset + idx * step;
        const pos = calculatePosition(radius, angle);
        positions.push({ id: item.id, ...pos });
      }
    }

    return positions;
  }, [items, orbitRadii]);
}
