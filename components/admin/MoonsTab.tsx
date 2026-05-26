'use client';

import { Add, Draggable, TrashCan } from '@carbon/icons-react';
import { SkillAdmin } from '@/lib/admin-types';
import { Moon } from '@/lib/types';

const inputStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid var(--border-subtle)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: '0.8rem',
  color: 'var(--text-primary)',
  outline: 'none',
};

function focusRing(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = 'var(--sun)';
  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
}

function blurRing(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = 'var(--border-subtle)';
  e.currentTarget.style.boxShadow = 'none';
}

interface MoonsTabProps {
  data: SkillAdmin;
  onChange: (patch: Partial<SkillAdmin>) => void;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function MoonsTab({ data, onChange }: MoonsTabProps) {
  const updateMoon = (idx: number, patch: Partial<Moon>) => {
    const moons = [...data.moons];
    moons[idx] = { ...moons[idx], ...patch };
    onChange({ moons });
  };

  const removeMoon = (idx: number) => {
    const moons = data.moons.filter((_, i) => i !== idx);
    onChange({ moons });
  };

  const addMoon = () => {
    const id = `moon-${crypto.randomUUID().slice(0, 8)}`;
    onChange({
      moons: [...data.moons, { id, name: '', slug: '', description: '' }],
    });
  };

  return (
    <div style={{ maxWidth: 640 }}>
      {data.moons.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 16 }}>
          Nenhuma moon configurada
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.moons.map((moon, idx) => (
          <div
            key={moon.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Draggable
              size={14}
              style={{ color: 'var(--text-muted)', flexShrink: 0, cursor: 'grab' }}
            />
            <input
              type="text"
              placeholder="Nome"
              aria-label={`Nome da moon ${idx + 1}`}
              value={moon.name}
              onChange={(e) => updateMoon(idx, { name: e.target.value, slug: slugify(e.target.value) })}
              style={{ ...inputStyle, flex: '0 1 180px' }}
              onFocus={focusRing}
              onBlur={blurRing}
            />
            <input
              type="text"
              placeholder="Descrição"
              aria-label={`Descrição da moon ${idx + 1}`}
              value={moon.description}
              onChange={(e) => updateMoon(idx, { description: e.target.value })}
              style={{ ...inputStyle, flex: 1 }}
              onFocus={focusRing}
              onBlur={blurRing}
            />
            <button
              aria-label={`Remover moon ${moon.name || idx + 1}`}
              onClick={() => removeMoon(idx)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                borderRadius: 4,
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
            >
              <TrashCan size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addMoon}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 12,
          background: 'transparent',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          padding: '8px 14px',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'border-color 150ms ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--twilight)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)'; }}
      >
        <Add size={14} />
        Adicionar moon
      </button>
    </div>
  );
}
