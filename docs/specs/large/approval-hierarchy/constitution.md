---
spec-id: SPEC-004
slug: approval-hierarchy
artefato: constitution
atualizada: 2026-04-30
versao: 1.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + Python 3.11"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: Implementar Aprovação Hierárquica (FA-13) — pré-validação por agentes paralelos (BrandValidator + PortuguêsValidator) seguida de roteamento humano configurável (Operacional → Líder → Sócio) com carimbo Validado, anti-loop de 3 rounds e auditoria imutável.
upstream:
  - docs/brd/parte3-requisitos.md (BR-017)
  - docs/brd/parte4-regras.md (RN-023..026)
  - docs/prd/parte1-feature-map.md (FA-13)
  - docs/prd/parte4-FRs.md (FR-160..170)
  - docs/srd/parte2-domain-model.md (BC-07: DO-43..46, EV-28..34)
  - docs/srd/parte3-data-model-erd.md (ENT-34..38, REL-27..31)
  - docs/srd/parte4-data-flows-dfd.md (DFL-08)
  - docs/srd/parte6-arch-to-be.md (CTM-08, INT-TB-20/21)
  - docs/srd/parte7-ADRs.md (ADR-008, ADR-010, ADR-011)
  - docs/srd/parte8-APIs-contracts.md (API-130..136, SCH-013..015)
  - docs/ux/parte1-inventario-telas.md (T-29, T-30, T-31, PX-06)
  - docs/ux/parte5-ui-specs.md (§4.10)
---

# Constitution — Aprovação Hierárquica (FA-13)

Princípios imutáveis para esta SPEC. O agente de codificação deve respeitar TODOS em qualquer task derivada de `tasks.md`. Quando houver tensão entre velocidade e princípio, o princípio vence.

## 1. Princípios de Domínio (não negociáveis)

1. **Aprovador é sempre humano (RN-024).** Nenhum agente, bot, regra automática ou job pode emitir `ApprovalDecision`. Validators só geram `ValidationReport` (sinal), nunca decisão final. Verificação obrigatória no DecisionRecorder antes de qualquer INSERT.
2. **Decisão é imutável (RN-024 + DO-45 + ENT-37).** `approval_decisions` tem trigger PG bloqueando UPDATE/DELETE. Mesmo o próprio aprovador não reverte; revisão pós-fato é uma nova decisão em outra request.
3. **Validators rodam em paralelo (RN-023, ADR-008).** Brand e Português são chamados via `asyncio.gather`, não sequencial. Latência consolidada = `max(brand_ms, portugues_ms)`, não soma. Sequencial é antipattern.
4. **Anti-loop de 3 rounds (RN-025).** `current_round ∈ {1,2,3}`. 4ª tentativa de resubmit OU REQUEST_CHANGES no round 3 marca `EXPIRED` e exige conversa humana — fluxo automático não retoma.
5. **Hierarquia é configurável e versionada (RN-026, ADR-010).** Mudanças em `approval_chains` criam nova `version` imutável; submissões em-flight mantêm a versão capturada no momento da submissão. Hierarquia da Suno muda toda semana — sync RH foi explicitamente rejeitado.
6. **`subject_snapshot` é imutável após criação (DO-43 invariante 4).** O conteúdo é congelado no INSERT da `ApprovalRequest`. Mudanças no spark/turn/workflow_output original NÃO afetam a request em curso. Trigger PG bloqueia UPDATE da coluna.

## 2. Princípios de Segurança e Privacidade

1. **Cross-client guard (RN-010).** Toda query de `approval_requests`, `approval_decisions`, `validation_reports` filtra por `client_id` resolvido do JWT/contexto. Não há endpoint que retorne dados de outro cliente. `subject.client_id` deve bater com `request.client_id` na criação (CHECK no DF-08.2).
2. **Caixa-preta para Operacional (RN-009 + RN-011).** Operacional NÃO vê Biblioteca, system_prompts, brand-guideline fonte. ValidationReport para Operacional pode mostrar `evidência` e `sugestão`, MAS NÃO o conteúdo bruto da regra de brand consultada. Endpoints retornam **404 genérico** quando o usuário não pode ver — nunca 403, para não revelar existência.
3. **`brand_guidelines` retrieval é server-side only.** BrandValidatorAgent consulta a Biblioteca dentro do backend; o frontend nunca recebe o conteúdo das guidelines. Apenas findings consolidados.
4. **Auditoria imutável (BR-017 critério 3, FR-167).** `approval_decisions` registra `approver_id` + `decided_at` + `decision`; `validation_reports` registra `brand_validator_version` + `portugues_validator_version`. Distinção entre achado-de-agente vs. decisão-humana é obrigatória no log.
5. **Approver authorization é por chain ativa, não global.** Estar com role "Líder" não autoriza aprovar tudo — autoriza aprovar onde o chain ativo do cliente coloca "Líder" naquele level_order. DecisionRecorder valida `approver_id ∈ approval_chain_levels(chain_id, current_level_order)` antes do INSERT.

## 3. Princípios de Latência e Confiabilidade

1. **Validators têm timeout 60s/agent (RN-023).** Se um validator estoura, o report consolida com `status=BLOCKING_ERRORS` e o validator que estourou fica marcado como `failed` com motivo `timeout`. Não bloqueia o outro validator.
2. **Pré-validação não bloqueia o usuário no momento do submit.** O POST `/api/approval/submit` retorna `201 PENDING_VALIDATION` em ≤2s (BR-017 critério 4); a validação roda async e o submitter recebe o status atualizado via evento.
3. **Inbox é eventually-consistent.** Polling 30s ou WebSocket. Nunca exigir refresh manual para o caso comum. Latência E2E (submit → aparece no inbox do aprovador certo) ≤5s.

## 4. Princípios de Vocabulário (Suno)

> Vocabulário Suno está documentado em BRD Parte 2 §1 e §9. É obrigatório no código de domínio (nomes de classes, enums, eventos), em copies de UI e em comentários narrativos. Pode aparecer texto em inglês em IDs técnicos pré-existentes (ex: `APPROVE`, `REJECT`) — mantemos por consistência com o ERD aprovado.

- **Usar sempre:** Aprovador, Aprovação, Validado, Faísca, Brasa, Provocar, Devorar, Caixa-preta, Bioma, Sistema Solar, Sun, Planeta, Órbita, Moon, Curadoria, Operacional, Líder, Sócio, Submitter (no domínio técnico) ou "quem submete" (no copy de UI).
- **Nunca usar:** "gerar" no domínio criativo (preferir "criar"/"produzir"/"compor"), "otimizar", "eficiência", "accelerator", "smart", "AI-powered" como copy. **Sempre Koro com K.**
- O BrandValidatorAgent ENFORÇA esse mesmo vocabulário sobre o conteúdo submetido. Não há exceção interna — o que vale para o usuário vale para nossas próprias copies.

## 5. Padrões Obrigatórios

### 5.1. Backend (`api/approval/`)

- **Linguagem:** Python 3.11+, type hints em 100% das assinaturas públicas.
- **Framework:** FastAPI (router em `api/approval/router.py`), LangGraph para sub-graph dos validators (compatível com upgrade futuro para `deepagents` conforme ADR-011).
- **DB:** PostgreSQL via SQLAlchemy 2.0 + asyncpg, Alembic para migrations.
- **Persistência transacional:** toda mudança que afeta múltiplas tabelas (ex: `INSERT approval_decisions` + `UPDATE approval_requests`) roda em uma única transação atômica.
- **Eventos:** Pub/Sub (INT-TB-20). Topic `sunos.approval.events`. Publicação acontece **após commit do DB**, não dentro da transação (outbox pattern ou commit hook). Idempotência por `event_id`.
- **Schemas Pydantic:** SCH-013/014/015 são canônicos. Não duplicar definições; reusar via `from api.approval.schemas import ApprovalRequestSchema`.
- **Tracing:** MLflow para o sub-graph dos validators (decorator `@mlflow.trace`). Tag obrigatória: `client_id`, `request_id`, `round`.
- **Testes:** pytest + pytest-asyncio. Cobertura mínima 80% no módulo de domínio (DecisionRecorder, ValidationOrchestrator, ChainRouter).

### 5.2. Frontend (`app/aprovacoes/`, `components/aprovacoes/`)

- **Linguagem:** TypeScript strict.
- **Framework:** Next.js 14 App Router; Server Components onde possível (T-29 lista) e Client Components para interatividade (T-30 actions, T-31 modal).
- **Estilização:** CSS variables do design system sunOS + inline styles. Não introduzir Tailwind classes novas em telas FA-13.
- **Cliente HTTP:** reusar `lib/api.ts` (padrão estabelecido em SPEC-001). Adicionar `getApprovalInbox`, `getApprovalRequest`, `submitApproval`, `decideApproval`, `resubmitApproval`, `listApprovalChains`, `upsertApprovalChain`.
- **State:** React Context (`ApprovalContext` se houver estado compartilhado entre T-29 e T-30; senão, server-fetched per page).
- **Realtime:** polling 30s nos T-29 e T-30 ativos. WebSocket é objeto de tarefa futura (`TODO-FE-realtime`), não bloqueia MVP.
- **Acessibilidade:** focus trap em T-31 modal, ARIA live region em T-29 ("N novidades"), `prefers-reduced-motion` honrado em todas as 8 microinterações listadas em UX §4.10.

### 5.3. Convenções de nomes

- **Backend modules:** `api/approval/{router.py, schemas.py, service.py, validators/, chain.py, decisions.py, events.py, models.py}`.
- **Frontend pages:** `app/aprovacoes/page.tsx` (T-29), `app/aprovacoes/[requestId]/page.tsx` (T-30), `app/aprovacoes/configuracao/[clientSlug]/page.tsx` (chain admin).
- **Frontend components:** `components/aprovacoes/{InboxList, RequestDetail, SubmitModal, ChainStepper, ValidationCard, FindingHighlight, DecisionActions, ValidatedStamp, ChainEditor}.tsx`.
- **Componentes do trigger T-31 vivem onde o trigger acontece** (`components/chat/SubmitForApprovalButton.tsx`, etc.) e abrem `<SubmitModal />`.
- **Enums de domínio em UPPER_SNAKE_CASE** (`PENDING_VALIDATION`, `APPROVE`) — bate com o ERD aprovado, não traduzir.

## 6. Dependências Aprovadas

Reusam o stack já estabelecido. **Nenhuma dependência nova é introduzida nesta SPEC** (CLAUDE.md proíbe sem justificativa explícita).

| Dependência | Versão | Propósito | Origem |
|-------------|--------|-----------|--------|
| `fastapi` | já no projeto | Endpoints | api/ existente |
| `langgraph`, `langchain-core`, `langchain-google-genai` | já no projeto | Sub-graph validators | api/ existente |
| `langchain-anthropic` | já no projeto | Opcional p/ planner Sonnet (ADR-011) | api/ existente |
| `sqlalchemy` (2.0) + `asyncpg` | já no projeto | Persistência | api/ existente |
| `alembic` | já no projeto | Migrations | api/ existente |
| `google-cloud-pubsub` | já no projeto | Publicação de EV-28..34 (INT-TB-20) | api/ existente |
| `mlflow` | já no projeto | Tracing | api/ existente |
| `pydantic` v2 | já no projeto | Schemas | api/ existente |
| `lucide-react` | já no projeto | Ícones (size 14, strokeWidth 1.5) | frontend |

**Bibliotecas explicitamente em avaliação (NÃO adotar nesta SPEC):**

- `deepagents` — cobertura ADR-011 (Proposto). PoC separada em SPEC distinta. Esta SPEC implementa em LangGraph nativo com **arquitetura compatível** para troca posterior (ValidationOrchestrator é a única peça que muda).

## 7. Dependências de Outras SPECs / Componentes

1. **CTM-01 Auth Gateway** precisa estar em produção e emitindo JWT com `client_id` + `roles` resolvíveis. Sem isso, nenhuma autorização do FA-13 funciona corretamente.
2. **FA-01 Biblioteca (BrandValidator dependency).** BrandValidatorAgent consulta `brand-guidelines` da Biblioteca via API interna. Stub aceitável na fase POC; integração real bloqueia Piloto.
3. **FA-09 RBAC.** Roles `Operacional`, `Líder`, `Sócio`, `Admin` precisam estar definidos e atribuíveis. `approver_role` em `approval_chain_levels` referencia esses valores literalmente.
4. **CTM-04 Provocation Engine** **não** é dependência — FA-13 valida outputs de FA-02/04/07 mas não orquestra geração.

## 8. Anti-patterns Proibidos

1. **Não permitir que um agente emita ApprovalDecision.** Mesmo que pareça óbvio que o caso é APPROVE: violação direta de RN-024.
2. **Não rodar validators sequencialmente.** Mesmo que o BrandValidator falhe rápido — paralelismo é parte do contrato latência.
3. **Não modificar `approval_decisions` após INSERT.** Use uma nova decisão em outra request, ou marque a request como REJECTED se for o caso. Nunca UPDATE.
4. **Não fazer hard-delete de chains, decisions, ou reports.** Use o flag `status=DEPRECATED` (chains) ou crie auditoria. Migrations destrutivas precisam de aprovação explícita do Heitor.
5. **Não retornar 403 em endpoints de approval para usuário sem permissão sobre o cliente.** Retornar 404 (caixa-preta — RN-011 generalizado para approval).
6. **Não vazar `subject_snapshot` de outro cliente em response/log.** Toda log estruturado mascara `subject_id` cross-client.
7. **Não aceitar `subject_id` sem validar `subject.client_id == request.client_id`.** Falha aqui = brecha de cross-tenant.
8. **Não confiar em `expires_at` calculado no frontend.** SLA é autoridade do backend; frontend só renderiza.
9. **Não usar "gerar" em copies de UI de FA-13** (ver §4 vocabulário). O BrandValidator é tratado como "valida", não "verifica geração".
10. **Não introduzir endpoint que liste approvers de um cliente para um Operacional.** Operacional vê apenas a request dele e seu status — não a hierarquia interna.

## 9. Princípios de Compatibilidade com ADR-011 (deepagents — Proposto)

Esta SPEC implementa em LangGraph nativo (status seguro hoje). Para minimizar custo de migração se ADR-011 for aprovado:

1. **`ValidationOrchestrator` é a única peça que muda.** Brand/Português validators são `BaseValidator`-shaped (input: `subject_snapshot + client_id`; output: `Finding[]`); orquestração é injetável.
2. **`subject_snapshot` é o blob portátil.** Validators NÃO recebem ponteiros para outras tabelas; tudo vive no snapshot + retrieval do brand-guidelines via tool. Isso bate com o modelo de virtual filesystem do deepagents sem refactor.
3. **Tool calls são RBAC-aware no entry point.** Toda tool exposta a um validator (incluindo a busca de brand-guidelines) checa `client_id` do contexto antes de executar. Bate com o pré-requisito #4 de ADR-011.
4. **MLflow tracing** instrumenta o orquestrador e cada sub-call. Quando trocar para deepagents, basta verificar que os spans continuam aparecendo (pré-requisito #2 de ADR-011).

## 10. Critérios de Pronto (DoD da SPEC)

A SPEC completa será considerada implementada quando:

- [ ] Todos os FR-160..170 cobertos por código + testes que mapeiam para CAs do `spec.md`.
- [ ] Migrations Alembic aplicadas em staging para ENT-34..38 + triggers de imutabilidade (decisions + subject_snapshot).
- [ ] Endpoints API-130..136 respondem 2xx no caminho feliz e os 4xx documentados, com testes de contrato (pytest + httpx).
- [ ] T-29, T-30, T-31 navegáveis em staging com dados seed (1 cliente piloto, 1 chain ativa, 3 níveis).
- [ ] Pub/Sub topic `sunos.approval.events` recebendo EV-28..34 idempotentes.
- [ ] BrandValidator + PortuguêsValidator rodando em paralelo, latência p95 ≤ 2.5s no piloto, timeout 60s honrado.
- [ ] Auditoria imutável validada com teste destrutivo (UPDATE/DELETE em `approval_decisions` lança exceção).
- [ ] Dashboard MLflow mostrando traces de pelo menos 50 submissions com tags `client_id`/`request_id`.
- [ ] CLAUDE.md (raiz) atualizado com rota `/aprovacoes` + módulo `api/approval/`.
- [ ] Handoff de fim de SPEC criado em `docs/handoff/sessions/`.

---

**Tudo o que vier a seguir (`spec.md`, `design.md`, `plan.md`, `tasks.md`) deve obedecer literalmente este documento. Se uma decisão de design ou task entrar em conflito com um princípio aqui, a SPEC para — não o princípio.**
