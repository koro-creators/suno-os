'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { GeneratedDoc, Workflow, WorkflowStep } from '@/lib/workflow-types';
import { initialWorkflows } from '@/data/workflows-admin';
import {
  apiAvailable,
  extractGerarPdfResult,
  getWorkflowRun,
  listWorkflows as apiListWorkflows,
  createWorkflow as apiCreateWorkflow,
  updateWorkflow as apiUpdateWorkflow,
  deleteWorkflow as apiDeleteWorkflow,
  runWorkflow as apiRunWorkflow,
  saveMockRun,
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
  runWorkflow: (id: string, triggerDoc?: { id: string; title: string; content?: string }) => Promise<void>;
  /** Sinaliza que um run completou. docId = doc de reunião que disparou. generatedDoc = resultado de gerar_pdf se presente. */
  notifyRunCompleted: (id: string, runId: string, docId?: string, generatedDoc?: GeneratedDoc) => void;
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

  async function runWorkflow(id: string, triggerDoc?: { id: string; title: string; content?: string }): Promise<void> {
    if (apiAvailable()) {
      const res = await apiRunWorkflow(id, triggerDoc);
      let generatedDoc: GeneratedDoc | undefined;
      try {
        const fullRun = await getWorkflowRun(id, res.run_id);
        generatedDoc = extractGerarPdfResult(fullRun.steps_output) ?? undefined;
      } catch { /* não bloqueia se o fetch falhar */ }
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
                  triggered_doc_id: triggerDoc?.id,
                  generated_doc: generatedDoc,
                },
                updated_at: new Date().toISOString(),
              }
            : w,
        ),
      );
      return;
    }
    // Mock: simula execução com comportamento correto do trigger step.
    // Se o workflow tem trigger nova_reuniao mas não há doc → só o trigger step roda.
    // Se há doc (triggerDoc) → todos os steps rodam, trigger retorna o nome do arquivo.
    const now = new Date().toISOString();
    const runId = `run-${crypto.randomUUID()}`;
    const wf = workflows.find((w) => w.id === id);
    const allSteps = wf?.steps ?? [];

    const hasTriggerStep = allSteps.some((s) => {
      const tt = s.trigger_type ?? (s.config as Record<string, unknown>)['trigger_type'];
      return s.type === 'trigger' && tt === 'nova_reuniao';
    });

    // Sem doc disponível: apenas o trigger step roda (fluxo para ali)
    const stepsToRun = hasTriggerStep && !triggerDoc
      ? allSteps.filter((s) => s.type === 'trigger')
      : allSteps;

    // Detecta step gerar_pdf e simula output para que useWorkflowEventTrigger crie o doc
    const gerarPdfStep = stepsToRun.find((s) => s.type === 'tool' && s.tool_name === 'gerar_pdf');
    const clienteSlug = wf?.client_scope?.[0] ?? wf?.client_id ?? 'suno';
    const mockGerarPdfOutput = gerarPdfStep && triggerDoc
      ? {
          titulo: `Conhecimento: ${triggerDoc.title}`,
          conteudo: `Documento de conhecimento gerado a partir da ata "${triggerDoc.title}".\n\n[Simulado em mock-mode]`,
          cliente_slug: clienteSlug,
          cliente_nome: clienteSlug,
          filename: `${triggerDoc.title.toLowerCase().replace(/\s+/g, '-').slice(0, 40)}-${Date.now()}.md`,
          saved_to: 'base',
          status: 'gerado',
        }
      : null;

    const stepsOutput: Record<string, unknown> = hasTriggerStep
      ? { trigger: triggerDoc
          ? { status: 'triggered', doc_title: triggerDoc.title, doc_id: triggerDoc.id }
          : { status: 'no_file', message: 'Nenhum arquivo novo disponível' } }
      : {};
    if (mockGerarPdfOutput && gerarPdfStep) {
      stepsOutput[gerarPdfStep.id] = mockGerarPdfOutput;
    }

    saveMockRun(id, {
      id: runId,
      workflow_id: id,
      status: 'completed',
      trigger: triggerDoc ? 'trigger' : 'manual',
      started_at: now,
      completed_at: now,
      error: null,
      steps_output: stepsOutput,
      step_logs: stepsToRun.map((s, i) => ({
        id: `sl-${runId}-${i}`,
        step_id: s.id,
        step_name: s.name,
        status: 'completed',
        input: null,
        output: s.type === 'trigger'
          ? (triggerDoc
              ? { status: 'triggered', doc_title: triggerDoc.title }
              : { status: 'no_file' })
          : s.tool_name === 'gerar_pdf' && mockGerarPdfOutput
            ? mockGerarPdfOutput
            : { simulated: true },
        error: null,
        duration_ms: s.type === 'trigger' ? 2 : 150,
        started_at: now,
        completed_at: now,
      })),
    });

    const generatedDoc = mockGerarPdfOutput
      ? extractGerarPdfResult(stepsOutput)
      : undefined;

    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              last_run: {
                run_id: runId,
                status: 'completed',
                completed_at: now,
                triggered_doc_id: triggerDoc?.id,
                generated_doc: generatedDoc ?? undefined,
              },
              updated_at: now,
            }
          : w
      )
    );
  }

  function notifyRunCompleted(id: string, runId: string, docId?: string, generatedDoc?: GeneratedDoc) {
    const now = new Date().toISOString();
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              last_run: {
                run_id: runId,
                status: 'completed',
                completed_at: now,
                triggered_doc_id: docId,
                generated_doc: generatedDoc,
              },
              updated_at: now,
            }
          : w
      )
    );
  }

  return (
    <WorkflowsContext.Provider
      value={{ workflows, loading, error, createWorkflow, updateWorkflow, deleteWorkflow, runWorkflow, notifyRunCompleted, validationOk, setValidationOk }}
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
