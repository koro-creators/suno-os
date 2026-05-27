'use client';

import { useRouter } from 'next/navigation';
import { Globe, Sparkles, BookOpen, Settings, X, ArrowRight } from 'lucide-react';

interface Step {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  cta: string;
}

const STEPS: Step[] = [
  {
    icon: Globe,
    title: 'Explore o sistema solar',
    description: 'Navegue pelo mapa visual de clientes. Cada planeta representa um cliente e suas skills.',
    href: '/',
    cta: 'Ver sistema solar',
  },
  {
    icon: Sparkles,
    title: 'Use uma skill',
    description: 'Abra o chat com qualquer skill para gerar conteúdo, briefings e muito mais.',
    href: '/',
    cta: 'Explorar skills',
  },
  {
    icon: BookOpen,
    title: 'Configure a Biblioteca',
    description: 'Adicione documentos de contexto, guidelines de marca e referências de conteúdo.',
    href: '/biblioteca',
    cta: 'Ir para Biblioteca',
  },
  {
    icon: Settings,
    title: 'Configure integrações',
    description: 'Conecte drives, aprovações e outras integrações para o seu fluxo de trabalho.',
    href: '/configuracoes',
    cta: 'Ver Configurações',
  },
];

interface GettingStartedGuideProps {
  onClose: () => void;
}

export default function GettingStartedGuide({ onClose }: GettingStartedGuideProps) {
  const router = useRouter();

  const handleStep = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div
        style={{
          position: 'relative',
          background: 'var(--deep)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16,
          padding: '40px 36px 32px',
          maxWidth: 520,
          width: '100%',
          margin: '0 16px',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Fechar guia"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            padding: 4,
            borderRadius: 6,
            transition: 'color 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <X size={16} strokeWidth={1.5} />
        </button>

        {/* Header */}
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 400,
            color: 'var(--text-primary)',
            margin: '0 0 6px',
          }}
        >
          Como começar
        </h2>
        <p
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            margin: '0 0 28px',
          }}
        >
          4 passos para tirar o máximo do sunOS
        </p>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 16px',
                  background: 'var(--nebula)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  transition: 'border-color 150ms ease, background-color 150ms ease',
                }}
                onClick={() => handleStep(step.href)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--twilight)';
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--nebula)';
                }}
              >
                {/* Step number + icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'var(--twilight)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'rgba(255,200,1,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={14} strokeWidth={1.5} style={{ color: 'var(--sun)' }} />
                  </div>
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      margin: '0 0 2px',
                    }}
                  >
                    {step.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.4,
                    }}
                  >
                    {step.description}
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight
                  size={14}
                  strokeWidth={1.5}
                  style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
