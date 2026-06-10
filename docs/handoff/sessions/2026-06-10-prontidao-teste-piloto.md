# Handoff — 2026-06-10 — Prontidão para o teste piloto (15/06)

**Duração aproximada:** 3h
**Foco:** Analisar prontidão do sunOS para o teste interno de segunda (15/06) e corrigir os bloqueadores de multiusuário no chat + onboarding (foco do teste).

## O que foi feito

- **Análise de prontidão** completa (auth, mock vs real, persistência, deploy, pontas soltas) — priorização P0/P1/P2
- **PR #47 (mergeado + deployado)** — identidade real via JWT:
  - `api/core/auth.py` (novo): dependency compartilhada — JWT Firebase verificado; `X-User-ID` só fora de produção; token inválido não cai pro fallback
  - Chat stream persiste com uid real (antes: `"anonymous"` hardcoded → histórico nunca casava com a leitura)
  - Guards cross-user no load de histórico e no upsert (caixa-preta RN-010); conversas legadas `anonymous` são reivindicadas pelo primeiro usuário autenticado
  - Onboarding validate registra uid real na auditoria HITL (antes `"system"`)
  - `ChatInterface.tsx`: uid real no lugar de `'preview-user'`; descarta convId do localStorage em 404
- **PR #48 (mergeado + deployado)** — fix da pendência A-3: param `request: Any` fazia `GET /api/conversations*` retornar **422 em todo request** (frontend engolia como "sem histórico"); 6 testes de regressão
- **Auditoria de GRANTs em prod** — 31/31 tabelas com privilégios completos pro role `sunos`, 0 sequences sem USAGE; script versionado em `api/migrations/check_grants.sql`
- **Avaliação do Drive stub** — já contido (wizard Step 3 com placeholder claro, DriveTab admin-only com aviso, `/drive` não linkada); **nenhuma mudança necessária**
- **Smoke test de API em prod** — health 200; conversas 401 sem auth (não mais 422); `X-User-ID` spoof rejeitado em produção
- **Runbook do piloto** — `docs/runbooks/teste-piloto.md` (checklist do admin + guia do testador copiável)

## Decisões tomadas

- **Fallback `X-User-ID` mantido fora de produção** (gated por `settings.ENVIRONMENT != "production"`) — preserva dev local sem Firebase e a suite de testes; em prod, JWT obrigatório
- **Chat stream é leniente** (`resolve_user_id() or "anonymous"`) — nunca bloqueia o chat por falta de auth em dev; endpoints de leitura de conversas são estritos (401)
- **Claim de conversas legadas**: upsert com `ON CONFLICT ... WHERE user_id IN (EXCLUDED.user_id, 'anonymous')` — primeiro usuário autenticado que continuar uma conversa anônima vira dono
- **Drive não foi escondido** — a exposição já era contida; escondê-lo seria trabalho desnecessário

## Arquivos modificados

- **Backend:** `api/core/auth.py` (novo), `api/chat/router.py`, `api/chat/graph/runner.py`, `api/chat/conversations/router.py`, `api/onboarding/router.py`, `api/migrations/check_grants.sql` (novo)
- **Testes:** `api/tests/test_core_auth.py` (novo, 8), `api/tests/test_conversations.py` (novo, 6) — suite 138 verde
- **Frontend:** `components/chat/ChatInterface.tsx`
- **Docs:** `docs/runbooks/teste-piloto.md` (novo), este handoff

## Pendências (não abertas como TODO)

- **Convidar testadores** em `/configuracoes` → Usuários (e-mail Google, role creator) — fazer até sexta/segunda de manhã
- **Smoke test E2E de UI** (roteiro na seção A.2 do runbook) — requer conta de teste não-admin; o smoke de API já passou
- **Integrações in-memory** (`_integrations`, B-2): chaves somem em redeploy — congelar deploys no horário de teste; solução real precisa de KMS
- **15 vulnerabilidades Dependabot na main (5 high)** — não bloqueia o piloto, mas auditar em seguida
- **`gh` CLI quebrado nesta rede**: rota para `api.github.com` (IP Azure 4.228.31.149) inacessível; workaround usado: `curl --resolve api.github.com:443:140.82.112.6` com `gh auth token`
- Drive page `app/drive/page.tsx` ainda usa `X-User-ID: 'dev-user'` hardcoded — irrelevante pro piloto (página não linkada), migrar quando o Drive sair do stub

## Próximo passo natural

Executar a seção A do runbook `docs/runbooks/teste-piloto.md` (convidar testadores + smoke E2E de UI) e postar a seção B no canal do time. Depois do piloto: B-2 (integrações + KMS) e auditoria das vulnerabilidades Dependabot.

## Aprendizados / pegadinhas

- **`request: Any` sem default em endpoint FastAPI vira query param obrigatório** → 422 em tudo; o frontend tratando `!res.ok` como null mascarou o bug por semanas
- **PS 5.1 + ConvertTo-Json**: string vinda de `Get-Content` carrega propriedades ETS e serializa como `{"value": ...}` — usar `[IO.File]::ReadAllText`
- **PS 5.1 + argumentos com `"` embutida** quebram `git commit -m`/`gh pr create` — usar `--body-file`/here-string sem aspas duplas internas
- O doc vivo `docs/tasks/persistence-migration.md` é a fonte de verdade do estado de persistência (bem mais avançado que o ROADMAP sugere — Bucket A 100% DB-backed); consultar antes de assumir que algo é in-memory
- `get_user_for_auth` casa por e-mail como bootstrap — convite por e-mail funciona antes do primeiro login
