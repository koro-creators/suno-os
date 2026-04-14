'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Workflow, WorkflowStep } from '@/lib/workflow-types';
import { initialWorkflows } from '@/data/workflows-admin';

interface WorkflowCreateData {
  name: string;
  description: string;
  steps: WorkflowStep[];
  schedule?: { cron: string; timezone: string; enabled: boolean };
  client_scope?: string[];
  default_model?: string;
  max_execution_time?: number;
}

interface WorkflowsContextValue {
  workflows: Workflow[];
  loading: boolean;
  error: string | null;
  createWorkflow: (data: WorkflowCreateData) => Workflow;
  updateWorkflow: (id: string, data: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  runWorkflow: (id: string) => void;
}

const WorkflowsContext = createContext<WorkflowsContextValue | null>(null);

export function WorkflowsProvider({ children }: { children: ReactNode }) {
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  function createWorkflow(data: WorkflowCreateData): Workflow {
    const id = `wf-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const newWorkflow: Workflow = {
      id,
      name: data.name,
      description: data.description,
      status: 'draft',
      steps: data.steps,
      schedule: data.schedule,
      steps_count: data.steps.length,
      created_by: 'admin',
      created_at: now,
      updated_at: now,
      client_scope: data.client_scope,
      default_model: data.default_model,
      max_execution_time: data.max_execution_time,
    };
    setWorkflows((prev) => [newWorkflow, ...prev]);
    return newWorkflow;
  }

  function updateWorkflow(id: string, data: Partial<Workflow>) {
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        const updated = { ...w, ...data, updated_at: new Date().toISOString() };
        if (data.steps) {
          updated.steps_count = data.steps.length;
        }
        return updated;
      })
    );
  }

  function deleteWorkflow(id: string) {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  }

  function runWorkflow(id: string) {
    // Mock: update last_run
    const now = new Date().toISOString();
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              last_run: {
                run_id: `run-${crypto.randomUUID()}`,
                status: 'completed',
                completed_at: now,
              },
              updated_at: now,
            }
          : w
      )
    );
  }

  return (
    <WorkflowsContext.Provider
      value={{ workflows, loading, error, createWorkflow, updateWorkflow, deleteWorkflow, runWorkflow }}
    >
      {children}
    </WorkflowsContext.Provider>
  );
}

export function useWorkflows() {
  const ctx = useContext(WorkflowsContext);
  if (!ctx) throw new Error('useWorkflows must be used within WorkflowsProvider');
  return ctx;
}
