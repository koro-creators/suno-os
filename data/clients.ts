import { Client } from '@/lib/types';

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Moon definitions per skill
const moonDefs: Record<string, { name: string; description: string }[]> = {
  'texto-de-radio': [
    { name: 'Spot 30"', description: 'Spot de rádio de 30 segundos' },
    { name: 'Jingle', description: 'Jingle musical para rádio' },
    { name: 'Institucional', description: 'Texto institucional para rádio' },
  ],
  'copy-social': [
    { name: 'Feed/Carrossel', description: 'Copy para posts de feed e carrossel' },
    { name: 'Stories/Reels', description: 'Copy para stories e reels' },
    { name: 'X/Twitter', description: 'Copy para X/Twitter' },
  ],
  'roteiro-de-video': [
    { name: 'TVC 30"', description: 'Roteiro de TV comercial 30 segundos' },
    { name: 'Digital Pre-roll', description: 'Roteiro para pre-roll digital' },
  ],
  'plano-de-midia': [
    { name: 'Digital', description: 'Planejamento de mídia digital' },
    { name: 'OOH', description: 'Planejamento de mídia out-of-home' },
    { name: 'TV/Rádio', description: 'Planejamento de mídia TV e rádio' },
  ],
  'report-performance': [
    { name: 'Semanal', description: 'Report de performance semanal' },
    { name: 'Mensal', description: 'Report de performance mensal' },
  ],
  'persona-sintetica': [
    { name: 'Jovem 18-25', description: 'Persona sintética jovem 18-25 anos' },
    { name: 'Premium 35+', description: 'Persona sintética premium 35+' },
    { name: 'MEI/PJ', description: 'Persona sintética MEI e PJ' },
  ],
  'brief-builder': [
    { name: 'Campanha', description: 'Brief para campanha pontual' },
    { name: 'Always-on', description: 'Brief para always-on' },
  ],
  'analise-de-mercado': [
    { name: 'Concorrência', description: 'Análise de concorrência' },
    { name: 'Tendências', description: 'Análise de tendências de mercado' },
  ],
};

// Skill definitions with type mapping
const skillDefs: Record<string, { name: string; type: 'criacao' | 'midia' | 'planejamento' }> = {
  'texto-de-radio': { name: 'Texto de Rádio', type: 'criacao' },
  'copy-social': { name: 'Copy Social', type: 'criacao' },
  'roteiro-de-video': { name: 'Roteiro de Vídeo', type: 'criacao' },
  'plano-de-midia': { name: 'Plano de Mídia', type: 'midia' },
  'report-performance': { name: 'Report Performance', type: 'midia' },
  'persona-sintetica': { name: 'Persona Sintética', type: 'planejamento' },
  'brief-builder': { name: 'Brief Builder', type: 'planejamento' },
  'analise-de-mercado': { name: 'Análise de Mercado', type: 'planejamento' },
};

// Client skill assignments
const clientSkillMap: Record<string, string[]> = {
  suno: ['copy-social', 'roteiro-de-video', 'plano-de-midia', 'report-performance', 'brief-builder', 'analise-de-mercado', 'persona-sintetica'],
  vivo: ['texto-de-radio', 'copy-social', 'plano-de-midia', 'brief-builder', 'analise-de-mercado'],
  americanas: ['copy-social', 'roteiro-de-video', 'report-performance', 'persona-sintetica'],
  sicredi: ['texto-de-radio', 'copy-social', 'plano-de-midia', 'persona-sintetica', 'analise-de-mercado'],
  samsung: ['copy-social', 'roteiro-de-video', 'plano-de-midia', 'report-performance', 'persona-sintetica', 'texto-de-radio'],
};

function buildClient(name: string, clientSlug: string, color: string): Client {
  const skillSlugs = clientSkillMap[clientSlug];
  return {
    id: clientSlug,
    name,
    slug: clientSlug,
    color,
    skills: skillSlugs.map((skillSlug) => {
      const def = skillDefs[skillSlug];
      const moons = moonDefs[skillSlug];
      return {
        id: `${clientSlug}-${skillSlug}`,
        name: def.name,
        slug: skillSlug,
        type: def.type,
        moons: moons.map((m) => {
          const moonSlug = slug(m.name);
          return {
            id: `${clientSlug}-${skillSlug}-${moonSlug}`,
            name: m.name,
            slug: moonSlug,
            description: m.description,
          };
        }),
      };
    }),
  };
}

export const clients: Client[] = [
  buildClient('Suno', 'suno', '#FFC801'),
  buildClient('Vivo', 'vivo', '#8B5CF6'),
  buildClient('Americanas', 'americanas', '#F97316'),
  buildClient('Sicredi', 'sicredi', '#22C55E'),
  buildClient('Samsung', 'samsung', '#1428A0'),
];
