'use client';

/**
 * SPEC-015 — Step 1: Client metadata (name, slug, color, sponsor info).
 */

import { useOnboardingOraculo } from '@/contexts/OnboardingOraculoContext';

const RANDOM_COLORS = ['#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#22C55E', '#F472B6', '#A3E635', '#FFC801'];

export default function WizardStep1Metadata() {
  const { wizardState, updateWizard } = useOnboardingOraculo();

  const handleSlugify = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    updateWizard({ name, slug });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 4,
          }}
        >
          Dados do Cliente
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Informações básicas do novo cliente.
        </p>
      </div>

      {/* Name */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Nome do cliente <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <input
          type="text"
          value={wizardState.name}
          onChange={(e) => handleSlugify(e.target.value)}
          placeholder="Ex: Suno United Creators"
          style={{
            padding: '9px 12px',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--nebula)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            outline: 'none',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--twilight)';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Slug */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Slug (URL) <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <input
          type="text"
          value={wizardState.slug}
          onChange={(e) =>
            updateWizard({
              slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
            })
          }
          placeholder="suno-united-creators"
          style={{
            padding: '9px 12px',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--nebula)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            outline: 'none',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--twilight)';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          Apenas letras minúsculas, números e hifens.
        </span>
      </div>

      {/* Description */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Descrição
        </label>
        <textarea
          value={wizardState.description}
          onChange={(e) => updateWizard({ description: e.target.value })}
          placeholder="Breve descrição do cliente..."
          rows={3}
          style={{
            padding: '9px 12px',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--nebula)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            outline: 'none',
            resize: 'vertical',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--twilight)';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Color */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Cor de identificação
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {RANDOM_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => updateWizard({ color: c })}
              title={c}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: c,
                border: wizardState.color === c ? '3px solid var(--text-primary)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'border-color 150ms ease, transform 150ms ease',
                transform: wizardState.color === c ? 'scale(1.15)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Sponsor info */}
      <div
        style={{
          padding: 16,
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--nebula)',
        }}
      >
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Contato Sponsor
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="text"
            value={wizardState.sponsorName}
            onChange={(e) => updateWizard({ sponsorName: e.target.value })}
            placeholder="Nome do sponsor"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--deep)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--twilight)';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <input
            type="email"
            value={wizardState.sponsorEmail}
            onChange={(e) => updateWizard({ sponsorEmail: e.target.value })}
            placeholder="email@cliente.com"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--deep)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--twilight)';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>
    </div>
  );
}
