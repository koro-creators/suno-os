---
adr-id: ADR-007
titulo: Schema canônico de entidades ontológicas do cliente
status: Revisado
criado: 2026-01-15
revisado: 2026-06-23
versao: 2.0
substituido_por: —
upstream:
  - docs/brd/parte3-requisitos.md (BR-021, BR-022)
  - docs/superpowers/specs/2026-06-23-oracle-deep-agent-design.md
downstream:
  - ADR-015 (Oracle Deep Agent Architecture — a criar)
  - ADR-016 (Meeting Processing CAG/RAG — a criar)
  - ADR-017 (Knowledge Layers Guardrails — a criar)
---

# ADR-007 — Schema canônico de entidades ontológicas do cliente (v2)

## Contexto

### Problema original (ADR-007 v1)

O cadastro de clientes no sunOS continha apenas campos operacionais (`name`, `slug`, `color`, `description`, `contact`, `assignedSkills`, `metrics`). Sem contexto de domínio, os agents geravam outputs genericamente corretos mas sem identidade de marca. A v1 deste ADR resolveu isso adicionando um campo `ontologia?: PerfilOntologico` com 5 seções (tom de voz, personas, mercado, restrições, objetivos).

### Por que a v1 se tornou insuficiente

A v1 foi proposta antes da decisão de implementar o Oracle como deep agent com subagentes (ver design doc `2026-06-23-oracle-deep-agent-design.md`). Com essa mudança arquitetural, dois problemas emergiram:

1. **O schema v1 (5 seções JSONB no ClientAdmin) não é compatível com RAG semântica.** A tabela `wiki_entities` existe mas não tem coluna `embedding vector(768)` — as ferramentas `search_wiki` e `consultar_ontologia` fazem `SELECT *` (context stuffing) em vez de busca vetorial. Isso não escala.

2. **O schema v1 tinha 6 entidades hardcoded que divergem do BRD** (BR-021, BR-022). O BRD exige 9 entidades distintas, incluindo `CONTRACTED_SCOPE` (escopo financeiro sensível) e `MARTECH_STACK` (stack de tecnologia), ausentes na v1.

3. **A distinção Type A / Type B não estava formalizada.** Entidades com lifecycle de "registro acumulativo" (como stakeholders) foram tratadas como o mesmo tipo das entidades narrativas geradas pelo Oracle — confundindo responsabilidades.

### Decisores

Heitor Miranda (Inovação), José Lucas (Tech Lead)

### Contexto Técnico

sunOS — Next.js 14 + FastAPI + LangGraph + PostgreSQL + pgvector

---

## Decisão

Adotar um **schema canônico de 9 entidades Type A (narrativas)** como backbone da ontologia de cliente, armazenadas em `wiki_entities` com coluna `embedding vector(768)` obrigatória para RAG semântica. Formalizar a distinção entre **Type A** (narrativa, um registro por cliente, gerado/substituído pelo Oracle) e **Type B** (registry acumulativo, lifecycle próprio).

Esta decisão realinha a implementação com BR-021 e BR-022, e é pré-requisito para ADR-015 (Oracle Deep Agent).

---

## Entidades Type A (backbone)

Type A significa: texto narrativo blob, **um registro por cliente**, gerado ou substituído pelo Oracle a cada ciclo de atualização. Não há histórico acumulativo — a versão anterior é arquivada e a nova substitui como `ACTIVE`.

| ID | entity_type | Descrição | Fonte primária | Subagente Oracle |
|----|-------------|-----------|----------------|------------------|
| E1 | `CLIENT_PROFILE` | Perfil geral do cliente: setor, porte, posicionamento, história | Drive + web | `subagent-profile` |
| E2 | `MARKET_CONTEXT` | Contexto de mercado: categoria, sazonalidade, dinâmicas do setor | Drive + web + Tavily | `subagent-market` |
| E3 | `COMPETITORS` | Análise de concorrentes: players, diferenciação, posicionamento relativo | Drive + web + Tavily | `subagent-competitors` |
| E4 | `BRAND_VOICE` | Tom e voz da marca: personalidade, estilo de linguagem, palavras a evitar, exemplos aprovados | Drive + brand guidelines | `subagent-brand` |
| E5 | `TARGET_PERSONAS` | Personas-alvo: perfis comportamentais, dores, canais preferidos | Drive + brief | `subagent-personas` |
| E6 | `LEGAL_CONSTRAINTS` | Restrições legais e regulatórias: CONAR, ANATEL, claims proibidos, obrigatórios | Drive + contrato | `subagent-legal` |
| E7 | `BUSINESS_OBJECTIVES` | Objetivos de negócio do período: foco, campanhas ativas, KPIs, vigência | Drive + proposta | `subagent-objectives` |
| E8 | `CONTRACTED_SCOPE` | Escopo contratado: serviços por área, tier financeiro, SLAs implícitos, responsáveis Suno | Proposta comercial + JDs Suno | `subagent-contract` |
| E9 | `MARTECH_STACK` | Stack de tecnologia e dados do cliente: ferramentas, integrações, plataformas de mídia | Drive + proposta + tech docs | `subagent-martech` |

### Guardrails específicos

**CONTRACTED_SCOPE (E8) — acesso restrito:**
Contém tier financeiro sensível. Visível somente para roles `admin` e `sponsor`. Perfis operacionais recebem 404 ao tentar acessar — nunca 403 (caixa-preta, conforme `.claude/rules/caixa-preta.md`). Implementado como row-level filter em `wiki_entities` por `role` no JWT.

**MARTECH_STACK (E9) — condicional:**
Nem todos os clientes têm stack de martech. O `subagent-martech` deve verificar explicitamente se há menção a ferramentas, integrações ou plataformas de dados nos documentos antes de popular a entidade. Se não houver evidência suficiente, a entidade permanece vazia (`status: EMPTY`) — não cria registro fantasma com conteúdo inventado.

---

## Entidades Type B (registries acumulativos)

Type B significa: N registros acumulados ao longo do tempo, com lifecycle próprio — não gerado pelo Oracle, não substituído a cada ciclo.

### STAKEHOLDERS — separado do backbone

`STAKEHOLDERS` é a entidade Type B mais importante. É um registro **vivo e acumulativo** com três camadas de crescimento:

| Camada | Momento | Origem |
|--------|---------|--------|
| Camada 1 | Início do contrato | Clientes diretos + time de compras |
| Camada 2 | Primeiras reuniões | Times de produto |
| Camada 3 | Ao longo do tempo | Áreas específicas do cliente |

Não é gerado pelo Oracle. É alimentado por: onboarding manual, captura de atas de reunião (BR-020), edição direta pelo Builder/Sponsor.

Vive em tabela `stakeholders` separada. É indexado em `wiki_entities` e `knowledge_entities` para RAG (busca semântica por `client_id`).

**Por que STAKEHOLDERS não está no backbone:** tem lifecycle radicalmente diferente das entidades Type A. Não faz sentido "substituir" stakeholders a cada ciclo Oracle — eles são acumulados e raramente removidos. Misturar os dois tipos quebraria a semântica do campo `status` e a lógica de versionamento.

---

## Schema wiki_entities atualizado

A mudança estrutural crítica desta versão é a adição da coluna `embedding`:

```sql
-- Migração necessária — bloqueio para RAG semântica
ALTER TABLE wiki_entities ADD COLUMN embedding vector(768);

-- Índice para busca semântica
CREATE INDEX idx_wiki_entities_embedding 
  ON wiki_entities USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

**Modelo de embedding:** `text-embedding-004` (Gemini, 768 dimensões) — mesmo modelo já usado em `api/chat/knowledge/embeddings.py`. Nenhuma nova dependência de modelo.

### Schema completo da tabela

```sql
CREATE TABLE wiki_entities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     TEXT NOT NULL,              -- denormalizado para cross-tenant guard
  entity_type   TEXT NOT NULL,              -- E1–E9 (Type A) ou 'STAKEHOLDERS' (Type B)
  content       TEXT NOT NULL,              -- narrativa gerada pelo Oracle
  embedding     vector(768),                -- NOVO — busca semântica
  status        TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
                                            -- PENDING_REVIEW | ACTIVE | ARCHIVED | EMPTY
  source        TEXT,                       -- origem: Drive path, URL, manual
  confidence    FLOAT,                      -- score do subagente (0.0–1.0)
  approved_by   TEXT,                       -- user_id do aprovador humano
  approved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  -- Guardrail E8 CONTRACTED_SCOPE
  min_role      TEXT DEFAULT 'operator'     -- 'operator' | 'sponsor' | 'admin'
);
```

**Cross-tenant guard:** toda query filtra `client_id` resolvido do JWT. Nunca filtrar só por `id` e depois verificar `client_id` — ver `.claude/rules/caixa-preta.md` para o padrão correto.

### Migração do schema v1 → v2

As 6 entidades hardcoded da v1 mapeiam para as 9 entidades v2:

| v1 (campo JSONB em ClientAdmin) | v2 (entity_type em wiki_entities) |
|----------------------------------|-----------------------------------|
| `tom_de_voz` | `BRAND_VOICE` |
| `personas` | `TARGET_PERSONAS` |
| `mercado` | `MARKET_CONTEXT` + `COMPETITORS` (split) |
| `restricoes` | `LEGAL_CONSTRAINTS` |
| `objetivos` | `BUSINESS_OBJECTIVES` |
| *(não existia)* | `CLIENT_PROFILE` |
| *(não existia)* | `CONTRACTED_SCOPE` |
| *(não existia)* | `MARTECH_STACK` |

---

## Alternativas consideradas

### Alternativa 1 — Manter schema v1 (6 entidades JSONB em ClientAdmin)

**Rejeitada por:**
- Não cobre `CONTRACTED_SCOPE` (tier financeiro sensível, com RBAC específico) e `MARTECH_STACK` (essencial para personalização de skills de dados).
- JSONB em `ClientAdmin` não suporta coluna `embedding` por entidade individual — inviabiliza RAG semântica estruturada (L1 da arquitetura de camadas).
- Sem distinção `status` por entidade: não há como saber qual entidade está pendente de revisão humana (BR-021 exige HITL por entidade).

### Alternativa 2 — Schema livre sem backbone fixo

**Rejeitada por:**
- Impede RAG semântica estruturada: sem tipos fixos, não há como fazer busca por `entity_type = 'BRAND_VOICE'` para contexto específico.
- Impede consistência cross-cliente: cada Oracle instância poderia criar entidades com nomes diferentes para o mesmo conceito.
- Impede rastreabilidade de cobertura: não dá para saber se um cliente tem todas as entidades essenciais populadas (condição para sair de `PRE_ACTIVE`).

### Alternativa 3 — STAKEHOLDERS no backbone (como 10ª entidade Type A)

**Rejeitada por:**
- Lifecycle incompatível: stakeholders são acumulados incrementalmente; substituir o registro inteiro a cada ciclo Oracle apagaria camadas históricas valiosas.
- Fonte diferente: Oracle gera narrativas a partir de documentos; stakeholders vêm de onboarding manual, atas e edição direta — não faz sentido forçar essa fonte pelo Oracle.
- Tabela separada já existe e tem model adequado para registry acumulativo.

### Alternativa 4 — Dois Oracle agents separados (Onboarding + Contratos)

**Rejeitada por:**
- Plumbing desnecessário: `create_deep_agent` do LangChain já suporta subagentes com contexto isolado dentro de um único agente principal.
- Um agente principal que despacha subagentes paralelamente (um por entity_type) é mais simples e já é o padrão do Oracle v2 (ADR-015).

---

## Consequências

### Positivas

- RAG semântica estruturada viabilizada: `search_wiki` e `consultar_ontologia` podem fazer busca por similaridade coseno com filtro por `entity_type` — precisão muito maior que context stuffing.
- CONTRACTED_SCOPE com acesso granular: tier financeiro sensível fica restrito a `admin`/`sponsor` sem exigir tabela separada.
- MARTECH_STACK condicional evita entidades fantasma para clientes sem stack de dados.
- Distinção Type A/Type B formaliza o contrato: Oracle gerencia A, operação humana + reuniões gerenciam B.
- Backward compat: `ClientAdmin` mantém campo `ontologia?: PerfilOntologico` como legado transitório — não é breaking change no frontend. Migração gradual.

### Negativas

- Migration necessária: `ALTER TABLE wiki_entities ADD COLUMN embedding vector(768)` é bloqueante para produção até ser executada.
- Oracle v1 (`api/onboarding/oracle_agent.py`) precisa ser reescrito para suportar 9 entidades e arquitetura de subagentes (escopo de ADR-015).
- Reindexação: entidades existentes em `wiki_entities` precisam ter `embedding` calculado retroativamente — job de migração de dados necessário.

### Neutras

- `search_wiki` e `consultar_ontologia` migram para pgvector cosine similarity (mesmo padrão já implementado em `api/chat/knowledge/document_search.py`).
- Frontend: aba "Ontologia" no `ClientEditorTabs` permanece, mas passa a refletir os 9 `entity_type` em vez das 5 seções JSONB.

---

## Pendências técnicas

### Bloqueante para produção

- [ ] `ALTER TABLE wiki_entities ADD COLUMN embedding vector(768)` — migração de schema
- [ ] Job de reindexação de entidades existentes (calcular embeddings via `text-embedding-004`)
- [ ] Migração de dados: `ClientAdmin.ontologia` JSONB → registros em `wiki_entities` com entity_types v2

### Tech debt documentado

**Bug ativo em `api/onboarding/oracle_agent.py`:**

```python
# BUG: função add_reunion_context_to_oraculo
# busca entity_type="Briefings" (plural) mas DB grava "Briefing" (singular)
# resultado: silent no-op — nunca encontra a entidade, nunca atualiza
entity = wiki_entities.query(entity_type="Briefings")  # → sempre None
```

Correção: `entity_type="Briefing"`. Deve ser corrigida como parte da reescrita do Oracle (ADR-015), não em hotfix isolado, pois a reescrita muda o schema de entity_types.

### Não bloqueante (Fase posterior)

- [ ] Row-level security nativo PostgreSQL para `CONTRACTED_SCOPE` (hoje: filtro na camada de aplicação)
- [ ] Frontend: substituir formulário de 5 seções JSONB por visualização dos 9 entity_types com status individual
- [ ] Política de arquivamento automático: entidade `ACTIVE` com `updated_at > 180 dias` → flag `STALE` para revisão

---

## Histórico de versões

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-01-15 | Versão original: campo `ontologia?: PerfilOntologico` em `ClientAdmin` com 5 seções JSONB (tom_de_voz, personas, mercado, restricoes, objetivos). Preenchimento manual ou assistido por LLM. |
| 2.0 | 2026-06-23 | Revisão completa motivada pelo redesign do Oracle como deep agent. Schema migrado para 9 entidades canônicas em `wiki_entities`. Formalização Type A/Type B. Adição de coluna `embedding vector(768)`. CONTRACTED_SCOPE com guardrail de acesso. MARTECH_STACK condicional. Documentação do bug `entity_type="Briefings"`. Alinhamento com BR-021 e BR-022. |

---

## Referências

- `docs/superpowers/specs/2026-06-23-oracle-deep-agent-design.md` — decisões do redesign Oracle (Decisões 1–9)
- `docs/brd/parte3-requisitos.md` — BR-021 (Wiki Ontológica), BR-022 (Onboarding Oracle)
- ADR-002 sunOS: Engine Único com Context Injection — ontologia é o mecanismo de personalização por cliente
- ADR-003: RAG PostgreSQL + pgvector — padrão de busca semântica que `wiki_entities` deve adotar
- ADR-013: LLMGraphTransformer + AlloyDB — GraphRAG seed pós-HITL 2 (pipeline 2)
- ADR-015: Oracle Deep Agent Architecture (a criar) — arquitetura de subagentes que consome este schema
- `.claude/rules/caixa-preta.md` — padrão de 404 genérico para cross-tenant guard
- `api/chat/knowledge/embeddings.py` — implementação de referência do `text-embedding-004`
- `api/chat/knowledge/document_search.py` — padrão pgvector cosine similarity a replicar em `search_wiki`
