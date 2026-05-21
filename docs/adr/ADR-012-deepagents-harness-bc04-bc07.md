# ADR-012: Adoção de `deepagents` como Harness para BC-04 e BC-07

**Status:** Proposto (aguarda PoC + alinhamento Eng)
**Data:** 2026-05-15
**Decisores Propostos:** Heitor Miranda + Eng (TBD)
**Origem:** Promovido do SRD Parte 7 ADR-011 (proposto 2026-04-28)

---

## Contexto

A arquitetura atual implementa multi-agente "na unha" sobre LangGraph nativo: Provocation Engine (CTM-04) com pipeline Explorer↔Crítico, Approval Engine (CTM-08) com Brand + Português Validators paralelos, Drive Connector (CTM-09) com CurationAgent. Cada um precisa de capacidades recorrentes não ainda formalizadas:

- **Planning explícito** (decompor problema → tarefas → executar)
- **Sub-agents com contexto isolado** (cada validator com seu próprio histórico + tools)
- **Virtual filesystem** (artefatos intermediários — útil para CurationAgent inspecionando estrutura Drive)
- **Interrupts/HITL nativos** (pausar para aprovação humana — ADR-LOCAL em SPEC-004/SPEC-016)

A biblioteca `deepagents` (LangChain Inc., Python + JS) entrega esse harness sobre LangGraph: `create_deep_agent(tools, instructions, subagents=[...])` retorna um StateGraph compilado com planning tool, virtual FS, sub-agent spawning e isolamento de contexto prontos. **A questão não é "deepagents OU LangGraph"** — ela é construída SOBRE LangGraph (ADR-010). A questão é **onde** faz sentido adotar o harness.

---

## Decisão

Adotar `deepagents` como harness oficial para **três Bounded Contexts**, mantendo LangGraph nativo nos demais:

| Bounded Context / Container | Harness | Justificativa |
|---|---|---|
| **BC-04 Provocation Engine (CTM-04)** | `deepagents` | Pipeline Explorer↔Crítico↔BisociationFilter é literalmente "main agent + sub-agents com contextos isolados" — casa com a primitiva nativa do harness |
| **BC-07 Approval — Validators (CTM-08)** | `deepagents` | Brand + Português Validators são sub-agents independentes paralelos com retrieval especializado (SPEC-004 ADR-LOCAL-05) |
| **BC-07 Drive — CurationAgent (CTM-09)** | `deepagents` | Agente que navega metadata + sugere organização é o use-case canônico (planning + tools + isolamento). Virtual FS ajuda a inspecionar árvore Drive sem poluir contexto principal |
| **BC-03 Conversation Service (CTM-03)** | LangGraph nativo (mantém) | Chat com streaming SSE de baixa latência (NFR-001 first-token < 1.5s) + Skill processual single-shot. Planning loop adicionaria overhead sem ganho |
| **CTM-02 Workflows (declarativos)** | LangGraph nativo (mantém) | ADR-003 define workflow como StateGraph compilado. Previsibilidade (cron, replay, idempotência) conflita com plan dinâmico |

---

## Alternativas Consideradas

**Adotar `deepagents` em todos os BCs (incluindo CTM-03 e CTM-02)** — rejeitado: planning loop em chat single-shot piora latência first-token; workflows precisam ser determinísticos.

**Manter LangGraph nativo em todos os lugares** — rejeitado: replicamos manualmente sub-agent spawning + isolamento + planning em 3 BCs distintos. Custo de manutenção alto e padronização inconsistente.

**Outro harness (CrewAI, AutoGen, agno)** — rejeitado: investimento em LangGraph (ADR-010); CrewAI tem padrão "crew" que conflita com modelagem por BCs; AutoGen voltado a chat multi-agent humano genérico.

**Wrapper interno próprio sobre LangGraph** — rejeitado: NIH; custo de sprints reescrevendo o que `deepagents` já entrega.

---

## Consequências

**Positivas:**
- Reduz código manual em CTM-04/08/09 — sub-agent spawning, planning, virtual FS prontos
- Padronização entre os 3 BCs multi-agente — mesma topologia para devs
- ADR-LOCAL-05 da SPEC-004 (validators paralelos) vira trivial: `subagents=[brand, portugues]`
- Isolamento de contexto entre sub-agents reduz risco de cross-contamination semântica
- Continua dentro do ecossistema LangChain/LangGraph — sem fricção com ADR-010
- Compatível com tracing MLflow via callbacks LangChain (NFR-026 mantido)

**Negativas / Mitigações:**
- **Caixa-preta (RN-009/011)** — virtual FS pode expor `system_prompts` ou `references/*.md` sem RBAC. _Mitigação_: wrapper FS com `principal` injetado; whitelist de paths por role.
- **Cross-client guard (RN-010)** — sub-agents precisam ter `client_id` injetado em cada tool call. _Mitigação_: `BaseTool` helper que valida `client_id` na assinatura antes de qualquer query.
- **Modelo orquestrador** — `deepagents` projetado pensando em Sonnet/Opus. Com Gemini Flash (ADR-009), planning pode degradar. _Mitigação_: setup híbrido — orquestrador `claude-sonnet-4-6`, sub-agents `gemini-2.5-flash`. PoC mede qualidade.
- **Custo** — orquestrador Sonnet aumenta custo por submissão. _Mitigação_: cap de tokens no plan (max 2k); cache de planos similares.
- **Maturidade da lib** — `deepagents` ~6 meses; API ainda evoluindo. _Mitigação_: pinar versão em `pyproject.toml`; isolar em `api/chat/harness/deepagents_adapter.py`.

**Neutras:**
- ADR-002 (engine único) não conflita — `deepagents` interno a um BC ≠ deep agent por tenant. Ver nota revisional em ADR-002.
- Skills como `SKILL.md + references/*.md` (ADR-007) casam naturalmente com virtual FS de `deepagents`.

---

## Pré-requisitos para passar de Proposto para Aceito

1. **PoC de 1 sprint** em CTM-04 (Moon Shot) implementando Explorer↔Crítico via `create_deep_agent` com 2 sub-agents
2. Validação de tracing MLflow nesse PoC (spans aninhados visíveis, latência por sub-agent)
3. Validação de qualidade do plan com Gemini Flash puro vs. Claude Sonnet híbrido
4. Confirmação de que wrapper FS resolve Caixa-preta sem performance penalty significativo
5. Alinhamento Heitor + Eng sobre custo do híbrido Sonnet/Flash

---

## Rastreabilidade

| Tipo | IDs |
|------|-----|
| BRs | BR-001 (Provocation), BR-017 (Aprovação), BR-018 (Drive) |
| RNs | RN-009, RN-010, RN-011, RN-023 (Caixa-preta + cross-client) |
| NFRs | NFR-001 (Latência), NFR-026 (Tracing) |
| Containers | CTM-04 (Provocation Engine), CTM-08 (Approval Engine), CTM-09 (Drive Connector) |
| ADRs | ADR-002 (escopo engine único clarificado), ADR-010 (deepagents é sobre LangGraph), ADR-009 (setup híbrido Sonnet/Flash) |

## Critérios para Revisitar

- [ ] `deepagents` descontinuado pela LangChain Inc.
- [ ] Latência first-token do Provocation Engine ultrapassar NFR aceitável
- [ ] Custo do orquestrador Sonnet inviabilizar volume real de submissões
- [ ] Surgimento de harness substancialmente melhor no ecossistema
