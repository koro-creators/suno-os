'use client';

import { useRef } from 'react';

interface PlanetNodeProps {
  color: string;
  size: number;
  label?: string;
  labelPosition?: 'top' | 'bottom' | 'left' | 'right';
  x: number;
  y: number;
  onClick?: () => void;
}

const labelStyles: Record<string, React.CSSProperties> = {
  top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 },
  bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 },
  left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 6 },
  right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 6 },
};

export default function PlanetNode({
  color,
  size,
  label,
  labelPosition = 'bottom',
  x,
  y,
  onClick,
}: PlanetNodeProps) {
  const labelRef = useRef<HTMLSpanElement>(null);

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `calc(50% + ${x}px - ${size / 2}px)`,
        top: `calc(50% + ${y}px - ${size / 2}px)`,
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 200ms ease-out, box-shadow 200ms ease-out',
        zIndex: 5,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'scale(1.08)';
        el.style.boxShadow = `0 0 20px color-mix(in srgb, ${color} 40%, transparent), 0 0 60px color-mix(in srgb, ${color} 15%, transparent)`;
        if (labelRef.current) labelRef.current.style.color = 'var(--text-secondary)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'scale(1)';
        el.style.boxShadow = 'none';
        if (labelRef.current) labelRef.current.style.color = 'var(--text-muted)';
      }}
    >
      {label && (
        <span
          ref={labelRef}
          style={{
            position: 'absolute',
            fontSize: '0.6rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            transition: 'color 200ms ease',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            pointerEvents: 'none',
            ...labelStyles[labelPosition],
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
