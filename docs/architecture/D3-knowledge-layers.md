---
diagrama: D3
titulo: Knowledge Layers L1–L5
spec-ref: 2026-06-23-oracle-deep-agent-design (Decisão 4)
adr-ref: ADR-017-knowledge-layers-guardrails
criado: 2026-06-23
---

# D3 — Knowledge Layers L1–L5

Diagrama das 5 camadas de conhecimento do Oracle Deep Agent, incluindo prioridade de retrieval e roteamento de queries.

```mermaid
flowchart TD
    Q([Query entrada]) --> ROUTER{Roteador\nde camadas}

    ROUTER -->|prioridade 1| L1
    ROUTER -->|prioridade 2| L2
    ROUTER -->|prioridade 3| L5
    ROUTER -->|prioridade 4| L3
    ROUTER -->|prioridade 5| L4

    subgraph L1["L1 — Ontologia (Alta estabilidade, curada)"]
        direction LR
        L1A[(wiki_entities\n9 entidades backbone)]
        L1B[pgvector 768d\ncosine similarity]
        L1A --- L1B
    end

    subgraph L2["L2 — Biblioteca (Média estabilidade, curada)"]
        direction LR
        L2A[(biblioteca_documents)]
        L2B[Semantic RAG\npgvector]
        L2C[BM25\nfull-text]
        L2D[Compression\nADR-008]
        L2A --- L2B
        L2A --- L2C
        L2B --- L2D
        L2C --- L2D
    end

    subgraph L5["L5 — Stakeholders (Viva, acumulativa)"]
        direction LR
        L5A[(stakeholders\nregistry)]
        L5B[pgvector 768d\nby client_id]
        L5A --- L5B
    end

    subgraph L3["L3 — Drive Raw (Contínua, sync)"]
        direction LR
        L3A[(documentos brutos\nDrive cliente)]
        L3B[chunks pgvector\nSemantic RAG]
        L3A --- L3B
    end

    subgraph L4["L4 — Reuniões (Quente/sensível)"]
        direction LR
        L4A[(meeting_transcripts\nsanitized)]
        L4B["CAG — hot\n< 60 dias\ntranscript completo"]
        L4C["RAG — cold\n≥ 60 dias\nchunks semânticos"]
        L4A -->|data < 60d| L4B
        L4A -->|data ≥ 60d| L4C
    end

    L1 --> MERGE([Fusão de resultados\npor prioridade])
    L2 --> MERGE
    L5 --> MERGE
    L3 --> MERGE
    L4 --> MERGE

    MERGE --> RESP([Resposta consolidada])

    style L1 fill:#1a2a1a,stroke:#4caf50,color:#e0ffe0
    style L2 fill:#1a1a2a,stroke:#5b8def,color:#e0e8ff
    style L5 fill:#2a1a2a,stroke:#ab7bd4,color:#f0e0ff
    style L3 fill:#2a2a1a,stroke:#c9a227,color:#fff8e0
    style L4 fill:#2a1a1a,stroke:#e05555,color:#ffe0e0
    style Q fill:#1c1c1c,stroke:#FFC801,color:#FFC801
    style ROUTER fill:#1c1c1c,stroke:#FFC801,color:#FFC801
    style MERGE fill:#1c1c1c,stroke:#888,color:#ccc
    style RESP fill:#1c1c1c,stroke:#FFC801,color:#FFC801
```

## Legenda de camadas

| Camada | Nome | Conteúdo | Retrieval | Estabilidade |
|--------|------|----------|-----------|--------------|
| **L1** | Ontologia | `wiki_entities` (9 entidades backbone) | Semantic RAG — pgvector 768d | Alta, curada |
| **L2** | Biblioteca | `biblioteca_documents` | Semantic + BM25 + compression (ADR-008) | Média, curada |
| **L3** | Drive Raw | Documentos brutos do Drive cliente | Semantic RAG chunks | Contínua, sync |
| **L4** | Reuniões | Atas processadas (pós-HITL 1) | CAG hot (< 60d) + RAG cold (≥ 60d) | Quente/sensível |
| **L5** | Stakeholders | Registry stakeholders | Semantic RAG by `client_id` | Viva, acumulativa |

## Prioridade de retrieval

Quando há sobreposição semântica entre camadas, a resposta com maior precedência é entregue:

```
L1 (Ontologia) > L2 (Biblioteca) > L5 (Stakeholders) > L3 (Drive Raw) > L4 (Reuniões)
```

Racional: L1 é a fonte mais curada e estável (Oracle-gerada, HITL-validada). L4 tem menor prioridade por ser conteúdo mais volátil e sensível (reuniões recentes).

## Notas de implementação

- **L1 embedding:** requer `ALTER TABLE wiki_entities ADD COLUMN embedding vector(768)` (Decisão 3)
- **L4 CAG:** transcrição sanitizada carregada inteira no context window para reuniões hot; Anthropic prompt cache para queries repetidas
- **L4 cold transition:** job diário verifica atas > 60 dias, chunka e indexa no pgvector, remove da tabela hot
- **L5 isolamento:** filtro obrigatório por `client_id` em todas as queries (caixa-preta RN-010)
- **Embeddings:** `text-embedding-004` (Gemini, 768 dims) — mesmo modelo de `api/chat/knowledge/embeddings.py`
