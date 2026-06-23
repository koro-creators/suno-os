'use client';

/**
 * SPEC-015 — Step 3: documentos para o Oráculo + equipe alocada + pasta workspace Suno.
 *
 * Três seções:
 *   1. Documentos — cards por tipo (Proposta, Ata, Contrato, Outros), cada com
 *      link Drive; links somam a selectedDocIds no WizardState.
 *   2. Equipe Alocada — linhas cargo + pessoa (pode ser "A contratar"), UI-only.
 *   3. Pasta no workspace Suno — folder Drive da Suno para este cliente.
 */

import { useState, useEffect } from 'react';
import { Add, Checkmark, Copy, FolderOpen, TrashCan } from '@carbon/icons-react';
import { useOnboardingOraculo } from '@/contexts/OnboardingOraculoContext';
import { apiAvailable, getDriveServiceAccount, validateDriveFolder } from '@/lib/api';
import type { DocType } from '@/lib/onboarding-types';

// ---------------------------------------------------------------------------
// Constantes locais
// ---------------------------------------------------------------------------

const DOC_TYPE_OPTIONS: DocType[] = ['Proposta Comercial', 'Ata de Kickoff', 'Contrato', 'Outro'];

const ROLE_OPTIONS = [
  'Gerente de Projetos',
  'Analista de Criação',
  'Analista de Mídia',
  'Analista de Planejamento',
  'Diretor de Conta',
  'Coordenador de Redes Sociais',
  'Designer',
  'Redator',
];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export default function WizardStep3Drive() {
  const { wizardState, updateWizard } = useOnboardingOraculo();

  // Docs e teamRows vivem no wizardState — inicializados em emptyWizardState,
  // sobrevivem a navegação back/forward sem perder dados.
  const docs = wizardState.docEntries;
  const teamRows = wizardState.teamRows;

  // Workspace folder
  const [folderInput, setFolderInput] = useState(wizardState.driveFolder);
  const [saEmail, setSaEmail] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getDriveServiceAccount().then(setSaEmail);
  }, []);

  // ---------------------------------------------------------------------------
  // Handlers — documentos
  // ---------------------------------------------------------------------------

  const handleDocTypeChange = (id: string, type: DocType) => {
    updateWizard({ docEntries: docs.map((d) => d.id === id ? { ...d, type } : d) });
  };

  const handleDocUrlChange = (id: string, url: string) => {
    updateWizard({ docEntries: docs.map((d) => d.id === id ? { ...d, driveUrl: url, isValidated: false } : d) });
  };

  const handleRemoveDoc = (id: string) => {
    updateWizard({ docEntries: docs.filter((d) => d.id !== id) });
  };

  const handleAddDoc = () => {
    updateWizard({ docEntries: [...docs, { id: uid(), type: 'Outro' as DocType, driveUrl: '', isValidated: false }] });
  };

  // ---------------------------------------------------------------------------
  // Handlers — equipe
  // ---------------------------------------------------------------------------

  const handleTeamRoleChange = (id: string, role: string) => {
    updateWizard({ teamRows: teamRows.map((r) => r.id === id ? { ...r, role } : r) });
  };

  const handleTeamPersonChange = (id: string, person: string) => {
    updateWizard({ teamRows: teamRows.map((r) => r.id === id ? { ...r, person } : r) });
  };

  const handleRemoveTeamRow = (id: string) => {
    updateWizard({ teamRows: teamRows.filter((r) => r.id !== id) });
  };

  const handleAddTeamRow = () => {
    updateWizard({ teamRows: [...teamRows, { id: uid(), role: '', person: '' }] });
  };

  // ---------------------------------------------------------------------------
  // Handlers — workspace folder
  // ---------------------------------------------------------------------------

  const handleValidateFolder = async () => {
    if (!folderInput.trim()) return;
    setIsValidating(true);
    setFolderError(null);
    try {
      const info = await validateDriveFolder(folderInput.trim());
      updateWizard({ driveFolder: folderInput.trim(), driveFolderName: info.folder_name });
    } catch (err) {
      setFolderError(err instanceof Error ? err.message : 'Erro ao validar a pasta.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveFolder = () => {
    updateWizard({ driveFolder: '', driveFolderName: null });
    setFolderInput('');
    setFolderError(null);
  };

  const handleCopyEmail = async () => {
    if (!saEmail) return;
    try {
      await navigator.clipboard.writeText(saEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível
    }
  };

  const offline = !apiAvailable();

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const sectionTitle = (text: string) => (
    <h3
      style={{
        fontSize: '0.82rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        marginBottom: 12,
      }}
    >
      {text}
    </h3>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ------------------------------------------------------------------ */}
      {/* Seção 1 — Documentos                                               */}
      {/* ------------------------------------------------------------------ */}

      <div>
        {sectionTitle('Documentos para o Oráculo')}
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>
          Adicione propostas, contratos e atas que alimentarão o Oráculo. Cada documento pode ser um link do Drive da Suno.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {docs.map((doc) => (
            <div
              key={doc.id}
              style={{
                padding: '14px 16px',
                borderRadius: 10,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--nebula)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {/* Tipo + remover */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  value={doc.type}
                  onChange={(e) => handleDocTypeChange(doc.id, e.target.value as DocType)}
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--deep)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 6,
                    padding: '5px 10px',
                    fontSize: '0.78rem',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {DOC_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {docs.length > 1 && (
                  <button
                    onClick={() => handleRemoveDoc(doc.id)}
                    aria-label="Remover documento"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 6,
                      borderRadius: 6,
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <TrashCan size={13} />
                  </button>
                )}
              </div>

              {/* Link Drive */}
              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 5 }}>
                  Link do Drive
                </p>
                <input
                  value={doc.driveUrl}
                  onChange={(e) => handleDocUrlChange(doc.id, e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: 'var(--deep)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 6,
                    padding: '7px 10px',
                    fontSize: '0.75rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--sun)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.12)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddDoc}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 10,
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px dashed var(--border-subtle)',
            backgroundColor: 'transparent',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            transition: 'border-color 150ms ease, color 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--twilight)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <Add size={13} />
          Adicionar documento
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Seção 2 — Equipe Alocada                                           */}
      {/* ------------------------------------------------------------------ */}

      <div>
        {sectionTitle('Equipe Alocada')}
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>
          Cargos e pessoas do time Suno responsáveis por este cliente.
          Futuramente as listas virão de bases externas de RH.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 32px',
              gap: 8,
              paddingBottom: 4,
            }}
          >
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cargo</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pessoa</span>
            <span />
          </div>

          {teamRows.map((row) => (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 32px',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <select
                value={row.role}
                onChange={(e) => handleTeamRoleChange(row.id, e.target.value)}
                style={{
                  backgroundColor: 'var(--nebula)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  color: row.role ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="">Selecionar cargo</option>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              <select
                value={row.person}
                onChange={(e) => handleTeamPersonChange(row.id, e.target.value)}
                style={{
                  backgroundColor: 'var(--nebula)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  color: row.person ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="">Selecionar pessoa</option>
                <option value="a_contratar">A contratar</option>
              </select>

              {teamRows.length > 1 && (
                <button
                  onClick={() => handleRemoveTeamRow(row.id)}
                  aria-label="Remover cargo"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 6,
                    borderRadius: 6,
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <TrashCan size={12} />
                </button>
              )}
              {teamRows.length === 1 && <span />}
            </div>
          ))}
        </div>

        <button
          onClick={handleAddTeamRow}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 10,
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px dashed var(--border-subtle)',
            backgroundColor: 'transparent',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            transition: 'border-color 150ms ease, color 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--twilight)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <Add size={13} />
          Adicionar cargo
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Seção 3 — Pasta no workspace Suno                                  */}
      {/* ------------------------------------------------------------------ */}

      <div>
        {sectionTitle('Pasta no workspace Suno')}
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>
          Pasta da Suno no Google Drive que armazena os arquivos deste cliente.
          Opcional — sem ela o Oráculo usa os documentos acima e pesquisa web.
        </p>

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
                borderRadius: 10,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <p style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                1. Compartilhe a pasta com a conta de serviço (como Leitor)
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <code
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--deep)',
                    padding: '6px 10px',
                    borderRadius: 6,
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
                    borderRadius: 6,
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
                borderRadius: 10,
                padding: 14,
              }}
            >
              <p style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 6px' }}>
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
                    borderRadius: 6,
                    padding: '7px 10px',
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
                  onClick={handleValidateFolder}
                  disabled={isValidating || !folderInput.trim()}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: 'var(--sun)',
                    color: '#000',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: isValidating || !folderInput.trim() ? 'not-allowed' : 'pointer',
                    opacity: isValidating || !folderInput.trim() ? 0.5 : 1,
                    transition: 'opacity 150ms ease',
                    flexShrink: 0,
                  }}
                >
                  {isValidating ? 'Validando…' : 'Validar'}
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
              borderRadius: 10,
              padding: 14,
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
              onClick={handleRemoveFolder}
              aria-label="Remover pasta"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 7,
                borderRadius: 6,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <TrashCan size={13} />
            </button>
          </div>
        )}

        {/* Erro de validação da pasta */}
        {folderError && (
          <div
            role="alert"
            style={{
              marginTop: 10,
              padding: '10px 14px',
              backgroundColor: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8,
              fontSize: '0.75rem',
              color: '#f87171',
            }}
          >
            {folderError}
          </div>
        )}

        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 10 }}>
          Você pode prosseguir sem pasta e conectá-la depois no editor do cliente.
        </p>
      </div>
    </div>
  );
}
