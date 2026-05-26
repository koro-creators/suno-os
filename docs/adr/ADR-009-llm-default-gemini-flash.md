# ADR-009: Gemini 2.5 Flash como LLM Default

**Status:** Aceito
**Data:** 2026-05-15
**Decisores:** Heitor Miranda, José Lucas
**Origem:** Promovido do SRD Parte 7 ADR-004 (proposto 2026-04-28, implementado antes da promoção)

---

## Contexto

O sunOS realiza dezenas a centenas de chamadas LLM por dia cobrindo: classificação de intenção (TopSupervisor), geração de copy/roteiros/análises (ContentCreator), conversação geral (Conversational), enhancement de prompts, workflows agendados e, futuramente, pré-validação de assets (FA-13).

O código (`api/chat/graph/runner.py:MODEL_MAP`) implementa **Gemini 2.5 Flash como default** com fallback automático quando keys de Anthropic ou OpenAI estão ausentes.

**Drivers:**

- BR-002 (Aceleração operacional): custo precisa permitir alto volume de chamadas
- BR-013 (Mensuração de custo evitado): business case depende de custo baixo por execução
- NFR-001 (P95 first-token < 1500ms)
- NFR-017 (Suporte multi-LLM preservado)
- Restrição: orçamento fechado para POC/Protótipo (Q3 2026)

**Custo comparativo (snapshot abril 2026):**

| Modelo | Input ($/M tokens) | Output ($/M tokens) | Lat. típica |
|--------|-------------------|---------------------|-------------|
| Gemini 2.5 Flash | $0.075 | $0.30 | 200–700ms TTFT |
| Claude Sonnet 4 | $3.00 | $15.00 | 1.5–3s |
| GPT-4o | $2.50 | $10.00 | ~1s |

---

## Decisão

**Gemini 2.5 Flash é o LLM default do sunOS**, com Claude Sonnet 4 e GPT-4o disponíveis sob demanda via parâmetro `model` na request.

- Default em `runner.py:_build_initial_state(model="gemini-flash")` e `Settings.DEFAULT_MODEL`
- Fallback automático para Gemini Flash quando key específica de outro provider está ausente
- Skills MAY override modelo (campo `model` em SkillAdmin) quando qualidade superior justifica custo
- Reavaliar default a cada 6 meses ou quando novo modelo Gemini for lançado

---

## Alternativas Consideradas

**Claude Sonnet 4 como default** — rejeitado: custo 30–40× maior destrói business case (BR-013); latência P95 pode ultrapassar NFR-001. Manter como opt-in para casos críticos.

**GPT-4o como default** — rejeitado: custo 10–30× Gemini sem vantagem clara; sem alinhamento estratégico GCP.

**Llama 3 self-hosted via Vertex AI** — rejeitado: custo fixo alto (~$2K/mês) inadequado para volume do Piloto; operação complexa; time sem expertise.

---

## Consequências

**Positivas:**
- Custo até 40× menor que Claude Sonnet em prompts curtos — viabiliza alto volume (BR-013)
- Latência baixa alinhada a NFR-001
- Tier gratuito Google AI Studio para desenvolvimento local
- Janela de contexto 1M tokens — suporta context injection ampla da Biblioteca (RN-021)
- Multimodal nativo — útil para skills visuais futuras
- Hosting GCP alinha com Cloud Run + Cloud SQL + Secret Manager
- Multi-LLM preservado: trocar default é mudar uma string (NFR-017)

**Negativas:**
- Qualidade marginalmente inferior a Claude Sonnet 4 em raciocínio complexo — mitigação: skills críticas podem usar `model=claude` explicitamente
- Risco de degradação por mudanças de modelo Google — mitigação: pinning de versão (`gemini-2.5-flash`, não `gemini-flash-latest`); MLflow tracing detecta regressões
- Vendor concentration com Google — mitigação: NFR-017 garante portabilidade arquitetural

---

## Rastreabilidade

| Tipo | IDs |
|------|-----|
| BRs | BR-002 (Aceleração), BR-013 (Custo evitado) |
| NFRs | NFR-001 (Latência), NFR-017 (Multi-LLM) |
| Containers | CP-09 `runner.py` (MODEL_MAP + fallback) |
| ADRs | ADR-002 (engine único orquestra qualquer modelo), ADR-010 (LangGraph abstrai provedor) |

## Critérios para Revisitar

- [ ] Gemini 3 Flash lançado (esperado H2/2026) — reavaliar se novo modelo muda equilíbrio
- [ ] Claude Haiku 4 lançado — comparar custo/latência com Gemini Flash
- [ ] NFR-001 violado em medição real com volume do Piloto
- [ ] Skill crítica apresentar qualidade sistematicamente inferior ao aceito pelo usuário com Flash
