# ADR-013: Langfuse como Plataforma de Observabilidade LLM (substituição do MLflow)

**Status:** Aceito
**Data:** 2026-05-28
**Decisores:** Heitor Miranda
**Origem:** Benchmark observabilidade LLM (2026-05-28) — avaliação para Fase C da SPEC-021

---

## Contexto

O sunOS usa MLflow para tracing de chamadas LLM desde a Fase A do backend (NFR-026). O uso atual é mínimo: um decorator `trace_chat_turn` em `api/chat/eval/tracing.py` que loga `params` e `latency_ms` por turn de chat — sem cost tracking, sem prompt management, sem evals LLM.

A Fase C da SPEC-021 (Agentes) exige tracing de `run_agent()` com MLflow. Antes de expandir o uso, avaliamos se MLflow é a plataforma certa para um sistema LLM-first.

**Drivers:**

- **NFR-026**: 100% das chamadas LLM devem ser rastreadas (prompt, output, modelo, latência, custo)
- **SPEC-021 Fase C**: runner de agentes precisa de tracing por execução
- Stack já usa LangGraph + LangChain — integração de observabilidade deve ser nativa
- Time pequeno: custo operacional e vendor lock-in são restrições reais
- Fase D+ vai precisar de prompt management, datasets e evals — não apenas log de métricas

**Benchmark realizado (2026-05-28):**

| Critério | MLflow | LangSmith | Langfuse |
|----------|--------|-----------|----------|
| LLM-nativo | Não (adaptado) | Sim | Sim |
| Open source | Apache 2.0 | Proprietário | **MIT** |
| Self-hosting | Gratuito | Enterprise only | **Gratuito, parity total** |
| LangGraph tracing | Manual | Automático | Via CallbackHandler |
| Cost tracking | Não | Sim | Sim |
| Prompt management | Não | Sim | Sim |
| Evals LLM-as-judge | Não | Sim | Sim |
| Free tier | Self-host | 5k traces/mês, 14 dias | **50k units/mês, 30 dias** |
| Plano pago | Self-host | $39/usuário/mês | $29/mês fixo |
| Vendor lock-in | Baixo | **Alto** | Baixo |

---

## Decisão

**Langfuse substitui MLflow como plataforma de observabilidade LLM do sunOS.**

Langfuse é adotado em duas modalidades:
- **Protótipo/Piloto:** Cloud gerenciado (plano Hobby gratuito — 50k units/mês)
- **Produção:** Self-hosted via Cloud Run (Docker oficial `langfuse/langfuse`) — sem custo de licença

**Integração com LangGraph:**
```python
# api/core/observability.py
from langfuse.callback import CallbackHandler

def get_langfuse_handler() -> CallbackHandler | None:
    if not settings.LANGFUSE_SECRET_KEY:
        return None  # no-op em dev sem credenciais
    return CallbackHandler()

# Uso em runner.py e graph.py:
config = {"callbacks": [get_langfuse_handler()]}
await graph.ainvoke(state, config=config)
```

**Variáveis de ambiente adicionadas:**
```
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com  # ou URL self-hosted
```

**Migração do MLflow:**
- `api/chat/eval/tracing.py` — decorator `trace_chat_turn` substituído por `CallbackHandler` no grafo de chat
- `api/main.py` — bloco de inicialização MLflow removido
- `api/config.py` — `MLFLOW_TRACKING_URI` e `MLFLOW_ARTIFACT_ROOT` removidos; vars Langfuse adicionadas
- `requirements.txt` — `mlflow` removido; `langfuse>=2.0` adicionado
- NFR-026 — texto atualizado para referenciar Langfuse (não MLflow)

---

## Alternativas Consideradas

**MLflow (manter)** — rejeitado: foi construído para ML tradicional (treinar modelos, comparar experimentos), não para LLMs. Sem cost tracking por token, sem prompt management, sem evals LLM-as-judge. Cada feature que o sunOS vai precisar nas Fases C-D precisaria ser construída manualmente em cima de `mlflow.log_params`. Overhead operacional maior (servidor MLflow separado vs. Cloud-managed Langfuse).

**LangSmith** — rejeitado: integração LangGraph mais profunda (automática, sem CallbackHandler) e LangGraph Studio são genuinamente superiores. Mas: código proprietário e fechado; self-hosting requer licença Enterprise (custo não publicado); plano gratuito 10x menor (5k vs 50k traces/mês); $39/usuário/mês escala mal para time pequeno; lock-in alto — se o stack sair do LangChain, a ferramenta não segue. O valor diferencial (Studio, automação) não justifica o custo e o lock-in no estágio atual.

---

## Consequências

**Positivas:**
- Tracing real por execução de agente desde a Fase C (CA-04, CA-14 testáveis)
- Cost tracking por token/sessão/cliente disponível sem código extra
- Prompt management para Fase D+ sem lock-in adicional
- Zero custo em protótipo/piloto (plano gratuito cobre a escala atual)
- Self-hosting gratuito quando dados de produção precisarem de isolamento
- OpenTelemetry nativo: dados históricos portáveis se o stack mudar
- Menos código: `CallbackHandler` substitui o decorator artesanal de `tracing.py`

**Negativas:**
- Perda do LangGraph Studio (exclusivo LangSmith) — mitigação: debug via traces do Langfuse + logs FastAPI
- Integração não é 100% automática como LangSmith — requer passar `config={"callbacks": [...]}` explicitamente em cada invocação de grafo
- Adquirida pela ClickHouse em jan/2026 — direction de produto pode mudar; mitigação: open source MIT protege contra pivots; self-hosting elimina dependência da nuvem Langfuse

---

## Rastreabilidade

| Tipo | IDs |
|------|-----|
| NFRs | NFR-026 (Tracing LLM — texto atualizado para Langfuse) |
| SPECs | SPEC-021 Fase C (task 23: setup Langfuse; task 26: tracing em run_agent) |
| ADRs relacionados | ADR-010 (LangGraph — integração via CallbackHandler), ADR-009 (Gemini Flash — custo rastreado pelo Langfuse) |
| BRs | BR-009 (Governança e MLOps) |

## Critérios para Revisitar

- [ ] LangSmith lançar self-hosting com preço acessível para times pequenos
- [ ] Langfuse mudar licença pós-aquisição ClickHouse
- [ ] Volume de traces superar 50k/mês consistentemente (trigger: avaliar self-host vs plano pago)
