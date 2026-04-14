'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { WorkflowStep } from '@/lib/workflow-types';

const STEP_TYPES = [
  { value: 'tool', label: 'Tool' },
  { value: 'llm', label: 'LLM' },
  { value: 'condition', label: 'Condition' },
  { value: 'action', label: 'Action' },
  { value: 'hitl', label: 'Human Review' },
];

const AVAILABLE_TOOLS = [
  'generate_text',
  'text_generation',
  'generate_image',
  'search_knowledge',
  'query_data',
  'send_slack',
  'send_email',
  'log_result',
];

interface WorkflowStepEditorProps {
  step: WorkflowStep | null;
  onSave: (step: WorkflowStep) => void;
  onClose: () => void;
}

export default function WorkflowStepEditor({ step, onSave, onClose }: WorkflowStepEditorProps) {
  const [id, setId] = useState(step?.id || '');
  const [name, setName] = useState(step?.name || '');
  const [type, setType] = useState<WorkflowStep['type']>(step?.type || 'tool');
  const [toolName, setToolName] = useState(step?.tool_name || '');
  const [prompt, setPrompt] = useState(step?.prompt || '');
  const [configJson, setConfigJson] = useState(
    step?.config ? JSON.stringify(step.config, null, 2) : '{}'
  );

  useEffect(() => {
    if (step) {
      setId(step.id);
      setName(step.name);
      setType(step.type);
      setToolName(step.tool_name || '');
      setPrompt(step.prompt || '');
      setConfigJson(JSON.stringify(step.config || {}, null, 2));
    }
  }, [step]);

  const handleSave = () => {
    let config: Record<string, unknown> = {};
    try {
      config = JSON.parse(configJson);
    } catch {
      // keep empty
    }

    const stepId = id || `step_${Date.now()}`;
    onSave({
      id: stepId,
      name: name || stepId,
      type,
      tool_name: type === 'tool' || type === 'action' ? toolName : undefined,
      prompt: type === 'llm' ? prompt : undefined,
      config,
    });
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
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--deep)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: 24,
          width: 480,
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            {step ? 'Editar Step' : 'Novo Step'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 4,
            }}
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* ID */}
          <div>
            <label style={labelStyle}>ID</label>
            <input
              style={inputStyle}
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="step_1"
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

          {/* Name */}
          <div>
            <label style={labelStyle}>Nome</label>
            <input
              style={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do step"
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

          {/* Type */}
          <div>
            <label style={labelStyle}>Tipo</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={type}
              onChange={(e) => setType(e.target.value as WorkflowStep['type'])}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--sun)';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {STEP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tool name (for tool/action) */}
          {(type === 'tool' || type === 'action') && (
            <div>
              <label style={labelStyle}>Tool</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sun)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value="">Selecione...</option>
                {AVAILABLE_TOOLS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Prompt (for llm) */}
          {type === 'llm' && (
            <div>
              <label style={labelStyle}>Prompt</label>
              <textarea
                style={{ ...inputStyle, minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Use {{previous}} ou {{steps.step_id.field}} para referenciar outputs"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sun)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                {'Use {{previous}} para o output do step anterior ou {{steps.<id>.<field>}} para referências específicas'}
              </span>
            </div>
          )}

          {/* Config JSON */}
          <div>
            <label style={labelStyle}>Config (JSON)</label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.75rem' }}
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
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
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: '0.8rem',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--twilight)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)';
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              fontSize: '0.8rem',
              borderRadius: 8,
              border: 'none',
              backgroundColor: 'var(--sun)',
              color: 'var(--void)',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            }}
          >
            Salvar Step
          </button>
        </div>
      </div>
    </div>
  );
}
