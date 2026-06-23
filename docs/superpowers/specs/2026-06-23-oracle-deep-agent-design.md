# Design — Oracle Deep Agent v2 (2026-06-23)

**Sessão:** retorno de férias — redesign completo do Oracle onboarding  
**Status:** decisões tomadas, aguardando documentação formal  
**Referência downstream:** ADR-007 rev, ADR-015, ADR-016, ADR-017, SPEC-015 v2, SPEC-016

---

## Contexto

O Oracle atual (`api/onboarding/oracle_agent.py`) é um LangGraph de 2 nós (research via Tavily + extract via Gemini Flash) com 6 entidades hardcoded. Ele NÃO é um deep agent. Tem um bug ativo: `add_reunion_context_to_oraculo` busca `entity_type="Briefings"` (plural) mas o DB grava `"Briefing"` (singular) → silent no-op.

O objetivo desta sessão foi redesenhar o Oracle usando a primitiva `create_deep_agent` do LangChain/LangGraph com subagentes por tipo de entidade.

---

## Decisão 1 — Arquitetura: um deep agent com subagentes (não dois agentes)

**Decisão:** Oracle = 1 deep agent principal + N subagentes isolados por tipo de entidade.  
**Descartado:** dois deep agents separados (Oracle Onboarding + Oracle Contract).  
**Motivo:** LangChain `create_deep_agent` já suporta subagentes com contexto isolado e filesystem virtual. Um agente principal pode coordenar subagentes para entidades narrativas E para CONTRACTED_SCOPE simultaneamente. Dois agentes adicionam plumbing desnecessário.

O agente principal:
- Planeja via `write_todos` quais entidades atualizar
- Despacha subagentes em paralelo (um por tipo de entidade)
- Consolida resultados

Cada subagente:
- Recebe contexto isolado (não herda contexto do agente pai)
- Lê as fontes específicas do seu tipo (Drive, web, proposta comercial)
- Retorna resultado compacto para o agente principal

---

## Decisão 2 — Schema canônico: 9 entidades backbone (Type A)

Baseado no BRD como fonte autoritativa (BR-021, BR-022). Implementação atual e ADR-007 divergem do BRD — o redesign realinha.

| ID | Entidade | Tipo | Fonte | Subagente |
|----|----------|------|-------|-----------|
| E1 | CLIENT_PROFILE | Type A (narrativa) | Drive + web | subagent-profile |
| E2 | MARKET_CONTEXT | Type A (narrativa) | Drive + web + Tavily | subagent-market |
| E3 | COMPETITORS | Type A (narrativa) | Drive + web + Tavily | subagent-competitors |
| E4 | BRAND_VOICE | Type A (narrativa) | Drive + brand guidelines | subagent-brand |
| E5 | TARGET_PERSONAS | Type A (narrativa) | Drive + brief | subagent-personas |
| E6 | LEGAL_CONSTRAINTS | Type A (narrativa) | Drive + contrato | subagent-legal |
| E7 | BUSINESS_OBJECTIVES | Type A (narrativa) | Drive + proposta | subagent-objectives |
| E8 | CONTRACTED_SCOPE | Type A (narrativa) | proposta comercial + JDs Suno | subagent-contract |
| E9 | MARTECH_STACK | Type A (narrativa) | Drive + proposta + tech docs | subagent-martech |

**Type A = narrativa:** texto blob gerado pelo Oracle, um registro por cliente, substituível a cada ciclo.  
**Type B = registry:** N registros acumulados ao longo do tempo (ex: STAKEHOLDERS) — NÃO gerado pelo Oracle, NÃO parte do backbone.

### STAKEHOLDERS — separado do backbone

STAKEHOLDERS é Type B: registro vivo, acumulado em camadas:
1. Início do contrato → todos os clientes diretos + time de compras
2. Após primeiras reuniões → times de produto
3. Ao longo do tempo → áreas específicas do cliente

Não é gerado pelo Oracle. Alimentado via: onboarding manual, captura de atas, edição direta. Vive em tabela `stakeholders` separada, indexado em wiki_entities e knowledge_entities para RAG.

### CONTRACTED_SCOPE — subagente especializado

Lê dois tipos de documento:
1. Proposta comercial final + contrato assinado (PDF upload pelo cliente)
2. Job descriptions das pessoas/departamentos da Suno relevantes ao contrato

Extrai: serviços contratados por área (criação/mídia/planejamento/data), tier financeiro, SLAs implícitos, responsáveis internos Suno.

**Guardrail de acesso:** CONTRACTED_SCOPE só é visível para roles Admin/Sponsor (tier financeiro sensível). Operacional vê versão sem valores financeiros.

### MARTECH_STACK — condicional

Nem todos os clientes têm martech. O subagent-martech deve verificar se existe menção a ferramentas/integrações na proposta antes de popular a entidade. Se não houver, entidade fica vazia (não cria registro fantasma).

---

## Decisão 3 — wiki_entities precisa de coluna embedding (hoje não tem)

Hoje `search_wiki` e `consultar_ontologia` fazem `SELECT *` do `wiki_entities` — context stuffing, não RAG.

**Mudança necessária:**
```sql
ALTER TABLE wiki_entities ADD COLUMN embedding vector(768);
```

Modelos: `text-embedding-004` (Gemini, 768 dims) — mesmo modelo já usado em `api/chat/knowledge/embeddings.py`.

`search_wiki` e `consultar_ontologia` devem migrar para busca semântica com pgvector cosine similarity, igual ao padrão já implementado em `api/chat/knowledge/document_search.py`.

---

## Decisão 4 — Camadas de conhecimento (L1–L5)

| Camada | Nome | Conteúdo | Retrieval | Estabilidade |
|--------|------|----------|-----------|--------------|
| L1 | Ontologia | wiki_entities (9 entidades backbone) | Semantic RAG (pgvector 768d) | Alta, curada |
| L2 | Biblioteca | docs Biblioteca (`biblioteca_documents`) | Semantic + BM25 + compression (ADR-008) | Média, curada |
| L3 | Drive Raw | documentos brutos do Drive cliente | Semantic RAG chunks | Contínua, sync |
| L4 | Reuniões | atas processadas | CAG (hot) + RAG (cold) | Quente/sensível |
| L5 | Stakeholders | registry stakeholders | Semantic RAG (by client_id) | Viva, acumulativa |

**Prioridade de retrieval quando há sobreposição:** L1 > L2 > L5 > L3 > L4.

---

## Decisão 5 — Reuniões: CAG para hot, RAG para cold

**Definição:**
- Hot: ata com < 60 dias → CAG (transcript completo no contexto)
- Cold: ata com ≥ 60 dias → RAG (chunks semânticos)

**Racional:** Reuniões recentes são referenciadas frequentemente e com perguntas que requerem leitura completa ("o que foi decidido sobre X nessa reunião?"). Após 60 dias, acesso é mais esporádico e busca semântica por chunk é suficiente.

**CAG implementation:**
- Transcript filtrado (pós-HITL 1) carregado inteiro no context window
- Para múltiplas reuniões hot: ordenar por data desc, carregar até saturar o context
- Anthropic prompt cache: prefixo estático do transcript cacheado para queries repetidas

**Transição hot→cold:**
- Job periódico (daily) verifica atas com data > 60 dias
- Chunka e indexa no pgvector
- Remove da tabela de hot access

---

## Decisão 6 — Dual HITL para reuniões

**HITL 1 — Content safety (fora do deep agent, antes do AI ler):**
- Trigger: upload de nova ata
- Revisor humano: remove PII, HR content (demissões, promoções, avaliações), fofoca, menções pessoais (férias, família), informações de gestão de pessoas
- Somente após aprovação humana o conteúdo entra no pipeline de AI
- Resultado: versão sanitizada gravada em `meeting_transcripts.sanitized_content`

**HITL 2 — Ontology update proposal (dentro do deep agent, via LangGraph interrupt):**
- Trigger: deep agent identifica informação que atualiza/contradiz entidade existente
- Agent propõe: qual entidade atualizar, qual trecho da ata é evidência, qual mudança proposta
- Revisor (Admin/Sponsor) aprova/rejeita via UI
- Se aprovado: pipeline pós-HITL executa

**LangGraph interrupt pattern:**
```python
# Dentro do deep agent graph
if agent_proposes_update:
    interrupt(value=OntologyUpdateProposal(
        entity_id=entity_id,
        evidence_anchor=transcript_excerpt,
        proposed_change=diff,
        confidence=score
    ))
    # Aguarda resposta humana antes de continuar
```

---

## Decisão 7 — Pipelines pós-HITL 2

Após aprovação humana de uma proposta de atualização:

**Pipeline 1 — Embed entity:**
```
approved_update → update wiki_entities.content → 
embed_text(new_content) → update wiki_entities.embedding → 
invalidate cache L1
```

**Pipeline 2 — Extract named entities (GraphRAG seed):**
```
approved_update → LLMGraphTransformer → 
upsert knowledge_entities (badge=oracle_seed) + entity_relationships → 
enqueue para indexação pgvector
```

ADR-013 (LLMGraphTransformer + AlloyDB) já aceito, fornece a infra para Pipeline 2.

---

## Decisão 8 — Guardrails do Oracle (3 camadas)

**Guardrail 1 — Input (o que o Oracle pode ler):**
- Somente lê documentos com status `ready` ou `approved` no Drive
- Somente processa reuniões que passaram pelo HITL 1 (sanitized)
- Nunca lê `system_prompts`, `brand_guidelines` de outros clientes (caixa-preta)

**Guardrail 2 — Output (o que o Oracle pode escrever):**
- PII filter: nomes de pessoas físicas removidos ou anonimizados (exceto stakeholders explicitamente cadastrados)
- Sensitive topic detector: detecta se output menciona valores financeiros específicos (filtrar), dados de RH (filtrar), informações de concorrência confidencial (flag para revisão)

**Guardrail 3 — Acesso à ontologia gerada:**
- CONTRACTED_SCOPE (tier financeiro): somente roles `admin`, `sponsor`
- Demais entidades: roles normais do cliente
- Implementado como column-level security ou row-level filter em `wiki_entities`

---

## Decisão 9 — LLM e embeddings

| Uso | Modelo | Motivo |
|-----|--------|--------|
| Oracle deep agent | Gemini 2.5 Flash | Default, custo/performance |
| Subagentes de entidade | Gemini 2.5 Flash | Consistência |
| Embeddings | text-embedding-004 (768d) | Já implementado no projeto |
| GraphRAG extraction | Gemini 2.5 Flash | ADR-013 |

---

## Bug ativo a corrigir junto

Em `api/onboarding/oracle_agent.py`, função `add_reunion_context_to_oraculo`:
```python
# BUG: busca "Briefings" (plural) mas DB tem "Briefing" (singular)
entity = wiki_entities.query(entity_type="Briefings")  # → sempre None
```
Corrigir para `entity_type="Briefing"` como parte da migração para o novo schema.

---

## Documentos a gerar (referência)

| # | Documento | Ação | Depende de |
|---|-----------|------|-----------|
| 1 | `docs/adr/ADR-007-cadastro-ontologico-cliente.md` | Reescrever (v2) | — |
| 2 | `docs/adr/ADR-015-oracle-deep-agent-architecture.md` | Criar | ADR-007 |
| 3 | `docs/adr/ADR-016-meeting-processing-cag-rag.md` | Criar | — |
| 4 | `docs/adr/ADR-017-knowledge-layers-guardrails.md` | Criar | — |
| 5 | `docs/adr/ADR-013-*` | Atualizar (oracle_seed badge) | ADR-007 |
| 6 | `docs/adr/ADR-008-*` | Atualizar (L2 Biblioteca posição) | — |
| 7 | `docs/specs/large/onboarding-oraculo-cliente/spec.md` | Reescrever v2 (SPEC-015) | ADR-007, ADR-015 |
| 8 | `docs/specs/large/meeting-capture/` | Criar (SPEC-016) | ADR-016 |
| 9 | `docs/srd/parte2-domain-model.md` | Atualizar (9 entidades, Type A/B) | ADR-007 |
| 10 | `docs/srd/parte3-requisitos-nao-funcionais.md` | Atualizar (camadas RAG) | ADR-017 |
| 11 | `docs/srd/parte6-integrações.md` | Atualizar (deep agent, CAG) | ADR-015, ADR-016 |
| 12 | `docs/prd/parte1-visao-e-objetivos.md` | Atualizar (Oracle v2) | SPEC-015 |
| 13 | `docs/prd/parte4-roadmap.md` | Atualizar (fases Oracle) | SPEC-015 |
| 14 | `docs/brd/parte3-requisitos.md` | Atualizar (BR-023 reuniões) | SPEC-016 |
| 15–19 | Diagramas D1–D5 | Criar (Mermaid em docs/architecture/) | ADR-007, ADR-015, ADR-016, ADR-017 |

---

## Arquivos existentes impactados no backend

| Arquivo | Mudança necessária |
|---------|-------------------|
| `api/onboarding/oracle_agent.py` | Reescrever para deep agent + subagentes |
| `api/chat/tools/wiki_search.py` | Migrar para semantic RAG (pgvector) |
| `api/workflows/compiler.py` | Migrar `consultar_ontologia` para semantic RAG |
| `api/models/` | Adicionar `wiki_entities.embedding vector(768)` |
| `api/onboarding/service.py` | Adicionar HITL 1 gate para reuniões |

Estas mudanças de código NÃO são escopo dos documentos a gerar — são implementação fase posterior.
