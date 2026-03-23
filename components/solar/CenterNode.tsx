interface CenterNodeProps {
  label: string;
  color: string;
  size: number;
  /** Render as sunOS logo instead of plain text */
  showLogo?: boolean;
}

export default function CenterNode({ label, color, size, showLogo }: CenterNodeProps) {
  const fontSize = size >= 200 ? '1.2rem' : size >= 100 ? '0.8rem' : '0.5rem';
  const logoSize = size >= 200 ? '2rem' : '1.2rem';

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
        background: `radial-gradient(circle at 35% 35%, color-mix(in srgb, ${color} 60%, white) 0%, ${color} 50%, color-mix(in srgb, ${color} 70%, black) 100%)`,
        boxShadow: `0 0 ${size * 0.5}px color-mix(in srgb, ${color} 50%, transparent), 0 0 ${size}px color-mix(in srgb, ${color} 25%, transparent), 0 0 ${size * 2}px color-mix(in srgb, ${color} 10%, transparent)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      }}
    >
      {showLogo ? (
        <span
          style={{
            fontSize: logoSize,
            letterSpacing: '-0.02em',
            color: 'var(--void)',
            userSelect: 'none',
            lineHeight: 1,
          }}
        >
          <span style={{ fontWeight: 300 }}>sun</span>
          <span style={{ fontWeight: 700 }}>OS</span>
          <span style={{ color: 'var(--void)', opacity: 0.5 }}>.</span>
        </span>
      ) : (
        <span
          style={{
            fontSize,
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
      )}
    </div>
  );
}
