import { cn } from '@/lib/utils';
import { MessageFeedback } from '@/lib/feedback-types';
import ResultActions from './ResultActions';
import FeedbackInline from './FeedbackInline';

function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n')
    .map((line) => {
      if (line.trim() === '---') {
        return '<hr style="border:none;border-top:1px solid var(--border-subtle);margin:8px 0">';
      }
      return line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    })
    .join('\n');
}

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  highlight?: { label: string; body: string };
  showActions?: boolean;
  onGenerateVariation?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  msgIndex?: number;
  feedback?: MessageFeedback;
  onFeedbackChange?: (f: MessageFeedback) => void;
  hasFollowingUserMessage?: boolean;
}

export default function MessageBubble({
  role,
  content,
  highlight,
  showActions,
  onGenerateVariation,
  onSave,
  isSaved,
  msgIndex,
  feedback,
  onFeedbackChange,
  hasFollowingUserMessage,
}: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div
      id={role === 'assistant' && msgIndex !== undefined ? `msg-${msgIndex}` : undefined}
      className={cn('max-w-[75%] px-md py-sm', isUser ? 'self-end' : 'self-start')}
    >
      <div
        className={cn('px-md py-sm', isUser ? 'text-text-primary' : 'text-text-secondary')}
        style={{
          backgroundColor: isUser ? 'var(--nebula)' : 'rgba(255,255,255,0.03)',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        }}
      >
        <div
          className="whitespace-pre-wrap text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />

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

      {showActions && role === 'assistant' && (
        <>
          <ResultActions
            content={content}
            highlightBody={highlight?.body}
            onGenerateVariation={onGenerateVariation!}
            onSave={onSave!}
            isSaved={isSaved ?? false}
            feedback={feedback}
            onFeedbackChange={onFeedbackChange}
          />
          {feedback && onFeedbackChange && (
            <FeedbackInline
              feedback={feedback}
              onChange={onFeedbackChange}
              collapsed={!!hasFollowingUserMessage && !feedback.comment}
            />
          )}
        </>
      )}
    </div>
  );
}
