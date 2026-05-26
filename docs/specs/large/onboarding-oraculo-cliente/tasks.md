---
spec-id: SPEC-015
slug: onboarding-oraculo-cliente
artefato: tasks
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-05-15
atualizada: 2026-05-15
versao: 1.0
---

# Tasks — FA-15 Onboarding com Oráculo do Cliente (SPEC-015)

## Resumo

| Total | A Fazer | Em Progresso | Concluídas |
|-------|---------|--------------|------------|
| 22 | 22 | 0 | 0 |

---

## FASE A — Foundation Backend

### TASK-A01: Migration SQL + SQLAlchemy models

- **Fase**: A
- **Escopo**: Criar migration SQL com `wiki_entities`, `entity_hitl_events`, `onboarding_jobs`; `ALTER TABLE clients` para `status`, `oracle_config`, `pre_active_since`; SQLAlchemy models correspondentes.
- **Arquivos**:
  - Criar: `api/onboarding/models.py`
  - Criar: `api/migrations/add_onboarding_tables.sql`
- **Depende de**: nenhuma
- **Vínculos**: design.md §2.1, RN-010, RN-012
- **Estimativa**: M
- **Status**: ⬜

### TASK-A02: Schemas Pydantic (onboarding)

- **Fase**: A
- **Escopo**: Todos os tipos Pydantic do módulo onboarding: `ClientCreate`, `ValidateEntityRequest`, `WikiEntityPatch`, `OnboardingStatus`, `WikiEntityResponse`, validadores custom (`require_content_for_edit`).
- **Arquivos**:
  - Criar: `api/onboarding/schemas.py`
  - Criar: `lib/onboarding-types.ts` (tipos TypeScript espelhando Pydantic)
- **Depende de**: TASK-A01
- **Vínculos**: spec.md §6.2, FR-180 a FR-185
- **Estimativa**: M
- **Status**: ⬜

### TASK-A03: Router base com stubs

- **Fase**: A
- **Escopo**: 8 endpoints REST com stubs (`raise NotImplementedError` ou mock response). Registrar em `api/main.py`. Include RBAC decorator stub.
- **Arquivos**:
  - Criar: `api/onboarding/__init__.py`
  - Criar: `api/onboarding/router.py`
  - Modificar: `api/main.py` (incluir router)
- **Depende de**: TASK-A02
- **Vínculos**: spec.md §6.1
- **Estimativa**: P
- **Status**: ⬜

### TASK-A04: Service layer — gate logic + HITL validation stubs

- **Fase**: A
- **Escopo**: `service.py` com funções stub: `create_client()`, `validate_entity()`, `get_onboarding_status()`, `get_wiki()`, `update_wiki_entity()`. Implementar apenas `check_pre_active_gate()` (bloqueia Skill/Workflow) e `all_entities_accepted()`.
- **Arquivos**:
  - Criar: `api/onboarding/service.py`
- **Depende de**: TASK-A03
- **Vínculos**: spec.md RF-06, CA-18, ADR-LOCAL-04
- **Estimativa**: M
- **Status**: ⬜

---

## FASE B — Oráculo Agent

### TASK-B01: Constants e prompts por entidade

- **Fase**: B
- **Escopo**: `ONTOLOGY_ENTITY_TYPES` enum, prompts de geração por entidade (system + user template com placeholders para drive context + web context + proveniência). Incluir validador de 100 palavras.
- **Arquivos**:
  - Criar: `api/oracle/__init__.py`
  - Criar: `api/oracle/constants.py`
- **Depende de**: nenhuma (paralelo com FASE A)
- **Vínculos**: spec.md RF-03, FR-182, constitution §1 princípio 5
- **Estimativa**: M
- **Status**: ⬜

### TASK-B02: Web search tool com allow-list enforcement

- **Fase**: B
- **Escopo**: Tool LangChain para pesquisa web que: (1) verifica domínio contra allow-list antes de fetch, (2) respeita `robots.txt Disallow`, (3) retorna `ProvenanceEntry` com URL + trecho + datetime.
- **Arquivos**:
  - Criar: `api/oracle/web_search.py`
- **Depende de**: TASK-B01
- **Vínculos**: spec.md RF-04, FR-183, RN-033, CA-20
- **Estimativa**: M
- **Status**: ⬜

### TASK-B03: EntityGenerator node LangGraph

- **Fase**: B
- **Escopo**: Node LangGraph que: (1) recebe documentos Drive (via ingestion processors existentes) + resultados web, (2) chama Gemini Flash com prompt da entidade, (3) valida ≥100 palavras, (4) extrai proveniência, (5) faz retry (max 2) se <100 palavras.
- **Arquivos**:
  - Criar: `api/oracle/entity_generator.py`
- **Depende de**: TASK-B01, TASK-B02
- **Vínculos**: spec.md RF-03, FR-182, constitution princípio 5
- **Estimativa**: G
- **Status**: ⬜

### TASK-B04: Oráculo StateGraph completo

- **Fase**: B
- **Escopo**: LangGraph StateGraph com: node_drive_sync (trigger, polling), nodes de geração por entidade (6 nodes), node de checkpoint (persiste em `onboarding_jobs`), retomada de job interrompido, tratamento de erro por entidade.
- **Arquivos**:
  - Criar: `api/oracle/agent.py`
- **Depende de**: TASK-B03
- **Vínculos**: spec.md §4.1, FR-182, ADR-LOCAL-02, ADR-LOCAL-03
- **Estimativa**: G
- **Status**: ⬜

### TASK-B05: BackgroundTask integration no router

- **Fase**: B
- **Escopo**: Conectar `POST /api/clients` ao disparo do Oráculo via `BackgroundTasks.add_task()`. Implementar `GET /api/clients/{slug}/onboarding/status` com dados reais de `onboarding_jobs`.
- **Arquivos**:
  - Modificar: `api/onboarding/router.py`
  - Modificar: `api/onboarding/service.py`
- **Depende de**: TASK-B04, TASK-A03
- **Vínculos**: spec.md RF-02, CA-04, CA-05, ADR-LOCAL-01
- **Estimativa**: M
- **Status**: ⬜

### TASK-B06: Testes unitários do Oráculo

- **Fase**: B
- **Escopo**: Testes pytest com mock de LLM (retorna string fixa) e mock de web search (retorna ProvenanceEntry fixa). Cobrir: geração das 6 entidades, allow-list enforcement, retry em <100 palavras, checkpoint em caso de falha.
- **Arquivos**:
  - Criar: `api/tests/test_oracle_agent.py`
- **Depende de**: TASK-B05
- **Vínculos**: CA-20, constitution §2 (qualidade)
- **Estimativa**: M
- **Status**: ⬜

---

## FASE C — HITL e Wizard

### TASK-C01: Service HITL completo + audit log

- **Fase**: C
- **Escopo**: Implementar `validate_entity()` completo: salva em `wiki_entities`, insere em `entity_hitl_events`, verifica se todas as 6 entidades aceitas → transição ACTIVE automática. `regenerate_entity()`: dispara Oráculo só para 1 entidade.
- **Arquivos**:
  - Modificar: `api/onboarding/service.py`
  - Modificar: `api/onboarding/router.py` (validate + regenerate endpoints)
- **Depende de**: TASK-B05, TASK-A04
- **Vínculos**: spec.md RF-05, RF-06, CA-07 a CA-11, CA-18, ADR-LOCAL-04, RN-032
- **Estimativa**: G
- **Status**: ⬜

### TASK-C02: Componentes Wizard (T-34)

- **Fase**: C
- **Escopo**: `WizardContainer.tsx` com step navigation, `WizardStep1Metadata.tsx` (slug validation inline), `WizardStep2Oracle.tsx` (allow-list editor), `WizardStep3Drive.tsx` (OAuth trigger), `WizardStep4Confirm.tsx`. Auto-save via localStorage (TTL 24h).
- **Arquivos**:
  - Criar: `components/onboarding/WizardContainer.tsx`
  - Criar: `components/onboarding/WizardStep1Metadata.tsx`
  - Criar: `components/onboarding/WizardStep2Oracle.tsx`
  - Criar: `components/onboarding/WizardStep3Drive.tsx`
  - Criar: `components/onboarding/WizardStep4Confirm.tsx`
- **Depende de**: TASK-A02 (tipos)
- **Vínculos**: spec.md RF-01, CA-01, CA-02, CA-03, T-34 (UX parte1)
- **Estimativa**: G
- **Status**: ⬜

### TASK-C03: Context + página wizard

- **Fase**: C
- **Escopo**: `OnboardingOraculoContext.tsx` com state do wizard + polling para status. Page `app/clientes/new/page.tsx` usando WizardContainer.
- **Arquivos**:
  - Criar: `contexts/OnboardingOraculoContext.tsx`
  - Criar: `app/clientes/new/page.tsx`
  - Modificar: `components/layout/Providers.tsx` (add OnboardingOraculoProvider)
- **Depende de**: TASK-C02
- **Vínculos**: spec.md §4.1, ADR-LOCAL-01 (polling 5s)
- **Estimativa**: M
- **Status**: ⬜

### TASK-C04: Tela de progresso T-35

- **Fase**: C
- **Escopo**: `OracleProgressPanel.tsx` com barra de progresso (6 entidades + drive sync), polling a cada 5s com backoff até 30s, auto-redirect para T-36 quando oracle_status=completed. Page `app/clientes/[slug]/onboarding/progress/page.tsx`.
- **Arquivos**:
  - Criar: `components/onboarding/OracleProgressPanel.tsx`
  - Criar: `app/clientes/[slug]/onboarding/progress/page.tsx`
- **Depende de**: TASK-C03
- **Vínculos**: spec.md RF-02, CA-04, CA-05, CA-06
- **Estimativa**: M
- **Status**: ⬜

### TASK-C05: Tela HITL T-36

- **Fase**: C
- **Escopo**: `EntityValidationCard.tsx` (conteúdo + proveniência expandida), `EntityActionBar.tsx` (Aceitar / Editar textarea / Rejeitar+Regenerar — SEM botão de pular). Page `app/clientes/[slug]/onboarding/validate/page.tsx` com navegação sequencial por entidade.
- **Arquivos**:
  - Criar: `components/onboarding/EntityValidationCard.tsx`
  - Criar: `components/onboarding/EntityActionBar.tsx`
  - Criar: `app/clientes/[slug]/onboarding/validate/page.tsx`
- **Depende de**: TASK-C03, TASK-C01
- **Vínculos**: spec.md RF-05, CA-07 a CA-11, RN-032
- **Estimativa**: G
- **Status**: ⬜

### TASK-C06: Gate PRE_ACTIVE no backend

- **Fase**: C
- **Escopo**: Middleware/dependency function que verifica `client.status != PRE_ACTIVE` antes de qualquer endpoint de Skill/Workflow. Se PRE_ACTIVE: HTTP 404 com `{"detail": "Cliente não disponível"}`.
- **Arquivos**:
  - Criar: `api/onboarding/guards.py`
  - Modificar: endpoints de Skill e Workflow (adicionar `Depends(require_active_client)`)
- **Depende de**: TASK-A04
- **Vínculos**: spec.md RF-06, CA-18, RN-009, constitution §1 princípio 2
- **Estimativa**: P
- **Status**: ⬜

---

## FASE D — Wiki Ontológica

### TASK-D01: Endpoints wiki no backend

- **Fase**: D
- **Escopo**: Implementar `GET /api/clients/{slug}/wiki` (404 para Operacional), `PATCH /api/clients/{slug}/wiki/{entity_type}` (edição inline), `GET /api/clients/{slug}/wiki/audit`. Audit log imutável.
- **Arquivos**:
  - Modificar: `api/onboarding/router.py`
  - Modificar: `api/onboarding/service.py`
- **Depende de**: TASK-C01
- **Vínculos**: spec.md RF-07, CA-12 a CA-17, RN-011, constitution §1 princípio 4
- **Estimativa**: M
- **Status**: ⬜

### TASK-D02: Componentes Wiki (T-39)

- **Fase**: D
- **Escopo**: `WikiPanel.tsx` (container com 6 entidades), `WikiEntityCard.tsx` (card expansível), `WikiEntityEditor.tsx` (editor inline textarea), `WikiEntityBadge.tsx` (seed_auto / hitl_reviewed / capture_update).
- **Arquivos**:
  - Criar: `components/wiki/WikiPanel.tsx`
  - Criar: `components/wiki/WikiEntityCard.tsx`
  - Criar: `components/wiki/WikiEntityEditor.tsx`
  - Criar: `components/wiki/WikiEntityBadge.tsx`
- **Depende de**: TASK-A02 (tipos)
- **Vínculos**: spec.md RF-07, CA-12 a CA-14, T-39 (UX parte1)
- **Estimativa**: G
- **Status**: ⬜

### TASK-D03: Context + página Wiki

- **Fase**: D
- **Escopo**: `WikiOntologicaContext.tsx` com load das 6 entidades + inline edit handler. Page `app/clientes/[slug]/wiki/page.tsx` com guard: redirect /404 se Operacional ou client.status != ACTIVE.
- **Arquivos**:
  - Criar: `contexts/WikiOntologicaContext.tsx`
  - Criar: `app/clientes/[slug]/wiki/page.tsx`
  - Modificar: `components/layout/Providers.tsx` (add WikiOntologicaProvider)
- **Depende de**: TASK-D02, TASK-D01
- **Vínculos**: spec.md RF-07, CA-15, CA-16, CA-17, RN-011
- **Estimativa**: M
- **Status**: ⬜

### TASK-D04: Link "Wiki" na sidebar do cliente

- **Fase**: D
- **Escopo**: Adicionar item de menu "Wiki Ontológica" na sidebar do cliente (`components/layout/Sidebar.tsx` ou equivalente) visível apenas para Admin/Curador quando `client.status === ACTIVE`.
- **Arquivos**:
  - Modificar: sidebar/nav relevante
- **Depende de**: TASK-D03
- **Vínculos**: spec.md RF-07, constitution §1 princípio 4
- **Estimativa**: P
- **Status**: ⬜

---

## FASE E — Integração e Piloto

### TASK-E01: Testes de integração (CAs completos)

- **Fase**: E
- **Escopo**: Testes pytest + httpx cobrindo: CA-01 (slug duplicado), CA-03 (disparo wizard), CA-07/08/09 (HITL ações), CA-10 (sem "aceitar tudo"), CA-11 (transição ACTIVE), CA-15 (caixa-preta 404), CA-18 (gate PRE_ACTIVE), CA-20 (allow-list). DB real de teste.
- **Arquivos**:
  - Criar: `api/tests/test_onboarding_integration.py`
  - Criar: `api/tests/test_wiki_rbac.py`
- **Depende de**: todas as fases anteriores
- **Vínculos**: spec.md §7 (todos os CAs)
- **Estimativa**: G
- **Status**: ⬜

### TASK-E02: TypeScript check + build verification

- **Fase**: E
- **Escopo**: `npx tsc --noEmit` sem erros. `npm run build` sem erros. Checar imports circulares entre contexts.
- **Arquivos**: nenhum novo
- **Depende de**: TASK-D04 (última task de código)
- **Vínculos**: CLAUDE.md convenções
- **Estimativa**: P
- **Status**: ⬜

### TASK-E03: Alerta Admin 72h + painel PRE_ACTIVE

- **Fase**: E
- **Escopo**: Background task periódica (ou hook no polling de status) que emite alerta in-app para Admin quando `pre_active_since ≥ 72h`. Adicionar contador de clientes PRE_ACTIVE no painel Admin.
- **Arquivos**:
  - Modificar: `api/onboarding/service.py`
  - Criar ou modificar: componente de notificações in-app existente
- **Depende de**: TASK-C01
- **Vínculos**: spec.md RF-06, CA-19, FR-185
- **Estimativa**: M
- **Status**: ⬜

<!-- REVIEW: As 22 tasks são implementáveis e testáveis isoladamente? A granularidade está adequada para pares ou agentes individuais? O total de ~6–7 dias/dev por fase parece realista para o Piloto? -->

---

## Prompt para Agente (por Task)

Cada task pode ser enviada individualmente ao agente de codificação:

> Implemente **{TASK-ID}: {título}**.
>
> Constitution: `docs/specs/large/onboarding-oraculo-cliente/constitution.md`
> Spec: `docs/specs/large/onboarding-oraculo-cliente/spec.md`
> Design: `docs/specs/large/onboarding-oraculo-cliente/design.md`
>
> Escopo desta task: {escopo}
> Arquivos a criar/modificar: {lista}
> Restrições da constitution: caixa-preta 404, HITL gate por entidade, allow-list enforced, zero `any` TypeScript
> Critérios de aceite a verificar: {lista dos CAs vinculados}

---

## Mapa CA ↔ Tasks

| CA | Descrição curta | Tasks |
|----|----------------|-------|
| CA-01 | Slug duplicado inline | C02 |
| CA-02 | Auto-save retomada 24h | C02, C03 |
| CA-03 | Disparo Oráculo → PRE_ACTIVE | C03, B05 |
| CA-04 | Progresso drive_sync | C04 |
| CA-05 | Redirect T-36 pós-seed | C04 |
| CA-06 | Alerta oracle_failed | E03 |
| CA-07 | HITL Aceitar | C05, C01 |
| CA-08 | HITL Editar+Aceitar (diff) | C05, C01 |
| CA-09 | HITL Rejeitar+Regenerar | C05, C01, B05 |
| CA-10 | Sem "Aceitar tudo" | C05 |
| CA-11 | 6ª entidade → ACTIVE | C01 |
| CA-12 | Wiki exibe 6 entidades | D03 |
| CA-13 | Badge hitl_reviewed | D02, C01 |
| CA-14 | PX-07 edita Wiki | D01, D02 |
| CA-15 | 404 Operacional (API) | D01 |
| CA-16 | redirect /404 Operacional (FE) | D03 |
| CA-17 | Wiki 404 se PRE_ACTIVE | D01, D03 |
| CA-18 | PRE_ACTIVE bloqueia Skill | C06 |
| CA-19 | Alerta Admin 72h | E03 |
| CA-20 | Allow-list enforcement | B02, B06 |

## Mapa Tasks ↔ FR/RN/ADR-LOCAL

| FR / RN / ADR | Tasks |
|---------------|-------|
| FR-180 (Wizard 4 passos) | C02, C03 |
| FR-181 (Drive sync trigger) | B05, C04 |
| FR-182 (Seed 6 entidades) | B01, B03, B04 |
| FR-183 (Allow-list web) | B02 |
| FR-184 (HITL gate) | C01, C05 |
| FR-185 (PRE_ACTIVE/ACTIVE gate) | A04, C01, C06 |
| RN-032 (HITL por entidade) | C01, C05, C06 |
| RN-033 (allow-list) | B02 |
| RN-011 (caixa-preta 404) | D01, D03 |
| RN-012 (auditoria) | C01, D01 |
| RN-010 (cross-client) | A01, D01 |
| ADR-LOCAL-01 (polling) | C03, C04 |
| ADR-LOCAL-02 (BackgroundTasks) | B05 |
| ADR-LOCAL-03 (LangGraph Oráculo) | B04 |
| ADR-LOCAL-04 (HITL backend) | A04, C01 |
| ADR-LOCAL-05 (Wiki = wiki_entities) | A01, D01 |
