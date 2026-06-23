---
diagram-id: D2
titulo: Dual HITL Pipeline — Processamento de Reuniões
relacionado: ADR-016, SPEC-016, docs/superpowers/specs/2026-06-23-oracle-deep-agent-design.md (Decisão 5 + Decisão 6 + Decisão 7)
criado: 2026-06-23
status: rascunho
---

# D2 — Dual HITL Pipeline de Reuniões

Documenta o fluxo completo desde o upload de uma ata até a atualização da ontologia do cliente, passando pelos dois checkpoints humanos obrigatórios.

```mermaid
flowchart TD
    %% ─── UPLOAD ───────────────────────────────────────────────────────
    A([Upload de ata\nPDF / DOCX / transcrição]) --> B[Gravar em\nmeeting_transcripts\nstatus: pending_review]

    %% ─── HITL 1: Content Safety ───────────────────────────────────────
    B --> C{{"HITL 1\nRevisor humano\n(content safety)"}}

    C -->|Rejeita / solicita\ncorreção| B2[Devolve ao\nuploador com\nobservações]
    B2 -.->|Resubmit corrigido| A

    C -->|Aprova\ncontent sanitizado| D[Gravar\nsanitized_content\nstatus: sanitized\nts_sanitized = now]

    %% ─── BIFURCAÇÃO hot / cold ────────────────────────────────────────
    D --> E{Idade da ata}

    E -->|"< 60 dias\n(hot)"| F["CAG\nTranscrição completa\nno context window\n(prefixo cacheado\nAnthropic prompt cache)"]

    E -->|">= 60 dias\n(cold)"| G["Chunking semântico\n→ embeddings\ntext-embedding-004 768d\n→ pgvector\n(meeting_chunks)"]

    %% ─── DEEP AGENT lê reunião ────────────────────────────────────────
    F --> H[["Oracle Deep Agent\nlê reunião sanitizada\n(L4 — Camada Reuniões)"]]
    G --> H

    H --> I{Identifica\natualização\nontológica?}

    I -->|Não| Z([Fim — reunião\nindexada, sem\nmudança na ontologia])

    %% ─── HITL 2: Ontology Update Proposal ────────────────────────────
    I -->|Sim| J["LangGraph interrupt\nOntologyUpdateProposal:\n• entity_id\n• evidence_anchor (trecho da ata)\n• proposed_change (diff)\n• confidence score"]

    J --> K{{"HITL 2\nAdmin / Sponsor\n(ontology approval)"}}

    K -->|Rejeita| L[Proposta descartada\nOntologia inalterada]
    L --> Z

    K -->|Aprova| M[["Pipeline pós-HITL 2"]]

    %% ─── PIPELINES PÓS-HITL 2 ────────────────────────────────────────
    M --> N["Pipeline 1 — Embed entity\nupdate wiki_entities.content\n→ embed_text novo conteúdo\n→ update wiki_entities.embedding vector(768)\n→ invalidate cache L1"]

    M --> O["Pipeline 2 — GraphRAG seed\nLLMGraphTransformer\n→ upsert knowledge_entities (badge=oracle_seed)\n+ entity_relationships\n→ enqueue pgvector indexação"]

    N --> P([Ontologia L1 atualizada\nSemantic RAG disponível])
    O --> P

    %% ─── JOB DE TRANSIÇÃO hot→cold ───────────────────────────────────
    subgraph JOB ["Job periódico (daily) — Transição hot → cold"]
        direction LR
        Q["Verifica atas\ndata > 60 dias\nem hot access"] --> R["Chunka e indexa\nno pgvector"] --> S["Remove da\ntabela hot"]
    end

    D -.->|"Após 60 dias\n(job diário)"| JOB

    %% ─── ESTILOS ──────────────────────────────────────────────────────
    classDef hitl fill:#FFC801,stroke:#b38c00,color:#1a1a1a,font-weight:bold
    classDef agent fill:#1e3a5f,stroke:#4a90d9,color:#e8f4ff
    classDef pipeline fill:#1a3a1a,stroke:#4a9d4a,color:#e8ffe8
    classDef storage fill:#2a1a3a,stroke:#7a4a9d,color:#f0e8ff
    classDef decision fill:#3a2a1a,stroke:#9d7a4a,color:#fff8e8
    classDef job fill:#1a1a1a,stroke:#555,color:#aaa

    class C,K hitl
    class H,M agent
    class N,O pipeline
    class D,G storage
    class E,I decision
    class JOB job
```

## Legenda

| Cor | Significado |
|-----|-------------|
| Amarelo (`#FFC801`) | Checkpoint HITL — requer aprovação humana |
| Azul escuro | Oracle Deep Agent / orquestrador |
| Verde escuro | Pipelines automáticos pós-aprovação |
| Roxo escuro | Armazenamento persistente (pgvector / DB) |
| Cinza | Job assíncrono periódico |

## Pontos-chave

### HITL 1 — Content Safety
- Ocorre **antes** de qualquer processamento por IA
- Remove: PII, conteúdo de RH (demissões, avaliações), fofoca, menções pessoais
- Resultado gravado em `meeting_transcripts.sanitized_content`
- Somente após aprovação o conteúdo entra na camada L4

### Bifurcação hot / cold (Decisão 5)
- **Hot (< 60 dias):** transcript completo no context window via CAG; prefixo cacheado com Anthropic prompt cache para queries repetidas
- **Cold (>= 60 dias):** chunking + embeddings `text-embedding-004` (768d) → pgvector

### HITL 2 — Ontology Update (Decisão 6)
- Implementado via `LangGraph interrupt` dentro do grafo do deep agent
- Proposta inclui: entidade-alvo, trecho-evidência da ata, diff proposto, score de confiança
- Somente roles `Admin` / `Sponsor` podem aprovar (especialmente se envolver `CONTRACTED_SCOPE`)

### Pipelines pós-HITL 2 (Decisão 7)
- **Pipeline 1:** atualiza `wiki_entities.content` + re-embeda + invalida cache L1
- **Pipeline 2:** `LLMGraphTransformer` → upsert em `knowledge_entities` (badge `oracle_seed`) + `entity_relationships` → enfileira indexação pgvector
- Infra do Pipeline 2 fornecida pelo ADR-013 (LLMGraphTransformer + AlloyDB)

### Transição hot → cold
- Job diário verifica atas com `data > 60 dias` ainda em modo hot
- Chunka, indexa no pgvector e remove do hot access
- Garante que o contexto não cresce indefinidamente com reuniões antigas
```
