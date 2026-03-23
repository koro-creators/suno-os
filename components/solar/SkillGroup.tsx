'use client';

import { Skill } from '@/lib/types';
import { calculatePosition } from '@/hooks/useOrbitalLayout';
import PlanetNode from './PlanetNode';
import TinyMoon from './TinyMoon';
import OrbitRing from './OrbitRing';

interface SkillGroupProps {
  skill: Skill;
  x: number;
  y: number;
  color: string;
  planetSize: number;
  onClick: () => void;
  animationDelay?: number;
}

const MOON_ORBIT_RADIUS = 36;
const MOON_SIZE = 8;

export default function SkillGroup({
  skill,
  x,
  y,
  color,
  planetSize,
  onClick,
  animationDelay,
}: SkillGroupProps) {
  const groupSize = (MOON_ORBIT_RADIUS + MOON_SIZE) * 2;
  const offset = groupSize / 2;

  const moonPositions = skill.moons.map((_, idx) => {
    const angle = (360 / skill.moons.length) * idx + 15;
    return calculatePosition(MOON_ORBIT_RADIUS, angle);
  });

  return (
    <div
      className={animationDelay !== undefined ? 'orbit-appear' : undefined}
      style={{
        position: 'absolute',
        left: `calc(50% + ${x}px - ${offset}px)`,
        top: `calc(50% + ${y}px - ${offset}px)`,
        width: groupSize,
        height: groupSize,
        ...(animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : {}),
      }}
    >
      {/* Micro orbit ring for moons */}
      <OrbitRing radius={MOON_ORBIT_RADIUS} />

      {/* Planet at center of group */}
      <PlanetNode
        color={color}
        size={planetSize}
        label={skill.name}
        labelPosition="bottom"
        x={0}
        y={0}
        onClick={onClick}
      />

      {/* Tiny moons */}
      {skill.moons.map((moon, idx) => (
        <TinyMoon
          key={moon.id}
          color={color}
          size={MOON_SIZE}
          x={moonPositions[idx].x}
          y={moonPositions[idx].y}
        />
      ))}
    </div>
  );
}
