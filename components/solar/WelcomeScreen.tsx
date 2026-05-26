'use client';

import { useRouter } from 'next/navigation';
import { Sparkles, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: '48px 24px',
        textAlign: 'center',
        background: 'var(--void)',
      }}
    >
      {/* Logo mark — sun circle */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--sun)',
          marginBottom: 32,
          boxShadow: '0 0 40px rgba(255,200,1,0.25)',
        }}
      />

      <h1
        style={{
          fontSize: '2rem',
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
          fontSize: '0.95rem',
          color: 'var(--text-secondary)',
          margin: '0 0 40px',
          maxWidth: 400,
          lineHeight: 1.6,
        }}
      >
        Sua plataforma de IA da Suno United Creators
      </p>

      {/* CTAs — only visible to admins; creators see the system on first client creation */}
      {isAdmin && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => router.push('/clientes/new')}
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
            <Users size={14} strokeWidth={1.5} />
            Criar primeiro cliente
          </button>

          <button
            onClick={() => router.push('/skills')}
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
            <Sparkles size={14} strokeWidth={1.5} />
            Explorar Skills
          </button>
        </div>
      )}
    </div>
  );
}
