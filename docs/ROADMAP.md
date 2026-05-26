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
- [ ] Error handling robusto no backend (timeout, rate limit, backoff)
- [ ] CI/CD: GitHub Actions (lint, pytest, type-check, build)
- [ ] Deploy staging em Cloud Run
- [ ] Smoke test staging (5 dias consecutivos sem falha bloqueante)
- [ ] Frontend: endpoints batch (TextGen, ImageGen panels)
- [ ] Persistência de conversas entre sessões (débito P1 — PRD §4.7)
- [ ] Testes de integração com API keys reais (Gemini, Vertex AI)

---

## Próximas Phases — Piloto

### Phase 12: Sidebar Recentes Dinâmico
> Fase de produto: **MVP** (refinamento UX)
> SPEC-019 (sidebar-recentes): rascunho
- [ ] Rastrear navegação real do usuário
- [ ] Mostrar últimos clientes/skills visitados
- [ ] Persistir em sessionStorage

### Phase 13: Busca Global
> Fase de produto: **MVP** (refinamento UX)
> SPEC-020 (busca-global): rascunho
- [ ] Barra de busca unificada (Cmd+K)
- [ ] Busca cross-feature: skills, documentos, clientes
- [ ] Resultados agrupados por tipo
- [ ] Navegação direta do resultado

### Phase 14: Onboarding / Empty States
> Fase de produto: **Piloto** (gate de adoção — PRD §5.7)
- [ ] Welcome screen para primeiro uso
- [ ] Empty states ricos em todas as páginas admin
- [ ] Guia de getting started

### Phase 15: Refinamentos Solar ↔ Admin
> Fase de produto: **MVP** (refinamento visual — PRD §1.4)
> ⚠️ `data/clients.ts` permanece estático (ADR-002). Sync é manual, documentado no runbook.
- [ ] Sistema Solar reflete Skills e Moons reais do SkillsContext (leitura)
- [ ] Moons do Chat carregam dinamicamente por Skill ativo
- [ ] Polish visual: estados de loading, transições, empty states no solar

### Phase 16: Multimodal — Image Editor + VideoGen
> Fase de produto: **Piloto** (Image) + **MVP** (Video) — bloqueado por **DEC-06** (business case)
> SPEC-008 (image-editor) + SPEC-009 (video-generation): rascunho
- [ ] Image generation real: Vertex AI Imagen 4 / Nano Banana (sai do mock)
- [ ] Image editor: inpainting / outpainting
- [ ] Image enhance: upscale x2/x4
- [ ] Video generation: Vertex AI Veo 3.1 ← requer DEC-06 aprovado

### Phase 17: Workflow Builder Visual — Canvas Drag-and-Drop
> Fase de produto: **Piloto** (ADR-003 — canvas para PX-07 Sponsor + PX-08 Builder de Área)
> SPEC-005 (workflow-builder-canvas): **em-revisao** | SPEC-003 substituido por SPEC-005
- [ ] Canvas drag-and-drop com React Flow + dagre auto-layout
- [ ] 7 node types (tool, llm, action, condition, hitl, merge, workflow)
- [ ] Edge handles com vocabulário paridade backend↔frontend
- [ ] NodeShell pattern + ARIA + focus ring
- [ ] Auto-save race-safety (`useWorkflowAutoSave`)
- [ ] Validate endpoint (DFS para ciclos + fan-in sem merge)
- [ ] Migration v1→v2 (JSONB steps → relational workflow_steps + edges)

### Phase 18: Drive Suno como Fonte de Contexto
> Fase de produto: **Protótipo** (base OAuth) → **Piloto** (cleanup reports + curadoria assistida)
> Restrito ao Drive interno da Suno (REST-08 v2, 2026-05-14). Drive de clientes externos fora de escopo.
> SPEC-006 (drive-readonly-curation): rascunho
- [ ] Conexão OAuth Google Drive (contas @sunounited)
- [ ] Sync incremental via Delta API (Google Drive Webhooks)
- [ ] ACL∩RBAC — arquivo só ingerido se usuário tem acesso no Drive
- [ ] Ingestão assíncrona com job queue
- [ ] Cleanup Report: duplicatas, arquivos sem acesso, desatualizados
- [ ] Sugestões de curadoria com aceite/rejeição manual pelo Líder

### Phase 19: Onboarding com Oráculo do Cliente
> Fase de produto: **Piloto** (wizard + seed + HITL gate PRE_ACTIVE→ACTIVE)
> SPEC-015 (onboarding-oraculo-cliente): rascunho
> Depende de: SPEC-018 status enum PRE_ACTIVE/ACTIVE/ARCHIVED em `clients`
- [ ] Wizard 4 passos: Identidade → Contexto → Validação → Ativação
- [ ] Seed ontológico: Deep Agent extrai 6 entidades (Posicionamento, Personas, Competidores, Produtos, Tom, Briefings)
- [ ] HITL gate por entidade: aprovação manual pelo PX-07 Sponsor
- [ ] PRE_ACTIVE → ACTIVE após 6/6 entidades aprovadas
- [ ] Alerta >= 72h se entidade pendente sem revisão (FR-185)

### Phase 20: Aprovação Hierárquica
> Fase de produto: **Momento 2** (pós-Piloto v1) — solicitado por Guga + Bruno Prosperi (2026-04-28)
> SPEC-004 (approval-hierarchy): rascunho
- [ ] Submissão de conteúdo gerado para validação por Aprovador
- [ ] Inbox do Aprovador com filtros por cliente/skill/urgência
- [ ] Validation Report com comparação before/after + comentários inline
- [ ] Notificação push/email ao Aprovador + ao Creator
- [ ] Histórico de aprovações por cliente

### Phase 21: Captura Seletiva de Reuniões
> Fase de produto: **Momento 2** (pós-Piloto v1) — solicitado em reunião 2026-05-14 (BR-020)
> Base técnica: transcrições Gemini Meet já em uso na Suno
> SPEC-016 (captura-seletiva-reunioes): rascunho
- [ ] Opt-in por reunião (Creator decide o que capturar)
- [ ] Transcrição via Gemini Meet com marcação de trechos relevantes
- [ ] Wiki Ontológica com HITL: Creator revisa antes de persistir na Biblioteca
- [ ] Integração com Oráculo do Cliente (FA-15) para enriquecimento de contexto

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

> IDs reservados (não criados ainda): SPEC-007 (Solar System navigation), SPEC-012, SPEC-013, SPEC-014.

### Medium Specs

| ID | Slug | Feature | Status |
|----|------|---------|:------:|
| SPEC-019 | sidebar-recentes | Phase 12 Sidebar Recentes Dinâmico | rascunho |
| SPEC-020 | busca-global | Phase 13 Busca Global Cmd+K | rascunho |

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

| Fase de Produto | Phases Técnicas | Status |
|-----------------|-----------------|:------:|
| **POC** | SPEC-010 (Moon Shot pipeline mínimo) | Em planejamento |
| **Protótipo** | Phases 1–10 concluídas + Phase 11 (gate de saída) | 90% — Phase 11 em progresso |
| **Piloto** | Phases 14, 16, 17, 18, 19 | Aguarda gate Phase 11 |
| **Momento 2** | Phases 20, 21 | Pós-Piloto v1 |
| **MVP** | Phases 12, 13, 15 + Phase 16 video + refinamentos | Q1 2027+ |

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
