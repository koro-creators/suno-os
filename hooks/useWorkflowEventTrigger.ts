'use client';

/**
 * Listener global de trigger de workflow por evento de pasta.
 *
 * Montado em Providers.tsx para persistir entre navegações de página.
 *
 * Condição de disparo: workflow ativo com step trigger_type='nova_reuniao'
 * + documento na Biblioteca com docType='reuniao' e status='novo'.
 *
 * Ordem de execução por doc:
 *   1. Executa o workflow (aguarda conclusão)
 *   2. Somente após sucesso: muda status 'novo' → 'utilizado'
 *   3. Se workflow falhar: status permanece 'novo' (pode tentar novamente)
 */

import { useEffect, useRef } from 'react';
import { useBiblioteca } from '@/contexts/BibliotecaContext';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import {
  apiAvailable,
  extractGerarPdfResult,
  getWorkflowRun,
  runWorkflow as apiRunWorkflow,
  saveMockRun,
} from '@/lib/api';
import { generatePdfBytes } from '@/lib/generate-pdf';
import type { GeneratedDoc, WorkflowRun } from '@/lib/workflow-types';

const FIRED_KEY = 'sunos-trigger-fired-nova-reuniao';
const FOLDER_DB = 'sunos-folder-sync';
const FOLDER_STORE = 'handles';

function getFiredSet(): Set<string> {
  try {
    const raw = localStorage.getItem(FIRED_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set<string>();
  }
}

function saveFiredSet(set: Set<string>) {
  localStorage.setItem(FIRED_KEY, JSON.stringify(Array.from(set)));
}

export function addToFiredSet(docId: string) {
  const fired = getFiredSet();
  fired.add(docId);
  saveFiredSet(fired);
}

// ---------- Gravação de PDF na pasta base ----------

async function loadBaseFolderHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await new Promise<IDBDatabase>((res, rej) => {
      const r = indexedDB.open(FOLDER_DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(FOLDER_STORE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return await new Promise<FileSystemDirectoryHandle | null>((res, rej) => {
      const tx = db.transaction(FOLDER_STORE, 'readonly');
      const req = tx.objectStore(FOLDER_STORE).get('base');
      req.onsuccess = () => { db.close(); res((req.result as FileSystemDirectoryHandle) ?? null); };
      req.onerror = () => { db.close(); rej(req.error); };
    });
  } catch { return null; }
}

async function writePdfToFolder(filename: string, bytes: Uint8Array): Promise<void> {
  const handle = await loadBaseFolderHandle();
  if (!handle) return;
  try {
    type DirH = FileSystemDirectoryHandle & {
      requestPermission?: (o: { mode: string }) => Promise<PermissionState>;
    };
    const perm = await (handle as DirH).requestPermission?.({ mode: 'readwrite' });
    if (perm !== 'granted') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fh: any = await handle.getFileHandle(filename, { create: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const writable: any = await fh.createWritable();
    await writable.write(bytes);
    await writable.close();
  } catch { /* pasta pode não estar conectada ou sem permissão */ }
}

function writePdfFromGenDoc(genDoc: { titulo: string; conteudo: string; cliente_nome: string; filename: string }): void {
  const bytes = generatePdfBytes(genDoc.titulo, genDoc.conteudo, genDoc.cliente_nome);
  void writePdfToFolder(genDoc.filename, bytes);
}

// ---------- Hook ----------

export function useWorkflowEventTrigger() {
  const { documents, updateDocument } = useBiblioteca();
  const { workflows, loading, notifyRunCompleted } = useWorkflows();

  const updateRef = useRef(updateDocument);
  const notifyRef = useRef(notifyRunCompleted);
  useEffect(() => { updateRef.current = updateDocument; });
  useEffect(() => { notifyRef.current = notifyRunCompleted; });

  // Detecta nova execução em workflows com trigger nova_reuniao e marca SOMENTE o
  // doc que aparece no steps_output do trigger (doc_id). Evita marcar docs não usados.
  const prevRunIdsRef = useRef<Record<string, string | undefined>>({});
  const runIdsInitialized = useRef(false);

  useEffect(() => {
    if (loading) return;

    // Na primeira carga: sementar ref com run IDs atuais para evitar falso positivo
    if (!runIdsInitialized.current) {
      workflows.forEach((wf) => {
        prevRunIdsRef.current[wf.id] = wf.last_run?.run_id;
      });
      runIdsInitialized.current = true;
      return;
    }

    for (const wf of workflows) {
      const hasTrigger = wf.steps.some((s) => {
        const tt = s.trigger_type ?? (s.config as Record<string, unknown>)['trigger_type'];
        return s.type === 'trigger' && tt === 'nova_reuniao';
      });
      if (!hasTrigger) continue;

      const currentRunId = wf.last_run?.run_id;
      if (!currentRunId || currentRunId === prevRunIdsRef.current[wf.id]) continue;

      prevRunIdsRef.current[wf.id] = currentRunId;

      const usedDocId = wf.last_run?.triggered_doc_id;
      if (usedDocId) {
        const usedDoc = documents.find((d) => d.id === usedDocId && d.status === 'novo');
        if (usedDoc) {
          updateRef.current(usedDoc.id, { status: 'utilizado' });
        }
      }

      // generated_doc: grava PDF na pasta base (Biblioteca sincroniza via polling)
      const genDoc = wf.last_run?.generated_doc;
      if (genDoc) writePdfFromGenDoc(genDoc);
    }
  }, [workflows, documents, loading]);

  useEffect(() => {
    if (loading) return;

    // Workflows ativos com step trigger nova_reuniao
    const activeWorkflows = workflows.filter(
      (w) =>
        w.status === 'active' &&
        w.steps.some((s) => {
          if (s.type !== 'trigger') return false;
          const tt = s.trigger_type ?? s.config['trigger_type'];
          return tt === 'nova_reuniao';
        }),
    );
    if (activeWorkflows.length === 0) return;

    // Docs de reunião novos ainda não disparados
    const newDocs = documents.filter((d) => d.docType === 'reuniao' && d.status === 'novo');
    if (newDocs.length === 0) return;

    const fired = getFiredSet();
    const toFire = newDocs.filter((d) => !fired.has(d.id));
    if (toFire.length === 0) return;

    // Marca como disparado ANTES de executar (evita double-fire entre re-renders)
    toFire.forEach((d) => fired.add(d.id));
    saveFiredSet(fired);

    // Executa de forma assíncrona: status muda SOMENTE após o workflow completar
    void (async () => {
      for (const doc of toFire) {
        for (const wf of activeWorkflows) {
          const now = new Date().toISOString();

          if (apiAvailable()) {
            try {
              const result = await apiRunWorkflow(wf.id, { id: doc.id, title: doc.title, content: doc.content });
              // Busca run completo para detectar output de gerar_pdf
              let generatedDoc: GeneratedDoc | undefined;
              try {
                const run = await getWorkflowRun(wf.id, result.run_id);
                generatedDoc = extractGerarPdfResult(run.steps_output) ?? undefined;
              } catch { /* ignora — não bloqueia marcação de status */ }
              notifyRef.current(wf.id, result.run_id, doc.id, generatedDoc);
              // Workflow concluiu com sucesso → atualiza status
              updateRef.current(doc.id, { status: 'utilizado' });
            } catch (err) {
              console.error('[trigger] workflow falhou, status permanece novo', wf.id, err);
              // Status permanece 'novo' para nova tentativa
              const failedFired = getFiredSet();
              failedFired.delete(doc.id);
              saveFiredSet(failedFired);
            }
          } else {
            // Mock mode: simula execução e salva no histórico
            const runId = `run-trigger-${crypto.randomUUID()}`;
            const gerarPdfStep = wf.steps.find((s) => s.type === 'tool' && s.tool_name === 'gerar_pdf');
            const clienteSlug = wf.client_scope?.[0] ?? wf.client_id ?? 'suno';
            const mockGerarPdfOutput = gerarPdfStep
              ? {
                  titulo: `Conhecimento: ${doc.title}`,
                  conteudo: `Documento gerado a partir da ata "${doc.title}".\n\n[Simulado em mock-mode]`,
                  cliente_slug: clienteSlug,
                  cliente_nome: clienteSlug,
                  filename: `${doc.title.toLowerCase().replace(/\s+/g, '-').slice(0, 40)}-${Date.now()}.pdf`,
                  saved_to: 'base',
                  status: 'gerado',
                }
              : null;

            const stepsOutput: Record<string, unknown> = {
              trigger: { started: true, trigger_type: 'nova_reuniao', doc_title: doc.title },
            };
            if (mockGerarPdfOutput && gerarPdfStep) {
              stepsOutput[gerarPdfStep.id] = mockGerarPdfOutput;
            }

            const mockRun: WorkflowRun = {
              id: runId,
              workflow_id: wf.id,
              status: 'completed',
              started_at: now,
              completed_at: now,
              error: null,
              steps_output: stepsOutput,
              step_logs: wf.steps.map((s, i) => ({
                id: `sl-${runId}-${i}`,
                step_id: s.id,
                step_name: s.name,
                status: 'completed',
                input: null,
                output: s.type === 'trigger'
                  ? { started: true, doc_title: doc.title }
                  : s.tool_name === 'gerar_pdf' && mockGerarPdfOutput
                    ? mockGerarPdfOutput
                    : { simulated: true },
                error: null,
                duration_ms: s.type === 'trigger' ? 2 : 150,
                started_at: now,
                completed_at: now,
              })),
            };
            saveMockRun(wf.id, mockRun);

            // Mock mode: grava PDF na pasta base (sem criar doc na Biblioteca)
            if (mockGerarPdfOutput) writePdfFromGenDoc(mockGerarPdfOutput);

            updateRef.current(doc.id, { status: 'utilizado' });
          }
        }
      }
    })();
  }, [documents, workflows, loading]);
}
