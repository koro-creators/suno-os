---
spec-id: SPEC-006
slug: drive-readonly-curation
artefato: plan
atualizada: 2026-04-30
versao: 1.0
---

# Plano de Implementação — Drive Read-Only Curation (FA-14)

Este plano divide a implementação de FA-14 em 6 fases (A–F) que mapeiam para os marcos POC → Protótipo → Piloto → MVP do PRD §5.

> ⚠️ **Bloqueio explícito:** Fases A e B podem rodar com **ADR-009 em status Proposto** (não expõem Drive a curadores nem fazem ingestão na Biblioteca). Fases C, D, E, F estão **BLOQUEADAS até ADR-009 sair para Aceito** (PRE-01 da `constitution.md`). Cliente piloto identificado e contratualmente autorizado é pré-condição adicional para Fase D em diante (PRE-04).

## 1. Stack Tecnológica

| Camada | Tecnologia | Versão | Justificativa |
|--------|-----------|--------|---------------|
| Backend framework | FastAPI | já no projeto | Padrão estabelecido (CTM-03/CTM-08). |
| LLM orchestration | LangGraph | já no projeto | Sub-graph CurationAgent. ADR-LOCAL-05 prevê migração para `deepagents` quando ADR-011 sair Aceito. |
| LLM provider | Gemini 2.5 Flash | default ADR-004 | Padrão do projeto. Sonnet híbrido para `MERGE_WITH` se TODO-DESIGN-A confirmar (Fase C). |
| ORM + DB | SQLAlchemy 2.0 + asyncpg + Alembic | já no projeto | Idem CTM-08. |
| KMS | `google-cloud-kms` | a confirmar | Encrypt/decrypt OAuth (INT-14). Adicionar com ADR-LOCAL se ausente. |
| Drive SDK | `google-api-python-client` | a confirmar | Drive API v3 (INT-12). Adicionar com ADR-LOCAL se ausente. |
| Eventos | `google-cloud-pubsub` | já no projeto | INT-TB-26. |
| Tracing | MLflow | já no projeto | NFR-026. |
| Frontend | Next.js 14 App Router + TS strict | já no projeto | T-31, T-32, T-33. |
| Estilo | CSS variables sunOS + inline styles | já no projeto | Padrão SPEC-001/004/005. |

## 2. Fases de Implementação

### Fase A — Foundation (5–7 dias) — **POC inicial**

**Objetivo:** preparar infraestrutura para que outras fases consumam (DB schema, KMS setup, SDK wrapper read-only, outbox + audit, dependency injection, fixtures).

**Pré-requisitos:** Cloud SQL acessível em staging; Cloud KMS keyring provisionado (ou Terraform); `google-cloud-kms` e `google-api-python-client` no `pyproject.toml` (verificar; adicionar se ausente com ADR-LOCAL).

**Entregáveis:**
- Migrations Alembic para ENT-39..43 + `outbox_drive_events` + `audit_log_drive` + `drive_push_channels`.
- Triggers PG: imutabilidade audit + cascade revoke + ciphertext check.
- SDK wrapper (`api/drive/sdk_wrapper.py`) com `DriveReadOnlyClient` e teste de regressão que valida ausência de métodos write.
- KMS wrapper (`api/drive/kms.py`) encrypt/decrypt com round-trip test.
- `OAuthVault` esqueleto (com TODO para flow real em Fase B).
- Pub/Sub topic `sunos.drive.events` provisionado + schema validation.
- OutboxWorker setup (consome `outbox_drive_events`, publica idempotente).
- Dependency injection FastAPI: `current_user_with_client` (compartilhado com SPEC-004 — verificar se já existe).
- Test fixtures: clientes seed, pastas Drive mock, KMS emulator.

**Gate de saída:**
- [ ] `alembic upgrade head` aplica em staging sem erro.
- [ ] Test `test_wrapper_blocks_write_methods` passa.
- [ ] KMS encrypt/decrypt round-trip passa em CI.
- [ ] Pub/Sub topic existe; emulator de teste funciona.
- [ ] Code review aprovado.

### Fase B — OAuth + Sync incremental (sem UI) (8–10 dias) — **POC end-to-end backend**

**Objetivo:** validar o caminho mais arriscado tecnicamente — OAuth flow + decrypt + `changes.list` + UPSERT. Sem UI; tudo via curl/Postman.

**Pré-requisitos:** Fase A completa.

**Entregáveis:**
- Endpoints API-140 (POST /connect), API-141 (callback), API-142 (sync-state), API-143 (POST /sync/run).
- Implementação `OAuthVault.connect_flow` + `oauth_callback_handler` com state HMAC + scope validation.
- Implementação `ListChangesWorker` com retry exponencial + `pageToken` persistido.
- Implementação `SnapshotDiffer` UPSERT/stale.
- Cloud Scheduler job dinâmico criado quando OAuth completa (e deletado em revoke).
- Eventos EV-35, EV-36, EV-37 publicados via outbox.
- Audit log entries para CONNECT, SYNC_RUN, SYNC_FAIL.
- Testes integração: OAuth flow happy path; refresh token; sync incremental; mock Drive API com 50–500 changes; cross-client guard.

**Gate de saída:**
- [ ] Heitor consegue conectar Drive de teste pessoal via curl + popup OAuth e ver primeiro full sync rodar em < 5min.
- [ ] Logs **NÃO** contêm tokens plaintext (verificação manual + grep automatizado em CI).
- [ ] `drive_documents` tem ≥ 100 docs após teste com pasta real.
- [ ] Pub/Sub topic recebeu EV-35/36/37 (verificável via Cloud Console).
- [ ] Métrica `drive_write_attempts_total = 0` em todos os runs.

### Fase C — CurationAgent + Cleanup Job (10–12 dias) — **Protótipo (sem UI ainda)**

⚠️ **Bloqueada por PRE-01** (ADR-009 = Aceito). Pode iniciar especificação técnica em paralelo a alinhamento Guga, mas não merge a develop sem desbloqueio.

**Objetivo:** geração de sugestões + relatórios de limpeza, **persistidos em DB mas ainda sem UI**.

**Pré-requisitos:** Fase B; ADR-009 = Aceito.

**Entregáveis:**
- `CurationAgent` em LangGraph nativo com 4 tools RBAC-aware: `list_documents_in_folder`, `read_document_metadata`, `compute_content_similarity`, `propose_suggestion`.
- Trigger por evento EV-37 (subscriber Pub/Sub) que dispara CurationAgent para documentos novos.
- INSERT `curation_suggestions` com `status='PENDING'`; emite EV-38.
- `CleanupJob` agendado domingo 06:00; produz `drive_cleanup_reports`.
- `STALE` transition job diário (TODO-DESIGN-D).
- Testes integração: documento novo → sugestão gerada; documento atualizado → sugestões PENDING marcadas STALE; cleanup com fixtures de duplicatas/órfãos.
- MLflow tracing instrumentado com tags `client_id`, `sync_id`, `document_id`.
- TODO-DESIGN-A validado (Flash vs. Sonnet híbrido); resultado documentado em LOG.md.

**Gate de saída:**
- [ ] Para 50 documentos seed, CurationAgent gera ≥ 50 suggestions com `confidence > 0` e `rationale` não-vazio.
- [ ] Para batch com 3 duplicatas, CleanupJob detecta exatamente 3 (precision 100%).
- [ ] Latência p95 do CurationAgent ≤ 8s/documento.
- [ ] Nenhuma suggestion nasce com `status != PENDING` (RN-029).

### Fase D — UI dashboard + Inbox + Importer (12–15 dias) — **Piloto**

⚠️ **Bloqueada por PRE-01 + PRE-04.**

**Objetivo:** Líder consegue ver suggestions, decidir, e importar para Biblioteca. Sócio vê dashboard.

**Pré-requisitos:** Fase C; cliente piloto identificado + termo assinado.

**Entregáveis:**
- T-31 Connect Modal (`/admin/drive-sync/connect`) + frontend OAuth popup.
- T-32 Sync Dashboard (`/drive/[clientSlug]`) com: SyncStatusIndicator, MetricsCard com tween, OAuthStatusCard, ReadonlyBadge sempre visível, métrica `drive_write_attempts_total` exibida (deve ser 0).
- T-33 Suggestions Inbox (`/drive/[clientSlug]/sugestoes`) com SuggestionCard, ConfidenceBadge, Decision buttons, PreviewModal (fetch on-demand API-146).
- API-145 (GET /documents), API-146 (GET /content), API-147 (GET /suggestions), API-148 (POST /decide).
- `Importer` ligado em pipeline DFL-03 da Biblioteca (BC-02). Stub aceitável se BC-02 ainda lento; integração real bloqueia gate.
- Eventos EV-39 publicados quando ACCEPT.
- Polling 30s (`useDriveSyncPolling`) em T-32.
- Hook `useCurationSuggestions` com mutations otimistas.
- Microinterações UX §4.11 (sync animation, suggestion accept/reject, OAuth glow, prefers-reduced-motion).
- ARIA live region para "N novas sugestões" em T-33.

**Gate de saída:**
- [ ] Cliente piloto conecta Drive em produção (após autorização).
- [ ] Líder do cliente consegue ver ≥10 documents e ≥3 suggestions sem treinamento.
- [ ] Líder aceita 1 sugestão IMPORT_TO_LIBRARY → KnowledgeItem aparece na Biblioteca em < 60s.
- [ ] Sócio acessa T-32 e vê dashboard sem botões de admin.
- [ ] Operacional tenta acessar `/drive/[clientSlug]` → recebe 404.
- [ ] Axe-core: 0 violações AA em T-32 e T-33.

### Fase E — Drive Push webhook + Channel renewal + Exclusions (6–8 dias) — **MVP completion**

⚠️ **Bloqueada por PRE-01 + PRE-04.**

**Objetivo:** completar SLA de 5min para pastas críticas e completar fluxo de exclusão LGPD.

**Pré-requisitos:** Fase D estável em piloto por ≥ 1 semana.

**Entregáveis:**
- API-144 (POST /webhook) com validação Google headers.
- `WebhookReceiver` enfileira sync incremental por folder.
- Job `drive-channel-renewal` rodando diariamente (ADR-LOCAL-06).
- API-149 (GET /cleanup-reports), API-150 (DELETE /oauth com purge).
- Tela `/admin/drive-sync/exclusions` (ExclusionsManager).
- Hard delete de tokens KMS em revoke.
- Job assíncrono de purge de KnowledgeItems quando `purge_indexed_content=true` (TODO-DESIGN-E).
- EV-41 OAuthExpired publish + SafetyAlert.
- Testes E2E: registro de channel + simular Drive Push → sync em < 5min P95.

**Gate de saída:**
- [ ] Drive Push channel registrado para 1 pasta crítica em piloto; lag medido ≤ 5min P95 por 7 dias contínuos.
- [ ] Renewal automático completou ≥ 1 ciclo sem falha em piloto.
- [ ] Admin executa exclusão de cliente teste (não piloto) com `purge_indexed_content=true` → tokens deletados, sync REVOKED, KnowledgeItems purgados em < 30min.
- [ ] Audit log mostra entry `REVOKE` com razão.

### Fase F — Observabilidade + Polish + Sunset (5–7 dias)

⚠️ **Bloqueada por PRE-01 + PRE-04.**

**Objetivo:** alarmes, dashboards, hardening, e remoção de qualquer scaffolding temporário.

**Entregáveis:**
- Alertas configurados (§7.4 do design): DriveWriteAttemptBlocked, DriveSyncErrorPersistent, DriveOAuthExpiringSoon, DriveAPIQuotaApproaching, OutboxDriveBacklog, ChannelRenewalFailed.
- Dashboard Cloud Monitoring com 11 métricas (§7.2).
- MLflow runbook: como auditar traces de CurationAgent.
- Update CLAUDE.md (raiz) com rota `/drive` + módulo `api/drive/`.
- Handoff de fim de SPEC em `docs/handoff/sessions/`.
- Métricas de uso em piloto (≥ 30 dias): adoção (taxa de aceitação), tempo médio decision, top 3 mime types ingeridos, anomalias.
- Decisão: ADR-011 deepagents migration agendado? Resultado vai em handoff.
- Limpeza: stubs DFL-03, scaffolding de fixtures de dev removidos.

**Gate de saída:**
- [ ] Todos os 6 alertas configurados e testados (forçar 1 cada).
- [ ] Dashboard publicado e linkado em CLAUDE.md.
- [ ] Métrica de adoção (taxa de aceitação de sugestões em piloto) ≥ 30% (sinal de qualidade — RN-029 KPIs); se < 30%, abrir TODO-DESIGN-A2 para investigar.
- [ ] Handoff publicado com aprendizados, retry de decisões, próximos passos.

## 3. Sequência e Dependências

```
PRE-01 + PRE-04 ════════════════════════════════════════════════╗
(ADR-009 Aceito + cliente piloto)                                ║
                                                                 ▼
Fase A ───► Fase B ──┐                          ┌─► Fase D ──► Fase E ──► Fase F
(Foundation) (Backend │                         │   (UI +     (Webhook    (Observ
              POC)    │                         │   Importer)  + Excl)     + Polish)
                      │                         │
                      └──► Fase C (bloqueada PRE-01)
                           (CurationAgent +
                           Cleanup persistido)
```

- **A → B:** lineares.
- **B → C:** C depende de B (sync emite EV-37 que CurationAgent consome).
- **C → D:** D depende de C (D consome `curation_suggestions` que C produz).
- **D → E:** E acrescenta webhook (sync ainda funciona com cron sem webhook).
- **E → F:** F é polish/observabilidade.

## 4. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| ADR-009 não aprovado por Guga em tempo hábil | Média | Alto (bloqueia Fases C–F) | Fase A+B entregam valor mesmo com bloqueio; alinhamento explícito agendado pré-Fase C |
| OAuth scope mismatch (Google retorna scopes adicionais) | Baixa | Médio (rollback grant) | Validação na callback; teste de regressão |
| Drive Push channel renewal falhar silenciosamente | Média | Médio (degrada para cron 15min) | Alerta ChannelRenewalFailed; runbook documentado |
| CurationAgent gera sugestões de baixa qualidade (Flash) | Média | Médio (taxa de aceitação < 30%) | TODO-DESIGN-A: medir Flash vs. Sonnet híbrido em Fase C; fallback a Sonnet se necessário |
| Quota Drive API esgotada em cliente grande | Média | Médio (sync atrasa) | Métrica `drive_api_calls_total`; alerta a 70% quota; solicitar quota maior se preciso |
| KMS rotation falha (re-encrypt cascade) | Baixa | Alto (perde acesso a tokens) | Runbook TODO-DESIGN-C; rotação anual com staging dry-run |
| Pipeline DFL-03 falha em import | Média | Médio (re-tentativa exigida) | Status `IMPORT_FAILED` + alerta; retry manual via admin |
| Vazamento de PII em logs (emails) | Baixa | Alto (LGPD) | Test de regressão valida log scrubbing; review SRE em Piloto |
| Channel ID race condition em renewal | Baixa | Baixo (1 channel duplicado) | UNIQUE constraint em DB + idempotência em renewal |

## 5. Definição de Pronto (Definition of Done)

A SPEC inteira é considerada implementada quando todos os 14 itens de DoD da `constitution.md` §10 estão checked.

## 6. Definição de Pronto por Fase (gates)

Cada fase termina apenas quando o respectivo "Gate de saída" está 100% verde. Não há atalho. PRs que finalizam uma fase devem incluir checkbox confirmando cada item do gate.

## 7. Equipe sugerida

- **1 eng backend Python** dedicado em Fases A, B, C (foundation + sync + curation).
- **1 eng frontend** entrando em Fase D (UI dashboard + inbox).
- **0.3 designer** em Fase D para revisar microinterações + acessibilidade (UX §4.11).
- **0.5 SRE** em Fase A (KMS + Cloud Scheduler + Pub/Sub provisioning) e Fase F (observabilidade + alertas).
- **0.2 jurídico/LGPD** em Fase D para validar UX da exclusão + retenção.
- **Heitor (TL)** review de PRs e gates.

## 8. Cronograma estimado

Total: **46–59 dias úteis** (~9–12 sprints), distribuídos:

| Fase | Estimativa | Marco PRD |
|------|-----------|-----------|
| A — Foundation | 5–7 dias | POC inicial |
| B — OAuth + Sync (sem UI) | 8–10 dias | POC end-to-end backend |
| C — CurationAgent + Cleanup | 10–12 dias | Protótipo |
| D — UI + Importer | 12–15 dias | Piloto (cliente real) |
| E — Webhook + Exclusions | 6–8 dias | MVP completion |
| F — Observabilidade + Polish | 5–7 dias | MVP estabilizado |

Caminho crítico: A → B → C → D. Webhook (E) pode rodar em paralelo a polish (F) se equipe permitir.

**Observações:**
- Lead time de OAuth consent screen verification (Google) pode adicionar 1–2 semanas se for "external" mode. Default "internal" reduz a zero. Validar com SRE em Fase A.
- Lead time de termo de uso/privacidade com cliente piloto pode adicionar 2–4 semanas (legal review). Iniciar em paralelo a Fase A.

## 9. Pós-Implementação

- **Schedule remoção de scaffolding via `/schedule`:** 30 dias após Fase F estabilizada, agendar agente para abrir PR removendo: stubs de teste, fixtures de dev, métricas obsoletas, código duplicado entre SPEC-004 e SPEC-006 (outbox helpers — extrair para `api/_outbox/`).
- **Schedule revisão `deepagents` migration via `/schedule`:** 60 dias após Fase F, se ADR-011 sair Aceito, agente abre PR ADR-LOCAL-05 → migration plan.
- **Schedule auditoria `drive_write_attempts_total`:** mensal, agente faz query e reporta — deve ser sempre 0.

## 10. Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-04-30 | Versão inicial — 6 fases A–F mapeadas a POC/Protótipo/Piloto/MVP, gates por fase, 9 riscos com mitigações, equipe (1 BE + 1 FE + 0.3 designer + 0.5 SRE + 0.2 LGPD), cronograma 46–59 dias úteis (9–12 sprints), schedule de pós-implementação via /schedule |
