interface StreamingIndicatorProps {
  model?: string;
}

export default function StreamingIndicator({ model }: StreamingIndicatorProps) {
  const displayModel = model || 'gemini-flash';

  return (
    <div className="max-w-[75%] self-start px-md py-sm">
      <div
        className="flex items-center gap-2 px-md py-sm"
        style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderRadius: '16px 16px 16px 4px',
        }}
      >
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block rounded-full bg-text-muted"
              style={{
                width: 6,
                height: 6,
                animation: 'blink 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {displayModel} pensando...
        </span>
      </div>
    </div>
  );
}
