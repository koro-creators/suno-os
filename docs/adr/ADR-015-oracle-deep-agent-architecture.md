---
adr-id: ADR-015
titulo: Arquitetura Oracle — deep agent com subagentes por entidade
status: Proposto
criado: 2026-06-23
upstream:
  - ADR-007 (Schema canônico de entidades ontológicas do cliente — v2)
  - ADR-009 (Gemini Flash como LLM padrão)
  - ADR-010 (LangGraph como orquestrador)
  - ADR-012 (deepagents harness para BC-04 e BC-07)
downstream:
  - ADR-016 (Meeting Processing CAG/RAG — a criar)
  - ADR-017 (Knowledge Layers Guardrails — a criar)
  - SPEC-015 v2 (Onboarding Oracle — a reescrever)
---

# ADR-015 — Arquitetura Oracle: deep agent com subagentes por entidade

## Contexto

### Oracle atual (v1)

O Oracle atual em `api/onboarding/oracle_agent.py` é um LangGraph de 2 nós:

```
START → _research_node (Tavily web search) → _extract_entities_node (Gemini Flash) → END
```

Invocado uma vez por entidade, serializado: para popular 9 entidades, o caller externo invoca `invoke_oracle()` 9 vezes em sequência. As entidades são hardcoded como 6 tipos (`Posicionamento`, `Persona`, `Competidor`, `Produto`, `TomDeVoz`, `Briefing`) que divergem do schema canônico definido no BRD (BR-021, BR-022) e atualizado no ADR-007 v2.

### Problemas do LangGraph 2-nós

**1. Sem paralelização nativa por entidade.**
O grafo é projetado para processar uma entidade por invocação. Paralelizar é responsabilidade do caller — não há plano, não há coordenação, não há fallback por entidade dentro do grafo.

**2. Contexto monolítico causa interferência semântica.**
Um LLM com contexto único vendo fontes de Tavily para brand voice e para análise competitiva simultaneamente tende a contaminar as entidades entre si. Persona contamina brand voice; market context vaza para legal constraints.

**3. Sem suporte a HITL nativo.**
O grafo `START → research → extract → END` não tem ponto de interrupção para aprovação humana antes de persistir. HITL 2 (proposta de atualização de entidade existente) exige LangGraph interrupt, que não está presente na arquitetura atual.

**4. Sem planejamento adaptativo.**
Entidades stale versus entidades vazias versus revisão completa requerem estratégias diferentes. O v1 não tem como planejar quais entidades processar ou em que ordem.

**5. Bug ativo.**
`add_reunion_context_to_oraculo` busca `entity_type="Briefings"` (plural) mas o banco grava `"Briefing"` (singular) — silent no-op que nunca atualiza a entidade. Será corrigido como parte da reescrita.

### Decisão motivadora

O redesign do Oracle (documentado em `docs/superpowers/specs/2026-06-23-oracle-deep-agent-design.md`) decidiu migrar para a primitiva `create_deep_agent` do LangChain/LangGraph. Essa decisão é o tema central deste ADR.

---

## Decisão

**O Oracle migra de um LangGraph 2-nós para um único deep agent principal (`create_deep_agent`) com 9 subagentes especializados por tipo de entidade.**

O agente principal:
- Recebe como input: `client_id`, fontes disponíveis (Drive paths, URLs da proposta, job descriptions Suno), lista de entity_types a processar
- Planeja via `write_todos` quais subagentes executar e em que ciclo (onboarding, revisão periódica, revisão por evento)
- Despacha subagentes em paralelo com `concurrency=9`
- Consolida resultados compactos de cada subagente
- Emite LangGraph interrupt quando qualquer subagente detecta contradição com entidade existente (HITL 2)

Cada subagente:
- Recebe contexto **isolado** — não herda contexto do agente principal nem de outros subagentes
- Processa fontes específicas ao seu `entity_type`
- Retorna resultado compacto (`entity_type`, `content`, `confidence`, `sources_used`, `proposed_update_flag`)
- Não persiste diretamente no banco — o agente principal orquestra a persistência pós-HITL

---

## Arquitetura do agente

```
OracleDeepAgent (create_deep_agent)
│
├── Agente principal
│   ├── tools: write_todos, list_client_documents, get_entity_current_state
│   ├── Planeja via write_todos quais entidades atualizar
│   ├── Despacha subagentes em paralelo (concurrency=9)
│   ├── Coleta resultados compactos
│   └── LangGraph interrupt → HITL 2 quando proposed_update_flag=True
│
└── Subagentes (um por entity_type)
    ├── subagent-profile      → CLIENT_PROFILE
    ├── subagent-market       → MARKET_CONTEXT
    ├── subagent-competitors  → COMPETITORS
    ├── subagent-brand        → BRAND_VOICE
    ├── subagent-personas     → TARGET_PERSONAS
    ├── subagent-legal        → LEGAL_CONSTRAINTS
    ├── subagent-objectives   → BUSINESS_OBJECTIVES
    ├── subagent-contract     → CONTRACTED_SCOPE
    └── subagent-martech      → MARTECH_STACK
```

### Isolamento de contexto

Cada subagente recebe apenas:
- `client_id` + `client_name`
- Fontes permitidas para o seu `entity_type` (lista de paths/URLs)
- Conteúdo atual da entidade (para delta — se existir)
- Instruções específicas do seu tipo

Nenhum subagente acessa o estado de outro subagente. Isso previne interferência semântica (ex: o contexto de análise de concorrentes não contamina a definição de brand voice).

### Virtual filesystem

O harness `deepagents` expõe um virtual filesystem por execução. O agente principal usa para armazenar artefatos intermediários (lista de fontes encontradas, log de decisões do plano). Subagentes usam para escrever seus resultados compactos antes do consolidador principal ler.

**Guardrail de acesso ao FS:** wrapper com `client_id` injetado — paths fora do namespace `/{client_id}/oracle/` são bloqueados. Nenhum subagente acessa o namespace de outro client (caixa-preta, conforme `.claude/rules/caixa-preta.md`).

---

## Subagentes

### Tabela de subagentes e fontes

| Subagente | entity_type | Fontes primárias | Tools |
|-----------|-------------|-----------------|-------|
| `subagent-profile` | `CLIENT_PROFILE` | Drive cliente + web (Tavily) | `read_drive_doc`, `tavily_search` |
| `subagent-market` | `MARKET_CONTEXT` | Drive + web + Tavily | `read_drive_doc`, `tavily_search` |
| `subagent-competitors` | `COMPETITORS` | Drive + web + Tavily | `read_drive_doc`, `tavily_search` |
| `subagent-brand` | `BRAND_VOICE` | Drive + brand guidelines | `read_drive_doc`, `read_brand_guidelines` |
| `subagent-personas` | `TARGET_PERSONAS` | Drive + brief | `read_drive_doc` |
| `subagent-legal` | `LEGAL_CONSTRAINTS` | Drive + contrato | `read_drive_doc`, `read_contract_doc` |
| `subagent-objectives` | `BUSINESS_OBJECTIVES` | Drive + proposta | `read_drive_doc`, `read_proposal_doc` |
| `subagent-contract` | `CONTRACTED_SCOPE` | Proposta comercial PDF + JDs Suno | `read_proposal_pdf`, `read_suno_job_descriptions` |
| `subagent-martech` | `MARTECH_STACK` | Drive + proposta + tech docs | `read_drive_doc`, `read_proposal_doc`, `read_tech_docs` |

### Comportamentos específicos

**`subagent-contract` (CONTRACTED_SCOPE):**
Tipo especializado que lê dois tipos de documento heterogêneos: proposta comercial final/contrato assinado (PDF enviado pelo cliente) e job descriptions das pessoas/departamentos da Suno relevantes ao contrato. Extrai: serviços contratados por área (criação/mídia/planejamento/data), tier financeiro, SLAs implícitos, responsáveis internos Suno. Output tem flag `min_role=sponsor` — somente roles `admin` e `sponsor` acessam via row-level filter em `wiki_entities`. Operacional recebe 404 (nunca 403 — caixa-preta).

**`subagent-martech` (MARTECH_STACK):**
Condicional. Antes de gerar conteúdo, o subagente verifica explicitamente se há menção a ferramentas, integrações ou plataformas de dados nos documentos disponíveis. Se não houver evidência suficiente, retorna `status=EMPTY` e não cria registro. Evita entidades fantasma com conteúdo inventado.

**`subagent-brand` (BRAND_VOICE):**
Lê brand guidelines específicos do cliente (não brand guidelines da Suno — caixa-preta). Se brand guidelines não disponíveis, opera só com Drive. Output inclui: adjetivos da voz, o que evitar, exemplos aprovados, estilo de escrita.

---

## Ciclos de execução

O agente principal planeja via `write_todos` qual ciclo está executando:

### Ciclo 1 — Onboarding inicial

Trigger: novo cliente cadastrado no wizard, proposta comercial enviada.

Todos os 9 subagentes em paralelo. Nenhuma entidade existente para comparar. Resultado: 9 registros novos em `wiki_entities` com `status=PENDING_REVIEW`. Nenhum HITL 2 (não há entidade anterior para contradizer).

```
write_todos([
  "E1: gerar CLIENT_PROFILE",
  "E2: gerar MARKET_CONTEXT",
  ...
  "E9: gerar MARTECH_STACK (verificar existência antes de popular)"
])
→ subagentes paralelos (concurrency=9)
→ consolidar resultados
→ persistir como PENDING_REVIEW
```

### Ciclo 2 — Revisão periódica

Trigger: job agendado (cron) por entidade com `updated_at > 180 dias` marcada como `STALE`.

Somente subagentes correspondentes às entidades stale. O agente principal lê `wiki_entities` para identificar quais entidades precisam revisão, planeja apenas os subagentes necessários. Cada subagente recebe o conteúdo atual da entidade e produz um delta — se diferença significativa, emite `proposed_update_flag=True` → HITL 2.

### Ciclo 3 — Revisão programática por evento

Trigger: evento externo (nova ata aprovada após HITL 1, novo documento no Drive, mudança de proposta comercial).

O evento identifica quais entity_types podem ser afetados. Agente principal planeja apenas os subagentes relevantes. Mesmo fluxo do Ciclo 2 com delta e HITL 2.

---

## HITL 2

HITL 2 é o mecanismo de aprovação humana antes de persistir uma atualização de entidade existente. Implementado via LangGraph interrupt nativo do harness `deepagents`.

### Quando é acionado

- Somente em Ciclos 2 e 3 (entidade existente com status `ACTIVE`)
- Quando o subagente detecta contradição entre o conteúdo gerado e a entidade atual
- Quando `confidence < 0.75` no delta proposto

No Ciclo 1 (onboarding), não há entidade anterior — HITL 2 não se aplica.

### Payload do interrupt

```python
@dataclass
class OntologyUpdateProposal:
    entity_id: str           # UUID do registro em wiki_entities
    entity_type: str         # ex: "BRAND_VOICE"
    evidence_anchor: str     # trecho da fonte que suporta a mudança
    proposed_change: str     # diff semântico: o que muda e por quê
    confidence: float        # score do subagente (0.0–1.0)
    source_path: str         # Drive path ou URL da fonte
```

### Fluxo de aprovação

```
subagente detecta contradição
→ agente principal recebe proposed_update_flag=True
→ interrupt(value=OntologyUpdateProposal(...))
→ LangGraph pausa execução
→ UI notifica revisor (Admin/Sponsor) com payload do interrupt
→ Revisor aprova ou rejeita
→ Se aprovado: pipeline pós-HITL executa (ver abaixo)
→ Se rejeitado: entidade permanece com conteúdo anterior
```

### Pipelines pós-HITL 2

**Pipeline 1 — Embed entity:**
```
approved_update
→ UPDATE wiki_entities SET content = new_content WHERE id = entity_id
→ embed_text(new_content, model="text-embedding-004")
→ UPDATE wiki_entities SET embedding = new_embedding WHERE id = entity_id
→ invalidate_cache L1
```

**Pipeline 2 — Extract named entities (GraphRAG seed):**
```
approved_update
→ LLMGraphTransformer (ADR-013)
→ UPSERT knowledge_entities (badge=oracle_seed) + entity_relationships
→ enqueue para indexação pgvector
```

---

## LLM e embeddings

| Uso | Modelo | Motivo |
|-----|--------|--------|
| Agente principal (orquestração) | Gemini 2.5 Flash | ADR-009 padrão do projeto |
| Subagentes de entidade | Gemini 2.5 Flash | Consistência com padrão; custo controlado |
| Embeddings | `text-embedding-004` (768d) | Mesmo modelo já em `api/chat/knowledge/embeddings.py` — sem nova dependência |
| GraphRAG extraction (pós-HITL 2) | Gemini 2.5 Flash | ADR-013 |

**Nota sobre modelo do orquestrador:** ADR-012 documenta que `deepagents` foi projetado pensando em Sonnet/Opus e propõe setup híbrido (orquestrador Sonnet, subagentes Flash) para BC-04/BC-07. Para o Oracle, o agente principal faz um planejamento estruturado simples (`write_todos` com lista de 9 entidades) e não requer raciocínio de alta complexidade. Gemini 2.5 Flash é suficiente. Se a qualidade do plano degradar em testes, ADR-012 documenta o caminho de migração para setup híbrido.

---

## Alternativas consideradas

### Alternativa 1 — Manter LangGraph 2-nós, invocar 9 vezes

**Descartada por:**
- Não paraleliza: 9 invocações seriais × ~10s cada = ~90s para onboarding completo
- Sem contexto isolado por entidade: mesmo ponto de entrada para fontes heterogêneas (proposta comercial, Drive, brand guidelines) aumenta risco de interferência semântica
- HITL 2 requer LangGraph interrupt — não presente no grafo linear `research → extract → END`
- Sem planning: o caller externo precisa orquestrar quais entidades processar em qual ciclo

### Alternativa 2 — Dois deep agents separados (Oracle Onboarding + Oracle Contract)

**Descartada por:**
- `create_deep_agent` já suporta subagentes com contexto isolado dentro de um único agente principal. Separar em dois agentes não adiciona isolamento — apenas adiciona plumbing
- Dois agentes exigem: mecanismo de orquestração entre eles, deduplicação de state sharing, duplicação de guardrails de caixa-preta, dois pontos de HITL 2 em vez de um
- `CONTRACTED_SCOPE` é apenas mais um subagente especializado (com fontes diferentes e guardrail de acesso mais restritivo) — não justifica agente separado
- ADR-007 v2 formaliza os 9 entity_types como backbone unificado: separar o agente contradiz o schema canônico

### Alternativa 3 — Manter LangGraph nativo, implementar sub-agent spawning manual

**Descartada por:**
- `deepagents` já entrega planejamento via `write_todos`, virtual FS, isolamento de contexto e LangGraph interrupt prontos
- Replicar manualmente seria NIH — mesma razão que rejeitou essa alternativa para BC-04/BC-07 em ADR-012
- Consistência: ADR-012 já adotou `deepagents` como harness para os BCs multi-agente do projeto

### Alternativa 4 — Agente único sem subagentes, contexto compartilhado

**Descartada por:**
- Contexto monolítico para 9 entidades com fontes heterogêneas satura o context window
- Interferência semântica documentada: persona contamina brand voice; análise de concorrentes contamina legal constraints
- Sem isolamento, o agente não consegue atribuir `confidence` por entidade com semântica precisa

---

## Consequências

### Positivas

- **Paralelização real:** 9 subagentes em `concurrency=9` reduzem o tempo de onboarding de ~90s (serial) para o tempo do subagente mais lento (estimado ~15–20s)
- **Isolamento semântico:** contexto por subagente elimina interferência cross-entity documentada no v1
- **HITL 2 nativo:** LangGraph interrupt é uma primitiva do harness — não requer implementação customizada
- **Planning adaptativo:** `write_todos` permite ao agente principal decidir quais entidades processar por ciclo, sem lógica hardcoded no caller
- **Consistência com ADR-012:** mesmo harness já adotado para BC-04/BC-07 — padrão de desenvolvimento unificado
- **CONTRACTED_SCOPE com guardrail nativo:** isolamento por subagente + `min_role` na entidade produzida resolvem acesso granular sem tabela separada
- **MARTECH_STACK condicional sem entidade fantasma:** o subagente verifica evidência antes de popular, garantindo `status=EMPTY` quando não há dados suficientes

### Negativas

- **Maturidade do harness:** `deepagents` ~6 meses, API ainda evoluindo (documentado em ADR-012). Mitigação: pinar versão em `pyproject.toml`; isolar em adapter
- **Reescrita do oracle_agent.py:** o v1 não é incrementalmente extensível para esta arquitetura — reescrita completa necessária
- **Concorrência de subagentes:** 9 invocações paralelas ao Gemini Flash podem pressionar rate limits em onboarding simultâneo de vários clientes. Mitigação: semáforo por `client_id`; backoff exponencial por subagente
- **Virtual FS com guardrail customizado:** o harness expõe FS sem RBAC nativo — wrapper `client_id`-scoped necessário (padrão documentado em ADR-012)

### Neutras

- `invoke_oracle()` público continua existindo como entry point, mas delega ao deep agent em vez do grafo de 2 nós — callers existentes não mudam de interface
- Tracing MLflow via callbacks LangChain permanece funcional (spans aninhados por subagente) — NFR-026 mantido
- Bug `entity_type="Briefings"` é resolvido implicitamente pela reescrita — o novo schema usa os 9 entity_types canônicos do ADR-007 v2

---

## Pendências

### Bloqueantes para implementação

- [ ] ADR-007 v2 aceito (feito — ver `docs/adr/ADR-007-cadastro-ontologico-cliente.md`)
- [ ] Migration: `ALTER TABLE wiki_entities ADD COLUMN embedding vector(768)` — bloqueante para persistência pós-HITL 2
- [ ] PoC de 1 sprint: `create_deep_agent` com 2 subagentes (profile + brand) para validar qualidade do plan com Gemini Flash puro (análogo ao critério de ADR-012 §"Pré-requisitos")
- [ ] Validação de tracing MLflow com spans aninhados por subagente (ADR-012 §"Pré-requisitos" — mesma exigência)

### Tech debt a resolver junto da reescrita

- Corrigir bug `entity_type="Briefings"` → `"Briefing"` (obsoleto após reescrita com schema v2)
- Remover 6 entity_types hardcoded do v1 (`Posicionamento`, `Persona`, etc.) e substituir pelos 9 canônicos do ADR-007 v2
- Migrar `_SEARCH_TERMS` e `_ENTITY_PROMPTS` para prompts por subagente isolados

### Não bloqueante (Fase posterior)

- [ ] Setup híbrido orquestrador Sonnet + subagentes Flash se qualidade do plan Gemini degradar
- [ ] Rate limiting por `client_id` para onboarding simultâneo
- [ ] UI de revisão HITL 2: payload `OntologyUpdateProposal` → componente de diff no frontend
- [ ] Política de arquivamento: entidade `ACTIVE` com `updated_at > 180 dias` → flag `STALE` para Ciclo 2

---

## Rastreabilidade

| Tipo | IDs |
|------|-----|
| BRs | BR-021 (Wiki Ontológica), BR-022 (Onboarding Oracle) |
| ADRs upstream | ADR-007 v2 (schema de entidades), ADR-009 (Gemini Flash padrão), ADR-010 (LangGraph), ADR-012 (deepagents harness), ADR-013 (LLMGraphTransformer + AlloyDB) |
| ADRs downstream | ADR-016 (Meeting Processing), ADR-017 (Knowledge Layers Guardrails) |
| SPECs | SPEC-015 v2 (Onboarding Oracle — a reescrever) |
| Arquivo atual | `api/onboarding/oracle_agent.py` (v1 — a reescrever) |
| Regras | `.claude/rules/caixa-preta.md` (404 genérico, cross-tenant guard) |

## Critérios para Revisitar

- [ ] `deepagents` descontinuado pela LangChain Inc. (mesmo critério de ADR-012)
- [ ] Latência do onboarding com 9 subagentes paralelos ultrapassar SLA definido no SPEC-015 v2
- [ ] Rate limits do Gemini Flash inviabilizarem `concurrency=9` em carga real
- [ ] Surgimento de primitiva melhor para planejamento + isolamento no ecossistema LangGraph
