'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import WorkflowBuilder from '@/components/workflows/WorkflowBuilder';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import { Workflow, WorkflowStep } from '@/lib/workflow-types';
import { WORKFLOW_TEMPLATES } from '@/data/workflow-templates';

const EMPTY_WORKFLOW: Workflow = {
  id: '',
  name: '',
  description: '',
  status: 'draft',
  steps: [],
  steps_count: 0,
  created_by: 'admin',
  created_at: '',
  updated_at: '',
};

function CreateWorkflowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createWorkflow } = useWorkflows();

  // Check for template query param
  const templateId = searchParams.get('template');
  let initial = EMPTY_WORKFLOW;

  if (templateId) {
    const template = WORKFLOW_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      initial = {
        ...EMPTY_WORKFLOW,
        name: template.name,
        description: template.description,
        steps: template.steps as WorkflowStep[],
        steps_count: template.steps.length,
      };
    }
  }

  const handleCreate = (data: Workflow) => {
    createWorkflow({
      name: data.name,
      description: data.description,
      steps: data.steps,
      schedule: data.schedule,
    });
    router.push('/workflows');
  };

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: 'Workflows', href: '/workflows' },
          { label: 'Novo Workflow', href: '/workflows/new' },
        ]}
      />
      <WorkflowBuilder initial={initial} onSave={handleCreate} isNew />
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
