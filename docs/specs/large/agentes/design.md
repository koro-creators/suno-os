---
spec-id: SPEC-021
slug: agentes
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
  contexto: "Arquitetura de componentes, modelo de dados, API endpoints e decisões de design para a feature Agentes (FA-17)."
upstream:
  - docs/prd/parte1-feature-map.md (FA-17)
  - docs/specs/large/agentes/spec.md
  - docs/specs/large/skills-admin/design.md (padrão junction)
  - docs/specs/large/clientes-admin/design.md (ADR-LOCAL-02 junction skill_clients)
  - api/models/conversation.py (padrão SQLAlchemy)
---

# Design — SPEC-021 — Agentes

## 1. Visão Geral da Arquitetura

```
Browser (Next.js 14)                    FastAPI + PostgreSQL + GCS
─────────────────────                   ──────────────────────────
/agentes                                GET  /api/agents
  └── AgentesPage                       POST /api/agents
        ├── AgentesCards                GET  /api/agents/{id}
        └── AgentDrawer (preview)       PATCH /api/agents/{id}
                                        DELETE /api/agents/{id}  (soft)

/agentes/new                            POST /api/agents/{id}/permissions/{client_id}
  └── AgentNewPage                      DELETE /api/agents/{id}/permissions/{client_id}
        └── AgentNewForm                GET  /api/agents/{id}/skills
                                        POST /api/agents/{id}/skills/{skill_slug}
/agentes/[agentId]                      DELETE /api/agents/{id}/skills/{skill_slug}
  └── AgentEditorPage                   GET  /api/agents/{id}/apps
        └── AgenteEditorTabs            POST /api/agents/{id}/apps
              ├── ConfiguracaoTab       DELETE /api/agents/{id}/apps/{connection_id}
              ├── SkillsTab             GET  /api/agents/{id}/memory-files
              ├── AppsTab               POST /api/agents/{id}/memory-files
              ├── MemoriaTab            DELETE /api/agents/{id}/memory-files/{file_id}
              ├── AgendamentoTab        GET  /api/agents/{id}/schedule
              ├── AtividadeTab          PUT  /api/agents/{id}/schedule
              └── ClientesTab           POST /api/agents/{id}/run
                                        GET  /api/agents/{id}/runs
                                        GET  /api/agents/{id}/runs/{run_id}
```

**AgentsContext** permanece ativo com mock-data no protótipo. Em produção, componentes migram para SWR/fetch direto. Context mantido como fallback mock-mode.

## 2. Modelo de Dados

### 2.1. Tabela `agents`

```sql
CREATE TABLE agents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120) NOT NULL,
  icon          VARCHAR(100) NOT NULL DEFAULT '🤖',  -- emoji ou texto
  instructions  TEXT NOT NULL DEFAULT '',             -- system prompt do agente
  status        VARCHAR(20)  NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','active','inactive','archived')),
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agents_status     ON agents(status);
CREATE INDEX idx_agents_created_by ON agents(created_by);
```

### 2.2. Tabela `agent_client_permissions`

```sql
CREATE TABLE agent_client_permissions (
  agent_id    UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  granted_by  UUID REFERENCES users(id),
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (agent_id, client_id)
);

CREATE INDEX idx_agent_perms_client ON agent_client_permissions(client_id);
```

### 2.3. Tabela `agent_skill_assignments`

```sql
CREATE TABLE agent_skill_assignments (
  agent_id    UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  skill_slug  VARCHAR(80) NOT NULL,    -- FK lógica para skills.slug
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (agent_id, skill_slug)
);
```

**Nota:** `skill_slug` é FK lógica (não constraint física) — mesma decisão de `skill_clients`. Permite manutenção sem cascade complexo.

### 2.4. Tabela `agent_app_connections`

```sql
CREATE TABLE agent_app_connections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  app_type     VARCHAR(50) NOT NULL,   -- 'google_drive', 'gmail', 'notion', etc.
  config       JSONB NOT NULL DEFAULT '{}',  -- segredos cifrados no backend; NUNCA retornar ao frontend
  enabled      BOOLEAN NOT NULL DEFAULT true,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_id, app_type)
);
```

### 2.5. Tabela `agent_memory_files`

```sql
CREATE TABLE agent_memory_files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  filename     VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  gcs_path     TEXT NOT NULL UNIQUE,    -- gs://bucket/agents/{agent_id}/memory/{uuid}/{filename}
  size_bytes   INT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_memory_files_agent ON agent_memory_files(agent_id);
```

### 2.6. Tabela `agent_schedules`

```sql
CREATE TABLE agent_schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE UNIQUE,
  frequency     VARCHAR(20) NOT NULL CHECK (frequency IN ('hourly','daily')),
  days_of_week  INT[] DEFAULT NULL,      -- 0=Dom, 1=Seg, ..., 6=Sáb; null = todos os dias
  time_of_day   TIME DEFAULT NULL,        -- para 'daily'
  minute_offset INT DEFAULT 0,           -- para 'hourly' (0-59)
  timezone      VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
  enabled       BOOLEAN NOT NULL DEFAULT false,
  last_run_at   TIMESTAMPTZ,
  next_run_at   TIMESTAMPTZ
);
```

### 2.7. Tabela `agent_runs`

```sql
CREATE TABLE agent_runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id         UUID NOT NULL REFERENCES agents(id),
  client_id        UUID,                  -- cliente no contexto da execução (nullable para runs globais)
  triggered_by     VARCHAR(20) NOT NULL CHECK (triggered_by IN ('manual','schedule')),
  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','running','completed','failed','timed_out')),
  input            JSONB NOT NULL DEFAULT '{}',
  output           JSONB,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at      TIMESTAMPTZ,
  duration_ms      INT,
  error_message    TEXT,
  scheduled_run_at TIMESTAMPTZ           -- só para triggered_by='schedule'
);

-- Idempotência de schedule (constitution §1.5)
CREATE UNIQUE INDEX idx_agent_runs_schedule_idem
  ON agent_runs(agent_id, scheduled_run_at)
  WHERE triggered_by = 'schedule';

CREATE INDEX idx_agent_runs_agent    ON agent_runs(agent_id, started_at DESC);
CREATE INDEX idx_agent_runs_status   ON agent_runs(status);
```

### 2.8. Tabela `preview_runs` (TTL 1h)

```sql
CREATE TABLE preview_runs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    UUID NOT NULL REFERENCES agents(id),
  status      VARCHAR(20) NOT NULL DEFAULT 'pending',
  input       JSONB NOT NULL DEFAULT '{}',
  output      JSONB,
  error_message TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 hour')
);

CREATE INDEX idx_preview_runs_agent   ON preview_runs(agent_id);
CREATE INDEX idx_preview_runs_expires ON preview_runs(expires_at);
-- Limpeza: DELETE FROM preview_runs WHERE expires_at < now() (job background)
```

## 3. API Endpoints

### 3.1. Agentes CRUD

```
GET /api/agents
  Query: status?, q?, page?, per_page?
  Auth: P3, P4 (Operacional → 404)
  Response: { items: AgentSummary[], total: int }
  AgentSummary: { id, name, icon, status, skill_count, client_count, last_run_at }

GET /api/agents/{agent_id}
  Auth: P3, P4
  Response: AgentDetail (sem config de apps)

POST /api/agents
  Body: AgentCreate { name, icon?, instructions, status? }
  Auth: P3, P4
  Response 201: AgentDetail

PATCH /api/agents/{agent_id}
  Body: AgentUpdate { name?, icon?, instructions?, status? }
  Auth: P3, P4
  Response 200: AgentDetail
  Note: status='archived' via este endpoint = soft delete

DELETE /api/agents/{agent_id}
  Auth: P4 (apenas admin)
  Response 200: { status: 'archived' }
  Note: alias para PATCH { status: 'archived' }
```

### 3.2. Permissões por Cliente

```
GET /api/agents/{agent_id}/permissions
  Auth: P3, P4
  Response: AgentPermission[] { client_id, client_name, granted_by_name, granted_at }

POST /api/agents/{agent_id}/permissions/{client_id}
  Auth: P3, P4
  Response 201: AgentPermission
  Error 409: se permissão já existe

DELETE /api/agents/{agent_id}/permissions/{client_id}
  Auth: P3, P4
  Response 204
```

### 3.3. Skills

```
GET  /api/agents/{agent_id}/skills
  Response: AgentSkill[] { skill_slug, skill_name, skill_type, assigned_at }

POST /api/agents/{agent_id}/skills/{skill_slug}
  Response 201: AgentSkill
  Error 404: se skill não existe ou não é ACTIVE
  Error 409: se já associada

DELETE /api/agents/{agent_id}/skills/{skill_slug}
  Response 204
```

### 3.4. Apps

```
GET  /api/agents/{agent_id}/apps
  Response: AppConnection[] { id, app_type, enabled, connected_at }  -- sem 'config'

POST /api/agents/{agent_id}/apps
  Body: { app_type, config }  -- config fica no backend
  Response 201: AppConnection (sem config)

PATCH /api/agents/{agent_id}/apps/{connection_id}
  Body: { enabled? }
  Response 200: AppConnection

DELETE /api/agents/{agent_id}/apps/{connection_id}
  Response 204
```

### 3.5. Memory Files

```
GET  /api/agents/{agent_id}/memory-files
  Response: MemoryFile[] { id, filename, content_type, size_bytes, created_at }
  Note: sem gcs_path, sem URL direta

POST /api/agents/{agent_id}/memory-files
  Body: multipart/form-data { file }
  Limits: ≤25MB, tipos: text/plain, text/markdown, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
  Limit check: count existente + 1 ≤ 10
  Response 201: MemoryFile

DELETE /api/agents/{agent_id}/memory-files/{file_id}
  Response 204
  Note: deleta do GCS e do DB

GET /api/agents/{agent_id}/memory-files/{file_id}/download
  Response 302: redirect para Signed URL GCS com TTL 15min
```

### 3.6. Schedule

```
GET /api/agents/{agent_id}/schedule
  Response: AgentSchedule | null

PUT /api/agents/{agent_id}/schedule
  Body: AgentScheduleConfig { frequency, days_of_week?, time_of_day?, minute_offset?, timezone, enabled }
  Response 200: AgentSchedule
  Note: upsert — cria ou atualiza
```

### 3.7. Execução

```
POST /api/agents/{agent_id}/run
  Body: AgentRunRequest { triggered_by: 'manual'|'preview', input?: dict, client_id?: str, scheduled_for?: ISO8601 }
  Auth: P3, P4
  Pre-checks:
    - agent.status = 'active' (ou 'draft' para preview)
    - client_id in agent_client_permissions (se client_id informado e triggered_by != 'preview')
  Response 202: { run_id: str, status: 'pending' }
  Preview: persiste em preview_runs, não em agent_runs

GET /api/agents/{agent_id}/runs
  Query: page?, per_page?, status?
  Response: { items: AgentRun[], total: int }

GET /api/agents/{agent_id}/runs/{run_id}
  Response: AgentRun (com output completo)
```

## 4. Componentes Frontend

### 4.1. Estrutura de Arquivos

```
lib/
  agents-types.ts            — interfaces: Agent, AgentSummary, AgentDetail, AgentCreate,
                               AgentUpdate, AgentPermission, AgentSkill, AppConnection,
                               MemoryFile, AgentSchedule, AgentRun, AgentStatus

data/
  agents-admin.ts            — mock data: 3 agentes de exemplo com diferentes status

contexts/
  AgentsContext.tsx          — CRUD mock + apiAvailable() fallback

components/admin/agentes/
  AgentesCards.tsx           — grid de cards com status badge, skill_count, client_count
  AgentDrawer.tsx            — side drawer de preview (mesmo padrão ClientDrawer)
  AgentNewForm.tsx           — form de criação: nome, ícone (emoji picker simples), instruções, status inicial
  AgenteEditorTabs.tsx       — container das 7 tabs (array TABS + activeTab state)
  tabs/
    ConfiguracaoTab.tsx      — nome, ícone, instruções, status, botão arquivar
    SkillsTab.tsx            — lista Skills ACTIVE com toggles
    AppsTab.tsx              — lista apps com toggle enable/disable
    MemoriaTab.tsx           — upload drag-and-drop + lista de arquivos + delete
    AgendamentoTab.tsx       — frequency radio, days checkboxes, time input, timezone select, enabled toggle
    AtividadeTab.tsx         — tabela agent_runs com paginação, detalhe inline
    ClientesTab.tsx          — lista permissões + dropdown autorizar cliente + revogar

app/agentes/
  page.tsx                   — /agentes (listagem com filtros + search + Novo Agente)
  new/page.tsx               — /agentes/new (form criação)
  [agentId]/page.tsx         — /agentes/[agentId] (editor com 7 tabs)
```

### 4.2. Status Badge

```typescript
const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string }> = {
  draft:    { label: 'Rascunho', color: 'var(--text-muted)' },
  active:   { label: 'Ativo',    color: 'var(--sun)' },
  inactive: { label: 'Inativo',  color: 'var(--text-secondary)' },
  archived: { label: 'Arquivado',color: 'var(--text-muted)' },
};
```

### 4.3. Sidebar

Adicionar item após Workflows:

```typescript
{
  label: 'Agentes',
  href: '/agentes',
  icon: Bot,          // Lucide Bot icon (ou BotMessageSquare)
  adminOnly: true,
}
```

### 4.4. Emoji Picker (simples)

Não usar biblioteca externa. Implementar seletor simples com 20 emojis pré-selecionados + input text livre:

```typescript
const AGENT_ICON_PRESETS = [
  '🤖', '🧠', '⚡', '🎯', '📊', '✍️', '🎨', '📋',
  '🔍', '📬', '💡', '🛠️', '📣', '📈', '🗓️', '🔗',
  '🌐', '🧩', '🚀', '⭐'
];
```

## 5. Backend — Runtime do Agente (Fase C+)

### 5.1. LangGraph StateGraph

```python
# api/agents/graph.py
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI

class AgentState(TypedDict):
    messages: list[BaseMessage]
    agent_id: str
    memory_context: str   # conteúdo dos memory files concatenados
    available_tools: list  # LangChain tools das Skills associadas

def build_agent_graph(agent: Agent, skill_tools: list, memory_context: str) -> CompiledGraph:
    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash")
    llm_with_tools = llm.bind_tools(skill_tools)
    graph = StateGraph(AgentState)
    graph.add_node("agent", lambda s: {"messages": [llm_with_tools.invoke(s["messages"])]})
    graph.add_node("tools", ToolNode(skill_tools))
    graph.add_conditional_edges("agent", should_continue, {"continue": "tools", "end": END})
    graph.add_edge("tools", "agent")
    graph.set_entry_point("agent")
    return graph.compile()
```

### 5.2. Memory Files como Contexto

```python
# api/agents/memory.py
async def load_memory_context(agent_id: str, db: Session) -> str:
    """Concatena conteúdo de memory files como contexto de sistema."""
    files = db.query(AgentMemoryFile).filter_by(agent_id=agent_id).all()
    context_parts = []
    for f in files:
        content = await read_gcs_object(f.gcs_path)
        context_parts.append(f"--- {f.filename} ---\n{content}")
    return "\n\n".join(context_parts)
```

### 5.3. Skill como LangChain Tool

```python
# api/agents/skill_loader.py
def skill_to_tool(skill_slug: str, db: Session) -> BaseTool:
    """Converte Skill sunOS em LangChain tool invocável pelo agente."""
    skill = db.query(Skill).filter_by(slug=skill_slug, status='ACTIVE').first()
    if not skill:
        return None
    # Skill vira tool que chama /api/chat com skill context
    return StructuredTool.from_function(
        func=lambda input: call_skill_api(skill_slug, input),
        name=skill.slug,
        description=skill.description[:200] if skill.description else skill.name,
    )
```

## 6. Decisões Locais

### ADR-LOCAL-01 — Agentes globais (não per-client) com permission table

- **Status:** Aceita (v1.0) — confirmado pelo usuário
- **Contexto:** Skills são per-client (usadas dentro do namespace de cada cliente). Agentes precisam ser reutilizáveis cross-client — o mesmo agente pode ser autorizado para múltiplos clientes sem duplicação.
- **Decisão:** `agents` em namespace global. `agent_client_permissions(agent_id, client_id)` é o gate de autorização de execução. Sem `client_id` em `agents`.
- **Alternativas rejeitadas:**
  - *Per-client como Skills*: exigiria duplicar agente por cliente; inviável para uso cross-client
  - *Permissão global implícita*: viola caixa-preta e princípio de lesser privilege
- **Consequências:** ✅ Reutilização cross-client; ✅ RBAC explícito e auditável; ⚠️ Frontend admin precisa exibir "para quais clientes este agente está autorizado" — nova Tab Clientes

### ADR-LOCAL-02 — Schedule: stub APScheduler (Fase C) → Cloud Scheduler (Fase D)

- **Status:** Aceita (v1.0)
- **Contexto:** Cloud Scheduler exige projeto GCP configurado e service account com permissão de invocar Cloud Run. PRE-04 não está resolvido. Para Fase C (protótipo rodando em Cloud Run), precisamos de schedule funcional sem esperar infra de produção.
- **Decisão:** Fase C usa `APScheduler` in-process (adicional como dep Python backend). Fase D migra para Cloud Scheduler criando um `Job` via API com HTTP target apontando para `/api/agents/{id}/run?scheduled_for=<ISO8601>`. A lógica de idempotência (índice único parcial em `agent_runs`) funciona em ambas as abordagens.
- **Alternativas rejeitadas:**
  - *Cron frontend*: JavaScript cron não executa quando browser está fechado
  - *Celery/Redis*: overhead de infra; Redis não está no stack atual
- **Consequências:** ✅ Schedule funcional em Fase C sem infra extra; ⚠️ Migração Fase C→D exige criação de Cloud Scheduler Jobs para cada `agent_schedule.enabled=true`; ⚠️ APScheduler em-processo perde schedules ao reiniciar a instância — aceitável para protótipo, não para produção

### ADR-LOCAL-03 — Memory files em GCS (não inline no DB)

- **Status:** Aceita (v1.0) — mesmo padrão de `meeting_captures` em SPEC-016
- **Decisão:** `agent_memory_files.gcs_path` armazena apenas o caminho. Backend gera Signed URL TTL 15min para acesso. Binário nunca em DB ou response de API.
- **Consequências:** ✅ DB não infla com BLOBs; ✅ GCS lifecycle policy pode limpar arquivos de agentes arquivados; ⚠️ PRE-01 (bucket + IAM) é pré-condição para upload real funcionar

### ADR-LOCAL-04 — `status='draft'` para agentes em construção

- **Status:** Aceita (v1.0)
- **Contexto:** Precisamos de estado intermediário para agentes que estão sendo configurados mas ainda não prontos para execução. `inactive` poderia ser usado, mas semânticamente significa "já foi ativo, foi pausado".
- **Decisão:** `draft` = em construção, nunca foi ativado. Transição `draft→active` = ativação inicial. `inactive` = já foi ativo, foi pausado temporariamente.
- **Consequências:** ✅ State machine explícita e semântica clara; ✅ Preview funciona em `draft` para validação antes de ativar; ⚠️ Frontend precisa tratar 4 estados no badge

### ADR-LOCAL-05 — `skill_slug` como FK lógica (não constraint física) em `agent_skill_assignments`

- **Status:** Aceita (v1.0) — mesmo padrão de `skill_clients` em SPEC-017
- **Decisão:** `agent_skill_assignments.skill_slug` não tem constraint `REFERENCES skills(slug)` no banco. Validação ocorre no backend: `GET /api/agents/{id}/skills/{slug}` verifica que skill existe e está ACTIVE.
- **Consequências:** ✅ Deletar skill não cascada agentes (comportamento desejado: agente perde a tool mas não é deletado); ⚠️ Possibilidade de agente com skill_slug inválida — runtime deve tolerar (ignorar skill inexistente no momento da execução)

<!-- REVIEW: ADR-LOCAL-01 a ADR-LOCAL-05 cobrem todas as decisões desta SPEC? Avaliar se precisamos ADR para o emoji picker (sem dependência externa) e para o padrão de polling vs. SSE no frontend para status de runs. -->

## 7. Segurança — Caixa-preta

### 7.1. Middleware Next.js

```typescript
// middleware.ts — adicionar ao matcher existente
export const config = {
  matcher: ['/skills/:path*', '/clientes/:path*', '/biblioteca/:path*', '/agentes/:path*']
}
```

### 7.2. Dependency Guard (FastAPI)

```python
def require_agent_access(
    agent_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Agent:
    # Operacional recebe 404 antes mesmo de verificar se agente existe
    if current_user.role == 'operacional':
        raise HTTPException(status_code=404, detail="Not found")
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent or agent.status == 'archived' and current_user.role != 'admin':
        raise HTTPException(status_code=404, detail="Not found")
    return agent
```
