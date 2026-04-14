'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Settings } from 'lucide-react';
import { Workflow, WorkflowStep } from '@/lib/workflow-types';
import WorkflowStepEditor from './WorkflowStepEditor';
import { clients } from '@/data/clients';

const STEP_TYPE_COLORS: Record<string, string> = {
  tool: '#3B82F6',
  llm: '#8B5CF6',
  condition: '#F59E0B',
  action: '#22C55E',
  hitl: 'var(--sun)',
};

const STEP_TYPE_LABELS: Record<string, string> = {
  tool: 'Tool',
  llm: 'LLM',
  condition: 'Condition',
  action: 'Action',
  hitl: 'Human Review',
};

interface WorkflowBuilderProps {
  initial: Workflow;
  onSave: (data: Workflow) => void;
  onDelete?: () => void;
  isNew?: boolean;
}

export default function WorkflowBuilder({ initial, onSave, onDelete, isNew }: WorkflowBuilderProps) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [clientId, setClientId] = useState(initial.client_id || '');
  const [steps, setSteps] = useState<WorkflowStep[]>(initial.steps);
  const [scheduleEnabled, setScheduleEnabled] = useState(initial.schedule?.enabled || false);
  const [scheduleCron, setScheduleCron] = useState(initial.schedule?.cron || '');
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);
  const [showStepEditor, setShowStepEditor] = useState(false);
  const [dirty, setDirty] = useState(false);

  const markDirty = () => setDirty(true);

  const handleSave = () => {
    onSave({
      ...initial,
      name,
      description,
      client_id: clientId,
      steps,
      steps_count: steps.length,
      schedule: scheduleEnabled ? { cron: scheduleCron, timezone: 'America/Sao_Paulo', enabled: true } : undefined,
      updated_at: new Date().toISOString(),
    });
    setDirty(false);
  };

  const handleAddStep = () => {
    setEditingStep(null);
    setShowStepEditor(true);
  };

  const handleEditStep = (step: WorkflowStep) => {
    setEditingStep(step);
    setShowStepEditor(true);
  };

  const handleSaveStep = (step: WorkflowStep) => {
    if (editingStep) {
      setSteps((prev) => prev.map((s) => (s.id === editingStep.id ? step : s)));
    } else {
      setSteps((prev) => [...prev, step]);
    }
    setShowStepEditor(false);
    setEditingStep(null);
    markDirty();
  };

  const handleRemoveStep = (stepId: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
    markDirty();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: 'var(--nebula)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: '0.8rem',
    color: 'var(--text-primary)',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: 4,
    display: 'block',
  };

  return (
    <main
      id="main-content"
      className="page-enter"
      style={{ flex: 1, overflow: 'auto', padding: 24 }}
    >
      {/* Form header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
            {isNew ? 'Novo Workflow' : 'Editar Workflow'}
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {isNew ? 'Configure os steps do workflow' : `Editando "${initial.name}"`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onDelete && (
            <button
              onClick={onDelete}
              style={{
                padding: '8px 16px',
                fontSize: '0.8rem',
                borderRadius: 8,
                border: '1px solid #EF444440',
                backgroundColor: 'transparent',
                color: '#EF4444',
                cursor: 'pointer',
                transition: 'background-color 150ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#EF444410';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              }}
            >
              Excluir
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!name.trim() || !clientId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: !name.trim() ? 'var(--text-muted)' : 'var(--sun)',
              color: 'var(--void)',
              border: 'none',
              borderRadius: 9999,
              padding: '8px 20px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: !name.trim() ? 'default' : 'pointer',
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (name.trim()) (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            }}
          >
            {isNew ? 'Criar Workflow' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Basic fields */}
      <div
        style={{
          backgroundColor: 'var(--deep)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Nome</label>
            <input
              style={inputStyle}
              value={name}
              onChange={(e) => { setName(e.target.value); markDirty(); }}
              placeholder="Nome do workflow"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--sun)';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <div>
            <label style={labelStyle}>Descricao</label>
            <textarea
              style={{ ...inputStyle, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }}
              value={description}
              onChange={(e) => { setDescription(e.target.value); markDirty(); }}
              placeholder="Descreva o que este workflow faz"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--sun)';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <div>
            <label style={labelStyle}>Cliente</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={clientId}
              onChange={(e) => { setClientId(e.target.value); markDirty(); }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--sun)';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value="">Selecione um cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Schedule section */}
      <div
        style={{
          backgroundColor: 'var(--deep)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: scheduleEnabled ? 12 : 0 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={scheduleEnabled}
              onChange={(e) => { setScheduleEnabled(e.target.checked); markDirty(); }}
              style={{ accentColor: 'var(--sun)' }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>Agendar execucao</span>
          </label>
        </div>
        {scheduleEnabled && (
          <div>
            <label style={labelStyle}>Cron Expression</label>
            <input
              style={{ ...inputStyle, maxWidth: 300 }}
              value={scheduleCron}
              onChange={(e) => { setScheduleCron(e.target.value); markDirty(); }}
              placeholder="0 9 * * 1 (seg 09:00)"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--sun)';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Steps section */}
      <div
        style={{
          backgroundColor: 'var(--deep)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            Steps ({steps.length})
          </h2>
          <button
            onClick={handleAddStep}
            disabled={steps.length >= 20}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              backgroundColor: steps.length >= 20 ? 'var(--text-muted)' : 'var(--sun)',
              color: 'var(--void)',
              border: 'none',
              borderRadius: 9999,
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: steps.length >= 20 ? 'default' : 'pointer',
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (steps.length < 20) (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            }}
          >
            <Plus size={12} strokeWidth={2} />
            Adicionar
          </button>
        </div>

        {steps.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '24px 0' }}>
            Nenhum step adicionado. Clique em &quot;Adicionar&quot; para comecar.
          </p>
        )}

        {/* Steps list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {steps.map((step, idx) => {
            const typeColor = STEP_TYPE_COLORS[step.type] || 'var(--text-muted)';
            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  backgroundColor: 'var(--void)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  transition: 'border-color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--twilight)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
                }}
              >
                <GripVertical size={14} strokeWidth={1.5} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: 20, textAlign: 'center', flexShrink: 0 }}>
                  {idx + 1}
                </span>
                <span
                  style={{
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    color: typeColor,
                    backgroundColor: `${typeColor}15`,
                    padding: '2px 6px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    flexShrink: 0,
                  }}
                >
                  {STEP_TYPE_LABELS[step.type] || step.type}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {step.name}
                </span>
                {step.tool_name && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {step.tool_name}
                  </span>
                )}
                <button
                  onClick={() => handleEditStep(step)}
                  title="Editar step"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 4,
                    borderRadius: 4,
                    display: 'flex',
                    transition: 'color 150ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <Settings size={14} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => handleRemoveStep(step.id)}
                  title="Remover step"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 4,
                    borderRadius: 4,
                    display: 'flex',
                    transition: 'color 150ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {dirty && (
        <p style={{ fontSize: '0.7rem', color: 'var(--sun)', marginTop: 12 }}>
          Alteracoes nao salvas
        </p>
      )}

      {/* Step Editor Modal */}
      {showStepEditor && (
        <WorkflowStepEditor
          step={editingStep}
          onSave={handleSaveStep}
          onClose={() => { setShowStepEditor(false); setEditingStep(null); }}
        />
      )}
    </main>
  );
}
