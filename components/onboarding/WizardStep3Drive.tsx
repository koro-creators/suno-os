'use client';

/**
 * SPEC-015 — Step 3: pasta do cliente no Drive da Suno (recorte da SPEC-006).
 *
 * O admin compartilha a pasta com a service account (Leitor) e valida o link
 * aqui. O vínculo + sync acontecem na confirmação (passo 4), quando o cliente
 * é criado. Opcional — sem pasta, o Oráculo usa briefing + pesquisa web.
 */

import { useState, useEffect } from 'react';
import { Checkmark, Copy, FolderOpen, TrashCan } from '@carbon/icons-react';
import { useOnboardingOraculo } from '@/contexts/OnboardingOraculoContext';
import { apiAvailable, getDriveServiceAccount, validateDriveFolder } from '@/lib/api';

export default function WizardStep3Drive() {
  const { wizardState, updateWizard } = useOnboardingOraculo();
  const [folderInput, setFolderInput] = useState(wizardState.driveFolder);
  const [saEmail, setSaEmail] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getDriveServiceAccount().then(setSaEmail);
  }, []);

  const handleValidate = async () => {
    if (!folderInput.trim()) return;
    setIsValidating(true);
    setErrorMessage(null);
    try {
      const info = await validateDriveFolder(folderInput.trim());
      updateWizard({ driveFolder: folderInput.trim(), driveFolderName: info.folder_name });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao validar a pasta.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    updateWizard({ driveFolder: '', driveFolderName: null });
    setFolderInput('');
    setErrorMessage(null);
  };

  const handleCopyEmail = async () => {
    if (!saEmail) return;
    try {
      await navigator.clipboard.writeText(saEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível — sem feedback
    }
  };

  const offline = !apiAvailable();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          Pasta do cliente no Drive da Suno
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Os documentos da pasta entram na Biblioteca do cliente e alimentam o contexto do chat.
          Opcional — o Oráculo usa o Briefing e pesquisa web.
        </p>
      </div>

      {offline && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Backend não disponível (modo mock) — prossiga sem pasta.
        </p>
      )}

      {!offline && !wizardState.driveFolderName && (
        <>
          {/* Passo A — compartilhar com a SA */}
          <div
            style={{
              backgroundColor: 'var(--nebula)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 6px' }}>
              1. Compartilhe a pasta com a conta de serviço (como Leitor)
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <code
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--deep)',
                  padding: '6px 10px',
                  borderRadius: 8,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {saEmail ?? 'carregando…'}
              </code>
              <button
                onClick={handleCopyEmail}
                disabled={!saEmail}
                aria-label="Copiar e-mail da conta de serviço"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'transparent',
                  color: copied ? 'var(--sun)' : 'var(--text-secondary)',
                  fontSize: '0.7rem',
                  cursor: saEmail ? 'pointer' : 'not-allowed',
                  transition: 'color 150ms ease',
                }}
              >
                {copied ? <Checkmark size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Passo B — validar o link */}
          <div
            style={{
              backgroundColor: 'var(--nebula)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 6px' }}>
              2. Cole o link da pasta
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: '0.75rem',
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
                onClick={handleValidate}
                disabled={isValidating || !folderInput.trim()}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'var(--sun)',
                  color: '#000',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: isValidating || !folderInput.trim() ? 'not-allowed' : 'pointer',
                  opacity: isValidating || !folderInput.trim() ? 0.5 : 1,
                  transition: 'opacity 150ms ease',
                }}
              >
                {isValidating ? 'Validando…' : 'Validar pasta'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Pasta validada */}
      {wizardState.driveFolderName && (
        <div
          style={{
            backgroundColor: 'var(--nebula)',
            border: '1px solid rgba(255,200,1,0.25)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <FolderOpen size={20} style={{ color: 'var(--sun)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {wizardState.driveFolderName}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Acesso confirmado — será sincronizada ao criar o cliente
            </p>
          </div>
          <button
            onClick={handleRemove}
            aria-label="Remover pasta"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: 8,
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <TrashCan size={14} />
          </button>
        </div>
      )}

      {/* Erro */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8,
            fontSize: '0.75rem',
            color: '#f87171',
          }}
        >
          {errorMessage}
        </div>
      )}

      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        Você pode prosseguir sem pasta e conectá-la depois no editor do cliente (aba Drive).
      </p>
    </div>
  );
}
