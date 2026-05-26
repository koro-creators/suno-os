# ADR-013: GraphRAG com LLMGraphTransformer + AlloyDB — em vez de FalkorDB ou Cognee

**Status:** Aceito
**Data:** 2026-05-26
**Decisores:** Heitor Miranda (Tech Lead)
**Contexto Técnico:** sunOS — FastAPI + LangGraph + AlloyDB (GCP) + langchain-google-alloydb-pg

---

## Contexto

### O problema de retrieval semântico puro para o Moon Shot

A Biblioteca do sunOS contém brand books, briefings, análises competitivas e transcrições de reunião.
O pipeline de retrieval do ADR-008 (AlloyDB pgvector + BM25 ensemble) resolve busca semântica por
similaridade de chunks. Mas o Moon Shot (FA-02) precisa de algo diferente: **"Devorar o briefing"**
significa encontrar conexões não-óbvias entre entidades — ex: "o concorrente X foi mencionado neste
briefing e tem relação com a persona Y definida no brand book". Isso não é recuperável via cosine
similarity entre chunks, porque as entidades estão em documentos diferentes.

**GraphRAG** resolve esse gap: extrai entidades e relações de cada documento e constrói um grafo
que permite travessia semântica cross-documento. O `AlloyDB GraphRetriever` (já planejado em ADR-008)
é o mecanismo de retrieval que usa esse grafo.

### Opções avaliadas para construir o grafo

#### Opção 1: FalkorDB + GraphRAG-SDK (topoteretes/GraphRAG-SDK)
Framework Python com ontologia user-defined, pipeline cognify + dedup + retrieval.
- ✅ Ontologia user-defined via `GraphSchema(entities=[EntityType(...)])`
- ✅ Isolamento multi-tenant via `graph_name`
- ✅ 69.73% no GraphRAG-Bench (self-reported, inglês)
- ❌ **FalkorDB é o único backend suportado** — novo serviço gerenciado além do AlloyDB já existente
- ❌ `finalize()` é O(tamanho do grafo), não O(mudança) — custo cresce indefinidamente
- ❌ `update_concurrency=1` — single-threaded; comportamento sob Cloud Run multi-instance não documentado
- ❌ Benchmark em inglês; extração em PT-BR com schema rígido de 6 entidades não validada
- ❌ Sem integração nativa com LangGraph (retorna string, não tool-call)
- ❌ Feature text-to-Cypher marcada como experimental

#### Opção 2: Cognee (topoteretes/cognee)
Memory control plane com `remember/recall/forget/improve`. Extração genérica de entidades.
- ✅ 17.5K stars; conceito correto de persistência de memória cross-sessão
- ❌ Bug crítico aberto: SQLite deadlock (#2717) em `cognify()` — Cloud Run com requisições paralelas
- ❌ Bug crítico: filtro LanceDB não propaga corretamente (#2720) — subgrafos idênticos independente da query
- ❌ Issue #2228 aberta: sem suporte a configuração de LLM por request para multi-tenant — viola Caixa-preta (RN-009/010/011)
- ❌ Extração de entidades é genérica — não há `allowed_nodes` para forçar o schema das 6 entidades
- ❌ `remember()` persiste imediatamente — sem HITL gate nativo (FA-15)
- ❌ Depende de Neo4j como backend de grafo — novo serviço gerenciado

#### Opção 3: LLMGraphTransformer + AlloyDB GraphRetriever (escolhida)
`langchain-experimental.LLMGraphTransformer` para extração, AlloyDB como backend (já existente via ADR-008).
- ✅ Schema enforcement via `allowed_nodes` + `strict_mode=True` — garante apenas as 6 entidades do Oráculo
- ✅ Zero novo serviço: AlloyDB já é o banco do pipeline RAG (ADR-008)
- ✅ `AlloyDBGraphRetriever` nativo via `langchain-google-alloydb-pg` — já planejado em ADR-008
- ✅ HITL gate nativo: coluna `status = 'pending'` no INSERT bloqueia entidade do retrieval até aprovação
- ✅ Caixa-preta preservada: `client_id` como filtro obrigatório em todas as queries (SQL WHERE, não graph_name opaco)
- ✅ Dedup via SQL: `cosine_similarity(embedding, candidate) > 0.92 WHERE client_id = X` — observável, debugável
- ✅ `convert_to_graph_documents()` retorna `GraphDocument` integrável com LangGraph como tool-call
- ⚠️ `LLMGraphTransformer` originalmente otimizado para function-calling com OpenAI/Mistral — qualidade com Gemini Flash em PT-BR precisa ser validada em spike
- ⚠️ Deduplicação cross-documento é implementação custom (não automática como no GraphRAG-SDK)

---

## Decisão

Adotar **`LLMGraphTransformer` (langchain-experimental) para extração de entidades** e
**AlloyDB como backend de grafo** (tabelas `knowledge_entities` + `entity_relationships`
no mesmo cluster AlloyDB provisionado no ADR-008), com retrieval via `AlloyDBGraphRetriever`.

### Schema de extração

```python
# api/chat/knowledge/entity_extractor.py
from langchain_experimental.graph_transformers import LLMGraphTransformer
from langchain_core.documents import Document

ONTOLOGY_NODES = [
    "Posicionamento", "Persona", "Competidor",
    "Produto", "TomDeVoz", "Briefing"
]

ONTOLOGY_RELATIONS = [
    "CONCORRE_COM", "MENCIONA", "DEFINE",
    "PERTENCE_A", "REFERENCIA", "CONTRADIZ"
]

transformer = LLMGraphTransformer(
    llm=gemini_flash,                        # ou gpt-4o-mini para extração de maior qualidade
    allowed_nodes=ONTOLOGY_NODES,
    allowed_relationships=ONTOLOGY_RELATIONS,
    strict_mode=True,                        # descarta nós fora do schema
)

async def extract_entities(chunks: list[Document], client_id: str) -> list[GraphDocument]:
    graph_docs = await transformer.aconvert_to_graph_documents(chunks)
    return graph_docs  # nodes + relationships prontos para upsert
```

### Tabelas AlloyDB

```sql
-- Entidades extraídas de documentos da Biblioteca
CREATE TABLE knowledge_entities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id),   -- caixa-preta obrigatória
  doc_id      UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,  -- valores de ONTOLOGY_NODES
  entity_name TEXT NOT NULL,
  properties  JSONB DEFAULT '{}',
  embedding   VECTOR(768),           -- text-embedding-004 do nome + tipo
  status      VARCHAR(20) NOT NULL DEFAULT 'pending',  -- HITL gate FA-15
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON knowledge_entities USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
CREATE INDEX ON knowledge_entities (client_id, entity_type, status);

-- Relações entre entidades (grafo em SQL puro)
CREATE TABLE entity_relationships (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL,                         -- caixa-preta obrigatória
  source_id    UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  target_id    UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  relation     VARCHAR(80) NOT NULL,  -- valores de ONTOLOGY_RELATIONS
  weight       FLOAT NOT NULL DEFAULT 1.0,
  doc_id       UUID REFERENCES knowledge_documents(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON entity_relationships (client_id, source_id);
CREATE INDEX ON entity_relationships (client_id, target_id);
```

### Deduplicação cross-documento

```python
# Antes de inserir nova entidade: checar duplicata por cosine similarity
async def dedup_entity(
    candidate: Node, client_id: str, db: AsyncSession
) -> str | None:
    """Retorna ID de entidade existente se similaridade > threshold."""
    result = await db.execute(
        text("""
            SELECT id FROM knowledge_entities
            WHERE client_id = :client_id
              AND entity_type = :entity_type
              AND status != 'rejected'
              AND 1 - (embedding <=> :embedding) > 0.92
            ORDER BY embedding <=> :embedding
            LIMIT 1
        """),
        {"client_id": client_id, "entity_type": candidate.type,
         "embedding": embed(candidate.id)}
    )
    row = result.fetchone()
    return str(row.id) if row else None
```

### Integração com o pipeline de ingestão

A extração de entidades roda como step adicional no `processor.py` após chunking + embedding,
antes de retornar `status='ready'` para o documento.

```python
# api/chat/ingestion/processor.py (adição ao pipeline existente)
async def process_document(doc_id: str):
    # ... (chunking + pgvector existentes) ...

    # NOVO: extração de entidades
    extractor = EntityExtractor(llm=gemini_flash, client_id=doc.client_id)
    graph_docs = await extractor.extract(chunks)
    await extractor.upsert_with_dedup(graph_docs, db=session)

    await session.execute(
        update(KnowledgeDocument).where(KnowledgeDocument.id == doc_id)
        .values(status="ready")
    )
```

---

## Consequências

### Positivas
- Zero novo serviço gerenciado: AlloyDB já existente via ADR-008
- Schema enforcement via `strict_mode=True` — grafo respeita a ontologia do Oráculo (ADR-007)
- HITL gate nativo: entidades ficam `pending` até aprovação manual — integra com FA-15
- Caixa-preta preservada: `client_id` em todas as queries SQL, observável e auditável
- Dedup via SQL cosine é debugável (`SELECT` direto no AlloyDB Omni local)
- `GraphDocument` integra com LangGraph como tool output sem wrapper extra

### Negativas
- Qualidade de extração com Gemini Flash em PT-BR precisa ser validada em spike antes do Piloto
- Deduplicação cross-documento é implementação custom (~80 linhas Python + SQL)
- `langchain-experimental` é adicionado como nova dependência em `api/pyproject.toml`

### Neutras
- Entidades do Oráculo (`wiki_entities`, SPEC-015) e entidades da Biblioteca (`knowledge_entities`)
  são tabelas separadas com o mesmo schema de tipos — `wiki_entities` é o perfil curado do cliente,
  `knowledge_entities` são menções extraídas de documentos individuais

---

## Spike recomendado antes do Piloto

Rodar `LLMGraphTransformer` com Gemini Flash contra 3-5 documentos reais em PT-BR
(brand book + briefing + análise competitiva) e medir:

1. % de entidades extraídas que respeitam o schema (`strict_mode=True`)
2. % de entidades semanticamente corretas (avaliação humana)
3. Qualidade das relações extraídas

Se qualidade for < 70% com Gemini Flash, usar `gpt-4o-mini` apenas no step de extração
(custo: ~$0.001 por documento) e Gemini Flash no resto do pipeline.

---

## Dependência adicionada

```toml
# api/pyproject.toml
"langchain-experimental>=0.3.0",  # LLMGraphTransformer
```

---

## Referências

- ADR-007: Cadastro Ontológico de Cliente — define ONTOLOGY_NODES e ONTOLOGY_RELATIONS
- ADR-008: RAG com AlloyDB + pgvector — provê AlloyDB como backend e GraphRetriever planejado
- ADR-010: LangGraph como framework de orquestração — contexto de integração com agents
- GraphRAG-SDK (FalkorDB): avaliado e rejeitado nesta sessão — lock-in FalkorDB + finalize() O(n)
- Cognee: avaliado e rejeitado — bugs críticos #2717/#2720 + violação da Caixa-preta multi-tenant
