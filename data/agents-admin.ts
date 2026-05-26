import { Agent } from '@/lib/agents-types';

export const mockAgents: Agent[] = [
  {
    id: 'agent-001',
    name: 'Resumidor de Briefings',
    icon: '📋',
    instructions:
      'Você é especialista em síntese de briefings de marketing. Analise o briefing fornecido e produza um resumo executivo claro, destacando objetivos, público-alvo, tom de voz e entregáveis esperados.',
    status: 'active',
    skill_count: 2,
    client_count: 3,
    last_run_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    assigned_skills: ['resumo-briefing', 'analise-conteudo'],
    apps: [
      {
        id: 'app-conn-001',
        app_type: 'google_drive',
        enabled: false,
        connected_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      },
    ],
    memory_files: [
      {
        id: 'mem-001',
        filename: 'guia-marca-suno.md',
        content_type: 'text/markdown',
        size_bytes: 12480,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
      },
    ],
    schedule: null,
    permissions: [
      {
        client_id: 'client-abc',
        client_name: 'Marca Alpha',
        granted_by_name: 'Admin',
        granted_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
      },
      {
        client_id: 'client-def',
        client_name: 'Beta Studio',
        granted_by_name: 'Admin',
        granted_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
      },
      {
        client_id: 'client-ghi',
        client_name: 'Gama Corp',
        granted_by_name: 'Admin',
        granted_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      },
    ],
  },
  {
    id: 'agent-002',
    name: 'Criador de Pauta Social',
    icon: '📣',
    instructions:
      'Crie pauta de conteúdo para redes sociais com base no calendário e objetivos da marca. Gere sugestões de temas, formatos e frequência de publicação para cada canal.',
    status: 'draft',
    skill_count: 0,
    client_count: 0,
    last_run_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    assigned_skills: [],
    apps: [],
    memory_files: [],
    schedule: null,
    permissions: [],
  },
  {
    id: 'agent-003',
    name: 'Monitor de Desempenho',
    icon: '📊',
    instructions:
      'Analise métricas de campanhas e produza relatório de desempenho. Identifique tendências, pontos de melhoria e recomendações baseadas nos dados fornecidos.',
    status: 'inactive',
    skill_count: 1,
    client_count: 1,
    last_run_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3d ago
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    assigned_skills: ['relatorio-metricas'],
    apps: [],
    memory_files: [],
    schedule: {
      id: 'sched-001',
      frequency: 'daily',
      days_of_week: [1, 3, 5], // Seg, Qua, Sex
      time_of_day: '08:00',
      minute_offset: 0,
      timezone: 'America/Sao_Paulo',
      enabled: false,
      last_run_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      next_run_at: null,
    },
    permissions: [
      {
        client_id: 'client-abc',
        client_name: 'Marca Alpha',
        granted_by_name: 'Admin',
        granted_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 55).toISOString(),
      },
    ],
  },
];

// Mock agent runs for the active agent
export const mockAgentRuns: Record<string, import('@/lib/agents-types').AgentRun[]> = {
  'agent-001': [
    {
      id: 'run-001',
      status: 'completed',
      triggered_by: 'manual',
      client_id: 'client-abc',
      duration_ms: 4200,
      started_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      finished_at: new Date(Date.now() - 1000 * 60 * 60 * 2 + 4200).toISOString(),
      input: { briefing: 'Briefing campanha Q2 2026...' },
      output: { resumo: 'Resumo executivo: Campanha focada em awareness...' },
      error_message: null,
    },
    {
      id: 'run-002',
      status: 'failed',
      triggered_by: 'schedule',
      client_id: 'client-def',
      duration_ms: 1100,
      started_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      finished_at: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1100).toISOString(),
      input: { briefing: '' },
      output: null,
      error_message: 'Input inválido: briefing não pode estar vazio.',
    },
    {
      id: 'run-003',
      status: 'completed',
      triggered_by: 'manual',
      client_id: 'client-ghi',
      duration_ms: 3800,
      started_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      finished_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 3800).toISOString(),
      input: { briefing: 'Briefing lançamento produto...' },
      output: { resumo: 'Resumo: Lançamento focado em conversão...' },
      error_message: null,
    },
    {
      id: 'run-004',
      status: 'running',
      triggered_by: 'manual',
      client_id: 'client-abc',
      duration_ms: null,
      started_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      finished_at: null,
      input: { briefing: 'Briefing campanha Q3...' },
      output: null,
      error_message: null,
    },
  ],
};
