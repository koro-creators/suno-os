---
spec-id: SPEC-006
slug: drive-readonly-curation
artefato: spec
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-04-30
atualizada: 2026-05-15
versao: 1.0
fase: Momento 2
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + Python 3.11"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: Especificar comportamento externo de FA-14 (Google Drive como Fonte Curada) — OAuth read-only, sync Drive→sunOS via `changes.list`, intersecção ACL Drive ∩ RBAC sunOS, CurationAgent que gera sugestões sempre humanas, importação seletiva para Biblioteca, exclusão por cliente (LGPD).
upstream:
  - docs/brd/parte3-requisitos.md (BR-018)
  - docs/brd/parte4-regras.md (RN-027..030)
  - docs/prd/parte1-feature-map.md (FA-14)
  - docs/prd/parte4-FRs.md (FR-171..179)
  - docs/srd/parte2-domain-model.md (BC-07: DO-50, DO-53)
  - docs/srd/parte3-data-model-erd.md (ENT-39..43)
  - docs/srd/parte4-data-flows-dfd.md (DFL-09)
  - docs/srd/parte6-arch-to-be.md (CTM-09, INT-TB-22..26)
  - docs/srd/parte7-ADRs.md (ADR-009)
  - docs/srd/parte8-APIs-contracts.md (API-140..150, SCH-016/017, INT-12..16)
  - docs/ux/parte1-inventario-telas.md (T-32, T-33, JN-12)
  - docs/ux/parte5-ui-specs.md (§4.11)
---

> ⚠️ **REST-08 v2 (decisão 14/05/2026)** — Drive é restrito ao Drive **interno da Suno** (`/sunos-shared/`). Drive externo de clientes está fora de escopo desta SPEC.


# Especificação — Drive Read-Only Curation (FA-14)

## 1. Visão Geral

**O quê.** Sistema que conecta o **Google Drive interno da Suno** (`/sunos-shared/`) como **fonte curada read-only** da Biblioteca do sunOS. Sync periódico (15min/24h) + Drive Push webhook descobrem documentos; um `CurationAgent` analisa e gera **sugestões** (`IMPORT_TO_LIBRARY`, `TAG`, `MERGE_WITH`, `MARK_DUPLICATE`, `MARK_OUTDATED`) que **sempre exigem decisão humana** (Líder/Curador). Importação aceita cria `KnowledgeItem` na Biblioteca com `provenance.drive_document_id` rastreável. Limpeza periódica gera `DriveCleanupReport` (duplicatas via `content_hash`, órfãos via `last_seen_at > 180d`, candidatos a arquivamento) — **apenas relatório, sem ação destrutiva**. Cliente individual pode ser excluído da integração via admin (LGPD/contratual).

**Por quê.** A Suno usa Drive como repositório de fato de brand guidelines, references, briefs, e materiais criativos. Hoje, ingerir esse acervo na Biblioteca é manual e demorado, levando a Biblioteca subutilizada. BR-018 pede integração; a versão **read-only + curadoria sugestiva** (ADR-009) preserva ownership do cliente sobre seu Drive enquanto reduz a 80% o atrito de ingestão.

**Para quem.**
- **Líder/Curador (PX-01)** — primário. Recebe sugestões, decide o que entra na Biblioteca, revisa relatórios de limpeza.
- **Admin (extensão de PX-01)** — conecta pasta inicial via OAuth, gerencia exclusões por cliente (LGPD), monitora T-32 dashboard.
- **Sócio (PX-06)** — pode ler T-32 dashboard como observador (read-only), não decide curadoria.
- **Operacional (PX-03)** — **caixa-preta**: NÃO vê Drive. Endpoints retornam 404 (não 403).

**Escopo.**
- ✅ OAuth `drive.readonly` com KMS encryption.
- ✅ Sync incremental Drive→sunOS via `changes.list` (15min default, 24h full pass).
- ✅ Drive Push webhook para pastas críticas (≤5min P95).
- ✅ Intersecção ACL Drive ∩ RBAC sunOS (default deny).
- ✅ CurationAgent gerando 5 tipos de sugestão (PENDING).
- ✅ Decisão humana ACCEPT/REJECT/DEFER por sugestão.
- ✅ Importer cria `KnowledgeItem` reusando pipeline DFL-03.
- ✅ DriveCleanupReport semanal (duplicatas + órfãos + nomenclatura + candidatos).
- ✅ Exclusão por cliente (com purge opcional de índices vetoriais).
- ✅ T-31 connect modal, T-32 sync dashboard, T-33 suggestions inbox, admin exclusions.
- ✅ Pub/Sub events (EV-35..41) idempotentes.
- ❌ Espelho bidirecional ou qualquer write (RN-027 + ADR-009).
- ❌ Auto-aplicação de sugestões mesmo com `confidence > 0.95` (RN-029).
- ❌ Cache em massa de conteúdo Drive em GCS controlado pela Suno.
- ❌ Sync de fontes não-Drive (SharePoint, Notion, Dropbox) — explícitamente fora.
- ❌ UI mobile (V2).

## 2. Personas e Jornadas

### 2.1. PX-01 Líder/Curador — primário

- **Perfil:** líder de área (ex: Brand, Conteúdo, Estratégia) responsável por curadoria do conhecimento do cliente. Conhece o conteúdo do Drive da equipe profundamente. Não é técnico, mas é meticuloso com versão e procedência.
- **Objetivo:** transformar o Drive da Suno (caos orgânico de pastas) em uma Biblioteca curada e versionada, sem perder dias por mês triando.
- **Jornada principal (JN-12 — Curadoria do Drive):**
  1. Recebe email/in-app: "23 novas sugestões na curadoria do Drive — cliente Acme".
  2. Abre **T-33 Suggestions Inbox** (`/drive/acme/sugestoes`).
  3. Filtra por `kind=IMPORT_TO_LIBRARY` (mais comum). Vê 14 sugestões com confidence ≥ 0.7.
  4. Para cada uma: clica preview → modal mostra conteúdo + rationale do agente.
  5. **Aceita** (com tags ajustadas) → toast "Importado para Biblioteca como 'Brand Guidelines Acme — v2.3'".
  6. **Rejeita** (sugestão errada) → card desaparece da inbox.
  7. **Adia 30d** (precisa revisar com diretora primeiro) → card volta no próximo report.
  8. Volta semanal para revisar relatório de limpeza (T-32 → "Cleanup Report"): vê 4 duplicatas detectadas, decide manter 1 e arquivar 3 (executando manualmente no Drive).

### 2.2. PX-01 Líder — também admin de OAuth (sub-jornada)

- **Jornada de conexão (JN-12.1):**
  1. Vai a `/admin/drive-sync/connect`.
  2. Seleciona cliente Acme + pasta raiz (input: Drive folder URL ou ID).
  3. Confirma escopo solicitado: "🔒 Apenas leitura: lista pastas, lê metadados, fetch sob demanda. Nunca escreve." (RN-027 reassurance).
  4. Clica "Conectar via Google" → OAuth consent screen Google → autoriza.
  5. Google redireciona com `code=...&state=...`.
  6. Tela success: "Drive conectado para Acme. Próximo sync: agora. Próximo cleanup report: domingo 06:00."

### 2.3. PX-12 Admin — exclusão por cliente

- **Perfil:** Admin do sunOS (operacional + permissões elevadas). Recebe pedido jurídico/contratual para excluir cliente da integração Drive.
- **Jornada:**
  1. Vai a `/admin/drive-sync/exclusions`.
  2. Busca cliente Beta. Vê: "Conectado em 2025-11-15. 234 documents indexados. 8 importados para Biblioteca."
  3. Clica "Excluir da integração" → modal exige razão (texto livre, ≥30 chars) + checkbox "Purgar índices vetoriais relacionados (irreversível)".
  4. Marca purge → segunda confirmação ("Esta ação remove 234 documentos da Biblioteca pesquisável de Beta. Digite o nome do cliente para confirmar:").
  5. Confirma → toast "Integração revogada. Token Drive deletado. Sync pausado. Índices marcados para purge — operação assíncrona, ~5 min."

### 2.4. PX-06 Sócio — leitor de dashboard

- **Perfil:** Sócio Suno (Diretoria). Quer visibilidade de adoção/saúde da integração Drive sem assumir curadoria.
- **Jornada:**
  1. Vai a T-32 `/drive/[clientSlug]` para ver health check e contadores.
  2. Sem botões de ação (badge de role oculta `Reconectar`, `Forçar sync`, etc.).
  3. Vê histórico de cleanup reports (read-only).

### 2.5. PX-03 Operacional — caixa-preta

- **Perfil:** Operacional sem permissão sobre Drive.
- **Comportamento esperado:**
  - `GET /drive/<qualquer>` retorna **404** (não 403).
  - Rota `/drive/[clientSlug]` em frontend: redirect para `/404` (não 403).
  - Operacional **não sabe** que Drive integration existe — nada no menu, nada em search, nada em contexto chat.

<!-- REVIEW: As 4 personas cobrem todos os atores ou falta alguém? Líder/Curador como persona única em cima de PX-01 está correto, ou deveria ser sub-tipo PX-01a "Curador"? -->

## 3. Requisitos Funcionais

### FR-171 — Conexão OAuth Google com escopo `drive.readonly`

- **Descrição:** Líder/Admin conecta pasta autorizada do Drive em `/admin/drive-sync/connect` via OAuth Google. Sistema solicita APENAS escopo `https://www.googleapis.com/auth/drive.readonly` + `drive.metadata.readonly`. Token armazenado encriptado via Cloud KMS. Conexão testada (`files.get` no folder root) antes de salvar.
- **Prioridade:** Alta
- **Regras de negócio:**
  - RN-027: SE OAuth solicitado ENTÃO escopo é literalmente `['drive.readonly', 'drive.metadata.readonly']` SENÃO falha hard.
  - SE conexão de teste falha (folder não existe ou sem permissão) ENTÃO desfazer OAuth grant + apagar token + retornar erro detalhado.

### FR-172 — Sync incremental Drive→sunOS via `changes.list`

- **Descrição:** Sistema sincroniza Drive→sunOS a cada 15min via cron (Cloud Scheduler) usando `changes.list?pageToken=...`. Primeiro sync após conexão é **full** (`files.list` recursivo). Subsequentes são **incrementais** com `pageToken` persistido. Pastas marcadas críticas (Brand Guidelines, regras de negócio) registram Drive Push webhook para sync ≤5min P95.
- **Prioridade:** Alta
- **Regras de negócio:**
  - RN-030: cron 15min default; webhook para pastas críticas; retry 3x exponencial; alerta admin se 3 falhas consecutivas.
  - SE `pageToken` perdido ENTÃO marca `drive_syncs.status='ERROR'` + alerta admin (full re-sync exige confirmação manual).

### FR-173 — Intersecção ACL Drive × RBAC sunOS (default deny)

- **Descrição:** `AccessGuard` valida toda leitura: (a) email do principal está em `acl_snapshot` com role ≥ `reader` E (b) RBAC sunOS permite ver `client_id`. SE algum `false` → **404** (caixa-preta — RN-011 generalizado), nunca 403. Decisão registrada em `audit_log_drive` para análise.
- **Prioridade:** Alta
- **Regras de negócio:**
  - RN-028: AND lógico estrito; sem fallback "admin vê tudo".
  - RN-009/011: 404 genérico; mensagem padronizada "Documento não disponível".

### FR-174 — Garantia técnica de read-only no Drive

- **Descrição:** Sistema bloqueia toda operação de write/delete/move/copy contra o Drive em camada de SDK wrapper. Tentativas são interceptadas antes da chamada HTTP, registradas como `severity=CRITICAL` no `audit_log_drive` e disparam SafetyAlert. Métrica `drive_write_attempts_total` instrumentada (deve ser 0 em produção). Painel admin (T-32) mostra contador.
- **Prioridade:** Alta
- **Regras de negócio:**
  - RN-027: bloqueio em SDK wrapper; teste de regressão obrigatório (mock retornando 200 — deve falhar antes da call).

### FR-175 — Drive Cleanup Report semanal

- **Descrição:** Job semanal (cron `0 6 * * 0` — domingos 06:00) analisa `drive_documents` por cliente e produz `DriveCleanupReport` com 4 categorias: (a) duplicatas (`content_hash` igual), (b) órfãos (`last_seen_at > 180d`), (c) candidatos a Biblioteca (não-curados, com >5 acessos no Drive nos últimos 30d), (d) nomenclatura inconsistente (regex de heurística). Notificação in-app + email para Líder/Curador.
- **Prioridade:** Média
- **Regras de negócio:**
  - RN-029: report é apenas sugestivo. Nenhum item é executado automaticamente.

### FR-176 — Curadoria assistida (Líder revisa Cleanup Report e suggestions)

- **Descrição:** T-33 Inbox de Sugestões permite ao Líder revisar cada `CurationSuggestion` (gerada por `CurationAgent` no caminho de descoberta) e cada item do `DriveCleanupReport`. Decisões: **Aceitar** (`status='ACCEPTED'`; se `kind=IMPORT_TO_LIBRARY` → dispara Importer), **Rejeitar** (`status='REJECTED'`; persiste com razão), **Adiar 30d** (volta no próximo report), **Aceitar e marcar para reorganização manual** (apenas registra decisão; Líder executa fora do sunOS).
- **Prioridade:** Alta
- **Regras de negócio:**
  - RN-029: decisão é por humano único (`decided_by`). Não há decisão coletiva, nem auto-decisão.

### FR-177 — Ingestão de conteúdo do Drive na Biblioteca

- **Descrição:** Quando Líder aceita `IMPORT_TO_LIBRARY`, `Importer` (a) baixa conteúdo via `files.get?alt=media`, (b) extrai texto/conteúdo (pipeline multimodal — fora desta SPEC, FA-08), (c) cria `KnowledgeItem` em BC-02 com metadados obrigatórios (RN-006: tags ≥ 2, descrição ≥ 50), (d) preserva `provenance.drive_document_id`. Re-importação cria novo `KnowledgeItem` (auditável); UPDATE no `KnowledgeItem` existente é proibido.
- **Prioridade:** Alta
- **Regras de negócio:**
  - RN-006: tags ≥2 + descrição ≥50; se faltam, Líder fornece no modal antes de aceitar.

### FR-178 — Exclusão por cliente (LGPD/contratual)

- **Descrição:** Admin marca cliente excluído em `/admin/drive-sync/exclusions`. Sistema: (a) `drive_syncs.status='REVOKED'`, (b) `drive_oauth_credentials.revoked_at=now()` + delete imediato do token via KMS, (c) `drive_documents` daquele cliente filtrados de toda query (não retornam em listagem nem em retrieval), (d) opcionalmente purga índices vetoriais (`purge_indexed_content=true` requer header `X-Confirm-Destructive: true` + razão ≥30 chars). Audit entry permanente.
- **Prioridade:** Alta
- **Regras de negócio:**
  - RN-009 (RBAC): exclusão exige role `Admin`.
  - LGPD: razão obrigatória (texto livre, ≥30 chars).

### FR-179 — Drive Sync Dashboard (T-32)

- **Descrição:** Tela `/drive/[clientSlug]` exibe: status do sync (Verde/Amarelo/Vermelho), última/próxima sync, contadores (discovered/indexed/curated), próximo Cleanup Report, exclusões ativas, status OAuth, **badge `🔒 drive.readonly` permanente** (RN-027 reassurance), métrica `drive_write_attempts_total` (deve ser 0), banner "Apenas relatório — agente nunca executa" (RN-029 reassurance).
- **Prioridade:** Média
- **Regras de negócio:**
  - Sócio (PX-06) vê dashboard read-only; sem botões de ação.

<!-- REVIEW: 9 FRs cobrem tudo do scope? Falta algo crítico? Por exemplo: FR para purga assíncrona de índices? FR para alertar admin quando OAuth expira? -->

## 4. Comportamento Especificado

### 4.1. Máquina de estados de `DriveSync`

```
            ┌─────────────┐
            │ CONNECTING  │  (durante OAuth flow + connection test)
            └──────┬──────┘
                   │ test ok
                   ▼
            ┌─────────────┐    sync ok       ┌─────────────┐
            │   ACTIVE    │ ◄──────────────► │   ACTIVE    │  (re-sync)
            └──────┬──────┘                  └─────────────┘
       admin pause │  │ token expired
                   ▼  ▼
            ┌─────────────┐                  ┌─────────────────┐
            │   PAUSED    │                  │ OAUTH_EXPIRED   │
            └──────┬──────┘                  └────────┬────────┘
       admin resume│                  reconnect       │
                   │                          (nova OAuth grant)
                   ▼                                   │
            (back to ACTIVE)                          ▼
                                              (back to ACTIVE)

       ┌─────────────┐    3 failures consec.    ┌─────────────┐
       │   ACTIVE    │ ──────────────────────► │    ERROR    │
       └─────────────┘                         └──────┬──────┘
                                       admin retry    │
                                                      ▼
                                            (back to ACTIVE)

       ┌──────────┐  admin revoke   ┌──────────┐
       │ ANY      │ ──────────────► │ REVOKED  │  (terminal — exige nova grant)
       └──────────┘                  └──────────┘
```

Estados (`drive_syncs.status`):
- `CONNECTING` — durante OAuth flow + teste de conexão (transitório, ≤30s).
- `ACTIVE` — operacional, sync periódico rodando.
- `PAUSED` — admin pausou manualmente (ex: durante manutenção do cliente).
- `OAUTH_EXPIRED` — `refresh_token` falhou; exige reconnect.
- `ERROR` — 3 falhas consecutivas de sync; exige retry admin.
- `REVOKED` — terminal; exige nova OAuth grant.

### 4.2. Máquina de estados de `CurationSuggestion`

```
       (CurationAgent gera)
              │
              ▼
       ┌─────────────┐
       │   PENDING   │
       └──────┬──────┘
              │
   Líder ─────┼─────► ┌─────────────┐
   ACCEPT     │       │  ACCEPTED   │ (terminal; se IMPORT_TO_LIBRARY → dispara Importer)
              │       └─────────────┘
              │
   Líder ─────┼─────► ┌─────────────┐
   REJECT     │       │  REJECTED   │ (terminal)
              │       └─────────────┘
              │
   Líder ─────┼─────► (volta a PENDING após 30d via job)
   DEFER      │
              │
   Documento ─┴─────► ┌─────────────┐
   atualizado          │   STALE     │ (terminal; sugestão obsoleta)
   no Drive            └─────────────┘
```

### 4.3. Fluxos principais

#### Fluxo 1 — Conectar pasta Drive (FR-171, DFL-09 setup)

1. Admin abre T-31 connect modal.
2. Seleciona cliente + folder URL/ID.
3. Frontend POST `/api/drive/connect` com `{client_id, folder_ids}`.
4. Backend valida role `Admin`, retorna `oauth_url + state`.
5. Frontend abre OAuth popup → Google consent screen.
6. Google redirect → `/api/drive/oauth-callback?code=...&state=...`.
7. Backend troca `code` por `access_token + refresh_token` via Google.
8. Backend valida `granted_scopes == requested_scopes` (rejeita se diff).
9. Backend faz teste: `files.get(folder_root_id, fields='id,name')` — se 200, prossegue.
10. Backend encripta tokens via KMS.
11. Backend INSERT `drive_oauth_credentials` + `drive_syncs(status='CONNECTING')`.
12. Backend dispara primeiro sync full (async, Cloud Tasks job).
13. Backend transition `drive_syncs.status='ACTIVE'` quando full sync completa.
14. Frontend recebe sucesso, redireciona para T-32 dashboard.

#### Fluxo 2 — Sync periódico (FR-172, DFL-09 sync)

1. Cloud Scheduler dispara cron `*/15 * * * *` por cliente.
2. POST `/api/drive/sync/run` com `client_id`.
3. `ListChangesWorker` carrega `drive_syncs.last_page_token` + decrypt OAuth via KMS.
4. Chama `changes.list?pageToken=...&pageSize=100`.
5. Para cada change: SnapshotDiffer faz UPSERT em `drive_documents` (ou marca `marked_orphan_at` se removido).
6. Atualiza `drive_syncs.last_full_sync_at`, `last_page_token`, contadores.
7. Para cada documento novo/atualizado: emite EV-37 `DriveDocumentDiscovered`.
8. CurationAgent é acionado (Pub/Sub trigger) — async.
9. CurationAgent gera `CurationSuggestion[]` por documento → INSERT com `status='PENDING'`.
10. Emite EV-38 `CurationSuggestionGenerated`.
11. Emite EV-36 `DriveSyncCompleted` com `documents_total`, `duration_ms`.

#### Fluxo 3 — Drive Push webhook (FR-172, DFL-09 reativo)

1. Pasta crítica (flag) tem channel registrado em Drive Push (TTL 7 dias).
2. Mudança no Drive → Google envia POST a `/api/drive/webhook` (sem body, headers `X-Goog-*`).
3. WebhookReceiver valida assinatura Google + lookup `channel_id` → `sync_id + folder_id`.
4. Enfileira sync incremental somente da folder afetada (não full).
5. Resto do fluxo igual ao Fluxo 2 a partir do passo 4.

#### Fluxo 4 — Lista documentos visíveis ao usuário (FR-173)

1. Frontend GET `/api/drive/documents?client_id=X&cursor=Y`.
2. Backend resolve `principal` do JWT (`email + roles + accessible_clients`).
3. Backend valida `client_id` ∈ `principal.accessible_clients` — se não, **404** (caixa-preta).
4. Backend SELECT `drive_documents WHERE client_id=X AND last_seen_at > now()-30d`.
5. Para cada doc: `AccessGuard.can_read(principal, doc.acl_snapshot)`.
6. Filtra documentos onde guard retorna `false` (não loga email PII).
7. Retorna paginação cursor com lista enxuta.

#### Fluxo 5 — Aceitar sugestão `IMPORT_TO_LIBRARY` (FR-176, FR-177)

1. Líder na T-33 Inbox, clica "Aceitar" em card.
2. Modal opcional: ajustar `tags` (≥2, do RN-006), `description` (≥50).
3. Frontend POST `/api/drive/suggestions/{id}/decide` com `{decision: 'ACCEPT', override_tags, description}`.
4. Backend valida role Líder/Curador.
5. Backend transação atômica:
   - SELECT `curation_suggestion` FOR UPDATE; checa `status='PENDING'`.
   - UPDATE `status='ACCEPTED'`, `decided_by=...`, `decided_at=now()`.
   - INSERT em `outbox_drive_events` evento EV-39.
6. Backend dispara `Importer` async (Cloud Tasks).
7. `Importer` decrypt OAuth → `files.get?alt=media` → conteúdo bytes.
8. `Importer` chama pipeline DFL-03 (chunking, embedding, KG) — interno BC-02.
9. `Importer` INSERT `KnowledgeItem` com `provenance.drive_document_id`.
10. `Importer` UPDATE `drive_documents.curated_as_knowledge_item_id`.
11. Frontend mostra toast de sucesso; sugestão sai da lista.

#### Fluxo 6 — Aceitar sugestão `MARK_DUPLICATE` (FR-176)

1. Líder aceita.
2. Backend UPDATE `status='ACCEPTED'`.
3. Não há ação destrutiva no Drive (RN-029) — Líder executa o arquivamento manualmente no Drive se quiser.
4. `drive_documents` da duplicata recebe flag `marked_duplicate_of=<other_document_id>` para futuro report.

#### Fluxo 7 — Rejeitar sugestão (FR-176)

1. Líder clica "Rejeitar"; modal opcional para razão.
2. Backend UPDATE `status='REJECTED'`, `decided_by`, `decided_at`, `rejection_reason`.
3. Sugestão não volta no próximo report.

#### Fluxo 8 — Adiar sugestão 30d (FR-176)

1. Líder clica "Adiar 30d".
2. Backend UPDATE `status='PENDING'`, `defer_until=now()+30d` (campo opcional).
3. Backend cleanup job de domingo SKIPA suggestions com `defer_until > now()`.

#### Fluxo 9 — DriveCleanupReport semanal (FR-175)

1. Cloud Scheduler dispara `0 6 * * 0` (domingo 06:00).
2. POST `/api/drive/cleanup/run` com `client_id`.
3. `CleanupJob` SCAN `drive_documents` por cliente:
   - Duplicatas: GROUP BY `content_hash` HAVING COUNT > 1.
   - Órfãos: `last_seen_at < now() - 180d`.
   - Candidatos a Biblioteca: heurística (texto livre + sem `curated_as_knowledge_item_id`).
   - Nomenclatura: regex (`-final`, `-v2`, `-cópia`, espaço duplo, etc.).
4. INSERT `drive_cleanup_reports` com counts + `summary_json`.
5. Emite EV-40 `CleanupReportGenerated`.
6. Notification dispatcher envia in-app + email para Líder/Curador.

#### Fluxo 10 — Excluir cliente (FR-178)

1. Admin abre `/admin/drive-sync/exclusions`, busca cliente.
2. Admin clica "Excluir da integração", preenche razão (≥30 chars).
3. Admin marca checkbox "Purgar índices vetoriais" → segunda confirmação (digitar nome cliente).
4. Frontend DELETE `/api/drive/oauth?client_id=X` com `{purge_indexed_content: true, reason}` + header `X-Confirm-Destructive: true`.
5. Backend valida role `Admin`.
6. Backend transação:
   - UPDATE `drive_syncs.status='REVOKED'`.
   - UPDATE `drive_oauth_credentials.revoked_at=now()`.
   - DELETE encrypted tokens (KMS hard delete).
   - INSERT em `audit_log_drive` (immutable).
7. Se `purge_indexed_content=true`: enfileira job assíncrono para apagar `KnowledgeItem`s com `provenance.drive_document_id` em `drive_documents.client_id=X`.
8. Backend cancela cron `drive-sync-{client_id}` no Cloud Scheduler.
9. Backend cancela channels Drive Push se houver.

### 4.4. Fluxos de erro

| Código | Condição | Resposta ao usuário | Ação interna |
|--------|----------|---------------------|--------------|
| 400 | `folder_ids` inválido (não é folder ou não existe) | "Pasta inválida ou inacessível" | Log com `client_id`; sem token persistido |
| 401 | OAuth state expirado/inválido | Redireciona para connect | Log; nada persistido |
| 403 | Tentativa de write Drive interceptada | (interno; usuário não vê) | `severity=CRITICAL` audit + SafetyAlert + métrica `drive_write_attempts_total++` |
| 404 | Caixa-preta — usuário sem permissão | "Documento não disponível" / página 404 | Log com `principal.role` + `attempted_endpoint` (sem PII) |
| 409 | Cliente já tem `drive_syncs` ativo | "Já conectado. Use revoke antes de reconectar." | Sem mudança de estado |
| 429 | Drive API rate limit (10k/dia) | "Sync atrasado por limite Google. Próximo: <ETA>." | Log com cliente + endpoint; backoff exponencial |
| 500 | KMS decrypt falha | "Erro interno — admin notificado" | SafetyAlert HIGH; sync entra ERROR |
| 502 | Drive API timeout (>30s) | (interno; sync retry) | Retry exponencial 3x; após falha → ERROR |
| 503 | Drive Push webhook channel expirou | (interno; renew automático) | Renew channel; se falha 3x → ERROR + admin |

### 4.5. Estados visuais por status (T-32)

| `drive_syncs.status` | Indicador | Texto principal | Texto secundário |
|----------------------|-----------|-----------------|------------------|
| `CONNECTING` | 🔵 Azul + spinner | "Conectando…" | "Aguardando primeiro sync" |
| `ACTIVE` (sync ok < 30min) | 🟢 Verde | "Tudo certo" | "Última sync: 12min atrás" |
| `ACTIVE` (sync 30min–24h) | 🟡 Amarelo | "Sync com lag" | "Última: 4h atrás" |
| `PAUSED` | ⏸️ Cinza | "Pausado" | "Pausado por <admin> em <data>" |
| `OAUTH_EXPIRED` | 🔴 Vermelho + glow âmbar pulse | "Token expirou" | Botão "Reconectar" |
| `ERROR` | 🔴 Vermelho | "Erro de sync" | "<error_message>" + botão "Tentar novamente" |
| `REVOKED` | ⚫ Cinza escuro | "Integração desativada" | "Por <razão>" — sem botões |

## 5. Requisitos Não-Funcionais

### NFR-001 — Latência

- Primeira interação no T-32 carrega ≤1.5s (dashboard simples).
- Lista T-33 sugestões (até 100) carrega ≤2s.
- Preview modal de documento (`API-146` fetch on-demand) ≤3s P95 para arquivos ≤10MB.
- Sync incremental (`changes.list`): processo backend ≤60s para até 1000 mudanças.
- Webhook → suggestion appear no inbox: ≤5min P95.
- CurationAgent por documento: ≤8s P95 (não bloqueia sync; roda async).

### NFR-002 — Confiabilidade

- Sync incremental tem retry exponencial 3x antes de marcar `ERROR`.
- Outbox pattern para Pub/Sub publish (atomicidade DB↔eventos).
- Channel Drive Push renewal automático a cada 6 dias (Google expira em 7).
- Cron rate limit awareness: alerta admin se cliente passar de 70% do budget Drive API diário.

### NFR-003 — Segurança

- OAuth tokens encriptados via Cloud KMS (NFR-008 do SRD).
- Plaintext de token nunca persistido (memória ephemera apenas).
- Logs mascaram token e refresh_token como `***REDACTED***`.
- Cross-client guard (RN-010) em todas as queries; teste de regressão por endpoint.
- Caixa-preta para Operacional (RN-009/011): 404 não 403.
- ACL∩RBAC default deny (RN-028).

### NFR-004 — Auditabilidade

- `audit_log_drive` table append-only (trigger PG bloqueia UPDATE/DELETE).
- Todas as chamadas Drive API logadas: `client_id, sync_id, endpoint, result, latency_ms`.
- Tentativas de write bloqueadas: `severity=CRITICAL` + SafetyAlert.
- Decisões de curadoria registradas: `decided_by`, `decided_at`, `decision`, `rationale_or_reason`.
- Métrica `drive_write_attempts_total` (deve ser 0) instrumentada e visível em T-32.

### NFR-005 — Acessibilidade

- T-32 e T-33 navegáveis via teclado.
- ARIA live region em T-33 para "N novas sugestões".
- `prefers-reduced-motion` honrado em todas as 5 microinterações de UX §4.11 (sync animation, suggestion accept/reject, OAuth glow).
- Focus trap em modal de preview e modal de exclusão.

### NFR-006 — Escalabilidade

- 1 cliente piloto inicial; arquitetura suporta ≥50 clientes simultâneos com 10k documents cada.
- `drive_documents` indexado por `(client_id, last_seen_at)` para queries de filtro rápido.
- `content_hash` indexado para detecção de duplicatas.
- Cron por cliente desacoplado (1 job por client_id no Scheduler).

### NFR-007 — LGPD/Compliance

- Política de retenção: `drive_oauth_credentials` apagado imediatamente após `revoked_at`.
- `drive_documents` apagados quando sync revoked OU `last_seen_at > 30d` (a partir de revoke).
- Exclusão por cliente é completa e reversível somente com nova OAuth grant.
- Razão de exclusão obrigatória (texto livre, ≥30 chars) — armazenada em `audit_log_drive`.

## 6. Interface & Contratos

### 6.1. Endpoints

#### POST `/api/drive/connect` (API-140) — Inicia OAuth flow

**Auth:** JWT + role `Admin` ou `Líder` para o `client_id`.

**Request:**
```json
{
  "client_id": "uuid",
  "folder_ids": ["1AbC...", "1XyZ..."],
  "critical_folder_ids": ["1AbC..."]
}
```

**Response 200:**
```json
{
  "oauth_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "opaque-token-for-csrf-protection"
}
```

**Errors:**
- 400 — `folder_ids` vazia.
- 403 — sem role admin/líder para o cliente.
- 404 — `client_id` não existe (ou caixa-preta para usuário não-admin).
- 409 — cliente já tem `drive_syncs.status='ACTIVE'` (revogue antes).

#### GET `/api/drive/oauth-callback?code=...&state=...` (API-141)

**Auth:** state matched.

**Response:** redireciona para `/admin/drive-sync?client_id=X&result=success` ou `?result=error&reason=...`.

**Backend Action:** troca `code` por tokens, valida `granted_scopes`, encripta via KMS, INSERT credentials + drive_syncs, dispara primeiro sync full.

#### GET `/api/drive/sync-state?client_id=X` (API-142)

**Auth:** JWT + RBAC para o cliente.

**Response 200:**
```json
{
  "sync_id": "uuid",
  "client_id": "uuid",
  "status": "ACTIVE",
  "last_full_sync_at": "2026-04-30T12:34:56Z",
  "last_webhook_event_at": "2026-04-30T13:00:00Z",
  "next_scheduled_sync_at": "2026-04-30T13:15:00Z",
  "documents_total": 1234,
  "documents_indexed": 1200,
  "documents_curated": 45,
  "drive_write_attempts_total": 0,
  "error_message": null
}
```

**Errors:**
- 404 — caixa-preta ou cliente sem sync.

#### POST `/api/drive/sync/run` (API-143)

**Auth:** Service Account (Cloud Scheduler) ou role `Admin`.

**Request:**
```json
{
  "client_id": "uuid",
  "full_sync": false
}
```

**Response 202:**
```json
{ "job_id": "drive-sync-<uuid>-<timestamp>" }
```

**Errors:**
- 403 — sem permissão.
- 409 — sync já em progresso.
- 503 — Drive API quota exceeded.

#### POST `/api/drive/webhook` (API-144) — Drive Push receiver

**Auth:** Validação Google headers (sem JWT user).

**Headers:** `X-Goog-Channel-ID`, `X-Goog-Resource-State`, `X-Goog-Message-Number`, `X-Goog-Notification-ID`.

**Body:** vazio.

**Response 200:** `{ "received": true }`.

**Backend Action:** valida channel_id, lookup `sync_id + folder_id`, enfileira sync incremental.

#### GET `/api/drive/documents?client_id=X&cursor=Y&kind=...` (API-145)

**Auth:** JWT + RBAC + AccessGuard por documento.

**Query:**
- `client_id` (required)
- `cursor` (paginação)
- `indexed_only=true` (filter docs com metadata extracted)
- `curated_only=true` (filter docs já em Biblioteca)

**Response 200:**
```json
{
  "documents": [
    { "document_id": "uuid", "name": "Brand Guidelines v2.pdf", "mime_type": "application/pdf", "last_seen_at": "...", "curated_as_knowledge_item_id": null }
  ],
  "next_cursor": "opaque-token"
}
```

**Errors:**
- 404 — caixa-preta para usuário sem permissão.

#### GET `/api/drive/documents/{document_id}/content` (API-146)

**Auth:** JWT + RBAC + AccessGuard.

**Response 200:** Content-Type conforme MIME; stream direto ou redirect a signed URL.

**Errors:**
- 404 — caixa-preta (sem permissão OU documento não existe).

#### GET `/api/drive/suggestions?client_id=X&status=PENDING&kind=...&cursor=Y` (API-147)

**Auth:** JWT + role `Líder` ou superior.

**Response 200:**
```json
{
  "suggestions": [
    {
      "suggestion_id": "uuid",
      "document": { "document_id": "uuid", "name": "..." },
      "kind": "IMPORT_TO_LIBRARY",
      "confidence": 0.87,
      "rationale": "Documento referenciado em 5 chats nos últimos 30 dias.",
      "status": "PENDING",
      "created_at": "..."
    }
  ],
  "next_cursor": "..."
}
```

#### POST `/api/drive/suggestions/{suggestion_id}/decide` (API-148)

**Auth:** JWT + role `Líder` ou superior.

**Request:**
```json
{
  "decision": "ACCEPT",
  "override_tags": ["brand", "guidelines"],
  "description": "Brand Guidelines da Acme — versão final 2.3, distribuída em fev/26",
  "reason": null
}
```

**Decisions:** `ACCEPT`, `REJECT`, `DEFER`.

**Response 200:**
```json
{ "status": "ACCEPTED", "knowledge_item_id": "uuid|null" }
```

**Errors:**
- 400 — tags < 2 ou description < 50 (RN-006).
- 403 — sem role Líder para o cliente.
- 404 — sugestão não existe / caixa-preta.
- 409 — sugestão já decidida (status != PENDING).

#### GET `/api/drive/cleanup-reports?client_id=X&period_start=...&cursor=Y` (API-149)

**Auth:** JWT + role `Líder` para o cliente.

**Response 200:**
```json
{
  "reports": [
    {
      "report_id": "uuid",
      "period_start": "2026-04-23",
      "period_end": "2026-04-29",
      "duplicates_found": 4,
      "orphans_found": 12,
      "candidates_to_archive": 3,
      "naming_inconsistencies": 7,
      "summary_json": { /* ... */ },
      "generated_at": "2026-04-30T06:00:00Z"
    }
  ],
  "next_cursor": null
}
```

#### DELETE `/api/drive/oauth?client_id=X` (API-150)

**Auth:** JWT + role `Admin`. Header obrigatório `X-Confirm-Destructive: true` se `purge_indexed_content=true`.

**Request:**
```json
{
  "client_id": "uuid",
  "purge_indexed_content": true,
  "reason": "Cliente cancelou contrato — solicitação jurídica de remoção LGPD."
}
```

**Response 200:**
```json
{
  "status": "REVOKED",
  "documents_will_be_deleted": 234,
  "knowledge_items_will_be_deleted": 8,
  "purge_job_id": "purge-<uuid>"
}
```

**Errors:**
- 400 — `reason` < 30 chars.
- 403 — sem role admin.
- 412 — `purge_indexed_content=true` sem header de confirmação.

### 6.2. Eventos (Pub/Sub topic `sunos.drive.events`)

Padrão: payload contém `event_id`, `event_type`, `event_version`, `occurred_at`, `client_id`, `sync_id`, e dados específicos.

| ID | Tipo | Quando | Carga |
|----|------|--------|-------|
| EV-35 | `DriveSyncStarted` | Início de sync (cron ou webhook) | `sync_id`, `client_id`, `trigger: 'cron'\|'webhook'\|'manual'` |
| EV-36 | `DriveSyncCompleted` | Sync concluído | `sync_id`, `documents_total`, `documents_added`, `documents_updated`, `documents_marked_orphan`, `duration_ms` |
| EV-37 | `DriveDocumentDiscovered` | Novo documento ou versão detectada | `document_id`, `drive_file_id`, `mime_type`, `content_hash` |
| EV-38 | `CurationSuggestionGenerated` | CurationAgent gerou sugestão | `suggestion_id`, `document_id`, `kind`, `confidence` |
| EV-39 | `CurationSuggestionAccepted` | Líder aceitou (qualquer kind) | `suggestion_id`, `decided_by`, `kind`, `knowledge_item_id` (se IMPORT) |
| EV-40 | `CleanupReportGenerated` | Cleanup job concluiu | `report_id`, `client_id`, `duplicates`, `orphans`, `candidates` |
| EV-41 | `OAuthExpired` | Refresh token falhou | `credential_id`, `client_id` — dispara SafetyAlert MEDIUM |

### 6.3. Schemas reutilizáveis

- **SCH-016** `DriveDocument` — definido em SRD Parte 8 §SCH-016.
- **SCH-017** `CurationSuggestion` — definido em SRD Parte 8 §SCH-017.
- **SCH-DRV-NEW-01** `DriveSyncState` — novo (resposta de API-142, ver §6.1).
- **SCH-DRV-NEW-02** `DriveCleanupReportSummary` — novo (resposta de API-149, ver §6.1).
- **SCH-DRV-NEW-03** `OAuthRevokeRequest` — novo (corpo de DELETE API-150).

## 7. Critérios de Aceite

### 7.1. OAuth e conexão (FR-171)

- [ ] **CA-01** DADO admin com role `Admin` para cliente Acme QUANDO chama POST /api/drive/connect com folder_ids válidos ENTÃO recebe `oauth_url` + `state`.
- [ ] **CA-02** DADO admin sem role para Acme QUANDO chama POST /api/drive/connect ENTÃO recebe **404** (caixa-preta).
- [ ] **CA-03** DADO Google retorna scopes diferentes do solicitado QUANDO callback processa ENTÃO desfaz grant + retorna erro "scope mismatch".
- [ ] **CA-04** DADO connection test (`files.get` no folder root) falha QUANDO callback processa ENTÃO desfaz grant + retorna "folder inacessível".
- [ ] **CA-05** DADO conexão sucedida QUANDO callback processa ENTÃO `drive_oauth_credentials` insere com tokens ENCRIPTADOS e log NÃO contém token plaintext.
- [ ] **CA-06** DADO `drive_syncs.status='ACTIVE'` para Acme QUANDO admin tenta nova POST /connect ENTÃO recebe 409.

### 7.2. Sync incremental (FR-172, RN-030)

- [ ] **CA-07** DADO `drive_syncs.last_page_token=X` QUANDO `ListChangesWorker` roda ENTÃO chama `changes.list?pageToken=X` (não `files.list`).
- [ ] **CA-08** DADO mudança em pasta crítica via Drive Push QUANDO webhook recebido ENTÃO sync incremental dispara em ≤5min P95.
- [ ] **CA-09** DADO 3 falhas consecutivas de sync QUANDO 4ª tenta ENTÃO marca `status='ERROR'` + SafetyAlert.
- [ ] **CA-10** DADO `pageToken` perdido (NULL) QUANDO sync tenta rodar ENTÃO marca `status='ERROR'` + alerta admin (não auto-recover).
- [ ] **CA-11** DADO sync rodando QUANDO 2º cron dispara ENTÃO 2º recebe 409 (sync em progresso).

### 7.3. ACL∩RBAC (FR-173, RN-028, RN-011)

- [ ] **CA-12** DADO documento com `acl_snapshot=[{email: 'a@suno.ag', role: 'reader'}]` QUANDO usuário `b@suno.ag` chama GET /documents/{id}/content ENTÃO recebe 404.
- [ ] **CA-13** DADO documento ACL ok mas `principal.client_id != document.client_id` QUANDO chama GET /documents ENTÃO recebe 404 + log com `decision_reason='client_mismatch'`.
- [ ] **CA-14** DADO Operacional (sem permissão) QUANDO chama qualquer endpoint /api/drive/* ENTÃO recebe 404.
- [ ] **CA-15** DADO Sócio (PX-06) QUANDO chama GET /sync-state ENTÃO recebe 200 (read-only ok).

### 7.4. Read-only enforcement (FR-174, RN-027)

- [ ] **CA-16** DADO `OAuthVault.scopes` contém `'drive.write'` QUANDO unit test roda ENTÃO falha (assert).
- [ ] **CA-17** DADO mock Drive API retorna 200 para `files.create` QUANDO código tenta chamar ENTÃO **SDK wrapper intercepta** antes da call HTTP + log CRITICAL + SafetyAlert.
- [ ] **CA-18** DADO métrica `drive_write_attempts_total` QUANDO cliente em prod por 7 dias ENTÃO valor é exatamente 0.
- [ ] **CA-19** DADO admin abre T-32 QUANDO renderiza ENTÃO badge "🔒 drive.readonly" visível.

### 7.5. CurationAgent + suggestions (FR-176)

- [ ] **CA-20** DADO documento novo descoberto QUANDO CurationAgent roda ENTÃO gera ≥1 `CurationSuggestion` com `status='PENDING'`, `confidence ∈ [0, 1]`, `rationale` não vazio.
- [ ] **CA-21** DADO sugestão `confidence=0.99` QUANDO sistema processa ENTÃO `status` permanece `PENDING` (RN-029 — nunca auto-aceita).
- [ ] **CA-22** DADO Líder POST /suggestions/{id}/decide com `decision='ACCEPT'` QUANDO suggestion `status='PENDING'` ENTÃO transita para `ACCEPTED` + `decided_by=líder.id` + `decided_at=now()`.
- [ ] **CA-23** DADO Líder tenta decide em sugestão `status='ACCEPTED'` QUANDO POST /decide ENTÃO recebe 409.
- [ ] **CA-24** DADO Operacional QUANDO tenta GET /suggestions ENTÃO recebe 404.
- [ ] **CA-25** DADO documento atualizado no Drive (modifiedTime > suggestion.created_at) QUANDO próximo sync detecta ENTÃO suggestions PENDING para esse doc são marcadas `STALE`.

### 7.6. Importer (FR-177, RN-006)

- [ ] **CA-26** DADO `decision='ACCEPT'` em `kind='IMPORT_TO_LIBRARY'` QUANDO Importer roda ENTÃO cria `KnowledgeItem` com `provenance.drive_document_id == document_id`.
- [ ] **CA-27** DADO request com `override_tags=['a']` (1 tag) QUANDO POST /decide ENTÃO recebe 400 (RN-006: tags ≥ 2).
- [ ] **CA-28** DADO request com `description="curto"` (5 chars) QUANDO POST /decide ENTÃO recebe 400 (RN-006: ≥ 50).
- [ ] **CA-29** DADO `Importer` falha em pipeline DFL-03 QUANDO retry esgota ENTÃO suggestion volta para `PENDING` + alerta.
- [ ] **CA-30** DADO documento já importado (`curated_as_knowledge_item_id != null`) QUANDO Líder aceita nova `IMPORT_TO_LIBRARY` ENTÃO cria NOVO `KnowledgeItem` (auditável); `drive_documents.curated_as_knowledge_item_id` aponta ao mais recente.

### 7.7. Cleanup Report (FR-175)

- [ ] **CA-31** DADO 3 documentos com mesmo `content_hash` QUANDO CleanupJob roda ENTÃO `duplicates_found ≥ 1` em report.
- [ ] **CA-32** DADO documento com `last_seen_at < now() - 180d` QUANDO CleanupJob roda ENTÃO contado em `orphans_found`.
- [ ] **CA-33** DADO CleanupJob conclui QUANDO INSERT report ENTÃO emite EV-40 + Notification dispatcher envia email Líder.
- [ ] **CA-34** DADO Operacional QUANDO tenta GET /cleanup-reports ENTÃO recebe 404.

### 7.8. Exclusão por cliente (FR-178)

- [ ] **CA-35** DADO admin DELETE /oauth com `purge_indexed_content=true` SEM header `X-Confirm-Destructive` QUANDO request processa ENTÃO recebe 412.
- [ ] **CA-36** DADO admin DELETE /oauth com `reason="curto"` (10 chars) QUANDO request processa ENTÃO recebe 400.
- [ ] **CA-37** DADO admin DELETE /oauth válido QUANDO completes ENTÃO `drive_syncs.status='REVOKED'` + `drive_oauth_credentials.revoked_at=now()` + tokens deletados via KMS.
- [ ] **CA-38** DADO cliente revoked QUANDO Líder (mesmo válido antes) tenta GET /documents ENTÃO recebe 404.
- [ ] **CA-39** DADO `purge_indexed_content=true` QUANDO purge job conclui ENTÃO `KnowledgeItem`s com `provenance.drive_document_id` em cliente excluído são apagados (auditável via audit_log).

### 7.9. Dashboard T-32 (FR-179)

- [ ] **CA-40** DADO `drive_syncs.status='ACTIVE'` + última sync 12min atrás QUANDO Líder abre T-32 ENTÃO indicador é 🟢 verde + texto "Última sync: 12min atrás".
- [ ] **CA-41** DADO `drive_syncs.status='OAUTH_EXPIRED'` QUANDO Líder abre T-32 ENTÃO indicador é 🔴 + glow âmbar + botão "Reconectar" visível.
- [ ] **CA-42** DADO `drive_write_attempts_total > 0` QUANDO Líder abre T-32 ENTÃO contador exibido em vermelho + alerta "Anomalia — admin notificado" (cenário que NUNCA deve acontecer em prod).

### 7.10. Vocabulário Suno

- [ ] **CA-43** DADO copies de UI das telas T-31, T-32, T-33 QUANDO scan automático QA roda ENTÃO ZERO ocorrências de "gerar", "otimizar", "eficiência", "smart".
- [ ] **CA-44** DADO `CurationSuggestion.rationale` gerado por agente QUANDO CurationAgent persiste ENTÃO substitui "gerar" → "criar" no rationale (pós-processamento).

### 7.11. Audit log e observabilidade

- [ ] **CA-45** DADO qualquer chamada a Drive API QUANDO acontece ENTÃO INSERT em `audit_log_drive` com `client_id, endpoint, latency_ms, result`.
- [ ] **CA-46** DADO 50+ invocações de CurationAgent em staging QUANDO MLflow dashboard abre ENTÃO traces visíveis com tags `client_id`, `sync_id`, `document_id`.

<!-- REVIEW: 46 CAs cobrem todos os FRs e RNs? Algum CA faltando para um cenário crítico? Os CAs são testáveis isoladamente? -->

## 8. Fora de Escopo (explícito)

1. **Espelho bidirecional Drive↔sunOS** — explícitamente rejeitado (ADR-009). Nenhum write Drive em circunstância alguma.
2. **Auto-aplicação de sugestões com alta confiança** — RN-029. Mesmo com `confidence=1.0`, decisão é humana.
3. **Cache em massa de conteúdo Drive em GCS** — fetch on-demand somente. Pipeline DFL-03 é o único caminho de "ingestão".
4. **Sync de fontes não-Drive** (SharePoint, Notion, Dropbox) — futuro; sem ponto de extensão nesta SPEC.
5. **CurationAgent multi-step (planning explícito)** — esta SPEC implementa em LangGraph nativo; planning só após ADR-011 Aceito.
6. **UI mobile** — desktop-only V1; mobile read-only ofereço em V2.
7. **Bulk decisions** (aceitar 100 sugestões de uma vez) — V2 se justificar.
8. **Restore de cliente excluído** — após purge, exige nova OAuth grant + re-importação manual.
9. **Sync de comments/replies do Google Docs** — fora; só metadados + conteúdo final.
10. **Tradução automática de conteúdo** — `Importer` preserva idioma original; tradução é manual via Skills.

## 9. Suposições

1. Cliente piloto tem acervo Drive bem-organizado o suficiente para testar (não é greenfield em si).
2. Drive Push webhook do Google é estável (>99% uptime); confiabilidade documentada como "média" em RN-030.
3. Quota Drive API (10k requests/dia/usuário) é suficiente para 1-3 clientes piloto. Aumento via solicitação Google se necessário.
4. KMS já provisionado no projeto (key ring `sunos-kms` ou similar) — verificar; se ausente, adicionar em Fase A.
5. Pipeline DFL-03 (chunking + embedding + KG) está estável e suporta nova fonte (`provenance.drive_document_id`).
6. Cliente assina termo aceitando OAuth read-only (PRE-04).

## 10. Riscos

1. **ADR-009 não aprovado por Guga** — bloqueia Fase D em diante. Mitigação: PRE-01 explícito; alinhamento agendado.
2. **Drive Push channel renewal falha** (Google bug ou config errada) — sync de pastas críticas degrada para cron 15min. Mitigação: monitor + alerta automático.
3. **CurationAgent gera sugestões de baixa qualidade** (Gemini Flash não captura contexto) — taxa de adoção <50%. Mitigação: medir taxa em Piloto; se < 30%, considerar Sonnet híbrido (custo).
4. **Quota Drive API esgotada** em cliente com Drive grande — sync atrasa. Mitigação: monitor `drive_api_calls_total` + solicitar quota maior.
5. **OAuth refresh falha sistematicamente** após N dias — exige reconexão manual cliente a cliente. Mitigação: alerta proativo a 7 dias antes de expiração estimada; UI clara de reconnect.
6. **PII em `acl_snapshot`** vaza em log se mascaramento não funcionar — risco LGPD. Mitigação: teste explícito de log scrubbing; review de logs por SRE em Piloto.
7. **`content_hash` colide para arquivos diferentes** (SHA256 colisão é teórica mas possível com truncate) — duplicate detection falsa. Mitigação: usar SHA256 completo (32 bytes); fallback para nome+size se hash coincide.
8. **Pipeline DFL-03 falha durante import** — sugestão volta para PENDING, mas usuário não sabe se tentar de novo. Mitigação: status `IMPORT_FAILED` (estado adicional?) — TODO-DESIGN.

## 11. Notas de Implementação

- **OAuth state** deve ser HMAC-SHA256 do `client_id + timestamp + nonce`, com TTL 10min. Verificação no callback rejeita state expirado.
- **`pageToken` startup** — primeira sync usa `changes.getStartPageToken()` para obter token inicial (Drive API). Subsequentes incrementam.
- **`channel_id` Drive Push** — gerado por sunOS (UUID v4); registrado via `files.watch` na pasta crítica. Renewal via job `0 0 */6 * *` (a cada 6 dias).
- **`content_hash`** — SHA256 do bytes do file. Calculado on-import; cached em `drive_documents.content_hash`. Para arquivos > 100MB, hash é truncado nos primeiros 10MB com sufixo `:truncated:<size>` (heurística aceita).
- **`acl_snapshot`** — JSONB com array de `{email, role}`. Email aparecem em plaintext no DB (necessário para AccessGuard); mascarado em logs.
- **Cron `drive-sync-{client_id}`** — criado dinamicamente via Cloud Scheduler API quando OAuth conecta; deletado quando revoga.
- **CurationAgent** — modelo padrão Gemini 2.5 Flash. Para sugestões `MERGE_WITH` que precisam comparar texto profundo, considerar Sonnet com cap de tokens (TODO-DESIGN-A).
- **Suggestion `IMPORT_TO_LIBRARY` payload** — pode incluir `preferred_tags: [string]` que UI mostra mas Líder pode override.
- **`STALE` transition** — job dedicado roda diariamente: para cada `PENDING` suggestion, se `document.modified_time > suggestion.created_at`, marca `STALE`.
- **Hard delete vs. soft delete** — `drive_oauth_credentials` é hard delete via KMS hard delete (LGPD). `drive_documents` é hard delete em cascata quando sync revoked. `curation_suggestions` é soft delete (status terminal) — nunca apaga, mantém histórico de decisão.

## 12. Prompt para Agente

> Implemente a feature **Drive Read-Only Curation (FA-14)** conforme esta SPEC.
>
> **Antes de tudo, leia:**
> 1. `docs/specs/large/drive-readonly-curation/constitution.md` — princípios não-negociáveis.
> 2. Esta SPEC (`spec.md`) — comportamento externo + 46 CAs.
> 3. `docs/specs/large/drive-readonly-curation/design.md` — arquitetura + 5 ADRs locais.
> 4. `docs/specs/large/drive-readonly-curation/plan.md` — fases A–F.
> 5. `docs/specs/large/drive-readonly-curation/tasks.md` — task que vai implementar.
>
> **Restrições obrigatórias.**
> - Drive **nunca é escrito** (RN-027 + ADR-009). SDK wrapper intercepta tentativas + métrica + alerta.
> - Curadoria sempre humana (RN-029). CurationAgent só CRIA `PENDING`; nunca transita status.
> - ACL∩RBAC default deny (RN-028). 404 não 403 (RN-011).
> - Cross-client guard (RN-010): toda query filtra `client_id`. Teste por endpoint.
> - OAuth tokens encriptados via KMS; plaintext nunca persistido.
> - Vocabulário Suno: nunca "gerar"/"otimizar"; sempre Koro com K, Drive com D.
>
> **PRE-01 BLOQUEIA:** Tasks de Fase C podem desenvolver em staging mas não merge a master sem ADR-009 Aceito. Tasks de Fase D em diante totalmente bloqueadas até ADR-009 sair de Proposto → Aceito + alinhamento Guga documentado em handoff. Detalhes operacionais em `constitution.md` §"Pré-requisito de Aprovação Bloqueante".

## 13. Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-04-30 | Versão inicial — 9 FRs (FR-171..179), 2 FSMs (DriveSync, CurationSuggestion), 10 fluxos principais, tabela de erros, 6 NFRs, 11 endpoints (API-140..150), 7 eventos (EV-35..41), 5 schemas, 46 CAs (CA-01..46) |
