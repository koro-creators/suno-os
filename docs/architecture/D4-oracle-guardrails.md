---
diagrama: D4
titulo: Oracle Guardrails — 3 Camadas de Proteção
spec-ref: 2026-06-23-oracle-deep-agent-design.md (Decisão 8)
criado: 2026-06-23
---

# D4 — Oracle Guardrails

Três camadas de proteção que governam o que o Oracle pode ler, escrever e quem pode acessar o que ele produz.

```mermaid
flowchart LR
    subgraph G1["Guardrail 1 — Input (o que o Oracle pode ler)"]
        direction TB
        D1["Drive docs\nstatus: ready | approved"]
        D2["Reuniões\nsanitized_content preenchido\n(pós-HITL 1)"]
        NR1["❌ Docs de outros clientes"]
        NR2["❌ system_prompts / brand_guidelines\nde outros clientes"]
        NR3["❌ Reuniões não-sanitizadas\n(sem HITL 1 aprovado)"]
    end

    subgraph G2["Guardrail 2 — Output (o que o Oracle pode escrever)"]
        direction TB
        PF["PII Filter\nnomes de pessoas físicas removidos\nou anonimizados\n(exceto stakeholders cadastrados)"]
        SD["Sensitive Topic Detector"]
        SD --> V1["Valores financeiros específicos → filtrar"]
        SD --> V2["Dados de RH → filtrar"]
        SD --> V3["Info de concorrência confidencial → flag p/ revisão"]
        PH2["Pipeline pós-HITL 2"]
        PH2 --> P1["embed_text → wiki_entities.embedding"]
        PH2 --> P2["LLMGraphTransformer → knowledge_entities\n(badge: oracle_seed) + entity_relationships"]
    end

    subgraph G3["Guardrail 3 — Acesso à ontologia gerada"]
        direction TB
        CS["CONTRACTED_SCOPE\n(tier financeiro sensível)"]
        DE["Demais entidades\n(E1–E7, E9)"]
        MH["Reuniões hot\n(< 60 dias, pré-CAG)"]
        CS --> RA["roles: admin | sponsor\nsomente"]
        DE --> RN["roles normais do cliente"]
        MH --> RH["role com hitl1_approval"]
    end

    D1 --> Oracle["Oracle\nDeep Agent"]
    D2 --> Oracle
    NR1 -. bloqueado .-> Oracle
    NR2 -. bloqueado .-> Oracle
    NR3 -. bloqueado .-> Oracle

    Oracle --> PF
    Oracle --> SD
    PF --> PH2
    SD --> PH2

    PH2 --> CS
    PH2 --> DE
    PH2 --> MH
```

## Notas de implementação

| Guardrail | Onde vive | Referência |
|-----------|-----------|------------|
| G1 — Input | `api/onboarding/service.py` (gate pré-agent) | Decisão 8, Decisão 6 (HITL 1) |
| G2 — Output | Filtros pós-agent antes de gravar em `wiki_entities` | Decisão 7 (Pipelines pós-HITL 2) |
| G3 — Acesso | Column-level security ou row-level filter em `wiki_entities` | ADR-017 (a criar) |

A mesma invariante de caixa-preta (`.claude/rules/caixa-preta.md`) aplica: endpoints retornam 404 (nunca 403) quando o usuário não tem acesso a uma entidade de outro cliente.
