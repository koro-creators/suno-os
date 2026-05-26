---
spec-id: SPEC-021
slug: agentes
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
  contexto: "Requisitos funcionais, não-funcionais, restrições e critérios de aceite para a feature Agentes (FA-17)."
upstream:
  - docs/prd/parte1-feature-map.md (FA-17)
  - docs/brd/parte3-requisitos.md (BR-025, BR-026)
  - docs/brd/parte4-regras.md (RN-009, RN-010, RN-011)
  - docs/srd/parte7-ADRs.md (ADR-002, ADR-005)
---

# Spec — SPEC-021 — Agentes

## 1. Visão Geral

Agentes (`/agentes`) é a interface administrativa que permite Admins (P4) e Líderes (P3) criar, configurar e gerenciar agentes de IA autônomos e reutilizáveis. Um Agente combina: identidade (nome + ícone), instruções (system prompt próprio), Skills sunOS associadas como ferramentas, apps integrados, arquivos de memória (contexto file-based), agendamento (hourly/daily) e execução manual com preview sandboxed.

Agentes são um domínio global: existem independente de cliente, mas são autorizados por cliente via tabela de permissões. Um agente pode ser autorizado para N clientes; um cliente pode ter N agentes autorizados.

A versão Fase A implementa toda a UI com React Context (mock-mode). Fases B-D adicionam runtime LangGraph, memory files no GCS e schedule via Cloud Scheduler.

## 2. Personas e Jornadas

| Persona | Papel | Jornadas cobertas |
|---------|-------|-------------------|
| PX-01 Admin (primário) | Criar agentes, configurar Skills/apps/memória, autorizar clientes, ativar schedules | JN-17, JN-18, JN-19, JN-20 |
| PX-02 Líder | Criar e configurar agentes; ver atividade; testar via preview | JN-17, JN-18, JN-21 |
| PX-03 Creator/Operacional (excluído) | Sem acesso — caixa-preta total | — |

<!-- REVIEW: PX-02 Líder vê todos os Agentes (catálogo global) ou apenas os autorizados para seus clientes? Proposta atual: Líderes veem todos (mesmo padrão de Skills). Confirmar antes de Fase B. -->

## 3. Requisitos Funcionais

### 3.1. Listagem (`/agentes`)

| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| FR-AGT-001 | Exibir agentes em cards com: nome, ícone, status badge (draft/active/inactive/archived), quantidade de Skills associadas, quantidade de clientes autorizados, última execução (ou "—" se nunca executou) | P0 |
| FR-AGT-002 | Filtrar por status (draft/active/inactive/archived) via pills | P0 |
| FR-AGT-003 | Busca por nome (debounced 300ms, mínimo 2 chars) | P0 |
| FR-AGT-004 | Botão "Novo Agente" que navega para `/agentes/new` | P0 |
| FR-AGT-005 | Clicar em card abre side drawer com preview do agente; "Editar" navega para `/agentes/[agentId]` | P1 |

### 3.2. Criação (`/agentes/new`)

| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| FR-AGT-006 | Formulário: nome (obrigatório, ≤120 chars), ícone (emoji picker ou texto ≤100 chars), instruções (textarea, system prompt), status inicial (`draft` por padrão) | P0 |
| FR-AGT-007 | Após criação bem-sucedida, redirecionar automaticamente para `/agentes/[agentId]` no editor com tab "Configuração" ativo | P0 |

### 3.3. Editor (`/agentes/[agentId]`) — 7 Tabs

#### Tab Configuração

| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| FR-AGT-008 | Editar nome, ícone, instruções (system prompt), status (draft/active/inactive) | P0 |
| FR-AGT-009 | Agentes com status `archived` são read-only — sem edição possível | P0 |
| FR-AGT-010 | Botão "Arquivar" em agentes `active` ou `inactive`; confirmação modal obrigatória | P1 |

#### Tab Skills

| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| FR-AGT-011 | Listar Skills ACTIVE disponíveis com toggle para associar/desassociar ao agente | P0 |
| FR-AGT-012 | Skills já associadas aparecem com toggle ligado; desassociar remove de `agent_skill_assignments` | P0 |

#### Tab Apps

| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| FR-AGT-013 | Listar apps disponíveis (Fase A: Drive Suno; Fase D: extensível) com toggle conectar/desconectar | P1 |
| FR-AGT-014 | Status da conexão exibe apenas: app_type, enabled, connected_at — sem credenciais | P0 |

#### Tab Memória

| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| FR-AGT-015 | Upload de arquivos (.txt, .md, .pdf, .docx; ≤25MB/arquivo; ≤10 arquivos/agente) | P0 |
| FR-AGT-016 | Listar arquivos com: nome, tipo, tamanho, data de upload, botão de deleção | P0 |
| FR-AGT-017 | Deletar arquivo: remoção permanente do GCS e de `agent_memory_files` | P0 |
| FR-AGT-018 | Atualizar arquivo = deletar antigo + novo upload (sem PATCH em memory file) | P0 |

#### Tab Agendamento

| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| FR-AGT-019 | Configurar frequência: `hourly` ou `daily` | P0 |
| FR-AGT-020 | Para `daily`: checkboxes dias da semana (Dom–Sáb), horário (HH:MM) e timezone (default `America/Sao_Paulo`) | P0 |
| FR-AGT-021 | Para `hourly`: seleção de minuto do ciclo (0–59) e timezone | P1 |
| FR-AGT-022 | Toggle enabled/disabled sem apagar configuração | P0 |
| FR-AGT-023 | Exibir `next_run_at` e `last_run_at` | P1 |

#### Tab Atividade

| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| FR-AGT-024 | Listar `agent_runs` com: data/hora, status (running/completed/failed/timed_out), duração em ms, trigger (manual/schedule), cliente no momento da execução | P0 |
| FR-AGT-025 | Clicar em run abre detalhe inline: input, output (truncado a 500 chars + "ver mais"), erro | P1 |
| FR-AGT-026 | Paginação (20 por página) | P1 |

#### Tab Clientes

| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| FR-AGT-027 | Listar clientes com permissão (de `agent_client_permissions`): nome, data autorização, quem autorizou | P0 |
| FR-AGT-028 | "Autorizar cliente": dropdown/search de clientes ACTIVE → persiste em `agent_client_permissions` | P0 |
| FR-AGT-029 | "Revogar" por cliente: remove registro de `agent_client_permissions` | P0 |

### 3.4. Execução e Preview

| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| FR-AGT-030 | "Executar" em agentes `active`: `POST /api/agents/{id}/run` com `{triggered_by: "manual"}` → `202 {run_id}` | P0 |
| FR-AGT-031 | "Preview / Testar": painel com campo de input manual; executa sandboxed (não persiste em `agent_runs`) | P0 |
| FR-AGT-032 | Enquanto `status=running`: spinner com duração crescente; ao completar, exibe output ou erro | P0 |
| FR-AGT-033 | Agente `draft` ou `archived`: sem botão "Executar"; "Preview" disponível apenas para `draft` | P1 |

<!-- REVIEW: Preview mode (FR-AGT-031) requer backend LangGraph (Fase C). Na Fase A, o "Preview" pode ser simulado com mock output? Confirmar se frontend mock é aceitável para protótipo. -->

## 4. Requisitos Não-Funcionais

| ID | Requisito | Métrica |
|----|-----------|---------|
| NFR-AGT-001 | Listagem ≤200 agentes: ≤500ms p95 | Performance |
| NFR-AGT-002 | Upload memory file ≤25MB: ≤10s p95 | Performance |
| NFR-AGT-003 | Preview executa em ≤5min para agente com ≤3 Skills e memória ≤5MB | Performance |
| NFR-AGT-004 | 100% dos requests de Operacional a `/api/agents/*` retornam 404 | Segurança |
| NFR-AGT-005 | Execução para cliente sem `agent_client_permissions`: 404 antes de qualquer processamento LLM | Segurança |
| NFR-AGT-006 | Schedule de agente `inactive` ou `archived` é ignorado pelo runner; nunca inicia execução | Correção |

## 5. Restrições

| ID | Restrição |
|----|-----------|
| REST-AGT-01 | `data/clients.ts` é imutável — não modificar (ADR-002) |
| REST-AGT-02 | Sem novas dependências npm no frontend sem justificativa |
| REST-AGT-03 | Visual do Solar System não pode ser alterado |
| REST-AGT-04 | Sem suporte a channels (Slack, ChatGPT publish) nesta SPEC — explicitamente fora de escopo |
| REST-AGT-05 | Memory files imutáveis após upload — update = delete + re-upload |
| REST-AGT-06 | Agente `archived` não pode ser executado nem retransicionado sem ativação explícita |
| REST-AGT-07 | Schedule só funciona para agentes `active` |

## 6. Comportamento Especificado

### 6.1. Máquina de Estados do Agente

```
[draft] ──ativar──► [active] ──desativar──► [inactive]
   │                   │                        │
   │                   └────────────────────────┴──arquivar──► [archived]
   │                                                                ▲
   └──arquivar (admin)──────────────────────────────────────────────┘

Transições permitidas:
  draft     → active    (ativar)
  draft     → archived  (descartar)
  active    → inactive  (desativar)
  active    → archived  (arquivar)
  inactive  → active    (reativar)
  inactive  → archived  (arquivar)
  archived  → (nenhuma) — estado final

Schedule só dispara para agentes com status = 'active'.
Preview funciona para status = 'draft' ou 'active'.
"Executar" manual só para status = 'active'.
```

### 6.2. Fluxo de Execução Assíncrona

```
POST /api/agents/{id}/run
  ↓
1. Verificar agent.status = 'active'
2. Verificar agent_client_permissions para client_id (se informado)
3. Criar agent_run com status='pending', triggered_by=<trigger>
4. Retornar 202 { run_id }
5. BackgroundTask: executar LangGraph StateGraph
   a. Carregar skill tools (skill_slugs → LangChain tools)
   b. Carregar memory files (GCS signed URL → contexto)
   c. Executar com instructions como system prompt
   d. Atualizar agent_run com output + status='completed'/'failed'/'timed_out'

GET /api/agents/{id}/runs/{run_id}
  ↓ Polling: retorna { status, output, duration_ms, error_message }
```

### 6.3. Idempotência de Schedule

```
Índice único parcial:
CREATE UNIQUE INDEX idx_agent_runs_schedule_idem
  ON agent_runs(agent_id, scheduled_run_at)
  WHERE triggered_by = 'schedule';

Cloud Scheduler dispara POST /api/agents/{id}/run?scheduled_for=<ISO8601>
Backend resolve scheduled_run_at = scheduled_for.
Se já existir run (completed/running), retornar 200 { status: "already_run", run_id }.
```

## 7. Critérios de Aceite

**CA-01**: DADO usuário com role `operacional` tentando acessar `/api/agents`, QUANDO envia request autenticado, ENTÃO recebe `404 {"detail":"Not found"}`.

**CA-02**: DADO admin criando agente em `/agentes/new`, QUANDO preenche nome, ícone, instruções e clica "Criar", ENTÃO é redirecionado para `/agentes/[agentId]` e o agente aparece com status "Draft" na listagem.

**CA-03**: DADO agente `draft` no editor, QUANDO admin muda status para `active` e salva, ENTÃO o badge na listagem muda para "Ativo" e o botão "Executar" aparece.

**CA-04**: DADO agente `active` com cliente autorizado, QUANDO admin clica "Executar", ENTÃO recebe `202 {run_id}` e o spinner de progresso aparece na Tab Atividade.

**CA-05**: DADO agente `active` sem `agent_client_permissions` para clienteX, QUANDO execução é disparada com `client_id=clienteX`, ENTÃO backend retorna `404` antes de qualquer chamada ao LLM.

**CA-06**: DADO Tab Memória com 10 arquivos já carregados (limite atingido), QUANDO admin tenta fazer upload do 11º arquivo, ENTÃO UI exibe mensagem de erro "Limite de 10 arquivos atingido" e não permite o upload.

**CA-07**: DADO Tab Agendamento com frequência `daily`, QUANDO admin configura horário 08:00 America/Sao_Paulo e dias Seg–Sex, ENTÃO `next_run_at` exibido é o próximo dia útil às 08:00 -03:00.

**CA-08**: DADO agente `archived`, QUANDO admin acessa o editor, ENTÃO todos os campos estão em modo read-only e os botões "Executar", "Editar", "Arquivar" não aparecem ou estão desabilitados.

**CA-09**: DADO schedule configurado e ativo, QUANDO Cloud Scheduler dispara o mesmo `scheduled_run_at` duas vezes (retry), ENTÃO apenas um `agent_run` é criado (idempotência via índice único parcial).

**CA-10**: DADO Tab Clientes, QUANDO admin autoriza um cliente ACTIVE via dropdown, ENTÃO cliente aparece na lista com data de autorização e nome do admin que autorizou.

**CA-11**: DADO Tab Skills, QUANDO admin associa uma Skill ao agente, ENTÃO a Skill aparece com toggle ligado e, ao executar o agente, essa Skill está disponível como tool no LangGraph.

**CA-12**: DADO agente com memory file carregado, QUANDO admin deleta o arquivo, ENTÃO o arquivo é removido do GCS e desaparece da lista na Tab Memória. Execuções futuras não têm mais acesso a esse arquivo.

**CA-13**: DADO Preview mode com agente `draft`, QUANDO admin insere input e executa, ENTÃO resultado aparece no painel de preview e nenhum `agent_run` é criado na Tab Atividade.

**CA-14**: DADO execução de agente que excede 10 minutos, QUANDO o timeout é atingido, ENTÃO `agent_run.status` é atualizado para `timed_out` e o frontend exibe mensagem de timeout.

**CA-15**: DADO listagem com filtro por status `inactive`, QUANDO aplicado, ENTÃO apenas agentes com `status='inactive'` aparecem nos cards.
