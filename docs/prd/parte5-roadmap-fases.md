---
documento: PRD Parte 5 — Roadmap por Fases
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
fonte_brd: docs/brd/parte1-contexto.md, docs/brd/parte3-requisitos.md, docs/brd/parte4-regras.md
fonte_prd: docs/prd/parte1-feature-map.md, docs/prd/parte2-personas-jtbd.md, docs/prd/parte3-matriz-persona-jornada.md, docs/prd/parte4-FRs.md
fonte_handoff: docs/ROADMAP.md, docs/handoff/PRODUCT_HANDOFF.md
fonte_specs: docs/specs/large/{sunohub-tools-integration,knowledge-biblioteca-v2,workflow-builder,image-editor,video-generation,ux-redesign}/, FRD Moon Shot (externo)
total_fases: 4 (POC, Protótipo, Piloto, MVP)
---

# PRD Parte 5 — Roadmap por Fases

## 1. Introdução

### 1.1. Objetivo deste Documento

Este documento distribui as **14 Macro Features (FA-01 a FA-14)** e os **98 Requisitos Funcionais (FR-001 a FR-018 do FRD Moon Shot + FR-100 a FR-179 da Parte 4)** nas **4 fases progressivas** do produto sunOS — POC, Protótipo, Piloto, MVP — definindo:

- **Objetivo de negócio** de cada fase
- **Features (FA-XX) e subfeatures incluídas** com escopo claro
- **Critérios de saída/entrada verificáveis** por fase
- **Estimativa temporal em semanas** considerando time não-dedicado (REST-01)
- **Riscos top-3 por fase** com mitigação
- **Dependências cross-feature** críticas

### 1.2. Fases do Produto

| Fase | Ambiente | Objetivo | Quem Testa | Duração Típica |
|------|----------|----------|------------|----------------|
| **1. POC** | Lab/Studio | Validar viabilidade do motor de Provocação (Moon Shot) | 3+ Creators seniores em testes blind | 4–6 semanas |
| **2. Protótipo** | Lab/Studio + staging | Validar fluxos principais com Creators internos | 5–10 Creators internos | Em curso (≈80% concluído desde Phases 1–10) |
| **3. Piloto** | Real World | Validar a solução no contexto real com champions | Champions (Gus/Teda em Mídia, Le em outras áreas) + 10+ UAS | 12–20 semanas |
| **4. MVP** | Real World | Core da solução em produção contínua com business case aprovado | Todos os ~300 Creators do grupo United Creators | Contínuo (a partir de Q1 2027) |

### 1.3. Mapeamento Prioridade BRD → Fase PRD

| Prioridade BRD | Fase PRD | Justificativa |
|----------------|----------|---------------|
| **Alta** (BR-001, BR-002, BR-003, BR-004, BR-006, BR-007, BR-008, BR-010, BR-013, BR-014, BR-015) | POC + Protótipo + Piloto | Validar valor primário e infraestrutura antes de escalar |
| **Média** (BR-005, BR-009, BR-011, BR-012, BR-016) | Piloto | Cobertura completa com champions reais |
| **Baixa / Refinamento** | MVP | Após validação do core |

### 1.4. Realinhamento ROADMAP.md → Fases POC/Protótipo/Piloto/MVP

O `docs/ROADMAP.md` original está estruturado em **Phases 1–16** (sequência cronológica de releases técnicos). Este documento **reorganiza essas Phases na linguagem de produto POC/Protótipo/Piloto/MVP** sem invalidar o trabalho já entregue:

| Phase do ROADMAP.md | Status | Mapeamento na Linguagem de Fases |
|---------------------|--------|----------------------------------|
| Phase 1 (Protótipo Base, 2026-03-23) | Concluída | Parte do **Protótipo** |
| Phase 2 (AI UX Patterns, 2026-03-23) | Concluída | Parte do **Protótipo** |
| Phase 3 (Skills Admin, 2026-03-24) | Concluída | Parte do **Protótipo** |
| Phase 4 (Biblioteca, 2026-03-24) | Concluída | Parte do **Protótipo** |
| Phase 5 (HITL, 2026-03-24) | Concluída | Parte do **Protótipo** |
| Phase 6 (Clientes Admin, 2026-03-24) | Concluída | Parte do **Protótipo** |
| Phase 7 (Navegação + Automações, 2026-03-24) | Concluída | Parte do **Protótipo** |
| Phase 8 (Backend FastAPI + LangGraph, 2026-03-26) | Concluída | Parte do **Protótipo** (infra para Piloto) |
| Phase 9 (Frontend ↔ Backend Integration, 2026-03-26) | Concluída | Parte do **Protótipo** |
| Phase 10 (Auth + RBAC, 2026-03-26) | Concluída | Parte do **Protótipo** (entrada para Piloto) |
| Phase 11 (Polish + Deploy) | **Em progresso** | **Gate de saída do Protótipo → entrada do Piloto** |
| Phase 12 (Sidebar Recentes Dinâmico) | Próxima | **MVP** (refinamento UX) |
| Phase 13 (Busca Global Cmd+K) | Próxima | **MVP** (refinamento UX) |
| Phase 14 (Onboarding / Empty States) | Próxima | **Piloto** (gate de adoção) |
| Phase 15 (Integração Solar ↔ Admin) | Próxima | **MVP** (refinamento) |
| Phase 16 (VideoGen + Editor + Enhance) | Specs prontos, código pendente | **Piloto (Editor) + MVP (Video)** — bloqueado por DEC-06 (business case) |
| **Phase 17 (Aprovação Hierárquica — FA-13)** | **Pedido novo Guga + Bruno Prosperi (28/04/2026)** | **POC parcial → Protótipo (core) → Piloto (operação real)** |
| **Phase 18 (Google Drive como Fonte — FA-14)** | **Pedido novo Guga (28/04/2026, versão ajustada read-only)** | **Protótipo (base) → Piloto (cleanup report + curadoria assistida) → MVP (refinamentos)** |

**Lacunas no ROADMAP atual** que esta Parte 5 endereça e que não estavam mapeadas:

1. **POC do Moon Shot (FA-02)** — único módulo que ainda exige validação prévia de viabilidade técnica (BR-001 critério ≥60% de provocações úteis em testes blind); não constava como Phase no ROADMAP.
2. **Mensuração coletiva e Custo Evitado (FA-10)** — dashboard executivo, MLflow tracing 100%, cálculo de custo evitado por Skill, KPIs de negócio (win rate, shortlist rate, retenção), mensuração de homogeneização (RN-019/020) não constavam como Phase explícita.
3. **Safety Cultural (FA-11)** — marcação visual, forced reflection, tracks de onboarding por carreira, validação de vocabulário UI (RN-014/015/016/017) não constavam como Phase explícita.
4. **Biblioteca v2 com governança** — Caixa-preta operacional (RN-011), detecção de conhecimento crítico em risco (RN-008), retenção LGPD (RN-013) não constavam como Phase explícita após upload básico.
5. **Integração com Skills + Workflows como gates de Piloto** — operação real com champions com schedule funcionando em Cloud Scheduler real (FA-05-08) não estava destacada como gate.

### 1.5. Restrições que Condicionam o Roadmap

| Restrição | Impacto no Roadmap | Origem |
|-----------|-------------------|--------|
| **REST-01** — Time não-dedicado 100% (Heitor, Zé, William, Fabinho, Yuri compartilham com outras frentes) | Estimativas em semanas-calendário (não pessoa-semana). Buffer de 30% sobre estimativas técnicas das specs SDD | BRD Parte 1 §5.1 |
| **REST-04** — Business case ainda não aprovado pela Diretoria | **BLOQUEADOR para Phase 16** (Image Editor + Video Generation, FA-08-02 a FA-08-05); investimentos maiores dependem de aprovação por Guga + Ronaldo | BRD Parte 1 §5.1 + DEC-06 |
| **REST-02** — Produto 100% interno | Sem incentivo comercial externo; ritmo sustentável, não pressionado por release dates de mercado | BRD Parte 1 §5.1 |
| **REST-05** — Patrocínio executivo concentrado em sponsor único (Guga) | Demos semanais (terças) precisam manter visibilidade ininterrupta — gate de comunicação por fase | BRD Parte 1 §5.1 |
| **REST-06** — Diretriz interna de proteção de IP (Caixa-preta) | RBAC + ocultação Biblioteca para Operacional são gates de Piloto, não opcionais | BRD Parte 1 §5.1 |

### 1.6. Relação com Outros Artefatos

| Artefato | Relação |
|----------|---------|
| BRD Parte 1 (Restrições REST-01 a REST-06) | Condicionam estimativas e bloqueadores |
| BRD Parte 3 (BRs com prioridade) | Definem ordem de entrada nas fases |
| PRD Parte 1 (FA-01 a FA-12) | Features distribuídas por fase |
| PRD Parte 4 (FR-100 a FR-159) | FRs alocados por fase via §3 |
| FRD Moon Shot (FR-001 a FR-018) | Detalhamento da POC e Piloto de FA-02 |
| ROADMAP.md | Phases técnicos remapeados aqui em fases de produto |
| Specs SDD (`docs/specs/large/`) | Estimativas técnicas das fases de implementação |

---

## 2. Visão Geral por Fase

### 2.1. Resumo de Escopo

| Fase | Features Incluídas | FRs (Parte 4) | Personas Core | Jornadas Completas |
|------|--------------------|---------------|---------------|--------------------|
| **POC** | FA-02 (Moon Shot — pipeline mínimo) **+ FA-13-01/02 (submissão + 1 validator com mock)** | FR-001 a FR-011 (FRD externo) **+ FR-160, FR-161 (1 validator)** | PX-02 (Criativo Sênior), PX-04 (Planejamento) | JN-02 parcial, JN-06 parcial, **JN-11 parcial** |
| **Protótipo** | FA-01 (v2), FA-03, FA-04, FA-06, FA-07, FA-12 + Phase 11 (Polish + Deploy) **+ FA-13-03 a 05/08 (Validation Report, Inbox, Detail, notificação)** **+ FA-14-01/02/03/06/08 (conexão OAuth, sync, ACL∩RBAC, ingestão, audit)** | ~30 FRs originais **+ FR-162 a FR-167, FR-170 (Aprovação core) + FR-171 a FR-174, FR-177 (Drive base)** | PX-01, PX-02, PX-03, **PX-06 Aprovador** | JN-01, JN-02, JN-03 (parciais), **JN-11 e JN-12 parciais** |
| **Piloto** | Todas anteriores + FA-02 (modos completos), FA-05 (com schedule real), FA-08-01/02/03 (Image gen real + Editor), FA-09 (Caixa-preta + LGPD), FA-10 (MLflow + dashboard + custo evitado), FA-11 **+ FA-13-06/07/09 (anti-loop, hierarquia, auditoria) + 2º validator (Português)** **+ FA-14-04/05/07 (Cleanup Report, curadoria assistida, exclusão por cliente)** | + ~24 FRs anteriores **+ FR-168/169 + FR-163 + FR-175/176/178/179** | Todas (PX-01 a PX-06) | JN-01 a JN-08 (completas), **JN-11 e JN-12 (completas)** |
| **MVP** | Todas + FA-08-04/05 (Video Veo 3.1) + FA-10-08/09 (homogeneização) + Phases 12, 13, 15 **+ FA-13 validators adicionais (Legal, Acessibilidade) + integração Slack** **+ FA-14 webhook em mais pastas + dashboard refinado** | + ~6 refinamentos | Todas | JN-01 a JN-12 (completas) |

### 2.2. Evolução Visual

```
       POC                    Protótipo                     Piloto                          MVP
   (4-6 semanas)        (em curso, ~80% pronto)         (12-20 semanas)               (Q1 2027 →)
   ┌────────────┐       ┌──────────────────────┐       ┌──────────────────────────┐   ┌──────────────────────────────┐
   │ FA-02      │ ───►  │ FA-01 v2             │ ───►  │ Todas anteriores         │ ─►│ Todas + FA-08-04/05 (Video) │
   │ pipeline   │       │ FA-03 Skills         │       │ FA-02 modos completos    │   │ FA-10-08/09 (Homogeneização)│
   │ mínimo     │       │ FA-04 Chat           │       │ FA-05 Workflows real     │   │ Phases 12, 13, 15           │
   │ Explorer↔  │       │ FA-06 Sistema Solar  │       │ FA-08-01/02/03 (Img)     │   │ Cobertura ≥10 tarefas-alvo  │
   │ Crítico    │       │ FA-07 HITL           │       │ FA-09 Caixa-preta + LGPD │   │ ≥3 cases internos/trimestre │
   │            │       │ FA-12 Admin          │       │ FA-10 MLflow + dashboard │   │ Business case aprovado      │
   │            │       │ + Phase 11 Deploy    │       │ FA-11 Safety cultural    │   │                              │
   └────────────┘       └──────────────────────┘       └──────────────────────────┘   └──────────────────────────────┘
   3+ Creators           5-10 Creators                  Champions Gus/Teda/Le         Todos os ~300 Creators
   seniores blind         internos                       + 10+ UAS reais              do grupo United Creators
   JN-02, JN-06           JN-01, JN-02, JN-03            JN-01 a JN-08 completas      JN-01 a JN-10 completas
   parciais               parciais                                                     + Cmd+K + Sidebar dinâmico
```

---

## 3. Fase 1: POC (Proof of Concept) — Moon Shot

### 3.1. Objetivo de Negócio da Fase

| Aspecto | Descrição |
|---------|-----------|
| **O que testar** | Viabilidade técnica e cultural do motor de Provocação Criativa (FA-02) — o **Moon Shot Devora o briefing e Provoca Faíscas** úteis em zona Sweet Spot de bisociação? |
| **Sucesso de negócio** | ≥60% das provocações classificadas como úteis por 3+ Creators seniores em testes blind (BR-001 critério primário) |
| **Quem testa** | 3+ Creators seniores (Bruno Prosperi como sócio Criação + dupla de criação sênior selecionada) em testes blind controlados |
| **Duração típica** | 4–6 semanas-calendário (considerando REST-01 — time não-dedicado) |
| **Ambiente** | Lab/Studio interno; pipeline rodando localmente ou em ambiente isolado |

### 3.2. Features do POC

| Feature | Escopo no POC | Subfeatures Incluídas |
|---------|---------------|----------------------|
| **FA-02 — Moon Shot** | Pipeline mínimo Explorer↔Crítico + filtragem por zona Sweet Spot, sem UX completa | FA-02-01 (Pipeline Explorer↔Crítico), FA-02-02 (Filtragem por zona de bisociação Sweet Spot cosseno 0.5–0.85) |
| **FA-01 — Biblioteca (mock leve)** | Subset de KnowledgeItems mocados (10–20 documentos representativos de 1 cliente) para Devorar contexto | (sem subfeatures formais — mock embarcado) |

### 3.3. FRs do POC (Referenciados no FRD Moon Shot)

| FR | Nome (do FRD externo) | Criticidade | BR Relacionado |
|----|----------------------|-------------|----------------|
| FR-001 | Acionamento contextual a partir de cliente ativo | Core | BR-001 |
| FR-008 | Pipeline Explorer↔Crítico convergência por score ≥8 | Core | BR-001 |
| FR-010 | Devorar briefing/tema do Creator | Core | BR-001 |
| FR-011 | Filtragem por zona de bisociação (Sweet Spot default) | Core | BR-001 |
| FR-015 a FR-017 | Marcação Faísca/Brasa, dimensões de avaliação | Core | BR-001, BR-010 |

> Observação: FR-001 a FR-018 vivem no FRD Moon Shot (externo). Esta Parte 5 referencia mas não duplica.

### 3.4. Jornadas Suportadas no POC

| Jornada | Status no POC | Limitações |
|---------|---------------|------------|
| **JN-02** (Ideação contextualizada do Criativo Sênior) | Parcial | Sem Chat completo; pipeline roda em fixture; sem persistência de Faíscas aprovadas |
| **JN-06** (Devil's advocate "Me prova que tá errada") | Parcial | Modo configurável apenas em código; sem UX do modo |
| Demais jornadas | Não aplicável | Foco do POC é exclusivamente FA-02 |

### 3.5. Personas Atendidas no POC

| Persona | Fluxo no POC | JTBD Atendidos |
|---------|--------------|----------------|
| **PX-02** Criativo Sênior (primária) | Submete briefing curto → recebe 5–10 Faíscas filtradas pela zona Sweet Spot → avalia em formulário externo (Google Form ou similar) | "Romper bloqueio sem perder ownership", "Testar provocações inesperadas" |
| **PX-04** Planejamento Estratégico (secundária) | Mesma mecânica com briefings de mercado | "Conectar insights de domínios distantes" |

### 3.6. Critérios de Sucesso do POC

| Critério | Métrica | Threshold |
|----------|---------|-----------|
| **Utilidade percebida** | % de provocações classificadas como "úteis" por 3+ Creators seniores em teste blind | **≥60%** (BR-001) |
| **Filtragem efetiva da zona Sweet Spot** | % de provocações descartadas automaticamente nas zonas "óbvio" (cosseno > 0.85) e "incoerente" (cosseno < 0.5) | **≥90%** (BR-001) |
| **Convergência técnica do loop** | % de execuções que convergem com score médio ≥8 antes de N=5 iterações | ≥70% |
| **Cobertura de zonas** | Distribuição de provocações aprovadas dentro do Sweet Spot (cosseno 0.5–0.85) — calibração inicial | Distribuição visível e calibrável |

### 3.7. Critérios de Saída POC → Entrada no Protótipo

- [ ] Critério ≥60% de utilidade atingido em ≥1 rodada blind controlada com 3+ Creators seniores
- [ ] Filtragem efetiva ≥90% nas zonas "óbvio" e "incoerente" verificada em log de execuções
- [ ] Bruno Prosperi (sócio Criação) aprovou o **conceito de Faísca** como linguagem de produto (compatível com cultura criativa Suno; sem percepção de "fricção decorativa")
- [ ] Calibração inicial das 3 dimensões (Novidade × Coerência × Potencial Criativo) documentada em ADR
- [ ] Decisão tomada sobre **quais personas brasileiras dos agentes** (Antropófaga, Carnavalesco, Anciã) avançam para o Protótipo (validação ASS-05 do PRD Parte 1)
- [ ] Sponsor (Guga) aprovou seguir para integração no Chat e na Biblioteca real

### 3.8. Riscos Top-3 da POC

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|:-------------:|:-------:|-----------|
| 1 | **Provocações fora do Sweet Spot dominam o output** (zona "óbvio" ou "incoerente" não calibradas para vocabulário publicitário em PT-BR) | Alta | Alto | Calibração iterativa em testes A/B com Creators seniores; ajuste de thresholds cosseno antes de cada rodada blind; eval datasets com pares de referência humana |
| 2 | **Resistência cultural ao conceito de "Faísca / Brasa"** (Creators seniores reagem como fricção decorativa, não como ferramenta de quebra) | Média | Alto | Validação cultural prévia com Bruno Prosperi (PA-04 a validar); manifesto de produto interno publicado antes da rodada blind; vocabulário Suno em toda copy (RN-016) |
| 3 | **Time não-dedicado limita iteração de calibração** (REST-01) | Alta | Médio | Reduzir escopo do POC para 1 cliente + 10–20 documentos mocados; cadência fixa de demos semanais com Guga (terças) para manter foco; SDD adaptativo `sdd-koro` mantém artefatos enxutos |

### 3.9. Dependências Cross-Feature da POC

| Feature | Tipo de Dependência | Criticidade |
|---------|---------------------|-------------|
| FA-01 (Biblioteca — mock embarcado) | Dados — pipeline precisa Devorar contexto real, mesmo que mocado | Alta |
| FA-04 (Chat — opcional, pode rodar via CLI/notebook) | UX — ideal mas não bloqueador para POC | Média |
| FA-10 (MLflow tracing — recomendado) | Observabilidade — capturar latência, tokens, custo do pipeline | Média |

---

## 4. Fase 2: Protótipo

### 4.1. Objetivo de Negócio da Fase

| Aspecto | Descrição |
|---------|-----------|
| **O que testar** | Como os fluxos principais do sunOS funcionam e se comportam — Sistema Solar, Skills processuais com contexto, Chat ReAct com streaming, Biblioteca v2, HITL, Admin areas |
| **Sucesso de negócio** | Fluxos validados por 5–10 Creators internos; arquitetura técnica estável (FastAPI + LangGraph + Firebase Auth + SSE) pronta para Piloto |
| **Quem testa** | 5–10 Creators internos (mix de PX-01, PX-02, PX-03); time do projeto + champions iniciais (Le) |
| **Duração típica** | Em curso desde Phase 1 (2026-03-23) — concluído em ~80% até Phase 10 (2026-03-26); Phase 11 (Polish + Deploy) é o **gate de saída** |
| **Ambiente** | Lab/Studio + staging em Cloud Run |

### 4.2. Features do Protótipo

| Feature | Escopo no Protótipo | Subfeatures Incluídas | Status |
|---------|---------------------|----------------------|:------:|
| **FA-01 — Biblioteca v2** | Upload + curadoria com metadados + indexação dual (pgvector + grafo) + busca semântica + escopo Suno/cliente | FA-01-01 a FA-01-05 | **Em Produção** (Phase 4 + SPEC `knowledge-biblioteca-v2`) |
| **FA-03 — Skills processuais** | 8 Skills atuais (Copy Social, Texto de Rádio, Roteiro de Vídeo, Plano de Mídia, Report Performance, Persona Sintética, Brief Builder, Análise de Mercado) + context injection + Moons + system prompts versionados | FA-03-01, FA-03-02, FA-03-03, FA-03-05 | **Em Produção** (Phase 3 + SPEC-001) |
| **FA-04 — Chat ReAct streaming SSE** | Chat com Gemini Flash real, ModelSelector, agentes ReAct (ContentCreator, VisualCreator, Conversational), Prompt Templates com Moon chips, Variações automáticas | FA-04-01 a FA-04-07 | **Em Produção** (Phases 8–9 + SPEC-001) |
| **FA-06 — Sistema Solar** | Sun → Planetas → Órbitas → Moon chips (3 níveis após SPEC-007); QuickStats bar; ≤3 cliques | FA-06-01 a FA-06-06 | **Em Produção** (Phase 1 + SPEC-007) |
| **FA-07 — HITL Feedback** | Thumbs + comentário inline, rating 1-5 por sessão, painel sidebar, score por Skill | FA-07-01 a FA-07-05 | **Em Produção** (Phase 5) |
| **FA-12 — Admin areas** | CRUD `/skills`, `/biblioteca`, `/clientes`, `/workflows` com pattern Model Repo (SPEC-005); Dark/Light theme | FA-12-01 a FA-12-07 | **Em Produção** (Phases 3, 4, 6 + SPEC `ux-redesign`) |
| **FA-09 — RBAC base** | Auth Google + Firebase Custom Claims (admin/creator) | FA-09-01, FA-09-02 | **Em Produção** (Phase 10) |
| **Phase 11 — Polish + Deploy (gate de saída)** | Error handling robusto, CI/CD GitHub Actions, deploy staging Cloud Run, smoke test, endpoints batch (TextGen, ImageGen panels), testes integração com API keys reais | (transversal) | **Em progresso** |

### 4.3. FRs do Protótipo (~30 FRs)

| Faixa | Origem | Quantidade | Status |
|-------|--------|:----------:|:------:|
| FR-100 a FR-104 | FA-01 Biblioteca (ingestão, metadados, indexação, escopo, busca) | 5 | Em Produção |
| FR-109 a FR-112, FR-115 | FA-03 Skills (catálogo, context injection, Moons, prompts versionados, score) | 5 | Em Produção |
| FR-116 a FR-120 | FA-04 Chat (streaming SSE, ModelSelector, ReAct, templates, variações) | 5 | Em Produção |
| FR-128 a FR-130 | FA-06 Sistema Solar (Sun/Planetas/Órbitas, Moon chips, ≤3 cliques) | 3 | Em Produção |
| FR-131 a FR-134 | FA-07 HITL (thumbs, rating, painel, score) | 4 | Em Produção |
| FR-138, FR-139 | FA-09 RBAC base (Auth Google + Custom Claims) | 2 | Em Produção |
| FR-156 a FR-159 | FA-12 Admin (CRUD Skills, Biblioteca, Clientes, Workflows) | 4 | Em Produção |
| **Total Protótipo** | — | **~28 FRs** | — |

### 4.4. Jornadas Suportadas no Protótipo

| Jornada | Status no Protótipo | Incremento vs POC |
|---------|---------------------|-------------------|
| **JN-01** (Curadoria do Líder) | Parcial | Nova jornada — CRUD Biblioteca + metadados |
| **JN-02** (Ideação contextualizada) | Parcial | Era POC parcial — agora com Chat real e Biblioteca real |
| **JN-03** (Execução de tarefa processual) | Parcial | Nova jornada — Skills processuais com context injection |
| JN-04, JN-05, JN-06, JN-07, JN-08 | Não cobertas | — |

### 4.5. Personas Atendidas no Protótipo

| Persona | Fluxo no Protótipo | JTBD Atendidos |
|---------|--------------------|----------------|
| **PX-01** Líder/Curador | Curar Biblioteca, configurar Skills, criar Clientes via Admin | "Curar repertório", "Configurar capacidades" |
| **PX-02** Criativo Sênior | Conversar com IA via Chat com contexto, gerar variações | "Refinar drafts sem perder ownership" |
| **PX-03** Operador Processual | Executar Skills processuais via Chat com Moon chips | "Executar tarefa com contexto preservado" |
| PX-04, PX-05 | Não cobertos formalmente | — |

### 4.6. Critérios de Sucesso do Protótipo

| Critério | Métrica | Threshold |
|----------|---------|-----------|
| **Estabilidade técnica** | Smoke test E2E em staging Cloud Run passando 5 dias consecutivos | 100% sucesso |
| **CI/CD pronto** | GitHub Actions: lint, pytest, type-check, build | Pipeline verde |
| **Persistência de conversas** | Conversas sobrevivem entre sessões (débito P1 endereçado) | Implementado |
| **Validação por usuários internos** | 5–10 Creators completaram ≥3 sessões cada sem bug bloqueador | ≥80% das sessões sem bug |
| **Latência percebida do Chat** | TTFB do streaming SSE | <2s (p95) |
| **Cobertura de testes** | Pytest coverage do `api/chat/` | ≥70% |

### 4.7. Critérios de Saída Protótipo → Entrada no Piloto

- [ ] **Phase 11 concluída**: error handling robusto + CI/CD + deploy staging + smoke test
- [ ] **Persistência de conversas** entre sessões implementada (débito P1 do handoff resolvido)
- [ ] **Endpoints batch** (TextGen, ImageGen panels) operacionais
- [ ] **Testes de integração com API keys reais** (Gemini, OpenAI, Anthropic, Vertex AI Imagen) passando
- [ ] **POC do Moon Shot (FA-02) concluída** com critérios de saída atendidos (vide §3.7)
- [ ] **Champions identificados e onboarded**: Gus e Teda (Mídia, time Takai), Le (outras áreas)
- [ ] **Decisão DEC-02 tomada** (Workflows entram em Piloto ou só MVP)
- [ ] **Sponsor (Guga) e patrocinadores sócio (Bruno, Takai, Ronaldo) aprovaram avanço para Piloto** em reunião semanal de terça
- [ ] **Manifesto de produto interno publicado** (gate cultural — RN-014/015)

### 4.8. Riscos Top-3 do Protótipo

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|:-------------:|:-------:|-----------|
| 1 | **Phase 11 (Polish + Deploy) atrasa por dependência GCP** (project setup, IAM, Cloud Run quotas) | Média | Alto | Iniciar setup GCP em paralelo a desenvolvimento; documentar IaC; staging primeiro, produção depois; uso de Cloud Run reduz friction de deploy |
| 2 | **Persistência de conversas é débito P1 que afeta HITL e Eval** (sem persistência, dados de feedback não acumulam consistentemente — ASS-03) | Média | Alto | Endereçar antes de Piloto; Postgres Cloud SQL shared já disponível (api/CLAUDE.md); schema de Message + Session já modelado em SRD Domain Model |
| 3 | **Custo de LLM escalar com uso interno crescente** (Gemini Flash ainda é pago em grande volume) | Alta | Médio | Gemini Flash como padrão (barato); rate limits por Skill; MLflow tracing para detectar abusos; alertas de custo no dashboard FA-10 |

### 4.9. Dependências Cross-Feature do Protótipo

| Feature Origem | Feature Destino | Tipo de Dependência | Criticidade |
|----------------|-----------------|---------------------|:-----------:|
| FA-01 Biblioteca | FA-03 Skills | Dados (context injection via tool `search_knowledge`) | Alta |
| FA-01 Biblioteca | FA-04 Chat | Dados (ContextSidebar consome Biblioteca) | Alta |
| FA-03 Skills | FA-04 Chat | Operacional (toda Skill chega via Chat) | Alta |
| FA-03 Skills | FA-07 HITL | Dados (Score por Skill agregado) | Alta |
| FA-04 Chat | FA-07 HITL | UX (feedback inline vive aqui) | Alta |
| FA-06 Sistema Solar | FA-04 Chat | UX (navegação leva ao Chat) | Alta |
| FA-09 RBAC | FA-12 Admin | Operacional (perfis acessam Admin areas) | Alta |
| FA-12 Admin | FA-01, FA-03 | Operacional (CRUD das entidades) | Alta |

---

## 5. Fase 3: Piloto

### 5.1. Objetivo de Negócio da Fase

| Aspecto | Descrição |
|---------|-----------|
| **O que testar** | Solução funciona no contexto real com Creators usando para trabalho de cliente — Skills aceleram tarefas, Workflows agendados rodam em Cloud Scheduler real, HITL acumula dados, Caixa-preta protege Operacionais, dashboard executivo gera evidências para Diretoria |
| **Sucesso de negócio** | KPIs da Parte 1 §2.3 atingidos: 10+ UAS, 50+ msgs/sem, score HITL > 4.0, 5+ Workflows ativos com schedule, ≥30% redução de tempo em ≥5 tarefas-piloto, ≥3 cases internos documentados |
| **Quem testa** | Champions (Gus/Teda em Mídia, Le em outras áreas) + 10+ usuários ativos semanais reais; sponsor (Guga) acompanha via dashboard |
| **Duração típica** | 12–20 semanas-calendário (considerando REST-01) |
| **Ambiente** | Real World — produção em Cloud Run com clientes reais (subset controlado de contas) |

### 5.2. Features do Piloto

| Feature | Escopo no Piloto | Subfeatures Incluídas | Incremento vs Protótipo |
|---------|------------------|----------------------|-------------------------|
| **FA-01 — Biblioteca v2 (governança)** | + Visibilidade por status do cliente + Detecção de conhecimento em risco + Política LGPD aprovada | + FA-01-06, FA-01-07, FA-01-08 | Governança operacional completa |
| **FA-02 — Moon Shot (modos completos)** | + Acionamento contextual ≤3 cliques + Personas brasileiras + Modos dupla/me prova/começando + Marcação Faísca + Forced reflection | + FA-02-03 a FA-02-08 | UX completa pós-POC |
| **FA-03 — Skills (cobertura)** | + Hierarquia de truncamento RN-021 + Score real do HITL + Avaliação mensal de redução de tempo | + FA-03-04, FA-03-06, FA-03-07 | Operação real com baseline |
| **FA-04 — Chat (completo)** | + Chat Attachments (SPEC-006) + persistência completa | + FA-04-08 | UX completa |
| **FA-05 — Workflows Automatizados** | Builder + Compilação LangGraph + Schedule Cloud Scheduler real + Encadeamento + 4 Templates + HITL gates + Histórico + Integração API/webhook | FA-05-01 a FA-05-08 | **Nova feature** (em produção desde SPEC `workflow-builder` mas schedule real é gate Piloto) |
| **FA-08 — Multimodal (Image)** | Image generation Vertex AI Imagen 4 / Nano Banana real (sai do mock) + Image editing inpainting/outpainting + Enhance/upscale | FA-08-01, FA-08-02, FA-08-03, FA-08-06 | **Nova feature** — SPEC `image-editor` do ROADMAP Phase 16 entra aqui (parcial) |
| **FA-09 — Governança/RBAC + Caixa-preta** | + Caixa-preta da Biblioteca para Operacional + Isolamento entre clientes + Auditoria de acessos administrativos + Detecção de anomalias + Retenção LGPD | + FA-09-03 a FA-09-07 | Cobertura completa para uso real |
| **FA-10 — Mensuração + Dashboard** | Tracing 100% MLflow + Eval framework + Cálculo de custo evitado por Skill + Dashboard executivo mensal + KPIs negócio (≥3) + Reporting <30s + Mapeamento 136 atividades atualizado | FA-10-01 a FA-10-07 | **Nova feature** — gate de business case |
| **FA-11 — Safety Cultural & Ownership** | Marcação Faísca + Forced reflection N=5/N=3 + Tracks de onboarding por carreira + Personas brasileiras + Modo dupla + Manifesto interno + Validação cultural com Sponsor | FA-11-01, FA-11-02, FA-11-03, FA-11-05, FA-11-06, FA-11-07, FA-11-09 | **Nova feature** — transversal |
| **FA-12 — Admin (cobertura cultural)** | + Validação automática de vocabulário em copy (RN-016) | + FA-12-08 | Cobertura cultural |

### 5.3. FRs do Piloto (+ ~24 FRs novos sobre Protótipo)

| Faixa | Origem | Quantidade | Novo/Herdado |
|-------|--------|:----------:|:------------:|
| FR-100 a FR-108 | FA-01 (completa: + visibilidade, risco, retenção LGPD) | +4 (FR-105 a FR-108) | Novo |
| FR-109 a FR-115 | FA-03 (completa: + truncamento, score, avaliação mensal) | +2 (FR-113, FR-114) | Novo |
| FR-116 a FR-121 | FA-04 (+ Chat Attachments) | +1 (FR-121) | Novo |
| FR-122 a FR-127 | FA-05 Workflows (todos) | +6 | Novo |
| FR-135, FR-136 | FA-08 Image gen real + Editor (FR-137 fica para MVP) | +2 | Novo |
| FR-138 a FR-143 | FA-09 (completa: + Caixa-preta, isolamento, auditoria, LGPD) | +4 (FR-140 a FR-143) | Novo |
| FR-144 a FR-148 | FA-10 (Tracing, Eval, custo evitado, dashboard, KPIs) | +5 | Novo |
| FR-151 a FR-155 | FA-11 Safety Cultural (todos exceto FR-149/150 que ficam para MVP) | +5 | Novo |
| FR-159 (extensão) | FA-12 (validação vocabulário em copy) | +1 | Novo |
| **Total novo no Piloto** | — | **~24 FRs** | — |
| Herdados do Protótipo | — | ~28 | Herdado |
| **Total Piloto** | — | **~52 FRs** | — |

### 5.4. Jornadas Suportadas no Piloto

| Jornada | Status no Piloto | Incremento |
|---------|------------------|------------|
| JN-01 (Curadoria) | Completa | Era parcial — agora com governança LGPD + detecção de risco |
| JN-02 (Ideação contextualizada) | Completa | Era parcial — agora com Moon Shot completo + persistência |
| JN-03 (Execução processual) | Completa | Era parcial — agora com truncamento + score real |
| **JN-04** (Análise estratégica) | Completa | Nova jornada — Análise de Mercado + Persona Sintética com contexto |
| **JN-05** (Captura pré-saída/Offboarding) | Parcial | Nova jornada — detecção de conhecimento em risco implantada |
| **JN-06** (Devil's advocate) | Completa | Nova jornada — modo "Me prova que tá errada" do Moon Shot |
| **JN-07** (Configuração de Workflow agendado) | Completa | Nova jornada — Workflow Builder + Cloud Scheduler real |
| **JN-08** (Governança e mensuração) | Completa | Nova jornada — Dashboard executivo + auditoria + custo evitado |

### 5.5. Personas Atendidas no Piloto

| Persona | Fluxo no Piloto | JTBD Atendidos |
|---------|-----------------|----------------|
| PX-01 Líder/Curador (primária) | Fluxo completo — curadoria + governança + dashboard + Workflows | Todos |
| PX-02 Criativo Sênior | Fluxo completo — ideação + Moon Shot + ownership preservado | Todos |
| PX-03 Operador Processual (primária) | Fluxo completo — Skills processuais com Caixa-preta ativa, sem ver Biblioteca | Todos |
| **PX-04 Planejamento Estratégico** | Fluxo completo — Análise de Mercado + Persona Sintética + Moon Shot | Todos |
| **PX-05 Creator Junior** | Fluxo com track júnior — Moon Shot modo "Começando uma ideia" + forced reflection N=3 | Subset focado em proteção de over-reliance |

### 5.6. Critérios de Sucesso do Piloto

| Critério | Métrica | Threshold | Origem |
|----------|---------|-----------|--------|
| **Adoção semanal** | Usuários Ativos Semanais (UAS) | ≥10 | Parte 1 §2.3 |
| **Engajamento** | Mensagens de chat por semana | ≥50 | Parte 1 §2.3 |
| **Qualidade HITL** | Score médio (1-5) | >4.0 | Parte 1 §2.3 |
| **Automação ativa** | Workflows com schedule rodando em Cloud Scheduler real | ≥5 | Parte 1 §2.3 |
| **Aceleração de Skills** | Redução de tempo médio em ≥5 tarefas-piloto | ≥30% | BR-002 |
| **Cobertura de tarefas** | Tarefas-alvo distintas cobertas por Skills | ≥10 | BR-002 |
| **Cases documentados** | Cases internos com impacto atribuível ao sunOS | ≥3/trimestre | BR-003 |
| **Caixa-preta operante** | Operacional em ambiente real não vê Biblioteca em nenhum menu/link/breadcrumb | 0 vazamentos | RN-011 |
| **Aprovação Moon Shot real** | % de Faíscas aprovadas por Creators em uso real | ≥70% | BR-001 |
| **Provocações úteis (validação contínua)** | % de provocações classificadas como úteis | ≥60% sustentado | BR-001 |
| **Custo evitado mensurado** | Skills com tempo manual baseline calculado | 100% das Skills em uso | BR-013, RN-018 |

### 5.7. Critérios de Saída Piloto → Entrada no MVP

- [ ] **Todos os critérios §5.6 atingidos** por ≥2 trimestres consecutivos
- [ ] **Business case formal aprovado pela Diretoria** (REST-04 resolvido — Heitor + Ronaldo concluíram cálculo das 136 atividades; Guga aprovou em reunião terça)
- [ ] **Cobertura de ≥80% das contas críticas** com contexto-mínimo documentado na Biblioteca (BR-005)
- [ ] **Política LGPD aprovada** para retenção de logs e dados pessoais (RN-013)
- [ ] **NDA + processos formais** para colaboradores com acesso administrativo documentados (FA-09-08, BR-007)
- [ ] **Sponsor (Guga) e patrocinadores sócio aprovam** transição para produção contínua e Phase 16 completa
- [ ] **Validação cultural com Bruno Prosperi** sobre Moon Shot em uso real (sem reação de fricção decorativa) — ASS-04 resolvida
- [ ] **Time não-dedicado escalável**: pelo menos 2 contratações ou realocações aprovadas para sustentar MVP
- [ ] **Decisão DEC-06** tomada (budget Phase 16 aprovado para Image Editor + Video Generation)

### 5.8. Riscos Top-3 do Piloto

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|:-------------:|:-------:|-----------|
| 1 | **Business case não aprovado pela Diretoria a tempo** (REST-04 + DEC-06) bloqueia investimentos maiores e pode interromper continuidade do projeto | Média | **Crítico** | Heitor + Ronaldo aceleram cálculo das 136 atividades; reuniões semanais de terça apresentam evidências incrementais; dashboard FA-10-04 publica custo evitado mensal a partir do mês 2; ≥3 cases internos documentados por trimestre como prova social |
| 2 | **Adoção lenta por resistência cultural** (champions Gus/Teda/Le não conseguem mobilizar áreas) — risco crítico se UAS < 10 ao final do trimestre 1 do Piloto | Média | Alto | Champions distribuídos por área (1 por BU); treinamento contínuo; demos semanais; tracks de onboarding por carreira (FA-11-03); manifesto de produto interno; testes A/B de Skills com baseline manual visível |
| 3 | **Vertex AI Veo + Imagen com quota insuficiente ou custo escalando** (FA-08-01 sai do mock, FA-08-02 entra real) | Média | Alto | Validar quota antes de Phase 5 do plan SPEC `image-editor`; Gemini Flash como default em texto; rate limits por Skill; alertas no dashboard; lifecycle rules em GCS staging (TTL 24h); fallback para mock em caso de quota |

### 5.9. Dependências Cross-Feature Críticas do Piloto

| Feature Origem | Feature Destino | Tipo de Dependência | Criticidade | Observação |
|----------------|-----------------|---------------------|:-----------:|------------|
| FA-01 Biblioteca | FA-02 Moon Shot | Dados — Devora contexto real | **Alta** | Sem Biblioteca real, Moon Shot volta a ser POC |
| FA-02 Moon Shot | FA-04 Chat | Operacional — pipeline roda no Chat | Alta | UX completa precisa do Chat com Moon chips |
| FA-02 Moon Shot | FA-10 Mensuração | Dados — DiversityMetric mede homogeneização | Alta | Necessário para RN-019/020 (parcial no Piloto, completo no MVP) |
| FA-05 Workflows | FA-03 Skills | Operacional — orquestra Skills | Alta | Sem Skills maduras, Workflows não geram valor |
| FA-05 Workflows | FA-09 RBAC | Operacional — quem pode criar/executar | Alta | Cloud Scheduler real exige RBAC funcionando |
| FA-08 Image gen | FA-04 Chat | Operacional — VisualCreator chega via Chat | Alta | Copy Social e Roteiro de Vídeo dependem de imagem real |
| FA-09 RBAC | FA-01 Biblioteca | Operacional — Caixa-preta protege Biblioteca | **Alta** | Gate de Piloto — sem Caixa-preta, Operacional não pode usar |
| FA-09 RBAC | FA-03 Skills | Operacional — system prompts protegidos | Alta | Caixa-preta sobre system prompts (BR-007) |
| FA-10 Mensuração | FA-09 RBAC | Dados — auditoria depende de tracing | Alta | Detecção de anomalias > 3σ |
| FA-10 Mensuração | FA-07 HITL | Dados — feedback alimenta scorers | Alta | Sem HITL com volume, scorers não calibram |
| FA-11 Safety | FA-02, FA-04, FA-07, FA-08 | UX (transversal) — marcação Faísca, forced reflection | Alta | Padrão único de design |
| FA-12 Admin | FA-01, FA-03, FA-05 | UX — CRUD das entidades | Alta | Sem Admin, governança é manual |

---

## 6. Fase 4: MVP (Minimum Viable Product)

### 6.1. Objetivo de Negócio da Fase

| Aspecto | Descrição |
|---------|-----------|
| **O que testar** | Viabilidade do core da solução em produção contínua para todos os ~300 Creators do grupo United Creators — há demanda sustentada e a solução funciona como esperado em escala |
| **Sucesso de negócio** | Produto em produção contínua com business case aprovado pela Diretoria; ≥3 cases internos por trimestre; cobertura ≥10 tarefas-alvo automatizadas com redução ≥30% sustentada por 3+ meses; mensuração coletiva de homogeneização operante |
| **Quem testa** | Todos os ~300 Creators do grupo United Creators (Suno, SUP, SUPA, Revo/Paim, Koro, Ludi); rollout gradual por área; sponsor + Diretoria via dashboard |
| **Duração** | Contínuo (a partir de Q1 2027) — ciclo de evolução baseado em métricas e feedback |
| **Ambiente** | Real World — produção total |

### 6.2. Features do MVP

| Feature | Escopo no MVP | Status |
|---------|---------------|--------|
| FA-01 Biblioteca | Completa + ≥500 itens curados sustentado + zero conhecimento crítico em uma única pessoa | Refinada |
| FA-02 Moon Shot | Completa + calibração contínua de zonas + dataset de provocações aprovadas evoluindo Eval | Refinada |
| FA-03 Skills processuais | Completa + ≥80% das Skills com redução ≥30% sustentada por 3+ meses (RN-004) | Completa |
| FA-04 Chat | Completa + **Phase 13 (Cmd+K Busca Global)** + **Phase 12 (Sidebar Recentes Dinâmico)** | Refinada (UX) |
| FA-05 Workflows | Completa + 5+ Workflows ativos com schedule sustentado | Completa |
| FA-06 Sistema Solar | Completa + **Phase 15 (Integração Solar ↔ Admin)** opcional + responsividade refinada | Refinada (UX) |
| FA-07 HITL | Completa + Score HITL > 4.0 médio sustentado | Completa |
| FA-08 Multimodal | + **FA-08-04, FA-08-05 — Video generation Veo 3.0/3.1 (T2V e I2V)** — SPEC `video-generation` Phase 16 | **Nova capacidade** |
| FA-09 Governança/RBAC | + FA-09-08 NDA + processos formais | Completa |
| FA-10 Mensuração | + **FA-10-08 Mensuração mensal de homogeneização** (Mean Pairwise Cosine Distance, Self-BLEU, Compression Ratio) + **FA-10-09 Bloqueio de relatório com satisfação isolada** (RN-019/020) | **Nova capacidade crítica** |
| FA-11 Safety Cultural | + FA-11-04 Validação automática de vocabulário UI + FA-11-08 Métricas de uso por estágio de carreira | Completa |
| FA-12 Admin | Completa + refinamentos UX | Refinada |
| **Phase 14 (Onboarding/Empty States)** | Welcome screen + empty states ricos + guia getting started | **Nova** |

### 6.3. FRs do MVP (+ ~6 refinamentos sobre Piloto)

| Categoria | Quantidade | Descrição |
|-----------|:----------:|-----------|
| Herdados do Piloto | ~52 | FRs já implementados |
| Novos no MVP | ~6 | FR-137 (Video gen), FR-149 (Mensuração homogeneização), FR-150 (Bloqueio relatório), refinamentos UX (Cmd+K, Sidebar dinâmico, Onboarding) |
| Refinamentos | Vários | Melhorias em FRs existentes via feedback do Piloto |
| **Total combinado** | **~58 FRs (Parte 4) + 18 FRs (FRD Moon Shot)** | **76 FRs** |

### 6.4. Jornadas Completas no MVP

Todas as jornadas (JN-01 a JN-10, conforme PRD Parte 3) estarão completas no MVP, incluindo:

- JN-01 a JN-08 (já completas no Piloto)
- **JN-09** (Onboarding por estágio de carreira) — completa com Phase 14
- **JN-10** (Detecção e remediação de homogeneização coletiva) — completa com FA-10-08/09

### 6.5. Personas Atendidas no MVP

Todas as personas (PX-01 a PX-05, conforme PRD Parte 2) terão fluxos completos no MVP, incluindo:

- PX-05 Creator Junior com track júnior **completo** (welcome screen + tracks + métricas trimestrais por estágio)
- PX-04 Planejamento Estratégico com cobertura de Análise de Mercado escalada para ≥80% dos clientes ativos

### 6.6. Critérios de Sucesso do MVP

| Critério | Métrica | Threshold | Origem |
|----------|---------|-----------|--------|
| **Economia operacional** | % redução em tarefas repetitivas | ≥30% sustentado | Parte 1 §2.3 |
| **Custo evitado anual** | R$ economizado em horas redutíveis | A definir após business case | Parte 1 §2.3 |
| **Skills saudáveis** | % das Skills com redução ≥30% sustentada por 3+ meses | ≥80% | RN-004 |
| **Score HITL** | Score médio (1-5) sustentado | >4.0 médio anual | Parte 1 §2.3 |
| **Workflows ativos** | Workflows com schedule sustentado | ≥5 contínuos | Parte 1 §2.3 |
| **Cases por trimestre** | Cases internos documentados com impacto atribuível | ≥3/trimestre | BR-003 |
| **Cobertura Biblioteca** | KnowledgeItems curados | ≥500 | BR-004 |
| **Provocações úteis** | % aprovação de Faíscas em uso real sustentado | ≥70% | BR-001 |
| **Mensuração coletiva** | Mean Pairwise Cosine Distance entre outputs aprovados de mesma Skill (mensal) | Acima do baseline pré-sunOS | RN-019 |
| **Bloqueio satisfação isolada** | % de relatórios mensais com co-exibição de set-level diversity | 100% | RN-020 |
| **Validação cultural por release** | % de releases maiores aprovadas pelo Sponsor + patrocinadores sócio | ≥90% | FA-11-09 |

### 6.7. Phases do ROADMAP.md Realizadas no MVP

| Phase | Escopo | Status |
|-------|--------|--------|
| Phase 12 (Sidebar Recentes Dinâmico) | Rastreamento de navegação real + sessionStorage | MVP |
| Phase 13 (Busca Global Cmd+K) | Barra unificada cross-feature | MVP |
| Phase 14 (Onboarding / Empty States) | Welcome + getting started | MVP (entra no início) |
| Phase 15 (Integração Solar ↔ Admin) | Unificar `data/clients.ts` com ClientsContext (decisão pendente — ADR-002 mantém estático por enquanto) | MVP (opcional) |
| Phase 16 (VideoGen + Editor + Enhance) | Image editor (Piloto) + Video gen Veo 3.0/3.1 (MVP) | Piloto + MVP |

---

## 7. Dependências Críticas Cross-Feature

### 7.1. Mapa de Dependências por Fase

| Origem | Destino | Tipo | Fase em que se materializa | Criticidade |
|--------|---------|------|----------------------------|:-----------:|
| FA-01 Biblioteca | FA-02 Moon Shot | Dados (Devora contexto) | POC (mock) → Piloto (real) | **Alta** |
| FA-01 Biblioteca | FA-03 Skills | Dados (context injection) | Protótipo | Alta |
| FA-01 Biblioteca | FA-05 Workflows | Dados (search_knowledge tool) | Piloto | Alta |
| FA-02 Moon Shot | FA-04 Chat | Operacional | Piloto | Alta |
| FA-02 Moon Shot | FA-10 Mensuração | Dados (DiversityMetric) | Piloto (parcial) → MVP (completo) | Alta |
| FA-03 Skills | FA-04 Chat | Operacional | Protótipo | Alta |
| FA-03 Skills | FA-07 HITL | Dados (Score) | Protótipo | Alta |
| FA-04 Chat | FA-07 HITL | UX | Protótipo | Alta |
| FA-04 Chat | FA-08 Multimodal | Operacional (VisualCreator) | Piloto (Image) → MVP (Video) | Média |
| FA-04 Chat | FA-10 Mensuração | Dados (tracing) | Piloto | Alta |
| FA-05 Workflows | FA-03 Skills | Operacional | Piloto | Alta |
| FA-05 Workflows | FA-10 Mensuração | Dados (tracing execuções) | Piloto | Alta |
| FA-06 Sistema Solar | FA-04 Chat | UX | Protótipo | Alta |
| FA-06 Sistema Solar | FA-02 Moon Shot | UX (≤3 cliques) | Piloto | Alta |
| FA-07 HITL | FA-10 Mensuração | Dados (feedback alimenta dashboard) | Piloto | Alta |
| FA-09 RBAC | FA-01 Biblioteca | Operacional (Caixa-preta) | Piloto | **Alta — gate** |
| FA-09 RBAC | FA-03 Skills | Operacional (system prompts) | Piloto | Alta |
| FA-09 RBAC | FA-12 Admin | Operacional | Protótipo | Alta |
| FA-10 Mensuração | FA-09 RBAC | Dados (auditoria) | Piloto | Alta |
| FA-11 Safety | FA-02, FA-04, FA-07, FA-08 | UX (transversal) | Piloto | Alta |
| FA-12 Admin | FA-01, FA-03, FA-05 | UX (CRUD) | Protótipo | Alta |

### 7.2. Riscos de Transição entre Fases

| Transição | Risco | Mitigação |
|-----------|-------|-----------|
| **POC → Protótipo** | Pipeline da POC não integra naturalmente no Chat real (arquitetura LangGraph diferente da PoC isolada) | SPEC-001 já estabelece padrão `BaseAgent ABC` + `StateGraph` que o pipeline da POC pode adotar; usar mesmo eval framework |
| **Protótipo → Piloto** | Persistência de conversas (débito P1) não pronta a tempo, comprometendo HITL e Eval no Piloto | Endereçar antes do gate de saída do Protótipo (§4.7); schema já modelado em SRD; Postgres Cloud SQL shared disponível |
| **Protótipo → Piloto** | Caixa-preta da Biblioteca para Operacional (RN-011) implementada parcialmente, vazando vocabulário "Biblioteca" em mensagens de erro ou breadcrumbs | Auditoria completa de UI antes do Piloto; testes E2E com perfil Operacional explicitamente; substituição de termos por "contexto do cliente" |
| **Protótipo → Piloto** | Vertex AI quota não aprovada em projeto GCP, mantendo FA-08-01 em mock | Solicitar aumento de quota com 4 semanas de antecedência; documentar processo de pedido em ADR; fallback para mock |
| **Piloto → MVP** | Business case não aprovado pela Diretoria, bloqueando investimento em Phase 16 (Video) e contratações | Apresentar evidências incrementais a cada demo de terça; dashboard FA-10-04 ativo desde mês 2 do Piloto; ≥3 cases por trimestre como prova social |
| **Piloto → MVP** | Mensuração de homogeneização (FA-10-08) sem baseline pré-sunOS (PA-03/PA-06) — alertas RN-019 não funcionam | Mensurar baseline durante Piloto (mês 1) com sample de outputs históricos manuais; documentar PA-06 |
| **Piloto → MVP** | Saída de Heitor Miranda (PRE-04) interrompe roadmap | Documentação extensiva (ROADMAP, specs SDD, handoffs); transferência de conhecimento estruturada; backup técnico em Zé + William |

### 7.3. Decisões Críticas por Fase

| Fase | Decisão | Responsável | Prazo Sugerido |
|------|---------|-------------|----------------|
| **POC** | Confirmação das personas brasileiras dos agentes (Antropófaga, Carnavalesco, Anciã) — ASS-05 | Guga + Bruno Prosperi | Antes do gate de saída do POC |
| **POC** | Calibração inicial das zonas de bisociação (cosseno) para vocabulário publicitário PT-BR | Heitor + William + Bruno | Durante POC |
| **Protótipo** | DEC-02 (Workflows entram em Piloto ou só MVP?) | Heitor + Sponsor | Antes do gate de saída do Protótipo |
| **Protótipo** | Aprovação Phase 11 (Polish + Deploy) finalizada | Heitor + Zé | Q2 2026 |
| **Piloto** | DEC-06 (Budget Phase 16 — Image Editor + Video Generation) | Guga + Ronaldo | Início do Piloto (Q3 2026) |
| **Piloto** | DEC-01 (Modelo de monetização interna — cobrar BUs por uso?) | Guga + Ronaldo | Q3 2026 |
| **Piloto** | DEC-03 (Diretrizes formais de uso de IA com clientes) | Diretoria | Q3 2026 |
| **Piloto** | Aprovação business case formal (REST-04 resolvido) | Guga + Ronaldo + Heitor | Q3 2026 (gate MVP) |
| **MVP** | DEC-05 (Estratégia de eventual sinergia com Toolbox — produto Takai) | Heitor + Takai | Q4 2026 |
| **MVP** | Phase 15 (Integração Solar ↔ Admin) — manter ADR-002 ou unificar? | Heitor + Zé | Q1 2027 |

---

## 8. Resumo Visual do Roadmap

```
       POC (4-6 sem)        Protótipo (em curso)      Piloto (12-20 sem)         MVP (Q1 2027 →, contínuo)
       Lab/Studio           Lab + staging              Real World controlado      Real World total
   ┌────────────────┐      ┌──────────────────┐       ┌─────────────────────┐    ┌─────────────────────────────┐
   │ FA-02 minimal  │ ───► │ FA-01 v2         │ ────► │ + FA-02 completa    │ ─► │ + FA-08-04/05 Video Veo     │
   │ pipeline       │      │ FA-03 Skills     │       │ + FA-05 Workflows   │    │ + FA-10-08/09 Homogeneização│
   │ Explorer↔Crit. │      │ FA-04 Chat SSE   │       │ + FA-08 Img + Edit  │    │ + FA-11-04 Vocab UI         │
   │                │      │ FA-06 Sist.Solar │       │ + FA-09 Caixa-preta │    │ + FA-11-08 Métricas carreira│
   │ FA-01 mock     │      │ FA-07 HITL       │       │ + FA-10 Dashboard   │    │ + Phase 12 Sidebar dinâmico │
   │ embarcado      │      │ FA-12 Admin      │       │ + FA-11 Safety      │    │ + Phase 13 Cmd+K            │
   │                │      │ FA-09 RBAC base  │       │   cultural          │    │ + Phase 14 Onboarding       │
   │                │      │ + Phase 11 Deploy│       │   completa          │    │ + Phase 15 Solar↔Admin (opc)│
   └────────────────┘      └──────────────────┘       └─────────────────────┘    └─────────────────────────────┘
        │                         │                          │                              │
   PX-02, PX-04           PX-01, PX-02, PX-03         Todas (PX-01 a PX-05)          Todas + rollout 300 Creators
   3+ blind                5-10 internos                10+ UAS reais                  Adoção sustentada
        │                         │                          │                              │
   JN-02, JN-06           JN-01, JN-02, JN-03         JN-01 a JN-08 completas        JN-01 a JN-10 completas
   parciais                parciais                                                    + safety coletiva ativa
        │                         │                          │                              │
   Critério               Phase 11 +                   KPIs §5.6 +                    Business case aprovado +
   ≥60% úteis             persistência +               business case +                ≥3 cases/trim sustentado
                          champions onboarded          Caixa-preta operante           homogeneização monitorada
```

---

## 9. Assunções e Itens a Validar

### 9.1. Assunções sobre Fases

| Assunção | Impacto se Falsa | Status |
|----------|------------------|--------|
| **POC do Moon Shot não-bloqueante para Phases 1-10 (já entregues)** — POC roda em paralelo com Protótipo (Phases 1-10 já concluídas independem da POC) | Se POC falhar, FA-02 entra no Piloto como "experimental" sem comprometer demais Features | Confirmado pela arquitetura (FA-02 é módulo isolado em LangGraph) |
| **Time não-dedicado mantém ritmo de Phase 11 em ~6-8 semanas** (REST-01) | Atraso > 12 semanas adiaria entrada no Piloto e risco de business case | A validar — depende de janela de Cloud Run setup |
| **Champions Gus/Teda/Le conseguem onboarding em ≤4 semanas** | Sem champions, Piloto não atinge 10+ UAS no trimestre 1 | Onboarding em curso conforme PRODUCT_HANDOFF.md |
| **Vertex AI quota será aprovada antes do Piloto** | FA-08-01 fica em mock no Piloto; afeta Copy Social, Roteiro de Vídeo | A validar — solicitar com 4 semanas de antecedência |
| **Business case aprovado até Q3 2026** (REST-04 resolvido a tempo) | Phase 16 (Video) atrasa para 2027 ou cancela | Crítico — Heitor + Ronaldo em construção ativa |
| **Persistência de conversas implementada antes de Piloto** (ASS-03 do PRD Parte 1) | HITL e Eval não acumulam dados consistentes; dashboard subutilizado | A validar com Heitor + Zé |
| **Baseline pré-sunOS de homogeneização mensurável** (PA-03/PA-06) | RN-019 não funciona; FA-10-08 fica subespecificado no MVP | Mensurar no mês 1 do Piloto com sample histórico |

### 9.2. Decisões Pendentes

| Decisão | Impacto no Roadmap | Responsável |
|---------|--------------------|-------------|
| **DEC-06** Budget Phase 16 (Image Editor + Video Generation) | Sem aprovação, Piloto entrega só Image gen real (FA-08-01); Editor (FA-08-02/03) e Video (FA-08-04/05) ficam para 2027 | Guga + Ronaldo |
| **DEC-02** Workflows entram em Piloto ou só MVP? | Se MVP, Piloto não atinge 5+ Workflows ativos (KPI §5.6) | Heitor + Sponsor |
| **DEC-01** Modelo de monetização interna (cobrar BUs) | Pode reduzir adoção se cobrança for percebida como barreira | Guga + Ronaldo |
| **DEC-03** Diretrizes formais de uso de IA com clientes | Clientes individuais podem vetar IA externa caso a caso | Diretoria |
| **DEC-04** Critério de inclusão de novos clientes/contas | Roll-out por área versus por cliente afeta cadência de Piloto | Heitor + Atendimento |
| **DEC-05** Sinergia com Toolbox (produto Takai) | Pode introduzir sinergia ou concorrência interna | Heitor + Takai |

### 9.3. Itens a Confirmar antes do Piloto

- **Volume formal de "horas economizáveis"** no business case (em construção com Ronaldo)
- **KPIs validados pelo PM** — atualmente todos propostos (Parte 1 §2.3)
- **Datas formais de cada Phase** — Phase 11 fim, Piloto início, MVP go-live
- **Eventual exigência de cliente** para vetar uso de IA externa (cliente a cliente)
- **Disponibilidade de Bruno Prosperi** para validação cultural antes de releases maiores (FA-11-09)
- **Estrutura final de champions** (todas as áreas mapeadas com Yuri)

---

## Histórico de Versões

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | 2026-04-28 | Heitor Miranda + Claude (assistido) | Versão inicial. **4 fases (POC, Protótipo, Piloto, MVP)** com features (FA-XX) e subfeatures distribuídas, critérios de saída/entrada verificáveis, estimativas temporais considerando REST-01 (time não-dedicado), riscos top-3 por fase, dependências cross-feature críticas e mapeamento explícito do `ROADMAP.md` (Phases 1–16) na linguagem de produto. **Inclui POC do Moon Shot (FA-02)** como fase ainda não mapeada no ROADMAP. **Considera REST-04** (business case não aprovado) como bloqueador para Phase 16 completa. Phases 1-10 já concluídas reorganizadas em Protótipo; Phase 11 (Polish + Deploy) como gate de saída do Protótipo; Phase 16 (Image Editor) entra no Piloto, Phase 16 (Video Generation Veo 3.0/3.1) entra no MVP. **Lacunas endereçadas**: POC do Moon Shot, Mensuração coletiva (FA-10), Safety Cultural (FA-11), Biblioteca v2 com governança LGPD (FA-01-06/07/08), Workflows com schedule real como gate de Piloto. Vocabulário Suno (Devorar, Provocar, Faísca, Brasa, Caixa-preta, Sistema Solar, Sun, Planeta, Órbita, Moon) aplicado; anti-patterns (gerar, otimizar, eficiência, accelerator, Coro) evitados |
| 1.1 | 2026-04-28 | Heitor + Claude (assistido) | **+2 macro features** distribuídas nas 4 fases: FA-13 Aprovação Hierárquica (POC parcial → Protótipo core → Piloto operação real → MVP validators+integrações) e FA-14 Google Drive (Protótipo base → Piloto cleanup+curadoria → MVP refinamentos). Phases 17 e 18 adicionadas ao mapeamento. JN-11 e JN-12 incorporadas às fases. PX-06 Aprovador entra no Protótipo. Total: **14 features / 98 FRs / 6 personas / 12 jornadas** distribuídos. Pedido formal Guga + Bruno Prosperi (28/04/2026) |

---

<!-- REVIEW: O roadmap reflete o que vocês realmente conseguem entregar com o time não-dedicado? -->

**Próximos passos**:
1. Revisar Parte 5 com Heitor Miranda
2. Apresentar critérios de saída do Protótipo na próxima reunião de terça com Guga (gate Phase 11)
3. Confirmar com Bruno Prosperi disponibilidade para POC do Moon Shot
4. Confirmar com Ronaldo timeline do business case (gate de saída do Piloto)
5. Atualizar ROADMAP.md com referência cruzada a este documento
