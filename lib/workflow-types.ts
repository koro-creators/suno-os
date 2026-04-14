export interface WorkflowStep {
  id: string;
  name: string;
  type: 'tool' | 'llm' | 'condition' | 'action' | 'hitl' | 'workflow';
  tool_name?: string;
  prompt?: string;
  workflow_id?: string;
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

export interface CronSchedule {
  cron: string;
  timezone: string;
  enabled: boolean;
}

export interface WorkflowRunSummary {
  run_id: string;
  status: string;
  completed_at: string | null;
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

export interface StepLog {
  id: string;
  step_id: string;
  step_name: string | null;
  status: string;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
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
