export type AgentStatus = 'draft' | 'active' | 'inactive' | 'archived';

export interface Agent {
  id: string;
  name: string;
  icon: string; // emoji ou texto curto
  instructions: string;
  status: AgentStatus;
  skill_count: number;
  client_count: number;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
  // Mock-mode fields for tab state
  assigned_skills?: string[]; // skill slugs
  apps?: AgentAppConnection[];
  memory_files?: MemoryFile[];
  schedule?: AgentSchedule | null;
  permissions?: AgentPermission[];
}

export interface AgentCreate {
  name: string;
  icon?: string;
  instructions: string;
  status?: AgentStatus;
}

export interface AgentUpdate {
  name?: string;
  icon?: string;
  instructions?: string;
  status?: AgentStatus;
}

export interface AgentPermission {
  client_id: string;
  client_name: string;
  granted_by_name: string;
  granted_at: string;
}

export interface AgentSkill {
  skill_slug: string;
  skill_name: string;
  assigned_at: string;
}

export interface AgentAppConnection {
  id: string;
  app_type: string;
  enabled: boolean;
  connected_at: string;
}

export interface MemoryFile {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
}

export interface AgentSchedule {
  id: string;
  frequency: 'hourly' | 'daily';
  days_of_week: number[] | null;
  time_of_day: string | null;
  minute_offset: number;
  timezone: string;
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
}

export interface AgentRun {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timed_out';
  triggered_by: 'manual' | 'schedule' | 'preview';
  client_id: string | null;
  duration_ms: number | null;
  started_at: string;
  finished_at: string | null;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error_message: string | null;
}
