'use client';

import React, { useState } from 'react';
import { Checkmark, Copy, InProgress, Star, TextScale } from '@carbon/icons-react';
import { apiAvailable, generateText, TextGenResponse } from '@/lib/api';

const CONTENT_TYPES = [
  { value: 'social_post', label: 'Post social' },
  { value: 'article', label: 'Artigo' },
  { value: 'caption', label: 'Legenda' },
  { value: 'email', label: 'E-mail' },
  { value: 'script', label: 'Roteiro' },
];

const TONES = [
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'professional', label: 'Profissional' },
  { value: 'creative', label: 'Criativo' },
  { value: 'friendly', label: 'Amigavel' },
];

const LENGTHS = [
  { value: 'short', label: 'Curto' },
  { value: 'medium', label: 'Medio' },
  { value: 'long', label: 'Longo' },
];

interface TextGenPanelProps {
  skillSlug?: string;
  model?: string;
}

export default function TextGenPanel({ skillSlug, model }: TextGenPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState('social_post');
  const [tone, setTone] = useState('creative');
  const [length, setLength] = useState('medium');
  const [variations, setVariations] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TextGenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const isAvailable = apiAvailable();

  async function handleGenerate() {
    if (!prompt.trim() || !isAvailable) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await generateText({
        prompt: prompt.trim(),
        content_type: contentType,
        tone,
        length,
        variations,
        skill_slug: skillSlug,
        model: model || 'gemini-flash',
      });
      setResult(res);
    } catch (err) {
      setError((err as Error).message || 'Falha ao gerar texto');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Clipboard not available
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
        <TextScale size={14} style={{ color: 'var(--sun)' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Gerar Texto
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
          placeholder="Descreva o que voce quer gerar..."
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
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 12,
      }}>
        <div>
          <label style={labelStyle}>Tipo</label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            disabled={!isAvailable}
            style={selectStyle}
          >
            {CONTENT_TYPES.map((ct) => (
              <option key={ct.value} value={ct.value}>{ct.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Tom</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            disabled={!isAvailable}
            style={selectStyle}
          >
            {TONES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Tamanho</label>
          <select
            value={length}
            onChange={(e) => setLength(e.target.value)}
            disabled={!isAvailable}
            style={selectStyle}
          >
            {LENGTHS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Variations slider */}
      <div>
        <label style={labelStyle}>
          Variacoes: <span style={{ color: 'var(--sun)', fontWeight: 600 }}>{variations}</span>
        </label>
        <input
          type="range"
          min={1}
          max={4}
          value={variations}
          onChange={(e) => setVariations(Number(e.target.value))}
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
        {loading ? 'Gerando...' : 'Gerar'}
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

      {/* Results */}
      {result && result.texts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {result.texts.length} {result.texts.length === 1 ? 'resultado' : 'resultados'}
          </span>
          <div style={{
            display: 'grid',
            gridTemplateColumns: result.texts.length > 1 ? '1fr 1fr' : '1fr',
            gap: 12,
          }}>
            {result.texts.map((text, i) => (
              <div
                key={i}
                style={{
                  padding: 14,
                  backgroundColor: 'var(--deep)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  position: 'relative',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}>
                  <span style={{
                    fontSize: 11,
                    color: 'var(--sun)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Variacao {i + 1}
                  </span>
                  <button
                    onClick={() => handleCopy(text, i)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 6,
                      color: copiedIndex === i ? 'var(--sun)' : 'var(--text-muted)',
                      fontSize: 11,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {copiedIndex === i ? (
                      <Checkmark size={12} />
                    ) : (
                      <Copy size={12} />
                    )}
                    {copiedIndex === i ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <p style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: variations > 1 ? '1fr 1fr' : '1fr',
          gap: 12,
        }}>
          {Array.from({ length: variations }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: 14,
                backgroundColor: 'var(--deep)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
              }}
            >
              <div style={{
                height: 10,
                width: '40%',
                backgroundColor: 'var(--nebula)',
                borderRadius: 4,
                marginBottom: 12,
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[100, 85, 70].map((w, j) => (
                  <div
                    key={j}
                    style={{
                      height: 8,
                      width: `${w}%`,
                      backgroundColor: 'var(--nebula)',
                      borderRadius: 4,
                      animation: 'pulse 1.5s ease-in-out infinite',
                      animationDelay: `${j * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
