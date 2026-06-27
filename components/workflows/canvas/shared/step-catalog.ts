'use client';

import { Branch, CloudUpload, Download, EventSchedule, Flash, Flow, Merge, Star, Tools, UserFollow } from '@carbon/icons-react';
import type { CarbonIconType } from '@carbon/icons-react';
import type { ToolDescriptor } from '@/lib/api';

// Unified payload — used by NodePalette (drag) and CanvasContextMenu (click).
export interface StepPayload {
  step_type: 'tool' | 'llm' | 'condition' | 'action' | 'hitl' | 'workflow' | 'merge' | 'trigger';
  tool_name?: string;
  agent_id?: string;
  condition_operator?: 'if_else';
  action_type?: 'slack' | 'email' | 'whatsapp' | 'telegram' | 'salvar_pdf' | 'baixar_pdf';
  trigger_type?: 'nova_reuniao';
  workflow_id?: string;
  merge_policy?: 'all' | 'any';
  name?: string;
  default_config?: Record<string, unknown>;
  default_introduction?: string;
}

export interface StepCatalogItem {
  key: string;
  label: string;
  description: string;
  Icon: CarbonIconType;
  color: string;
  payload: StepPayload;
  expandable?: boolean;
}

export interface StepSubItem {
  key: string;
  icon?: string;
  Icon?: CarbonIconType;
  iconColor?: string;
  label: string;
  description?: string;
  payload: StepPayload;
}

export const TOOL_CATEGORY_COLOR: Record<ToolDescriptor['category'], string> = {
  criacao: 'var(--criacao)',
  midia: 'var(--midia)',
  planejamento: 'var(--planejamento)',
  controle: 'var(--text-muted)',
};

export const STEP_CATALOG: StepCatalogItem[] = [
  {
    key: 'st-trigger',
    label: 'Trigger',
    description: 'Inicia o workflow quando um evento ocorre.',
    Icon: EventSchedule,
    color: '#0EA5E9',
    payload: { step_type: 'trigger' },
    expandable: true,
  },
  {
    key: 'st-tool',
    label: 'Tool',
    description: 'Chama uma ferramenta do catálogo.',
    Icon: Tools,
    color: '#3B82F6',
    payload: { step_type: 'tool' },
    expandable: true,
  },
  {
    key: 'st-llm',
    label: 'Agente',
    description: 'Compor texto com um agente ou prompt manual.',
    Icon: Star,
    color: '#8B5CF6',
    payload: { step_type: 'llm' },
    expandable: true,
  },
  {
    key: 'st-condition',
    label: 'Condição',
    description: 'Branch then/else por valor comparado.',
    Icon: Branch,
    color: '#F59E0B',
    payload: { step_type: 'condition', condition_operator: 'if_else', name: 'Se / Senão' },
  },
  {
    key: 'st-action',
    label: 'Ação',
    description: 'Slack, email, WhatsApp, Telegram.',
    Icon: Flash,
    color: '#22C55E',
    payload: { step_type: 'action' },
    expandable: true,
  },
  {
    key: 'st-hitl',
    label: 'Aprovação humana',
    description: 'Pausa para revisão (HITL).',
    Icon: UserFollow,
    color: 'var(--sun)',
    payload: { step_type: 'hitl', name: 'Aprovação' },
  },
  {
    key: 'st-workflow',
    label: 'Sub-workflow',
    description: 'Chama outro workflow.',
    Icon: Flow,
    color: '#EC4899',
    payload: { step_type: 'workflow' },
    expandable: true,
  },
  {
    key: 'st-merge',
    label: 'Merge',
    description: 'Aguarda fan-in (all / any).',
    Icon: Merge,
    color: 'var(--text-muted)',
    payload: { step_type: 'merge' },
    expandable: true,
  },
];

export function buildSubItems(
  key: string,
  tools: ToolDescriptor[],
  agents: { id: string; name: string; icon?: string }[],
  workflows: { id: string; name: string; description?: string }[],
): StepSubItem[] | null {
  if (key === 'st-trigger') {
    return [
      {
        key: 'trigger-nova-reuniao',
        Icon: EventSchedule,
        iconColor: '#0EA5E9',
        label: 'Evento de nova reunião',
        description: 'Dispara uma vez quando um novo documento de reunião chega à Biblioteca.',
        payload: { step_type: 'trigger' as const, trigger_type: 'nova_reuniao' as const, name: 'Evento de nova reunião' },
      },
    ];
  }
  if (key === 'st-tool') {
    return tools.map((t) => ({
      key: `tool-${t.tool_name}`,
      Icon: Tools,
      iconColor: TOOL_CATEGORY_COLOR[t.category],
      label: t.label,
      description: t.description,
      payload: { step_type: 'tool' as const, tool_name: t.tool_name, name: t.label, default_config: t.default_config, default_introduction: t.default_introduction },
    }));
  }
  if (key === 'st-llm') {
    return agents.map((a) => ({
      key: `agent-${a.id}`,
      icon: a.icon,
      label: a.name,
      description: 'Agente · aba Agentes',
      payload: { step_type: 'llm' as const, agent_id: a.id, name: a.name },
    }));
  }
  if (key === 'st-action') {
    return [
      { key: 'action-salvar-pdf', Icon: CloudUpload, iconColor: '#3B82F6', label: 'Salvar PDF no Drive', description: 'Salva o PDF gerado na pasta base do Drive.',     payload: { step_type: 'action' as const, action_type: 'salvar_pdf' as const, name: 'Salvar PDF no Drive' } },
      { key: 'action-baixar-pdf', Icon: Download,    iconColor: '#8B5CF6', label: 'Baixar PDF',          description: 'Faz o download do PDF gerado no navegador.',   payload: { step_type: 'action' as const, action_type: 'baixar_pdf' as const, name: 'Baixar PDF'          } },
      { key: 'action-slack',      icon: '#', iconColor: '#4A154B', label: 'Slack',    description: 'Enviar mensagem para canal',  payload: { step_type: 'action' as const, action_type: 'slack'    as const, name: 'Slack'    } },
      { key: 'action-email',      icon: '@', iconColor: '#6366F1', label: 'Email',    description: 'Enviar e-mail',               payload: { step_type: 'action' as const, action_type: 'email'    as const, name: 'Email'    } },
      { key: 'action-whatsapp',   icon: 'W', iconColor: '#25D366', label: 'WhatsApp', description: 'Enviar mensagem WhatsApp',    payload: { step_type: 'action' as const, action_type: 'whatsapp' as const, name: 'WhatsApp' } },
      { key: 'action-telegram',   icon: '✈', iconColor: '#2CA5E0', label: 'Telegram', description: 'Enviar mensagem Telegram',    payload: { step_type: 'action' as const, action_type: 'telegram' as const, name: 'Telegram' } },
    ];
  }
  if (key === 'st-workflow') {
    return workflows.map((w) => ({
      key: `wf-${w.id}`,
      Icon: Flow,
      iconColor: '#EC4899',
      label: w.name,
      description: w.description || 'Sub-workflow',
      payload: { step_type: 'workflow' as const, workflow_id: w.id, name: w.name },
    }));
  }
  if (key === 'st-merge') {
    return [
      { key: 'merge-all', icon: '∀', iconColor: 'var(--text-secondary)', label: 'Todos (all)',       description: 'Avança quando todos os branches chegarem',  payload: { step_type: 'merge' as const, merge_policy: 'all' as const, name: 'Merge · all' } },
      { key: 'merge-any', icon: '∃', iconColor: 'var(--text-secondary)', label: 'Qualquer um (any)', description: 'Avança com o primeiro branch que chegar',   payload: { step_type: 'merge' as const, merge_policy: 'any' as const, name: 'Merge · any' } },
    ];
  }
  return null;
}
