---
spec-id: SPEC-006
slug: drive-readonly-curation
artefato: constitution
atualizada: 2026-05-15
status: rascunho
versao: 1.0
fase: Momento 2
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + Python 3.11"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: Implementar Google Drive como Fonte Curada da Biblioteca (FA-14) — integração unidirecional read-only do Drive da Suno como fonte primária de insumos da Biblioteca, com curadoria assistida por agente (sugestões: importar para Biblioteca, marcar duplicata, marcar desatualizado, sugerir tags, sugerir merge), sempre exigindo decisão humana antes de qualquer alteração. Inclui sync periódico (15min/24h) + Drive Push webhook, OAuth restrito a `drive.readonly`, intersecção ACL Drive ∩ RBAC sunOS, e exclusão por cliente (LGPD).
upstream:
  - docs/brd/parte3-requisitos.md (BR-018)
  - docs/brd/parte4-regras.md (RN-027..030)
  - docs/prd/parte1-feature-map.md (FA-14, 8 subfeatures)
  - docs/prd/parte4-FRs.md (FR-171..179)
  - docs/srd/parte2-domain-model.md (BC-07: DO-50..55, EV-35..41)
  - docs/srd/parte3-data-model-erd.md (ENT-39..43)
  - docs/srd/parte4-data-flows-dfd.md (DFL-09)
  - docs/srd/parte6-arch-to-be.md (CTM-09, INT-TB-22..26)
  - docs/srd/parte7-ADRs.md (ADR-009, ADR-011 — somente partes do CurationAgent)
  - docs/srd/parte8-APIs-contracts.md (API-140..150, SCH-016/017, INT-12..16)
  - docs/ux/parte1-inventario-telas.md (T-32, T-33, JN-12)
  - docs/ux/parte5-ui-specs.md (§4.11)
predecessor_decision_reversed: []
pre_conditions:
  - id: PRE-01
    descricao: "ADR-009 deve ser movido de Proposto → Aceito antes de qualquer deploy a produção. Status atual: Proposto. Bloqueio: alinhamento explícito com Guga (Sponsor) sobre ajuste 'espelho bidirecional' → 'read-only + curadoria sugestiva'. A SPEC pode ser escrita e revisada agora; tasks de Fase D em diante NÃO podem iniciar sem este alinhamento documentado."
  - id: PRE-02
    descricao: "ADR-011 ainda em status Proposto. Esta SPEC implementa CurationAgent em LangGraph nativo + arquitetura compatível com `deepagents` para troca posterior conforme ADR-011 sair de Proposto → Aceito. Não bloqueia entrega; bloqueia migração de harness."
  - id: PRE-03
    descricao: "CTM-01 Auth Gateway em produção emitindo JWT com `client_id` resolvíveis (idem SPEC-004). Sem isso, autorização ACL∩RBAC do FR-173 não funciona."
  - id: PRE-04
    descricao: "Cliente piloto identificado e contratualmente autorizado a conectar Drive. Sem assinatura de termo de uso/escopo, OAuth não pode ser solicitado (LGPD + cláusula contratual)."
---

> ⚠️ **REST-08 v2 (decisão 14/05/2026)** — Drive é restrito ao Drive **interno da Suno** (`/sunos-shared/`). Drive externo de clientes está fora de escopo. Atualizar todos os contratos desta SPEC que referenciem Drive de cliente.
> ⚠️ **Pre-conditions bloqueadoras**: PRE-01 (ADR-009 Proposto), PRE-02 (ADR-011 Proposto/rascunho), PRE-03 (CTM-01 contrato cliente assinado), PRE-04 (cliente piloto definido). Nenhuma pode ser pulada.

# Constitution — Drive Read-Only Curation (FA-14)

Princípios imutáveis para esta SPEC. O agente de codificação deve respeitar TODOS em qualquer task derivada de `tasks.md`. Quando houver tensão entre velocidade e princípio, o princípio vence.

## ⚠️ Pré-requisito de Aprovação Bloqueante (PRE-01)

**Esta SPEC pode ser escrita, revisada e endurecida agora. Tasks de Fase D em diante (importação, automação de cleanup, exposição na UI de líder) NÃO podem iniciar antes de ADR-009 sair de Proposto → Aceito.**

ADR-009 ajusta o pedido literal do Guga ("espelho bidirecional + agentes que organizam Drive") para **read-only + curadoria sugestiva**, com 4 riscos críticos como justificativa (LGPD, conflito ACL Drive vs. RBAC sunOS, write/delete acidental, violação RN-011 da caixa-preta). O ajuste foi aprovado tecnicamente mas **requer alinhamento explícito com o sponsor (Guga)** antes de virar Aceito.

**Operacional:**
- Fase A (Foundation: schema, migrations, KMS setup, OAuth shell) e Fase B (POC OAuth + sync incremental sem UI de líder) **podem rodar com ADR-009 em Proposto**, porque não expõem Drive a curadores nem fazem ingestão na Biblioteca.
- Fase C (CurationAgent + suggestions + cleanup reports) só pode publicar suggestions em ambiente staging — **NÃO pode promover suggestion a `IMPORT_TO_LIBRARY` em produção** até ADR-009 Aceito.
- Fases D, E, F bloqueadas até ADR-009 = Aceito + termo cliente piloto assinado (PRE-04).

Quem desbloquear deve atualizar este arquivo (mover PRE-01 para `## Histórico de pré-condições resolvidas`) e abrir handoff registrando data + decisão.

## 1. Princípios de Domínio (não negociáveis)

1. **Drive nunca é escrito (RN-027 + ADR-009).** Toda operação do sunOS contra o Drive é leitura. Nenhuma chamada a `files.create`, `files.update`, `files.delete`, `files.copy`, `permissions.create` é permitida — em código, em config, ou em runtime. Garantia técnica via escopo OAuth `drive.readonly` + `drive.metadata.readonly`. Code review obrigatório bloqueia merge se uma chamada de write aparecer; teste unitário falha se `OAuthVault.scopes` contém qualquer string com `'write'` ou `'create'` ou `'delete'`.
2. **Curadoria é sempre sugestiva, nunca executiva (RN-029 + DO-53 invariante 1).** `CurationSuggestion.status` começa `PENDING`; só transita para `ACCEPTED` ou `REJECTED` por decisão humana de um Curador (PX-01 Líder) com `decided_by` registrado. Nenhum job, agente, regra automática ou cron pode mudar `status` para `ACCEPTED` ou `REJECTED`. `STALE` é a única transição automática, e só ocorre por evidência objetiva (documento atualizado no Drive após geração da sugestão).
3. **Intersecção ACL Drive ∩ RBAC sunOS é default deny (RN-028).** Toda leitura de `DriveDocument` ou conteúdo associado passa pelo `AccessGuard`. O guard valida (a) email do principal está no `acl_snapshot` do documento com role ≥ `reader` E (b) RBAC sunOS permite ver conteúdo do `client_id` associado. Se qualquer um falha → **404 genérico** (caixa-preta — RN-011 generalizado para Drive), nunca 403. Sem combinador "OR", sem fallback de "admin vê tudo" — **default deny é literal**.
4. **`drive_file_id` é a chave de identidade (DO-51 + ENT-41).** Um documento do Drive é identificado pela tupla `(sync_id, drive_file_id)`. Renomear ou mover o arquivo no Drive **não cria um novo `DriveDocument`** — o snapshot atualiza `name`, `drive_parent_id`, `acl_snapshot` mas mantém o mesmo `document_id`. Conteúdo nunca é duplicado em GCS; é fetched on-demand para preview/curadoria/ingestão.
5. **Provenance da Biblioteca é rastreável bidirecionalmente (DO-53 invariante 2 + FR-177).** Quando uma `CurationSuggestion(kind=IMPORT_TO_LIBRARY)` é aceita, o `KnowledgeItem` criado em BC-02 carrega `provenance.drive_document_id` apontando ao `DriveDocument` origem. O `DriveDocument` carrega `curated_as_knowledge_item_id` apontando ao `KnowledgeItem`. Ambos os ponteiros são imutáveis — re-importação cria um novo `KnowledgeItem` (auditável) em vez de mutar o existente.
6. **Exclusão por cliente é completa e auditável (FR-178).** Quando admin marca cliente como excluído da integração: (a) `drive_syncs.status='REVOKED'`, (b) `drive_oauth_credentials.revoked_at=now()`, (c) `drive_documents` daquele cliente deixam de aparecer em qualquer query (filtro implícito), (d) opcionalmente purgar índices vetoriais (com confirmação dupla — `purge_indexed_content=true` requer header `X-Confirm-Destructive: true`). Razão e timestamp registrados em audit log permanente. Não há undo automático; reativar exige nova OAuth grant.
7. **Sync incremental é obrigatório a partir do primeiro full sync (RN-030 + FR-172).** Apenas o primeiro sync após conectar uma pasta é full (`files.list`). Sync subsequente sempre via `changes.list` com `pageToken` persistido. `pageToken` é tratado como estado crítico — perda força full re-sync com alerta admin.

## 2. Princípios de Segurança e Privacidade

1. **OAuth tokens são encriptados em repouso via Cloud KMS (NFR-008 + INT-14).** `access_token` e `refresh_token` em `drive_oauth_credentials` são armazenados como ciphertext (resultado de `KMS.encrypt`). Decrypt acontece apenas no momento da chamada Drive API e o plaintext **nunca é persistido** (memória ephemera, sem cache de plaintext). Logs **nunca** registram token plaintext, ciphertext, nem `refresh_token` (mascarar como `***REDACTED***`).
2. **Cross-client guard é literal (RN-010).** Toda query em `drive_*` filtra por `client_id` resolvido do JWT/contexto. Não há endpoint que retorne `drive_documents` de outro cliente. `client_id` é coluna redundante denormalizada em `drive_documents` justamente para que o filtro seja barato e à prova de JOIN errado. Falha aqui = brecha de cross-tenant; teste de regressão obrigatório por endpoint.
3. **Caixa-preta para Operacional (RN-009 + RN-011).** Operacional NÃO vê `drive_documents`, `curation_suggestions`, `drive_cleanup_reports`, nem o dashboard T-32 ou T-33. Endpoints retornam **404 genérico** quando o usuário não pode ver — nunca 403, para não revelar existência. Líder/Curador (PX-01) e Admin enxergam Drive do(s) cliente(s) que sua RBAC autoriza.
4. **Conteúdo do Drive nunca é cached em GCS controlado pela Suno (DO-50 invariante 4 — generalizado).** A regra "Suno não espelha Drive" inclui não criar pipeline de download em massa. `Importer` baixa conteúdo on-demand quando `IMPORT_TO_LIBRARY` é aceito; o conteúdo entra no pipeline DFL-03 (chunking, embedding) e o blob original é descartado após processamento. `drive_documents` só guarda metadados + ACL + `content_hash`, nunca o conteúdo.
5. **`acl_snapshot` é a verdade no momento da descoberta (DO-51 invariante 3).** ACL muda no Drive → próximo sync detecta via `permissions.list` e atualiza `acl_snapshot`. Entre syncs, o snapshot é considerado válido. **Se o usuário foi removido do Drive** mas o snapshot ainda diz que tem acesso, a próxima query no `AccessGuard` permite leitura **até o próximo sync** — risco aceito; mitigação é frequência de sync (15min sync default; pastas críticas com webhook).
6. **OAuth scope nunca é elevado.** Se um futuro requirement exigir write, **exige nova ADR + nova OAuth grant + alinhamento Guga**. Não há mecanismo de "elevação temporária" de scope. Code review bloqueia qualquer PR que adicione scope diferente de `drive.readonly` ou `drive.metadata.readonly`.
7. **Drive Push webhook é validado contra Google (INT-13).** Headers `X-Goog-Channel-ID`, `X-Goog-Resource-State`, `X-Goog-Message-Number`, `X-Goog-Notification-ID` são validados antes de enfileirar trabalho. Channel mismatch ou expiração silenciosa marca `drive_syncs.status='ERROR'` com motivo, alerta admin. Channel renewal automático a cada 6 dias (Google expira em 7).
8. **Auditoria é imutável e completa (BR-018 critério 7).** Toda operação contra o Drive é logada estruturalmente: `client_id`, `sync_id`, `endpoint_called` (ex: `files.list`, `changes.list`, `files.get`), `result` (ok/error), `latency_ms`. **Tentativas de write bloqueadas** (defense-in-depth, mesmo com escopo readonly) são logadas como `severity=CRITICAL` e disparam SafetyAlert. Logs são append-only — `audit_log_drive` table com trigger PG bloqueando UPDATE/DELETE.

## 3. Princípios de Latência e Confiabilidade

1. **SLA documentado: lag ≤24h (geral), ≤5min P95 (pastas críticas).** "Pasta crítica" é flag em `drive_syncs.root_folder_ids` (subset). Pastas críticas têm webhook Drive Push registrado e são processadas em até 5min P95. Pastas regulares dependem do cron de 15min (full pass diário a cada 24h). Métrica `drive_sync_lag_seconds` instrumentada por pasta.
2. **Retry exponencial com 3 tentativas (RN-030 + FR-172).** `ListChangesWorker`, `Importer.fetch_content`, `OAuthVault.refresh_access_token` aplicam retry exponencial (1s, 4s, 16s) com jitter. Após 3 falhas, marca `drive_syncs.status='ERROR'` com `error_message` e dispara SafetyAlert (`MEDIUM`). Não retry infinito.
3. **Cron rate limit respeitado.** Drive API tem quota de 10k requests/usuário/dia (standard). `ListChangesWorker` registra em métrica `drive_api_calls_total{endpoint}`; dashboard alerta se cliente passa de 70% do budget diário. Lazy fetch de conteúdo (`files.get?alt=media`) é só on-demand quando curador aceita import — não em batch.
4. **`changes.list` paginação obrigatória.** Resposta single-page (>1000 changes) **nunca**. `pageToken` é seguido até `nextPageToken=null`. Persistência de progresso a cada página em `drive_syncs.last_page_token` permite retomar de onde parou em caso de timeout.
5. **Idempotência de eventos.** EV-35..41 são publicados no Pub/Sub com `event_id = hash(sync_id + event_type + timestamp_minute)`. Subscribers tratam duplicata por `event_id`. Idêntico ao padrão estabelecido em SPEC-004 (outbox pattern — ADR-LOCAL-01 daquela SPEC). **Adotamos o mesmo outbox pattern aqui** para garantir publicação atômica DB↔Pub/Sub.

## 4. Princípios de Vocabulário (Suno)

> Vocabulário Suno está documentado em BRD Parte 2 §1 e §9. É obrigatório no código de domínio (nomes de classes, enums, eventos), em copies de UI e em comentários narrativos. Pode aparecer texto em inglês em IDs técnicos pré-existentes (ex: `IMPORT_TO_LIBRARY`, `ACCEPTED`) — mantemos por consistência com o ERD aprovado.

- **Usar sempre:** Curadoria, Curador, Líder, Sócio, Aprovador (quando aplicável), Biblioteca, Faísca, Brasa, Provocar, Devorar, Caixa-preta, Bioma, Sistema Solar, Sun, Planeta, Órbita, Moon, Drive (com D maiúsculo, nome do produto Google), sunOS (lowercase 'sun'), Operacional. Usuário aceita uma sugestão; o sistema **importa** ou **registra** — nunca "gera entrada na Biblioteca".
- **Nunca usar:** "gerar" (preferir "criar" / "produzir" / "compor"), "otimizar", "eficiência", "accelerator", "smart", "AI-powered" como copy. **Sempre Koro com K** (referência ao framework Koro Creators, nunca "Coro"). **Sempre Drive com D** quando se referir ao produto Google (não "drive" minúsculo).
- O `CurationAgent` segue o mesmo vocabulário em `rationale` (campo livre): se rationale gerado pelo modelo contiver "gerar"/"otimizar", `CurationAgent` faz pós-processamento substituindo. Teste fixture obriga.

## 5. Padrões Obrigatórios

### 5.1. Backend (`api/drive/`)

- **Linguagem:** Python 3.11+, type hints em 100% das assinaturas públicas.
- **Framework:** FastAPI (router em `api/drive/router.py`); LangGraph nativo para o sub-graph do CurationAgent (compatível com upgrade futuro para `deepagents` conforme ADR-011 sair Aceito).
- **Drive SDK:** `google-api-python-client` (já no projeto se reutilizado de outra integração; senão, adicionar com justificativa explícita em ADR-LOCAL desta SPEC). Adapter wrapper `api/drive/sdk_wrapper.py` que expõe **somente** métodos read-only (`list_files`, `list_changes`, `get_file_metadata`, `download_content`). Nunca expor o cliente Google bruto fora do wrapper.
- **KMS:** `google-cloud-kms` (já no projeto). Wrapper em `api/drive/kms.py` expõe `encrypt(plaintext) -> ciphertext` e `decrypt(ciphertext) -> plaintext`. Plaintext é `bytes` ou `str`, nunca persistido — apenas retornado e usado em call.
- **DB:** PostgreSQL via SQLAlchemy 2.0 + asyncpg, Alembic para migrations.
- **Persistência transacional:** toda mudança que afeta múltiplas tabelas (ex: `INSERT drive_documents` + `UPDATE drive_syncs.documents_total`) roda em uma única transação atômica.
- **Eventos:** Pub/Sub (INT-TB-26). Topic `sunos.drive.events`. Publicação acontece **após commit do DB** via outbox pattern (mesmo da SPEC-004). Idempotência por `event_id`.
- **Schemas Pydantic:** SCH-016/017 são canônicos. Não duplicar definições; reusar via `from api.drive.schemas import DriveDocumentSchema`.
- **Tracing:** MLflow para o CurationAgent sub-graph (decorator `@mlflow.trace`). Tag obrigatória: `client_id`, `sync_id`, `document_id`. Spans aninhados para sub-tools.
- **Cron:** Cloud Scheduler (INT-TB-22). Job `drive-sync-{client_id}` aciona `POST /api/drive/sync/run` com `client_id` no payload. Default 15min; pode ser sobrescrito por cliente.
- **Testes:** pytest + pytest-asyncio. Cobertura mínima 80% em `oauth_vault.py`, `access_guard.py`, `differ.py`, `importer.py`. Teste destrutivo obrigatório que valida que tentativa de write Drive (mock retornando 200) é interceptada antes da chamada HTTP.

### 5.2. Frontend (`app/drive/`, `components/drive/`)

- **Linguagem:** TypeScript strict.
- **Framework:** Next.js 14 App Router. Server Components onde possível (T-32 dashboard com dados estáticos), Client Components para interatividade (T-33 inbox de sugestões com decisões, modal de reconnect OAuth).
- **Estilização:** CSS variables do design system sunOS + inline styles. Não introduzir Tailwind classes novas em telas FA-14. Padrão estabelecido por SPEC-001/004/005.
- **Cliente HTTP:** reusar `lib/api.ts`. Adicionar `connectDrive`, `getDriveSyncState`, `runDriveSync`, `listDriveDocuments`, `getDocumentContent`, `listCurationSuggestions`, `decideCurationSuggestion`, `listCleanupReports`, `revokeDriveOAuth`.
- **State:** `DriveContext` para estado de sync (status, contadores). React Context (mesmo padrão de ApprovalContext em SPEC-004). Hook `useDriveSyncPolling` com intervalo 30s na T-32.
- **Realtime:** polling 30s nas T-32 e T-33 ativas. WebSocket é `TODO-FE-realtime`, não bloqueia MVP.
- **Acessibilidade:** focus management em modal de preview (T-33), ARIA live region para "N novas sugestões", `prefers-reduced-motion` honrado em todas as microinterações listadas em UX §4.11. Badge "🔒 drive.readonly" sempre visível em T-32 (RN-027 — garantia técnica).

### 5.3. Convenções de nomes

- **Backend modules:** `api/drive/{router.py, schemas.py, models.py, oauth_vault.py, kms.py, sdk_wrapper.py, sync.py, differ.py, curation_agent.py, cleanup.py, importer.py, access_guard.py, webhook.py, events.py}`.
- **Frontend pages:** `app/drive/[clientSlug]/page.tsx` (T-32), `app/drive/[clientSlug]/sugestoes/page.tsx` (T-33), `app/admin/drive-sync/page.tsx` (admin global), `app/admin/drive-sync/connect/page.tsx` (T-31 connect), `app/admin/drive-sync/exclusions/page.tsx`.
- **Frontend components:** `components/drive/{SyncDashboard, OAuthStatus, ReadonlyBadge, MetricsCard, ExclusionsCard, SuggestionInbox, SuggestionCard, ConfidenceBadge, RationaleDisclosure, PreviewModal, CleanupReportList, ConnectDriveModal, ForceSync Button}.tsx`.
- **Enums de domínio em UPPER_SNAKE_CASE** (`PENDING`, `IMPORT_TO_LIBRARY`, `OAUTH_EXPIRED`) — bate com o ERD aprovado, não traduzir.

## 6. Dependências Aprovadas

Reusam o stack já estabelecido. **Avaliação: pode introduzir UMA dependência nova** (`google-api-python-client`) se ela ainda não estiver no projeto. Verificar `api/pyproject.toml` antes de Fase A. Se já presente, nada novo. Se ausente, justificar em ADR-LOCAL com alternativas avaliadas (REST direto via `httpx` rejeitado por verbosidade do OAuth refresh + paginação `changes.list`).

| Dependência | Versão | Propósito | Origem |
|-------------|--------|-----------|--------|
| `fastapi` | já no projeto | Endpoints | api/ existente |
| `langgraph`, `langchain-core`, `langchain-google-genai` | já no projeto | Sub-graph CurationAgent | api/ existente |
| `langchain-anthropic` | já no projeto | Opcional p/ orquestrador Sonnet (ADR-011 híbrido) | api/ existente |
| `sqlalchemy` (2.0) + `asyncpg` | já no projeto | Persistência | api/ existente |
| `alembic` | já no projeto | Migrations | api/ existente |
| `google-cloud-pubsub` | já no projeto | Publicação de EV-35..41 (INT-TB-26) | api/ existente |
| `google-cloud-kms` | a confirmar | Encrypt/decrypt OAuth tokens (INT-14) | verificar; se ausente, **adicionar com ADR-LOCAL** |
| `google-api-python-client` | a confirmar | Drive API v3 client (INT-12) | verificar; se ausente, **adicionar com ADR-LOCAL** |
| `mlflow` | já no projeto | Tracing | api/ existente |
| `pydantic` v2 | já no projeto | Schemas | api/ existente |
| `lucide-react` | já no projeto | Ícones (size 14, strokeWidth 1.5) | frontend |

**Bibliotecas explicitamente em avaliação (NÃO adotar nesta SPEC):**

- `deepagents` — cobertura ADR-011 (Proposto). Esta SPEC implementa CurationAgent em LangGraph nativo com **arquitetura compatível** para troca posterior (apenas o orquestrador interno do agente muda; tools, schemas e contratos com o resto do sistema não mudam).

## 7. Dependências de Outras SPECs / Componentes

1. **CTM-01 Auth Gateway** precisa estar em produção e emitindo JWT com `client_id` + `roles` resolvíveis (PRE-03). Sem isso, autorização ACL∩RBAC do FR-173 não funciona.
2. **FA-01 Biblioteca + DFL-03 (pipeline de ingestão).** `Importer` reutiliza o pipeline existente de chunking + embedding + KG via API interna (`POST /api/biblioteca/items` ou função compartilhada). Stub aceitável na fase POC; integração real bloqueia Piloto.
3. **FA-09 RBAC.** Roles `Operacional`, `Líder`, `Sócio`, `Admin` precisam estar definidos. `AccessGuard` filtra em função de `role` + `client_id` da request. Idem SPEC-004.
4. **FA-12 Admin (Clientes).** Tela de exclusão por cliente (FR-178) reusa o admin de clientes para localizar e marcar `client.drive_excluded=true`. Adicionar coluna em `clients` ou tabela `drive_exclusions` à parte (decisão em ADR-LOCAL).
5. **SPEC-004 Approval Hierarchy** **NÃO é dependência runtime** — Drive não passa por aprovação hierárquica (curadoria humana já é o gate). É **dependência de padrão arquitetural**: outbox pattern, polling 30s, ADR-LOCAL pattern, `<!-- REVIEW -->` placement, padrão de testes.
6. **CTM-08 Approval Engine** **NÃO é dependência** — Drive não submete a aprovador. Curador (Líder) decide diretamente.

## 8. Anti-patterns Proibidos

1. **Não chamar nenhum endpoint de write do Drive (`files.create`, `files.update`, `files.delete`, `files.copy`, `files.emptyTrash`, `permissions.create`, `permissions.update`, `permissions.delete`).** Mesmo que pareça útil "consertar" um arquivo. Mesmo que o agente sugira. Violação direta de RN-027.
2. **Não pedir scope OAuth diferente de `drive.readonly` + `drive.metadata.readonly`.** Mesmo que precise temporariamente para um teste. Mesmo que o cliente autorize verbalmente. Mudança de scope = nova ADR + nova grant.
3. **Não persistir `access_token` ou `refresh_token` em plaintext em nenhum lugar (DB, log, cache, env var).** KMS ciphertext em `drive_oauth_credentials` é a única forma. Logs mascaram com `***REDACTED***`.
4. **Não confiar em `acl_snapshot` antigo para autorizar leitura sem checar `last_seen_at`.** Risco aceito é até o próximo sync — mas se `last_seen_at > 24h`, recomenda-se trigger de sync antes da leitura para reduzir janela.
5. **Não permitir que o `CurationAgent` mude `status` de `CurationSuggestion`.** Mesmo que pareça "óbvio" que é duplicata. RN-029 não admite exceção. Agente só CRIA `PENDING`.
6. **Não retornar 403 em endpoints `/api/drive/*` para usuário sem permissão sobre o cliente.** Retornar 404 (caixa-preta — RN-011 generalizado para Drive).
7. **Não cachear conteúdo do Drive em GCS controlado pela Suno.** Conteúdo é fetched on-demand para `IMPORT_TO_LIBRARY`; pipeline DFL-03 processa e o blob original some. Nada de "armazenar para acelerar próximo acesso".
8. **Não fazer JOIN cross-client em queries.** Toda query de `drive_*` filtra `client_id` no WHERE. JOIN sem filtro = brecha de cross-tenant. Linter `sqlfluff` configurado para flagar (TODO-DT-09).
9. **Não usar "gerar"/"otimizar"/"eficiência" em copies de UI de FA-14** (ver §4 vocabulário). UI usa "Importar para Biblioteca", "Identificar duplicatas", "Sugerir tags", nunca "gerar tags" nem "otimizar Drive".
10. **Não auto-aceitar sugestões com `confidence > 0.95`.** Tentação clássica em agente curador; **proibida** por RN-029. Confidence é apenas hint visual para o curador priorizar; nunca trigger de ação.
11. **Não logar `acl_snapshot` raw em audit log (contém emails de pessoas).** Mascarar em domain pelo menos como `email_count + role_distribution`. PII completa só em `drive_documents.acl_snapshot` (com retenção definida).
12. **Não espelhar conteúdo Drive em pgvector "preventivamente".** Indexação só acontece quando curador aceita import. Indexar tudo = espelho disfarçado, viola ADR-009.

## 9. Princípios de Compatibilidade com ADR-011 (deepagents — Proposto)

Esta SPEC implementa CurationAgent em LangGraph nativo (status seguro hoje). Para minimizar custo de migração se ADR-011 sair Aceito:

1. **`CurationAgent` é o único módulo que muda.** Tools (`list_documents_in_folder`, `read_document_metadata`, `compute_content_similarity`, `propose_suggestion`) são `BaseTool`-shaped e RBAC-aware no entry point. Orquestração interna é injetável.
2. **Virtual filesystem-shaped abstraction.** Tools que inspecionam estrutura de pasta (`list_documents_in_folder`, `read_document_metadata`) já assinam como se fossem operações sobre um FS — bate com o modelo do `deepagents` sem refactor. **Wrapper FS RBAC-aware** é pré-requisito para troca (mitigação documentada em ADR-011).
3. **Cross-client guard injetado em todas as tools (RN-010).** `client_id` é parâmetro implícito do contexto; cada tool valida antes de qualquer query. Não muda quando trocar harness.
4. **MLflow tracing** instrumenta o orquestrador e cada sub-call. Quando trocar para deepagents, basta verificar que os spans continuam aparecendo (pré-requisito #2 de ADR-011).
5. **Cap de tokens no plan (TODO-DT-06 ADR-011).** CurationAgent atual roda como sequência de tool calls explícita; quando trocar para deepagents com planning loop, o cap é configurável via `harness.config.max_plan_tokens=2000`.

## 10. Critérios de Pronto (DoD da SPEC)

A SPEC completa será considerada implementada quando:

- [ ] Todos os FR-171..179 cobertos por código + testes que mapeiam para CAs do `spec.md`.
- [ ] PRE-01 resolvido (ADR-009 = Aceito + alinhamento Guga documentado em handoff).
- [ ] PRE-04 resolvido (cliente piloto identificado + termo assinado).
- [ ] Migrations Alembic aplicadas em staging para ENT-39..43 + triggers de imutabilidade (audit log + revoked credentials cascade).
- [ ] Endpoints API-140..150 respondem 2xx no caminho feliz e os 4xx documentados, com testes de contrato (pytest + httpx).
- [ ] T-31 (connect), T-32 (dashboard), T-33 (suggestions inbox) navegáveis em staging com dados seed (1 cliente piloto, 1 sync ativo, ≥10 documents indexados, ≥3 suggestions).
- [ ] Pub/Sub topic `sunos.drive.events` recebendo EV-35..41 idempotentes.
- [ ] CurationAgent rodando com latência p95 ≤ 8s por documento (não bloqueia sync; roda async pós-diff).
- [ ] Auditoria imutável validada com teste destrutivo (UPDATE/DELETE em `audit_log_drive` lança exceção).
- [ ] Métrica `drive_write_attempts_total` instrumentada e dashboard mostrando **0** (RN-027 garantia técnica).
- [ ] Métrica `drive_acl_intersection_denials_total` instrumentada para auditoria de RN-028.
- [ ] Dashboard MLflow mostrando traces de pelo menos 50 invocações do CurationAgent com tags `client_id`/`sync_id`/`document_id`.
- [ ] Channel renewal automático Drive Push validado em ambiente staging por ≥7 dias contínuos.
- [ ] CLAUDE.md (raiz) atualizado com rota `/drive` + módulo `api/drive/`.
- [ ] Handoff de fim de SPEC criado em `docs/handoff/sessions/`.

---

**Tudo o que vier a seguir (`spec.md`, `design.md`, `plan.md`, `tasks.md`) deve obedecer literalmente este documento. Se uma decisão de design ou task entrar em conflito com um princípio aqui, a SPEC para — não o princípio.**
