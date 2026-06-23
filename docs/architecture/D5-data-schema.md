---
diagrama: D5
titulo: Schema de Dados Oracle v2
versao: 2.0
criado: 2026-06-23
atualizado: 2026-06-23
referencia: 2026-06-23-oracle-deep-agent-design.md
adrs: ADR-007 rev, ADR-013, ADR-015, ADR-016, ADR-017
---

# D5 — Schema de Dados Oracle v2

ER diagram das tabelas que suportam o Oracle Deep Agent e o pipeline de conhecimento do cliente.

## Diagrama

```mermaid
erDiagram
    wiki_entities {
        uuid id PK
        uuid client_id FK
        varchar entity_type "CLIENT_PROFILE | MARKET_CONTEXT | COMPETITORS | BRAND_VOICE | TARGET_PERSONAS | LEGAL_CONSTRAINTS | BUSINESS_OBJECTIVES | CONTRACTED_SCOPE | MARTECH_STACK"
        text content
        vector_768 embedding "NOVO — text-embedding-004 (768d)"
        text role_visibility "NOVO — admin | sponsor | all"
        timestamp created_at
        timestamp updated_at
        integer version
    }

    meeting_transcripts {
        uuid id PK
        uuid client_id FK
        text title
        text raw_content
        text sanitized_content "pós-HITL 1"
        text indexing_status "hot | cold | pending_hitl1"
        timestamp hitl1_approved_at
        varchar hitl1_approved_by
        timestamp created_at
    }

    knowledge_entities {
        uuid id PK
        uuid client_id FK
        text name
        text entity_type
        text badge "oracle_seed | meeting | manual"
        vector_768 embedding "text-embedding-004 (768d)"
        timestamp created_at
    }

    entity_relationships {
        uuid source_id FK
        uuid target_id FK
        text relationship_type
        timestamp created_at
    }

    stakeholders {
        uuid id PK
        uuid client_id FK
        text name
        text role
        text layer "contract | product | specific"
        timestamp added_at
        varchar added_by
    }

    wiki_entities ||--o{ knowledge_entities : "gera via LLMGraphTransformer (Pipeline 2)"
    meeting_transcripts ||--o{ knowledge_entities : "extrai entidades (badge=meeting)"
    knowledge_entities ||--o{ entity_relationships : "source_id"
    knowledge_entities ||--o{ entity_relationships : "target_id"
    stakeholders }o--|| wiki_entities : "indexado em (Type B → L5)"
```

## Notas de Design

### wiki_entities — Type A (narrativa)

- Um registro por `(client_id, entity_type)` — substituível a cada ciclo Oracle
- `embedding` (NOVO): coluna adicionada via `ALTER TABLE wiki_entities ADD COLUMN embedding vector(768)` para habilitar semantic RAG com pgvector cosine similarity
- `role_visibility` (NOVO): guardrail de acesso em nível de linha — `CONTRACTED_SCOPE` usa `admin|sponsor`; demais entidades usam `all`
- `version`: incrementado a cada atualização para auditoria de evolução

### meeting_transcripts — NOVA TABELA

- `raw_content`: upload original, nunca modificado após gravação
- `sanitized_content`: versão pós-HITL 1 (PII removido, HR content, fofoca) — único conteúdo que o pipeline de AI consome
- `indexing_status`:
  - `pending_hitl1` → aguardando revisão humana
  - `hot` → ata < 60 dias, carregada via CAG (transcript completo no contexto)
  - `cold` → ata ≥ 60 dias, chunked e indexada no pgvector para RAG

### knowledge_entities — ADR-013 (GraphRAG)

- Entidades nomeadas extraídas via `LLMGraphTransformer` (Pipeline 2 pós-HITL 2)
- `badge` distingue origem: `oracle_seed` (extraído de wiki_entities), `meeting` (extraído de ata), `manual` (cadastro direto)
- `embedding`: indexado no pgvector para retrieval semântico por camada L5

### entity_relationships — ADR-013

- Grafo dirigido de relacionamentos entre `knowledge_entities`
- `relationship_type`: vocabulário livre gerado pelo LLMGraphTransformer (ex: `COMPETES_WITH`, `REPORTS_TO`, `USES_TECHNOLOGY`)
- Chave primária composta: `(source_id, target_id, relationship_type)`

### stakeholders — Type B (registry)

- NÃO gerado pelo Oracle — acumulado ao longo do tempo
- `layer` define quando o stakeholder foi adicionado:
  - `contract`: início do contrato (clientes diretos + compras)
  - `product`: após primeiras reuniões (times de produto)
  - `specific`: ao longo do tempo (áreas específicas)
- Indexado em `knowledge_entities` (badge=manual) para RAG na camada L5

## Camadas de Conhecimento (contexto)

| Camada | Tabela principal | Retrieval | Estabilidade |
|--------|-----------------|-----------|--------------|
| L1 Ontologia | `wiki_entities` | Semantic RAG (pgvector 768d) | Alta, curada |
| L4 Reuniões | `meeting_transcripts` | CAG (hot) + RAG (cold) | Quente/sensível |
| L5 Stakeholders | `stakeholders` + `knowledge_entities` | Semantic RAG (by client_id) | Viva, acumulativa |
| GraphRAG | `knowledge_entities` + `entity_relationships` | Graph traversal + Semantic | Cresce com uso |

**Prioridade de retrieval quando há sobreposição:** L1 > L2 > L5 > L3 > L4
```
