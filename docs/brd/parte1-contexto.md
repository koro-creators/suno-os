---
documento: BRD Parte 1 — Contexto do Projeto
projeto: sunOS
cliente: Suno United Creators (uso 100% interno)
bu: Tecnologia e Dados para Marketing
versao: 1.0
data_criacao: 2026-04-28
ultima_atualizacao: 2026-04-28
autor: Heitor Miranda + Claude (assistido)
status: Rascunho
aprovacoes:
  - area: Diretoria Suno United Creators
    aprovador: José Augusto Ketzer (Guga)
    data:
    status: Pendente
  - area: Tecnologia e Dados para Marketing
    aprovador: Heitor Miranda
    data: 2026-04-28
    status: Pendente
fonte_principal: Documentação do repo suno-os master + transcrições + materiais Crescera
---

# BRD Parte 1 — Contexto do Projeto sunOS

> Este documento captura o contexto de negócio do projeto sunOS — o sistema operacional de IA da Suno United Creators. É a primeira parte de quatro do BRD (Contexto, Glossário, Requisitos, Regras). Toda afirmação aqui está rastreável a uma fonte; pontos sem confirmação clara estão marcados como `[A validar]`.

---

## 1. Introdução

### 1.1. Contexto do Cliente

A **Suno United Creators** é uma agência publicitária independente brasileira fundada em abril de 2017, com sede em São Paulo. Em 2026, a empresa conta com aproximadamente **300 colaboradores ("creators")** e está em seu **9º ano de operação**.

**Posicionamento de mercado**:
- 3ª melhor agência do país segundo a Pesquisa Scopen 2024
- ENPS de 66 (10pp acima da média do mercado publicitário)
- Cultura afirmativa: 51% mulheres na liderança, 25% LGBTQIA+, 22% pretas e pardas
- Diferenciação por integrar **tecnologia, criatividade e ativação** sob o conceito proprietário **Smart Growth** (Marca + Mídia/Performance + Martech)

**Estrutura organizacional**: holding **United Creators Participações Ltda.** que controla seis empresas operacionais (Suno, SUP, SUPA, Revo/Paim, Koro, Ludi), cada uma liderada por sócios especializados. Ver Bloco 3 da Parte 2 (Glossário) para detalhes.

**Momento atual**: a Suno opera num período de **reestruturação e transformação digital impulsionada por IA**. O fundador Guga Ketzer determinou que a agência precisa "fazer um leapfrog" no uso de inteligência artificial para preservar competitividade frente a holdings (WPP, Publicis), consultorias (Accenture Song) e agências AI-native (Monks, Jellyfish).

**Fontes**:
- Deck "Crescera SmartGrowth - 02032026.pptx" (slides 2, 9, 10)
- `docs/handoff/PRODUCT_HANDOFF.md`:7
- Confirmações Q1-Q4, Q3a do briefing
- Dossiê executivo Guga Ketzer

### 1.2. Contexto da BU

O sunOS é uma iniciativa da **área de Tecnologia e Dados para Marketing**, sob direção executiva de **Heitor Miranda**. A área tutela tecnicamente o produto, mas o sunOS é um **projeto cross-grupo** — destinado ao uso por todas as empresas/times do United Creators.

**Estrutura de governança do projeto**:

| Papel | Pessoa | Responsabilidade |
|-------|--------|------------------|
| Sponsor executivo | Guga (José Augusto Ketzer) | Mandato, direção estratégica, reuniões semanais (terças) |
| Liderança técnica e estratégica | Heitor Miranda | Arquitetura, roadmap, decisão técnica |
| Patrocinador sócio — Criação | Bruno Prosperi | Voz da Criação na evolução do produto (não-operacional) |
| Patrocinador sócio — Mídia | Leonardo Yukio Takai | Voz da Mídia na evolução do produto (não-operacional). Também owner do produto separado **Toolbox** (mercado SMB) |

**Fontes**: confirmações Q5, Q6, ajustes sobre Q19 do briefing.

### 1.3. Contexto do Projeto

O sunOS nasceu de forma **embrionária** com a popularização de LLMs (Gemini, GPT, Claude) na agência, sem formato definido. Em **24 de fevereiro de 2026**, em primeiro papo direto entre Heitor Miranda e o fundador Guga, a iniciativa foi **formalmente incumbida**: Heitor recebeu o mandato de "transformar a forma da Suno trabalhar via IA", conectando criatividade, mídia e martech num sistema operacional interno baseado em inteligência artificial.

**Motivações centrais**:
1. **Não havia iniciativa unificada anterior** — apenas projetos isolados de IA em diferentes times, sem padronização ou governança
2. A complexidade tecnológica está crescendo rapidamente; ferramentas surgem e mudam em ciclos de meses
3. Demanda crescente de accountability dos clientes (CMOs sob pressão de CFOs) força a agência a demonstrar impacto financeiro de cada ação
4. Necessidade de **centralizar o uso de IA por segurança, governança e estratégia** — proteção de IP é crítica porque "a Suno vende ideias na essência"
5. Time de devs reduzido (~4 pessoas) precisa empoderar outros times via plataforma; não escala se toda automação depender deles

**Business case em construção**: levantamento de processos automatizáveis em curso. **136 atividades já mapeadas** em planilha proprietária de ROI (`roi_completo_suno.xlsx`); 48+ atividades já com profundidade (lista crescendo). Heitor e Ronaldo Severino (CFO) estão calculando tempo gasto em cada uma para estimar custo evitado e validar ROI.

**Fontes**:
- Confirmações Q7, Q7a (24/02/2026), Q8, Q9 do briefing
- `docs/handoff/PRODUCT_HANDOFF.md`:230, :523
- Transcrições de reunião do Heitor com William (AI Engineer)

### 1.4. Escopo e Não-Escopo de Negócio

#### Escopo (In-Scope)

| Capacidade | Descrição |
|------------|-----------|
| **Plataforma interna unificada de IA** | Sistema operacional de IA para uso por todos os times do grupo United Creators (Criação, Mídia, Planejamento, BI, Growth, Operações, Adm/Financeiro, Eficiência) |
| **Sistema solar de navegação** | Metáfora visual proprietária — clientes como planetas, skills como órbitas, moons como sub-áreas |
| **Skills configuráveis** | Capacidades de IA por tipo de tarefa (Copy Social, Plano de Mídia, Roteiro de Vídeo, Texto de Rádio, Persona Sintética, Brief Builder, Análise de Mercado, Report Performance) com system prompts proprietários e referências curadas |
| **Biblioteca de conhecimento (RAG)** | Base multimodal compartilhada (Suno + por cliente), com upload e processamento de PDF, áudio, vídeo, imagem; busca semântica via pgvector |
| **Workflows automatizados** | Engine LangGraph para automação de tarefas recorrentes (reports, análises, monitoramento, plano de mídia), com encadeamento e schedule (Cloud Scheduler) |
| **Chat com agentes (streaming SSE)** | Interface conversacional com IA real (Gemini Flash default) e agentes ReAct (ContentCreator, VisualCreator, Conversational) |
| **HITL Feedback** | Sistema de avaliação humana (thumbs, comentários, rating de sessão) para curadoria contínua e geração de dados para evolução dos agents |
| **Geração de imagem** | Image generator via Vertex AI Imagen 4 + Nano Banana (parcialmente implementado, em mock) |
| **Edição de imagem** (Phase 16) | Inpainting/outpainting + enhance/upscale (specs prontos, código pendente) |
| **Geração de vídeo** (Phase 16) | Vertex AI Veo 3.0/3.1 (T2V e I2V) (specs prontos, código pendente) |
| **Auth + RBAC** | Firebase Google Auth + Custom Claims (admin / creator) |
| **Admin areas** | CRUD de Skills, Biblioteca, Clientes, Workflows |

#### Não-Escopo (Out-of-Scope)

| Item | Justificativa |
|------|---------------|
| **Comercialização externa, white-label, SaaS** | Decisão estratégica explícita do sponsor — sunOS é **100% interno** |
| **Atender clientes externos diretamente** | sunOS amplifica creators internos; não é produto de fachada nem ferramenta entregue ao cliente |
| **Substituir ferramentas de mercado adotadas** (Adobe Firefly, Sprinklr, etc.) | sunOS é uma camada de inteligência coletiva e governança, não substituto operacional dessas ferramentas |
| **Produto externo para SMB** | Existe um produto separado chamado **Toolbox**, sob responsabilidade do sócio Takai (Mídia), com escopo, roadmap e modelo de negócio independentes do sunOS |
| **Substituir CRMs ou ERPs do grupo** | sunOS é camada cross-domínio, não plataforma transacional |
| **Atuar como ferramenta de billing/financeiro** | Há sistemas dedicados (iClips, Operand, etc.) |
| **Mover atividades de produção tradicionais (gráfica, mídia exterior)** | Foco do sunOS é o trabalho intelectual e digital |

**Fontes**: confirmações Q10, Q11 do briefing; ajuste sobre Toolbox (mercado SMB com Takai como produto separado).

---

## 2. Objetivos de Negócio

### 2.1. Objetivos Principais

| ID | Objetivo | Descrição | Horizonte | Fonte |
|----|----------|-----------|-----------|-------|
| **OBJ-01** | Reduzir custo operacional via automação | Automatizar tarefas repetitivas/redutíveis e calcular impacto em horas economizadas × custo médio. Business case em construção (136 atividades catalogadas). | Médio prazo (2026) | Q8 + Transcrição Heitor/William |
| **OBJ-02** | Liberar talento criativo para alto valor | Reduzir trabalho mecânico e liberar pessoas para se concentrarem em julgamento estratégico, criatividade e relacionamento — em linha com a tese "inteligência artificial + inteligência natural" | Curto prazo (Q2-Q4 2026) | Guga, transcrição reunião sunOS |
| **OBJ-03** | Centralizar governança e segurança de IA | Eliminar projetos isolados de IA, criar camada única de governança, proteção de IP da Suno e compliance | Curto prazo (em curso) | Q11 |
| **OBJ-04** | Habilitar accountability total ao cliente | Permitir que todo trabalho criativo e de mídia "mova o ponteiro de negócio" mensurável, tese central do Smart Growth | Médio prazo (2026-2027) | Dossiê executivo Guga |
| **OBJ-05** | Posicionar Suno como agência ambidestra de referência | Lado esquerdo (criatividade) + lado direito (tech/dados) integrados via sunOS — diferenciação frente a holdings, consultorias e agências AI-native | Longo prazo (2026-2028) | Guga, deck Crescera + transcrição |

### 2.2. Objetivos Secundários

| ID | Objetivo | Descrição | Benefício adicional |
|----|----------|-----------|---------------------|
| **OBJ-S01** | Dobrar receita de projetos | Crescer de R$10M (2024) para R$20M anuais via aceleração com IA | Crescimento financeiro direto |
| **OBJ-S02** | Acelerar onboarding de creators | Pessoas que chegam à Suno encontram conhecimento estruturado, produzem com qualidade desde o dia 1 | Redução de turnover, recuperação de contexto após saídas |
| **OBJ-S03** | Criar cultura organizacional AI-augmented | Letramento em IA transversal, com skills compartilhadas e padronizadas | Vantagem cultural sustentável |

### 2.3. KPIs e Métricas de Sucesso (propostos — a validar)

| KPI | Descrição | Baseline | Meta | Prazo | Status |
|-----|-----------|----------|------|-------|--------|
| Adoção semanal | Usuários ativos semanais (UAS) | 0 (set-up) | 10+ | Q3 2026 | Proposto |
| Engajamento | Mensagens de chat por semana | 0 | 50+ | Q3 2026 | Proposto |
| Qualidade HITL | Score médio (1-5) | N/D | > 4.0 | Q4 2026 | Proposto |
| Automação ativa | Workflows com schedule rodando | 0 | 5+ | Q4 2026 | Proposto |
| Economia operacional | % redução em tarefas repetitivas | N/D | 30% | Q4 2027 | Proposto |
| Custo evitado anual | R$ economizado em horas redutíveis | N/D | A definir | 2027 | Em construção |

> **Nota crítica**: KPIs estão como **propostas, ainda não validadas**. O business case formal está em construção pelo Heitor Miranda em parceria com Ronaldo Severino (CFO). Atualizar este BRD assim que houver validação.

**Fontes**: `docs/handoff/PRODUCT_HANDOFF.md`:359-365, confirmação Q13 do briefing.

---

## 3. Stakeholders

### 3.1. Estrutura de Governança Operacional do sunOS

O sunOS opera sob um modelo de governança em três camadas, formalizado pelo sponsor executivo (Guga Ketzer) nas reuniões de 07/05 e 14/05/2026. A estrutura existe para permitir que um time técnico não dedicado escale entrega de valor para todo o grupo United Creators, sem virar gargalo e sem perder accountability por área.

#### 3.1.1. Sponsor (sócio responsável por área)

Sócio responsável por desenhar a arquitetura de automações da sua área de atuação no sunOS, e cobrado diretamente pelo Guga sobre o resultado. Não é executor. É o "arquiteto da obra" que valida o fluxo, aprova workflows propostos pelos Champions, e responde por adoção e impacto na sua área.

| Área | Sponsor |
|------|---------|
| Mídia | Leonardo Takai / César Toledo ? |
| BI | Leonardo Takai / César Toledo ? |
| Martech / Dados / Growth | Heitor Miranda |
| Planejamento | Cíntia / Sérgio Katz ? |
| Criação | Bruno Prosperi |
| Operações | Elton |
| Produção | Ana Luísa Andre |
| Financeiro | Ronaldo Severino |
| RH | Ronaldo Severino |
| Contabilidade | Ronaldo Severino |

> Notas:
> - "?" em uma área indica dois Sponsors candidatos, decisão pendente até primeira reunião do Comitê de Produto.
> - "Operações" consolida as antigas Eficiência, Atendimento e Operações sob o sponsor Elton, conforme decisão de 14/05/2026.
> - Produção é separada de Operações e tem sponsor próprio (Ana Luísa Andre).
> - Áreas administrativas (Financeiro, RH, Contabilidade) têm o mesmo sponsor (Ronaldo Severino) mas operam como linhas separadas para fins de mapeamento de processos e champions.

Princípio operacional: "se o arquiteto não tiver presente na obra, não vai sair" (Guga, 07/05/2026).

#### 3.1.2. Champion (mão na massa por área)

Profissional sênior ou pleno da área que executa fluxos desenhados pelo Sponsor, valida que funcionam no dia a dia, e alimenta o Time Central com feedback de uso real. Não é necessariamente o líder da área. É a pessoa com afinidade pelo tema e disposição para ser referência operacional. Cada área tem 1 a 4 Champions, dependendo do volume e complexidade dos processos mapeados.

Champions confirmados em 14/05/2026:

| Área | Champions |
|------|-----------|
| Mídia | Bruna, Renata, Wagner, TBD |
| BI | Caetano, Milu, Thalles |
| Operações | Chamas |
| Financeiro | João Drumond |
| RH | Alessandra Pasquino |
| Contabilidade | Vagner Silva |
| Martech / Dados / Growth | Mayra Otsuka |
| Planejamento | Philippe Guimarães Gava |
| Criação | A definir (Sponsor Bruno Prosperi vai propor) |
| Produção | A definir (Sponsor Ana Luísa Andre vai propor) |

#### 3.1.3. Time Central (provedor de infra e componentes)

Time técnico liderado por Heitor Miranda. Provê: infraestrutura GCP, componentes reutilizáveis (Skills, Tools, Workflows base), governança técnica (RBAC, auditoria, segurança), e desenvolvimento de novas features de plataforma. Não constrói automações setoriais sob demanda. Esse trabalho fica com Champions, usando componentes do Time Central.

Composição atual: Heitor (líder), José Lucas, William, Mayra (gestão de projeto), e equipe técnica adjacente conforme demanda.

#### 3.1.4. Rituais de governança

Quatro cadências formais sustentam o modelo:

| Ritual | Cadência | Participantes | Pauta principal |
|--------|----------|---------------|-----------------|
| Comitê de Produto sunOS | Mensal | Guga + Sponsors + Heitor | Priorização, releases, KPIs (custo evitado, adoção) |
| Roundtable de Sponsors | Quinzenal | Sponsors + Heitor (sem Guga) | Conflitos de prioridade, dependências cruzadas |
| Champion Sync | Semanal | Champions + Time Central | Feedback de uso, ajustes táticos, novos workflows |
| Demo semanal com Guga | Semanal | Heitor + Guga | Acompanhamento contínuo (já existe) |

#### 3.1.5. Aprovadores

Com a chegada do fluxo de Aprovação Hierárquica (BR-017), o sunOS materializa a hierarquia interna da Suno. Aprovadores são **superiores diretos de creators** que recebem submissões pré-validadas por agentes para decisão final. **Não é um cargo novo** — é um papel funcional desempenhado por sócios, líderes de área e seniores conforme a hierarquia configurada.

| Critério | Definição |
|----------|-----------|
| Quem é aprovador | Configurado por área e cliente (admin) — geralmente sócio, head ou líder sênior |
| Aprovador é sempre humano | RN-024 — agentes nunca aprovam, apenas pré-validam |
| Hierarquia configurável | RN-026 — admin mantém mapa creator → aprovador por área/cliente |
| Fallback | Se aprovador inativo, sistema escala para líder da área e alerta admin |


### 3.2. Times Consumidores

Todos os times do grupo United Creators são consumidores potenciais do sunOS. Estado atual de levantamento de atividades automatizáveis por time:

| Time | Atividades mapeadas | Status de contato |
|------|--------------------:|-------------------|
| Planejamento | 24 | A definir |
| Mídia | 6 | Coberto pelo sócio Takai |
| BI | 5 | A definir |
| Growth / Dados | 6 | A definir |
| Operações | 4 | A definir |
| Adm / Financeiro | 2 | A definir |
| Eficiência | 1 | A definir |
| Criação | (não tabulado nesta fase) | Coberto pelo sócio Bruno Prosperi |

**Fonte**: `docs/handoff/PRODUCT_HANDOFF.md`:393-401.

### 3.3. Stakeholders Externos

| Categoria | Quem | Tipo de relação | Estado |
|-----------|------|-----------------|--------|
| Investidores potenciais | (a definir) | Em conversa | Não-comprometido |
| Big techs (parceiros tecnológicos) | Google (Vertex AI, Gemini, Cloud), Meta, Adobe, Salesforce, Hugging Face | Operacional | Ativos |
| Parceiros de implementação | Lima (Adobe), Nava (transformação digital) | Tático | Em discussão |
| Clientes da Suno (consumidores indiretos) | Vivo, Americanas, Sicredi, MRV, BMG, Cogna, Aramis, Hortifruti, Hashdex, Cantu, Samsung, Stone (prospecção) | Beneficiários indiretos | Ativos |

### 3.4. Stakeholders Não-Existentes (declarado explicitamente)

- **Não há time formal de DPO ou Compliance** na Suno para o sunOS. Governance e privacidade são responsabilidade compartilhada do time do projeto e da Diretoria.
- Não há área dedicada de Inovação/AI separada do projeto sunOS — o projeto **é** a iniciativa central.

**Fontes**: confirmações do briefing (Q14, Q15, Q16, Q18, Q19).

---

## 4. Visão de Alto Nível da Solução de Negócio

### 4.1. Descrição em Linguagem de Negócio

O sunOS é o **sistema operacional de IA da Suno United Creators**. Ele organiza todas as iniciativas de IA da agência num único produto interno, navegado pela metáfora visual de um sistema solar onde clientes são planetas, skills são órbitas e sub-áreas são moons. A escolha visual reflete o manifesto da própria Suno (o "Sol" como símbolo de alinhamento com diversidade).

Cada interação dentro do sunOS é contextualizada por quatro camadas:

1. **System prompt do skill** — comportamento esperado da IA para a tarefa específica
2. **Tom de voz e contexto do cliente** — particularidades de marca, restrições legais, conhecimento histórico
3. **Documentos da Biblioteca ativos** — conhecimento compartilhado (Suno + cliente)
4. **Histórico de feedbacks (HITL)** — curadoria humana acumulada

A IA por trás é **multi-modelo** (Gemini Flash como padrão por custo-benefício; GPT-4o, Claude e Imagen 4 disponíveis quando configurados). Os outputs passam por **avaliação contínua** via MLflow tracing, scorers customizados (tom, formato, routing, contexto) e datasets de eval.

### 4.2. Principais Capacidades de Negócio Envolvidas

O sunOS organiza, em uma plataforma única, capacidades de negócio que hoje estão dispersas, fragmentadas ou inexistentes formalmente na Suno:

| Capacidade de Negócio | Descrição em linguagem de negócio |
|-----------------------|----------------------------------|
| **Criação assistida com contexto de marca** | Gerar conteúdo (textos, imagens, vídeos, roteiros) preservando tom de voz, restrições legais e identidade do cliente — sem que o creator precise reconstruir contexto a cada interação |
| **Inteligência coletiva compartilhada** | Toda a expertise da Suno (cases, briefings, benchmarks, conhecimento por cliente) acessível a qualquer creator, com curadoria contínua |
| **Automação de tarefas recorrentes** | Tarefas repetitivas mensais, semanais ou disparadas por evento (reports, monitoramento, plano de mídia, análises) executadas sem dependência de squad dedicado |
| **Avaliação contínua de qualidade (Human in the Loop)** | Cada output da IA é avaliado por humanos (thumbs, comentários, rating), gerando dados que melhoram o produto ao longo do tempo |
| **Configuração de capacidades especializadas (Skills)** | Cada disciplina (Copy Social, Plano de Mídia, Roteiro de Vídeo, Persona Sintética, etc.) tem comportamento configurável e versionado |
| **Governança centralizada de IA** | Decisões de uso, segurança, proteção de IP e compliance concentradas — eliminando projetos isolados e shadow IT |
| **Accountability mensurável de marketing** | Cada ação de comunicação rastreável a um indicador de negócio, em linha com o pilar Smart Growth |

---

## 5. Restrições e Premissas

### 5.1. Restrições de Negócio

> Restrições técnicas, de stack e de toolchain estão fora do escopo do BRD e serão tratadas no SRD (Solution Requirements Document) e parcialmente no PRD (Product Requirements Document).

| ID | Restrição | Implicação |
|----|-----------|------------|
| **REST-01** | Time de desenvolvimento não dedicado integralmente ao sunOS | Velocidade de implementação limitada por capacidade compartilhada com outras frentes operacionais |
| **REST-02** | sunOS é produto **100% interno** | Não pode ser comercializado, white-labeled ou exposto a clientes externos |
| **REST-03** | Não há time formal de DPO ou Compliance na Suno | Governance e privacidade são responsabilidade combinada do time do projeto + Diretoria |
| **REST-04** | Business case ainda em construção (sem aprovação financeira formal) | Investimentos maiores (Phase 16, deploy de produção, contratações) dependem da aprovação do business case que está sendo construído com Ronaldo |
| **REST-05** | Patrocínio executivo concentrado em sponsor único (Guga) | Mudanças na liderança da Suno United Creators podem afetar continuidade do projeto |
| **REST-06** | Diretriz interna de proteção de IP da Suno ("vendemos ideias na essência") | Tudo o que codifica a inteligência proprietária da Suno (skills, prompts, knowledge curado) deve permanecer fechado, mesmo internamente — restrição que afeta arquitetura e UX |
| **REST-07** | Integração Google Drive é exclusivamente read-only | RN-027 — sunOS não escreve, deleta ou move arquivos do Drive em hipótese alguma. Curadoria por agentes é sugestiva (RN-029); humano executa |
| **REST-08** | Integração Drive limitada ao Drive interno da Suno | Escopo alterado em 14/05/2026 (BR-018 v2). Integração opera exclusivamente no Drive corporativo da Suno United Creators. Não há integração com Drives externos de clientes nesta fase. Consentimento contratual segue a relação cliente-agência padrão, sem cláusulas específicas de IA exigidas por integração externa. Revisão se cenário de integração externa for reaberto |
| **REST-09** | Aprovador final é sempre humano | RN-024 — sunOS não pode aprovar autonomamente, mesmo com Validation Report 100% positivo |

### 5.2. Premissas Identificadas

| ID | Premissa | Risco se falhar |
|----|----------|-----------------|
| **PRE-01** | LLMs continuarão a evoluir e barateando | Aumento inesperado de custo, dependência de fornecedores |
| **PRE-02** | Adoção pelo time precisa ser cultural, não imposta | Sem adoção, ROI não se materializa |
| **PRE-03** | Dados de cliente podem ser utilizados em IA com consentimento implícito da relação cliente-agência | LGPD ou exigência de cliente pode forçar revisão futura |
| **PRE-04** | Heitor Miranda permanece dedicado à liderança do projeto | Risco de descontinuidade e perda de contexto |
| **PRE-05** | Big techs (Google, Adobe, etc.) continuam relação favorável com a Suno | Bloqueio de acesso a APIs ou aumento de custo |
| **PRE-06** | A diretriz interna de proteção de IP é aceita pelos clientes (não há cláusulas contratuais explícitas vetando IA externa) | Cliente individual pode exigir restrições; tratar caso a caso |
| **PRE-07** | O business case (horas economizadas × custo médio) será aprovado pela Diretoria | Sem aprovação, projeto perde patrocínio executivo |

**Fontes**: `CLAUDE.md`, `api/CLAUDE.md`, `docs/specs/large/sunohub-tools-integration/constitution.md`, confirmações do briefing.

---

## 6. Riscos de Negócio

### 6.1. Riscos Associados à Adoção

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Adoção lenta por resistência cultural | Média | Alto | Champions em cada área, testes com 3-5 users antes de rollout, treinamento contínuo |
| API keys de IA não disponíveis ou caras | Média | Alto | Fallback para mock em todas as features (já implementado em SPEC-001/002/003) |
| Custo de LLM escalar com uso | Alta | Médio | Gemini Flash como padrão (barato), rate limits por workflow, MLflow tracing para detectar abusos |
| Time pequeno e não-dedicado limita evolução | Alta | Alto | Workflow Builder empodera outros times, descentraliza demanda; SDD documenta tudo para acelerar onboarding |
| Deploy bloqueado por infra (GCP project) | Média | Alto | Projeto GCP dedicado em setup; uso de Cloud Run reduz friction de deploy |
| LGPD ou regulamentação obrigando isolamento de dados de cliente | Baixa | Alto | Arquitetura permite isolar via `skill_slug` + `context_documents` (ADR-002) |
| Saída de Heitor Miranda da Suno | Baixa | Crítico | Documentação extensiva (ROADMAP, specs SDD, handoffs em `docs/handoff/`) |
| Complacência com mocks impedindo Phase 11 (deploy real) | Média | Médio | Ritmo de demos semanais com Guga; pressão por evidência de impacto |
| Cliente individual exigir vetar IA externa | Baixa | Médio | Caso a caso; arquitetura permite operar 100% local se necessário |

### 6.2. Riscos de Não Implementação

| Risco | Descrição |
|-------|-----------|
| Perda de competitividade frente a holdings | WPP (£300M/ano), Publicis (€300M em CoreAI), Havas (~€1B total) estão investindo agressivamente |
| Perda de competitividade frente a AI-native (Monks, Jellyfish) | Monks já opera com 25%+ de trabalho via IA, com margens de 65-80% vs. agência tradicional |
| Time de creators frustrado com ferramentas fragmentadas | Risco de turnover para in-house ou tech companies; gap salarial significativo agrava |
| Continuação de iniciativas isoladas de IA na agência | Erro estratégico de governança e segurança de IP; cada projeto isolado é vetor de risco |
| Perda de contas estratégicas | Clientes (Vivo, Americanas, Sicredi) começarão a exigir capacidade comprovada de IA da agência; sem sunOS, dificulta defender contratos |

### 6.3. Possíveis Mitigadores Transversais

- **Spec-Driven Development (SDD)**: skill `sdd-koro` está em uso ativo; cada feature crítica tem 5 artefatos (constitution, spec, design, plan, tasks) antes da implementação
- **Champions distribuídos**: empoderar 1 pessoa por área para reduzir dependência do time central
- **Demos semanais com sponsor**: cadência fixa que mantém visibilidade e mitiga risco de descontinuidade

---

## 7. Pontos em Aberto / Itens a Validar

### 7.1. Decisões de Negócio Pendentes

| ID | Decisão | Responsável | Prazo sugerido |
|----|---------|-------------|----------------|
| **DEC-01** | Modelo de monetização interna (cobrar BUs por uso?) | Guga + Ronaldo | Q3 2026 |
| **DEC-02** | Workflows entram em produção em Phase 1 ou só pilotos? | Heitor + Sponsor | Q2 2026 |
| **DEC-03** | Diretrizes formais de uso de IA com clientes (mesmo que internas) | Diretoria | Q3 2026 |
| **DEC-04** | Critério de inclusão de novos clientes/contas no sunOS | Heitor + Atendimento | Em curso |
| **DEC-05** | Estratégia de eventual sinergia com Toolbox (produto Takai) | Heitor + Takai | Q4 2026 |
| **DEC-06** | Budget formal para Phase 16 (Editor, VideoGen) — Fabric.js + Vertex AI | Guga + Ronaldo | Q2 2026 |

### 7.2. Informações a Confirmar

- **Volume formal de "horas economizáveis"** no business case (em construção com Ronaldo)
- **KPIs validados pelo PM** (atualmente todos propostos)
- **Datas formais de cada Phase** além das já implementadas
- **Eventual exigência de cliente** para vetar uso de IA externa (cliente a cliente)

### 7.3. Conflitos Identificados

Nenhum conflito explícito identificado neste momento. As tensões mapeadas no briefing foram resolvidas:

| Tensão potencial | Resolução |
|------------------|-----------|
| Uso interno-only vs. eventual produtização para SMB | Resolvido: sunOS = 100% interno; produto SMB ocorre separadamente sob a marca **Toolbox** (Takai) |
| Tutela técnica vs. ownership cross-grupo | Resolvido: Heitor tutela tecnicamente; sponsorship é do Guga; uso é cross-grupo |
| AI substitui pessoas vs. amplifica pessoas | Resolvido: princípio fundador "inteligência artificial + inteligência natural" |

---

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-04-28 | Versão inicial baseada em PRODUCT_HANDOFF.md, transcrições de reuniões, deck Crescera SmartGrowth, materiais de research, dossiê executivo Guga Ketzer e confirmações Q1-Q20 + Q3a, Q7a, Q11a do briefing |
| 1.1 | 2026-04-28 | Correções de revisão do Heitor: (a) Champions Gus e Teda são de Mídia, não Criação; (b) Ronaldo Severino reposicionado como Patrocinador Sócio (CFO), não como champion; (c) Stakeholder externo investidor anonimizado para "(a definir)"; (d) Seção 4.2 reescrita em linguagem de negócio (capacidades, não fases técnicas); (e) Seção 4.3 (Relação com sistemas) removida — é tratada em outros artefatos; (f) Seção 5.1 limpa — restrições técnicas e de stack movidas para escopo de SRD/PRD; mantidas apenas restrições de negócio puras |
| 1.2 | 2026-04-28 | **+ Aprovadores como papel funcional** em §3.1.5 (não cargo novo — sócios/líderes assumem). **+ 3 restrições** (REST-07 Drive read-only · REST-08 consentimento cliente-a-cliente · REST-09 aprovador sempre humano). Pedido Guga + Bruno Prosperi para fluxo de Aprovação Hierárquica e integração Google Drive |
| 1.3 | 2026-05-14 | §3.1 reescrito com modelo Sponsor-Champion-Time Central formalizado (reuniões 07/05 e 14/05/2026). Tabelas de Sponsors e Champions confirmados. REST-08 reformulado (escopo Drive limitado ao Drive interno da Suno, BR-018 v2). |

---

<!-- REVIEW: A especificação captura o que você realmente quer construir? -->

**Próximos passos**:
1. Revisar Parte 1 com Heitor Miranda
2. Apresentar para Guga em reunião semanal (terça)
3. Iniciar Parte 2 (Glossário) com termos como United Creators, Smart Growth, Bioma Zero/Job/Agenting, Skill, Moon, HITL, Champion, Toolbox, Inteligência Natural
4. Em paralelo, finalizar business case (horas × custo) com Ronaldo
