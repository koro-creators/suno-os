---
documento: UX Parte 1 — Inventário de Telas
projeto: sunOS
cliente: Suno United Creators (uso 100% interno)
bu: Tecnologia e Dados para Marketing
versao: 1.0
data_criacao: 2026-04-28
ultima_atualizacao: 2026-04-28
autor: Heitor Miranda + Claude (assistido)
status: Rascunho
fonte_prd:
  - docs/prd/parte1-feature-map.md (FA-01 a FA-12)
  - docs/prd/parte2-personas-jtbd.md (PX-01 a PX-05)
fonte_brd:
  - docs/brd/parte2-glossario.md (vocabulário Sistema Solar, Sun, Planeta, Órbita, Moon, Skill, Biblioteca, Workflow, Caixa-preta)
  - docs/brd/parte4-regras.md (RN-009 RBAC, RN-011 Caixa-preta operacional, RN-014 marcação Faísca, RN-016 vocabulário, RN-017 track por carreira)
fonte_ux:
  - docs/ux/parte4-design-system.md (componentes, tokens, AppShell, OrbitalSystem)
fonte_codigo:
  - app/ (rotas Next.js 14 implementadas)
  - components/ (componentes existentes)
total_telas: 33 (T-01 a T-33); 18 existentes / 15 a construir
aprovacoes:
  - area: Tecnologia e Dados para Marketing
    aprovador: Heitor Miranda
    data: 2026-04-28
    status: Pendente
  - area: Patrocinador Sócio Criação
    aprovador: Bruno Prosperi
    data:
    status: Pendente
---

# UX Parte 1 — Inventário de Telas sunOS v1.0

**Data:** Abril 2026
**Autor:** Heitor Miranda + Claude (assistido)
**Versão:** 1.0
**Status:** Especificação (mistura de telas existentes + a construir + em refactor)
**Objetivo:** Catalogar todas as telas do sunOS (T-XX), mapeando para Features (FA-XX), Personas (PX-XX) e Jornadas (JN-XX); descrever propósito, estado e identificar lacunas.
**Filosofia:** *"Sistema Solar como navegação; Caixa-preta como princípio; Faísca como vocabulário visual."*

---

## Sumário

1. [Visão Geral e Mapeamento](#1-visão-geral-e-mapeamento)
2. [FA-06 Sistema Solar (Navegação)](#2-fa-06--sistema-solar-navegação)
3. [FA-04 Chat com Agentes ReAct](#3-fa-04--chat-com-agentes-react)
4. [FA-02 Moon Shot (Provocação Criativa)](#4-fa-02--moon-shot)
5. [FA-12 Admin Areas (CRUD configurável)](#5-fa-12--admin-areas-crud-configurável)
6. [FA-01 Biblioteca (Inteligência Coletiva)](#6-fa-01--biblioteca-inteligência-coletiva)
7. [FA-05 Workflows Automatizados](#7-fa-05--workflows-automatizados)
8. [FA-10 Mensuração e Custo Evitado](#8-fa-10--mensuração-e-custo-evitado)
9. [FA-11 Safety Cultural & Ownership](#9-fa-11--safety-cultural--ownership)
10. [FA-09 Governança, RBAC e Caixa-preta](#10-fa-09--governança-rbac-e-caixa-preta)
11. [Cross-Feature](#11-cross-feature)
12. [Fluxos por Jornada](#12-fluxos-por-jornada)
13. [Progressive Disclosure por Persona](#13-progressive-disclosure-por-persona)
14. [Estados Globais e Edge Cases](#14-estados-globais-e-edge-cases)

---

## 1. Visão Geral e Mapeamento

### 1.1 Escopo

Este documento especifica o **inventário completo de telas (T-XX)** do sunOS — sistema operacional de IA da Suno United Creators — cobrindo:

- **Telas existentes** (estado: `existe`) — já implementadas em `app/` e em produção/staging
- **Telas a construir** (estado: `a construir`) — necessárias para features ainda não implementadas (FA-02 Moon Shot, FA-08 Phase 16 multimodal, FA-10 Mensuração, FA-11 Safety, FA-09 RBAC operacional, FA-01 captura proativa)
- **Telas em refactor** (estado: `em refactor`) — existem mas precisam evoluir (ex: ChatSession persistência, Sistema Solar com sincronização de Admin)

Toda T-XX é rastreável a ≥1 FA-XX (do PRD Parte 1) e ≥1 PX-XX (do PRD Parte 2). Jornadas JN-XX são inferidas de personas + JTBDs (Parte 3 do PRD ainda não escrita formalmente; mapeamento provisório no §12).

### 1.2 Mapeamento T-XX ↔ FA-XX ↔ PX-XX ↔ JN-XX

| Tela | Nome | FA principal | PX principal | JN | Estado | Prioridade |
|------|------|-------------:|:------------:|:--:|:------:|:----------:|
| T-01 | Login | FA-09 | Todas | JN-00 | existe | P0 |
| T-02 | Sistema Solar L0 (Sun/Home) | FA-06 | Todas | JN-00 | existe | P0 |
| T-03 | Sistema Solar L1 (Planeta/Cliente) | FA-06 | Todas | JN-00 | existe | P0 |
| T-04 | Sistema Solar L2 (Órbita/Skill) | FA-06 | Todas | JN-00 | existe | P0 |
| T-05 | Chat (Skill + Moon ativos) | FA-04 | PX-02, PX-03, PX-04, PX-05 | JN-02, JN-03, JN-04 | existe (em refactor para persistência P1) | P0 |
| T-06 | Moon Shot — Acionamento Modal | FA-02 | PX-02, PX-04, PX-05 | JN-02, JN-04, JN-06 | a construir | P0 (POC) |
| T-07 | Moon Shot — Painel de Faíscas | FA-02 | PX-02, PX-04, PX-05 | JN-02, JN-04, JN-06 | a construir | P0 (POC) |
| T-08 | Moon Shot — Modo Dupla (time-boxing) | FA-02 | PX-02 | JN-02, JN-06 | a construir | P1 (Piloto) |
| T-09 | Forced Reflection Interstitial | FA-11, FA-07 | PX-02, PX-05 | Transversal | a construir | P1 (Piloto) |
| T-10 | Skills Admin — Catálogo | FA-12, FA-03 | PX-01 | JN-01 | existe | P0 |
| T-11 | Skills Admin — Editor (4 tabs) | FA-12, FA-03 | PX-01 | JN-01 | existe | P0 |
| T-12 | Skills Admin — Nova Skill | FA-12, FA-03 | PX-01 | JN-01 | existe | P0 |
| T-13 | Biblioteca Admin — Catálogo | FA-12, FA-01 | PX-01 | JN-01, JN-05 | existe | P0 |
| T-14 | Biblioteca Admin — Modal de Upload/Edit | FA-12, FA-01 | PX-01 | JN-01, JN-05 | existe | P0 |
| T-15 | Biblioteca Admin — Drawer de Detalhes | FA-12, FA-01 | PX-01 | JN-01 | existe | P0 |
| T-16 | Biblioteca Admin — Alerta Conhecimento em Risco | FA-01, FA-09 | PX-01 | JN-05 | a construir | P1 (Piloto) |
| T-17 | Clientes Admin — Catálogo | FA-12 | PX-01 | JN-01 | existe | P0 |
| T-18 | Clientes Admin — Editor (4 tabs) | FA-12 | PX-01 | JN-01 | existe | P0 |
| T-19 | Clientes Admin — Novo Cliente | FA-12 | PX-01 | JN-01 | existe | P0 |
| T-20 | Workflows Admin — Catálogo | FA-12, FA-05 | PX-01, PX-03 | JN-07 | existe | P0 |
| T-21 | Workflows Admin — Builder | FA-12, FA-05 | PX-01, PX-03 | JN-07 | existe | P0 |
| T-22 | Workflows Admin — Novo Workflow | FA-12, FA-05 | PX-01, PX-03 | JN-07 | existe | P0 |
| T-23 | Workflows Admin — Histórico de Execuções | FA-05, FA-10 | PX-01, PX-03 | JN-07 | existe | P0 |
| T-24 | Mensuração — Dashboard Executivo | FA-10 | PX-01 | JN-08 | a construir | P1 (Piloto) |
| T-25 | Mensuração — Skill Health Detail | FA-10, FA-03 | PX-01 | JN-08 | a construir | P1 (Piloto) |
| T-26 | Mensuração — Homogeneização Coletiva | FA-10, FA-11 | PX-01 | JN-08 | a construir | P2 (MVP) |
| T-27 | Onboarding — Track por Carreira | FA-11 | PX-02, PX-05 | JN-09 | a construir | P1 (Piloto) |
| T-28 | Design System (referência interna) | FA-12 | Devs/Designers | — | existe | P0 |
| T-29 | Aprovação — Inbox do Aprovador | FA-13 | PX-06 (Aprovador), PX-01 | JN-11 | a construir | P1 (Piloto) |
| T-30 | Aprovação — Detalhe da Submissão | FA-13 | PX-06, PX-01, PX-02, PX-03 | JN-11 | a construir | P1 (Piloto) |
| T-31 | Aprovação — Submeter para Aprovação (modal) | FA-13 | PX-02, PX-03, PX-04 | JN-11 | a construir | P1 (Piloto) |
| T-32 | Drive — Sync Dashboard (estado + cleanup reports) | FA-14 | PX-01 | JN-12 | a construir | P1 (Piloto) |
| T-33 | Drive — Inbox de Sugestões de Curadoria | FA-14 | PX-01 | JN-12 | a construir | P1 (Piloto) |

> **Convenções:** P0 = essencial Protótipo/Piloto; P1 = Piloto; P2 = MVP. Todas as telas obedecem RN-009 (RBAC) e RN-011 (Caixa-preta para Operacional).

### 1.3 Estado de Implementação (Resumo)

| Estado | Total | T-XX |
|--------|:-----:|------|
| **Existe** | 18 | T-01, T-02, T-03, T-04, T-05, T-10, T-11, T-12, T-13, T-14, T-15, T-17, T-18, T-19, T-20, T-21, T-22, T-23, T-28 |
| **A construir** | 15 | T-06, T-07, T-08, T-09, T-16, T-24, T-25, T-26, T-27, T-29, T-30, T-31, T-32, T-33 |
| **Em refactor** | 1 | T-05 (persistência de conversas — débito P1 do handoff) |

> Nota: T-05 aparece em "existe" e "em refactor" (existe na sua função básica; precisa evoluir para persistência cross-session).

### 1.4 Objetos de Domínio Envolvidos (referência)

| ID | Objeto | Feature primária | Telas onde aparece |
|----|--------|-----------------|--------------------|
| DO-01 | Sun (Sistema Solar) | FA-06 | T-02 |
| DO-02 | Planet (Cliente) | FA-06, FA-12 | T-03, T-17, T-18, T-19 |
| DO-03 | Orbit (Skill no SS) | FA-06 | T-03, T-04 |
| DO-04 | Skill | FA-03, FA-12 | T-04, T-05, T-10, T-11, T-12, T-25 |
| DO-05 | Moon (sub-área) | FA-03, FA-06 | T-04, T-05, T-11 |
| DO-06 | KnowledgeItem (Biblioteca) | FA-01 | T-13, T-14, T-15, T-16 |
| DO-07 | Workflow | FA-05 | T-20, T-21, T-22, T-23 |
| DO-08 | ChatSession / Message | FA-04 | T-05, T-09 |
| DO-09 | Provocation / Faísca | FA-02 | T-06, T-07, T-08 |
| DO-10 | Feedback (HITL) | FA-07 | T-05, T-09, T-25 |
| DO-11 | ExecutionMetric / DiversityMetric | FA-10 | T-24, T-25, T-26 |
| DO-12 | OnboardingTrack | FA-11 | T-27 |
| DO-13 | User / Role | FA-09 | T-01 (transversal) |
| DO-43 | ApprovalRequest | FA-13 | T-29, T-30, T-31 |
| DO-46 | ValidationReport | FA-13 | T-30 |
| DO-44 | ApprovalChain | FA-13 | T-30 (config — Admin) |
| DO-50 | DriveSync | FA-14 | T-32 |
| DO-51 | DriveDocument | FA-14 | T-32, T-33 |
| DO-53 | CurationSuggestion | FA-14 | T-33 |
| DO-54 | DriveCleanupReport | FA-14 | T-32 |

### 1.5 Cobertura por Persona

| Persona | Telas Primárias | Telas Secundárias |
|---------|-----------------|-------------------|
| **PX-01** Líder/Curador | T-10, T-11, T-13, T-14, T-15, T-16, T-17, T-18, T-20, T-21, T-23, T-24, T-25, T-26 | T-02, T-03, T-04, T-05 |
| **PX-02** Criativo Sênior | T-05, T-06, T-07, T-08 | T-02, T-03, T-04, T-09, T-27 |
| **PX-03** Operador Processual | T-02, T-03, T-04, T-05 | T-20, T-21, T-23 |
| **PX-04** Planejamento Estratégico | T-05, T-06, T-07, T-20, T-21 | T-02, T-03, T-04 |
| **PX-05** Creator Junior | T-05, T-06, T-07, T-09, T-27 | T-02, T-03, T-04 |
| **PX-06** Aprovador (Sócio) | T-29, T-30 | T-02 (read-only ao Sistema Solar para contexto) |
| **PX-01** Líder/Curador (extensão FA-14) | + T-32, T-33 | — |

> **RN-011 (Caixa-preta):** T-13 a T-16 (Biblioteca Admin) **NUNCA** aparecem para perfil Operacional — nem como menu, link, breadcrumb, ou destino de URL direta. Operacional acessando `/biblioteca` é redirecionado para `/` com mensagem genérica (sem revelar a existência do recurso).

### 1.6 Rotas Base (Convenção sunOS)

> sunOS é multi-tenant **conceitualmente** (companies = grupo United Creators no Sun; clientes = Planetas) mas **rotas atuais não usam companySlug** — sunOS é uso 100% interno e a Suno United Creators é a única "company" implícita. Rotas seguem padrão `/{clientSlug}/{skillSlug}/{moonSlug}` para o Sistema Solar e `/{módulo}` para Admin areas.

**Rotas implementadas (estado: existe):**

- `/login` — Autenticação Google + RBAC
- `/` — Sistema Solar L0 (Sun/Home)
- `/[clientSlug]` — Sistema Solar L1 (Planeta)
- `/[clientSlug]/[skillSlug]` — Sistema Solar L2 (Órbita/Skill) + Chat (acoplado)
- `/[clientSlug]/[skillSlug]/[moonSlug]` — Redirect para `/[clientSlug]/[skillSlug]?moon=[moonSlug]` (Moons como query string, SPEC-007)
- `/skills` — Skills Admin Catálogo
- `/skills/new` — Skills Admin Nova
- `/skills/[skillId]` — Skills Admin Editor
- `/biblioteca` — Biblioteca Admin (Caixa-preta para Operacional)
- `/clientes` — Clientes Admin Catálogo
- `/clientes/new` — Clientes Admin Novo
- `/clientes/[clientId]` — Clientes Admin Editor
- `/workflows` — Workflows Admin Catálogo
- `/workflows/new` — Workflows Admin Novo
- `/workflows/[workflowId]` — Workflows Admin Builder
- `/workflows/[workflowId]/runs` — Workflows Admin Histórico
- `/design-system` — Component library viva (não-usuário)

**Rotas backlog (estado: a construir):**

- `/[clientSlug]/[skillSlug]/moon-shot` — Painel de Faíscas (T-07) [Inferido]
- `/biblioteca/risco` ou seção dedicada em `/biblioteca` — Alerta Conhecimento em Risco (T-16)
- `/mensuracao` — Dashboard Executivo (T-24)
- `/mensuracao/skills/[skillId]` — Skill Health Detail (T-25)
- `/mensuracao/homogeneizacao` — Diversidade Coletiva (T-26)
- `/onboarding` — Track por Carreira (T-27)
- `/aprovacoes` — Inbox do Aprovador (T-29)
- `/aprovacoes/[requestId]` — Detalhe da Submissão (T-30)
- `/aprovacoes/configuracao/[clientSlug]` — Config de ApprovalChain (T-30 sub-rota — Admin)
- `/drive/[clientSlug]` — Sync Dashboard (T-32)
- `/drive/[clientSlug]/sugestoes` — Inbox de Curadoria (T-33)
- T-31 é **modal sobreposto** ao Chat (T-05) ou ao Painel de Faíscas (T-07) — não rota dedicada (preserva contexto do output sendo submetido)

> Decisão pendente: Moon Shot vive como **modal sobreposto ao Chat** (T-06 → T-07 in-context) ou como **rota dedicada**? Recomendação UX: modal/painel sobreposto preserva contexto da Skill ativa e atende RN-003 (≤3 cliques). Validar com Bruno Prosperi.

---

## 2. FA-06 — Sistema Solar (Navegação)

### T-02: Sistema Solar L0 — Sun/Home

#### 2.1.1 Propósito

Ponto de entrada do sunOS. Apresenta o Sol no centro (Suno United Creators) cercado pelos Planetas (clientes). É a **assinatura visual** do produto — toda jornada começa aqui. Persona **todas**; primeiro toque cultural e demonstração viva da metáfora "alinhamento como Sistema Solar".

#### 2.1.2 Rota

`/` *(estado: existe — `app/page.tsx`)*

#### 2.1.3 Jornada

JN-00 (Entrada/Wayfinding) — qualquer jornada começa aqui.

#### 2.1.4 Objetos de Domínio

`Sun` (DO-01), `Planet` (DO-02), `QuickStat` (FA-06-05).

#### 2.1.5 Elementos da Tela

**Header da Página:**

1. **AppHeader** (componente `layout/AppHeader.tsx`)
   - Logo Sun + wordmark "sunOS"
   - Sem breadcrumb (estamos no nível raiz)
   - Theme toggle (Dark/Light)
   - User Menu (avatar + Logout)

**Área Principal — OrbitalSystem:**

1. **CenterNode (Sun)** (`solar/CenterNode.tsx`)
   - Posição: centro da viewport
   - Cor: `--sun` (#FFC801)
   - Tamanho: ~120px diâmetro
   - Glow sutil + animação de respiração (pulse 1.5s)
   - Comportamento: hover revela tooltip "Suno United Creators"

2. **PlanetNodes (Clientes)** (`solar/PlanetNode.tsx`)
   - Distribuídos em órbitas concêntricas ao redor do Sun
   - Cor por cliente (Vivo roxo, Americanas laranja, Sicredi verde, etc.)
   - Tamanho proporcional ao volume de Skills do cliente
   - Comportamento: hover mostra QuickStats (n skills, n moons, status); click navega para `/[clientSlug]`

3. **Filter Pills** (`solar/FilterPills.tsx`)
   - Filtros opcionais por tipo de Skill (Criação / Mídia / Planejamento)
   - Posição: topo ou rodapé da viewport
   - Comportamento: filtra Planetas para destacar quais oferecem aquele tipo

**Footer/Actions:**

- Nenhuma ação primária no Sun — a navegação é a ação. (Princípio: ≤3 cliques até o valor.)

#### 2.1.6 Estados da Tela

- **Loading:** Skeleton do orbital system (Sun + N planetas como bolhas neutras)
- **Empty:** Não aplicável (sempre há ao menos o Sun + Suno como Planeta de si)
- **Error:** Banner topo "Não foi possível carregar Planetas — tentar novamente"

#### 2.1.7 Interações

- Click no Planeta → navega para T-03 (`/[clientSlug]`)
- Hover no Planeta → QuickStats aparecem como popover
- Click em FilterPill → re-renderiza com Planetas filtrados (sem navegação)

---

### T-03: Sistema Solar L1 — Planeta (Cliente)

#### 2.2.1 Propósito

Tela do cliente. O Planeta torna-se centro local; ao redor dele orbitam as **Skills disponíveis** (Órbitas). Persona todas; objetivo é escolher uma Skill em ≤2 cliques após entrar. Aqui aparece também o atalho **Moon Shot** (FA-02-03 — acionamento contextual).

#### 2.2.2 Rota

`/[clientSlug]` *(estado: existe — `app/[clientSlug]/page.tsx`)*

#### 2.2.3 Jornada

JN-00 (Wayfinding); entrada para JN-02 (ideação), JN-03 (execução), JN-04 (análise estratégica), JN-06 (devil's advocate).

#### 2.2.4 Objetos de Domínio

`Planet` (DO-02), `Orbit` (DO-03), `Skill` (DO-04).

#### 2.2.5 Elementos da Tela

**Header da Página:**

1. **Breadcrumb**: `Home > [NomeCliente]`
2. **AppHeader** com `rightSection` exibindo cor do Planeta como badge
3. **Theme toggle**, **User Menu**

**Área Principal:**

1. **PlanetNode central** (re-uso de `solar/PlanetNode.tsx` em escala maior)
   - Cor e tamanho do cliente
   - Label com nome do cliente

2. **OrbitRings + Skills** (`solar/OrbitRing.tsx` + `solar/PlanetNode.tsx` posicionado na órbita)
   - Cada Skill é renderizada como nó posicionado em um anel orbital
   - Cor da Skill por tipo (`--criacao`, `--midia`, `--planejamento`)
   - Tamanho proporcional ao número de Moons
   - Comportamento: click → navega para T-04 (`/[clientSlug]/[skillSlug]`)

3. **FilterPills** (filtra Skills por tipo)

4. **CTA Moon Shot** (FA-02-03 — RN-003)
   - Botão flutuante ou na barra superior
   - Variante primary (Sun gradient)
   - Texto: "Devorar este briefing" *(vocabulário Suno; nunca "Gerar ideias")*
   - Comportamento: abre T-06 (modal de acionamento) preservando contexto do cliente
   - **Estado: a construir como ativo** (botão pode estar oculto até FA-02 estar implementado)

**Footer/Actions:**

- QuickStats bar opcional: "X Skills · Y Moons · Z execuções no mês"

#### 2.2.6 Estados da Tela

- **Loading:** Skeleton do planeta + N órbitas vazias
- **Empty:** Cliente sem Skills associadas → ilustração + "Nenhuma Skill configurada para [Cliente]" + CTA secundária para PX-01 ir a `/skills`
- **Error:** Cliente inexistente → redirect para `/`
- **Status inativo (RN-007):** Para cliente status = "inativo", esta tela não aparece no Sistema Solar (oculto). Acesso direto via URL leva a tela de status com aviso.

#### 2.2.7 Interações

- Click em Skill → T-04
- Click em CTA Moon Shot → T-06 (modal sobreposto)
- Hover em Skill → tooltip com descrição curta + score HITL (FA-03-06)

---

### T-04: Sistema Solar L2 — Órbita/Skill (com Chat acoplado)

#### 2.3.1 Propósito

Tela onde Creator escolhe a Moon (sub-área) da Skill ativa e abre Chat. Após SPEC-007, a Moon não é mais tela separada — vive como **chip dentro do PromptTemplateBar do Chat**. Esta tela é portanto **acoplada com T-05** (Chat); a transição é fluida, mas conceitualmente são níveis distintos da arquitetura (L2 e L3+chat).

#### 2.3.2 Rota

`/[clientSlug]/[skillSlug]` *(estado: existe — `app/[clientSlug]/[skillSlug]/page.tsx`; `[moonSlug]` redireciona para `?moon=[moonSlug]` — SPEC-007)*

#### 2.3.3 Jornada

JN-02 (ideação contextualizada), JN-03 (execução de tarefa), JN-04 (análise estratégica).

#### 2.3.4 Objetos de Domínio

`Skill` (DO-04), `Moon` (DO-05), `ChatSession` (DO-08).

#### 2.3.5 Elementos da Tela

Esta tela é uma **tela combinada**: header do Sistema Solar + área de Chat (T-05). Ver §3 (T-05) para detalhamento da área de Chat.

**Header específico de L2:**

1. **Breadcrumb**: `Home > [Cliente] > [Skill]` (último item com dot Sun glowing)
2. **PromptTemplateBar com Moon chips** (componente do Chat)
   - Pills selecionáveis representando Moons da Skill
   - Estado ativo: Moon escolhida marcada via `?moon=[moonSlug]`
   - Cor: `--sun` na ativa, `--text-muted` nas inativas
3. **CTA Moon Shot** persistente no header (atalho contextual — RN-003)

#### 2.3.6 Estados da Tela

Mesmos de T-05.

#### 2.3.7 Interações

- Click em Moon chip → atualiza query string e re-injeta contexto de Moon
- Click em CTA Moon Shot → T-06

---

## 3. FA-04 — Chat com Agentes ReAct

### T-05: Chat (Skill + Moon ativos)

#### 3.1.1 Propósito

Interface conversacional principal — onde **Creator e IA conversam**. Toda Skill processual e o Moon Shot chegam ao usuário através desta tela. É o ponto de **maior densidade funcional** do sunOS.

#### 3.1.2 Rota

`/[clientSlug]/[skillSlug]?moon=[moonSlug]` *(estado: existe — em refactor para persistência P1 de conversas, débito do PRODUCT_HANDOFF)*

#### 3.1.3 Jornada

JN-02, JN-03, JN-04, JN-06 — todas as jornadas de uso ativo do Chat.

#### 3.1.4 Objetos de Domínio

`ChatSession` (DO-08), `Message`, `Skill` (DO-04), `Moon` (DO-05), `Feedback` (DO-10), `Variation`, `Attachment` [SPEC-006 — backlog].

#### 3.1.5 Elementos da Tela

**Layout:** 3 colunas (desktop) — Sidebar (40px), Área principal (flex-1), ChatPanel/Context Sidebar (~320px colapsável).

**Header da Página:**

1. **Breadcrumb**: `Home > [Cliente] > [Skill]`
2. **PromptTemplateBar** com Moon chips
3. **ModelSelector** (FA-04-02): dropdown para trocar Gemini Flash, Pro, GPT-4o, Claude
4. **CTA Moon Shot** (atalho)

**Área Principal — Conversa:**

1. **MessageList** (scroll vertical reverso)
   - **MessageBubble user**: bg `--nebula`, color `--text-primary`, alinhamento direita
   - **MessageBubble assistant**: bg `--deep`, color `--text-primary`, alinhamento esquerda; **badge "Faísca" / "estímulo"** no canto (RN-014) quando output gerado por IA
   - **StreamingIndicator**: aparece durante SSE com nome do modelo ativo
   - Syntax highlighting para code blocks
   - Embedded **ResultActions** por mensagem assistant: copiar, variar, salvar, thumbs up/down

2. **FeedbackInline** (FA-07-01)
   - Thumbs up/down + textarea opcional para comentário
   - Após N stars consecutivas (RN-015): trigger T-09 (Forced Reflection Interstitial)

3. **VariationsCarousel** (FA-04-06): 3 opções comparativas quando aplicável

4. **Social Preview** (FA-04-05): para Skill Copy Social, renderização Instagram (carousel/stories/feed) inline

**Área Principal — Input:**

1. **ChatInput**
   - Textarea com auto-resize (max 6 linhas)
   - Shift+Enter quebra linha; Enter envia
   - Placeholder: *"Devorar este briefing..."* (vocabulário Suno; RN-016)
   - Botão Send (variante primary, Sun) à direita
   - **Botão paperclip** (Attachments) — SPEC-006, **estado: a construir** (P1)

**Context Sidebar (direita, colapsável):**

1. **Seção Biblioteca** (FA-04-07)
   - **VISÍVEL para Admin/Líder; OCULTA para Operacional (RN-011)**
   - Lista de KnowledgeItems injetados na sessão (via auto-seleção por scope/tags)
   - Chip por item com nome + escopo
   - Para Operacional: a seção é substituída por linguagem neutra "Contexto do cliente" sem expor que é a Biblioteca

2. **Seção Agentes**
   - Indicador do agente ReAct ativo (ContentCreator/VisualCreator/Conversational)
   - Visible reasoning HIDDEN by default (RN-017 para junior; toggle disponível para sênior)

3. **Seção Validação HITL**
   - Progress bar de feedbacks da sessão
   - Counter de thumbs up/down
   - Status da sessão (Em andamento / Avaliada)
   - Rating 1-5 estrelas (FA-07-02) quando sessão é finalizada

#### 3.1.6 Estados da Tela

- **Loading inicial:** Skeleton da MessageList vazia + ChatInput desabilitado
- **Empty (sessão nova):** Welcome message do agente com sugestões contextuais (3 prompts pré-configurados via Moon)
- **Streaming:** StreamingIndicator visível; ChatInput desabilitado para envio
- **Error:** Banner topo "Erro ao chamar [modelo] — tentar novamente" + opção de fallback de modelo
- **Persistência (refactor P1):** Sessões anteriores recuperáveis via histórico no Sidebar (futuro, débito)

#### 3.1.7 Interações

- Send → SSE stream começa, MessageBubble assistant cresce em tempo real
- Thumbs → animação curta + commit ao backend; após N=5 (sênior) ou N=3 (junior) → trigger T-09
- Click em "Variar" → gera 3 alternativas (FA-04-06)
- Click em "Salvar" [Inferido — pendente] → adiciona a algum repositório do Creator
- Drag-and-drop em paperclip → upload de arquivo (SPEC-006)
- Click em CTA Moon Shot → abre T-06 sobre Chat preservando histórico

#### 3.1.8 Marcação Faísca (RN-014)

Toda MessageBubble assistant exibe badge com texto "Faísca" / "Estímulo" enquanto não há confirmação humana de uso final. Padrão visual: badge `--planejamento` (verde) ou `--sun` com ícone `Sparkle`. Integração com FA-08 (multimodal): imagens e vídeos gerados também recebem watermark/overlay textual.

---

## 4. FA-02 — Moon Shot

### T-06: Moon Shot — Acionamento Modal

#### 4.1.1 Propósito

Modal sobreposto ao Chat (ou ao Sistema Solar L1) que **dispara o pipeline de Provocação criativa**. Preserva contexto do cliente e Skill ativa; pede tema/briefing se necessário; oferece escolha de modo (zona de bisociação) e track por carreira.

#### 4.1.2 Rota

Sobreposto a `/[clientSlug]` (T-03) ou `/[clientSlug]/[skillSlug]` (T-04/T-05). Sem rota própria. **Estado: a construir** (P0 — POC).

#### 4.1.3 Jornada

JN-02 (ideação contextualizada), JN-04 (análise estratégica → território criativo), JN-06 (devil's advocate).

#### 4.1.4 Objetos de Domínio

`Brief` (input), `BisociationZone`, `OnboardingTrack` (DO-12), `Provocation` (DO-09).

#### 4.1.5 Elementos da Tela

**Modal centralizado, max-width 600px, bg `--deep`, radius 12px:**

1. **Header do Modal**
   - Título: "Moon Shot" (com ícone planet)
   - Subtítulo: *"Devorar [Cliente] e Provocar Faíscas"* (vocabulário Suno)
   - Botão close (×)

2. **Campo Tema/Briefing** (textarea)
   - Pré-preenchido com briefing da sessão se disponível
   - Placeholder: *"Cole ou descreva o briefing que vamos Devorar..."*

3. **Modo de Entrada** (RN-017 — track por carreira)
   - 3 cards selecionáveis:
     - **"Estou começando uma ideia"** (junior-leaning, divergente, abundante)
     - **"Tenho uma ideia, me prova que tá errada"** (sênior-leaning, devil's advocate)
     - **"Modo dupla"** (time-boxing 90s/5min — abre T-08)
   - Sugestão pré-selecionada conforme estágio de carreira do user (RN-017)

4. **Zona de Bisociação** (avançado, collapsible — default Sweet Spot)
   - Radio buttons: Adjacente · **Sweet Spot (default)** · Equilibrado · Radical
   - Tooltip explicando cada zona

5. **CTA Primary**: "Provocar Faíscas" (Sun gradient, pill)

6. **CTA Secondary**: Cancelar (ghost)

#### 4.1.6 Estados

- **Default**: Modal aberto, campo de briefing preenchido com contexto da sessão
- **Validation error**: Briefing < N caracteres → mensagem inline
- **Loading**: Após click em Provocar, transition para T-07 com pipeline streaming

#### 4.1.7 Interações

- Click em Provocar Faíscas → fecha modal, abre T-07 com streaming
- Esc → fecha modal sem ação
- Cancel → fecha modal

---

### T-07: Moon Shot — Painel de Faíscas

#### 4.2.1 Propósito

Painel onde o pipeline Explorer↔Crítico (FA-02-01) **transmite Faíscas em streaming** ao Creator. Cada Faísca aprovada (RN-002, score médio ≥ 8) aparece como card com 3 dimensões avaliadas (Novidade, Coerência, Potencial Criativo). Creator pode dar star, refinar, integrar à conversa do Chat.

#### 4.2.2 Rota

Modal/painel sobreposto, ou rota dedicada `/[clientSlug]/[skillSlug]/moon-shot` *(estado: a construir; recomendação UX: painel sobreposto preserva contexto)*. **Estado: a construir** (P0 — POC).

#### 4.2.3 Jornada

JN-02, JN-04, JN-06.

#### 4.2.4 Objetos de Domínio

`Provocation` (DO-09), `Star` (RN-015), `BisociationZone`, `AgentPersona` (Antropófaga, Carnavalesco, Anciã — FA-02-04).

#### 4.2.5 Elementos da Tela

**Layout:** painel à direita do Chat (ou full-screen quando acionado fora de Chat).

**Header do Painel:**
1. Título: "Faíscas — [tema]"
2. Indicador de pipeline ativo (Explorer ⇄ Crítico) com persona brasileira do agente em destaque (icon + nome)
3. Botão fechar/voltar

**Área Principal — Cards de Faíscas:**
1. **FaíscaCard** (uma por provocation)
   - Texto da provocação
   - Tags com domínios distantes combinados (ex: "Antropofagia × Mídia OOH")
   - **3 scores** (radar mini ou bars): Novidade · Coerência · Potencial Criativo
   - Badge da zona (Sweet Spot / Adjacente / Radical)
   - Ações: star, refinar (continua iteração no Chat), descartar
   - Marcação visual (RN-014): pill "Faísca" sempre visível

2. **StreamingIndicator**: cards aparecem em streaming, com animação `orbit-appear` (cubic-bezier 0.34, 1.56, 0.64, 1)

3. **Counter** topo: "X Faíscas geradas · Y aprovadas pelo Crítico · Z descartadas"

**Footer/Actions:**
- **CTA "Levar Faíscas marcadas para o Chat"** (primary)
- **CTA "Mais Faíscas"** (ghost — força nova rodada)

#### 4.2.6 Estados

- **Streaming**: cards aparecem em ~5-15s (RN-003); StreamingIndicator com nome do agente
- **Done**: pipeline encerrado; CTAs habilitados
- **Empty (zero aprovadas)**: mensagem cultural "O briefing exige outra zona. Tente Radical?" + CTA volta a T-06
- **Timeout (>30s, RN-003)**: notificação "Demorando mais que o esperado" com botão Cancelar
- **Forced Reflection**: ao atingir N stars (5 sênior / 3 junior), bloquear input e abrir T-09

#### 4.2.7 Interações

- Star → +1 ao counter de stars da sessão; pode disparar T-09
- Click em "Levar para Chat" → adiciona Faíscas marcadas como contexto do Chat e fecha painel
- Click em descartar → remove card, log para evolução de Eval (FA-10-02)

---

### T-08: Moon Shot — Modo Dupla (Time-Boxing)

#### 4.3.1 Propósito

Variação de T-06/T-07 com **time-boxing alternado** entre IA (90s) e humano (5min) — preserva fluxo humano de criação em dupla (FA-02-05, FA-11-06). Útil principalmente para PX-02 (Criativo Sênior) trabalhando em dupla de criação.

#### 4.3.2 Rota

Variante de T-07. **Estado: a construir** (P1 — Piloto).

#### 4.3.3 Jornada

JN-02 (ideação), JN-06 (devil's advocate em dupla).

#### 4.3.4 Elementos da Tela

- **Timer prominente** no header do painel (alterna entre "IA gerando · 90s" e "Sua vez · 5min")
- Cards de Faíscas restritos por janela de 90s
- Bloqueio de input humano durante janela IA; bloqueio de geração IA durante janela humana
- Histórico de rodadas: Round 1 → Round 2 → ...
- Botão "Pausar Time-Boxing" (sai do modo dupla)

---

## 5. FA-12 — Admin Areas (CRUD configurável)

> **Pattern Model Repo** (SPEC-005): toda Admin area segue **table view default + filter sidebar + side drawer** para detalhes. Aplica RN-009 (RBAC, restrito a Admin/Líder) e RN-016 (validação de vocabulário).

### T-10: Skills Admin — Catálogo

#### 5.1.1 Propósito

Listar e filtrar todas as Skills configuradas. Persona PX-01 (Líder/Curador). É onde se faz curadoria do catálogo de capacidades de IA.

#### 5.1.2 Rota

`/skills` *(estado: existe — `app/skills/page.tsx`)*

#### 5.1.3 Jornada

JN-01 (curadoria de Skills).

#### 5.1.4 Elementos da Tela

- **AppHeader** com breadcrumb `Home > Skills`
- **FilterSidebar (esquerda)**: filtros por tipo (Criação/Mídia/Planejamento), status, cliente associado
- **Table view (centro)**: SkillCard (ou row) com nome, tipo (cor), modelo, score HITL, n moons, n clientes
- **Toolbar topo**: botão "Nova Skill" (primary), busca, ordenação
- **SkillDrawer** (direita, abre on click row): visão rápida com 4 tabs (Identidade, Configuração, Moons, Clientes); botão "Editar" → T-11

#### 5.1.5 Estados

- Loading, Empty (zero skills), Error padrão; filtros ativos com chips removíveis no topo

---

### T-11: Skills Admin — Editor (4 tabs)

#### 5.2.1 Propósito

Editar uma Skill em profundidade. **System prompt versionado** (FA-03-05) é Caixa-preta — só Admin/Líder vê.

#### 5.2.2 Rota

`/skills/[skillId]` *(estado: existe — `app/skills/[skillId]/page.tsx`)*

#### 5.2.3 Elementos da Tela

- **Breadcrumb**: `Home > Skills > [NomeSkill]`
- **Tabs**: Identidade · Configuração · Moons · Clientes
  - **Identidade**: nome, tipo, descrição, ícone
  - **Configuração**: modelo, temperatura, system prompt (textarea grande, mono), versionamento (history)
  - **Moons**: lista CRUD de Moons; cada Moon tem nome, descrição, ajustes próprios
  - **Clientes**: multi-select de clientes onde a Skill aparece como Órbita
- **Footer**: Salvar (primary) · Cancelar (ghost) · Deletar (destructive)
- Validação de vocabulário em copy (RN-016) — bloqueia anti-patterns ("gerar", "otimizar", "eficiência")

---

### T-12: Skills Admin — Nova Skill

#### 5.3.1 Propósito

Criar Skill nova em ≤5 minutos (JTBD-02 da PX-01).

#### 5.3.2 Rota

`/skills/new` *(estado: existe — `app/skills/new/page.tsx`)*

#### 5.3.3 Elementos

Mesma estrutura de T-11, mas com campos vazios e wizard opcional para guiar Líder.

---

### T-17: Clientes Admin — Catálogo

#### 5.4.1 Propósito

CRUD de Clientes (Planetas). Persona PX-01.

#### 5.4.2 Rota

`/clientes` *(estado: existe)*

#### 5.4.3 Elementos

- **FilterSidebar**: status (ativo/inativo — RN-007), tipo de relacionamento, BU
- **Condensed cards** (não table — específico para Clientes): com cor, n skills, n biblioteca items, status
- **ClientDrawer** com 4 tabs: Identidade, Skills, Biblioteca, Métricas

---

### T-18: Clientes Admin — Editor

#### 5.5.1 Propósito

Editar cliente: status (ativo/inativo dispara RN-007), cor, slug, escopos.

#### 5.5.2 Rota

`/clientes/[clientId]` *(estado: existe)*

#### 5.5.3 Elementos

Tabs: **Identidade** (nome, slug, cor, status — toggle ativo/inativo com confirmação se houver Skills ativas) · **Skills** (associadas) · **Biblioteca** (KnowledgeItems com escopo deste cliente) · **Métricas** (link para T-25/T-24).

---

### T-19: Clientes Admin — Novo Cliente

#### 5.6.1 Propósito

Criar cliente novo. Pré-validação de slug único.

#### 5.6.2 Rota

`/clientes/new` *(estado: existe)*

---

## 6. FA-01 — Biblioteca (Inteligência Coletiva)

> **CRÍTICO RN-011**: Toda T-XX desta seção é **Caixa-preta** para perfil Operacional — não aparece em menu, link, breadcrumb, query, ou destino de URL direta. Operacional acessando `/biblioteca` recebe redirect 302 para `/` com mensagem genérica ("Página não disponível para seu perfil") sem revelar o nome "Biblioteca".

### T-13: Biblioteca Admin — Catálogo

#### 6.1.1 Propósito

Curar a Inteligência Coletiva da Suno. Listar KnowledgeItems com filtros por escopo (Suno global vs. cliente), tags, tipo de arquivo. Persona PX-01.

#### 6.1.2 Rota

`/biblioteca` *(estado: existe — Admin/Líder apenas; Operacional bloqueado por RN-011)*

#### 6.1.3 Jornada

JN-01 (curadoria), JN-05 (offboarding/captura).

#### 6.1.4 Elementos

- **AppHeader** breadcrumb `Home > Biblioteca`
- **ScopePills** (`biblioteca/ScopePills.tsx`): pills coloridas multi-select com dot da cor do cliente; "Suno global" sempre visível
- **FilterSidebar**: tags, tipo de arquivo (PDF/DOCX/TXT/audio/video/imagem), domínio (cliente | indústria | cultura | metodologia | referência), status
- **Table view (BibliotecaCard ou rows)**: ícone do tipo (FileTypeIcon), título, escopo, tags, contribuinte, última edição
- **Toolbar**: botão "Adicionar" (primary, abre T-14), busca semântica
- **BibliotecaDrawer** (T-15) abre on click

---

### T-14: Biblioteca Admin — Modal de Upload/Edit

#### 6.2.1 Propósito

Adicionar ou editar KnowledgeItem com metadados obrigatórios (RN-006).

#### 6.2.2 Rota

Modal sobre T-13. *(estado: existe — `BibliotecaModal`)*

#### 6.2.3 Elementos

- **Upload zone** (drag-and-drop, FileTypeIcon)
- **Campos obrigatórios** (RN-006 — bloqueia submit se faltar):
  - Título
  - Domínio (select: cliente | indústria | cultura | metodologia | referência)
  - **≥2 Tags** (TagInput com sugestões)
  - Cliente associado (se domínio = cliente)
  - Descrição (≥50 caracteres)
- **Campos opcionais**: fonte, link externo
- **Validação inline** — mostra contadores e mensagens em tempo real
- **CTA primary**: "Adicionar à Biblioteca"

---

### T-15: Biblioteca Admin — Drawer de Detalhes

#### 6.3.1 Propósito

Visualizar e editar item rapidamente sem sair do catálogo.

#### 6.3.2 Rota

Drawer right-side sobre T-13.

#### 6.3.3 Elementos

- Preview do conteúdo (extrato/snippet)
- Metadados completos
- Histórico de acessos/contribuintes (alimenta RN-008)
- Botões: Editar (abre T-14), Arquivar, Deletar

---

### T-16: Biblioteca Admin — Alerta Conhecimento em Risco

#### 6.4.1 Propósito

Visualizar conteúdo crítico que vive em **uma única pessoa** (RN-008) — proteção institucional contra perda por turnover. Persona PX-01.

#### 6.4.2 Rota

`/biblioteca?filter=risco` ou seção dedicada. **Estado: a construir** (P1 — Piloto).

#### 6.4.3 Jornada

JN-05 (offboarding/captura proativa).

#### 6.4.4 Elementos

- Header com explicação: *"Conhecimento crítico em risco — único contribuinte nos últimos 90 dias"*
- Tabela com colunas: Item · Cliente · Único contribuinte · Tenure · Criticidade · Ação sugerida
- Filtros por criticidade (alta/média)
- CTAs por linha: "Iniciar captura proativa" (workflow de entrevista/documentação)
- Banner agregado: "X itens em risco · Y guidelines de cliente ativo"

---

## 7. FA-05 — Workflows Automatizados

### T-20: Workflows Admin — Catálogo

#### 7.1.1 Propósito

Listar e filtrar Workflows configurados. Personas PX-01 (governança), PX-03 (operação).

#### 7.1.2 Rota

`/workflows` *(estado: existe)*

#### 7.1.3 Jornada

JN-07 (configuração e operação de Workflows).

#### 7.1.4 Elementos

- **FilterSidebar**: status (ativo/draft/archived), schedule (manual vs. agendado), cliente
- **Table view (WorkflowCard)**: nome, schedule humanizado ("Toda segunda às 9h"), última execução, status, owner
- **Toolbar**: botão "Novo Workflow" (primary, abre T-22), filtros, busca
- **WorkflowDrawer** com resumo + botões para T-21 e T-23

---

### T-21: Workflows Admin — Builder

#### 7.2.1 Propósito

Configurar steps do Workflow visualmente. Sequência de steps tipados (tool, LLM, condição, ação, HITL gate). Compilação para LangGraph StateGraph.

#### 7.2.2 Rota

`/workflows/[workflowId]` *(estado: existe)*

#### 7.2.3 Elementos

- **Breadcrumb**: `Home > Workflows > [NomeWorkflow]`
- **Tabs**: Builder · Schedule · Histórico (link para T-23)
- **Builder (sequência vertical de Steps)**:
  - StepCard com tipo, nome, configuração; botões + para inserir novo step entre dois
  - **Tipos de step**: Tool · LLM (escolha de Skill) · Condição (if/else) · Ação (notify, write) · **HITL gate** (pausa para revisor humano)
  - Encadeamento via sub-workflows (FA-05-04)
- **Schedule** (cron humanizado): "Diariamente às X" · "Toda segunda às Y" · etc.
- **Footer**: Salvar (primary), Testar, Arquivar

---

### T-22: Workflows Admin — Novo Workflow

#### 7.3.1 Rota

`/workflows/new` *(estado: existe)*

#### 7.3.2 Elementos

- **Templates pré-configurados (FA-05-05)**: Report Mensal · Plano de Mídia · Monitor de Anomalias · Pesquisa de Mercado · Em branco
- Após escolha → abre T-21 já com steps básicos preenchidos

---

### T-23: Workflows Admin — Histórico de Execuções

#### 7.4.1 Propósito

Visualizar runs do Workflow com timeline + logs por step.

#### 7.4.2 Rota

`/workflows/[workflowId]/runs` *(estado: existe)*

#### 7.4.3 Elementos

- Tabela de execuções: Data, Status, Trigger (manual/scheduled), Duração, Custo, HITL pendente
- Click em row → drawer com timeline detalhado: cada Step com timestamp, input/output (truncado), erros
- Filtros: status, trigger, intervalo de datas
- KPIs topo: taxa de sucesso, custo médio, tempo médio

---

## 8. FA-10 — Mensuração e Custo Evitado

### T-24: Mensuração — Dashboard Executivo

#### 8.1.1 Propósito

**Dashboard mensal para Diretoria** (RN-005). Persona PX-01 (apresenta a Guga em reuniões semanais). Sustenta o **business case** do sunOS com evidências defensáveis.

#### 8.1.2 Rota

`/mensuracao` *(estado: a construir — P1 Piloto)*

#### 8.1.3 Jornada

JN-08 (governança e demonstração de valor).

#### 8.1.4 Elementos

- **Breadcrumb**: `Home > Mensuração`
- **Header de período**: seletor de mês (M-1 e M-2 disponíveis)
- **KPI Cards (top row)**:
  - Custo Evitado Total (R$) com Δ vs. mês anterior
  - Skills Saudáveis (% — RN-004)
  - Score HITL Médio (X.X / 5)
  - Volume de Execuções
- **KPIs de Negócio (FA-10-05)**: Win Rate · Shortlist Rate · Retenção de Seniores
- **Tendências (gráficos)**: linha mensal dos últimos 12 meses; flag visual quando KPI varia >25% (RN-005)
- **Tabela "136 atividades" (FA-10-07)**: progresso de cobertura
- **Alertas ativos**: link para T-26 (homogeneização) e T-16 (conhecimento em risco)
- **CTA "Exportar relatório"**: gera PDF/PPTX para Diretoria
- **Bloqueio RN-020**: relatório com satisfação isolada NÃO pode ser gerado — mostra mensagem explicando inclusão obrigatória de set-level diversity

---

### T-25: Mensuração — Skill Health Detail

#### 8.2.1 Propósito

Drill-down em uma Skill: tempo de execução, redução vs. baseline (RN-004), custo evitado por execução (RN-018), score HITL, tendência mensal.

#### 8.2.2 Rota

`/mensuracao/skills/[skillId]` *(estado: a construir — P1)*

#### 8.2.3 Elementos

- KPIs específicos: redução de tempo %, custo evitado acumulado, score HITL, n execuções
- Tendência mensal
- **Sinalizadores**: "Saudável" · "Atenção" (redução < 30% por 1 mês) · "Crítica" (redução < 30% por 2+ meses, dispara revisão RN-004)
- Drill-down para baseline (planilha ROI) e auditoria de prompt history

---

### T-26: Mensuração — Homogeneização Coletiva

#### 8.3.1 Propósito

Visualizar **3 métricas de diversidade coletiva** (RN-019): Mean Pairwise Cosine Distance, Self-BLEU, Compression Ratio. Tendência mensal vs. baseline pré-sunOS. Alerta se métrica diverge >2σ. Persona PX-01.

#### 8.3.2 Rota

`/mensuracao/homogeneizacao` *(estado: a construir — P2 MVP)*

#### 8.3.3 Jornada

JN-08 (governança); endereça **risco existencial** do projeto (BR-014).

#### 8.3.4 Elementos

- 3 gráficos lado a lado (uma métrica cada), com baseline marcado e thresholds 2σ
- Status agregado: Verde (estável) · Amarelo (atenção 1 mês) · Vermelho (alerta 2+ meses → mitigação)
- Plano de mitigação proposto pelo sistema (texto editorial)
- Link para Skills causadoras suspeitas
- **Banner informativo**: explicação cultural do "leveling-up illusion" (research Doshi & Hauser) — vocabulário Suno

---

## 9. FA-11 — Safety Cultural & Ownership

### T-09: Forced Reflection Interstitial

#### 9.1.1 Propósito

**Interrupção cognitiva** após N stars (RN-015): pergunta reflexiva forçada para preservar engajamento crítico. N=5 default; N=3 para junior. Pode aparecer em T-05 (Chat) ou T-07 (Painel de Faíscas).

#### 9.1.2 Rota

Modal sobreposto a T-05 ou T-07. **Estado: a construir** (P1 — Piloto).

#### 9.1.3 Jornada

Transversal a JN-02, JN-03, JN-06.

#### 9.1.4 Elementos

- **Modal centralizado, max-width 480px, bg `--deep`**
- **Header**: ícone reflexivo + título "Pausa estratégica"
- **Pergunta**: *"Por que essas? Que padrão você vê?"* (vocabulário Suno; texto rotativo a partir de pool curado)
- **Textarea** para resposta (mínimo 30 caracteres recomendado, mas não bloqueante)
- **CTA primary**: "Continuar" (após resposta)
- **CTA secondary**: "Pular esta vez" (ghost)
- **Tracking** (RN-015): ≥3 skips consecutivos disparam alerta para Líder

> Para PX-05 (junior), N=3 — modal aparece com mais frequência. Visualmente idêntico mas com tooltip explicativo na primeira aparição: "Pausas como esta protegem sua autonomia criativa."

---

### T-27: Onboarding — Track por Carreira

#### 9.2.1 Propósito

Primeiro contato do Creator com o sunOS. **Sugere track** conforme estágio (RN-017): junior → "Estou começando uma ideia"; sênior → "Me prova que tá errada"; pleno → escolhe. Persona principal PX-05 (junior); também PX-02 e builders.

#### 9.2.2 Rota

`/onboarding` *(estado: a construir — P1)*

#### 9.2.3 Jornada

JN-09 (onboarding de novo Creator).

#### 9.2.4 Elementos

- **Wizard 3 passos**:
  1. **Boas-vindas** com manifesto Suno (FA-11-07) — vocabulário Devorar, Provocar, Faísca, Brasa
  2. **Sua experiência** — input de tempo de carreira + área (criação/mídia/planejamento/outros)
  3. **Track sugerida** — card com explicação da experiência adaptada; pode escolher outra
- Após conclusão: redireciona para T-02 (Sun) com track atribuída ao perfil

---

## 10. FA-09 — Governança, RBAC e Caixa-preta

### T-01: Login

#### 10.1.1 Propósito

Autenticação Google + atribuição de RBAC via Firebase Custom Claims (FA-09-01, FA-09-02).

#### 10.1.2 Rota

`/login` *(estado: existe — `app/login/page.tsx`)*

#### 10.1.3 Elementos

- **Layout dedicado** (sem AppShell) — `app/login/layout.tsx`
- Card central: Logo Sun + wordmark; CTA "Entrar com Google"; legal text (LGPD)
- Após login → redirect para `/`
- Rejeição: usuário fora do allowlist (não-Suno) recebe mensagem clara + logout

---

> **Telas de Auditoria/RBAC operacionais (FA-09-05, FA-09-06)**: não estão neste inventário como T-XX porque, conforme Parte 1 do PRD §FA-09 e §FA-12, "Audit log UI completa vive em FA-10" e CRUD de usuários é delegado a Firebase Console. Possível futura T-XX se Diretoria pedir UI de auditoria — registrar como lacuna identificada (§14.4).

---

## 11. Cross-Feature

### T-28: Design System (referência interna)

#### 11.1.1 Propósito

Component library viva — exibe tokens, componentes, padrões de uso. Não é tela de produto; é ferramenta para devs/designers (uso interno restrito).

#### 11.1.2 Rota

`/design-system` *(estado: existe — `app/design-system/page.tsx`)*

#### 11.1.3 Elementos

- Seções demonstrando: cores, tipografia, espaçamentos, sombras, botões, inputs, cards, drawers, modais, Sistema Solar mini, etc.
- Toggle Dark/Light theme
- Não roteável a partir do menu principal (acesso direto via URL para devs)

---

## 11.5. FA-13 — Aprovação Hierárquica

### T-29: Aprovação — Inbox do Aprovador

#### 11.5.1 Propósito

Caixa de entrada do **Aprovador (PX-06)** — geralmente um sócio sênior. Lista todas as `ApprovalRequest`s com status `PENDING_APPROVAL` cujo `current_level_order` corresponde a este aprovador na chain ativa. Persona primária PX-06; secundária PX-01 (Líder, em níveis intermediários).

#### 11.5.2 Rota

`/aprovacoes` *(estado: a construir)*

#### 11.5.3 Elementos

- **Header**: título "Aguardando sua aprovação", filtro por cliente (Planeta), filtro por tipo (`spark` / `turn` / `workflow_output`), filtro por urgência (SLA).
- **Lista de cards** ordenados por `expires_at` ascendente (urgentes no topo). Cada card:
  - Cliente (Planeta com cor)
  - Tipo do subject (badge `Faísca` / `Resposta de Chat` / `Output de Workflow`)
  - Resumo do `subject_snapshot` (preview de 2-3 linhas; truncado com "ver mais")
  - Submitter (nome + avatar)
  - Validation status (chip colorido: `Validado` verde / `Atenção` âmbar / `Bloqueado` vermelho)
  - Round (rodada — `1ª`, `2ª`, `3ª`)
  - Tempo restante até SLA (relativo: "vence em 6h" / "atrasada há 2h")
  - CTA "Revisar →" (abre T-30)
- **Estado vazio**: ilustração + "Nada pendente. Bom trabalho." (vocabulário Suno, sem motivacionais clichê)

#### 11.5.4 Estados

- **Loading**: skeletons de 3 cards
- **Vazio**: copy + ilustração
- **Erro**: retry button
- **Filtros aplicados retornam vazio**: "Nenhuma submissão atende aos filtros"

#### 11.5.5 Ações

- Click no card → T-30 (Detalhe)
- Filtros (multi-select por cliente, tipo, status validação)
- Atualizar (refresh manual; auto-refresh polling 30s — ASS-API-08)

#### 11.5.6 RBAC

- **Visível para**: usuários presentes em `approval_chain_levels.approver_user_id` ou cuja Role esteja em `approver_role`
- **Operacional sem nenhuma chain ativa**: rota retorna 404 (Caixa-preta — RN-011)

#### 11.5.7 FRs cobertos

FR-162, FR-164.

---

### T-30: Aprovação — Detalhe da Submissão

#### 11.5.8 Propósito

Detalhamento da `ApprovalRequest` para o aprovador tomar decisão informada. Mostra: subject completo (preview rico), ValidationReport com findings agrupados por validator, histórico de decisões nas rodadas anteriores, chain visualization (onde estamos), CTAs de decisão.

#### 11.5.9 Rota

`/aprovacoes/[requestId]` *(estado: a construir)*

#### 11.5.10 Elementos

- **Breadcrumb**: Aprovações → [Cliente] → [ID]
- **Header sticky**: cliente (Planeta + cor), tipo, submitter, round, tempo até SLA
- **Coluna principal — Subject Preview**:
  - Renderização rica do `subject_snapshot` (Faísca = card; Turn = transcript chat; Workflow output = Markdown render)
  - Inline highlights nos spans dos findings (sublinhado colorido por severidade)
- **Coluna lateral — ValidationReport**:
  - Card `Brand Validator` (avatar do agente — RN-014 marca visual): findings agrupados (error/warning/info), cada finding com `span` clicável (scrolla para o trecho), `message`, `suggestion` opcional
  - Card `Português Validator`: idem
  - Card `Validators versions` (colapsado): versão pinned dos agentes (auditoria)
  - Latency total (max paralelo)
- **Seção — Chain Visualization**:
  - Stepper horizontal: `Submitter → Validators → Nível 1 (✓ João) → Nível 2 (▶ você) → Nível 3`
  - Cada nó com nome, role, status (✅ aprovado / ⏳ pendente / 🔄 ajustes solicitados), `decided_at`
- **Seção — Histórico de Decisões** (colapsada por default; expande se round > 1):
  - Timeline de decisões anteriores com aprovador, decisão, comentário
- **Footer sticky — CTAs**:
  - `Aprovar` (primary verde) — confirma com modal "Aprovar e enviar `Validado/Aprovado` ao subject?"
  - `Solicitar ajustes` (secondary âmbar) — abre textarea obrigatório (comment) + opcional `attachments` (referência: TODO-API-12)
  - `Reprovar` (destructive — vermelho) — abre textarea obrigatório
- **Banner de bloqueio** (se `current_round=3` e tentativa de `REQUEST_CHANGES`): "3ª rodada — solicitar ajustes encerrará a submissão (RN-025). Aprove ou reprove."

#### 11.5.11 Estados

- **Loading**: skeleton 2 colunas
- **Erro 403** (não-aprovador): redirect para `/` com toast "Sem permissão"
- **Status já decidido**: header mostra carimbo `Aprovado por [nome] em [data]` ou `Reprovado`; CTAs ocultos
- **EXPIRED**: banner cinza + read-only

#### 11.5.12 Ações

- `Aprovar / Solicitar ajustes / Reprovar` → `POST /api/approval/requests/{id}/decide`
- Click no span do finding → scroll suave + highlight pulse
- Link "ver subject completo" → modal/drawer com `subject_snapshot` em raw

#### 11.5.13 Sub-rota Admin: `/aprovacoes/configuracao/[clientSlug]`

Configuração de `ApprovalChain` (níveis, SLA, escalation policy). Acessível somente a Admin/Líder do cliente. Cria nova versão imutável; muda `chain_id` ativo (RN-026). Cobertura: FR-168.

#### 11.5.14 FRs cobertos

FR-163, FR-165, FR-166, FR-167, FR-168, FR-169.

---

### T-31: Aprovação — Submeter para Aprovação (modal)

#### 11.5.15 Propósito

Modal leve disparado a partir do contexto do output (Spark no T-07, Turn no T-05, Workflow output no T-23) para criar a `ApprovalRequest`.

#### 11.5.16 Onde aparece

- Botão `Submeter para Aprovação` em:
  - T-05 (Chat) — quando turn está marcado como entregável
  - T-07 (Painel de Faíscas) — em cada FaiscaCard com status "Validado pela IA"
  - T-23 (Workflow Histórico) — em cada output

#### 11.5.17 Elementos

- Cliente (auto-preenchido com base no contexto; Admin pode ajustar)
- Chain (auto-resolvido; preview dos níveis na chain — read-only)
- Comment opcional do submitter (1-2 linhas para contextualizar aprovador)
- CTA `Submeter` → `POST /api/approval/submit`

#### 11.5.18 Estados

- **Loading durante submit**: spinner no botão
- **Sucesso**: toast "Enviado para aprovação. Você receberá notificação quando for decidido."
- **Erro 409 (já existe ApprovalRequest ativa)**: link "Ver request existente →"
- **Erro 404 (sem chain ativa)**: copy "Nenhum fluxo de aprovação configurado para este cliente. Fale com Admin."

#### 11.5.19 FRs cobertos

FR-160, FR-161.

---

## 11.6. FA-14 — Google Drive como Fonte

### T-32: Drive — Sync Dashboard

#### 11.6.1 Propósito

Visão de estado do `DriveSync` por cliente para o **Líder/Curador (PX-01)**. Mostra: conexão OAuth, contadores (descobertos / indexados / curados), última sincronização, próxima agendada, cleanup reports recentes.

#### 11.6.2 Rota

`/drive/[clientSlug]` *(estado: a construir)*

#### 11.6.3 Elementos

- **Header**: nome do cliente (Planeta + cor), status do sync (chip: `Ativo` verde / `Pausado` cinza / `OAuth expirado` vermelho / `Erro` âmbar)
- **Cards de métrica** (top row):
  - Documentos descobertos (`documents_total`)
  - Documentos indexados (metadata)
  - Documentos curados (importados para Biblioteca via aceite — link para T-13)
- **Bloco — Conexão OAuth**:
  - Email do cliente que concedeu (`granted_by_email`)
  - Escopo: `drive.readonly` (chip travado, não editável — RN-027)
  - Folders raiz autorizadas (lista)
  - CTA `Reconectar` (Admin) e `Desconectar` (Admin — destructive, com confirmação dupla)
- **Bloco — Sincronização**:
  - Última sync completa (relativo: "há 8 minutos")
  - Próxima sync agendada
  - Último webhook recebido
  - CTA `Forçar sync agora` (POST /api/drive/sync/run) — visível para Admin/Líder
- **Bloco — Cleanup Reports** (lista paginada):
  - Cada report com período, contadores (duplicatas, órfãos, candidatos a arquivamento), CTA `Ver detalhes` (drawer com `details` JSON renderizado)
  - Banner "Apenas relatório — sunOS não modifica seu Drive" (RN-029, ADR-009)

#### 11.6.4 Estados

- **OAuth expirado**: banner âmbar persistente "Token expirou — reconecte para retomar sync"
- **Sem conexão configurada**: empty state com CTA `Conectar Drive` (inicia OAuth — POST /api/drive/connect)
- **Erro de sync (status=ERROR)**: card vermelho com `last_error` + CTA `Tentar novamente`

#### 11.6.5 RBAC

Admin / Líder do cliente. Operacional não vê nem o menu (RN-011 — Caixa-preta).

#### 11.6.6 FRs cobertos

FR-170, FR-171, FR-172, FR-178, FR-179.

---

### T-33: Drive — Inbox de Sugestões de Curadoria

#### 11.6.7 Propósito

Lista de `CurationSuggestion` com `status='PENDING'` para o curador (PX-01) decidir. Curadoria é **sempre sugestiva** — o curador aceita ou rejeita; nunca é auto-aplicada (RN-029).

#### 11.6.8 Rota

`/drive/[clientSlug]/sugestoes` *(estado: a construir)*

#### 11.6.9 Elementos

- **Header**: filtro por kind (`IMPORT_TO_LIBRARY` / `TAG` / `MERGE_WITH` / `MARK_DUPLICATE` / `MARK_OUTDATED`), filtro por confidence (slider 0–1)
- **Lista de cards**, ordenados por `confidence DESC` (mais confiantes no topo). Cada card:
  - Documento alvo (preview: nome, mime, owner, web_view_link clicável → abre Drive em nova aba)
  - Tipo de sugestão (badge colorido)
  - `payload` renderizado (ex: para `IMPORT_TO_LIBRARY` mostra título + tags sugeridas + escopo; para `MERGE_WITH` mostra KnowledgeItem alvo)
  - Confidence (chip 0.85)
  - `rationale` (explicação do agente — copy curta)
  - CTAs `Aceitar` (primary) e `Rejeitar` (secondary)
- **Card detalhado — modal** (ao clicar): mostra preview do conteúdo do Drive (fetch on-demand via API-146); permite curador ajustar `overrides` (ex: editar tags antes de aceitar)

#### 11.6.10 Estados

- **Aceite IMPORT_TO_LIBRARY**: toast "Importado para Biblioteca como `[título]`. Veja em /biblioteca." + link
- **Aceite outros kinds**: toast confirmação ação aplicada à metadata local
- **Rejeitar**: card desaparece da lista; opcional capturar motivo (textarea curta)
- **Vazio**: "Nenhuma sugestão pendente. O agente está acompanhando o Drive." (vocabulário Suno)
- **STALE**: card cinza com badge "Documento mudou no Drive — sugestão desatualizada" + CTA `Descartar`

#### 11.6.11 RBAC

Admin / Líder do cliente.

#### 11.6.12 FRs cobertos

FR-173, FR-174, FR-175, FR-176, FR-177.

---

## 12. Fluxos por Jornada

> Jornadas inferidas de Personas + JTBDs (PRD Parte 2). A Parte 3 do PRD (Matriz Persona-Objetivo-Jornada) formalizará IDs e detalhes — esta seção é mapeamento provisório.

### JN-00: Wayfinding (entrada / navegação)

```
T-01 (Login)
    ↓
T-02 (Sun/Home)
    ↓
T-03 (Planeta)
    ↓
T-04 + T-05 (Órbita + Chat)
```

### JN-01: Curadoria (PX-01 — Líder)

```
T-02 (Home)
    ↓
T-13 (Biblioteca) ←→ T-14, T-15 (Modal/Drawer)
    ↓
T-10 (Skills) ←→ T-11, T-12
    ↓
T-17 (Clientes) ←→ T-18, T-19
    ↓
T-20 (Workflows) ←→ T-21, T-22
```

### JN-02: Ideação contextualizada (PX-02, PX-04, PX-05)

```
T-02 → T-03 → T-04
    ↓
T-05 (Chat com Skill ativa)
    ↓ [acionamento Moon Shot]
T-06 (Modal Acionamento) → T-07 (Painel de Faíscas)
    ↓ [N stars atingido]
T-09 (Forced Reflection)
    ↓
[volta ao Chat com Faíscas marcadas]
```

### JN-03: Execução de Tarefa Processual (PX-03)

```
T-02 → T-03 → T-04
    ↓
T-05 (Chat com Skill processual; contexto da Biblioteca injetado automaticamente — invisível ao Operacional)
    ↓
[output gerado, marcado com Faísca/estímulo até confirmação]
    ↓
[Feedback HITL inline]
```

### JN-04: Análise Estratégica (PX-04)

```
T-02 → T-03 → T-04
    ↓
T-05 (Skill Análise de Mercado / Persona Sintética / Brief Builder)
    ↓ [opcional]
T-06 → T-07 (Moon Shot para conectar insight a território criativo)
    ↓ [opcional]
T-22 → T-21 (Configura Workflow Pesquisa de Mercado)
```

### JN-05: Captura proativa pré-saída (PX-01)

```
T-13 (Biblioteca)
    ↓ [filtro Risco aplicado]
T-16 (Alerta Conhecimento em Risco)
    ↓
T-22 (Novo Workflow de captura) → T-21 (Builder)
```

### JN-06: Devil's Advocate (PX-02 sênior)

```
T-05 (Chat) com sua ideia em curso
    ↓ [acionamento]
T-06 (modo "Me prova que tá errada")
    ↓
T-07 (Painel com Faíscas adversariais)
```

### JN-07: Operação de Workflow (PX-01, PX-03)

```
T-02
    ↓
T-20 (Workflows)
    ↓
T-22 (Novo) → T-21 (Builder) → Salvar
    ↓ [agendado por Cloud Scheduler]
[execução automática] → T-23 (Histórico de Execuções)
    ↓ [HITL gate, se houver]
T-05 (Chat com revisão humana)
```

### JN-08: Governança e Demonstração de Valor (PX-01)

```
T-02
    ↓
T-24 (Dashboard Executivo)
    ↓
T-25 (Skill Health) — drill-down por Skill
    ↓
T-26 (Homogeneização Coletiva) — quando alerta dispara
```

### JN-09: Onboarding (PX-05 junior, PX-02 sênior, novos Creators)

```
T-01 (Login primeira vez)
    ↓
T-27 (Onboarding Track por Carreira)
    ↓
T-02 (Home com track atribuída)
    ↓
T-03 → T-04 → T-05 (primeira sessão guiada)
```

---

## 13. Progressive Disclosure por Persona

### PX-01 — Líder/Curador

**Foco:** Curadoria, governança, demonstração de valor.

**Elementos prioritários:**
- Sidebar completa com Skills, Biblioteca, Clientes, Workflows, Mensuração
- Acesso a T-13 a T-16 (Biblioteca), T-24 a T-26 (Mensuração)
- Alertas: T-16 (conhecimento em risco), T-26 (homogeneização)
- Audit logs (FA-09-05/06) — futuro

**Elementos secundários:**
- Chat e Sistema Solar (consome como qualquer Creator)
- Onboarding (já fez)

---

### PX-02 — Criativo Sênior

**Foco:** Ideação, devil's advocate, ownership autoral.

**Elementos prioritários:**
- T-05 Chat
- T-06, T-07, T-08 Moon Shot (modos sênior + dupla)
- Marcação visual Faísca (RN-014) sempre visível
- Visible reasoning toggle (default hidden — RN-017)

**Elementos secundários:**
- T-09 Forced Reflection (N=5)
- T-27 Onboarding (passou rapidamente)

**Ocultos:**
- Telas de Mensuração (FA-10) — não relevante no fluxo diário

---

### PX-03 — Operador Processual

**Foco:** Execução rápida com contexto preservado. **Caixa-preta total da Biblioteca.**

**Elementos prioritários:**
- T-02, T-03, T-04, T-05 (Sistema Solar + Chat)
- T-20, T-21, T-23 (Workflows que ele opera)

**Elementos secundários:**
- Onboarding T-27

**Ocultos (RN-011 — CRÍTICO):**
- T-13, T-14, T-15, T-16 (Biblioteca) — **ZERO menção, zero link, redirect em URL direta**
- T-10, T-11, T-12 (Skills Admin) — não vê system prompts (Caixa-preta)
- Linguagem no Chat: "contexto da Biblioteca" → "contexto do cliente"

---

### PX-04 — Planejamento Estratégico

**Foco:** Ponte entre dados de mercado e território criativo.

**Elementos prioritários:**
- T-05 Chat com Skills Análise de Mercado, Persona Sintética, Brief Builder
- T-06, T-07 Moon Shot (modo "começando uma ideia")
- T-20, T-21, T-22 Workflows (Pesquisa de Mercado)

**Elementos secundários:**
- T-25 Mensuração da Skill (custo evitado da pesquisa visível)

---

### PX-05 — Creator Junior

**Foco:** Aprendizado com proteção contra over-reliance.

**Elementos prioritários:**
- T-27 Onboarding (track "Estou começando uma ideia" sugerido — RN-017)
- T-05 Chat
- T-06, T-07 Moon Shot (modo divergente, junior-leaning)
- T-09 Forced Reflection (N=3, mais frequente — RN-015)
- Marcação Faísca/estímulo sempre visível (RN-014)

**Elementos secundários:**
- T-02, T-03, T-04 (Sistema Solar)

**Ocultos:**
- Visible reasoning hidden by default (RN-017) — preserva o "aha"
- Mensuração e Admin

---

## 14. Estados Globais e Edge Cases

### 14.1 Loading States

Todas as telas devem ter:
- Skeleton loaders para conteúdo principal (`@keyframes pulse` 1.5s — `globals.css`)
- StreamingIndicator no Chat e Painel de Faíscas
- Progress bars para upload de Biblioteca (T-14) e operações longas

### 14.2 Empty States

Cada lista/tabela deve ter:
- Ilustração contextual (alinhada à metáfora Sistema Solar quando aplicável)
- Mensagem clara em vocabulário Suno (RN-016 — nada de "sem dados", preferir "Nenhuma Faísca ainda — comece um briefing")
- Ação sugerida (CTA primary)

### 14.3 Error States

- Inline errors para campos de form (`#EF4444`, font 0.65rem)
- Banners para erros de página (topo, dismissable)
- Toasts para erros de ações (z-index 600)
- Retry buttons sempre que aplicável (RN-003 timeout, fallback de modelo)
- **Default deny** em qualquer ambiguidade de RBAC (RN-009) → mensagem genérica sem revelar recurso

### 14.4 Lacunas Identificadas (FA sem tela ou tela parcial)

| Lacuna | FA afetada | Explicação | Recomendação |
|--------|-----------|------------|--------------|
| FA-08 (Image editing inpainting/outpainting) | FA-08 | Não há tela dedicada para edição de imagem; hoje VisualCreator vive embutido em T-05 | Possível T-XX futura "Image Editor" se Phase 16 confirmar; ou painel sobre T-05. Validar com Bruno. |
| FA-08 (Video generation Veo 3.x) | FA-08 | Sem tela de configuração de geração de vídeo | Idem acima. |
| FA-09-05/06 (Audit log UI) | FA-09 | Tela de auditoria de acessos administrativos não está mapeada como T-XX | Decidir em Piloto se UI necessária ou se logs MLflow + queries ad-hoc bastam. |
| FA-09-08 (NDA + processos formais) | FA-09 | Não tem tela — provavelmente é doc externo + onboarding | Não exige tela. |
| FA-01-08 (Política LGPD) | FA-01 | Não tem tela — é política aprovada pela Diretoria | Não exige tela; aplica-se via `RetentionPolicy` no backend. |
| Cmd+K (Command Palette global) | Transversal | Hoje não há atalho global de busca; débito P2/P3 do handoff | Recomenda implementar como overlay (não T-XX, é padrão de IA) — ver Parte 2 §8. |

### 14.5 Offline/Degraded

- Banner de conectividade no AppHeader
- Skeleton placeholder com dados em cache quando disponível (Sistema Solar tem dados estáticos `data/clients.ts` — sempre carrega)
- Ações que requerem rede (Send no Chat, Save no Admin) ficam desabilitadas com tooltip "Sem conexão"

### 14.6 Acessibilidade Transversal

Conforme Parte 4 §2.6:
- Todo input/botão tem `role`, `aria-*`, foco visível (focus ring `0 0 0 2px rgba(255,200,1,0.15)`)
- Touch target ≥44x44px (Parte 4 §3.8)
- Navegação por teclado em todas as telas (especialmente T-21 Builder de Workflow)
- Contraste AA verificado (Parte 4 §3.1.2)
- `prefers-reduced-motion` respeitado (Parte 4 §3.7)

### 14.7 Tema Dark/Light

Toggle disponível no AppHeader (T-Topo) — aplica `data-theme` em `<html>`. Ambos os temas devem ser idênticos funcionalmente.

---

## Cobertura — FA-XX → Telas

| FA | Nome | Telas que entregam |
|----|------|--------------------|
| **FA-01** Biblioteca | Inteligência Coletiva | T-13, T-14, T-15, T-16 (todas Caixa-preta para Operacional) — RN-011 |
| **FA-02** Moon Shot | Provocação Criativa | T-06, T-07, T-08 (todas a construir — POC/Piloto) |
| **FA-03** Skills processuais | Catálogo + contexto | T-04, T-05 (consumo); T-10, T-11, T-12 (configuração) |
| **FA-04** Chat ReAct | Interface conversacional | T-04, T-05 (em refactor para persistência) |
| **FA-05** Workflows | Engine LangGraph | T-20, T-21, T-22, T-23 |
| **FA-06** Sistema Solar | Navegação | T-02, T-03, T-04 |
| **FA-07** HITL Feedback | Avaliação humana | T-05 (inline), T-09 (forced reflection — a construir) |
| **FA-08** Multimodal | Imagem/Vídeo | T-05 (consumo via VisualCreator); telas dedicadas pendentes (lacuna §14.4) |
| **FA-09** Governança/RBAC/Caixa-preta | Segurança | T-01 (Login); transversal (RN-009 e RN-011 aplicados em todas) |
| **FA-10** Mensuração | Custo evitado, KPIs | T-24, T-25, T-26 (todas a construir) |
| **FA-11** Safety Cultural | Ownership e cultura | T-09, T-27 (a construir); marcação Faísca transversal em T-05/T-07 |
| **FA-12** Admin areas | CRUD configurável | T-10, T-11, T-12, T-13, T-14, T-15, T-17, T-18, T-19, T-20, T-21, T-22, T-23, T-28 |

> **Toda FA-XX tem ≥1 tela mapeada.** FA-08 e FA-09 têm cobertura parcial — ver §14.4.

---

## Changelog

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0 | 2026-04-28 | Versão inicial. **28 Telas (T-01 a T-28)**: 18 existentes (validadas em `app/`), 10 a construir, 1 em refactor (T-05 persistência). Mapeamento completo para FA-01 a FA-12 (12 features) e PX-01 a PX-05 (5 personas). 9 jornadas inferidas (JN-00 a JN-09). Caixa-preta da Biblioteca (RN-011) explicitada para PX-03 Operacional. Vocabulário Suno aplicado (Devorar, Provocar, Faísca, Brasa, Sistema Solar, Sun, Planeta, Órbita, Moon); Koro sempre com K. Anti-patterns evitados em copy. Lacunas identificadas em §14.4. |
| 1.1 | 2026-04-28 | Adicionadas **5 novas Telas (T-29 a T-33)** para FA-13 (Aprovação Hierárquica) e FA-14 (Drive como Fonte): T-29 Inbox do Aprovador, T-30 Detalhe da Submissão (com sub-rota Admin para config de chain), T-31 Modal de Submeter para Aprovação (contextual em T-05/T-07/T-23), T-32 Drive Sync Dashboard, T-33 Inbox de Sugestões de Curadoria. Persona PX-06 (Aprovador Sócio) adicionada na cobertura. Jornadas JN-11 (Submissão) e JN-12 (Curadoria do Drive) referenciadas. Rotas novas: `/aprovacoes`, `/aprovacoes/[requestId]`, `/aprovacoes/configuracao/[clientSlug]` (Admin), `/drive/[clientSlug]`, `/drive/[clientSlug]/sugestoes`. Total: **33 telas** (18 existentes + 15 a construir + 1 em refactor). RBAC: T-29/T-30 visíveis a aprovadores em chain ativa; T-32/T-33 visíveis a Admin/Líder do cliente; Operacional não vê (RN-011). FRs cobertos: FR-160 a FR-179. |

---

*Este documento serve como especificação para construção das telas. Detalhes de tokens visuais (cores, tipografia, espaçamentos) seguem o **Design System (Parte 4 do UX)**. Detalhes de navegação inter-telas estão na **Arquitetura da Informação (Parte 2 do UX)**. Specs por feature virão na **Parte 3 do UX (Screen Specs)**.*
