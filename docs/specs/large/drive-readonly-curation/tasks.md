---
spec-id: SPEC-006
slug: drive-readonly-curation
artefato: tasks
atualizada: 2026-05-15
status: rascunho
versao: 1.0
fase: Momento 2
---

# Tasks — Drive Read-Only Curation (FA-14)

> ⚠️ **PRE-01 BLOQUEIA tasks de Fase C em diante.** Nenhuma task das fases C, D, E, F pode ser merged a `master` antes de ADR-009 sair de Proposto → Aceito (alinhamento Guga documentado em handoff). Tasks A* e B* podem rodar em paralelo a alinhamento Guga, pois não expõem Drive a curadores nem fazem ingestão na Biblioteca.

## Resumo

| Total | A Fazer | Em Progresso | Concluídas |
|-------|---------|--------------|------------|
| 58 | 58 | 0 | 0 |

Distribuição:
- Fase A — Foundation: 9 tasks (A01–A09)
- Fase B — OAuth + Sync: 10 tasks (B01–B10)
- Fase C — CurationAgent + Cleanup: 10 tasks (C01–C10)
- Fase D — UI + Importer: 15 tasks (D01–D15)
- Fase E — Webhook + Exclusions: 8 tasks (E01–E08)
- Fase F — Observabilidade + Polish: 6 tasks (F01–F06)

Estimativas T-shirt:
- **P** = pequena (≤ 0.5 dia)
- **M** = média (0.5–1.5 dia)
- **G** = grande (1.5–3 dias)

---

## Fase A — Foundation

### TASK-A01 — Criar estrutura de diretório `api/drive/`

- **Fase:** A
- **Escopo:** criar `api/drive/__init__.py` + arquivos vazios (placeholders) para módulos previstos no design §1.3: `router.py`, `schemas.py`, `models.py`, `oauth_vault.py`, `kms.py`, `sdk_wrapper.py`, `sync.py`, `differ.py`, `curation_agent.py`, `cleanup.py`, `importer.py`, `access_guard.py`, `webhook.py`, `events.py`. Cada arquivo com docstring de 1 linha apontando para a SPEC-006.
- **Arquivos:** Criar acima (14 arquivos vazios + `__init__.py`).
- **Depende de:** nenhuma.
- **CAs:** —.
- **Estimativa:** P.
- **Status:** ⬜.

### TASK-A02 — Verificar/adicionar dependências `google-cloud-kms` e `google-api-python-client`

- **Fase:** A
- **Escopo:** verificar `api/pyproject.toml`. Se ausentes, adicionar com versões pinadas (kms `>=2.20`, api-client `>=2.140`). Documentar em ADR-LOCAL na constitution se for adição (CLAUDE.md proíbe deps novas sem justificativa). Rodar `uv pip install` localmente para validar.
- **Arquivos:** Modificar `api/pyproject.toml`, possivelmente `api/uv.lock`.
- **Depende de:** A01.
- **CAs:** — (gate).
- **Estimativa:** P.
- **Status:** ⬜.

### TASK-A03 — Alembic migration: ENT-39..43 + outbox + audit + push channels

- **Fase:** A
- **Escopo:** criar migration única `xxxx_add_drive_tables.py` com:
  - `drive_oauth_credentials` (ENT-39) com trigger `enforce_token_ciphertext`.
  - `drive_syncs` (ENT-40) com índice `(client_id, status)`.
  - `drive_documents` (ENT-41) com índices `(sync_id, drive_file_id)`, `(client_id, last_seen_at DESC)`, `(client_id, content_hash)`.
  - `curation_suggestions` (ENT-42) com índice `(client_id, status, created_at DESC)`.
  - `drive_cleanup_reports` (ENT-43) com índice `(sync_id, period_start)`.
  - `outbox_drive_events` com partial index `WHERE published_at IS NULL`.
  - `audit_log_drive` com trigger `reject_audit_drive_mutation`.
  - `drive_push_channels` (id PK, sync_id FK, folder_id, channel_id UNIQUE, expires_at).
  - Trigger `cascade_revoke_drive`.
  - DDL conforme design §2.
- **Arquivos:** Criar `api/migrations/versions/<rev>_add_drive_tables.py`.
- **Depende de:** A01.
- **CAs:** Cobertura de DDL.
- **Estimativa:** G.
- **Status:** ⬜.

### TASK-A04 — SQLAlchemy ORM models

- **Fase:** A
- **Escopo:** em `api/drive/models.py`, definir classes `DriveOAuthCredential`, `DriveSync`, `DriveDocument`, `CurationSuggestion`, `DriveCleanupReport`, `OutboxDriveEvent`, `AuditLogDrive`, `DrivePushChannel`. Todas as colunas tipadas; relationships com `back_populates`; enums Python `DriveSyncStatus`, `SuggestionKind`, `SuggestionStatus`.
- **Arquivos:** Criar `api/drive/models.py`.
- **Depende de:** A03.
- **CAs:** —.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-A05 — Pydantic schemas (SCH-016/017 + DriveSyncState + decide/revoke)

- **Fase:** A
- **Escopo:** em `api/drive/schemas.py`, definir:
  - `DriveDocumentSchema` (SCH-016, exato shape de §11 do extract).
  - `CurationSuggestionSchema` (SCH-017).
  - `DriveSyncStateResponse` (resposta de API-142).
  - `OAuthRevokeRequest` (corpo de DELETE API-150) com validators (`reason` ≥ 30 chars; `purge_indexed_content + X-Confirm-Destructive` cross-field).
  - `DecideSuggestionRequest` com `decision`, `override_tags`, `description`, `reason`; validator que se `decision='ACCEPT' && kind='IMPORT_TO_LIBRARY'` então `tags ≥ 2 && description ≥ 50` (RN-006).
  - `ConnectDriveRequest` com `client_id`, `folder_ids` ≥1, `critical_folder_ids` (subset).
- **Arquivos:** Criar `api/drive/schemas.py`.
- **Depende de:** A04.
- **CAs:** CA-27, CA-28, CA-35, CA-36 (validations).
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-A06 — KMS wrapper + round-trip test

- **Fase:** A
- **Escopo:** em `api/drive/kms.py`, expor `encrypt(plaintext: bytes | str) -> str` (base64 ciphertext) e `decrypt(ciphertext: str) -> bytes`. Usa `google-cloud-kms` com key path config-driven (ENV `DRIVE_KMS_KEY=projects/.../keys/drive-oauth`). Tratar erros de KMS sem vazar plaintext em log. Test unitário usa KMS emulator local (`google-cloud-kms` SDK suporta).
- **Arquivos:** Criar `api/drive/kms.py`, `api/drive/tests/test_kms.py`.
- **Depende de:** A02.
- **CAs:** — (gate Fase A).
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-A07 — SDK wrapper read-only + teste de regressão

- **Fase:** A
- **Escopo:** em `api/drive/sdk_wrapper.py`, implementar `DriveReadOnlyClient` conforme design §1.3.1. Expor: `list_changes`, `get_file_metadata`, `download_content` (streaming), `get_start_page_token`, `watch_folder`. **NÃO** expor `create`, `update`, `delete`, `copy`. Constructor valida `credentials.scopes ⊆ ALLOWED_SCOPES` ou levanta `WriteNotPermittedError`. Test de regressão (`test_wrapper_blocks_write_methods`) valida ausência de métodos write + tentativa de access via `__getattr__` falha.
- **Arquivos:** Criar `api/drive/sdk_wrapper.py`, `api/drive/tests/test_sdk_wrapper.py`.
- **Depende de:** A02.
- **CAs:** CA-16 (assert scope), CA-17 (write blocked).
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-A08 — Pub/Sub topic `sunos.drive.events` + OutboxWorker

- **Fase:** A
- **Escopo:** provisionar topic via Terraform (ou manual + check-in), com schema validation (envelope: `event_id`, `event_type`, `event_version`, `occurred_at`, `client_id`, `sync_id?`, `payload`). Implementar `OutboxWorker` em `api/drive/events.py` que: SELECT pending events, publica via `pubsub.publisher_client`, marca `published_at`. Idempotência por `event_id`. Retry com `publish_attempts++` e `last_publish_error`. Worker rodando em loop (ou ativado por cron 1min).
- **Arquivos:** Criar `api/drive/events.py`. Possivelmente `terraform/drive_pubsub.tf`.
- **Depende de:** A03, A04.
- **CAs:** —.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-A09 — Test fixtures + CI scrubbing check

- **Fase:** A
- **Escopo:** criar fixtures pytest:
  - `client_seed` (1 cliente teste).
  - `drive_credential_seed` (com tokens fake encriptados via KMS emulator).
  - `drive_sync_seed`, `drive_documents_batch_50`.
  - Mock Drive API responses (VCR cassettes em `tests/fixtures/drive/`).
  - Mock `OutboxWorker` em modo síncrono para tests.
- Setup CI step: `grep -r "ya29\." api/ tests/ logs/` retorna 0 (token plaintext leak check).
- **Arquivos:** Criar `api/drive/tests/conftest.py`, `tests/fixtures/drive/*.yaml`. Modificar `.github/workflows/ci.yml` (ou equivalente).
- **Depende de:** A06.
- **CAs:** —.
- **Estimativa:** M.
- **Status:** ⬜.

---

## Fase B — OAuth + Sync incremental (POC backend)

### TASK-B01 — Router placeholder + dependency injection

- **Fase:** B
- **Escopo:** criar `api/drive/router.py` com FastAPI APIRouter, prefix `/api/drive`. Registrar em `api/main.py`. Implementar dependency `current_admin_or_lead_for_client(client_id: UUID)` que valida JWT + role + RBAC; retorna 404 (não 403) em mismatch (caixa-preta).
- **Arquivos:** Criar `api/drive/router.py`, modificar `api/main.py`.
- **Depende de:** A05.
- **CAs:** CA-02, CA-13, CA-14.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-B02 — POST /api/drive/connect (API-140)

- **Fase:** B
- **Escopo:** implementar handler que: (a) valida role, (b) valida `client_id` existe e ainda não tem `drive_syncs.status='ACTIVE'` (409), (c) gera `state` HMAC-SHA256 do `client_id + nonce + timestamp` com TTL 10min em Redis ou Cloud Memorystore, (d) constrói `oauth_url` com scopes literalmente `['drive.readonly', 'drive.metadata.readonly']`, (e) retorna `{oauth_url, state}`.
- **Arquivos:** Modificar `api/drive/router.py`, criar `api/drive/oauth_vault.py` parcial (geração de state).
- **Depende de:** B01.
- **CAs:** CA-01, CA-02, CA-06.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-B03 — GET /api/drive/oauth-callback (API-141)

- **Fase:** B
- **Escopo:** handler que: (a) valida state (existe, não expirado), (b) troca `code` por tokens via `google-auth-oauthlib`, (c) **assert** `granted_scopes ⊆ ALLOWED_SCOPES` — se mismatch, revoga grant + redireciona com `?result=error&reason=scope_mismatch`, (d) testa conexão com `files.get(folder_root)`, (e) se ok, encripta tokens via KMS e INSERT `drive_oauth_credentials` + `drive_syncs(status='CONNECTING')`, (f) enfileira primeiro full sync via Cloud Tasks, (g) UPDATE `status='ACTIVE'` quando full sync completa, (h) redireciona para `/admin/drive-sync?result=success`.
- **Arquivos:** Modificar `api/drive/router.py`, expandir `api/drive/oauth_vault.py`.
- **Depende de:** B02, A06.
- **CAs:** CA-03, CA-04, CA-05.
- **Estimativa:** G.
- **Status:** ⬜.

### TASK-B04 — GET /api/drive/sync-state (API-142)

- **Fase:** B
- **Escopo:** handler simples: SELECT `drive_syncs` por client_id (com cross-client guard), retorna `DriveSyncStateResponse`. Tela T-32 consome.
- **Arquivos:** Modificar `api/drive/router.py`.
- **Depende de:** B01.
- **CAs:** CA-15.
- **Estimativa:** P.
- **Status:** ⬜.

### TASK-B05 — POST /api/drive/sync/run (API-143)

- **Fase:** B
- **Escopo:** handler que aceita Service Account (Cloud Scheduler) ou role Admin. SELECT `drive_syncs FOR UPDATE SKIP LOCKED` para evitar 2 syncs simultâneos. Se já lock → 409. Caso contrário, enfileira `ListChangesWorker` job e retorna 202 com `job_id`.
- **Arquivos:** Modificar `api/drive/router.py`.
- **Depende de:** B04.
- **CAs:** CA-11.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-B06 — ListChangesWorker + SnapshotDiffer

- **Fase:** B
- **Escopo:** em `api/drive/sync.py`, classe `ListChangesWorker.run(sync_id)` que:
  - Carrega `drive_syncs.last_page_token`.
  - Decrypt OAuth via KMS.
  - Loop `changes.list?pageToken=X` até `nextPageToken=null`, persistindo a cada página em `drive_syncs.last_page_token` (resilência).
  - Para cada batch, invoca `SnapshotDiffer.process_batch(changes)` que faz UPSERT em `drive_documents` (UPDATE `last_seen_at`); marca `marked_orphan_at` para arquivos não vistos no batch atual + 1 dia.
  - Persiste contadores em `drive_syncs`.
  - INSERT EV-37 por documento novo/atualizado.
  - INSERT EV-36 final.
  - Retry exponencial (1s, 4s, 16s) em falhas; após 3 falhas marca `status='ERROR'`.
- Em `api/drive/differ.py`, classe `SnapshotDiffer` com método `process_batch(changes: list[Change])`.
- **Arquivos:** Criar `api/drive/sync.py`, `api/drive/differ.py`.
- **Depende de:** A07, A08.
- **CAs:** CA-07, CA-09, CA-10.
- **Estimativa:** G.
- **Status:** ⬜.

### TASK-B07 — Cloud Scheduler dynamic provisioning

- **Fase:** B
- **Escopo:** em `api/drive/sync.py`, função `provision_cron_for_sync(sync_id, client_id)` que cria job `drive-sync-{client_id}` via `google-cloud-scheduler` SDK com schedule `*/15 * * * *` apontando para `POST /api/drive/sync/run`. Função `deprovision_cron(client_id)` para revoke. Chamar provision em B03 (após `status='ACTIVE'`).
- **Arquivos:** Modificar `api/drive/sync.py`.
- **Depende de:** B05, B06.
- **CAs:** —.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-B08 — Audit log helper + integração nos endpoints

- **Fase:** B
- **Escopo:** em `api/drive/router.py` e demais módulos, adicionar `audit_log(action, result, severity, details)` chamado após cada operação. Cobrir: CONNECT, OAUTH_CALLBACK, SYNC_RUN, WRITE_ATTEMPT_BLOCKED. INSERT em `audit_log_drive` (sem PII; emails mascarados).
- **Arquivos:** Modificar `api/drive/router.py`, criar `api/drive/audit.py` (helper).
- **Depende de:** A03.
- **CAs:** CA-45.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-B09 — Testes integração: OAuth happy path + sync incremental

- **Fase:** B
- **Escopo:** pytest scenarios:
  - OAuth happy path: gerar state → mock callback → assert tokens encriptados em DB.
  - OAuth scope mismatch: callback com scope extra → rollback grant.
  - Sync com 50 changes: assert 50 docs UPSERTed + 50 EV-37 + 1 EV-36.
  - Sync com pagina já vista: assert idempotência (UPDATE last_seen_at, sem duplicatas).
  - Cross-client guard: outro cliente tenta GET /sync-state → 404.
  - Token plaintext leak check: rodar batch de operations, grep logs.
- **Arquivos:** Criar `api/drive/tests/test_oauth_flow.py`, `api/drive/tests/test_sync.py`.
- **Depende de:** B03, B06, A09.
- **CAs:** CA-01, CA-03, CA-05, CA-07, CA-13, CA-14, CA-15.
- **Estimativa:** G.
- **Status:** ⬜.

### TASK-B10 — POC manual checklist

- **Fase:** B
- **Escopo:** documento `api/drive/POC_CHECKLIST.md` (interno, não vai ao docs/) com:
  - [ ] Heitor conecta seu Drive de teste pessoal via curl + popup OAuth.
  - [ ] Primeiro full sync completa em < 5min para pasta com ~100 arquivos.
  - [ ] Segundo sync (15min depois) é incremental (changes.list).
  - [ ] Logs grep `ya29\.|Bearer|refresh_token` retorna 0.
  - [ ] `drive_documents` contém ≥ 100 rows.
  - [ ] Pub/Sub Cloud Console mostra EV-35/36/37 com `event_id` único.
- Após validação, abrir handoff parcial.
- **Arquivos:** Criar `api/drive/POC_CHECKLIST.md`.
- **Depende de:** B09.
- **CAs:** — (gate Fase B).
- **Estimativa:** P (execução manual).
- **Status:** ⬜.

---

## Fase C — CurationAgent + Cleanup (Protótipo) ⚠️ BLOQUEADA POR PRE-01

### TASK-C01 — CurationAgent base + tools RBAC-aware

- **Fase:** C
- **Escopo:** em `api/drive/curation_agent.py`, classe `CurationAgent` com LangGraph StateGraph. 4 tools `BaseTool`-shaped:
  - `list_documents_in_folder(folder_id)` — lista docs do mesmo folder; filtro `client_id` injetado.
  - `read_document_metadata(document_id)` — retorna metadata (sem conteúdo); aplica `AccessGuard`.
  - `compute_content_similarity(doc_a, doc_b)` — embedding cosine ou content_hash exact match.
  - `propose_suggestion(document_id, kind, payload, confidence, rationale)` — INSERT em `curation_suggestions` com `status='PENDING'` (RN-029 hardcoded — não aceita outro status).
- Modelo: Gemini Flash default; preparar config para Sonnet híbrido (TODO-DESIGN-A).
- Tracing MLflow com tags `client_id, sync_id, document_id`.
- **Arquivos:** Criar `api/drive/curation_agent.py`.
- **Depende de:** B06.
- **CAs:** CA-20, CA-21.
- **Estimativa:** G.
- **Status:** ⬜.

### TASK-C02 — Subscriber Pub/Sub: trigger CurationAgent em EV-37

- **Fase:** C
- **Escopo:** subscriber dedicado para topic `sunos.drive.events` filtrando `event_type='DriveDocumentDiscovered'`. Para cada evento, invoca `CurationAgent` async via Cloud Tasks. Subscriber idempotente (skip se já processado).
- **Arquivos:** Criar `api/drive/subscriber.py`.
- **Depende de:** C01, A08.
- **CAs:** —.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-C03 — Persist suggestions + emite EV-38 via outbox

- **Fase:** C
- **Escopo:** garantir que `propose_suggestion` faz INSERT atomicamente + INSERT em `outbox_drive_events` (mesma TX). OutboxWorker (de A08) publica EV-38.
- **Arquivos:** Modificar `api/drive/curation_agent.py`.
- **Depende de:** C01.
- **CAs:** CA-20, CA-21.
- **Estimativa:** P.
- **Status:** ⬜.

### TASK-C04 — STALE transition job

- **Fase:** C
- **Escopo:** job diário (cron `0 4 * * *`) `drive-stale-transition`. SELECT `curation_suggestions WHERE status='PENDING'` e para cada um, comparar `suggestion.created_at` com `drive_documents.modified_time`. Se `modified_time > created_at`, UPDATE `status='STALE'`. Idempotente.
- **Arquivos:** Criar `api/drive/stale_job.py`. Provisionar Cloud Scheduler.
- **Depende de:** C03.
- **CAs:** CA-25.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-C05 — CleanupJob com 4 categorias (duplicatas, órfãos, candidatos, naming)

- **Fase:** C
- **Escopo:** em `api/drive/cleanup.py`, classe `CleanupJob.run(client_id)`:
  - Duplicatas: `SELECT content_hash, COUNT(*) ... HAVING > 1`.
  - Órfãos: `WHERE last_seen_at < now() - 180d`.
  - Candidatos a Biblioteca: heurística (texto livre + sem `curated_as_knowledge_item_id` + tamanho > 1KB + > 5 acessos no Drive nos últimos 30d — `acl_snapshot.permissions[].lastModifyingUser`?).
  - Nomenclatura: regex `(-final|-v\d+|-cópia|copia|copy| {2,})`.
- INSERT `drive_cleanup_reports` com summary_json.
- INSERT EV-40 via outbox.
- Cron `0 6 * * 0` (domingo 06:00) provisionado em Cloud Scheduler.
- **Arquivos:** Criar `api/drive/cleanup.py`.
- **Depende de:** C03.
- **CAs:** CA-31, CA-32.
- **Estimativa:** G.
- **Status:** ⬜.

### TASK-C06 — Notification dispatcher para EV-40

- **Fase:** C
- **Escopo:** subscriber Pub/Sub para EV-40 envia in-app + email para Líder. Reusa `NotificationDispatcher` se existe na SPEC-004 (CTM-08); senão, simple SMTP/SES wrapper.
- **Arquivos:** Modificar ou criar `api/drive/subscriber.py`.
- **Depende de:** C05.
- **CAs:** CA-33.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-C07 — Testes integração: CurationAgent gera suggestions

- **Fase:** C
- **Escopo:** pytest scenarios:
  - DriveDocument seed → CurationAgent invocado → ≥ 1 suggestion criada com `status='PENDING'`.
  - Confidence boundary: `[0, 1]`.
  - `confidence=0.99` → status PENDING (não auto-aceita).
  - Modificação de documento → próximo job marca STALE (CA-25).
  - 3 docs com mesmo content_hash → CleanupJob detecta duplicates_found ≥ 1.
- **Arquivos:** Criar `api/drive/tests/test_curation_agent.py`, `api/drive/tests/test_cleanup.py`.
- **Depende de:** C01, C04, C05.
- **CAs:** CA-20, CA-21, CA-25, CA-31, CA-32.
- **Estimativa:** G.
- **Status:** ⬜.

### TASK-C08 — MLflow tracing instrumentation

- **Fase:** C
- **Escopo:** decorators `@mlflow.trace` em CurationAgent, ListChangesWorker, SnapshotDiffer, CleanupJob (conforme design §7.1). Tags obrigatórias: `client_id`, `sync_id`, `document_id` quando aplicável.
- **Arquivos:** Modificar `api/drive/sync.py`, `api/drive/differ.py`, `api/drive/curation_agent.py`, `api/drive/cleanup.py`.
- **Depende de:** C01.
- **CAs:** CA-46.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-C09 — Validação Flash vs. Sonnet híbrido (TODO-DESIGN-A)

- **Fase:** C
- **Escopo:** PoC paralela: rodar CurationAgent em 100 documentos seed com Flash puro vs. Sonnet híbrido (orquestrador Sonnet, sub-tools Flash). Medir: latência p95, qualidade subjetiva (Heitor avalia 20 random samples), custo. Documentar em `api/drive/HYBRID_VALIDATION.md` + atualizar LOG.md da skill sdd-koro.
- **Arquivos:** Criar `api/drive/HYBRID_VALIDATION.md`.
- **Depende de:** C01.
- **CAs:** —.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-C10 — Protótipo manual checklist + handoff parcial

- **Fase:** C
- **Escopo:** documento `api/drive/PROTOTIPO_CHECKLIST.md`:
  - [ ] 50 documents seed → ≥ 50 suggestions geradas.
  - [ ] Latência CurationAgent p95 ≤ 8s.
  - [ ] CleanupJob produz report válido com 3 duplicatas seed.
  - [ ] STALE transition: doc atualizado → suggestion vira STALE em ≤ 24h.
  - [ ] MLflow dashboard mostra traces com tags.
  - [ ] Decisão TODO-DESIGN-A documentada.
- Handoff parcial em `docs/handoff/sessions/`.
- **Arquivos:** Criar `api/drive/PROTOTIPO_CHECKLIST.md`.
- **Depende de:** C07, C08, C09.
- **CAs:** — (gate Fase C).
- **Estimativa:** P.
- **Status:** ⬜.

---

## Fase D — UI dashboard + Inbox + Importer (Piloto) ⚠️ BLOQUEADA POR PRE-01 + PRE-04

### TASK-D01 — Frontend: tipos compartilhados em `lib/drive-types.ts`

- **Fase:** D
- **Escopo:** copiar/adaptar tipos de design §4.4 para `lib/drive-types.ts`.
- **Arquivos:** Criar `lib/drive-types.ts`.
- **Depende de:** A05.
- **CAs:** —.
- **Estimativa:** P.
- **Status:** ⬜.

### TASK-D02 — Frontend: API client em `lib/api.ts` (extensão)

- **Fase:** D
- **Escopo:** adicionar funções: `connectDrive`, `getDriveSyncState`, `runDriveSync`, `listDriveDocuments`, `getDocumentContent`, `listCurationSuggestions`, `decideCurationSuggestion`, `listCleanupReports`, `revokeDriveOAuth`. Cada uma com tipos de `lib/drive-types.ts`.
- **Arquivos:** Modificar `lib/api.ts`.
- **Depende de:** D01.
- **CAs:** —.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-D03 — Frontend: hook `useDriveSyncPolling`

- **Fase:** D
- **Escopo:** em `hooks/useDriveSyncPolling.ts`, hook que faz `setInterval` 30s para `getDriveSyncState`. Pausa quando `document.hidden`. Limpa em unmount. Retorna `{state, isLoading, error}`.
- **Arquivos:** Criar `hooks/useDriveSyncPolling.ts`.
- **Depende de:** D02.
- **CAs:** —.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-D04 — Frontend: `DriveContext`

- **Fase:** D
- **Escopo:** `contexts/DriveContext.tsx` com state `{[clientId]: DriveSyncState}` + actions. Provider em `Providers.tsx`.
- **Arquivos:** Criar `contexts/DriveContext.tsx`, modificar `components/layout/Providers.tsx`.
- **Depende de:** D03.
- **CAs:** —.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-D05 — Frontend: ConnectDriveModal (T-31)

- **Fase:** D
- **Escopo:** componente `components/drive/ConnectDriveModal.tsx`. Form: client (select), folder URL, critical_folders (subset multi-select). Botão "Conectar via Google" abre popup OAuth (window.open) com URL retornado por API-140. Listener `postMessage` recebe `result=success|error&reason=...`. Mostra reassurance "🔒 Apenas leitura" antes do botão.
- **Arquivos:** Criar `components/drive/ConnectDriveModal.tsx`. Page `app/admin/drive-sync/connect/page.tsx`.
- **Depende de:** D02.
- **CAs:** —.
- **Estimativa:** G.
- **Status:** ⬜.

### TASK-D06 — Frontend: T-32 SyncDashboard

- **Fase:** D
- **Escopo:** page `app/drive/[clientSlug]/page.tsx` server component que fetch `getDriveSyncState`. Renderiza `<SyncDashboard>` client component que usa `useDriveSyncPolling`. Sub-componentes: `SyncStatusIndicator` (Verde/Amarelo/Vermelho conforme spec §4.5), `ReadonlyBadge` permanente, `MetricsCard` (discovered/indexed/curated com tween 600ms), `OAuthStatusCard` (data expira + botão Reconectar quando OAUTH_EXPIRED), `ExclusionsCard`, `DriveWriteAttemptsCounter` (deve ser 0; vermelho se > 0).
- **Arquivos:** Criar `app/drive/[clientSlug]/page.tsx`, `components/drive/SyncDashboard.tsx`, `components/drive/SyncStatusIndicator.tsx`, `components/drive/ReadonlyBadge.tsx`, `components/drive/MetricsCard.tsx`, `components/drive/OAuthStatusCard.tsx`, `components/drive/ExclusionsCard.tsx`, `components/drive/DriveWriteAttemptsCounter.tsx`.
- **Depende de:** D04.
- **CAs:** CA-19, CA-40, CA-41, CA-42.
- **Estimativa:** G.
- **Status:** ⬜.

### TASK-D07 — Frontend: T-33 SuggestionInbox

- **Fase:** D
- **Escopo:** page `app/drive/[clientSlug]/sugestoes/page.tsx`. Componente client `SuggestionInbox` que lista suggestions com filter por `kind` e ordenação por `confidence`. Sub-componentes: `SuggestionCard` (preview, kind badge, confidence badge), `ConfidenceBadge` (0-1 colorido), `RationaleDisclosure` (collapsible), `DecisionButtons` (Aceitar/Rejeitar/Adiar 30d), `PreviewModal` (fetch on-demand API-146 com `<iframe>` ou viewer apropriado por mime). Microinterações §4.11: accept = checkmark + scale + slide-out; reject = slide-right + fade.
- **Arquivos:** Criar `app/drive/[clientSlug]/sugestoes/page.tsx`, 6 componentes em `components/drive/`.
- **Depende de:** D04.
- **CAs:** CA-22, CA-23, CA-24.
- **Estimativa:** G.
- **Status:** ⬜.

### TASK-D08 — Frontend: hook `useCurationSuggestions` com mutations otimistas

- **Fase:** D
- **Escopo:** `hooks/useCurationSuggestions.ts` com fetch + paginação cursor + mutations otimistas para `decide`. Em caso de 409 (já decidida), reverter UI + toast.
- **Arquivos:** Criar `hooks/useCurationSuggestions.ts`.
- **Depende de:** D02.
- **CAs:** CA-23.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-D09 — Backend: GET /api/drive/documents (API-145)

- **Fase:** D
- **Escopo:** handler que: SELECT `drive_documents` filtrado `client_id` + `last_seen_at > now()-30d`, paginação cursor. Para cada doc, aplicar `AccessGuard.can_read(principal, doc.acl_snapshot)`. Filtra docs onde guard retorna false. Retorna lista paginada.
- **Arquivos:** Modificar `api/drive/router.py`, criar `api/drive/access_guard.py`.
- **Depende de:** B06.
- **CAs:** CA-12, CA-13, CA-14.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-D10 — Backend: GET /api/drive/documents/{id}/content (API-146)

- **Fase:** D
- **Escopo:** handler que: aplica AccessGuard; se ok, decrypt OAuth; chama `download_content(drive_file_id)`; stream response com Content-Type do MIME. Para arquivos > 100MB, redirect para signed URL (TODO-DESIGN — usar Drive `webContentLink` se disponível). Caso AccessGuard nega, **404** (caixa-preta).
- **Arquivos:** Modificar `api/drive/router.py`.
- **Depende de:** D09.
- **CAs:** CA-12.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-D11 — Backend: GET /api/drive/suggestions (API-147) + POST /decide (API-148)

- **Fase:** D
- **Escopo:**
- API-147: SELECT `curation_suggestions` filtered (status, kind, client_id), join `drive_documents` para snippet. Cursor paginação.
- API-148: handler que valida role Líder. SELECT FOR UPDATE; se status != PENDING → 409. Se decision=ACCEPT + kind=IMPORT_TO_LIBRARY → valida tags ≥ 2 + description ≥ 50 (RN-006); enfileira Importer. UPDATE status, decided_by, decided_at. INSERT EV-39 outbox.
- **Arquivos:** Modificar `api/drive/router.py`.
- **Depende de:** B06.
- **CAs:** CA-22, CA-23, CA-24, CA-27, CA-28.
- **Estimativa:** G.
- **Status:** ⬜.

### TASK-D12 — Backend: Importer integrado a pipeline DFL-03

- **Fase:** D
- **Escopo:** em `api/drive/importer.py`, `Importer.run(suggestion_id)`:
  - SELECT suggestion + document.
  - Decrypt OAuth → `download_content(drive_file_id)`.
  - Chama API interna ou função compartilhada de BC-02 para ingestion (chunking + embedding + KG). Se BC-02 expõe HTTP, POST `/api/biblioteca/items` com bytes + metadata + `provenance.drive_document_id`.
  - Recebe `knowledge_item_id`.
  - UPDATE `drive_documents.curated_as_knowledge_item_id`.
  - UPDATE `curation_suggestions.payload.knowledge_item_id` (ou coluna dedicada se preferir).
  - Re-INSERT EV-39 com `knowledge_item_id` resolvido.
  - Retry 3x exponencial; em falha total, UPDATE suggestion `status='PENDING'` (volta para fila) + alerta.
- **Arquivos:** Criar `api/drive/importer.py`. Possivelmente modificar BC-02 client `lib/api.ts` server-side.
- **Depende de:** D11.
- **CAs:** CA-26, CA-29, CA-30.
- **Estimativa:** G.
- **Status:** ⬜.

### TASK-D13 — Frontend: integração pipeline + toast de sucesso

- **Fase:** D
- **Escopo:** ao receber 200 de POST /decide com `knowledge_item_id` (após import), mostrar toast "Importado para Biblioteca como '{title}'". Polling do KnowledgeItem se ainda não pronto (Importer async).
- **Arquivos:** Modificar `components/drive/SuggestionInbox.tsx`.
- **Depende de:** D08, D12.
- **CAs:** —.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-D14 — Backend: vocabulário enforcement em CurationAgent.rationale

- **Fase:** D
- **Escopo:** post-processor em `CurationAgent` que substitui em `rationale`: "gerar"→"criar", "otimizar"→"melhorar"/"ajustar", "smart"→"inteligente"/"adequado". Test fixture obriga.
- **Arquivos:** Modificar `api/drive/curation_agent.py`.
- **Depende de:** C01.
- **CAs:** CA-44.
- **Estimativa:** P.
- **Status:** ⬜.

### TASK-D15 — Testes E2E + Acessibilidade

- **Fase:** D
- **Escopo:**
- Playwright E2E: OAuth → sync → suggestion appear → decide ACCEPT → KnowledgeItem na Biblioteca.
- axe-core scan em T-32 e T-33: 0 violações AA.
- Keyboard navigation manual: all decision buttons reachable.
- prefers-reduced-motion: animações desativam.
- ARIA live region: novas suggestions anunciadas.
- Vocabulário scan: grep "gerar|otimizar|eficiência" em copies de UI → 0 hits (CA-43).
- **Arquivos:** Criar `tests/e2e/drive_flow.spec.ts`, `tests/a11y/drive.test.ts`.
- **Depende de:** D06, D07, D11, D12.
- **CAs:** CA-43, CA-44.
- **Estimativa:** G.
- **Status:** ⬜.

---

## Fase E — Webhook + Channel renewal + Exclusions ⚠️ BLOQUEADA POR PRE-01 + PRE-04

### TASK-E01 — POST /api/drive/webhook (API-144) — Drive Push receiver

- **Fase:** E
- **Escopo:** handler que: valida headers `X-Goog-Channel-ID`, `X-Goog-Resource-State`, `X-Goog-Notification-ID`. Lookup `drive_push_channels` por channel_id. Se válido, enfileira `ListChangesWorker` para o folder em Cloud Tasks. **Sempre retorna 200** (evitar Google retry storms). Logs sem PII.
- **Arquivos:** Criar `api/drive/webhook.py`. Modificar `api/drive/router.py`.
- **Depende de:** B06.
- **CAs:** CA-08.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-E02 — Channel registration ao conectar pasta crítica

- **Fase:** E
- **Escopo:** em `oauth_callback_handler` (B03), para cada `critical_folder_id`, chamar `sdk_wrapper.watch_folder` com `channel_id=uuid4()`, `address=https://.../api/drive/webhook`. INSERT em `drive_push_channels`. TTL 7 dias.
- **Arquivos:** Modificar `api/drive/oauth_vault.py`.
- **Depende de:** B03, A03.
- **CAs:** —.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-E03 — Channel renewal job (ADR-LOCAL-06)

- **Fase:** E
- **Escopo:** job `drive-channel-renewal` rodando diariamente. SELECT `drive_push_channels WHERE expires_at < now() + 24h`. Para cada um: `watch_folder` com novo `channel_id`; UPDATE row com novo channel_id + expires_at; cleanup do channel antigo via `channels.stop`. Cron `0 3 * * *` (madrugada). Se falha 3x consecutivos: alerta `ChannelRenewalFailed`.
- **Arquivos:** Criar `api/drive/channel_renewal.py`. Provisionar Cloud Scheduler.
- **Depende de:** E02.
- **CAs:** —.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-E04 — GET /api/drive/cleanup-reports (API-149)

- **Fase:** E
- **Escopo:** handler que SELECT `drive_cleanup_reports` por `client_id` + opcional `period_start/end`, cursor pagination. Aplica RBAC (Líder ou superior); 404 caixa-preta.
- **Arquivos:** Modificar `api/drive/router.py`.
- **Depende de:** C05.
- **CAs:** CA-34.
- **Estimativa:** P.
- **Status:** ⬜.

### TASK-E05 — DELETE /api/drive/oauth (API-150) — Revoke + Purge

- **Fase:** E
- **Escopo:** handler que:
  - Valida role Admin.
  - Valida `reason` ≥ 30 chars (400).
  - Se `purge_indexed_content=true`, exige header `X-Confirm-Destructive: true` (412).
  - TX: UPDATE `drive_syncs.status='REVOKED'`; UPDATE `drive_oauth_credentials.revoked_at=now()`; KMS hard-delete tokens (sobrescreve com NULL); INSERT `audit_log_drive` (action=REVOKE, severity=WARN).
  - Cancela cron `drive-sync-{client_id}` e channels Drive Push.
  - Se purge: enfileira Cloud Tasks job `purge-drive-knowledge-items`.
  - Retorna `{status, documents_will_be_deleted, knowledge_items_will_be_deleted, purge_job_id}`.
- **Arquivos:** Modificar `api/drive/router.py`. Criar `api/drive/purge.py`.
- **Depende de:** B07.
- **CAs:** CA-35, CA-36, CA-37, CA-38, CA-39.
- **Estimativa:** G.
- **Status:** ⬜.

### TASK-E06 — Purge async job

- **Fase:** E
- **Escopo:** `purge_drive_knowledge_items(client_id)`: SELECT `KnowledgeItem`s com `provenance.drive_document_id` em `drive_documents.client_id=X`. DELETE em batch (1000 por vez). DELETE `drive_documents` em cascade. Audit log entry.
- **Arquivos:** Modificar `api/drive/purge.py`.
- **Depende de:** E05.
- **CAs:** CA-39.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-E07 — Frontend: ExclusionsManager (`/admin/drive-sync/exclusions`)

- **Fase:** E
- **Escopo:** page `app/admin/drive-sync/exclusions/page.tsx`. Componente `ExclusionsManager` que: lista clientes com sync ativo; busca; modal de exclusão exige razão (textarea ≥ 30 chars) + checkbox "Purgar índices vetoriais"; segunda confirmação (digite nome cliente). Após DELETE 200, toast com `purge_job_id` e link para audit log.
- **Arquivos:** Criar `app/admin/drive-sync/exclusions/page.tsx`, `components/drive/ExclusionsManager.tsx`, `components/drive/ExcludeClientModal.tsx`.
- **Depende de:** E05.
- **CAs:** CA-35, CA-36, CA-37.
- **Estimativa:** G.
- **Status:** ⬜.

### TASK-E08 — OAuthExpired alert + UI handling

- **Fase:** E
- **Escopo:** Job que verifica `drive_oauth_credentials.expires_at < now() + 7d`; emite EV-41 OAuthExpired + SafetyAlert MEDIUM. Frontend T-32 OAuthStatusCard mostra warning glow + botão "Reconectar".
- **Arquivos:** Criar `api/drive/oauth_expiry_check.py`. Modificar `components/drive/OAuthStatusCard.tsx`.
- **Depende de:** D06.
- **CAs:** —.
- **Estimativa:** M.
- **Status:** ⬜.

---

## Fase F — Observabilidade + Polish

### TASK-F01 — Métricas Prometheus/Cloud Monitoring (11 métricas)

- **Fase:** F
- **Escopo:** instrumentar todas as 11 métricas listadas em design §7.2. Histograms com buckets adequados; counters com tags; gauges com poll periódico.
- **Arquivos:** Modificar todos os módulos `api/drive/*.py` para emitir métricas.
- **Depende de:** todas as fases anteriores.
- **CAs:** CA-18.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-F02 — Alertas (6 alertas) configurados

- **Fase:** F
- **Escopo:** Cloud Monitoring policies (Terraform) para os 6 alertas em design §7.4. Cada um testado via injeção controlada (rodar fixture que dispara cada alerta).
- **Arquivos:** Criar `terraform/drive_alerts.tf`. Documento `api/drive/RUNBOOK_ALERTS.md`.
- **Depende de:** F01.
- **CAs:** CA-18, CA-42.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-F03 — Dashboard Cloud Monitoring + MLflow runbook

- **Fase:** F
- **Escopo:** dashboard Cloud Monitoring com painéis: sync runs, sync duration, sync lag (per critical/regular folder), API calls vs. quota, write attempts (=0), suggestion pending count, agent latency, outbox backlog, KMS decrypt latency, ACL denials. Documento `api/drive/RUNBOOK_MLFLOW.md` explicando como filtrar traces por client_id e analisar latência por sub-tool.
- **Arquivos:** Criar `terraform/drive_dashboard.tf`. Criar `api/drive/RUNBOOK_MLFLOW.md`.
- **Depende de:** F01, C08.
- **CAs:** CA-46.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-F04 — Atualizar CLAUDE.md (raiz) + api/CLAUDE.md

- **Fase:** F
- **Escopo:** adicionar em CLAUDE.md raiz seção "Drive Read-Only Curation (FA-14)" com rota `/drive/[clientSlug]` + componentes em `components/drive/`. Em `api/CLAUDE.md`, módulo `api/drive/`.
- **Arquivos:** Modificar `CLAUDE.md`, `api/CLAUDE.md`.
- **Depende de:** D06.
- **CAs:** —.
- **Estimativa:** P.
- **Status:** ⬜.

### TASK-F05 — Sunset stub de DFL-03 (se aplicável) + cleanup

- **Fase:** F
- **Escopo:** Se na Fase D foi usado stub de BC-02 para integração, agora substituir por integração real e remover stub. Limpar fixtures de dev. Remover `POC_CHECKLIST.md` e `PROTOTIPO_CHECKLIST.md` (foram artefatos transitórios).
- **Arquivos:** Modificar conforme necessário; remover stubs.
- **Depende de:** D12.
- **CAs:** —.
- **Estimativa:** M.
- **Status:** ⬜.

### TASK-F06 — Handoff de fim de SPEC + métricas piloto

- **Fase:** F
- **Escopo:** após ≥30 dias de Piloto, coletar métricas: taxa de aceitação de sugestões, tempo médio decision, top 3 mime types ingeridos, anomalias. Decisão: ADR-011 deepagents migration agendada via /schedule? Documento `docs/handoff/sessions/<data>-spec-006-fim.md`.
- **Arquivos:** Criar handoff em `docs/handoff/sessions/`.
- **Depende de:** F05.
- **CAs:** — (gate Fase F).
- **Estimativa:** M.
- **Status:** ⬜.

---

## Mapa CA ↔ Tasks (backward mapping)

| CA | Tasks que cobrem |
|----|-------------------|
| CA-01 | B02, B09 |
| CA-02 | B01, B02 |
| CA-03 | B03, B09 |
| CA-04 | B03 |
| CA-05 | B03, B09 |
| CA-06 | B02 |
| CA-07 | B06, B09 |
| CA-08 | E01 |
| CA-09 | B06 |
| CA-10 | B06 |
| CA-11 | B05 |
| CA-12 | D09, D10 |
| CA-13 | B01, D09, B09 |
| CA-14 | B01, D09, B09 |
| CA-15 | B04, B09 |
| CA-16 | A07 |
| CA-17 | A07 |
| CA-18 | F01, F02 |
| CA-19 | D06 |
| CA-20 | C01, C03, C07 |
| CA-21 | C01, C03, C07 |
| CA-22 | D07, D11 |
| CA-23 | D07, D08, D11 |
| CA-24 | D07, D11 |
| CA-25 | C04, C07 |
| CA-26 | D12 |
| CA-27 | A05, D11 |
| CA-28 | A05, D11 |
| CA-29 | D12 |
| CA-30 | D12 |
| CA-31 | C05, C07 |
| CA-32 | C05, C07 |
| CA-33 | C06 |
| CA-34 | E04 |
| CA-35 | A05, E05, E07 |
| CA-36 | A05, E05, E07 |
| CA-37 | E05, E07 |
| CA-38 | E05 |
| CA-39 | E05, E06 |
| CA-40 | D06 |
| CA-41 | D06, E08 |
| CA-42 | D06, F02 |
| CA-43 | D15 |
| CA-44 | D14, D15 |
| CA-45 | B08 |
| CA-46 | C08, F03 |

## Mapa Tasks ↔ FRs / RNs / ADRs

| Item | Tasks |
|------|-------|
| FR-171 | B01, B02, B03, D05 |
| FR-172 | B05, B06, B07 |
| FR-173 | D09, D10, B01 (caixa-preta) |
| FR-174 | A07, F01, D06 |
| FR-175 | C05, C06, E04 |
| FR-176 | C01, C02, C03, D07, D08, D11 |
| FR-177 | D11, D12, D13 |
| FR-178 | E05, E06, E07 |
| FR-179 | D06, E08 |
| RN-027 | A07, F01 |
| RN-028 | D09 (AccessGuard), B01 |
| RN-029 | C01, C03, D14 |
| RN-030 | B06, B07, E01, E02, E03 |
| RN-009/011 (caixa-preta) | B01, D09, D10, E04 |
| RN-010 (cross-client) | B01, B09, D09 |
| RN-006 (tags+desc) | A05, D11 |
| ADR-009 | (pre-condição) — todas as fases C+ bloqueadas |
| ADR-011 (compat) | C01 (LangGraph nativo), C09 (validação) |
| ADR-LOCAL-01 (outbox) | A03, A08, C03 |
| ADR-LOCAL-02 (cron 15min + webhook) | B07, E01, E02, E03 |
| ADR-LOCAL-03 (content_hash) | B06, C05 |
| ADR-LOCAL-04 (KMS per env) | A06 |
| ADR-LOCAL-05 (LangGraph compat) | C01 |
| ADR-LOCAL-06 (channel renewal) | E03 |

## Prompt para Agente (template por task)

> Implemente **TASK-XXX** da SPEC `docs/specs/large/drive-readonly-curation/` no projeto sunOS.
>
> **Antes de tudo, leia (nesta ordem):**
> 1. `docs/specs/large/drive-readonly-curation/constitution.md` — princípios não-negociáveis. Atenção especial à PRE-01 se estiver em fase C+.
> 2. `docs/specs/large/drive-readonly-curation/spec.md` — comportamento externo + 46 CAs.
> 3. `docs/specs/large/drive-readonly-curation/design.md` — arquitetura + 6 ADRs locais.
> 4. `docs/specs/large/drive-readonly-curation/plan.md` (a fase desta task).
> 5. Esta task em `tasks.md`.
>
> **Restrições obrigatórias.**
> - Drive **nunca é escrito** (RN-027 + ADR-009). SDK wrapper bloqueia em runtime.
> - Curadoria sempre humana (RN-029). CurationAgent só CRIA `PENDING`; nunca transita status.
> - Cross-client guard (RN-010): toda query filtra `client_id`. 404 (não 403) — caixa-preta (RN-011).
> - OAuth tokens encriptados via KMS; plaintext nunca persistido.
> - Vocabulário Suno: nunca "gerar"/"otimizar"; sempre Koro com K, Drive com D.
> - PRE-01: tasks de Fase C+ exigem ADR-009 = Aceito (alinhamento Guga).
>
> **Escopo desta task (resumo):** _<copiar `Escopo` da task>_
>
> **Arquivos a criar/modificar:** _<lista da task>_
>
> **CAs a verificar antes de marcar como concluída:** _<lista da task>_
>
> **Não amplie o escopo.** Se identificar dependência, parar e reportar.

<!-- REVIEW: As 58 tasks são implementáveis e testáveis isoladamente? Granularidade adequada (nem grande demais, nem micro)? Falta task crítica (ex: feature flag para habilitar UI gradualmente; permission seed; backfill?)? Estimativas T-shirt batem com a realidade do time (1 BE + 1 FE + 0.3 design + 0.5 SRE + 0.2 LGPD)? -->

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-04-30 | Versão inicial — 58 tasks (A01–A09, B01–B10, C01–C10, D01–D15, E01–E08, F01–F06) com mapa CA↔Task e Item↔Task. PRE-01 explícito como bloqueio para Fases C+. |
