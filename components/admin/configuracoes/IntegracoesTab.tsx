'use client';

import { useState, useCallback } from 'react';
import { Star } from '@carbon/icons-react';
import Toast from '@/components/ui/Toast';

interface Integration {
  key: string;
  name: string;
  description: string;
  icon: 'Star';
  valueMasked: string | null;
}

const INTEGRATIONS: Integration[] = [
  {
    key: 'gemini_api_key',
    name: 'Gemini API',
    description: 'Chave de API do Google Gemini para geração de conteúdo',
    icon: 'Star',
    valueMasked: null,
  },
];

function IntegrationIcon({ icon }: { icon: Integration['icon'] }) {
  if (icon === 'Star') return <Star size={20} />;
  return null;
}

export default function IntegracoesTab() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [configured, setConfigured] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const handleCloseToast = useCallback(() => setToast(null), []);

  const handleSave = (key: string) => {
    // Mock: mark as configured and show masked value
    setConfigured((prev) => ({ ...prev, [key]: true }));
    setValues((prev) => ({ ...prev, [key]: '' }));
    setToast('Integração salva');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
      {INTEGRATIONS.map((integration) => {
        const isConfigured = configured[integration.key];
        const currentValue = values[integration.key] ?? '';

        return (
          <div
            key={integration.key}
            style={{
              backgroundColor: 'var(--deep)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: 20,
            }}
          >
            {/* Card header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 16,
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ color: 'var(--text-secondary)' }}>
                  <IntegrationIcon icon={integration.icon} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: 2,
                    }}
                  >
                    {integration.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {integration.description}
                  </div>
                </div>
              </div>

              {/* Status badge */}
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 10px',
                  borderRadius: 9999,
                  border: '1px solid var(--border-subtle)',
                  color: isConfigured ? '#22C55E' : 'var(--text-muted)',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {isConfigured ? 'Configurado' : 'Não configurado'}
              </span>
            </div>

            {/* Input + Save */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="password"
                value={currentValue}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [integration.key]: e.target.value }))
                }
                placeholder={isConfigured ? '***...k3X9' : 'Cole a chave de API aqui'}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sun)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <button
                onClick={() => handleSave(integration.key)}
                disabled={!currentValue.trim()}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'var(--sun)',
                  color: 'var(--void)',
                  cursor: currentValue.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: 500,
                  opacity: currentValue.trim() ? 1 : 0.5,
                  transition: 'opacity 150ms ease',
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        );
      })}

      <Toast message={toast || ''} visible={!!toast} onClose={handleCloseToast} />
    </div>
  );
}
