'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, Sparkles, MoreHorizontal } from 'lucide-react';

type PreviewFormat = 'feed' | 'carousel' | 'stories' | 'post';

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

function parseSlides(content: string): SlideContent[] {
  const cleaned = stripMarkdown(content);
  const slideRegex = /(?:^|\n)\s*(?:SLIDE|Slide|slide)\s*(\d+)(?:\/\d+)?[\s:•\-]*/g;
  const parts = cleaned.split(slideRegex).filter(Boolean);

  if (parts.length >= 2) {
    const slides: SlideContent[] = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (/^\d+$/.test(part.trim())) continue;
      const slide = extractSlideFields(part);
      if (slide.title || slide.text) slides.push(slide);
    }
    if (slides.length > 0) return slides;
  }

  if (/\n---\s*\n/.test(cleaned)) {
    const sections = cleaned.split(/\n---\s*\n/).filter((s) => s.trim());
    if (sections.length > 1) return sections.map((s) => extractSlideFields(s));
  }

  return [extractSlideFields(cleaned)];
}

function extractSlideFields(raw: string): SlideContent {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  let title = '';
  let text = '';
  let cta = '';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.startsWith('elemento visual:') || lower.startsWith('• elemento visual')) continue;
    if (lower.startsWith('tom:') || lower.startsWith('• tom:') || lower.startsWith('• tom ')) continue;
    if (lower.startsWith('visual:')) continue;

    const titleMatch = line.match(/^(?:•\s*)?(?:Título(?:\s*Principal)?|TÍTULO(?:\s*PRINCIPAL)?)\s*[:：]\s*(.+)/i);
    if (titleMatch) { title = titleMatch[1].trim(); continue; }

    const textMatch = line.match(/^(?:•\s*)?(?:Sub[tT]ítulo|Texto(?:\s*no\s*slide)?|TEXTO)\s*[:：]\s*(.+)/i);
    if (textMatch) { text = text ? `${text}\n${textMatch[1].trim()}` : textMatch[1].trim(); continue; }

    const ctaMatch = line.match(/^(?:•\s*)?CTA\s*(?:\(.*?\))?\s*[:：]\s*(.+)/i);
    if (ctaMatch) { cta = ctaMatch[1].trim(); continue; }

    if (!title && !line.startsWith('•') && line.length < 60) { title = line; continue; }

    if (!line.startsWith('•') || lower.includes('texto') || lower.includes('subtítulo')) {
      if (lower.includes('elemento') || lower.includes('tom:') || lower.includes('visual:')) continue;
      text = text ? `${text}\n${line}` : line;
    }
  }

  if (!title && !text) {
    const allLines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    title = allLines[0] || '';
    text = allLines.slice(1).join('\n');
  }

  return { title, text, cta };
}

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

  return { caption: captionLines.join('\n').trim(), hashtags: hashtagLines.join(' ') };
}

// ─── Sub-components ────────────────────────────────────────────────

interface SocialPreviewProps {
  content: string;
  format: PreviewFormat;
  clientName: string;
  clientColor: string;
  onGenerateImage?: () => void;
}

function SlideCard({
  color,
  title,
  subtitle,
  slideNumber,
  totalSlides,
  cta,
  onGenerate,
  isFirst,
}: {
  color: string;
  title?: string;
  subtitle?: string;
  slideNumber?: number;
  totalSlides?: number;
  cta?: string;
  onGenerate?: () => void;
  isFirst?: boolean;
}) {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '1/1',
        background: `linear-gradient(145deg, ${color}20 0%, ${color}08 50%, var(--void) 100%)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}60, transparent 70%)`,
      }} />

      {/* Slide counter */}
      {slideNumber && totalSlides && (
        <span style={{
          position: 'absolute', top: 10, right: 10,
          fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.05em',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--deep)',
          borderRadius: 6, padding: '2px 6px',
          border: '1px solid var(--border-subtle)',
        }}>
          {slideNumber}/{totalSlides}
        </span>
      )}

      {/* Title */}
      {title && (
        <p style={{
          fontSize: isFirst ? '1rem' : '0.85rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          textAlign: 'center',
          lineHeight: 1.25,
          maxWidth: '92%',
          letterSpacing: '-0.01em',
        }}>
          {title}
        </p>
      )}

      {/* Divider dot */}
      {title && subtitle && (
        <div style={{
          width: 4, height: 4, borderRadius: '50%',
          backgroundColor: color, margin: '10px 0', opacity: 0.6,
        }} />
      )}

      {/* Subtitle / body text */}
      {subtitle && (
        <p style={{
          fontSize: '0.65rem',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          lineHeight: 1.5,
          maxWidth: '88%',
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }}>
          {subtitle}
        </p>
      )}

      {/* CTA */}
      {cta && (
        <span style={{
          marginTop: 10,
          fontSize: '0.6rem',
          fontWeight: 600,
          color: color,
          backgroundColor: `${color}15`,
          border: `1px solid ${color}30`,
          borderRadius: 9999,
          padding: '3px 10px',
        }}>
          {cta}
        </span>
      )}

      {/* Generate visual button */}
      {onGenerate && (
        <button
          onClick={onGenerate}
          style={{
            position: 'absolute', bottom: 10, right: 10,
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: '0.55rem', color: 'var(--sun)',
            backgroundColor: 'rgba(255,200,1,0.08)',
            border: '1px solid rgba(255,200,1,0.15)',
            borderRadius: 6, padding: '3px 7px',
            cursor: 'pointer', transition: 'all 200ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,200,1,0.18)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,200,1,0.3)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,200,1,0.08)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,200,1,0.15)';
          }}
        >
          <Sparkles size={8} strokeWidth={1.5} />
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
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 12px',
    }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <button
          onClick={() => setLiked(!liked)}
          aria-label={liked ? 'Descurtir' : 'Curtir'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', transition: 'transform 200ms ease' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        >
          <Heart size={18} strokeWidth={1.5} fill={liked ? '#EF4444' : 'none'} style={{ color: liked ? '#EF4444' : 'var(--text-primary)', transition: 'color 200ms ease' }} />
        </button>
        <MessageCircle size={18} strokeWidth={1.5} style={{ color: 'var(--text-primary)', cursor: 'pointer' }} />
        <Send size={18} strokeWidth={1.5} style={{ color: 'var(--text-primary)', cursor: 'pointer' }} />
      </div>
      <button
        onClick={() => setSaved(!saved)}
        aria-label={saved ? 'Remover dos salvos' : 'Salvar'}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', transition: 'transform 200ms ease' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      >
        <Bookmark size={18} strokeWidth={1.5} fill={saved ? 'var(--text-primary)' : 'none'} style={{ color: 'var(--text-primary)', transition: 'color 200ms ease' }} />
      </button>
    </div>
  );
}

function PostHeader({ clientName, clientColor }: { clientName: string; clientColor: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Avatar ring */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: `linear-gradient(135deg, ${clientColor}, ${clientColor}90)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.6rem', fontWeight: 700, color: '#fff',
          boxShadow: `0 0 0 2px var(--deep), 0 0 0 3px ${clientColor}40`,
        }}>
          {clientName.charAt(0)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {clientName.toLowerCase().replace(/\s/g, '')}
          </span>
          <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
            Patrocinado
          </span>
        </div>
      </div>
      <MoreHorizontal size={16} strokeWidth={1.5} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────

export default function SocialPreview({ content, format, clientName, clientColor, onGenerateImage }: SocialPreviewProps) {
  const slides = parseSlides(content);
  const { hashtags } = extractHashtags(content);

  const isCarousel = format === 'carousel' && slides.length > 1;
  const isStories = format === 'stories';

  const feedCaption = slides[0]?.text || stripMarkdown(content).substring(0, 120);

  if (isCarousel) {
    const slideSize = 220;
    return (
      <div style={{
        backgroundColor: 'var(--deep)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        overflow: 'hidden',
        flexShrink: 0,
        maxWidth: 740,
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
      }}>
        <PostHeader clientName={clientName} clientColor={clientColor} />

        {/* Horizontal carousel with smooth scroll snap */}
        <div
          style={{
            display: 'flex',
            gap: 3,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              style={{
                flexShrink: 0,
                width: slideSize,
                scrollSnapAlign: 'start',
              }}
            >
              <SlideCard
                color={clientColor}
                title={slide.title}
                subtitle={slide.text}
                slideNumber={i + 1}
                totalSlides={slides.length}
                cta={slide.cta}
                onGenerate={i === 0 ? onGenerateImage : undefined}
                isFirst={i === 0}
              />
            </div>
          ))}
        </div>

        {/* Dots indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '6px 0 2px' }}>
          {slides.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === 0 ? 16 : 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: i === 0 ? clientColor : 'var(--text-muted)',
                opacity: i === 0 ? 1 : 0.3,
                transition: 'all 200ms ease',
              }}
            />
          ))}
        </div>

        <PostActions />

        {/* Caption area */}
        <div style={{ padding: '0 12px 10px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700, marginRight: 4 }}>
              {clientName.toLowerCase().replace(/\s/g, '')}
            </span>
            {slides[0]?.cta || feedCaption.substring(0, 100)}
          </p>
          {hashtags && (
            <p style={{ fontSize: '0.6rem', color: 'var(--midia)', marginTop: 4, lineHeight: 1.4, opacity: 0.8 }}>
              {hashtags}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── Feed / Post / Stories ───
  const containerWidth = isStories ? 240 : 280;

  return (
    <div style={{
      width: containerWidth,
      backgroundColor: 'var(--deep)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      overflow: 'hidden',
      flexShrink: 0,
      boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
    }}>
      <PostHeader clientName={clientName} clientColor={clientColor} />

      <SlideCard
        color={clientColor}
        title={slides[0]?.title}
        subtitle={isStories ? slides[0]?.text?.substring(0, 80) : undefined}
        cta={slides[0]?.cta}
        onGenerate={onGenerateImage}
        isFirst
      />

      {!isStories && <PostActions />}

      {!isStories && (
        <div style={{ padding: '0 12px 10px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700, marginRight: 4 }}>
              {clientName.toLowerCase().replace(/\s/g, '')}
            </span>
            {feedCaption.substring(0, 120)}
            {feedCaption.length > 120 && <span style={{ color: 'var(--text-muted)' }}> ...mais</span>}
          </p>
          {hashtags && (
            <p style={{ fontSize: '0.6rem', color: 'var(--midia)', marginTop: 4, lineHeight: 1.4, opacity: 0.8 }}>
              {hashtags}
            </p>
          )}
        </div>
      )}

      {isStories && (
        <div style={{ padding: '8px 12px 10px' }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
            {feedCaption.substring(0, 80)}
          </p>
        </div>
      )}
    </div>
  );
}

export function getSocialFormat(skillSlug: string, moonSlug: string): PreviewFormat | null {
  if (skillSlug !== 'copy-social') return null;
  const formatMap: Record<string, PreviewFormat> = {
    'feed-carrossel': 'carousel',
    'stories-reels': 'stories',
    'x-twitter': 'post',
  };
  return formatMap[moonSlug] || 'feed';
}
