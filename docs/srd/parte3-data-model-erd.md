---
documento: SRD Parte 3 - Data Model ERD
projeto: sunOS
cliente: Suno United Creators (uso 100% interno)
versao: 1.0
data_criacao: 2026-04-28
ultima_atualizacao: 2026-04-28
autor: Heitor Miranda + Claude (Koro Docs Pipeline)
status: Rascunho
fonte_prd: docs/prd/parte1-feature-map.md
fonte_brd: docs/brd/parte3-requisitos.md, docs/brd/parte4-regras.md
fonte_srd: docs/srd/parte1-NFRs.md, docs/srd/parte2-domain-model.md, docs/srd/parte5-arch-as-is.md, docs/srd/parte7-ADRs.md
fonte_codigo: api/migrations/001_knowledge_tables.sql, api/migrations/002_workflow_tables.sql, api/models/conversation.py, api/models/knowledge.py
total_entidades: 41 (7 existentes + 34 novas/propostas — incluindo 9 para BC-07 Approval & Validation)
---

# SRD Parte 3 — Data Model ERD

## 1. Introdução

### 1.1. Objetivo

Este documento traduz os **Bounded Contexts e Aggregates** do Domain Model (Parte 2) em **schema lógico/físico PostgreSQL** para o sunOS, descrevendo tabelas, colunas, tipos (com precisão para PostgreSQL: `UUID`, `JSONB`, `vector(768)`, `timestamptz`, `numeric`), chaves primárias, estrangeiras, índices críticos e relacionamentos.

O modelo é dividido em:

- **Tabelas existentes** já em produção/staging — inferíveis de `api/migrations/001_knowledge_tables.sql`, `002_workflow_tables.sql`, `api/models/conversation.py`, `api/models/knowledge.py`
- **Tabelas novas necessárias** para cobrir BRs ainda não cobertas (especialmente BR-013 mensuração de custo evitado, BR-014 detecção de homogeneização, BR-007/009/012 RBAC + auditoria, BC-04 Shoot for the Moon, BC-05 Measurement)
- **pgvector tables** para embeddings (Biblioteca + Briefing semantic distance)

### 1.2. Escopo

- **Nível**: Lógico/Físico (PostgreSQL Cloud SQL com extensão pgvector — ver ADR-003)
- **Foco**: Estrutura de dados; restrições essenciais; índices críticos para NFRs (especialmente NFR-003)
- **Base**: Domain Model (SRD Parte 2)
- **Fora de escopo**: DDL completo de partitioning/sharding, scripts de migração detalhados (ficam em `api/migrations/`)

### 1.3. Relação com Outros Artefatos

| Artefato | Relação |
|----------|---------|
| Domain Model (Parte 2) | Cada Aggregate Root vira ≥1 tabela; Entities internas viram tabelas filhas |
| BRD Parte 3/4 | Tabelas suportam BRs/RNs (especialmente RN-006, RN-009, RN-010, RN-013, RN-018, RN-019) |
| FRs (PRD Parte 4) | Tabelas suportam requisitos funcionais |
| Arch As-Is (Parte 5) | Identifica o que existe |
| Arch To-Be (Parte 6) | Identifica o que vai existir |
| ADR-003 (pgvector) | Justifica decisão de manter PostgreSQL+pgvector único |

### 1.4. Convenções

- **ENT-XX**: Entidade de dados (tabela)
- **Tipo**: Core | Auxiliar | Config | Log | Vector | Materialized
- **Estado**: `Existente` (já em código/migrations) | `Novo` (proposto neste SRD) | `Evoluído` (existe mas sofre alteração)
- Atributos em **snake_case**
- PKs e FKs claramente identificadas
- Tipos PostgreSQL: `UUID` (com `gen_random_uuid()` ou `uuid_generate_v4()`), `TEXT`, `VARCHAR(N)`, `JSONB`, `JSON`, `TIMESTAMPTZ`, `NUMERIC(P,S)`, `vector(768)`, `BIGINT`, `INTEGER`, `BOOLEAN`, `TEXT[]` (ARRAY)

---

## 2. Catálogo de Entidades

### 2.1. Entidades Existentes (5 tabelas)

| ID | Tabela | Tipo | Origem (código) | Aggregate (Parte 2) | Estado |
|----|--------|------|-----------------|---------------------|--------|
| ENT-01 | `conversations` | Core | `models/conversation.py` | Conversation | Existente |
| ENT-02 | `chat_messages` | Core | `models/conversation.py` | Conversation (Turn) | Existente |
| ENT-03 | `knowledge_documents` | Core | `migrations/001` + `models/knowledge.py` | KnowledgeItem | Existente |
| ENT-04 | `knowledge_chunks` | Vector | `migrations/001` + `models/knowledge.py` | KnowledgeItem (Chunk) | Existente |
| ENT-05 | `workflows` | Core | `migrations/002` | Workflow | Existente |
| ENT-06 | `workflow_runs` | Core | `migrations/002` | Workflow (Run) | Existente |
| ENT-07 | `step_logs` | Log | `migrations/002` | Workflow (StepLog) | Existente |

### 2.2. Entidades Novas (25 tabelas propostas)

| ID | Tabela | Tipo | Aggregate | BR/RN suportada |
|----|--------|------|-----------|-----------------|
| ENT-08 | `users` | Core | User | BR-007, RN-009 |
| ENT-09 | `roles` | Config | User | BR-007, RN-009 |
| ENT-10 | `user_roles` | Auxiliar | User | BR-007, RN-009 |
| ENT-11 | `user_profiles` | Core | User | BR-012, RN-017 |
| ENT-12 | `audit_log` | Log | AuditEntry | BR-007, BR-009, RN-012 |
| ENT-13 | `clients` | Core | Client | BR-005, BR-008, RN-007 |
| ENT-14 | `biomas` | Config | Client | BR-006 |
| ENT-15 | `client_users` | Auxiliar | Client + User | RN-010 |
| ENT-16 | `skills` | Core | Skill | BR-002, BR-007, BR-015 |
| ENT-17 | `skill_versions` | Core | Skill (SystemPrompt) | BR-007, RN-009 |
| ENT-18 | `moons` | Config | Skill (Moon) | BR-002 |
| ENT-19 | `skill_baselines` | Config | Skill (TimeBaseline) | BR-013, RN-018 |
| ENT-20 | `knowledge_graph_edges` | Vector | KnowledgeGraphNode | BR-001, BR-004 |
| ENT-21 | `ingestion_jobs` | Log | IngestionJob | BR-004, NFR-007 |
| ENT-22 | `risk_flags` | Log | RiskFlag | BR-005, RN-008 |
| ENT-23 | `briefs` | Core | Brief | BR-001, RN-003 |
| ENT-24 | `provocations` | Core | Spark/Provocation | BR-001, RN-001, RN-002 |
| ENT-25 | `explorer_runs` | Log | ExplorerRun | BR-001, RN-002 |
| ENT-26 | `critic_reviews` | Log | CriticReview | BR-001, RN-002 |
| ENT-27 | `traces` | Log | Trace | BR-009, RN-013, NFR-026 |
| ENT-28 | `scores` | Log | Score (HITL) | BR-014 |
| ENT-29 | `avoided_costs` | Materialized | AvoidedCost | BR-013, RN-018 |
| ENT-30 | `diversity_metrics` | Materialized | DiversityMetric | BR-014, RN-019, RN-020 |
| ENT-31 | `executive_reports` | Materialized | ExecutiveReport | BR-003, RN-005 |
| ENT-32 | `safety_alerts` | Log | SafetyAlert | BR-014, RN-019 |
| ENT-33 | `reflection_moments` | Log | ReflectionMoment | BR-010, RN-015 |
| ENT-34 | `approval_chains` | Config | ApprovalChain | BR-017, RN-024, RN-026 |
| ENT-35 | `approval_chain_levels` | Auxiliar | ApprovalChain | BR-017, RN-024, RN-026 |
| ENT-36 | `approval_requests` | Core | ApprovalRequest | BR-017, RN-023, RN-024, RN-025 |
| ENT-37 | `approval_decisions` | Log | ApprovalDecision | BR-017, RN-024 |
| ENT-38 | `validation_reports` | Core | ValidationReport | BR-017, RN-023 |
| ENT-39 | `drive_oauth_credentials` | Config | OAuthCredential | BR-018, RN-027 |
| ENT-40 | `drive_syncs` | Core | DriveSync | BR-018, RN-027, RN-030 |
| ENT-41 | `drive_documents` | Core | DriveDocument | BR-018, RN-027, RN-028 |
| ENT-42 | `curation_suggestions` | Core | CurationSuggestion | BR-018, RN-029 |
| ENT-43 | `drive_cleanup_reports` | Materialized | DriveCleanupReport | BR-018, RN-029 |

> **Total: 43 entidades** (7 existentes + 36 novas — incluindo 10 para BC-07).

---

## 3. Especificação por Entidade

### 3.1. Entidades Existentes

#### ENT-01 — `conversations` (Existente)

**Origem**: `api/models/conversation.py`

**Atributos**

| Atributo | Tipo | Constraints | Observações |
|----------|------|-------------|-------------|
| `id` | `VARCHAR` (string UUID) | PK | Default `uuid4()` |
| `user_id` | `VARCHAR` | NOT NULL | FK lógica → `users.user_id` (a criar) |
| `skill_slug` | `VARCHAR` | NULL | Skill ativa |
| `title` | `VARCHAR` | NULL | Título da sessão |
| `state` | `JSON` | NULL | Persisted LangGraph state |
| `created_at` | `TIMESTAMP` | NOT NULL | UTC |
| `last_message_at` | `TIMESTAMP` | NULL | Atualizado por trigger |

**Evolução proposta** (To-Be):
- `id` migrar para `UUID` nativo
- Adicionar `client_id UUID` FK → `clients(client_id)` (RN-010)
- Adicionar `current_model VARCHAR(40)` (snapshot para rastreabilidade)
- Adicionar `closed_at TIMESTAMPTZ`
- Adicionar índice `(user_id, last_message_at DESC)` (UX)

---

#### ENT-02 — `chat_messages` (Existente)

**Origem**: `api/models/conversation.py`

**Atributos**

| Atributo | Tipo | Constraints | Observações |
|----------|------|-------------|-------------|
| `id` | `VARCHAR` | PK | UUID-string |
| `conversation_id` | `VARCHAR` | FK → `conversations.id`, NOT NULL | — |
| `role` | `VARCHAR` | NOT NULL | "user" / "assistant" / "tool" / "system" — LIM-11 sugere virar enum |
| `content` | `TEXT` | NOT NULL | — |
| `agent_name` | `VARCHAR` | NULL | ContentCreator / Conversational / VisualCreator |
| `response_data` | `JSON` | NULL | tool_calls, model used, etc. |
| `created_at` | `TIMESTAMP` | NOT NULL | — |

**Evolução proposta**:
- `role` virar `VARCHAR(20) CHECK (role IN ('user','assistant','tool','system'))`
- Adicionar `turn_number INTEGER` para ordenação rápida
- Adicionar índice `(conversation_id, created_at)` para listagem

---

#### ENT-03 — `knowledge_documents` (Existente)

**Origem**: `api/migrations/001_knowledge_tables.sql`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `id` | `UUID` | PK, `gen_random_uuid()` |
| `title` | `TEXT` | NOT NULL |
| `description` | `TEXT` | NULL |
| `file_type` | `VARCHAR(10)` | NOT NULL |
| `file_size` | `BIGINT` | NULL |
| `file_url` | `TEXT` | NULL |
| `thumbnail_url` | `TEXT` | NULL |
| `content_text` | `TEXT` | NULL |
| `tags` | `TEXT[]` | DEFAULT `'{}'` |
| `scope` | `TEXT[]` | DEFAULT `'{}'` |
| `status` | `VARCHAR(20)` | DEFAULT `'processing'` |
| `error_message` | `TEXT` | NULL |
| `chunks_count` | `INTEGER` | DEFAULT 0 |
| `created_by` | `VARCHAR(100)` | NULL |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

**Evolução proposta**:
- Adicionar `domain VARCHAR(20) CHECK (domain IN ('cliente','industria','cultura','metodologia','referencia'))` — RN-006
- Adicionar `client_id UUID` FK → `clients(client_id)` quando domain='cliente'
- `created_by` virar `UUID` FK → `users(user_id)`
- Adicionar índices: `idx_kd_scope` (GIN no array), `idx_kd_tags` (GIN), `idx_kd_status`
- CHECK constraint: `cardinality(tags) >= 2` (RN-006)

---

#### ENT-04 — `knowledge_chunks` (Existente)

**Origem**: `api/migrations/001_knowledge_tables.sql` + `api/models/knowledge.py`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `id` | `UUID` | PK |
| `document_id` | `UUID` | FK → `knowledge_documents(id)` ON DELETE CASCADE |
| `chunk_index` | `INTEGER` | NOT NULL |
| `content` | `TEXT` | NOT NULL |
| `embedding` | `vector(768)` | NULL |
| `metadata` | `JSONB` | DEFAULT `'{}'` |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

**Índices existentes**: `ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`

**Evolução proposta**:
- Migrar índice para **HNSW** (`USING hnsw (embedding vector_cosine_ops) WITH (m=16, ef_construction=64)`) — DT-03 + ADR-003
- Adicionar coluna `client_id UUID` (denormalizada) para filtros rápidos no retrieval — atende NFR-010 / RN-010 sem JOIN
- Adicionar índice composto `(client_id, document_id)` para filtros + visibilidade

---

#### ENT-05 / ENT-06 / ENT-07 — `workflows`, `workflow_runs`, `step_logs` (Existentes)

**Origem**: `api/migrations/002_workflow_tables.sql`

Schema já documentado. Evolução proposta:
- `created_by` virar `UUID` FK → `users(user_id)`
- Adicionar `client_id UUID` em `workflow_runs` para attribution (BC-05)
- Adicionar `cost_estimate_brl NUMERIC(10,4)` em `workflow_runs` para alimentar AvoidedCost
- Coluna `step_logs.tool_calls JSONB` para rastreabilidade detalhada

---

### 3.2. Entidades Novas

#### ENT-08 — `users`

**Tipo**: Core — **Aggregate Root: User**

| Atributo | Tipo | Constraints | Observações |
|----------|------|-------------|-------------|
| `user_id` | `UUID` | PK, `gen_random_uuid()` | Identidade interna |
| `firebase_uid` | `VARCHAR(128)` | NOT NULL UNIQUE | UID Firebase Auth |
| `email` | `VARCHAR(320)` | NOT NULL UNIQUE | Email institucional |
| `display_name` | `VARCHAR(255)` | NOT NULL | — |
| `default_client_id` | `UUID` | NULL FK → `clients(client_id)` | UX padrão |
| `status` | `VARCHAR(20)` | NOT NULL DEFAULT `'ACTIVE'` CHECK IN ('ACTIVE','INACTIVE') | Soft delete |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `NOW()` | — |

**Índices**: `idx_users_firebase_uid (UNIQUE)`, `idx_users_email (UNIQUE)`, `idx_users_status`

**Rastreabilidade**: BR-007, RN-009; NFR-008, NFR-009.

---

#### ENT-09 — `roles`

**Tipo**: Config (catálogo fixo de 3 perfis: Admin, Líder, Operacional)

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `role_id` | `UUID` | PK |
| `name` | `VARCHAR(20)` | NOT NULL UNIQUE CHECK IN ('Admin','Lider','Operacional') |
| `description` | `TEXT` | NULL |
| `permissions` | `JSONB` | NOT NULL — matriz de permissões (RN-009) |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

**Seed**: 3 linhas (Admin, Líder, Operacional) carregadas via migration.

---

#### ENT-10 — `user_roles`

**Tipo**: Auxiliar (associação)

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `user_id` | `UUID` | FK → `users(user_id)`, parte do PK |
| `role_id` | `UUID` | FK → `roles(role_id)`, parte do PK |
| `bioma_id` | `UUID` | NULL FK → `biomas(bioma_id)` — aplicação por área (Líder por bioma) |
| `granted_by` | `UUID` | FK → `users(user_id)` |
| `granted_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

**PK**: `(user_id, role_id, COALESCE(bioma_id, '00000000-0000-0000-0000-000000000000'::uuid))`

**Invariante**: para implementar RN-009, considerar disparo via trigger que valida "uma única role ativa por (user, scope)".

---

#### ENT-11 — `user_profiles`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `user_id` | `UUID` | PK FK → `users(user_id)` |
| `bioma_id` | `UUID` | NULL FK → `biomas(bioma_id)` — área principal |
| `cargo` | `VARCHAR(80)` | NULL |
| `career_stage` | `VARCHAR(20)` | NULL CHECK IN ('junior','pleno','senior') — RN-017 |
| `years_experience` | `INTEGER` | NULL |
| `onboarding_track` | `VARCHAR(40)` | NULL — RN-017 (`comecando-uma-ideia` / `me-prova-que-ta-errada`) |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

---

#### ENT-12 — `audit_log`

**Tipo**: Log — **Aggregate Root: AuditEntry** (imutável)

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `entry_id` | `UUID` | PK |
| `user_id` | `UUID` | NOT NULL FK → `users(user_id)` |
| `action` | `VARCHAR(80)` | NOT NULL |
| `resource_type` | `VARCHAR(40)` | NOT NULL CHECK IN ('skill','knowledge_item','user','workflow','client','prompt') |
| `resource_id` | `UUID` | NULL |
| `client_id` | `UUID` | NULL FK → `clients(client_id)` |
| `before_state` | `JSONB` | NULL |
| `after_state` | `JSONB` | NULL |
| `is_business_hours` | `BOOLEAN` | NOT NULL — RN-012 |
| `request_id` | `VARCHAR(64)` | NULL — correlação com Trace |
| `requires_review` | `BOOLEAN` | NOT NULL DEFAULT FALSE |
| `occurred_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `NOW()` |

**Índices**: `idx_audit_user_time (user_id, occurred_at DESC)`, `idx_audit_resource (resource_type, resource_id)`, `idx_audit_review` (parcial WHERE requires_review)

**Política**: Tabela append-only. Sem UPDATE, sem DELETE (constraint via trigger).

---

#### ENT-13 — `clients`

**Tipo**: Core — **Aggregate Root: Client**

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `client_id` | `UUID` | PK |
| `slug` | `VARCHAR(80)` | NOT NULL UNIQUE |
| `name` | `VARCHAR(255)` | NOT NULL |
| `status` | `VARCHAR(20)` | NOT NULL DEFAULT `'ACTIVE'` CHECK IN ('ACTIVE','INACTIVE') — RN-007 |
| `nda_status` | `VARCHAR(20)` | NOT NULL DEFAULT `'OK'` CHECK IN ('OK','PENDING','BLOCKED') |
| `solar_metadata` | `JSONB` | NULL — `{color, orbit_radius, icon, sort_order}` (FA-06) |
| `created_at`, `updated_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `NOW()` |

**Índices**: `idx_clients_status`, `idx_clients_slug (UNIQUE)`

---

#### ENT-14 — `biomas`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `bioma_id` | `UUID` | PK |
| `name` | `VARCHAR(80)` | NOT NULL UNIQUE |
| `tipo` | `VARCHAR(40)` | CHECK IN ('Zero','Job','Agentic','area') |
| `description` | `TEXT` | NULL |

**Seed**: Mídia, Criação, Planejamento, BI, Growth, Operações, Adm/Financeiro, Eficiência.

---

#### ENT-15 — `client_users`

**Tipo**: Auxiliar — quais users têm contexto/permissão a quais clientes (filtro UX e RBAC).

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `client_id` | `UUID` | FK, parte do PK |
| `user_id` | `UUID` | FK, parte do PK |
| `assigned_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

---

#### ENT-16 — `skills`

**Tipo**: Core — **Aggregate Root: Skill**

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `skill_id` | `UUID` | PK |
| `slug` | `VARCHAR(80)` | NOT NULL UNIQUE — `copy-social`, etc. |
| `name` | `VARCHAR(255)` | NOT NULL |
| `description` | `TEXT` | NULL |
| `intent` | `VARCHAR(20)` | NOT NULL CHECK IN ('criacao','midia','planejamento','conversation') |
| `default_model` | `VARCHAR(40)` | NOT NULL DEFAULT `'gemini-flash'` |
| `temperature` | `NUMERIC(3,2)` | NOT NULL DEFAULT 0.7 CHECK (temperature BETWEEN 0 AND 2) |
| `client_scope` | `TEXT[]` | DEFAULT `'{*}'` — IDs ou `*` |
| `current_version_id` | `UUID` | NULL FK → `skill_versions(version_id)` |
| `status` | `VARCHAR(20)` | NOT NULL DEFAULT `'DRAFT'` CHECK IN ('DRAFT','ACTIVE','DEPRECATED') |
| `requires_revision` | `BOOLEAN` | DEFAULT FALSE — RN-004 |
| `created_by` | `UUID` | FK → `users(user_id)` |
| `created_at`, `updated_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

**Índices**: `idx_skills_slug (UNIQUE)`, `idx_skills_status`, `idx_skills_intent`

---

#### ENT-17 — `skill_versions`

**Tipo**: Core — versionamento imutável de SystemPrompt

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `version_id` | `UUID` | PK |
| `skill_id` | `UUID` | NOT NULL FK → `skills(skill_id)` |
| `version_number` | `INTEGER` | NOT NULL |
| `system_prompt` | `TEXT` | NOT NULL |
| `references_snapshot` | `JSONB` | NULL — snapshot de SkillReferences ao momento da versão |
| `created_by` | `UUID` | FK → `users(user_id)` |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

**Constraint**: `UNIQUE(skill_id, version_number)`. Sem UPDATE/DELETE (trigger).

---

#### ENT-18 — `moons`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `moon_id` | `UUID` | PK |
| `skill_id` | `UUID` | NOT NULL FK → `skills(skill_id)` ON DELETE CASCADE |
| `name` | `VARCHAR(80)` | NOT NULL |
| `slug` | `VARCHAR(80)` | NOT NULL |
| `prompt_addendum` | `TEXT` | NULL — extensão do system prompt |
| `sort_order` | `INTEGER` | DEFAULT 0 |

**Constraint**: `UNIQUE(skill_id, slug)`.

---

#### ENT-19 — `skill_baselines`

**Tipo**: Config — TimeBaseline VO (RN-018)

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `baseline_id` | `UUID` | PK |
| `skill_id` | `UUID` | NOT NULL FK → `skills(skill_id)` |
| `bioma_id` | `UUID` | NULL FK → `biomas(bioma_id)` |
| `tarefa_descricao` | `TEXT` | NOT NULL |
| `tempo_manual_minutos` | `INTEGER` | NOT NULL CHECK > 0 |
| `custo_hora_brl` | `NUMERIC(10,2)` | NOT NULL CHECK > 0 |
| `last_calibrated_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `NOW()` |
| `calibrated_by` | `UUID` | FK → `users(user_id)` |

**Índice**: `idx_baselines_skill (skill_id)`

---

#### ENT-20 — `knowledge_graph_edges`

**Tipo**: Vector/Graph — auxiliar para retrieval divergente do Shoot for the Moon (FA-02)

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `edge_id` | `UUID` | PK |
| `source_chunk_id` | `UUID` | NOT NULL FK → `knowledge_chunks(id)` ON DELETE CASCADE |
| `target_chunk_id` | `UUID` | NOT NULL FK → `knowledge_chunks(id)` ON DELETE CASCADE |
| `relation_type` | `VARCHAR(40)` | CHECK IN ('semantic','co-cited','metaphor','contrast','analogy') |
| `weight` | `NUMERIC(5,4)` | NOT NULL CHECK (weight BETWEEN 0 AND 1) |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

**Constraint**: `CHECK (source_chunk_id <> target_chunk_id)`; `UNIQUE(source_chunk_id, target_chunk_id, relation_type)`.

**Índices**: `idx_kge_source`, `idx_kge_target`, `idx_kge_relation_weight (relation_type, weight DESC)`.

---

#### ENT-21 — `ingestion_jobs`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `job_id` | `UUID` | PK |
| `document_id` | `UUID` | NOT NULL FK → `knowledge_documents(id)` |
| `status` | `VARCHAR(20)` | NOT NULL CHECK IN ('queued','processing','succeeded','failed','dlq') |
| `retries` | `INTEGER` | DEFAULT 0 |
| `error_message` | `TEXT` | NULL |
| `started_at`, `completed_at` | `TIMESTAMPTZ` | NULL |
| `processor_type` | `VARCHAR(20)` | CHECK IN ('pdf','audio','image','video','text','docx') |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

---

#### ENT-22 — `risk_flags`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `flag_id` | `UUID` | PK |
| `document_id` | `UUID` | NOT NULL FK → `knowledge_documents(id)` |
| `single_owner_user_id` | `UUID` | NOT NULL FK → `users(user_id)` |
| `last_access_at` | `TIMESTAMPTZ` | NOT NULL |
| `severity` | `VARCHAR(20)` | CHECK IN ('low','medium','high') |
| `escalated` | `BOOLEAN` | DEFAULT FALSE |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

---

#### ENT-23 — `briefs`

**Tipo**: Core — **Aggregate Root: Brief** (BC-04)

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `brief_id` | `UUID` | PK |
| `user_id` | `UUID` | NOT NULL FK → `users(user_id)` |
| `client_id` | `UUID` | NOT NULL FK → `clients(client_id)` — RN-003 |
| `conversation_id` | `VARCHAR` | NULL FK → `conversations(id)` |
| `text` | `TEXT` | NOT NULL |
| `embedding` | `vector(768)` | NULL — base de BisociationZone |
| `mode` | `VARCHAR(40)` | CHECK IN ('comecando-uma-ideia','me-prova-que-ta-errada','dupla') |
| `intensity` | `VARCHAR(20)` | NOT NULL DEFAULT `'equilibrado'` CHECK IN ('adjacente','equilibrado','radical') — RN-001 |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

**Índices**: `idx_briefs_user_time (user_id, created_at DESC)`, índice HNSW em `embedding`.

---

#### ENT-24 — `provocations`

**Tipo**: Core — Provocation/Spark (BC-04)

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `provocation_id` | `UUID` | PK |
| `brief_id` | `UUID` | NOT NULL FK → `briefs(brief_id)` |
| `text` | `TEXT` | NOT NULL |
| `embedding` | `vector(768)` | NULL |
| `cosine_distance` | `NUMERIC(5,4)` | NOT NULL — distância vs. brief |
| `bisociation_zone` | `VARCHAR(20)` | NOT NULL CHECK IN ('Obvio','SweetSpot','Incoerente','Adjacente','Radical') — RN-001 |
| `novelty_score` | `NUMERIC(4,2)` | CHECK BETWEEN 0 AND 10 |
| `coherence_score` | `NUMERIC(4,2)` | CHECK BETWEEN 0 AND 10 |
| `creative_potential_score` | `NUMERIC(4,2)` | CHECK BETWEEN 0 AND 10 |
| `mean_score` | `NUMERIC(4,2)` | GENERATED ALWAYS AS ((novelty_score + coherence_score + creative_potential_score)/3) STORED |
| `is_approved` | `BOOLEAN` | NOT NULL DEFAULT FALSE — passou no Crítico (RN-002) |
| `is_starred` | `BOOLEAN` | NOT NULL DEFAULT FALSE — UX |
| `agent_persona` | `VARCHAR(20)` | CHECK IN ('Antropofaga','Carnavalesco','Ancia') |
| `mark_visual` | `VARCHAR(20)` | NOT NULL DEFAULT `'estimulo'` — RN-014 |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

**Índices**: `idx_prov_brief`, `idx_prov_starred (is_starred) WHERE is_starred=true`, índice HNSW em `embedding`.

---

#### ENT-25 — `explorer_runs`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `run_id` | `UUID` | PK |
| `brief_id` | `UUID` | NOT NULL FK → `briefs(brief_id)` |
| `iteration` | `INTEGER` | NOT NULL |
| `candidates_generated` | `INTEGER` | NOT NULL |
| `started_at`, `completed_at` | `TIMESTAMPTZ` | NULL |
| `status` | `VARCHAR(20)` | CHECK IN ('running','succeeded','aborted') |

---

#### ENT-26 — `critic_reviews`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `review_id` | `UUID` | PK |
| `provocation_id` | `UUID` | NOT NULL FK → `provocations(provocation_id)` |
| `iteration` | `INTEGER` | NOT NULL |
| `feedback_text` | `TEXT` | NULL |
| `decision` | `VARCHAR(20)` | NOT NULL CHECK IN ('approved','rejected','retry') |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

---

#### ENT-27 — `traces`

**Tipo**: Log — **Aggregate Root: Trace** (NFR-026, BR-009, RN-013)

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `trace_id` | `UUID` | PK |
| `mlflow_run_id` | `VARCHAR(64)` | NULL UNIQUE |
| `request_id` | `VARCHAR(64)` | NULL — correlação |
| `conversation_id` | `VARCHAR` | NULL FK |
| `chat_message_id` | `VARCHAR` | NULL FK → `chat_messages(id)` |
| `workflow_run_id` | `UUID` | NULL FK → `workflow_runs(id)` |
| `provocation_id` | `UUID` | NULL FK → `provocations(provocation_id)` |
| `user_id` | `UUID` | FK → `users(user_id)` |
| `client_id` | `UUID` | NULL FK → `clients(client_id)` |
| `skill_slug` | `VARCHAR(80)` | NULL |
| `model` | `VARCHAR(40)` | NOT NULL |
| `prompt_tokens` | `INTEGER` | DEFAULT 0 |
| `output_tokens` | `INTEGER` | DEFAULT 0 |
| `latency_ms` | `INTEGER` | NOT NULL |
| `cost_estimate_brl` | `NUMERIC(10,6)` | NULL |
| `scorer_results` | `JSONB` | NULL |
| `prompt_redacted` | `TEXT` | NULL — anonimizado para LGPD |
| `output_redacted` | `TEXT` | NULL |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `NOW()` |

**Particionamento (sugestão)**: `PARTITION BY RANGE (created_at)` mensal — RN-013 mover > 12 meses para frio.

**Índices**: `idx_traces_user_time`, `idx_traces_skill_time`, `idx_traces_client_time`, `idx_traces_request_id`.

---

#### ENT-28 — `scores` (HITL)

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `score_id` | `UUID` | PK |
| `chat_message_id` | `VARCHAR` | NULL FK → `chat_messages(id)` |
| `provocation_id` | `UUID` | NULL FK → `provocations(provocation_id)` |
| `user_id` | `UUID` | NOT NULL FK → `users(user_id)` |
| `thumbs` | `VARCHAR(10)` | NULL CHECK IN ('up','down') |
| `rating` | `INTEGER` | NULL CHECK BETWEEN 1 AND 5 |
| `comment` | `TEXT` | NULL |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

**Constraint**: `CHECK ((chat_message_id IS NOT NULL) <> (provocation_id IS NOT NULL))` — score atrelado a apenas um destino.

---

#### ENT-29 — `avoided_costs`

**Tipo**: Materialized — RN-018 (calculado por evento `EV-25 AvoidedCostCalculated`)

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `avoided_id` | `UUID` | PK |
| `chat_message_id` | `VARCHAR` | NULL FK |
| `workflow_run_id` | `UUID` | NULL FK |
| `skill_id` | `UUID` | NOT NULL FK → `skills(skill_id)` |
| `bioma_id` | `UUID` | FK → `biomas(bioma_id)` |
| `client_id` | `UUID` | FK → `clients(client_id)` |
| `tempo_skill_minutos` | `NUMERIC(8,2)` | NOT NULL |
| `tempo_manual_minutos` | `INTEGER` | NOT NULL — snapshot do baseline |
| `custo_hora_brl_snapshot` | `NUMERIC(10,2)` | NOT NULL |
| `avoided_cost_brl` | `NUMERIC(10,4)` | GENERATED ALWAYS AS ((tempo_manual_minutos - tempo_skill_minutos)/60.0 * custo_hora_brl_snapshot) STORED |
| `baseline_pendente` | `BOOLEAN` | DEFAULT FALSE |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

**Índices**: `idx_avc_skill_time`, `idx_avc_client_time`, `idx_avc_pendente WHERE baseline_pendente=true`.

---

#### ENT-30 — `diversity_metrics`

**Tipo**: Materialized — RN-019/020 (calculado mensalmente)

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `metric_id` | `UUID` | PK |
| `period_start` | `DATE` | NOT NULL |
| `period_end` | `DATE` | NOT NULL |
| `bioma_id` | `UUID` | NULL FK |
| `client_id` | `UUID` | NULL FK — pode ser global ou segmentado |
| `sample_size` | `INTEGER` | NOT NULL |
| `mean_pairwise_cosine` | `NUMERIC(8,6)` | NOT NULL |
| `self_bleu` | `NUMERIC(8,6)` | NOT NULL |
| `compression_ratio` | `NUMERIC(8,6)` | NOT NULL |
| `baseline_mean_pairwise_cosine` | `NUMERIC(8,6)` | NULL |
| `baseline_self_bleu` | `NUMERIC(8,6)` | NULL |
| `baseline_compression_ratio` | `NUMERIC(8,6)` | NULL |
| `divergence_sigma` | `NUMERIC(6,3)` | NULL |
| `triggered_alert` | `BOOLEAN` | DEFAULT FALSE |
| `calculated_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

**Constraint**: `UNIQUE(period_start, period_end, COALESCE(bioma_id,'00000000-0000-0000-0000-000000000000'), COALESCE(client_id,'00000000-0000-0000-0000-000000000000'))`.

**Índices**: `idx_dm_period`, `idx_dm_alert WHERE triggered_alert=true`.

---

#### ENT-31 — `executive_reports`

**Tipo**: Materialized — RN-005 / BR-003

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `report_id` | `UUID` | PK |
| `period_start` | `DATE` | NOT NULL |
| `period_end` | `DATE` | NOT NULL |
| `cycle` | `VARCHAR(20)` | CHECK IN ('mensal','trimestral','adhoc') |
| `summary_kpis` | `JSONB` | NOT NULL — `{avoided_cost_brl, conversations_count, sparks_starred, ...}` |
| `diversity_snapshot_id` | `UUID` | FK → `diversity_metrics(metric_id)` |
| `flags` | `JSONB` | NULL — RN-005 (variação > 25%) |
| `generated_by_job` | `VARCHAR(64)` | NULL |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

**Constraint (RN-020)**: `CHECK (diversity_snapshot_id IS NOT NULL OR cycle = 'adhoc')` — bloqueia relatório com satisfação isolada.

---

#### ENT-32 — `safety_alerts`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `alert_id` | `UUID` | PK |
| `alert_type` | `VARCHAR(40)` | NOT NULL CHECK IN ('homogenization','cost_cap','audit_anomaly','cross_client_leak','missing_visual_mark','llm_outage') |
| `severity` | `VARCHAR(20)` | NOT NULL CHECK IN ('LOW','MEDIUM','HIGH','CRITICAL') |
| `evidence` | `JSONB` | NOT NULL |
| `escalated_to` | `TEXT[]` | DEFAULT `'{}'` |
| `status` | `VARCHAR(20)` | NOT NULL DEFAULT `'OPEN'` CHECK IN ('OPEN','ACK','RESOLVED') |
| `acknowledged_by` | `UUID` | FK → `users(user_id)` |
| `created_at`, `resolved_at` | `TIMESTAMPTZ` | NULL/DEFAULT NOW() |

---

#### ENT-33 — `reflection_moments`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `reflection_id` | `UUID` | PK |
| `user_id` | `UUID` | NOT NULL FK |
| `conversation_id` | `VARCHAR` | NULL FK |
| `stars_count_threshold` | `INTEGER` | NOT NULL — 5 default, 3 junior (RN-015) |
| `stars_count_at_trigger` | `INTEGER` | NOT NULL |
| `creator_response` | `TEXT` | NULL — resposta à pergunta "Por que essas? Que padrão você vê?" |
| `was_skipped` | `BOOLEAN` | DEFAULT FALSE |
| `triggered_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

---

### 3.3. Entidades Novas — BC-07 Approval & Validation (FA-13 + FA-14)

#### ENT-34 — `approval_chains`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `chain_id` | `UUID` | PK, `gen_random_uuid()` |
| `client_id` | `UUID` | NOT NULL FK → `clients(client_id)` (RN-010) |
| `applies_to_skill_id` | `UUID` | NULL FK → `skills(skill_id)` — NULL = default do cliente |
| `version` | `INTEGER` | NOT NULL DEFAULT 1 |
| `status` | `VARCHAR(20)` | NOT NULL DEFAULT `'ACTIVE'` CHECK IN ('ACTIVE','DEPRECATED') |
| `created_by` | `UUID` | NOT NULL FK → `users(user_id)` |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |
| `deprecated_at` | `TIMESTAMPTZ` | NULL |

**Índices**: `UNIQUE (client_id, applies_to_skill_id, version)`, `idx_chain_active (client_id) WHERE status='ACTIVE'`.

**CHECK**: ao menos 1 nível humano via JOIN com `approval_chain_levels` (validar em service layer; CHECK SQL não suporta) — RN-024.

---

#### ENT-35 — `approval_chain_levels`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `level_id` | `UUID` | PK |
| `chain_id` | `UUID` | NOT NULL FK → `approval_chains(chain_id)` |
| `level_order` | `INTEGER` | NOT NULL CHECK (level_order >= 1) |
| `approver_kind` | `VARCHAR(20)` | NOT NULL CHECK IN ('USER','ROLE') |
| `approver_user_id` | `UUID` | NULL FK → `users(user_id)` |
| `approver_role` | `VARCHAR(40)` | NULL — quando approver_kind='ROLE' |
| `sla_hours` | `INTEGER` | NOT NULL DEFAULT 48 |
| `escalation_policy` | `JSONB` | NULL — `{on_timeout: "skip"|"escalate_to":..., notify: [...]}` |

**CHECK**: `(approver_kind='USER' AND approver_user_id IS NOT NULL) OR (approver_kind='ROLE' AND approver_role IS NOT NULL)`.

**Índices**: `UNIQUE (chain_id, level_order)`.

---

#### ENT-36 — `approval_requests`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `request_id` | `UUID` | PK |
| `submitter_id` | `UUID` | NOT NULL FK → `users(user_id)` |
| `client_id` | `UUID` | NOT NULL FK → `clients(client_id)` (RN-010) |
| `subject_type` | `VARCHAR(30)` | NOT NULL CHECK IN ('spark','turn','workflow_output') |
| `subject_id` | `UUID` | NOT NULL — FK polimórfica (resolved em app) |
| `subject_snapshot` | `JSONB` | NOT NULL — versão imutável submetida |
| `chain_id` | `UUID` | NOT NULL FK → `approval_chains(chain_id)` |
| `current_round` | `INTEGER` | NOT NULL DEFAULT 1 CHECK (current_round BETWEEN 1 AND 3) |
| `current_level_order` | `INTEGER` | NOT NULL DEFAULT 0 — 0=pré-validação |
| `status` | `VARCHAR(30)` | NOT NULL DEFAULT `'PENDING_VALIDATION'` CHECK IN ('PENDING_VALIDATION','PENDING_APPROVAL','CHANGES_REQUESTED','APPROVED','REJECTED','EXPIRED') |
| `validation_report_id` | `UUID` | NULL FK → `validation_reports(report_id)` |
| `final_decision_id` | `UUID` | NULL FK → `approval_decisions(decision_id)` |
| `submitted_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |
| `decided_at` | `TIMESTAMPTZ` | NULL |
| `expires_at` | `TIMESTAMPTZ` | NULL — calculado pelo SLA da chain |

**Índices**: `idx_ar_inbox (current_level_order, status, client_id)`, `idx_ar_submitter (submitter_id, submitted_at DESC)`, `idx_ar_client_status (client_id, status, submitted_at DESC)`.

**CHECK constraint composto**: `current_round=3 AND status='CHANGES_REQUESTED'` deve ser bloqueado em service layer (escala para `EXPIRED` — RN-025).

---

#### ENT-37 — `approval_decisions`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `decision_id` | `UUID` | PK |
| `request_id` | `UUID` | NOT NULL FK → `approval_requests(request_id)` |
| `level_order` | `INTEGER` | NOT NULL — nível da chain decidindo |
| `round` | `INTEGER` | NOT NULL — rodada da submissão |
| `approver_id` | `UUID` | NOT NULL FK → `users(user_id)` |
| `decision` | `VARCHAR(20)` | NOT NULL CHECK IN ('APPROVE','REJECT','REQUEST_CHANGES') |
| `comment` | `TEXT` | NULL — recomendado para REJECT/REQUEST_CHANGES |
| `attachments` | `JSONB` | NULL — `[{url, mime, size}]` |
| `decided_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

**Índices**: `idx_ad_request (request_id, decided_at DESC)`, `idx_ad_approver (approver_id, decided_at DESC)`.

**Imutável após criação** — UPDATE bloqueado por trigger.

---

#### ENT-38 — `validation_reports`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `report_id` | `UUID` | PK |
| `request_id` | `UUID` | NOT NULL FK → `approval_requests(request_id)` |
| `round` | `INTEGER` | NOT NULL |
| `status` | `VARCHAR(20)` | NOT NULL CHECK IN ('PASS','WARNINGS_ONLY','BLOCKING_ERRORS') |
| `brand_findings` | `JSONB` | NOT NULL DEFAULT `'[]'` — `[{severity, span:{start,end}, message, suggestion}]` |
| `portugues_findings` | `JSONB` | NOT NULL DEFAULT `'[]'` |
| `brand_validator_version` | `VARCHAR(40)` | NOT NULL — pinned (auditabilidade RN-009) |
| `portugues_validator_version` | `VARCHAR(40)` | NOT NULL |
| `started_at`, `completed_at` | `TIMESTAMPTZ` | NOT NULL |
| `latency_ms` | `INTEGER` | NOT NULL — `MAX(brand_latency, portugues_latency)` (paralelo) |

**Índices**: `idx_vr_request (request_id, round)`, `UNIQUE (request_id, round)`.

---

#### ENT-39 — `drive_oauth_credentials`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `credential_id` | `UUID` | PK |
| `client_id` | `UUID` | NOT NULL FK → `clients(client_id)` |
| `refresh_token_encrypted` | `TEXT` | NOT NULL — KMS-encrypted |
| `access_token_encrypted` | `TEXT` | NULL — short-lived |
| `scopes` | `TEXT[]` | NOT NULL CHECK (`'drive.readonly' = ANY(scopes)`) — RN-027 |
| `expires_at` | `TIMESTAMPTZ` | NULL |
| `granted_by_email` | `TEXT` | NOT NULL — quem do cliente concedeu |
| `created_at`, `revoked_at` | `TIMESTAMPTZ` | NULL |

**Índices**: `UNIQUE (client_id) WHERE revoked_at IS NULL`.

> **Segurança**: `refresh_token_encrypted` usa Cloud KMS (key per environment). NUNCA logar.

---

#### ENT-40 — `drive_syncs`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `sync_id` | `UUID` | PK |
| `client_id` | `UUID` | NOT NULL FK |
| `oauth_credential_id` | `UUID` | NOT NULL FK → `drive_oauth_credentials(credential_id)` |
| `root_folder_ids` | `TEXT[]` | NOT NULL CHECK (cardinality(root_folder_ids) >= 1) |
| `last_full_sync_at` | `TIMESTAMPTZ` | NULL |
| `last_webhook_event_at` | `TIMESTAMPTZ` | NULL |
| `next_scheduled_sync_at` | `TIMESTAMPTZ` | NULL |
| `documents_total` | `INTEGER` | DEFAULT 0 |
| `documents_indexed` | `INTEGER` | DEFAULT 0 |
| `documents_curated` | `INTEGER` | DEFAULT 0 |
| `status` | `VARCHAR(20)` | NOT NULL DEFAULT `'ACTIVE'` CHECK IN ('ACTIVE','PAUSED','OAUTH_EXPIRED','ERROR') |
| `last_error` | `TEXT` | NULL |
| `created_at`, `updated_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

**Índices**: `UNIQUE (client_id) WHERE status != 'ERROR'`, `idx_ds_scheduler (next_scheduled_sync_at) WHERE status='ACTIVE'`.

---

#### ENT-41 — `drive_documents`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `document_id` | `UUID` | PK |
| `sync_id` | `UUID` | NOT NULL FK → `drive_syncs(sync_id)` |
| `drive_file_id` | `TEXT` | NOT NULL — Google Drive file ID |
| `drive_parent_id` | `TEXT` | NULL |
| `name` | `TEXT` | NOT NULL |
| `mime_type` | `VARCHAR(120)` | NOT NULL |
| `size_bytes` | `BIGINT` | NULL |
| `content_hash` | `VARCHAR(64)` | NULL — SHA-256 (para dedup) |
| `drive_acl_snapshot` | `JSONB` | NOT NULL — `[{principal, role, type}]` (RN-028) |
| `drive_modified_time` | `TIMESTAMPTZ` | NOT NULL |
| `drive_owners` | `TEXT[]` | NOT NULL DEFAULT `'{}'` |
| `web_view_link` | `TEXT` | NULL |
| `discovered_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |
| `last_seen_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |
| `is_orphan` | `BOOLEAN` | DEFAULT FALSE — calculado pelo cleanup job |

**Índices**: `UNIQUE (sync_id, drive_file_id)`, `idx_dd_hash (content_hash) WHERE content_hash IS NOT NULL` (dedup), `idx_dd_orphan (sync_id) WHERE is_orphan=TRUE`.

> **NÃO armazena conteúdo** — somente metadata. Conteúdo é fetched on-demand via Drive API quando curador aceita `IMPORT_TO_LIBRARY` (ASS-DM-07).

---

#### ENT-42 — `curation_suggestions`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `suggestion_id` | `UUID` | PK |
| `document_id` | `UUID` | NOT NULL FK → `drive_documents(document_id)` |
| `client_id` | `UUID` | NOT NULL FK → `clients(client_id)` |
| `kind` | `VARCHAR(30)` | NOT NULL CHECK IN ('IMPORT_TO_LIBRARY','TAG','MERGE_WITH','MARK_DUPLICATE','MARK_OUTDATED') |
| `payload` | `JSONB` | NOT NULL — depende de `kind` |
| `confidence` | `NUMERIC(3,2)` | NOT NULL CHECK (confidence BETWEEN 0 AND 1) |
| `rationale` | `TEXT` | NOT NULL |
| `status` | `VARCHAR(20)` | NOT NULL DEFAULT `'PENDING'` CHECK IN ('PENDING','ACCEPTED','REJECTED','STALE') |
| `decided_by` | `UUID` | NULL FK → `users(user_id)` |
| `decided_at` | `TIMESTAMPTZ` | NULL |
| `resulting_knowledge_item_id` | `UUID` | NULL FK → `knowledge_documents(id)` — preenchido quando `IMPORT_TO_LIBRARY` aceita |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

**Índices**: `idx_cs_pending (client_id, status, created_at DESC)`, `idx_cs_document (document_id)`.

---

#### ENT-43 — `drive_cleanup_reports`

| Atributo | Tipo | Constraints |
|----------|------|-------------|
| `report_id` | `UUID` | PK |
| `sync_id` | `UUID` | NOT NULL FK → `drive_syncs(sync_id)` |
| `period_start`, `period_end` | `TIMESTAMPTZ` | NOT NULL |
| `duplicates_count` | `INTEGER` | NOT NULL DEFAULT 0 |
| `orphans_count` | `INTEGER` | NOT NULL DEFAULT 0 |
| `archive_candidates_count` | `INTEGER` | NOT NULL DEFAULT 0 |
| `summary_md` | `TEXT` | NULL — markdown legível |
| `details` | `JSONB` | NOT NULL — listas com document_ids |
| `generated_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |

**Imutável após criação**.

---

## 4. Relacionamentos Principais (Cardinalidades)

| Rel-ID | Tabela A | Tabela B | Cardinalidade | FK | Descrição |
|--------|----------|----------|---------------|-----|-----------|
| REL-01 | clients | conversations | 1:N | conversations.client_id | Conversação atrelada a cliente (RN-010) |
| REL-02 | users | conversations | 1:N | conversations.user_id | Sessão do creator |
| REL-03 | conversations | chat_messages | 1:N | chat_messages.conversation_id | Mensagens da sessão |
| REL-04 | knowledge_documents | knowledge_chunks | 1:N | knowledge_chunks.document_id | Chunking |
| REL-05 | knowledge_documents | ingestion_jobs | 1:N | ingestion_jobs.document_id | Pipeline de ingestão |
| REL-06 | knowledge_chunks | knowledge_graph_edges | N:N | source/target | Grafo divergente |
| REL-07 | clients | knowledge_documents | 1:N | knowledge_documents.client_id | Filtro por cliente (RN-010) |
| REL-08 | skills | skill_versions | 1:N | skill_versions.skill_id | Versionamento imutável |
| REL-09 | skills | moons | 1:N | moons.skill_id | Sub-áreas |
| REL-10 | skills | skill_baselines | 1:N | skill_baselines.skill_id | Baseline ROI |
| REL-11 | workflows | workflow_runs | 1:N | workflow_runs.workflow_id | Execuções |
| REL-12 | workflow_runs | step_logs | 1:N | step_logs.run_id | Logs por step |
| REL-13 | workflow_runs | traces | 1:N | traces.workflow_run_id | Tracing por run |
| REL-14 | chat_messages | traces | 1:1 | traces.chat_message_id | Trace por turn LLM |
| REL-15 | clients | briefs | 1:N | briefs.client_id | Brief contextualizado (RN-003) |
| REL-16 | briefs | provocations | 1:N | provocations.brief_id | Faíscas geradas |
| REL-17 | briefs | explorer_runs | 1:N | explorer_runs.brief_id | Iterações |
| REL-18 | provocations | critic_reviews | 1:N | critic_reviews.provocation_id | Revisões |
| REL-19 | users | audit_log | 1:N | audit_log.user_id | Trilha do usuário |
| REL-20 | users | user_roles | N:N (via tabela) | — | RBAC |
| REL-21 | clients | client_users | N:N (via tabela) | — | Usuários por cliente |
| REL-22 | users | user_profiles | 1:1 | user_profiles.user_id | Metadados extras |
| REL-23 | skills | avoided_costs | 1:N | avoided_costs.skill_id | RN-018 |
| REL-24 | diversity_metrics | executive_reports | 1:1 (snapshot) | executive_reports.diversity_snapshot_id | RN-020 — bloqueio |
| REL-25 | provocations | scores | 1:N | scores.provocation_id | HITL no Spark |
| REL-26 | chat_messages | scores | 1:N | scores.chat_message_id | HITL no Turn |
| REL-27 | clients | approval_chains | 1:N | approval_chains.client_id | Hierarquia por cliente (RN-026) |
| REL-28 | approval_chains | approval_chain_levels | 1:N | approval_chain_levels.chain_id | Níveis ordenados |
| REL-29 | approval_chains | approval_requests | 1:N | approval_requests.chain_id | Requests usam chain ativa |
| REL-30 | approval_requests | approval_decisions | 1:N | approval_decisions.request_id | Histórico de decisões por nível/rodada |
| REL-31 | approval_requests | validation_reports | 1:N | validation_reports.request_id | Um report por rodada |
| REL-32 | clients | drive_oauth_credentials | 1:1 (ativo) | drive_oauth_credentials.client_id | Token por cliente |
| REL-33 | drive_oauth_credentials | drive_syncs | 1:1 | drive_syncs.oauth_credential_id | Sync vinculado ao token |
| REL-34 | drive_syncs | drive_documents | 1:N | drive_documents.sync_id | Documentos descobertos |
| REL-35 | drive_documents | curation_suggestions | 1:N | curation_suggestions.document_id | Sugestões por documento |
| REL-36 | curation_suggestions | knowledge_documents | 0:1 | curation_suggestions.resulting_knowledge_item_id | IMPORT_TO_LIBRARY aceito (RN-029) |
| REL-37 | drive_syncs | drive_cleanup_reports | 1:N | drive_cleanup_reports.sync_id | Relatórios periódicos |

---

## 5. ERD em Mermaid

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : assigns
    USERS ||--|| USER_PROFILES : describes
    USERS ||--o{ AUDIT_LOG : produces
    USERS ||--o{ CONVERSATIONS : owns
    USERS ||--o{ BRIEFS : creates
    USERS ||--o{ SCORES : submits
    USERS ||--o{ CLIENT_USERS : assigned_to

    CLIENTS ||--o{ CLIENT_USERS : has
    CLIENTS ||--o{ CONVERSATIONS : scopes
    CLIENTS ||--o{ KNOWLEDGE_DOCUMENTS : owns
    CLIENTS ||--o{ BRIEFS : context_for
    CLIENTS ||--o{ AVOIDED_COSTS : attributed_to
    CLIENTS ||--o{ AUDIT_LOG : impacts
    BIOMAS ||--o{ USER_PROFILES : groups
    BIOMAS ||--o{ SKILL_BASELINES : measures

    KNOWLEDGE_DOCUMENTS ||--o{ KNOWLEDGE_CHUNKS : decomposed_into
    KNOWLEDGE_DOCUMENTS ||--o{ INGESTION_JOBS : ingested_by
    KNOWLEDGE_DOCUMENTS ||--o{ RISK_FLAGS : flagged_by
    KNOWLEDGE_CHUNKS ||--o{ KNOWLEDGE_GRAPH_EDGES : source_of
    KNOWLEDGE_CHUNKS ||--o{ KNOWLEDGE_GRAPH_EDGES : target_of

    SKILLS ||--o{ SKILL_VERSIONS : versioned_by
    SKILLS ||--o{ MOONS : has
    SKILLS ||--o{ SKILL_BASELINES : has_baseline
    SKILLS ||--o{ AVOIDED_COSTS : enables
    SKILLS ||--o{ CONVERSATIONS : runs
    SKILLS ||--o{ TRACES : invoked_in

    WORKFLOWS ||--o{ WORKFLOW_RUNS : executes
    WORKFLOW_RUNS ||--o{ STEP_LOGS : logs
    WORKFLOW_RUNS ||--o{ TRACES : emits

    CONVERSATIONS ||--o{ CHAT_MESSAGES : contains
    CHAT_MESSAGES ||--|| TRACES : produces
    CHAT_MESSAGES ||--o{ SCORES : evaluated_by

    BRIEFS ||--o{ PROVOCATIONS : generates
    BRIEFS ||--o{ EXPLORER_RUNS : iterates
    PROVOCATIONS ||--o{ CRITIC_REVIEWS : reviewed_by
    PROVOCATIONS ||--o{ SCORES : evaluated_by
    PROVOCATIONS ||--o{ TRACES : produces

    DIVERSITY_METRICS ||--o| EXECUTIVE_REPORTS : snapshotted_in

    USERS {
      uuid user_id PK
      varchar firebase_uid UK
      varchar email UK
      varchar display_name
      uuid default_client_id FK
      varchar status
      timestamptz created_at
    }

    ROLES {
      uuid role_id PK
      varchar name UK
      jsonb permissions
    }

    USER_ROLES {
      uuid user_id FK
      uuid role_id FK
      uuid bioma_id FK
      timestamptz granted_at
    }

    USER_PROFILES {
      uuid user_id PK_FK
      uuid bioma_id FK
      varchar career_stage
      varchar onboarding_track
    }

    AUDIT_LOG {
      uuid entry_id PK
      uuid user_id FK
      varchar action
      varchar resource_type
      uuid resource_id
      uuid client_id FK
      jsonb before_state
      jsonb after_state
      bool is_business_hours
      bool requires_review
      timestamptz occurred_at
    }

    CLIENTS {
      uuid client_id PK
      varchar slug UK
      varchar name
      varchar status
      varchar nda_status
      jsonb solar_metadata
      timestamptz created_at
    }

    BIOMAS {
      uuid bioma_id PK
      varchar name UK
      varchar tipo
    }

    CLIENT_USERS {
      uuid client_id FK
      uuid user_id FK
      timestamptz assigned_at
    }

    KNOWLEDGE_DOCUMENTS {
      uuid id PK
      text title
      text description
      varchar file_type
      text_array tags
      text_array scope
      varchar domain
      uuid client_id FK
      varchar status
      int chunks_count
      uuid created_by FK
      timestamptz created_at
    }

    KNOWLEDGE_CHUNKS {
      uuid id PK
      uuid document_id FK
      uuid client_id FK
      int chunk_index
      text content
      vector_768 embedding
      jsonb metadata
      timestamptz created_at
    }

    KNOWLEDGE_GRAPH_EDGES {
      uuid edge_id PK
      uuid source_chunk_id FK
      uuid target_chunk_id FK
      varchar relation_type
      numeric weight
    }

    INGESTION_JOBS {
      uuid job_id PK
      uuid document_id FK
      varchar status
      int retries
      varchar processor_type
      timestamptz started_at
    }

    RISK_FLAGS {
      uuid flag_id PK
      uuid document_id FK
      uuid single_owner_user_id FK
      varchar severity
      bool escalated
    }

    SKILLS {
      uuid skill_id PK
      varchar slug UK
      varchar name
      varchar intent
      varchar default_model
      numeric temperature
      text_array client_scope
      uuid current_version_id FK
      varchar status
      bool requires_revision
    }

    SKILL_VERSIONS {
      uuid version_id PK
      uuid skill_id FK
      int version_number
      text system_prompt
      jsonb references_snapshot
      uuid created_by FK
      timestamptz created_at
    }

    MOONS {
      uuid moon_id PK
      uuid skill_id FK
      varchar name
      varchar slug
      text prompt_addendum
    }

    SKILL_BASELINES {
      uuid baseline_id PK
      uuid skill_id FK
      uuid bioma_id FK
      int tempo_manual_minutos
      numeric custo_hora_brl
      timestamptz last_calibrated_at
    }

    WORKFLOWS {
      uuid id PK
      varchar name
      jsonb definition
      varchar schedule_cron
      varchar schedule_timezone
      bool schedule_enabled
      varchar status
      varchar default_model
    }

    WORKFLOW_RUNS {
      uuid id PK
      uuid workflow_id FK
      uuid client_id FK
      varchar status
      varchar trigger
      jsonb steps_output
      numeric cost_estimate_brl
      timestamptz started_at
    }

    STEP_LOGS {
      uuid id PK
      uuid run_id FK
      varchar step_id
      varchar status
      jsonb input
      jsonb output
      jsonb tool_calls
      int duration_ms
    }

    CONVERSATIONS {
      varchar id PK
      uuid user_id FK
      uuid client_id FK
      varchar skill_slug
      varchar current_model
      json state
      timestamptz created_at
      timestamptz last_message_at
    }

    CHAT_MESSAGES {
      varchar id PK
      varchar conversation_id FK
      varchar role
      text content
      varchar agent_name
      json response_data
      int turn_number
      timestamptz created_at
    }

    BRIEFS {
      uuid brief_id PK
      uuid user_id FK
      uuid client_id FK
      varchar conversation_id FK
      text text
      vector_768 embedding
      varchar mode
      varchar intensity
      timestamptz created_at
    }

    PROVOCATIONS {
      uuid provocation_id PK
      uuid brief_id FK
      text text
      vector_768 embedding
      numeric cosine_distance
      varchar bisociation_zone
      numeric novelty_score
      numeric coherence_score
      numeric creative_potential_score
      numeric mean_score
      bool is_approved
      bool is_starred
      varchar agent_persona
      varchar mark_visual
    }

    EXPLORER_RUNS {
      uuid run_id PK
      uuid brief_id FK
      int iteration
      int candidates_generated
      varchar status
    }

    CRITIC_REVIEWS {
      uuid review_id PK
      uuid provocation_id FK
      int iteration
      varchar decision
      text feedback_text
    }

    TRACES {
      uuid trace_id PK
      varchar mlflow_run_id UK
      varchar request_id
      varchar conversation_id FK
      varchar chat_message_id FK
      uuid workflow_run_id FK
      uuid provocation_id FK
      uuid user_id FK
      uuid client_id FK
      varchar model
      int prompt_tokens
      int output_tokens
      int latency_ms
      numeric cost_estimate_brl
      jsonb scorer_results
      timestamptz created_at
    }

    SCORES {
      uuid score_id PK
      varchar chat_message_id FK
      uuid provocation_id FK
      uuid user_id FK
      varchar thumbs
      int rating
      text comment
      timestamptz created_at
    }

    AVOIDED_COSTS {
      uuid avoided_id PK
      varchar chat_message_id FK
      uuid workflow_run_id FK
      uuid skill_id FK
      uuid bioma_id FK
      uuid client_id FK
      numeric tempo_skill_minutos
      int tempo_manual_minutos
      numeric custo_hora_brl_snapshot
      numeric avoided_cost_brl
      bool baseline_pendente
    }

    DIVERSITY_METRICS {
      uuid metric_id PK
      date period_start
      date period_end
      uuid bioma_id FK
      uuid client_id FK
      int sample_size
      numeric mean_pairwise_cosine
      numeric self_bleu
      numeric compression_ratio
      numeric divergence_sigma
      bool triggered_alert
    }

    EXECUTIVE_REPORTS {
      uuid report_id PK
      date period_start
      date period_end
      varchar cycle
      jsonb summary_kpis
      uuid diversity_snapshot_id FK
      jsonb flags
    }

    SAFETY_ALERTS {
      uuid alert_id PK
      varchar alert_type
      varchar severity
      jsonb evidence
      text_array escalated_to
      varchar status
      timestamptz created_at
    }

    REFLECTION_MOMENTS {
      uuid reflection_id PK
      uuid user_id FK
      varchar conversation_id FK
      int stars_count_threshold
      int stars_count_at_trigger
      bool was_skipped
      timestamptz triggered_at
    }

    APPROVAL_CHAINS {
      uuid chain_id PK
      uuid client_id FK
      uuid applies_to_skill_id FK
      int version
      varchar status
      uuid created_by FK
      timestamptz created_at
    }

    APPROVAL_CHAIN_LEVELS {
      uuid level_id PK
      uuid chain_id FK
      int level_order
      varchar approver_kind
      uuid approver_user_id FK
      varchar approver_role
      int sla_hours
      jsonb escalation_policy
    }

    APPROVAL_REQUESTS {
      uuid request_id PK
      uuid submitter_id FK
      uuid client_id FK
      varchar subject_type
      uuid subject_id
      jsonb subject_snapshot
      uuid chain_id FK
      int current_round
      int current_level_order
      varchar status
      uuid validation_report_id FK
      uuid final_decision_id FK
      timestamptz submitted_at
      timestamptz decided_at
    }

    APPROVAL_DECISIONS {
      uuid decision_id PK
      uuid request_id FK
      int level_order
      int round
      uuid approver_id FK
      varchar decision
      text comment
      jsonb attachments
      timestamptz decided_at
    }

    VALIDATION_REPORTS {
      uuid report_id PK
      uuid request_id FK
      int round
      varchar status
      jsonb brand_findings
      jsonb portugues_findings
      varchar brand_validator_version
      varchar portugues_validator_version
      timestamptz started_at
      timestamptz completed_at
      int latency_ms
    }

    DRIVE_OAUTH_CREDENTIALS {
      uuid credential_id PK
      uuid client_id FK
      text refresh_token_encrypted
      text access_token_encrypted
      text scopes
      timestamptz expires_at
      text granted_by_email
      timestamptz created_at
      timestamptz revoked_at
    }

    DRIVE_SYNCS {
      uuid sync_id PK
      uuid client_id FK
      uuid oauth_credential_id FK
      text root_folder_ids
      timestamptz last_full_sync_at
      timestamptz last_webhook_event_at
      timestamptz next_scheduled_sync_at
      int documents_total
      int documents_indexed
      int documents_curated
      varchar status
    }

    DRIVE_DOCUMENTS {
      uuid document_id PK
      uuid sync_id FK
      text drive_file_id
      text drive_parent_id
      text name
      varchar mime_type
      bigint size_bytes
      varchar content_hash
      jsonb drive_acl_snapshot
      timestamptz drive_modified_time
      text drive_owners
      bool is_orphan
    }

    CURATION_SUGGESTIONS {
      uuid suggestion_id PK
      uuid document_id FK
      uuid client_id FK
      varchar kind
      jsonb payload
      numeric confidence
      text rationale
      varchar status
      uuid decided_by FK
      timestamptz decided_at
      uuid resulting_knowledge_item_id FK
    }

    DRIVE_CLEANUP_REPORTS {
      uuid report_id PK
      uuid sync_id FK
      timestamptz period_start
      timestamptz period_end
      int duplicates_count
      int orphans_count
      int archive_candidates_count
      jsonb details
      timestamptz generated_at
    }

    APPROVAL_CHAINS ||--o{ APPROVAL_CHAIN_LEVELS : "has levels"
    APPROVAL_CHAINS ||--o{ APPROVAL_REQUESTS : "applies to"
    APPROVAL_REQUESTS ||--o{ APPROVAL_DECISIONS : "decisions per round"
    APPROVAL_REQUESTS ||--o{ VALIDATION_REPORTS : "report per round"
    CLIENTS ||--o| DRIVE_OAUTH_CREDENTIALS : "active token"
    DRIVE_OAUTH_CREDENTIALS ||--|| DRIVE_SYNCS : "sync uses token"
    DRIVE_SYNCS ||--o{ DRIVE_DOCUMENTS : "discovers"
    DRIVE_SYNCS ||--o{ DRIVE_CLEANUP_REPORTS : "periodic cleanup"
    DRIVE_DOCUMENTS ||--o{ CURATION_SUGGESTIONS : "suggested curation"
    CURATION_SUGGESTIONS }o--o| KNOWLEDGE_DOCUMENTS : "import resulted"
```

---

## 6. Índices Críticos para NFRs

| NFR | Índice | Justificativa |
|-----|--------|---------------|
| NFR-003 (P95 retrieval < 300ms) | `knowledge_chunks_embedding_hnsw_idx USING hnsw (embedding vector_cosine_ops)` | Migrar de IVFFlat para HNSW |
| NFR-003 + NFR-010 | `idx_kc_client_doc (client_id, document_id)` em `knowledge_chunks` | Filtro client antes do scan vetorial |
| NFR-001/002 (latência chat) | `idx_conv_user_time (user_id, last_message_at DESC)` em `conversations` | Listagem rápida do histórico |
| NFR-026 (tracing 100%) | Particionamento mensal de `traces` por `created_at` + `idx_traces_user_time` | Volume alto, queries por janela |
| NFR-027 (homogeneização mensal) | `UNIQUE` composto em `diversity_metrics` (período + bioma + client) | Idempotência do job mensal |
| NFR-028 (custo evitado) | `idx_avc_skill_time (skill_id, created_at DESC)` em `avoided_costs` | Dashboard executivo |
| RN-019 (alerta) | `idx_dm_alert WHERE triggered_alert=true` em `diversity_metrics` | Alertas abertos rápidos |
| RN-012 (auditoria) | `idx_audit_review WHERE requires_review=true` em `audit_log` | Painel revisão semanal |
| BR-017 (inbox aprovação) | `idx_ar_inbox (current_level_order, status, client_id)` em `approval_requests` | Inbox por aprovador rápido |
| RN-023 (validators paralelos) | `UNIQUE (request_id, round)` em `validation_reports` | 1 report por rodada |
| RN-027 (Drive read-only) | CHECK `'drive.readonly' = ANY(scopes)` em `drive_oauth_credentials` | Bloqueia tokens com escopo write |
| RN-030 (sync periódico) | `idx_ds_scheduler (next_scheduled_sync_at) WHERE status='ACTIVE'` em `drive_syncs` | Cloud Scheduler picker |
| RN-029 (curadoria sugestiva) | `idx_cs_pending (client_id, status, created_at DESC)` em `curation_suggestions` | Inbox curador |
| BR-018 (dedup Drive) | `idx_dd_hash (content_hash)` em `drive_documents` | Detecção de duplicatas |

---

## 7. Restrições de Domínio Importantes (CHECK Constraints)

Mapeamento direto Domain Model → DDL:

| Tabela | Constraint | RN |
|--------|-----------|-----|
| `knowledge_documents` | `cardinality(tags) >= 2 AND cardinality(scope) >= 1 AND length(description) >= 50 AND title IS NOT NULL` | RN-006 |
| `knowledge_documents` | `(domain = 'cliente') = (client_id IS NOT NULL)` | RN-006 |
| `provocations` | `mean_score >= 8.0 OR is_approved = false` | RN-002 |
| `provocations` | `bisociation_zone <> 'Obvio' AND bisociation_zone <> 'Incoerente' OR is_approved = false` | RN-001 |
| `provocations` | `mark_visual IN ('estimulo','provocacao','faisca')` | RN-014 |
| `executive_reports` | `diversity_snapshot_id IS NOT NULL OR cycle = 'adhoc'` | RN-020 |
| `audit_log` (trigger) | Sem UPDATE/DELETE | RN-012 |
| `skill_versions` (trigger) | Sem UPDATE/DELETE | BR-007 |
| `skill_baselines` | `tempo_manual_minutos > 0 AND custo_hora_brl > 0` | RN-018 |
| `approval_requests` | `current_round BETWEEN 1 AND 3` | RN-025 |
| `approval_chain_levels` | `(approver_kind='USER' AND approver_user_id IS NOT NULL) OR (approver_kind='ROLE' AND approver_role IS NOT NULL)` | RN-024, RN-026 |
| `approval_decisions` (trigger) | Sem UPDATE/DELETE | RN-024 (audit imutável) |
| `validation_reports` | `UNIQUE (request_id, round)` | RN-023 |
| `drive_oauth_credentials` | `'drive.readonly' = ANY(scopes)` | RN-027 |
| `drive_syncs` | `cardinality(root_folder_ids) >= 1` | RN-027 |
| `curation_suggestions` | `confidence BETWEEN 0 AND 1` | RN-029 |
| `curation_suggestions` (trigger) | `kind='IMPORT_TO_LIBRARY' AND status='ACCEPTED' → resulting_knowledge_item_id IS NOT NULL` | RN-029 |

---

## 8. Rastreabilidade Tabela ↔ Aggregate ↔ BR/RN

| Tabela | Aggregate (Parte 2) | BRs | RNs | NFRs |
|--------|--------------------|-----|-----|------|
| users | User | BR-007 | RN-009 | NFR-008, NFR-009 |
| roles + user_roles | User (Role VO) | BR-007 | RN-009 | NFR-009 |
| user_profiles | User (Profile) | BR-012 | RN-017 | — |
| audit_log | AuditEntry | BR-007, BR-009 | RN-012 | NFR-008 |
| clients | Client | BR-005, BR-008 | RN-007, RN-010 | NFR-010 |
| biomas | Client (Bioma) | BR-006 | — | — |
| knowledge_documents | KnowledgeItem | BR-004, BR-008 | RN-006, RN-010 | NFR-002, NFR-010, NFR-011 |
| knowledge_chunks | KnowledgeItem (Chunk) | BR-004 | — | NFR-003 |
| knowledge_graph_edges | KnowledgeGraphNode | BR-001, BR-004 | RN-001 | — |
| ingestion_jobs | IngestionJob | BR-004 | — | NFR-004, NFR-007 |
| risk_flags | RiskFlag | BR-005 | RN-008 | — |
| skills | Skill | BR-002, BR-007, BR-015 | RN-009, RN-021 | NFR-016, NFR-017 |
| skill_versions | Skill (SystemPrompt) | BR-007 | RN-009 | NFR-009 |
| moons | Skill (Moon) | BR-002 | — | — |
| skill_baselines | Skill (TimeBaseline) | BR-013 | RN-018 | NFR-028 |
| workflows + workflow_runs + step_logs | Workflow | BR-002, BR-015 | — | NFR-002, NFR-026 |
| conversations + chat_messages | Conversation + Turn | BR-002, BR-008 | RN-010, RN-021 | NFR-001, NFR-002 |
| briefs | Brief | BR-001 | RN-001, RN-003 | NFR-024 |
| provocations | Spark / Provocation | BR-001, BR-010 | RN-001, RN-002, RN-014 | NFR-024 |
| explorer_runs + critic_reviews | ExplorerRun + CriticReview | BR-001 | RN-002 | — |
| traces | Trace | BR-009 | RN-013 | NFR-026 |
| scores | Score | BR-014 | — | — |
| avoided_costs | AvoidedCost | BR-013 | RN-018 | NFR-028 |
| diversity_metrics | DiversityMetric | BR-014 | RN-019, RN-020 | NFR-027 |
| executive_reports | ExecutiveReport | BR-003 | RN-005, RN-020 | — |
| safety_alerts | SafetyAlert | BR-014 | RN-010, RN-019 | — |
| reflection_moments | ReflectionMoment | BR-010, BR-012 | RN-015 | — |
| approval_chains + approval_chain_levels | ApprovalChain | BR-017 | RN-024, RN-026 | NFR-009 |
| approval_requests | ApprovalRequest | BR-017 | RN-023, RN-024, RN-025 | NFR-008, NFR-009, NFR-010, NFR-026 |
| approval_decisions | ApprovalDecision | BR-017 | RN-024 | NFR-009 |
| validation_reports | ValidationReport | BR-017 | RN-023 | NFR-001, NFR-026 |
| drive_oauth_credentials | OAuthCredential | BR-018 | RN-027 | NFR-008 (security) |
| drive_syncs | DriveSync | BR-018 | RN-027, RN-030 | NFR-010 |
| drive_documents | DriveDocument | BR-018 | RN-027, RN-028 | NFR-010, NFR-011 |
| curation_suggestions | CurationSuggestion | BR-018 | RN-029 | NFR-026 |
| drive_cleanup_reports | DriveCleanupReport | BR-018 | RN-029 | — |

---

## 9. Política de Retenção e LGPD (RN-013)

| Tabela | Retenção ativa | Política após período | Anonimização |
|--------|---------------:|----------------------|--------------|
| `traces` | 12 meses | Mover para Cold Storage (BigQuery archive ou GCS Coldline) | `prompt_redacted` / `output_redacted` substituem campos com PII |
| `chat_messages` | 12 meses | Cold storage; manter agregados em `traces` | Hash de PII após detecção |
| `audit_log` | 24 meses | Cold storage; nunca apagar (compliance) | — |
| `briefs` | 12 meses | Cold storage | Hash de menções a creators / clientes específicos |
| `provocations` | 24 meses (seed para retraining) | Cold storage | — |
| `risk_flags` | Indefinida (status atual) | — | — |
| `approval_requests` | 24 meses | Cold storage | Hash de PII em `subject_snapshot.payload` quando aplicável |
| `approval_decisions` | 24 meses (compliance) | Cold storage; nunca apagar comentários assinados | — |
| `validation_reports` | 12 meses | Cold storage | Hash de spans com PII em findings |
| `drive_documents` | Indefinida enquanto sync ativo | Apagar quando sync revoked OU documento removido do Drive > 30d (`last_seen_at`) | TODO-DM-10 (alinhar Jurídico) |
| `drive_oauth_credentials` | Apagar imediatamente após `revoked_at` | — | Token nunca persistido em log |
| `curation_suggestions` | 12 meses | Apagar `REJECTED`/`STALE` > 12m | — |
| `drive_cleanup_reports` | 12 meses | Cold storage | — |

**TTL via job programado**: Cloud Scheduler diário → procedure que move registros > 12m para schema `archive` ou exporta para GCS.

---

## 10. Migration Path Sugerido

| Onda | Migrations adicionais | Release |
|------|----------------------|---------|
| **1A** (Protótipo) | `003_users_roles_audit.sql` (ENT-08 a ENT-12), `004_clients_biomas.sql` (ENT-13/14/15), evolução de `conversations` (client_id, current_model) | Antes do Piloto |
| **1B** (Protótipo) | `005_skills_versions_moons.sql` (ENT-16 a ENT-19), evolução de `knowledge_documents` (domain, client_id, CHECK metadata) | Antes do Piloto |
| **2** (Piloto) | `006_briefs_provocations_pipeline.sql` (ENT-23 a ENT-26 + index HNSW briefs/provocations) | Piloto |
| **3** (Piloto) | `007_traces_scores.sql` (ENT-27, ENT-28, particionamento mensal de `traces`) | Piloto (pré-NFR-026 efetivo) |
| **4** (Piloto) | `008_measurement.sql` (ENT-29 a ENT-33) | Piloto |
| **5** (Piloto) | `009_pgvector_hnsw.sql` (DROP IVFFlat + CREATE HNSW em `knowledge_chunks`) | Piloto |
| **6** (Piloto) | `010_knowledge_graph.sql` (ENT-20) | Piloto (junto com BC-04) |
| **7** (Pós-Piloto) | `011_approval_engine.sql` (ENT-34 a ENT-38) — chains, requests, decisions, validation_reports + triggers de imutabilidade | Phase 17 (FA-13) |
| **8** (Pós-Piloto) | `012_drive_connector.sql` (ENT-39 a ENT-43) — oauth, syncs, documents, suggestions, cleanup_reports + KMS encryption helpers | Phase 18 (FA-14) |

---

## 11. Assunções e Lacunas

### 11.1. Assunções

| ID | Assunção | Impacto se Falsa |
|----|----------|------------------|
| ASS-DT-01 | Cloud SQL atual suporta extensão `pgvector ≥ 0.6` com HNSW | Alto — pode requerer Self-hosted ou Pinecone (revisita ADR-003) |
| ASS-DT-02 | `users.id` pode coexistir com `user_id` string em `conversations` durante migração lazy | Médio — exige migration cuidadosa |
| ASS-DT-03 | Volume de `traces` < 1M/mês no Piloto suporta tabela única particionada | Médio — pode requerer mover para BigQuery |
| ASS-DT-04 | Embedding 768 dims permanece (Gemini text-embedding-004 ou similar) | Baixo — ADR adicional se mudar |
| ASS-DT-05 | Audit log nunca precisa de UPDATE/DELETE (constraint via trigger) | Baixo |
| ASS-DT-06 | `subject_id` em `approval_requests` é resolvido em app (não FK SQL) — espaço polimórfico (sparks/turns/workflow_outputs em tabelas distintas) | Médio — perde integridade referencial; compensado por trigger de validação |
| ASS-DT-07 | `drive_documents.content_hash` é calculado on-fetch (Drive não devolve hash em listagem padrão) | Médio — pode aumentar custo Drive API; cachear |
| ASS-DT-08 | `subject_snapshot` em `approval_requests` cabe em JSONB (≤ 1MB) | Baixo — outputs maiores vão para GCS com pointer |

### 11.2. Lacunas

| ID | Lacuna | Informação Necessária | Responsável |
|----|--------|----------------------|-------------|
| TODO-DT-01 | Definir baseline pré-sunOS para `diversity_metrics` (PA-06 do BRD) | Coleta de outputs criativos por 30 dias | Bruno Prosperi + Heitor |
| TODO-DT-02 | Política específica de retenção PII em `traces` (PA-07 do BRD) | Aprovação Diretoria | Heitor + Diretoria |
| TODO-DT-03 | Definir custo_hora_brl por bioma (PA-04 + NFR-028) | CFO Ronaldo Severino | Ronaldo + Heitor |
| TODO-DT-04 | Decidir se `provocations` rejeitadas são persistidas (TODO-DM-04) | Heitor + Eng | Antes do Piloto |
| TODO-DT-05 | Validar tipo de `relation_type` em `knowledge_graph_edges` com Bruno Prosperi | Bruno + Eng | Antes do Piloto |
| TODO-DT-06 | Confirmar particionamento de `traces` (mensal vs. semanal) | Eng + SRE | Antes do Piloto |
| TODO-DT-07 | Estratégia de migração de `conversations.id` (string → UUID) | Eng | Antes do Piloto |
| TODO-DT-08 | Confirmar com Heitor: `subject_id` polimórfico vs. tabelas separadas (`approval_requests_spark`, `approval_requests_turn`...) | Heitor + Eng | Antes da Implementação FA-13 |
| TODO-DT-09 | Definir TTL exato de `drive_documents` quando OAuth revoked (RN-027 + LGPD) | Heitor + Jurídico | Antes da Implementação FA-14 |
| TODO-DT-10 | Validar política de KMS keys para `drive_oauth_credentials` (key per env vs. key per client) | Eng + SRE | Antes da Implementação FA-14 |

---

## Histórico de Versões

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | 2026-04-28 | Heitor Miranda + Claude | Versão inicial. **32 entidades** (7 existentes em `001/002` migrations + `models/conversation.py` + `models/knowledge.py`; 25 novas). Cobertura completa dos 6 Bounded Contexts da Parte 2. Tipos PostgreSQL precisos (`UUID`, `JSONB`, `vector(768)`, `timestamptz`, `numeric`). 26 relacionamentos catalogados. ERD em Mermaid. Índices críticos mapeados a NFRs (especialmente NFR-003, NFR-010, NFR-026, NFR-027). CHECK constraints implementam invariantes de Aggregates (RN-001, RN-002, RN-006, RN-014, RN-018, RN-020). Política de retenção LGPD por tabela (RN-013). Migration path em 6 ondas. Status: Rascunho aguardando revisão de Eng + DBA. |
| 1.1 | 2026-04-28 | Heitor Miranda + Claude | Adicionado **BC-07 Approval & Validation** com **+10 entidades** (ENT-34 a ENT-43): `approval_chains`, `approval_chain_levels`, `approval_requests`, `approval_decisions`, `validation_reports`, `drive_oauth_credentials`, `drive_syncs`, `drive_documents`, `curation_suggestions`, `drive_cleanup_reports`. +11 relacionamentos (REL-27 a REL-37). ERD Mermaid expandido. Índices críticos para inbox de aprovação, sync schedule e dedup Drive. CHECK constraints implementam RN-023 a RN-030 (validators paralelos, hierarquia configurável, drive read-only). Política de retenção/LGPD para credenciais OAuth (apagar imediatamente após revoked) e drive_documents (apagar quando sync revoked OU `last_seen_at > 30d`). Migration path estendido com Onda 7 (Phase 17 — FA-13) e Onda 8 (Phase 18 — FA-14). +3 assunções (polimorfismo de subject_id, content_hash on-fetch, JSONB ≤ 1MB) e +3 TODOs (TODO-DT-08/09/10). Total: **43 entidades**. |
