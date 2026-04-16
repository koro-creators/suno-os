'use client';

interface StreamingIndicatorProps {
  model?: string;
}

export default function StreamingIndicator({ model }: StreamingIndicatorProps) {
  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'flex-start',
      maxWidth: '75%', padding: '8px 16px',
    }}>
      {/* Avatar */}
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        backgroundColor: 'var(--sun)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.5rem', fontWeight: 700, color: 'var(--void)',
        flexShrink: 0,
      }}>
        S
      </div>

      <div>
        {/* Skeleton lines */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 6,
          padding: '12px 16px',
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderRadius: '16px 16px 16px 4px',
        }}>
          <div style={{
            width: 200, height: 10, borderRadius: 4,
            backgroundColor: 'var(--nebula)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <div style={{
            width: 160, height: 10, borderRadius: 4,
            backgroundColor: 'var(--nebula)',
            animation: 'pulse 1.5s ease-in-out infinite',
            animationDelay: '0.2s',
          }} />
          <div style={{
            width: 120, height: 10, borderRadius: 4,
            backgroundColor: 'var(--nebula)',
            animation: 'pulse 1.5s ease-in-out infinite',
            animationDelay: '0.4s',
          }} />
        </div>

        {/* Model name */}
        {model && (
          <span style={{
            fontSize: '0.55rem', color: 'var(--text-muted)',
            marginTop: 4, display: 'block',
          }}>
            {model} pensando...
          </span>
        )}
      </div>
    </div>
  );
}
