'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, Image, Sparkles } from 'lucide-react';

type PreviewFormat = 'feed' | 'carousel' | 'stories' | 'post';

/** Strip markdown formatting characters for clean preview display. */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*]\s+/gm, '• ')
    .replace(/^>\s+/gm, '')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^---+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface SlideContent {
  title: string;
  text: string;
  cta?: string;
}

/** Parse AI output into clean slide content, extracting only título and texto. */
function parseSlides(content: string): SlideContent[] {
  const cleaned = stripMarkdown(content);

  // Try to split by SLIDE N/N or Slide N patterns
  const slideRegex = /(?:^|\n)\s*(?:SLIDE|Slide|slide)\s*(\d+)(?:\/\d+)?[\s:•\-]*/g;
  const parts = cleaned.split(slideRegex).filter(Boolean);

  if (parts.length >= 2) {
    const slides: SlideContent[] = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      // Skip the number captures
      if (/^\d+$/.test(part.trim())) continue;
      const slide = extractSlideFields(part);
      if (slide.title || slide.text) slides.push(slide);
    }
    if (slides.length > 0) return slides;
  }

  // Try splitting by --- separators
  if (/\n---\s*\n/.test(cleaned)) {
    const sections = cleaned.split(/\n---\s*\n/).filter((s) => s.trim());
    if (sections.length > 1) {
      return sections.map((s) => extractSlideFields(s));
    }
  }

  // Fallback: single slide
  const single = extractSlideFields(cleaned);
  return [single];
}

/** Extract title and text from a slide section, removing art direction metadata. */
function extractSlideFields(raw: string): SlideContent {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);

  let title = '';
  let text = '';
  let cta = '';

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Skip art direction lines
    if (lower.startsWith('elemento visual:') || lower.startsWith('• elemento visual')) continue;
    if (lower.startsWith('tom:') || lower.startsWith('• tom:') || lower.startsWith('• tom ')) continue;
    if (lower.startsWith('visual:')) continue;

    // Extract título
    const titleMatch = line.match(/^(?:•\s*)?(?:Título(?:\s*Principal)?|TÍTULO(?:\s*PRINCIPAL)?)\s*[:：]\s*(.+)/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
      continue;
    }

    // Extract subtítulo or texto no slide
    const textMatch = line.match(/^(?:•\s*)?(?:Sub[tT]ítulo|Texto(?:\s*no\s*slide)?|TEXTO)\s*[:：]\s*(.+)/i);
    if (textMatch) {
      text = text ? `${text}\n${textMatch[1].trim()}` : textMatch[1].trim();
      continue;
    }

    // Extract CTA
    const ctaMatch = line.match(/^(?:•\s*)?CTA\s*(?:\(.*?\))?\s*[:：]\s*(.+)/i);
    if (ctaMatch) {
      cta = ctaMatch[1].trim();
      continue;
    }

    // If no pattern matched and we don't have a title yet, use as title
    if (!title && !line.startsWith('•') && line.length < 60) {
      title = line;
      continue;
    }

    // Otherwise add to text (skip bullet metadata)
    if (!line.startsWith('•') || lower.includes('texto') || lower.includes('subtítulo')) {
      // Skip if it looks like metadata
      if (lower.includes('elemento') || lower.includes('tom:') || lower.includes('visual:')) continue;
      text = text ? `${text}\n${line}` : line;
    }
  }

  // If no structured fields found, use first line as title, rest as text
  if (!title && !text) {
    const allLines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    title = allLines[0] || '';
    text = allLines.slice(1).join('\n');
  }

  return { title, text, cta };
}

/** Extract hashtags and caption from content. */
function extractHashtags(content: string): { caption: string; hashtags: string } {
  const lines = stripMarkdown(content).split('\n');
  const hashtagLines: string[] = [];
  const captionLines: string[] = [];

  for (const line of lines) {
    if (/^#\w/.test(line.trim()) && line.trim().split('#').length > 2) {
      hashtagLines.push(line.trim());
    } else if (line.trim().startsWith('#') && line.includes(' #')) {
      hashtagLines.push(line.trim());
    } else {
      captionLines.push(line);
    }
  }

  return {
    caption: captionLines.join('\n').trim(),
    hashtags: hashtagLines.join(' '),
  };
}

interface SocialPreviewProps {
  content: string;
  format: PreviewFormat;
  clientName: string;
  clientColor: string;
  onGenerateImage?: () => void;
}

function ImagePlaceholder({
  color,
  title,
  subtitle,
  slideNumber,
  totalSlides,
  onGenerate,
}: {
  color: string;
  title?: string;
  subtitle?: string;
  slideNumber?: number;
  totalSlides?: number;
  onGenerate?: () => void;
}) {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '1/1',
        backgroundColor: `${color}15`,
        border: `1px solid ${color}25`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        position: 'relative',
        gap: 6,
      }}
    >
      {slideNumber && totalSlides && (
        <span style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: '0.55rem', color: '#fff',
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: 9999, padding: '2px 6px',
        }}>
          {slideNumber}/{totalSlides}
        </span>
      )}

      {title && (
        <p style={{
          fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)',
          textAlign: 'center', lineHeight: 1.3, maxWidth: '90%',
        }}>
          {title}
        </p>
      )}
      {subtitle && (
        <p style={{
          fontSize: '0.65rem', color: 'var(--text-secondary)',
          textAlign: 'center', lineHeight: 1.4, maxWidth: '85%',
        }}>
          {subtitle}
        </p>
      )}

      {!title && (
        <Image size={24} strokeWidth={1} style={{ color: `${color}50` }} />
      )}

      {onGenerate && (
        <button
          onClick={onGenerate}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.6rem', color: 'var(--sun)',
            backgroundColor: 'rgba(255,200,1,0.1)',
            border: '1px solid rgba(255,200,1,0.2)',
            borderRadius: 9999, padding: '3px 8px',
            cursor: 'pointer', transition: 'all 150ms ease',
            marginTop: 4,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,200,1,0.2)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,200,1,0.1)'; }}
        >
          <Sparkles size={9} strokeWidth={1.5} />
          Gerar visual
        </button>
      )}
    </div>
  );
}

function PostActions() {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => setLiked(!liked)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Heart size={18} strokeWidth={1.5} fill={liked ? '#EF4444' : 'none'} style={{ color: liked ? '#EF4444' : 'var(--text-primary)' }} />
        </button>
        <MessageCircle size={18} strokeWidth={1.5} style={{ color: 'var(--text-primary)' }} />
        <Send size={18} strokeWidth={1.5} style={{ color: 'var(--text-primary)' }} />
      </div>
      <button onClick={() => setSaved(!saved)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <Bookmark size={18} strokeWidth={1.5} fill={saved ? 'var(--text-primary)' : 'none'} style={{ color: 'var(--text-primary)' }} />
      </button>
    </div>
  );
}

function PostHeader({ clientName, clientColor }: { clientName: string; clientColor: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%', backgroundColor: clientColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.6rem', fontWeight: 700, color: '#fff',
      }}>
        {clientName.charAt(0)}
      </div>
      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)' }}>
        {clientName.toLowerCase().replace(/\s/g, '')}
      </span>
    </div>
  );
}

export default function SocialPreview({ content, format, clientName, clientColor, onGenerateImage }: SocialPreviewProps) {
  const slides = parseSlides(content);
  const { hashtags } = extractHashtags(content);

  const isCarousel = format === 'carousel' && slides.length > 1;
  const isStories = format === 'stories';

  // Caption for feed/post: use first slide text or full content
  const feedCaption = slides[0]?.text || stripMarkdown(content).substring(0, 120);

  const containerWidth = isStories ? 220 : 260;

  if (isCarousel) {
    // Show ALL slides horizontally with scroll
    const slideSize = 200;
    return (
      <div style={{
        backgroundColor: 'var(--deep)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 8,
        overflow: 'hidden',
        flexShrink: 0,
        maxWidth: 700,
      }}>
        <PostHeader clientName={clientName} clientColor={clientColor} />

        <div style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 4,
          overflowX: 'auto',
          padding: '0 4px',
          scrollSnapType: 'x mandatory',
        }}>
          {slides.map((slide, i) => (
            <div key={i} style={{ flexShrink: 0, width: slideSize, scrollSnapAlign: 'start' }}>
              <ImagePlaceholder
                color={clientColor}
                title={slide.title}
                subtitle={slide.text}
                slideNumber={i + 1}
                totalSlides={slides.length}
                onGenerate={i === 0 ? onGenerateImage : undefined}
              />
            </div>
          ))}
        </div>

        <PostActions />

        <div style={{ padding: '0 10px 8px' }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 600, marginRight: 4 }}>
              {clientName.toLowerCase().replace(/\s/g, '')}
            </span>
            {slides[0]?.cta || feedCaption.substring(0, 80)}
          </p>
          {hashtags && (
            <p style={{ fontSize: '0.6rem', color: 'var(--midia)', marginTop: 3, lineHeight: 1.3 }}>
              {hashtags}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Feed / Post / Stories — single image
  return (
    <div style={{
      width: containerWidth,
      backgroundColor: 'var(--deep)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 8,
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <PostHeader clientName={clientName} clientColor={clientColor} />

      <ImagePlaceholder
        color={clientColor}
        title={slides[0]?.title}
        subtitle={isStories ? slides[0]?.text?.substring(0, 60) : undefined}
        onGenerate={onGenerateImage}
      />

      {!isStories && <PostActions />}

      {!isStories && (
        <div style={{ padding: '0 10px 8px' }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 600, marginRight: 4 }}>
              {clientName.toLowerCase().replace(/\s/g, '')}
            </span>
            {feedCaption.substring(0, 100)}
            {feedCaption.length > 100 && <span style={{ color: 'var(--text-muted)' }}>...mais</span>}
          </p>
          {hashtags && (
            <p style={{ fontSize: '0.6rem', color: 'var(--midia)', marginTop: 3, lineHeight: 1.3 }}>
              {hashtags}
            </p>
          )}
        </div>
      )}

      {isStories && (
        <div style={{ padding: '6px 10px 8px' }}>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {feedCaption.substring(0, 60)}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Determine the preview format from the moon slug.
 * Returns null if not a social media moon.
 */
export function getSocialFormat(skillSlug: string, moonSlug: string): PreviewFormat | null {
  if (skillSlug !== 'copy-social') return null;

  const formatMap: Record<string, PreviewFormat> = {
    'feed-carrossel': 'carousel',
    'stories-reels': 'stories',
    'x-twitter': 'post',
  };

  return formatMap[moonSlug] || 'feed';
}
