---
documento: PRD Parte 3 — Matriz Persona × Objetivo × Jornada
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
fonte_prd: docs/prd/parte1-feature-map.md, docs/prd/parte2-personas-jtbd.md
fonte_frd: FRD Moon Shot (referenciado nos BRDs Parte 3 e 4)
total_jornadas: 10 (JN-01 a JN-10)
---

# PRD Parte 3 — Matriz Persona × Objetivo × Jornada

## 1. Introdução

### 1.1. Objetivo deste Documento

Este documento cria a **visão matricial operacional** do sunOS, conectando:

- **Personas** (PX-01 a PX-05, definidas na Parte 2)
- **Objetivos / Jobs-to-be-done** (JTBD-01 a JTBD-29, definidos na Parte 2)
- **Jornadas** (JN-01 a JN-10) — fluxos de uso reais, com começo, meio e fim
- **Features** (FA-01 a FA-12, definidas na Parte 1)
- **Requisitos de Negócio** (BR-001 a BR-016, BRD Parte 3) e **Regras de Negócio** (RN-001 a RN-022, BRD Parte 4)

Serve como base direta para:

- **UX/IA** (Parte 1 e 2 do UX): Inventário de Telas e Arquitetura de Informação derivam destas jornadas
- **PRD Parte 4 (FRs)**: cada passo crítico de jornada vira um ou mais FR-XXX
- **Roadmap (Parte 5)**: jornadas são priorizadas por fase (POC → Protótipo → Piloto → MVP)
- **Pesquisa qualitativa pós-Piloto**: critérios de sucesso por jornada são roteiro para entrevistas

### 1.2. O que é uma Jornada no sunOS

Uma **jornada (JN-XX)** é um fluxo de uso coerente, executado por uma ou mais Personas, com:

- **Trigger** explícito (briefing chega, final de mês, saída de Creator anunciada, anomalia detectada, etc.)
- **Passos-chave** observáveis (não decisões internas do sistema)
- **Telas tocadas** (ainda não nomeadas formalmente — vão para o Inventário de Telas no UX, T-XX)
- **Momento crítico** — o ponto de maior risco ou maior valor da jornada
- **Dores** documentadas no estado atual (pré-sunOS) e **oportunidades de IA** que o sunOS destrava
- **Features (FA-XX)** envolvidas
- **BRs e RNs** rastreáveis
- **Critério de sucesso** verificável

> **Nota:** Jornadas neste documento descrevem comportamento de produto (o que o usuário faz e o que o sistema responde). Detalhamento de telas (T-XX), wireframes e componentes vivem na pasta `docs/ux/`.

### 1.3. Princípios das Jornadas do sunOS

Aplicam-se a **toda** jornada:

1. **≤3 cliques até o valor** — herdado do princípio "Sun → Planeta → Órbita" do Sistema Solar (FA-06)
2. **Caixa-preta** — Operacional nunca enxerga Biblioteca, system prompts ou lógica interna (RN-009, RN-011)
3. **AI Provoca, Humano Cria** — qualquer output da IA é estímulo/Faísca, nunca peça final (RN-014, BR-010)
4. **Vocabulário Suno** — Devorar, Provocar, Faísca, Brasa, Caixa-preta — anti-patterns ("gerar", "otimizar", "eficiência") bloqueados (RN-016)
5. **HITL nativo** — toda jornada com output da IA tem ponto de feedback (FA-07)
6. **Mensurável** — toda jornada de execução grava trace MLflow (FA-10) e calcula custo evitado quando aplicável (RN-018)

### 1.4. Relação com Outros Artefatos

| Artefato | Relação |
|----------|---------|
| BRD Parte 3 (BR-001 a BR-016) | Toda jornada serve ≥1 BR; matriz de cobertura no §5.4 |
| BRD Parte 4 (RN-001 a RN-022) | RNs entram nos passos como gates ou comportamentos automatizados |
| PRD Parte 1 (FA-01 a FA-12) | Features aparecem nas jornadas (matriz §5.1) |
| PRD Parte 2 (PX-01 a PX-05, JTBD-01 a JTBD-29) | Cada jornada é executada por ≥1 Persona e cumpre ≥1 JTBD |
| PRD Parte 4 (FRs FR-XXX) | Passos críticos de jornada viram FRs |
| PRD Parte 5 (Roadmap) | Jornadas distribuídas por fase POC → Protótipo → Piloto → MVP |
| FRD Moon Shot | JN-02 e JN-06 são detalhadas no FRD; este documento referencia |

---

## 2. Visão Geral — Mapa Resumido Persona × Jornada

### 2.1. Síntese de Jornadas

| ID | Jornada | Objetivo Principal | Personas Primárias | Features Centrais | Fase de Entrada |
|----|---------|--------------------|--------------------|-------------------|-----------------|
| **JN-01** | Curadoria da Biblioteca (Inteligência Coletiva) | Líder cura conteúdo institucional que vira contexto invisível para Skills e Moon Shot | PX-01 | FA-01, FA-12 | Protótipo |
| **JN-02** | Ideação criativa com Moon Shot | Romper bloqueio criativo recebendo Faíscas inesperadas para um briefing | PX-02, PX-04, PX-05 | FA-02, FA-04, FA-06, FA-11 | POC |
| **JN-03** | Execução de tarefa processual com Skill | Operador executa Copy Social / Plano de Mídia / Roteiro / Report com contexto injetado | PX-03 (primária), PX-02 | FA-03, FA-04, FA-01, FA-07 | Protótipo |
| **JN-04** | Análise estratégica e Persona Sintética | Planner conecta dados de mercado a território criativo via Skills + Moon Shot | PX-04 | FA-03, FA-02, FA-04, FA-01 | Protótipo |
| **JN-05** | Captura de conhecimento pré-saída de Creator | Líder captura repertório/cases vividos antes da saída efetiva de Creator-chave | PX-01 | FA-01, FA-12, FA-09 | Piloto |
| **JN-06** | Devil's advocate — "me prova que tá errada" | Sênior usa modo divergente do Moon Shot como stress-test de ideia já formada | PX-02, PX-04 | FA-02, FA-04, FA-11 | Piloto |
| **JN-07** | Configuração e operação de Workflow recorrente | Líder/Operador configura Workflow agendado (Report Mensal, Plano de Mídia, Pesquisa) com HITL gate | PX-01, PX-03, PX-04 | FA-05, FA-12, FA-03 | Piloto |
| **JN-08** | Governança executiva e Mensuração mensal | Líder consome dashboard executivo, audita acessos, monitora homogeneização coletiva | PX-01 | FA-10, FA-09, FA-11, FA-12 | Piloto |
| **JN-09** | Onboarding de Creator Junior | Junior escolhe track de onboarding e aprende vocabulário/cultura via Biblioteca + Skills | PX-05 | FA-11, FA-02, FA-01, FA-04 | Piloto |
| **JN-10** | Configuração de nova Skill (sem código) | Líder cadastra Skill nova via Admin, define system prompt, Moons, clientes | PX-01 | FA-12, FA-03, FA-09 | Protótipo |

### 2.2. Jornadas Críticas por Fase

| Fase | Jornadas Core (validação obrigatória) | Jornadas Suportadas | Jornadas Futuras |
|------|---------------------------------------|---------------------|------------------|
| **POC** | JN-02 (Moon Shot, blind tests com seniores) | — | JN-01, JN-03 a JN-10 |
| **Protótipo** | JN-01, JN-02, JN-03, JN-04, JN-10 | — | JN-05 a JN-09 |
| **Piloto** | JN-01, JN-02, JN-03, JN-04, JN-05, JN-06, JN-07, JN-08, JN-09 | JN-10 (refinamento) | — |
| **MVP** | Todas as 10 jornadas em produção contínua | — | — |

### 2.3. Encadeamento das Jornadas

As 10 jornadas formam três anéis funcionais que espelham os anéis de Features (Parte 1 §2.3):

- **Anel de Curadoria** — JN-01 (curadoria contínua), JN-05 (captura pré-saída), JN-10 (config de Skill). Executadas pelo PX-01 (Líder), alimentam infraestrutura de conhecimento e configuração que todas as outras jornadas consomem invisivelmente.
- **Anel de Uso (Bioma Job)** — JN-02 (ideação), JN-03 (execução processual), JN-04 (análise estratégica), JN-06 (devil's advocate), JN-09 (onboarding). Executadas por PX-02/03/04/05, consomem o que PX-01 curou.
- **Anel de Operação Recorrente e Governança** — JN-07 (Workflows agendados), JN-08 (Mensuração e dashboard). Costuram tudo: Workflows automatizam JN-03 e JN-04 quando recorrentes; dashboard fecha o loop mensal de Mensuração + safety cultural.

```
            ┌──────────────────── ANEL DE CURADORIA ────────────────────┐
            │  JN-01 Curadoria     JN-05 Captura       JN-10 Config     │
            │   (Biblioteca)        pré-saída            de Skill       │
            └──────────────────────────┬────────────────────────────────┘
                                       │
                             alimenta de forma invisível
                                       │
            ┌──────────────────── ANEL DE USO ──────────────────────────┐
            │  JN-02 Ideação    JN-03 Execução    JN-04 Análise         │
            │  (Faísca)          (Skill)          (Estratégica)         │
            │      │                 │                  │               │
            │      ▼                 ▼                  ▼               │
            │  JN-06 Devil's     JN-09 Onboarding (PX-05)               │
            │  advocate (PX-02)                                         │
            └──────────────────────────┬────────────────────────────────┘
                                       │
                             produz traces, custo evitado, feedback HITL
                                       │
            ┌────────── ANEL DE OPERAÇÃO RECORRENTE & GOVERNANÇA ───────┐
            │  JN-07 Workflows agendados      JN-08 Mensuração mensal   │
            │  (automatiza JN-03/JN-04)        (dashboard, alertas)     │
            └────────────────────────────────────────────────────────────┘
```

---

## 3. Matriz Detalhada por Persona

### 3.1. PX-01 — Líder/Curador

| Objetivo / JTBD | Jornada | Passos-Chave | Features | BRs / RNs | Fase |
|-----------------|---------|--------------|----------|-----------|------|
| JTBD-01 (captura pré-saída) | JN-05 | 1. Detectar saída anunciada → 2. Acessar /clientes ou /biblioteca → 3. Disparar entrevista de offboarding → 4. Indexar conteúdo → 5. Validar cobertura ≥80% das contas críticas | FA-01, FA-12, FA-09 | BR-005; RN-006, RN-008 | Piloto |
| JTBD-02 (configurar Skill ≤5min) | JN-10 | 1. Acessar /skills → 2. Definir identidade + system prompt → 3. Configurar Moons → 4. Atribuir clientes → 5. Salvar (versionado) | FA-12, FA-03, FA-09 | BR-002, BR-007; RN-006, RN-009 | Protótipo |
| JTBD-03 (dashboard semanal) | JN-08 | 1. Reunião de terça com Sponsor → 2. Abrir dashboard mensal → 3. Triangular custo evitado, KPIs de negócio, score HITL → 4. Comentar variações > 25% (RN-005) | FA-10, FA-12 | BR-003, BR-013; RN-005, RN-018 | Piloto |
| JTBD-04 (alerta homogeneização) | JN-08 | 1. Receber alerta automático mensal → 2. Validar 3 métricas (Cosine Distance, Self-BLEU, Compression Ratio) → 3. Decidir mitigação (suspender feature, ajustar zona Sweet Spot) | FA-02, FA-10, FA-11 | BR-014; RN-019, RN-020 | Piloto |
| JTBD-05 (Caixa-preta para Operacional) | JN-08 (sub-fluxo) | 1. Auditar logs de RBAC → 2. Verificar zero exposição da Biblioteca a perfis Operacionais → 3. Revisar volume de acessos administrativos > 3σ | FA-09, FA-10, FA-12 | BR-007; RN-009, RN-011, RN-012 | Piloto |
| JTBD-06 (Workflow sem código) | JN-07 | 1. Acessar /workflows → 2. Compor steps (tool/LLM/condição/HITL) → 3. Definir schedule humanizado → 4. Ativar | FA-05, FA-12, FA-03 | BR-002, BR-013; RN-022 | Piloto |
| JTBD-07 (Skill em revisão por baixa redução) | JN-08 (sub-fluxo) | 1. Receber alerta mensal de Skill com redução < 30% por 2 meses → 2. Decidir: revisar prompt, ajustar baseline, deprecar | FA-03, FA-10, FA-12 | BR-002; RN-004 | Piloto |
| Curadoria contínua | JN-01 | 1. Acessar /biblioteca → 2. Upload multimodal → 3. Preencher metadados obrigatórios (RN-006) → 4. Validar indexação (vetorial+grafo) → 5. Marcar escopo (Suno/cliente) | FA-01, FA-12 | BR-004, BR-005, BR-006; RN-006, RN-007, RN-013 | Protótipo |

### 3.2. PX-02 — Criativo Sênior

| Objetivo / JTBD | Jornada | Passos-Chave | Features | BRs / RNs | Fase |
|-----------------|---------|--------------|----------|-----------|------|
| JTBD-08 (romper bloqueio) | JN-02 | 1. Devorar briefing no Chat (Cliente ativo) → 2. Acionar Moon Shot (≤3 cliques, RN-003) → 3. Receber 3 Faíscas zona Sweet Spot → 4. Estrelar úteis → 5. Forced reflection após N=5 (RN-015) | FA-02, FA-04, FA-06, FA-11 | BR-001, BR-010, BR-011, BR-014; RN-001, RN-002, RN-003, RN-014, RN-015 | POC |
| JTBD-09 (devil's advocate) | JN-06 | 1. Apresentar ideia ao agente em modo "me prova que tá errada" (track sênior, RN-017) → 2. Receber contra-argumentos estruturados → 3. Estrelar argumentos válidos → 4. Decidir refinar/manter ideia | FA-02, FA-04, FA-11 | BR-001, BR-012; RN-014, RN-015, RN-017 | Piloto |
| JTBD-10 (preservar identidade autoral) | JN-02, JN-03 (transversal) | 1. Output IA marcado como Faísca/estímulo (RN-014) → 2. Confirmar explicitamente promoção a peça final → 3. Sistema bloqueia compartilhamento sem confirmação | FA-04, FA-11, FA-08 | BR-010; RN-014 | Protótipo |
| JTBD-11 (referência cultural rápida) | JN-02, JN-03 (transversal) | 1. Skill ativa puxa contexto da Biblioteca por scope/tags → 2. Tempo médio de retrieval < 2 minutos → 3. Refinar prompt sem trocar de tela | FA-01, FA-03, FA-04 | BR-006, BR-015; RN-021 | Protótipo |
| JTBD-12 (forced reflection após múltiplas aprovações) | JN-02, JN-06 | 1. Após N=5 stars na sessão → 2. Sistema interrompe com pergunta reflexiva → 3. Skip ≥3 consecutivos escala alerta para Líder (RN-015) | FA-04, FA-07, FA-11 | BR-010, BR-012; RN-015 | Piloto |
| JTBD-13 (modo dupla com time-boxing) | JN-02 (variante) | 1. Ativar modo dupla → 2. 90s IA Provoca → 3. 5min humano refina → 4. Repete | FA-02, FA-11 | BR-010, BR-011; RN-014 | Piloto |

### 3.3. PX-03 — Operador Processual

| Objetivo / JTBD | Jornada | Passos-Chave | Features | BRs / RNs | Fase |
|-----------------|---------|--------------|----------|-----------|------|
| JTBD-14 (Copy Social com tom de voz) | JN-03 | 1. Cliente ativo no Sistema Solar → 2. Selecionar Skill Copy Social → 3. Selecionar Moon (Feed/Stories/Reels) → 4. Inserir briefing no Chat → 5. Receber draft com contexto injetado → 6. Avaliar HITL (thumbs+rating) | FA-03, FA-04, FA-06, FA-01, FA-07 | BR-002, BR-006, BR-015; RN-021, RN-010 | Protótipo |
| JTBD-15 (Report Mensal automatizado) | JN-07 | 1. Workflow Report Mensal disparado por Cloud Scheduler dia 1 → 2. Coleta dados, executa Skill Report Performance → 3. HITL gate → 4. PX-03 revisa → 5. Aprovação publica entrega | FA-05, FA-03, FA-07 | BR-002, BR-013; RN-018, RN-022 | Piloto |
| JTBD-16 (Plano de Mídia com benchmarks) | JN-03 | 1. Skill Plano de Mídia com cliente ativo → 2. Skill puxa benchmarks históricos do cliente + best practices Suno (peso 1.0 e 0.8) → 3. Draft → 4. HITL | FA-03, FA-01, FA-04 | BR-002, BR-006, BR-015; RN-021 | Protótipo |
| JTBD-17 (custo evitado visível) | JN-08 (consumo indireto) | 1. Skill executa → 2. RN-018 calcula custo evitado = (tempo_manual − tempo_skill) × custo_hora_área → 3. Aparece no dashboard de PX-01 | FA-10, FA-03 | BR-013; RN-018 | Piloto |
| JTBD-18 (anomalia em campanha) | JN-07 (variante) | 1. Workflow Monitor de Anomalias detecta desvio → 2. Aciona análise + condicional → 3. Notifica PX-03 com plano | FA-05, FA-03 | BR-002; RN-022 | Piloto |
| JTBD-19 (isolamento entre clientes) | JN-03 (transversal) | 1. PX-03 troca de Cliente A para Cliente B → 2. Sistema descarta contexto de A automaticamente (RN-010) → 3. Skill executada em B nunca cita A | FA-03, FA-09, FA-01 | BR-008; RN-010 | Protótipo |

### 3.4. PX-04 — Planejamento Estratégico

| Objetivo / JTBD | Jornada | Passos-Chave | Features | BRs / RNs | Fase |
|-----------------|---------|--------------|----------|-----------|------|
| JTBD-20 (Pesquisa de Mercado como Workflow) | JN-07 (variante) | 1. PX-04 dispara Workflow Pesquisa de Mercado → 2. Sub-workflow busca web + síntese + retrieval Biblioteca → 3. HITL gate → 4. Report estruturado | FA-05, FA-03, FA-01 | BR-002, BR-013; RN-022 | Piloto |
| JTBD-21 (Persona Sintética com cultura local) | JN-04 | 1. Skill Persona Sintética com cliente ativo → 2. Biblioteca injeta referências culturais brasileiras + dados demográficos → 3. Output marcado como estímulo (RN-014) → 4. HITL | FA-03, FA-01, FA-11 | BR-006, BR-011, BR-015; RN-014, RN-021 | Protótipo |
| JTBD-22 (insight → território criativo) | JN-04 → JN-02 | 1. PX-04 inicia Análise de Mercado → 2. Captura insight → 3. Aciona Moon Shot em modo "começando uma ideia" (RN-017) → 4. Recebe Faíscas ponte → 5. Briefa PX-02 | FA-03, FA-02, FA-04 | BR-001, BR-011; RN-001, RN-014, RN-017 | Protótipo |
| JTBD-23 (Brief Builder estratégico) | JN-04 | 1. Skill Brief Builder com cliente ativo → 2. Biblioteca injeta briefings históricos + tom de voz → 3. Draft de briefing → 4. HITL | FA-03, FA-01 | BR-002, BR-006, BR-015; RN-021 | Protótipo |
| JTBD-24 (custo evitado da pesquisa) | JN-08 (consumo indireto) | 1. Workflow Pesquisa registra tempo → 2. RN-018 calcula custo evitado → 3. Dashboard reflete | FA-10, FA-05 | BR-013; RN-018 | Piloto |

### 3.5. PX-05 — Creator Junior

| Objetivo / JTBD | Jornada | Passos-Chave | Features | BRs / RNs | Fase |
|-----------------|---------|--------------|----------|-----------|------|
| JTBD-25 (track de onboarding) | JN-09 | 1. Login → 2. Sistema sugere track conforme cargo/anos (RN-017) → 3. Junior escolhe "Estou começando uma ideia" → 4. Tutorial divergente em ≤3 sessões | FA-11, FA-02, FA-04 | BR-006, BR-012; RN-017 | Piloto |
| JTBD-26 (forced reflection N=3) | JN-02 (track junior) | 1. Junior dá 3 stars na sessão → 2. Sistema interrompe com pergunta reflexiva (mais frequente que sênior, RN-015) → 3. Skip ≥3 consecutivos escala para mentor PX-02 | FA-04, FA-07, FA-11 | BR-010, BR-012; RN-015, RN-017 | Piloto |
| JTBD-27 (referência via Biblioteca, sem ver) | JN-09 → JN-03 | 1. Junior usa Skill processual com supervisão → 2. Skill puxa cases curados da Biblioteca via context injection → 3. Junior nunca vê /biblioteca (RN-011) | FA-01, FA-03, FA-09 | BR-006, BR-007; RN-011, RN-021 | Piloto |
| JTBD-28 (princípio AI Provoca) | JN-09 (transversal) | 1. Todo output IA marcado como estímulo/Faísca → 2. Junior aprende desde o primeiro dia que IA Provoca, humano cria | FA-11, FA-04 | BR-010, BR-012; RN-014 | Piloto |
| JTBD-29 (mentor virtual brasileiro) | JN-09, JN-02 | 1. Junior aciona agente em modo Antropófaga/Carnavalesco/Anciã → 2. Agente responde com vetor cultural brasileiro → 3. Marca cultura desde o início | FA-02, FA-04, FA-11 | BR-011, BR-012; RN-014 | Piloto |

---

## 4. Jornadas Críticas Detalhadas

### JN-01 — Curadoria da Biblioteca (Inteligência Coletiva)

#### Descrição

Jornada **fundacional** do sunOS — sem ela, todas as outras jornadas operam descontextualizadas. O Líder/Curador (PX-01) ingere conteúdo institucional (referências, cases, briefings, guidelines, contexto de mercado, regras de negócio do cliente) na Biblioteca via Admin (`/biblioteca`), preenchendo metadados obrigatórios (RN-006). O sistema executa indexação dual (vetorial + grafo) em background. O resultado é **invisível para Operacionais** (Caixa-preta, RN-011) mas alimenta automaticamente Skills processuais (FA-03) e Moon Shot (FA-02).

A jornada é contínua (não evento único): a meta MVP é ≥500 itens curados, com curadoria sustentada pós-Piloto. O critério-chave é **zero conhecimento crítico vivendo apenas em uma cabeça** (BR-004, BR-005).

#### Fluxo de Alto Nível

```
[Trigger: novo case fechado / saída anunciada / atualização de guideline]
        │
        ▼
[1. PX-01 abre /biblioteca via Admin (FA-12)]
        │
        ▼
[2. Upload multimodal (PDF/DOCX/áudio/vídeo/imagem) ou criação direta]
        │
        ▼
[3. Preenche metadados obrigatórios (RN-006):
    título · domínio · ≥2 tags · descrição ≥50 char · cliente associado se aplicável]
        │
        ▼
[4. Sistema bloqueia se metadados incompletos; aceita se OK]
        │
        ▼
[5. Indexação dual (vetorial pgvector + grafo) em background]
        │
        ▼
[6. Conteúdo disponível para retrieval por Skills (FA-03) e Moon Shot (FA-02)]
        │
        ▼
[7. AccessLog grava para detecção futura de "conhecimento em risco" (RN-008)]
```

#### Personas e Papéis

| Persona | Papel na Jornada | Objetivo Específico |
|---------|------------------|---------------------|
| PX-01 Líder/Curador | Executor primário | Curar repertório, garantir governance e continuidade |
| PX-02, PX-03, PX-04, PX-05 | Beneficiários indiretos (Caixa-preta) | Recebem contexto via Skills sem precisar conhecer a Biblioteca |

#### Telas Tocadas (referência futura para UX)

- Admin Skills sidebar / Biblioteca admin (`/biblioteca`)
- Form de upload com validação de metadados
- Drawer de detalhes do KnowledgeItem
- Filter sidebar (escopo, tags, status do cliente)

#### Momento Crítico

**Validação dos metadados** (passo 3-4): se Líder consegue ingerir conteúdo sem metadados completos, retrieval divergente do Moon Shot não funciona; se validação é fricativa demais, curadoria não escala (`<5min/item` é meta — BR-004).

#### Dores no Estado Atual

- Repositório fragmentado (Drive, Notion, e-mails, cabeças)
- Conteúdo crítico vive em uma única pessoa — turnover apaga contexto (BR-005)
- Busca manual demora minutos; nem sempre encontra
- Sem governance, sem proteção de IP

#### Oportunidades de IA

- **Caption automática** de imagens via VisualCreator (futuro — FA-08)
- **Transcrição** de áudio/vídeo automatizada
- **Sugestão de tags** via embedding similarity com itens existentes
- **Detecção de risco** automática por AccessLog (RN-008) — alerta proativo

#### Features Envolvidas

| Feature | Papel na Jornada |
|---------|------------------|
| FA-01 Biblioteca | Entidade central — recebe e indexa conteúdo |
| FA-12 Admin | UX da curadoria (`/biblioteca`) |
| FA-09 RBAC | Restringe a Admin/Líder; protege Caixa-preta para Operacional |
| FA-10 Mensuração | AccessLog para auditoria e detecção de risco |

#### Requisitos Relacionados

| Tipo | IDs | Relevância |
|------|-----|------------|
| **BRs** | BR-004 (primário), BR-005, BR-006, BR-007 | Repositório unificado, continuidade pós-turnover, acesso democrático mediado, proteção IP |
| **RNs** | RN-006, RN-007, RN-008, RN-009, RN-011, RN-013 | Validação metadados, visibilidade por status, detecção risco, RBAC, ocultação Operacional, retenção LGPD |
| **JTBDs** | Curadoria contínua de PX-01 (não-numerada na Parte 2 mas implícita em JTBD-01, JTBD-05) | — |

#### Critério de Sucesso

| Métrica | Meta | Como medir |
|---------|------|------------|
| Tempo médio de curadoria por item | <5 minutos | Tracking no AccessLog |
| Itens curados até final do Piloto | ≥500 | Count na Biblioteca |
| Cobertura de contas críticas | ≥80% com contexto-mínimo documentado | Auditoria por cliente |
| Zero conhecimento crítico em uma única pessoa | 100% | RN-008 (zero alertas críticos não-mitigados) |

#### Fase e Prioridade

| Aspecto | Valor |
|---------|-------|
| **Fase de entrada** | Protótipo |
| **Criticidade** | Core — sem JN-01, todas as outras jornadas operam descontextualizadas |
| **Justificativa** | Base operacional do anel de Curadoria; pré-requisito de JN-02 a JN-09 |

---

### JN-02 — Ideação Criativa com Moon Shot

#### Descrição

Jornada **diferenciadora** do sunOS, detalhada também no FRD Moon Shot (referenciado). O Creator (PX-02 sênior, PX-04 planner ou PX-05 junior em track adaptado) está em contexto de Cliente ativo com briefing/tema em mãos. Aciona o **Moon Shot** em ≤3 cliques (RN-003), o motor Devora o briefing e Provoca Faíscas via loop multi-agente Explorer↔Crítico (FA-02), filtradas pela zona Sweet Spot de bisociação (cosseno 0.5–0.85, RN-001). O Creator estrela as Faíscas úteis; após N stars (5 default, 3 para junior — RN-015), o sistema **interrompe com forced reflection** ("Por que essas? Que padrão você vê?").

Toda Faísca é marcada visualmente como **estímulo/provocação** (RN-014) — nunca peça final. O Creator decide promover, refinar ou descartar. A jornada **protege ownership autoral** e mitiga homogeneização criativa coletiva.

Variante junior (PX-05): track "Estou começando uma ideia" (divergente, abundante), N=3 para reflection, visible reasoning hidden by default. Variante sênior: track "Me prova que tá errada" (devil's advocate) — ver JN-06 para detalhamento dedicado.

#### Fluxo de Alto Nível

```
[Trigger: bloqueio criativo ou início de ideação para briefing]
        │
        ▼
[1. Creator no Sistema Solar (FA-06) → seleciona Cliente (Planeta) → entra no Chat com Skill ativa]
        │
        ▼
[2. Devora briefing no Chat (FA-04) — texto, imagem ou áudio (FA-08)]
        │
        ▼
[3. Aciona Moon Shot — botão sempre presente (≤3 cliques, RN-003)]
        │
        ▼
[4. Sistema executa pipeline Explorer↔Crítico (FA-02):
    - Explorer gera N candidatos (3-5)
    - Crítico avalia em 3 dimensões (Novidade, Coerência, Potencial Criativo)
    - Convergência: score médio ≥8, dimensão individual ≥5, ≤5 iterações (RN-002)
    - Filtragem de zona: descarta "óbvio" e "incoerente"; entrega Sweet Spot por padrão (RN-001)]
        │
        ▼
[5. Apresenta 3 Faíscas marcadas como estímulo (RN-014) com persona brasileira (Antropófaga / Carnavalesco / Anciã)]
        │
        ▼
[6. Creator estrela ⭐ as úteis · comenta · pede variação · ignora]
        │
        ▼
[7. Após N stars (5 default / 3 junior, RN-015): forced reflection
    "Por que essas? Que padrão você vê?"]
        │
        ▼
[8. Creator promove Faísca a peça (RN-014: requer confirmação explícita) ou volta ao passo 4]
        │
        ▼
[9. Trace MLflow grava (FA-10): tokens, modelo, custo, scores; alimenta DiversityMetric (RN-019)]
```

#### Personas e Papéis

| Persona | Papel na Jornada | Objetivo Específico |
|---------|------------------|---------------------|
| PX-02 Criativo Sênior (primária) | Executor — modo divergente clássico | Romper bloqueio em territórios óbvios sem perder ownership |
| PX-04 Planner | Executor — modo "começando uma ideia" para conectar insight a território | Provocar PX-02 com insumo rico não-óbvio |
| PX-05 Creator Junior | Executor — track junior protetiva (N=3, visible reasoning hidden) | Aprender exploração divergente sem over-reliance |
| PX-01 Líder | Beneficiário indireto (mensuração) | Saúde criativa coletiva mensurada (BR-014) |

#### Telas Tocadas (referência futura para UX)

- Sistema Solar (Sun → Planeta → Órbita)
- Chat com PromptTemplateBar (Moon chips)
- Botão Moon Shot (no Chat)
- Faísca cards (com estrela, comentário, variação, descartar)
- Modal de forced reflection
- Persona selector dos agentes

#### Momento Crítico

**Apresentação da Faísca (passo 5) e forced reflection (passo 7)**. Se Faísca cai em zona óbvia ou incoerente, Creator perde confiança no produto; se forced reflection é fricativa demais, vira fricção decorativa e Creator pula sistematicamente — escalando para alerta de over-reliance (RN-015).

#### Dores no Estado Atual

- Bloqueio criativo recorrente em territórios óbvios
- IA genérica converge para soluções homogeneizadas (Doshi & Hauser 2024)
- Reconstruir contexto de cliente a cada interação
- Risco de leveling-up illusion (satisfação individual sobe, diversidade coletiva desce)
- Identidade autoral em risco com IA gerativa convencional

#### Oportunidades de IA

- **Bisociação calibrada** — Sweet Spot 0.5-0.85 evita óbvio e incoerente
- **Loop adversarial** — Crítico filtra ruído antes de chegar ao Creator
- **Personas brasileiras** — vetor cultural local (Antropófaga / Carnavalesco / Anciã)
- **Forced reflection adaptativo** — N por estágio de carreira preserva engajamento cognitivo
- **Contexto via Biblioteca** — Faíscas combinam domínios distantes mas conhecidos do cliente

#### Features Envolvidas

| Feature | Papel na Jornada |
|---------|------------------|
| FA-02 Moon Shot | Motor central — pipeline Explorer↔Crítico, zonas, modos, marcação |
| FA-04 Chat | Interface conversacional onde a jornada acontece |
| FA-06 Sistema Solar | Acionamento contextual (≤3 cliques) |
| FA-01 Biblioteca | Devora contexto do cliente para Provocar |
| FA-11 Safety cultural | Marcação Faísca, forced reflection, personas brasileiras, tracks |
| FA-07 HITL | Stars + comentários alimentam Eval e DiversityMetric |
| FA-10 Mensuração | Trace MLflow + DiversityMetric mensal |

#### Requisitos Relacionados

| Tipo | IDs | Relevância |
|------|-----|------------|
| **BRs** | BR-001 (primário), BR-010, BR-011, BR-014 | Provocação anti-homogeneização, ownership criativo, cultura brasileira, detecção homogeneização |
| **RNs** | RN-001, RN-002, RN-003, RN-014, RN-015, RN-017, RN-019, RN-020 | Filtragem zona, convergência loop, acionamento ≤3 cliques, marcação visual, forced reflection, track por carreira, mensuração mensal, bloqueio satisfação isolada |
| **JTBDs** | JTBD-08, JTBD-10, JTBD-11, JTBD-12, JTBD-13 (PX-02), JTBD-22 (PX-04), JTBD-25, JTBD-26, JTBD-28, JTBD-29 (PX-05) | — |

#### Critério de Sucesso

| Métrica | Meta | Como medir |
|---------|------|------------|
| % provocações classificadas como úteis (POC) | ≥60% | Testes blind com 3+ seniores |
| Aprovação por Creators em uso real (Piloto) | ≥70% | Score HITL agregado |
| Tempo médio de resposta do pipeline | <15s | Trace MLflow |
| Taxa de cancelamento por timeout | <5% | Trace MLflow |
| Skip de forced reflection | <30% | Trace cognitivo |
| Diversidade coletiva (Cosine Distance, Self-BLEU, Compression Ratio) | Estável ou crescente vs. baseline | RN-019 mensal |

#### Fase e Prioridade

| Aspecto | Valor |
|---------|-------|
| **Fase de entrada** | POC (validar ≥60% provocações úteis com seniores em testes blind) |
| **Criticidade** | Core — diferenciador estratégico do sunOS frente a IA genérica |
| **Justificativa** | Sem JN-02 funcionando bem, BR-001 falha e o posicionamento "agência ambidestra" não se sustenta |

---

### JN-03 — Execução de Tarefa Processual com Skill

#### Descrição

Jornada **operacional primária** — o motor convergente do sunOS. O PX-03 (Operador Processual) tem briefing ou demanda recorrente (Copy Social, Plano de Mídia, Roteiro de Vídeo, Texto de Rádio, Brief Builder, Report Performance). Acessa o Sistema Solar, escolhe o Cliente (Planeta), seleciona a Skill (Órbita), opcionalmente um Moon (chip), digita briefing no Chat. A Skill **injeta contexto da Biblioteca automaticamente** (FA-03 + FA-01, transparente — Caixa-preta para Operacional) com **hierarquia de truncamento** (RN-021): Regras de negócio do cliente (peso 1.0) sempre incluídas; Guidelines (0.8), Histórico (0.6), Contexto mercado (0.4), Referências (0.2) descartadas em ordem se overflow. **Isolamento entre clientes** garantido (RN-010): contexto de Cliente B nunca aparece em sessão de Cliente A.

Output marcado como estímulo (RN-014). Operador refina via Chat (variações, edições). HITL inline (thumbs/comentário) e ao final da sessão (rating 1-5). Trace MLflow grava custo evitado (RN-018).

#### Fluxo de Alto Nível

```
[Trigger: briefing recebido / demanda operacional / item de sprint]
        │
        ▼
[1. PX-03 entra no Sistema Solar → seleciona Cliente (Planeta) → seleciona Skill (Órbita)]
        │
        ▼
[2. Opcionalmente seleciona Moon chip (variação dentro da Skill)]
        │
        ▼
[3. Digita/cola briefing no Chat (FA-04)]
        │
        ▼
[4. Skill (FA-03) puxa contexto via search_knowledge da Biblioteca (FA-01) — transparente]
    - Hierarquia de truncamento se overflow (RN-021)
    - Isolamento entre clientes ativo (RN-010)
    - Operador NUNCA vê referência à Biblioteca (RN-011 — Caixa-preta)]
        │
        ▼
[5. Agente ReAct (ContentCreator/VisualCreator) executa via Gemini Flash default;
    streaming SSE entrega resposta palavra por palavra]
        │
        ▼
[6. Output marcado como estímulo/Faísca (RN-014) — Social Preview se aplicável]
        │
        ▼
[7. Operador avalia HITL inline (thumbs ± comentário, FA-07)]
        │
        ▼
[8. Variações automáticas (3 opções) ou refinamento iterativo]
        │
        ▼
[9. Operador integra output em entregável final (com confirmação explícita, RN-014)]
        │
        ▼
[10. Ao final da sessão: rating 1-5 (FA-07-02)]
        │
        ▼
[11. Trace MLflow grava (FA-10): tempo, tokens, custo;
     RN-018 calcula custo evitado se baseline disponível]
```

#### Personas e Papéis

| Persona | Papel na Jornada | Objetivo Específico |
|---------|------------------|---------------------|
| PX-03 Operador Processual (primária) | Executor — Skills processuais como Copy Social, Plano de Mídia, Roteiro | Entregar com contexto preservado em ≤30% do tempo histórico |
| PX-02 Criativo Sênior | Executor secundário — refina drafts gerados | Refinar sem perder ownership (RN-014) |
| PX-04 Planner | Executor secundário — Análise de Mercado, Persona Sintética, Brief Builder | Análises ricas em insight com contexto histórico |
| PX-05 Junior | Executor com supervisão | Aprender com cases curados (Caixa-preta) |
| PX-01 Líder | Beneficiário indireto | Custo evitado da execução alimenta dashboard |

#### Telas Tocadas

- Sistema Solar (Sun → Planeta → Órbita)
- Chat (FA-04) com PromptTemplateBar e Moon chips
- Social Preview (Instagram para Copy Social)
- Variações (3 opções comparativas)
- HITL inline (thumbs + comentário)
- Sidebar (Validação HITL no Context Sidebar)

#### Momento Crítico

**Passo 4 (context injection)**: se Skill esquece regras de negócio do cliente (peso 1.0 truncado por bug ou config errada), output quebra brand safety e pode ser publicado erroneamente. RN-021 deve abortar execução nessa hipótese e alertar Líder. Segundo momento crítico: **passo 9** (promoção a peça final) — confirmação explícita evita compartilhamento de output IA não revisado.

#### Dores no Estado Atual

- Reconstruir contexto de cliente a cada interação (copia/cola de briefings)
- Refazer templates de Report a cada ciclo
- IA genérica não respeita tom de voz / restrições legais — output precisa ser refeito
- Não tem como demonstrar valor objetivo do trabalho automatizado
- Risco de cross-contamination entre clientes em sessões consecutivas

#### Oportunidades de IA

- **Context injection transparente** — sem busca manual, sem fricção
- **Hierarquia de truncamento** — Regras de negócio sempre presentes
- **Variações automáticas** — 3 opções comparativas sem custo cognitivo extra
- **Custo evitado calculado** — RN-018 transforma execução em evidência de business case
- **Isolamento entre clientes** — RN-010 protege confiança contratual

#### Features Envolvidas

| Feature | Papel na Jornada |
|---------|------------------|
| FA-03 Skills processuais | Motor convergente — 8 Skills configuradas |
| FA-04 Chat | Interface conversacional |
| FA-06 Sistema Solar | Navegação até Skill |
| FA-01 Biblioteca | Context injection via search_knowledge |
| FA-07 HITL | Avaliação inline e por sessão |
| FA-08 Multimodal | Image gen para Copy Social Preview (Phase 16) |
| FA-09 RBAC | Caixa-preta + isolamento entre clientes |
| FA-10 Mensuração | Trace MLflow + custo evitado |

#### Requisitos Relacionados

| Tipo | IDs | Relevância |
|------|-----|------------|
| **BRs** | BR-002 (primário), BR-006, BR-008, BR-013, BR-015 | Aceleração operacional, acesso democrático mediado, privacidade clientes, mensuração custo, integração Skills |
| **RNs** | RN-004, RN-010, RN-011, RN-014, RN-018, RN-021 | Avaliação mensal redução tempo, isolamento clientes, Caixa-preta, marcação visual, custo evitado, hierarquia truncamento |
| **JTBDs** | JTBD-14, JTBD-16, JTBD-19 (PX-03), JTBD-11 (PX-02), JTBD-23 (PX-04) | — |

#### Critério de Sucesso

| Métrica | Meta | Como medir |
|---------|------|------------|
| Redução de tempo médio por tarefa | ≥30% | RN-018 vs. baseline planilha ROI |
| Outputs com contexto Biblioteca avaliados como melhores em A/B | ≥65% | A/B test pré-Piloto |
| Cobertura de tarefas-alvo | ≥10 distintas até final do Piloto | Catálogo de Skills |
| Zero incidentes de cross-contamination | 100% | Auditoria RN-010 |
| Score HITL agregado por Skill | ≥4.0 | Média FA-07-05 |

#### Fase e Prioridade

| Aspecto | Valor |
|---------|-------|
| **Fase de entrada** | Protótipo |
| **Criticidade** | Core |
| **Justificativa** | Valor primário operacional do sunOS; sustenta business case via RN-018 |

---

### JN-04 — Análise Estratégica e Persona Sintética

#### Descrição

Jornada do **Planejamento Estratégico** (PX-04). Combina Skills processuais convergentes (Análise de Mercado, Persona Sintética, Brief Builder) com Moon Shot divergente para conectar **dados de mercado a território criativo não-óbvio**. PX-04 inicia em modo Skill (FA-03), recebe análise estruturada com contexto histórico do cliente injetado, captura insight, e opcionalmente aciona Moon Shot em modo "Estou começando uma ideia" (RN-017) para Provocar Faíscas que combinam o insight com domínios distantes. Output briefa PX-02 (Criativo Sênior) com insumo rico não-genérico.

A jornada também atende **Workflow Pesquisa de Mercado** (FA-05) para new business pitches — quando recorrente ou complexa, vira JN-07.

#### Fluxo de Alto Nível

```
[Trigger: pitch new business / atualização trimestral / briefing estratégico]
        │
        ▼
[1. PX-04 entra no Sistema Solar → seleciona Cliente → seleciona Skill (Análise / Persona / Brief)]
        │
        ▼
[2. Skill puxa Biblioteca: cases históricos, briefings anteriores, tom de voz, dados culturais]
        │
        ▼
[3. PX-04 digita objetivo / hipótese / pergunta no Chat]
        │
        ▼
[4. Agente ReAct executa; output rico em insight estratégico]
        │
        ▼
[5. PX-04 captura insight central (estrela, copia, comenta)]
        │
        ▼
[6. (Opcional) Aciona Moon Shot (FA-02) com insight como input → Faíscas combinam insight + domínios distantes]
        │
        ▼
[7. PX-04 estrela Faíscas relevantes → forced reflection após N stars (RN-015)]
        │
        ▼
[8. Output da jornada (briefing estratégico, persona, análise) → entregável a PX-02 ou cliente]
        │
        ▼
[9. HITL + trace MLflow + custo evitado (RN-018)]
```

#### Personas e Papéis

| Persona | Papel na Jornada | Objetivo Específico |
|---------|------------------|---------------------|
| PX-04 Planner (primária) | Executor — Análise/Persona/Brief Builder | Conectar dados a território criativo, briefar PX-02 |
| PX-02 Criativo Sênior | Beneficiário downstream | Receber insumo rico em insight |
| PX-01 Líder | Beneficiário indireto | Custo evitado e qualidade percebida |

#### Telas Tocadas

- Sistema Solar
- Chat (FA-04) com Skills FA-03 (Análise / Persona Sintética / Brief Builder)
- Botão Moon Shot (transição para JN-02)

#### Momento Crítico

**Passo 6 (transição Skill → Moon Shot)**: ponto onde a jornada deixa o modo convergente e entra no divergente. Se a transição é fricativa, Planner não rompe o óbvio. Se Moon Shot não consome o insight como input, a Faísca é genérica.

#### Dores no Estado Atual

- Conectar dados a território exige intuição artesanal
- Persona Sintética como exercício de Excel/Notion sem inteligência conectada
- Pesquisa para new business demora semanas — gargalo competitivo
- IA genérica não respeita cultura brasileira nem setor publicitário

#### Oportunidades de IA

- **Skills com contexto histórico injetado** — análises ricas desde a v1
- **Ponte Skill → Moon Shot** — divergência guiada por insight estruturado
- **Cultura brasileira** nas Skills (RN-016, FA-11)
- **Sub-workflow Pesquisa de Mercado** (FA-05) quando demanda é recorrente

#### Features Envolvidas

| Feature | Papel na Jornada |
|---------|------------------|
| FA-03 Skills (Análise, Persona, Brief Builder) | Motor convergente |
| FA-02 Moon Shot | Motor divergente (transição opcional) |
| FA-04 Chat | Interface |
| FA-01 Biblioteca | Contexto histórico do cliente |
| FA-11 Safety cultural | Marcação, forced reflection |
| FA-10 Mensuração | Trace + custo evitado |

#### Requisitos Relacionados

| Tipo | IDs | Relevância |
|------|-----|------------|
| **BRs** | BR-001, BR-002, BR-006, BR-011, BR-013, BR-015 | Provocação criativa, aceleração, acesso democrático, cultura, mensuração, integração |
| **RNs** | RN-001, RN-014, RN-017, RN-021 | Filtragem zona, marcação, track por carreira, hierarquia truncamento |
| **JTBDs** | JTBD-21, JTBD-22, JTBD-23 (PX-04) | — |

#### Critério de Sucesso

| Métrica | Meta | Como medir |
|---------|------|------------|
| Tempo médio Análise/Persona/Brief | ≤70% do baseline pré-sunOS | RN-018 |
| Insights de Moon Shot classificados como úteis | ≥60% | HITL |
| Win rate em new business pitches | Mantém ou melhora pós-sunOS | KPI BR-013 |
| Brief Builder reduz iteração com PX-02 | ≥30% | Pesquisa qualitativa |

#### Fase e Prioridade

| Aspecto | Valor |
|---------|-------|
| **Fase de entrada** | Protótipo |
| **Criticidade** | Importante |
| **Justificativa** | Atende PX-04 (Planner) e amplifica PX-02; sustenta BR-001 e BR-002 simultaneamente |

---

### JN-05 — Captura de Conhecimento Pré-Saída de Creator

#### Descrição

Jornada de **continuidade institucional** (BR-005). Quando Creator-chave anuncia saída, PX-01 (Líder) ativa processo de captura de repertório, cases vividos e relacionamento com clientes antes da saída efetiva. O sistema usa **detecção de conhecimento crítico em risco** (RN-008) — alerta quando conteúdo é acessado/contribuído por uma única pessoa em 90 dias. Sistema sugere prioridades de captura ao Líder. Líder agenda entrevista de offboarding, indexa documentação, valida cobertura.

Meta: substituto re-onboarda em ≤70% do tempo histórico, ≥80% das contas críticas com contexto-mínimo documentado.

#### Fluxo de Alto Nível

```
[Trigger: saída anunciada de Creator-chave]
        │
        ▼
[1. PX-01 acessa /clientes ou /biblioteca]
        │
        ▼
[2. Sistema sinaliza "conhecimento em risco" (RN-008): conteúdos acessados/contribuídos só por essa pessoa em 90 dias]
        │
        ▼
[3. PX-01 prioriza por criticidade (cliente ativo, regras de negócio, etc.)]
        │
        ▼
[4. Agenda entrevista de offboarding com Creator que sai]
        │
        ▼
[5. Indexa transcrição/documentação na Biblioteca (JN-01) com tags "offboarding" + cliente]
        │
        ▼
[6. Audita cobertura: ≥80% das contas críticas com contexto-mínimo? Sim → fecha; Não → captura adicional]
        │
        ▼
[7. Quando substituto entra, JN-09 (onboarding) consome diretamente esse conteúdo]
```

#### Personas e Papéis

| Persona | Papel na Jornada | Objetivo Específico |
|---------|------------------|---------------------|
| PX-01 Líder/Curador (primária) | Executor — captura proativa | Mitigar perda institucional |
| Creator que sai | Fonte de conhecimento | Documentar repertório e contexto |
| PX-05 substituto futuro | Beneficiário | Re-onboarda em ≤70% do tempo histórico |

#### Telas Tocadas

- /clientes (Admin de Clientes — sinalização de risco)
- /biblioteca (Admin da Biblioteca — captura, indexação)
- Drawer de KnowledgeItem (metadata + tags offboarding)

#### Momento Crítico

**Passo 2 (sinalização automática)**: se RN-008 não detecta corretamente "conhecimento crítico em risco" (thresholds não calibrados — PA-08), Líder fica sem priorização e captura é parcial.

#### Dores no Estado Atual

- Conhecimento crítico vai junto com a pessoa (caso histórico Stella e Fernando jan/2025)
- Sem alerta proativo — Líder descobre lacunas só quando substituto trava
- Re-onboarding leva meses

#### Oportunidades de IA

- **Detecção automática de risco** (RN-008) baseada em AccessLog
- **Sugestão de prioridades** (clientes ativos, regras de negócio)
- **Transcrição automática** da entrevista de offboarding (FA-08 áudio→texto)
- **Indexação automática** com tags sugeridas via embedding

#### Features Envolvidas

| Feature | Papel na Jornada |
|---------|------------------|
| FA-01 Biblioteca | Repositório do conhecimento capturado |
| FA-12 Admin | UX de curadoria (`/biblioteca`, `/clientes`) |
| FA-09 RBAC | Líder tem permissão; Operacional não (Caixa-preta) |
| FA-10 Mensuração | AccessLog alimenta detecção de risco |
| FA-08 Multimodal (futuro) | Transcrição de entrevista de offboarding |

#### Requisitos Relacionados

| Tipo | IDs | Relevância |
|------|-----|------------|
| **BRs** | BR-005 (primário), BR-004, BR-007 | Continuidade pós-turnover, repositório unificado, proteção IP |
| **RNs** | RN-006, RN-007, RN-008 | Validação metadados, visibilidade, detecção risco |
| **JTBDs** | JTBD-01 (PX-01) | — |

#### Critério de Sucesso

| Métrica | Meta | Como medir |
|---------|------|------------|
| Tempo de re-onboarding pós-saída | ≤70% do baseline | Comparação real após teste |
| Cobertura de contas críticas com contexto-mínimo | ≥80% | Auditoria por cliente |
| Detecção proativa antes do anúncio formal | ≥70% dos casos | RN-008 logs |

#### Fase e Prioridade

| Aspecto | Valor |
|---------|-------|
| **Fase de entrada** | Piloto |
| **Criticidade** | Importante |
| **Justificativa** | Endereça BR-005 (cobertura única); responde dor histórica documentada (saída Stella e Fernando) |

---

### JN-06 — Devil's Advocate ("Me Prova que Tá Errada")

#### Descrição

Variante **senior-leaning** do Moon Shot. Em vez de divergir a partir de briefing aberto (JN-02 modo "começando uma ideia"), o sênior **já tem ideia formada** e pede ao agente para **stress-testar** — argumentar contra, encontrar furos, propor contra-ângulos. Modo aciona track sênior do RN-017, que reduz fricção (devil's advocate é stress-test rápido) e ativa visible reasoning hidden by default (BR-012).

Diferença-chave de JN-02: input é uma ideia consolidada; output são contra-argumentos estruturados que o Creator decide aceitar/rejeitar. Marcação como estímulo (RN-014) preserva ownership.

#### Fluxo de Alto Nível

```
[Trigger: sênior tem ideia formada, quer pré-defender antes de levar a cliente]
        │
        ▼
[1. Sênior no Chat (FA-04) com Cliente ativo]
        │
        ▼
[2. Aciona Moon Shot em modo "Tenho uma ideia, me prova que tá errada" (RN-017 sênior)]
        │
        ▼
[3. Apresenta a ideia (texto/imagem)]
        │
        ▼
[4. Pipeline Crítico-driven gera contra-argumentos estruturados (≥3) cobrindo:
    - Premissas frágeis
    - Riscos de mercado
    - Reação esperada do cliente
    - Alternativas mais fortes]
        │
        ▼
[5. Cada contra-argumento marcado como estímulo (RN-014)]
        │
        ▼
[6. Sênior estrela contra-argumentos válidos · descarta os fracos]
        │
        ▼
[7. Decide: refina ideia / mantém ideia / pivota]
        │
        ▼
[8. Forced reflection após N=5 stars (RN-015 sênior)]
        │
        ▼
[9. Trace MLflow + DiversityMetric]
```

#### Personas e Papéis

| Persona | Papel na Jornada | Objetivo Específico |
|---------|------------------|---------------------|
| PX-02 Criativo Sênior (primária) | Executor — stress-test rápido de ideia | Defender com cliente sem ser surpreendido por crítica óbvia |
| PX-04 Planner sênior | Executor secundário | Pré-defender posicionamento estratégico |

#### Telas Tocadas

- Chat (FA-04) com modo selector
- Faísca/contra-argumento cards

#### Momento Crítico

**Passo 4 (qualidade dos contra-argumentos)**: se argumentos são genéricos ou óbvios, sênior abandona o modo. Se são fortes mas mal-fundamentados, criam confusão. Calibração da zona Sweet Spot (RN-001) específica para argumentos contraditórios é não-trivial.

#### Dores no Estado Atual

- Sênior defende ideia internamente sem stress-test estruturado — descobre crítica só na reunião com cliente
- IA genérica concorda com tudo (sycophancy) — não ajuda em devil's advocate
- Não há ferramenta cultural para ataque construtivo de ideia

#### Oportunidades de IA

- **Modo divergente invertido** — agente Crítico-driven em vez de Explorer-driven
- **Personas brasileiras** com tom adequado (Antropófaga é boa devil's advocate cultural)
- **Visible reasoning hidden by default** preserva o aha do Creator (BR-012)

#### Features Envolvidas

| Feature | Papel na Jornada |
|---------|------------------|
| FA-02 Moon Shot (modo sênior) | Motor — pipeline Crítico-driven |
| FA-04 Chat | Interface |
| FA-11 Safety cultural | Marcação, forced reflection, track sênior |
| FA-07 HITL | Stars + comentários |
| FA-10 Mensuração | Trace + DiversityMetric |

#### Requisitos Relacionados

| Tipo | IDs | Relevância |
|------|-----|------------|
| **BRs** | BR-001, BR-010, BR-012 | Provocação criativa, ownership, UX por carreira |
| **RNs** | RN-001, RN-002, RN-014, RN-015, RN-017 | Filtragem zona, convergência, marcação, forced reflection, track sênior |
| **JTBDs** | JTBD-09 (PX-02) | — |

#### Critério de Sucesso

| Métrica | Meta | Como medir |
|---------|------|------------|
| Contra-argumentos classificados como úteis | ≥60% | HITL |
| Adoção do modo por seniores | ≥50% dos seniores ativos no Piloto | Trace |
| NPS sênior | ≥ NPS junior | Pesquisa qualitativa |

#### Fase e Prioridade

| Aspecto | Valor |
|---------|-------|
| **Fase de entrada** | Piloto |
| **Criticidade** | Importante |
| **Justificativa** | Atende JTBD-09 (PX-02) e endereça BR-012 (UX por carreira para sêniores) |

---

### JN-07 — Configuração e Operação de Workflow Recorrente

#### Descrição

Jornada de **automação sem código**. Líder/Operador configura Workflow recorrente (Report Mensal, Plano de Mídia, Monitor de Anomalias, Pesquisa de Mercado) via Admin (`/workflows`) compondo steps (tool, LLM, condição, ação, HITL gate). Define **schedule humanizado** ("Toda segunda às 9h"), atribui clientes/Skills, ativa. Cloud Scheduler dispara conforme cron; LangGraph StateGraph executa; HITL gates pausam para revisão humana em decisões críticas. Histórico de execuções em timeline.

Endereça gargalo de **time de 4 devs não escala** (BR-002): champions e analistas configuram suas próprias automações sem fila de eng.

#### Fluxo de Alto Nível

```
[Trigger Setup: necessidade de automação recorrente]
        │
        ▼
[1. PX-01 ou PX-03 acessa /workflows]
        │
        ▼
[2. Cria Workflow novo: nome + descrição + cliente]
        │
        ▼
[3. Compõe steps em sequência:
    - Tool (search_knowledge, call_api, send_webhook, etc.)
    - LLM (executa Skill com prompt parametrizado)
    - Condição (branch SE/ENTÃO)
    - Ação (publica, notifica, salva)
    - HITL gate (pausa para revisão humana)]
        │
        ▼
[4. Define schedule humanizado ("Toda segunda às 9h", "Dia 1 às 8h")]
        │
        ▼
[5. (Opcional) encadeia sub-workflows (SPEC-004)]
        │
        ▼
[6. Salva e ativa]
        │
        ▼
══════════════════════════════════════════════════════
[Trigger Execução: Cloud Scheduler dispara]
        │
        ▼
[7. LangGraph StateGraph compila e executa]
        │
        ▼
[8. Cada step gera trace MLflow]
        │
        ▼
[9. HITL gate: notifica humano (e-mail/UI), pausa execução]
        │
        ▼
[10. Humano aprova/rejeita/edita]
        │
        ▼
[11. Workflow completa: produz output (Report PDF, Plano XLSX, etc.)]
        │
        ▼
[12. Histórico atualizado com timeline; custo evitado calculado (RN-018)]
```

#### Personas e Papéis

| Persona | Papel na Jornada | Objetivo Específico |
|---------|------------------|---------------------|
| PX-01 Líder | Configurador (primária) | Automação sem código, sem dependência de eng |
| PX-03 Operador | Configurador secundário e revisor de HITL gate | Tarefas recorrentes automatizadas |
| PX-04 Planner | Configurador de Pesquisa de Mercado / Análise recorrente | Automação de pesquisa para new business |

#### Telas Tocadas

- /workflows (catálogo)
- Editor de Workflow (steps, schedule, HITL config)
- Histórico de execuções (timeline)
- Drawer de execução individual

#### Momento Crítico

**Passo 9 (HITL gate)**: se notificação não chega ou interface para aprovar é fricativa, Workflow trava ou humano aprova sem revisar (caça-fricção). Define qualidade da automação.

#### Dores no Estado Atual

- Time de 4 devs não escala — fila longa para automações
- Reports refeitos manualmente a cada ciclo
- Sem rastreabilidade unificada de execuções
- Dependência de orquestradores externos sem governança Suno

#### Oportunidades de IA

- **Builder visual sem código** — analistas configuram
- **Schedule humanizado** — Cloud Scheduler abstraído como linguagem natural
- **HITL gates nativos** — humano no loop quando necessário
- **Encadeamento (sub-workflows)** — modularidade
- **Custo evitado por execução** alimenta dashboard

#### Features Envolvidas

| Feature | Papel na Jornada |
|---------|------------------|
| FA-05 Workflows | Motor de automação |
| FA-12 Admin (`/workflows`) | UX de config |
| FA-03 Skills | Workflows orquestram Skills |
| FA-07 HITL | Gates de revisão humana |
| FA-09 RBAC | Quem pode criar/executar |
| FA-10 Mensuração | Trace + custo evitado |

#### Requisitos Relacionados

| Tipo | IDs | Relevância |
|------|-----|------------|
| **BRs** | BR-002 (primário), BR-013, BR-016 | Aceleração, mensuração custo, coexistência ferramentas |
| **RNs** | RN-004, RN-018, RN-022 | Avaliação mensal redução tempo, custo evitado, avaliação duplicidade vs. mercado |
| **JTBDs** | JTBD-06 (PX-01), JTBD-15, JTBD-18 (PX-03), JTBD-20 (PX-04) | — |

#### Critério de Sucesso

| Métrica | Meta | Como medir |
|---------|------|------------|
| Workflows ativos com schedule | ≥5 ativos no Piloto | Catálogo |
| Configuração sem dependência de eng | 100% | Auditoria |
| Tempo entre erro de execução e correção | <24h | Histórico de execuções |
| HITL gates funcionando (aprovação real) | ≥80% das execuções com gate aprovadas conscientemente | Pesquisa qualitativa |

#### Fase e Prioridade

| Aspecto | Valor |
|---------|-------|
| **Fase de entrada** | Piloto |
| **Criticidade** | Core para BR-002 |
| **Justificativa** | Empoderamento do time sem fila de eng; sustenta cobertura de tarefas-alvo |

---

### JN-08 — Governança Executiva e Mensuração Mensal

#### Descrição

Jornada **defensável** — sustenta o investimento. PX-01 (Líder) consome o **dashboard executivo mensal** (RN-005) que triangula custo evitado (RN-018), KPIs de negócio (win rate, shortlist rate, retenção de seniores) e safety coletiva (3 métricas de homogeneização — RN-019). Sistema **bloqueia relatório com satisfação isolada** (RN-020) — toda exibição de NPS/thumbs precisa coexistir com set-level diversity. Líder também audita acessos administrativos (RN-012) e revisa Skills com redução < 30% por 2 meses (RN-004).

Reuniões semanais de terça com Sponsor (Guga) usam o dashboard como referência viva. Reporting trimestral à Diretoria com comparação ano contra ano.

#### Fluxo de Alto Nível

```
[Trigger: dia 5 do mês / reunião semanal de terça / alerta automático]
        │
        ▼
[1. PX-01 abre dashboard executivo (FA-10)]
        │
        ▼
[2. Sistema gerou dashboard até dia 5 (RN-005) com:
    - Tendência mensal de custo evitado (RN-018)
    - KPIs de negócio (win rate, shortlist, retenção)
    - 3 métricas de homogeneização coletiva (RN-019)
    - Score HITL agregado por Skill
    - Variações > 25% mês a mês com flag visual]
        │
        ▼
[3. PX-01 valida; se variação > 25%, comenta explicação textual obrigatória]
        │
        ▼
[4. Audita acessos administrativos:
    - Logs estruturados (RN-012)
    - Acessos fora de horário comercial flageados
    - Volume > 3σ alerta Diretoria]
        │
        ▼
[5. Revisa Skills "em revisão" (redução < 30% por 2 meses, RN-004)]
        │
        ▼
[6. Se alerta de homogeneização (RN-019, divergência > 2σ):
    - Plano de mitigação proposto
    - Escalação para Sponsor + sócios
    - Após 90 dias sem mitigação efetiva: suspender funcionalidade-causa]
        │
        ▼
[7. Reunião de terça: usa dashboard como referência viva com Guga]
        │
        ▼
[8. Trimestral: reporting à Diretoria com comparação ano contra ano]
```

#### Personas e Papéis

| Persona | Papel na Jornada | Objetivo Específico |
|---------|------------------|---------------------|
| PX-01 Líder/Curador (primária) | Consumidor do dashboard, auditor, revisor | Sustentar continuidade do investimento |
| Sponsor (Guga) | Consumidor secundário | Aprovar continuidade |
| Diretoria | Consumidor trimestral | Validar business case |

#### Telas Tocadas

- /dashboard (executivo, mensal)
- /skills (revisão de Skills com redução baixa)
- /audit-logs (acessos administrativos)
- Alertas (homogeneização, anomalias)

#### Momento Crítico

**Passo 6 (alerta de homogeneização)**: se RN-019 não dispara corretamente (baseline pré-sunOS não calibrado — PA-03/PA-06), modo de falha existencial passa despercebido. Se dispara mas não há plano de mitigação acionável, vira ruído ignorado.

#### Dores no Estado Atual

- ROI fica anedótico — Sponsor sem munição diante da Diretoria
- Reuniões semanais sem dashboard único
- Risco de homogeneização invisível ao olhar individual
- Acessos administrativos sem auditoria estruturada (sem DPO formal — Parte 1 §3.4)

#### Oportunidades de IA

- **Custo evitado calculado por execução** — evidência objetiva
- **Diversidade coletiva mensurada mensalmente** — research foundation operacional
- **Bloqueio anti-pattern** (RN-020) — nunca celebra adoção sem espelhar saúde coletiva
- **Auditoria automática** de acessos administrativos
- **Reuniões semanais com dashboard vivo** — em vez de slides montados

#### Features Envolvidas

| Feature | Papel na Jornada |
|---------|------------------|
| FA-10 Mensuração | Motor central — tracing, eval, dashboard, KPIs |
| FA-09 Governança | Auditoria de acessos administrativos |
| FA-11 Safety cultural | Mensuração mensal de homogeneização, bloqueio de relatório |
| FA-12 Admin | UX do dashboard e logs |
| FA-07 HITL | Score agregado alimenta dashboard |

#### Requisitos Relacionados

| Tipo | IDs | Relevância |
|------|-----|------------|
| **BRs** | BR-003 (primário), BR-007, BR-009, BR-013, BR-014 | ROI, proteção IP, auditabilidade, mensuração custo, detecção homogeneização |
| **RNs** | RN-004, RN-005, RN-009, RN-011, RN-012, RN-013, RN-018, RN-019, RN-020 | Avaliação Skills, dashboard, RBAC, Caixa-preta, auditabilidade, retenção LGPD, custo evitado, homogeneização, bloqueio satisfação isolada |
| **JTBDs** | JTBD-03, JTBD-04, JTBD-05, JTBD-07 (PX-01) | — |

#### Critério de Sucesso

| Métrica | Meta | Como medir |
|---------|------|------------|
| Dashboard publicado até dia 5 | 100% dos meses | Auditoria |
| Reuniões semanais com Guga usando dashboard | 100% | Pesquisa qualitativa |
| Cobertura ≥3 KPIs de negócio | 100% | Conteúdo do dashboard |
| Mensuração mensal das 3 métricas de homogeneização | 100% | RN-019 logs |
| Zero relatórios com satisfação isolada | 100% | RN-020 bloqueio |
| Business case aprovado pela Diretoria | até Q3 2026 | Decisão Diretoria |

#### Fase e Prioridade

| Aspecto | Valor |
|---------|-------|
| **Fase de entrada** | Piloto |
| **Criticidade** | Core para BR-003 e BR-014 |
| **Justificativa** | Modo de falha existencial (homogeneização sem detecção) e business case (sem dashboard, sponsor perde munição) |

---

### JN-09 — Onboarding de Creator Junior

#### Descrição

Jornada de **adoção protegida** para PX-05 (Creator Junior). Após login, sistema sugere **track de onboarding por estágio de carreira** (RN-017): junior recebe "Estou começando uma ideia" (divergente, abundante); sênior receberia "Me prova que tá errada" (devil's advocate); pleno escolhe. Tutorial guiado em ≤3 sessões introduzindo Sistema Solar, vocabulário Suno (Devorar, Provocar, Faísca), Skills processuais com Caixa-preta, e princípio "AI Provoca, Humano Cria" (RN-014).

Forced reflection adaptado: N=3 para junior (mais protetivo que N=5 sênior — RN-015). Visible reasoning hidden by default (BR-012). Personas brasileiras dos agentes (Antropófaga, Carnavalesco, Anciã) ressoam com cultura local. Métricas trimestrais segmentadas por estágio (FA-11-08).

#### Fluxo de Alto Nível

```
[Trigger: novo Creator entra na Suno; primeiro login no sunOS]
        │
        ▼
[1. Login Google → RBAC determina perfil (Operacional default para junior)]
        │
        ▼
[2. Sistema apresenta tela inicial perguntando estágio (anos de experiência, cargo)]
        │
        ▼
[3. RN-017: junior (<3 anos) → sugere track "Estou começando uma ideia"; com opção de pular]
        │
        ▼
[4. Tutorial sessão 1 — Sistema Solar e Caixa-preta:
    - Sun → Planeta → Skill em ≤3 cliques
    - Skills com contexto invisível (sem ver Biblioteca)
    - Vocabulário Suno: Devorar, Provocar, Faísca, Brasa]
        │
        ▼
[5. Tutorial sessão 2 — Moon Shot (modo divergente):
    - Acionamento de Faísca
    - Marcação como estímulo (RN-014)
    - Forced reflection N=3 explicada antes de aparecer]
        │
        ▼
[6. Tutorial sessão 3 — Skills processuais:
    - Copy Social com tom de voz injetado
    - HITL inline (thumbs/comentário)
    - Princípio "AI Provoca, Humano Cria"]
        │
        ▼
[7. Junior ativo no produto — JN-02, JN-03 com track adaptado]
        │
        ▼
[8. Métricas trimestrais segmentadas (FA-11-08): NPS junior, taxa de skip de reflection, qualidade percebida]
```

#### Personas e Papéis

| Persona | Papel na Jornada | Objetivo Específico |
|---------|------------------|---------------------|
| PX-05 Creator Junior (primária) | Onboarding | Aprender com proteção contra over-reliance |
| PX-02 Mentor sênior | Beneficiário indireto | Mentorar com sistema como complemento |
| PX-01 Líder | Beneficiário (mensuração) | Saúde do segmento junior monitorada |

#### Telas Tocadas

- Tela de boas-vindas / track selector
- Tutorial guiado (3 sessões)
- Sistema Solar
- Chat com Skills

#### Momento Crítico

**Passo 3 (sugestão de track)**: se sugestão é fricativa ou imprecisa (RN-017 confiabilidade Baixa — PA-09 pendente), junior pula direto e perde proteção. **Passo 5-6** (princípio AI Provoca): se mensagem não é internalizada, junior cria hábito de over-reliance.

#### Dores no Estado Atual

- Curva de aprendizado longa (4-6 meses pré-sunOS)
- Conhecimento institucional fragmentado em Drives/conversas
- IA genérica não respeita cultura brasileira; output homogeneizado vira hábito desde dia 1
- Mentoria humana limitada por tempo do sênior
- Dificuldade em diferenciar quando IA está ajudando vs. erodindo competência

#### Oportunidades de IA

- **Track adaptativo por estágio** (RN-017)
- **Forced reflection mais frequente para junior** (RN-015 N=3)
- **Visible reasoning hidden by default** preserva o aha
- **Personas brasileiras** ensinam cultura desde o dia 1
- **Cases curados na Biblioteca** (Caixa-preta) — onboarding via Skills

#### Features Envolvidas

| Feature | Papel na Jornada |
|---------|------------------|
| FA-11 Safety cultural | Track, forced reflection, marcação, personas, manifesto |
| FA-02 Moon Shot | Modo "começando uma ideia" (junior) |
| FA-04 Chat | Interface |
| FA-01 Biblioteca | Cases curados via Caixa-preta |
| FA-03 Skills | Aprendizado processual |
| FA-09 RBAC | Perfil Operacional default para junior |

#### Requisitos Relacionados

| Tipo | IDs | Relevância |
|------|-----|------------|
| **BRs** | BR-006, BR-010, BR-011, BR-012 (primário) | Acesso democrático, ownership, cultura, UX por carreira |
| **RNs** | RN-011, RN-014, RN-015, RN-016, RN-017 | Caixa-preta, marcação, forced reflection, vocabulário, track |
| **JTBDs** | JTBD-25, JTBD-26, JTBD-27, JTBD-28, JTBD-29 (PX-05) | — |

#### Critério de Sucesso

| Métrica | Meta | Como medir |
|---------|------|------------|
| Curva de aprendizado | -40% vs. baseline pré-sunOS | Entrevistas qualitativas |
| NPS junior ≥ NPS sênior | Sim | Pesquisa qualitativa |
| Taxa de skip de reflection (junior) | <30% | Trace |
| Sem queda em pensamento crítico | Manutenção em entrevistas | Pesquisa qualitativa |
| Métricas por estágio publicadas | Trimestralmente | FA-11-08 |

#### Fase e Prioridade

| Aspecto | Valor |
|---------|-------|
| **Fase de entrada** | Piloto |
| **Criticidade** | Importante |
| **Justificativa** | BR-012 cobertura única em FA-11; protege contra over-reliance documentada (Microsoft Research / MIT 2025) |

---

### JN-10 — Configuração de Nova Skill (sem código)

#### Descrição

Jornada de **empoderamento de produto sem dependência de eng**. PX-01 (Líder) ou Admin cria/edita Skill via `/skills` (FA-12) — define identidade (nome, descrição, ícone), system prompt proprietário (Caixa-preta — RN-009), modelo preferencial e temperatura, Moons (sub-áreas com chips), atribui clientes elegíveis. Sistema versiona system prompts (history). Validação de metadados obrigatórios (RN-006 análoga). Skill nova fica disponível imediatamente nas Órbitas dos clientes atribuídos.

Endereça gargalo de "time de 4 devs não escala" (BR-002) e protege IP (BR-007 — system prompts ficam no /skills com RBAC).

#### Fluxo de Alto Nível

```
[Trigger: nova capacidade necessária; system prompt a refinar]
        │
        ▼
[1. PX-01 acessa /skills via Admin (FA-12)]
        │
        ▼
[2. Cria Skill nova: nome + descrição + ícone + tipo (criação/mídia/planejamento)]
        │
        ▼
[3. Configura system prompt proprietário (Caixa-preta — RN-009)]
        │
        ▼
[4. Define modelo preferencial (Gemini Flash default; GPT-4o, Claude alternativas)]
        │
        ▼
[5. Define Moons (sub-áreas com chips no PromptTemplateBar)]
        │
        ▼
[6. Atribui Skill a clientes elegíveis]
        │
        ▼
[7. Salva — sistema versiona system prompt (history)]
        │
        ▼
[8. Skill imediatamente disponível nas Órbitas dos clientes]
        │
        ▼
[9. Score HITL inicia em 0 e evolui com uso (FA-07-05)]
        │
        ▼
[10. Avaliação mensal: redução de tempo ≥30% mantida (RN-004)]
```

#### Personas e Papéis

| Persona | Papel na Jornada | Objetivo Específico |
|---------|------------------|---------------------|
| PX-01 Líder/Curador (primária) | Configurador | Empoderar área sem fila de eng |
| Champions (Gus/Teda/Le) | Co-configuradores | Iterar Skills da própria área |
| PX-02/03/04/05 | Beneficiários downstream | Recebem novas Skills |

#### Telas Tocadas

- /skills (catálogo)
- Editor de Skill (4 tabs: identidade, configuração, moons, clientes)
- Drawer de detalhes
- History de versões do system prompt

#### Momento Crítico

**Passo 3 (system prompt)**: prompt ruim cria Skill inutilizável; prompt vazado expõe IP. RN-009 (RBAC) protege; auditoria (RN-012) registra edições.

#### Dores no Estado Atual

- Skill nova depende de squad de eng — fila longa
- System prompts em arquivos espalhados, sem versionamento
- Sem governança de quem editou o quê
- Iniciativas isoladas de IA por time, sem proteção de IP

#### Oportunidades de IA

- **Pattern Model Repo** (SPEC-005) — UX consistente
- **Versionamento automático** do system prompt
- **Score HITL** alimenta saúde da Skill
- **Avaliação mensal automática** (RN-004) — Skills sem performance flagged

#### Features Envolvidas

| Feature | Papel na Jornada |
|---------|------------------|
| FA-12 Admin (`/skills`) | UX da config |
| FA-03 Skills | Entidade gerenciada |
| FA-09 RBAC | Restrição a Admin/Líder; Caixa-preta sobre system prompt |
| FA-10 Mensuração | Avaliação mensal (RN-004) |
| FA-07 HITL | Score alimenta saúde |

#### Requisitos Relacionados

| Tipo | IDs | Relevância |
|------|-----|------------|
| **BRs** | BR-002, BR-007 (primário), BR-015 | Aceleração, proteção IP, integração Skills |
| **RNs** | RN-004, RN-009, RN-011, RN-012 | Avaliação mensal, RBAC, Caixa-preta, auditoria |
| **JTBDs** | JTBD-02 (PX-01) | — |

#### Critério de Sucesso

| Métrica | Meta | Como medir |
|---------|------|------------|
| Tempo médio de config de Skill nova | ≤5 min | Tracking |
| Versionamento de system prompts | 100% | History |
| Zero exposição de system prompts a Operacional | 100% | Auditoria RBAC |

#### Fase e Prioridade

| Aspecto | Valor |
|---------|-------|
| **Fase de entrada** | Protótipo |
| **Criticidade** | Importante |
| **Justificativa** | Empoderamento de produto sem fila de eng; pré-requisito para escalar Skills no Piloto |

---

## 5. Conexão com Features e Roadmap

### 5.1. Features por Jornada

| Feature | Jornadas onde aparece | Papel transversal |
|---------|----------------------|-------------------|
| FA-01 Biblioteca | JN-01 (curadoria), JN-02, JN-03, JN-04, JN-05, JN-09 (Caixa-preta) | Infraestrutura de conhecimento — invisível mas alimenta tudo |
| FA-02 Moon Shot | JN-02 (primária), JN-04 (transição), JN-06, JN-09 (track junior) | Motor divergente |
| FA-03 Skills processuais | JN-03 (primária), JN-04, JN-07, JN-09, JN-10 | Motor convergente |
| FA-04 Chat | JN-02, JN-03, JN-04, JN-06, JN-09 | Interface conversacional |
| FA-05 Workflows | JN-07 (primária); automatiza JN-03 e JN-04 quando recorrente | Engine de automação |
| FA-06 Sistema Solar | JN-02, JN-03, JN-04, JN-09 (entrada de jornadas) | Navegação |
| FA-07 HITL | JN-02, JN-03, JN-04, JN-06, JN-07, JN-09 (transversal) | Curadoria contínua |
| FA-08 Multimodal | JN-02 (Faísca visual), JN-03 (Copy Social Preview), JN-05 (transcrição) | Output visual |
| FA-09 Governança/RBAC | JN-01, JN-03, JN-05, JN-08, JN-10 (transversal) | Segurança e Caixa-preta |
| FA-10 Mensuração | JN-08 (primária); transversal a todas as jornadas (trace) | Observabilidade |
| FA-11 Safety cultural | JN-02, JN-06, JN-08, JN-09 (transversal) | Padrão cultural |
| FA-12 Admin areas | JN-01, JN-05, JN-07, JN-08, JN-10 | UX administrativa |

### 5.2. Jornadas por Fase

| Fase | Jornadas Completas | Jornadas Parciais | Jornadas Futuras |
|------|--------------------|-------------------|------------------|
| **POC** | JN-02 (Moon Shot — pipeline mínimo) | — | JN-01, JN-03 a JN-10 |
| **Protótipo** | JN-01, JN-02 (UX completa), JN-03, JN-04, JN-10 | — | JN-05 a JN-09 |
| **Piloto** | JN-01 a JN-09 (todas operacionais) | JN-10 (refinamento contínuo) | — |
| **MVP** | Todas as 10 em produção contínua | — | — |

### 5.3. Critérios de Sucesso por Jornada

| Jornada | Critério Principal | Como Medir |
|---------|--------------------|-----------|
| JN-01 | ≥500 itens curados, <5min/item, ≥80% contas críticas com contexto-mínimo | Auditoria e AccessLog |
| JN-02 | ≥60% provocações úteis (POC blind) → ≥70% (Piloto), tempo <15s, diversidade coletiva estável | HITL + RN-019 mensal |
| JN-03 | -30% tempo médio vs. baseline; 65% A/B com Biblioteca; cobertura ≥10 tarefas; zero cross-contamination | RN-018 + auditoria RN-010 |
| JN-04 | Análise/Persona/Brief -30% tempo; insights úteis ≥60%; Brief Builder reduz iteração ≥30% | HITL + pesquisa qualitativa |
| JN-05 | Re-onboarding -30%; ≥80% contas críticas com contexto-mínimo; detecção proativa ≥70% | Comparação real + RN-008 |
| JN-06 | Contra-argumentos úteis ≥60%; adoção sênior ≥50%; NPS sênior ≥ NPS junior | HITL + pesquisa |
| JN-07 | ≥5 Workflows ativos com schedule; zero dependência de eng; HITL gates funcionando | Catálogo + auditoria |
| JN-08 | Dashboard até dia 5 (100%); ≥3 KPIs negócio; mensuração homogeneização (100%); zero relatório isolado | Conteúdo dashboard + RN-019/020 |
| JN-09 | -40% curva aprendizado; NPS junior ≥ NPS sênior; skip reflection <30% | Pesquisa qualitativa |
| JN-10 | Config ≤5min/Skill; versionamento 100%; zero exposição system prompts | Tracking + auditoria |

### 5.4. Cobertura BR ↔ Jornada

| BR | Jornadas que cobrem | Status |
|----|---------------------|:------:|
| BR-001 (Provocação criativa) | JN-02, JN-04, JN-06, JN-09 | OK |
| BR-002 (Aceleração operacional) | JN-03, JN-04, JN-07, JN-10 | OK |
| BR-003 (ROI) | JN-08 | OK |
| BR-004 (Biblioteca) | JN-01, JN-05 | OK |
| BR-005 (Continuidade pós-turnover) | JN-05, JN-01 | OK |
| BR-006 (Acesso democrático) | JN-03, JN-04, JN-09 | OK |
| BR-007 (Proteção IP) | JN-01, JN-08, JN-10 | OK |
| BR-008 (Privacidade clientes) | JN-03 (RN-010) | OK |
| BR-009 (Auditabilidade) | JN-08 | OK |
| BR-010 (Ownership criativo) | JN-02, JN-03, JN-06, JN-09 | OK |
| BR-011 (Cultura brasileira) | JN-02, JN-04, JN-09 | OK |
| BR-012 (UX por carreira) | JN-02, JN-06, JN-09 | OK (cobertura múltipla — mitiga risco identificado na Parte 1 §6.3) |
| BR-013 (Mensuração custo) | JN-03, JN-07, JN-08 | OK |
| BR-014 (Detecção homogeneização) | JN-02, JN-08 | OK |
| BR-015 (Integração Skills) | JN-03, JN-04, JN-10 | OK |
| BR-016 (Coexistência ferramentas) | JN-07 (RN-022) | OK |

**Cobertura completa**: cada um dos 16 BRs tem ≥1 jornada associada.

---

## 6. Assunções, Lacunas e Itens a Validar

### 6.1. Relações Inferidas

| Relação | Fonte de Inferência | Confiança | Status |
|---------|---------------------|-----------|--------|
| JN-04 transita para JN-02 (Skill → Moon Shot) | Inferido da Parte 2 §3.4 (PX-04 transita entre divergente e convergente) | Alta | A validar com Sergio Katz |
| JN-09 inclui modo Antropófaga/Carnavalesco/Anciã | Inferido da Parte 2 §3.5 (PX-05 JTBD-29) + ASS-05 da Parte 1 | Média | A validar com Bruno Prosperi |
| JN-05 (captura pré-saída) tem detecção automática (RN-008) | Inferido do BRD Parte 4 + Parte 1 PA-08 (calibração de "crítico" pendente) | Média | A validar com Heitor + sócios |
| JN-08 inclui revisão mensal de Skills com redução < 30% (RN-004) | Inferido da Parte 1 ROI mensuração | Alta | A validar |
| Encadeamento JN-07 sub-workflows depende de SPEC-004 | Inferido do feature map | Alta | OK (já decidido) |

### 6.2. Jornadas a Refinar

| Jornada | O que falta | Como obter |
|---------|-------------|------------|
| JN-02 (POC) | Configuração concreta de zona Sweet Spot por tipo de briefing (Vivo vs. Americanas vs. Sicredi) | Testes blind com 3+ seniores em POC |
| JN-05 | Calibração de thresholds RN-008 ("conhecimento crítico", "long-tenure") | PA-08 com Heitor + sócios |
| JN-06 | Pipeline Crítico-driven é variante do Explorer-driven? Spec ainda não detalhou | FRD Moon Shot §FR-009 (a refinar) |
| JN-07 | Lista atualizada de ferramentas adotadas para guardar contra duplicidade (RN-022) | PA-11 com Diretoria |
| JN-08 | Formato exato do dashboard executivo (visualização, KPIs específicos) | PA-05 com Heitor + Guga |
| JN-09 | Definições por área de júnior/pleno/sênior | PA-09 com Bruno Prosperi (criação), Takai (mídia) |

### 6.3. Decisões Pendentes

| Decisão | Impacto | Responsável | Prazo sugerido |
|---------|---------|-------------|----------------|
| Validar baseline pré-sunOS de homogeneização (PA-03/PA-06) | Sem baseline, JN-08 não dispara alertas RN-019 | Bruno Prosperi + Heitor | Antes do Piloto |
| Confirmar PX-05 como persona separada (ASS-PX-01 da Parte 2) | Se falsa, JN-09 vira variação de JN-02/JN-03 com tracks | Heitor + Bruno Prosperi | Maio 2026 |
| Aprovar política específica de retenção de dados pessoais (PA-07) | RN-013 fica subespecificada para JN-08 (auditoria) | Diretoria + Heitor | Antes do Piloto |
| Decidir se FA-12-08 (validação automática de vocabulário) é gate Piloto ou MVP | Afeta JN-01, JN-10 (cultura UX) | Heitor + time dev | Junho 2026 |
| Validar critérios quantitativos das jornadas antes de virarem compromissos | -30%, ≥60%, ≥70% etc. | Heitor + Guga | Maio 2026 |
| Confirmar champions (Gus/Teda/Le) como sub-papel de PX-01 ou persona separada (ASS-PX-02) | Pode demandar JN-11 dedicada de "Champion ativando área" | Heitor + Yuri | Maio 2026 |

### 6.4. Riscos Identificados

| Risco | Jornada(s) afetada(s) | Mitigação proposta |
|-------|----------------------|---------------------|
| Forced reflection vira fricção decorativa (ASS-04 da Parte 1) | JN-02, JN-06, JN-09 | A/B test no Piloto; ajustar N por estágio |
| Personas brasileiras dos agentes não ressoam com PX-03 (mais técnico) | JN-03 | Modos neutros + brasileiros configuráveis |
| Cobertura única de BR-012 em FA-11 (Parte 1 §6.3) | JN-09 | Ampliada para JN-02 e JN-06 nesta Parte 3 — risco mitigado |
| RN-008 (detecção de risco) sem thresholds calibrados | JN-05 | PA-08 antes do Piloto |
| Dashboard executivo (JN-08) sem formato decidido | JN-08 inteira | PA-05 antes do Piloto |

---

### JN-11 — Submissão para Aprovação Hierárquica (NOVA — pedido Guga + Bruno Prosperi)

**Personas envolvidas**: PX-02 Criativo Sênior / PX-03 Operador / PX-05 Junior (submetem) · **PX-06 Aprovador Sócio** (decide) · PX-01 Líder/Curador (mantém Brand Guidelines)

**Anel funcional**: Operação Recorrente & Governança

**Fluxo (8 passos)**:
1. Creator finaliza asset/sessão na tela de Skill ou Chat (T-04 ou T-05)
2. Clica "Submeter para aprovação" (FA-13-01) — UI captura cliente, contexto, hierarquia configurada
3. **Pipeline de validators paralelos** dispara (FA-13-02) — BrandValidator + PortuguêsValidator + outros configurados
4. Validators consultam Brand Guidelines da Biblioteca (FA-01) e produzem **Validation Report estruturado** (FA-13-03)
5. Aprovador (PX-06) recebe notificação in-app + email/Slack (FA-13-08)
6. Aprovador abre **Approval Inbox** (T-29) → escolhe submissão → **Approval Detail** (T-30) com Validation Report expandido
7. Aprovador decide: **Aprovar** (asset vira Validado, AIBadge "validado") · **Rejeitar** (volta ao creator com feedback estruturado, round +1) · **Solicitar ajustes** (mesmo fluxo, sem rejeição formal)
8. Decisão auditada (FA-13-09) — quem aprovou (humano), quando, baseado em qual Report

**Telas tocadas**: T-04/T-05 (origem) → T-33 Submit modal → (validators backend) → T-29 Inbox → T-30 Detail → notificação ao creator

**Momento crítico**: Decisão do aprovador. RN-024 garante humano sempre decide; UI separa "Validado por agentes X,Y,Z" de "Aprovado por {humano}". RN-025 limita a 3 rounds antes de escalar conversa humano-humano.

**Dores endereçadas**:
- Revisões repetidas por português ou brand básico (validators pegam antes)
- Falta de visibilidade central (Approval Inbox unifica)
- Decisões dispersas em e-mail/WhatsApp (auditoria automática)
- Risco de rubber-stamping (RN-024 + UX explícita)

**Oportunidades de IA**:
- Validators paralelos especializados (BrandValidator, PortuguêsValidator, futuros: LegalValidator, AccessibilityValidator)
- Sumarização do Validation Report ao aprovador (foco no que importa)
- Correlação histórica: "este aprovador rejeita 3x mais provocações Radicais" → calibração

**Features envolvidas**: FA-13 (primário) · FA-01 (Brand Guidelines) · FA-09 (RBAC + auth do aprovador) · FA-07 (HITL — feedback do aprovador alimenta eval)

**BRs**: BR-017 (primário), BR-004, BR-007, BR-009, BR-010, BR-013

**RNs**: RN-023 (validators paralelos), RN-024 (aprovador humano), RN-025 (anti-loop), RN-026 (hierarquia configurável), RN-014 (marcação visual)

**JTBDs**: JTBD-30 a JTBD-34 (PX-06)

**Critério de sucesso**:
- ≥80% das submissões aprovadas em ≤24h em horário comercial
- ≥80% das revisões evitáveis (português, brand) endereçadas pelos validators antes do aprovador
- Zero aprovações emitidas pelo sistema (auditável)
- ≥80% dos aprovadores reportam sentir-se decisores reais (anti-rubber-stamping)
- < 5% das submissões escalam para 3+ rounds

---

### JN-12 — Curadoria do Drive Assistida por Agentes (NOVA — pedido Guga, versão ajustada)

**Personas envolvidas**: PX-01 Líder/Curador (primário — executa curadoria) · agentes (geram Drive Cleanup Report) · PX-03 Operador (beneficiário indireto via Skills com contexto vindo do Drive)

**Anel funcional**: Curadoria

**Fluxo (8 passos)**:
1. Líder conecta uma pasta autorizada do Drive ao sunOS via OAuth Google (FA-14-01) — escopo `drive.readonly`
2. Sync Drive → sunOS dispara (FA-14-02) — incremental via `changes.list`
3. Intersecção ACL Drive × RBAC sunOS aplicada (FA-14-03) — usuário só vê o que pode em ambos
4. Agentes analisam estrutura semanalmente e geram **Drive Cleanup Report** (FA-14-04): duplicatas, órfãos (sem acesso 180+ dias), candidatos à curadoria, nomenclatura inconsistente
5. Líder abre **Drive Sync Dashboard** (T-31) → vê Report → revisa cada sugestão
6. Líder decide para cada item: **Aceitar e ingerir na Biblioteca** (FA-14-05/06) · **Aceitar e executar reorganização no Drive manualmente** · **Rejeitar** (mantém Report no próximo ciclo) · **Excluir cliente da integração** se houver requisito contratual (FA-14-07)
7. Conteúdo aprovado entra na Biblioteca via FR-001 (metadados obrigatórios — RN-006)
8. Audit log registra todas as operações (FA-14-08); zero operação de write executada pelo sunOS no Drive

**Telas tocadas**: T-31 Drive Sync Dashboard, T-32 Drive Cleanup Suggestions, T-13 Biblioteca Admin (após ingestão)

**Momento crítico**: Decisão de aceitar/rejeitar sugestão. Agente nunca executa (RN-029); humano permanece dono da estrutura do Drive. Default deny na intersecção ACL × RBAC (RN-028) garante isolamento.

**Dores endereçadas**:
- Drive da Suno bagunçado, sem curadoria sistemática
- Conhecimento crítico em arquivos órfãos
- Líder sem tempo de organizar manualmente
- Risco LGPD se sync fosse cego — opt-in por cliente é padrão

**Oportunidades de IA**:
- Detecção automática de duplicatas (embeddings)
- Identificação de candidatos à Biblioteca (taxonomia)
- Sugestão de tags e categorização (alinhada com RN-006)
- Análise crítica de qualidade dos conteúdos antes de propor ingestão

**Features envolvidas**: FA-14 (primário) · FA-01 (Biblioteca como destino) · FA-09 (RBAC) · FA-12 (Admin para configuração)

**BRs**: BR-018 (primário), BR-004, BR-007, BR-008, BR-010

**RNs**: RN-027 (read-only), RN-028 (ACL∩RBAC), RN-029 (curadoria sugestiva), RN-030 (sync periódico+webhook), RN-006 (metadados obrigatórios na ingestão)

**JTBDs**: JTBD-01 a JTBD-04 (PX-01) ampliados; novo: "When tenho Drive bagunçado, **I want to** receber sugestões críticas de organização do agente, **so that** eu execute a curadoria com discernimento humano e velocidade de máquina"

**Critério de sucesso**:
- Zero violações ACL durante o Piloto (auditável)
- Taxa de adoção de sugestões ≥ 50% (sinal de qualidade)
- Líder reduz tempo de curadoria manual em ≥ 30%
- Lag médio de sync ≤ 24h (≤ 5min para conteúdo crítico)
- Zero operação de write registrada no Drive pelo sunOS

---

## Histórico de Versões

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | 2026-04-28 | Heitor Miranda + Claude (assistido) | Versão inicial. **10 Jornadas (JN-01 a JN-10)** cruzando 5 Personas (PX-01 a PX-05) × 29 JTBDs × 12 Features (FA-01 a FA-12) × 16 BRs × 22 RNs. Estrutura em 3 anéis funcionais (Curadoria, Uso, Operação Recorrente & Governança). Cobertura completa: cada um dos 16 BRs tem ≥1 jornada. JN-02 detalhada referencia FRD Moon Shot. Vocabulário Suno aplicado (Devorar, Provocar, Faísca, Brasa, Caixa-preta, Bioma); anti-patterns evitados. Cada jornada com fluxo, telas tocadas, momento crítico, dores, oportunidades de IA, features, BRs/RNs, JTBDs e critério de sucesso. **Koro sempre com K** |
| 1.1 | 2026-04-28 | Heitor Miranda + Claude (assistido) | **+2 Jornadas**: JN-11 Submissão para Aprovação Hierárquica (atende PX-06 + PX-02/03/05) e JN-12 Curadoria do Drive Assistida (atende PX-01). Pedido Guga + Bruno Prosperi. Total agora: **12 Jornadas / 6 Personas / 14 Features / 18 BRs / 30 RNs** |
