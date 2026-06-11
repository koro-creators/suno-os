# Handoff — 2026-06-10 — Drive da Suno: pasta por cliente (PRs #50 + #51)

**Duração aproximada:** 3h (continuação da sessão de prontidão do piloto)
**Foco:** Implementar o recorte pragmático da SPEC-006 — Drive da Suno com uma pasta configurada por cliente, via service account, sem OAuth — e ligá-lo ao wizard de onboarding.

## O que foi feito

- **PR #50 (mergeado + deployado)** — feature base:
  - Modelo: admin compartilha a pasta do cliente com a SA do Cloud Run (`sunos-backend@koro-creators.iam.gserviceaccount.com`) como Leitor; cola a URL na aba Drive do editor; sync exporta docs como texto → `knowledge_documents` com `scope=[slug]`
  - `api/drive/google_drive.py` — REST do Drive via ADC (`google-auth` transitivo do firebase-admin + httpx; **zero dependência nova**); suporta Shared Drives
  - `api/drive/ingest.py` — upsert idempotente (id = uuid5 do file id); binários entram metadata-only
  - `api/drive/client_drive.py` — GET/PUT/POST sync/DELETE em `/api/clients/{slug}/drive`, admin-only caixa-preta (padrão `_resolve_actor` do approval)
  - Migration 019 (3 colunas em `clients`) — **aplicada em prod ANTES do merge** (modelo referencia as colunas)
  - `DriveTab.tsx` reescrita por cliente (e-mail SA copiável, conectar/validar, sync com contadores, desconectar)
- **PR #51 (mergeado)** — wizard de onboarding:
  - `GET /api/drive/service-account` + `GET /api/drive/folder-info` (validação standalone — wizard não tem cliente ainda)
  - `WizardStep3Drive` deixou de ser placeholder: valida o link no passo 3; `WizardContainer` encadeia criar cliente → vincular → sync → Oráculo (best-effort, com fases no botão)
  - `WizardState` ganhou `driveFolder`/`driveFolderName`
- Runbook `docs/runbooks/teste-piloto.md` atualizado (seção 2b: dois caminhos)
- Suite: 153 testes backend; ruff/tsc/eslint limpos

## Decisões tomadas

- **SA + compartilhamento manual em vez de OAuth** — elimina tokens, KMS (NFR-008 vira N/A), ACL∩RBAC (curadoria = responsabilidade de quem monta a pasta); atende REST-08 v2 e minimização LGPD
- **Sync inline com cap de 50 arquivos** e `truncated=true` explícito (sem truncamento silencioso); re-sync manual; delta sync/webhooks ficam para fase futura
- **Conteúdo do doc vai em `description` E `content_text`** — o frontend mapeia `content = description`, e é o `content` que o ChatInterface envia como contexto
- **Best-effort no wizard**: falha do Drive na confirmação não bloqueia o onboarding
- **Oráculo NÃO lê os docs sincronizados** (usa briefing + web) — copy da UI é honesto sobre isso

## Arquivos modificados

- **Backend:** `api/drive/{google_drive,ingest,client_drive}.py` (novos), `api/models/client.py`, `api/clientes/repository.py`, `api/config.py` (`DRIVE_SA_EMAIL`), `api/main.py`, `api/migrations/019_clients_drive_folder.sql`
- **Frontend:** `components/admin/clientes/tabs/DriveTab.tsx`, `components/onboarding/{WizardStep3Drive,WizardContainer,WizardStep4Confirm}.tsx`, `contexts/OnboardingOraculoContext.tsx`, `lib/{api,onboarding-types}.ts`, `components/clientes/ClientEditor.tsx`
- **Testes:** `api/tests/test_client_drive.py` (15)
- **Docs:** runbook teste-piloto, este handoff

## Pendências (não abertas como TODO)

- **Validação real da SA contra o Drive** — primeiro compartilhamento ainda não testado; se o Workspace bloquear compartilhamento com service accounts, fallback = Shared Drive com a SA como membro (código já suporta `supportsAllDrives`)
- **Oráculo consumir docs sincronizados** — follow-up pós-piloto (injetar `knowledge_documents` do cliente no contexto de geração das entidades)
- **PDF não extrai texto** (entra só com link) — avaliar extração via Gemini multimodal depois
- `app/drive/page.tsx` (cleanup report antigo) segue com stub global e `X-User-ID: dev-user` — não linkada, irrelevante pro piloto
- Subpastas não são recursivas no sync (MVP)

## Próximo passo natural

Validar o fluxo real em prod: compartilhar pasta de teste com a SA → wizard de cliente novo com pasta → conferir docs na Biblioteca → chat com contexto. Depois disso o runbook do piloto está completo para segunda (15/06).

## Aprendizados / pegadinhas

- **Credencial de migrations (`jose`)** não está em Secret Manager — mas estava no env do container `sunos-api` local (criado com `docker-compose.prod-db.yml`); `docker inspect` recupera sem expor
- **Dual-root import bites em exceções**: `api.drive.google_drive.DriveAccessError` ≠ `drive.google_drive.DriveAccessError` — em teste, sempre levantar/patchar via o namespace do módulo do router (`cd.DriveAccessError`)
- **`google-auth` já vem com firebase-admin** — dá para falar com qualquer API Google via REST sem instalar client libs
- **Modelo SQLAlchemy à frente do schema de prod = deploy quebrado** — sequência obrigatória: migration primeiro, merge depois
- Rede local com rota quebrada para `api.github.com` — workaround `curl --resolve api.github.com:443:140.82.112.6` com `gh auth token`
