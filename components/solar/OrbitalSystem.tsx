'use client';

import { useOrbitalLayout } from '@/hooks/useOrbitalLayout';
import { cn } from '@/lib/utils';
import { Skill } from '@/lib/types';
import OrbitRing from './OrbitRing';
import CenterNode from './CenterNode';
import PlanetNode from './PlanetNode';
import SkillGroup from './SkillGroup';
import MoonNode from './MoonNode';

interface OrbitalItemConfig {
  id: string;
  label: string;
  color: string;
  size: number;
  orbitIndex: number;
  angle?: number;
  labelPosition?: 'top' | 'bottom' | 'left' | 'right';
  children?: Array<{ id: string; color: string; size: number }>;
  /** Pass full Skill object when rendering SkillGroups */
  skill?: Skill;
}

interface OrbitalSystemProps {
  center: { label: string; color: string; size: number };
  orbitRadii: number[];
  items: OrbitalItemConfig[];
  onItemClick: (id: string) => void;
  showChildLabels?: boolean;
  className?: string;
}

export default function OrbitalSystem({
  center,
  orbitRadii,
  items,
  onItemClick,
  showChildLabels = false,
  className,
}: OrbitalSystemProps) {
  const orbitalItems = items.map((item) => ({
    id: item.id,
    orbitIndex: item.orbitIndex,
    angle: item.angle,
  }));

  const positions = useOrbitalLayout(orbitalItems, orbitRadii);

  const largestRadius = Math.max(...orbitRadii, 0);
  const containerSize = largestRadius * 2 + 80; // padding for labels

  const posMap = new Map(positions.map((p) => [p.id, p]));

  return (
    <div
      className={cn(className)}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: containerSize,
        height: containerSize,
      }}
    >
      {/* Orbit rings */}
      {orbitRadii.map((radius, idx) => (
        <OrbitRing key={idx} radius={radius} />
      ))}

      {/* Center */}
      <CenterNode label={center.label} color={center.color} size={center.size} />

      {/* Items */}
      {items.map((item) => {
        const pos = posMap.get(item.id);
        if (!pos) return null;

        const hasChildren = item.children && item.children.length > 0;

        // Level 3: moon nodes with labels
        if (showChildLabels) {
          return (
            <MoonNode
              key={item.id}
              color={item.color}
              size={item.size}
              label={item.label}
              labelPosition={item.labelPosition}
              x={pos.x}
              y={pos.y}
              onClick={() => onItemClick(item.id)}
            />
          );
        }

        // Level 2: skill groups with tiny moons (no labels on moons)
        if (hasChildren && item.skill) {
          return (
            <SkillGroup
              key={item.id}
              skill={item.skill}
              x={pos.x}
              y={pos.y}
              color={item.color}
              planetSize={item.size}
              onClick={() => onItemClick(item.id)}
            />
          );
        }

        // Default: simple planet node
        return (
          <PlanetNode
            key={item.id}
            color={item.color}
            size={item.size}
            label={item.label}
            labelPosition={item.labelPosition}
            x={pos.x}
            y={pos.y}
            onClick={() => onItemClick(item.id)}
          />
        );
      })}
    </div>
  );
}
