import { MockChatResponse } from '@/lib/types';

// ──────────────────────────────────────────
// Santander — detailed realistic responses
// ──────────────────────────────────────────

const santanderResponses: Record<string, MockChatResponse[]> = {
  // Texto de Rádio
  'spot-30': [
    {
      content:
        'Aqui está o spot de 30" para a campanha Santander Select:\n\n**LOC:** "Você trabalhou a vida inteira pra chegar aqui. Agora é a hora de o seu banco trabalhar por você. Santander Select: assessoria personalizada, cashback em investimentos e acesso a salas VIP. Abra sua conta Select."\n\n**TEC:** Sobe trilha institucional Santander.\n\n**LOC:** "Santander. O que a gente pode fazer por você hoje?"',
      highlight: {
        label: 'Compliance check',
        body: 'Texto revisado conforme restrições BACEN. Sem promessas de rentabilidade. Menção a "assessoria" em vez de "consultoria financeira" para evitar conflito regulatório.',
      },
      variants: [
        '**LOC:** "Seu dinheiro merece mais atenção. Santander Select: um assessor dedicado, cashback que volta de verdade e acesso a salas VIP em aeroportos. Abra sua conta Select e sinta a diferença."\n\n**TEC:** Trilha suave, piano.\n\n**LOC:** "Santander. O que a gente pode fazer por você hoje?"',
        '**LOC:** "Imagina ter um banco que conhece seus objetivos. Santander Select entende que cada cliente é único. Assessoria sob medida, benefícios exclusivos e zero burocracia. Venha ser Select."\n\n**TEC:** Sobe trilha moderna.\n\n**LOC:** "Santander. O que a gente pode fazer por você hoje?"',
      ],
    },
  ],
  jingle: [
    {
      content:
        'Proposta de jingle para Santander Financiamento Auto:\n\n**Refrão (BPM 120, tom maior):**\n"Seu carro novo tá mais perto / do que você imagina / Santander facilita / a estrada é toda sua"\n\n**Verso 1:**\n"Taxa que cabe no bolso / parcela que faz sentido / acelera esse sonho / com Santander do seu lado"\n\nDuração estimada: 30" com fade out.',
      variants: [
        '**Refrão (BPM 110, pop acústico):**\n"Pega a chave, abre o sorriso / o caminho é seu agora / Santander te dá a largada / pra vida que vai lá fora"\n\n**Verso 1:**\n"Sem complicação, sem sufoco / parcela leve, juro baixo / seu carro novo tá esperando / é só dar o primeiro passo"\n\nDuração estimada: 30" com fade out.',
        '**Refrão (BPM 125, funk melody):**\n"Liga o motor, bota fé / Santander resolve pra você / taxa boa, parcela certa / a estrada tá aberta"\n\n**Verso 1:**\n"Chega de esperar o momento / o momento é agora, vai / financiamento Santander / seu sonho saindo do papel"\n\nDuração estimada: 30" com fade out.',
      ],
    },
  ],
  institucional: [
    {
      content:
        'Texto institucional rádio — Santander Sustentabilidade:\n\n**LOC:** "Na Santander, acreditamos que o futuro se constrói com decisões responsáveis. Por isso, destinamos R$ 800 milhões em linhas de crédito verde em 2025. Agricultura sustentável, energia limpa, mobilidade elétrica. Porque ser responsável é o melhor investimento. Santander. O que a gente pode fazer pelo planeta hoje?"',
      highlight: {
        label: 'Dados verificados',
        body: 'Valor de R$ 800M referente ao relatório ESG Santander 2025 publicado. Recomenda-se validar dado atualizado com RI antes de veiculação.',
      },
    },
  ],

  // Copy Social
  'feed-carrossel': [
    {
      content:
        '**Slide 1 — Hook:**\n"3 erros que estão travando seu dinheiro"\n\n**Slide 2:**\n"1. Deixar tudo na poupança sem comparar rendimento"\n\n**Slide 3:**\n"2. Não usar o limite do cartão a seu favor"\n\n**Slide 4:**\n"3. Ignorar cashback em compras do dia a dia"\n\n**Slide 5 — CTA:**\n"No Santander, cada real rende mais. Link na bio."\n\nFormato: carrossel 5 slides, 1080x1080.',
      highlight: {
        label: 'Performance tip',
        body: 'Carrosséis com 5 slides têm 23% mais save rate que posts com 3 slides no segmento banking (benchmark interno Q4 2025).',
      },
      variants: [
        '**Slide 1 — Hook:**\n"Seu dinheiro poderia estar rendendo mais"\n\n**Slide 2:**\n"Poupança rende 0,5% ao mês. CDB Santander pode render o dobro."\n\n**Slide 3:**\n"Cashback de verdade: dinheiro de volta em cada compra no débito e crédito."\n\n**Slide 4:**\n"Santander Select: assessoria grátis pra quem quer sair do básico."\n\n**Slide 5 — CTA:**\n"Faça seu dinheiro trabalhar por você. Link na bio."\n\nFormato: carrossel 5 slides, 1080x1080.',
        '**Slide 1 — Hook:**\n"Quiz: você sabe o que é cashback de verdade?"\n\n**Slide 2:**\n"Não é desconto. É dinheiro real voltando pra sua conta."\n\n**Slide 3:**\n"No Santander, cada compra no cartão gera cashback automático."\n\n**Slide 4:**\n"Em 2025, clientes Santander receberam R$ 340M em cashback."\n\n**Slide 5 — CTA:**\n"Ativa o seu cashback. Link na bio."\n\nFormato: carrossel 5 slides, 1080x1080.',
      ],
    },
  ],
  'stories-reels': [
    {
      content:
        '**Roteiro Reels 15" — Santander Life:**\n\n[0-3s] Hook visual: mão abrindo app Santander\nTexto overlay: "POV: você descobriu que seu banco devolve dinheiro"\n\n[3-8s] Tela do app mostrando cashback\nTexto: "Cashback real, sem pegadinha"\n\n[8-13s] Corte rápido: pessoa sorrindo no café\nTexto: "Cada compra vira dinheiro de volta"\n\n[13-15s] Logo Santander + CTA\n"Ativa o seu. Link na bio."\n\nTrilha: trending audio (verificar licença).',
      variants: [
        '**Roteiro Reels 15" — Santander Select:**\n\n[0-3s] Hook: close na tela do celular com notificação\nTexto overlay: "Quando o banco te avisa que seu dinheiro rendeu"\n\n[3-8s] Pessoa olhando o app com expressão de surpresa positiva\nTexto: "CDB Santander rendendo mais que poupança"\n\n[8-13s] Transição rápida: mesma pessoa no aeroporto, sala VIP\nTexto: "E ainda tem sala VIP inclusa"\n\n[13-15s] Logo Santander Select + CTA\n"Vem ser Select. Link na bio."\n\nTrilha: lo-fi chill (verificar licença).',
        '**Roteiro Reels 15" — Santander Pix:**\n\n[0-2s] Hook: tela verde do Pix recebido\nTexto overlay: "E se seu Pix fosse parcelado?"\n\n[2-7s] Animação: valor se divide em 3 parcelas na tela\nTexto: "Pix Parcelado Santander: divide em até 12x"\n\n[7-12s] Pessoa comprando com celular, sorrindo\nTexto: "Compra agora, paga depois"\n\n[12-15s] Logo + CTA\n"Ativa no app Santander."\n\nTrilha: beat eletrônico curto.',
      ],
    },
  ],
  'x-twitter': [
    {
      content:
        'Thread sugerida para X/Twitter — Santander Universitário:\n\n**Tweet 1:**\n"A conta que entende que seu saldo nem sempre é positivo (e tá tudo bem) 🎓"\n\n**Tweet 2:**\n"→ Zero tarifa de manutenção\n→ Cartão sem anuidade\n→ Pix ilimitado\n→ Desconto em intercâmbio"\n\n**Tweet 3:**\n"Faz parte de alguma faculdade? Então faz parte do Santander Universitário. Link: [url]"',
      highlight: {
        label: 'Tom de voz',
        body: 'Linguagem informal aprovada para público universitário conforme guideline "Tom Santander Gen-Z" atualizado em jan/2026.',
      },
    },
  ],

  // Roteiro de Vídeo
  'tvc-30': [
    {
      content:
        '**TVC 30" — "Tempo" — Santander Consórcio**\n\n[INT. CASA — DIA]\nMulher olha pela janela de um apartamento vazio.\n\n**LOC OFF:** "Tem coisas que o tempo resolve."\n\n[CORTE: mesma mulher decorando o apartamento, agora cheio de vida.]\n\n**LOC OFF:** "E tem coisas que a gente resolve com planejamento."\n\n[CORTE: ela entregando as chaves pra filha.]\n\n**LOC OFF:** "Consórcio Santander. Sem juros, sem pressa, sem surpresa."\n\n[PACK: Logo + Santander. O que a gente pode fazer por você hoje?]\n\n**TEC:** Trilha emocional, piano + cordas.',
      highlight: {
        label: 'Restrição legal',
        body: '"Sem juros" pode ser usado pois consórcio efetivamente não cobra juros (apenas taxa de administração). Incluir disclaimer no pack final.',
      },
    },
  ],
  'digital-pre-roll': [
    {
      content:
        '**Pre-roll 6" (bumper) — Santander Pix Parcelado:**\n\n[0-2s] Tela de celular: notificação "Pix recebido"\nTexto: "E se seu Pix fosse parcelado?"\n\n[2-5s] Animação Santander: valor se divide em 3 parcelas\n\n[5-6s] Logo + "Ativa no app."\n\nVersão 15" skip: expandir com depoimento rápido de cliente.',
    },
  ],

  // Plano de Mídia
  digital: [
    {
      content:
        '**Plano de Mídia Digital — Santander Select Q2 2026**\n\n| Canal | Formato | Budget % | KPI |\n|-------|---------|----------|-----|\n| Meta Ads | Carrossel + Reels | 35% | CPL < R$45 |\n| Google Search | Brand + Genérico | 25% | CPA < R$120 |\n| YouTube | TrueView 15" | 20% | VTR > 25% |\n| Programática | Display + Native | 15% | Viewability > 70% |\n| LinkedIn | Sponsored Content | 5% | CTR > 0.8% |\n\nBudget total estimado: R$ 2.4M\nPeríodo: Abril–Junho 2026\nPúblico: AB 30-55, interesse em investimentos.',
      highlight: {
        label: 'Insight de dados',
        body: 'CPL Meta caiu 18% no Q1 após otimização de Advantage+ com criativo dinâmico. Recomenda-se manter alocação Meta acima de 30%.',
      },
    },
  ],
  ooh: [
    {
      content:
        '**Plano OOH — Santander Consórcio Imóvel**\n\nPraças prioritárias: São Paulo, Rio de Janeiro, Belo Horizonte, Curitiba\n\n| Formato | Qtd Faces | Período | Impacto est. |\n|---------|-----------|---------|-------------|\n| Relógio digital | 120 | 2 semanas | 45M impressões |\n| Mobiliário urbano | 80 | 4 semanas | 32M impressões |\n| Metrô SP (L4) | 16 painéis | 4 semanas | 18M impressões |\n\nBudget estimado: R$ 1.8M\nFrequência alvo: 8x por pessoa em 4 semanas.',
    },
  ],
  'tv-radio': [
    {
      content:
        '**Plano TV/Rádio — Santander Institucional**\n\n**TV Aberta:**\n- Globo: 3 inserções/semana (Jornal Nacional, Fantástico)\n- Band: 2 inserções/semana (Jornal da Band)\n- GRP target: 350 no mês\n\n**Rádio:**\n- CBN + BandNews: 5 inserções/dia, segunda a sexta\n- Jovem Pan: 3 inserções/dia (drive time)\n\nPeríodo: 3 semanas\nBudget estimado: R$ 4.2M',
    },
  ],

  // Report Performance
  semanal: [
    {
      content:
        '**Report Semanal — Santander Select — Semana 12/2026**\n\n**Resumo executivo:** Semana com performance acima da média. CPL caiu 12% vs. semana anterior.\n\n| Métrica | Resultado | Meta | Status |\n|---------|-----------|------|--------|\n| Impressões | 8.4M | 7M | Acima |\n| Cliques | 142K | 120K | Acima |\n| CPL | R$ 38 | R$ 45 | Acima |\n| Conversões | 1.240 | 1.000 | Acima |\n| ROAS | 4.2x | 3.5x | Acima |\n\n**Destaques:** Reels "cashback real" com 2.1M views orgânico. Google Brand com Quality Score 9/10.',
      highlight: {
        label: 'Ação recomendada',
        body: 'CPL abaixo da meta permite realocar 10% do budget de Search para Meta Reels, onde o CPA está 22% melhor que o benchmark.',
      },
      variants: [
        '**Report Semanal — Santander Select — Semana 12/2026**\n\n**Resumo executivo:** Performance estável com leve queda em Search e ganho em Social.\n\n| Métrica | Resultado | Meta | Var. s/s |\n|---------|-----------|------|----------|\n| Impressões | 7.8M | 7M | -7% |\n| Cliques | 134K | 120K | -5.6% |\n| CPL | R$ 41 | R$ 45 | +7.9% |\n| Conversões | 1.080 | 1.000 | -12.9% |\n| ROAS | 3.8x | 3.5x | -9.5% |\n\n**Alerta:** CPC Google Search subiu 14% — possível aumento de concorrência em leilão. Recomenda-se revisar negative keywords e realocar para Meta.',
        '**Report Semanal — Santander Select — Semana 12/2026**\n\n**Resumo executivo:** Melhor semana do trimestre. Carrossel "3 erros" viralizou e puxou CPL para baixo.\n\n| Canal | Spend | Conversões | CPL | ROAS |\n|-------|-------|-----------|-----|------|\n| Meta Ads | R$ 168K | 520 | R$ 32 | 4.8x |\n| Google Search | R$ 120K | 380 | R$ 42 | 3.9x |\n| YouTube | R$ 96K | 210 | R$ 51 | 3.1x |\n| Programática | R$ 72K | 130 | R$ 62 | 2.4x |\n\n**Top criativo:** Carrossel "3 erros que travam seu dinheiro" — 890K impressões, CPL R$ 28, save rate 8.2%.',
      ],
    },
  ],
  mensal: [
    {
      content:
        '**Report Mensal — Santander Select — Fevereiro 2026**\n\nBudget executado: R$ 2.1M de R$ 2.4M (87.5%)\n\n**Funil completo:**\n- Awareness: 34M impressões (reach 12M únicos)\n- Consideração: 580K cliques (CTR 1.7%)\n- Conversão: 4.800 leads qualificados\n- Vendas atribuídas: 320 contas Select abertas\n\n**CAC:** R$ 656 por conta (meta: R$ 750) — 12.5% abaixo da meta.\n\n**Top 3 criativos:**\n1. Carrossel "3 erros" — CPL R$ 31\n2. Reels cashback — CPL R$ 35\n3. Search brand — CPA R$ 89',
    },
  ],

  // Persona Sintética
  'jovem-18-25': [
    {
      content:
        '**Persona Sintética: Jovem Santander — Lucas, 22 anos**\n\n**Demografia:** Universitário, São Paulo, renda familiar B1, mora com os pais\n**Comportamento digital:** 6h/dia no celular, Instagram e TikTok como fontes de informação financeira\n**Relação com dinheiro:** Primeiro cartão de crédito aos 19, usa Pix para tudo, não tem investimentos\n**Dores:** "Não entendo nada de investimento", "Banco é burocrático", "Quero algo que me trate como adulto"\n**Gatilhos:** Cashback tangível, zero burocracia, app intuitivo\n**Canais de influência:** Creators de finanças no TikTok, grupo de WhatsApp da faculdade',
      highlight: {
        label: 'Dado de pesquisa',
        body: '68% do público 18-25 Santander abriu conta pelo app sem ir à agência (dado interno CRM Q4 2025).',
      },
    },
  ],
  'premium-35': [
    {
      content:
        '**Persona Sintética: Premium Santander — Carla, 42 anos**\n\n**Demografia:** Diretora de marketing, São Paulo, renda A2, casada, 2 filhos\n**Comportamento:** LinkedIn diário, assina Bloomberg, viaja 4x/ano a trabalho\n**Relação com dinheiro:** Carteira diversificada, R$ 500K+ investidos, compara taxas\n**Dores:** "Quero assessoria de verdade, não robô", "Meu tempo vale mais que ir à agência"\n**Gatilhos:** Exclusividade, atendimento humano, benefícios de viagem\n**Canais:** LinkedIn, email marketing personalizado, eventos presenciais Select',
    },
  ],
  'mei-pj': [
    {
      content:
        '**Persona Sintética: MEI Santander — Roberto, 38 anos**\n\n**Demografia:** Dono de hamburgueria artesanal, Curitiba, faturamento R$ 70K/mês\n**Comportamento:** Instagram para o negócio, YouTube para aprender gestão\n**Relação com dinheiro:** Mistura conta PF e PJ, usa maquininha concorrente, precisa de capital de giro\n**Dores:** "Taxa da maquininha come meu lucro", "Não consigo crédito porque sou MEI"\n**Gatilhos:** Taxa competitiva, antecipação de recebíveis, conta PJ sem tarifa\n**Canais:** Google Search "melhor conta PJ", Instagram ads, indicação de outros MEIs',
      highlight: {
        label: 'Oportunidade',
        body: 'Segmento MEI representa 14M de CNPJs ativos no Brasil. Santander tem 8% de market share vs. 22% do líder. Gap de comunicação identificado.',
      },
    },
  ],
};

// ──────────────────────────────────────────
// Generic responses by skill type
// ──────────────────────────────────────────

const genericByMoon: Record<string, MockChatResponse[]> = {
  // Texto de Rádio
  'spot-30': [
    {
      content:
        'Aqui está o spot de 30" para a campanha:\n\n**LOC:** "Descubra uma nova forma de [benefício principal]. [Nome da marca] oferece [proposta de valor]. Venha conhecer."\n\n**TEC:** Sobe trilha institucional.\n\n**LOC:** "[Assinatura da marca]."',
      highlight: { label: 'Dica', body: 'Adapte o benefício principal conforme o objetivo da campanha e valide o claim com o jurídico.' },
    },
  ],
  jingle: [
    {
      content:
        'Proposta de jingle:\n\n**Refrão:**\n"[Marca] tá com você / em cada momento seu / facilita sua vida / e o futuro é todo seu"\n\nDuração: 30" com fade. BPM sugerido: 110-120, tom maior para transmitir otimismo.',
    },
  ],
  institucional: [
    {
      content:
        'Texto institucional rádio:\n\n**LOC:** "[Marca] acredita que [propósito da marca]. Por isso, investimos em [iniciativa relevante]. Porque [razão emocional]. [Marca]. [Assinatura]."',
    },
  ],

  // Copy Social
  'feed-carrossel': [
    {
      content:
        '**Slide 1 — Hook:**\n"[Número] coisas que você precisa saber sobre [tema]"\n\n**Slides 2-4:** Conteúdo informativo com dados relevantes\n\n**Slide 5 — CTA:**\n"Saiba mais no link da bio."\n\nFormato: 1080x1080, 5 slides.',
      highlight: { label: 'Benchmark', body: 'Carrosséis com 5 slides performam 20-25% melhor em save rate no segmento.' },
    },
  ],
  'stories-reels': [
    {
      content:
        '**Roteiro Reels 15":**\n\n[0-3s] Hook visual impactante\n[3-10s] Desenvolvimento da mensagem com texto overlay\n[10-15s] CTA + logo\n\nDica: usar trending audio e cortes rápidos para retenção.',
    },
  ],
  'x-twitter': [
    {
      content:
        '**Tweet principal:**\n"[Hook provocativo sobre o tema da campanha]"\n\n**Reply thread:**\n"→ [Benefício 1]\n→ [Benefício 2]\n→ [Benefício 3]\n\n[CTA com link]"',
      highlight: { label: 'Formato', body: 'Threads com 3 tweets têm 40% mais engajamento que tweets únicos no segmento financeiro.' },
    },
  ],

  // Roteiro de Vídeo
  'tvc-30': [
    {
      content:
        '**TVC 30" — Conceito: "[Tema]"**\n\n[Cena 1: Setup emocional — 8s]\n[Cena 2: Desenvolvimento do conflito — 10s]\n[Cena 3: Resolução com o produto — 8s]\n[Pack final: Logo + assinatura — 4s]\n\nTrilha: emocional, piano + cordas.',
      highlight: { label: 'Produção', body: 'Considerar versões de 15" e 6" para desdobramento digital.' },
    },
  ],
  'digital-pre-roll': [
    {
      content:
        '**Pre-roll 6" (bumper):**\n\n[0-2s] Hook visual impactante\n[2-5s] Mensagem principal animada\n[5-6s] Logo + CTA\n\nVersão 15" skip: expandir com demonstração do produto.',
    },
  ],

  // Plano de Mídia
  digital: [
    {
      content:
        '**Plano de Mídia Digital:**\n\n| Canal | Formato | Budget % | KPI |\n|-------|---------|----------|-----|\n| Meta Ads | Carrossel + Reels | 35% | CPL target |\n| Google Search | Brand + Genérico | 30% | CPA target |\n| YouTube | TrueView | 20% | VTR > 25% |\n| Programática | Display | 15% | Viewability > 70% |\n\nAjuste budget conforme histórico de performance do cliente.',
      highlight: { label: 'Recomendação', body: 'Meta Ads com Advantage+ tem mostrado CPL 15-20% menor que campanhas manuais no segmento.' },
    },
  ],
  ooh: [
    {
      content:
        '**Plano OOH:**\n\nPraças sugeridas conforme cobertura do cliente.\n\n| Formato | Período | Impacto estimado |\n|---------|---------|------------------|\n| Relógio digital | 2 semanas | Alto impacto |\n| Mobiliário urbano | 4 semanas | Frequência |\n| Metrô/Trem | 4 semanas | Cobertura AB |',
    },
  ],
  'tv-radio': [
    {
      content:
        '**Plano TV/Rádio:**\n\n**TV Aberta:** Inserções em jornalismo e entretenimento, GRP target 300+\n**Rádio:** CBN/BandNews para perfil AB, 5 inserções/dia\n\nPeríodo recomendado: 3-4 semanas para construção de frequência.',
    },
  ],

  // Report Performance
  semanal: [
    {
      content:
        '**Report Semanal:**\n\n| Métrica | Resultado | Meta | Status |\n|---------|-----------|------|--------|\n| Impressões | — | — | — |\n| Cliques | — | — | — |\n| CPL | — | — | — |\n| Conversões | — | — | — |\n\nPreencher com dados reais da plataforma de ads do cliente.',
      highlight: { label: 'Template', body: 'Este é um template base. Conecte com os dados reais via DataHub para preenchimento automático.' },
    },
  ],
  mensal: [
    {
      content:
        '**Report Mensal:**\n\n**Funil completo:**\n- Awareness: impressões e reach\n- Consideração: cliques e CTR\n- Conversão: leads e vendas\n\n**Análise de budget:** executado vs. planejado\n**Top criativos:** ranking por CPA\n**Recomendações:** próximos passos baseados em dados.',
    },
  ],

  // Persona Sintética
  'jovem-18-25': [
    {
      content:
        '**Persona Sintética: Jovem 18-25**\n\n**Demografia:** Universitário(a), grande centro urbano, classe B\n**Comportamento digital:** Heavy mobile, Instagram/TikTok como canal principal\n**Relação com a categoria:** Primeiro contato, busca praticidade\n**Dores:** Burocracia, falta de informação acessível\n**Gatilhos:** Facilidade, digital-first, recomendação de pares',
      highlight: { label: 'Metodologia', body: 'Persona gerada com base em dados sintéticos. Recomenda-se validar com pesquisa qualitativa.' },
    },
  ],
  'premium-35': [
    {
      content:
        '**Persona Sintética: Premium 35+**\n\n**Demografia:** Profissional sênior, alta renda, grandes centros\n**Comportamento:** LinkedIn, newsletters especializadas, viagens frequentes\n**Relação com a categoria:** Exigente, compara opções, valoriza atendimento\n**Dores:** Falta de personalização, perda de tempo\n**Gatilhos:** Exclusividade, conveniência, status',
    },
  ],
  'mei-pj': [
    {
      content:
        '**Persona Sintética: MEI/PJ**\n\n**Demografia:** Micro-empreendedor, 30-45 anos, faturamento até R$ 81K/ano\n**Comportamento:** Google Search para soluções, YouTube para aprender, WhatsApp para vendas\n**Relação com a categoria:** Pragmático, sensível a custo, mistura PF e PJ\n**Dores:** Taxas altas, burocracia, falta de crédito acessível\n**Gatilhos:** Economia real, simplicidade, prova social de outros MEIs',
      highlight: { label: 'Oportunidade', body: 'Segmento MEI em crescimento acelerado no Brasil. Comunicação direta e sem jargão financeiro performa melhor.' },
    },
  ],

  // Brief Builder
  campanha: [
    {
      content:
        '**Brief de Campanha:**\n\n**Objetivo:** [Awareness / Consideração / Conversão]\n**Público-alvo:** [Definir com base na persona]\n**Mensagem-chave:** [Proposição de valor principal]\n**Tom de voz:** [Conforme guideline do cliente]\n**Canais:** [Digital / OOH / TV / Rádio]\n**Período:** [Datas]\n**Budget estimado:** [Valor]\n**KPIs:** [Métricas de sucesso]\n**Entregáveis:** [Lista de peças]',
      highlight: { label: 'Checklist', body: 'Valide o brief com o cliente antes de iniciar produção. Itens obrigatórios: objetivo, público, mensagem e KPIs.' },
    },
  ],
  'always-on': [
    {
      content:
        '**Brief Always-on:**\n\n**Objetivo contínuo:** Manter presença e nutrir audiência\n**Pilares de conteúdo:** [3-5 temas recorrentes]\n**Frequência:** [Posts/semana por canal]\n**Tom:** [Mais leve que campanha, foco em valor]\n**Budget mensal:** [Valor]\n**KPIs:** Engajamento, crescimento de base, tráfego orgânico',
    },
  ],

  // Análise de Mercado
  concorrencia: [
    {
      content:
        '**Análise de Concorrência:**\n\n**Concorrentes mapeados:** [3-5 principais]\n**Dimensões analisadas:**\n- Share of voice digital\n- Posicionamento de preço\n- Canais de comunicação\n- Tom de voz e mensagem\n- Inovação de produto\n\n**Principais gaps identificados:** [Oportunidades vs. concorrência]\n**Recomendação:** [Ações prioritárias]',
      highlight: { label: 'Fonte', body: 'Dados de share of voice via SimilarWeb + Meta Ad Library. Atualização mensal recomendada.' },
    },
  ],
  tendencias: [
    {
      content:
        '**Análise de Tendências:**\n\n**Tendências identificadas:**\n1. [Tendência 1 — impacto alto]\n2. [Tendência 2 — impacto médio]\n3. [Tendência 3 — emergente]\n\n**Implicações para a marca:**\n- [Como cada tendência afeta o negócio]\n\n**Recomendações:**\n- [Ações de curto e médio prazo]',
    },
  ],
};

// ──────────────────────────────────────────
// Build the full map keyed by moon slug
// ──────────────────────────────────────────

// For Santander, use detailed responses; for all others, use generic
export const chatResponsesByMoon: Record<string, MockChatResponse[]> = {
  // Santander-specific (keyed with client prefix for uniqueness)
  ...Object.fromEntries(
    Object.entries(santanderResponses).map(([moonSlug, responses]) => [
      `santander-${moonSlug}`,
      responses,
    ]),
  ),
  // Generic fallbacks (keyed by moon slug only)
  ...genericByMoon,
};
