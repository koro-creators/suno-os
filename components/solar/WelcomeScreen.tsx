'use client';

import { useRouter } from 'next/navigation';
import { Group, Star, Close, Help } from '@carbon/icons-react';
import { useAuth } from '@/contexts/AuthContext';

interface WelcomeScreenProps {
  onDismiss?: () => void;
  overlay?: boolean;
  onOpenGuide?: () => void;
}

export default function WelcomeScreen({ onDismiss, overlay = false, onOpenGuide }: WelcomeScreenProps) {
  const router = useRouter();
  const { isAdmin } = useAuth();

  const handleNavigate = (href: string) => {
    onDismiss?.();
    router.push(href);
  };

  const containerStyle: React.CSSProperties = overlay
    ? {
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: '48px 24px',
        textAlign: 'center',
        background: 'var(--void)',
      };

  const card = (
    <div
      style={{
        position: 'relative',
        background: 'var(--deep)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
        padding: overlay ? '48px 40px 40px' : '0',
        maxWidth: 480,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {overlay && onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Fechar boas-vindas"
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
          <Close size={16} />
        </button>
      )}

      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--sun)',
          marginBottom: 24,
          boxShadow: '0 0 40px rgba(255,200,1,0.25)',
          flexShrink: 0,
        }}
      />

      <h1
        style={{
          fontSize: '1.75rem',
          fontWeight: 300,
          color: 'var(--text-primary)',
          margin: '0 0 8px',
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
        }}
      >
        Bem-vindo ao sunOS
      </h1>

      <p
        style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          margin: '0 0 32px',
          maxWidth: 360,
          lineHeight: 1.6,
        }}
      >
        Sua plataforma de IA da Suno United Creators. Organize skills, gerencie clientes e colabore com seu time.
      </p>

      {isAdmin ? (
        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: onDismiss ? 20 : 0,
          }}
        >
          <button
            onClick={() => handleNavigate('/clientes/new')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--sun)',
              color: '#000',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <Group size={14} />
            Criar primeiro cliente
          </button>

          <button
            onClick={() => handleNavigate('/skills')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--twilight)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)'; }}
          >
            <Star size={14} />
            Explorar Skills
          </button>
        </div>
      ) : (
        onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--sun)',
              color: '#000',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'opacity 150ms ease',
              marginBottom: 20,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            Começar
          </button>
        )
      )}

      {onOpenGuide && (
        <button
          onClick={onOpenGuide}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            color: 'var(--text-muted)',
            border: 'none',
            padding: '6px 0',
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'color 150ms ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
        >
          <Help size={13} />
          Como começar?
        </button>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div style={containerStyle} onClick={(e) => { if (e.target === e.currentTarget) onDismiss?.(); }}>
        {card}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {card}
    </div>
  );
}
