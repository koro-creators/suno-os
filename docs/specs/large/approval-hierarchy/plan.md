---
spec-id: SPEC-004
slug: approval-hierarchy
artefato: plan
atualizada: 2026-04-30
versao: 1.0
---

# Plan — Aprovação Hierárquica (FA-13)

Plano de implementação. Pré-requisito: ler `constitution.md`, `spec.md`, `design.md`. As tarefas atômicas vivem em `tasks.md`.

## 1. Stack Tecnológica

Toda a stack já existe no projeto (CLAUDE.md restringe deps novas).

| Camada | Tecnologia | Versão | Justificativa |
|--------|-----------|--------|---------------|
| Frontend pages | Next.js 14 App Router | 14.x | Padrão sunOS |
| Frontend lang | TypeScript strict | 5.x | Padrão sunOS |
| Frontend UI | CSS variables + inline styles + Lucide icons | — | Design system sunOS |
| Backend API | FastAPI | já no `api/` | Padrão sunos-api |
| Backend lang | Python 3.11 + uv | — | Padrão sunos-api |
| Validators orchestration | LangGraph StateGraph | já no `api/` | Compatibilidade ADR-011 |
| LLM (validators) | Gemini 2.5 Flash (default), Claude Sonnet (opcional via header) | — | ADR-004 |
| DB | PostgreSQL 16 (Cloud SQL) + SQLAlchemy 2.0 + asyncpg + Alembic | — | Já em uso |
| Eventos | Cloud Pub/Sub topic `sunos.approval.events` | novo topic | INT-TB-20 |
| Notify externo | Slack Webhook (REST) + SendGrid (REST) | — | INT-TB-21 |
| Tracing | MLflow GenAI | — | Padrão Meridian/sunos-api |
| Testes backend | pytest, pytest-asyncio, httpx, alembic, Pub/Sub emulator | — | Padrão |
| Testes frontend | Vitest + React Testing Library + Playwright + axe-core | — | Padrão sunOS |
| CI | GitHub Actions (existente) | — | Padrão sunos-api |
| Deploy | Cloud Run (frontend + backend separados) | — | Padrão |

**Não introduzimos:** `deepagents` (ADR-011 ainda Proposto), bibliotecas de form validation novas, ORM diferente, bus diferente.

## 2. Fases de Implementação

A SPEC é grande. Vamos em **6 fases**, cada uma é mergeável e roda em staging antes da próxima. Estimativa total: 40–55 dias úteis para 2 engenheiros + 1 designer (alinha com PRD §FA-13 "fases POC → Protótipo → Piloto → MVP" do feature map).

```
Fase A: Foundation (DB + auth + outbox + topic)
   ↓
Fase B: Submit + Validators paralelos (POC)
   ↓
Fase C: Inbox + Detail + Decisão + Carimbo (Protótipo)
   ↓
Fase D: Anti-loop + Resubmit + Histórico (Piloto)
   ↓
Fase E: Chain admin + AuditEntry + Notify externo (MVP)
   ↓
Fase F: Observabilidade + Polish + E2E
```

### Fase A — Foundation (5–7 dias)

**Objetivo.** Tabelas, triggers, schemas e plumbing comum prontos para todo o restante construir em cima.

**Pré-requisitos.**
- CTM-01 Auth Gateway emitindo JWT com `client_id` e `roles` em produção.
- FA-09 RBAC com roles `Operacional`, `Líder`, `Sócio`, `Admin` definidos.
- Pub/Sub project configurado (mesmo do `sunos.events` existente).

**Entregáveis.**
1. Alembic migration com ENT-34..38 + triggers de imutabilidade + tabela `approval_event_outbox` + flag `requires_admin_attention` em `approval_requests`.
2. SQLAlchemy models em `api/approval/models.py` mapeando as 5 tabelas + outbox.
3. Pydantic schemas em `api/approval/schemas.py` (SCH-013/014/015 + request/response models por endpoint).
4. Pub/Sub topic `sunos.approval.events` provisionado (Terraform ou script).
5. `api/approval/events.py` com publishers idempotentes (UUID `event_id` por evento) e `outbox.py` worker.
6. Dependency injection: `Depends(current_user_with_client)` reusável que retorna `User { user_id, client_id, roles }` do JWT.
7. Estrutura de diretório `api/approval/` criada com `__init__.py` vazios.

**Verificação.**
- Migration roda em staging sem erros e em rollback limpo.
- Triggers de imutabilidade funcionam (teste destrutivo: `UPDATE approval_decisions ...` → exception).
- Outbox publica evento de teste para Pub/Sub e marca `published_at`.

### Fase B — Submit + Validators paralelos (8–10 dias) — **POC**

**Objetivo.** Caminho feliz `submit → validators paralelos → ValidationReport`. Sem inbox, sem decisão humana, sem hierarquia. Apenas o pipeline de IA.

**Entregáveis.**
1. SubmitController (`submit.py`) + endpoint POST API-130.
2. ValidationOrchestrator (`orchestrator.py`) com `asyncio.gather` + timeout 60s.
3. BrandValidatorAgent (`validators/brand.py`) — POC pode usar **stub** de brand-guidelines (JSON local) se FA-01 não estiver pronto.
4. PortuguêsValidatorAgent (`validators/portugues.py`) — usa Gemini Flash com prompt-system pinado.
5. Persistência de ValidationReport.
6. Eventos EV-28, EV-29, EV-30 publicados via outbox.
7. MLflow tracing com spans paralelos visíveis.

**Verificação.**
- POST /api/approval/submit com payload válido retorna 201 PENDING_VALIDATION em ≤2s.
- Trace MLflow mostra `validators.brand` e `validators.portugues` iniciando dentro de 50ms um do outro (CA-07).
- ValidationReport persistido com `latency_ms = max`, não soma (CA-08).
- Pub/Sub recebe os 3 eventos com `event_id` único por evento.

**Não-objetivos da Fase B.**
- T-29/T-30/T-31 frontend.
- Decisão humana.
- Anti-loop.
- Slack/email.

### Fase C — Inbox + Detail + Decisão + Carimbo (12–15 dias) — **Protótipo**

**Objetivo.** Aprovador recebe, vê detalhe, decide. Carimbo Validado funcionando. Frontend 80% pronto. Anti-loop ainda não.

**Entregáveis.**
1. ChainRouter (`chain.py`) — resolve next approver, atualiza request, publica EV-31.
2. DecisionRecorder (`decisions.py`) — POST API-133 com transação atômica.
3. ValidatedStamp (`stamp.py`) — UPDATE polymorphic em subject store.
4. Endpoints: GET API-131 (inbox), GET API-132 (detail), GET API-136 (validation report standalone).
5. Frontend `app/aprovacoes/page.tsx` (T-29) + `[requestId]/page.tsx` (T-30).
6. Componentes: InboxList, InboxCard, InboxFilters, RequestDetail, RequestHeader, SubjectPreview, FindingHighlight, ValidationCard, ChainStepper, DecisionActions, ConfirmDecisionModal, ValidatedStamp.
7. SubmitForApprovalButton + SubmitModal (T-31) com integração POST API-130 — botão injetado em T-05/T-07/T-23 como single component reutilizável.
8. `lib/api.ts` extension para approval functions.
9. `useApprovalPolling` hook (30s, pause on hidden).
10. Polling 30s rodando em T-29 e T-30.

**Verificação.**
- Submitter clica "Submeter para Aprovação" em T-05 → modal abre → submete → toast.
- Approver de chain default vê o item em T-29 em ≤30s (polling).
- Approver abre T-30, vê preview + findings color-coded + chain stepper.
- Aprovação no nível final dispara animação Validado e UPDATE no subject (`validated=true`).
- Aprovação intermediária avança nível e o approver do próximo nível recebe o item em sua inbox.
- Caixa-preta: Operacional sem chain recebe 404 em GET /requests/{id}.

**Critério de gate.** CAs 01–22 + 38–42 passando em staging.

### Fase D — Anti-loop + Resubmit + Histórico (4–6 dias) — **Piloto**

**Objetivo.** RN-025 implementado. Submitter consegue resubmeter; round 3 fecha o fluxo. Histórico de decisões aparece.

**Entregáveis.**
1. POST API-134 (resubmit) — incrementa `current_round`, reset `current_level_order=0`, status PENDING_VALIDATION.
2. Lógica em DecisionRecorder para round=3 + REQUEST_CHANGES → status=EXPIRED + EV-34.
3. Frontend: banner "🚨 3ª rodada" em T-30 com `prefers-reduced-motion` honrado.
4. DecisionsHistoryTimeline component (collapsible).
5. Botão "Resubmeter" em T-30 visível apenas para submitter quando `status=CHANGES_REQUESTED` E `round<3`.
6. Tela de "Submissão expirada — fluxo encerrado" (read-only, banner gray) em T-30 quando `status=EXPIRED`.

**Verificação.**
- CAs 24–27 passam.
- Round 1 → REQUEST_CHANGES → resubmit → round=2 com nova validação.
- Round 3 → REQUEST_CHANGES → API-133 retorna 200 com `next_status=EXPIRED` + EV-34 publicado.
- Submitter no round 3 não vê botão de resubmeter.

### Fase E — Chain admin + AuditEntry + Notify externo (6–8 dias) — **MVP**

**Objetivo.** Líder/Admin consegue configurar chain. AuditEntry para mudanças. Slack/email funcionais.

**Entregáveis.**
1. GET/POST API-135 (chain CRUD).
2. ChainEditor component + `app/aprovacoes/configuracao/[clientSlug]/page.tsx`.
3. Validações de chain (≥1 nível humano, level_order contíguo, exatamente um de USER/ROLE).
4. Versionamento imutável (POST cria v+1, marca anterior DEPRECATED).
5. AuditEntry em `audit_entries` com diff antes/depois.
6. NotificationDispatcher (`notifications.py`) consumindo EV-31/32/33/34 do Pub/Sub.
7. Slack webhook por cliente (decisão de schema: tabela `client_notification_configs` nova com `slack_webhook_url`, `email_enabled`).
8. Migration para a tabela acima.
9. Email via SendGrid/SES configurado.
10. `client_notification_configs` admin UI (mínimo) — pode ser embutido no ChainEditor para MVP.

**Verificação.**
- CAs 28–37 passam.
- Líder do cliente X edita chain, salva, refresh: nova versão é a ativa.
- AuditEntry tem o diff.
- Operacional tenta POST → 403.
- Slack canal configurado recebe mensagem em ≤5s após EV-31.
- Email chega em ≤30s.

### Fase F — Observabilidade + Polish + E2E (5–7 dias)

**Objetivo.** Produto pronto para piloto real. Métricas, dashboards, testes E2E, acessibilidade auditada.

**Entregáveis.**
1. Métricas Prometheus (counter/histogram/gauge) listadas em design.md §7.2.
2. Dashboard MLflow para validators (latência por client, pass-rate por validator).
3. Testes E2E Playwright: happy path + round-3-EXPIRED.
4. Auditoria axe-core: 0 violations Level AA em T-29/T-30/T-31.
5. Logs estruturados com mascaramento de `subject_snapshot.content` (truncar 200 chars).
6. Performance test: 50 submissões concorrentes (locust) — confirma p95 ≤2.5s validators.
7. CLAUDE.md (raiz) atualizado: nova rota `/aprovacoes`, novo módulo `api/approval/`.
8. Documentação interna: README do módulo `api/approval/` com diagrama de sequência.
9. Handoff de fim de SPEC em `docs/handoff/sessions/`.

**Verificação.**
- DoD da SPEC (constitution §10) 100% checada.
- Piloto seedado (1 cliente + 1 chain ativa de 3 níveis + 3 usuários por role).

## 3. Sequência e Dependências

```
        Fase A (Foundation)
              │
              ├──────────────┐
              │              │
        Fase B (Submit+      │  ←── pode começar Fase E.4-E.8 (notify)
        Validators)          │       em paralelo com Fase C, se Pub/Sub topic existir
              │              │
              ▼              │
        Fase C (Inbox+       │
        Detail+Decisão)      │
              │              │
              ▼              │
        Fase D ◄─────────────┘
        (Anti-loop+
        Resubmit)
              │
              ▼
        Fase E (Chain admin
        + Notify externo)
              │
              ▼
        Fase F (Observabilidade
        + Polish + E2E)
```

**Paralelismos possíveis:**
- Designer pode trabalhar em finetuning do CSS/microinterações de T-30 enquanto backend faz Fase B.
- Notify (Slack/Email) pode começar após Fase A (apenas precisa do topic) — backend dev #2 pode tomar isso enquanto dev #1 faz Fase B+C.
- ChainEditor (Fase E.2-3) pode prototipar em mocks durante Fase D.

## 4. Riscos e Mitigações

| Risco | P | I | Mitigação |
|-------|---|---|-----------|
| FA-01 Biblioteca não tem endpoint pronto para brand-guidelines | M | M | Fase B usa stub JSON local; integração real bloqueia Fase E (não Fase D) |
| Latência de Gemini Flash p95 estoura 60s em payloads grandes | B | A | Cap em `subject_snapshot` size (50KB); truncate + warning para o submitter |
| Pub/Sub do GCP fora do ar | B | M | Outbox absorve; T-29 polling continua funcionando como fallback de visibilidade |
| Cliente com 100+ requests simultâneas trava inbox | B | M | Index `idx_ar_inbox` + cursor pagination cobrem; load test em Fase F valida |
| Aprovação intermediária + REQUEST_CHANGES no nível 2 = bug de roteamento | M | A | Casos cobertos em CAs 22 + 24; teste integração obrigatório em Fase D |
| Rolagem de ADR-011 muda os validators na metade | B | A | ADR-LOCAL-03 desacopla; migração futura é só ValidationOrchestrator |
| Operacional vê Sócio em decisions_history e fica desconfortável | M | B | TODO-DESIGN-04 com Guga; default vê (validar antes de Fase C entregar) |
| Cliente piloto não tem chain seedada no D-day | A | M | TASK-E08 garante seed script + checklist de readiness por cliente |
| LLM custos de validators escalam | M | M | Métrica `approval_validators_pass_rate` + budget por cliente como TODO V2 |

## 5. Definição de Pronto (Definition of Done)

A SPEC só é considerada "pronta para piloto" quando o checklist em `constitution.md §10` está 100% marcado **E**:

- [ ] CAs 01–42 passam em staging.
- [ ] Cliente piloto identificado e com `approval_chains` ACTIVE seedada.
- [ ] Approvers do cliente piloto treinados (5min de demo).
- [ ] Slack canal do cliente configurado.
- [ ] Dashboard MLflow acessível para Heitor.
- [ ] Handoff documentado.

## 6. Definição de Pronto por Fase (gates)

Cada fase tem um gate antes da próxima. Gate = code review + staging verde + CAs específicos passando.

| Fase | Gate |
|------|------|
| A | Migration roda + triggers blocked por trigger validados via teste destrutivo |
| B | CAs 01–12 (POST submit + validators) |
| C | CAs 13–22 + 38–42 (inbox + detalhe + decisão + UX) |
| D | CAs 24–27 (anti-loop + resubmit) |
| E | CAs 28–37 (chain admin + notify) |
| F | DoD (constitution §10) + 0 violations axe + p95 dentro do NFR |

## 7. Equipe sugerida

| Papel | Alocação | Foco |
|-------|----------|------|
| Eng Backend Sr | 100% | Fases A, B, C (decision/chain), D, E (chain admin), F (perf) |
| Eng Backend (apoio) | 50% | Notify (Slack/email), outbox worker, observabilidade |
| Eng Frontend Sr | 100% | T-29, T-30, T-31, ChainEditor, polling, animações |
| Designer | 30% | Microinterações §4.10, ChainStepper, FindingHighlight, accessibility audit |
| QA / SRE | 20% | E2E Playwright, load test, dashboards |

## 8. Cronograma estimado

```
Sprint 1 (sem 1-2):  Fase A
Sprint 2 (sem 3-4):  Fase B (POC)
Sprint 3 (sem 5-7):  Fase C (Protótipo)
Sprint 4 (sem 8):    Fase D (Piloto)
Sprint 5 (sem 9-10): Fase E (MVP)
Sprint 6 (sem 11):   Fase F (Polish)
                       └── Piloto começa
```

11 semanas calendário ≈ 55 dias úteis. Bate com a estimativa do PRD (40–60 dias).

## 9. Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-04-30 | Versão inicial — 6 fases A–F mapeadas para POC/Protótipo/Piloto/MVP do PRD §FA-13, com gates por fase e DoD |
