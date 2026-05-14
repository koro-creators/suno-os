---
spec-id: SPEC-004
slug: approval-hierarchy
artefato: spec
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-04-30
atualizada: 2026-04-30
versao: 1.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + Python 3.11"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: Especificação funcional e comportamental de FA-13 — Aprovação Hierárquica com pré-validação por agentes paralelos.
cobertura:
  features: [FA-13]
  brs: [BR-017]
  rns: [RN-023, RN-024, RN-025, RN-026]
  frs: [FR-160, FR-161, FR-162, FR-163, FR-164, FR-165, FR-166, FR-167, FR-168, FR-169, FR-170]
  adrs: [ADR-008, ADR-010, ADR-011]
  telas: [T-29, T-30, T-31]
  endpoints: [API-130, API-131, API-132, API-133, API-134, API-135, API-136]
  eventos: [EV-28, EV-29, EV-30, EV-31, EV-32, EV-33, EV-34]
  entidades: [ENT-34, ENT-35, ENT-36, ENT-37, ENT-38]
---

# Spec — Aprovação Hierárquica (FA-13)

## 1. Visão Geral

**O quê.** Pipeline de aprovação multinível para assets criativos do sunOS. Submitter (criador original) envia um spark, turn de chat ou output de workflow para aprovação; dois agentes especializados (BrandValidator + PortuguêsValidator) rodam em paralelo gerando um `ValidationReport` estruturado; o request é então roteado pela hierarquia humana (Operacional → Líder → Sócio, configurável por cliente) e cada nível aprova, rejeita, ou pede ajustes; até 3 rounds de ajuste são permitidos antes de o fluxo automático encerrar e exigir conversa humana; ao APPROVE no nível final, o asset recebe o carimbo Validado imutável.

**Por quê.** Hoje a aprovação é informal (Slack/WhatsApp), sem rastro auditável e sem pré-validação. Sócios viraram gargalo revisando coisas que o BrandValidator pegaria sozinho. BR-017 cobra: ≥80% das revisões evitáveis endereçadas antes do humano, ≤3 rodadas automáticas, 100% das decisões humanas com timestamp + approver_id, status real do request visível em ≤2s.

**Para quem.**

| Persona | Papel no fluxo | Telas |
|---------|---------------|-------|
| PX-02 Criativo Sênior | Submitter — submete e responde a ajustes | T-31 (modal), notificações in-app |
| PX-06 Aprovador (Sócio) — primário | Decide na hierarquia configurada | T-29 inbox, T-30 detalhe |
| PX-01 Líder (secundário) | Aprovador em níveis intermediários, configura chain | T-29, T-30, T-31 admin (chain config) |
| PX-03 Operacional | Pode submeter (se autor) ou aparecer como nível 1 do chain | T-31, T-29 (limitado), T-30 (limitado) |

**Escopo incluído.**

- Submissão de spark, turn de chat e workflow_output (3 `subject_type`).
- Pré-validação Brand + Português em paralelo, com timeout 60s/agent.
- Roteamento hierárquico configurável por cliente (com `applies_to_skill_id` opcional).
- Decisões APPROVE | REQUEST_CHANGES | REJECT, todas humanas e imutáveis.
- Anti-loop de 3 rounds com escalação para conversa.
- Carimbo Validado quando aprovado no nível final.
- Notificação in-app + Slack webhook + email (configurável).
- Configuração de chain via admin UI (Admin/Líder do cliente).

**Escopo excluído (out-of-scope desta SPEC).**

- Sync RH para hierarquia (rejeitado em ADR-010).
- Aprovação cross-cliente (uma request pertence a um único `client_id`).
- Edição/cancelamento de request pelo submitter após criar (resubmit é o único caminho).
- Re-validação automática quando `brand_guidelines` mudam em um request em-flight.
- WebSocket para realtime — polling 30s no MVP, WebSocket é evolução futura.
- Migração de `deepagents` (ADR-011 está Proposto; PoC vive em SPEC separada).
- T-32/T-33 e qualquer tela de FA-14 (Drive).

## 2. Personas e Jornadas

### 2.1. PX-02 Criativo Sênior — submitter

- **Perfil.** Cria sparks, conduz chats, monta workflows. Quer levar trabalho ao Sócio com mínimo atrito; já internalizou que "a Faísca passa por validação antes de virar Brasa".
- **Objetivo.** Aprovação rápida e ajustes claros. Tolera 1–2 rounds; round 3 é dor.
- **Jornada principal (caminho feliz).**
  1. Conclui um turn em T-05 (chat) ou abre uma Faísca em T-07.
  2. Clica "Submeter para Aprovação".
  3. T-31 modal abre, cliente pré-preenchido, chain visível read-only, deixa comentário opcional.
  4. Clica "Submeter". Recebe toast: "Enviado para aprovação. Você receberá notificação."
  5. Push de notificação 1–2 minutos depois: "Validado por Operacional 1, próximo: Líder."
  6. Push final: "Validado ✓ pela Sócia Maria. Asset carimbado."
- **Jornada de ajustes (REQUEST_CHANGES round 1).**
  1. Recebe push: "Ajustes solicitados pelo Operacional. Round 1/3."
  2. Abre T-30, lê comentário do approver + relê findings do ValidationReport.
  3. Faz ajustes no spark/turn original (na tela de origem).
  4. Volta a T-30, clica "Resubmeter com versão ajustada" → modal mostra comparativo (brevemente — fora-de-escopo do MVP, ver §11) → confirma.
  5. Round vai para 2; pré-validação roda de novo; espera nova decisão.
- **Jornada bloqueada (round 3).**
  1. No round 3, ao tentar resubmeter ou após REQUEST_CHANGES, request marca EXPIRED.
  2. Recebe aviso: "3ª rodada esgotada. Combine com [Aprovador] uma conversa direta."
  3. Conversa humana acontece fora do fluxo. Quando alinharem, criam **nova** ApprovalRequest (current_round=1) — é uma request distinta, com novo `request_id`.

### 2.2. PX-06 Aprovador (Sócio) — primário

- **Perfil.** Sócio. Quer aprovar em ≤2 minutos, sem precisar abrir o Drive ou Slack para entender. Confia parcialmente nos agentes — quer ver os findings, mas decide ele.
- **Objetivo.** Carimbar o que está bom; pedir ajustes objetivos quando não está; nunca decidir sem entender o que o submitter quis fazer.
- **Jornada principal.**
  1. Notificação push: "Nova submissão aguarda você — Faísca de Cliente X, Submitter João."
  2. Abre T-29, vê 3 cards com SLA destacado.
  3. Clica o mais urgente → T-30.
  4. Lê o subject preview (rich render, finding spans color-coded). Hover em finding mostra a sugestão.
  5. Lê findings consolidados de Brand + Português.
  6. Stepper mostra que ele é o último nível. Clica "Aprovar". Confirma. Carimbo Validado anima por cima do preview.
  7. Volta para T-29; card sumiu da inbox.
- **Jornada de ajustes.**
  1. Em T-30, identifica problema. Clica "Solicitar Ajustes" → textarea.
  2. Escreve "Mudar tom para mais sóbrio no segundo parágrafo. Brand já flagou."
  3. Confirma. Toast: "Ajustes solicitados. João foi notificado."
  4. Card sai da inbox; quando submitter resubmeter, volta com `round=2` (e ele pode ver o histórico no T-30).

### 2.3. PX-01 Líder — aprovador intermediário + admin de chain

- **Perfil.** Diretor de área. Aprova como nível intermediário em alguns clientes; configura chains nos clientes onde é responsável.
- **Jornada principal.** Igual PX-06 quando aprova; igual PX-01 admin para configurar.
- **Jornada admin (configurar chain).**
  1. Acessa `/aprovacoes/configuracao/[clientSlug]`.
  2. Vê chain ativo (versão N) read-only com botão "Editar".
  3. Edita: adiciona um nível, troca um aprovador role-based por user-based, ajusta SLA.
  4. Salva. Backend cria versão N+1 (DEPRECATED a N). Submissões em-flight permanecem com N até concluírem.
  5. AuditEntry registra: who, what, when (RN-026 + ADR-010).

### 2.4. PX-03 Operacional — capacidades restritas (caixa-preta)

- **Perfil.** Atendente, junior — não pode ver Biblioteca, system prompts, brand-guideline fonte (RN-011).
- **No fluxo de aprovação.**
  - Pode **submeter** o que ele criou (autor da Faísca/turn/output).
  - Pode aparecer **como nível 1** do chain de alguns clientes — então vê inbox e detalhe de requests onde é approver.
  - **Não vê** brand_guidelines fonte; vê apenas findings consolidados ("Brand: Mudar tone para mais sóbrio").
  - Endpoints retornam 404 quando não autorizado, nunca 403 — não revelam que a request existe.

<!-- REVIEW: As personas e jornadas acima cobrem o fluxo real? Há um caminho que faltou? Fluxos de erro do submitter (ex: Operacional não autorizado a submeter para um cliente) estão claros? -->

## 3. Requisitos Funcionais

Cada FR aqui tem um `code-rastreio` direto para o doc upstream. Estes são os 11 FRs cobertos pela SPEC. Detalhes de implementação ficam em `design.md` e `tasks.md`.

### FR-160 — Submissão de asset para aprovação em ≤2 cliques

- **Origem:** PRD parte4 §FR-160. **Vínculos:** BR-017, FA-13-01, RN-026.
- **Comportamento.** Botão "Submeter para Aprovação" visível em T-05 (Chat detail), T-07 (Faísca panel) e T-23 (Workflow histórico) para o autor original. Click 1: abre T-31 com cliente e chain pré-preenchidos. Click 2: "Submeter" envia POST API-130. Resposta `201 PENDING_VALIDATION` em ≤2s.
- **Restrição RBAC.** Só o autor original do subject pode submeter; outros usuários veem o botão desabilitado com tooltip "Apenas o autor pode submeter".

### FR-161 — Pipeline de validators paralelos

- **Origem:** PRD parte4 §FR-161. **Vínculos:** BR-017, RN-023, FA-13-02, ADR-008.
- **Comportamento.** Após `INSERT approval_requests` em `PENDING_VALIDATION`, ValidationOrchestrator dispara BrandValidator + PortuguêsValidator concorrentemente (`asyncio.gather`). Timeout 60s por validator. ValidationReport consolidado é persistido com `status ∈ {PASS, WARNINGS_ONLY, BLOCKING_ERRORS}`.

### FR-162 — BrandValidator com Brand Guidelines da Biblioteca

- **Origem:** PRD parte4 §FR-162. **Vínculos:** BR-017, RN-023, FA-13-02, FA-01.
- **Comportamento.** BrandValidator consulta brand-guidelines do cliente via API interna da Biblioteca (FA-01). Retorna `Finding[]` com `{severity ∈ {error,warning,info}, span: {start,end}, message, suggestion}`. Findings cobrem tom, messaging, vocabulário Suno, consistência visual (quando subject contém imagens via `subject_snapshot.assets`).

### FR-163 — PortuguêsValidator

- **Origem:** PRD parte4 §FR-163. **Vínculos:** BR-017, RN-023, FA-13-02, NFR-012.
- **Comportamento.** PortuguêsValidator valida gramática, ortografia, idioma PT-BR (gírias, expressões). Não consulta Biblioteca. Retorna `Finding[]` mesmo formato.

### FR-164 — Validation Report estruturado

- **Origem:** PRD parte4 §FR-164. **Vínculos:** RN-023, FA-13-02, DO-46, SCH-014.
- **Comportamento.** ValidationOrchestrator consolida os dois resultados em um único `ValidationReport`:
  - `status = PASS` se ambos validators retornam só `info` ou findings vazios.
  - `status = WARNINGS_ONLY` se ao menos um tem `warning` mas nenhum tem `error`.
  - `status = BLOCKING_ERRORS` se ao menos um tem `error` OU se houve timeout (RN-023).
  - `latency_ms = max(brand_latency, portugues_latency)` — não soma.
  - `brand_validator_version` e `portugues_validator_version` são pinados no momento da execução (auditoria).

### FR-165 — Approval Inbox (T-29)

- **Origem:** PRD parte4 §FR-165. **Vínculos:** FA-13-03, T-29, API-131.
- **Comportamento.** Aprovador autenticado em `/aprovacoes` vê requests em `PENDING_APPROVAL` no nível em que ele está (resolvido por `approval_chain_levels` via `approver_user_id` direto OU `approver_role` cruzando com `user.roles` para o `client_id` da request). Filtros: cliente, tipo, urgência. Ordenação por `expires_at` ascendente. Paginação cursor-based (limit 10).

### FR-166 — Approval Detail (T-30)

- **Origem:** PRD parte4 §FR-166. **Vínculos:** FA-13-04, T-30, API-132.
- **Comportamento.** `/aprovacoes/{requestId}` mostra: subject preview rich (com finding spans color-coded), Validation Report (Brand + Português findings), chain stepper (current level highlighted), histórico de decisões (collapsible, hidden if round=1), CTAs Aprovar/Solicitar Ajustes/Reprovar.

### FR-167 — Auditoria de decisão imutável

- **Origem:** PRD parte4 §FR-167. **Vínculos:** BR-017, FA-13-05, ENT-37, RN-024.
- **Comportamento.** Cada `ApprovalDecision` registra `approver_id` (humano), `decision`, `comment`, `decided_at`, `level_order`, `round`. Trigger PG bloqueia UPDATE/DELETE. Findings de validators ficam no `ValidationReport` separado, com `*_validator_version` pinada — agente é diferenciado de humano no log.

### FR-168 — Anti-loop com limite de 3 rounds

- **Origem:** PRD parte4 §FR-168. **Vínculos:** BR-017, RN-025, FA-13-06, API-134.
- **Comportamento.** Se `current_round < 3` E decision = REQUEST_CHANGES → request fica `CHANGES_REQUESTED`; submitter pode chamar API-134 (resubmit) que cria novo round (`current_round++`, volta para `current_level_order=0`, status `PENDING_VALIDATION`). Se `current_round = 3` E REQUEST_CHANGES novamente → status vira `EXPIRED`, EV-34 emitido, fluxo automático encerrado.

### FR-169 — Hierarquia de aprovação configurável

- **Origem:** PRD parte4 §FR-169. **Vínculos:** RN-026, FA-13-07, API-135.
- **Comportamento.** Admin OU Líder do cliente acessa `/aprovacoes/configuracao/[clientSlug]`. CRUD em `approval_chains` + `approval_chain_levels`. Mudanças criam nova `version` imutável (DEPRECATED na anterior). AuditEntry obrigatório.

### FR-170 — Notificação ao aprovador

- **Origem:** PRD parte4 §FR-170. **Vínculos:** FA-13-08, EV-31, NFR-003.
- **Comportamento.** Quando EV-31 (ApprovalRouted) é publicado, NotificationDispatcher envia: in-app toast (via canal Pub/Sub → frontend SSE/poll) + Slack webhook (se configurado para o cliente) + email (se preferência do user). Latência E2E ≤5s.

## 4. Comportamento Especificado

### 4.1. Máquina de estados de `ApprovalRequest`

```
                    ┌─────────────────────┐
                    │ PENDING_VALIDATION  │ ← criado em POST /api/approval/submit
                    └──────────┬──────────┘
                               │ ValidationOrchestrator completa
                ┌──────────────┴──────────────┐
                │                              │
       (status=PASS|WARNINGS_ONLY)     (status=BLOCKING_ERRORS)
                │                              │
                ▼                              ▼
    ┌─────────────────────┐     ┌─────────────────────────┐
    │ PENDING_APPROVAL    │     │ CHANGES_REQUESTED       │ (auto, sem decisão humana)
    │ current_level_order=│     │  Submitter resubmete?    │
    │      1              │     └────────┬────────────────┘
    └──────────┬──────────┘              │
               │                         │ round<3?  ─sim→ retorna a PENDING_VALIDATION (round++)
   approver decide                       │ round=3?  ─sim→ EXPIRED
               │                         │
   ┌───────────┼────────────┐
   │           │            │
APPROVE   REQUEST_CHANGES  REJECT
   │           │            │
   │           │            ▼
   │           │       ┌───────────┐
   │           │       │ REJECTED  │ (final)
   │           │       └───────────┘
   │           ▼
   │      ┌───────────────────┐
   │      │ CHANGES_REQUESTED │ (igual ao caminho de cima)
   │      └───────────────────┘
   │
   │ último nível?
   ├─sim→ ┌───────────┐
   │      │ APPROVED  │ → carimbo Validado em subject + EV-33
   │      └───────────┘
   └─não→ current_level_order++ → volta a PENDING_APPROVAL (próximo nível)
```

### 4.2. Fluxos principais

| # | Fluxo | Endpoints / Eventos | Ref |
|---|-------|---------------------|-----|
| F1 | Submeter spark/turn/workflow_output → criar request | API-130 → EV-28 → EV-29 | DFL-08.1–4 |
| F2 | Validators paralelos → consolidar report | (interno) → EV-30 | DFL-08.4–8 |
| F3 | Roteamento ao nível 1 humano (se status ≠ BLOCKING_ERRORS) | (interno) → EV-31 → NotificationDispatcher | DFL-08.9–11 |
| F4 | Aprovador abre detalhe e decide | API-132 (GET) → API-133 (POST) → EV-32/33 | DFL-08.12–16 |
| F5 | Avançar nível (APPROVE intermediário) | (interno) → EV-31 (próximo approver) | DFL-08.15-B |
| F6 | Submitter resubmete após REQUEST_CHANGES | API-134 → EV-29 | (volta a F2 com round++) |
| F7 | Round 3 + REQUEST_CHANGES → EXPIRED | (interno) → EV-34 | DFL-08.15-C |
| F8 | APPROVE no nível final → Validado stamp | (interno) → EV-33 + UPDATE subject | DFL-08.15-A |
| F9 | Configurar chain | API-135 (GET/POST) | (admin) |
| F10 | Inbox poll (aprovador) | API-131 | (cliente) |
| F11 | Validation Report standalone (auditoria) | API-136 | (cliente) |

### 4.3. Fluxos de erro

| Origem | Condição | Status | Resposta ao usuário | Ação interna |
|--------|----------|--------|----------------------|--------------|
| API-130 | `subject_id` não encontrado | 400 | Modal banner: "Asset não encontrado." | Não cria request |
| API-130 | `subject.client_id ≠ request.client_id` (resolvido do contexto/JWT) | 400 | Modal banner: "Asset não pertence a este cliente." | Não cria request; log estruturado de tentativa cross-tenant |
| API-130 | nenhum chain ACTIVE para `client_id` | 404 | Modal banner: "Nenhum fluxo de aprovação configurado. Contate o administrador." | Não cria request |
| API-130 | request já existe para `subject_id` em estado não-final | 409 | Modal banner com link "Ver request existente" → T-30 com `request_id` | Retorna o `request_id` existente |
| API-130 | usuário ≠ autor do subject | 403 | Botão "Submeter" desabilitado upstream (validação em UI); se a chamada chega ao backend, retorna 403 | Log de tentativa |
| API-131 | usuário sem role em chain ativo | 200 com items=[] | Inbox vazia + empty state | (não revela que existem requests) |
| API-132 | `request_id` não existe | 404 | T-30 mostra "Request não encontrada ou você não tem acesso" | Caixa-preta |
| API-132 | `request_id` existe mas usuário não é submitter, approver ativo, líder ou admin | 404 | Igual acima | Caixa-preta (RN-011 generalizado) |
| API-133 | `approver_id` não está em chain levels para `current_level_order` | 403 | Toast: "Você não tem autorização para decidir neste nível." | Log; não cria decision |
| API-133 | request já decidida nesse round/level | 409 | Toast: "Esta request já foi decidida. A inbox foi atualizada." | T-29 refresh |
| API-133 | round=3 + REQUEST_CHANGES | 200 com `status=EXPIRED` | T-30 mostra banner "Fluxo automático encerrado. Combine conversa com submitter." | EV-34 emitido |
| API-134 | usuário ≠ submitter original | 403 | Toast | Log |
| API-134 | `current_round = 3` | 409 | T-30 mostra: "Limite de 3 rodadas atingido — fluxo encerrado." | EV-34 já foi emitido (se chegou aqui é race; idempotente) |
| API-134 | `status ≠ CHANGES_REQUESTED` | 409 | T-30 mostra: "Resubmissão só após Solicitação de Ajustes." | — |
| API-135 (POST) | usuário não é Admin nem Líder do cliente | 403 | Toast: "Sem permissão para configurar chain." | Log |
| API-135 (POST) | chain sem nenhum nível humano | 400 | Form mostra erro inline | Não persiste |
| API-135 (POST) | level_order não contíguo | 400 | Form mostra erro: "Níveis devem ser 1, 2, 3 contíguos." | Não persiste |
| Validators (interno) | timeout 60s | (não é HTTP) | Status do report = BLOCKING_ERRORS, finding sintético "Timeout no validator X" | Submitter notificado |

### 4.4. Estados visuais por status

| Status | T-29 chip | T-30 stamp | CTAs visíveis |
|--------|-----------|------------|---------------|
| PENDING_VALIDATION | "Validando…" (shimmer) | nenhum; cards de validators em shimmer | nenhum (aprovador não vê) |
| PENDING_APPROVAL + PASS | "Validado ✓" | nenhum | Aprovar / Solicitar Ajustes / Reprovar |
| PENDING_APPROVAL + WARNINGS_ONLY | "Atenção ⚠" | nenhum | Aprovar / Solicitar Ajustes / Reprovar |
| BLOCKING_ERRORS (= CHANGES_REQUESTED auto) | "Bloqueado 🚫" | nenhum | Apenas histórico; submitter precisa ajustar |
| CHANGES_REQUESTED | "Aguardando ajustes" | nenhum | Submitter: Resubmeter |
| APPROVED | "Validado ✓" verde | Carimbo Validado animado | (nenhum — read-only) |
| REJECTED | "Reprovado" vermelho | Stamp "Reprovado" gray | (nenhum — read-only) |
| EXPIRED | "Encerrada" gray | Banner "3ª rodada esgotada" | (nenhum — conversa humana) |

## 5. Requisitos Não-Funcionais

### NFR-001 — Latência

- **POST API-130 (submit):** retorna `201` em ≤2s p95 (BR-017 critério 4).
- **Validators paralelos:** p95 ≤2.5s, p99 ≤5s (custo do LLM call). Timeout duro 60s/agent.
- **GET API-131 (inbox):** p95 ≤500ms para até 100 requests no nível.
- **GET API-132 (detail):** p95 ≤800ms.
- **POST API-133 (decide):** p95 ≤1s (DB write + Pub/Sub publish).
- **E2E submit→aparece-no-inbox-do-aprovador-correto:** ≤5s.

### NFR-002 — Confiabilidade

- Validators idempotentes: chamar duas vezes com mesmo `subject_snapshot` retorna findings semanticamente equivalentes (não exigimos byte-equality por causa de LLM).
- Eventos EV-28..34 idempotentes por `event_id` (UUID gerado uma vez por evento) — consumers usam-no como dedupe key.
- Failure de Pub/Sub publish NÃO bloqueia a transação principal (outbox pattern; retry job processa eventos pendentes).

### NFR-003 — Segurança

- Todo endpoint exige JWT válido com `client_id` e `roles` resolvíveis.
- Cross-tenant guard em 100% das queries (CTM-01 obrigatório).
- Trigger PG de imutabilidade testado em CI (teste destrutivo).
- KMS não é necessário para esta SPEC (Drive OAuth fica fora). Brand guidelines são consumidas via API interna autenticada.

### NFR-004 — Auditabilidade

- 100% das decisões com `approver_id` + `decided_at` (BR-017).
- 100% das validações com `*_validator_version` pinada (auditoria de modelo).
- Mudanças em chain registradas em `audit_entries` com diff antes/depois.

### NFR-005 — Acessibilidade

- T-29 com ARIA live region para "N novidades".
- T-30 com keyboard nav (Tab order: subject preview spans → Aprovar → Solicitar Ajustes → Reprovar).
- T-31 modal com focus trap e ESC para fechar.
- Honra `prefers-reduced-motion` em todas as 8 microinterações de §4.10.

### NFR-006 — Escalabilidade

- Inbox suporta 1000 requests pendentes por aprovador sem degradar p95.
- Validators paralelos: até 50 submissões concorrentes por cliente sem fila visível.
- Pub/Sub topic `sunos.approval.events` com 1 subscription por consumer (NotificationDispatcher, AuditLogger, MetricsExporter).

## 6. Interface & Contratos

### 6.1. Endpoints

Os endpoints abaixo são os 7 originais de API-130..136. Schemas referenciados (SCH-013..015) já existem no doc de APIs.

#### POST /api/approval/submit (API-130)

```http
POST /api/approval/submit
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "subject_type": "spark" | "turn" | "workflow_output",
  "subject_id": "uuid",
  "client_id": "uuid",          // opcional, usa contexto se omitido
  "chain_id": "uuid",            // opcional, override chain default
  "comment": "string (≤500)"
}
```

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "request_id": "uuid",
  "status": "PENDING_VALIDATION",
  "client_id": "uuid",
  "submitter_id": "uuid",
  "subject_type": "spark",
  "subject_id": "uuid",
  "chain_id": "uuid",
  "current_round": 1,
  "current_level_order": 0,
  "submitted_at": "2026-04-30T10:00:00Z",
  "expires_at": "2026-05-02T10:00:00Z",
  "validation_report_id": null,
  "final_decision_id": null
}
```

Errors: 400 (subject inválido / cross-tenant), 404 (no active chain), 409 (request duplicada), 403 (não-autor).

#### GET /api/approval/inbox (API-131)

```http
GET /api/approval/inbox?status=PENDING_APPROVAL&client_id={uuid}&limit=10&cursor={opaque}
Authorization: Bearer <jwt>
```

```json
{
  "items": [
    {
      "request_id": "uuid",
      "client": { "client_id": "uuid", "name": "Planeta X", "color": "#FFC801" },
      "subject_type": "spark",
      "subject_summary": "string (2-3 linhas)",
      "submitter": { "user_id": "uuid", "name": "...", "avatar_url": "..." },
      "round": 1,
      "validation_status": "PASS|WARNINGS_ONLY|BLOCKING_ERRORS",
      "submitted_at": "2026-04-30T10:00:00Z",
      "expires_at": "2026-05-02T10:00:00Z",
      "time_to_sla": "6h"
    }
  ],
  "next_cursor": "opaque-or-null"
}
```

#### GET /api/approval/requests/{request_id} (API-132)

Retorna `ApprovalRequestDetail` com: submitter, client, subject_snapshot, status, round, current_level_order, validation_report (inline), approval_chain (inline), decisions_history.

Retorna **404** se request não existe OU se usuário não pode ver (caixa-preta).

#### POST /api/approval/requests/{request_id}/decide (API-133)

```json
// Request
{
  "decision": "APPROVE" | "REQUEST_CHANGES" | "REJECT",
  "comment": "string (opcional, obrigatório p/ REQUEST_CHANGES e REJECT)",
  "attachments": [ { "file_id": "uuid", "name": "...", "type": "..." } ]
}
```

```json
// 201 Created
{
  "decision_id": "uuid",
  "request_id": "uuid",
  "level_order": 1,
  "round": 1,
  "approver_id": "uuid",
  "decision": "REQUEST_CHANGES",
  "comment": "...",
  "decided_at": "2026-04-30T11:00:00Z",
  "next_status": "CHANGES_REQUESTED"
}
```

Errors: 403 (não está no chain level atual), 409 (já decidida ou round=3+REQUEST_CHANGES — status final no body).

Side-effects encadeados estão em §4.1 e DFL-08.15.

#### POST /api/approval/requests/{request_id}/resubmit (API-134)

```json
// Request
{
  "new_subject_id": "uuid",
  "new_subject_snapshot": { /* novo conteúdo */ },
  "addresses_findings": [ { "finding_id": "...", "resolution": "..." } ]
}
```

201: incrementa `current_round`, reset `current_level_order=0`, status=`PENDING_VALIDATION`. EV-29 publicado.

Errors: 403 (não-submitter), 409 (round=3 ou status≠CHANGES_REQUESTED).

#### GET /api/approval/chains (API-135 GET) e POST /api/approval/chains (API-135 POST)

GET retorna chains ACTIVE de um cliente. POST cria nova versão imutável (DEPRECATED na anterior). Validações:

- ≥1 nível humano.
- Para cada level: exatamente um de `approver_user_id` OU `approver_role` preenchido.
- `level_order` contíguo (1..N).

Authorization: Admin (qualquer cliente) ou Líder (apenas seus clientes).

#### GET /api/approval/validation-reports/{report_id} (API-136)

Retorna ValidationReport completo com `brand_findings`, `portugues_findings`, versions e latency.

Authorization: submitter, approver no chain ativo da request, Líder ou Admin do cliente.

### 6.2. Eventos (Pub/Sub topic `sunos.approval.events`)

| Evento | Payload (campos chave) | Quando |
|--------|------------------------|--------|
| EV-28 SubmissionCreated | `request_id, submitter_id, client_id, subject_type, subject_id, submitted_at, chain_id` | Após INSERT em `approval_requests` |
| EV-29 ValidationStarted | `request_id, round, started_at` | Quando ValidationOrchestrator dispara o gather |
| EV-30 ValidationCompleted | `request_id, report_id, round, status, latency_ms, completed_at` | Após salvar ValidationReport |
| EV-31 ApprovalRouted | `request_id, approver_id, level_order, routed_at, expires_at, sla_hours` | Após UPDATE para `PENDING_APPROVAL` |
| EV-32 ChangesRequested | `request_id, level_order, approver_id, comment, decided_at` | Após decision=REQUEST_CHANGES (round<3) |
| EV-33 ApprovalDecided | `request_id, level_order, approver_id, decided_at, next_action` | Após decision=APPROVE OU decision=REJECT |
| EV-34 ApprovalExpired | `request_id, round, expired_at, reason` | Após round=3 + REQUEST_CHANGES OU SLA timeout |

Idempotência: cada evento traz `event_id` (UUID v4) + `event_type`. Consumers dedupam por `event_id`.

### 6.3. Schemas reutilizáveis

- **SCH-013 ApprovalRequest** — corpo do GET /requests/{id} simplificado (sem snapshot inline).
- **SCH-014 ValidationReport** com `Finding { severity, span:{start,end}, message, suggestion }`.
- **SCH-015 ApprovalChain** com `ChainLevel { level_order, approver_kind, approver_user_id, approver_role, sla_hours, escalation_policy }`.

Definições em `docs/srd/parte8-APIs-contracts.md` §4. Esta SPEC referencia e não duplica.

## 7. Critérios de Aceite

Cada CA é verificável por teste automatizado ou inspeção manual em staging.

### 7.1. Submissão (FR-160, FR-161)

- [ ] **CA-01.** DADO usuário autenticado autor de uma Faísca em T-07, QUANDO clica "Submeter para Aprovação", ENTÃO T-31 abre com cliente pré-preenchido e chain visível em ≤500ms.
- [ ] **CA-02.** DADO T-31 aberto, QUANDO submitter clica "Submeter" com chain válida, ENTÃO POST API-130 retorna 201 com `status=PENDING_VALIDATION` em ≤2s.
- [ ] **CA-03.** DADO POST API-130 retornou 201, QUANDO inspecionamos `approval_requests`, ENTÃO há linha com `subject_snapshot` igual ao conteúdo no momento, `current_round=1`, `current_level_order=0`.
- [ ] **CA-04.** DADO request criada, QUANDO Pub/Sub é inspecionado, ENTÃO EV-28 e EV-29 aparecem com `request_id` correto.
- [ ] **CA-05.** DADO usuário tenta submeter um spark de outro `client_id`, QUANDO POST API-130 chega, ENTÃO retorna 400 e nenhuma linha em `approval_requests` é criada.
- [ ] **CA-06.** DADO cliente sem `approval_chains` ACTIVE, QUANDO POST API-130, ENTÃO retorna 404 com mensagem "Nenhum fluxo de aprovação configurado".

### 7.2. Validators paralelos (FR-161, FR-162, FR-163, FR-164)

- [ ] **CA-07.** DADO request em `PENDING_VALIDATION`, QUANDO inspecionamos os spans MLflow, ENTÃO BrandValidator e PortuguêsValidator iniciam dentro de 50ms um do outro (paralelismo real).
- [ ] **CA-08.** DADO ambos validators completam normalmente, QUANDO ValidationReport é gravado, ENTÃO `latency_ms ≈ max(brand_latency, portugues_latency)`.
- [ ] **CA-09.** DADO BrandValidator retorna `{severity:"warning"}` e PortuguêsValidator retorna findings vazios, QUANDO ValidationReport consolida, ENTÃO `status = WARNINGS_ONLY`.
- [ ] **CA-10.** DADO PortuguêsValidator timeout 60s, QUANDO ValidationReport consolida, ENTÃO `status = BLOCKING_ERRORS` E `portugues_findings` contém finding sintético `severity=error, message="Timeout no validator de Português"`.
- [ ] **CA-11.** DADO ambos retornam só `info`, QUANDO consolidam, ENTÃO `status = PASS`.
- [ ] **CA-12.** DADO request avança para PENDING_APPROVAL, QUANDO GET API-132 é chamado, ENTÃO `validation_report` inline traz `brand_validator_version` e `portugues_validator_version` não-nulos.

### 7.3. Inbox e detalhe (FR-165, FR-166)

- [ ] **CA-13.** DADO Maria (Sócia) é nível 3 do chain do cliente X, QUANDO 3 requests do cliente X estão em PENDING_APPROVAL no nível 3, ENTÃO GET /api/approval/inbox retorna 3 items ordenados por `expires_at` ascendente.
- [ ] **CA-14.** DADO Maria não está em nenhum chain do cliente Y, QUANDO há requests do cliente Y em PENDING_APPROVAL, ENTÃO eles NÃO aparecem na inbox dela.
- [ ] **CA-15.** DADO Maria abre T-30 de uma request, QUANDO o detalhe carrega, ENTÃO o subject_preview tem finding spans color-coded (red para error, amber para warning).
- [ ] **CA-16.** DADO request em round=2, QUANDO Maria abre T-30, ENTÃO `decisions_history` mostra a decisão REQUEST_CHANGES do round 1 com nome do approver e comentário.
- [ ] **CA-17.** DADO Operacional tenta GET /api/approval/requests/{id} para uma request sem ele no chain, ENTÃO retorna 404 (não 403).

### 7.4. Decisão e roteamento (FR-167, RN-024)

- [ ] **CA-18.** DADO Maria (último nível) clica Aprovar e confirma, QUANDO POST API-133 retorna 201, ENTÃO `approval_decisions` tem nova linha imutável com `approver_id=maria.user_id`, `decision=APPROVE`, `decided_at=now()`.
- [ ] **CA-19.** DADO `approval_decisions` tem decisão registrada, QUANDO tentamos `UPDATE approval_decisions SET comment='nova'`, ENTÃO PostgreSQL lança exception via trigger.
- [ ] **CA-20.** DADO `approval_decisions` tem decisão, QUANDO tentamos DELETE, ENTÃO PostgreSQL lança exception.
- [ ] **CA-21.** DADO request approved no nível final, QUANDO inspecionamos o subject (spark/turn/workflow_output), ENTÃO ele tem flag `validated=true` + `approved_at` + `approved_by`.
- [ ] **CA-22.** DADO Operacional 1 aprova num chain de 3 níveis, QUANDO API-133 retorna, ENTÃO `current_level_order` foi para 2 e EV-31 foi publicado para o aprovador do nível 2.
- [ ] **CA-23.** DADO um agente (não-humano) tenta INSERT em `approval_decisions` via API/script, QUANDO autorização é checada, ENTÃO retorna 403; nenhuma decisão registrada (RN-024 enforcement em runtime).

### 7.5. Anti-loop (FR-168, RN-025)

- [ ] **CA-24.** DADO request em round=1 com REQUEST_CHANGES, QUANDO submitter chama API-134, ENTÃO `current_round=2`, `current_level_order=0`, `status=PENDING_VALIDATION` E EV-29 emitido.
- [ ] **CA-25.** DADO request em round=3 com REQUEST_CHANGES, QUANDO approver tenta REQUEST_CHANGES de novo, ENTÃO API-133 retorna 200 com `next_status=EXPIRED` E EV-34 publicado.
- [ ] **CA-26.** DADO request em round=3, QUANDO submitter tenta API-134 (resubmit), ENTÃO retorna 409 com mensagem "Limite de 3 rodadas atingido".
- [ ] **CA-27.** DADO request EXPIRED, QUANDO inspecionamos, ENTÃO `status=EXPIRED` é estado terminal — nenhum API call subsequente reativa.

### 7.6. Configuração de chain (FR-169, RN-026)

- [ ] **CA-28.** DADO Líder do cliente X acessa /aprovacoes/configuracao/x, QUANDO clica "Editar" e adiciona um nível, salva, ENTÃO POST API-135 cria chain `version=N+1` ACTIVE e marca `version=N` como DEPRECATED.
- [ ] **CA-29.** DADO chain v1 ativo, request submetida usa v1, QUANDO chain é editada para v2 antes da request decidir, ENTÃO a request em-flight permanece com `chain_id` da v1 até concluir.
- [ ] **CA-30.** DADO Operacional tenta POST API-135, ENTÃO retorna 403.
- [ ] **CA-31.** DADO POST API-135 com nenhum nível humano, ENTÃO retorna 400 e nenhuma linha persistida.
- [ ] **CA-32.** DADO POST API-135 com `level_order=[1,2,4]`, ENTÃO retorna 400 ("níveis devem ser contíguos").
- [ ] **CA-33.** DADO chain editada, QUANDO consultamos `audit_entries`, ENTÃO há entry com user_id, action="approval_chain.update", payload com diff, timestamp.
- [ ] **CA-34.** DADO chain tem level com `approver_user_id` apontando para usuário deletado, QUANDO ChainRouter resolve, ENTÃO faz fallback para próximo nível (RN-026).

### 7.7. Notificações (FR-170)

- [ ] **CA-35.** DADO EV-31 publicado, QUANDO mais ≤5s, ENTÃO o aprovador correto recebe notificação in-app E o badge count em T-29 incrementa.
- [ ] **CA-36.** DADO cliente com Slack webhook configurado, QUANDO EV-31 publica, ENTÃO Slack recebe mensagem com link direto para T-30.
- [ ] **CA-37.** DADO usuário com preferência de email, QUANDO EV-31 publica, ENTÃO email é enviado em ≤30s (SLA mais frouxo que in-app).

### 7.8. UX e acessibilidade

- [ ] **CA-38.** DADO `prefers-reduced-motion` ativo, QUANDO request é APPROVED no nível final, ENTÃO o carimbo Validado aparece sem animação de scale/rotate (apenas fade-in 200ms).
- [ ] **CA-39.** DADO T-31 modal aberto, QUANDO usuário pressiona ESC, ENTÃO modal fecha sem submeter.
- [ ] **CA-40.** DADO T-29 com nova request chegando via polling, QUANDO o item entra na lista, ENTÃO ARIA live region anuncia "1 novidade".

### 7.9. Vocabulário Suno

- [ ] **CA-41.** DADO BrandValidator analisa um conteúdo com a palavra "gerar" no contexto criativo, ENTÃO finding aparece com `severity=warning`, `suggestion` propondo alternativa.
- [ ] **CA-42.** DADO inspeção de copies de UI em T-29, T-30, T-31, ENTÃO nenhuma copy contém: "gerar", "otimizar", "eficiência", "accelerator", ou "Coro" (com C).

## 8. Fora de Escopo (explícito)

1. WebSocket real-time (polling 30s no MVP).
2. Migração para `deepagents` (ADR-011 ainda Proposto).
3. Multi-cliente em uma mesma request.
4. Comparativo visual de versões durante resubmit (round 1 vs round 2 side-by-side) — nice-to-have V2.
5. Sync RH para hierarquia (rejeitado em ADR-010).
6. Re-validação automática quando brand_guidelines mudam (snapshot é congelado).
7. T-32, T-33 e qualquer tela de FA-14.
8. Aprovação por Slack/email reply (decisão acontece via UI no MVP).
9. Auditoria com diff visual de chain edits (logamos JSON; UI vem depois).
10. Métricas em dashboard (MLflow tem traces; dashboard executivo é V2).

## 9. Suposições

- **A1.** CTM-01 Auth Gateway está em produção emitindo JWT com `client_id` e `roles`. SE não, MVP fica bloqueado.
- **A2.** FA-01 Biblioteca tem endpoint para retornar brand-guidelines de um cliente. SE não, BrandValidator começa com mock no POC.
- **A3.** Pub/Sub `sunos.events` topic existe. SE não, criamos em fase A.
- **A4.** Roles `Operacional`, `Líder`, `Sócio`, `Admin` estão definidos no IAM/RBAC. SE não, é dependência bloqueante.
- **A5.** Cliente piloto (provavelmente Vivo Controle, a confirmar com Heitor) terá um chain default seedado antes do piloto.

## 10. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Validators degradam quando brand-guidelines crescem | Média | Médio | Pin de versão; benchmark p95 a cada release de validator |
| Falsos positivos do BrandValidator irritam aprovadores | Alta | Médio | Threshold de severity ajustável por cliente; "Mostrar mais" collapsible em T-30 |
| Submitter abusa de resubmit (bypass real review) | Baixa | Baixo | Cap em 3 rounds (RN-025) já mitiga; auditoria via dashboard de "% requests round=3" |
| Chain mal configurada deixa request órfã | Média | Alto | CA-34 (fallback) + AuditEntry obrigatório; alerta para admin se request sem approver elegível em <5min |
| Pub/Sub down → notificações silenciosas | Baixa | Médio | Outbox pattern + retry job; T-29 polling de 30s funciona como fallback de visibilidade |
| Cliente pede "fluxo paralelo entre níveis" (não-hierárquico) | Média | Médio | Fora-de-escopo no MVP; documentado para V2 |

## 11. Notas de Implementação

1. **Snapshot capture é prioridade.** Capturar `subject_snapshot` no INSERT — não na hora do GET. Mudanças no subject original ≠ mudança na request.
2. **`current_level_order=0` significa pré-validação.** Não confundir com "nível 0 humano". Levels humanos são 1..N.
3. **`expires_at` calcula da soma de SLAs do chain inteiro?** Não — calcula do nível atual (`now() + sla_hours_do_level_atual`). Quando avança o nível, recalcula.
4. **Rastreamento de finding span requer renderer no frontend.** Subject preview precisa de um `RichRenderer` que aceite annotations `{start,end,severity,message,suggestion}` e injete `<mark>` com tooltip.
5. **`subject_id` é polymorphic VARCHAR.** Resolução para spark/turn/workflow_output acontece em runtime via tabela referenciada por `subject_type`. CHECK de FK não é possível; lógica de validação é em service-layer.
6. **DecisionRecorder transação:** INSERT em `approval_decisions` + UPDATE em `approval_requests` + UPDATE em subject (se APPROVE final) + emit event — tudo em uma transação atômica + outbox publish.
7. **`subject_snapshot` immutability:** PG trigger AFTER UPDATE checando se `OLD.subject_snapshot IS DISTINCT FROM NEW.subject_snapshot` lança exception.
8. **AuditEntry de chain edits:** reusa tabela `audit_entries` já existente do RN-012; payload é diff JSON antes/depois.

<!-- REVIEW: A especificação captura o que você realmente quer construir? Os 42 critérios de aceite cobrem os caminhos felizes E os bordas? Algum fluxo (resubmit detalhado, fallback de approver inativo, chain skill-specific) merece mais detalhe? -->

## 12. Prompt para Agente

> Você está implementando a feature **FA-13 — Aprovação Hierárquica** no projeto sunOS (Next.js 14 + FastAPI/LangGraph).
>
> **Contexto.**
> - Constitution: `docs/specs/large/approval-hierarchy/constitution.md` (princípios não-negociáveis, **ler primeiro**).
> - Spec: este documento.
> - Design: `docs/specs/large/approval-hierarchy/design.md` (arquitetura).
> - Plan: `docs/specs/large/approval-hierarchy/plan.md` (sequência de fases).
> - Tasks: `docs/specs/large/approval-hierarchy/tasks.md` (tarefas atômicas).
>
> **Faça apenas a task atribuída.** Não amplie escopo. Cada task lista arquivos a criar/modificar e CAs a verificar.
>
> **Vocabulário obrigatório.** Aprovador, Validado, Faísca, Brasa, Submitter, Operacional, Líder, Sócio, Caixa-preta. Nunca use "gerar"/"otimizar"/"eficiência"/"accelerator". Sempre Koro com K.
>
> **Cross-tenant guard.** Toda query filtra por `client_id`. Toda autorização para entidades de approval retorna 404 (não 403) quando o usuário não pode ver — caixa-preta.
>
> **Imutabilidade.** Não modifique `approval_decisions` após INSERT. Não permita UPDATE em `subject_snapshot`. Triggers PG enforce isso — se um teste quebrar com "...is immutable", o teste está testando errado.
>
> **Validators paralelos.** `asyncio.gather`, não `await` sequencial. Timeout 60s por validator. Latência consolidada = `max`, não soma.
>
> Antes de marcar uma task como concluída, rode os CAs listados nela. Se algum CA falha, a task NÃO está pronta.

## 13. Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-04-30 | Versão inicial — cobre FA-13 / FR-160..170 / BR-017 / RN-023..026 / ADR-008/010/011 / T-29-30-31 / API-130..136 / EV-28..34 / ENT-34..38 |
