---
spec-id: SPEC-022
slug: configuracoes-admin
artefato: spec
nivel-sdd: spec-anchored
tamanho: medium
status: rascunho
criada: 2026-05-26
atualizada: 2026-05-26
versao: 1.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + Python 3.11"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: "Admin panel em /configuracoes com RBAC management, integrações globais, defaults de modelos e auditoria. Drive OAuth migra para aba no editor do cliente."
upstream:
  - docs/prd/parte1-feature-map.md (FA-12)
  - docs/brd/parte4-regras.md (RN-009, RN-011)
  - docs/srd/parte7-ADRs.md (ADR-001, ADR-002)
  - docs/specs/large/drive-readonly-curation/design.md (DriveConnectionCard existente)
arquivos-relacionados:
  - app/configuracoes/page.tsx
  - app/configuracoes/drive/page.tsx
  - app/clientes/[clientId]/page.tsx
  - components/admin/configuracoes/UsuariosTab.tsx
  - components/admin/configuracoes/IntegracoesTab.tsx
  - components/admin/configuracoes/SkillsDefaultsTab.tsx
  - components/admin/configuracoes/AuditoriaTab.tsx
  - components/admin/clientes/tabs/DriveTab.tsx
  - api/admin/router.py
  - api/models/platform_settings.py
  - api/models/audit_events.py
---

# Spec — Configurações Admin (SPEC-022)

## 1. Resumo

**O quê**: Transformar `/configuracoes` (atualmente um redirect para a página de Drive OAuth) em admin panel completo com 4 seções: Usuários/RBAC, Integrações Globais, Skills/Modelos, Auditoria. Simultaneamente, migrar a configuração de Drive OAuth para aba "Drive" dentro do editor de cliente em `/clientes/[clientId]`.

**Por quê**: A plataforma não tem superfície de administração central. RBAC, chaves de API e auditoria ficam sem home. Drive é per-client (não global), portanto pertence ao editor do cliente.

**Para quem**: Exclusivamente usuários com role `admin` (Firebase Custom Claim `admin=true`). Nenhuma seção é acessível para roles inferiores — resposta 404 para não-admins (caixa-preta).

## 2. Comportamento Especificado

### 2.1 Drive OAuth → Aba no Editor de Cliente

**Migração de superfície:**

- Nova aba "Drive" adicionada ao array `TABS` em `ClientEditorTabs.tsx` após "Métricas".
- Conteúdo da aba: componente `DriveTab.tsx` em `components/admin/clientes/tabs/`, extraído de `app/configuracoes/drive/page.tsx`. Mantém os mesmos callbacks (`handleConnect`, `handleDisconnect`, `handleSync`) mas recebe `clientId` como prop — confirmando que Drive é per-client.
- A aba "Drive" só aparece para usuários com role `admin`. Usuários sem esse papel não veem a aba; se tentarem acessar a URL direta com `?tab=drive`, são redirecionados para a aba "Identidade".

**Rota legada:**

- `app/configuracoes/drive/page.tsx`: substituir conteúdo por `redirect('/configuracoes')` do `next/navigation`. Não usar `notFound()` nem deletar o arquivo.
- `next.config.ts`: adicionar redirect 301 de `/configuracoes/drive` → `/configuracoes` no bloco `redirects` para cobrir navegação direta.

### 2.2 /configuracoes — 4 Seções (Tabs)

A página `/configuracoes/page.tsx` é reescrita como admin panel com 4 abas horizontais (mesmo padrão visual de `ClientEditorTabs`). Toda a página retorna 404 para usuário sem Firebase Custom Claim `admin=true`.

#### Aba Usuários

Tabela com colunas: **Nome**, **Email**, **Papel** (badge colorido), **Status** (Ativo/Suspenso), **Último Acesso**.

Ações disponíveis:
- **Convidar** (botão primário no topo): modal com campo email + seletor de papel (`admin` / `creator` / `viewer`). Chama `POST /api/admin/users/invite`. Firebase Admin SDK envia email com `generateEmailSignInLink`. Modal fecha e exibe toast de sucesso.
- **Editar papel** (clique no badge de papel na row): dropdown inline → chama `PATCH /api/admin/users/{uid}` com `{ role }`.
- **Suspender** (ação em kebab menu da row, destrutiva, confirma antes): `PATCH /api/admin/users/{uid}` com `{ is_active: false }`. Row do usuário suspenso aparece em `var(--text-muted)` com badge "Suspenso". Suspender usuário suspenso é no-op (botão desabilitado).

Filtro de status (pills: Todos / Ativos / Suspensos) acima da tabela. Paginação client-side (25 por página). Sync de usuários via `GET /api/admin/users` que consulta Firebase Admin SDK `listUsers()`.

#### Aba Integrações

Lista vertical de integrações de plataforma. Cada item: ícone, nome, descrição curta, badge de status (Conectado em verde / Não configurado em muted), botão de ação.

**Fase A — Gemini API Key:**
- Card "Gemini API" com ícone `Sparkles` (Lucide, 14, strokeWidth 1.5).
- Campo input tipo `password` com máscara. API retorna `***...***` + últimos 4 chars (ex: `***...k3X9`). Frontend nunca exibe o valor completo.
- Botão "Salvar": `PUT /api/admin/integrations/gemini_api_key` com `{ value }`.
- Badge: se valor configurado → "Conectado"; caso contrário → "Não configurado".

**Expansível:** lista renderizada a partir de array de config (nome, slug, ícone, campos). Adicionar integração = adicionar item ao array, sem mudar componente.

#### Aba Skills/Modelos

Tabela de defaults por skill. Colunas: **Skill**, **Modelo LLM**, **Temperatura**, **Max Tokens**.

- Edição inline: clicar em célula ativa input/select inline. Alteração no blur ou Enter chama `PUT /api/admin/skills/defaults/{skill_slug}`.
- Seletor de modelo: dropdown com opções `gemini-2.0-flash`, `gpt-4o`, `claude-3-5-sonnet`.
- Temperatura: input numérico 0.0–2.0, step 0.1.
- Max tokens: input numérico, mínimo 256.
- Linha com alteração não salva: borda `var(--sun)` até persistência confirmada.

#### Aba Auditoria

Tabela paginada (50 por página, paginação via API). Colunas: **Data/Hora**, **Usuário**, **Ação**, **Recurso**, **Detalhes**.

Filtros: usuário (input texto, filtra por email), tipo de ação (select), data range (dois inputs `date`).

A tabela é **read-only**. Sem ações de edição ou exclusão. Coluna Detalhes truncada com `title` tooltip ao hover.

## 3. Interface & Contratos

### 3.1 Estrutura de Arquivos

**Criar:**

```
app/configuracoes/
  page.tsx                              — reescrever: admin panel com 4 tabs

components/admin/configuracoes/
  UsuariosTab.tsx
  IntegracoesTab.tsx
  SkillsDefaultsTab.tsx
  AuditoriaTab.tsx

components/admin/clientes/tabs/
  DriveTab.tsx                          — extraído de /configuracoes/drive

api/admin/
  __init__.py
  router.py
  schemas.py

api/models/
  platform_settings.py                  — (key, value_encrypted, updated_by, updated_at)
  audit_events.py                       — append-only (id, actor_uid, action, resource, detail, created_at)
```

**Modificar:**

```
app/configuracoes/drive/page.tsx        — substituir por redirect('/configuracoes')
components/clientes/ClientEditorTabs.tsx — adicionar 'Drive' condicional
next.config.ts                          — redirect 301: /configuracoes/drive → /configuracoes
api/main.py                             — registrar admin router
```

### 3.2 API Endpoints

Middleware `require_admin_claim` em todos (verifica Firebase Custom Claim `admin=true`). Resposta para não-admin: `404` (caixa-preta — nunca `403`).

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/admin/users` | Lista usuários (`?page=1&per_page=25&status=active`) |
| `PATCH` | `/api/admin/users/{uid}` | Editar `role` ou `is_active` |
| `POST` | `/api/admin/users/invite` | Enviar convite por email |
| `GET` | `/api/admin/integrations` | Lista integrações com status (valor mascarado) |
| `PUT` | `/api/admin/integrations/{key}` | Salvar config de integração |
| `GET` | `/api/admin/skills/defaults` | Defaults de modelo por skill |
| `PUT` | `/api/admin/skills/defaults/{skill_slug}` | Editar default de skill |
| `GET` | `/api/admin/audit-log` | Paginado com filtros (`?user=`, `?action=`, `?from=`, `?to=`) |

### 3.3 Schema SQL

```sql
CREATE TABLE platform_settings (
  key           VARCHAR(100) PRIMARY KEY,
  value_encrypted TEXT NOT NULL,         -- AES-256, key de Secret Manager
  updated_by    TEXT NOT NULL,           -- Firebase UID
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_uid     TEXT NOT NULL,            -- Firebase UID
  actor_email   VARCHAR(200),
  action        VARCHAR(80) NOT NULL,
  resource_type VARCHAR(50),
  resource_id   TEXT,
  detail        JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_events_actor   ON audit_events(actor_uid);
CREATE INDEX idx_audit_events_action  ON audit_events(action);
CREATE INDEX idx_audit_events_created ON audit_events(created_at DESC);
-- Sem UPDATE/DELETE — append-only enforced via policy de segurança no DB
```

**Nota:** `value_encrypted` usa chave em GCP Secret Manager (`PLATFORM_SETTINGS_ENCRYPTION_KEY`). `GET /api/admin/integrations` retorna `value_masked` = `"***...****" + últimos_4_chars`. Chave nunca sai do backend.

## 4. Restrições Técnicas

- Somente role `admin` acessa `/api/admin/*` — middleware verifica Firebase Custom Claim
- Invite usa Firebase Admin SDK `generateEmailSignInLink` — não cria usuário diretamente
- API keys de integrações em `platform_settings` com `value_encrypted` — não plain text
- `audit_events` é append-only — sem DELETE, UPDATE via produto; enforced no DB
- Drive config permanece per-client — `DriveTab` passa `clientId` como contexto
- `data/clients.ts` é imutável (ADR-002) — sem alterações

## 5. Critérios de Aceite

**CA-01**: DADO usuário com role `creator` tentando acessar `/configuracoes`, QUANDO navega para essa rota, ENTÃO recebe 404 (não 403, não "Acesso negado").

**CA-02**: DADO admin autenticado em `/configuracoes`, QUANDO clica em "Convidar" e submete email + papel, ENTÃO o usuário recebe email de convite via Firebase e uma entrada aparece na tabela com status "Pendente".

**CA-03**: DADO admin em Aba Integrações, QUANDO salva uma Gemini API Key, ENTÃO a GET subsequente retorna `***...` + últimos 4 chars do valor salvo, e o badge muda para "Conectado".

**CA-04**: DADO admin que suspendeu um usuário, QUANDO a ação é realizada, ENTÃO um evento aparece na Aba Auditoria com ação "Suspensão" e o email do usuário suspenso no campo Recurso.

**CA-05**: DADO a rota `/configuracoes/drive` acessada diretamente, QUANDO o browser segue o redirect, ENTÃO o usuário chega em `/configuracoes` (301 redirect via `next.config.ts`).

**CA-06**: DADO editor de cliente em `/clientes/[clientId]` para usuário `admin`, QUANDO o usuário abre o editor, ENTÃO a aba "Drive" aparece no tab bar após "Métricas".

**CA-07**: DADO editor de cliente para usuário com role `creator`, QUANDO o editor carrega, ENTÃO a aba "Drive" não aparece no tab bar.

**CA-08**: DADO a Aba Skills/Modelos, QUANDO admin edita a temperatura de uma skill e pressiona Enter, ENTÃO a alteração é salva via `PUT /api/admin/skills/defaults/{slug}` e a borda da linha volta a ser normal.

**CA-09**: DADO a Aba Auditoria com filtro por tipo de ação "Convite", QUANDO aplicado, ENTÃO apenas eventos com `action='user_invited'` aparecem na tabela.

**CA-10**: DADO qualquer endpoint em `/api/admin/*`, QUANDO chamado por usuário sem Custom Claim `admin=true`, ENTÃO resposta é `404 { "detail": "Not found" }`.

## 6. Tasks

- [ ] **TASK-01**: Criar schema SQL — `platform_settings` + `audit_events` + migration `009_admin_panel.sql`
- [ ] **TASK-02**: Backend `api/admin/router.py` — endpoints `/api/admin/users`, `/api/admin/integrations`, `/api/admin/skills/defaults`, `/api/admin/audit-log` com middleware `require_admin_claim`
- [ ] **TASK-03**: Frontend — criar 4 componentes tab (`UsuariosTab`, `IntegracoesTab`, `SkillsDefaultsTab`, `AuditoriaTab`) + reescrever `app/configuracoes/page.tsx`
- [ ] **TASK-04**: Migrar Drive config — criar `DriveTab.tsx` a partir de `/configuracoes/drive/page.tsx`, adicionar aba no `ClientEditorTabs.tsx`, converter `/configuracoes/drive/page.tsx` em redirect, atualizar `next.config.ts`
- [ ] **TASK-05**: Registrar `admin router` em `api/main.py` + smoke test dos endpoints com admin token

## 7. Notas de Implementação

- `require_admin_claim` no backend: `from core.firebase import verify_id_token; claims = verify_id_token(token); if not claims.get('admin'): raise HTTPException(404)` — não 403
- `platform_settings.value_encrypted`: usar `cryptography.fernet.Fernet` com chave de `os.environ['PLATFORM_SETTINGS_ENCRYPTION_KEY']`. Nunca logar o valor.
- `audit_events`: inserir via trigger de DB ou via interceptor no router; nunca expor DELETE/UPDATE endpoint
- `ClientEditorTabs.tsx` hoje: verificar se array `TABS` está hardcoded ou gerado dinamicamente para adicionar 'Drive' condicionalmente
- Firebase `listUsers()` pagina (max 1000 por vez) — usar paginação com `pageToken` para listar todos os usuários em sync inicial

## 8. Prompt para Agente

Implemente as mudanças da SPEC-022 (Configurações Admin):

**Contexto**: sunOS — Next.js 14 + FastAPI + Python. `/configuracoes` hoje tem só Drive config. Precisa virar admin panel. Drive config vai para aba no editor de cliente.

**O que implementar**:
1. Criar `components/admin/configuracoes/` com 4 componentes tab
2. Reescrever `app/configuracoes/page.tsx` como admin panel com 4 tabs (Usuários, Integrações, Skills, Auditoria)
3. Criar `components/admin/clientes/tabs/DriveTab.tsx` com conteúdo de `app/configuracoes/drive/page.tsx`
4. Adicionar aba "Drive" em `ClientEditorTabs.tsx` (condicional para role admin)
5. Converter `app/configuracoes/drive/page.tsx` em `redirect('/configuracoes')`
6. Backend: `api/admin/router.py` com middleware caixa-preta + endpoints listados
7. Schema SQL: `platform_settings` + `audit_events` em `api/migrations/009_admin_panel.sql`
8. Registrar router em `api/main.py`

**Restrições**:
- Não modificar `data/clients.ts`
- 404 (não 403) para não-admins
- `value_encrypted` em platform_settings — nunca plain text
- Inline styles (não Tailwind), CSS variables, Lucide React (size 14, strokeWidth 1.5)

**Testes esperados** (CA relevantes):
- CA-01: non-admin recebe 404
- CA-05: `/configuracoes/drive` redireciona para `/configuracoes`
- CA-06: aba Drive aparece para admin no editor de cliente
- CA-07: aba Drive não aparece para creator
