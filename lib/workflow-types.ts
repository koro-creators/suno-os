// SPEC-005 (Workflow Builder Canvas): handles, merge policies, validation kinds.
// `out` is the universal source handle (constitution §2). `success` is gone.
export type SourceHandle =
  | 'out'
  | 'error'
  | 'then'
  | 'else'
  | 'approved'
  | 'rejected'
  | 'modified';
/**
 * Target handles. `in` is the universal default. `condition` may accept
 * `in_a`/`in_b`. `llm` may accept `tool_0/1/2` (saídas de tool nodes).
 * See .claude/rules/canvas-conventions.md for the full matrix.
 */
export type TargetHandle = 'in' | 'in_a' | 'in_b' | 'tool_0' | 'tool_1' | 'tool_2';
export type MergePolicy = 'all' | 'any';
// LLMs disponíveis no sistema (paridade com api/chat/schemas/chat.py::ChatModel).
export type WorkflowLLMModel = 'gemini-flash' | 'gemini-pro' | 'gpt-4o' | 'claude';
export type ValidationErrorKind =
  | 'cycle'
  | 'fan_in_without_merge'
  | 'merge_with_zero_inputs'
  | 'edge_to_nonexistent_handle'
  | 'unauthorized_tool'
  | 'max_nodes_exceeded'
  | 'no_entry_node'
  | 'isolated_node';

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'tool' | 'llm' | 'condition' | 'action' | 'hitl' | 'workflow' | 'merge' | 'trigger' | 'arquivos';
  tool_name?: string;
  prompt?: string;
  model?: WorkflowLLMModel; // type="llm": modelo a usar (default: gemini-flash)
  agent_id?: string; // type="llm": agente (aba Agentes) cujas instructions entram como contexto
  condition_operator?: 'if_else'; // type="condition": porta lógica
  action_type?: 'slack' | 'email' | 'whatsapp' | 'telegram' | 'salvar_pdf' | 'baixar_pdf' | 'banco_de_dados'; // type="action": canal de envio ou ação de PDF
  trigger_type?: 'nova_reuniao'; // type="trigger": sub-tipo do trigger
  workflow_id?: string;
  drive_file_id?: string; // type="arquivos": ID do arquivo no Google Drive
  drive_file_name?: string; // type="arquivos": nome de exibição do arquivo
  input_mapping?: Record<string, string>;
  config: Record<string, unknown>;
  next_step?: string;
  condition?: {
    field: string;
    operator: string;
    value: unknown;
    then: string;
    else: string;
  };
}

/**
 * Canvas-aware step (SPEC-005). Adds canvas coordinates and merge policy.
 * Backend persists position_x/y inside `definition.steps[]` JSONB; the canvas
 * treats them as the source of truth for layout.
 */
export interface WorkflowStepV2 extends WorkflowStep {
  position_x: number;
  position_y: number;
  merge_policy?: MergePolicy;
}

/**
 * Edge between two steps. Identity is the tuple
 * (workflow_id, source_step_id, source_handle, target_step_id, target_handle).
 */
export interface WorkflowEdge {
  edge_id?: string;
  source_step_id: string;
  source_handle: SourceHandle;
  target_step_id: string;
  target_handle: TargetHandle;
}

/**
 * Validation finding emitted by `validateWorkflow()` / `useGraphValidation`.
 * 7 kinds match backend `ValidationErrorKind`.
 */
export interface ValidationError {
  kind: ValidationErrorKind;
  detail: string;
  edges: string[];
  step_id: string | null;
}

export interface ValidateWorkflowResponse {
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface AutoLayoutResponse {
  positions: Record<string, { x: number; y: number }>;
}

export interface MigrateV2Response {
  migrated: boolean;
  edges_created: number;
  steps_with_position: number;
}

export interface CronSchedule {
  cron: string;
  timezone: string;
  enabled: boolean;
}

export interface GeneratedDoc {
  titulo: string;
  conteudo: string;
  cliente_slug: string;
  cliente_nome: string;
  filename: string;
}

export interface WorkflowRunSummary {
  run_id: string;
  status: string;
  completed_at: string | null;
  triggered_doc_id?: string;
  generated_doc?: GeneratedDoc;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused';
  steps: WorkflowStep[];
  schedule?: CronSchedule;
  steps_count: number;
  last_run?: WorkflowRunSummary;
  created_by: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  client_scope?: string[];
  default_model?: string;
  max_execution_time?: number;
}

/**
 * Canvas-aware workflow detail (SPEC-005). Mirrors backend
 * `WorkflowDetailResponseV2`. `canvas_v2_migrated=false` triggers JIT migration
 * on the frontend before rendering the canvas.
 */
export interface WorkflowV2 extends Workflow {
  steps: WorkflowStepV2[];
  edges: WorkflowEdge[];
  canvas_v2_migrated: boolean;
  updated_by?: string | null;
}

export interface StepLog {
  id: string;
  step_id: string;
  step_name: string | null;
  status: string;
  input: Record<string, unknown> | unknown[] | null;
  output: Record<string, unknown> | unknown[] | null;
  error: string | null;
  duration_ms: number | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: string;
  trigger: string;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  steps_output: Record<string, unknown>;
  step_logs: StepLog[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}
