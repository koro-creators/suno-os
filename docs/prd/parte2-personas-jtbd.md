---
documento: PRD Parte 2 — Personas e Jobs-to-be-done
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
fonte_brd: docs/brd/parte1-contexto.md, docs/brd/parte2-glossario.md, docs/brd/parte3-requisitos.md, docs/brd/parte4-regras.md
fonte_handoff: docs/handoff/PRODUCT_HANDOFF.md
fonte_frd: FRD Moon Shot (referenciado nos BRDs Parte 3 e 4)
total_personas: 5 (PX-01 a PX-05)
---

# PRD Parte 2 — Personas e Jobs-to-be-done

## 1. Introdução

### 1.1. Objetivo deste Documento

Este documento define as **personas de uso (PX-XX)** do sunOS — não como arquétipos demográficos, mas como **perfis de uso reais**: papel, KPIs pelos quais são cobrados, ferramentas atuais, dores concretas, oportunidades destravadas pelo sunOS e Jobs-to-be-done formulados como *"When [contexto], I want to [ação], so that [resultado]"*.

Serve como base para:
- **UX**: Design de fluxos centrados nas dores e jobs reais
- **Produto**: Priorização de features e jornadas (matriz Persona × Jornada virá na Parte 3 do PRD)
- **Engenharia**: Entendimento do contexto de uso e expectativas de comportamento
- **Pesquisa**: Validação qualitativa pós-Piloto

### 1.2. O que NÃO é uma Persona neste Documento

- ❌ Arquétipo demográfico (idade, hobbies, foto fictícia)
- ❌ Descrição genérica de cargo
- ✅ Perfil de uso real: papel, responsabilidades, ferramentas atuais, dores concretas, JTBD verificáveis

As personas aqui descritas são **internas à Suno United Creators** — todas são Creators do grupo (~300 pessoas em 2026). Clientes da Suno (Vivo, Americanas, Sicredi, etc.) **não são personas do sunOS** — são representados como **Planetas** no Sistema Solar (FA-06) e são beneficiários indiretos.

### 1.3. Relação com Outros Artefatos

| Artefato | Relação |
|----------|---------|
| BRD Parte 1 (Contexto §3.1.4) | Builders são embriões das personas operacionais (Gus/Teda em Mídia, Le em outras áreas) |
| BRD Parte 2 (Glossário) | Vocabulário "Creator", "Bioma Zero/Job", "Patrocinador Sócio", "Builder" |
| BRD Parte 3 (BRs) | Cada persona é demandante de BRs específicos (matriz no §3.2 da Parte 3) |
| BRD Parte 4 (RNs) | RN-017 (Track por carreira) explicita diferença junior/sênior |
| PRD Parte 1 (Feature Map FA-XX) | Cada feature mapeia para personas atendidas |
| PRD Parte 3 (Matriz Persona × Jornada) | Persona × Jornada × Feature × KPI |
| PRD Parte 4 (FRs) | FRs especificam comportamento por persona quando relevante |
| FRD Moon Shot | PX-01 a PX-04 já existem no FRD; este documento referencia e adiciona PX-05 |

---

## 2. Visão Geral das Personas

### 2.1. Síntese das Personas

| ID | Persona | Papel no Negócio | Importância | Features Principais |
|----|---------|------------------|-------------|---------------------|
| **PX-01** | Líder/Curador | Bioma Zero — sócio/diretor/líder de área que governa Inteligência Coletiva, IP e qualidade. Builders também se encaixam aqui parcialmente | Core | FA-01 (Biblioteca), FA-09 (Governança), FA-10 (Mensuração), FA-12 (Admin) |
| **PX-02** | Criativo Sênior | Bioma Job — Creator de criação/redação/direção com 7+ anos, identidade-protetivo, engaja IA seletivamente para refinamento e devil's advocate | Core | FA-02 (Moon Shot), FA-04 (Chat), FA-11 (Safety cultural) |
| **PX-03** | Operador Processual | Bioma Job — Creator que executa tarefas processuais recorrentes (mídia, BI, planejamento, financeiro) e busca aceleração com contexto preservado | Core | FA-03 (Skills processuais), FA-04 (Chat), FA-05 (Workflows) |
| **PX-04** | Planejamento Estratégico | Bioma Job — Planner/CSO/analista de mercado que conecta insights de mercado a territórios criativos e estratégicos | Importante | FA-02 (Moon Shot), FA-03 (Análise de Mercado, Persona Sintética), FA-05 (Pesquisa de Mercado) |
| **PX-05** | Creator Junior | Bioma Job — Creator com < 3 anos de experiência, adota IA entusiasticamente em ideação, em risco de over-reliance | Importante | FA-02 (track junior), FA-04 (Chat), FA-11 (forced reflection, validação vocabulário) |

### 2.2. Ecossistema de Personas

As personas formam uma cadeia de valor onde **PX-01 cura, PX-02/PX-04 ideam, PX-03 executa, PX-05 aprende** — e o sunOS amplifica todas sem substituir nenhuma.

- **PX-01 Líder/Curador** alimenta o sistema (Biblioteca, configuração de Skills, definição de Workflows recorrentes) e governa qualidade (HITL, Mensuração, RBAC). Sua produtividade depende de eficiência de curadoria e de evidências defensáveis para Diretoria.
- **PX-02 Criativo Sênior** consome o sistema em modo **divergente** prioritariamente — Moon Shot como rompedor de bloqueio e devil's advocate. Para tarefas processuais, delega frequentemente a PX-03 ou usa Skills processuais com supervisão.
- **PX-03 Operador Processual** consome o sistema em modo **convergente** prioritariamente — Skills com contexto injetado para entregar relatório/plano/copy mais rápido. Workflows automatizam o que ele faria manualmente. Beneficiário direto da Biblioteca (FA-01) sem precisar saber que ela existe (Caixa-preta).
- **PX-04 Planejamento Estratégico** transita entre divergente (Moon Shot para conectar insights) e convergente (Análise de Mercado, Persona Sintética, Pesquisa de Mercado como Workflow). É ponte entre PX-02 e PX-03.
- **PX-05 Creator Junior** é o perfil mais sensível ao sistema: maior risco de over-reliance, maior necessidade de proteção via UX adaptada (track junior, forced reflection com N=3, visible reasoning hidden by default).

PX-01 valida saúde de todos (via HITL e Mensuração); PX-02 e PX-04 validam saúde criativa coletiva (via FA-11 e RN-019/020); PX-03 valida custo evitado (via FA-10-03 e RN-018); PX-05 valida UX adaptada (via RN-017).

### 2.3. Priorização para Fases

| Fase | Personas Core | Personas Importantes | Personas Secundárias |
|------|---------------|----------------------|----------------------|
| **POC** | PX-02 Criativo Sênior (testes blind do Moon Shot) | — | — |
| **Protótipo** | PX-01, PX-02, PX-03 | PX-04 | PX-05 |
| **Piloto** | PX-01, PX-02, PX-03, PX-04 | PX-05 | — |
| **MVP** | Todas | — | — |

---

## 3. Personas Detalhadas

### PX-01 — Líder/Curador

#### Perfil e Contexto

| Aspecto | Descrição |
|---------|-----------|
| **Papel Organizacional** | Bioma Zero — sócio, diretor de área, head de criação/mídia/planejamento, gerente sênior. Inclui builders de área (Gus/Teda em Mídia, Le em outras áreas) parcialmente, embora builders sejam papel cultural mais que cargo |
| **Senioridade Típica** | Liderança (10+ anos de experiência) |
| **KPIs pelos quais é cobrado(a)** | Saúde de receita da área, retenção de clientes, retenção de talento, qualidade percebida do output do time, win rate em new business, shortlist em festivais (Cannes/Effie), accountability de uso de IA, custo evitado da área |
| **Relação com outras personas** | Lidera PX-02, PX-03, PX-04, PX-05; presta contas ao Sponsor (Guga) e patrocinadores sócio (Bruno, Takai, Ronaldo) |

#### Responsabilidades e Atividades-Chave

- Definir e curar **referências, cases e guidelines** que viram Biblioteca (FA-01)
- Configurar **Skills** com system prompts proprietários (FA-03 via FA-12)
- Definir **Workflows recorrentes** que automatizam relatórios e análises do time (FA-05 via FA-12)
- Governar **proteção de IP da Suno** (Caixa-preta, BR-007, FA-09)
- Garantir **isolamento de contexto entre clientes** (BR-008, FA-09)
- Defender **continuidade do investimento em sunOS** com evidências de ROI (BR-003, FA-10)
- Monitorar **homogeneização criativa coletiva** e agir antes que vire crise (BR-014, FA-11)
- Capturar **conhecimento crítico em risco** antes de saídas de Creators-chave (BR-005, FA-01-07)
- Validar **vocabulário e cultura** em releases maiores (BR-011, RN-016)

#### Ferramentas e Fluxos Atuais (Antes do Sunos)

| Ferramenta/Processo | Como Usa Hoje | Gargalo Principal |
|---------------------|---------------|-------------------|
| Google Drive / Notion | Repositório fragmentado de cases, briefings, guidelines por cliente | Conhecimento dispersa entre pessoas; turnover apaga contexto; busca manual demora minutos |
| E-mails e cadeias de chat (Slack/Teams) | Repositório informal de conhecimento crítico de cliente | Conteúdo desaparece quando pessoa sai; não-buscável; sem governance |
| Reuniões de status (semanais) | Atualização de saúde de contas e Skills | Não há dashboard único; informação fragmentada por área |
| Planilha proprietária ROI (`roi_completo_suno.xlsx`) | Mapeamento de 136 atividades automatizáveis | Atualização manual; não conectada ao uso real de IA |
| Iniciativas isoladas de IA por time | Diferentes ferramentas (ChatGPT, Gemini, etc.) sem padronização | Risco de IP, sem governança, sem mensuração, sem rastreabilidade |
| Adobe Creative Cloud / Sprinklr / Canva | Ferramentas de produção operadas pelo time | Não geram contexto reutilizável para outros times |

#### Dores e Oportunidades

**Dores (frustrações atuais):**
- "Quando uma pessoa sai, conhecimento crítico de cliente vai junto" (BR-005, transcrição saída Stella e Fernando jan/2025)
- Iniciativas de IA isoladas por time, sem governance ou proteção de IP — *"isso aqui ninguém pode ver, é o segredo do documento"* (Guga, transcrição)
- Reportar valor da IA à Diretoria sem evidências mensuráveis defensáveis (BR-003, anedota não basta)
- Risco de homogeneização criativa coletiva invisível ao olhar individual (research foundation Doshi & Hauser)
- Time de 4 devs não escala — toda automação dependendo deles é gargalo (BR-002)
- Demanda de accountability dos clientes (CMOs sob pressão de CFOs) cresce; agência precisa demonstrar impacto financeiro de cada ação

**Oportunidades (o que o sunOS destrava):**
- **Inteligência Coletiva acionável**: repertório histórico vira patrimônio compartilhado, sobrevive a turnover (FA-01)
- **Caixa-preta operacional**: IP da Suno protegido nas sete chaves, sem expor a perfis Operacionais (FA-09)
- **Dashboard executivo defensável**: tendência mensal de custo evitado, qualidade percebida, KPIs de negócio (FA-10)
- **Empoderamento de Workflows sem dependência de eng**: PX-03 e builders configuram suas próprias automações (FA-05)
- **Safety contra homogeneização**: monitor mensal das 3 métricas + bloqueio de relatório com satisfação isolada (FA-10-08, FA-10-09)
- **Captura proativa pré-saída**: alerta de conhecimento crítico em risco (FA-01-07)

#### Jobs-to-be-done (JTBD)

| ID | JTBD | Features | BRs |
|----|------|----------|-----|
| **JTBD-01** | When um Creator-chave anuncia saída, I want to capturar repertório, cases vividos e relacionamento com cliente antes da saída efetiva, so that o substituto re-onboarda em ≤70% do tempo histórico e nenhuma conta crítica perde contexto | FA-01, FA-12 | BR-005 |
| **JTBD-02** | When configuro uma Skill nova ou atualizo system prompt, I want to fazer isso em ≤5 minutos com versionamento, so that I posso evoluir o produto sem depender do time de eng | FA-03, FA-12 | BR-002, BR-007 |
| **JTBD-03** | When apresento valor do sunOS ao Sponsor na reunião semanal, I want to ter dashboard com tendência mensal de custo evitado e KPIs de negócio, so that I sustento continuidade do investimento com evidência defensável | FA-10 | BR-003, BR-013 |
| **JTBD-04** | When suspeito que homogeneização criativa coletiva está crescendo, I want to receber alerta automático com 3 métricas de diversidade e plano de mitigação proposto, so that I ajo antes de virar crise reportada por cliente | FA-02, FA-10, FA-11 | BR-014 |
| **JTBD-05** | When um perfil Operacional acessa o sunOS, I want to garantir que ele não vê menu, link ou referência à Biblioteca, so that o IP proprietário da Suno permanece Caixa-preta | FA-01, FA-09 | BR-007 |
| **JTBD-06** | When precisamos automatizar Report Mensal ou Plano de Mídia recorrente, I want to definir Workflow com schedule humanizado e HITL gate sem código, so that o time entrega no prazo sem depender do squad de eng | FA-05, FA-12 | BR-002, BR-013 |
| **JTBD-07** | When Skill processual cai abaixo de 30% de redução de tempo por 2 meses, I want to ser alertado para revisão (Skill, prompt, contexto, baseline), so that não acomodo mediocridade no produto | FA-03, FA-10 | BR-002 |

#### Critérios de Sucesso

> O que faria o Líder/Curador dizer que o sunOS "funciona" para ele?

- Diretoria aprovou business case completo até Q3 2026 cobrindo ≥80% das 136 atividades catalogadas
- Dashboard executivo é referência viva nas reuniões semanais com Guga
- ≥3 cases internos por trimestre com impacto atribuível ao sunOS
- ≥80% das contas críticas com contexto-mínimo documentado na Biblioteca
- Tempo de re-onboarding pós-saída de Creator-chave reduz ≥30%
- Zero exposição de skills/system prompts a perfis Operacionais auditável
- Diversidade coletiva estável ou crescente após estabilização inicial

#### Relação com Features e BRs

| Feature | Como esta Persona Usa |
|---------|----------------------|
| FA-01 Biblioteca | Cura conteúdo (CRUD via FA-12), define escopos (Suno/cliente), recebe alertas de conhecimento em risco |
| FA-03 Skills | Configura system prompts, define Moons, atribui Skills a Clientes |
| FA-05 Workflows | Define Workflows recorrentes da área, configura schedule e HITL gates |
| FA-09 Governança | Decide perfis (Admin/Líder/Operacional), audita acessos administrativos |
| FA-10 Mensuração | Consome dashboard mensal, monitora custo evitado, KPIs de negócio, alertas de homogeneização |
| FA-11 Safety cultural | Valida vocabulário em releases, aprova ≥90% das releases culturalmente |
| FA-12 Admin | Interface principal para todas as ações administrativas |

| BR | Relevância |
|----|------------|
| BR-003 (ROI) | **Demandante primário** — sustenta investimento |
| BR-004 (Biblioteca) | **Demandante primário** — cura conteúdo |
| BR-005 (Continuidade pós-turnover) | **Demandante primário** — captura conhecimento crítico |
| BR-007 (Proteção IP) | **Demandante primário** — Caixa-preta |
| BR-008 (Privacidade clientes) | Demandante (via Atendimento + Diretoria) |
| BR-009 (Auditabilidade) | **Demandante primário** |
| BR-013 (Mensuração custo evitado) | **Demandante primário** |
| BR-014 (Detecção homogeneização) | **Demandante primário** — agiu antes da crise |

---

### PX-02 — Criativo Sênior

#### Perfil e Contexto

| Aspecto | Descrição |
|---------|-----------|
| **Papel Organizacional** | Bioma Job — redator sênior, diretor de criação, diretor de arte, diretor de planejamento criativo, dupla de criação. Trabalha em squad multidisciplinar, frequentemente em sprint |
| **Senioridade Típica** | Sênior (≥7 anos de experiência) |
| **KPIs pelos quais é cobrado(a)** | Originalidade do output, qualidade percebida pelo cliente e por pares, shortlist em festivais (Cannes Lions, Effie), aprovação em primeira rodada com cliente, prazo de entrega, retenção do cliente |
| **Relação com outras personas** | Reporta a PX-01; faz dupla com outros PX-02; lidera PX-03 e PX-05 em squads; recebe insights de PX-04 |

#### Responsabilidades e Atividades-Chave

- **Devorar** briefings de cliente e transformar em territórios criativos
- **Provocar** ideias inesperadas (concepts, conceitos, headlines, big ideas) para campanhas
- **Refinar** drafts produzidos por PX-03 ou PX-05 ou por IA
- Defender ideias internamente e com cliente
- Manter **identidade autoral** — saber quando IA está "ajudando" e quando está erodindo originalidade
- Mentorar PX-05 (junior) preservando autonomia criativa deles
- Validar releases culturalmente (em parceria com PX-01)

#### Ferramentas e Fluxos Atuais

| Ferramenta/Processo | Como Usa Hoje | Gargalo Principal |
|---------------------|---------------|-------------------|
| Brainstorming presencial / sessões de dupla | Idealização tradicional, troca verbal entre dois Creators | Bloqueio criativo recorrente; dependência de mood; dificuldade em sair de territórios óbvios |
| ChatGPT / Gemini / Claude (genéricos) | Uso pontual, sem contexto de cliente nem proteção de IP, sem padronização | Output homogeneizado; expõe IP; sem mensuração; sem garantia de qualidade |
| Google Drive / Notion | Busca manual de cases, referências culturais, tom de voz do cliente | Demora; informação fragmentada; nem sempre encontra |
| Adobe Creative Cloud, Figma | Ferramentas de produção visual | Operadas após ideação; não ajudam na fase divergente |
| Reuniões com cliente / briefing | Recebimento de inputs estratégicos | Briefings frequentemente vagos ou contraditórios; falta contexto histórico |

#### Dores e Oportunidades

**Dores (frustrações atuais):**
- Bloqueio criativo em territórios óbvios — IA genérica converge para soluções homogeneizadas (research Doshi & Hauser)
- Risco de **leveling-up illusion**: satisfação individual com IA aumenta enquanto diversidade coletiva colapsa (FA-10-08)
- Sentir-se "operador de IA" em vez de autor — perda de identidade autoral (BR-010, research Wadinambiarachchi 2024)
- Reconstruir contexto de cliente a cada interação (tom de voz, restrições, histórico) — fadiga
- IA genérica não respeita a cultura criativa brasileira (antropofagia, jeitinho, dupla, mestiçagem)
- Pesquisa de referência cultural / cases similares demora minutos — quebra fluxo criativo
- Receio (justificado) de que ferramentas externas vazem ideias confidenciais

**Oportunidades (o que o sunOS destrava):**
- **Moon Shot Provoca Faíscas inesperadas**: combina conceitos de domínios distantes na zona Sweet Spot (FA-02)
- **Modo "Tenho uma ideia, me prova que tá errada"** (devil's advocate, senior-leaning) — usa IA para stress-test sem perder ownership (RN-017)
- **Marcação visual de outputs como Faísca/estímulo** — não há ambiguidade sobre o que é IA vs. autor (RN-014, FA-11)
- **Forced reflection após N stars** — protege engajamento cognitivo (RN-015)
- **Personas brasileiras dos agentes** (Antropófaga, Carnavalesco, Anciã) — a IA fala a língua cultural (RN-017, FA-11-05)
- **Modo dupla de criação** com time-boxing 90s/5min — preserva fluxo humano (FA-11-06)
- **Caixa-preta operacional**: ideias rodam dentro do sunOS, IP protegido (FA-09)

#### Jobs-to-be-done (JTBD)

| ID | JTBD | Features | BRs |
|----|------|----------|-----|
| **JTBD-08** | When estou bloqueado em territórios óbvios para um briefing, I want to acionar Moon Shot em ≤3 cliques e receber Faíscas inesperadas mas mappeáveis, so that consigo romper bloqueio sem perder ownership autoral | FA-02, FA-06 | BR-001, BR-010 |
| **JTBD-09** | When tenho uma ideia que acho boa, I want to pedir ao agente "me prove que tá errada" em modo devil's advocate, so that consigo stress-testar antes de defender com cliente | FA-02 (modo senior), FA-04 | BR-001, BR-012 |
| **JTBD-10** | When uso IA em sessão de ideação, I want to ver claramente o que é estímulo/Faísca vs. peça final, so that preservo identidade autoral e cliente sabe quem assinou | FA-04, FA-11 | BR-010 |
| **JTBD-11** | When preciso de referência cultural ou case similar de cliente, I want to receber automaticamente como contexto da Skill ativa em ≤2 minutos, so that não quebro fluxo criativo buscando em drives | FA-01, FA-03 | BR-006 |
| **JTBD-12** | When dou múltiplas aprovações em sessão (≥5 stars), I want to ser interrompido por uma pergunta reflexiva ("Por que essas? Que padrão você vê?"), so that mantenho pensamento crítico ativo | FA-04, FA-07, FA-11 | BR-010, BR-012 |
| **JTBD-13** | When trabalho em dupla de criação, I want to ter modo time-boxing 90s IA / 5min humano / repeat, so that fluxo humano fica preservado e IA é provocadora, não substituta | FA-02, FA-11 | BR-010, BR-011 |

#### Critérios de Sucesso

> O que faria o Criativo Sênior dizer que o sunOS "funciona" para ele?

- ≥80% confirmam em pesquisa qualitativa pós-Piloto que sentem ownership do trabalho final
- ≥60% das provocações classificadas como "úteis" em testes blind (POC)
- ≥70% de aprovação por Creators em uso real (Piloto)
- NPS de seniores ≥ NPS de juniores (sinal de não-resistência identitária)
- Score HITL de Skills criativas (Copy Social, Roteiro de Vídeo) > 4.0
- Diversidade coletiva (Cosine Distance, Self-BLEU, Compression Ratio) estável ou crescente

#### Relação com Features e BRs

| Feature | Como esta Persona Usa |
|---------|----------------------|
| FA-02 Moon Shot | **Uso primário** — modo "me prova que tá errada", modo dupla, todas as zonas de bisociação |
| FA-04 Chat | Interface principal para conversa com agentes ReAct |
| FA-08 Multimodal | Visualizar Faíscas como imagem ou vídeo (Phase 16) |
| FA-11 Safety cultural | Beneficiário primário — marcação Faísca, forced reflection, personas brasileiras |
| FA-07 HITL | Avalia outputs (thumbs/comentário/rating) |
| FA-01 Biblioteca | Indireto — recebe contexto via Skills sem buscar manualmente |

| BR | Relevância |
|----|------------|
| BR-001 (Provocação criativa) | **Demandante primário** |
| BR-010 (Ownership criativo) | **Demandante primário** |
| BR-011 (Cultura brasileira) | Demandante |
| BR-012 (UX por carreira) | **Demandante primário** (segmento sênior) |
| BR-014 (Detecção homogeneização) | Beneficiário (proteção de identidade autoral) |

---

### PX-03 — Operador Processual

#### Perfil e Contexto

| Aspecto | Descrição |
|---------|-----------|
| **Papel Organizacional** | Bioma Job — analista de mídia, analista de BI, analista de planejamento, analista financeiro, social media operator, analista de Growth/Dados, operações |
| **Senioridade Típica** | Pleno ou Júnior técnico (3-6 anos típicos; pode incluir alguns Plenos a Sêniores em mídia/BI) |
| **KPIs pelos quais é cobrado(a)** | Volume de entrega, prazo, qualidade técnica, número de tarefas executadas por sprint, win rate em pitches (analista mídia), qualidade de reports (BI), aderência a guidelines de marca |
| **Relação com outras personas** | Reporta a PX-01; recebe inputs de PX-02 (criação) e PX-04 (planner); colabora com pares de outras áreas |

#### Responsabilidades e Atividades-Chave

- Executar **Reports recorrentes** (mensal, semanal, ad-hoc) por cliente
- Construir **Plano de Mídia** com base em briefing e benchmarks
- Operacionalizar **Copy Social** em volume (Stories, Reels, Feed, X/Twitter)
- Produzir **Roteiro de Vídeo** seguindo guidelines de marca
- Construir **Brief Builder** para input de outras áreas
- Monitorar **anomalias de performance** em campanhas
- Pesquisa de mercado pontual
- Manter **histórico de execuções** rastreável

#### Ferramentas e Fluxos Atuais

| Ferramenta/Processo | Como Usa Hoje | Gargalo Principal |
|---------------------|---------------|-------------------|
| Excel / Google Sheets | Reports mensais, planos de mídia, análises ad-hoc | Refazer template a cada mês; copiar/colar contexto; não há automação |
| Adobe Creative Cloud / Canva | Produção visual operacional | Ferramentas de produção; não geram contexto reutilizável |
| Sprinklr | Publicação social, monitoramento | Não conectado a Skills/IA contextual |
| ChatGPT / Gemini / Claude (genéricos, uso isolado) | Geração de copy ou texto pontual | Sem contexto de cliente; output homogeneizado; sem mensuração |
| Google Drive / Notion | Buscar guideline de cliente, briefing histórico | Busca manual; demora |
| E-mails de status com cliente | Comunicação de entrega | Tarefas dispersas; sem rastreabilidade unificada |

#### Dores e Oportunidades

**Dores (frustrações atuais):**
- Reconstruir contexto de cliente a cada nova tarefa — copiar/colar de briefings antigos
- Refazer templates de Report Mensal a cada ciclo (BR-002)
- Buscar guidelines de marca em drives compartilhados — fluxo quebrado
- IA genérica não conhece tom de voz nem restrições legais do cliente — output precisa ser refeito
- Não tem como demonstrar custo evitado por automação ao Líder
- Volume de tarefas processuais cresce mais rápido que tempo disponível
- Skills/automações dependem do squad de eng (4 devs) — fila longa

**Oportunidades (o que o sunOS destrava):**
- **Skills processuais com contexto injetado automaticamente** — Copy Social, Plano de Mídia, Report Performance preservam tom de voz, restrições legais, histórico (FA-03)
- **Workflows agendados** — Report Mensal roda sozinho via Cloud Scheduler; Plano de Mídia tem HITL gate (FA-05)
- **Cálculo de custo evitado por execução** — Líder vê valor objetivo do trabalho automatizado (FA-10-03, RN-018)
- **Caixa-preta**: nem precisa saber que existe Biblioteca por trás — só usa Skill e funciona (RN-011)
- **Hierarquia de truncamento garante regras de negócio do cliente** — outputs nunca quebram brand safety (RN-021)
- **Encadeamento de Workflows (sub-workflows)** — operações complexas viram fluxos modulares (SPEC-004)

#### Jobs-to-be-done (JTBD)

| ID | JTBD | Features | BRs |
|----|------|----------|-----|
| **JTBD-14** | When recebo briefing para Copy Social de cliente conhecido, I want to abrir Skill Copy Social e ter tom de voz, restrições legais e referências injetadas automaticamente, so that produzo draft em ≤30% do tempo histórico | FA-03, FA-04, FA-01 | BR-002, BR-006 |
| **JTBD-15** | When chega final do mês, I want to que o Report Mensal rode sozinho via Workflow agendado e me notifique quando estiver pronto para revisão, so that não preciso refazer template manualmente | FA-05, FA-03 | BR-002, BR-013 |
| **JTBD-16** | When monto Plano de Mídia, I want to ter benchmarks históricos do cliente e best practices de indústria injetados pela Skill, so that não busco manualmente em drives | FA-03, FA-01 | BR-002, BR-006 |
| **JTBD-17** | When executo Skill processual, I want to ver no Líder Dashboard quanto tempo a IA economizou da minha tarefa, so that meu trabalho automatizado é reconhecido objetivamente | FA-10 | BR-013 |
| **JTBD-18** | When detecto anomalia de performance em campanha, I want to disparar Workflow Monitor de Anomalias que analisa, condiciona e alerta, so that ajo rápido sem montar análise manual | FA-05 | BR-002 |
| **JTBD-19** | When trabalho com cliente A e Skill processual, I want to garantir que contexto de cliente B nunca aparece, so that preservo confiança contratual entre clientes | FA-03, FA-09 | BR-008 |

#### Critérios de Sucesso

> O que faria o Operador Processual dizer que o sunOS "funciona" para ele?

- Tempo médio de execução de tarefas-alvo reduz ≥30% (mensurado em ≥5 tarefas-piloto)
- Outputs de Skills com contexto da Biblioteca avaliados como "melhores" (vs. sem Biblioteca) em ≥65% dos A/B tests
- Volume de tarefas automatizadas cresce mensalmente nos primeiros 6 meses pós-Piloto
- Cobertura de ≥10 tarefas-alvo distintas até final do Piloto
- Tempo médio para encontrar referência crítica de cliente <2 minutos (vs. baseline pré-sunOS)
- Zero incidente de cross-contamination entre clientes (auditável)

#### Relação com Features e BRs

| Feature | Como esta Persona Usa |
|---------|----------------------|
| FA-03 Skills processuais | **Uso primário** — Copy Social, Plano de Mídia, Roteiro de Vídeo, Report Performance, Brief Builder |
| FA-04 Chat | Interface principal para Skills processuais |
| FA-05 Workflows | **Uso primário** — Report Mensal, Plano de Mídia, Monitor de Anomalias, Pesquisa de Mercado |
| FA-08 Multimodal | Image gen para Copy Social Preview Instagram |
| FA-01 Biblioteca | Indireto (Caixa-preta) — recebe contexto sem saber que existe |
| FA-07 HITL | Avalia outputs (thumbs/comentário) |
| FA-09 RBAC | Beneficiário (proteção contra cross-contamination) |
| FA-10 Mensuração | Beneficiário indireto — custo evitado calculado por execução |

| BR | Relevância |
|----|------------|
| BR-002 (Aceleração operacional) | **Demandante primário** |
| BR-006 (Acesso democrático) | **Demandante primário** |
| BR-008 (Privacidade clientes) | Beneficiário direto |
| BR-013 (Mensuração custo evitado) | Beneficiário indireto (custo evitado da execução dele alimenta dashboard de PX-01) |
| BR-015 (Integração Skills) | **Demandante primário** |

---

### PX-04 — Planejamento Estratégico

#### Perfil e Contexto

| Aspecto | Descrição |
|---------|-----------|
| **Papel Organizacional** | Bioma Job — Planner, Strategist, CSO (Chief Strategy Officer) ao nível de área/cliente, analista de mercado, planejamento criativo. Inclui Sergio Katz (CSO/Planejamento) e equivalentes em outras áreas |
| **Senioridade Típica** | Pleno a Sênior (5-15 anos típicos) |
| **KPIs pelos quais é cobrado(a)** | Qualidade do briefing, profundidade de insight, win rate em new business, conexão entre dados e território criativo, impacto estratégico em campanhas, qualidade do Persona Sintética |
| **Relação com outras personas** | Reporta a PX-01; alimenta PX-02 com insights estratégicos; colabora com PX-03 em Pesquisa de Mercado e Análise; recebe inputs de áreas de cliente |

#### Responsabilidades e Atividades-Chave

- Construir **briefings estratégicos** ricos em insight (Brief Builder)
- Conectar **dados de mercado e cultura** a territórios criativos
- Produzir **Persona Sintética** (representação de target)
- Realizar **Análise de Mercado** profunda
- Pesquisa de **referências culturais e benchmarks competitivos**
- Validar pitches com base em insight estratégico
- Antecipar tendências e provocar criação a partir delas

#### Ferramentas e Fluxos Atuais

| Ferramenta/Processo | Como Usa Hoje | Gargalo Principal |
|---------------------|---------------|-------------------|
| Google / WebSearch / relatórios setoriais | Pesquisa manual de tendências e dados de mercado | Demora; resultados genéricos; difícil conectar a contexto de cliente |
| Excel / Notion | Construção de Persona Sintética, Análise de Mercado | Sem inteligência conectada; precisa rodar análise manual |
| Reuniões com cliente / Atendimento | Coleta de input estratégico | Briefing frequentemente vago; falta de histórico estruturado |
| ChatGPT / Gemini (genérico) | Brainstorming de territórios estratégicos | Sem contexto de cliente; resultado homogeneizado; sem proteção de IP |
| Google Drive / Notion | Cases históricos, briefings antigos | Busca manual demora; informação fragmentada |
| Reuniões internas (planejamento + criação) | Discussão de territórios | Sem ferramenta de provocação estruturada para sair do óbvio |

#### Dores e Oportunidades

**Dores (frustrações atuais):**
- Conectar dados de mercado a território criativo — fricção alta, demanda intuição artesanal
- Persona Sintética como exercício de Excel/Notion; sem inteligência conectada
- Análise de Mercado precisa rodar várias vezes (atualizar trimestralmente) — refazer manualmente
- IA genérica não respeita cultura brasileira nem entende setor publicitário (BR-011)
- Risco de perpetuar hipóteses tradicionais quando IA converge para soluções homogeneizadas
- Pesquisa de mercado para new business pitch demora semanas — gargalo competitivo
- Falta de método estruturado para Provocar territórios não-óbvios

**Oportunidades (o que o sunOS destrava):**
- **Moon Shot como ferramenta estratégica**: conecta insights de domínios distantes a território criativo (FA-02, BR-001)
- **Skill Análise de Mercado** com contexto histórico do cliente injetado automaticamente (FA-03)
- **Skill Persona Sintética** com referências culturais brasileiras curadas (FA-03)
- **Workflow Pesquisa de Mercado** como agendamento ou disparo manual com sub-workflows (FA-05)
- **Skill Brief Builder** que sintetiza inputs em briefing estruturado (FA-03)
- **Modo "estou começando uma ideia"** (divergente, FA-02-06) para exploração estratégica abundante
- **Caixa-preta**: dados de mercado sensíveis ficam protegidos (FA-09)

#### Jobs-to-be-done (JTBD)

| ID | JTBD | Features | BRs |
|----|------|----------|-----|
| **JTBD-20** | When inicio Pesquisa de Mercado para new business pitch, I want to disparar Workflow Pesquisa de Mercado que faz busca web + síntese + contexto + report, so that entrego pesquisa em ≤50% do tempo histórico | FA-05, FA-03 | BR-002, BR-013 |
| **JTBD-21** | When monto Persona Sintética para campanha, I want to receber referências culturais brasileiras e dados demográficos contextualizados pela Biblioteca, so that persona não é genérica e respeita cultura local | FA-03, FA-01, FA-11 | BR-006, BR-011 |
| **JTBD-22** | When tenho insight de mercado e quero conectar a território criativo não-óbvio, I want to acionar Moon Shot com modo "começando uma ideia" e receber Faíscas que combinam meu insight com domínios distantes, so that rompo o óbvio e provoco PX-02 com insumo rico | FA-02, FA-04 | BR-001, BR-011 |
| **JTBD-23** | When construo Brief Builder, I want to ter inputs históricos do cliente, briefings anteriores e tom de voz injetados automaticamente, so that briefing é estratégico desde a primeira versão | FA-03, FA-01 | BR-002, BR-006 |
| **JTBD-24** | When apresento análise estratégica ao Líder, I want to ter custo evitado da minha pesquisa visível no dashboard, so that valor estratégico do trabalho automatizado é reconhecido | FA-10 | BR-013 |

#### Critérios de Sucesso

> O que faria o Planejamento Estratégico dizer que o sunOS "funciona" para ele?

- Tempo médio para Análise de Mercado / Pesquisa de Mercado / Persona Sintética reduz ≥30%
- Insights estratégicos de Moon Shot classificados como "úteis" por ≥60% das vezes (testes blind)
- Persona Sintética e Análise de Mercado avaliadas como mais ricas em insight (vs. sem sunOS) em ≥65% dos casos
- Win rate em new business pitches mantém ou melhora pós-sunOS (KPI de negócio do BR-013)
- Brief Builder reduz ciclo de iteração com PX-02 em ≥30%

#### Relação com Features e BRs

| Feature | Como esta Persona Usa |
|---------|----------------------|
| FA-02 Moon Shot | **Uso primário** — modo "começando uma ideia" e exploração de territórios |
| FA-03 Skills | **Uso primário** — Análise de Mercado, Persona Sintética, Brief Builder |
| FA-05 Workflows | **Uso primário** — Pesquisa de Mercado |
| FA-04 Chat | Interface principal |
| FA-01 Biblioteca | Indireto — recebe contexto via Skills |
| FA-10 Mensuração | Custo evitado da pesquisa visível no dashboard |
| FA-11 Safety cultural | Beneficiário (cultura brasileira em personas e referências) |

| BR | Relevância |
|----|------------|
| BR-001 (Provocação criativa) | **Demandante primário** (junto com PX-02) |
| BR-002 (Aceleração operacional) | Demandante (Análise, Persona, Pesquisa) |
| BR-006 (Acesso democrático) | Demandante |
| BR-011 (Cultura brasileira) | Demandante |
| BR-013 (Mensuração custo evitado) | Beneficiário |

---

### PX-05 — Creator Junior

#### Perfil e Contexto

| Aspecto | Descrição |
|---------|-----------|
| **Papel Organizacional** | Bioma Job — Creator com < 3 anos de experiência em qualquer área (criação, mídia, planejamento, BI). Pode ser estagiário, assistente, analista júnior. Inclui novos entrantes pós-sunOS |
| **Senioridade Típica** | Júnior (< 3 anos) |
| **KPIs pelos quais é cobrado(a)** | Volume de entrega, qualidade técnica básica, aprendizado mensurável, autonomia crescente, aderência a guidelines, prazo |
| **Relação com outras personas** | Reporta a PX-02 ou PX-03 (mentor); colabora com pares juniors; consome curadoria de PX-01 |

#### Responsabilidades e Atividades-Chave

- Aprender o **vocabulário e cultura criativa da Suno** rapidamente (onboarding)
- Executar **tarefas processuais com supervisão** (Copy Social júnior, drafts iniciais)
- Idear **conceitos e drafts iniciais** sob orientação de PX-02
- Buscar **referências culturais e cases históricos** para se atualizar
- Construir **portfolio interno** ao longo do tempo

#### Ferramentas e Fluxos Atuais

| Ferramenta/Processo | Como Usa Hoje | Gargalo Principal |
|---------------------|---------------|-------------------|
| ChatGPT / Gemini / Claude (genéricos) | Adoção entusiástica em ideação | Risco de over-reliance documentado em research (Microsoft Research / MIT Media Lab 2025); satisfação alta mascara erosão cognitiva |
| Google Drive / Notion | Buscar referências e cases | Sem curadoria; encontra muita coisa irrelevante |
| Mentorias presenciais com PX-02 | Aprendizado de cultura e técnica | Gargalo de tempo do mentor; nem sempre escala |
| Onboarding tradicional | Apresentação de cliente, brand, processos | Conhecimento institucional dispersa-se em e-mails, drives, conversas |

#### Dores e Oportunidades

**Dores (frustrações atuais):**
- Curva de aprendizado longa — conhecimento institucional fragmentado (BR-006)
- Risco de **over-reliance em IA**: aprende a perguntar, não a pensar (research foundation)
- Risco de **leveling-up illusion**: sente-se produtivo, mas qualidade coletiva sofre (Doshi & Hauser)
- IA genérica não respeita cultura criativa brasileira; output homogeneizado vira hábito
- Tempo de mentoria com PX-02 limitado — preciso aprender por conta própria
- Dificuldade em diferenciar quando IA está ajudando vs. erodindo competência própria

**Oportunidades (o que o sunOS destrava):**
- **Onboarding com track "Estou começando uma ideia"** (divergente, junior-leaning) — IA ensina a explorar, não a substituir (RN-017, FA-11-03)
- **Forced reflection moments após N=3 stars** (mais protetivo que para sêniores) — proteção extra contra erosão cognitiva (RN-015)
- **Visible reasoning hidden by default** — não revela "raciocínio" do agente; preserva o aha do creator (BR-012)
- **Marcação visual de outputs IA como Faísca/estímulo** — junior aprende desde o primeiro dia que IA provoca, não cria (RN-014)
- **Onboarding via Biblioteca** com cases curados — curva de aprendizado reduz ≥40% (BR-006)
- **Métricas por estágio de carreira** monitoradas trimestralmente — Líder vê saúde do segmento júnior (FA-11-08)
- **Personas brasileiras dos agentes** — junior aprende a língua cultural da Suno desde o início

#### Jobs-to-be-done (JTBD)

| ID | JTBD | Features | BRs |
|----|------|----------|-----|
| **JTBD-25** | When entro na Suno e faço onboarding, I want to escolher track "Estou começando uma ideia" e receber experiência divergente que me ensina a explorar territórios, so that aprendo a usar IA como provocação, não substituição | FA-02 (modo junior), FA-11 | BR-012, BR-006 |
| **JTBD-26** | When dou múltiplas aprovações em sessão (≥3 stars), I want to ser interrompido por pergunta reflexiva mais frequente que sêniores, so that mantenho engajamento cognitivo desde o início da carreira | FA-04, FA-07, FA-11 | BR-010, BR-012 |
| **JTBD-27** | When busco referência cultural ou case da Suno, I want to receber automaticamente contexto curado pela Biblioteca via Skill ativa, so that curva de aprendizado reduz ≥40% | FA-01, FA-03 | BR-006 |
| **JTBD-28** | When uso IA em ideação, I want to ver claramente o que é estímulo da IA vs. minha contribuição, so that desde o primeiro dia entendo princípio "AI provoca, humano cria" | FA-11, FA-04 | BR-010, BR-012 |
| **JTBD-29** | When meu mentor PX-02 não está disponível, I want to ter agente em modo Antropófaga/Carnavalesco/Anciã que respeita cultura brasileira como complemento de mentoria, so that não perco fluxo de aprendizado | FA-02, FA-04, FA-11 | BR-011, BR-012 |

#### Critérios de Sucesso

> O que faria o Creator Junior dizer que o sunOS "funciona" para ele?

- Onboarding de novos creators reduz curva de aprendizado em ≥40% (mensurado em entrevistas qualitativas com novos entrantes pós-sunOS, BR-006)
- NPS de juniores **NÃO** desvia significativamente de NPS de sêniores (preservação cultural)
- Taxa de skip de reflection < 30% em juniores (sinal de engajamento real, RN-015)
- Sem queda em métricas neurais/qualitativas de pensamento crítico nos creators frequentes (research foundation Microsoft/MIT)
- Métricas por estágio de carreira disponíveis trimestralmente (FA-11-08)

#### Relação com Features e BRs

| Feature | Como esta Persona Usa |
|---------|----------------------|
| FA-02 Moon Shot | **Uso primário** — modo "começando uma ideia" (junior-leaning), zona Sweet Spot |
| FA-04 Chat | Interface principal |
| FA-11 Safety cultural | **Beneficiário primário** — track junior, forced reflection N=3, visible reasoning hidden, personas brasileiras |
| FA-07 HITL | Engaja com forced reflection mais frequente |
| FA-01 Biblioteca | Indireto (Caixa-preta) — recebe contexto via Skills, base de onboarding |
| FA-10 Mensuração | Indireto — métricas por carreira monitoradas pelo Líder |

| BR | Relevância |
|----|------------|
| BR-006 (Acesso democrático) | **Demandante primário** (curva de aprendizado) |
| BR-010 (Ownership criativo) | **Demandante primário** (proteção contra erosão) |
| BR-011 (Cultura brasileira) | Demandante (aprende a língua cultural) |
| BR-012 (UX por carreira) | **Demandante primário** (segmento junior) |

---

## 4. Priorização de Personas por Fase

### 4.1. Personas Core (fluxos 100% resolvidos)

| Persona | Fase de Entrada | Justificativa |
|---------|-----------------|---------------|
| PX-02 Criativo Sênior | POC | POC do Moon Shot valida com 3+ Creators seniores em testes blind (BR-001, critério ≥60% provocações úteis) |
| PX-01 Líder/Curador | Protótipo | Curadoria da Biblioteca, configuração de Skills, governança são pré-requisitos de qualquer uso real |
| PX-03 Operador Processual | Protótipo | Skills processuais com context injection e Workflows são valor primário de aceleração (BR-002) |

### 4.2. Personas Importantes (fluxo principal suportado)

| Persona | Fase de Entrada | Justificativa |
|---------|-----------------|---------------|
| PX-04 Planejamento Estratégico | Protótipo (com escopo limitado) → Piloto (cobertura completa) | Análise de Mercado e Brief Builder validados em Protótipo; Pesquisa de Mercado como Workflow no Piloto |
| PX-05 Creator Junior | Protótipo (com proteção limitada) → Piloto (com track + forced reflection completos) | Necessário para validar BR-012 e proteção contra over-reliance; pode esperar para ter UX completa |

### 4.3. Personas Secundárias

Nenhuma persona secundária identificada nesta versão. Todas as 6 personas são consideradas relevantes para o MVP. O sunOS é projeto cross-grupo (Parte 1 §1.2): todos os Creators do grupo United Creators são consumidores potenciais.

**Lacuna identificada**: clientes externos da Suno (Vivo, Americanas, etc.) **NÃO** são personas — são representados como Planetas (FA-06) e são beneficiários indiretos. Eles consomem outputs gerados pelo sunOS via apresentações, campanhas e relatórios produzidos pelos Creators internos.

---

---

### PX-06 — Aprovador Sócio (NOVA — pedido Guga + Bruno Prosperi)

**Perfil**: Sócio, head de área ou líder sênior que recebe submissões de creators para decisão final. **Não é cargo novo** — é papel funcional desempenhado por pessoas já existentes na hierarquia (Bruno Prosperi para Criação, Takai para Mídia, Sergio Katz para Planejamento, etc.) conforme configuração admin (RN-026).

**Diferença vs. PX-01 Líder/Curador**: PX-01 cura conhecimento e gerencia infraestrutura; PX-06 decide aprovação de assets pontuais. A mesma pessoa pode ocupar ambos os papéis em momentos diferentes.

**KPIs**:
- Tempo médio de decisão por submissão (alvo: < 24h em horário comercial)
- Taxa de rejeição com Validation Report já em status `passed` (idealmente baixa — sinal de validators bem calibrados)
- NPS de creators sobre clareza do feedback de rejeição

**Ferramentas atuais (pré-sunOS)**: e-mail, Drive shares, mensagens diretas, reuniões de revisão. Falta de visibilidade central, sem trilha de auditoria, decisões repetidas pela ausência de Brand Guidelines acessíveis.

**Dores**:
- Recebe revisões em formato/canal heterogêneo (e-mail, deck, WhatsApp) — sem padronização
- Gasta tempo em revisões evitáveis (português, brand básico) que poderiam ter sido pegas antes
- Dificuldade em delegar — porque não sabe se o asset já passou por verificações mínimas
- Risco de "rubber-stamping" se confiar cegamente em IA — quer manter senso de decisão real
- Pressão por velocidade × pressão por qualidade

**Oportunidades**:
- Centralizar submissões em Approval Inbox dentro do sunOS (FA-13-04)
- Receber Validation Report estruturado (FA-13-03) com issues já mapeados
- Foco humano no julgamento criativo/estratégico (não em correção de gramática)
- Auditoria automática de decisões para defesa em caso de retrabalho

**Jobs-to-be-done (formato "When X, I want to Y, so that Z")**:

| ID | JTBD |
|----|------|
| JTBD-30 | When um creator submete um asset para minha aprovação, **I want to** ver o asset com Validation Report já anexado, **so that** eu foque meu tempo em julgamento estratégico, não em corrigir português ou checar brand básico |
| JTBD-31 | When eu rejeito um asset, **I want to** poder anexar feedback estruturado vinculado a issues específicos do Validation Report, **so that** o creator entenda exatamente o que ajustar |
| JTBD-32 | When há volume alto de submissões pendentes, **I want to** filtrar por cliente, prioridade e idade da submissão, **so that** eu priorize o que importa mais |
| JTBD-33 | When o sistema sugere aprovação automática (Validation Report 100% passed), **I want to** que ainda seja eu quem clica "Aprovar", **so that** preserve meu senso de decisão real e a auditoria reflita decisão humana (RN-024) |
| JTBD-34 | When um asset volta pela 3ª vez para correção, **I want to** ser alertado para conversar diretamente com o creator (humano-humano), **so that** quebremos o loop antes que vire frustração |

**Critérios de sucesso para PX-06**:
- Tempo médio de decisão: < 24h em horário comercial
- ≥80% das submissões têm Validation Report útil (issues acionáveis)
- ≥80% dos aprovadores reportam sentir-se "decisores reais" em pesquisa qualitativa (anti-rubber-stamping)
- Zero aprovações emitidas pelo sistema (auditável — RN-024)

**Features que atendem**: FA-13 (primário), FA-01 (Brand Guidelines), FA-09 (RBAC), FA-10 (mensuração de tempo de decisão)

**Jornadas**: JN-11 (Submissão para aprovação)

**Mapeamento BR**: BR-017 (primário), BR-009 (Auditabilidade), BR-010 (Ownership), BR-013 (Mensuração)

---

## 5. Implicações para UX, Produto e Engenharia

### 5.1. Para UX

- **PX-02 e PX-04 guiam o desenho de Moon Shot** (FA-02) — modos "me prova que tá errada" (sênior) e "começando uma ideia" (junior/exploração estratégica) são guidelines diretos
- **PX-03 guia o desenho de Skills processuais e Workflows** (FA-03, FA-05) — context injection automática, schedule humanizado, HITL gates não-fricativos
- **PX-01 guia o desenho de Admin areas e Mensuração** (FA-12, FA-10) — pattern Model Repo (table + sidebar + drawer), dashboard executivo mensal, alertas
- **PX-05 guia o desenho de proteções culturais** (FA-11) — track junior, forced reflection com N=3, visible reasoning hidden, marcação Faísca
- **Conflito de necessidade**: PX-02 (sênior) quer **menos** fricção (devil's advocate é stress-test rápido); PX-05 (junior) precisa **mais** fricção protetiva (forced reflection mais frequente). Resolução: track adaptativo por estágio de carreira (RN-017)
- **Caixa-preta para PX-03 Operacional** (RN-011): interface NUNCA expõe Biblioteca; substituição por linguagem neutra ("contexto do cliente")

### 5.2. Para Produto

- **Priorização de POC**: foco em PX-02 (validação BR-001 do Moon Shot)
- **Priorização de Protótipo**: cobertura PX-01 (curadoria), PX-02 (Moon Shot), PX-03 (Skills + Workflows iniciais)
- **Priorização de Piloto**: + PX-04 (cobertura completa de Análise/Persona/Pesquisa) + PX-05 (track + proteções)
- **Trade-off PX-02 × PX-05**: investir em RN-015 (forced reflection adaptativo) é gate para evitar adoção que prejudica saúde criativa coletiva (research Doshi & Hauser)
- **Validação cultural com PX-01 (sponsor + sócios)**: ≥90% das releases aprovadas culturalmente antes de chegar a PX-02/PX-03/PX-05 (RN-016, FA-11-09)
- **KPIs de negócio (FA-10-05)** atendem PX-01 prioritariamente — win rate, shortlist rate, retenção de seniores

### 5.3. Para Engenharia

- **Performance crítica para PX-03**: Skills processuais e Workflows não podem regredir > 10% de latência após context injection (BR-015)
- **Performance crítica para PX-02**: pipeline Moon Shot < 15s tempo médio de resposta (RN-003)
- **Segurança/permissionamento por perfil**: RBAC é central — PX-01 (Admin/Líder) acessa CRUDs; PX-02/03/04/05 (Operacional para a maioria) consome via Chat sem ver Biblioteca
- **Personalização por perfil**:
  - PX-05 (junior): track de onboarding "começando uma ideia", N=3 forced reflection
  - PX-02 (sênior): track "me prova que tá errada", N=5 forced reflection, visible reasoning hidden
  - PX-03 (operacional): UI sem Biblioteca, sem mensão a infraestrutura interna
- **Tracing por persona** (FA-10): métricas segmentadas por estágio de carreira (junior/pleno/sênior) acompanhadas trimestralmente (FA-11-08)
- **Isolamento entre clientes** (RN-010) crítico para PX-03 que opera múltiplos clientes em sequência

---

## 6. Assunções e Lacunas

### 6.1. Assunções sobre Personas

| ID | Assunção | Impacto se Falsa | Status |
|----|----------|------------------|--------|
| ASS-PX-01 | PX-05 (Creator Junior) merece persona separada de PX-02/PX-03 (e não apenas "track" nas existentes) | Se falsa, simplificar para 4 personas com tracks adaptativos; risco de subdimensionar proteção contra over-reliance | A validar com Bruno Prosperi e Heitor — pesquisa setorial sustenta a separação (research foundation AI & Society 2025) |
| ASS-PX-02 | Builders (Gus/Teda em Mídia, Le em outras áreas) se encaixam parcialmente em PX-01, mas papel cultural específico pode merecer persona separada | Se falsa e builder vira persona PX-06, refazer matrizes; risco de subdimensionar adoção cross-grupo | A validar com Heitor e Yuri — atualmente tratado como sub-papel de PX-01 |
| ASS-PX-03 | PX-04 (Planejamento Estratégico) inclui CSO ao nível de área e Planners de squad — perfis suficientemente parecidos para uma persona única | Se falsa e CSO precisa persona separada, refazer JTBDs | A validar com Sergio Katz |
| ASS-PX-04 | Definições por área de "júnior/pleno/sênior" (RN-017) são suficientemente convergentes para que tracks adaptativos funcionem cross-área | Se falsa, tracks precisam ser por área (criação ≠ mídia ≠ planejamento) | A validar (PA-09) com Bruno Prosperi (criação), Takai (mídia) |
| ASS-PX-05 | Personas brasileiras dos agentes (Antropófaga, Carnavalesco, Anciã) ressoam com PX-02 e PX-04, e não causam ruído com PX-03 (mais técnico) | Se falsa e PX-03 considera "infantil", precisa de modos neutros + brasileiros | A validar com sócios e builders |
| ASS-PX-06 | Forced reflection moments (RN-015) são aceitos como proteção, não fricção, especialmente por PX-05 e PX-02 | Adoção cai; risco de virar feature ignorada | A validar via A/B testing no Piloto |

### 6.2. Informações Adicionais Necessárias

| Lacuna | O que Falta | Como Obter |
|--------|-------------|------------|
| Confirmação de PX-05 como persona separada | Decisão formal de PM + Sponsor sobre dimensão de proteção a juniors | Heitor + Bruno Prosperi |
| Definições por área de júnior/pleno/sênior | Critérios para acionar track de onboarding correto (RN-017) | Bruno Prosperi (criação), Takai (mídia), demais sócios — PA-09 |
| Builders como persona separada (PX-06?) | Confirmar se papel cultural específico de builder (cross-grupo, identificação de oportunidades, treinamento informal) merece tratamento próprio | Heitor + Yuri |
| Validação de PX-02 vs. PX-04 | Confirmar que perfis criativos seniores (PX-02) e planners (PX-04) têm jobs suficientemente diferentes para personas separadas | Sergio Katz + Bruno Prosperi |
| KPIs de negócio adicionais por persona | Lista exaustiva de KPIs que cada persona é cobrada (atualmente proposta mas não validada) | RH + sócios das áreas |

---

## Histórico de Versões

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | 2026-04-28 | Heitor Miranda + Claude (assistido) | Versão inicial. **5 Personas (PX-01 a PX-05)** com perfil, KPIs, ferramentas atuais, dores, oportunidades, JTBDs verificáveis ("When X, I want to Y, so that Z"), critérios de sucesso e mapeamento para Features (FA-XX) e BRs (BR-XXX). PX-01 a PX-04 derivadas do FRD Moon Shot (referenciado nos BRDs Parte 3 e 4). PX-05 (Creator Junior) adicionada para preencher lacuna de cobertura única de BR-012 (UX por carreira) e endereçar risco de over-reliance documentado em research foundation (Microsoft Research / MIT Media Lab 2025). Vocabulário Suno aplicado (Devorar, Provocar, Faísca, Brasa, Caixa-preta, Bioma Zero/Job); anti-patterns evitados |
| 1.1 | 2026-04-28 | **+1 Persona**: PX-06 Aprovador Sócio (papel funcional, não cargo novo) com 5 JTBDs (JTBD-30 a JTBD-34). Pedido Guga + Bruno Prosperi para FA-13 Aprovação Hierárquica. Total agora: **6 Personas / 34 JTBDs**. Anti-rubber-stamping (RN-024) é princípio central da PX-06 |
