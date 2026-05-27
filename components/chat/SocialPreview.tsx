'use client';

import { Star } from '@carbon/icons-react';

type PreviewFormat = 'feed' | 'carousel' | 'stories' | 'post';

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '').replace(/^[-*]\s+/gm, '• ')
    .replace(/^>\s+/gm, '').replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1').replace(/^---+$/gm, '')
    .replace(/\n{3,}/g, '\n\n').trim();
}

interface SlideContent { title: string; text: string; cta?: string; }

function parseSlides(content: string): SlideContent[] {
  const cleaned = stripMarkdown(content);
  const parts = cleaned.split(/(?:^|\n)\s*(?:SLIDE|Slide|slide)\s*\d+(?:\/\d+)?[\s:•\-]*/g).filter(Boolean);
  if (parts.length > 1) {
    const slides = parts.map(p => extractSlideFields(p)).filter(s => s.title || s.text);
    if (slides.length > 0) return slides;
  }
  if (/\n---\s*\n/.test(cleaned)) {
    const sections = cleaned.split(/\n---\s*\n/).filter(s => s.trim());
    if (sections.length > 1) return sections.map(s => extractSlideFields(s));
  }
  return [extractSlideFields(cleaned)];
}

function extractSlideFields(raw: string): SlideContent {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  let title = '', text = '', cta = '';
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/^(?:•\s*)?(?:elemento visual|tom:|visual:)/i.test(line)) continue;
    const tm = line.match(/^(?:•\s*)?(?:Título(?:\s*Principal)?|TÍTULO(?:\s*PRINCIPAL)?)\s*[:：]\s*(.+)/i);
    if (tm) { title = tm[1].trim(); continue; }
    const txm = line.match(/^(?:•\s*)?(?:Sub[tT]ítulo|Texto(?:\s*no\s*slide)?|TEXTO)\s*[:：]\s*(.+)/i);
    if (txm) { text = text ? `${text}\n${txm[1].trim()}` : txm[1].trim(); continue; }
    const cm = line.match(/^(?:•\s*)?CTA\s*(?:\(.*?\))?\s*[:：]\s*(.+)/i);
    if (cm) { cta = cm[1].trim(); continue; }
    if (!title && !line.startsWith('•') && line.length < 60) { title = line; continue; }
    if (!line.startsWith('•') && !lower.includes('elemento') && !lower.includes('tom:') && !lower.includes('visual:')) {
      text = text ? `${text}\n${line}` : line;
    }
  }
  if (!title && !text) { const a = raw.split('\n').map(l => l.trim()).filter(Boolean); title = a[0] || ''; text = a.slice(1).join('\n'); }
  return { title, text, cta };
}

// ─── Slide Cards ───────────────────────────────────────────────────

const SLIDE_W = 180;
const SLIDE_H = 180;

function CoverSlide({ title, subtitle, color, clientName, totalSlides, onGenerate }: {
  title: string; subtitle?: string; color: string; clientName: string; totalSlides?: number; onGenerate?: () => void;
}) {
  return (
    <div style={{
      width: SLIDE_W, height: SLIDE_H, flexShrink: 0,
      background: `linear-gradient(155deg, ${color} 0%, ${color}BB 45%, var(--void) 100%)`,
      borderRadius: 6, position: 'relative',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      padding: 14, gap: 4, overflow: 'hidden',
    }}>
      {totalSlides && totalSlides > 1 && (
        <span style={{ position: 'absolute', top: 6, right: 6, fontSize: '0.45rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 3, padding: '1px 4px' }}>
          1/{totalSlides}
        </span>
      )}
      <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.4rem', fontWeight: 700, color: '#fff' }}>
          {clientName.charAt(0)}
        </div>
        <span style={{ fontSize: '0.45rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
          {clientName.toLowerCase().replace(/\s/g, '')}
        </span>
      </div>
      <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.02em', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
        {title || 'Carrossel'}
      </p>
      {subtitle && (
        <p style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
          {subtitle}
        </p>
      )}
      {onGenerate && (
        <button onClick={onGenerate} style={{ position: 'absolute', bottom: 6, right: 6, display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.45rem', color: '#fff', backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, padding: '2px 5px', cursor: 'pointer' }}>
          <Star size={7} />Gerar
        </button>
      )}
    </div>
  );
}

function ContentSlide({ title, text, cta, slideNumber, totalSlides, color }: {
  title: string; text: string; cta?: string; slideNumber: number; totalSlides: number; color: string;
}) {
  return (
    <div style={{
      width: SLIDE_W, height: SLIDE_H, flexShrink: 0,
      backgroundColor: 'var(--void)', border: '1px solid var(--border-subtle)',
      borderRadius: 6, position: 'relative',
      display: 'flex', flexDirection: 'column', padding: 14, overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 2, height: '35%', background: `linear-gradient(180deg, ${color}, transparent)` }} />
      <span style={{ position: 'absolute', top: 6, right: 6, fontSize: '0.45rem', fontWeight: 600, color: 'var(--text-muted)' }}>{slideNumber}/{totalSlides}</span>
      <span style={{ fontSize: '1.6rem', fontWeight: 900, color: `${color}20`, lineHeight: 1, marginBottom: 2 }}>{slideNumber}</span>
      <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 4 }}>{title}</p>
      <p style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{text}</p>
      <div style={{ marginTop: 'auto', paddingTop: 4, borderTop: '1px solid var(--border-subtle)' }}>
        {cta ? <span style={{ fontSize: '0.45rem', fontWeight: 600, color }}>{cta}</span> : <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)' }}>→</span>}
      </div>
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
  const isCarousel = format === 'carousel' && slides.length > 1;
  const total = slides.length;

  if (isCarousel) {
    return (
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: 2 }}>
        {slides.map((slide, i) =>
          i === 0
            ? <CoverSlide key={i} title={slide.title} subtitle={slide.text} color={clientColor} clientName={clientName} totalSlides={total} onGenerate={onGenerateImage} />
            : <ContentSlide key={i} title={slide.title} text={slide.text} cta={slide.cta} slideNumber={i + 1} totalSlides={total} color={clientColor} />
        )}
      </div>
    );
  }

  // Single slide (feed, stories, post)
  return (
    <CoverSlide title={slides[0]?.title || stripMarkdown(content).substring(0, 60)} subtitle={slides[0]?.text?.substring(0, 80)} color={clientColor} clientName={clientName} onGenerate={onGenerateImage} />
  );
}

export function getSocialFormat(skillSlug: string, moonSlug: string): PreviewFormat | null {
  if (skillSlug !== 'copy-social') return null;
  return ({ 'feed-carrossel': 'carousel', 'stories-reels': 'stories', 'x-twitter': 'post' } as Record<string, PreviewFormat>)[moonSlug] || 'feed';
}
