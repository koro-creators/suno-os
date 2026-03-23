import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  highlight?: { label: string; body: string };
}

export default function MessageBubble({ role, content, highlight }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('max-w-[75%] px-md py-sm', isUser ? 'self-end' : 'self-start')}>
      <div
        className={cn('px-md py-sm', isUser ? 'text-text-primary' : 'text-text-secondary')}
        style={{
          backgroundColor: isUser ? 'var(--nebula)' : 'rgba(255,255,255,0.03)',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        }}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>

        {highlight && (
          <div
            className="mt-sm"
            style={{
              borderLeft: '2px solid var(--sun)',
              background: 'rgba(255,200,1,0.04)',
              borderRadius: '0 6px 6px 0',
              padding: '8px 12px',
            }}
          >
            <span
              className="block font-semibold uppercase tracking-widest"
              style={{ fontSize: '0.6rem', color: 'var(--sun)' }}
            >
              {highlight.label}
            </span>
            <span className="mt-1 block text-xs text-text-secondary">{highlight.body}</span>
          </div>
        )}
      </div>
    </div>
  );
}
