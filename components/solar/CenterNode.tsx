interface CenterNodeProps {
  label: string;
  color: string;
  size: number;
}

export default function CenterNode({ label, color, size }: CenterNodeProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: size,
        height: size,
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, color-mix(in srgb, ${color} 140%, white) 0%, ${color} 50%, color-mix(in srgb, ${color} 70%, black) 100%)`,
        boxShadow: `0 0 ${size * 0.4}px color-mix(in srgb, ${color} 50%, transparent), 0 0 ${size * 1.2}px color-mix(in srgb, ${color} 20%, transparent)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      }}
    >
      <span
        style={{
          fontSize: size >= 72 ? '0.6rem' : '0.5rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--void)',
          lineHeight: 1.1,
          textAlign: 'center',
          padding: '0 4px',
          userSelect: 'none',
        }}
      >
        {label}
      </span>
    </div>
  );
}
