'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, ChevronLeft, ChevronRight, Image, Sparkles } from 'lucide-react';

type PreviewFormat = 'feed' | 'carousel' | 'stories' | 'post';

/** Strip markdown formatting characters for clean preview display. */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold** → bold
    .replace(/\*(.+?)\*/g, '$1')        // *italic* → italic
    .replace(/^#{1,6}\s+/gm, '')        // # headings → text
    .replace(/^[-*]\s+/gm, '• ')        // - list → bullet
    .replace(/^>\s+/gm, '')             // > blockquote → text
    .replace(/`(.+?)`/g, '$1')          // `code` → code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // [link](url) → link
    .replace(/^---+$/gm, '')            // --- → remove
    .replace(/\n{3,}/g, '\n\n')         // collapse multiple newlines
    .trim();
}

interface SocialPreviewProps {
  content: string;
  format: PreviewFormat;
  clientName: string;
  clientColor: string;
  onGenerateImage?: () => void;
}

function parseSlides(content: string): string[] {
  // Try to detect slides: "Slide 1:", "Slide 2:", numbered lists, or --- separators
  const slidePatterns = [
    /(?:^|\n)(?:Slide|slide|SLIDE)\s*\d+[:\-\s]/,
    /(?:^|\n)---\s*\n/,
  ];

  for (const pattern of slidePatterns) {
    if (pattern.test(content)) {
      const parts = content
        .split(/(?:^|\n)(?:Slide|slide|SLIDE)\s*\d+[:\-\s]|(?:^|\n)---\s*\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length > 1) return parts;
    }
  }

  // If no slide markers, try splitting by double newlines for carousel
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 30);
  if (paragraphs.length >= 2) return paragraphs;

  return [content];
}

function extractCaption(text: string): { caption: string; hashtags: string } {
  const lines = text.split('\n');
  const hashtagLines: string[] = [];
  const captionLines: string[] = [];

  for (const line of lines) {
    if (line.trim().startsWith('#') && line.includes(' #')) {
      hashtagLines.push(line.trim());
    } else if (/^#\w/.test(line.trim()) && line.trim().split('#').length > 2) {
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

function ImagePlaceholder({
  color,
  aspectRatio,
  onGenerate,
}: {
  color: string;
  aspectRatio: string;
  onGenerate?: () => void;
}) {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio,
        backgroundColor: `${color}18`,
        border: `1px solid ${color}30`,
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <Image size={32} strokeWidth={1} style={{ color: `${color}60` }} />
      {onGenerate && (
        <button
          onClick={onGenerate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.65rem',
            color: 'var(--sun)',
            backgroundColor: 'rgba(255,200,1,0.1)',
            border: '1px solid rgba(255,200,1,0.2)',
            borderRadius: 9999,
            padding: '4px 10px',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,200,1,0.2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,200,1,0.1)';
          }}
        >
          <Sparkles size={10} strokeWidth={1.5} />
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
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px' }}>
      <div style={{ display: 'flex', gap: 14 }}>
        <button
          onClick={() => setLiked(!liked)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <Heart
            size={20}
            strokeWidth={1.5}
            fill={liked ? '#EF4444' : 'none'}
            style={{ color: liked ? '#EF4444' : 'var(--text-primary)' }}
          />
        </button>
        <MessageCircle size={20} strokeWidth={1.5} style={{ color: 'var(--text-primary)', cursor: 'pointer' }} />
        <Send size={20} strokeWidth={1.5} style={{ color: 'var(--text-primary)', cursor: 'pointer' }} />
      </div>
      <button
        onClick={() => setSaved(!saved)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <Bookmark
          size={20}
          strokeWidth={1.5}
          fill={saved ? 'var(--text-primary)' : 'none'}
          style={{ color: 'var(--text-primary)' }}
        />
      </button>
    </div>
  );
}

function PostHeader({ clientName, clientColor }: { clientName: string; clientColor: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          backgroundColor: clientColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.65rem',
          fontWeight: 700,
          color: '#fff',
        }}
      >
        {clientName.charAt(0)}
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
        {clientName.toLowerCase().replace(/\s/g, '')}
      </span>
    </div>
  );
}

function CarouselDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '8px 0' }}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          style={{
            width: i === current ? 6 : 5,
            height: i === current ? 6 : 5,
            borderRadius: '50%',
            backgroundColor: i === current ? 'var(--sun)' : 'var(--text-muted)',
            transition: 'all 150ms ease',
          }}
        />
      ))}
    </div>
  );
}

export default function SocialPreview({ content, format, clientName, clientColor, onGenerateImage }: SocialPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = format === 'carousel' ? parseSlides(content) : [content];
  const totalSlides = slides.length;

  const isCarousel = format === 'carousel' && totalSlides > 1;
  const isStories = format === 'stories';
  const aspectRatio = isStories ? '9/16' : '1/1';

  const currentContent = slides[currentSlide] || content;
  const { caption, hashtags } = extractCaption(stripMarkdown(currentContent));

  const containerWidth = isStories ? 260 : 320;

  return (
    <div
      style={{
        width: containerWidth,
        backgroundColor: 'var(--deep)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 8,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <PostHeader clientName={clientName} clientColor={clientColor} />

      {/* Image area */}
      <div style={{ position: 'relative' }}>
        <ImagePlaceholder
          color={clientColor}
          aspectRatio={aspectRatio}
          onGenerate={onGenerateImage}
        />

        {/* Carousel text overlay */}
        {isCarousel && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              padding: '24px 12px 12px',
            }}
          >
            <p
              style={{
                fontSize: '0.7rem',
                color: '#fff',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden',
              }}
            >
              {caption}
            </p>
          </div>
        )}

        {/* Carousel nav arrows */}
        {isCarousel && totalSlides > 1 && (
          <>
            {currentSlide > 0 && (
              <button
                onClick={() => setCurrentSlide((p) => p - 1)}
                style={{
                  position: 'absolute',
                  left: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronLeft size={14} />
              </button>
            )}
            {currentSlide < totalSlides - 1 && (
              <button
                onClick={() => setCurrentSlide((p) => p + 1)}
                style={{
                  position: 'absolute',
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronRight size={14} />
              </button>
            )}

            {/* Slide counter */}
            <span
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                fontSize: '0.55rem',
                color: '#fff',
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: 9999,
                padding: '2px 6px',
              }}
            >
              {currentSlide + 1}/{totalSlides}
            </span>
          </>
        )}
      </div>

      {/* Carousel dots */}
      {isCarousel && <CarouselDots total={totalSlides} current={currentSlide} />}

      {/* Actions */}
      {!isStories && <PostActions />}

      {/* Caption */}
      {!isStories && (
        <div style={{ padding: '0 12px 10px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600, marginRight: 4 }}>
              {clientName.toLowerCase().replace(/\s/g, '')}
            </span>
            {!isCarousel && caption.substring(0, 120)}
            {!isCarousel && caption.length > 120 && (
              <span style={{ color: 'var(--text-muted)' }}>...mais</span>
            )}
          </p>
          {hashtags && (
            <p style={{ fontSize: '0.65rem', color: 'var(--midia)', marginTop: 4, lineHeight: 1.4 }}>
              {hashtags}
            </p>
          )}
        </div>
      )}

      {/* Stories caption overlay */}
      {isStories && (
        <div style={{ padding: '8px 12px 12px' }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
            {caption.substring(0, 80)}
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
