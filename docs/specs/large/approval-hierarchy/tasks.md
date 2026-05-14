---
spec-id: SPEC-004
slug: approval-hierarchy
artefato: tasks
atualizada: 2026-04-30
versao: 1.0
---

# Tasks — Aprovação Hierárquica (FA-13)

Backlog atômico. Cada task: implementável e testável **isoladamente** (com suas dependências satisfeitas). A ordem dos IDs reflete a sequência sugerida em `plan.md`. Estimativas são **T-shirt** (P=≤4h, M=4–16h, G=16–32h, GG=32h+).

**Convenções.**
- **Arquivos** sempre em paths absolutos a partir da raiz do repo (`/Users/heitor.miranda/projects/suno-os/`).
- **CAs** referenciam `spec.md §7`.
- **Vínculos** = FRs/RNs/ADRs/Eventos relacionados.
- **Dependências** = outros TASK-* que devem estar concluídos.

## Resumo

| Fase | Tasks | Estimativa |
|------|-------|------------|
| A — Foundation | A01–A09 | 5–7 dias |
| B — Submit + Validators | B01–B11 | 8–10 dias |
| C — Inbox + Detail + Decisão | C01–C20 | 12–15 dias |
| D — Anti-loop + Resubmit | D01–D06 | 4–6 dias |
| E — Chain admin + Notify | E01–E11 | 6–8 dias |
| F — Observabilidade + Polish | F01–F09 | 5–7 dias |
| **Total** | **66 tasks** | **40–55 dias** |

---

## Fase A — Foundation

### TASK-A01 — Criar estrutura de diretório `api/approval/`

- **Escopo.** Criar `api/approval/` com `__init__.py` vazios em subdirs `validators/`, `models/` (se necessário; senão modelos inline em `models.py`). Adicionar import em `api/main.py` para registrar router (placeholder ainda).
- **Arquivos.**
  - Criar: `api/approval/__init__.py`, `api/approval/validators/__init__.py`
  - Modificar: `api/main.py` (adicionar `app.include_router(approval_router)` placeholder)
- **Vínculos.** Nenhum (estrutura).
- **CAs.** Nenhum direto; pré-requisito.
- **Estimativa.** P
- **Depende de.** —

### TASK-A02 — Alembic migration: ENT-34 a ENT-38 + `approval_event_outbox`

- **Escopo.** Criar migration `2026XXXX_create_approval_tables.py` com:
  - `CREATE TABLE approval_chains` (ENT-34) com índice `idx_chain_active`.
  - `CREATE TABLE approval_chain_levels` (ENT-35) com CHECK constraint USER xor ROLE.
  - `CREATE TABLE approval_requests` (ENT-36) com índices `idx_ar_inbox`, `idx_ar_submitter`, `idx_ar_client_status`. **Inclui coluna nova:** `requires_admin_attention BOOLEAN NOT NULL DEFAULT false` (ADR-LOCAL-04).
  - `CREATE TABLE approval_decisions` (ENT-37) com UNIQUE(request_id, level_order, round) + índices `idx_ad_request`, `idx_ad_approver`.
  - `CREATE TABLE validation_reports` (ENT-38) com UNIQUE(request_id, round) + índice `idx_vr_request`.
  - `CREATE TABLE approval_event_outbox` com índice `idx_outbox_pending`.
  - Funções `approval_decisions_immutable()`, `approval_requests_snapshot_immutable()`, `validation_reports_immutable()` + 3 triggers.
- **Arquivos.** Criar `api/migrations/versions/2026XXXX_create_approval_tables.py`.
- **Vínculos.** ENT-34..38, RN-024 (imutabilidade), ADR-LOCAL-01 (outbox), ADR-LOCAL-04 (flag).
- **CAs.** CA-19, CA-20 (triggers funcionam).
- **Estimativa.** M
- **Depende de.** TASK-A01

### TASK-A03 — SQLAlchemy ORM models

- **Escopo.** Em `api/approval/models.py`, criar classes ORM: `ApprovalChain`, `ApprovalChainLevel`, `ApprovalRequest`, `ApprovalDecision`, `ValidationReport`, `ApprovalEventOutbox`. Mapear relacionamentos REL-27..REL-31. Tipo `JSONB` para `subject_snapshot`, `brand_findings`, `portugues_findings`, `attachments`, `escalation_policy`, `payload`.
- **Arquivos.** Criar `api/approval/models.py`.
- **Vínculos.** ENT-34..38.
- **Estimativa.** M
- **Depende de.** TASK-A02

### TASK-A04 — Pydantic schemas (SCH-013/014/015 + request/response models)

- **Escopo.** Em `api/approval/schemas.py`:
  - `Finding`, `ValidationReportSchema` (SCH-014).
  - `ChainLevelSchema`, `ApprovalChainSchema` (SCH-015).
  - `ApprovalRequestSchema` (SCH-013).
  - `SubmitRequest`, `SubmitResponse`.
  - `InboxItem`, `InboxResponse`.
  - `RequestDetailResponse` (com inline validation_report + chain + decisions_history).
  - `DecideRequest`, `DecideResponse`.
  - `ResubmitRequest`, `ResubmitResponse`.
  - `ChainCreateRequest`, `ChainListResponse`.
- **Arquivos.** Criar `api/approval/schemas.py`.
- **Vínculos.** SCH-013, SCH-014, SCH-015.
- **Estimativa.** M
- **Depende de.** TASK-A03

### TASK-A05 — Provisionar Pub/Sub topic `sunos.approval.events`

- **Escopo.** Adicionar Terraform (ou script equivalente) para criar topic + subscription para `NotificationDispatcher`, `AuditLogger` e `MetricsExporter`. Configurar IAM (service account do backend pode publish; consumers podem subscribe).
- **Arquivos.** Modificar `infra/terraform/pubsub.tf` (ou equivalente) — caminho exato confirmar com SRE.
- **Vínculos.** INT-TB-20.
- **Estimativa.** P
- **Depende de.** —

### TASK-A06 — Event publisher idempotente + outbox worker

- **Escopo.**
  - Em `api/approval/events.py`: classe `EventPublisher` com método `enqueue(event_type, payload)` que faz INSERT em `approval_event_outbox` com `event_id=uuid4()`. **Recebe `db_session`** e roda na transação do caller.
  - Em `api/approval/outbox.py`: worker async (loop ou Celery task — preferência: simples loop com `asyncio.create_task` no startup do FastAPI) que roda a cada 1s, faz `SELECT ... FOR UPDATE SKIP LOCKED LIMIT 50` em outbox pendentes, publica para Pub/Sub, atualiza `published_at`. Em falha, incrementa `attempts` e seta `last_error`. Após 5 attempts, log + alerta + DLQ flag.
- **Arquivos.** Criar `api/approval/events.py`, `api/approval/outbox.py`.
- **Vínculos.** ADR-LOCAL-01, EV-28..34.
- **CAs.** Pre-requisito de CA-04 e demais que dependem de eventos.
- **Estimativa.** G
- **Depende de.** TASK-A02, TASK-A03, TASK-A05

### TASK-A07 — Dependency injection: `current_user_with_client`

- **Escopo.** Em `api/core/auth.py` (existente, estender), adicionar `Depends(get_current_user_with_client)` que retorna um `User` Pydantic com `user_id`, `client_id` (do contexto), `roles: list[str]`. Para esta SPEC, `client_id` resolvido via JWT claim ou via header `X-Client-Id` (se Admin operando cross-client) — a regra exata fica em uma constant `RESOLVE_CLIENT_ID_STRATEGY`.
- **Arquivos.** Modificar `api/core/auth.py`.
- **Vínculos.** CTM-01 dependência.
- **Estimativa.** M
- **Depende de.** —

### TASK-A08 — Subject store interface (resolver polymorphic)

- **Escopo.** Criar `api/approval/subject_store.py` com função `get_subject(subject_type, subject_id, client_id) -> Subject | None`. Dispatch por `subject_type` para os repos existentes (sparks, turns, workflow_outputs). Retorna `None` se cross-tenant (não levanta — caller decide o status code). Também expõe `mark_validated(subject_type, subject_id, approved_at, approved_by)`.
- **Arquivos.** Criar `api/approval/subject_store.py`.
- **Vínculos.** DO-43 invariante 5.
- **Estimativa.** M
- **Depende de.** TASK-A03

### TASK-A09 — Test fixtures e Pub/Sub emulator setup

- **Escopo.** Em `api/tests/conftest.py`, fixtures: `approval_test_db` (schema isolado por teste), `pubsub_emulator` (subprocess do emulator gcloud), `seed_chain` (cria 1 chain de 3 níveis para um cliente teste), `seed_user` (Operacional/Líder/Sócio). README de como rodar local.
- **Arquivos.** Modificar `api/tests/conftest.py`, criar `api/tests/README.md` se inexistente.
- **Estimativa.** M
- **Depende de.** TASK-A02, TASK-A03

---

## Fase B — Submit + Validators paralelos (POC)

### TASK-B01 — Router placeholder + endpoint POST /api/approval/submit (API-130)

- **Escopo.** Em `api/approval/router.py`, criar APIRouter com prefix `/api/approval`. Endpoint `POST /submit` que recebe `SubmitRequest`, chama `service.submit(...)`, retorna `SubmitResponse`. 401 se sem JWT, 400/404/409/403 conforme spec.md §4.3.
- **Arquivos.** Criar `api/approval/router.py`, modificar `api/main.py`.
- **Vínculos.** API-130, FR-160.
- **CAs.** CA-02, CA-05, CA-06.
- **Estimativa.** M
- **Depende de.** TASK-A04, TASK-A07

### TASK-B02 — SubmitController (`submit.py`)

- **Escopo.** `api/approval/submit.py`:
  1. Resolver subject via `subject_store.get_subject(...)`. Se `None` ou cross-tenant → raise ValidationError mapeada para 400.
  2. Resolver chain ativo: `SELECT * FROM approval_chains WHERE client_id=? AND status='ACTIVE' AND (applies_to_skill_id IS NULL OR applies_to_skill_id=?)` ordenado por specificity (skill-specific antes default). Se vazio → 404.
  3. Verificar duplicata: `SELECT request_id FROM approval_requests WHERE client_id=? AND subject_id=? AND status NOT IN ('APPROVED','REJECTED','EXPIRED')` → 409 com `request_id`.
  4. Capturar `subject_snapshot = subject.to_dict()`.
  5. INSERT em `approval_requests` com `current_round=1`, `current_level_order=0`, `status='PENDING_VALIDATION'`, `expires_at=null` (calculado depois quando rotear).
  6. Enqueue EV-28 + EV-29 via outbox (mesma transação).
  7. COMMIT.
  8. Disparar ValidationOrchestrator via `BackgroundTasks` (FastAPI built-in) ou Pub/Sub (preferência: BackgroundTasks no MVP — simples).
  9. Retornar 201 com payload.
- **Arquivos.** Criar `api/approval/submit.py`.
- **Vínculos.** API-130, DFL-08.1–4, EV-28, EV-29.
- **CAs.** CA-02, CA-03, CA-04, CA-05, CA-06.
- **Estimativa.** G
- **Depende de.** TASK-B01, TASK-A06, TASK-A08

### TASK-B03 — BaseValidator ABC

- **Escopo.** `api/approval/validators/base.py`: classe `BaseValidator` com:
  - Atributos: `name: str`, `version: str`, `timeout_seconds: int = 60`.
  - Método `async validate(subject_snapshot: dict, client_id: str) -> list[Finding]` (abstract).
  - Helper `_safe_run(...)` que wrappa em `asyncio.wait_for` e converte timeout em finding sintético `Finding(severity='error', message='Timeout no validator X', span={'start':0,'end':0}, suggestion=None)`.
- **Arquivos.** Criar `api/approval/validators/base.py`.
- **Vínculos.** RN-023, ADR-008, compatibilidade ADR-011 (constitution §9).
- **Estimativa.** P
- **Depende de.** TASK-A04

### TASK-B04 — BrandValidatorAgent (com stub de brand-guidelines)

- **Escopo.** `api/approval/validators/brand.py`. Subclasse de `BaseValidator`. Tool: `fetch_brand_guidelines(client_id)` — POC: retorna JSON local mockado. Prompt-system pinado contendo instruções de tom Suno + vocabulário (lista de palavras proibidas: "gerar", "otimizar", "eficiência", "accelerator", "Coro com C"). LLM call via `langchain-google-genai` com Gemini Flash. Output → `Finding[]`.
- **Arquivos.** Criar `api/approval/validators/brand.py` + `api/approval/validators/_brand_guidelines_stub.json`.
- **Vínculos.** FR-162, RN-023.
- **CAs.** Cobertura parcial CA-12 (versions); CA-41 (palavra "gerar" gera finding warning) — testar com fixture específica.
- **Estimativa.** G
- **Depende de.** TASK-B03

### TASK-B05 — PortuguêsValidatorAgent

- **Escopo.** `api/approval/validators/portugues.py`. Subclasse de `BaseValidator`. Sem tool externa. Prompt pinado para gramática, ortografia, idioma PT-BR. LLM call via Gemini Flash. Output → `Finding[]`.
- **Arquivos.** Criar `api/approval/validators/portugues.py`.
- **Vínculos.** FR-163, RN-023.
- **Estimativa.** M
- **Depende de.** TASK-B03

### TASK-B06 — ValidationOrchestrator (`orchestrator.py`)

- **Escopo.** `api/approval/orchestrator.py`. Função `async def validate(request_id: UUID)`:
  1. SELECT request + subject_snapshot + client_id.
  2. Instanciar BrandValidator + PortuguêsValidator.
  3. `results = await asyncio.gather(brand.validate(...), portugues.validate(...), return_exceptions=True)` com tracking de latência por validator.
  4. Consolidar `status` por regra do FR-164: blocking se algum tem error/timeout, warning se algum tem warning, pass se nenhum.
  5. INSERT `validation_reports` com `latency_ms = max(brand_latency, portugues_latency)`.
  6. UPDATE `approval_requests` SET `validation_report_id=?` E SE `status=BLOCKING_ERRORS` SET `status='CHANGES_REQUESTED'`.
  7. Enqueue EV-30.
  8. COMMIT.
  9. Se status ≠ BLOCKING_ERRORS: chamar `chain_router.advance(request_id)` (TASK-C04).
- **Arquivos.** Criar `api/approval/orchestrator.py`.
- **Vínculos.** FR-161, FR-164, RN-023, ADR-008, EV-30.
- **CAs.** CA-07, CA-08, CA-09, CA-10, CA-11.
- **Estimativa.** G
- **Depende de.** TASK-B04, TASK-B05, TASK-A06

### TASK-B07 — MLflow tracing setup para validators

- **Escopo.** Decorators `@mlflow.trace` em `validate()` de cada validator + no `validate(request_id)` do orchestrator. Tags: `client_id`, `request_id`, `round`, `validator_name`, `validator_version`. Configuração de tracking URI vem do env (já existente).
- **Arquivos.** Modificar `api/approval/validators/brand.py`, `api/approval/validators/portugues.py`, `api/approval/orchestrator.py`.
- **Vínculos.** Constitution §5.1, design §7.1.
- **CAs.** CA-07 (tracing visualiza paralelismo).
- **Estimativa.** M
- **Depende de.** TASK-B06

### TASK-B08 — Testes integração: POST /submit + validators

- **Escopo.** `api/tests/integration/test_submit.py` cobrindo:
  - Happy path 201 com fixtures de seed + chain + subject mock.
  - 400 cross-tenant.
  - 404 sem chain ativo.
  - 409 request duplicada.
  - 403 não-autor.
  - Verificação de outbox: EV-28 e EV-29 enfileirados.
  - Verificação ValidationReport persistido após orchestrator (await `BackgroundTasks` flush).
- **Arquivos.** Criar `api/tests/integration/test_submit.py`.
- **CAs.** CA-02 a CA-06.
- **Estimativa.** G
- **Depende de.** TASK-B02, TASK-B06, TASK-A09

### TASK-B09 — Testes unitários: consolidação de ValidationReport

- **Escopo.** `api/tests/unit/test_orchestrator_consolidate.py`. Casos:
  - Brand pass + Português pass → PASS.
  - Brand warning + Português pass → WARNINGS_ONLY.
  - Brand error + Português pass → BLOCKING_ERRORS.
  - Brand timeout + Português pass → BLOCKING_ERRORS com finding sintético.
  - Latency = max.
- **Arquivos.** Criar `api/tests/unit/test_orchestrator_consolidate.py`.
- **CAs.** CA-08, CA-09, CA-10, CA-11.
- **Estimativa.** M
- **Depende de.** TASK-B06

### TASK-B10 — Teste destrutivo: triggers de imutabilidade

- **Escopo.** `api/tests/integration/test_immutability_triggers.py`:
  - `UPDATE approval_decisions SET comment='X' ...` → espera `psycopg.errors.RaiseException` ou similar.
  - `DELETE FROM approval_decisions ...` → idem.
  - `UPDATE approval_requests SET subject_snapshot='{"x":1}' ...` → idem.
  - `UPDATE validation_reports SET status='PASS' WHERE completed_at IS NOT NULL` → idem.
- **Arquivos.** Criar `api/tests/integration/test_immutability_triggers.py`.
- **CAs.** CA-19, CA-20.
- **Estimativa.** P
- **Depende de.** TASK-A02

### TASK-B11 — POC end-to-end manual checklist

- **Escopo.** Documento curto `docs/specs/large/approval-hierarchy/POC-CHECKLIST.md` com passos manuais:
  1. Subir backend local com Pub/Sub emulator.
  2. Aplicar migrations.
  3. Seedar chain + cliente + user.
  4. Curl POST /submit.
  5. Verificar trace MLflow.
  6. Verificar evento Pub/Sub publicado.
  7. Inspecionar `validation_reports` no DB.
- **Arquivos.** Criar `docs/specs/large/approval-hierarchy/POC-CHECKLIST.md`.
- **Estimativa.** P
- **Depende de.** TASK-B08

---

## Fase C — Inbox + Detail + Decisão + Carimbo (Protótipo)

### TASK-C01 — Endpoint GET /api/approval/inbox (API-131)

- **Escopo.** Em `router.py`, GET `/inbox?status=...&client_id=...&limit=...&cursor=...`. Service em `api/approval/inbox.py`:
  - Resolver levels onde o user é approver: `(approver_user_id = user.user_id) OR (approver_kind='ROLE' AND approver_role IN user.roles)` cruzado com chain ACTIVE de cada cliente.
  - SELECT requests onde `current_level_order = nivel_do_user_no_chain` AND `status='PENDING_APPROVAL'`. Filtros de cliente/tipo opcionais.
  - Ordenar por `expires_at` ASC.
  - Paginação cursor-based (encoded `expires_at + request_id`).
  - JOIN com submitter/client para enriquecer payload.
- **Arquivos.** Modificar `api/approval/router.py`, criar `api/approval/inbox.py`.
- **Vínculos.** API-131, FR-165, T-29.
- **CAs.** CA-13, CA-14.
- **Estimativa.** G
- **Depende de.** TASK-B02 (precisa de requests no DB para testar)

### TASK-C02 — Endpoint GET /api/approval/requests/{request_id} (API-132)

- **Escopo.** GET com authorization: submitter OR approver no chain ativo OR Líder/Admin do cliente. **Caso contrário: 404** (não 403 — RN-011).
- **Arquivos.** Modificar `api/approval/router.py`, adicionar service em `api/approval/detail.py`.
- **Vínculos.** API-132, FR-166, T-30.
- **CAs.** CA-15, CA-16, CA-17.
- **Estimativa.** G
- **Depende de.** TASK-C01

### TASK-C03 — Endpoint GET /api/approval/validation-reports/{report_id} (API-136)

- **Escopo.** GET standalone. Authorization igual API-132.
- **Arquivos.** Modificar `api/approval/router.py`.
- **Vínculos.** API-136, FR-164, FR-167.
- **Estimativa.** P
- **Depende de.** TASK-C02

### TASK-C04 — ChainRouter (`chain.py`)

- **Escopo.** Em `api/approval/chain.py`, função `async def advance(request_id: UUID)`:
  1. SELECT request + chain + levels.
  2. Determinar `next_level_order = current_level_order + 1`.
  3. Resolver approver (ADR-LOCAL-04 fallback chain): user_id direto ativo → role primeiro user ativo → próximo level → Líder do cliente → flag `requires_admin_attention=true`.
  4. UPDATE request: `current_level_order=next`, `status='PENDING_APPROVAL'`, `expires_at = now() + sla_hours_do_level`.
  5. Enqueue EV-31 com `approver_id` resolvido.
  6. Function pode ser chamada de orchestrator (após validation OK) e de DecisionRecorder (após APPROVE intermediário).
- **Arquivos.** Criar `api/approval/chain.py`.
- **Vínculos.** RN-024, RN-026, ADR-010, EV-31, ADR-LOCAL-04.
- **CAs.** CA-22, CA-34.
- **Estimativa.** G
- **Depende de.** TASK-A06

### TASK-C05 — DecisionRecorder (`decisions.py`)

- **Escopo.** Em `api/approval/decisions.py`, função `async def record(request_id, user, decision_request)`:
  1. SELECT request + chain levels.
  2. Validar: `request.status == 'PENDING_APPROVAL'` e `user.user_id` está em `chain_levels[current_level_order]`.
  3. Verificar não há decision para `(request_id, current_level_order, current_round)` (o UNIQUE garante, mas check antes para erro amigável).
  4. INSERT `approval_decisions` com `decision`, `comment`, `attachments`.
  5. Lógica de transição (FSM em design.md §10):
     - APPROVE final (`current_level_order == max_level`): UPDATE request → APPROVED, `final_decision_id`. Chamar `stamp.apply(request)`. Enqueue EV-33.
     - APPROVE intermediário: chamar `chain_router.advance(request_id)`.
     - REQUEST_CHANGES, round<3: UPDATE → CHANGES_REQUESTED. Enqueue EV-32.
     - REQUEST_CHANGES, round=3: UPDATE → EXPIRED. Enqueue EV-34. Retornar 200 com `next_status=EXPIRED` (não 4xx — o approver decidiu, não é erro).
     - REJECT: UPDATE → REJECTED, `final_decision_id`. Enqueue EV-33 com `next_action='final_rejection'`.
  6. Tudo em transação atômica.
- **Arquivos.** Criar `api/approval/decisions.py`.
- **Vínculos.** API-133, RN-024, RN-025, FR-167, EV-32/33/34, ADR-LOCAL-04.
- **CAs.** CA-18 a CA-23, CA-25.
- **Estimativa.** GG
- **Depende de.** TASK-C04, TASK-C06

### TASK-C06 — ValidatedStamp (`stamp.py`)

- **Escopo.** Em `api/approval/stamp.py`, função `async def apply(request)`:
  - Dispatch por `subject_type` para `subject_store.mark_validated(...)` (tasks A08).
  - Tolera 404 (subject deletado) — log + flag em request `subject_unavailable=true` (nova coluna? ou flag em metadata? — TODO confirmar; default: log + segue, sem flag por enquanto).
  - Idempotente.
- **Arquivos.** Criar `api/approval/stamp.py`.
- **Vínculos.** RN-024, design §10 transition AP, TODO-DESIGN-02.
- **CAs.** CA-21.
- **Estimativa.** M
- **Depende de.** TASK-A08

### TASK-C07 — Endpoint POST /api/approval/requests/{request_id}/decide (API-133)

- **Escopo.** Em `router.py`, POST que chama `decisions.record(...)`. Retorna 201 + payload.
- **Arquivos.** Modificar `api/approval/router.py`.
- **Vínculos.** API-133.
- **CAs.** CA-18, CA-22, CA-23, CA-25.
- **Estimativa.** P
- **Depende de.** TASK-C05

### TASK-C08 — Frontend: tipos compartilhados em `lib/approval-types.ts`

- **Escopo.** TypeScript types listados em design.md §4.4.
- **Arquivos.** Criar `lib/approval-types.ts`.
- **Estimativa.** P
- **Depende de.** TASK-A04 (referência aos schemas)

### TASK-C09 — Frontend: API client em `lib/api.ts` (extensão)

- **Escopo.** Adicionar funções:
  - `submitApproval(body): Promise<ApprovalRequestSchema>`
  - `getApprovalInbox(filters): Promise<InboxResponse>`
  - `getApprovalRequest(requestId): Promise<RequestDetailResponse>`
  - `decideApproval(requestId, body): Promise<DecideResponse>`
  - `resubmitApproval(requestId, body): Promise<ResubmitResponse>` (estub para Fase D)
  - `getValidationReport(reportId): Promise<ValidationReportSchema>`
- **Arquivos.** Modificar `lib/api.ts`.
- **Estimativa.** M
- **Depende de.** TASK-C08

### TASK-C10 — Frontend: hook `useApprovalPolling`

- **Escopo.** Hook reusable em `hooks/useApprovalPolling.ts`. Recebe callback + interval (default 30000). Pausa quando `document.visibilityState==='hidden'`. Limpa em unmount.
- **Arquivos.** Criar `hooks/useApprovalPolling.ts`.
- **Vínculos.** ADR-LOCAL-02.
- **Estimativa.** P
- **Depende de.** —

### TASK-C11 — Frontend: T-29 page + componentes Inbox

- **Escopo.**
  - `app/aprovacoes/page.tsx` — Server Component fetch inicial via `getApprovalInbox` + Client wrapper para filtros e polling.
  - `components/aprovacoes/InboxList.tsx`, `InboxCard.tsx`, `InboxFilters.tsx`, `InboxEmpty.tsx`.
  - Microinterações §4.10 T-29: badge fade-up 200ms + scale 0.8→1, shimmer skeleton, `prefers-reduced-motion` honrado.
- **Arquivos.** Criar arquivos acima.
- **Vínculos.** T-29, FR-165, UX §4.10.
- **CAs.** CA-13, CA-14, CA-40 (ARIA live region).
- **Estimativa.** GG
- **Depende de.** TASK-C09, TASK-C10

### TASK-C12 — Frontend: T-30 page + componentes RequestDetail (estrutura)

- **Escopo.**
  - `app/aprovacoes/[requestId]/page.tsx`.
  - `components/aprovacoes/RequestDetail.tsx`, `RequestHeader.tsx`, `SubjectPreview.tsx`, `ChainStepper.tsx`.
  - Skeleton loading (chain stepper sequential fade).
  - Layout 2-col 70/30 conforme T-30 spec.
- **Arquivos.** Criar arquivos acima.
- **Vínculos.** T-30, FR-166.
- **Estimativa.** G
- **Depende de.** TASK-C09

### TASK-C13 — Frontend: ValidationCard + FindingHighlight

- **Escopo.**
  - `components/aprovacoes/ValidationCard.tsx` — card Brand + Português com chips status, lista de findings collapsible (mostrar 2, "Mostrar mais" toggle).
  - `components/aprovacoes/FindingHighlight.tsx` — `<mark>` com tooltip slide-down 150ms; click = scrollIntoView + pulse box-shadow.
  - Renderer de subject_snapshot que injeta `<mark>` com base em finding spans.
- **Arquivos.** Criar arquivos acima.
- **Vínculos.** UX §4.10 (FindingHighlight Interactions, Validators Completion Shimmer).
- **CAs.** CA-15.
- **Estimativa.** GG
- **Depende de.** TASK-C12

### TASK-C14 — Frontend: DecisionsHistoryTimeline

- **Escopo.** Component collapsible. Hidden if `round=1`. Linha do tempo vertical com EV-29/30/31/32/33 entries (renderizar a partir de `decisions_history` + status transitions inferidas).
- **Arquivos.** Criar `components/aprovacoes/DecisionsHistoryTimeline.tsx`.
- **Vínculos.** T-30 spec.
- **CAs.** CA-16.
- **Estimativa.** M
- **Depende de.** TASK-C12

### TASK-C15 — Frontend: DecisionActions + ConfirmDecisionModal

- **Escopo.**
  - `DecisionActions.tsx`: 3 botões (Aprovar verde, Solicitar Ajustes amber, Reprovar red).
  - Solicitar Ajustes / Reprovar revelam textarea inline (max 1000 chars, counter).
  - ConfirmDecisionModal: confirmação dupla (RN-024 enforce — humano confirma duas vezes).
  - Optimistic UI: ao confirmar, marca request como "Decidindo..." localmente; reverte em erro.
  - POST `/decide` integrado.
- **Arquivos.** Criar arquivos acima.
- **Vínculos.** UX §4.10 Approve Decision.
- **CAs.** CA-18.
- **Estimativa.** G
- **Depende de.** TASK-C12

### TASK-C16 — Frontend: ValidatedStamp animation

- **Escopo.** Component que aparece quando `status=APPROVED`. Animação: scale 2.4→1 + opacity 0→1 + rotate -12→-8deg (350ms cubic-bezier overshoot). Pulse box-shadow 500ms 2x. `prefers-reduced-motion` → fade-in 200ms simples.
- **Arquivos.** Criar `components/aprovacoes/ValidatedStamp.tsx`.
- **Vínculos.** UX §4.10 Approve Decision, RN-024.
- **CAs.** CA-21 (visual), CA-38 (reduced motion).
- **Estimativa.** M
- **Depende de.** TASK-C12

### TASK-C17 — Frontend: SubmitForApprovalButton + SubmitModal (T-31)

- **Escopo.**
  - `SubmitForApprovalButton.tsx` reusable, recebe `subjectType`, `subjectId`, `clientId`. Inicializa modal.
  - `SubmitModal.tsx`: cliente field, chain preview (collapsible), comment textarea (500 chars).
  - Integrar com POST /submit. Estados: loading, success (toast + close), 4xx/5xx (banner inline).
  - Inserir botão em T-05 (chat detail), T-07 (Faísca panel), T-23 (workflow histórico) — só para autor original.
- **Arquivos.** Criar `components/aprovacoes/SubmitForApprovalButton.tsx`, `components/aprovacoes/SubmitModal.tsx`. Modificar telas T-05/T-07/T-23 conforme paths existentes.
- **Vínculos.** T-31, FR-160, UX §4.10 T-31 Modal Entry.
- **CAs.** CA-01, CA-02, CA-39 (ESC fecha modal).
- **Estimativa.** GG
- **Depende de.** TASK-C09

### TASK-C18 — Frontend: ApprovalContext (badge global)

- **Escopo.** Context simples com `unreadCount` consultado via novo endpoint mínimo `/api/approval/inbox/count` (ou inferido do polling de /inbox). Badge na sidebar quando user é approver.
- **Arquivos.** Criar `contexts/ApprovalContext.tsx`. Modificar `components/layout/Sidebar.tsx` e `components/layout/Providers.tsx`.
- **Estimativa.** M
- **Depende de.** TASK-C09, TASK-C11

### TASK-C19 — Testes integração: GET /inbox + GET /requests/{id}

- **Escopo.** `api/tests/integration/test_inbox_and_detail.py`:
  - Inbox lista só items do nível do user.
  - Inbox vazio se user sem chain.
  - Detail retorna full payload.
  - 404 quando user não autorizado (não 403).
- **Arquivos.** Criar `api/tests/integration/test_inbox_and_detail.py`.
- **CAs.** CA-13, CA-14, CA-15, CA-17.
- **Estimativa.** G
- **Depende de.** TASK-C01, TASK-C02

### TASK-C20 — Testes integração: decisão completa

- **Escopo.** `api/tests/integration/test_decisions.py`:
  - APPROVE intermediário: avança nível, EV-31 publicado para próximo.
  - APPROVE final: UPDATE subject + EV-33 + carimbo.
  - REQUEST_CHANGES round 1: status CHANGES_REQUESTED + EV-32.
  - REJECT: status REJECTED + EV-33 final_rejection.
  - 403 se approver não está no level atual.
  - Trigger imutabilidade já testado em B10.
- **Arquivos.** Criar `api/tests/integration/test_decisions.py`.
- **CAs.** CA-18, CA-22, CA-23.
- **Estimativa.** G
- **Depende de.** TASK-C05, TASK-C06, TASK-C07

---

## Fase D — Anti-loop + Resubmit + Histórico

### TASK-D01 — Endpoint POST /api/approval/requests/{request_id}/resubmit (API-134)

- **Escopo.** Em `router.py` POST. Service em `api/approval/resubmit.py`:
  1. Validar user é submitter original.
  2. Validar `status='CHANGES_REQUESTED'` E `current_round < 3` (409 caso contrário com mensagem específica).
  3. UPDATE request: `current_round++`, `current_level_order=0`, `status='PENDING_VALIDATION'`, `validation_report_id=null`, novo `subject_snapshot`.
  4. Enqueue EV-29.
  5. Disparar orchestrator (BackgroundTasks).
- **Arquivos.** Modificar `api/approval/router.py`, criar `api/approval/resubmit.py`.
- **Vínculos.** API-134, FR-168, RN-025.
- **CAs.** CA-24, CA-26.
- **Estimativa.** M
- **Depende de.** TASK-B02, TASK-B06

### TASK-D02 — DecisionRecorder lógica round=3 + REQUEST_CHANGES → EXPIRED

- **Escopo.** Já mencionado em TASK-C05; explicitar como sub-task se foi pulada lá. Confirmar que enqueue EV-34 e retorna 200 (não 4xx).
- **Arquivos.** Modificar `api/approval/decisions.py`.
- **Vínculos.** RN-025, FR-168, EV-34.
- **CAs.** CA-25, CA-27.
- **Estimativa.** P
- **Depende de.** TASK-C05

### TASK-D03 — Frontend: banner "🚨 3ª rodada"

- **Escopo.** Em `components/aprovacoes/RequestDetail.tsx` ou subcomponent dedicado: banner amber acima do footer quando `current_round=3`. Animação pulse box-shadow 800ms on first focus do "Solicitar Ajustes" button. `prefers-reduced-motion` → static box-shadow.
- **Arquivos.** Modificar `RequestDetail.tsx`, criar `components/aprovacoes/Round3Banner.tsx`.
- **Vínculos.** UX §4.10 Round 3 REQUEST_CHANGES Banner.
- **CAs.** Cobertura visual de CA-25.
- **Estimativa.** M
- **Depende de.** TASK-C12

### TASK-D04 — Frontend: ResubmitButton + ResubmitModal

- **Escopo.** Component visível para submitter quando `status=CHANGES_REQUESTED` E `round<3`. Modal mostra `addresses_findings` opcional (lista de findings do round anterior com checkboxes "endereçada" + texto livre por finding). Submete novo `subject_snapshot` (frontend captura do source — chat/spark/workflow).
- **Arquivos.** Criar `components/aprovacoes/ResubmitButton.tsx`, `ResubmitModal.tsx`.
- **Vínculos.** API-134.
- **CAs.** CA-24.
- **Estimativa.** GG
- **Depende de.** TASK-D01, TASK-C09

### TASK-D05 — Frontend: tela "Submissão expirada"

- **Escopo.** Quando `status=EXPIRED`, T-30 mostra banner gray "🛑 3ª rodada esgotada — Fluxo automático encerrado. Combine conversa com [Aprovador]." Conteúdo principal read-only. CTAs hidden.
- **Arquivos.** Modificar `components/aprovacoes/RequestDetail.tsx`.
- **Vínculos.** EV-34, FR-168.
- **CAs.** CA-27.
- **Estimativa.** P
- **Depende de.** TASK-C12

### TASK-D06 — Testes integração: anti-loop full cycle

- **Escopo.** `api/tests/integration/test_anti_loop.py`:
  - Round 1 → REQUEST_CHANGES → resubmit → round 2 (validators rerun).
  - Round 3 → REQUEST_CHANGES → status EXPIRED + EV-34.
  - Round 3 → resubmit → 409.
  - Status EXPIRED é terminal (qualquer call subsequente em decide → 409).
- **Arquivos.** Criar `api/tests/integration/test_anti_loop.py`.
- **CAs.** CA-24, CA-25, CA-26, CA-27.
- **Estimativa.** G
- **Depende de.** TASK-D01, TASK-D02

---

## Fase E — Chain admin + AuditEntry + Notify externo

### TASK-E01 — Endpoint GET /api/approval/chains (API-135 GET)

- **Escopo.** Em `router.py`, GET. Service em `api/approval/chain_admin.py`. Retorna chains do cliente. Authorization: Admin OR Líder do cliente.
- **Arquivos.** Modificar `router.py`, criar `chain_admin.py`.
- **Vínculos.** API-135.
- **Estimativa.** M
- **Depende de.** TASK-A03

### TASK-E02 — Endpoint POST /api/approval/chains (API-135 POST) + validações

- **Escopo.** POST que cria nova versão imutável:
  1. Validar Admin OR Líder do cliente.
  2. Validar payload: ≥1 nível humano, level_order contíguo (1..N), exatamente um de USER/ROLE por nível.
  3. UPDATE current ACTIVE chain `status='DEPRECATED', deprecated_at=now()`.
  4. INSERT new chain `version=current+1, status='ACTIVE'`.
  5. INSERT chain_levels.
  6. INSERT em `audit_entries` com `action='approval_chain.update'`, payload com diff antes/depois.
  7. Tudo em transação.
- **Arquivos.** Modificar `chain_admin.py`.
- **Vínculos.** API-135, RN-026, ADR-010, FR-169.
- **CAs.** CA-28, CA-30, CA-31, CA-32, CA-33.
- **Estimativa.** G
- **Depende de.** TASK-E01

### TASK-E03 — Migration: tabela `client_notification_configs`

- **Escopo.** Alembic migration nova:
  ```sql
  CREATE TABLE client_notification_configs (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(client_id) UNIQUE,
    slack_webhook_url TEXT,
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    updated_by UUID REFERENCES users(user_id),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
  );
  ```
- **Arquivos.** Criar `api/migrations/versions/2026XXXX_create_client_notification_configs.py`.
- **Vínculos.** TODO-DESIGN-03.
- **Estimativa.** P
- **Depende de.** —

### TASK-E04 — NotificationDispatcher (`notifications.py`)

- **Escopo.** Worker async que faz subscribe no Pub/Sub topic `sunos.approval.events`. Para cada EV-31/32/33/34:
  - Identifica destinatários: aprovador (EV-31), submitter (EV-32/33/34).
  - Lookup config: `client_notification_configs.slack_webhook_url`, `users.email`, `users.notification_preferences`.
  - In-app: registra notification em tabela `notifications` (existente, reusar) — frontend pega via polling/SSE existente.
  - Slack: POST webhook com mensagem template + link direto T-30.
  - Email: SendGrid send com template.
  - Idempotência: se `event_id` já processado (table `notification_dispatched(event_id, channel)`), skip.
- **Arquivos.** Criar `api/approval/notifications.py`. Migration para `notification_dispatched` (sub-tabela).
- **Vínculos.** FR-170, EV-31, EV-32, EV-33, EV-34, INT-TB-21.
- **CAs.** CA-35, CA-36, CA-37.
- **Estimativa.** GG
- **Depende de.** TASK-A06, TASK-E03

### TASK-E05 — Frontend: ChainEditor component + page

- **Escopo.**
  - `app/aprovacoes/configuracao/[clientSlug]/page.tsx` — Server Component verificando permissão (Admin/Líder do cliente; senão redirect 404).
  - `components/aprovacoes/ChainEditor.tsx` — form com lista drag-and-drop de níveis (alternativa: botões move up/down se DnD for over-engineering), seleção USER/ROLE, SLA hours input, save button.
  - Validação client-side espelhando server-side.
  - Embutir mini-form de `client_notification_configs` (Slack URL + email toggle) — pode ser collapsible.
- **Arquivos.** Criar arquivos acima.
- **Vínculos.** FR-169, T-31 sub-route.
- **CAs.** CA-28, CA-30, CA-32 (visual feedback dos erros).
- **Estimativa.** GG
- **Depende de.** TASK-E02

### TASK-E06 — Endpoint para `client_notification_configs` (CRUD mínimo)

- **Escopo.** GET/PUT em `/api/approval/notification-configs?client_id=...`. Authorization: Admin/Líder do cliente.
- **Arquivos.** Modificar `router.py`, adicionar handlers em `chain_admin.py` ou novo `notification_config_admin.py`.
- **Estimativa.** M
- **Depende de.** TASK-E03

### TASK-E07 — Testes integração: chain CRUD + audit

- **Escopo.** `api/tests/integration/test_chain_admin.py`:
  - POST cria nova versão; antiga vira DEPRECATED.
  - Submissão em-flight mantém versão original.
  - 400 sem nível humano.
  - 400 level_order não contíguo.
  - 403 Operacional.
  - AuditEntry persistido com diff.
- **Arquivos.** Criar `api/tests/integration/test_chain_admin.py`.
- **CAs.** CA-28, CA-29, CA-30, CA-31, CA-32, CA-33.
- **Estimativa.** G
- **Depende de.** TASK-E02

### TASK-E08 — Seed script: cliente piloto

- **Escopo.** Script `api/scripts/seed_pilot_approval.py`. Cria/garante:
  - 1 cliente piloto (a definir com Heitor — provavelmente Vivo Controle ou outro cliente piloto martech).
  - 1 chain ACTIVE com 3 níveis (Operacional → Líder → Sócio).
  - 3 usuários teste (1 por role).
  - 1 `client_notification_configs` com Slack webhook de canal de teste.
- **Arquivos.** Criar `api/scripts/seed_pilot_approval.py`.
- **Estimativa.** M
- **Depende de.** TASK-E02, TASK-E03

### TASK-E09 — Testes integração: notify (Slack mock + email mock)

- **Escopo.** Testes que mockam Slack webhook e SendGrid; verificam que após EV-31 publicado, mocks recebem chamadas com payload correto. Idempotência (mesmo event_id 2x → 1 chamada só).
- **Arquivos.** Criar `api/tests/integration/test_notifications.py`.
- **CAs.** CA-35, CA-36, CA-37.
- **Estimativa.** G
- **Depende de.** TASK-E04

### TASK-E10 — Frontend: ChainStepper renderiza chain dinâmica

- **Escopo.** Garantir que ChainStepper de TASK-C12 renderiza corretamente N níveis (não hardcoded 3). Usar `levels.length` do payload.
- **Arquivos.** Modificar `components/aprovacoes/ChainStepper.tsx`.
- **Estimativa.** P
- **Depende de.** TASK-C12, TASK-E02

### TASK-E11 — Documentação operacional: como configurar chain

- **Escopo.** Doc curto `docs/specs/large/approval-hierarchy/CHAIN-CONFIG-GUIDE.md` para Líderes: como acessar `/aprovacoes/configuracao/[clientSlug]`, como adicionar/remover níveis, o que significa USER vs ROLE, qual o SLA padrão.
- **Arquivos.** Criar arquivo acima.
- **Estimativa.** P
- **Depende de.** TASK-E05

---

## Fase F — Observabilidade + Polish + E2E

### TASK-F01 — Métricas Prometheus

- **Escopo.** Em `api/approval/metrics.py`: counters/histograms/gauges listados em design.md §7.2. Expor em `/metrics` endpoint (já existente do FastAPI).
- **Arquivos.** Criar `api/approval/metrics.py`. Modificar serviços para incrementar métricas.
- **Estimativa.** M
- **Depende de.** Toda fase B–E.

### TASK-F02 — Dashboard MLflow

- **Escopo.** Salvar query MLflow custom em `docs/specs/large/approval-hierarchy/dashboards/mlflow-validators.md` com queries: latência por validator/cliente, pass-rate, distribuição de findings.
- **Arquivos.** Criar arquivo acima.
- **Estimativa.** M
- **Depende de.** TASK-B07

### TASK-F03 — Testes E2E Playwright

- **Escopo.** `e2e/approval.spec.ts` (ou path equivalente Playwright):
  - Happy path: login submitter → submit → login approver → inbox vê item → abre detalhe → aprova → verifica subject `validated=true`.
  - Round-3-EXPIRED: 3 ciclos REQUEST_CHANGES até EXPIRED.
- **Arquivos.** Criar `e2e/approval.spec.ts`.
- **CAs.** Cobertura E2E.
- **Estimativa.** GG
- **Depende de.** Toda fase C–E.

### TASK-F04 — Auditoria axe-core

- **Escopo.** Adicionar steps Playwright + `@axe-core/playwright` rodando em T-29, T-30, T-31. CI falha se Level AA violations > 0.
- **Arquivos.** Modificar config Playwright; adicionar test wrapper.
- **CAs.** CA-38, CA-39, CA-40.
- **Estimativa.** M
- **Depende de.** TASK-F03

### TASK-F05 — Logs estruturados + mascaramento

- **Escopo.** Configurar logger Python para JSON output (já existente?). Garantir que toda log line de approval tem campos `request_id`, `client_id`, `submitter_id`, `status`, `round`, `level_order`, `action`, `latency_ms`. Truncar `subject_snapshot.content` para 200 chars em logs.
- **Arquivos.** Modificar serviços + util `api/core/logging.py` (existente).
- **Estimativa.** M
- **Depende de.** Toda fase B–E.

### TASK-F06 — Performance test: 50 submissões concorrentes

- **Escopo.** Locust file `locustfiles/approval_load.py`. 50 users submetendo durante 1 min. Verificar p95 ≤2.5s validators, p95 ≤2s submit. Dashboard de resultado em `docs/specs/large/approval-hierarchy/perf-baseline.md`.
- **Arquivos.** Criar arquivos acima.
- **CAs.** NFR-001.
- **Estimativa.** M
- **Depende de.** TASK-B06

### TASK-F07 — CLAUDE.md update

- **Escopo.** Atualizar `CLAUDE.md` raiz: adicionar rota `/aprovacoes` à seção "Existing Features", adicionar `api/approval/` à seção Project Structure (backend), adicionar checklist "ao mexer em FA-13, ler `docs/specs/large/approval-hierarchy/`".
- **Arquivos.** Modificar `CLAUDE.md`.
- **Estimativa.** P
- **Depende de.** —

### TASK-F08 — README do módulo `api/approval/`

- **Escopo.** `api/approval/README.md` com:
  - Diagrama de sequência (espelhando design §3).
  - Como rodar localmente.
  - Como adicionar um novo validator.
  - Como debugar uma request travada.
- **Arquivos.** Criar `api/approval/README.md`.
- **Estimativa.** M
- **Depende de.** —

### TASK-F09 — Handoff de fim de SPEC

- **Escopo.** Criar `docs/handoff/sessions/YYYY-MM-DD-fa13-implementation-complete.md` (formato CLAUDE.md "Session Handoffs"). Inclui: fases concluídas, CAs verificados, métricas baseline, pendências para V2.
- **Arquivos.** Criar arquivo acima.
- **Estimativa.** P
- **Depende de.** Toda implementação.

---

## Mapa Tasks ↔ Critérios de Aceite

| CA | Tasks que cobrem |
|----|-------------------|
| CA-01 | C17 |
| CA-02 | B01, B02, C17 |
| CA-03, CA-04 | B02, A06 |
| CA-05, CA-06 | B02 |
| CA-07 | B07 |
| CA-08, CA-09, CA-10, CA-11 | B06, B09 |
| CA-12 | C13 (frontend), B06 (backend) |
| CA-13, CA-14 | C01, C19 |
| CA-15 | C13, C19 |
| CA-16 | C14 |
| CA-17 | C02, C19 |
| CA-18 | C05, C07, C20 |
| CA-19, CA-20 | A02, B10 |
| CA-21 | C06, C16 |
| CA-22 | C04, C20 |
| CA-23 | C05 |
| CA-24 | D01, D04, D06 |
| CA-25 | C05, D02, D06 |
| CA-26 | D01, D06 |
| CA-27 | D05, D06 |
| CA-28 | E02, E07 |
| CA-29 | E07 (in-flight chain test) |
| CA-30 | E02, E07 |
| CA-31, CA-32 | E02, E07 |
| CA-33 | E02, E07 |
| CA-34 | C04 (fallback), test em E07 |
| CA-35, CA-36, CA-37 | E04, E09 |
| CA-38 | C16, F04 |
| CA-39 | C17, F04 |
| CA-40 | C11, F04 |
| CA-41 | B04 + fixture |
| CA-42 | F04 (axe + content scan), QA manual |

## Mapa Tasks ↔ FRs / RNs / ADRs

| Item | Tasks |
|------|-------|
| FR-160 | B01, B02, C17 |
| FR-161 | B06 |
| FR-162 | B04 |
| FR-163 | B05 |
| FR-164 | B06 |
| FR-165 | C01, C11 |
| FR-166 | C02, C12, C13, C14 |
| FR-167 | C05, A02 (trigger) |
| FR-168 | D01, D02, D03, D04, D05 |
| FR-169 | E01, E02, E05 |
| FR-170 | E04 |
| RN-023 | B03, B06 |
| RN-024 | A02 (trigger), C05 |
| RN-025 | C05, D01, D02 |
| RN-026 | C04, E02, ADR-LOCAL-04 implementado em C04 |
| ADR-008 | B06 |
| ADR-010 | E02 |
| ADR-011 (compat) | B03, B06 |
| ADR-LOCAL-01 (outbox) | A02, A06 |
| ADR-LOCAL-02 (polling) | C10 |
| ADR-LOCAL-03 (deepagents-compat) | B03, B06 |
| ADR-LOCAL-04 (fallback) | A02 (col), C04 |

## Prompt para Agente (template por task)

> Implemente **TASK-XXX** da SPEC `docs/specs/large/approval-hierarchy/` no projeto sunOS.
>
> **Antes de tudo, leia (nesta ordem):**
> 1. `docs/specs/large/approval-hierarchy/constitution.md` — princípios não-negociáveis.
> 2. `docs/specs/large/approval-hierarchy/spec.md` — comportamento externo + CAs.
> 3. `docs/specs/large/approval-hierarchy/design.md` — arquitetura + ADRs locais.
> 4. `docs/specs/large/approval-hierarchy/plan.md` (a fase desta task).
> 5. Esta task em `tasks.md`.
>
> **Restrições obrigatórias.**
> - Vocabulário Suno (constitution §4): nunca "gerar"/"otimizar"/"eficiência"/"accelerator"; sempre Koro com K.
> - Cross-tenant guard: toda query filtra por `client_id`. 404 (não 403) para usuários sem permissão (RN-011).
> - Imutabilidade: nada de UPDATE/DELETE em `approval_decisions`; nada de UPDATE em `subject_snapshot`.
> - Validators paralelos: `asyncio.gather`. Latência consolidada = max, não soma.
> - Aprovador é sempre humano (RN-024): rejeitar service accounts em `DecisionRecorder`.
>
> **Escopo desta task (resumo):** _<copiar `Escopo` da task>_
>
> **Arquivos a criar/modificar:** _<lista da task>_
>
> **CAs a verificar antes de marcar como concluída:** _<lista da task>_
>
> **Não amplie o escopo.** Se identificar dependência, parar e reportar.

<!-- REVIEW: As 66 tasks são implementáveis e testáveis isoladamente? Granularidade está adequada? Falta alguma task crítica (ex: feature flag para rollout gradual; permission seed; integração com sistema de billing existente)? Estimativas T-shirt batem com a realidade do time? -->

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-04-30 | Versão inicial — 66 tasks (A01–A09, B01–B11, C01–C20, D01–D06, E01–E11, F01–F09) com mapa CA↔Task e Item↔Task |
