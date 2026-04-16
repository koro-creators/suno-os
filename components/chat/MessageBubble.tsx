import { cn } from '@/lib/utils';
import { MessageFeedback } from '@/lib/feedback-types';
import ResultActions from './ResultActions';
import FeedbackInline from './FeedbackInline';
import SocialPreview, { getSocialFormat } from './SocialPreview';

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
        .replace(/`([^`]+)`/g, '<code style="background:var(--nebula);padding:1px 4px;border-radius:4px;font-size:0.8em;font-family:monospace">$1</code>')
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
  skillSlug?: string;
  moonSlug?: string;
  clientName?: string;
  clientColor?: string;
  hasVariations?: boolean;
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
  skillSlug,
  moonSlug,
  clientName,
  clientColor,
  hasVariations,
}: MessageBubbleProps) {
  const isUser = role === 'user';
  const socialFormat = skillSlug && moonSlug ? getSocialFormat(skillSlug, moonSlug) : null;
  // Hide social preview when variations exist (V1 original is shown in VariationCards)
  const showSocialPreview = role === 'assistant' && socialFormat && content.length > 20 && !hasVariations;

  const avatar = role === 'assistant' ? (
    <div style={{
      width: 24, height: 24, borderRadius: '50%',
      backgroundColor: 'var(--sun)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.5rem', fontWeight: 700, color: 'var(--void)',
      flexShrink: 0, marginTop: 2,
    }}>
      S
    </div>
  ) : null;

  return (
    <div
      id={role === 'assistant' && msgIndex !== undefined ? `msg-${msgIndex}` : undefined}
      className={cn('max-w-[75%] px-md py-sm', isUser ? 'self-end' : 'self-start')}
      style={showSocialPreview ? { maxWidth: '90%' } : undefined}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: isUser ? 'flex-start' : 'flex-start', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
        {avatar}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Show text bubble only if NOT showing social preview */}
          {!showSocialPreview && (
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
          )}

          {/* Social preview replaces text bubble for copy-social */}
          {showSocialPreview && (
            <SocialPreview
              content={content}
              format={socialFormat}
              clientName={clientName || 'Marca'}
              clientColor={clientColor || '#8B5CF6'}
            />
          )}

          {/* Timestamp */}
          <span style={{
            fontSize: '0.55rem', color: 'var(--text-muted)',
            marginTop: 2, display: 'block',
            textAlign: isUser ? 'right' : 'left',
          }}>
            agora
          </span>

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
      </div>
    </div>
  );
}
