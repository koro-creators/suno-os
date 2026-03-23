'use client';

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
  return (
    <div
      className={animationDelay !== undefined ? 'orbit-appear' : undefined}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `calc(50% + ${x}px - ${size / 2}px)`,
        top: `calc(50% + ${y}px - ${size / 2}px)`,
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        opacity: 0.7,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 200ms ease-out, box-shadow 200ms ease-out, opacity 200ms ease-out',
        zIndex: 5,
        ...(animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : {}),
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'scale(1.08)';
        el.style.opacity = '1';
        el.style.boxShadow = `0 0 20px color-mix(in srgb, ${color} 40%, transparent), 0 0 60px color-mix(in srgb, ${color} 15%, transparent)`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'scale(1)';
        el.style.opacity = '0.7';
        el.style.boxShadow = 'none';
      }}
    >
      <span
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
