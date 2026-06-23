---
adr-id: ADR-016
slug: meeting-processing-cag-rag
titulo: Pipeline de processamento de reuniões — Dual HITL + CAG/RAG híbrido
status: Proposto
data: 2026-06-23
decisores: Heitor Miranda (Tech Lead)
upstream:
  - ADR-008 (RAG AlloyDB + pgvector — Biblioteca Semântica)
  - ADR-015 (Oracle Deep Agent Architecture)
downstream:
  - SPEC-016 (Meeting Capture feature)
  - docs/srd/parte6-integrações.md
contexto: >
  Atas de reunião são Camada L4 da arquitetura de conhecimento do Oracle. Contêm informação
  valiosa para atualização da ontologia mas também conteúdo sensível (PII, RH, fofoca,
  menções pessoais). Requerem tratamento especial diferente dos documentos da Biblioteca (L2)
  e do Drive Raw (L3).
---

# ADR-016: Pipeline de processamento de reuniões — Dual HITL + CAG/RAG híbrido

**Status:** Proposto
**Data:** 2026-06-23
**Decisores:** Heitor Miranda (Tech Lead)
**Upstream:** ADR-008, ADR-015

---

## Contexto

### O problema das atas de reunião

Atas de reunião ocupam a Camada L4 na arquitetura de conhecimento do sunOS (ver ADR-015 — Camadas L1–L5). Diferente dos documentos da Biblioteca (L2) ou do Drive Raw (L3), atas apresentam dois desafios simultâneos:

**Desafio 1 — Sensibilidade do conteúdo.** Uma ata típica contém:
- Decisões estratégicas relevantes para a ontologia do cliente
- PII de pessoas físicas não cadastradas como stakeholders
- Conteúdo de RH: promoções, demissões, avaliações de performance
- Conteúdo pessoal: férias, família, vida pessoal
- Fofoca organizacional e informações de gestão de pessoas

Esse mix torna inaceitável alimentar o conteúdo bruto diretamente no pipeline de AI. A `caixa-preta` (`.claude/rules/caixa-preta.md`) é violada se dados sensíveis de RH de uma reunião vazam para o output do Oracle.

**Desafio 2 — Padrão de acesso temporal.** Reuniões recentes (< 60 dias) são consultadas de forma diferente das reuniões antigas:
- Recentes: perguntas de leitura completa ("o que foi decidido sobre X nessa reunião?", "quem ficou responsável por Y?")
- Antigas: consultas retrospectivas pontuais ("em que reunião discutimos o budget de Q3 de 2025?")

Um único mecanismo de retrieval não atende bem os dois padrões.

### Por que não usar o mesmo pipeline da Biblioteca (ADR-008)?

O ADR-008 adota RAG semântico puro (Semantic + BM25 + Compressão) para a Biblioteca. Reuniões diferem em três aspectos que tornam esse pipeline subótimo:

1. **Thread de conversa:** um chunk semântico de ata perde o contexto de pergunta–resposta–decisão. Quem perguntou, quem respondeu, qual foi a decisão são interdependentes. RAG em chunk fragmenta essa thread.
2. **Volume por reunião:** uma ata de 2h tem ~8.000–15.000 tokens. Com Gemini 2.5 Flash (1M token context window), é viável carregar múltiplas atas completas.
3. **Frequência de acesso:** reunião recente é acessada com alta frequência nos dias seguintes; raramente após 60 dias. RAG com pgvector não otimiza para esse padrão temporal.

---

## Opções Consideradas

### Opção 1: RAG puro (chunks semânticos) para todas as atas
- **Prós:** consistência com o pipeline da Biblioteca; zero overhead de gerenciamento hot/cold
- **Contras:** fragmenta thread de conversa para reuniões recentes; qualidade de retrieval inferior para queries de decisão completa; desperdiça context window disponível

### Opção 2: CAG puro (transcript completo) para todas as atas
- **Prós:** preserva thread completa; sem índices para gerenciar
- **Contras:** atas antigas acumulam tokens desnecessariamente; context window satura com histórico excessivo; custo por query cresce linearmente com backlog de reuniões

### Opção 3: CAG para hot + RAG para cold (escolhida)

Combina os dois mecanismos com critério temporal: 60 dias como ponto de inflexão entre acesso frequente e acesso esporádico.

- **Prós:** qualidade máxima para reuniões recentes; escala para backlog longo; custo amortizado; context window controlado
- **Contras:** Job de transição hot→cold adiciona complexidade operacional; dois caminhos de código para manutenção

### Opção 4: CAG para hot + nenhum retrieval para cold
- **Prós:** mais simples
- **Contras:** perda de acesso a reuniões antigas; inaceitável para queries retrospectivas de ontologia

---

## Decisão

Adotar **CAG/RAG híbrido com critério temporal de 60 dias** e **Dual HITL obrigatório** para toda ata processada pelo sunOS.

---

## CAG/RAG Híbrido

### Definição de hot e cold

| Estado | Critério | Mecanismo | Localização |
|--------|----------|-----------|-------------|
| `hot` | `created_at < NOW() - INTERVAL '60 days'` | CAG — transcript completo no context | `meeting_transcripts.sanitized_content` |
| `cold` | `created_at >= NOW() - INTERVAL '60 days'` | RAG — chunks semânticos | pgvector (mesmo schema do ADR-008) |
| `pending_hitl1` | Aguardando aprovação HITL 1 | Bloqueado — não acessível ao AI | `meeting_transcripts.raw_content` |

### CAG para reuniões hot

**Racional:**
- Reuniões recentes são referenciadas frequentemente e com perguntas que exigem leitura completa da thread ("o que foi decidido sobre X?", "quem ficou responsável por Y?")
- Chunk semântico fragmenta o contexto de conversa (pergunta → resposta → decisão)
- Gemini 2.5 Flash tem context window de 1M tokens — comporta múltiplas atas completas simultaneamente
- Prompt caching (Anthropic/Google) permite cachear o prefixo estático do transcript para queries repetidas na mesma sessão, reduzindo custo

**Implementação:**

```python
# api/onboarding/meeting_retriever.py

async def get_hot_meetings(client_id: str) -> list[str]:
    """Carrega transcripts completos das reuniões hot, ordenados por data desc."""
    rows = await db.fetch(
        """
        SELECT sanitized_content, title, created_at
        FROM meeting_transcripts
        WHERE client_id = $1
          AND indexing_status = 'hot'
          AND hitl1_approved_at IS NOT NULL
        ORDER BY created_at DESC
        """,
        client_id,
    )
    return rows

def build_cag_context(hot_meetings: list, context_budget_tokens: int = 700_000) -> str:
    """
    Concatena transcripts até saturar ~70% do context window.
    Ordena do mais recente para o mais antigo.
    """
    parts = []
    total = 0
    for row in hot_meetings:
        # Estimativa: 1 token ≈ 4 caracteres (heurística conservadora)
        token_estimate = len(row["sanitized_content"]) // 4
        if total + token_estimate > context_budget_tokens:
            break
        parts.append(
            f"## Reunião: {row['title']} ({row['created_at'].date()})\n\n"
            f"{row['sanitized_content']}"
        )
        total += token_estimate
    return "\n\n---\n\n".join(parts)
```

**Saturação do context window:** Para clientes com muitas reuniões hot, ordenar por data DESC e carregar até ≈70% do context window disponível. Reuniões mais antigas que não couberem permanecem como hot no DB mas ficam fora do contexto da query atual — a transição para cold as incluirá no índice.

### RAG para reuniões cold

**Racional:**
- Após 60 dias, acesso é esporádico e retrospectivo
- Busca semântica por chunk é suficiente para queries específicas ("em que reunião discutimos X?")
- Custo de carregar transcript completo não justificado pela frequência de acesso

**Chunking:**
- Estratégia: parágrafo por chunk com sobreposição de 20% para preservar contexto de fala
- Splitter: `RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=102)` (20% de 512)
- Schema: mesmo `document_search.py` do ADR-008 — tabela `meeting_chunks` por cliente

```python
# api/onboarding/meeting_indexer.py

from langchain_text_splitters import RecursiveCharacterTextSplitter

CHUNK_SIZE = 512
CHUNK_OVERLAP = int(CHUNK_SIZE * 0.20)  # 20% overlap

splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    separators=["\n\n", "\n", " "],
)

async def index_cold_meeting(meeting_id: str, client_id: str, sanitized_content: str):
    chunks = splitter.create_documents(
        texts=[sanitized_content],
        metadatas=[{
            "meeting_id": meeting_id,
            "client_id": client_id,
            "source_type": "meeting_transcript",
        }],
    )
    store = await get_vector_store(client_id, table_name="meeting_chunks")
    await store.aadd_documents(chunks)
```

---

## Dual HITL Pipeline

Toda ata de reunião passa por dois checkpoints humanos obrigatórios antes de influenciar a ontologia.

### HITL 1 — Content Safety (fora do deep agent, pré-AI)

**Posição no pipeline:** Antes de qualquer processamento por AI. O conteúdo bruto NUNCA é lido por um modelo LLM.

**Trigger:** Upload de nova ata (PDF, DOCX, ou link Google Meet/Zoom).

**Revisor:** Admin ou Sponsor do cliente.

**O que o revisor deve remover (checklist):**

| Categoria | Exemplos |
|-----------|----------|
| PII de não-cadastrados | Nomes de pessoas físicas não cadastradas como stakeholders |
| Conteúdo de RH | Promoções, demissões, avaliações de performance, salários |
| Vida pessoal | Férias, família, saúde, situações pessoais mencionadas em reunião |
| Fofoca organizacional | Comentários informais sobre terceiros, rumores, reclamações pessoais |
| Informação de gestão confidencial | Planos de reestruturação, cortes de budget não públicos |

**Resultado:** `meeting_transcripts.sanitized_content` preenchida com conteúdo aprovado.

**Gate:** `indexing_status` permanece `pending_hitl1` até aprovação. Nenhum endpoint de AI acessa conteúdo com esse status.

```python
# api/onboarding/service.py

async def approve_hitl1(meeting_id: str, approver_id: str, sanitized_content: str):
    """Gate obrigatório: somente após esta chamada o conteúdo entra no pipeline."""
    await db.execute(
        """
        UPDATE meeting_transcripts
        SET sanitized_content = $1,
            indexing_status = 'hot',
            hitl1_approved_at = NOW(),
            hitl1_approved_by = $2
        WHERE id = $3
          AND client_id = current_user_client_id()  -- caixa-preta guard
        """,
        sanitized_content, approver_id, meeting_id,
    )
```

**Caixa-preta:** Endpoint de aprovação HITL 1 retorna 404 (não 403) para meeting_id de outro cliente (RN-010).

### HITL 2 — Ontology Update Proposal (dentro do deep agent, via LangGraph interrupt)

**Posição no pipeline:** Dentro do deep agent Oracle, após leitura da ata sanitizada.

**Trigger:** Subagente identifica informação que contradiz ou atualiza uma entidade existente da ontologia.

**Mecanismo:** LangGraph `interrupt()` — pausa o grafo e aguarda resposta humana.

```python
# api/onboarding/oracle_graph.py

from langgraph.types import interrupt
from pydantic import BaseModel

class OntologyUpdateProposal(BaseModel):
    entity_id: str          # ex: "CLIENT_PROFILE", "MARKET_CONTEXT"
    evidence_anchor: str    # trecho exato da ata que motiva a mudança
    proposed_change: str    # diff em formato legível (antes/depois)
    confidence: float       # 0.0–1.0

async def propose_ontology_update(state: AgentState) -> AgentState:
    """Nó do grafo que emite proposta e aguarda revisão humana."""
    if state.agent_proposes_update:
        human_decision = interrupt(
            value=OntologyUpdateProposal(
                entity_id=state.target_entity_id,
                evidence_anchor=state.evidence_excerpt,
                proposed_change=state.diff,
                confidence=state.confidence_score,
            )
        )
        # human_decision: {"approved": bool, "feedback": str | None}
        state.hitl2_approved = human_decision["approved"]
        state.hitl2_feedback = human_decision.get("feedback")
    return state
```

**Payload da proposta:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `entity_id` | str | Entidade a atualizar (ex: `CLIENT_PROFILE`, `MARKET_CONTEXT`) |
| `evidence_anchor` | str | Trecho exato da ata que motiva a mudança |
| `proposed_change` | str | Diff em formato legível (texto anterior → texto proposto) |
| `confidence` | float | Score 0.0–1.0 calculado pelo subagente |

**Decisão do revisor:**
- **Aprovado:** Pipeline pós-HITL 2 executa (ver seção abaixo)
- **Rejeitado:** Mudança descartada. Feedback opcional armazenado como contexto futuro para melhorar proposals do agente
- **Limiar de confiança:** Proposals com `confidence < 0.5` podem ser configuradas para skip automático (sem interromper o fluxo) — configurável por cliente

### Pipeline pós-HITL 2 (após aprovação)

Dois pipelines executam em sequência após aprovação humana:

**Pipeline 1 — Embed entity:**

```
approved_update
  → UPDATE wiki_entities.content (novo texto)
  → embed_text(new_content) via text-embedding-004 (768d)
  → UPDATE wiki_entities.embedding
  → invalidate cache L1
```

**Pipeline 2 — GraphRAG seed (ADR-013):**

```
approved_update
  → LLMGraphTransformer (Gemini 2.5 Flash)
  → UPSERT knowledge_entities (badge='oracle_seed')
  → UPSERT entity_relationships
  → enqueue para indexação pgvector
```

---

## Transição hot→cold

**Job:** Execução diária (cron), sem janela de manutenção necessária.

**Critério:** `created_at < NOW() - INTERVAL '60 days' AND indexing_status = 'hot'`

```python
# api/onboarding/jobs/hot_to_cold.py

async def transition_hot_to_cold():
    """Job diário: transiciona atas quentes para indexação RAG cold."""
    rows = await db.fetch(
        """
        SELECT id, client_id, sanitized_content
        FROM meeting_transcripts
        WHERE created_at < NOW() - INTERVAL '60 days'
          AND indexing_status = 'hot'
          AND hitl1_approved_at IS NOT NULL
        """
    )
    for row in rows:
        try:
            await index_cold_meeting(
                meeting_id=row["id"],
                client_id=row["client_id"],
                sanitized_content=row["sanitized_content"],
            )
            await db.execute(
                """
                UPDATE meeting_transcripts
                SET indexing_status = 'cold'
                WHERE id = $1
                """,
                row["id"],
            )
        except Exception as e:
            # Falha é não-fatal: ata permanece hot até próxima execução
            logger.error(f"hot_to_cold failed for meeting {row['id']}: {e}")
```

**Idempotência:** O job é idempotente. Uma ata que falhou na transição permanece `hot` e será tentada novamente na próxima execução diária.

**Sem deleção:** `raw_content` e `sanitized_content` são preservados após transição para cold. Somente `indexing_status` muda. A tabela é a fonte de verdade; o índice pgvector é derivado.

---

## Schema de Dados

### Tabela `meeting_transcripts`

```sql
CREATE TABLE meeting_transcripts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           UUID NOT NULL REFERENCES clients(id),
    title               TEXT NOT NULL,
    source_type         TEXT NOT NULL CHECK (source_type IN ('pdf', 'docx', 'google_meet', 'zoom')),
    raw_content         TEXT,                   -- conteúdo bruto, antes do HITL 1
    sanitized_content   TEXT,                   -- conteúdo após revisão humana (HITL 1)
    indexing_status     TEXT NOT NULL DEFAULT 'pending_hitl1'
                            CHECK (indexing_status IN ('pending_hitl1', 'hot', 'cold')),
    hitl1_approved_at   TIMESTAMPTZ,
    hitl1_approved_by   UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index por client_id + status para o job hot→cold
CREATE INDEX idx_meeting_transcripts_client_status
    ON meeting_transcripts (client_id, indexing_status, created_at);

-- RLS guard: client_id sempre no WHERE (caixa-preta RN-010)
CREATE INDEX idx_meeting_transcripts_client_id
    ON meeting_transcripts (client_id);
```

**Notas de design:**
- `client_id` é coluna denormalizada redundante em todas as queries (padrão RN-010 da caixa-preta)
- `raw_content` pode ser NULL se upload foi direto como texto sanitizado
- `sanitized_content` só é preenchido após HITL 1 — gate programático, não apenas convencional
- `indexing_status = 'pending_hitl1'` bloqueia acesso ao pipeline de AI no nível de aplicação

### Tabela `meeting_chunks` (pgvector, para cold)

Schema idêntico ao `document_search.py` do ADR-008, com `source_type = 'meeting_transcript'` e `meeting_id` como metadata adicional. Sem nova tabela de infraestrutura: usa o mesmo AlloyDB e interface `langchain-google-alloydb-pg`.

---

## Consequências

### Positivas

- **Qualidade máxima para reuniões recentes:** CAG preserva thread completa de conversa — perguntas sobre decisões têm contexto integral
- **Escalabilidade para backlog longo:** RAG para cold evita context window explosion com histórico de meses/anos
- **Proteção de conteúdo sensível:** HITL 1 obrigatório impede que PII, RH e fofoca entrem no pipeline de AI — cumpre RN-009/010/011
- **Controle humano sobre ontologia:** HITL 2 garante que nenhuma mudança de entidade é aplicada automaticamente — curador sempre no loop
- **Custo amortizado:** Prompt caching para reuniões hot reduz custo de queries repetidas na mesma sessão
- **Idempotência do job:** Falha na transição hot→cold é não-fatal — reunião permanece acessível como CAG até próxima execução

### Negativas

- **Complexidade operacional:** Dois caminhos de retrieval (CAG e RAG) para manter; job periódico adicional a monitorar
- **Latência HITL 1:** Upload de ata não é imediatamente disponível para o Oracle — depende da velocidade de revisão humana
- **Context window saturação para clientes com backlog denso:** Se cliente tem > 15 reuniões nos últimos 60 dias, as mais antigas dentro da janela hot podem não caber — permanecem hot mas fora do contexto da query
- **Custo de embedding na transição:** Indexação cold de atas longas gera custo de embedding (mitigado por RecordManager incremental do ADR-008)

### Neutras

- Chunking cold usa a mesma infraestrutura AlloyDB + pgvector do ADR-008 — sem nova dependência
- `sanitized_content` é preservado após transição cold — DB é fonte de verdade, índice é derivado
- Threshold de 60 dias é configurável por cliente via variável de ambiente (hoje hardcoded como default)

---

## Pendências

- [ ] **SPEC-016 (Meeting Capture):** Definir UI de upload de ata, interface de revisão HITL 1, e painel de proposals HITL 2 no sunOS
- [ ] **Limiar de confiança configurável:** Implementar `min_confidence_for_hitl2` por cliente (hoje todas as proposals interrompem o agente)
- [ ] **Prompt caching implementation:** Testar `cache_control` prefix para CAG com Gemini 2.5 Flash — ADR separado se comportamento diferir da documentação
- [ ] **Estimativa de tokens real:** Substituir heurística `len(text) // 4` por tokenizer real (tiktoken ou Gemini tokenizer) no `build_cag_context`
- [ ] **RLS no AlloyDB:** Implementar Row-Level Security em `meeting_transcripts` para garantir `client_id` guard no nível de banco (hoje guard é na aplicação)
- [ ] **Feedback loop HITL 2:** Armazenar rejections com feedback para fine-tuning futuro do scorer de confidence
- [ ] **`meeting_chunks` table init:** Adicionar `ainit_vectorstore_table(table_name="meeting_chunks", ...)` no bootstrap do AlloyDB (ADR-008 padrão)

---

## Referências

- ADR-008: RAG AlloyDB + pgvector — Biblioteca Semântica (schema e pipeline de referência)
- ADR-013: GraphRAG LLMGraphTransformer + AlloyDB (Pipeline 2 pós-HITL 2)
- ADR-015: Oracle Deep Agent Architecture (Camadas L1–L5, posição L4 das reuniões)
- ADR-010: LangGraph Orchestration Framework (interrupt pattern)
- `.claude/rules/caixa-preta.md`: RN-009/010/011 — guard de client_id e 404 genérico
- `docs/superpowers/specs/2026-06-23-oracle-deep-agent-design.md`: Design session de origem (Decisões 5 e 6)
- [LangGraph Human-in-the-Loop — interrupt](https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/)
- [Gemini 2.5 Flash context caching](https://ai.google.dev/gemini-api/docs/caching)
