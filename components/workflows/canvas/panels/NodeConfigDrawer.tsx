/**
 * NodeConfigDrawer — side drawer for editing the selected node (SPEC-005 TASK-C09).
 *
 * Replaces the legacy modal `WorkflowStepEditor.tsx`. The field set per
 * step type is the same as the modal, but lives in a 32%-wide drawer so the
 * user can see the canvas while editing. The "save" button is implicit:
 * every change calls `onChange(updates)` and the parent persists via the
 * auto-save hook.
 *
 * Field policy:
 *   tool / action  — `tool_name` (select), `config` (textarea JSON).
 *   llm            — `model` (select, default gemini-flash), `prompt` (textarea), `config`.
 *   condition      — `field`, `operator`, `value`. Targets are visual edges.
 *   hitl           — `review_instructions` in `config`.
 *   workflow       — `workflow_id` (select of other workflows), `input_mapping`.
 *   merge          — `merge_policy` ('all' | 'any').
 *
 * Determinism guard: the drawer never mutates `data` directly; it always
 * emits a fresh object via `onChange` so React's reconciler sees a real
 * change. This pairs with the auto-save's serialised diff.
 */
'use client';

import { useEffect, useState } from 'react';
import { Close } from '@carbon/icons-react';
import type { Node } from '@xyflow/react';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import type { WorkflowLLMModel } from '@/lib/workflow-types';

const LLM_MODEL_OPTIONS: { value: WorkflowLLMModel; label: string }[] = [
  { value: 'gemini-flash', label: 'Gemini Flash' },
  { value: 'gemini-pro', label: 'Gemini Pro' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'claude', label: 'Claude' },
];

interface DrawerProps {
  node: Node | null;
  onChange: (id: string, updates: Record<string, unknown>) => void;
  onClose: () => void;
  currentWorkflowId?: string;
}

const TEXT_INPUT: React.CSSProperties = {
  width: '100%',
  fontSize: 12,
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid var(--border-subtle)',
  background: 'var(--deep)',
  color: 'var(--text-primary)',
};

const LABEL: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 4,
  display: 'block',
};

export default function NodeConfigDrawer({ node, onChange, onClose, currentWorkflowId }: DrawerProps) {
  const { workflows } = useWorkflows();
  const [name, setName] = useState('');
  const [toolName, setToolName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<WorkflowLLMModel>('gemini-flash');
  const [configJson, setConfigJson] = useState('{}');
  const [conditionField, setConditionField] = useState('');
  const [conditionOperator, setConditionOperator] = useState('eq');
  const [conditionValue, setConditionValue] = useState('');
  const [workflowRef, setWorkflowRef] = useState('');
  const [inputMappingJson, setInputMappingJson] = useState('');
  const [mergePolicy, setMergePolicy] = useState<'all' | 'any'>('all');

  // Sync drawer state when the selected node changes.
  useEffect(() => {
    if (!node) return;
    const data = (node.data ?? {}) as Record<string, unknown>;
    setName((data.name as string) ?? '');
    setToolName((data.tool_name as string) ?? '');
    setPrompt((data.prompt as string) ?? '');
    setModel((data.model as WorkflowLLMModel) ?? 'gemini-flash');
    setConfigJson(JSON.stringify(data.config ?? {}, null, 2));
    const cond = (data.condition as Record<string, unknown> | undefined) ?? {};
    setConditionField((cond.field as string) ?? '');
    setConditionOperator((cond.operator as string) ?? 'eq');
    setConditionValue(cond.value !== undefined ? String(cond.value) : '');
    setWorkflowRef((data.workflow_id as string) ?? '');
    setInputMappingJson(
      data.input_mapping ? JSON.stringify(data.input_mapping, null, 2) : '',
    );
    setMergePolicy((data.merge_policy as 'all' | 'any') ?? 'all');
  }, [node]);

  if (!node) return null;
  const stepType = ((node.data ?? {}) as { type?: string }).type ?? 'tool';

  const emit = (updates: Record<string, unknown>) => {
    onChange(node.id, { ...(node.data ?? {}), ...updates });
  };

  const parseJsonOrFallback = (raw: string, fallback: unknown) => {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  };

  const otherWorkflows = workflows.filter((w) => w.id !== currentWorkflowId);

  return (
    <aside
      aria-label="Configuração do node"
      style={{
        width: 360,
        minWidth: 360,
        height: '100%',
        background: 'var(--void)',
        borderLeft: '1px solid var(--border-subtle)',
        padding: 16,
        overflowY: 'auto',
      }}
    >
      <header
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}
      >
        <h2 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
          {stepType.toUpperCase()} · {name || node.id}
        </h2>
        <button
          aria-label="Fechar"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
        >
          <Close size={14} />
        </button>
      </header>

      <div style={{ marginBottom: 12 }}>
        <label style={LABEL}>Nome</label>
        <input
          style={TEXT_INPUT}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            emit({ name: e.target.value });
          }}
        />
      </div>

      {(stepType === 'tool' || stepType === 'action') && (
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL}>Tool</label>
          <input
            style={TEXT_INPUT}
            value={toolName}
            placeholder="ex: search_knowledge"
            onChange={(e) => {
              setToolName(e.target.value);
              emit({ tool_name: e.target.value });
            }}
          />
        </div>
      )}

      {stepType === 'llm' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Modelo</label>
            <select
              style={TEXT_INPUT}
              value={model}
              onChange={(e) => {
                const v = e.target.value as WorkflowLLMModel;
                setModel(v);
                emit({ model: v });
              }}
            >
              {LLM_MODEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Prompt</label>
            <textarea
              style={{ ...TEXT_INPUT, minHeight: 100, fontFamily: 'monospace' }}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                emit({ prompt: e.target.value });
              }}
            />
          </div>
        </>
      )}

      {stepType === 'condition' && (
        <>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 12px' }}>
            Compara o resultado do step anterior com o valor abaixo. Se for{' '}
            <code>true</code>, segue pelo handle <code>then</code>; senão, pelo <code>else</code>.
            Este node tem 2 entradas opcionais à esquerda: <code>campo</code> alimenta o
            lado esquerdo da comparação e <code>valor</code> o lado direito — conecte um
            step a elas para usar o <code>output</code> dele em vez do step anterior.
          </p>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Operador</label>
            <select
              style={TEXT_INPUT}
              value={conditionOperator}
              onChange={(e) => {
                setConditionOperator(e.target.value);
                emit({
                  condition: {
                    field: conditionField,
                    operator: e.target.value,
                    value: conditionValue,
                  },
                });
              }}
            >
              <option value="eq">==</option>
              <option value="neq">≠</option>
              <option value="gt">&gt;</option>
              <option value="lt">&lt;</option>
              <option value="contains">contém</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Valor</label>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>
              Deixe vazio para comparar com o <code>output</code> do step conectado na
              entrada <code>valor</code> (ou do step anterior, se nada estiver conectado).
              Se preencher, o texto digitado aqui é usado como o lado direito da comparação.
            </p>
            <input
              style={TEXT_INPUT}
              value={conditionValue}
              placeholder="(vazio = output do step anterior)"
              onChange={(e) => {
                setConditionValue(e.target.value);
                emit({
                  condition: {
                    field: conditionField,
                    operator: conditionOperator,
                    value: e.target.value,
                  },
                });
              }}
            />
          </div>
          <details style={{ marginBottom: 12 }}>
            <summary style={{ fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>
              Avançado: comparar um valor fixo
            </summary>
            <div style={{ marginTop: 8 }}>
              <label style={LABEL}>Campo</label>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>
                Deixe vazio para comparar o <code>output</code> do step conectado na
                entrada <code>campo</code> (ou do step anterior, se nada estiver
                conectado). Se preencher, o texto digitado aqui é usado diretamente como
                o valor do lado esquerdo da comparação.
              </p>
              <input
                style={TEXT_INPUT}
                value={conditionField}
                placeholder="(vazio = output do step anterior)"
                onChange={(e) => {
                  setConditionField(e.target.value);
                  emit({
                    condition: {
                      field: e.target.value,
                      operator: conditionOperator,
                      value: conditionValue,
                    },
                  });
                }}
              />
            </div>
          </details>
        </>
      )}

      {stepType === 'hitl' && (
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL}>Instruções de revisão</label>
          <textarea
            style={{ ...TEXT_INPUT, minHeight: 80 }}
            value={(parseJsonOrFallback(configJson, {}) as { review_instructions?: string }).review_instructions ?? ''}
            onChange={(e) => {
              const newConfig = { review_instructions: e.target.value };
              setConfigJson(JSON.stringify(newConfig, null, 2));
              emit({ config: newConfig });
            }}
          />
        </div>
      )}

      {stepType === 'workflow' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Sub-workflow</label>
            <select
              style={TEXT_INPUT}
              value={workflowRef}
              onChange={(e) => {
                setWorkflowRef(e.target.value);
                emit({ workflow_id: e.target.value });
              }}
            >
              <option value="">— selecione —</option>
              {otherWorkflows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Input mapping (JSON)</label>
            <textarea
              style={{ ...TEXT_INPUT, minHeight: 80, fontFamily: 'monospace' }}
              value={inputMappingJson}
              onChange={(e) => {
                setInputMappingJson(e.target.value);
                emit({ input_mapping: parseJsonOrFallback(e.target.value, {}) });
              }}
            />
          </div>
        </>
      )}

      {stepType === 'merge' && (
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL}>Política de merge</label>
          <select
            style={TEXT_INPUT}
            value={mergePolicy}
            onChange={(e) => {
              const v = e.target.value as 'all' | 'any';
              setMergePolicy(v);
              emit({ merge_policy: v });
            }}
          >
            <option value="all">all (aguarda todos)</option>
            <option value="any">any (primeiro vence)</option>
          </select>
        </div>
      )}

      {stepType !== 'condition' && stepType !== 'hitl' && stepType !== 'merge' && (
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL}>Config (JSON)</label>
          {(stepType === 'llm' || stepType === 'workflow') && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>
              Não utilizado neste tipo de step.
            </p>
          )}
          <textarea
            style={{ ...TEXT_INPUT, minHeight: 100, fontFamily: 'monospace' }}
            value={configJson}
            onChange={(e) => {
              setConfigJson(e.target.value);
              emit({ config: parseJsonOrFallback(e.target.value, {}) });
            }}
          />
        </div>
      )}
    </aside>
  );
}
