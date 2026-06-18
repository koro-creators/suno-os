'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Workflow, WorkflowStep } from '@/lib/workflow-types';
import { initialWorkflows } from '@/data/workflows-admin';
import {
  apiAvailable,
  listWorkflows as apiListWorkflows,
  createWorkflow as apiCreateWorkflow,
  updateWorkflow as apiUpdateWorkflow,
  deleteWorkflow as apiDeleteWorkflow,
  runWorkflow as apiRunWorkflow,
} from '@/lib/api';

interface WorkflowCreateData {
  name: string;
  description: string;
  client_id: string;
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
  createWorkflow: (data: WorkflowCreateData) => Promise<Workflow>;
  updateWorkflow: (id: string, data: Partial<Workflow>) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  runWorkflow: (id: string) => Promise<void>;
  /** validationOk[workflowId] — true after the user clicks "Validar" with 0 findings. */
  validationOk: Record<string, boolean>;
  setValidationOk: (workflowId: string, ok: boolean) => void;
}

const WorkflowsContext = createContext<WorkflowsContextValue | null>(null);

export function WorkflowsProvider({ children }: { children: ReactNode }) {
  // Real-mode starts empty + loading; mock-mode seeds from the fixture file.
  const [workflows, setWorkflows] = useState<Workflow[]>(
    apiAvailable() ? [] : initialWorkflows,
  );
  const [loading, setLoading] = useState<boolean>(apiAvailable());
  const [error, setError] = useState<string | null>(null);
  const [validationOk, setValidationOkMap] = useState<Record<string, boolean>>({});

  function setValidationOk(workflowId: string, ok: boolean) {
    setValidationOkMap((prev) => ({ ...prev, [workflowId]: ok }));
  }

  // Load the workflow list from the backend on mount (real-mode only).
  // On any failure, degrade to the mock fixtures so the UI keeps working
  // (canvas-conventions.md §mock-mode degradation).
  useEffect(() => {
    if (!apiAvailable()) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await apiListWorkflows();
        if (!cancelled) setWorkflows(list);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setWorkflows(initialWorkflows); // graceful fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function createWorkflow(data: WorkflowCreateData): Promise<Workflow> {
    if (apiAvailable()) {
      const created = await apiCreateWorkflow(data);
      setWorkflows((prev) => [created, ...prev]);
      return created;
    }
    // Mock-mode: local-only creation
    const id = `wf-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const newWorkflow: Workflow = {
      id,
      name: data.name,
      description: data.description,
      status: 'draft',
      client_id: data.client_id,
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

  async function updateWorkflow(id: string, data: Partial<Workflow>): Promise<void> {
    if (apiAvailable()) {
      const updated = await apiUpdateWorkflow(id, data);
      // List responses omit steps; preserve any steps we already had locally
      // so the editor's in-flight canvas state isn't blown away by the patch.
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === id ? { ...updated, steps: updated.steps.length ? updated.steps : w.steps } : w,
        ),
      );
      return;
    }
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

  async function deleteWorkflow(id: string): Promise<void> {
    if (apiAvailable()) {
      await apiDeleteWorkflow(id);
    }
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  }

  async function runWorkflow(id: string): Promise<void> {
    if (apiAvailable()) {
      const res = await apiRunWorkflow(id);
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === id
            ? {
                ...w,
                last_run: {
                  run_id: res.run_id,
                  status: res.status,
                  completed_at:
                    res.status === 'completed' || res.status === 'failed'
                      ? new Date().toISOString()
                      : null,
                },
                updated_at: new Date().toISOString(),
              }
            : w,
        ),
      );
      return;
    }
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
      value={{ workflows, loading, error, createWorkflow, updateWorkflow, deleteWorkflow, runWorkflow, validationOk, setValidationOk }}
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
