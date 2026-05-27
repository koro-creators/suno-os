'use client';

/**
 * SPEC-015 — Step 2: Oracle configuration (allowed domains, language, depth).
 * Constitution §1.6: allow-list is a contract, not a suggestion.
 */

import { useState } from 'react';
import { Add, Close } from '@carbon/icons-react';
import { useOnboardingOraculo } from '@/contexts/OnboardingOraculoContext';

export default function WizardStep2Oracle() {
  const { wizardState, updateWizard } = useOnboardingOraculo();
  const [domainInput, setDomainInput] = useState('');

  const addDomain = () => {
    const trimmed = domainInput.trim().replace(/^https?:\/\//, '');
    if (!trimmed) return;
    if (wizardState.oracleConfig.allowedDomains.includes(trimmed)) return;
    updateWizard({
      oracleConfig: {
        ...wizardState.oracleConfig,
        allowedDomains: [...wizardState.oracleConfig.allowedDomains, trimmed],
      },
    });
    setDomainInput('');
  };

  const removeDomain = (domain: string) => {
    updateWizard({
      oracleConfig: {
        ...wizardState.oracleConfig,
        allowedDomains: wizardState.oracleConfig.allowedDomains.filter((d) => d !== domain),
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          Configurar Oráculo
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Defina as fontes de pesquisa e parâmetros do Oráculo do Cliente.
        </p>
      </div>

      {/* Allow-list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Domínios permitidos (allow-list)
        </label>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          O Oráculo só consultará estes domínios. Deixar vazio bloqueia pesquisa web.
        </p>

        {/* Domain input */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDomain(); } }}
            placeholder="ex: suno.com.br"
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--nebula)',
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
          <button
            onClick={addDomain}
            title="Adicionar domínio"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--nebula)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'border-color 150ms ease, color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--sun)';
              e.currentTarget.style.color = 'var(--sun)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <Add size={14} />
          </button>
        </div>

        {/* Domain tags */}
        {wizardState.oracleConfig.allowedDomains.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {wizardState.oracleConfig.allowedDomains.map((domain) => (
              <span
                key={domain}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 9999,
                  backgroundColor: 'var(--nebula)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  fontFamily: 'monospace',
                }}
              >
                {domain}
                <button
                  onClick={() => removeDomain(domain)}
                  title="Remover"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 150ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <Close size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Language */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Idioma da pesquisa
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['pt-BR', 'en-US'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => updateWizard({ oracleConfig: { ...wizardState.oracleConfig, language: lang } })}
              style={{
                padding: '7px 16px',
                borderRadius: 8,
                border: wizardState.oracleConfig.language === lang
                  ? '1px solid var(--sun)'
                  : '1px solid var(--border-subtle)',
                backgroundColor: wizardState.oracleConfig.language === lang
                  ? 'rgba(255,200,1,0.08)'
                  : 'var(--nebula)',
                color: wizardState.oracleConfig.language === lang
                  ? 'var(--sun)'
                  : 'var(--text-secondary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {lang === 'pt-BR' ? 'Português (BR)' : 'English (US)'}
            </button>
          ))}
        </div>
      </div>

      {/* Depth */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Profundidade de pesquisa
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          {([
            { value: 'shallow', label: 'Rápida', desc: '~5 min' },
            { value: 'standard', label: 'Padrão', desc: '~15 min' },
            { value: 'deep', label: 'Profunda', desc: '~30 min' },
          ] as const).map(({ value, label, desc }) => (
            <button
              key={value}
              onClick={() => updateWizard({ oracleConfig: { ...wizardState.oracleConfig, depth: value } })}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: 8,
                border: wizardState.oracleConfig.depth === value
                  ? '1px solid var(--sun)'
                  : '1px solid var(--border-subtle)',
                backgroundColor: wizardState.oracleConfig.depth === value
                  ? 'rgba(255,200,1,0.08)'
                  : 'var(--nebula)',
                color: wizardState.oracleConfig.depth === value
                  ? 'var(--sun)'
                  : 'var(--text-secondary)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 150ms ease',
              }}
            >
              <div style={{ fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
