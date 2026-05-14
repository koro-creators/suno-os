---
documento: PRD Parte 1 — Feature Map
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
fonte_frd: docs/specs/large/{knowledge-biblioteca-v2,sunohub-tools-integration,workflow-builder,image-editor,video-generation,ux-redesign}/, FRD Shoot for the Moon (externo, referenciado)
total_features: 12 macro features (FA-01 a FA-12) com 41 subfeatures
---

# PRD Parte 1 — Feature Map

## 1. Introdução

### 1.1. Visão Geral do Produto

O **sunOS** é o sistema operacional de IA da Suno United Creators — plataforma interna unificada que organiza skills de IA, Biblioteca de conhecimento, Workflows automatizados, agentes ReAct, motor de provocação criativa (Shoot for the Moon) e governança institucional num único produto, navegado pela metáfora visual de Sistema Solar (clientes como Planetas, Skills como Órbitas, Moons como sub-áreas). É 100% interno, destinado a ~300 Creators do grupo United Creators (Suno, Paim, Revo, Koro, Ludi, etc.).

O problema de fundo é a **Inteligência Coletiva fragmentada**: hoje, o repertório, os cases, os briefings e o know-how operacional vivem em e-mails, drives e cabeças de pessoas que podem sair amanhã. O sunOS transforma essa dispersão em **patrimônio compartilhado e acionável** por qualquer Creator, com governança, proteção de IP (Caixa-preta) e accountability mensurável de impacto. Em paralelo, oferece capacidade ativa de **Provocar** ideias inesperadas para combater a homogeneização criativa coletiva documentada em pesquisa recente sobre uso de IA em ideação.

O valor entregue é triplo: (a) **Devorar** o briefing e Provocar Faíscas inesperadas onde antes havia bloqueio criativo (Shoot for the Moon); (b) **acelerar** tarefas processuais recorrentes (reports, planos, análises, briefings) preservando contexto de cada cliente; (c) **demonstrar** continuamente, ao Sponsor e à Diretoria, evidências de custo evitado, qualidade percebida e impacto em campanhas — sustentando a continuidade do investimento e o posicionamento de agência ambidestra (criatividade + tech) frente a holdings, consultorias e agências AI-native.

### 1.2. Objetivo deste Documento

Este documento organiza o sunOS em **features de alto nível (FA-XX)**, orientadas a valor de negócio, servindo como base para:

- **UX/IA**: Arquitetura de informação e navegação (Sistema Solar, Admin areas, Chat, Workflows)
- **Engenharia**: Mapeamento de serviços, APIs, agentes LangGraph, integrações Vertex AI/Firebase
- **Produto**: Priorização e roadmap por fases (POC, Protótipo, Piloto, MVP)
- **Arquitetura**: Definição de domínios (Skills, Biblioteca, Workflows, Provocação, Governança)
- **PM/Tech Lead**: Fonte para decompor em FRs (Parte 4 do PRD), backlog e sprints

### 1.3. Relação com Outros Artefatos

| Artefato | Relação |
|----------|---------|
| BRD Parte 1 (Contexto) | Features derivam dos 5 OBJ de negócio e 7 capacidades §4.2 |
| BRD Parte 2 (Glossário) | Vocabulário oficial — Devorar/Provocar/Faísca/Brasa, Skill, Moon, Biblioteca, Sistema Solar, Caixa-preta, Bioma Zero/Job/Agentic |
| BRD Parte 3 (BR-001 a BR-016) | Cada FA-XX rastreia ≥1 BR; matriz de cobertura no §4.3 deste doc |
| BRD Parte 4 (RN-001 a RN-022) | Cada FA-XX implementa as RNs aplicáveis; FRs detalharão como na Parte 4 do PRD |
| PRD Parte 2 (Personas + JTBD) | Cada FA-XX serve ≥1 persona e ≥1 JTBD |
| PRD Parte 3 (Matriz Persona×Jornada) | Features aparecem nas jornadas JN-XX |
| PRD Parte 4 (FRs FR-XXX) | Features são decompostas em requisitos funcionais |
| PRD Parte 5 (Roadmap) | Features distribuídas em POC → Protótipo → Piloto → MVP |
| PRODUCT_HANDOFF.md | Fonte do estado atual de implementação por feature |
| FRDs / SPECs SDD | SPEC-001 a SPEC-007 já implementam parcialmente FA-04, FA-05, FA-06, FA-08; FRD Shoot for the Moon detalha FA-02 |

---

## 2. Visão Geral das Features

### 2.1. Lista Resumida

| ID | Feature | Descrição Curta | Fase Alvo |
|----|---------|-----------------|-----------|
| **FA-01** | Biblioteca (Inteligência Coletiva) | Repositório institucional unificado e curado — base de conhecimento multimodal por escopo (Suno + cliente), invisível para perfis Operacionais, alimenta Skills e Shoot for the Moon | Piloto (v2 já em Protótipo) |
| **FA-02** | Shoot for the Moon (Provocação Criativa) | Motor de serendipidade que Devora o briefing e Provoca Faíscas inesperadas via loop multi-agente Explorer↔Crítico, calibrado pela zona Sweet Spot de bisociação | POC |
| **FA-03** | Skills processuais com contexto automático | Catálogo de Skills (Copy Social, Plano de Mídia, Roteiro de Vídeo, Texto de Rádio, Persona Sintética, Brief Builder, Análise de Mercado, Report Performance) que injetam contexto de cliente da Biblioteca sem ação do operador | Piloto (já em Protótipo) |
| **FA-04** | Chat com Agentes ReAct (streaming SSE) | Interface conversacional com IA real (Gemini Flash default; GPT-4o, Claude, Imagen 4 alternativos), agentes ReAct (ContentCreator, VisualCreator, Conversational), multi-modelo por mensagem | Piloto (já em Produção) |
| **FA-05** | Workflows Automatizados | Engine LangGraph para automações encadeadas (reports, planos de mídia, monitoramento, pesquisa) com schedule (Cloud Scheduler), HITL gates, sub-workflows | Piloto (já em Produção) |
| **FA-06** | Sistema Solar (Navegação) | Metáfora visual proprietária — Sun (home) → Planeta (cliente) → Órbita (Skill) → Moon (sub-área via chips) — em ≤3 cliques até o valor | MVP (já em Produção, SPEC-007) |
| **FA-07** | HITL Feedback (Curadoria Contínua) | Avaliação humana por mensagem (thumbs + comentário) e por sessão (rating 1-5), painel lateral, base para evolução de Skills e detecção de qualidade percebida | Piloto (já em Produção) |
| **FA-08** | Geração e Edição Multimodal (Imagem/Vídeo) | Image generation (Vertex AI Imagen 4 / Nano Banana), Image editing (inpainting/outpainting/enhance — Phase 16), Video generation (Veo 3.0/3.1 T2V e I2V — Phase 16) | Piloto / MVP |
| **FA-09** | Governança, RBAC e Caixa-preta | Modelo de 3 perfis (Admin / Líder / Operacional), ocultação da Biblioteca para Operacional, isolamento de contexto entre clientes, auditoria de acessos administrativos | Piloto (parcialmente em Produção) |
| **FA-10** | Mensuração, Observabilidade e Custo Evitado | Tracing 100% via MLflow, dashboard executivo mensal, cálculo de custo evitado por execução de Skill, KPIs de negócio (win rate, retenção, shortlist rate) | Piloto |
| **FA-11** | Safety Cultural & Ownership Criativo | Marcação visual de outputs como "estímulo" / "provocação", forced reflection moments, tracks de onboarding por estágio de carreira, validação de vocabulário UI contra Glossário, monitor mensal de homogeneização coletiva (3 métricas) | Piloto |
| **FA-12** | Admin areas (CRUD configurável) | CRUD de Skills, Biblioteca, Clientes, Workflows com pattern Model Repo (table view + filter sidebar + drawer), Auth Google + RBAC Firebase | MVP (já em Produção) |

### 2.2. Síntese por Fase

| Fase | Features | Objetivo da Fase |
|------|----------|------------------|
| **POC** | FA-02 (Shoot for the Moon — pipeline Explorer↔Crítico em ambiente controlado) | Validar viabilidade técnica do motor de Provocação e calibrar zona Sweet Spot de bisociação com 3+ Creators seniores em testes blind |
| **Protótipo** | FA-01 (Biblioteca v2 com upload + pgvector), FA-03 (Skills com context injection), FA-04 (Chat real Gemini), FA-06 (Sistema Solar 3 níveis), FA-07 (HITL), FA-12 (Admin Model Repo pattern) | Testar fluxos principais com 5-10 Creators internos, em ambiente local + staging |
| **Piloto** | Todas as anteriores + FA-05 (Workflows com schedule), FA-08 (Image gen real), FA-09 (RBAC + Caixa-preta), FA-10 (MLflow + dashboard), FA-11 (Safety cultural), FA-02 em uso real | Validar no contexto real com champions (Gus/Teda em Mídia, Le em outras áreas) — meta 10+ UAS, 50+ msgs/sem, score HITL > 4.0 |
| **MVP** | Todas + refinamentos + FA-08 (Video gen Veo 3.1) + cobertura ≥10 tarefas-alvo automatizadas | Produto em produção contínua, business case aprovado pela Diretoria, ≥3 cases internos por trimestre |

### 2.3. Ecossistema de Features

As features formam três anéis concêntricos em torno do valor central de **Inteligência Coletiva** da Suno:

- **Anel 1 — Infraestrutura de conhecimento**: FA-01 (Biblioteca) é a base. Tudo o que o sunOS faz consome contexto da Biblioteca de forma transparente. Sem ela, Skills (FA-03) operam descontextualizadas e Shoot for the Moon (FA-02) não tem matéria-prima para Devorar.
- **Anel 2 — Capacidades de IA**: FA-02 (Provocação criativa) e FA-03 (Skills processuais) são os dois motores de valor — um divergente (modo serendipidade) e outro convergente (modo aceleração). Ambos chegam ao Creator via FA-04 (Chat) e FA-06 (Sistema Solar) e podem ser orquestrados em FA-05 (Workflows). FA-08 (Multimodal) amplia o repertório de outputs (texto → imagem → vídeo).
- **Anel 3 — Governança e cultura**: FA-07 (HITL), FA-09 (RBAC/Caixa-preta), FA-10 (Mensuração) e FA-11 (Safety cultural) garantem que o sistema operacional **funcione com integridade** — IP protegido, dados de cliente isolados, ownership criativo preservado, homogeneização monitorada, custo evitado mensurado. FA-12 (Admin) é o painel pelo qual líderes e Admins curam tudo.

O fluxo principal de uso é: Creator entra pelo Sun (FA-06) → escolhe um Planeta (cliente) → escolhe uma Órbita (Skill, FA-03) ou aciona o atalho Shoot for the Moon (FA-02) → conversa via Chat (FA-04) com contexto injetado da Biblioteca (FA-01) → avalia outputs via HITL (FA-07) → líder consolida em Workflows recorrentes (FA-05) — tudo sob RBAC (FA-09) e mensurado em MLflow (FA-10).

---

## 3. Feature Map Detalhado

### FA-01 — Biblioteca (Inteligência Coletiva)

#### Resumo da Feature

A Biblioteca é o **repositório institucional unificado** do sunOS — base de conhecimento multimodal compartilhada que consolida referências culturais, cases de clientes, briefings históricos, guidelines de marca, contexto de mercado, metodologias proprietárias da Suno e regras de negócio por cliente. Funciona como **infraestrutura invisível**: Líderes curam, plataforma consome via RAG (pgvector + indexação dual vetorial+grafo), e Operacionais nunca veem sua existência (Caixa-preta). A Biblioteca alimenta simultaneamente Skills processuais (modo convergente, FA-03) e Shoot for the Moon (modo divergente, FA-02), sem duplicação.

Resolve o problema central que o sunOS endereça: **Inteligência Coletiva fragmentada** — hoje conhecimento crítico vive em e-mails, drives e cabeças de pessoas que saem amanhã (turnover histórico do setor: ~30%/ano; Suno 2024: 18%). Atende prioritariamente o Líder/Curador (PX-01), que ganha controle de IP e governança de contexto; serve indiretamente todos os outros perfis, que recebem contexto sem precisar buscar manualmente.

#### Propósito e Escopo

**Inclui:**
- Ingestão multimodal (PDF, DOCX, TXT, áudio, vídeo, imagem) com processamento automático: transcrição (áudio/vídeo), caption (imagem), chunking + embeddings
- Curadoria humana com metadados obrigatórios (título, domínio, ≥2 tags, descrição ≥50 char, cliente associado quando aplicável)
- Indexação dual: vetorial (pgvector) + grafo de conhecimento
- Busca semântica via tool `search_knowledge` consumida por agentes ReAct
- Filtro por escopo (Suno global vs. cliente específico) + tags + tipo de arquivo
- Auto-seleção de contexto por scope/tags da Skill ativa
- Status de cliente (ativo/inativo) controla visibilidade no Sistema Solar mas preserva conteúdo
- Detecção de "conhecimento crítico em risco" (acessado/contribuído por uma única pessoa em 90 dias)

**Não Inclui:**
- Interface direta de consumo para Operacionais (BR-007 + RN-011 — Caixa-preta)
- Edição colaborativa em tempo real (não é Google Docs)
- Substituir CRMs ou ERPs do grupo (BR-016)
- Indexação de conteúdo confidencial de cliente sem aprovação explícita (BR-008)

#### Capacidades / Subfeatures

| ID | Capacidade | Descrição |
|----|------------|-----------|
| FA-01-01 | Upload e ingestão multimodal | Aceita PDF, DOCX, TXT, áudio, vídeo, imagem; processamento automático em background |
| FA-01-02 | Curadoria com metadados obrigatórios | Líder cadastra item em < 5 min; bloqueio se metadados incompletos (RN-006) |
| FA-01-03 | Indexação dual (vetorial + grafo) | pgvector para similarity search + grafo para retrieval divergente do Shoot for the Moon |
| FA-01-04 | Busca semântica via agente | Tool `search_knowledge` invocada por agentes durante chat e workflows |
| FA-01-05 | Escopo Suno vs. Cliente | Filtragem hierárquica; cliente sempre injeta também conteúdo Suno global |
| FA-01-06 | Visibilidade por status do cliente | Cliente inativo: oculta do Sistema Solar e retrievals padrão; Líder consegue busca explícita (RN-007) |
| FA-01-07 | Detecção de conhecimento em risco | Alerta para Líder + RH (futuro) quando conteúdo crítico tem único contribuinte em 90 dias (RN-008) |
| FA-01-08 | Política de retenção LGPD | Logs e dados pessoais conforme política aprovada pela Diretoria (RN-013) |

#### Personas e Objetivos Atendidos

| Persona | Objetivo / Job-to-be-done | Jornadas |
|---------|---------------------------|----------|
| PX-01 Líder/Curador | Curar e governar o repertório institucional, garantir continuidade pós-turnover | JN-01 (curadoria), JN-05 (offboarding) |
| PX-02 Criativo Sênior | Receber contexto de cliente automaticamente sem buscar em drives | JN-02 (ideação contextualizada) |
| PX-03 Operador Processual | Consumir contexto via Skills sem precisar saber que a Biblioteca existe | JN-03 (execução de tarefa) |
| PX-04 Planejamento Estratégico | Acessar benchmarks de mercado e cases históricos para análises | JN-04 (análise estratégica) |

#### Relação com BRD

| Tipo | IDs | Descrição Resumida |
|------|-----|-------------------|
| **BRs** | BR-004 (primário), BR-005, BR-006, BR-007, BR-008, BR-015 | Repositório unificado, continuidade pós-turnover, acesso democrático mediado, proteção de IP, privacidade entre clientes, integração com Skills |
| **RNs** | RN-006, RN-007, RN-008, RN-010, RN-011, RN-013, RN-021 | Validação de metadados, visibilidade por status, detecção de risco, isolamento entre clientes, ocultação para Operacional, retenção LGPD, hierarquia de truncamento |

#### Objetos de Domínio Envolvidos

| Objeto | Descrição | Papel na Feature |
|--------|-----------|------------------|
| KnowledgeItem | Item da Biblioteca (PDF, áudio, vídeo, imagem, texto) com metadados | Entidade central |
| Scope | Escopo do item (Suno global ou client_slug) | Controle de visibilidade e retrieval |
| Tag | Categoria livre por item | Filtragem e auto-seleção |
| Embedding | Vetor pgvector por chunk | Busca semântica |
| KnowledgeGraph | Grafo de relações entre items | Retrieval divergente para Shoot for the Moon |
| Client | Cliente da Suno (status ativo/inativo) | Modula visibilidade |
| AccessLog | Log de acesso/contribuição por usuário | Detecção de risco |

#### Fase e Prioridade

| Fase | Escopo | Justificativa |
|------|--------|---------------|
| **POC** | (não aplicável — depende de POC do Shoot for the Moon para validar consumo divergente) | — |
| **Protótipo** | FA-01-01 a FA-01-05 (upload + curadoria + busca semântica + escopos) — já implementado em SPEC-002 (knowledge-biblioteca-v2) | Base para qualquer Skill funcionar com contexto real |
| **Piloto** | + FA-01-06, FA-01-07 (detecção de risco), FA-01-08 (política LGPD aprovada) | Necessário para uso real com clientes ativos |
| **MVP** | ≥500 itens curados, curadoria contínua sustentada, zero conhecimento crítico vivendo em uma única pessoa | Critério de aceite BR-004 e BR-005 |

#### Dependências

| Feature | Tipo de Dependência | Criticidade |
|---------|---------------------|-------------|
| FA-09 (Governança/RBAC) | Operacional — Caixa-preta exige RBAC funcionando | Alta |
| FA-10 (Mensuração) | Dados — AccessLog alimenta detecção de risco e auditoria | Média |
| FA-12 (Admin areas) | UX — CRUD da Biblioteca vive no Admin | Alta |

---

### FA-02 — Shoot for the Moon (Provocação Criativa)

#### Resumo da Feature

Shoot for the Moon é o **motor de serendipidade criativa** do sunOS — capacidade que **Devora** o briefing do Creator e **Provoca Faíscas** inesperadas combinando conceitos de domínios distantes para combater a homogeneização criativa coletiva documentada em pesquisa recente (Doshi & Hauser, Science Advances 2024; Padmakumar & He, ICLR 2024 — leveling-up illusion). É o coração da diferenciação do sunOS frente a ferramentas genéricas de IA: aqui a IA **provoca, não gera** — outputs são **estímulo/Brasa** para o Creator, nunca peça final.

A arquitetura interna é um loop multi-agente Explorer↔Crítico calibrado pela zona Sweet Spot de bisociação (cosseno 0.5–0.85): provocações triviais são descartadas (zona "óbvio"), provocações sem ponte de sentido também (zona "incoerente"), e apenas as moderadamente surpreendentes mas mappeáveis chegam ao Creator. Acessível em ≤3 cliques a partir de qualquer Planeta — princípio "Botão da criatividade, não do desespero".

#### Propósito e Escopo

**Inclui:**
- Pipeline Explorer↔Crítico com 3 dimensões de avaliação (Novidade × Coerência × Potencial Criativo)
- Filtragem por zona de bisociação (Sweet Spot por padrão; Adjacente / Equilibrado / Radical configuráveis)
- Acionamento contextual a partir de Cliente ativo + briefing/tema em sessão
- Personas dos agentes refletindo identidade brasileira (A Antropófaga, O Carnavalesco, A Anciã — research foundation)
- Modo "dupla de criação" com time-boxing (90s in / 5min human / repeat)
- Modo "Tenho uma ideia, me prova que tá errada" (devil's advocate, senior-leaning)
- Modo "Estou começando uma ideia" (divergente, junior-leaning)
- Marcação visual de outputs como "Faísca" / "estímulo" (RN-014)
- Forced reflection moments após N stars (RN-015)

**Não Inclui:**
- Geração de peças finais para publicação (princípio fundador: provoca, não gera)
- Substituição de Skills processuais (Shoot for the Moon é divergente; Skills FA-03 são convergentes)
- Inspiração genérica desconectada do contexto do cliente (sempre puxa Biblioteca via FA-01)

#### Capacidades / Subfeatures

| ID | Capacidade | Descrição |
|----|------------|-----------|
| FA-02-01 | Pipeline Explorer↔Crítico | Loop multi-agente com convergência por score médio ≥ 8 (RN-002) |
| FA-02-02 | Filtragem por zona de bisociação | Sweet Spot (cosseno 0.5–0.85) por padrão; expansão sob demanda explícita (RN-001) |
| FA-02-03 | Acionamento contextual ≤3 cliques | Botão acessível em qualquer tela de Skill/Cliente (RN-003) |
| FA-02-04 | Personas brasileiras dos agentes | Antropófaga, Carnavalesco, Anciã — vetor cultural |
| FA-02-05 | Modo dupla de criação | Time-boxing 90s IA / 5min humano / repeat |
| FA-02-06 | Modos de entrada por estágio | "Começando uma ideia" (junior) vs. "Me prova que tá errada" (sênior) |
| FA-02-07 | Marcação Faísca/Brasa | Output sempre visualmente marcado como estímulo |
| FA-02-08 | Forced reflection após N stars | Interrupção cognitiva após 5 aprovações (3 para júnior) — RN-015 |

#### Personas e Objetivos Atendidos

| Persona | Objetivo / Job-to-be-done | Jornadas |
|---------|---------------------------|----------|
| PX-02 Criativo Sênior (primário) | Romper bloqueios criativos sem perder ownership autoral | JN-02 (ideação), JN-06 (devil's advocate) |
| PX-04 Planejamento Estratégico (primário) | Conectar insights de mercado a territórios criativos não-óbvios | JN-04 (análise), JN-06 |
| PX-05 Creator Junior (beneficiário com proteção) | Aprender a explorar territórios divergentes sem over-reliance | JN-02 com track junior |

#### Relação com BRD

| Tipo | IDs | Descrição Resumida |
|------|-----|-------------------|
| **BRs** | BR-001 (primário), BR-010, BR-011, BR-014 | Provocação criativa anti-homogeneização, ownership criativo, cultura brasileira, detecção de homogeneização coletiva |
| **RNs** | RN-001, RN-002, RN-003, RN-014, RN-015, RN-019, RN-020 | Filtragem por zona, convergência multi-agente, acionamento contextual, marcação visual, forced reflection, mensuração mensal de homogeneização, bloqueio de relatório com satisfação isolada |

#### Objetos de Domínio Envolvidos

| Objeto | Descrição | Papel na Feature |
|--------|-----------|------------------|
| Brief | Briefing/tema do Creator | Input do pipeline |
| Provocation | Faísca gerada pelo Explorer | Saída avaliada pelo Crítico |
| BisociationZone | Classificação por distância semântica | Filtragem |
| AgentPersona | Identidade do agente (Antropófaga, etc.) | Vetor cultural |
| Star | Aprovação humana de provocação | Trigger de forced reflection |
| DiversityMetric | Mean Pairwise Cosine Distance, Self-BLEU, Compression Ratio | Mensuração coletiva |

#### Fase e Prioridade

| Fase | Escopo | Justificativa |
|------|--------|---------------|
| **POC** | FA-02-01, FA-02-02 (pipeline mínimo + filtragem por zona) com 3+ Creators seniores em testes blind | Critério de aceite BR-001: ≥60% das provocações classificadas como úteis |
| **Protótipo** | + FA-02-03, FA-02-04, FA-02-07 (acionamento, personas, marcação) | Validação de UX com 5-10 Creators |
| **Piloto** | + FA-02-05, FA-02-06, FA-02-08 (modos completos + forced reflection); operação real com champions | ≥70% de aprovação por Creators em uso real |
| **MVP** | Calibração contínua de zonas; dataset de provocações aprovadas evoluindo Eval | Sustentação de qualidade pós-Piloto |

#### Dependências

| Feature | Tipo de Dependência | Criticidade |
|---------|---------------------|-------------|
| FA-01 (Biblioteca) | Dados — Devora contexto de cliente para Provocar | Alta |
| FA-04 (Chat) | UX — pipeline roda dentro da interface conversacional | Alta |
| FA-10 (Mensuração) | Dados — DiversityMetric depende de tracing | Alta (para RN-019/020) |
| FA-11 (Safety cultural) | Operacional — marcação visual e forced reflection vivem aqui mas são padrão transversal | Alta |

---

### FA-03 — Skills processuais com contexto automático

#### Resumo da Feature

Catálogo de **Skills configuráveis** que executam tarefas processuais recorrentes (Copy Social, Plano de Mídia, Roteiro de Vídeo, Texto de Rádio, Persona Sintética, Brief Builder, Análise de Mercado, Report Performance) com **contexto de cliente injetado automaticamente** da Biblioteca (FA-01), sem ação do operador. Cada Skill tem nome, descrição, system prompt proprietário (Caixa-preta), modelo de IA preferencial, temperatura, Moons (sub-áreas) e referências curadas. Hoje há 8 Skills configurados em produção.

É o motor convergente do sunOS — o oposto polar do Shoot for the Moon (divergente). Atende prioritariamente o Operador Processual (PX-03), que precisa entregar relatório/plano/copy com qualidade e contexto sem reconstruir tudo a cada interação. Critério-chave: redução de tempo médio ≥30% em ≥10 tarefas-alvo até final do Piloto, sem regressão de qualidade percebida.

#### Propósito e Escopo

**Inclui:**
- 8 Skills atuais (Copy Social, Texto de Rádio, Roteiro de Vídeo, Plano de Mídia, Report Performance, Persona Sintética, Brief Builder, Análise de Mercado)
- Estrutura para criação de novas Skills via Admin (FA-12)
- Moons (sub-áreas) por Skill com herança de comportamento (ex: Copy Social → Feed/Carrossel, Stories/Reels, X/Twitter)
- Context injection transparente da Biblioteca por scope/tags
- System prompts versionados (history)
- Score por Skill alimentado por HITL (FA-07)
- Hierarquia de truncamento de contexto (RN-021): Regras de negócio do cliente sempre incluídas

**Não Inclui:**
- Geração não-contextualizada (Skill sem cliente associado opera com contexto Suno global apenas)
- Refatoração de Skills existentes ao integrar Biblioteca (BR-015 — zero refatoração de prompts originais)
- Edição colaborativa em tempo real do system prompt (apenas Admin/Líder via FA-12)

#### Capacidades / Subfeatures

| ID | Capacidade | Descrição |
|----|------------|-----------|
| FA-03-01 | Catálogo de 8 Skills atuais | Copy Social, Texto de Rádio, Roteiro de Vídeo, Plano de Mídia, Report Performance, Persona Sintética, Brief Builder, Análise de Mercado |
| FA-03-02 | Context injection transparente | Skill puxa contexto da Biblioteca por scope/tags sem ação do operador |
| FA-03-03 | Moons (sub-áreas configuráveis) | Variações dentro de uma Skill (chips no PromptTemplateBar) |
| FA-03-04 | Hierarquia de truncamento | Regras de negócio do cliente (peso 1.0) sempre presentes; descarta supérfluo primeiro (RN-021) |
| FA-03-05 | System prompts versionados | History de mudanças no prompt da Skill |
| FA-03-06 | Score HITL por Skill | Média de avaliações alimenta SkillCard |
| FA-03-07 | Avaliação mensal de redução de tempo | Skill saudável = ≥30% redução por 3+ meses; senão revisão (RN-004) |

#### Personas e Objetivos Atendidos

| Persona | Objetivo / Job-to-be-done | Jornadas |
|---------|---------------------------|----------|
| PX-03 Operador Processual (primário) | Executar tarefas processuais com contexto preservado em menos tempo | JN-03 (execução) |
| PX-02 Criativo Sênior | Refinar drafts gerados sem perder ownership | JN-02 (ideação), JN-03 |
| PX-04 Planejamento Estratégico | Análises de mercado e Persona Sintética com contexto histórico | JN-04 |
| PX-01 Líder/Curador | Configurar e governar Skills via Admin (FA-12) | JN-01 (curadoria) |

#### Relação com BRD

| Tipo | IDs | Descrição Resumida |
|------|-----|-------------------|
| **BRs** | BR-002 (primário), BR-006, BR-015 | Aceleração operacional, acesso democrático ao conhecimento, integração com Skills |
| **RNs** | RN-004, RN-021, RN-010 | Avaliação mensal de redução de tempo, hierarquia de truncamento, isolamento entre clientes |

#### Objetos de Domínio Envolvidos

| Objeto | Descrição | Papel na Feature |
|--------|-----------|------------------|
| Skill | Capacidade de IA configurável | Entidade central |
| Moon | Sub-área de Skill | Variação configurável |
| SystemPrompt | Instrução-base versionada | DNA da Skill (Caixa-preta) |
| ModelConfig | Modelo + temperatura preferenciais | Configuração técnica |
| ContextDocument | Item da Biblioteca consumido por Skill | Injeção transparente |
| SkillScore | Média HITL agregada | Saúde da Skill |
| TimeBaseline | Tempo manual da tarefa equivalente | Cálculo de custo evitado |

#### Fase e Prioridade

| Fase | Escopo | Justificativa |
|------|--------|---------------|
| **POC** | (não aplicável — Skills já em produção) | — |
| **Protótipo** | FA-03-01 a FA-03-03 + FA-03-05 já em produção | Base operacional |
| **Piloto** | + FA-03-04 (hierarquia de truncamento), FA-03-06 (score real), FA-03-07 (avaliação mensal); cobertura ≥10 tarefas-alvo | Critério BR-002 |
| **MVP** | ≥80% das Skills com redução ≥30% sustentada por 3+ meses | Critério RN-004 |

#### Dependências

| Feature | Tipo de Dependência | Criticidade |
|---------|---------------------|-------------|
| FA-01 (Biblioteca) | Dados — context injection | Alta |
| FA-04 (Chat) | UX — Skills consumidas via chat | Alta |
| FA-07 (HITL) | Dados — Score alimenta saúde | Alta |
| FA-09 (RBAC) | Operacional — Caixa-preta protege system prompts | Alta |
| FA-12 (Admin) | UX — CRUD de Skills | Alta |

---

### FA-04 — Chat com Agentes ReAct (streaming SSE)

#### Resumo da Feature

Interface conversacional com **IA real** (Gemini Flash default; GPT-4o, Claude e Imagen 4 como alternativas configuráveis), agentes ReAct (ContentCreator, VisualCreator, Conversational) e streaming via SSE para reduzir percepção de latência. É o ponto de contato primário entre Creator e o sunOS — toda Skill processual e o Shoot for the Moon chegam ao usuário através do Chat.

Inclui ModelSelector (troca de modelo por mensagem), ChatInput com auto-resize e Shift+Enter, PromptTemplateBar com Moon chips, Social Preview (Instagram para Copy Social), variações automáticas (3 opções), ResultActions (copiar/variar/salvar/thumbs), MessageBubble com syntax highlighting e StreamingIndicator com nome do modelo ativo. Já em produção; expansão prevista para Chat Attachments (SPEC-006, ainda não implementado).

#### Propósito e Escopo

**Inclui:**
- Chat contextualizado por cliente + skill + moon
- Streaming SSE em tempo real
- ModelSelector multi-modelo por mensagem
- Prompt Templates com Moon chips
- Social Preview (Instagram para Copy Social)
- Variações automáticas (3 opções)
- Agentes ReAct: ContentCreator, VisualCreator, Conversational
- HITL inline (thumbs + comentário) — ver FA-07
- Context Sidebar com seções colapsíveis (Biblioteca, Agentes, Validação HITL)
- Chat Attachments (SPEC-006, planejado)

**Não Inclui:**
- Persistência de conversas entre sessões (débito técnico P1, conforme handoff)
- Edição direta da Biblioteca pelo chat (apenas leitura)
- Modificação do system prompt da Skill pelo chat (apenas Admin, FA-12)

#### Capacidades / Subfeatures

| ID | Capacidade | Descrição |
|----|------------|-----------|
| FA-04-01 | Streaming SSE multi-modelo | Resposta em tempo real palavra por palavra |
| FA-04-02 | ModelSelector por mensagem | Trocar Gemini Flash, Pro, GPT-4o, Claude |
| FA-04-03 | Agentes ReAct | ContentCreator (texto), VisualCreator (imagem), Conversational |
| FA-04-04 | Prompt Templates com Moon chips | Templates pré-configurados com Moons como chips selecionáveis |
| FA-04-05 | Social Preview | Renderização Instagram (carousel, stories, post) para Copy Social |
| FA-04-06 | Variações automáticas | 3 opções comparativas |
| FA-04-07 | Context Sidebar | Painel direito com Biblioteca, Agentes, Validação HITL |
| FA-04-08 | Chat Attachments [Inferido — SPEC-006 planejado] | Upload de arquivos no chat (paperclip + chips) |

#### Personas e Objetivos Atendidos

| Persona | Objetivo / Job-to-be-done | Jornadas |
|---------|---------------------------|----------|
| PX-02 Criativo Sênior | Conversar com IA preservando contexto e ownership | JN-02, JN-03 |
| PX-03 Operador Processual (primário) | Executar tarefas com IA via interface conversacional | JN-03 |
| PX-04 Planejamento Estratégico | Iterar análises com agente Conversational | JN-04 |
| PX-05 Creator Junior | Aprender a interagir com IA com proteção de over-reliance | JN-02 com track junior |

#### Relação com BRD

| Tipo | IDs | Descrição Resumida |
|------|-----|-------------------|
| **BRs** | BR-002, BR-006, BR-015 | Aceleração via interface, acesso democrático, integração com Skills |
| **RNs** | RN-014, RN-015, RN-021 | Marcação visual de outputs IA, forced reflection, hierarquia de truncamento |

#### Objetos de Domínio Envolvidos

| Objeto | Descrição | Papel na Feature |
|--------|-----------|------------------|
| ChatSession | Sessão de chat com cliente + skill + moon ativos | Container de mensagens |
| Message | Mensagem individual (user/assistant) | Unidade de troca |
| Agent | Instância ReAct (ContentCreator, etc.) | Executor |
| ModelChoice | Modelo ativo na mensagem | Configuração |
| Variation | Opção alternativa de output | Comparação |
| Attachment | Arquivo anexado [SPEC-006] | Input contextual |

#### Fase e Prioridade

| Fase | Escopo | Justificativa |
|------|--------|---------------|
| **POC** | (não aplicável — chat real já em produção desde SPEC-001) | — |
| **Protótipo** | FA-04-01 a FA-04-07 já em produção | Base operacional |
| **Piloto** | + persistência de conversas (débito P1), Chat Attachments (SPEC-006) | UX completa |
| **MVP** | + Cmd+K busca global, Sidebar recentes dinâmico (P2/P3 do handoff) | UX refinada |

#### Dependências

| Feature | Tipo de Dependência | Criticidade |
|---------|---------------------|-------------|
| FA-03 (Skills) | Operacional — toda Skill chega via Chat | Alta |
| FA-02 (Shoot for the Moon) | Operacional — pipeline roda no Chat | Alta |
| FA-01 (Biblioteca) | Dados — context injection | Alta |
| FA-07 (HITL) | UX — feedback inline vive aqui | Alta |
| FA-08 (Multimodal) | Operacional — VisualCreator gera imagem via Chat | Média |

---

### FA-05 — Workflows Automatizados

#### Resumo da Feature

**Engine LangGraph** que combina Skills, Tools e validações humanas (HITL) em fluxos executados por agendamento (Cloud Scheduler) ou disparo manual. Cada Workflow é uma sequência de steps (tool, LLM, condição, ação, HITL) que compila para LangGraph StateGraph. Suporta encadeamento (sub-workflows, SPEC-004) e schedule humanizado ("Toda segunda às 9h"). Já em produção (SPEC-003) com 4 templates pré-configurados.

Resolve a necessidade de **automação de tarefas recorrentes** sem dependência de squad dedicado (BR-002): time de 4 devs não escala se cada automação depender deles. Workflows empoderam analistas de mídia, BI, financeiro e champions a configurar steps com tools compartilhadas. Atende prioritariamente PX-01 (Líder/Curador) e PX-03 (Operador Processual).

#### Propósito e Escopo

**Inclui:**
- Builder visual com steps configuráveis (tool, LLM, condição, ação, HITL gate)
- Compilação para LangGraph StateGraph
- Agendamento via Cloud Scheduler (cron humanizado)
- Encadeamento (um Workflow chama outro como sub-workflow — SPEC-004)
- Templates pré-configurados: Report Mensal, Plano de Mídia, Monitor de Anomalias, Pesquisa de Mercado
- Histórico de execuções com timeline + logs por step
- HITL gates que pausam para revisão humana
- Integração com ferramentas externas via API/webhook (RN-022)

**Não Inclui:**
- Drag-and-drop visual de composição de agentes (ADR-001 — não é esse o escopo)
- Substituir orquestradores de mercado (Zapier, n8n) — sunOS é camada acima, não substituto (BR-016, RN-022)
- Execução de Workflows críticos sem HITL para decisões de alto impacto

#### Capacidades / Subfeatures

| ID | Capacidade | Descrição |
|----|------------|-----------|
| FA-05-01 | Builder visual de steps | Configuração sequencial sem código |
| FA-05-02 | Compilação LangGraph StateGraph | Engine de execução |
| FA-05-03 | Schedule via Cloud Scheduler | Cron humanizado |
| FA-05-04 | Encadeamento (sub-workflows) | SPEC-004 |
| FA-05-05 | 4 Templates pré-configurados | Report Mensal, Plano de Mídia, Monitor de Anomalias, Pesquisa de Mercado |
| FA-05-06 | HITL gates | Pausa para revisão humana em decisões críticas |
| FA-05-07 | Histórico de execuções | Timeline + logs por step |
| FA-05-08 | Integração via API/webhook | Saída para Sprinklr, Adobe, etc. (RN-022) |

#### Personas e Objetivos Atendidos

| Persona | Objetivo / Job-to-be-done | Jornadas |
|---------|---------------------------|----------|
| PX-01 Líder/Curador | Empoderar área com automação sem depender de eng | JN-01, JN-07 (configuração de Workflow) |
| PX-03 Operador Processual (primário) | Configurar Workflows recorrentes para tarefas repetitivas | JN-07 |
| PX-04 Planejamento Estratégico | Pesquisa de mercado e Report como Workflow agendado | JN-04, JN-07 |

#### Relação com BRD

| Tipo | IDs | Descrição Resumida |
|------|-----|-------------------|
| **BRs** | BR-002 (primário), BR-013, BR-016 | Aceleração via automação, mensuração de custo evitado, coexistência com ferramentas |
| **RNs** | RN-004, RN-018, RN-022 | Avaliação mensal de redução de tempo, cálculo de custo evitado, avaliação de duplicidade vs. mercado |

#### Objetos de Domínio Envolvidos

| Objeto | Descrição | Papel na Feature |
|--------|-----------|------------------|
| Workflow | Definição de fluxo (steps + schedule) | Entidade central |
| Step | Unidade do fluxo (tool/LLM/condição/ação/HITL) | Bloco configurável |
| Schedule | Cron de execução | Trigger temporal |
| Execution | Instância de execução de um Workflow | Histórico |
| HITLGate | Step que pausa para humano | Controle de qualidade |
| SubWorkflow | Workflow chamado dentro de outro (SPEC-004) | Modularidade |

#### Fase e Prioridade

| Fase | Escopo | Justificativa |
|------|--------|---------------|
| **POC** | (não aplicável — já em produção desde SPEC-003) | — |
| **Protótipo** | FA-05-01 a FA-05-07 já em produção | Base operacional |
| **Piloto** | + FA-05-08 (integrações externas), schedule funcionando em Cloud Scheduler real | Operação com clientes |
| **MVP** | 5+ Workflows ativos com schedule (KPI proposto) | Critério Parte 1 §2.3 |

#### Dependências

| Feature | Tipo de Dependência | Criticidade |
|---------|---------------------|-------------|
| FA-03 (Skills) | Operacional — Workflows orquestram Skills | Alta |
| FA-01 (Biblioteca) | Dados — tool `search_knowledge` em steps | Alta |
| FA-09 (RBAC) | Operacional — quem pode criar/executar | Alta |
| FA-10 (Mensuração) | Dados — tracing de execuções | Alta |
| FA-12 (Admin) | UX — CRUD vive em /workflows | Alta |

---

### FA-06 — Sistema Solar (Navegação)

#### Resumo da Feature

Metáfora visual proprietária de navegação — **Sun (home `/`) → Planeta (cliente) → Órbita (Skill) → Moon (sub-área via chips)** em ≤3 níveis (após simplificação SPEC-007: Moon page eliminada, Moons agora são chips dentro da área de chat da Skill). Inspirada no manifesto Suno do Sol como símbolo de alinhamento. Inclui QuickStats bar e label "CLIENTES" (antes "BIOMAS" — clarificação de vocabulário).

É o ponto de entrada e a identidade visual do sunOS. Atende todos os perfis. Diferencia o sunOS de qualquer ferramenta genérica de IA — é o vetor cultural visível da Suno United Creators no produto. Restrição operacional: dados dos clientes no Sistema Solar são estáticos (`data/clients.ts`) e não refletem mudanças do Admin de Clientes (deliberado, ADR-002).

#### Propósito e Escopo

**Inclui:**
- Sun (home `/`)
- Planetas (clientes — Vivo, Americanas, Sicredi, MRV, Cogna, Suno, etc.)
- Órbitas (Skills disponíveis para o cliente)
- Moons como chips dentro da área de chat (SPEC-007)
- QuickStats bar
- Cor, tamanho proporcional ao volume de Skills do cliente
- Acessibilidade: ≤3 cliques até o valor

**Não Inclui:**
- Sincronização em tempo real com Admin de Clientes (deliberado — ADR-002)
- Drag-and-drop de Skills entre clientes (CRUD vive no Admin)
- Interface direta para a Biblioteca (Caixa-preta — RN-011)

#### Capacidades / Subfeatures

| ID | Capacidade | Descrição |
|----|------------|-----------|
| FA-06-01 | Sun (home) | Ponto de entrada com manifesto visual |
| FA-06-02 | Planetas (Clientes) | Visualização orbital com cor, tamanho proporcional |
| FA-06-03 | Órbitas (Skills) | Skills disponíveis para o cliente como anéis |
| FA-06-04 | Moon chips na área de chat | Sub-áreas selecionáveis no PromptTemplateBar (SPEC-007) |
| FA-06-05 | QuickStats bar | Estatísticas resumidas |
| FA-06-06 | Princípio ≤3 cliques | UX restrita a 3 níveis de navegação |

#### Personas e Objetivos Atendidos

| Persona | Objetivo / Job-to-be-done | Jornadas |
|---------|---------------------------|----------|
| Todas as personas | Navegar até a capacidade desejada em ≤3 cliques | Todas as jornadas (entrada) |

#### Relação com BRD

| Tipo | IDs | Descrição Resumida |
|------|-----|-------------------|
| **BRs** | BR-001 (acionamento ≤3 cliques), BR-006, BR-011 | Acionamento Shoot for the Moon, acesso democrático, cultura visual proprietária |
| **RNs** | RN-003, RN-011, RN-016 | Acionamento contextual, ocultação Biblioteca para Operacional, validação vocabulário |

#### Objetos de Domínio Envolvidos

| Objeto | Descrição | Papel na Feature |
|--------|-----------|------------------|
| Sun | Identidade central | Home |
| Planet | Cliente da Suno | Nó orbital |
| Orbit | Skill disponível para cliente | Anel orbital |
| Moon | Sub-área de Skill (chip) | Modificador de Skill |
| QuickStat | Estatística resumida exibida na barra | Métrica visível |

#### Fase e Prioridade

| Fase | Escopo | Justificativa |
|------|--------|---------------|
| **POC** | (não aplicável — já em produção) | — |
| **Protótipo** | FA-06-01 a FA-06-06 já em produção (após SPEC-007) | UX base |
| **Piloto** | + sincronização opcional com Admin de Clientes [Inferido — não decidido] | A validar |
| **MVP** | Refinamentos visuais e responsividade | UX refinada |

#### Dependências

| Feature | Tipo de Dependência | Criticidade |
|---------|---------------------|-------------|
| FA-04 (Chat) | UX — Sistema Solar leva ao Chat | Alta |
| FA-12 (Admin) | Dados — Clientes vêm do Admin (mas estáticos no SS por ADR-002) | Média |

---

### FA-07 — HITL Feedback (Curadoria Contínua)

#### Resumo da Feature

Sistema de **avaliação humana** dos outputs da IA em duas camadas: (1) **por mensagem** — thumbs up/down + comentário inline no chat; (2) **por sessão** — rating 1-5 estrelas. Painel de validação no sidebar do chat com progress bar, counters, status da sessão e histórico de feedbacks. Score por Skill alimentado por essas avaliações aparece nos SkillCards. Já em produção desde Phase 5; precisa de dados reais no Piloto.

Atende a necessidade de **curadoria contínua e dados para evolução dos agentes**. Sem HITL, a Eval (FA-10) não tem labels humanos; sem labels, scorers não calibram; sem calibração, qualidade não evolui. É o loop de feedback que sustenta toda a hipótese de qualidade do sunOS.

#### Propósito e Escopo

**Inclui:**
- Thumbs up/down por mensagem
- Comentário textual opcional por mensagem
- Rating 1-5 estrelas por sessão
- Painel de validação no sidebar do chat
- Histórico de feedbacks
- Score agregado por Skill (média)
- Forced reflection moments após N stars (RN-015) — feature ponte com FA-11

**Não Inclui:**
- Avaliação cega (blind testing) — escopo de pesquisa qualitativa, não produto
- Marketplace de prompts avaliados (não-escopo)
- Avaliação inter-pares de outputs entre Creators (não previsto)

#### Capacidades / Subfeatures

| ID | Capacidade | Descrição |
|----|------------|-----------|
| FA-07-01 | Thumbs + comentário inline | Avaliação por mensagem no Chat |
| FA-07-02 | Rating 1-5 por sessão | Avaliação ao final da sessão |
| FA-07-03 | Painel de validação sidebar | Progress bar, counters, status |
| FA-07-04 | Histórico de feedbacks | Visível por Skill / por usuário |
| FA-07-05 | Score agregado por Skill | Média alimenta SkillCard |
| FA-07-06 | Forced reflection (compartilhada com FA-11) | Interrupção cognitiva após N stars (RN-015) |

#### Personas e Objetivos Atendidos

| Persona | Objetivo / Job-to-be-done | Jornadas |
|---------|---------------------------|----------|
| PX-02, PX-03, PX-04 | Sinalizar qualidade percebida sem fricção | Todas as jornadas de uso |
| PX-01 Líder/Curador | Monitorar saúde de Skills e identificar drift de qualidade | JN-01, JN-08 (governança) |

#### Relação com BRD

| Tipo | IDs | Descrição Resumida |
|------|-----|-------------------|
| **BRs** | BR-003, BR-006, BR-010, BR-014 | Demonstração de ROI (qualidade percebida), acesso democrático, ownership criativo, detecção de homogeneização |
| **RNs** | RN-014, RN-015, RN-019, RN-020 | Marcação visual, forced reflection, mensuração mensal de homogeneização, bloqueio de relatório com satisfação isolada |

#### Objetos de Domínio Envolvidos

| Objeto | Descrição | Papel na Feature |
|--------|-----------|------------------|
| Feedback | Thumbs/comentário por mensagem | Unidade de avaliação |
| SessionRating | Rating 1-5 por sessão | Avaliação agregada |
| SkillScore | Média alimentada por Feedback | Saúde da Skill |
| ReflectionPrompt | Pergunta de forced reflection | Trigger cognitivo |

#### Fase e Prioridade

| Fase | Escopo | Justificativa |
|------|--------|---------------|
| **POC** | (não aplicável — feature já existente) | — |
| **Protótipo** | FA-07-01 a FA-07-05 em produção | UX base |
| **Piloto** | + dados reais de uso, FA-07-06 (forced reflection ativo) | Calibração |
| **MVP** | Score HITL > 4.0 médio (KPI proposto) | Critério Parte 1 §2.3 |

#### Dependências

| Feature | Tipo de Dependência | Criticidade |
|---------|---------------------|-------------|
| FA-04 (Chat) | UX — feedback inline | Alta |
| FA-10 (Mensuração) | Dados — feedback alimenta dashboard | Alta |
| FA-11 (Safety cultural) | Operacional — forced reflection é norma transversal | Alta |

---

### FA-08 — Geração e Edição Multimodal (Imagem/Vídeo)

#### Resumo da Feature

Capacidades multimodais do sunOS: **Image generation** (Vertex AI Imagen 4 + Nano Banana — parcialmente implementado, hoje em mock por falta de Vertex AI key); **Image editing** (inpainting/outpainting + enhance/upscale — Phase 16, specs prontos em SPEC `image-editor`, código pendente); **Video generation** (Vertex AI Veo 3.0/3.1 T2V e I2V — Phase 16, specs prontos em SPEC `video-generation`, código pendente). VisualCreator agente já existe.

Expande o output de Skills além de texto. Crítico para Copy Social (preview Instagram com imagem real), Roteiro de Vídeo (storyboard), e novas Skills futuras de produção visual. Coexiste com Adobe Creative Cloud (BR-016, RN-022) — sunOS é camada de inteligência, não substituto.

#### Propósito e Escopo

**Inclui:**
- Image generation via Vertex AI Imagen 4 / Nano Banana
- Image editing: inpainting, outpainting, enhance/upscale (Phase 16)
- Video generation: Vertex AI Veo 3.0 e 3.1 (T2V e I2V) (Phase 16)
- Agente VisualCreator (já existe)
- Marcação visual como "estímulo" / "Faísca" (RN-014) compartilhada com FA-11

**Não Inclui:**
- Substituir Adobe Firefly, Photoshop, Premiere (BR-016)
- Edição vetorial complexa (Illustrator)
- Renderização 3D
- Áudio generativo (não previsto na Phase 16)

#### Capacidades / Subfeatures

| ID | Capacidade | Descrição |
|----|------------|-----------|
| FA-08-01 | Image generation (Imagen 4 + Nano Banana) | Geração via Vertex AI; hoje em mock |
| FA-08-02 | Image editing (inpainting/outpainting) | Phase 16 — SPEC pronto, código pendente |
| FA-08-03 | Image enhance/upscale | Phase 16 |
| FA-08-04 | Video generation (Veo 3.0/3.1 T2V) | Phase 16 — SPEC pronto, código pendente |
| FA-08-05 | Video generation (Veo I2V) | Phase 16 |
| FA-08-06 | Agente VisualCreator | Orquestrador multimodal |

#### Personas e Objetivos Atendidos

| Persona | Objetivo / Job-to-be-done | Jornadas |
|---------|---------------------------|----------|
| PX-02 Criativo Sênior | Gerar visual de referência sem sair do sunOS | JN-02, JN-03 |
| PX-03 Operador Processual (primário) | Visual completo no Copy Social, storyboard de vídeo | JN-03 |

#### Relação com BRD

| Tipo | IDs | Descrição Resumida |
|------|-----|-------------------|
| **BRs** | BR-002, BR-010, BR-016 | Aceleração, ownership criativo (marcação como estímulo), coexistência com ferramentas de produção |
| **RNs** | RN-014, RN-022 | Marcação visual de outputs IA, avaliação de duplicidade vs. mercado |

#### Objetos de Domínio Envolvidos

| Objeto | Descrição | Papel na Feature |
|--------|-----------|------------------|
| ImageAsset | Imagem gerada/editada | Output |
| VideoAsset | Vídeo gerado | Output |
| EditMask | Máscara de inpainting/outpainting | Input de edição |
| GenerationConfig | Modelo + parâmetros (Imagen 4 / Veo 3.0 / Veo 3.1 / Nano Banana) | Configuração |

#### Fase e Prioridade

| Fase | Escopo | Justificativa |
|------|--------|---------------|
| **POC** | (não aplicável) | — |
| **Protótipo** | FA-08-01 em mock (já em produção) | Validação de UX |
| **Piloto** | FA-08-01 com Vertex AI key real, FA-08-02 e FA-08-03 (Image editing) | Cobertura visual real |
| **MVP** | + FA-08-04 e FA-08-05 (Video generation Veo 3.1) | P6 do roadmap handoff |

#### Dependências

| Feature | Tipo de Dependência | Criticidade |
|---------|---------------------|-------------|
| FA-04 (Chat) | UX — VisualCreator chega via Chat | Alta |
| FA-09 (RBAC) | Operacional — quem pode acionar geração custosa | Média |
| FA-10 (Mensuração) | Dados — custo de Vertex AI por execução | Alta |

---

### FA-09 — Governança, RBAC e Caixa-preta

#### Resumo da Feature

Modelo de **governança e segurança** do sunOS, materializando a Caixa-preta (Glossário §1) e a proteção de IP da Suno (BR-007). Inclui: RBAC com 3 perfis (Admin / Líder / Operacional via Firebase Custom Claims), ocultação total da Biblioteca para perfil Operacional (RN-011), isolamento de contexto entre clientes em Skills processuais (RN-010), auditoria de acessos administrativos (RN-012), retenção e descarte de logs conforme LGPD (RN-013), default deny em qualquer ambiguidade.

Substitui parcialmente a ausência de DPO formal na Suno (Parte 1 §3.4) — Diretoria fica com visibilidade sobre uso administrativo. Auth Google + RBAC já em produção (Phase 10); políticas LGPD em construção.

#### Propósito e Escopo

**Inclui:**
- Auth Google via Firebase
- RBAC com 3 perfis (Admin, Líder, Operacional) via Custom Claims
- Default deny em qualquer ambiguidade
- Ocultação total da Biblioteca para Operacional (sem menu, link, breadcrumb; URL direta redireciona)
- Substituição de termos como "Biblioteca" por linguagem neutra ("contexto do cliente") em outputs para Operacional
- Isolamento de contexto entre clientes em Skills (com exceção tag "cross-client" peso 0.4)
- Auditoria de acessos administrativos (logs estruturados)
- Detecção de anomalias (volume > 3σ da baseline mensal)
- Retenção LGPD: 12 meses ativo, depois armazenamento frio; política específica de dado pessoal a aprovar

**Não Inclui:**
- DPO formal (não existe na Suno — Parte 1 §3.4)
- Substituir compliance officer (responsabilidade compartilhada Diretoria + projeto)
- Single Sign-On com IdPs externos além do Google (não previsto)

#### Capacidades / Subfeatures

| ID | Capacidade | Descrição |
|----|------------|-----------|
| FA-09-01 | Auth Google + Firebase Custom Claims | Login + RBAC base |
| FA-09-02 | RBAC 3 perfis (Admin/Líder/Operacional) | Ver matriz no RN-009 |
| FA-09-03 | Caixa-preta da Biblioteca para Operacional | Ocultação total (RN-011) |
| FA-09-04 | Isolamento de contexto entre clientes | Filtro por cliente ativo (RN-010) |
| FA-09-05 | Auditoria de acessos administrativos | Logs estruturados queryáveis (RN-012) |
| FA-09-06 | Detecção de anomalias administrativas | Volume > 3σ → alerta Diretoria (RN-012) |
| FA-09-07 | Retenção e descarte LGPD | 12 meses ativo + política dado pessoal (RN-013) |
| FA-09-08 | Documentação NDA + processos | Para colaboradores com acesso administrativo (BR-007) |

#### Personas e Objetivos Atendidos

| Persona | Objetivo / Job-to-be-done | Jornadas |
|---------|---------------------------|----------|
| PX-01 Líder/Curador (primário) | Garantir IP protegido e governança | JN-01, JN-08 |
| Todas as personas | Acessar somente o que perfil tem direito (default deny) | Todas (transversal) |

#### Relação com BRD

| Tipo | IDs | Descrição Resumida |
|------|-----|-------------------|
| **BRs** | BR-007 (primário), BR-008, BR-009 | Proteção do IP, privacidade entre clientes, auditabilidade |
| **RNs** | RN-009, RN-010, RN-011, RN-012, RN-013 | RBAC, isolamento, ocultação Biblioteca, auditoria, retenção LGPD |

#### Objetos de Domínio Envolvidos

| Objeto | Descrição | Papel na Feature |
|--------|-----------|------------------|
| User | Usuário autenticado | Sujeito do RBAC |
| Role | Admin / Líder / Operacional | Controle de acesso |
| AccessLog | Log estruturado de ação administrativa | Auditoria |
| RetentionPolicy | Política de retenção por categoria | Governança LGPD |
| ClientIsolationRule | Regra de filtragem por cliente ativo | Privacidade |

#### Fase e Prioridade

| Fase | Escopo | Justificativa |
|------|--------|---------------|
| **POC** | (não aplicável) | — |
| **Protótipo** | FA-09-01, FA-09-02 em produção (Phase 10) | Auth e RBAC base |
| **Piloto** | + FA-09-03 a FA-09-07 (Caixa-preta operacional, isolamento, auditoria, LGPD) | Necessário para uso real |
| **MVP** | + FA-09-08 (NDA + processos formais) | Cobertura completa |

#### Dependências

| Feature | Tipo de Dependência | Criticidade |
|---------|---------------------|-------------|
| FA-01 (Biblioteca) | Operacional — Caixa-preta protege Biblioteca | Alta |
| FA-03 (Skills) | Operacional — system prompts protegidos | Alta |
| FA-10 (Mensuração) | Dados — auditoria depende de tracing | Alta |
| FA-12 (Admin) | UX — perfis acessam diferentes Admin areas | Alta |

---

### FA-10 — Mensuração, Observabilidade e Custo Evitado

#### Resumo da Feature

Camada de **observabilidade e mensuração** do sunOS: tracing 100% das chamadas LLM via MLflow (latência, tokens, custo, scorers), Eval framework com scorers customizados (tom, formato, routing, contexto), cálculo de custo evitado por execução de Skill (tempo manual baseline × custo hora-homem da área), dashboard executivo mensal para Diretoria, KPIs de negócio (win rate em new business, Cannes/Effie shortlist rate, retenção de Creators seniores), capacidade de reconstruir contexto/prompt/output de qualquer interação por ≥12 meses.

Materializa o **business case** que sustenta o investimento — sem mensuração, o ROI fica anedótico e o sponsor perde munição diante da Diretoria. Atende prioritariamente PX-01 (Líder/Curador, métricas) e endereça BR-003, BR-009, BR-013, BR-014.

#### Propósito e Escopo

**Inclui:**
- Tracing 100% das chamadas LLM (MLflow)
- Logs estruturados queryáveis (latência, modelo, custo, scorers)
- Eval framework: tracing + trajectory + quality (scorers de tom, formato, routing, contexto)
- Cálculo de custo evitado por execução de Skill processual (RN-018)
- Dashboard executivo mensal (RN-005)
- KPIs de negócio acompanhados continuamente (≥3): win rate, shortlist rate, retenção de seniores
- Capacidade de gerar relatório por cliente/skill/usuário em <30s
- Mapeamento atualizado das 136 atividades catalogadas (`roi_completo_suno.xlsx`)
- Reporting trimestral à Diretoria com comparação ano contra ano
- Mensuração mensal das 3 métricas de homogeneização coletiva (RN-019)
- Bloqueio de relatório com satisfação individual isolada (RN-020)

**Não Inclui:**
- Alimentar dashboards de cliente externo (sunOS é interno)
- Substituir BI corporativo (sunOS é vertical de IA, não BI da agência)
- Atribuição de receita direto a creator individual (delicado culturalmente)

#### Capacidades / Subfeatures

| ID | Capacidade | Descrição |
|----|------------|-----------|
| FA-10-01 | Tracing 100% LLM (MLflow) | Toda chamada gravada |
| FA-10-02 | Eval framework (3 camadas) | Tracing + Trajectory + Quality |
| FA-10-03 | Cálculo de custo evitado por execução | Baseline manual × custo hora (RN-018) |
| FA-10-04 | Dashboard executivo mensal | Auto-gerado até dia 5 (RN-005) |
| FA-10-05 | KPIs de negócio (≥3) | win rate, shortlist rate, retenção seniores |
| FA-10-06 | Reporting por cliente/skill/usuário | <30s |
| FA-10-07 | Mapeamento das 136 atividades | Atualizado trimestralmente |
| FA-10-08 | Mensuração mensal de homogeneização | Mean Pairwise Cosine Distance, Self-BLEU, Compression Ratio (RN-019) |
| FA-10-09 | Bloqueio de relatório com satisfação isolada | Co-exibição obrigatória de set-level diversity (RN-020) |

#### Personas e Objetivos Atendidos

| Persona | Objetivo / Job-to-be-done | Jornadas |
|---------|---------------------------|----------|
| PX-01 Líder/Curador (primário, métricas) | Defender continuidade do investimento com evidências | JN-08 (governança) |
| PX-02 Criativo Sênior | Confiar que homogeneização coletiva é monitorada | JN-08 (indireto) |
| PX-03 Operador (beneficiário indireto) | Skills saudáveis dependem de Eval | Todas (transversal) |

#### Relação com BRD

| Tipo | IDs | Descrição Resumida |
|------|-----|-------------------|
| **BRs** | BR-003 (primário), BR-009, BR-013, BR-014 | ROI, auditabilidade, custo evitado, detecção de homogeneização |
| **RNs** | RN-005, RN-018, RN-019, RN-020 | Dashboard, custo evitado, mensuração de homogeneização, bloqueio de satisfação isolada |

#### Objetos de Domínio Envolvidos

| Objeto | Descrição | Papel na Feature |
|--------|-----------|------------------|
| Trace | Registro de chamada LLM (MLflow) | Unidade de observabilidade |
| Scorer | Função de avaliação (tom, formato, routing, contexto) | Quality |
| ExecutionMetric | Custo evitado, tempo, qualidade | Cálculo |
| Dashboard | Relatório executivo mensal | Reporting |
| BusinessKPI | win rate, shortlist rate, retenção | KPI de negócio |
| DiversityMetric | Cosine Distance, Self-BLEU, Compression Ratio | Safety coletiva |
| ActivityBaseline | Tempo manual da tarefa equivalente | Cálculo de custo evitado |

#### Fase e Prioridade

| Fase | Escopo | Justificativa |
|------|--------|---------------|
| **POC** | (não aplicável) | — |
| **Protótipo** | FA-10-01, FA-10-02 (MLflow + Eval) já em dev local | Base técnica |
| **Piloto** | + FA-10-03 a FA-10-07 (custo evitado, dashboard, KPIs, reporting) | Necessário para business case |
| **MVP** | + FA-10-08, FA-10-09 (homogeneização + bloqueio) — depende de baseline pré-sunOS (PA-03) | Safety completa |

#### Dependências

| Feature | Tipo de Dependência | Criticidade |
|---------|---------------------|-------------|
| FA-04 (Chat) | Dados — tracing de chats | Alta |
| FA-05 (Workflows) | Dados — tracing de execuções | Alta |
| FA-07 (HITL) | Dados — feedback alimenta scorers e dashboard | Alta |
| FA-09 (RBAC) | Operacional — auditoria de acessos administrativos | Alta |
| FA-02 (Shoot for the Moon) | Dados — DiversityMetric mede homogeneização | Alta |

---

### FA-11 — Safety Cultural & Ownership Criativo

#### Resumo da Feature

Conjunto **transversal** de comportamentos, validações e mecanismos que garantem que o sunOS respeita a cultura criativa brasileira e da Suno, preserva ownership autoral do Creator, mitiga over-reliance e protege a saúde criativa coletiva. Não é uma feature operacional standalone — é um **padrão de comportamento** que vive dentro de FA-02, FA-04, FA-07, FA-08 e FA-12 — mas merece tracking explícito porque endereça os riscos mais existenciais do projeto (homogeneização criativa coletiva, erosão cognitiva, perda de identidade autoral).

Inclui: marcação visual de outputs IA como "estímulo/Faísca" (nunca peça final); forced reflection moments após N stars; tracks de onboarding por estágio de carreira (junior-leaning divergente vs. senior-leaning devil's advocate); validação automática de vocabulário UI contra Glossário (Devorar, Provocar, Faísca, Brasa) bloqueando anti-patterns (gerar, otimizar, eficiência, accelerator); personas de agente refletindo identidade brasileira; modo dupla de criação com time-boxing.

#### Propósito e Escopo

**Inclui:**
- Marcação visual de outputs IA como "estímulo" / "Faísca" / "provocação" (RN-014)
- Bloqueio de output IA compartilhado/publicado sem confirmação humana
- Forced reflection moments após N stars (N=5 default; N=3 para junior) — RN-015
- Escalação para líder após ≥3 skips consecutivos de reflection
- Visible reasoning hidden by default
- Tracks de onboarding por estágio de carreira (RN-017)
- Validação de vocabulário UI contra Glossário (RN-016)
- Manifesto de produto interno publicado e referenciado em onboarding
- Personas brasileiras dos agentes (Antropófaga, Carnavalesco, Anciã)
- Modo dupla de criação (time-boxing 90s/5min)
- Métricas de uso segmentadas por estágio de carreira
- Validação cultural com Sponsor + patrocinadores sócio antes de releases maiores

**Não Inclui:**
- Censura de outputs por critério moral (não é o escopo)
- Bloqueio total de IA para juniores (proteção é via UX adaptado, não interdição)
- Substituir mentoria humana (é complemento, não substituto)

#### Capacidades / Subfeatures

| ID | Capacidade | Descrição |
|----|------------|-----------|
| FA-11-01 | Marcação visual de outputs IA | Sempre como estímulo/Faísca (RN-014) |
| FA-11-02 | Forced reflection após N stars | N=5/3 conforme estágio (RN-015) |
| FA-11-03 | Tracks de onboarding por carreira | Junior divergente vs. sênior devil's advocate (RN-017) |
| FA-11-04 | Validação de vocabulário UI | Bloqueio de anti-patterns; sugestão do dicionário (RN-016) |
| FA-11-05 | Personas brasileiras dos agentes | Antropófaga, Carnavalesco, Anciã |
| FA-11-06 | Modo dupla de criação | Time-boxing 90s/5min |
| FA-11-07 | Manifesto de produto interno | Publicado e referenciado em onboarding |
| FA-11-08 | Métricas de uso por estágio | Junior/pleno/sênior tracking trimestral |
| FA-11-09 | Validação cultural com Sponsor | Antes de cada release maior (≥90% das releases aprovadas) |

#### Personas e Objetivos Atendidos

| Persona | Objetivo / Job-to-be-done | Jornadas |
|---------|---------------------------|----------|
| PX-02 Criativo Sênior (primário) | Não se sentir "operador de IA" — preservar identidade autoral | Todas (transversal) |
| PX-05 Creator Junior | Aprender com proteção contra over-reliance | JN-02 com track junior |
| PX-01 Líder/Curador | Garantir saúde cultural do uso de IA | JN-08 |

#### Relação com BRD

| Tipo | IDs | Descrição Resumida |
|------|-----|-------------------|
| **BRs** | BR-010 (primário), BR-011, BR-012, BR-014 | Ownership criativo, cultura brasileira/Suno, UX por carreira, detecção de homogeneização |
| **RNs** | RN-014, RN-015, RN-016, RN-017, RN-019, RN-020 | Marcação visual, forced reflection, validação vocabulário, track por carreira, mensuração homogeneização, bloqueio satisfação isolada |

#### Objetos de Domínio Envolvidos

| Objeto | Descrição | Papel na Feature |
|--------|-----------|------------------|
| OutputMarker | Marca visual "estímulo" / "Faísca" | UX |
| ReflectionPrompt | Pergunta de forced reflection | Trigger cognitivo |
| OnboardingTrack | Track ("começando" vs. "me prova que tá errada") | Adoção |
| VocabRule | Regra de validação de UI | Bloqueio cultural |
| AgentPersona | Identidade brasileira do agente | Vetor cultural |

#### Fase e Prioridade

| Fase | Escopo | Justificativa |
|------|--------|---------------|
| **POC** | (não aplicável standalone) | Vive dentro de FA-02 POC |
| **Protótipo** | FA-11-01, FA-11-05 implementados parcialmente | UX inicial |
| **Piloto** | + FA-11-02, FA-11-03, FA-11-06, FA-11-07, FA-11-09 | Cultura completa |
| **MVP** | + FA-11-04 (validação automática), FA-11-08 (métricas por carreira) | Cobertura sustentada |

#### Dependências

| Feature | Tipo de Dependência | Criticidade |
|---------|---------------------|-------------|
| FA-02 (Shoot for the Moon) | Operacional — marcação Faísca, modos de entrada, dupla | Alta |
| FA-04 (Chat) | UX — marcação, forced reflection, ChatBubble | Alta |
| FA-07 (HITL) | Dados — N stars trigger | Alta |
| FA-08 (Multimodal) | UX — marcação em outputs visuais | Alta |
| FA-10 (Mensuração) | Dados — métricas por carreira, homogeneização | Alta |
| FA-12 (Admin) | UX — validação de vocabulário em copy | Média |

---

### FA-12 — Admin areas (CRUD configurável)

#### Resumo da Feature

Páginas administrativas do sunOS para CRUD de **Skills** (`/skills`), **Biblioteca** (`/biblioteca`), **Clientes** (`/clientes`) e **Workflows** (`/workflows`), redesenhadas com **pattern Model Repo** (SPEC-005): table view default + filter sidebar + side drawer para detalhes. Inclui Auth Google + RBAC Firebase. Tudo já em produção. Permite que Admins e Líderes governem o sunOS sem dependência do time de eng.

Atende prioritariamente PX-01 (Líder/Curador) — é a interface pela qual a Inteligência Coletiva da Suno é configurada, curada e governada. Restrito a perfis Admin/Líder via RBAC (RN-009).

#### Propósito e Escopo

**Inclui:**
- `/skills` — CRUD de Skills com 4 tabs (identidade, configuração, moons, clientes)
- `/biblioteca` — CRUD de Biblioteca com upload, filter sidebar, drawer
- `/clientes` — CRUD de Clientes com condensed cards + drawer (4 tabs: Identidade, Skills, Biblioteca, Métricas)
- `/workflows` — CRUD de Workflows com schedule humanizado e drawer
- Pattern Model Repo (SPEC-005): table view + filter sidebar + side drawer
- Dark/Light theme toggle no header
- Design System page (`/design-system`)
- Auth Google + RBAC (FA-09)

**Não Inclui:**
- CRUD de usuários (delegado a Firebase Console)
- Audit log UI completa (vive em FA-10)
- Marketplace de Skills (não-escopo)

#### Capacidades / Subfeatures

| ID | Capacidade | Descrição |
|----|------------|-----------|
| FA-12-01 | Skills Admin (`/skills`) | CRUD com 4 tabs |
| FA-12-02 | Biblioteca Admin (`/biblioteca`) | CRUD com upload + filter sidebar + drawer |
| FA-12-03 | Clientes Admin (`/clientes`) | CRUD com condensed cards + drawer |
| FA-12-04 | Workflows Admin (`/workflows`) | CRUD com schedule humanizado + drawer |
| FA-12-05 | Pattern Model Repo (SPEC-005) | Table view + filter sidebar + side drawer transversal |
| FA-12-06 | Dark/Light theme | Toggle no header |
| FA-12-07 | Design System page | `/design-system` (component library) |
| FA-12-08 | Validação de vocabulário em copy [Inferido — alimenta FA-11-04] | Aplicação da regra RN-016 |

#### Personas e Objetivos Atendidos

| Persona | Objetivo / Job-to-be-done | Jornadas |
|---------|---------------------------|----------|
| PX-01 Líder/Curador (primário) | Configurar Skills, curar Biblioteca, governar Clientes | JN-01, JN-07, JN-08 |

#### Relação com BRD

| Tipo | IDs | Descrição Resumida |
|------|-----|-------------------|
| **BRs** | BR-004, BR-007, BR-015 | Repositório institucional (CRUD Biblioteca), proteção de IP (Admin restrito), integração com Skills |
| **RNs** | RN-006, RN-009, RN-016 | Validação de metadados, RBAC, validação de vocabulário UI |

#### Objetos de Domínio Envolvidos

| Objeto | Descrição | Papel na Feature |
|--------|-----------|------------------|
| Skill, Moon, KnowledgeItem, Client, Workflow | Entidades principais do sunOS | Sujeitos do CRUD |
| FilterSidebar | Componente de filtro | UI |
| Drawer | Painel lateral de detalhes | UI |

#### Fase e Prioridade

| Fase | Escopo | Justificativa |
|------|--------|---------------|
| **POC** | (não aplicável — já em produção) | — |
| **Protótipo** | FA-12-01 a FA-12-07 já em produção (após SPEC-005) | UX consolidada |
| **Piloto** | + FA-12-08 (validação vocabulário automática) | Cobertura cultural |
| **MVP** | Refinamentos UX | UX refinada |

#### Dependências

| Feature | Tipo de Dependência | Criticidade |
|---------|---------------------|-------------|
| FA-09 (RBAC) | Operacional — perfis acessam Admin areas | Alta |
| FA-01 (Biblioteca) | Operacional — `/biblioteca` é CRUD de FA-01 | Alta |
| FA-03 (Skills) | Operacional — `/skills` é CRUD de FA-03 | Alta |
| FA-05 (Workflows) | Operacional — `/workflows` é CRUD de FA-05 | Alta |
| FA-11 (Safety cultural) | Operacional — validação vocabulário em copy | Média |

---

### FA-13 — Aprovação Hierárquica com Pré-validação por Agentes (NOVA — pedido Guga + Bruno Prosperi)

#### Resumo
Fluxo no sunOS em que um asset finalizado pelo creator é submetido a um aprovador humano (superior direto) **após passar por agentes especializados de pré-validação** (Brand Guidelines do cliente, gramática portuguesa, conformidade legal). O aprovador é sempre humano (RN-024); agentes apenas pré-validam e expõem issues. Materializa o ciclo Faísca → Brasa → **Validado** (RN-014).

#### Subfeatures

| ID | Subfeature | Descrição |
|----|-----------|-----------|
| FA-13-01 | Submissão para aprovação | Botão "Submeter para aprovação" em qualquer asset/sessão; capta cliente, contexto, hierarquia |
| FA-13-02 | Pipeline de validators paralelos | BrandValidator + PortuguêsValidator (mínimo) executados simultaneamente; configuráveis por área |
| FA-13-03 | Validation Report estruturado | Anexa `{dimensão, status passed/warning/failed, evidências, sugestões}` à submissão |
| FA-13-04 | Approval Inbox | Tela do aprovador listando submissões pendentes, com filtros (cliente, área, prioridade, idade) |
| FA-13-05 | Approval Detail | Tela com asset + Validation Report expandido + ações (Aprovar / Rejeitar / Solicitar ajustes) |
| FA-13-06 | Anti-loop com limite de rounds | RN-025 — bloqueia 4ª submissão automática; escala humano-humano |
| FA-13-07 | Hierarquia configurável | Admin mantém mapa creator → aprovador por área/cliente; fallback para líder se aprovador inativo |
| FA-13-08 | Notificação ao aprovador | In-app + canal externo (email/Slack — a definir) |
| FA-13-09 | Auditoria da decisão | Log estruturado: quem aprovou (humano), quando, com base em qual Validation Report |

#### Personas e Objetivos Atendidos

| Persona | Objetivo / Job-to-be-done | Jornadas |
|---------|---------------------------|----------|
| PX-02 Criativo Sênior (primário — submete) | Receber aprovação rápida e clara para o trabalho | JN-11 |
| PX-03 Operador Processual (primário — submete) | Mesmo objetivo | JN-11 |
| PX-06 Aprovador Sócio (primário — decide) | Reduzir tempo de revisão sem perder controle de qualidade | JN-11 |
| PX-01 Líder/Curador | Manter Brand Guidelines atualizadas para alimentar BrandValidator | JN-01, JN-11 |

#### Relação com BRD

| Tipo | IDs | Descrição Resumida |
|------|-----|-------------------|
| **BRs** | BR-017 (primário), BR-004, BR-007, BR-009, BR-010 | Aprovação hierárquica · Brand Guidelines como fonte · RBAC · Auditoria · Ownership preservado |
| **RNs** | RN-023, RN-024, RN-025, RN-026, RN-014 | Validators paralelos · Aprovador humano · Limite de rounds · Hierarquia configurável · Marcação visual (Faísca→Brasa→Validado) |

#### Objetos de Domínio Envolvidos

| Objeto | Descrição | Papel na Feature |
|--------|-----------|------------------|
| ApprovalRequest | Submissão criada pelo creator | Aggregate root |
| ValidationReport | Resultado consolidado dos validators | Anexo da submissão |
| ApprovalChain | Configuração de hierarquia por área/cliente | Admin |
| BrandValidatorAgent / PortuguêsValidatorAgent | Agentes especializados | Processo |
| ApprovalDecision | Decisão emitida pelo humano | Evento |

#### Fase e Prioridade

| Fase | Escopo | Justificativa |
|------|--------|---------------|
| **POC** | FA-13-01 + FA-13-02 (submissão + 1 validator) com mock | Validar fluxo |
| **Protótipo** | + FA-13-03 a FA-13-05 + FA-13-08 (Validation Report, Inbox, Detail, notificação) | Fluxo end-to-end mínimo |
| **Piloto** | + FA-13-06, FA-13-07, FA-13-09 (anti-loop, hierarquia, auditoria) + 2º validator | Operação real |
| **MVP** | + validators adicionais (Legal, Acessibilidade), integração externa (Slack) | Cobertura completa |

#### Dependências

| Feature | Tipo de Dependência | Criticidade |
|---------|---------------------|-------------|
| FA-01 (Biblioteca) | Operacional — Brand Guidelines como fonte para BrandValidator | Crítica |
| FA-09 (RBAC) | Operacional — hierarquia configurada no admin; aprovador autenticado | Crítica |
| FA-04 (Chat) | Operacional — assets gerados em Chat são submetíveis | Alta |
| FA-02 (Shoot for the Moon) | Operacional — provocações eventualmente vão para approval | Média |

---

### FA-14 — Google Drive como Fonte Curada da Biblioteca (NOVA — pedido Guga, versão ajustada)

#### Resumo
Integração read-only do Google Drive da Suno como fonte primária para alimentar a Biblioteca. **Sync unidirecional Drive→Biblioteca**; agentes analisam estrutura do Drive e geram Drive Cleanup Report sugestivo (humano executa as ações). Sync respeita intersecção ACL Drive × RBAC sunOS (default deny). Cliente individual pode ser excluído da integração.

> **Versão ajustada vs. pedido literal**: Guga pediu "espelho bidirecional + agentes que organizam Drive". Ajuste recomendado e adotado: read-only + curadoria sugestiva (riscos LGPD, ACL, perda de dados, RN-011 caixa-preta foram bloqueadores).

#### Subfeatures

| ID | Subfeature | Descrição |
|----|-----------|-----------|
| FA-14-01 | Conexão OAuth Google (escopo `drive.readonly`) | Líder conecta uma pasta autorizada via OAuth com escopo restrito |
| FA-14-02 | Sync Drive→Biblioteca incremental | Re-sync 24h via `changes.list` + webhook para mudanças críticas |
| FA-14-03 | Intersecção ACL × RBAC | Usuário só vê conteúdo permitido em ambos os sistemas (default deny) |
| FA-14-04 | Drive Cleanup Report (semanal) | Agentes analisam Drive e sugerem: duplicatas, órfãos, candidatos à curadoria, nomenclatura inconsistente |
| FA-14-05 | Curadoria assistida | Líder revisa sugestões e aprova/rejeita; humano executa no Drive |
| FA-14-06 | Ingestão na Biblioteca | Conteúdo aprovado entra na Biblioteca com metadados RN-006 (FR-001 do SPEC-004) |
| FA-14-07 | Exclusão por cliente | Cliente individual pode ser excluído via configuração admin (LGPD/contratual) |
| FA-14-08 | Audit log de operações | 100% das operações registradas para garantia de read-only (RN-027) |

#### Personas e Objetivos Atendidos

| Persona | Objetivo / Job-to-be-done | Jornadas |
|---------|---------------------------|----------|
| PX-01 Líder/Curador (primário) | Aproveitar conhecimento já no Drive sem subir tudo manualmente; receber sugestões críticas de organização | JN-12 |
| PX-03 Operador Processual | Beneficiário indireto — Skills usam contexto vindo do Drive | (transparente) |

#### Relação com BRD

| Tipo | IDs | Descrição Resumida |
|------|-----|-------------------|
| **BRs** | BR-018 (primário), BR-004, BR-007, BR-008, BR-010 | Drive como fonte · Biblioteca · Proteção IP · Privacidade clientes · Ownership |
| **RNs** | RN-027, RN-028, RN-029, RN-030, RN-006 | Read-only · ACL∩RBAC · Curadoria sugestiva · Sync periódico · Metadados obrigatórios |

#### Objetos de Domínio Envolvidos

| Objeto | Descrição | Papel na Feature |
|--------|-----------|------------------|
| DriveSync | Estado da conexão por pasta | Aggregate root |
| DriveDocument | Espelho de metadados (não conteúdo bruto) de arquivo monitorado | Entity |
| DriveCleanupReport | Relatório semanal sugestivo | Value object |
| CurationSuggestion | Sugestão individual (mover, deduplicar, ingerir) | Value object |
| OAuthCredential | Token de acesso do líder | Value object (encrypted) |

#### Fase e Prioridade

| Fase | Escopo | Justificativa |
|------|--------|---------------|
| **POC** | FA-14-01 + FA-14-02 (conexão + sync mínimo) com 1 cliente piloto | Validar viabilidade técnica |
| **Protótipo** | + FA-14-03, FA-14-06, FA-14-08 (ACL, ingestão, audit) | Operação segura mínima |
| **Piloto** | + FA-14-04, FA-14-05, FA-14-07 (Cleanup Report, curadoria assistida, exclusão por cliente) | Operação real cross-cliente |
| **MVP** | Refinamentos: webhook em mais pastas, otimizações de custo, dashboard | Operação madura |

#### Dependências

| Feature | Tipo de Dependência | Criticidade |
|---------|---------------------|-------------|
| FA-01 (Biblioteca) | Destino — conteúdo do Drive ingere na Biblioteca | Crítica |
| FA-09 (RBAC) | Operacional — intersecção ACL × RBAC | Crítica |
| FA-12 (Admin) | Operacional — admin configura conexões e exclusões | Alta |

---

## 4. Mapa Global de Relações entre Features

### 4.1. Fluxo Principal

O fluxo de uso predominante do sunOS começa pelo Sistema Solar (FA-06) e escolhe um caminho convergente (Skills) ou divergente (Shoot for the Moon):

```
                        ┌─► FA-03 Skills processuais ─┐
FA-06 Sistema Solar ────┤                              ├─► FA-04 Chat ─► FA-07 HITL
                        └─► FA-02 Shoot for the Moon ─┘             ▲
                                                                     │
FA-05 Workflows ──────► FA-03 Skills ─► FA-04 Chat (interno) ───────┘

FA-01 Biblioteca alimenta FA-02 + FA-03 + FA-05 (transversal)
FA-08 Multimodal alimenta FA-04 (VisualCreator)
FA-09 RBAC restringe FA-01 + FA-03 + FA-12 (transversal)
FA-10 Mensuração observa FA-04 + FA-05 + FA-07 + FA-02 (transversal)
FA-11 Safety cultural permeia FA-02 + FA-04 + FA-07 + FA-08 (transversal)
FA-12 Admin governa FA-01 + FA-03 + FA-05 + Clientes (transversal)
```

### 4.2. Matriz de Dependências

| Feature Origem | Feature Destino | Tipo de Relação | Criticidade |
|----------------|-----------------|-----------------|-------------|
| FA-01 Biblioteca | FA-02 Shoot for the Moon | Dados (Devora contexto) | Alta |
| FA-01 Biblioteca | FA-03 Skills | Dados (context injection) | Alta |
| FA-01 Biblioteca | FA-05 Workflows | Dados (search_knowledge tool) | Alta |
| FA-02 Shoot for the Moon | FA-04 Chat | Operacional (pipeline roda no Chat) | Alta |
| FA-02 Shoot for the Moon | FA-10 Mensuração | Dados (DiversityMetric) | Alta |
| FA-03 Skills | FA-04 Chat | Operacional (Skills via Chat) | Alta |
| FA-03 Skills | FA-07 HITL | Dados (Score por Skill) | Alta |
| FA-04 Chat | FA-07 HITL | UX (feedback inline) | Alta |
| FA-04 Chat | FA-08 Multimodal | Operacional (VisualCreator) | Média |
| FA-04 Chat | FA-10 Mensuração | Dados (tracing) | Alta |
| FA-05 Workflows | FA-03 Skills | Operacional (orquestra Skills) | Alta |
| FA-05 Workflows | FA-10 Mensuração | Dados (tracing de execuções) | Alta |
| FA-06 Sistema Solar | FA-04 Chat | UX (navegação leva ao Chat) | Alta |
| FA-06 Sistema Solar | FA-02 Shoot for the Moon | UX (botão ≤3 cliques) | Alta |
| FA-07 HITL | FA-10 Mensuração | Dados (feedback alimenta dashboard) | Alta |
| FA-09 RBAC | FA-01 Biblioteca | Operacional (Caixa-preta para Operacional) | Alta |
| FA-09 RBAC | FA-03 Skills | Operacional (system prompts protegidos) | Alta |
| FA-09 RBAC | FA-12 Admin | Operacional (perfis acessam Admin) | Alta |
| FA-10 Mensuração | FA-09 RBAC | Dados (auditoria de acessos administrativos) | Alta |
| FA-11 Safety cultural | FA-02 / FA-04 / FA-07 / FA-08 | UX (transversal) | Alta |
| FA-12 Admin | FA-01 / FA-03 / FA-05 | UX (CRUD das entidades) | Alta |

### 4.3. Matriz de Cobertura — Feature × BR

Cada FA-XX deve mapear para ≥1 BR-XXX. Esta matriz garante cobertura completa e identifica BRs órfãos.

| Feature | BRs Mapeados (Primário em **negrito**) |
|---------|----------------------------------------|
| FA-01 Biblioteca | **BR-004**, BR-005, BR-006, BR-007, BR-008, BR-015 |
| FA-02 Shoot for the Moon | **BR-001**, BR-010, BR-011, BR-014 |
| FA-03 Skills processuais | **BR-002**, BR-006, BR-015 |
| FA-04 Chat ReAct | BR-002, BR-006, BR-015 |
| FA-05 Workflows | **BR-002**, BR-013, BR-016 |
| FA-06 Sistema Solar | BR-001, BR-006, BR-011 |
| FA-07 HITL | BR-003, BR-006, BR-010, BR-014 |
| FA-08 Multimodal | BR-002, BR-010, BR-016 |
| FA-09 Governança/RBAC | **BR-007**, BR-008, BR-009 |
| FA-10 Mensuração | **BR-003**, BR-009, BR-013, BR-014 |
| FA-11 Safety cultural | **BR-010**, BR-011, BR-012, BR-014 |
| FA-12 Admin areas | BR-004, BR-007, BR-015 |
| FA-13 Aprovação Hierárquica | BR-017 (primário), BR-004, BR-007, BR-009, BR-010 |
| FA-14 Google Drive como fonte | BR-018 (primário), BR-004, BR-007, BR-008, BR-010 |

| BR | Features que cobrem | Status |
|----|---------------------|:------:|
| BR-001 (Provocação criativa) | FA-02 (primário), FA-06 | OK |
| BR-002 (Aceleração operacional) | FA-03 (primário), FA-04, FA-05, FA-08 | OK |
| BR-003 (ROI) | FA-07, FA-10 (primário) | OK |
| BR-004 (Biblioteca) | FA-01 (primário), FA-12 | OK |
| BR-005 (Continuidade pós-turnover) | FA-01 | OK |
| BR-006 (Acesso democrático) | FA-01, FA-03, FA-04, FA-06, FA-07 | OK |
| BR-007 (Proteção de IP) | FA-01, FA-09 (primário), FA-12 | OK |
| BR-008 (Privacidade clientes) | FA-01, FA-09 | OK |
| BR-009 (Auditabilidade) | FA-09, FA-10 | OK |
| BR-010 (Ownership criativo) | FA-02, FA-07, FA-08, FA-11 (primário) | OK |
| BR-011 (Cultura brasileira) | FA-02, FA-06, FA-11 | OK |
| BR-012 (UX por carreira) | FA-11 | **Cobertura única — atenção** |
| BR-013 (Mensuração custo evitado) | FA-05, FA-10 | OK |
| BR-014 (Detecção homogeneização) | FA-02, FA-07, FA-10, FA-11 | OK |
| BR-015 (Integração com Skills) | FA-01, FA-03, FA-04, FA-12 | OK |
| BR-017 (Aprovação hierárquica) | FA-13 (primário), FA-01, FA-09 | OK |
| BR-018 (Drive como fonte) | FA-14 (primário), FA-01, FA-09 | OK |
| BR-016 (Coexistência ferramentas) | FA-05, FA-08 | OK |

**Cobertura completa**: todos os 16 BRs têm ≥1 Feature. BR-012 (UX por carreira) tem cobertura única em FA-11 — apontamento na §6.3.

---

## 5. Implicações para Arquitetura e UX

### 5.1. Para Arquitetura

- **Domínios sugeridos** (a serem detalhados em SRD Domain Model): Knowledge (FA-01), Provocation (FA-02), Skill (FA-03), Conversation (FA-04), Workflow (FA-05), Solar (FA-06), Feedback (FA-07), Multimodal (FA-08), Governance (FA-09), Observability (FA-10), CulturalSafety (FA-11 — provavelmente cross-cutting concern), Admin (FA-12 — provavelmente UI-layer over outros domínios)
- **Cross-cutting concerns**: FA-09 (Governança/RBAC), FA-10 (Observabilidade), FA-11 (Safety cultural) atravessam vários domínios — atenção a separation of concerns no SRD
- **Engine único** (ADR-002): toda Skill e todo Workflow rodam no mesmo engine LangGraph, com context injection por cliente (skill_slug + context_documents). Sem deep agents por cliente
- **Tracing transversal**: MLflow precisa cobrir 100% das chamadas LLM em FA-02, FA-03, FA-04, FA-05, FA-08
- **Hierarquia de truncamento (RN-021)**: Regras de negócio do cliente (peso 1.0) sempre presentes — implementar como mandatory chunk no retrieval

### 5.2. Para UX/Navegação

- **Navegação principal**: Sistema Solar (FA-06) → Planeta → Skill (Chat, FA-04 com Moon chips, SPEC-007); Admin (FA-12) acessível via Sidebar para Admin/Líder; Workflows (FA-05) acessível via Sidebar
- **Princípio ≤3 cliques**: validar em cada feature que o caminho do Sun ao valor (output do Chat, Faísca do Shoot for the Moon, execução de Workflow) cumpre o princípio
- **Caixa-preta** (FA-09 + RN-011): para Operacional, qualquer menu/link/breadcrumb à Biblioteca deve sumir; URLs diretas redirecionam para home com mensagem genérica
- **Marcação visual de outputs IA** (FA-11-01 + RN-014): aparece em FA-02, FA-04, FA-08 — definir padrão único de design
- **Vocabulário** (FA-11-04 + RN-016): toda copy de UI passa por validação contra Glossário; bloqueio de anti-patterns; sugestões do dicionário
- **Tracks de onboarding** (FA-11-03 + RN-017): primeira tela após login pergunta estágio de carreira e sugere track (com opção de pular)

---

## 6. Assunções, Lacunas e Itens a Validar

### 6.1. Assunções

| ID | Assunção | Impacto se Falsa | Status |
|----|----------|------------------|--------|
| ASS-01 | FRD Shoot for the Moon existe como artefato (referenciado nos BRDs Parte 3 e 4 com FR-008, FR-010, FR-011, FR-015, FR-016, FR-017) e detalhará FA-02 e parte de FA-01 | FA-02 fica subespecificado; precisaria gerar FRD a partir do BRD | A validar com Heitor — não localizado em `/docs/specs/` no momento da geração |
| ASS-02 | A Phase 16 (Image Editor + Video Generation) será aprovada no business case — specs prontos, código pendente | FA-08 fica em mock por mais tempo; afeta Copy Social e Roteiro de Vídeo | A validar (DEC-06 da Parte 1 §7.1) |
| ASS-03 | Persistência de conversas é débito P1 mas será endereçada antes do Piloto | Sem persistência, HITL e Eval não acumulam dados consistentes | A validar com Heitor + Zé |
| ASS-04 | Forced reflection moments (RN-015) são aceitos culturalmente como proteção, não como fricção decorativa | Resistência de Creators seniores; risco de adoção | A validar com Bruno Prosperi |
| ASS-05 | Personas brasileiras dos agentes (Antropófaga, Carnavalesco, Anciã) são aceitas pela Diretoria | Risco de retrabalho de identidade; sócios podem preferir personas neutras | A validar com Guga + Bruno |
| ASS-06 | Baseline pré-sunOS de homogeneização (PA-03/PA-06) será mensurado antes do Piloto | Sem baseline, alertas RN-019 não funcionam — FA-10-08 fica subespecificado | A validar (PA-06) |

### 6.2. Lacunas de Informação

| Lacuna | Informação Necessária | Fonte Esperada |
|--------|----------------------|----------------|
| FRD Shoot for the Moon | Localização do artefato e numeração de FRs (FR-008, FR-010, FR-011, FR-015, FR-016, FR-017) | Heitor Miranda |
| Personas detalhadas além de PX-01 a PX-04 | Validação de PX-05 (Creator Junior) como persona separada ou variação de PX-02/PX-03 | PRD Parte 2 (gerada em paralelo) |
| Lista atualizada de ferramentas adotadas (RN-022) | Para guiar avaliação de duplicidade em FA-05 e FA-08 | Diretoria (PA-11) |
| Definições por área de júnior/pleno/sênior (RN-017) | Para implementar tracks de onboarding em FA-11-03 | Bruno Prosperi (criação), Takai (mídia) — PA-09 |
| Critérios para "conhecimento crítico" (RN-008) | Para implementar FA-01-07 | Heitor + sócios — PA-08 |

### 6.3. Itens a Validar com Stakeholders

| Item | Stakeholder | Prazo Sugerido |
|------|-------------|----------------|
| Cobertura única de BR-012 em FA-11 — confirmar se basta ou se precisa de feature dedicada de "Onboarding por carreira" | Bruno Prosperi + Heitor | Maio 2026 |
| Validar critérios quantitativos das FA-XX (≥30% redução, ≥60% aprovação) antes que virem compromissos | Heitor + Guga | Maio 2026 |
| Confirmar que FA-12-08 (validação automática de vocabulário) é viável como Phase do Piloto ou fica para MVP | Heitor + time dev | Junho 2026 |
| Confirmar que FA-10-08/09 (mensuração de homogeneização + bloqueio de relatório) é gate para Piloto ou MVP | Heitor + Bruno + Guga | Junho 2026 |
| Validar a numeração de FRD Shoot for the Moon e gerar FRD se ausente | Heitor + PM | Antes de Parte 4 do PRD |

---

## Histórico de Versões

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | 2026-04-28 | Heitor Miranda + Claude (assistido) | Versão inicial. **12 Macro Features (FA-01 a FA-12)** com 41 subfeatures, derivadas dos 16 BRs (Parte 3) + 22 RNs (Parte 4) + PRODUCT_HANDOFF.md + SPECs SDD existentes (SPEC-001 a SPEC-007 + image-editor + video-generation) + FRD Shoot for the Moon (referenciado). Cobertura completa: todos os 16 BRs têm ≥1 Feature. Ecossistema explicitado em 3 anéis (infraestrutura de conhecimento, capacidades de IA, governança e cultura). Vocabulário Suno (Devorar, Provocar, Faísca, Brasa, Caixa-preta, Bioma) aplicado; anti-patterns evitados |
| 1.1 | 2026-04-28 | **+2 Macro Features**: FA-13 Aprovação Hierárquica (9 subfeatures) e FA-14 Google Drive como fonte (8 subfeatures, versão ajustada). Pedido formal Guga + Bruno Prosperi. Total agora: **14 Macro Features / 58 subfeatures**. Cobertura BR-017 e BR-018 adicionada às matrizes |
