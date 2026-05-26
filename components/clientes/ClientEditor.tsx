'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ClientAdmin } from '@/lib/client-types';
import { useSkills } from '@/contexts/SkillsContext';
import { useBiblioteca } from '@/contexts/BibliotecaContext';
import { useAuth } from '@/contexts/AuthContext';
import ClientEditorTabs from './ClientEditorTabs';
import DriveTab from '@/components/admin/clientes/tabs/DriveTab';
import Toast from '@/components/ui/Toast';

const TYPE_COLORS: Record<string, string> = {
  criacao: 'var(--criacao)',
  midia: 'var(--midia)',
  planejamento: 'var(--planejamento)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'transparent',
  border: '1px solid var(--border-subtle)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: '0.8rem',
  color: 'var(--text-primary)',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.7rem',
  color: 'var(--text-secondary)',
  marginBottom: 4,
  fontWeight: 500,
};

function focusRing(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'var(--sun)';
  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
}

function blurRing(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'var(--border-subtle)';
  e.currentTarget.style.boxShadow = 'none';
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function relativeTime(iso: string): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes}m atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

interface ClientEditorProps {
  initial: ClientAdmin;
  onSave: (data: ClientAdmin) => void;
  onDelete?: () => void;
  isNew?: boolean;
}

export default function ClientEditor({ initial, onSave, onDelete, isNew }: ClientEditorProps) {
  const router = useRouter();
  const { skills } = useSkills();
  const { documents } = useBiblioteca();
  const { isAdmin, loading: authLoading } = useAuth();

  // Use base tabs while auth is resolving to avoid Drive tab flashing in/out
  const editorTabs =
    !authLoading && isAdmin
      ? ['Identidade', 'Skills', 'Biblioteca', 'Métricas', 'Drive']
      : ['Identidade', 'Skills', 'Biblioteca', 'Métricas'];

  const [form, setForm] = useState<ClientAdmin>(initial);
  const [savedSnapshot, setSavedSnapshot] = useState<ClientAdmin>(initial);
  const [activeTab, setActiveTab] = useState('Identidade');
  const [toast, setToast] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleChange = (patch: Partial<ClientAdmin>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nome é obrigatório';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setActiveTab('Identidade');
      return;
    }
    setErrors({});
    onSave(form);
    setSavedSnapshot(form);
    setToast(isNew ? 'Cliente criado' : 'Cliente atualizado');
  };

  const handleDiscard = () => {
    setForm(savedSnapshot);
    setErrors({});
  };

  const handleDeleteClick = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    onDelete?.();
  };

  const handleCloseToast = useCallback(() => setToast(null), []);

  const toggleSkill = (skillId: string) => {
    const assigned = form.assignedSkills.includes(skillId)
      ? form.assignedSkills.filter((s) => s !== skillId)
      : [...form.assignedSkills, skillId];
    handleChange({ assignedSkills: assigned });
  };

  const clientDocs = documents.filter((doc) => doc.scope.includes(form.slug));

  const scoreColor =
    form.metrics.averageScore >= 4.0
      ? 'var(--sun)'
      : form.metrics.averageScore >= 3.0
        ? 'var(--text-secondary)'
        : 'var(--text-muted)';

  const isAllZero =
    form.metrics.totalSessions === 0 &&
    form.metrics.totalFeedbacks === 0 &&
    form.metrics.averageScore === 0 &&
    !form.metrics.topSkill &&
    !form.metrics.lastActivity;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: form.color || 'var(--text-muted)',
              flexShrink: 0,
            }}
          />
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange({ name: e.target.value, slug: slugify(e.target.value) })}
            aria-label="Nome do cliente"
            style={{
              fontSize: '1.5rem',
              fontWeight: 300,
              color: 'var(--text-primary)',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              padding: 0,
              minWidth: 100,
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isNew && onDelete && (
            <button
              onClick={handleDeleteClick}
              style={{
                fontSize: '0.8rem',
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'transparent',
                color: deleteConfirm ? '#EF4444' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'color 150ms ease, border-color 150ms ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#EF4444'; (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLButtonElement).style.color = deleteConfirm ? '#EF4444' : 'var(--text-secondary)'; }}
            >
              {deleteConfirm ? 'Confirmar?' : 'Excluir'}
            </button>
          )}
          {!isNew && (
            <button
              onClick={handleDiscard}
              style={{
                fontSize: '0.8rem',
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'border-color 150ms ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--twilight)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)'; }}
            >
              Descartar
            </button>
          )}
          <button
            onClick={handleSave}
            style={{
              fontSize: '0.8rem',
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: 'var(--sun)',
              color: 'var(--void)',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            {isNew ? 'Criar Cliente' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <ClientEditorTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={editorTabs} />

      {/* Tab: Identidade */}
      {activeTab === 'Identidade' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
          <div>
            <label htmlFor="client-name" style={labelStyle}>Nome *</label>
            <input
              id="client-name"
              type="text"
              value={form.name}
              onChange={(e) => handleChange({ name: e.target.value, slug: slugify(e.target.value) })}
              style={{
                ...inputStyle,
                borderColor: errors?.name ? '#EF4444' : undefined,
              }}
              onFocus={focusRing}
              onBlur={blurRing}
            />
            {errors?.name && <span style={{ fontSize: '0.65rem', color: '#EF4444', marginTop: 2 }}>{errors.name}</span>}
          </div>

          <div>
            <label htmlFor="client-slug" style={labelStyle}>Slug</label>
            <input
              id="client-slug"
              type="text"
              value={form.slug}
              readOnly
              style={{ ...inputStyle, color: 'var(--text-muted)' }}
            />
          </div>

          <div>
            <label htmlFor="client-color" style={labelStyle}>Cor</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                id="client-color"
                type="color"
                value={form.color}
                onChange={(e) => handleChange({ color: e.target.value })}
                style={{
                  width: 40,
                  height: 34,
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  padding: 2,
                }}
              />
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: form.color,
                  flexShrink: 0,
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="client-description" style={labelStyle}>Descrição</label>
            <textarea
              id="client-description"
              value={form.description}
              onChange={(e) => handleChange({ description: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={focusRing as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
              onBlur={blurRing as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
            />
          </div>

          <div>
            <label htmlFor="client-contact" style={labelStyle}>Contato</label>
            <input
              id="client-contact"
              type="text"
              value={form.contact}
              onChange={(e) => handleChange({ contact: e.target.value })}
              style={inputStyle}
              onFocus={focusRing}
              onBlur={blurRing}
            />
          </div>
        </div>
      )}

      {/* Tab: Skills */}
      {activeTab === 'Skills' && (
        <div style={{ maxWidth: 480 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            {form.assignedSkills.length} de {skills.length} skills atribuídos
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {skills.map((skill) => {
              const isOn = form.assignedSkills.includes(skill.id);
              const isDraft = skill.status === 'draft';
              return (
                <div
                  key={skill.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 8,
                    transition: 'background-color 150ms ease',
                    opacity: isDraft ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--surface-hover)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: TYPE_COLORS[skill.type] || 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{skill.name}</span>
                    <span
                      style={{
                        fontSize: '0.6rem',
                        padding: '2px 8px',
                        borderRadius: 9999,
                        border: '1px solid var(--border-subtle)',
                        color: skill.status === 'active' ? '#22C55E' : 'var(--sun)',
                      }}
                    >
                      {skill.status === 'active' ? 'Ativo' : 'Rascunho'}
                    </span>
                  </div>

                  <button
                    role="switch"
                    aria-checked={isOn}
                    aria-label={`${skill.name} ${isOn ? 'ativado' : 'desativado'}`}
                    onClick={() => toggleSkill(skill.id)}
                    style={{
                      width: 36,
                      height: 20,
                      borderRadius: 10,
                      border: 'none',
                      backgroundColor: isOn ? 'var(--sun)' : 'var(--nebula)',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background-color 200ms ease',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: isOn ? 18 : 2,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: isOn ? 'var(--void)' : 'var(--text-muted)',
                        transition: 'left 200ms ease, background-color 200ms ease',
                      }}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Biblioteca */}
      {activeTab === 'Biblioteca' && (
        <div style={{ maxWidth: 560 }}>
          {clientDocs.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 16 }}>
              Nenhum documento atribuído a este cliente
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {clientDocs.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 8,
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{doc.title}</span>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {doc.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '0.6rem',
                          padding: '2px 8px',
                          borderRadius: 9999,
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <button
              onClick={() => router.push('/biblioteca')}
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Ver na Biblioteca →
            </button>
          </div>
        </div>
      )}

      {/* Tab: Métricas */}
      {activeTab === 'Métricas' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
            maxWidth: 560,
          }}
        >
          <div style={{ backgroundColor: 'var(--deep)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12 }}>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 400 }}>
              {isNew || isAllZero ? 'Sem dados' : form.metrics.totalSessions}
            </span>
            <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Total Sessões
            </span>
          </div>

          <div style={{ backgroundColor: 'var(--deep)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12 }}>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 400 }}>
              {isNew || isAllZero ? 'Sem dados' : form.metrics.totalFeedbacks}
            </span>
            <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Total Feedbacks
            </span>
          </div>

          <div style={{ backgroundColor: 'var(--deep)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12 }}>
            <span style={{ fontSize: '1.2rem', color: scoreColor, fontWeight: 400 }}>
              {isNew || isAllZero ? 'Sem dados' : `★ ${form.metrics.averageScore.toFixed(1)}`}
            </span>
            <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Score Médio
            </span>
          </div>

          <div style={{ backgroundColor: 'var(--deep)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12 }}>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 400 }}>
              {isNew || isAllZero ? 'Sem dados' : (form.metrics.topSkill || '—')}
            </span>
            <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Skill Mais Usado
            </span>
          </div>

          <div style={{ backgroundColor: 'var(--deep)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12 }}>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 400 }}>
              {isNew || isAllZero ? 'Sem dados' : relativeTime(form.metrics.lastActivity)}
            </span>
            <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Última Atividade
            </span>
          </div>
        </div>
      )}

      {/* Tab: Drive (admin-only) */}
      {activeTab === 'Drive' && isAdmin && (
        <DriveTab clientId={initial.id} />
      )}

      {/* Toast */}
      <Toast message={toast || ''} visible={!!toast} onClose={handleCloseToast} />
    </div>
  );
}
