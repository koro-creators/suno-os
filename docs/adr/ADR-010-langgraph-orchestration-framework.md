# ADR-010: LangGraph como Framework de Orquestração de Agentes

**Status:** Aceito
**Data:** 2026-05-15
**Decisores:** Heitor Miranda, José Lucas
**Origem:** Promovido do SRD Parte 7 ADR-005 (proposto 2026-04-28, já implementado)

---

## Contexto

O sunOS implementa orquestração multi-agente com routing por intenção (TopSupervisor → Orchestrator → Agent específico), ReAct loops com tools, streaming via SSE e workflow execution agendada. Essa orquestração tem ≥4 níveis de hierarquia e estado compartilhado entre nós.

O código (`api/chat/graph/`) usa **LangGraph StateGraph**: nós (`top_supervisor`, `orchestrator`, `conversation`, `respond`), edges condicionais (`route_to_intent`), state typado (`SunosChatState`), execução streaming (`graph.astream`), HITL via `interrupt()` planejado. O **mesmo engine LangGraph** é usado para chat e workflows agendados (ADR-001/ADR-003 são explícitos sobre isso).

**Drivers:**

- ADR-001/ADR-003: já decidiram LangGraph como motor de workflows visuais
- ADR-002: engine único — precisa de framework que suporte state compartilhado
- NFR-017 (Multi-LLM): framework precisa abstrair provedor
- NFR-005/006 (Disponibilidade + tolerância a falhas)
- NFR-026 (Tracing): integração com MLflow
- Padrão Koro com Meridian — time já dominou os patterns

---

## Decisão

**LangGraph é o framework de orquestração de agentes e workflows do sunOS**, mantendo LangChain core para abstrações LLM/tools/messages.

- `StateGraph` para chat (`chat/graph/builder.py`)
- `StateGraph` compilado runtime para workflows (`workflows/compiler.py`, ADR-003)
- LangChain core (`langchain-core>=0.3.40`) para `BaseMessage`, `AIMessage`, `HumanMessage`, `SystemMessage`, `ToolMessage`
- Provedores LLM via LangChain integrations (`langchain-google-genai`, `langchain-openai`, `langchain-anthropic`)
- `BaseAgent` ABC interna usa LangGraph state + LangChain tool binding (`run_react`)

---

## Alternativas Consideradas

**LangChain puro (sem LangGraph)** — rejeitado: sem state graph nativo (routing condicional vira código imperativo verboso); streaming menos limpo via `astream_events` v2; sem HITL/checkpointing built-in; sem reuso para workflows.

**agno (ex-Phidata)** — rejeitado: comunidade menor; sem state graph maduro; padrões diferentes do Meridian (perde sinergia interna Suno).

**CrewAI** — rejeitado: modelo "crew" conflita com nossa arquitetura (single-agent-per-turn, não múltiplos agents conversando); HITL menos maduro.

**Implementação custom** — rejeitado: reinventaria state graph, streaming, HITL, retries; time de 4 devs não tem capacity; quebra padrão Koro.

---

## Consequências

**Positivas:**
- Streaming nativo alinhado com SSE do FastAPI (NFR-001/002)
- State graph compilado dá performance previsível e debug simples
- Multi-provider abstraction via LangChain (`bind_tools`, `ainvoke`) — NFR-017
- HITL e checkpointing built-in — críticos para workflows pausáveis (ADR-003)
- Comunidade ativa: framework mais adotado do ecossistema LangChain em 2026
- Reuso entre chat e workflows — minimiza código duplicado (ADR-003)
- Tracing com MLflow + LangSmith integrado (NFR-026)
- Padrão compartilhado com Meridian — sinergia de time

**Negativas:**
- Volatilidade de API entre versões LangGraph 0.x — mitigação: pinning estrito + suite de testes
- Acoplamento a abstrações LangChain — mitigação: `BaseAgent` ABC interno isola consumidores
- Curva de aprendizado para devs novos — mitigação: docs em `api/CLAUDE.md`; Meridian compartilha patterns
- Overhead para casos simples — mitigação: endpoints batch chamam tools direto sem graph

---

## Rastreabilidade

| Tipo | IDs |
|------|-----|
| BRs | BR-002, BR-015 (Aceleração + integração Skills) |
| NFRs | NFR-001, NFR-002, NFR-005, NFR-006, NFR-017, NFR-026 |
| Containers | CP-06 a CP-15, CP-36 a CP-38 (módulos `chat/graph/` e `workflows/`) |
| ADRs | ADR-001 (adiado), ADR-002 (engine único), ADR-003 (workflows visuais), ADR-009 (LangChain abstrai provedor LLM), ADR-012 (deepagents é harness sobre LangGraph) |

## Critérios para Revisitar

- [ ] LangGraph 1.0 GA estabilizar contratos de API (esperado 2027)
- [ ] Custo de manter compatibilidade com LangChain crescer além do benefício
- [ ] Harness substancialmente superior surgir no ecossistema
