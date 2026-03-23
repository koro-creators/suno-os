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
  /** Optional metadata shown on hover below label */
  meta?: string;
  children?: Array<{ id: string; color: string; size: number }>;
  /** Pass full Skill object when rendering SkillGroups */
  skill?: Skill;
}

interface OrbitalSystemProps {
  center: { label: string; color: string; size: number; showLogo?: boolean };
  orbitRadii: number[];
  items: OrbitalItemConfig[];
  onItemClick: (id: string) => void;
  showChildLabels?: boolean;
  /** Position the center of the system. Default: { top: '50%', left: '50%' } */
  anchorPosition?: { top: string; left: string };
  className?: string;
}

export default function OrbitalSystem({
  center,
  orbitRadii,
  items,
  onItemClick,
  showChildLabels = false,
  anchorPosition,
  className,
}: OrbitalSystemProps) {
  const orbitalItems = items.map((item) => ({
    id: item.id,
    orbitIndex: item.orbitIndex,
    angle: item.angle,
  }));

  const positions = useOrbitalLayout(orbitalItems, orbitRadii);

  const largestRadius = Math.max(...orbitRadii, 0);
  // Extra padding for large planets + labels
  const containerSize = largestRadius * 2 + 200;

  const posMap = new Map(positions.map((p) => [p.id, p]));

  return (
    <div
      className={cn(className)}
      style={{
        position: 'absolute',
        top: anchorPosition?.top ?? '50%',
        left: anchorPosition?.left ?? '50%',
        transform: 'translate(-50%, -50%)',
        width: containerSize,
        height: containerSize,
      }}
    >
      {/* Orbit rings — pass ringIndex for tiered rotation speed */}
      {orbitRadii.map((radius, idx) => (
        <OrbitRing key={idx} radius={radius} ringIndex={idx} />
      ))}

      {/* Connector lines from center to each planet (z below planets) */}
      {items.map((item) => {
        const pos = posMap.get(item.id);
        if (!pos) return null;

        const angle = Math.atan2(pos.y, pos.x);
        const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y);

        return (
          <div
            key={`conn-${item.id}`}
            className="connector-line-pulse"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: dist,
              height: 1,
              transformOrigin: '0 50%',
              transform: `rotate(${angle}rad)`,
              background: 'linear-gradient(90deg, rgba(255,200,1,0.1) 0%, rgba(255,200,1,0.02) 100%)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
        );
      })}

      {/* Center */}
      <CenterNode label={center.label} color={center.color} size={center.size} showLogo={center.showLogo} />

      {/* Items */}
      {items.map((item, idx) => {
        const pos = posMap.get(item.id);
        if (!pos) return null;

        const hasChildren = item.children && item.children.length > 0;
        const staggerDelay = idx * 50;

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
              animationDelay={staggerDelay}
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
              animationDelay={staggerDelay}
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
            meta={item.meta}
            labelPosition={item.labelPosition}
            x={pos.x}
            y={pos.y}
            onClick={() => onItemClick(item.id)}
            animationDelay={staggerDelay}
          />
        );
      })}
    </div>
  );
}
