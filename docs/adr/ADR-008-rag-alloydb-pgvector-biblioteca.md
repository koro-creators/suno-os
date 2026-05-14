# ADR-003: RAG com AlloyDB + pgvector — Biblioteca Semântica do sunOS

**Status:** Aceito
**Data:** 2026-05-14
**Decisores:** Heitor Miranda (Inovação), José Lucas (Tech Lead)
**Contexto Técnico:** sunOS — FastAPI + LangGraph + AlloyDB (GCP, southamerica-east1) + AlloyDB Omni (local)

---

## Contexto

### A Biblioteca precisa de busca semântica

A Biblioteca do sunOS é a base de conhecimento de cada cliente: brand books, briefings, transcrições de reunião,
planilhas de budget, normativos de comunicação. Hoje o acesso é por listagem e filtro por tags — sem capacidade
de recuperação semântica por query em linguagem natural.

Os agents do sunOS (chat, workflows) precisam injetar contexto relevante do cliente antes de gerar copy,
plano de mídia ou roteiro. Sem retrieval semântico, o agent recebe zero contexto de domínio do cliente —
gerando outputs genericamente corretos mas semanticamente inadequados
(mesmo problema do koro-agent ADR-002: 'estruturalmente corretos, semanticamente incorretos').

### SPEC-002 provisionou PostgreSQL com pgvector — mas AlloyDB é superior para este caso

A SPEC-002 (Biblioteca v2) implementou PostgreSQL com pgvector no Cloud SQL. A extensão funciona,
mas o koro-agent demonstrou que AlloyDB traz vantagens concretas para o pipeline de RAG:
- **LangChain GraphRetriever** suportado nativamente (pgvector no Cloud SQL não suporta)
- **AlloyDB Omni** em Docker para desenvolvimento local com paridade exata de motor com produção
- **langchain-google-alloydb-pg** — interface idêntica para Omni e GCP, zero bifurcação de código
- **Melhor performance de vector search** no AlloyDB vs Cloud SQL para cargas de retrieval intensas

### Paridade local/produção é o constraint principal

O pipeline de retrieval precisa rodar localmente para desenvolvimento e testes.
PostgreSQL em Docker tem paridade razoável mas não exata com Cloud SQL.
AlloyDB Omni é o motor AlloyDB empacotado como container Docker — paridade total:
mesmas extensões, mesmas funções, mesmo SQL. O mesmo código funciona local e em produção.

---

## Opções Consideradas

### Opção 1: Manter Cloud SQL PostgreSQL + pgvector (SPEC-002)
- **Prós:** zero nova infraestrutura; já existe
- **Contras:** GraphRetriever não suportado; paridade local imperfeita; performance de vector search inferior ao AlloyDB

### Opção 2: Vertex AI Vector Search (Matching Engine)
- **Prós:** gerenciado; alta performance
- **Contras:** provedor novo; sem equivalente local; custo fixo alto; sem SQL para debug

### Opção 3: Gemini File Search
- **Prós:** zero infra; armazenamento grátis
- **Contras:** sem equivalente local; embedding fixo; retrieval opaco; sem controle de chunking

### Opção 4: AlloyDB GCP + AlloyDB Omni local (escolhida)

pgvector sobre AlloyDB. Localmente: AlloyDB Omni em Docker. Em produção: cluster AlloyDB no GCP.

- **Prós:** paridade local/produção exata; GraphRetriever desbloqueado; `langchain-google-alloydb-pg`
  funciona sem alteração de código entre Omni e GCP; embedding model livre; SQL completo para debug;
  LGPD — dados não saem do GCP; Firestore permanece apenas como checkpointer HITL (se necessário)
- **Contras:** setup inicial com AlloyDB Omni em Docker (uma vez por máquina de dev);
  instância AlloyDB adiciona carga ao cluster GCP

---

## Decisão

Adotar **AlloyDB + pgvector como camada semântica da Biblioteca**,
com **AlloyDB Omni em Docker para desenvolvimento local** e **AlloyDB GCP para produção**.

### Três mecanismos de retrieval complementares

```
QUERY DO AGENT
  ↓
1. SEMÂNTICO — AlloyDB Vector Search (pgvector)
   collection por cliente: biblioteca_{slug}
   busca por similaridade cosine
   metadata filtering via SQL: source_type, scope, tags
  ↓
2. LÉXICO — BM25 (rank híbrido)
   captura termos exatos: 'Vivo 5G', 'Samsung One UI', CONAR
   Ensemble com weights=[0.5, 0.5]
  ↓
3. COMPRESSÃO — Gemini Flash como extrator
   remove ruído; retorna só o trecho relevante ao agent
```

### Inicialização — mesma interface local e GCP

```python
# api/chat/knowledge/vector_store.py

from langchain_google_alloydb_pg import AlloyDBEngine, AlloyDBVectorStore
from langchain_google_vertexai import VertexAIEmbeddings
import os

async def get_vector_store(client_slug: str) -> AlloyDBVectorStore:
    if os.getenv('ENV') == 'local':
        engine = await AlloyDBEngine.afrom_connection_string(
            conn_string=f'postgresql+asyncpg://koro:localdev@localhost:5432/suno_{client_slug}'
        )
    else:
        engine = await AlloyDBEngine.afrom_instance(
            project_id="koro-creators",
            region="southamerica-east1",
            cluster="koro-alloydb",
            instance="koro-alloydb-primary",
            database=f"suno_{client_slug}",
        )

    await engine.ainit_vectorstore_table(
        table_name="biblioteca",
        vector_size=768,
        metadata_columns=[
            Column("client_slug",  "VARCHAR"),
            Column("source_type",  "VARCHAR"),
            Column("scope",        "JSONB"),
            Column("tags",         "JSONB"),
            Column("page",         "INTEGER"),
            Column("section",      "VARCHAR"),
            Column("indexed_at",   "TIMESTAMP"),
        ],
        overwrite_existing=False,
    )
    return await AlloyDBVectorStore.create(
        engine=engine,
        table_name="biblioteca",
        embedding_service=VertexAIEmbeddings(model_name='text-embedding-004'),
        metadata_columns=["client_slug","source_type","scope","tags","page","section","indexed_at"],
    )
```

### Pipeline de retrieval completo

```python
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever, ParentDocumentRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor
from langchain.retrievers import ContextualCompressionRetriever
from langchain_text_splitters import RecursiveCharacterTextSplitter

async def search_biblioteca(
    query: str,
    client_slug: str,
    source_type: str | None = None,
    k: int = 8,
) -> list:
    store = await get_vector_store(client_slug)
    filter_expr = f"client_slug = '{client_slug}'"
    if source_type:
        filter_expr += f" AND source_type = '{source_type}'"
    dense = store.as_retriever(
        search_type="mmr",
        search_kwargs={"k": k, "fetch_k": 20, "filter": filter_expr},
    )
    docs_for_bm25 = await load_docs_for_client(client_slug)
    bm25 = BM25Retriever.from_documents(docs_for_bm25, k=k)
    ensemble = EnsembleRetriever(
        retrievers=[dense, bm25],
        weights=[0.5, 0.5],
    )
    compressor = LLMChainExtractor.from_llm(gemini_flash)
    return ContextualCompressionRetriever(
        base_compressor=compressor,
        base_retriever=ensemble,
    ).get_relevant_documents(query)
```

### Indexação com RecordManager

```python
from langchain.indexes import SQLRecordManager, index

async def index_document(
    doc_id: str,
    client_slug: str,
    chunks: list[Document],
) -> dict:
    store = await get_vector_store(client_slug)
    record_manager = SQLRecordManager(
        namespace=f"alloydb/suno_{client_slug}",
        db_url=f'postgresql+asyncpg://...suno_{client_slug}',
    )
    await record_manager.acreate_schema()
    result = await index(
        chunks, record_manager, store,
        cleanup="incremental",
        source_id_key="doc_id",
    )
    return result
```

### AlloyDB Omni — setup inicial (uma vez por máquina)

```bash
# Subir AlloyDB Omni local
docker run -d \
  --name alloydb-omni \
  -e POSTGRES_USER=koro \
  -e POSTGRES_PASSWORD=localdev \
  -e POSTGRES_DB=suno_dev \
  -p 5432:5432 \
  google/alloydbomni:latest

# Criar banco por cliente
psql -h localhost -U koro -c 'CREATE DATABASE suno_vivo;'
psql -h localhost -U koro -c 'CREATE EXTENSION IF NOT EXISTS vector;' suno_vivo
```

### Observabilidade via SQL

```sql
-- Chunks indexados por cliente e tipo
SELECT source_type, COUNT(*)
FROM biblioteca
WHERE client_slug = 'vivo'
GROUP BY source_type;

-- Top-10 mais similares a uma query (debug)
SELECT content, section, page,
       1 - (embedding <=> $query_embedding) AS score
FROM biblioteca
WHERE client_slug = 'vivo'
ORDER BY embedding <=> $query_embedding
LIMIT 10;
```

---

## Consequências

### Positivas
- Paridade local/produção exata: AlloyDB Omni (Docker) = AlloyDB GCP — zero bifurcação de código
- GraphRetriever desbloqueado para futuras features de grafo de ontologia
- Embedding model livre: `text-embedding-004` ou qualquer modelo Vertex AI
- Observabilidade SQL completa — recall e precision calculáveis sem ferramentas externas
- Indexação incremental via RecordManager — sem re-indexar o que não mudou
- Isolamento por cliente via database separado: `suno_{slug}`
- LGPD: dados não saem do GCP

### Negativas
- Setup inicial: `docker pull google/alloydbomni` + criar databases por cliente (uma vez por dev)
- Cluster AlloyDB GCP adiciona carga (instância já existe no stack Koro — novo database por cliente)
- BM25 carrega corpus em memória por request — monitorar para clientes com >500 documentos
- Migração dos dados já indexados no Cloud SQL pgvector (SPEC-002) para AlloyDB

### Neutras
- `langchain-google-alloydb-pg` substitui `langchain-community PGVector` — interface similar
- `ALLOYDB_CONN_STRING` como variável de ambiente; `.env.local` usa string de Omni Docker
- Estratégia de chunking delegada ao ADR-005
- Pipeline de extração de binários delegado ao ADR-004
- Integração Google Drive delegada ao ADR-006

---

## Referências

- koro-agent ADR-006: Arquitetura RAG AlloyDB + pgvector — modelo de referência (adaptado diretamente)
- ADR-004: Pipeline de Extração de Binários — alimenta este pipeline
- ADR-005: Estratégia de Chunking — `source_type` determina o splitter
- [AlloyDB Omni — Overview](https://cloud.google.com/alloydb/docs/omni/overview)
- [AlloyDB Omni — Deploy com Docker](https://cloud.google.com/alloydb/docs/omni/containers/current/docs/deploy-vm)
- [langchain-google-alloydb-pg](https://python.langchain.com/docs/integrations/vectorstores/google_alloydb/)
- [LangChain EnsembleRetriever](https://python.langchain.com/docs/how_to/ensemble_retriever/)
- [LangChain Indexing API / RecordManager](https://python.langchain.com/docs/how_to/indexing/)