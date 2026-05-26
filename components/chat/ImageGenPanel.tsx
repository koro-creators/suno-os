'use client';

import React, { useState } from 'react';
import { Download, Image, InProgress, Star, ZoomIn } from '@carbon/icons-react';
import { apiAvailable, generateImage, ImageGenResponse } from '@/lib/api';

const ASPECT_RATIOS = [
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4:3', label: '4:3' },
];

const STYLES = [
  { value: '', label: 'Auto' },
  { value: 'cinematic', label: 'Cinematico' },
  { value: 'minimalist', label: 'Minimalista' },
  { value: 'illustration', label: 'Ilustracao' },
  { value: 'photographic', label: 'Fotografico' },
  { value: 'abstract', label: 'Abstrato' },
  { value: 'watercolor', label: 'Aquarela' },
];

interface ImageGenPanelProps {
  model?: string;
}

export default function ImageGenPanel({ model }: ImageGenPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [style, setStyle] = useState('');
  const [quantity, setQuantity] = useState(2);
  const [enhancePromptEnabled, setEnhancePromptEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImageGenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isAvailable = apiAvailable();

  async function handleGenerate() {
    if (!prompt.trim() || !isAvailable) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await generateImage({
        prompt: prompt.trim(),
        model: model || 'imagen-4-standard',
        aspect_ratio: aspectRatio,
        quantity,
        style: style || null,
        enhance_prompt: enhancePromptEnabled,
      });
      setResult(res);
    } catch (err) {
      setError((err as Error).message || 'Falha ao gerar imagem');
    } finally {
      setLoading(false);
    }
  }

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: 'var(--nebula)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    cursor: 'pointer',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 4,
    display: 'block',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: 20,
      height: '100%',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Image size={14} style={{ color: 'var(--sun)' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Gerar Imagem
        </span>
      </div>

      {!isAvailable && (
        <div style={{
          padding: '10px 14px',
          backgroundColor: 'var(--nebula)',
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          fontSize: 12,
          color: 'var(--text-muted)',
        }}>
          Requer backend para funcionar. Configure NEXT_PUBLIC_API_URL.
        </div>
      )}

      {/* Prompt */}
      <div>
        <label style={labelStyle}>Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Descreva a imagem que voce quer gerar..."
          disabled={!isAvailable}
          rows={3}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: 'var(--nebula)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: 13,
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.5,
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Options row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}>
        <div>
          <label style={labelStyle}>Proporcao</label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            disabled={!isAvailable}
            style={selectStyle}
          >
            {ASPECT_RATIOS.map((ar) => (
              <option key={ar.value} value={ar.value}>{ar.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Estilo</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            disabled={!isAvailable}
            style={selectStyle}
          >
            {STYLES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Quantity slider */}
      <div>
        <label style={labelStyle}>
          Quantidade: <span style={{ color: 'var(--sun)', fontWeight: 600 }}>{quantity}</span>
        </label>
        <input
          type="range"
          min={1}
          max={4}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          disabled={!isAvailable}
          style={{
            width: '100%',
            accentColor: 'var(--sun)',
            cursor: 'pointer',
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}>
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
        </div>
      </div>

      {/* Enhance prompt toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Aprimorar prompt automaticamente
        </label>
        <button
          onClick={() => setEnhancePromptEnabled(!enhancePromptEnabled)}
          disabled={!isAvailable}
          style={{
            width: 40,
            height: 22,
            borderRadius: 9999,
            border: 'none',
            backgroundColor: enhancePromptEnabled ? 'var(--sun)' : 'var(--nebula)',
            position: 'relative',
            cursor: isAvailable ? 'pointer' : 'not-allowed',
            transition: 'background-color 150ms ease',
          }}
        >
          <div style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: enhancePromptEnabled ? 'var(--void)' : 'var(--text-muted)',
            position: 'absolute',
            top: 3,
            left: enhancePromptEnabled ? 21 : 3,
            transition: 'left 150ms ease, background-color 150ms ease',
          }} />
        </button>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!isAvailable || !prompt.trim() || loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '10px 20px',
          backgroundColor: loading ? 'var(--nebula)' : 'var(--sun)',
          color: loading ? 'var(--text-secondary)' : 'var(--void)',
          border: 'none',
          borderRadius: 9999,
          fontSize: 13,
          fontWeight: 600,
          cursor: !isAvailable || !prompt.trim() || loading ? 'not-allowed' : 'pointer',
          opacity: !isAvailable || !prompt.trim() ? 0.4 : 1,
          transition: 'all 150ms ease',
        }}
      >
        {loading ? (
          <InProgress size={14} style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <Star size={14} />
        )}
        {loading ? 'Gerando...' : 'Gerar Imagem'}
      </button>

      {/* Error */}
      {error && (
        <div style={{
          padding: '10px 14px',
          backgroundColor: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8,
          fontSize: 12,
          color: '#ef4444',
        }}>
          {error}
        </div>
      )}

      {/* Enhanced prompt display */}
      {result?.enhanced_prompt && (
        <div style={{
          padding: '10px 14px',
          backgroundColor: 'var(--deep)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
        }}>
          <span style={{ fontSize: 11, color: 'var(--sun)', fontWeight: 600 }}>
            Prompt aprimorado:
          </span>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.5 }}>
            {result.enhanced_prompt}
          </p>
        </div>
      )}

      {/* Results grid */}
      {result && result.images.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {result.images.length} {result.images.length === 1 ? 'imagem gerada' : 'imagens geradas'}
          </span>
          <div style={{
            display: 'grid',
            gridTemplateColumns: result.images.length > 1
              ? 'repeat(auto-fill, minmax(180px, 1fr))'
              : '1fr',
            gap: 12,
          }}>
            {result.images.map((img, i) => (
              <div
                key={i}
                style={{
                  position: 'relative',
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--deep)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={`Resultado ${i + 1}`}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 4,
                  padding: 8,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                }}>
                  <button
                    onClick={() => setPreviewUrl(img.url)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      transition: 'background-color 150ms ease',
                    }}
                    title="Ampliar"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <a
                    href={img.url}
                    download
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      transition: 'background-color 150ms ease',
                    }}
                    title="Baixar"
                  >
                    <Download size={14} />
                  </a>
                </div>
                <div style={{
                  padding: '6px 10px',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                }}>
                  {img.width} x {img.height}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading skeleton for images */}
      {loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: quantity > 1 ? 'repeat(auto-fill, minmax(180px, 1fr))' : '1fr',
          gap: 12,
        }}>
          {Array.from({ length: quantity }).map((_, i) => (
            <div
              key={i}
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--deep)',
              }}
            >
              <div style={{
                width: '100%',
                paddingTop: aspectRatio === '16:9' ? '56.25%'
                  : aspectRatio === '9:16' ? '177.78%'
                  : aspectRatio === '4:3' ? '75%'
                  : '100%',
                backgroundColor: 'var(--nebula)',
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }} />
              <div style={{ padding: '6px 10px' }}>
                <div style={{
                  width: 60,
                  height: 8,
                  backgroundColor: 'var(--nebula)',
                  borderRadius: 4,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen preview overlay */}
      {previewUrl && (
        <div
          onClick={() => setPreviewUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Preview"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: 12,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          />
        </div>
      )}
    </div>
  );
}
