'use client';

/**
 * SPEC-015 — Step 3: Drive Suno document selection.
 * PRE-03: Drive integration (SPEC-006) may not be available yet.
 * Placeholder shown when Drive is not connected.
 */

import { FolderOpen, Warning } from '@carbon/icons-react';

export default function WizardStep3Drive() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          Documentos Drive Suno
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Selecione documentos do Drive Suno para alimentar o Oráculo. Opcional — o Oráculo também usa pesquisa web.
        </p>
      </div>

      {/* Placeholder — Drive not connected */}
      <div
        style={{
          padding: 32,
          borderRadius: 12,
          border: '1px dashed var(--border-subtle)',
          backgroundColor: 'var(--nebula)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: 'var(--deep)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FolderOpen size={20} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 6 }}>
            Drive Suno não conectado
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 340 }}>
            A integração com Drive Suno (SPEC-006) estará disponível em breve.
            O Oráculo utilizará pesquisa web e os dados do Briefing para gerar as entidades.
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 9999,
            backgroundColor: 'rgba(255,200,1,0.08)',
            border: '1px solid rgba(255,200,1,0.2)',
          }}
        >
          <Warning size={12} style={{ color: 'var(--sun)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--sun)' }}>
            PRE-03: Drive Suno ainda não disponível
          </span>
        </div>
      </div>

      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        Você pode prosseguir sem documentos. O Oráculo gerará as 6 entidades usando os domínios
        configurados no passo anterior e o Briefing fornecido.
      </p>
    </div>
  );
}
