'use client';

import { SkillAdmin } from '@/lib/admin-types';
import { SkillType } from '@/lib/types';

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'transparent',
  border: '1px solid var(--border-subtle)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: '0.8rem',
  color: 'var(--text-primary)',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.7rem',
  color: 'var(--text-secondary)',
  marginBottom: 4,
  fontWeight: 500,
};

function focusRing(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'var(--sun)';
  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
}

function blurRing(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'var(--border-subtle)';
  e.currentTarget.style.boxShadow = 'none';
}

const ICON_OPTIONS = ['Radio', 'MessageSquare', 'Video', 'BarChart3', 'TrendingUp', 'UserCircle', 'FileText', 'Search', 'Target', 'Mic'];
const TYPE_OPTIONS: { label: string; value: SkillType }[] = [
  { label: 'Criação', value: 'criacao' },
  { label: 'Mídia', value: 'midia' },
  { label: 'Planejamento', value: 'planejamento' },
];
const STATUS_OPTIONS = [
  { label: 'Ativo', value: 'active' },
  { label: 'Rascunho', value: 'draft' },
  { label: 'Arquivado', value: 'archived' },
];

interface IdentityTabProps {
  data: SkillAdmin;
  onChange: (patch: Partial<SkillAdmin>) => void;
  errors?: Record<string, string>;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function IdentityTab({ data, onChange, errors }: IdentityTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
      <div>
        <label htmlFor="skill-name" style={labelStyle}>Nome *</label>
        <input
          id="skill-name"
          type="text"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value, slug: slugify(e.target.value) })}
          style={{
            ...inputStyle,
            borderColor: errors?.name ? '#EF4444' : undefined,
          }}
          onFocus={focusRing}
          onBlur={blurRing}
        />
        {errors?.name && <span style={{ fontSize: '0.65rem', color: '#EF4444', marginTop: 2 }}>{errors.name}</span>}
      </div>

      <div>
        <label htmlFor="skill-slug" style={labelStyle}>Slug</label>
        <input
          id="skill-slug"
          type="text"
          value={data.slug}
          readOnly
          style={{ ...inputStyle, color: 'var(--text-muted)' }}
        />
      </div>

      <div>
        <label htmlFor="skill-type" style={labelStyle}>Tipo *</label>
        <select
          id="skill-type"
          value={data.type}
          onChange={(e) => onChange({ type: e.target.value as SkillType })}
          style={{ ...inputStyle, cursor: 'pointer', borderColor: errors?.type ? '#EF4444' : undefined }}
          onFocus={focusRing as unknown as React.FocusEventHandler<HTMLSelectElement>}
          onBlur={blurRing as unknown as React.FocusEventHandler<HTMLSelectElement>}
        >
          <option value="">Selecione...</option>
          {TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {errors?.type && <span style={{ fontSize: '0.65rem', color: '#EF4444', marginTop: 2 }}>{errors.type}</span>}
      </div>

      <div>
        <label htmlFor="skill-description" style={labelStyle}>Descrição</label>
        <textarea
          id="skill-description"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
          onFocus={focusRing as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
          onBlur={blurRing as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
        />
      </div>

      <div>
        <label htmlFor="skill-icon" style={labelStyle}>Ícone</label>
        <select
          id="skill-icon"
          value={data.icon}
          onChange={(e) => onChange({ icon: e.target.value })}
          style={{ ...inputStyle, cursor: 'pointer' }}
          onFocus={focusRing as unknown as React.FocusEventHandler<HTMLSelectElement>}
          onBlur={blurRing as unknown as React.FocusEventHandler<HTMLSelectElement>}
        >
          {ICON_OPTIONS.map((ic) => (
            <option key={ic} value={ic}>{ic}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="skill-status" style={labelStyle}>Status</label>
        <select
          id="skill-status"
          value={data.status}
          onChange={(e) => onChange({ status: e.target.value as SkillAdmin['status'] })}
          style={{ ...inputStyle, cursor: 'pointer' }}
          onFocus={focusRing as unknown as React.FocusEventHandler<HTMLSelectElement>}
          onBlur={blurRing as unknown as React.FocusEventHandler<HTMLSelectElement>}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
