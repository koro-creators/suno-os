interface TinyMoonProps {
  color: string;
  size: number;
  x: number;
  y: number;
}

export default function TinyMoon({ color, size, x, y }: TinyMoonProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `calc(50% + ${x}px - ${size / 2}px)`,
        top: `calc(50% + ${y}px - ${size / 2}px)`,
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        opacity: 0.45,
        pointerEvents: 'none',
      }}
    />
  );
}
