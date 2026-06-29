'use client';

import { useWorkflowEventTrigger } from '@/hooks/useWorkflowEventTrigger';

/** Componente global que mantém o listener de trigger ativo em todas as páginas. */
export default function WorkflowEventTriggerWatcher() {
  useWorkflowEventTrigger();
  return null;
}
