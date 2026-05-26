---
spec-id: SPEC-018
slug: clientes-admin
artefato: spec
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-05-26
atualizada: 2026-05-26
versao: 1.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + Python 3.11"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: "Requisitos funcionais, não-funcionais e critérios de aceite do Clientes Admin."
upstream:
  - docs/prd/parte1-feature-map.md (FA-12-03, FA-06, FA-09, FA-15)
  - docs/brd/parte3-requisitos.md (BR-004, BR-007, BR-015, BR-022)
  - docs/brd/parte4-regras.md (RN-006, RN-009)
  - docs/srd/parte7-ADRs.md (ADR-002)
---

# Spec — SPEC-018 — Clientes Admin

## 1. Visão Geral

Clientes Admin (`/clientes`) é a interface administrativa que permite Líderes (P3) e Admins (P4) gerenciar o cadastro completo de clientes do sunOS. Cobre criação (wizard 4 steps), edição (4 tabs), atribuição de skills, visualização de Biblioteca scoped, métricas de uso, e arquivamento — com isolamento explícito do Solar System (`data/clients.ts` imutável).

A versão atual (protótipo) implementa toda a UI com React Context (session-only). Esta SPEC especifica o caminho para produção: persistência PostgreSQL + RBAC backend + state machine de status preparada para FA-15.

## 2. Personas e Jornadas

| Persona | Objetivo principal | Jornadas cobertas |
|---------|-------------------|-------------------|
| PX-01 Líder/Curador (primário) | Cadastrar, configurar e monitorar clientes no sunOS | JN-01 (criação), JN-07 (curadoria), JN-08 (governance) |
| PX-04 Admin | Governar catálogo de clientes, RBAC, configurações | JN-08 |
| PX-07 Sponsor de Área (beneficiário) | Acompanhar métricas do cliente de sua área | JN-13 (FA-15 downstream) |
| PX-03 Operador Processual (excluído) | Não acessa — Caixa-preta | — |

<!-- REVIEW: PX-07 Sponsor de Área precisa de acesso read-only a Clientes Admin (ver métricas do seu cliente) ou usa outro canal? FA-15 sugere que Sponsor usa o wizard de cadastro — definir escopo de acesso. -->

## 3. Requisitos Funcionais

### 3.1. Listagem (`/clientes`)

| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| FR-CAD-001 | Exibir clientes em condensed cards (Pattern Model Repo) com: nome, slug, color swatch, status, skills atribuídas (count), última atualização | P0 |
| FR-CAD-002 | Filter sidebar com filtros: status (PRE_ACTIVE/ACTIVE/ARCHIVED), skills atribuídas (multi-select) | P0 |
| FR-CAD-003 | Busca por nome e slug (debounced 300ms, mínimo 2 chars) | P0 |
| FR-CAD-004 | Ordenação por nome (A-Z/Z-A) e última atualização | P1 |
| FR-CAD-005 | Botão "Novo Cliente" que abre wizard de criação (`/clientes/new`) | P0 |
| FR-CAD-006 | Clicar em card abre side drawer com preview; "Editar" navega para `/clientes/[clientId]` | P1 |

### 3.2. Criação (`/clientes/new`)

| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| FR-CAD-007 | Wizard 4 steps: (1) Identidade básica, (2) Sponsor e contato, (3) Skills iniciais, (4) Revisão | P0 |
| FR-CAD-008 | Step 1 — Identidade: name (obrigatório), slug (auto-gerado + editável, único), description, color (color picker ou preset de cores) | P0 |
| FR-CAD-009 | Step 2 — Sponsor: sponsor_name, sponsor_email, sponsor_slack | P1 |
| FR-CAD-010 | Step 3 — Skills: multi-select de skills ACTIVE para atribuição inicial | P1 |
| FR-CAD-011 | Criar cliente com status `ACTIVE` por default; `PRE_ACTIVE` se chamado via FA-15 wizard | P0 |
| FR-CAD-012 | Validar unicidade de slug (409 se duplicado) | P0 |

### 3.3. Edição (`/clientes/[clientId]`)

| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| FR-CAD-013 | **Tab Identidade**: name, slug, description, color, sponsor, contact info | P0 |
| FR-CAD-014 | **Tab Skills**: listar skills atribuídas ao cliente; toggle atribuir/desatribuir; fonte canônica = junction `skill_clients` | P0 |
| FR-CAD-015 | **Tab Biblioteca**: listar KnowledgeItems scoped ao cliente (read-only; link para Biblioteca Admin) | P1 |
| FR-CAD-016 | **Tab Métricas**: dashboard — totalSessions, totalFeedbacks, averageScore, topSkill, lastActivity (calculados on-demand) | P1 |
| FR-CAD-017 | Exibir status atual do cliente (PRE_ACTIVE/ACTIVE/ARCHIVED) com badge; botão "Arquivar" para ACTIVE→ARCHIVED | P0 |
| FR-CAD-018 | Transição ACTIVE→ARCHIVED: soft delete via `status = 'archived'`; warning sobre impacto no Solar System | P1 |

### 3.4. Segurança e Integridade

| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| FR-CAD-019 | Backend endpoint retorna `404` para qualquer request autenticado como P1/P2 | P0 |
| FR-CAD-020 | `data/clients.ts` não é modificado por nenhuma operação desta SPEC (ADR-002) | P0 |
| FR-CAD-021 | Soft delete via `status = 'ARCHIVED'`; histórico de runs e feedbacks preservado | P0 |
| FR-CAD-022 | Métricas calculadas via aggregation query — sem coluna `total_sessions` denormalizada | P1 |
| FR-CAD-023 | ClientMetrics retornam `null` para campo sem dados (não zero) — distinção semântica "sem dados" vs "zero" | P1 |

<!-- REVIEW: FR-CAD-011 — criar com status ACTIVE por default pressupõe que o Líder faz o cadastro diretamente (sem wizard FA-15). Para FA-15 Onboarding Automatizado, o status inicial será PRE_ACTIVE até validação. Confirmar se esta distinção deve ser parâmetro do endpoint ou campo explícito no body. -->

## 4. Requisitos Não-Funcionais

| ID | Requisito | Métrica |
|----|-----------|---------|
| NFR-CAD-001 | Listagem com ≤100 clientes e métricas: ≤ 800ms (p95) — metrics via DB view com índice | Performance |
| NFR-CAD-002 | 100% dos requests P1/P2 a `/api/clients/*` retornam 404 | Segurança |
| NFR-CAD-003 | `data/clients.ts` intacto após 100 operações Admin CRUD — verificável via md5 check | Integridade |
| NFR-CAD-004 | Junction `skill_clients` como único ponto de verdade — zero arrays JSONB paralelos em `clients` ou `skills` | Integridade |
| NFR-CAD-005 | RBAC enforcement no backend — resistente a bypass direto via curl | Segurança |
| NFR-CAD-006 | Slug unique constraint — sem race condition via DB UNIQUE | Integridade |

## 5. Restrições

| ID | Restrição |
|----|-----------|
| REST-CAD-01 | `data/clients.ts` é imutável — Solar System permanece com dados estáticos (ADR-002) |
| REST-CAD-02 | Sem instalação de novas dependências npm (CLAUDE.md) |
| REST-CAD-03 | Visual das páginas do Solar System não pode ser alterado (CLAUDE.md) |
| REST-CAD-04 | Tab Biblioteca é read-only nesta SPEC — sem edição de KnowledgeItems via Clientes Admin |

## 6. Critérios de Aceite

| ID | Cenário | Resultado Esperado |
|----|---------|--------------------|
| CA-CAD-001 | Líder cria cliente "MegaCorp" com slug `mega-corp`, color `#0066FF`, step 3 sem skills | Cliente criado com status ACTIVE; aparece na listagem; `data/clients.ts` inalterado |
| CA-CAD-002 | Líder arquiva cliente "TesteCo" (sem runs ativos) | Status → ARCHIVED; card some da listagem default; dados preservados no DB |
| CA-CAD-003 | Líder atribui skill "Redação" ao cliente "MegaCorp" via Tab Skills | Inserção em `skill_clients`; skill aparece no Tab Skills de MegaCorp e no Tab Clientes de "Redação" (SPEC-017) |
| CA-CAD-004 | Líder desatribui skill "Redação" de "MegaCorp" | Remoção de `skill_clients`; skill some do Tab Skills de MegaCorp |
| CA-CAD-005 | Admin abre Tab Métricas de "Santander" | Exibe totalSessions, totalFeedbacks, averageScore, topSkill, lastActivity calculados; sem coluna extra no DB |
| CA-CAD-006 | Líder tenta criar cliente com slug `mega-corp` (já existente) | Erro inline: "Slug já em uso"; form não submete |
| CA-CAD-007 | Operacional faz `GET /api/clients/abc-123` com JWT P2 | Resposta `{"detail":"Not found"}` com status 404 |
| CA-CAD-008 | Operacional navega para `/clientes` no browser | Redirecionado para `/404` via RBAC middleware |
| CA-CAD-009 | Admin abre Tab Biblioteca de "Santander" | Lista KnowledgeItems com `client_id = santander_id`; link para Biblioteca Admin |
| CA-CAD-010 | FA-15 cria cliente via API com `status=PRE_ACTIVE` | Cliente aparece na listagem com badge "PRE_ACTIVE"; indisponível no Solar System até transição para ACTIVE |
