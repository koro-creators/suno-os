'use client';

import { useRef, useState } from 'react';

interface PlanetNodeProps {
  color: string;
  size: number;
  label?: string;
  labelPosition?: 'top' | 'bottom' | 'left' | 'right';
  /** Optional metadata shown below label, e.g. "6 skills" */
  meta?: string;
  x: number;
  y: number;
  onClick?: () => void;
  animationDelay?: number;
}

// Label container positioning relative to planet div
const labelContainerStyles: Record<string, React.CSSProperties> = {
  top: {
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginBottom: 8,
    flexDirection: 'column-reverse',
    alignItems: 'center',
  },
  bottom: {
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: 8,
    flexDirection: 'column',
    alignItems: 'center',
  },
  left: {
    right: '100%',
    top: '50%',
    transform: 'translateY(-50%)',
    marginRight: 8,
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  right: {
    left: '100%',
    top: '50%',
    transform: 'translateY(-50%)',
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
};

export default function PlanetNode({
  color,
  size,
  label,
  labelPosition = 'bottom',
  meta,
  x,
  y,
  onClick,
  animationDelay,
}: PlanetNodeProps) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const metaRef = useRef<HTMLSpanElement>(null);
  const [focusVisible, setFocusVisible] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const isHorizontal = labelPosition === 'left' || labelPosition === 'right';
  const ambientGlow = `0 0 6px color-mix(in srgb, ${color} 25%, transparent)`;
  const focusRing = '0 0 0 3px rgba(255,200,1,0.5)';

  const ariaLabel = [label, meta].filter(Boolean).join(' — ') || undefined;

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
      aria-label={onClick ? ariaLabel : undefined}
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
        background: `radial-gradient(circle at 35% 35%, color-mix(in srgb, ${color} 60%, white) 0%, ${color} 50%, color-mix(in srgb, ${color} 70%, black) 100%)`,
        boxShadow: focusVisible
          ? `${ambientGlow}, ${focusRing}`
          : ambientGlow,
        cursor: onClick ? (navigating ? 'wait' : 'pointer') : 'default',
        outline: 'none',
        opacity: navigating ? 0.5 : 1,
        transition: 'transform 200ms ease-out, box-shadow 200ms ease-out, opacity 200ms ease-out',
        zIndex: 5,
        pointerEvents: navigating ? 'none' : 'auto',
        ...(animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : {}),
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'scale(1.08)';
        el.style.boxShadow = `0 0 20px color-mix(in srgb, ${color} 40%, transparent), 0 0 60px color-mix(in srgb, ${color} 15%, transparent)${focusVisible ? `, ${focusRing}` : ''}`;
        if (labelRef.current) labelRef.current.style.color = 'var(--text-secondary)';
        if (metaRef.current) metaRef.current.style.color = 'var(--text-secondary)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'scale(1)';
        el.style.boxShadow = focusVisible ? `${ambientGlow}, ${focusRing}` : ambientGlow;
        if (labelRef.current) labelRef.current.style.color = 'var(--text-muted)';
        if (metaRef.current) metaRef.current.style.color = 'var(--text-muted)';
      }}
    >
      {label && (
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            gap: isHorizontal ? 5 : 2,
            pointerEvents: 'none',
            ...labelContainerStyles[labelPosition],
          }}
        >
          {/* Connector tick between planet and label */}
          <div
            style={{
              flexShrink: 0,
              width: isHorizontal ? 1 : 14,
              height: isHorizontal ? 14 : 1,
              background: 'rgba(255,255,255,0.15)',
            }}
          />

          {/* Label + meta block */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isHorizontal
                ? labelPosition === 'right' ? 'flex-start' : 'flex-end'
                : 'center',
              gap: 2,
            }}
          >
            <span
              ref={labelRef}
              style={{
                fontSize: '0.6rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                transition: 'color 200ms ease',
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}
            >
              {label}
            </span>
            {meta && (
              <span
                ref={metaRef}
                style={{
                  fontSize: '0.5rem',
                  letterSpacing: '0.04em',
                  color: 'var(--text-muted)',
                  transition: 'color 200ms ease',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}
              >
                {meta}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
