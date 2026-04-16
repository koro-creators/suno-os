export default function Skeleton({ width, height, radius = 8 }: { width?: string | number; height?: string | number; radius?: number }) {
  return (
    <div
      style={{
        width: width || '100%',
        height: height || 16,
        borderRadius: radius,
        backgroundColor: 'var(--nebula)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  );
}
