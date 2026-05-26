'use client';

import { useState, useCallback } from 'react';
import Toast from '@/components/ui/Toast';

interface SkillDefault {
  skill_slug: string;
  skill_name: string;
  model: string;
  temperature: number;
  max_tokens: number;
}

const MODELS = ['gemini-2.0-flash', 'gpt-4o', 'claude-3-5-sonnet'];

const INITIAL_DEFAULTS: SkillDefault[] = [
  {
    skill_slug: 'copy-social',
    skill_name: 'Copy Social',
    model: 'gemini-2.0-flash',
    temperature: 0.7,
    max_tokens: 2048,
  },
  {
    skill_slug: 'plano-de-midia',
    skill_name: 'Plano de Mídia',
    model: 'gemini-2.0-flash',
    temperature: 0.3,
    max_tokens: 4096,
  },
  {
    skill_slug: 'briefing',
    skill_name: 'Briefing',
    model: 'gpt-4o',
    temperature: 0.5,
    max_tokens: 2048,
  },
];

type EditingCell = { slug: string; field: 'model' | 'temperature' | 'max_tokens' } | null;

export default function SkillsDefaultsTab() {
  const [defaults, setDefaults] = useState<SkillDefault[]>(INITIAL_DEFAULTS);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [toast, setToast] = useState<string | null>(null);
  const handleCloseToast = useCallback(() => setToast(null), []);

  const updateField = (slug: string, field: keyof Omit<SkillDefault, 'skill_slug' | 'skill_name'>, value: string | number) => {
    setDefaults((prev) =>
      prev.map((d) => (d.skill_slug === slug ? { ...d, [field]: value } : d)),
    );
    setDirty((prev) => new Set(prev).add(slug));
  };

  const handleSave = (slug: string) => {
    // Mock: mark row as saved
    setDirty((prev) => {
      const next = new Set(prev);
      next.delete(slug);
      return next;
    });
    setEditingCell(null);
    setToast('Default atualizado');
  };

  const cellStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
    transition: 'background-color 150ms ease',
  };

  return (
    <div>
      <div
        style={{
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          overflow: 'hidden',
          maxWidth: 720,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 180px 100px 110px 80px',
            padding: '8px 16px',
            backgroundColor: 'var(--deep)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {['Skill', 'Modelo', 'Temperatura', 'Max Tokens', ''].map((h) => (
            <span
              key={h}
              style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}
            >
              {h}
            </span>
          ))}
        </div>

        {defaults.map((d) => {
          const isDirty = dirty.has(d.skill_slug);
          return (
            <div
              key={d.skill_slug}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 180px 100px 110px 80px',
                padding: '10px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                borderLeft: isDirty ? '3px solid var(--sun)' : '3px solid transparent',
                transition: 'background-color 150ms ease',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--nebula)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
              }}
            >
              {/* Skill name */}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                {d.skill_name}
              </span>

              {/* Model */}
              <div>
                {editingCell?.slug === d.skill_slug && editingCell.field === 'model' ? (
                  <select
                    autoFocus
                    value={d.model}
                    onChange={(e) => updateField(d.skill_slug, 'model', e.target.value)}
                    onBlur={() => setEditingCell(null)}
                    style={{
                      fontSize: '0.8rem',
                      backgroundColor: 'var(--deep)',
                      border: '1px solid var(--sun)',
                      borderRadius: 4,
                      color: 'var(--text-primary)',
                      padding: '2px 6px',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {MODELS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    style={cellStyle}
                    onClick={() => setEditingCell({ slug: d.skill_slug, field: 'model' })}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLSpanElement).style.backgroundColor =
                        'var(--nebula)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLSpanElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    {d.model}
                  </span>
                )}
              </div>

              {/* Temperature */}
              <div>
                {editingCell?.slug === d.skill_slug && editingCell.field === 'temperature' ? (
                  <input
                    autoFocus
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={d.temperature}
                    onChange={(e) =>
                      updateField(d.skill_slug, 'temperature', parseFloat(e.target.value))
                    }
                    onBlur={() => setEditingCell(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave(d.skill_slug);
                    }}
                    style={{
                      width: 72,
                      fontSize: '0.8rem',
                      backgroundColor: 'var(--deep)',
                      border: '1px solid var(--sun)',
                      borderRadius: 4,
                      color: 'var(--text-primary)',
                      padding: '2px 6px',
                      outline: 'none',
                    }}
                  />
                ) : (
                  <span
                    style={cellStyle}
                    onClick={() => setEditingCell({ slug: d.skill_slug, field: 'temperature' })}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLSpanElement).style.backgroundColor =
                        'var(--nebula)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLSpanElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    {d.temperature.toFixed(1)}
                  </span>
                )}
              </div>

              {/* Max tokens */}
              <div>
                {editingCell?.slug === d.skill_slug && editingCell.field === 'max_tokens' ? (
                  <input
                    autoFocus
                    type="number"
                    min={256}
                    step={256}
                    value={d.max_tokens}
                    onChange={(e) =>
                      updateField(d.skill_slug, 'max_tokens', parseInt(e.target.value, 10))
                    }
                    onBlur={() => setEditingCell(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave(d.skill_slug);
                    }}
                    style={{
                      width: 80,
                      fontSize: '0.8rem',
                      backgroundColor: 'var(--deep)',
                      border: '1px solid var(--sun)',
                      borderRadius: 4,
                      color: 'var(--text-primary)',
                      padding: '2px 6px',
                      outline: 'none',
                    }}
                  />
                ) : (
                  <span
                    style={cellStyle}
                    onClick={() => setEditingCell({ slug: d.skill_slug, field: 'max_tokens' })}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLSpanElement).style.backgroundColor =
                        'var(--nebula)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLSpanElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    {d.max_tokens.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Save per row */}
              <div>
                {isDirty && (
                  <button
                    onClick={() => handleSave(d.skill_slug)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.7rem',
                      borderRadius: 6,
                      border: 'none',
                      backgroundColor: 'var(--sun)',
                      color: 'var(--void)',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    Salvar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 12 }}>
        Clique em uma célula para editar. Linha com borda amarela indica alteração não salva.
      </p>

      <Toast message={toast || ''} visible={!!toast} onClose={handleCloseToast} />
    </div>
  );
}
