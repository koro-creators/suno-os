---
spec-id: SPEC-015
slug: onboarding-oraculo-cliente
artefato: plan
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-05-15
atualizada: 2026-05-15
versao: 1.0
---

# Plano de Implementação — FA-15 Onboarding com Oráculo do Cliente (SPEC-015)

## 1. Stack Tecnológica

| Camada | Tecnologia | Versão | Justificativa |
|--------|-----------|--------|---------------|
| Frontend pages | Next.js App Router | 14 | Padrão do projeto |
| Frontend state | React Context | — | OnboardingOraculoContext, WikiOntologicaContext |
| Frontend UI | Inline styles + Lucide React | — | Padrão do projeto |
| Backend API | FastAPI | 0.110+ | Padrão do projeto |
| Async jobs | FastAPI BackgroundTasks | — | v1 Piloto (ver ADR-LOCAL-02) |
| Agent | LangGraph StateGraph | 0.2+ | Oráculo Deep Agent (ver ADR-LOCAL-03) |
| LLM | Gemini Flash (LangChain) | — | Padrão de custo/performance |
| DB | PostgreSQL (Cloud SQL shared) | 15 | Padrão do projeto |
| ORM | SQLAlchemy | 2.x | Padrão do projeto |
| Validação | Pydantic v2 | 2.x | Padrão do projeto |

---

## 2. Fases de Implementação

### Fase A — Foundation Backend (estimativa: 3–4 dias)
⚠️ **BLOQUEADA POR PRE-03**: FA-14 Drive OAuth deve estar implementado antes do passo 3 do wizard.

- **Objetivo**: Schema de DB, modelos SQLAlchemy, schemas Pydantic, router base sem lógica de Oráculo
- **Entregáveis**:
  - Migration SQL (`wiki_entities`, `entity_hitl_events`, `onboarding_jobs`, `ALTER TABLE clients`)
  - `api/onboarding/schemas.py` — todos os tipos Pydantic
  - `api/onboarding/models.py` — SQLAlchemy models
  - `api/onboarding/router.py` — endpoints com stubs (POST /clients, GET /status, etc.)
  - `api/onboarding/service.py` — funções stub com TODO comments

### Fase B — Oráculo Agent (estimativa: 4–6 dias)

- **Objetivo**: Oráculo LangGraph gerando as 6 entidades com proveniência
- **Pré-requisitos**: Fase A completa
- **Entregáveis**:
  - `api/oracle/constants.py` — ONTOLOGY_ENTITY_TYPES + prompts por entidade
  - `api/oracle/web_search.py` — tool com allow-list enforcement
  - `api/oracle/entity_generator.py` — node LangGraph por entidade
  - `api/oracle/agent.py` — StateGraph completo
  - Job BackgroundTask integrado ao router
  - Testes unitários do agent (mock LLM + mock web search)

### Fase C — HITL e Wizard (estimativa: 3–4 dias)

- **Objetivo**: Wizard frontend completo + HITL gate funcional
- **Pré-requisitos**: Fase B completa
- **Entregáveis**:
  - `api/onboarding/service.py` — lógica completa de HITL (validate, audit log, gate PRE_ACTIVE → ACTIVE)
  - `components/onboarding/` — todos os componentes frontend (T-34, T-35, T-36)
  - `contexts/OnboardingOraculoContext.tsx` — polling + wizard state
  - Pages: `app/clientes/new/page.tsx`, `app/clientes/[slug]/onboarding/progress/page.tsx`, `app/clientes/[slug]/onboarding/validate/page.tsx`
  - Caixa-preta: middleware/guard para PRE_ACTIVE block

### Fase D — Wiki Ontológica (estimativa: 2–3 dias)

- **Objetivo**: Wiki visível pós-ACTIVE, edição inline, caixa-preta para Operacional
- **Pré-requisitos**: Fase C completa
- **Entregáveis**:
  - `api/onboarding/router.py` — endpoints wiki (GET, PATCH, audit)
  - `components/wiki/` — WikiPanel, WikiEntityCard, WikiEntityEditor, WikiEntityBadge
  - `contexts/WikiOntologicaContext.tsx`
  - Page: `app/clientes/[slug]/wiki/page.tsx`
  - Caixa-preta 404 para Operacional (CA-15, CA-16)
  - Sidebar link "Wiki" em `/clientes/[slug]` (somente para Admin/Curador)

### Fase E — Integração e Piloto (estimativa: 2–3 dias)

- **Objetivo**: Integração completa, smoke tests, runbook, monitoramento básico
- **Pré-requisitos**: Fases A–D completas + cliente piloto acordado (PRE-02)
- **Entregáveis**:
  - Testes de integração cobrindo todos os CAs
  - `npx tsc --noEmit` sem erros
  - Runbook de onboarding (como rodar o wizard com cliente real)
  - Alerta Admin 72h implementado e testado
  - Deploy staging + smoke test JN-13 ponta-a-ponta

---

## 3. Sequência e Dependências

```
Fase A (Foundation Backend)
  │
  ├──► Fase B (Oráculo Agent) ─────────────────────────────────┐
  │                                                             │
  └──► [PRE-03: FA-14 Drive OAuth disponível] ─────────────────►Fase C (HITL + Wizard)
                                                                │
                                                                └──► Fase D (Wiki)
                                                                       │
                                                                       └──► Fase E (Piloto)
```

**Fases B e C podem iniciar em paralelo** se FA-14 Drive OAuth já estiver disponível quando Fase A terminar.

---

## 4. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| FA-14 Drive OAuth não pronto a tempo | Média | Alto | Wizard passo 3 pode ser mockado (OAuth fake) no Piloto se necessário; Drive sync inicia quando FA-14 estiver pronto |
| Oráculo leva >30 min para clientes com Drive grande | Média | Médio | Processamento em lotes com checkpoint; usuário pode fechar e retornar |
| BackgroundTask morto por reinício do Cloud Run | Baixa | Médio | Checkpoint em `onboarding_jobs.current_entity`; job retomável na próxima request |
| LLM gera entidade com <100 palavras | Baixa | Baixo | Validator pós-geração; se falhar, Oráculo tenta novamente com prompt mais específico (max 2 retries) |
| PX-01 passa horas sem aceitar entidades (PRE_ACTIVE longo) | Média | Médio | Alerta Admin 72h + email notification (futuro) |

---

## 5. Critérios de Pronto (Definition of Done)

- [ ] Migration SQL executada em staging sem erro
- [ ] `npx tsc --noEmit` sem erros
- [ ] Todos os CAs (CA-01 a CA-20) verificados manualmente ou em teste automatizado
- [ ] CA-15 (caixa-preta 404) testado com PX-06 real
- [ ] JN-13 completo executado com cliente piloto real
- [ ] Log de auditoria HITL persistindo corretamente (testar aceitar + editar + rejeitar)
- [ ] Alerta Admin 72h testado
- [ ] `docs/specs/large/onboarding-oraculo-cliente/spec.md` status → `implementada`
- [ ] Handoff doc criado em `docs/handoff/sessions/`
