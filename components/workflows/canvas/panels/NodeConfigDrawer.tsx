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
 *   tool           — `tool_name` (select, options from GET /api/tools),
 *                     `config` (textarea JSON).
 *   action         — `config` (textarea JSON) only; no `tool_name` select.
 *   tool generate_text — exposes `prompt`, `content_type`, `tone`, `length`,
 *                         `model`, `max_tokens` as dedicated fields (write into
 *                         `config`); no raw JSON textarea for this tool.
 *   tool consultar_ontologia — no config; shows an explanatory note instead.
 *   llm            — `agent_id` (select, optional, options = active agents from
 *                     AgentsContext/aba Agentes; when set, the agent's `instructions`
 *                     are prepended as system context — see compiler.py), `model`
 *                     (select, default gemini-flash), `prompt` (textarea), `config`.
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
import { useAgents } from '@/contexts/AgentsContext';
import { useSkills } from '@/contexts/SkillsContext';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import { listAvailableTools, type ToolDescriptor } from '@/lib/api';
import type { WorkflowLLMModel } from '@/lib/workflow-types';

const LLM_MODEL_OPTIONS: { value: WorkflowLLMModel; label: string }[] = [
  { value: 'gemini-flash', label: 'Gemini Flash' },
  { value: 'gemini-pro', label: 'Gemini Pro' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'claude', label: 'Claude' },
];

const CONTENT_TYPE_OPTIONS = [
  { value: 'social_post', label: 'Post social' },
  { value: 'article', label: 'Artigo' },
  { value: 'caption', label: 'Legenda' },
  { value: 'email', label: 'Email' },
  { value: 'script', label: 'Roteiro' },
];

const TONE_OPTIONS = [
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'professional', label: 'Profissional' },
  { value: 'creative', label: 'Criativo' },
  { value: 'friendly', label: 'Amigável' },
];

const LENGTH_OPTIONS = [
  { value: 'short', label: 'Curto (~100 palavras)' },
  { value: 'medium', label: 'Médio (~300 palavras)' },
  { value: 'long', label: 'Longo (~600 palavras)' },
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

// Introductions injected automatically for state-bound tools (not configurable by users).
// Used as LangChain tool descriptions in bind_tools so the LLM knows when to call each.
const STATE_BOUND_INTRODUCTIONS: Record<string, string> = {
  consultar_ontologia:
    'Use para obter o contexto completo de marca do cliente: posicionamento, persona, competidores, produto, tom de voz e briefing. Acione quando a tarefa envolver criação ou validação de conteúdo alinhado à identidade do cliente. Não use se o contexto de marca já foi obtido neste fluxo ou se a tarefa não envolve comunicação.',
  consultar_cliente:
    'Use para obter os dados cadastrais do cliente: nome, slug, descrição, cor de identidade visual, sponsor e status. Acione quando precisar identificar o cliente ou verificar informações de cadastro. Não use para obter contexto de marca ou tom de voz — para isso use "Ontologia do cliente".',
};

export default function NodeConfigDrawer({ node, onChange, onClose, currentWorkflowId }: DrawerProps) {
  const { workflows } = useWorkflows();
  const { agents } = useAgents();
  const { skills } = useSkills();
  const [name, setName] = useState('');
  const [toolName, setToolName] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<WorkflowLLMModel>('gemini-flash');
  const [configJson, setConfigJson] = useState('{}');
  const [conditionField, setConditionField] = useState('');
  const [conditionOperator, setConditionOperator] = useState('eq');
  const [conditionValue, setConditionValue] = useState('');
  const [workflowRef, setWorkflowRef] = useState('');
  const [reviewInstructions, setReviewInstructions] = useState('');
  const [mergePolicy, setMergePolicy] = useState<'all' | 'any'>('all');
  const [tools, setTools] = useState<ToolDescriptor[]>([]);
  const [agentId, setAgentId] = useState('');

  // Tool catalog for the `tool` step's "Tool" select (TASK-C08b).
  useEffect(() => {
    let cancelled = false;
    listAvailableTools().then((list) => {
      if (!cancelled) setTools(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Agentes ativos (mesma fonte da aba /agentes — AgentsContext).
  const activeAgents = agents.filter((a) => a.status === 'active');

  // Sync drawer state when the selected node changes.
  useEffect(() => {
    if (!node) return;
    const data = (node.data ?? {}) as Record<string, unknown>;
    setName((data.name as string) ?? '');
    const tName = (data.tool_name as string) ?? '';
    setToolName(tName);
    const storedIntro = (data.introduction as string) ?? '';
    const fixedIntro = STATE_BOUND_INTRODUCTIONS[tName] ?? '';
    const resolvedIntro = storedIntro || fixedIntro;
    setIntroduction(resolvedIntro);
    // Auto-persist the fixed intro so the compiler can use it as tool description.
    if (!storedIntro && fixedIntro) {
      onChange(node.id, { ...data, introduction: fixedIntro });
    }
    setPrompt((data.prompt as string) ?? '');
    setModel((data.model as WorkflowLLMModel) ?? 'gemini-flash');
    setAgentId((data.agent_id as string) ?? '');
    setConfigJson(JSON.stringify(data.config ?? {}, null, 2));
    const cond = (data.condition as Record<string, unknown> | undefined) ?? {};
    setConditionField((cond.field as string) ?? '');
    setConditionOperator((cond.operator as string) ?? 'eq');
    setConditionValue(cond.value !== undefined ? String(cond.value) : '');
    setWorkflowRef((data.workflow_id as string) ?? '');
    setReviewInstructions(
      ((data.config as Record<string, unknown> | undefined)?.review_instructions as string) ?? '',
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

  const stepTypeLabel = stepType === 'llm' ? 'AGENTE' : stepType.toUpperCase();

  const isGenerateText = stepType === 'tool' && toolName === 'generate_text';
  const isOntologia = stepType === 'tool' && toolName === 'consultar_ontologia';
  const isStateBound = stepType === 'tool' && toolName in STATE_BOUND_INTRODUCTIONS;
  const toolConfig = parseJsonOrFallback(configJson, {}) as Record<string, unknown>;

  const updateToolConfig = (updates: Record<string, unknown>) => {
    const newConfig = { ...toolConfig, ...updates };
    setConfigJson(JSON.stringify(newConfig, null, 2));
    emit({ config: newConfig });
  };

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
          {stepTypeLabel} · {name || node.id}
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

      {stepType === 'tool' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Ferramenta</label>
            <div style={{ ...TEXT_INPUT, color: 'var(--text-secondary)', cursor: 'default', userSelect: 'none' }}>
              {tools.find((t) => t.tool_name === toolName)?.label ?? toolName ?? '—'}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>
              Introdução (para o agente)
              {isStateBound && (
                <span style={{
                  marginLeft: 6, fontSize: 9, fontWeight: 600,
                  background: 'rgba(139,92,246,0.15)', color: '#A78BFA',
                  padding: '1px 5px', borderRadius: 4,
                }}>
                  automática
                </span>
              )}
            </label>
            <textarea
              readOnly={isStateBound}
              style={{
                ...TEXT_INPUT, minHeight: 72, resize: 'vertical', fontFamily: 'inherit',
                ...(isStateBound ? { opacity: 0.75, cursor: 'default', background: 'var(--nebula)' } : {}),
              }}
              value={introduction}
              placeholder="Descreva para que serve esta ferramenta, quando o agente deve usá-la…"
              onChange={(e) => {
                if (isStateBound) return;
                setIntroduction(e.target.value);
                emit({ introduction: e.target.value });
              }}
            />
          </div>
        </>
      )}

      {isStateBound && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 12px' }}>
          {isOntologia
            ? 'Sem configuração. Carrega automaticamente a ontologia do cliente atual (posicionamento, persona, tom de voz, etc.).'
            : 'Sem configuração. Carrega automaticamente os dados cadastrais do cliente selecionado (nome, slug, cor, sponsor, status).'}
        </p>
      )}

      {isGenerateText && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Prompt</label>
            <textarea
              style={{ ...TEXT_INPUT, minHeight: 100, fontFamily: 'monospace' }}
              value={(toolConfig.prompt as string) ?? ''}
              placeholder="Instrução do que gerar"
              onChange={(e) => updateToolConfig({ prompt: e.target.value })}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Tipo de conteúdo</label>
            <select
              style={TEXT_INPUT}
              value={(toolConfig.content_type as string) ?? 'social_post'}
              onChange={(e) => updateToolConfig({ content_type: e.target.value })}
            >
              {CONTENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Tom</label>
            <select
              style={TEXT_INPUT}
              value={(toolConfig.tone as string) ?? 'creative'}
              onChange={(e) => updateToolConfig({ tone: e.target.value })}
            >
              {TONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Tamanho</label>
            <select
              style={TEXT_INPUT}
              value={(toolConfig.length as string) ?? 'medium'}
              onChange={(e) => updateToolConfig({ length: e.target.value })}
            >
              {LENGTH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Modelo</label>
            <select
              style={TEXT_INPUT}
              value={(toolConfig.model as string) ?? 'gemini-flash'}
              onChange={(e) => updateToolConfig({ model: e.target.value })}
            >
              {LLM_MODEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Max tokens</label>
            <input
              type="number"
              min={1}
              style={TEXT_INPUT}
              value={(toolConfig.max_tokens as number) ?? 1024}
              onChange={(e) => updateToolConfig({ max_tokens: Number(e.target.value) })}
            />
          </div>
        </>
      )}

      {stepType === 'llm' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Agente</label>
            <div style={{ ...TEXT_INPUT, color: 'var(--text-secondary)', cursor: 'default', userSelect: 'none' }}>
              {(() => {
                const agent = activeAgents.find((a) => a.id === agentId);
                return agent ? `${agent.icon} ${agent.name}` : agentId || '— nenhum —';
              })()}
            </div>
          </div>
          {(() => {
            const agent = activeAgents.find((a) => a.id === agentId);
            const agentSkills = agent?.assigned_skills ?? [];
            if (agentSkills.length === 0) return null;
            return (
              <div style={{ marginBottom: 12 }}>
                <label style={LABEL}>Skills do agente</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {agentSkills.map((slug) => {
                    const skill = skills.find((s) => s.slug === slug);
                    return (
                      <span
                        key={slug}
                        style={{
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 9999,
                          background: 'var(--nebula)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {skill?.icon && <span>{skill.icon}</span>}
                        {skill?.name ?? slug}
                      </span>
                    );
                  })}
                </div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '6px 0 0' }}>
                  O agente escolherá qual skill utilizar com base no contexto.
                </p>
              </div>
            );
          })()}

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
            Compara um valor com o resultado do step anterior. Se for{' '}
            <code>true</code>, segue por <code>then</code>; senão por <code>else</code>.
          </p>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Operador de comparação</label>
            <select
              style={TEXT_INPUT}
              value={conditionOperator}
              onChange={(e) => {
                setConditionOperator(e.target.value);
                emit({ condition: { field: conditionField, operator: e.target.value, value: conditionValue } });
              }}
            >
              <option value="eq">== igual a</option>
              <option value="neq">≠ diferente de</option>
              <option value="gt">&gt; maior que</option>
              <option value="lt">&lt; menor que</option>
              <option value="contains">contém</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Valor</label>
            <input
              style={TEXT_INPUT}
              value={conditionValue}
              placeholder="(vazio = output do step conectado)"
              onChange={(e) => {
                setConditionValue(e.target.value);
                emit({ condition: { field: conditionField, operator: conditionOperator, value: e.target.value } });
              }}
            />
          </div>
          <details style={{ marginBottom: 12 }}>
            <summary style={{ fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>
              Avançado: campo fixo (lado esquerdo)
            </summary>
            <div style={{ marginTop: 8 }}>
              <input
                style={TEXT_INPUT}
                value={conditionField}
                placeholder="(vazio = output do step anterior)"
                onChange={(e) => {
                  setConditionField(e.target.value);
                  emit({ condition: { field: e.target.value, operator: conditionOperator, value: conditionValue } });
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
            value={reviewInstructions}
            onChange={(e) => {
              setReviewInstructions(e.target.value);
              emit({ config: { review_instructions: e.target.value } });
            }}
          />
        </div>
      )}

      {stepType === 'workflow' && (
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL}>Sub-workflow</label>
          <div style={{ ...TEXT_INPUT, color: 'var(--text-secondary)', cursor: 'default', userSelect: 'none' }}>
            {otherWorkflows.find((w) => w.id === workflowRef)?.name ?? workflowRef ?? '—'}
          </div>
        </div>
      )}

      {stepType === 'merge' && (
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL}>Política de merge</label>
          <div style={{ ...TEXT_INPUT, color: 'var(--text-secondary)', cursor: 'default', userSelect: 'none' }}>
            {mergePolicy === 'all' ? 'all (aguarda todos)' : 'any (primeiro vence)'}
          </div>
        </div>
      )}

    </aside>
  );
}
