interface OrbitRingProps {
  radius: number;
  highlighted?: boolean;
}

export default function OrbitRing({ radius, highlighted }: OrbitRingProps) {
  const diameter = radius * 2;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: diameter,
        height: diameter,
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        border: `1px solid ${highlighted ? 'var(--orbit-hover)' : 'var(--orbit-line)'}`,
        transition: 'border-color 300ms ease',
        pointerEvents: 'none',
      }}
    />
  );
}
