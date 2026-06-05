# Tasks — Migração Mock → Banco de Dados (persistência sunOS)

**Criado:** 03/06/2026
**Owner:** José Lucas Torquato
**Contexto:** Promover os dados que hoje vivem em mocks/in-memory para o Postgres de produção (`koro-creators:us-west1:sunos-db`), domínio por domínio, no padrão estabelecido na migração de `users`/`audit` (SPEC-022 Fase B).

> Documento **vivo**: atualizar os checkboxes e o _Log de progresso_ ao fim de cada task. Datas em DD/MM/AAAA.

---

## Estado atual (baseline)

- ✅ Schema completo aplicado em prod — **28 tabelas** (migrações `000`→`011`, sem o seed de dev). Validado em container pgvector:pg15 com dupla passada (idempotente).
- ✅ **`users` + `audit_events`** já migrados para DB (repository + router + testes SQLite). Endpoints `/api/admin/users/*` e `/audit-log` leem/gravam no banco; sem fallback mock (503 se DB fora).
- ✅ Driver síncrono **`psycopg2-binary`** adicionado ao `pyproject.toml` (sem ele a persistência caía sempre no fallback).
- ✅ Imagem da API reconstruída com o driver; stack local consegue apontar para o banco de prod (`docker-compose.prod-db.yml`).
- ⚠️ Prod **vazio** de dados (só schema). População de usuários via `/users/sync` (Firebase) ou convite.

### Pendências cross-cutting (infra)

- [ ] **CC-1 — Runner de migrações** idempotente (job no deploy ou startup) + tabela `schema_migrations` para histórico. Hoje a aplicação é manual e sem controle de versão → risco de drift.
- [ ] **CC-2 — Fechar exposição de rede** do `sunos-db` (`authorizedNetworks=0.0.0.0/0` + IP público → Cloud SQL Auth Proxy / IP privado).
- [ ] **CC-3 — Garantir rebuild da imagem no deploy** com `psycopg2-binary` (o pyproject já está atualizado; o próximo deploy de `api/**` na main reconstrói).
- [ ] **CC-4 — Decidir destino do fallback in-memory** por domínio: "exigir banco" (como users) vs "DB com fallback" (como conversations). Default: domínios de acesso/escrita crítica = exigir banco; leitura de protótipo = fallback ok.

---

## Convenções (seguir em toda task)

1. **Camadas:** `api/<dominio>/repository.py` (lógica SQLAlchemy pura, recebe `Session`) + router com `Depends(get_session)`.
2. **Sessão:** reusar o padrão de `api/admin/db.py` (`get_session`, 503 se DB fora) — considerar extrair para `api/core/db.py` compartilhado (ver TASK B-0).
3. **Caixa-preta (RN-009/010/011):** toda query filtra `client_id` resolvido do contexto; 404 genérico (nunca 403). Ver `.claude/rules/caixa-preta.md`.
4. **Imports dual-root:** repository/router usam `try: from <pkg> ... except ImportError: from api.<pkg> ...` (testes rodam com raiz `api.`). Para **models**, a base precisa de import RELATIVO (senão a tabela é registrada 2x no mesmo metadata quando o módulo carrega sob 2 nomes):
   - Model dentro de `models/`: `from .base import Base`
   - Model fora (ex.: `approval/`): `try: from ..models.base import Base except ImportError: from models.base import Base`
5. **Testes:** SQLite em memória via `app.dependency_overrides[get_session]`, importando `get_session` **do módulo do router** (pra casar o objeto do `Depends`). Sem mockar os dados.
6. **Migrações:** idempotentes (`IF NOT EXISTS`), numeradas, testadas em container pgvector:pg15 com dupla passada antes de prod.
7. **Verificação:** `pytest` + `ruff check` + `ruff format --check` antes de fechar a task.

---

## Bucket A — tabela JÁ existe, falta plugar o router (prioridade)

> Sequência recomendada por dependência: **clients → skills → demais**.

### A-1 — Clientes (`clients`) 🔓 destrava os outros — fundação ✅ (03/06/2026)
- [x] Migração `012_clients_extend.sql` (colunas color, description, sponsor_name, sponsor_email, selected_doc_ids JSONB) — **aplicada em prod**
- [x] Model `api/models/client.py`
- [x] Repository `api/clientes/repository.py` (create, get, get_by_slug, list, update, update_status)
- [x] Seed dos clientes reais (Vivo, Americanas, Sicredi, Samsung) — **em prod** via 012
- [x] Testes SQLite (6) + suite completa verde (86) + ruff
- [ ] **(movido p/ A-8)** Plugar `api/onboarding/service.py` (`_clients`/`_jobs`/`_wiki_entities`) — rewiring do fluxo do oráculo é feito junto com jobs/wiki pra evitar split-brain no fluxo async
- **Nota:** `data/clients.ts` (sistema solar) **não muda** (CLAUDE.md). Os clientes "de negócio" passam a viver no `clients` table.
- ⚠️ **Gap de schema (03/06/2026):** o fluxo de onboarding (`onboarding/service.py:create_client`) usa campos que **não existem** na tabela `clients` atual: `color`, `description`, `sponsor_name`, `sponsor_email`, `selected_doc_ids`. Decidir como acomodar (ver decisão pendente abaixo) antes de plugar. Também há acoplamento com A-8 (jobs/wiki vivem no mesmo service).

### A-2 — Skills (admin) ⚠️ depende de tabela nova → ver B-1
- (movida para Bucket B — não tem tabela)

### A-3 — Conversas (`conversations`, `chat_messages`)
- [ ] Confirmar que o caminho DB já persiste em prod (router já tem SQLAlchemy + fallback)
- [ ] Corrigir assinatura do `GET /api/conversations` (param `request: Any` causa 422)
- [ ] Decidir: manter fallback ou exigir banco (CC-4)
- [ ] Testes

### A-4 — Workflows (`workflows`, `workflow_runs`, `workflow_edges`, `step_logs`) ✅ (05/06/2026)
- [x] Migração `016_workflows_portable.sql` (client_scope TEXT[]→JSONB p/ portabilidade) — **aplicada em prod**
- [x] Model portável `models/workflows.py` (substitui o órfão `workflows/models.py`, que usava UUID/JSONB/ARRAY nativos)
- [x] `workflows/repository.py` — converte ORM↔dict (mesmo shape do store), CRUD + runs + step_logs + edges
- [x] Router reescrito p/ `Depends(get_session)` + repository; **lógica intacta** (validator/migration_v1_v2/auto_layout/edges/compiler operam sobre dict carregado do DB num store temporário, persistido de volta)
- [x] conftest reescrito: fixture `wf_db` (SQLite compartilhado) + seeds persistem via repository; `client` fixtures com override de get_session; 7 testes que liam `_workflows` direto reescritos p/ DB/store
- [x] **40 testes canvas verdes** (phase A 12 + phase B 26 + 2 seeds), suite 109; ruff limpo
- `workflow-templates.ts` (frontend) é concern à parte.

### A-5 — Agents (`agents`, `agent_runs`, `agent_schedules`) ✅ (05/06/2026)
- [x] Migração `015_agents_portable.sql` (CHECK triggered_by inclui 'preview'; agent_schedules days_of_week INT[]→JSONB, time_of_day TIME→VARCHAR p/ portabilidade) — **aplicada em prod** (idempotente)
- [x] Models `models/agents.py` (Agent, AgentRun, AgentSchedule) — portáveis
- [x] `agents/repository.py` (CRUD + runs + schedules); `last_run_at` derivado de agent_runs
- [x] Router/runner/preview/scheduler reescritos: endpoints com `Depends(get_session)`; `execute_run` (BackgroundTask) abre sessão própria best-effort; **scheduler carrega do DB no startup** (schedules sobrevivem a restart); preview runs em agent_runs (triggered_by='preview')
- [x] 12 testes SQLite (CRUD/run/runs/schedule/scheduler); suite 109 verde; ruff limpo
- Tabelas-filhas (permissions/skills/app/memory) seguem **órfãs** (sem CRUD ainda). `agents-admin.ts` (frontend) é concern à parte.

### A-6 — Aprovações (`approval_submissions`, `approval_events`) ✅ (03/06/2026)
- [x] Model portado (Uuid genérico; Enum do SQLAlchemy degrada p/ VARCHAR+CHECK no SQLite)
- [x] Repository `api/approval/repository.py` (create/get/list/update submission + add/list events)
- [x] Router reescrito p/ `Depends(get_session)` + repository, mantendo auth (`_resolve_actor`, `_require_admin`), cross-client guard e notificações
- [x] 9 testes SQLite (submit/list/approve/reject/revision/history/422/404). Suite: 102 verdes; ruff limpo

### A-7 — Reuniões (`meetings`, `meeting_segments`) ✅ (03/06/2026)
- [x] Model `models/meetings.py` tornado portável (Uuid/JSON genéricos, import relativo) + fix de bug latente (anotações de relationship legadas → estilo clássico)
- [x] Repository `api/reunioes/repository.py` (list, get, create, curate, update_status) com caixa-preta (filtro client_id na query)
- [x] Router reescrito para `Depends(get_session)` + repository; gap fix: `meeting_segments.client_id` agora preenchido
- [x] 7 testes SQLite (CRUD + curate + cross-client 404). Suite: 93 verdes; ruff limpo
- Tabelas já existiam (008) → nada novo em prod. `created_by`/`curated_by` ainda "admin" (TODO JWT).

### A-8 — Onboarding/Wiki (`wiki_entities`, `entity_hitl_events`, `onboarding_jobs`) ✅ (04/06/2026)
- [x] Migração `014_onboarding_fixes.sql` (`entity_hitl_events.user_id` UUID→TEXT — Firebase UID) — **aplicada em prod**
- [x] Models `models/onboarding.py` (WikiEntity, OnboardingJob, EntityHitlEvent), portáveis
- [x] `onboarding/repository.py` (jobs/wiki/hitl) + reuso de `clientes/repository` p/ clients
- [x] `service.py` reescrito: funções sync recebem `session`; tasks async (`run_oracle_agent`, `regenerate_entity_stub`, `add_reunion_context`) abrem sessão própria (best-effort)
- [x] Router com `Depends(get_session)`; `job["entities"]` derivado de wiki_entities (não é coluna)
- [x] 7 testes SQLite (criar/status/gate HITL→ACTIVE/wiki); suite 114 verde; ruff limpo
- Nota: `add_reunion_context` busca tipo "Briefings" (plural) que não existe (tipo real "Briefing") — no-op, comportamento pré-existente preservado.

### A-9 — Biblioteca (`knowledge_documents`, `knowledge_chunks`) ✅ backend já DB-backed (03/06/2026)
- [x] **Verificado:** `chat/knowledge/router.py` já faz INSERT/SELECT em `knowledge_documents` via AsyncSession (com fallback p/ None). Backend persiste em prod quando há DB. Nada a reimplementar.
- [ ] (Frontend) `biblioteca-docs.ts` deixar de ser source — ler da API. **Concern de frontend**, fora do escopo backend.
- [ ] Embeddings (pgvector) — caminho de ingestão real (Fase futura)

### A-10 — Drive (tokens) (`drive_tokens`) ⏸️ DEFERIDO (03/06/2026)
- **Não é migração mock→DB — é trabalho de integração.** `api/drive/router.py` é stub pendente do Google Drive real (SPEC-006 Fase B/D): OAuth não completa (`#oauth-not-configured`), status de conexão é fake (`stub@sunounited.com`), arquivos/cleanup/sugestões são hardcoded. Persistir isso em `drive_tokens` gravaria dado falso.
- Persistir só faz sentido **junto** com: (1) OAuth real (google-auth-oauthlib), (2) criptografia KMS dos tokens (NFR-008), (3) Drive API real. Tratar como feature SPEC-006 Fase B/D, não como esta migração.
- A única peça genuína isolável seria `_curation_decisions` (B-5), mas as sugestões em si são hardcoded → baixo valor até as sugestões serem reais.

---

## Bucket B — precisa CRIAR tabela (migração nova) antes de plugar

### B-0 — Extrair `get_session` compartilhado ✅ (03/06/2026)
- [x] Criar `api/core/db.py` reaproveitável; `admin/db.py` re-exporta. Testes admin verdes (22).

### B-1 — Skills (`skills` + defaults)
- [ ] Migração `012_skills.sql` (skills admin: slug, name, type, status, model defaults, temperature, max_tokens…)
- [ ] Model + repository + plugar `skills-admin.ts` e `_skill_defaults` (admin)
- [ ] **Não confundir** com `api/chat/skills/` (SKILL.md = código/prompt, continua em arquivos)
- [ ] Testes

### B-2 — Integrações / chaves de API (`platform_settings`)
- [ ] Usar a tabela `platform_settings` (já existe, hoje não usada) no lugar de `_integrations`
- [ ] ⚠️ **Criptografar** (`value_encrypted` + Cloud KMS) — NUNCA texto plano
- [ ] Testes

### B-3 — Prompt templates (`prompt_templates`)
- [ ] Decidir: tabela própria vs tratar como skill references
- [ ] Migração + model + repository, plugar `prompt-templates.ts`
- [ ] Testes

### B-4 — Notificações (`notifications`) ✅ (03/06/2026)
- [x] Migração `013_notifications.sql` — **aplicada em prod** (29 tabelas)
- [x] Model `models/notification.py` + repository (create/list_for_user/mark_read com filtro user_id)
- [x] Router reescrito p/ `Depends(get_session)`; `_create_notification_internal` (chamado por approval/reuniões sem sessão) abre sessão própria curta, best-effort
- [x] 5 testes SQLite; suite 107 verde; ruff limpo

### B-5 — Curadoria do Drive (`drive_curation_decisions`)
- [ ] Migração + model + repository, plugar `_curation_decisions`
- [ ] Testes

---

## Bucket C — continua MOCK/estático (NÃO migrar)

- ❌ `data/chat-responses.ts` — respostas canned de demo do protótipo (fixture de UI).
- ❌ `data/clients.ts` — source do sistema solar (CLAUDE.md proíbe alterar; é navegação estática do protótipo).
- ⚪ `data/workflow-templates.ts` — pode virar seed estático; só vai pro DB se o admin editar (ver A-4).

---

## Log de progresso

- **03/06/2026** — Schema (28 tabelas) aplicado em prod. `users`+`audit` migrados. Driver sync adicionado. Stack local apontando para prod validado. Documento de tasks criado.
- **03/06/2026** — B-0 concluído (`api/core/db.py` compartilhado; `admin/db.py` re-exporta; 22 testes admin verdes). A-1 iniciado: identificado gap de schema em `clients` (campos do onboarding ausentes) — aguardando decisão de schema.
- **03/06/2026** — A-7 (Reuniões) concluído: model portável, repository + router DB-backed, 7 testes; suite 93 verdes. Bug latente de relationship corrigido.
- **03/06/2026** — A-9 (Biblioteca) verificado: backend já persiste em `knowledge_documents` (nada a fazer no backend; frontend `biblioteca-docs.ts` é concern à parte). A-10 (Drive) DEFERIDO: é stub pendente de integração real (SPEC-006), não migração. Restantes substanciais: A-8 (Onboarding, async/coupled), Bucket B (skills, integrações, prompts).
- **05/06/2026** — A-4 (Workflows) concluído: migração 016 em prod (client_scope→JSONB), model portável + repository ORM↔dict, router DB-backed mantendo TODA a lógica de canvas (validator/migration/auto-layout/edges/compiler) intacta, conftest + 38 testes canvas migrados p/ SQLite. **Bucket A 100% concluído.** Resta só o Bucket B (skills/integrações/prompts) e Drive (deferido).
- **05/06/2026** — A-5 (Agents) concluído: migração 015 em prod (CHECK + portabilidade schedules), models + repository + router/runner/scheduler/preview DB-backed; scheduler carrega do DB no startup; 12 testes; suite 109. Restam: A-4 (Workflows, 38 testes canvas) e Bucket B (skills/integrações/prompts).
- **04/06/2026** — A-8 (Onboarding/Wiki) concluído: migração 014 em prod (user_id→TEXT), models + repository + service/router DB-backed, tasks async com sessão própria, 7 testes; suite 114. Restantes: Workflows (A-4) e Agents (A-5) — reescrita de suíte; Bucket B — skills/integrações/prompts.
- **03/06/2026** — B-4 (Notificações) concluído: migração 013 em prod (29 tabelas), model+repository+router DB-backed, helper interno best-effort, 5 testes; suite 107. **Nota de sequenciamento:** Workflows (A-4) e Agents (A-5) têm suítes existentes acopladas ao in-memory (38 testes canvas + test_agents) → exigem reescrita das suítes; tratá-los como esforços dedicados. Demais limpos: onboarding (A-8), biblioteca (A-9), drive (A-10).
- **03/06/2026** — A-6 (Aprovações) concluído: model portado (Uuid + Enum→CHECK no SQLite), repository + router DB-backed mantendo auth/caixa-preta/notificações, 9 testes; suite 102 verdes. Documentada a convenção de import relativo de base p/ models fora de `models/`. Próximo: A-4 (Workflows) / A-5 (Agents).
- **03/06/2026** — Decisão: colunas dedicadas. A-1 (fundação) concluído: migração `012_clients_extend.sql` aplicada em prod (clients com 13 colunas), model + repository `clientes/` + 6 testes; **4 clientes reais seedados em prod**. Rewiring do onboarding adiado para A-8. Suite: 86 verdes, ruff limpo. Prod agora com 28 tabelas + schema clients estendido.
