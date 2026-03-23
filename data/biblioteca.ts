import { BibliotecaItem } from '@/lib/types';

export const bibliotecaByClient: Record<string, BibliotecaItem[]> = {
  santander: [
    { id: 'sant-bib-1', label: 'Tom de voz Santander', category: 'tom_voz', active: true },
    { id: 'sant-bib-2', label: 'Restrições legais banking', category: 'restricoes', active: false },
    { id: 'sant-bib-3', label: 'Dados de performance Q1 2026', category: 'dados', active: false },
    { id: 'sant-bib-4', label: 'Histórico campanhas Santander 2025', category: 'historico', active: false },
    { id: 'sant-bib-5', label: 'Guidelines uso marca vermelha', category: 'restricoes', active: false },
  ],
  vivo: [
    { id: 'vivo-bib-1', label: 'Tom de voz Vivo', category: 'tom_voz', active: true },
    { id: 'vivo-bib-2', label: 'Restrições ANATEL telecom', category: 'restricoes', active: false },
    { id: 'vivo-bib-3', label: 'Base clientes 5G segmentada', category: 'dados', active: false },
    { id: 'vivo-bib-4', label: 'Histórico campanhas Vivo Fibra', category: 'historico', active: false },
  ],
  americanas: [
    { id: 'amer-bib-1', label: 'Tom de voz Americanas', category: 'tom_voz', active: true },
    { id: 'amer-bib-2', label: 'Calendário promocional varejo', category: 'dados', active: false },
    { id: 'amer-bib-3', label: 'Restrições promoções e-commerce', category: 'restricoes', active: false },
    { id: 'amer-bib-4', label: 'Histórico Black Friday 2025', category: 'historico', active: false },
    { id: 'amer-bib-5', label: 'Dados NPS categoria eletrônicos', category: 'dados', active: false },
  ],
  mrv: [
    { id: 'mrv-bib-1', label: 'Tom de voz MRV', category: 'tom_voz', active: true },
    { id: 'mrv-bib-2', label: 'Restrições publicidade imobiliária', category: 'restricoes', active: false },
    { id: 'mrv-bib-3', label: 'Dados Minha Casa Minha Vida', category: 'dados', active: false },
    { id: 'mrv-bib-4', label: 'Histórico lançamentos 2025', category: 'historico', active: false },
  ],
  sicredi: [
    { id: 'sicr-bib-1', label: 'Tom de voz Sicredi', category: 'tom_voz', active: true },
    { id: 'sicr-bib-2', label: 'Restrições regulatórias cooperativa', category: 'restricoes', active: false },
    { id: 'sicr-bib-3', label: 'Dados associados por região', category: 'dados', active: false },
    { id: 'sicr-bib-4', label: 'Histórico campanhas cooperativismo', category: 'historico', active: false },
    { id: 'sicr-bib-5', label: 'Benchmark crédito rural', category: 'dados', active: false },
    { id: 'sicr-bib-6', label: 'Manifesto marca Sicredi', category: 'tom_voz', active: false },
  ],
  bmg: [
    { id: 'bmg-bib-1', label: 'Tom de voz BMG', category: 'tom_voz', active: true },
    { id: 'bmg-bib-2', label: 'Restrições crédito consignado', category: 'restricoes', active: false },
    { id: 'bmg-bib-3', label: 'Dados público 50+ aposentados', category: 'dados', active: false },
    { id: 'bmg-bib-4', label: 'Histórico campanhas BMG 2025', category: 'historico', active: false },
  ],
  stone: [
    { id: 'ston-bib-1', label: 'Tom de voz Stone', category: 'tom_voz', active: true },
    { id: 'ston-bib-2', label: 'Restrições financeiras maquininha', category: 'restricoes', active: false },
    { id: 'ston-bib-3', label: 'Dados segmento micro-empreendedor', category: 'dados', active: false },
    { id: 'ston-bib-4', label: 'Histórico campanhas Stone 2025', category: 'historico', active: false },
    { id: 'ston-bib-5', label: 'Benchmark concorrência adquirência', category: 'dados', active: false },
  ],
};
