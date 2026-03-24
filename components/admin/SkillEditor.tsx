'use client';

import { useState, useCallback } from 'react';
import { SkillAdmin } from '@/lib/admin-types';
import SkillEditorTabs from './SkillEditorTabs';
import IdentityTab from './IdentityTab';
import ConfigTab from './ConfigTab';
import MoonsTab from './MoonsTab';
import ClientsTab from './ClientsTab';
import VersionHistoryModal from './VersionHistoryModal';
import Toast from '@/components/ui/Toast';

const TYPE_COLORS: Record<string, string> = {
  criacao: 'var(--criacao)',
  midia: 'var(--midia)',
  planejamento: 'var(--planejamento)',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  draft: 'Rascunho',
  archived: 'Arquivado',
};

interface SkillEditorProps {
  initial: SkillAdmin;
  onSave: (data: SkillAdmin) => void;
  isNew?: boolean;
  breadcrumbLabel: string;
}

export default function SkillEditor({ initial, onSave, isNew, breadcrumbLabel }: SkillEditorProps) {
  const [form, setForm] = useState<SkillAdmin>(initial);
  const [savedSnapshot, setSavedSnapshot] = useState<SkillAdmin>(initial);
  const [activeTab, setActiveTab] = useState('Identidade');
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (patch: Partial<SkillAdmin>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nome é obrigatório';
    if (!form.type) errs.type = 'Tipo é obrigatório';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setActiveTab('Identidade');
      return;
    }
    setErrors({});
    onSave(form);
    setSavedSnapshot(form);
    setToast(isNew ? 'Skill criado' : 'Skill atualizado');
  };

  const handleDiscard = () => {
    setForm(savedSnapshot);
    setErrors({});
  };

  const handleCloseToast = useCallback(() => setToast(null), []);

  const currentVersion = form.versions[0]?.version ?? 1;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Type dot */}
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: TYPE_COLORS[form.type] || 'var(--text-muted)',
              flexShrink: 0,
            }}
          />
          {/* Inline-editable name */}
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange({ name: e.target.value })}
            aria-label="Nome do skill"
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
          {/* Status badge */}
          <span
            style={{
              fontSize: '0.6rem',
              padding: '2px 8px',
              borderRadius: 9999,
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            {STATUS_LABELS[form.status] || form.status}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isNew && (
            <button
              onClick={() => setShowVersionModal(true)}
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              v{currentVersion}
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
            {isNew ? 'Criar Skill' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <SkillEditorTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      {activeTab === 'Identidade' && <IdentityTab data={form} onChange={handleChange} errors={errors} />}
      {activeTab === 'Configuração' && <ConfigTab data={form} onChange={handleChange} />}
      {activeTab === 'Moons' && <MoonsTab data={form} onChange={handleChange} />}
      {activeTab === 'Clientes' && <ClientsTab data={form} onChange={handleChange} />}

      {/* Version Modal */}
      {showVersionModal && (
        <VersionHistoryModal
          skillName={form.name}
          versions={form.versions}
          onClose={() => setShowVersionModal(false)}
          onRestore={() => {
            setShowVersionModal(false);
            setToast('Versão restaurada');
          }}
        />
      )}

      {/* Toast */}
      <Toast message={toast || ''} visible={!!toast} onClose={handleCloseToast} />
    </div>
  );
}
