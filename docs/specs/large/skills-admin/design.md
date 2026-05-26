---
spec-id: SPEC-017
slug: skills-admin
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
  contexto: "Arquitetura de componentes, modelo de dados, API endpoints e decisões de design para o Skills Admin."
upstream:
  - docs/prd/parte1-feature-map.md (FA-12-01, FA-09)
  - docs/brd/parte4-regras.md (RN-009)
  - docs/srd/parte7-ADRs.md (ADR-002)
  - docs/specs/large/workflow-builder/design.md (SPEC-003: tabela workflows — dependency check de archive)
  - docs/specs/large/workflow-builder-canvas/design.md (SPEC-005: workflow_steps — referenciada em TASK-B04/TASK-A07)
---

# Design — SPEC-017 — Skills Admin

## 1. Visão Geral da Arquitetura

```
Browser (Next.js 14)                    FastAPI + PostgreSQL
─────────────────────                   ────────────────────
/skills                                 GET  /api/skills
  └── SkillsAdminPage                   GET  /api/skills/{id}
        ├── FilterSidebar               POST /api/skills
        ├── SkillsTable                 PATCH /api/skills/{id}
        └── SkillDrawer (preview)       POST /api/skills/{id}/archive
                                        GET  /api/skills/{id}/versions
/skills/[skillId]
  └── SkillEditorPage
        ├── IdentidadeTab               GET  /api/skills/{id}  (+ system_prompt se P3/P4)
        ├── ConfiguracaoTab             PATCH /api/skills/{id}
        ├── MoonsTab                    GET/POST/DELETE /api/skills/{id}/moons
        └── ClientesTab                 GET/POST/DELETE /api/skills/{id}/clients
```

**SkillsContext** permanece ativo no protótipo; em produção, componentes migram para SWR/fetch direto contra a API. Context mantido como fallback mock-mode (sem `NEXT_PUBLIC_API_URL`).

## 2. Modelo de Dados

### 2.1. Tabela `skills`

```sql
CREATE TABLE skills (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120) NOT NULL,
  slug          VARCHAR(80)  NOT NULL UNIQUE,
  description   TEXT,
  type          VARCHAR(30)  NOT NULL CHECK (type IN ('chat','multimodal','workflow')),
  icon          VARCHAR(50),
  status        VARCHAR(20)  NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('active','draft','archived')),
  model         VARCHAR(60)  NOT NULL DEFAULT 'gemini-flash',
  temperature   NUMERIC(3,1) NOT NULL DEFAULT 0.7
                    CHECK (temperature BETWEEN 0 AND 2),
  max_tokens    INTEGER      NOT NULL DEFAULT 2048
                    CHECK (max_tokens BETWEEN 100 AND 8000),
  system_prompt TEXT,                           -- coluna protegida (ADR-LOCAL-01)
  version_number INTEGER NOT NULL DEFAULT 1,
  client_id     UUID REFERENCES clients(id),   -- scope (ADR-LOCAL-02; null = global)
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.2. Tabela `skill_versions`

```sql
CREATE TABLE skill_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id       UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot       JSONB NOT NULL,               -- snapshot do registro exceto system_prompt
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (skill_id, version_number)
);
```

### 2.3. Tabela `skill_clients` (junction)

```sql
CREATE TABLE skill_clients (
  skill_id    UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (skill_id, client_id)
);
```

### 2.4. Tabela `moon_skills` (junction)

```sql
CREATE TABLE moon_skills (
  moon_id     UUID NOT NULL REFERENCES moons(id) ON DELETE CASCADE,
  skill_id    UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (moon_id, skill_id)
);
```

### 2.5. Tabela `skill_prompt_audit`

```sql
CREATE TABLE skill_prompt_audit (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id     UUID NOT NULL REFERENCES skills(id),
  user_id      UUID NOT NULL REFERENCES users(id),
  prev_hash    CHAR(64),  -- SHA-256 do system_prompt anterior; NULL se era vazio
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 3. API Endpoints

### 3.1. Listagem

```
GET /api/skills
  Query params: type, status, client_id, q (search), sort, order, limit, offset
  Auth: P3, P4
  Response: { items: SkillSummary[], total: int, page: int }
  SkillSummary omite system_prompt
```

### 3.2. Detalhe

```
GET /api/skills/{skill_id}
  Auth: P3 (same client scope), P4
  Response: SkillDetail  ← inclui system_prompt SOMENTE para P3/P4
  Caixa-preta: P1/P2 → 404
```

### 3.3. Criação

```
POST /api/skills
  Body: SkillCreate (name, slug, description, type, icon, model, temperature,
                     max_tokens, system_prompt, status, client_id)
  Auth: P3, P4
  Response 201: SkillDetail
  Errors: 409 se slug duplicado, 422 se validação falha
```

### 3.4. Edição

```
PATCH /api/skills/{skill_id}
  Body: SkillUpdate (campos parciais)
  Auth: P3 (own client scope), P4
  Response 200: SkillDetail
  Efeito colateral: cria skill_version snapshot; se system_prompt alterado → insere skill_prompt_audit
```

### 3.5. Arquivamento

```
POST /api/skills/{skill_id}/archive
  Auth: P3, P4
  Response 200: { status: "archived" }
  Errors: 409 se skill referenciada em workflows ativos (lista slugs)
```

### 3.6. Histórico de Versões

```
GET /api/skills/{skill_id}/versions
  Auth: P3, P4
  Response: VersionEntry[]  ← sem system_prompt em snapshot
```

### 3.7. Moons

```
GET    /api/skills/{skill_id}/moons
POST   /api/skills/{skill_id}/moons         body: { moon_id, order_index }
DELETE /api/skills/{skill_id}/moons/{moon_id}
PATCH  /api/skills/{skill_id}/moons/reorder body: { moon_ids: string[] }
```

### 3.8. Clientes

```
GET    /api/skills/{skill_id}/clients
POST   /api/skills/{skill_id}/clients/{client_id}
DELETE /api/skills/{skill_id}/clients/{client_id}
```

## 4. Componentes Frontend

### 4.1. Estrutura de Arquivos

```
components/admin/skills/
  SkillsTable.tsx          — table view com colunas e row click
  SkillDrawer.tsx          — preview drawer (lado direito)
  SkillFilterSidebar.tsx   — filtros tipo/status/cliente
  SkillEditorTabs.tsx      — container dos 4 tabs
  tabs/
    IdentidadeTab.tsx
    ConfiguracaoTab.tsx    — condicional: system_prompt só se P3/P4
    MoonsTab.tsx
    ClientesTab.tsx

app/skills/
  page.tsx                 — /skills (listagem)
  new/page.tsx             — /skills/new (criação)
  [skillId]/page.tsx       — /skills/[skillId] (edição)
```

### 4.2. Serializer — Proteção do `system_prompt`

No backend (FastAPI), dois schemas Pydantic:

```python
class SkillPublic(BaseModel):
    id: str
    name: str
    slug: str
    # ... outros campos públicos
    # system_prompt AUSENTE

class SkillAdmin(SkillPublic):
    system_prompt: Optional[str]  # incluído apenas para P3/P4
    model: str
    temperature: float
    max_tokens: int

def serialize_skill(skill: Skill, user_role: str) -> dict:
    if user_role in ('leader', 'admin'):
        return SkillAdmin.from_orm(skill).dict()
    return SkillPublic.from_orm(skill).dict()
```

## 5. Decisões Locais

### ADR-LOCAL-01 — `system_prompt` em coluna `skills.system_prompt` (não Biblioteca)

- **Status:** Aceita (v1.0)
- **Contexto:** `system_prompt` é dado de configuração da skill, não documento de conhecimento da Biblioteca (FA-01). Mover para Biblioteca adicionaria lookup extra no runtime e dependency entre dois domínios (Skill Admin ↔ Biblioteca Admin).
- **Decisão:** Coluna `skills.system_prompt TEXT` com acesso filtrado por role no serializer. Proteção via RBAC no backend, não column-level DB.
- **Alternativas rejeitadas:**
  - *Biblioteca (FA-01)*: dependency cross-domain + overhead de lookup no runtime + FK obrigatória
  - *Tabela separada `skill_prompts`*: adds join; sem benefício claro de segurança adicional
- **Consequências:** ✅ Simples; ✅ Runtime sem lookup extra; ⚠️ Qualquer bug no serializer pode vazar `system_prompt` — coberto por NFR-SKA-003 + teste de integração obrigatório

### ADR-LOCAL-02 — Junction `skill_clients` como source of truth

- **Status:** Aceita (v1.0)
- **Contexto:** Protótipo tem `assignedClients` em SkillAdmin e `assignedSkills` em ClientAdmin, ambos em React Context sem sincronização — "independent and may diverge" (superpowers spec). Em produção precisa de fonte canônica.
- **Decisão:** `skill_clients` é a fonte canônica. Aba Clientes no SkillAdmin e aba Skills no ClientAdmin operam sobre esta mesma junction table. Mudança em um lado reflete no outro.
- **Alternativas rejeitadas:**
  - *Array JSONB em `skills.assigned_client_ids`*: sem integridade referencial; difícil query cross-client
- **Consequências:** ✅ Consistência garantida por FK; ⚠️ SPEC-018 (ClientesAdmin) deve usar a mesma junction

### ADR-LOCAL-03 — Slug gerado no frontend, validado no backend

- **Status:** Aceita (v1.0)
- **Decisão:** Frontend gera slug como `name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')`. Backend valida formato (regex `^[a-z0-9-]+$`, max 80 chars) e unicidade via DB UNIQUE constraint. Conflito retorna 409.
- **Consequências:** ✅ UX rápida (sem round-trip para sugerir slug); ⚠️ Race condition possível com criações simultâneas — resolvido pelo UNIQUE constraint no DB com 409 handler

### ADR-LOCAL-04 — Soft delete via `status = 'archived'`

- **Status:** Aceita (v1.0)
- **Decisão:** Arquivar = setar `status = 'archived'`. Não há coluna `deleted_at` nem hard delete. Registros archived não aparecem na listagem default mas são retornados com `?status=archived`.
- **Alternativas rejeitadas:**
  - *Coluna `deleted_at`*: pattern mais comum mas conflita com uso de `status` como state machine (draft/active/archived) já no protótipo
- **Consequências:** ✅ Preserva histórico; ✅ Consistente com state machine para FA-15; ⚠️ Listagem sempre precisa de filter `status != archived` por default

<!-- REVIEW: ADR-LOCAL-01 a ADR-LOCAL-04 são as 4 decisões desta SPEC. Falta alguma decisão relevante de implementação que deveria estar documentada aqui? -->

## 6. Segurança — Implementação da Caixa-preta

### 6.1. Middleware Next.js

```typescript
// middleware.ts (já existente no projeto)
// Adicionar matcher para /skills*
export const config = {
  matcher: ['/skills/:path*', '/clientes/:path*', '/biblioteca/:path*']
}

export function middleware(request: NextRequest) {
  const role = getUserRole(request); // resolve do JWT cookie
  if (!role || !['leader', 'admin'].includes(role)) {
    return NextResponse.redirect(new URL('/404', request.url));
  }
}
```

### 6.2. Dependency Guard (FastAPI)

```python
def require_skill_access(
    skill_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Skill:
    skill = db.query(Skill).filter(
        Skill.id == skill_id,
        Skill.status != 'archived'  # ou incluir archived para admin
    ).first()
    if not skill or current_user.role not in ('leader', 'admin'):
        raise HTTPException(status_code=404, detail="Not found")
    return skill
```
