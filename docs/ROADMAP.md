# sunOS — Roadmap

> Última atualização: 2026-05-26. Alinhado com PRD Parte 5 (v1.2, 2026-05-14) e SPECs SDD existentes.
> Fases de produto: **POC → Protótipo → Piloto → Momento 2 → MVP** (mapeamento em `docs/prd/parte5-roadmap-fases.md §1.4`).

---

## Concluído

### Phase 1: Protótipo Base (2026-03-23)
- [x] 4 níveis de navegação (Home → Cliente → Skill → Chat)
- [x] Sistema solar com metáfora orbital
- [x] Design system dark/light theme
- [x] Sidebar colapsável + Chat panel
- [x] Dados mocados (7 clientes, 8 skills, moons)

### Phase 2: AI UX Patterns (2026-03-23)
- [x] Prompt Templates no chat
- [x] Result Actions (Copy, Variação, Salvar)
- [x] Variation Cards (comparação lado a lado)
- [x] Mock streaming de respostas

### Phase 3: Admin — Skills (2026-03-24)
- [x] Catálogo de skills (`/skills`) com grid, filtros, search
- [x] Editor com 4 tabs (Identidade, Configuração, Moons, Clientes)
- [x] Criar novo skill (`/skills/new`)
- [x] Version history modal
- [x] React Context com CRUD

### Phase 4: Admin — Biblioteca (2026-03-24)
- [x] Catálogo (`/biblioteca`) com cards expandíveis
- [x] Filtros por escopo (Suno + clientes) e tags
- [x] Modal criar/editar com links e arquivos
- [x] 31 documentos mocados (10 Suno + 3 por cliente)
- [x] Integração com ContextSidebar no chat (auto-seleção por scope/tags)

### Phase 5: Human in the Loop (2026-03-24)
- [x] Feedback inline no chat (thumbs up/down + comentário)
- [x] Painel de validação no ContextSidebar (progress bar, counters, status)
- [x] Avaliação de sessão (1-5 rating)
- [x] Score médio nos SkillCards

### Phase 6: Admin — Clientes (2026-03-24)
- [x] Catálogo de clientes (`/clientes`) com grid, search
- [x] Editor com 4 tabs (Identidade, Skills, Biblioteca, Métricas)
- [x] Criar/deletar clientes
- [x] Métricas mocadas por cliente
- [x] ClientsTab no Skills editor lê do ClientsContext

### Phase 7: Navegação + Automações (2026-03-24)
- [x] Sidebar: Dashboard → Home, todos os itens com navegação
- [x] CLAUDE.md com convenções do projeto
- [x] Hooks: auto-lint, proteção de arquivos
- [x] Skills: `/new-component`, `/new-admin-page`, `/sdd-koro`
- [x] Subagent: code-reviewer
- [x] MCP: context7

### Phase 8: Backend — FastAPI + LangGraph (2026-03-26)
- [x] Monorepo: backend em `api/` (padrão Meridian Chat V2)
- [x] FastAPI + LangGraph StateGraph + BaseAgent ABC
- [x] 8 skill dirs com SKILL.md + references/ (copy-social, plano-de-midia, etc.)
- [x] 4 tools: chat (Gemini streaming), text_gen, image_gen (mock), prompt_enhance
- [x] TopSupervisor → Orchestrator (routing 2 níveis)
- [x] ContentCreator + VisualCreator + Conversational agents (ReAct)
- [x] SSE streaming via FastAPI StreamingResponse
- [x] Eval: MLflow tracing + scorers + trajectory + 20 eval datasets
- [x] SPEC-001 v2 completa (constitution, spec, design, plan, tasks)

### Phase 9: Frontend ↔ Backend Integration (2026-03-26)
- [x] `lib/api.ts` — HTTP client com `apiAvailable()` + `consumeSSE()`
- [x] `hooks/useToolStream.ts` — consome SSE real + fallback mock
- [x] ChatInterface usa API quando disponível, mock quando não
- [x] HITL feedback funciona com respostas reais
- [x] Fix SSE dedup + normalize Gemini content format

### Phase 10: Auth + RBAC (2026-03-26)
- [x] Firebase Google Auth com login page
- [x] Auth JWT em requests à API
- [x] User profile no sidebar
- [x] RBAC com Firebase Custom Claims (admin/creator roles)
- [x] AuthGuard + AuthProvider + AppShell components

---

## Em Progresso

### Phase 11: Polish + Deploy ← gate de saída do Protótipo
> Fase de produto: **Protótipo → Piloto**
- [x] Error handling robusto no backend (timeout, rate limit, backoff) — `api/core/retry.py`
- [x] CI/CD: GitHub Actions (lint, pytest, type-check, build) — `.github/workflows/`
- [x] Deploy staging em Cloud Run — `deploy-staging.yml`
- [ ] Smoke test staging (5 dias consecutivos sem falha bloqueante) — operacional
- [x] Frontend: endpoints batch (TextGen, ImageGen panels) — `ChatInterface + TextGenPanel + ImageGenPanel`
- [x] Persistência de conversas entre sessões — `ChatInterface.tsx` + `getConversation` em `lib/api.ts`
- [x] Testes de integração com API keys reais — `test_agents.py` + `test_admin.py` (79/79, key via env)

---

## Também Concluído (descoberto na auditoria 2026-05-26)

### Phase 12: Sidebar Recentes Dinâmico (2026-05-26)
> Fase de produto: **MVP** (refinamento UX)
> SPEC-019 (sidebar-recentes)
- [x] Rastrear navegação real do usuário — `hooks/useNavigationHistory.ts`
- [x] Mostrar últimos clientes/skills visitados — `components/layout/Sidebar.tsx` usa `useNavigationHistory`
- [x] Persistir em sessionStorage — `useNavigationHistory` lê/escreve `sessionStorage` com fallback silencioso

### Phase 13: Busca Global (2026-05-26)
> Fase de produto: **MVP** (refinamento UX)
> SPEC-020 (busca-global)
- [x] Barra de busca unificada (Cmd+K) — `components/layout/AppShell.tsx` listener `metaKey+k`
- [x] Busca cross-feature: skills, documentos, clientes — `hooks/useGlobalSearch.ts` consulta SkillsContext + ClientsContext + BibliotecaContext
- [x] Resultados agrupados por tipo — `GlobalSearch.tsx` agrupa por `client`, `skill`, `document`
- [x] Navegação direta do resultado — `navigateSelected()` usa `router.push(item.href)`

### Phase 15: Refinamentos Solar ↔ Admin (2026-05-26)
> Fase de produto: **MVP** (refinamento visual — PRD §1.4)
> ⚠️ `data/clients.ts` permanece estático (ADR-002). Sync é manual, documentado no runbook.
- [x] Sistema Solar reflete Skills e Moons reais do SkillsContext (leitura) — `app/[clientSlug]/page.tsx` usa `useSkills()` para filtrar skills ativas por cliente
- [x] Moons do Chat carregam dinamicamente por Skill ativo — `app/[clientSlug]/[skillSlug]/page.tsx` prefere moons do SkillsContext
- [x] Polish visual: estados de loading, transições, empty states no solar — `app/[clientSlug]/page.tsx` tem `useState(loading)` com skeleton + empty state quando não há skills ativas

### Phase 17: Workflow Builder Visual — Canvas Drag-and-Drop (2026-05-26)
> Fase de produto: **Piloto** (ADR-003 — canvas para PX-07 Sponsor + PX-08 Builder de Área)
> SPEC-005 (workflow-builder-canvas): **em-revisao** | SPEC-003 substituido por SPEC-005
- [x] Canvas drag-and-drop com React Flow + dagre auto-layout — `components/workflows/canvas/WorkflowCanvas.tsx`
- [x] 7 node types (tool, llm, action, condition, hitl, merge, workflow) — `components/workflows/canvas/nodes/` (ToolNode, LLMNode, ActionNode, ConditionNode, HITLNode, MergeNode, SubWorkflowNode)
- [x] Edge handles com vocabulário paridade backend↔frontend — `ALLOWED_SOURCE_HANDLES_BY_TYPE` em `api/workflows/validator.py` e `NodeShell.tsx` (out/error/then/else/approved/rejected/modified, target sempre `in`)
- [x] NodeShell pattern + ARIA + focus ring — `components/workflows/canvas/nodes/NodeShell.tsx`
- [x] Auto-save race-safety (`useWorkflowAutoSave`) — `hooks/useWorkflowAutoSave.ts` com `useRef` para latest payload
- [x] Validate endpoint (DFS para ciclos + fan-in sem merge) — `api/workflows/validator.py` com DFS 3-color (`has_cycle` + `cycle_edges`)
- [x] Migration v1→v2 (JSONB steps → relational workflow_steps + edges) — `api/migrations/003_workflow_canvas_v2.sql` + `api/workflows/migration_v1_v2.py`

---

## Próximas Phases — Em Progresso/Piloto

### Phase 14: Onboarding / Empty States
> Fase de produto: **Piloto** (gate de adoção — PRD §5.7)
- [x] Welcome screen para primeiro uso — `components/solar/WelcomeScreen.tsx` renderizado em `app/page.tsx` (estado sem clientes)
- [x] Empty states ricos em todas as páginas admin — `EmptyState` com ícone + título + CTA em Skills, Clientes e Biblioteca
- [ ] Guia de getting started — nenhuma página ou componente de guia interativo implementado

> ⚠️ Pendente: guia de getting started (nem página nem componente encontrado)

### Phase 16: Multimodal — Image Editor + VideoGen
> Fase de produto: **Piloto** (Image) + **MVP** (Video) — bloqueado por **DEC-06** (business case)
> SPEC-008 (image-editor) + SPEC-009 (video-generation): rascunho
- [ ] Image generation real: Vertex AI Imagen 4 / Nano Banana (sai do mock)
- [ ] Image editor: inpainting / outpainting
- [ ] Image enhance: upscale x2/x4
- [ ] Video generation: Vertex AI Veo 3.1 ← requer DEC-06 aprovado

### Phase 18: Drive Suno como Fonte de Contexto
> Fase de produto: **Protótipo** (base OAuth) → **Piloto** (cleanup reports + curadoria assistida)
> Restrito ao Drive interno da Suno (REST-08 v2, 2026-05-14). Drive de clientes externos fora de escopo.
> SPEC-006 (drive-readonly-curation): rascunho
- [x] Conexão OAuth Google Drive (contas @sunounited) — `api/drive/router.py` (auth/callback endpoints) + DriveTab no editor de cliente (admin-only); `/configuracoes/drive` redireciona para `/configuracoes` (SPEC-022)
- [ ] Sync incremental via Delta API (Google Drive Webhooks) — router stub (`sync_started` hardcoded, `changes.list` não implementado)
- [ ] ACL∩RBAC — arquivo só ingerido se usuário tem acesso no Drive — não implementado
- [ ] Ingestão assíncrona com job queue — stub; nenhuma fila real (Celery/Cloud Tasks) conectada
- [ ] Cleanup Report: duplicatas, arquivos sem acesso, desatualizados — não implementado
- [ ] Sugestões de curadoria com aceite/rejeição manual pelo Líder — não implementado

> ⚠️ Pendente: 5 de 6 itens. Apenas OAuth base implementada (Fase A). Itens Piloto (Fases B–E) aguardam DEC-02/REST-08.

### Phase 19: Onboarding com Oráculo do Cliente
> Fase de produto: **Piloto** (wizard + seed + HITL gate PRE_ACTIVE→ACTIVE)
> SPEC-015 (onboarding-oraculo-cliente): rascunho
> Depende de: SPEC-018 status enum PRE_ACTIVE/ACTIVE/ARCHIVED em `clients`
- [x] Wizard 4 passos: Identidade → Contexto → Validação → Ativação — `components/onboarding/WizardContainer.tsx` + WizardStep1..4; páginas em `app/clientes/[clientId]/onboarding/` (progress + validate)
- [ ] Seed ontológico: Deep Agent extrai 6 entidades (Posicionamento, Personas, Competidores, Produtos, Tom, Briefings) — `api/onboarding/service.py` usa mock LLM ("Real LangGraph agent deferred"); geração de conteúdo é placeholder
- [x] HITL gate por entidade: aprovação manual pelo PX-07 Sponsor — `EntityValidationCard.tsx` + `app/.../onboarding/validate/page.tsx` com accept/reject por entidade
- [x] PRE_ACTIVE → ACTIVE após 6/6 entidades aprovadas — validate/page.tsx verifica `acceptedCount === 6`, dispara transição e redireciona para wiki
- [ ] Alerta >= 72h se entidade pendente sem revisão (FR-185) — nenhuma lógica de alerta por tempo encontrada (nem frontend nem backend)

> ⚠️ Pendente: Deep Agent real (LLMGraphTransformer) e alerta FR-185 (>= 72h sem revisão)

### Phase 20: Aprovação Hierárquica
> Fase de produto: **Momento 2** (pós-Piloto v1) — solicitado por Guga + Bruno Prosperi (2026-04-28)
> SPEC-004 (approval-hierarchy): rascunho
- [x] Submissão de conteúdo gerado para validação por Aprovador — `ApprovalsContext` com CRUD + `app/aprovacoes/page.tsx` + `app/aprovacoes/[submissionId]/page.tsx`
- [x] Inbox do Aprovador com filtros por cliente/skill/urgência — `AprovacaoFilters.tsx` com filtros por `client_id`, `skill_slug`, `urgency`; `AprovacaoCard.tsx` para listagem
- [ ] Validation Report com comparação before/after + comentários inline — página exibe o conteúdo submetido e `CommentThread` com histórico de eventos, mas sem comparação before/after estruturada
- [ ] Notificação push/email ao Aprovador + ao Creator — não implementado (nenhum envio de email ou push no `api/approval/`)
- [ ] Histórico de aprovações por cliente — inbox filtrável inclui aprovadas/rejeitadas; sem página dedicada de histórico por cliente

> ⚠️ Pendente: comparação before/after no Validation Report, notificações push/email, e histórico paginado por cliente

### Phase 21: Captura Seletiva de Reuniões
> Fase de produto: **Momento 2** (pós-Piloto v1) — solicitado em reunião 2026-05-14 (BR-020)
> Base técnica: transcrições Gemini Meet já em uso na Suno
> SPEC-016 (captura-seletiva-reunioes): rascunho
> ⚠️ **Decisão 2026-05-26:** Reuniões são sub-feature de Biblioteca (filtro/tipo), não nav item próprio. `/reunioes` redireciona para `/biblioteca`. Curadoria em `/reunioes/[id]` permanece.
- [x] Opt-in por reunião (Creator decide o que capturar) — `components/reunioes/OptInModal.tsx` com opt-in explícito por reunião
- [x] Transcrição via Gemini Meet com marcação de trechos relevantes — `api/chat/ingestion/video_processor.py` usa `gemini-1.5-flash` multimodal; `TranscricaoPanel.tsx` + `TrechoCard.tsx` no frontend
- [x] Wiki Ontológica com HITL: Creator revisa antes de persistir na Biblioteca — `components/wiki/WikiPanel.tsx` + `WikiEntityCard.tsx`; curation page em `app/reunioes/[reuniaoId]/page.tsx` envia trechos para revisão HITL antes de entrar na Biblioteca
- [ ] Integração com Oráculo do Cliente (FA-15) para enriquecimento de contexto — nenhuma integração entre reuniões e oráculo encontrada
- [x] Integração visual na Biblioteca: filter "Reuniões" em `selectedTypes` + cards de reunião na BibliotecaTable/Grid — `BibliotecaSidebar.tsx` tem tipo `{ key: 'reuniao', label: 'Reuniões' }` em `selectedTypes`

> ⚠️ Pendente: integração com Oráculo do Cliente (FA-15) para enriquecimento de contexto de reunião

### Phase 22: Agentes de IA
> Fase de produto: **Piloto** (FA-17) — solicitado 2026-05-26
> SPEC-021 (agentes): **rascunho**
- [x] Listagem e CRUD de agentes (`/agentes`) — `app/agentes/page.tsx` + `app/agentes/[agentId]/page.tsx` + `app/agentes/new/` com AgentesCards + AgentDrawer
- [x] Editor completo com 7 tabs (Configuração, Skills, Apps, Memória, Agendamento, Atividade, Clientes) — `components/admin/agentes/AgenteEditorTabs.tsx` + 7 tabs em `tabs/`
- [ ] Upload file-based de memória contextual (GCS) — `api/agents/memory.py` explicitamente adia para Fase D (TASK-D06); `MemoriaTab.tsx` exibe arquivos mas sem upload real para GCS
- [ ] Schedule: hourly/daily com seleção de dias/horário/timezone — `AgendamentoTab.tsx` e `schemas.py` modelam `frequency: hourly|daily`, mas `api/agents/router.py` só aceita triggers `manual`/`preview`; agendamento não executado
- [x] Runtime LangGraph: Skills como tools, memory files como contexto — `api/agents/graph.py` usa `StateGraph` LangGraph + `skill_loader.py` como tools
- [x] Preview sandboxed + execução manual + activity log — `api/agents/preview.py` (TTL 1h) + `AtividadeTab.tsx` com paginação e status de runs
- [ ] Cloud Scheduler (Fase D — PRE-01 e PRE-04 resolvidos) — `api/agents/scheduler.py` não existe; nenhuma integração com Cloud Scheduler

> ⚠️ Pendente: GCS upload de memória (Fase D), agendamento real (Cloud Scheduler/APScheduler), runtime de schedule

### Phase 23: Configurações Admin
> Fase de produto: **Piloto** (FA-12 expansão) — solicitado 2026-05-26
> SPEC-022 (configuracoes-admin): **rascunho**
- [x] `/configuracoes` → admin panel com 4 seções: Usuários/RBAC, Integrações Globais, Skills/Modelos, Auditoria — `app/configuracoes/page.tsx` com tabs Usuários, Integrações, Skills/Modelos, Auditoria
- [x] Drive OAuth migra de `/configuracoes/drive` para aba "Drive" no editor de cliente — `app/configuracoes/drive/page.tsx` redireciona para `/configuracoes`; `ClientEditor.tsx` tem tab "Drive" (admin-only)
- [x] Gestão de usuários: listar, convidar, editar papel, suspender via Firebase Admin SDK — `UsuariosTab.tsx` lista usuários, convida por email, edita papel; Firebase Admin SDK verificação adiada para Fase B (`AuditoriaTab` nota "Firebase Custom Claim deferred")
- [x] Integrações globais: Gemini API Key (Fase A) + extensível — `IntegracoesTab.tsx` implementado
- [x] Defaults de modelo LLM por skill (editável inline) — `SkillsDefaultsTab.tsx` com edição inline de `model`, `temperature`, `max_tokens`
- [x] Audit log append-only — `AuditoriaTab.tsx` com tabela read-only ("Tabela read-only — sem ações de edição ou exclusão (append-only)")

> ⚠️ Pendente: verificação real via Firebase Admin SDK (Fase B — hoje gestão de usuários é mock in-memory)

---

## SDD Specs

### Large Specs (5 artefatos cada)

| ID | Slug | Feature | Status | Fase de Produto |
|----|------|---------|:------:|----------------|
| SPEC-001 | sunohub-tools-integration | FA-03 Skills + FA-04 Chat + Backend LangGraph | implementada | Protótipo (Phase 8) |
| SPEC-002 | knowledge-biblioteca-v2 | FA-01 Biblioteca v2 — governança, pgvector, grafo | rascunho | Protótipo → Piloto |
| SPEC-003 | workflow-builder | FA-05 Workflows base JSONB | **substituido** → SPEC-005 | — |
| SPEC-004 | approval-hierarchy | FA-13 Aprovação Hierárquica | rascunho | Momento 2 (Phase 20) |
| SPEC-005 | workflow-builder-canvas | FA-05 Workflows — canvas drag-and-drop (ADR-003) | **em-revisao** | Piloto (Phase 17) |
| SPEC-006 | drive-readonly-curation | FA-14 Drive Suno como fonte read-only | rascunho | Protótipo → Piloto (Phase 18) |
| SPEC-008 | image-editor | FA-08 Multimodal — Image gen + editor + enhance | rascunho | Piloto (Phase 16) — bloqueado DEC-06 |
| SPEC-009 | video-generation | FA-08 Multimodal — Video Veo 3.1 | rascunho | MVP (Phase 16) — bloqueado DEC-06 |
| SPEC-010 | moon-shot | FA-02 Moon Shot — pipeline Explorer↔Crítico | rascunho | POC → Piloto |
| SPEC-011 | ux-redesign | FA-12 Admin UX redesign (pattern Model Repo) | rascunho | Protótipo (parcial) |
| SPEC-015 | onboarding-oraculo-cliente | FA-15 Onboarding com Oráculo do Cliente | rascunho | Piloto (Phase 19) |
| SPEC-016 | captura-seletiva-reunioes | FA-16 Captura Seletiva de Reuniões via Gemini Meet | rascunho | Momento 2 (Phase 21) |
| SPEC-017 | skills-admin | FA-12-01 Skills Admin — CRUD DB + RBAC + audit | rascunho | Piloto |
| SPEC-018 | clientes-admin | FA-12-03 Clientes Admin — status enum + junction skill_clients | rascunho | Piloto |
| SPEC-021 | agentes | FA-17 Agentes de IA — global com permissão por cliente, LangGraph runtime, schedule | rascunho | Piloto |

> IDs reservados (não criados ainda): SPEC-007 (Solar System navigation), SPEC-012, SPEC-013, SPEC-014.

### Medium Specs

| ID | Slug | Feature | Status |
|----|------|---------|:------:|
| SPEC-019 | sidebar-recentes | Phase 12 Sidebar Recentes Dinâmico | implementada |
| SPEC-020 | busca-global | Phase 13 Busca Global Cmd+K | implementada |
| SPEC-022 | configuracoes-admin | Admin panel /configuracoes — RBAC, integrações, defaults, auditoria; Drive → editor de cliente | implementada (parcial: Firebase Admin SDK pendente) |

### Legacy Design Specs (pré-SDD, sem artefato constitution)

| Spec | Feature | Fase |
|------|---------|------|
| `2026-03-23-sunos-prototype-design.md` | Protótipo base | Phase 1 |
| `2026-03-23-phase2-ai-ux-patterns-design.md` | AI UX Patterns | Phase 2 |
| `2026-03-23-bioma-zero-design.md` | Skills admin (original, precede SPEC-017) | Phase 3 |
| `2026-03-24-biblioteca-design.md` | Biblioteca | Phase 4 |
| `2026-03-24-hitl-feedback-design.md` | Human in the Loop | Phase 5 |
| `2026-03-24-clientes-admin-design.md` | Clientes admin (original, precede SPEC-018) | Phase 6 |

---

## Mapeamento Fase de Produto ↔ Phases Técnicas

> Última auditoria de código: 2026-05-26

| Fase de Produto | Phases Técnicas | Status |
|-----------------|-----------------|:------:|
| **POC** | SPEC-010 (Moon Shot pipeline mínimo) | Em planejamento |
| **Protótipo** | Phases 1–11 concluídas | ✅ 100% — gate Protótipo completo (smoke test staging pendente ops) |
| **MVP (UX)** | Phase 12 ✅ completa, Phase 13 ✅ completa, Phase 15 ✅ completa | Implementadas |
| **Piloto** | Phase 14 ⚠️ (falta guia de getting started), Phase 16 ⛔ bloqueada DEC-06, Phase 17 ✅ completa, Phase 18 ⚠️ (só OAuth base), Phase 19 ⚠️ (falta Deep Agent real + alerta 72h), Phase 22 ⚠️ (falta GCS + schedule runtime), Phase 23 ⚠️ (falta Firebase Admin SDK real) | Parcialmente implementadas |
| **Momento 2** | Phase 20 ⚠️ (falta notificações + before/after + histórico), Phase 21 ⚠️ (falta integração Oráculo FA-15) | Parcialmente implementadas |

---

## Bloqueadores Ativos

| ID | Bloqueador | Impacto |
|----|-----------|---------|
| **DEC-06** | Business case não aprovado (Guga + Ronaldo) | Bloqueia Phase 16 inteira (image editor real + video) |
| **DEC-02** | Workflows (FA-05) entram no Piloto ou só MVP? | Condiciona priorização de Phase 17 |
| **REST-01** | Time não-dedicado 100% | Buffer de 30% sobre todas as estimativas das SPECs |
| **REST-08 v2** | Drive Suno restrito a @sunounited (acordado 2026-05-14) | Phase 18 descartou Drive de clientes externos |

---

## SDD Usage Log

Ver `docs/specs/_log/usage-log.md` para histórico de specs geradas e scores.
