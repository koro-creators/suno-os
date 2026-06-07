'use client';

/**
 * Painel "Gerar Oráculo" para clientes legados (sem ontologia/Wiki).
 * Chama o backfill (cria job + dispara o Oráculo) e redireciona para a página
 * de progresso, reusando o fluxo do wizard (progresso → HITL → Wiki).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Idea } from '@carbon/icons-react';
import { backfillOnboarding } from '@/lib/api';

export default function GerarOraculoPanel({ slug }: { slug: string }) {
  const router = useRouter();
  const [domains, setDomains] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    const list = domains
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
    const { ok, status } = await backfillOnboarding(slug, list);
    if (ok) {
      router.push(`/clientes/${slug}/onboarding/progress`);
      return;
    }
    setError(
      status === 409
        ? 'Este cliente já possui Oráculo.'
        : 'Não foi possível iniciar o Oráculo. Tente novamente.'
    );
    setLoading(false);
  }

  return (
    <div
      style={{
        maxWidth: 560,
        margin: '16px auto 0',
        backgroundColor: 'var(--deep)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Idea size={16} style={{ color: 'var(--sun)' }} />
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Oráculo do Cliente
        </span>
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
        Gera a Wiki Ontológica (6 entidades) deste cliente via Oráculo. Informe domínios para a
        pesquisa web (separados por vírgula) — vazio gera sem pesquisa.
      </p>

      <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
        Domínios permitidos (allow-list)
      </label>
      <input
        type="text"
        value={domains}
        onChange={(e) => setDomains(e.target.value)}
        placeholder="ex: cliente.com.br, wikipedia.org"
        disabled={loading}
        style={{
          width: '100%',
          backgroundColor: 'transparent',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: '0.8rem',
          color: 'var(--text-primary)',
          outline: 'none',
          marginBottom: 14,
        }}
      />

      {error && (
        <div style={{ fontSize: '0.75rem', color: '#EF4444', marginBottom: 12 }}>{error}</div>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{
          padding: '8px 20px',
          borderRadius: 8,
          border: '1px solid var(--sun)',
          backgroundColor: 'var(--sun)',
          color: 'var(--void)',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Iniciando…' : 'Gerar Oráculo'}
      </button>
    </div>
  );
}
