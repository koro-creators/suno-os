'use client';

import { useState } from 'react';

interface MoonNodeProps {
  color: string;
  size: number;
  label: string;
  labelPosition?: 'top' | 'bottom' | 'left' | 'right';
  x: number;
  y: number;
  onClick?: () => void;
  animationDelay?: number;
}

const labelStyles: Record<string, React.CSSProperties> = {
  top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 5 },
  bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 5 },
  left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 5 },
  right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 5 },
};

export default function MoonNode({
  color,
  size = 24,
  label,
  labelPosition = 'bottom',
  x,
  y,
  onClick,
  animationDelay,
}: MoonNodeProps) {
  const [focusVisible, setFocusVisible] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const ambientGlow = `0 0 5px color-mix(in srgb, ${color} 20%, transparent)`;
  const focusRing = '0 0 0 3px rgba(255,200,1,0.5)';

  const handleClick = () => {
    if (!onClick) return;
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
      className={animationDelay !== undefined ? 'orbit-appear' : ''}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? label : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={() => setFocusVisible(true)}
      onBlur={() => setFocusVisible(false)}
      style={{
        position: 'absolute',
        left: `calc(50% + ${x}px - ${size / 2}px)`,
        top: `calc(50% + ${y}px - ${size / 2}px)`,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, color-mix(in srgb, ${color} 60%, white) 0%, ${color} 50%, color-mix(in srgb, ${color} 65%, black) 100%)`,
        opacity: navigating ? 0.5 : 0.8,
        boxShadow: focusVisible
          ? `${ambientGlow}, ${focusRing}`
          : ambientGlow,
        cursor: onClick ? (navigating ? 'wait' : 'pointer') : 'default',
        outline: 'none',
        transition: 'transform 200ms ease-out, box-shadow 200ms ease-out, opacity 200ms ease-out',
        zIndex: 5,
        pointerEvents: navigating ? 'none' : 'auto',
        ...(animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : {}),
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'scale(1.08)';
        el.style.opacity = '1';
        el.style.boxShadow = `0 0 20px color-mix(in srgb, ${color} 40%, transparent), 0 0 60px color-mix(in srgb, ${color} 15%, transparent)${focusVisible ? `, ${focusRing}` : ''}`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'scale(1)';
        el.style.opacity = navigating ? '0.5' : '0.8';
        el.style.boxShadow = focusVisible ? `${ambientGlow}, ${focusRing}` : ambientGlow;
      }}
    >
      <span
        className="solar-label"
        style={{
          position: 'absolute',
          fontSize: '0.55rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          pointerEvents: 'none',
          ...labelStyles[labelPosition],
        }}
      >
        {label}
      </span>
    </div>
  );
}
