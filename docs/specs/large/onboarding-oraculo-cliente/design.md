---
spec-id: SPEC-015
slug: onboarding-oraculo-cliente
artefato: design
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-05-15
atualizada: 2026-05-15
versao: 1.0
---

# Design — FA-15 Onboarding com Oráculo do Cliente (SPEC-015)

## 1. Arquitetura

### 1.1 Visão de Contexto

```
[PX-01 / PX-07 / Admin]
        │  HTTP (Next.js App Router)
        ▼
[sunOS Frontend — Next.js 14]
        │  REST API
        ▼
[sunOS Backend — FastAPI]
        ├── OnboardingRouter
        │       ├── Wizard CRUD
        │       ├── HITL Validation
        │       └── Wiki endpoints
        ├── OráculoAgent (LangGraph)
        │       ├── DriveDocProcessor (reutiliza api/chat/ingestion/)
        │       ├── WebSearchTool (allow-list enforced)
        │       └── EntityGenerator (Gemini Flash)
        └── JobQueue (FastAPI BackgroundTasks v1; Cloud Tasks v2)
                │
                ▼
        [Cloud SQL — PostgreSQL]
        [Drive Suno — OAuth read-only]
        [Gemini Flash API]
```

### 1.2 Componentes Frontend (novos)

```
app/
  clientes/
    new/
      page.tsx                  # Wizard entry (T-34)
    [clientSlug]/
      onboarding/
        progress/page.tsx       # T-35: Progresso Seed
        validate/page.tsx       # T-36: HITL gate
      wiki/
        page.tsx                # T-39: Wiki Ontológica

components/
  onboarding/
    WizardContainer.tsx         # Controla step navigation
    WizardStep1Metadata.tsx
    WizardStep2Oracle.tsx
    WizardStep3Drive.tsx
    WizardStep4Confirm.tsx
    OracleProgressPanel.tsx     # T-35: progresso do job
    EntityValidationCard.tsx    # T-36: card HITL por entidade
    EntityActionBar.tsx         # T-36: Aceitar / Editar / Rejeitar
  wiki/
    WikiPanel.tsx               # T-39: container da wiki
    WikiEntityCard.tsx          # card de entidade expansível
    WikiEntityEditor.tsx        # editor inline
    WikiEntityBadge.tsx         # badge seed/hitl/capture

contexts/
  OnboardingOraculoContext.tsx  # state do wizard + polling status
  WikiOntologicaContext.tsx     # state da wiki
```

### 1.3 Componentes Backend (novos)

```
api/
  onboarding/
    __init__.py
    router.py           # endpoints REST onboarding + wiki
    schemas.py          # Pydantic models (ClientCreate, ValidateEntity, etc.)
    service.py          # lógica de negócio (wizard, HITL, status gate)
    models.py           # SQLAlchemy (clients, wiki_entities, entity_hitl_events)
  oracle/
    __init__.py
    agent.py            # LangGraph StateGraph do Oráculo
    web_search.py       # tool de pesquisa web com allow-list enforcement
    entity_generator.py # geração de cada entidade via Gemini Flash
    constants.py        # ONTOLOGY_ENTITY_TYPES, ENTITY_PROMPTS
```

---

## 2. Modelo de Dados

### 2.1 Tabelas

```sql
-- Extensão da tabela clients existente
ALTER TABLE clients ADD COLUMN IF NOT EXISTS
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS
  oracle_config JSONB;           -- allow-list, profundidade, idiomas
ALTER TABLE clients ADD COLUMN IF NOT EXISTS
  pre_active_since TIMESTAMPTZ;  -- para alerta ≥72h

-- Entidades ontológicas
CREATE TABLE wiki_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  entity_type VARCHAR(30) NOT NULL,  -- ONTOLOGY_ENTITY_TYPES
  content TEXT NOT NULL,
  provenance JSONB NOT NULL DEFAULT '[]',  -- ProvenanceEntry[]
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  badge VARCHAR(30) NOT NULL DEFAULT 'seed_auto',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES users(id),
  UNIQUE(client_id, entity_type)
);
CREATE INDEX idx_wiki_entities_client ON wiki_entities(client_id);

-- Audit log HITL (append-only, sem DELETE)
CREATE TABLE entity_hitl_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  entity_type VARCHAR(30) NOT NULL,
  action VARCHAR(30) NOT NULL,        -- accept / edit_accept / reject_regenerate
  before_content TEXT,
  after_content TEXT,
  user_id UUID NOT NULL,
  timestamp_utc TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_hitl_events_client ON entity_hitl_events(client_id, entity_type);

-- Status do job de onboarding
CREATE TABLE onboarding_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  drive_sync_status VARCHAR(20) DEFAULT 'pending',
  oracle_status VARCHAR(20) DEFAULT 'pending',
  current_entity VARCHAR(30),         -- entidade sendo processada
  entities_done INTEGER DEFAULT 0,
  error_detail TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  eta_hours INTEGER DEFAULT 24
);
```

### 2.2 Relacionamentos

```
clients (1) ──── (6) wiki_entities
clients (1) ──── (N) entity_hitl_events
clients (1) ──── (1) onboarding_jobs
```

---

## 3. Decisões Técnicas (ADR-LOCAL)

### ADR-LOCAL-01: Polling vs. SSE para progresso do Oráculo

- **Status**: Aceita
- **Contexto**: Oráculo leva até 30 min. UI precisa mostrar progresso em tempo real.
- **Decisão**: Polling simples via `GET /api/clients/{slug}/onboarding/status`. Intervalo 5s com backoff até 30s. Sem SSE na v1.
- **Alternativas rejeitadas**: SSE — adiciona complexidade de gestão de conexão e CORS; WebSocket — overhead desnecessário para este caso.
- **Consequências**: ✅ Simples de implementar e depurar. ⚠️ Até 5s de lag entre geração e exibição da entidade.

### ADR-LOCAL-02: FastAPI BackgroundTasks vs. Cloud Tasks para job do Oráculo

- **Status**: Aceita (v1 Piloto)
- **Contexto**: Job pode durar 30 min. Cloud Run tem timeout de 3600s, mas BackgroundTasks termina com o processo se Cloud Run reiniciar.
- **Decisão**: FastAPI BackgroundTasks para v1 (Piloto). Cloud Tasks ou Pub/Sub em v2 (MVP).
- **Alternativas rejeitadas**: Cloud Tasks — adiciona overhead de configuração; o Piloto tem poucos clientes e baixo risco de reinício.
- **Consequências**: ✅ Zero infra adicional para o Piloto. ⚠️ Job pode perder progresso em reinício de instância — mitigado por checkpoint em `onboarding_jobs.current_entity` (retomada).

### ADR-LOCAL-03: LangGraph para Oráculo vs. cadeia linear

- **Status**: Aceita
- **Contexto**: Oráculo precisa: gerar 6 entidades, fazer pesquisa web, ter retry por entidade, rastrear estado.
- **Decisão**: LangGraph StateGraph com um node por entidade + nodes de pesquisa web. Estado persistido em `onboarding_jobs`.
- **Alternativas rejeitadas**: Cadeia linear sequencial — dificulta retry seletivo por entidade e paralelização futura.
- **Consequências**: ✅ Retry por entidade (CA-09). ✅ Paralelização futura possível sem reescrever arquitetura. ⚠️ Curva de aprendizado do LangGraph para devs novos.

### ADR-LOCAL-04: HITL gate block no backend (não só UI)

- **Status**: Aceita
- **Contexto**: RN-032 exige que nenhuma entidade seja pulada. UI poderia bloquear, mas o contrato real é no backend.
- **Decisão**: `service.py` verifica `wiki_entities WHERE client_id = X AND status != 'accepted'` antes de qualquer transição PRE_ACTIVE → ACTIVE. Frontend não confia em seu próprio state.
- **Alternativas rejeitadas**: Block apenas na UI — frágil, bypassável via API direta.
- **Consequências**: ✅ RN-032 enforced server-side. ⚠️ Query adicional em toda validação de entidade (aceitável — pequeno número de entidades).

### ADR-LOCAL-05: Wiki como view das wiki_entities (não docs separados)

- **Status**: Aceita
- **Contexto**: Wiki poderia ser implementada como documentos na Biblioteca ou como entidades separadas.
- **Decisão**: Wiki é a view das `wiki_entities` do cliente — mesmo modelo de dados que o Oráculo popula. A API da Biblioteca (`/api/knowledge/`) não é usada para entidades ontológicas.
- **Alternativas rejeitadas**: Usar a Biblioteca — misturaria entidades ontológicas com documentos de referência, complicando o caixa-preta e o RBAC.
- **Consequências**: ✅ Modelo limpo. ✅ RBAC simples (client_id + role check). ⚠️ Wiki não aparece em buscas da Biblioteca (desejável — caixa-preta).

---

## 4. Diagramas de Fluxo

### 4.1 Sequência: Disparo do Wizard → ACTIVE

```
PX-01            Frontend           Backend           Oráculo (BG)
  |                  |                 |                    |
  |-- POST /clientes → -------------- |                    |
  |                  |  {slug, status: PRE_ACTIVE, job_id} |
  |                  |← --------------|                    |
  |                  |                |-- bg task -------->|
  |  <T-35 polling> |                |                    |
  |                  |-- GET /status --→                   |
  |                  |← {drive:running}|                   |
  |                  |-- GET /status --→                   |
  |                  |← {drive:done, oracle:running, entities:{PROFILE:generated,...}}
  |                  |                |←-- oracle done -----|
  |  <redirect T-36>|                |                    |
  |-- validate PROFILE (accept) ---→|                    |
  |                  |← {status: accepted, next: MARKET}  |
  |  ... (6 entidades) ...          |                    |
  |-- validate LEGAL (accept) ----→|                    |
  |                  |←{status:accepted, client_status:ACTIVE, redirect:/wiki}
  |  <redirect T-39>|                |                    |
```

### 4.2 Sequência: Rejeição e Regeneração

```
PX-01            Frontend           Backend           Oráculo (BG)
  |                  |                 |                    |
  |-- reject COMPETITORS → --------- |                    |
  |                  |← {entity:regenerating}              |
  |                  |                |-- bg regen ------->|
  |  <aguarda>       |-- GET /status --→                   |
  |                  |← {COMPETITORS: generated}           |
  |                  |                |←-- regen done ------|
  |  <nova versão>   |                |                    |
  |-- accept COMPETITORS (nova) --→|                    |
```

---

## 5. Estratégia de Testes

| Nível | Escopo | Framework | Cobertura |
|-------|--------|-----------|-----------|
| Unitário | `service.py` (gate logic, HITL validation), `oracle/constants.py` | pytest | 90%+ em funções críticas |
| Integração | Endpoints REST (wizard CRUD, validate, wiki) + DB | pytest + httpx + SQLAlchemy test session | Todos os CAs |
| Mock Oráculo | BackgroundTask com mock de LangGraph agent | pytest + unittest.mock | Fluxo de progresso completo |
| E2E (manual Piloto) | JN-13 completo com cliente real | Manual | Happy path + CA-15 (caixa-preta) |

**Nota**: testes de integração usam banco de dados real (test database), não mock de DB. Pattern estabelecido em `api/tests/` existente.

<!-- REVIEW: A arquitetura faz sentido para as restrições do projeto? Pontos de atenção: (1) BackgroundTasks para job longo de 30 min — ok para Piloto? (2) Polling 5s — aceitável para UX de T-35? (3) Modelo de dados com ALTER TABLE clients — cobre necessidade sem migration destrutiva? -->
