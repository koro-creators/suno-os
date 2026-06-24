'use client';

/**
 * New workflow page (SPEC-005 TASK-C17).
 *
 * Reset-and-redirect: creates an empty workflow with no steps and immediately
 * navigates to the canvas editor for that ID. The canvas shows an "arraste
 * aqui" hint so the user starts from a blank slate.
 * Templates remain supported through the `?template=` query string.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import { WORKFLOW_TEMPLATES } from '@/data/workflow-templates';
import type { WorkflowStep } from '@/lib/workflow-types';

function CreateWorkflowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createWorkflow } = useWorkflows();
  // Guard against React StrictMode's double effect-invoke in dev, which would
  // otherwise fire two POSTs and create duplicate workflows.
  const createdRef = useRef(false);

  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;
    const templateId = searchParams.get('template');
    let name = 'Novo workflow';
    let description = '';
    let steps: WorkflowStep[] = [];

    if (templateId) {
      const template = WORKFLOW_TEMPLATES.find((t) => t.id === templateId);
      if (template) {
        name = template.name;
        description = template.description;
        steps = template.steps as WorkflowStep[];
      }
    }

    // createdRef guarantees this runs once even under StrictMode's
    // double-invoke, so navigation is always desired (no cancellation needed —
    // tying the redirect to a per-invoke `cancelled` flag would let StrictMode's
    // cleanup suppress the only navigation).
    (async () => {
      try {
        const created = await createWorkflow({ name, description, client_id: '', steps });
        router.replace(`/workflows/${created.id}`);
      } catch {
        router.replace('/workflows');
      }
    })();
    // Effect runs once on mount; createWorkflow + router stable enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: 'Workflows', href: '/workflows' },
          { label: 'Novo workflow', href: '/workflows/new' },
        ]}
      />
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: 12,
        }}
      >
        Criando workflow…
      </div>
    </>
  );
}

export default function CreateWorkflowPage() {
  return (
    <Suspense>
      <CreateWorkflowContent />
    </Suspense>
  );
}
