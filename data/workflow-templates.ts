import { WorkflowTemplate } from '@/lib/workflow-types';

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'template-report-mensal',
    name: 'Relatorio Mensal',
    description: 'Gera report de performance e envia para Slack',
    steps: [
      { id: 's1', name: 'Buscar dados', type: 'tool', tool_name: 'query_data', config: { query: 'metricas do mes' } },
      { id: 's2', name: 'Gerar analise', type: 'llm', prompt: 'Analise os dados: {{previous}}', config: {} },
      { id: 's3', name: 'Enviar para Slack', type: 'action', tool_name: 'send_slack', config: { channel: '#reports' } },
    ],
  },
  {
    id: 'template-briefing-criativo',
    name: 'Briefing Criativo',
    description: 'Coleta dados do cliente, pesquisa referencias e gera briefing criativo completo',
    steps: [
      { id: 's1', name: 'Coletar dados do cliente', type: 'tool', tool_name: 'search_knowledge', config: { query: 'dados do cliente' } },
      { id: 's2', name: 'Pesquisar referencias', type: 'tool', tool_name: 'search_knowledge', config: { query: 'referencias criativas' } },
      { id: 's3', name: 'Gerar briefing', type: 'llm', prompt: 'Com base nos dados: {{steps.s1}} e referencias: {{steps.s2}}, gere um briefing criativo completo.', config: {} },
      { id: 's4', name: 'Revisao humana', type: 'hitl', config: { review_instructions: 'Valide o briefing gerado antes de enviar' } },
    ],
  },
  {
    id: 'template-monitor-social',
    name: 'Monitor de Redes Sociais',
    description: 'Monitora mencoes, analisa sentimento e dispara alerta se negativo',
    steps: [
      { id: 's1', name: 'Coletar mencoes', type: 'tool', tool_name: 'search_knowledge', config: { query: 'mencoes recentes redes sociais' } },
      { id: 's2', name: 'Analisar sentimento', type: 'llm', prompt: 'Analise o sentimento das mencoes: {{previous}}. Retorne JSON com campo "sentiment": "positive"|"negative"|"neutral".', config: {} },
      { id: 's3', name: 'Registrar resultado', type: 'action', tool_name: 'log_result', config: {} },
    ],
  },
  {
    id: 'template-pesquisa-mercado',
    name: 'Pesquisa de Mercado',
    description: 'Busca tendencias, analisa concorrentes e gera insights acionaveis',
    steps: [
      { id: 's1', name: 'Buscar tendencias', type: 'tool', tool_name: 'search_knowledge', config: { query: 'tendencias de mercado 2026' } },
      { id: 's2', name: 'Analisar concorrentes', type: 'tool', tool_name: 'search_knowledge', config: { query: 'analise concorrentes' } },
      { id: 's3', name: 'Gerar insights', type: 'llm', prompt: 'Com base nas tendencias: {{steps.s1}} e analise de concorrentes: {{steps.s2}}, gere insights acionaveis para o time de marketing.', config: {} },
      { id: 's4', name: 'Revisar insights', type: 'hitl', config: { review_instructions: 'Valide os insights antes de compartilhar com o time' } },
      { id: 's5', name: 'Enviar por email', type: 'action', tool_name: 'send_email', config: { to: 'team@example.com', subject: 'Insights de Mercado' } },
    ],
  },
];
