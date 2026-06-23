# D1 — Arquitetura Geral do Oracle Deep Agent v2

Visão geral do Oracle Deep Agent v2: orquestração de 9 subagentes paralelos por tipo de entidade, fontes de dados, gates HITL e pipeline pós-aprovação até wiki_entities e knowledge_entities.

```mermaid
flowchart LR
    %% ── Fontes de dados ──────────────────────────────────────────────
    subgraph SOURCES["Fontes de Dados"]
        direction TB
        DRV["Drive Cliente\n(docs ready/approved)"]
        WEB["Tavily / Web"]
        PDF["PDF Proposta Comercial\n+ Contrato Assinado"]
        JDS["JDs Suno\n(job descriptions internos)"]
    end

    %% ── Oracle Deep Agent principal ──────────────────────────────────
    subgraph ODA["Oracle Deep Agent (principal)"]
        direction TB
        PLAN["write_todos\n(planejamento de entidades)"]
        DISPATCH["dispatch subagentes\n(paralelo)"]
        CONSOLIDATE["consolidar resultados"]
    end

    %% ── 9 Subagentes em paralelo ─────────────────────────────────────
    subgraph SUBS["9 Subagentes (paralelo, contexto isolado)"]
        direction TB
        SA1["subagent-profile\nCLIENT_PROFILE (E1)"]
        SA2["subagent-market\nMARKET_CONTEXT (E2)"]
        SA3["subagent-competitors\nCOMPETITORS (E3)"]
        SA4["subagent-brand\nBRAND_VOICE (E4)"]
        SA5["subagent-personas\nTARGET_PERSONAS (E5)"]
        SA6["subagent-legal\nLEGAL_CONSTRAINTS (E6)"]
        SA7["subagent-objectives\nBUSINESS_OBJECTIVES (E7)"]
        SA8["subagent-contract\nCONTRACTED_SCOPE (E8)"]
        SA9["subagent-martech\nMARTECH_STACK (E9)"]
    end

    %% ── HITL 2 gate ──────────────────────────────────────────────────
    subgraph HITL2["HITL 2 — Ontology Update Gate\n(LangGraph interrupt)"]
        direction TB
        PROP["OntologyUpdateProposal\nentidade + evidência + diff + confidence"]
        REVIEW["Revisão humana\n(Admin / Sponsor)"]
        DECISION{aprovado?}
    end

    %% ── Pipeline pós-HITL 2 ──────────────────────────────────────────
    subgraph POST["Pipeline Pós-HITL 2"]
        direction TB
        P1["Pipeline 1 — Embed Entity\nupdate content → embed → update embedding\ninvalidate cache L1"]
        P2["Pipeline 2 — GraphRAG Seed\nLLMGraphTransformer → upsert entity_relationships\nbadge: oracle_seed"]
    end

    %% ── Destinos finais ──────────────────────────────────────────────
    WE[("wiki_entities\nvector(768) pgvector\nL1 — Ontologia")]
    KE[("knowledge_entities\n+ entity_relationships\nGraphRAG")]

    %% ── Fluxo principal ──────────────────────────────────────────────
    SOURCES --> ODA
    DRV --> SA1 & SA2 & SA3 & SA4 & SA5 & SA6 & SA7 & SA9
    WEB --> SA2 & SA3
    PDF --> SA6 & SA7 & SA8 & SA9
    JDS --> SA8

    PLAN --> DISPATCH
    DISPATCH --> SUBS
    SUBS --> CONSOLIDATE
    CONSOLIDATE --> PROP

    PROP --> REVIEW
    REVIEW --> DECISION
    DECISION -- "rejeitado" --> CONSOLIDATE
    DECISION -- "aprovado" --> POST

    P1 --> WE
    P2 --> KE
    P2 --> WE
```
