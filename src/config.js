export const API_BASE = "https://videorag-api-mx3edyv2za-uc.a.run.app";

export const AGENTS = [
  {
    id: "videorag",
    label: "VideoRAG",
    iconName: "Play",
    color: "#3b82f6",
    placeholder: "Pergunte sobre os vídeos indexados...",
    hint: "Análise de campanhas em vídeo",
  },
  {
    id: "copy",
    label: "Copy",
    iconName: "PenTool",
    color: "#f59e0b",
    placeholder: "Descreva o produto, tom e canal...",
    hint: "Geração de textos publicitários",
  },
  {
    id: "persona",
    label: "Persona",
    iconName: "UserRound",
    color: "#8b5cf6",
    placeholder: "Descreva a persona ou solicite uma simulação...",
    hint: "Simulação de consumidor sintético",
  },
  {
    id: "roteiro",
    label: "Roteiro",
    iconName: "Clapperboard",
    color: "#22c55e",
    placeholder: "Descreva o conceito, produto e duração...",
    hint: "Roteiros e filmes publicitários",
  },
  {
    id: "brief",
    label: "Brief",
    iconName: "FileSearch",
    color: "#ec4899",
    placeholder: "Cole ou descreva o brief aqui...",
    hint: "Análise e estruturação de briefs",
  },
];

export const CLIENTS = [
  "santander",
  "vivo",
  "americanas",
  "mrv",
  "sicredi",
  "bmg",
  "stone",
];

export const FALLBACKS = {
  videorag:
    "Com base nos vídeos indexados, a campanha estrutura sua narrativa em três arcos emocionais com paleta cromática consistente.",
  copy: 'Aqui estão três variações para mídia social:\n\n**Emocional:** "Você não está comprando um apartamento. Está construindo o lugar onde sua família vai crescer."\n\n**Racional:** "Crédito Imobiliário: taxa a partir de 8,99% a.a. + TR. Simule em 2 minutos."\n\n**Urgência:** "Condições especiais só até 31/03. Simule agora."',
  persona:
    "Oi. Sou a Fernanda, 41 anos, professora em Campinas. Quero sair do aluguel, mas toda vez que pesquiso sobre financiamento, fico perdida.",
  roteiro:
    '**ROTEIRO — "O DIA QUE SEMPRE FOI SEU"**\n*Filme 30" · Crédito Imobiliário*\n\n**CENA 1** — Close de chave de aluguel sendo devolvida.\n**CENA 2** — A mesma mão abre uma porta diferente. Chave nova.\n**CENA 3** — Família entra, olha ao redor. Silêncio. Sorriso.',
  brief:
    "**DIAGNÓSTICO DO BRIEF**\n\nGaps identificados:\n— Nenhuma diferenciação competitiva declarada\n— Tom genérico, sem voz de marca definida\n— Público-alvo amplo demais\n\nOportunidade: o medo de endividamento é o maior freio de conversão — o brief não o endereça.",
};

export const VALID_VIDEO_MIMES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
];

export const MAX_FILE_SIZE = 524288000; // 500MB (upload direto para GCS)
export const MAX_CONCURRENT_UPLOADS = 2;
export const POLL_INTERVAL_NORMAL = 3000;
export const POLL_INTERVAL_BACKOFF = 15000;
export const POLL_FAILURE_BACKOFF_THRESHOLD = 3;
export const POLL_FAILURE_STOP_THRESHOLD = 10;
export const INGEST_POLL_INTERVAL = 5000;
