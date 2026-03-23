interface OrbitRingProps {
  radius: number;
  highlighted?: boolean;
}

export default function OrbitRing({ radius, highlighted }: OrbitRingProps) {
  const diameter = radius * 2;
  const animClass = 'orbit-ring-pulse';

  return (
    <div
      className={animClass}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: diameter,
        height: diameter,
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        border: `1px solid ${highlighted ? 'var(--orbit-hover)' : 'var(--orbit-line)'}`,
        boxShadow: highlighted
          ? '0 0 16px rgba(255,200,1,0.08), inset 0 0 10px rgba(255,200,1,0.04)'
          : '0 0 12px rgba(255,200,1,0.04), inset 0 0 8px rgba(255,200,1,0.02)',
        transition: 'border-color 300ms ease',
        pointerEvents: 'none',
      }}
    />
  );
}
