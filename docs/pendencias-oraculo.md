# Pendências — SPEC-015 Oráculo do Cliente (FA-15)

**Referência:** `docs/specs/large/onboarding-oraculo-cliente/`
**Atualizado:** 2026-06-04
**Branches:** `oraculo-parte-1` → `oraculo-parte-2` → `oraculo-parte-3`

Estado atual: ~80% funcional. API real conectada, web search com allow-list implementado.

---

## ✅ RESOLVIDOS

### ~~B1 — Web search com allow-list~~ → **RESOLVIDO** em `oraculo-parte-3`
**Branch:** `oraculo-parte-3` commit `b0f33d7`

- `api/oracle/web_search.py` criado com allow-list enforcement, robots.txt, detecção de paywall e proveniência rastreável (`source_type`, `reference`, `cited_excerpt`, `retrieved_at`)
- `oracle_agent.py` integrado: faz web fetch antes de chamar o LLM, contexto web entra no prompt
- `service.py` passa `oracle_config.allowed_domains` para o agente e salva proveniência real nas entidades
- **CA-20 agora passa** — nenhum fetch ocorre fora da allow-list

### Chat Lateral (Oráculo sunOS) → **RESOLVIDO** em `oraculo-parte-3`
- SSE parser corrigido: lê `event:` e `data:` separadamente (API retorna `json.content`, não `json.data.content`)
- Título: "Oráculo sunOS" com letras OS maiores
- ChatPanel aparece apenas para usuários logados (`oraculo-parte-2`)

---

## 🔴 BLOQUEADORES — Sem isso o Oráculo não funciona de verdade

---

### B2 — LLMGraphTransformer não implementado (ADR-LOCAL-06)
**Task:** TASK-B03 | **CA:** CA-03, CA-04 | **Regra:** ADR-LOCAL-06, ADR-013

O design (v1.1) exige `LLMGraphTransformer` com `allowed_nodes=ONTOLOGY_NODES` e `strict_mode=True`. O que existe hoje (`api/onboarding/oracle_agent.py`) é uma chamada raw ao Gemini Flash sem estrutura de grafo.

**O que falta:**
- Criar `api/oracle/entity_generator.py` com `LLMGraphTransformer`:
  ```python
  from langchain_experimental.graph_transformers import LLMGraphTransformer
  transformer = LLMGraphTransformer(
      llm=llm,
      allowed_nodes=["Posicionamento", "Persona", "Competidor", "Produto", "TomDeVoz", "Briefing"],
      strict_mode=True,
  )
  ```
- Sem isso, o Oráculo não está alinhado com o padrão de extração ontológica do sunOS (ADR-013)

---

### B3 — PRE_ACTIVE não bloqueia Skills e Workflows (CA-18)
**Task:** TASK-C06 | **CA:** CA-18 | **Regra:** RF-06, constitution §1.2

A constitution diz: "Status PRE_ACTIVE/ACTIVE é gate hard — qualquer tentativa de executar Skill, Moon Shot ou Workflow para cliente PRE_ACTIVE deve falhar com 404 genérico."

**O que falta:**
- Criar `api/onboarding/guards.py` com:
  ```python
  async def require_active_client(client_slug: str) -> None:
      client = await get_client_by_slug(client_slug)
      if not client or client["status"] == "PRE_ACTIVE":
          raise HTTPException(status_code=404, detail="Cliente não disponível")
  ```
- Adicionar `Depends(require_active_client)` nos endpoints de chat, skill e workflow
- Hoje um cliente em PRE_ACTIVE consegue executar Skills normalmente — viola CA-18

---

### B4 — Auto-save do wizard não persiste (CA-02)
**Task:** TASK-C02 | **CA:** CA-02 | **Regra:** RF-01 RN-W02

CA-02: "DADO passo 1 preenchido, QUANDO PX-01 fecha o browser e retorna em ≤24h, ENTÃO wizard retoma no passo 1 com dados preenchidos."

O `OnboardingOraculoContext.tsx` guarda o estado do wizard em React state (memória). Se o usuário fechar o browser, tudo se perde.

**O que falta:**
- No `OnboardingOraculoContext.tsx`: persistir `wizardState` em `localStorage` a cada `updateWizard()` com timestamp
- No `useEffect` inicial: ler `localStorage`, verificar se `Date.now() - savedAt < 24 * 3600 * 1000`, restaurar se válido
- Limpar localStorage após `submitWizard()` bem-sucedido

---

### B5 — Slug duplicado retorna 500 em vez de 422 com mensagem inline (CA-01)
**Task:** TASK-A04 | **CA:** CA-01 | **Regra:** RF-01 RN-W01

CA-01: "QUANDO PX-01 preenche passo 1 com slug duplicado, ENTÃO erro inline 'Slug já utilizado' sem avançar."

Hoje: o DB tem `UNIQUE(slug)`, mas o service não trata a exceção de unicidade — o FastAPI retornaria 500.

**O que falta:**
- Em `service.py → create_client()`: antes do INSERT, verificar se o slug já existe via `db_get_client_by_slug()` ou in-memory; se sim, `raise HTTPException(422, "slug_already_exists")`
- Em `WizardStep1Metadata.tsx`: chamar `GET /api/clients?slug={slug}` ou tratar o 422 do submit para exibir erro inline no campo sem avançar de step

---

## 🟡 IMPORTANTES — Funciona parcialmente, mas viola a spec

### I1 — Estrutura de módulo `api/oracle/` não criada
**Task:** TASK-B04 | **Regra:** design.md §1.3

O design especifica:
```
api/oracle/
  agent.py            # LangGraph StateGraph
  web_search.py       # tool com allow-list
  entity_generator.py # LLMGraphTransformer
  constants.py        # ONTOLOGY_ENTITY_TYPES, ENTITY_PROMPTS
```

Hoje tudo está em `api/onboarding/oracle_agent.py` e `api/onboarding/constants.py`. Não é bloqueador funcional, mas viola o design e dificulta manutenção.

**O que falta:**
- Criar diretório `api/oracle/` com os 4 módulos
- Mover/refatorar `oracle_agent.py` → `api/oracle/agent.py`
- Mover constantes de entidade → `api/oracle/constants.py`
- Atualizar imports em `service.py`

---

### I2 — Validação de ≥100 palavras sem retry
**Task:** TASK-B03 | **Regra:** RF-03, constitution §2 (qualidade)

Spec RF-03: "Cada entidade: ≥100 palavras de conteúdo substantivo. Retry max 2 se <100 palavras."

Os fallbacks em `oracle_agent.py` têm ~50-70 palavras cada. Não há validação nem retry.

**O que falta:**
- Em `entity_generator.py` (ou `oracle_agent.py` enquanto não refatorado): após gerar, contar palavras; se `len(content.split()) < 100`, retentar prompt com instrução explícita de expandir (max 2 retries)
- Fallback templates precisam ser expandidos para ≥100 palavras

---

### I3 — `WikiEntityEditor.tsx` não existe como componente separado
**Task:** TASK-D02 | **Regra:** design.md §1.2

O design especifica `WikiEntityEditor.tsx` como componente separado. A edição inline está provavelmente dentro de `WikiEntityCard.tsx`, mas o componente autônomo não existe.

**O que falta:**
- Criar `components/wiki/WikiEntityEditor.tsx` — textarea expansível com save/cancel
- Extrair lógica de edição de `WikiEntityCard.tsx` para esse componente
- Conectar ao endpoint `PATCH /api/clients/{slug}/wiki/{entity_type}` (já implementado)

---

### I4 — `EntityActionBar.tsx` não existe como componente separado
**Task:** TASK-C05 | **Regra:** design.md §1.2

O design especifica `EntityActionBar.tsx` separado da `EntityValidationCard.tsx`. As ações (Aceitar / Editar / Rejeitar+Regenerar) estão dentro do card.

**O que falta:**
- Criar `components/onboarding/EntityActionBar.tsx`
- Extrair os 3 botões + textarea de edição de `EntityValidationCard.tsx`
- A proibição de "Aceitar tudo" / "Pular" (CA-10, RN-032) deve estar explícita neste componente

---

### I5 — Link "Wiki" ausente na Sidebar por contexto de cliente
**Task:** TASK-D04 | **Regra:** RF-07, design.md §1.2

A wiki existe em `/clientes/[clientId]/wiki` mas não há link para ela na navegação lateral quando o usuário está no contexto de um cliente ACTIVE.

**O que falta:**
- Na sidebar ou no layout do cliente, adicionar item "Wiki Ontológica" visível apenas se:
  - `client.status === ACTIVE`
  - `role === 'admin'` ou `role === 'creator'` (nunca para `operacional`)
- Pode ser adicionado no `AppHeader` do layout do cliente ou como sub-nav em `/clientes/[id]`

---

### I6 — WizardStep3Drive.tsx é placeholder (dependência SPEC-006)
**Task:** TASK-C02 | **Regra:** RF-01 Passo 3, PRE-03

O passo 3 do wizard (conectar Drive Suno) está implementado como placeholder com mensagem "aguardando FA-14". Isso é **esperado** (PRE-03 na constitution), mas precisa ser documentado como dependência aberta.

**Quando desbloqueia:** SPEC-006 FA-14 Drive OAuth implementado.

---

## 🟢 PÓS-PILOTO — Não bloqueia o piloto, mas está na spec

### P1 — Testes de integração ausentes (TASK-E01)
**CA:** todos (CA-01 a CA-20)

Nenhum teste automatizado para o fluxo de onboarding. A spec exige `api/tests/test_onboarding_integration.py` e `api/tests/test_wiki_rbac.py` com DB real.

**O que falta:**
- `test_onboarding_integration.py`: testar wizard CRUD, validate, transição ACTIVE, guard PRE_ACTIVE
- `test_wiki_rbac.py`: testar CA-15 (Operacional recebe 404), CA-17 (PRE_ACTIVE recebe 404)
- `test_oracle_agent.py`: mock LLM + mock web search, cobrir allow-list enforcement e retry <100 palavras

---

### P2 — Alerta Admin 72h não está no painel Admin (TASK-E03 / CA-19)
**CA:** CA-19 | **Regra:** RF-06, FR-185

CA-19: "DADO Admin no painel de clientes, QUANDO há cliente em PRE_ACTIVE há ≥72h, ENTÃO alerta in-app visível."

A detecção de staleness (`isEntityStale()`) existe no frontend para entidades na tela de HITL. Mas o painel Admin não mostra clientes presos em PRE_ACTIVE ≥72h.

**O que falta:**
- Backend: endpoint `GET /api/clients?status=PRE_ACTIVE` já existe (implementado hoje); adicionar campo `pending_hours` calculado de `pre_active_since`
- Frontend: no painel Admin (`/configuracoes` ou `/clientes`), banner de alerta listando clientes PRE_ACTIVE com `pending_hours ≥ 72`

---

### P3 — TypeScript check e build não verificados (TASK-E02)
**Regra:** CLAUDE.md convenções

`node_modules` está vazio na máquina. Precisa de `npm install` para rodar `npx tsc --noEmit` e `npm run build`.

**Pré-condição:** `npm install` executado no projeto.

---

### P4 — `npm install` não foi executado
O projeto não tem `node_modules` populado. Nenhum comando Node/npm funciona.

**Ação:** `npm install` na raiz do projeto antes de qualquer check de frontend.

---

## Resumo executivo

| Prioridade | Item | Status | Impacto |
|------------|------|--------|---------|
| ✅ B1 | Web search com allow-list | Resolvido (parte-3) | CA-20 passa, proveniência real |
| 🔴 B2 | LLMGraphTransformer | Aberto | Violação ADR-LOCAL-06 / ADR-013 |
| 🔴 B3 | Guard PRE_ACTIVE em Skills/Workflows | Aberto | CA-18 viola constitution §1.2 |
| 🔴 B4 | Auto-save wizard localStorage | Aberto | CA-02 nunca passa |
| 🔴 B5 | Slug duplicado retorna 500 | Aberto | CA-01 nunca passa |
| ✅ I1 | Módulo `api/oracle/` separado | Resolvido (parte-3) | Arquitetura alinhada com design.md |
| 🟡 I2 | Validação ≥100 palavras + retry | Aberto | RF-03 não atendido |
| 🟡 I3 | `WikiEntityEditor.tsx` separado | Aberto | design.md §1.2 não atendido |
| 🟡 I4 | `EntityActionBar.tsx` separado | Aberto | design.md §1.2 não atendido |
| 🟡 I5 | Link Wiki na Sidebar | Aberto | UX: navegação para Wiki inexiste |
| 🟡 I6 | WizardStep3Drive placeholder | Aberto | Aguarda SPEC-006 FA-14 |
| 🟢 P1 | Testes de integração | Aberto | Sem cobertura automatizada |
| 🟢 P2 | Alerta Admin 72h | Aberto | CA-19 não implementado no painel |
| 🟢 P3/P4 | `npm install` + `tsc --noEmit` | Aberto | TypeScript não verificado |

**Para ir a piloto com cliente real:** resolver B2, B3, B4, B5 no mínimo.
B2 (LLMGraphTransformer) pode ficar para pós-piloto se o Gemini raw já gerar conteúdo aceitável.
