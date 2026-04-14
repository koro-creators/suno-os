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

interface SlideContent { title: string; text: string; cta?: string; }

function parseSlides(content: string): SlideContent[] {
  const cleaned = stripMarkdown(content);
  const slideRegex = /(?:^|\n)\s*(?:SLIDE|Slide|slide)\s*(\d+)(?:\/\d+)?[\s:•\-]*/g;
  const parts = cleaned.split(slideRegex).filter(Boolean);
  if (parts.length >= 2) {
    const slides: SlideContent[] = [];
    for (const part of parts) {
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
  let title = '', text = '', cta = '';
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
  const hashtagLines: string[] = [], captionLines: string[] = [];
  for (const line of lines) {
    if ((/^#\w/.test(line.trim()) && line.trim().split('#').length > 2) || (line.trim().startsWith('#') && line.includes(' #'))) {
      hashtagLines.push(line.trim());
    } else { captionLines.push(line); }
  }
  return { caption: captionLines.join('\n').trim(), hashtags: hashtagLines.join(' ') };
}

// ─── Slide Components ──────────────────────────────────────────────

const SLIDE_SIZE = 200;

/** Cover slide — first slide with brand, large title, different layout */
function CoverSlide({ title, subtitle, color, clientName, totalSlides, onGenerate }: {
  title: string; subtitle?: string; color: string; clientName: string; totalSlides?: number; onGenerate?: () => void;
}) {
  return (
    <div style={{
      width: SLIDE_SIZE, height: SLIDE_SIZE, flexShrink: 0,
      background: `linear-gradient(160deg, ${color} 0%, ${color}CC 40%, var(--void) 100%)`,
      borderRadius: 8, overflow: 'hidden', position: 'relative',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      padding: 16, gap: 6, scrollSnapAlign: 'start',
    }}>
      {/* Counter */}
      {totalSlides && totalSlides > 1 && (
        <span style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: '0.5rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)',
          backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 4, padding: '1px 5px',
        }}>1/{totalSlides}</span>
      )}

      {/* Brand avatar */}
      <div style={{
        position: 'absolute', top: 10, left: 10,
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.5rem', fontWeight: 700, color: '#fff',
        }}>{clientName.charAt(0)}</div>
        <span style={{ fontSize: '0.5rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
          {clientName.toLowerCase().replace(/\s/g, '')}
        </span>
      </div>

      {/* Title */}
      <p style={{
        fontSize: '1.1rem', fontWeight: 800, color: '#fff',
        lineHeight: 1.15, letterSpacing: '-0.02em',
        textShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }}>
        {title || 'Carrossel'}
      </p>

      {subtitle && (
        <p style={{
          fontSize: '0.55rem', color: 'rgba(255,255,255,0.75)',
          lineHeight: 1.4, display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
        }}>
          {subtitle}
        </p>
      )}

      {onGenerate && (
        <button
          onClick={onGenerate}
          style={{
            position: 'absolute', bottom: 8, right: 8,
            display: 'flex', alignItems: 'center', gap: 2,
            fontSize: '0.5rem', color: '#fff',
            backgroundColor: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 4, padding: '2px 6px',
            cursor: 'pointer', transition: 'all 200ms ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.25)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
        >
          <Sparkles size={7} strokeWidth={1.5} />
          Gerar
        </button>
      )}
    </div>
  );
}

/** Content slide — numbered, dark background, title + text */
function ContentSlide({ title, text, cta, slideNumber, totalSlides, color }: {
  title: string; text: string; cta?: string; slideNumber: number; totalSlides: number; color: string;
}) {
  return (
    <div style={{
      width: SLIDE_SIZE, height: SLIDE_SIZE, flexShrink: 0,
      backgroundColor: 'var(--void)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 8, overflow: 'hidden', position: 'relative',
      display: 'flex', flexDirection: 'column',
      padding: 16, scrollSnapAlign: 'start',
    }}>
      {/* Accent stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 3, height: '40%',
        background: `linear-gradient(180deg, ${color}, transparent)`,
      }} />

      {/* Counter */}
      <span style={{
        position: 'absolute', top: 8, right: 8,
        fontSize: '0.5rem', fontWeight: 600, color: 'var(--text-muted)',
      }}>{slideNumber}/{totalSlides}</span>

      {/* Big number */}
      <span style={{
        fontSize: '2rem', fontWeight: 900, color: `${color}25`,
        lineHeight: 1, marginBottom: 4,
        fontFamily: 'var(--font-inter, system-ui)',
      }}>
        {slideNumber}
      </span>

      {/* Title */}
      <p style={{
        fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)',
        lineHeight: 1.2, marginBottom: 6, letterSpacing: '-0.01em',
      }}>
        {title}
      </p>

      {/* Text */}
      <p style={{
        fontSize: '0.55rem', color: 'var(--text-secondary)',
        lineHeight: 1.5, flex: 1,
        display: '-webkit-box', WebkitLineClamp: 4,
        WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
      }}>
        {text}
      </p>

      {/* CTA or brand footer */}
      <div style={{
        marginTop: 'auto', paddingTop: 6,
        borderTop: '1px solid var(--border-subtle)',
      }}>
        {cta ? (
          <span style={{ fontSize: '0.5rem', fontWeight: 600, color }}>
            {cta}
          </span>
        ) : (
          <span style={{ fontSize: '0.45rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            Deslize para continuar →
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Instagram frame (only for single post / stories) ──────────────

function PostActions() {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <button onClick={() => setLiked(!liked)} aria-label="Curtir" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
          <Heart size={18} strokeWidth={1.5} fill={liked ? '#EF4444' : 'none'} style={{ color: liked ? '#EF4444' : 'var(--text-primary)' }} />
        </button>
        <MessageCircle size={18} strokeWidth={1.5} style={{ color: 'var(--text-primary)', cursor: 'pointer' }} />
        <Send size={18} strokeWidth={1.5} style={{ color: 'var(--text-primary)', cursor: 'pointer' }} />
      </div>
      <button onClick={() => setSaved(!saved)} aria-label="Salvar" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
        <Bookmark size={18} strokeWidth={1.5} fill={saved ? 'var(--text-primary)' : 'none'} style={{ color: 'var(--text-primary)' }} />
      </button>
    </div>
  );
}

function PostHeader({ clientName, clientColor }: { clientName: string; clientColor: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: `linear-gradient(135deg, ${clientColor}, ${clientColor}90)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.6rem', fontWeight: 700, color: '#fff',
          boxShadow: `0 0 0 2px var(--deep), 0 0 0 3px ${clientColor}40`,
        }}>{clientName.charAt(0)}</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {clientName.toLowerCase().replace(/\s/g, '')}
          </span>
          <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>Patrocinado</span>
        </div>
      </div>
      <MoreHorizontal size={16} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────

interface SocialPreviewProps {
  content: string;
  format: PreviewFormat;
  clientName: string;
  clientColor: string;
  onGenerateImage?: () => void;
}

export default function SocialPreview({ content, format, clientName, clientColor, onGenerateImage }: SocialPreviewProps) {
  const slides = parseSlides(content);
  const { hashtags } = extractHashtags(content);
  const isCarousel = format === 'carousel' && slides.length > 1;
  const isStories = format === 'stories';
  const feedCaption = slides[0]?.text || stripMarkdown(content).substring(0, 120);

  if (isCarousel) {
    const total = slides.length;
    return (
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', paddingBottom: 4, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {slides.map((slide, i) =>
          i === 0 ? (
            <CoverSlide
              key={i}
              title={slide.title}
              subtitle={slide.text}
              color={clientColor}
              clientName={clientName}
              totalSlides={total}
              onGenerate={onGenerateImage}
            />
          ) : (
            <ContentSlide
              key={i}
              title={slide.title}
              text={slide.text}
              cta={slide.cta}
              slideNumber={i + 1}
              totalSlides={total}
              color={clientColor}
            />
          )
        )}
      </div>
    );
  }

  // Feed / Post / Stories — wrapped in Instagram chrome
  const containerWidth = isStories ? 240 : 280;
  return (
    <div style={{
      width: containerWidth, backgroundColor: 'var(--deep)',
      border: '1px solid var(--border-subtle)', borderRadius: 12,
      overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
    }}>
      <PostHeader clientName={clientName} clientColor={clientColor} />
      <CoverSlide title={slides[0]?.title || ''} subtitle={isStories ? slides[0]?.text?.substring(0, 80) : undefined} color={clientColor} clientName={clientName} onGenerate={onGenerateImage} />
      {!isStories && <PostActions />}
      {!isStories && (
        <div style={{ padding: '0 12px 10px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700, marginRight: 4 }}>{clientName.toLowerCase().replace(/\s/g, '')}</span>
            {feedCaption.substring(0, 120)}{feedCaption.length > 120 && <span style={{ color: 'var(--text-muted)' }}> ...mais</span>}
          </p>
          {hashtags && <p style={{ fontSize: '0.6rem', color: 'var(--midia)', marginTop: 4, lineHeight: 1.4, opacity: 0.8 }}>{hashtags}</p>}
        </div>
      )}
      {isStories && <div style={{ padding: '8px 12px 10px' }}><p style={{ fontSize: '0.65rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{feedCaption.substring(0, 80)}</p></div>}
    </div>
  );
}

export function getSocialFormat(skillSlug: string, moonSlug: string): PreviewFormat | null {
  if (skillSlug !== 'copy-social') return null;
  return ({ 'feed-carrossel': 'carousel', 'stories-reels': 'stories', 'x-twitter': 'post' } as Record<string, PreviewFormat>)[moonSlug] || 'feed';
}
