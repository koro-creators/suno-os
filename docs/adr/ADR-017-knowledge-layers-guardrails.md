---
adr-id: ADR-017
slug: knowledge-layers-guardrails
artefato: adr
status: Proposto
criada: 2026-06-23
atualizada: 2026-06-23
versao: "1.0"
escopo:
  projeto: sunos
  stack: "Backend: FastAPI + LangGraph + Python 3.11 | AlloyDB + pgvector"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: main
  contexto: >
    Define as cinco camadas de conhecimento (L1–L5) acessadas pelo Oracle Deep Agent
    e os três guardrails (Input, Output, Acesso) que controlam o que o Oracle pode
    ler, escrever e a quem cada camada é visível.
upstream:
  - docs/adr/ADR-007-cadastro-ontologico-cliente.md (ontologia backbone)
  - docs/adr/ADR-008-rag-alloydb-pgvector-biblioteca.md (Biblioteca L2)
  - docs/adr/ADR-013-graphrag-llmgraphtransformer-alloydb.md (GraphRAG seed)
  - docs/adr/ADR-015-oracle-deep-agent-architecture.md (arquitetura deep agent)
  - docs/adr/ADR-016-meeting-processing-cag-rag.md (CAG/RAG reuniões L4)
---

# ADR-017: Camadas de conhecimento (L1–L5) e guardrails do Oracle

**Status:** Proposto
**Data:** 2026-06-23
**Decisores:** Heitor Miranda (Tech Lead)
**Contexto Técnico:** sunOS — FastAPI + LangGraph + AlloyDB + pgvector

---

## Contexto

### O problema de múltiplas fontes sem hierarquia

O Oracle Deep Agent (ADR-015) consulta cinco fontes de dados heterogêneas para construir e manter a
ontologia de cliente: entidades backbone curadas (`wiki_entities`), documentos da Biblioteca
(`biblioteca_documents`), documentos brutos do Drive, atas de reunião processadas e o registry de
stakeholders. Cada fonte tem características distintas de estabilidade, frequência de atualização e
sensibilidade.

Sem uma hierarquia explícita, há dois problemas concretos:

1. **Context stuffing:** quando há sobreposição de resultados entre camadas, o agente não sabe qual
   fonte priorizar — e pode incluir informação redundante ou conflitante no contexto.
2. **Ausência de guardrails formais:** o `oracle_agent.py` atual não tem controles explícitos de
   input (o que pode ser lido), output (o que pode ser gerado) ou acesso (quem pode ver o quê),
   além de um `status` check parcial nas ferramentas de busca.

### Problema específico: L1 não é RAG hoje

`search_wiki` e `consultar_ontologia` executam `SELECT * FROM wiki_entities` sem filtro semântico —
context stuffing literal. A coluna `embedding vector(768)` não existe em `wiki_entities`, quebrando
a paridade com o padrão já implementado em `document_search.py` (ADR-008).

### Necessidade de guardrails formais

O redesign do Oracle (design doc `2026-06-23-oracle-deep-agent-design.md`) definiu três guardrails
informalmente. Este ADR formaliza tanto as camadas quanto os guardrails como decisão arquitetural
registrada, de modo que futuras implementações tenham uma fonte autoritativa.

---

## Decisão

Adotar formalmente **cinco camadas de conhecimento ordenadas por prioridade (L1 > L2 > L5 > L3 > L4)**
e **três guardrails obrigatórios (Input, Output, Acesso)** para todas as ferramentas do Oracle que
acessam dados de cliente.

---

## Parte 1 — Cinco Camadas de Conhecimento (L1–L5)

### Tabela resumo

| Camada | Nome | Tabela / Fonte | Retrieval | Estabilidade |
|--------|------|----------------|-----------|--------------|
| L1 | Ontologia | `wiki_entities` (9 entidades backbone, Type A) | Semantic RAG pgvector 768d | Alta, curada |
| L2 | Biblioteca | `biblioteca_documents` + embeddings AlloyDB | Semantic + BM25 + compression (ADR-008) | Média, curada |
| L3 | Drive Raw | Documentos brutos do Drive cliente (chunks) | Semantic RAG pgvector chunks | Contínua, sync |
| L4 | Reuniões | Atas processadas pós-HITL 1 (ADR-016) | CAG (hot < 60d) + RAG (cold ≥ 60d) | Quente / sensível |
| L5 | Stakeholders | `stakeholders` registry (Type B) | Semantic RAG por `client_id` | Viva, acumulativa |

### Prioridade de retrieval

Quando há sobreposição de resultados entre camadas (mesma query retorna hits de múltiplas camadas),
a prioridade de uso no contexto final é:

```
L1 (Ontologia) > L2 (Biblioteca) > L5 (Stakeholders) > L3 (Drive Raw) > L4 (Reuniões)
```

**Racional da ordenação:**

- **L1 primeiro:** entidades backbone são conhecimento curado e validado pelo time Suno — a fonte
  mais confiável para definições do cliente.
- **L2 segundo:** documentos da Biblioteca são aprovados e curados (brand books, briefings formais)
  — mais estáveis que Drive raw.
- **L5 antes de L3/L4:** stakeholders são registry estruturado, não texto livre — menor ruído.
- **L3 antes de L4:** Drive raw é estável e não sensível; reuniões (L4) contêm conteúdo quente e
  potencialmente sensível — usadas por último, como evidência complementar.

### L1 — Ontologia (`wiki_entities`)

Contém as 9 entidades backbone do cliente (Type A), definidas no ADR-007 e redesign 2026-06-23:
`CLIENT_PROFILE`, `MARKET_CONTEXT`, `COMPETITORS`, `BRAND_VOICE`, `TARGET_PERSONAS`,
`LEGAL_CONSTRAINTS`, `BUSINESS_OBJECTIVES`, `CONTRACTED_SCOPE`, `MARTECH_STACK`.

**Retrieval atual (problema):** `SELECT *` sem filtro semântico — context stuffing.

**Retrieval alvo:** cosine similarity via pgvector, igual ao padrão `document_search.py`:

```python
# api/chat/tools/wiki_search.py (target state)
async def search_wiki(query: str, client_id: str, k: int = 3) -> list[dict]:
    query_embedding = await embed_text(query)
    result = await db.execute(
        text("""
            SELECT id, entity_type, content,
                   1 - (embedding <=> :q_emb) AS score
            FROM wiki_entities
            WHERE client_id = :client_id
              AND status = 'active'
            ORDER BY embedding <=> :q_emb
            LIMIT :k
        """),
        {"q_emb": query_embedding, "client_id": client_id, "k": k}
    )
    return [dict(r) for r in result.fetchall()]
```

### L2 — Biblioteca (`biblioteca_documents`)

Pipeline completo definido no ADR-008: AlloyDB Vector Search (pgvector) + BM25 ensemble +
contextual compression (Gemini Flash extractor). Isolamento por `client_id` via filtro SQL.

Nenhuma mudança de arquitetura necessária para L2 — ADR-008 já define o padrão canônico.

### L3 — Drive Raw

Documentos do Google Drive do cliente, ingeridos via ADR-006 (OAuth Drive) e chunked via ADR-005.
Retrieval por cosine similarity no mesmo cluster AlloyDB, coleção separada por `client_id`.

Documentos elegíveis para L3: somente `status IN ('ready', 'approved')` — Guardrail 1 se aplica.

### L4 — Reuniões

Atas processadas via pipeline dual-HITL (ADR-016). Retrieval híbrido:

- **Hot (< 60 dias):** CAG — transcript completo (sanitizado, pós-HITL 1) injetado no contexto.
  Para múltiplas atas hot: ordenar por `meeting_date DESC`, carregar até saturar context window.
  Usar Anthropic prompt cache para transcripts referenciados repetidamente.
- **Cold (≥ 60 dias):** RAG — chunks semânticos indexados no pgvector após transição automática
  (job diário em `api/jobs/meeting_cold_transition.py`).

Acesso a L4 é restrito — ver Guardrail 3.

### L5 — Stakeholders (`stakeholders`)

Registry vivo de pessoas (Type B): acumulado ao longo do contrato via onboarding manual, captura
de atas, edição direta. Não gerado pelo Oracle — alimentado por operadores e pelo pipeline de
reuniões pós-HITL.

Retrieval: cosine similarity por `client_id`, campo `role` e `department` como metadata filters.

---

## Parte 2 — Três Guardrails do Oracle

### Guardrail 1 — Input (o que o Oracle pode LER)

**Regra:** O Oracle somente acessa dados que passaram por gates de qualidade ou aprovação.

| Fonte | Condição de acesso |
|-------|--------------------|
| Drive documents (L3) | `status IN ('ready', 'approved')` — não drafts, não arquivados |
| Reuniões (L4) | `hitl1_approved_at IS NOT NULL` — sanitizadas pelo revisor humano |
| `wiki_entities` (L1) | `status = 'active'` — entidades aprovadas pelo pipeline pós-HITL 2 |
| Biblioteca (L2) | `status = 'published'` — documentos publicados na Biblioteca |
| Stakeholders (L5) | sem restrição adicional (já filtrado por `client_id`) |

**Cross-client guard (RN-010):** toda query inclui `client_id = :current_client_id` como filtro
obrigatório. O Oracle nunca recebe dados de outro cliente — nem metadata, nem IDs.

**Caixa-preta (RN-009):** O Oracle não acessa `system_prompts`, `brand_guidelines` nem nenhum
documento de `client_id` diferente do contexto ativo. Endpoint retorna 404 genérico em caso de
acesso cross-tenant — não 403 (não revela existência).

**Implementação:** check no início de cada tool do Oracle:

```python
# api/onboarding/oracle_tools.py
def _assert_input_eligible(doc: dict, client_id: str) -> None:
    if doc["client_id"] != client_id:
        raise HTTPException(status_code=404, detail="Documento não disponível")
    if doc.get("status") not in ("ready", "approved", "published", "active"):
        raise HTTPException(status_code=404, detail="Documento não disponível")
```

**Estado atual:** o `oracle_agent.py` existente tem um `status` check parcial mas não tem o
cross-client guard explícito nas ferramentas de busca de ontologia. Guardrail 1 está
**parcialmente implementado** — requer completar na migração para o Oracle v2.

### Guardrail 2 — Output (o que o Oracle pode ESCREVER/RETORNAR)

**Regra:** Conteúdo gerado pelo Oracle passa por dois filtros antes de ser persistido.

**Filtro 2a — PII filter:**
- Nomes de pessoas físicas removidos ou substituídos por `[PESSOA]` no output gerado
- Exceção: stakeholders explicitamente cadastrados em L5 com consentimento registrado podem
  ser mencionados nominalmente
- Cargo/empresa são permitidos; nome pessoal + cargo combinados em output externo são filtrados

**Filtro 2b — Sensitive topic detector:**

| Categoria | Ação |
|-----------|------|
| Valores financeiros específicos (R$ X, % margem, tier contratual) | Filtrar do output geral; persistir somente em `CONTRACTED_SCOPE` |
| Dados de RH (avaliações, promoções, demissões, salários) | Filtrar sempre — nunca persistir |
| Informações de concorrência confidencial (preços, estratégias não públicas) | Flag `requires_human_review = True` antes de persistir |
| Conteúdo médico / dados pessoais sensíveis | Filtrar sempre |

**Regra de persistência:** Nenhuma entidade de `wiki_entities` é gravada diretamente pelo Oracle
sem passar pelo pipeline pós-HITL 2 (LangGraph interrupt + aprovação humana). O Oracle só propõe
— nunca escreve diretamente.

**Implementação como LangChain output parser:**

```python
# api/onboarding/oracle_output_guard.py
from langchain_core.output_parsers import BaseOutputParser

class OracleOutputGuard(BaseOutputParser[OracleProposal]):
    def parse(self, text: str) -> OracleProposal:
        filtered = self._remove_pii(text)
        flags = self._detect_sensitive_topics(filtered)
        return OracleProposal(
            content=filtered,
            requires_human_review=bool(flags),
            sensitivity_flags=flags,
        )

    def _remove_pii(self, text: str) -> str:
        # NER via spaCy pt_core_news_sm ou regex conservativo
        # Exceções: nomes em stakeholders registry do cliente
        ...

    def _detect_sensitive_topics(self, text: str) -> list[str]:
        # Regex + keyword matching para categorias financeiras/RH/concorrência
        ...
```

### Guardrail 3 — Acesso (quem pode ver o quê)

**Regra:** Diferentes entidades da ontologia têm visibilidade restrita por papel do usuário.

| Entidade | Roles com acesso | Justificativa |
|----------|-----------------|---------------|
| `CONTRACTED_SCOPE` | `admin`, `sponsor` | Contém tier financeiro, SLAs, valores contratuais sensíveis |
| `CLIENT_PROFILE`, `MARKET_CONTEXT`, `COMPETITORS`, `BRAND_VOICE`, `TARGET_PERSONAS`, `LEGAL_CONSTRAINTS`, `BUSINESS_OBJECTIVES`, `MARTECH_STACK` | roles normais do cliente | Conteúdo narrativo sem dados sensíveis |
| L4 (Reuniões hot — CAG) | mesmos roles que aprovaram HITL 1 | Quem sanitizou pode acessar o original sanitizado |
| L5 (Stakeholders) | roles normais do cliente | Registry não-sensível |

**Implementação via `role_visibility` em `wiki_entities`:**

```sql
ALTER TABLE wiki_entities
  ADD COLUMN role_visibility VARCHAR[] NOT NULL
    DEFAULT ARRAY['admin', 'sponsor', 'operator', 'viewer'];
```

Ao criar a entidade `CONTRACTED_SCOPE`, persistir:

```sql
UPDATE wiki_entities
SET role_visibility = ARRAY['admin', 'sponsor']
WHERE entity_type = 'CONTRACTED_SCOPE'
  AND client_id = :client_id;
```

Toda query de retrieval da ontologia inclui o filtro de role:

```python
# Exemplo em search_wiki
AND :user_role = ANY(role_visibility)
```

**Row-level security (RLS) como camada adicional opcional:** PostgreSQL/AlloyDB suporta
`CREATE POLICY` com `USING (role_visibility @> ARRAY[:user_role])`. Pode ser ativado como
defesa em profundidade após a camada de aplicação estar estável.

---

## Schema Atualizado de `wiki_entities`

```sql
CREATE TABLE wiki_entities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id),   -- caixa-preta obrigatória
  entity_type     VARCHAR(50) NOT NULL,                   -- 9 tipos backbone (ADR-007)
  content         TEXT NOT NULL,                         -- texto curado pelo Oracle
  embedding       VECTOR(768),                           -- NOVA COLUNA (ADR-017)
  status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | active | archived
  role_visibility VARCHAR[] NOT NULL                     -- NOVA COLUNA (ADR-017)
                    DEFAULT ARRAY['admin','sponsor','operator','viewer'],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  version         INTEGER NOT NULL DEFAULT 1
);

-- Índices necessários
CREATE INDEX ON wiki_entities USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
CREATE INDEX ON wiki_entities (client_id, entity_type, status);
CREATE INDEX ON wiki_entities USING GIN (role_visibility);
```

**Migração necessária:**

```sql
-- Migration: adicionar colunas novas à tabela existente
ALTER TABLE wiki_entities
  ADD COLUMN IF NOT EXISTS embedding vector(768),
  ADD COLUMN IF NOT EXISTS role_visibility VARCHAR[]
    NOT NULL DEFAULT ARRAY['admin','sponsor','operator','viewer'];

-- Inicializar CONTRACTED_SCOPE com acesso restrito
UPDATE wiki_entities
SET role_visibility = ARRAY['admin', 'sponsor']
WHERE entity_type = 'CONTRACTED_SCOPE';

-- Re-indexar: popular embedding para entidades existentes
-- (job único: api/jobs/backfill_wiki_embeddings.py)
```

---

## Problema Atual: Context Stuffing em L1

### Causa raiz

`search_wiki` e `consultar_ontologia` em `api/chat/tools/wiki_search.py` e
`api/workflows/compiler.py` fazem `SELECT *` sem filtro semântico. Com 9 entidades
(cada uma com potencialmente 500–2000 tokens), o contexto recebe até ~18.000 tokens
de dados de ontologia independente da relevância para a query.

### Impacto

- Context window preenchido com informação irrelevante
- Qualidade de geração degradada (tokens desperdiçados em contexto não-relevante)
- Custo de inferência inflado (billing por tokens)
- Viola o padrão RAG definido no ADR-008

### Solução

Adicionar `embedding vector(768)` em `wiki_entities` e migrar ambas as funções
para busca semântica com `k=3` (top-3 entidades mais relevantes para a query):

```python
# Antes (problema): SELECT * → 9 entidades sempre
entities = await db.execute(
    text("SELECT * FROM wiki_entities WHERE client_id = :cid"),
    {"cid": client_id}
)

# Depois (solução): cosine similarity → top-k relevantes
entities = await db.execute(
    text("""
        SELECT id, entity_type, content,
               1 - (embedding <=> :q_emb) AS score
        FROM wiki_entities
        WHERE client_id = :cid
          AND status = 'active'
          AND :user_role = ANY(role_visibility)
        ORDER BY embedding <=> :q_emb
        LIMIT :k
    """),
    {"q_emb": query_embedding, "cid": client_id,
     "user_role": current_user.role, "k": 3}
)
```

Modelo de embedding: `text-embedding-004` (768d) — mesmo modelo já em uso em
`api/chat/knowledge/embeddings.py` (ADR-008). Zero nova dependência.

---

## Consequências

### Positivas

- **Resolução do context stuffing:** L1 passa de `SELECT *` para top-k semântico —
  redução estimada de 80–95% nos tokens de ontologia por query
- **Guardrail 3 formal:** `role_visibility` viabiliza acesso diferenciado sem código
  de branching por tipo de entidade — política declarada no dado
- **Paridade de padrão RAG:** L1 adota o mesmo padrão de `document_search.py` (ADR-008) —
  consistência arquitetural
- **Guardrails 1 e 2 formalizados:** implementação anterior era implícita; agora há
  especificação testável para cada regra
- **Prioridade explícita L1 > L2 > L5 > L3 > L4:** elimina ambiguidade de qual fonte
  vence quando há sobreposição de resultados

### Negativas

- **Migration necessária:** `ALTER TABLE wiki_entities ADD COLUMN embedding vector(768)`
  requer backfill de embeddings para entidades existentes (job único `backfill_wiki_embeddings.py`)
- **`role_visibility` como array:** queries com `= ANY(array)` não são indexadas por
  B-tree; o índice GIN mitiga, mas é menos eficiente que foreign-key para roles com
  cardinalidade baixa
- **Guardrail 2 (PII filter):** NER em PT-BR com spaCy tem precision ~85% — pode
  remover nomes de stakeholders legítimos se não houver whitelist atualizada. Monitoramento
  manual inicialmente necessário
- **Acoplamento L4 com HITL 1:** acesso a reuniões hot (CAG) requer saber quais roles
  fizeram a aprovação HITL 1 — campo `hitl1_approved_by_role` precisa ser persistido
  em `meeting_transcripts`

### Neutras

- Guardrail 1 (cross-client guard) é consistente com o padrão caixa-preta já definido
  em `.claude/rules/caixa-preta.md` — este ADR não inventa nova regra, apenas aplica
  o padrão existente ao Oracle
- `knowledge_entities` (ADR-013, GraphRAG) e `wiki_entities` (L1) permanecem tabelas
  separadas: `wiki_entities` é perfil curado do cliente; `knowledge_entities` são
  menções extraídas de documentos individuais. A coluna `embedding` adicionada em ambas
  usa o mesmo modelo e dimensão (768d)
- Guardrail 3 via RLS (PostgreSQL policy) é opcional nesta fase — a camada de aplicação
  é suficiente para o piloto

---

## Pendências

| # | Pendência | Depende de | Prioridade |
|---|-----------|-----------|-----------|
| P1 | Migration: `ALTER TABLE wiki_entities ADD COLUMN embedding vector(768), ADD COLUMN role_visibility VARCHAR[]` | ADR-007 v2 (schema final) | Alta |
| P2 | Job `backfill_wiki_embeddings.py` — popular embeddings para entidades existentes | P1 | Alta |
| P3 | Refatorar `search_wiki` e `consultar_ontologia` para pgvector cosine similarity | P1, P2 | Alta |
| P4 | Implementar `OracleOutputGuard` (LangChain output parser) com PII filter e sensitive topic detector | — | Média |
| P5 | Campo `hitl1_approved_by_role` em `meeting_transcripts` para Guardrail 3 de L4 | ADR-016 | Média |
| P6 | Avaliar ativação de RLS em `wiki_entities` como defesa em profundidade após piloto | P1, piloto | Baixa |
| P7 | Whitelist de stakeholders para PII filter (integrar L5 no guard 2a) | P4 | Baixa |

---

## Bug Ativo Relacionado

Em `api/onboarding/oracle_agent.py`, função `add_reunion_context_to_oraculo`:

```python
# BUG: busca "Briefings" (plural) mas DB tem "Briefing" (singular) → always None
entity = wiki_entities.query(entity_type="Briefings")
```

Corrigir para `entity_type="Briefing"` como parte da migração para o Oracle v2.
Este bug faz com que o contexto de reuniões nunca seja injetado no Briefing — silent no-op.

---

## Referências

- `docs/superpowers/specs/2026-06-23-oracle-deep-agent-design.md` — design doc desta sessão (fonte)
- ADR-007 (v2): Cadastro Ontológico — define as 9 entidades backbone (Type A/B)
- ADR-008: RAG AlloyDB + pgvector — padrão de retrieval canônico para L2, referência para L1
- ADR-013: GraphRAG LLMGraphTransformer — pipeline pós-HITL 2 (badge `oracle_seed`)
- ADR-015: Oracle Deep Agent Architecture — arquitetura do agente que usa estas camadas
- ADR-016: Meeting Processing CAG/RAG — define hot/cold threshold e pipeline de HITL para L4
- `.claude/rules/caixa-preta.md` — RN-009/010/011: padrão 404 genérico, cross-client guard
