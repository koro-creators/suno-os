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
        backgroundColor: color,
        boxShadow: `0 0 30px color-mix(in srgb, ${color} 40%, transparent), 0 0 80px color-mix(in srgb, ${color} 15%, transparent)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      }}
    >
      <span
        style={{
          fontSize: '0.5rem',
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
