---
spec-id: SPEC-018
slug: clientes-admin
artefato: design
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-05-26
atualizada: 2026-05-26
versao: 1.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + Python 3.11"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: "Arquitetura de componentes, modelo de dados, API endpoints e decisões de design para o Clientes Admin."
upstream:
  - docs/prd/parte1-feature-map.md (FA-12-03, FA-06, FA-15)
  - docs/brd/parte4-regras.md (RN-009)
  - docs/srd/parte7-ADRs.md (ADR-002)
  - docs/specs/large/skills-admin/design.md (ADR-LOCAL-02: junction skill_clients)
---

# Design — SPEC-018 — Clientes Admin

## 1. Visão Geral da Arquitetura

```
Browser (Next.js 14)                    FastAPI + PostgreSQL
─────────────────────                   ────────────────────
/clientes                               GET  /api/clients
  └── ClientesAdminPage                 GET  /api/clients/{id}
        ├── FilterSidebar               POST /api/clients
        ├── ClientesCards               PATCH /api/clients/{id}
        └── ClientDrawer (preview)      POST /api/clients/{id}/archive
                                        GET  /api/clients/{id}/metrics
/clientes/new                           GET  /api/clients/{id}/skills
  └── ClienteWizardPage                 POST /api/clients/{id}/skills/{skill_id}
        ├── Step1Identidade             DELETE /api/clients/{id}/skills/{skill_id}
        ├── Step2Sponsor                GET  /api/clients/{id}/biblioteca
        ├── Step3Skills
        └── Step4Review

/clientes/[clientId]
  └── ClienteEditorPage
        ├── IdentidadeTab
        ├── SkillsTab
        ├── BibliotecaTab
        └── MetricasTab
```

**ClientsContext** permanece ativo no protótipo; em produção, componentes migram para SWR/fetch direto. Context mantido como fallback mock-mode.

## 2. Modelo de Dados

### 2.1. Tabela `clients`

```sql
CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120) NOT NULL,
  slug          VARCHAR(80)  NOT NULL UNIQUE,
  description   TEXT,
  color         CHAR(7) NOT NULL DEFAULT '#FFC801',   -- hex color
  status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('PRE_ACTIVE','ACTIVE','ARCHIVED')),
  sponsor_name  VARCHAR(120),
  sponsor_email VARCHAR(200),
  sponsor_slack VARCHAR(80),
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_slug   ON clients(slug);
```

**Nota ADR-LOCAL-01:** `data/clients.ts` não é afetado por esta tabela. As duas fontes coexistem e são intencionalmente independentes.

### 2.2. Junction `skill_clients` (compartilhada com SPEC-017)

```sql
-- Definida em SPEC-017/design.md §2.3 — não recriar
-- SPEC-018 apenas usa a mesma junction
-- skill_clients(skill_id, client_id, assigned_by, assigned_at)
```

### 2.3. View `client_metrics`

```sql
CREATE VIEW client_metrics AS
SELECT
  c.id                                    AS client_id,
  COUNT(DISTINCT cr.id)                   AS total_sessions,
  COUNT(DISTINCT f.id)                    AS total_feedbacks,
  ROUND(AVG(f.score), 2)                  AS average_score,
  (
    SELECT s.slug FROM skills s
    JOIN conversation_runs cr2 ON cr2.skill_id = s.id
    WHERE cr2.client_id = c.id
    GROUP BY s.id ORDER BY COUNT(*) DESC LIMIT 1
  )                                        AS top_skill_slug,
  MAX(cr.started_at)                       AS last_activity
FROM clients c
LEFT JOIN conversation_runs cr ON cr.client_id = c.id
LEFT JOIN feedbacks f          ON f.conversation_id = cr.id
GROUP BY c.id;
```

## 3. API Endpoints

### 3.1. Listagem

```
GET /api/clients
  Query params: status, skill_id, q, sort, order, limit, offset
  Auth: P3, P4
  Response: { items: ClientSummary[], total: int }
  ClientSummary: id, name, slug, color, status, skill_count, updated_at
```

### 3.2. Detalhe

```
GET /api/clients/{client_id}
  Auth: P3 (own scope), P4
  Response: ClientDetail (identidade + sponsor; sem métricas inline)
  Caixa-preta: P1/P2 → 404
```

### 3.3. Criação

```
POST /api/clients
  Body: ClientCreate (name, slug, description, color, sponsor_name,
                      sponsor_email, sponsor_slack, status?)
  Auth: P3, P4
  Response 201: ClientDetail
  Errors: 409 se slug duplicado, 422 se validação falha
  Note: status default = 'ACTIVE'; FA-15 pode enviar status='PRE_ACTIVE'
```

### 3.4. Edição

```
PATCH /api/clients/{client_id}
  Body: ClientUpdate (campos parciais — sem slug)
  Auth: P3 (own scope), P4
  Response 200: ClientDetail
```

### 3.5. Arquivamento

```
POST /api/clients/{client_id}/archive
  Auth: P3, P4
  Response 200: { status: "ARCHIVED" }
  Warning: response inclui { solar_impact: "manual sync required" }
```

### 3.6. Métricas

```
GET /api/clients/{client_id}/metrics
  Auth: P3, P4
  Response: ClientMetrics (total_sessions, total_feedbacks, average_score,
                            top_skill_slug, last_activity)
  Note: query sobre view client_metrics — pode ter latência ≤ 800ms
```

### 3.7. Skills (tab Skills)

```
GET    /api/clients/{client_id}/skills
POST   /api/clients/{client_id}/skills/{skill_id}
DELETE /api/clients/{client_id}/skills/{skill_id}
```

### 3.8. Biblioteca (tab Biblioteca — read-only)

```
GET /api/clients/{client_id}/biblioteca
  Query params: q, tags, limit, offset
  Response: KnowledgeItemSummary[] (delega para endpoint Biblioteca com filter client_id)
```

## 4. Componentes Frontend

### 4.1. Estrutura de Arquivos

```
components/admin/clientes/
  ClientesCards.tsx          — condensed cards grid/list
  ClientDrawer.tsx           — preview drawer
  ClienteFilterSidebar.tsx   — filtros status/skill
  ClienteWizard.tsx          — wizard 4 steps (criação)
  ClienteEditorTabs.tsx      — container dos 4 tabs (edição)
  tabs/
    IdentidadeTab.tsx
    SkillsTab.tsx            — toggle atribuição via skill_clients
    BibliotecaTab.tsx        — lista read-only + link para /biblioteca
    MetricasTab.tsx          — dashboard de métricas

app/clientes/
  page.tsx                   — /clientes (listagem)
  new/page.tsx               — /clientes/new (wizard)
  [clientId]/page.tsx        — /clientes/[clientId] (edição)
```

### 4.2. Color Picker

O campo `color` usa um seletor de cor com preset de 12 cores do design system (incluindo `--sun #FFC801`) mais um input hex livre. Cor é armazenada em hex `#RRGGBB` de 7 chars.

```typescript
const COLOR_PRESETS = [
  '#FFC801', // sun
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
  '#6B7280', '#1E293B', '#FFFFFF'
];
```

### 4.3. State Machine Visual

```typescript
type ClientStatus = 'PRE_ACTIVE' | 'ACTIVE' | 'ARCHIVED';

const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string }> = {
  PRE_ACTIVE: { label: 'Em validação', color: '--text-muted' },
  ACTIVE:     { label: 'Ativo',        color: 'var(--sun)' },
  ARCHIVED:   { label: 'Arquivado',    color: '--text-muted' }
};
```

## 5. Decisões Locais

### ADR-LOCAL-01 — `data/clients.ts` imutável; CRUD opera em tabela `clients` (ADR-002)

- **Status:** Aceita (v1.0) — deriva de ADR-002 da SRD
- **Contexto:** Solar System (`data/clients.ts`) é carregado em build time; não tem lógica de hydratação de API. Mudar para dados dinâmicos quebraria SSG e o comportamento offline/prototype.
- **Decisão:** Duas fontes coexistem. `data/clients.ts` = dados estáticos do Solar System (pode incluir subset dos clientes produção). Tabela `clients` = CRUD Admin. Sincronização é manual, intencional e documentada no runbook.
- **Alternativas rejeitadas:**
  - *Auto-sync Admin → `data/clients.ts`*: quebraria Solar System em build; cria dependency runtime
  - *Solar System ler da API*: muda o bundle e comportamento offline do protótipo; fora de escopo desta SPEC
- **Consequências:** ✅ Solar System imune a bugs do Admin; ⚠️ Novo cliente criado no Admin só aparece no Solar após sync manual + re-build; documentar no runbook

### ADR-LOCAL-02 — Junction `skill_clients` compartilhada com SPEC-017

- **Status:** Aceita (v1.0) — referencia ADR-LOCAL-02 de SPEC-017
- **Decisão:** Tab Skills no Clientes Admin opera sobre a mesma junction `skill_clients` definida em SPEC-017. Não há array `assigned_skills` em `clients` nem array `assigned_clients` em `skills`.
- **Consequências:** ✅ Fonte única de verdade; ✅ Mudança em um tab reflete imediatamente no outro; ⚠️ Migração do protótipo precisa sincronizar os dois arrays hoje existentes em Context (escolher skill_clients como canônico)

### ADR-LOCAL-03 — `status` enum (PRE_ACTIVE/ACTIVE/ARCHIVED) em vez de `is_active: bool`

- **Status:** Aceita (v1.0)
- **Contexto:** FA-15 (Onboarding Automatizado) criará clientes com status `PRE_ACTIVE` até validação humana. Boolean `is_active` não cobre este estado intermediário.
- **Decisão:** Enum `status VARCHAR(20)` com constraint. Transições válidas: `PRE_ACTIVE → ACTIVE` (aprovação FA-15), `ACTIVE → ARCHIVED` (arquivamento manual), sem transição direta `PRE_ACTIVE → ARCHIVED`.
- **Alternativas rejeitadas:**
  - *`is_active: bool` + `is_validated: bool`*: dois booleans para representar 3 estados — propenso a estado inválido (`is_active=true, is_validated=false`)
- **Consequências:** ✅ Prepara para FA-15; ✅ State machine explícita; ⚠️ Frontend precisa tratar 3 badges/estados no UI

### ADR-LOCAL-04 — ClientMetrics calculadas via DB view, não persistidas

- **Status:** Aceita (v1.0)
- **Contexto:** Armazenar `total_sessions` como coluna requer trigger/job de atualização síncrona — risco de desincronização.
- **Decisão:** `client_metrics` é uma DB view que agrega on-demand. Query com índice em `client_id` em `conversation_runs` e `feedbacks`.
- **Alternativas rejeitadas:**
  - *Colunas denormalizadas + trigger*: risco de inconsistência em falha do trigger; mais difícil de retroactive recalculation
  - *Cache Redis com TTL*: overhead de infraestrutura; sem benefício abaixo de 500 clientes
- **Consequências:** ✅ Dados sempre frescos; ✅ Sem sync jobs; ⚠️ Latência da view cresce com volume de runs — monitorar via NFR-CAD-001 (≤800ms p95)

<!-- REVIEW: ADR-LOCAL-01 a ADR-LOCAL-04 são as 4 decisões desta SPEC. Decisão sobre slug imutável após criação (não editável via PATCH) deveria ser ADR-LOCAL-05? -->

## 6. Segurança — Caixa-preta

### 6.1. Middleware Next.js

```typescript
// middleware.ts (compartilhado com SPEC-017)
export const config = {
  matcher: ['/skills/:path*', '/clientes/:path*', '/biblioteca/:path*']
}
```

### 6.2. Dependency Guard (FastAPI)

```python
def require_client_access(
    client_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Client:
    client = db.query(Client).filter(
        Client.id == client_id
    ).first()
    if not client or current_user.role not in ('leader', 'admin'):
        raise HTTPException(status_code=404, detail="Not found")
    return client
```
