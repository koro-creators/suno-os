import { PromptTemplate } from '@/lib/types';

// ──────────────────────────────────────────
// Templates by skill (generic, any client)
// ──────────────────────────────────────────

export const templatesBySkill: Record<string, PromptTemplate[]> = {
  // Criacao
  'texto-de-radio': [
    { id: 'tr-1', label: 'Spot promocional', prompt: 'Crie um spot de rádio de 30" para uma promoção de curto prazo com senso de urgência e CTA claro.' },
    { id: 'tr-2', label: 'Institucional com dados', prompt: 'Escreva um texto institucional para rádio que inclua um dado de impacto social da marca.' },
    { id: 'tr-3', label: 'Jingle refrão', prompt: 'Proponha um refrão de jingle em tom alegre, BPM 120, com rima fácil para fixação da marca.' },
  ],
  'copy-social': [
    { id: 'cs-1', label: 'Carrossel educativo', prompt: 'Crie um carrossel de 5 slides educativo sobre o principal benefício do produto para feed Instagram.' },
    { id: 'cs-2', label: 'Reels com hook', prompt: 'Escreva um roteiro de Reels 15" com hook nos primeiros 3 segundos e CTA no final.' },
    { id: 'cs-3', label: 'Thread X/Twitter', prompt: 'Monte uma thread de 3 tweets com tom informal para engajar público jovem no X/Twitter.' },
  ],
  'roteiro-de-video': [
    { id: 'rv-1', label: 'TVC emocional', prompt: 'Crie um roteiro de TVC 30" com narrativa emocional, cena única e locução off.' },
    { id: 'rv-2', label: 'Pre-roll bumper', prompt: 'Escreva um bumper de 6" para YouTube com mensagem direta e logo no final.' },
  ],

  // Midia
  'plano-de-midia': [
    { id: 'pm-1', label: 'Plano digital completo', prompt: 'Monte um plano de mídia digital com divisão de budget por canal, KPIs e público-alvo.' },
    { id: 'pm-2', label: 'Mix TV + digital', prompt: 'Proponha um mix de mídia TV aberta + digital para campanha de awareness em 3 semanas.' },
    { id: 'pm-3', label: 'OOH grandes praças', prompt: 'Crie um plano OOH para São Paulo, Rio e BH com estimativa de impacto e formatos recomendados.' },
  ],
  'report-performance': [
    { id: 'rp-1', label: 'Report semanal', prompt: 'Gere um report semanal com tabela de métricas (impressões, cliques, CPL, conversões) e recomendações.' },
    { id: 'rp-2', label: 'Report mensal executivo', prompt: 'Monte um report mensal executivo com funil completo, budget executado e top 3 criativos por CPA.' },
  ],

  // Planejamento
  'persona-sintetica': [
    { id: 'ps-1', label: 'Persona jovem', prompt: 'Crie uma persona sintética de jovem 18-25 anos com comportamento digital, dores e gatilhos de compra.' },
    { id: 'ps-2', label: 'Persona decisor B2B', prompt: 'Monte uma persona sintética de decisor empresarial 35-50 anos com jornada de compra B2B.' },
    { id: 'ps-3', label: 'Persona empreendedor', prompt: 'Gere uma persona sintética de micro-empreendedor MEI com relação com dinheiro e canais de influência.' },
  ],
  'brief-builder': [
    { id: 'bb-1', label: 'Brief de campanha', prompt: 'Monte um brief de campanha com objetivo, público, mensagem-chave, canais, budget e KPIs.' },
    { id: 'bb-2', label: 'Brief always-on', prompt: 'Crie um brief de conteúdo always-on com pilares editoriais, frequência e tom de voz.' },
  ],
  'analise-de-mercado': [
    { id: 'am-1', label: 'Análise de concorrência', prompt: 'Faça uma análise de concorrência com share of voice, posicionamento, canais e gaps identificados.' },
    { id: 'am-2', label: 'Tendências do setor', prompt: 'Identifique 3 tendências relevantes do setor com impacto estimado e recomendações para a marca.' },
    { id: 'am-3', label: 'Benchmark criativo', prompt: 'Analise os melhores criativos dos concorrentes no último trimestre e proponha oportunidades.' },
  ],
};

// ──────────────────────────────────────────
// Templates by moon (Santander-specific)
// ──────────────────────────────────────────

export const templatesByMoon: Record<string, PromptTemplate[]> = {
  // Texto de Radio — moons
  'spot-30': [
    { id: 'mn-spot-1', label: 'Spot Select com benefícios', prompt: 'Crie um spot 30" para Santander Select destacando assessoria personalizada e cashback em investimentos.' },
    { id: 'mn-spot-2', label: 'Spot promoção sazonal', prompt: 'Escreva um spot 30" para promoção sazonal do Santander com senso de urgência e taxa diferenciada.' },
  ],
  jingle: [
    { id: 'mn-jingle-1', label: 'Jingle financiamento auto', prompt: 'Crie um jingle animado para Santander Financiamento Auto com refrão memorável e foco em taxa baixa.' },
    { id: 'mn-jingle-2', label: 'Jingle conta universitária', prompt: 'Proponha um jingle jovem para Santander Universitário com linguagem Gen-Z e ritmo urbano.' },
  ],
  institucional: [
    { id: 'mn-inst-1', label: 'Institucional ESG', prompt: 'Escreva um texto institucional para rádio sobre as iniciativas de sustentabilidade do Santander com dados reais.' },
    { id: 'mn-inst-2', label: 'Institucional diversidade', prompt: 'Crie texto institucional rádio sobre programa de diversidade e inclusão do Santander.' },
  ],

  // Copy Social — moons
  'feed-carrossel': [
    { id: 'mn-feed-1', label: 'Carrossel educação financeira', prompt: 'Monte um carrossel de 5 slides sobre erros financeiros comuns com dicas práticas do Santander.' },
    { id: 'mn-feed-2', label: 'Carrossel produto Select', prompt: 'Crie carrossel destacando os 4 benefícios exclusivos do Santander Select para público AB.' },
  ],
  'stories-reels': [
    { id: 'mn-stories-1', label: 'Reels cashback', prompt: 'Roteiro de Reels 15" mostrando o cashback do Santander de forma visual e surpreendente.' },
    { id: 'mn-stories-2', label: 'Reels Pix parcelado', prompt: 'Crie um Reels 15" explicando Pix Parcelado do Santander com hook nos primeiros 2 segundos.' },
  ],
  'x-twitter': [
    { id: 'mn-twitter-1', label: 'Thread universitário', prompt: 'Monte uma thread de 3 tweets para Santander Universitário com tom informal e benefícios claros.' },
    { id: 'mn-twitter-2', label: 'Tweet provocativo Select', prompt: 'Escreva um tweet provocativo sobre as vantagens de ser Select, gerando engajamento.' },
  ],

  // Roteiro de Video — moons
  'tvc-30': [
    { id: 'mn-tvc-1', label: 'TVC consórcio emocional', prompt: 'Crie roteiro TVC 30" emocional para Santander Consórcio sobre a conquista da casa própria.' },
    { id: 'mn-tvc-2', label: 'TVC Select lifestyle', prompt: 'Roteiro TVC 30" mostrando o dia a dia de um cliente Select com benefícios integrados naturalmente.' },
  ],
  'digital-pre-roll': [
    { id: 'mn-preroll-1', label: 'Bumper Pix parcelado', prompt: 'Crie um bumper de 6" para YouTube sobre Pix Parcelado do Santander, direto e visual.' },
    { id: 'mn-preroll-2', label: 'Pre-roll 15" conta PJ', prompt: 'Roteiro pre-roll 15" para conta PJ Santander com depoimento rápido de cliente MEI.' },
  ],

  // Plano de Midia — moons
  digital: [
    { id: 'mn-dig-1', label: 'Plano digital Select Q2', prompt: 'Monte plano de mídia digital para Santander Select Q2 2026 com budget de R$ 2.4M e KPIs por canal.' },
    { id: 'mn-dig-2', label: 'Plano Advantage+ Meta', prompt: 'Proponha estratégia de Advantage+ no Meta Ads para Santander com divisão criativo dinâmico vs. manual.' },
  ],
  ooh: [
    { id: 'mn-ooh-1', label: 'OOH consórcio imóvel', prompt: 'Crie plano OOH para Santander Consórcio Imóvel em SP, RJ, BH e Curitiba com estimativa de impacto.' },
    { id: 'mn-ooh-2', label: 'OOH metrô SP', prompt: 'Monte plano de mídia exclusivo para metrô de São Paulo promovendo Santander Select.' },
  ],
  'tv-radio': [
    { id: 'mn-tvr-1', label: 'TV + rádio institucional', prompt: 'Plano de TV aberta e rádio para campanha institucional Santander com GRP target 350 e 3 semanas.' },
    { id: 'mn-tvr-2', label: 'Rádio drive time', prompt: 'Estratégia de rádio focada em drive time para Santander Financiamento Auto em CBN e Jovem Pan.' },
  ],

  // Report Performance — moons
  semanal: [
    { id: 'mn-sem-1', label: 'Report semanal Select', prompt: 'Gere report semanal da campanha Santander Select com métricas de CPL, ROAS e destaques criativos.' },
    { id: 'mn-sem-2', label: 'Análise semana vs anterior', prompt: 'Compare performance desta semana com a anterior para Santander Select e recomende otimizações.' },
  ],
  mensal: [
    { id: 'mn-men-1', label: 'Report mensal executivo', prompt: 'Monte report mensal executivo Santander Select com funil completo, CAC e top criativos.' },
    { id: 'mn-men-2', label: 'Report mensal com ROI', prompt: 'Gere report mensal com cálculo de ROI por canal e recomendação de realocação de budget.' },
  ],

  // Persona Sintetica — moons
  'jovem-18-25': [
    { id: 'mn-jov-1', label: 'Persona universitário SP', prompt: 'Crie persona sintética de universitário paulistano 20-23 anos, primeiro contato com banco, heavy mobile.' },
    { id: 'mn-jov-2', label: 'Persona jovem investidor', prompt: 'Monte persona de jovem 22-25 que está começando a investir pelo app, influenciado por fintok.' },
  ],
  'premium-35': [
    { id: 'mn-prem-1', label: 'Persona executiva Select', prompt: 'Crie persona sintética de executiva 40+ alta renda, viajante frequente, compara benefícios bancários.' },
    { id: 'mn-prem-2', label: 'Persona empresário', prompt: 'Monte persona de empresário 45 anos, carteira diversificada, busca assessoria humana e exclusividade.' },
  ],
  'mei-pj': [
    { id: 'mn-mei-1', label: 'Persona dono de restaurante', prompt: 'Crie persona de dono de restaurante MEI, 35 anos, usa maquininha concorrente, precisa de capital de giro.' },
    { id: 'mn-mei-2', label: 'Persona freelancer digital', prompt: 'Monte persona de freelancer digital 28 anos, fatura como MEI, mistura conta PF e PJ.' },
  ],

  // Brief Builder — moons (from generic)
  campanha: [
    { id: 'mn-camp-1', label: 'Brief campanha sazonal', prompt: 'Monte brief para campanha sazonal de Black Friday com objetivo de conversão, canais e KPIs.' },
    { id: 'mn-camp-2', label: 'Brief lançamento produto', prompt: 'Crie brief para lançamento de novo produto financeiro com público, mensagem e mix de canais.' },
  ],
  'always-on': [
    { id: 'mn-aon-1', label: 'Brief conteúdo mensal', prompt: 'Monte brief always-on com 4 pilares de conteúdo, frequência semanal e calendário mensal.' },
    { id: 'mn-aon-2', label: 'Brief nurturing social', prompt: 'Crie brief de conteúdo always-on para nutrição de audiência em Instagram e LinkedIn.' },
  ],

  // Analise de Mercado — moons (from generic)
  concorrencia: [
    { id: 'mn-conc-1', label: 'Concorrência bancária digital', prompt: 'Analise os 5 principais concorrentes bancários no digital com share of voice e posicionamento.' },
    { id: 'mn-conc-2', label: 'Benchmark Meta Ad Library', prompt: 'Faça benchmark dos criativos bancários mais ativos na Meta Ad Library no último mês.' },
  ],
  tendencias: [
    { id: 'mn-tend-1', label: 'Tendências fintech 2026', prompt: 'Identifique 3 tendências de fintech e open banking que impactam a comunicação bancária em 2026.' },
    { id: 'mn-tend-2', label: 'Tendências social media', prompt: 'Analise tendências de formatos e comportamento em redes sociais relevantes para o setor financeiro.' },
  ],
};

// ──────────────────────────────────────────
// Helper: returns best templates for a chat
// ──────────────────────────────────────────

export function getTemplatesForChat(skillSlug: string, moonSlug: string): PromptTemplate[] {
  const moonTemplates = templatesByMoon[moonSlug] ?? [];
  const skillTemplates = templatesBySkill[skillSlug] ?? [];
  // Moon-specific first, then skill-generic, max 6
  return [...moonTemplates, ...skillTemplates].slice(0, 6);
}
