---
documento: SRD Parte 7 - Architecture Decision Records (ADRs)
projeto: sunOS
cliente: Suno United Creators (uso 100% interno)
versao: 1.0
data_criacao: 2026-04-28
ultima_atualizacao: 2026-04-28
autor: Heitor Miranda + Claude (Koro Docs Pipeline)
status: Rascunho
fonte_codigo: /Users/heitor.miranda/projects/suno-os/
fonte_adr: /Users/heitor.miranda/projects/suno-os/docs/adr/
total_adrs: 7 (2 catalogados Aceitos + 5 propostos)
---

# SRD Parte 7 — Architecture Decision Records (ADRs)

## 1. Introdução

### 1.1. Objetivo

Este documento (a) **catalisa os ADRs já existentes** no diretório `docs/adr/` (formato Michael Nygard) e (b) **propõe ADRs novos** para decisões técnicas implícitas no código que merecem registro formal — especialmente aquelas que aparecem como assumidas mas não estão documentadas em outro lugar e que terão impacto duradouro no sunOS.

### 1.2. Convenções

Formato Michael Nygard adotado:

- **Status**: Proposed | Accepted | Deprecated | Superseded by ADR-XXX
- **Context**: forças e drivers
- **Decision**: o que foi decidido
- **Consequences**: positivas, negativas, neutras
- **Alternatives Considered**: opções rejeitadas com justificativa
- **Rastreabilidade**: BRs / NFRs / containers afetados

### 1.3. Relação com Outros Artefatos

| Artefato | Relação |
|----------|---------|
| BRD Parte 3/4 (BR/RN) | ADRs respondem a tensões entre BRs e RNs |
| SRD Parte 1 (NFRs) | ADRs equilibram NFRs em conflito (ex: portabilidade vs. performance) |
| SRD Parte 5 (Arch As-Is) | ADRs históricos moldaram o As-Is |
| SRD Parte 6 (Arch To-Be) | Novos ADRs guiam a evolução |

### 1.4. Sumário Executivo

| ADR | Título | Status | Categoria | Data |
|-----|--------|--------|-----------|------|
| **ADR-001** | Agent/Workflow Builder com LangGraph como engine | Aceito (revisado) | Arquitetura/Workflows | 2026-04-14 |
| **ADR-002** | Engine único com context injection (não Deep Agent por cliente) | Aceito | Arquitetura/Multi-tenancy | 2026-04-14 |
| **ADR-003** | pgvector em PostgreSQL como vector store (vs. Pinecone/Weaviate dedicados) | Proposto | Persistência/Vector Search | 2026-04-28 |
| **ADR-004** | Gemini 2.5 Flash como LLM default (vs. Claude/GPT-4o) | Proposto | LLM/Custo-performance | 2026-04-28 |
| **ADR-005** | LangGraph (vs. LangChain puro / agno / CrewAI) para orquestração | Proposto | Framework/Agents | 2026-04-28 |
| **ADR-006** | Firebase Authentication como provedor de identidade único | Proposto | Auth/Identity | 2026-04-28 |
| **ADR-007** | Skills como diretório `SKILL.md` + `references/` (progressive disclosure) vs. registry centralizado | Proposto | Skills/Domain Knowledge | 2026-04-28 |
| **ADR-008** | Validators paralelos (LangGraph sub-graph) vs. LLM genérico vs. linters determinísticos | Proposto | Aprovação/FA-13 | 2026-04-28 |
| **ADR-009** | Google Drive read-only com curadoria sugestiva vs. espelho bidirecional (pedido literal) | Proposto | Drive/FA-14 | 2026-04-28 |
| **ADR-010** | Hierarquia de aprovação configurável manual (admin) vs. sync RH | Proposto | Aprovação/FA-13 | 2026-04-28 |
| **ADR-011** | Adoção de `deepagents` como harness para BC-04 e BC-07 (Provocation, Validators, Curation) — não para BC-03 nem CTM-02 | Proposto | Framework/Agents | 2026-04-28 |

---

## 2. ADRs Catalogados (já em `docs/adr/`)

### 2.1. ADR-001 — Agent/Workflow Builder com LangGraph

**Arquivo**: `docs/adr/ADR-001-agent-builder-deferred.md`

**Status**: ~~Rejeitado~~ → **Aceito** (revisado em 2026-04-14)

**Decisores**: Heitor Miranda, José Lucas, William (Carioca)

**Resumo**

Inicialmente o Agent Builder havia sido rejeitado por falta de demanda validada e escopo desproporcional ao time de 4 devs. Foi **revisado e aceito** porque:

1. Levantamento revelou volume real de automações necessárias (>48 atividades pendentes de 136 catalogadas)
2. Time pequeno = mais motivo para empoderar usuários técnicos (analistas de mídia/BI/financeiro)
3. Usuários-alvo são técnicos (já usam SmartSheet, BigQuery, Meta Ads Manager)
4. **LangGraph dá escalabilidade desde o dia zero** — cada workflow vira um `StateGraph` compilado, mesmo engine do chat

**Decisão**

Implementar Workflow Builder usando LangGraph como engine. Cada workflow criado pelo usuário compila para um `StateGraph` que roda no mesmo backend.

**Consequências principais**

- (+) Reuso total de infra (mesmo deploy, mesmo monitoring, mesmo MLflow)
- (+) Tools do chat reutilizáveis no builder
- (+) HITL nativo via `interrupt()` e `Command(resume=...)` do LangGraph
- (-) Risco de workflows mal construídos falharem silenciosamente — mitigado por eval + logging por step
- (-) Risco de explosão de custo LLM com schedules mal configurados — mitigado por rate limit por workflow

**Impacto na Arch As-Is**: justifica os módulos `api/workflows/{router,compiler,executor,scheduler,models,schemas}.py` e os componentes frontend `components/workflows/*`. Define que CORS é gerenciado pelo Load Balancer (não pelo app).

**Rastreabilidade**: BR-002, BR-015 — atualmente vinculado.

---

### 2.2. ADR-002 — Engine Único com Context Injection (não Deep Agent por cliente)

**Arquivo**: `docs/adr/ADR-002-single-engine-not-deep-agent-per-client.md`

**Status**: **Aceito** (revisado em 2026-04-28 — escopo clarificado)

**Decisores**: Heitor Miranda, José Lucas, William (Carioca)

**Resumo**

Foi proposto criar um Deep Agent separado por cliente (Santander, Vivo, Americanas, etc.). Decidiu-se contra: **um engine único de agente com context injection por cliente** é mais simples e consistente.

> **Nota de revisão (2026-04-28):** o título original "não Deep Agent por cliente" gerou ambiguidade quando a biblioteca `deepagents` (LangChain) entrou em discussão. **Esta decisão rejeita a arquitetura de "1 agente isolado por tenant"**, NÃO a biblioteca `deepagents` enquanto harness multi-agente. Adoção pontual de `deepagents` em Bounded Contexts específicos (BC-04 Provocation Engine, BC-07 Validators e CurationAgent) é tratada por **ADR-011** e **não conflita** com este ADR — porque o engine continua único, e `deepagents` ali atua como padrão de orquestração interna ao BC, não como tenant-isolation.

**Justificativas principais**

1. A analogia com Claude Code estava incorreta — Claude Code é o **mesmo engine** em todo repo; o que muda é o `CLAUDE.md` e arquivos do repo (= system prompt do skill + Biblioteca filtrada).
2. Deep Agents separados multiplicam custo de manutenção (deploy N×, atualização de modelo N×, bug fix N×, monitoring N×).
3. O que varia entre clientes é **contexto, não arquitetura**: tom de voz (skill reference), brand books (Biblioteca filtrada por scope), histórico (PostgreSQL filtrado por client_id), modelo preferido (SkillAdmin.model).
4. A arquitetura atual já suporta — `skill_slug` + `context_documents` são o mecanismo de personalização.

**Decisão**

Engine único LangGraph: `top_supervisor → orchestrator → agent (BaseAgent)`. Personalização por:

- `skill_slug` → system prompt + references
- `scope` → documentos da Biblioteca
- `client_id` → histórico de conversas
- `model` → LLM preferido do skill

**O que esta decisão NÃO impede**:

- Adotar `deepagents` (ou outro harness multi-agente) **dentro de um BC** quando a topologia do problema for genuinamente multi-agente com sub-agentes isolados (caso de Shoot for the Moon e Validators paralelos). Ver ADR-011.
- Spawn de sub-agentes em runtime via LangGraph (já em uso no padrão Explorer↔Crítico).
- Usar modelos diferentes por skill (já decidido em ADR-004).

**O que esta decisão impede**:

- Deploy de N containers/serviços, um por cliente.
- Bases de código separadas por cliente.
- Pipelines de CI/CD ramificados por tenant.
- Storage físico segregado (mantém-se PostgreSQL único com filtro por `client_id` — RN-010).

**Critérios para revisitar**: cliente exigir workflow radicalmente diferente; regulamentação exigir tenant separation física (não lógica); degradação de performance com N clientes simultâneos que isolation lógico não resolva.

**Impacto na Arch As-Is**: define a topologia de `chat/graph/{builder, top_supervisor, orchestrator, runner, state}.py`.

**Rastreabilidade**: BR-007 (Caixa-preta), BR-008 (Privacidade), BR-015 (Integração com Skills); relacionado a **ADR-011** (escopo de adoção de `deepagents` interno aos BCs).

---

## 3. ADRs Propostos (novos)

ADRs novos foram identificados a partir de **decisões implícitas no código** que merecem registro formal por terem impacto arquitetural duradouro.

---

### 3.1. ADR-003 — pgvector em PostgreSQL como Vector Store

**Arquivo proposto**: `docs/adr/ADR-003-pgvector-as-vector-store.md`

#### Status

**Proposed**

Data: 2026-04-28
Autor: Heitor Miranda + Claude
Revisores: pendente (José Lucas, William)

#### Context

A Biblioteca do sunOS precisa indexar centenas (Piloto) a milhares (MVP) de documentos curados (PDFs, transcrições, briefings, brand books, cases) para retrieval semântico via similaridade de embeddings. As skills processuais (Copy Social, Plano de Mídia, etc.) e o Shoot for the Moon dependem dessa busca para injeção de contexto.

A escolha técnica observada no código (`api/chat/knowledge/vector_store.py`, `api/models/knowledge.py`) é **pgvector** dentro do mesmo PostgreSQL Cloud SQL onde residem `conversations`, `chat_messages` e `knowledge_documents`. A coluna `embedding` é `Vector(768)` e a busca usa cosine distance (`<=>`).

**Drivers identificados:**

- BR-002 (Aceleração operacional): retrieval rápido como fundação de Skills
- BR-006 (Acesso democrático ao conhecimento): tempo médio < 2 min para encontrar referência
- NFR-003 (Latência retrieval P95 < 300ms)
- NFR-022/023 (Portabilidade — Cloud Run + PostgreSQL gerenciado)
- BR-008 (Privacidade): isolamento por scope/client em retrieval
- Restrição operacional: time de 4 devs, prazo apertado de Piloto

**Contexto técnico:**

- Volume estimado Piloto: ~10K-50K chunks
- Volume estimado MVP: ~100K-500K chunks
- Filtros frequentes: `scope` (ARRAY[Text]), `file_type`, `client_id`
- Latência crítica: pgvector_search é caminho quente do chat

#### Decision

**Decidimos que** a primeira versão do sunOS usará **pgvector dentro do mesmo PostgreSQL Cloud SQL**, sem provisionar vector database dedicada (Pinecone, Weaviate, Qdrant, Milvus).

**Detalhamento:**

- Coluna `embedding` tipo `Vector(768)` em `knowledge_chunks`
- Similarity search via cosine distance (`<=>`)
- Índice tunado (HNSW preferido sobre IVFFlat) — parâmetros a calibrar com volume real (DT-03)
- Filtros (scope, file_type) como `WHERE` na mesma query
- Reavaliar em volumes > 1M chunks ou se NFR-003 não for atendido

#### Consequences

##### Positivas

- **Operação simples**: 1 banco para gerenciar (backups, monitoring, IAM, network)
- **Custo previsível**: Cloud SQL escala vertical/horizontalmente; sem fee mensal de SaaS adicional
- **Joins ricos**: combinar busca vetorial com filtros relacionais (scope, client_id, status, tags) em uma query única — crítico para RN-010 (isolamento cross-client) e BR-008
- **Transações ACID**: upsert de chunks + update de `chunks_count` no mesmo commit (ver `vector_store.py:upsert_chunks`)
- **Sem vendor lock-in**: pgvector é open source; portabilidade preservada (NFR-023)
- **Fallback gracioso**: `vector_store.py` já trata DB unavailable retornando lista vazia

##### Negativas

- **Performance limit**: pgvector tem teto prático em ~1M-10M vetores por tabela; vector DBs dedicadas escalam melhor — mitigação: monitorar P95 (NFR-003) e migrar se quebrar
- **Funcionalidades avançadas faltantes**: filtros complexos (hybrid search BM25+vector, learned re-ranking) exigem mais código vs. SDK pronto da Pinecone — mitigação: aceitar essa limitação no Piloto
- **Tunning manual**: HNSW vs IVFFlat, parâmetros `m`, `ef_construction`, `ef_search` exigem expertise — mitigação: documentar configuração e revisar em sprint de performance

##### Neutras

- pgvector é maduro (>v0.6, usado por OpenAI em produção, Supabase em escala)
- Migração futura para vector DB dedicada é factível (extrair embeddings + IDs + reindex)

#### Alternatives Considered

##### Alternativa 1: Pinecone (managed vector DB)

**Descrição**: SaaS especializado em vetores com SDK Python pronto.

**Prós:**
- Performance otimizada para alta cardinalidade (>10M vetores)
- Hybrid search e re-ranking nativos
- Latência consistente sob carga

**Contras:**
- Custo adicional (≥$70/mo para starter, escala rápido)
- Vendor lock-in (formato proprietário)
- Mais um ponto de falha externo
- Joins com dados relacionais exigem round-trips
- Compliance LGPD requer due diligence (dados de cliente em SaaS US)

**Por que não foi escolhida**: custo + vendor lock-in + complexidade operacional incompatíveis com time de 4 devs no Piloto. Reavaliar se volume > 1M chunks.

---

##### Alternativa 2: Weaviate ou Qdrant self-hosted

**Descrição**: Vector DB open source self-hostado em Cloud Run / GKE.

**Prós:**
- Sem vendor lock-in
- Funcionalidades avançadas (multi-tenancy, hybrid search)
- Escala melhor que pgvector em volumes grandes

**Contras:**
- **Mais um serviço para operar**: cluster Weaviate/Qdrant adiciona complexidade significativa
- Sincronização entre Weaviate (vetores) e PostgreSQL (metadados) cria estado dual com risco de inconsistência
- Time não tem expertise instalada
- Backups, monitoring, IAM duplicados

**Por que não foi escolhida**: overhead operacional > benefício na escala atual.

---

##### Alternativa 3: BigQuery ML + vector search

**Descrição**: usar BigQuery (já em uso na Suno via Meridian) com `VECTOR_SEARCH` nativo.

**Prós:**
- Já há expertise interna (time Meridian)
- Escala massiva
- Custo por query (não por instância)

**Contras:**
- BigQuery é **analytical** (latência alta para retrieval em chat — minutos, não milissegundos)
- Modelo de billing por bytes processados é imprevisível para queries frequentes
- Sem suporte natural a transações (ACID)

**Por que não foi escolhida**: latência incompatível com NFR-003 (P95 < 300ms).

---

#### Rastreabilidade

| Tipo | IDs | Descrição |
|------|-----|-----------|
| BRs | BR-002, BR-006, BR-008 | Aceleração, acesso democrático, privacidade |
| NFRs | NFR-003, NFR-010, NFR-023 | Latência retrieval, isolamento, portabilidade PG |
| Containers | CT-03 (Cloud SQL), CP-24 (vector_store), CP-33 (KnowledgeChunk model) | — |

| Container/Componente | Impacto |
|----------------------|---------|
| CP-24 vector_store.py | Implementa decisão; ponto único de mudança se migrar |
| CP-33 KnowledgeChunk | Coluna `Vector(768)` reflete decisão |
| CT-03 Cloud SQL | Requer extensão pgvector habilitada |

| ADR | Relação |
|-----|---------|
| ADR-002 | Compatível — engine único usa um vector store único |

#### Notes

- pgvector docs: https://github.com/pgvector/pgvector
- Fallback de import documentado em `models/knowledge.py:24` (LargeBinary se pgvector ausente em CI)
- Reavaliar quando: (a) NFR-003 quebra em medição real; (b) volume > 1M chunks; (c) hybrid search BM25+vector vira requisito firme

---

### 3.2. ADR-004 — Gemini 2.5 Flash como LLM Default

**Arquivo proposto**: `docs/adr/ADR-004-gemini-flash-as-default-llm.md`

#### Status

**Proposed**

Data: 2026-04-28
Autor: Heitor Miranda + Claude
Revisores: pendente (José Lucas, William, Ronaldo Severino)

#### Context

O sunOS faz dezenas a centenas de chamadas LLM por dia (estimativa Piloto) cobrindo: classificação de intenção (TopSupervisor), geração de copy/roteiros/análises (ContentCreator), conversação geral (Conversational), enhancement de prompts, geração de imagens (com pipeline preparatório) e workflows agendados.

O código (`api/chat/graph/runner.py:MODEL_MAP`, `_get_llm`) implementa **Gemini 2.5 Flash como default** com fallback automático quando keys de Anthropic ou OpenAI estão ausentes. Modelos disponíveis:

| Slug API | Modelo real | Status no código |
|----------|-------------|------------------|
| `gemini-flash` | `gemini-2.5-flash` | **Default** |
| `gemini-pro` | `gemini-2.5-pro` | Opcional |
| `gpt-4o` | `gpt-4o` | Opcional |
| `claude` | `claude-sonnet-4` | Opcional |

**Drivers identificados:**

- BR-002 (Aceleração operacional): custo precisa permitir alto volume de chamadas
- BR-013 (Mensuração de custo evitado): cada execução tem que sair barata para business case fechar
- NFR-001 (P95 first-token < 1500ms)
- NFR-017 (Suporte multi-LLM)
- Restrição: orçamento fechado para POC/Protótipo (Q3 2026)

**Contexto técnico:**

- Gemini 2.5 Flash: ~$0.075/M input tokens, ~$0.30/M output tokens, latência típica 200-700ms TTFT
- Claude Sonnet 4: ~$3/M input, ~$15/M output, qualidade superior em razão complexa
- GPT-4o: ~$2.5/M input, ~$10/M output, equilibrado
- Maioria dos casos sunOS é **alta velocidade + custo baixo** (geração de copy, classificação, retrieval-augmented Q&A)

#### Decision

**Decidimos que** o LLM default do sunOS é **Gemini 2.5 Flash**, com Claude Sonnet 4 e GPT-4o disponíveis sob demanda via parâmetro `model` na request.

**Detalhamento:**

- Default em `runner.py:_build_initial_state(model="gemini-flash")` e `Settings.DEFAULT_MODEL`
- Fallback automático para Gemini Flash quando key específica de outro provider está ausente (`runner.py:_get_llm`)
- Skills MAY override modelo (campo `model` em SkillAdmin) quando qualidade superior justifica custo (ex: análise estratégica complexa pode usar Claude)
- Reavaliar default a cada 6 meses ou quando novo modelo Gemini for lançado

#### Consequences

##### Positivas

- **Custo até 40× menor** que Claude Sonnet em prompts curtos — viabiliza alto volume
- **Latência baixa** alinhada a NFR-001 (P95 first-token < 1500ms)
- **Tier gratuito do Google AI Studio** para desenvolvimento local
- **Janela de contexto 1M tokens** — suporta context injection ampla da Biblioteca (RN-021)
- **Multimodal nativo** (texto + imagem) — útil para skills visuais futuras
- **Hosting da Google** alinha com infraestrutura GCP (Cloud Run, Cloud SQL, Secret Manager)
- **Multi-LLM preservado**: trocar default é mudar uma string

##### Negativas

- **Qualidade marginalmente inferior** a Claude Sonnet 4 em tarefas de raciocínio complexo (cadeias longas, código, planejamento estratégico) — mitigação: skills críticas podem usar `model=claude` explicitamente
- **Risco de degradação por mudanças de modelo Google** sem aviso — mitigação: pinning explícito de versão (`gemini-2.5-flash`, não `gemini-flash-latest`); MLflow tracing detecta regressões
- **Vendor concentration** com Google (já temos Cloud Run, Cloud SQL, Firebase, Gemini) — mitigação: NFR-017 garante portabilidade arquitetural

##### Neutras

- Mantém alinhamento estratégico Google Cloud já adotado pela Suno
- Time já tem familiaridade (Meridian também usa Gemini)

#### Alternatives Considered

##### Alternativa 1: Claude Sonnet 4 como default

**Descrição**: Anthropic Claude como default, Gemini/GPT como alternativos.

**Prós:**
- Qualidade percebida superior em tarefas criativas e de raciocínio
- Comportamento "constitutional" alinha com BR-010 (preservar ownership)

**Contras:**
- **Custo 30-40× maior** em volume — destrói business case (BR-013)
- Latência típica P95 first-token 1.5-3s — empata ou ultrapassa NFR-001
- Sem tier gratuito robusto para dev

**Por que não foi escolhida**: custo incompatível com BR-002/013. Manter como modelo opt-in para casos críticos.

---

##### Alternativa 2: GPT-4o como default

**Descrição**: OpenAI GPT-4o como default.

**Prós:**
- Equilibrio razoável entre qualidade e custo
- Ecosistema maduro de tools

**Contras:**
- Custo intermediário ainda 10-30× Gemini Flash
- Sem alinhamento estratégico GCP
- Histórico de outages 2024-2025 mais frequente que Gemini

**Por que não foi escolhida**: sem vantagem clara sobre Gemini Flash que justifique custo.

---

##### Alternativa 3: Llama 3 self-hosted via Vertex AI

**Descrição**: rodar Llama 3 70B em Vertex AI com endpoint dedicado.

**Prós:**
- Sem chamadas a API externa (potencial vantagem LGPD)
- Custo previsível (instance-hours, não tokens)

**Contras:**
- **Custo fixo alto** para volume baixo de Piloto (mínimo ~$2K/mês de instância)
- Operação complexa (model management, scaling, monitoring)
- Time não tem expertise

**Por que não foi escolhida**: TCO ruim no Piloto; reavaliar em MVP se volume justificar.

---

#### Rastreabilidade

| Tipo | IDs | Descrição |
|------|-----|-----------|
| BRs | BR-002, BR-013 | Aceleração + custo evitado |
| NFRs | NFR-001, NFR-017 | Latência + multi-LLM |
| Containers | CP-09 runner.py | Implementa MODEL_MAP e fallback |

| ADR | Relação |
|-----|---------|
| ADR-002 | Compatível — engine único orquestra qualquer modelo |
| ADR-005 (proposto) | LangGraph + LangChain abstraem provedor |

#### Notes

- Pricing snapshot abril 2026 (sujeito a mudanças):
  - Gemini 2.5 Flash: $0.075/M in, $0.30/M out
  - Claude Sonnet 4: $3/M in, $15/M out
  - GPT-4o: $2.5/M in, $10/M out
- Reavaliar default quando Gemini 3 Flash sair (esperado H2/2026) ou quando Claude Haiku 4 for lançado

---

### 3.3. ADR-005 — LangGraph (vs. LangChain puro / agno / CrewAI) para Orquestração

**Arquivo proposto**: `docs/adr/ADR-005-langgraph-as-orchestration-framework.md`

#### Status

**Proposed**

Data: 2026-04-28
Autor: Heitor Miranda + Claude
Revisores: pendente (José Lucas, William)

#### Context

O sunOS implementa orquestração multi-agente com routing por intenção (TopSupervisor → Orchestrator → Agent específico), ReAct loops com tools, streaming via SSE e workflow execution agendada. Essa orquestração tem ≥4 níveis de hierarquia e estado compartilhado.

O código (`api/chat/graph/`) usa **LangGraph StateGraph**: nós (`top_supervisor`, `orchestrator`, `conversation`, `respond`), edges condicionais (`route_to_intent`), state typado (`SunosChatState`), execução streaming (`graph.astream`), HITL planejado (futuro `interrupt()`).

O **mesmo engine LangGraph** é usado para chat e workflows agendados (ADR-001 é explícito sobre isso).

**Drivers identificados:**

- BR-015 (Integração com Skills existentes): orquestração precisa ser extensível
- ADR-001 / ADR-002: já decidiram engine único e LangGraph como motor de workflows
- NFR-017 (Multi-LLM): framework precisa abstrair provedor
- NFR-005/006 (Disponibilidade + tolerância a falhas): primitives de retry/fallback úteis
- NFR-026 (Tracing): integração com observabilidade
- Restrição: time de 4 devs — preferir framework com docs maduros e comunidade

**Contexto técnico:**

- LangGraph 0.4.1 já em uso (`api/pyproject.toml`)
- Topologia: graph com 4 nós + 1 START + 1 END, edges condicionais
- Estado compartilhado via `TypedDict` (`SunosChatState`)
- Streaming nativo: `graph.astream` produz chunks SSE-friendly
- Checkpointing planejado para workflows pausáveis

#### Decision

**Decidimos que** o sunOS usará **LangGraph como framework de orquestração de agentes e workflows**, mantendo LangChain core para abstrações LLM/tools/messages.

**Detalhamento:**

- StateGraph para chat (`chat/graph/builder.py`)
- StateGraph compilado runtime para workflows (`workflows/compiler.py`, ADR-001)
- LangChain core (`langchain-core>=0.3.40`) para `BaseMessage`, `AIMessage`, `HumanMessage`, `SystemMessage`, `ToolMessage`
- Provedores LLM via LangChain integrations (`langchain-google-genai`, `langchain-openai`, `langchain-anthropic`)
- `BaseAgent` ABC interna usa LangGraph state e LangChain tool binding (`run_react`)
- Reavaliar quando LangGraph 1.0 estabilizar API ou quando custo de manter compatibilidade com LangChain crescer

#### Consequences

##### Positivas

- **Streaming nativo** alinhado com SSE do FastAPI (NFR-001/002)
- **State graph compilado** dá performance previsível e debug simples (graph.draw_png() para visualização)
- **Multi-provider abstration** via LangChain (`bind_tools`, `ainvoke`) — NFR-017
- **HITL e checkpointing built-in** — críticos para workflows pausáveis (ADR-001)
- **Comunidade ativa**: LangGraph é o framework de orquestração mais adotado da Anthropic + LangChain ecosystem em 2026
- **Reuso entre chat e workflows** — minimiza código duplicado (ADR-001)
- **Tracing com MLflow + LangSmith** integrado (NFR-026)
- **Padrão Koro com Meridian** — time já dominou os patterns

##### Negativas

- **Volatilidade de API** entre versões LangGraph 0.x — mitigação: pinning estrito + suite de testes (DT-05)
- **Acoplamento a abstrações LangChain** — mitigação: `BaseAgent` ABC interno isola consumidores; trocar de framework é trabalhoso mas factível
- **Curva de aprendizado** para devs novos — mitigação: docs internas em `api/CLAUDE.md`; Meridian compartilha patterns
- **Overhead para casos simples** (uma chamada LLM direta) — mitigação: endpoints batch (`generate-text`, `enhance-prompt`) chamam tools direto sem graph

##### Neutras

- Lock-in moderado em LangChain ecosystem — aceito porque é o ecossistema mais maduro
- Streaming SSE é trivial via `graph.astream` + dataclass `SSEEvent`

#### Alternatives Considered

##### Alternativa 1: LangChain puro (sem LangGraph)

**Descrição**: usar `AgentExecutor` clássico, `RunnableSequence`, `LCEL` para orquestração.

**Prós:**
- Menos uma dependência
- API estável (LangChain 0.3+)

**Contras:**
- **Sem state graph nativo** — orquestração condicional (intent routing) vira código imperativo verboso
- **Streaming menos limpo** — eventos vêm misturados em `astream_events` v2
- **Sem HITL/checkpointing** built-in (precisa custom)
- **Sem reuso para workflows** (ADR-001 ficaria mais trabalhoso)

**Por que não foi escolhida**: perde os pilares que justificam a escolha (state, streaming, HITL, reuso).

---

##### Alternativa 2: agno (ex-Phidata)

**Descrição**: framework Python para agents simples e multi-modal.

**Prós:**
- API mais simples para casos básicos
- Boa integração com vector stores

**Contras:**
- Comunidade menor que LangGraph
- Sem state graph maduro
- Padrões diferentes do Meridian (perde sinergia interna Suno)

**Por que não foi escolhida**: vantagens insuficientes para justificar quebrar padrão Koro.

---

##### Alternativa 3: CrewAI

**Descrição**: orquestração baseada em "crews" de agentes com papéis definidos.

**Prós:**
- Modelo mental claro (Manager → Workers)
- Boa para casos onde múltiplos agents colaboram

**Contras:**
- Modelo "crew" não casa com nosso caso (1 agent ativo por turn, com tools, não múltiplos agents conversando entre si)
- HITL menos maduro que LangGraph
- Dependência adicional sem benefício claro

**Por que não foi escolhida**: design mismatch com nossa arquitetura (single-agent-per-turn).

---

##### Alternativa 4: Implementação custom (sem framework)

**Descrição**: escrever orquestração from scratch.

**Prós:**
- Zero overhead de framework
- Controle total

**Contras:**
- Reinventa state graph, streaming, HITL, retries
- Time de 4 devs não tem capacity
- Quebra padrão Koro com Meridian
- Sem ecosystem de tools prontos

**Por que não foi escolhida**: fora de escopo razoável.

---

#### Rastreabilidade

| Tipo | IDs | Descrição |
|------|-----|-----------|
| BRs | BR-002, BR-015 | Aceleração + integração Skills |
| NFRs | NFR-001, NFR-002, NFR-005, NFR-006, NFR-017, NFR-026 | Latência, disponibilidade, multi-LLM, tracing |
| Containers | CP-06 a CP-15, CP-36 a CP-38 | Todo o módulo `chat/graph/` e `workflows/` |

| ADR | Relação |
|-----|---------|
| ADR-001 | Depende — workflows usam o mesmo engine |
| ADR-002 | Depende — engine único é viabilizado por LangGraph state |
| ADR-004 | Compatível — LangChain abstrai provedor LLM |

#### Notes

- LangGraph docs: https://langchain-ai.github.io/langgraph/
- Reavaliar em 2027 quando LangGraph 1.0 GA estabilizar contratos
- Padrão "Koro" referenciado em `api/CLAUDE.md` (mesma stack/patterns do Meridian)

---

### 3.4. ADR-006 — Firebase Authentication como Provedor de Identidade Único

**Arquivo proposto**: `docs/adr/ADR-006-firebase-auth-as-identity-provider.md`

#### Status

**Proposed**

Data: 2026-04-28
Autor: Heitor Miranda + Claude
Revisores: pendente (José Lucas, William)

#### Context

O sunOS é uma plataforma 100% interna da Suno United Creators e precisa autenticar usuários (creators, líderes, admins) para enforçar RBAC (RN-009) e isolamento de contexto cross-client (RN-010). A escolha técnica observada é **Firebase Authentication** (`projeto toolbox-67a0e`) — frontend usa Firebase JS SDK (`getIdToken()`), backend usa Firebase Admin SDK (`firebase-admin>=6.2.0`).

A tabela `Conversation` em `api/models/conversation.py` referencia `user_id: String, nullable=False` — claim do JWT. Não há tabela `users` própria do sunOS — a identidade é totalmente delegada ao Firebase.

**Drivers identificados:**

- BR-007 (Proteção de IP — Caixa-preta): autenticação obrigatória
- BR-008 (Privacidade): isolamento por usuário
- RN-009 (RBAC): perfis Admin/Líder/Operacional
- NFR-008 (JWT em 100% endpoints)
- Restrição: time de 4 devs — preferir provedor managed
- **Padrão Toolbox**: ecossistema interno Suno usa Firebase Auth

**Contexto técnico:**

- Frontend `lib/api.ts:getAuthToken()` chama `auth.currentUser.getIdToken()`
- Backend `core/firebase.py:get_firebase_app()` inicializa Admin SDK com `FIREBASE_USE_ADC=True` (Application Default Credentials em produção)
- Project ID: `toolbox-67a0e` (compartilhado com Toolbox?)

#### Decision

**Decidimos que** o sunOS usa **Firebase Authentication como único provedor de identidade**, com Firebase JWT validado em todas as rotas protegidas via dependency FastAPI.

**Detalhamento:**

- Login (UI) via Firebase JS SDK — Email/Password no MVP; SSO Google/Microsoft em fase futura
- Token enviado em header `Authorization: Bearer <JWT>` para `/api/*`
- Backend valida JWT via `firebase-admin` em dependency `get_current_user`
- Claims usados: `uid`, `email`, `email_verified`, custom claims `role` (a definir) para RBAC
- RBAC usa custom claims do Firebase + tabela própria `users`/`roles` para granularidade adicional (nome, área, cliente_default)
- Reavaliar se: (a) projeto `toolbox-67a0e` virar gargalo de cota; (b) requisito de SSO corporativo (SAML/OIDC) emergir

#### Consequences

##### Positivas

- **Managed identity** — sem operar IdP próprio (zero servers para Authn)
- **Tokens JWT padronizados** com chaves rotacionadas pelo Google
- **Custom claims** para RBAC simplificam server-side enforcement
- **SDKs maduros** para frontend (JS) e backend (Python `firebase-admin`)
- **Padrão Toolbox** — sinergia operacional com outras ferramentas internas
- **Custo zero** para volume Suno (Firebase Auth é gratuito até dezenas de milhares de MAU)
- **MFA disponível** quando necessário (BR-007)

##### Negativas

- **Vendor lock-in com Google** — mitigação: lock-in já existe (Cloud Run, Cloud SQL, Gemini); se Suno migrar de GCP, IdP é trocável
- **SSO corporativo (Google Workspace existente)** requer configuração — geralmente trivial, mas não testado
- **Cotas do Firebase Spark/Blaze plan** — monitorar mensalmente
- **Compartilhamento do project `toolbox-67a0e` com Toolbox** — risco de impacto cruzado se Toolbox tiver incidente; mitigação: avaliar separação de projects no MVP

##### Neutras

- Identidade delegada ao Google — alinhamento com Workspace da Suno
- Não bloqueia implementar tabela `users` interna para metadados próprios (área, cargo, role)

#### Alternatives Considered

##### Alternativa 1: Auth0

**Descrição**: SaaS de identity gerenciado.

**Prós:**
- IdP enterprise completo (SAML, OIDC, social, MFA, custom flows)
- Dashboard sólido

**Contras:**
- Custo mensal real (Free tier limitado; produção ≥$240/mês)
- Mais um vendor para gerenciar
- Sem alinhamento com ecossistema GCP/Suno

**Por que não foi escolhida**: custo + complexidade incompatível com escala atual. Reavaliar se SSO SAML virar requisito firme.

---

##### Alternativa 2: Keycloak self-hosted

**Descrição**: IdP open source rodando em Cloud Run/GKE.

**Prós:**
- Zero vendor lock-in
- Funcionalidades enterprise

**Contras:**
- Operação significativa (DB próprio, backups, upgrades, monitoring)
- Time não tem expertise
- TCO maior que Firebase em escala atual

**Por que não foi escolhida**: TCO ruim para time de 4 devs.

---

##### Alternativa 3: Google Cloud Identity Platform

**Descrição**: equivalente "enterprise" do Firebase Auth com mais features.

**Prós:**
- Mesma SDK que Firebase Auth (migração trivial)
- Multi-tenant nativo
- SAML/OIDC enterprise

**Contras:**
- Custo por MAU
- Funcionalidades avançadas não são necessárias hoje

**Por que não foi escolhida**: overkill no Piloto. Migração no MVP é trivial se necessário.

---

#### Rastreabilidade

| Tipo | IDs | Descrição |
|------|-----|-----------|
| BRs | BR-007, BR-008 | Proteção IP + privacidade |
| RNs | RN-009, RN-012 | RBAC + auditoria |
| NFRs | NFR-008, NFR-009 | Auth + RBAC |
| Containers | CT-02 (Backend), CP-35 (firebase.py), FE-04 (Login), FE-10 (api.ts), FE-11 (firebase.ts) | — |

| ADR | Relação |
|-----|---------|
| ADR-001 | Compatível — Firebase JWT funciona com Cloud Run/Load Balancer |
| ADR-002 | Compatível — `user_id` do Firebase é dimensão de personalização (engine único) |

#### Notes

- Firebase Auth docs: https://firebase.google.com/docs/auth
- Validar no MVP se `toolbox-67a0e` deve virar project dedicado `sunos-prod`
- LIM-01 / DT-01 (Parte 5): aplicar `Depends(get_current_user)` em todos os routers ANTES do Piloto

---

### 3.5. ADR-007 — Skills como Diretórios `SKILL.md` + `references/` (Progressive Disclosure)

**Arquivo proposto**: `docs/adr/ADR-007-skills-as-progressive-disclosure-directories.md`

#### Status

**Proposed**

Data: 2026-04-28
Autor: Heitor Miranda + Claude
Revisores: pendente (Bruno Prosperi, José Lucas)

#### Context

O sunOS oferece 8 skills processuais (Copy Social, Roteiro de Vídeo, Texto de Rádio, Plano de Mídia, Report Performance, Persona Sintética, Brief Builder, Análise de Mercado) e prevê crescimento contínuo dirigido por liderança de área. Cada skill tem (a) system prompt específico, (b) ferramentas (tools) disponíveis, (c) domain knowledge de referência, (d) eventualmente vocabulário e tom de voz.

O código (`api/chat/skills/`) implementa cada skill como **um diretório**:

```
chat/skills/<slug>/
  SKILL.md           # Overview, quando usar, tools
  references/*.md    # Domain knowledge (progressive disclosure)
```

O componente `SkillLoader` (`api/chat/skills/__init__.py`) lê esses arquivos e injeta no system prompt do agente via `BaseAgent._build_system_prompt_with_skills`.

**Drivers identificados:**

- BR-004 (Biblioteca / repositório institucional unificado)
- BR-015 (Integração com Skills existentes)
- BR-007 (Caixa-preta — skills, system prompts e referências são IP proprietário)
- NFR-016 (100% das skills documentadas)
- Restrição: liderança de área cura skills, mas não escreve código — ferramenta tem que ser editável sem deploy

**Contexto técnico:**

- 8 skills hoje, ≥20 previstas para Piloto
- Cada skill pode ter 1-N references
- Skills são versionadas via git (revisão por PR)
- Em paralelo existe SkillAdmin (UI para CRUD de metadados de skill no banco — `components/admin/SkillEditor*.tsx`)

#### Decision

**Decidimos que** skills do sunOS serão **diretórios em `api/chat/skills/<slug>/`** contendo:

- `SKILL.md` (obrigatório): overview, quando usar, ferramentas disponíveis, restrições
- `references/*.md` (≥1 obrigatório): domain knowledge consumido sob demanda (progressive disclosure)

**Detalhamento:**

- Slug do diretório = identificador único da skill (ex: `copy-social`)
- `SkillLoader` lê SKILL.md + references e retorna `SkillContent(overview, references[])`
- `BaseAgent._build_system_prompt_with_skills` injeta no system prompt em ordem: agent system prompt → skill overview → references concatenadas com separador `---`
- `SkillAdmin` (frontend) edita metadados (nome, descrição, system_prompt override, model, scope de clientes) que ficam no PostgreSQL — separados dos arquivos `SKILL.md`
- Versionamento de SKILL.md/references via git (review obrigatório por PR)
- Reavaliar quando: (a) líderes de área pedirem editor visual sem PR; (b) volume de skills > 100

#### Consequences

##### Positivas

- **Progressive disclosure preservado**: agent só carrega knowledge da skill ativa, não de todas — economia de contexto LLM
- **Versionamento via git** — auditoria automática (BR-009), rollback fácil, code review obrigatório (caixa-preta — RN-009/011)
- **Padrão Anthropic Skills** — alinha com práticas externas e Claude Code (referências internas)
- **Edição em qualquer IDE** — markdown puro
- **Separação de concerns**: o que muda raramente (lógica/prompt) fica em git; o que muda frequentemente (metadados, scope) fica em DB editável via UI
- **Caixa-preta**: arquivos `SKILL.md` ficam em repo privado — Operacionais não os veem (RN-011)
- **Composição com Biblioteca**: skill references são IP, Biblioteca é knowledge — funções complementares

##### Negativas

- **Edição requer PR** — líderes de área precisam de assistência de eng (mitigação aceita: liderança define conteúdo, eng cria PR; futuramente avaliar editor in-app com aprovação)
- **Sincronização SKILL.md ↔ SkillAdmin (banco)**: dois lugares de verdade — mitigação: SkillAdmin edita só metadados, nunca prompt/references; documentação clara
- **Sem hot-reload em produção** — mudança em SKILL.md exige redeploy do backend; mitigação: cache invalidation por TTL ou endpoint admin de reload

##### Neutras

- Markdown como formato é universal e versionável
- Padrão alinhado com Anthropic Skills — facilita onboarding de devs novos

#### Alternatives Considered

##### Alternativa 1: Registry centralizado em PostgreSQL (skills 100% no banco)

**Descrição**: skill prompts e references ficam em tabelas; SkillAdmin permite edição plena.

**Prós:**
- Líderes editam sem PR
- Hot-reload trivial (next request recarrega)

**Contras:**
- **Perda de versionamento git** (auditoria, code review, rollback piores)
- Risco de skill quebrada em produção sem revisão
- SQL queries complexas para versionamento de prompts
- Conflita com BR-007 (Caixa-preta via repo privado)

**Por que não foi escolhida**: governança e auditabilidade pioram significativamente.

---

##### Alternativa 2: YAML único por skill (ao invés de diretório)

**Descrição**: cada skill é um arquivo `<slug>.yaml` com prompt + references inline.

**Prós:**
- Um arquivo por skill (mais simples)
- Deploy trivial

**Contras:**
- References longas (cases, brand books) ficam ilegíveis em YAML
- Sem progressive disclosure real (tudo carrega de uma vez)
- Menos modular para reuso de references entre skills

**Por que não foi escolhida**: progressive disclosure é princípio chave.

---

##### Alternativa 3: Skills como pacotes Python plugáveis

**Descrição**: cada skill é um módulo Python com classe `Skill(BaseSkill)` e overrides programáticos.

**Prós:**
- Lógica programática avançada (ex: skill que pré-processa input customizado)
- Testabilidade unit

**Contras:**
- Liderança de área não escreve Python
- Mudança de prompt requer deploy (pior que Alternativa 1)
- Overkill para 95% dos casos (skills são prompt + tools + references — não precisam de código)

**Por que não foi escolhida**: barreira de entrada incompatível com curadoria por liderança.

---

#### Rastreabilidade

| Tipo | IDs | Descrição |
|------|-----|-----------|
| BRs | BR-004, BR-007, BR-015 | Biblioteca, Caixa-preta, Integração Skills |
| RNs | RN-009, RN-011 | RBAC + ocultação de Biblioteca |
| NFRs | NFR-016 | Documentação de skills |
| Containers | CP-15 SkillLoader, CP-11 BaseAgent, FE-15 Admin (Skills) | — |

| ADR | Relação |
|-----|---------|
| ADR-002 | Compatível — engine único carrega skill diferente conforme slug |
| ADR-005 | Compatível — LangGraph não toca em skills (só BaseAgent consome) |

#### Notes

- 8 skills atuais: copy-social, roteiro-de-video, texto-de-radio, plano-de-midia, report-performance, persona-sintetica, brief-builder, analise-de-mercado
- Estrutura inspirada em Anthropic Skills + Claude Code (CLAUDE.md como system prompt)
- Reavaliar em 2027 conforme volume de skills e demanda de auto-edição por liderança

---

### 3.6. ADR-008 — Pré-validação como agentes especializados em paralelo (NOVA — pedido Guga + Bruno Prosperi)

**Status**: Proposto

**Contexto**: BR-017 (Aprovação Hierárquica) requer pré-validação de assets antes do aprovador humano. Possíveis abordagens: (a) um único LLM genérico que avalia tudo, (b) agentes especializados em paralelo (BrandValidator, PortuguêsValidator, etc.), (c) regras determinísticas (linters tradicionais).

**Decisão**: Adotar **agentes especializados em paralelo** orquestrados via LangGraph sub-graph dedicado. Cada validator é um agente próprio com prompt, tools e context-window próprios, executados em paralelo. Output consolidado em Validation Report estruturado.

**Implementação de referência**: ver **ADR-011** — `deepagents` é o harness recomendado para materializar este sub-graph (sub-agents isolados + planning + estado paralelo prontos), com fallback para LangGraph nativo caso ADR-011 não seja aceito ou apresente bloqueador em prova de conceito.

**Alternativas consideradas**:
- **LLM genérico único** — rejeitado: dilui responsabilidade de cada dimensão; difícil debugar ou calibrar individualmente; performance pior (1 prompt enorme vs. N prompts menores em paralelo)
- **Linters determinísticos puros** (LanguageTool, brand-rule-engine) — rejeitado para Brand (regras impossíveis de codificar exaustivamente); aceito como complemento para Português (LanguageTool acelera detecção comum)
- **Pipeline sequencial** (validator A → B → C) — rejeitado: latência total = soma; paralelo permite latência total ≈ max(individuals)

**Consequências**:
- ✅ Cada validator é evoluível independentemente (A/B test, troca de modelo)
- ✅ Latência paralela: P95 ≈ 60s (vs. ≥3min sequencial)
- ✅ Validation Report estruturado por dimensão facilita UX da Approval Inbox
- ⚠️ Custo de LLM por submissão = N validators (mitigação: cache de Brand Guidelines + prompt caching; uso de Gemini Flash para validators rotineiros)
- ⚠️ Novo validator = novo agente (não plugin); requer engenharia (mitigação: BaseValidator ABC reutilizável)

**Rastreabilidade**: BR-017 · RN-023 · NFR-001 (latência) · NFR-024 (validação) · CTM-08 Approval Engine (Parte 6)

**Arquivo proposto**: `docs/adr/ADR-008-validators-paralelos-langgraph.md`

---

### 3.7. ADR-009 — Google Drive integration read-only (escopo OAuth restrito) (NOVA — pedido Guga, ajuste vs. literal)

**Status**: Proposto

**Contexto**: BR-018 pede integração Drive↔sunOS. Pedido literal do Guga: "espelho bidirecional, agentes organizam Drive". Análise de risco identificou: LGPD (dados pessoais cliente), conflito ACL Drive vs. RBAC sunOS, risco de write/delete acidental, violação RN-011 (caixa-preta).

**Decisão**: Adotar **integração read-only com escopo OAuth restrito** (`drive.readonly` + `drive.metadata.readonly`). Sync **unidirecional Drive→sunOS**. Agentes geram sugestões de organização (Drive Cleanup Report); humano (líder) executa qualquer ação no Drive. Cliente individual pode ser excluído via opt-out admin.

**Alternativas consideradas**:
- **Sync bidirecional + agentes com write** (pedido literal) — rejeitado: 4 riscos críticos (LGPD, ACL, write acidental, caixa-preta) sem mitigação proporcional ao valor
- **Drive como API caller-only sem cache local** (sem espelho de metadados) — rejeitado: latência alta para retrieval, custo alto de chamadas
- **Outra fonte canônica** (SharePoint, Notion) — rejeitado: Suno usa Drive como repositório de fato; mudar fonte = perder adoção
- **Read-only sem cleanup report** — rejeitado: perde grande parte do valor (organização crítica)

**Consequências**:
- ✅ **Garantia técnica** de zero write (escopo OAuth não permite — defense-in-depth)
- ✅ Risco LGPD reduzido a opt-in por cliente
- ✅ Curadoria humana mantida (RN-029) preserva ownership
- ⚠️ Não atende ao pedido literal do Guga — requer alinhamento explícito com sponsor
- ⚠️ Lag de sync ≤ 24h (≤ 5min para conteúdo crítico via webhook) — documentar como SLA aceito

**Rastreabilidade**: BR-018 · RN-027, RN-028, RN-029, RN-030 · NFR-008 (Security) · NFR-005 (Reliability) · CTM-09 Drive Connector (Parte 6)

**Arquivo proposto**: `docs/adr/ADR-009-drive-readonly-com-curadoria-sugestiva.md`

---

### 3.8. ADR-010 — Hierarquia de aprovação configurável por área (NOVA — pedido Guga + Bruno Prosperi)

**Status**: Proposto

**Contexto**: BR-017 requer encaminhamento de submissões ao aprovador correto. Hierarquia da Suno é dinâmica (sócios mudam responsabilidades, pessoas se movem entre áreas). Possíveis abordagens: (a) hierarquia hardcoded, (b) configuração admin manual, (c) sync com sistema de RH externo.

**Decisão**: Adotar **configuração admin manual** no MVP (mapa `{área, cliente} → aprovador` mantido em tabela `approval_chain`). Suporta fallback (líder da área se aprovador inativo). **Futuro (post-MVP)**: avaliar sync com sistema de RH se mantida fricção.

**Alternativas consideradas**:
- **Hardcoded em código** — rejeitado: muda toda semana; deploy desnecessário
- **Sync com RH** — postergado: sistema atual de RH não tem API estável; risco de bloqueio externo; valor incremental marginal no MVP
- **Aprovação multi-nível** (sócio → diretor → CEO) — postergado: MVP usa 1 nível (creator → aprovador direto); se necessário, adicionar pós-Piloto

**Consequências**:
- ✅ Time mantém controle total sobre hierarquia
- ✅ Mudanças refletem em < 5min (sem deploy)
- ⚠️ Dependência de processo admin estar mantido (mitigação: alerta automático se aprovador inativo > 30 dias)
- ⚠️ Auditoria de mudanças na hierarquia obrigatória (RN-026 + RN-012)

**Rastreabilidade**: BR-017 · RN-026 · CTM-08 Approval Engine

**Arquivo proposto**: `docs/adr/ADR-010-hierarquia-aprovacao-configuravel.md`

---

### 3.9. ADR-011 — Adoção de `deepagents` como harness para BC-04 e BC-07 (não para BC-03 nem CTM-02)

**Status**: Proposto (rascunho — aguarda PoC + alinhamento Heitor + Eng)

**Decisores propostos**: Heitor Miranda + Eng (TBD)

**Contexto**

A versão atual da arquitetura (Parte 6) implementa multi-agente "na unha" sobre LangGraph nativo: Provocation Engine (CTM-04) com pipeline Explorer↔Crítico, Approval Engine (CTM-08) com Brand + Português Validators paralelos, Drive Connector (CTM-09) com CurationAgent. Cada um destes BCs precisa de capacidades recorrentes que ainda não temos formalizadas:

- **planning explícito** (decompor problema → tarefas → executar)
- **sub-agents com contexto isolado** (cada validator com seu próprio histórico + tools)
- **virtual filesystem** (escrever/ler artefatos intermediários — útil para CurationAgent inspecionando estrutura de pastas do Drive)
- **interrupts/HITL nativos** (pausar para aprovação humana — ADR-008/010)

A biblioteca [`deepagents`](https://github.com/langchain-ai/deepagents) (LangChain Inc., Python + JS) já entrega esse harness sobre LangGraph: `create_deep_agent(tools, instructions, subagents=[...])` retorna um StateGraph compilado com planning tool, virtual FS, sub-agent spawning e isolamento de contexto prontos. Adoção evita reescrever ~30-40% do que está em CTM-04/CTM-08/CTM-09 da Parte 6.

A pergunta não é "deepagents OU LangGraph" (ela é construída SOBRE LangGraph), mas sim **onde** fazer sentido adotar o harness e onde manter LangGraph cru.

**Decisão**

Adotar `deepagents` como harness oficial para **três Bounded Contexts**, mantendo LangGraph nativo nos demais:

| Bounded Context / Container | Harness | Justificativa |
|------|---------|---------------|
| **BC-04 Provocation Engine (CTM-04)** | `deepagents` | Pipeline Explorer ↔ Crítico ↔ BisociationFilter é literalmente "main agent + sub-agents com contextos isolados". Casa com a primitiva nativa do harness. |
| **BC-07 Approval — Validators (CTM-08)** | `deepagents` | Brand + Português Validators são sub-agents independentes paralelos com retrieval especializado (ADR-008). |
| **BC-07 Drive — CurationAgent (CTM-09)** | `deepagents` | Agente que navega metadata + sugere organização é o use-case canônico de "deep research/agent" (planning + tools + isolamento). Virtual FS ajuda a inspecionar árvore Drive sem poluir contexto principal. |
| **BC-03 Conversation Service (CTM-03)** | LangGraph nativo (mantém) | Chat com streaming SSE de baixa latência (NFR-001 first-token < 1.5s) + Skill processual single-shot. Planning loop adicionaria overhead sem ganho. |
| **CTM-02 Workflows (declarativos)** | LangGraph nativo (mantém) | ADR-001 define workflow como `StateGraph` compilado a partir de definição YAML/JSON. Previsibilidade (cron, replay, idempotência) conflita com plan dinâmico. |

**Alternativas consideradas**

- **(a) Adotar `deepagents` em todos os BCs (incluindo CTM-03 e CTM-02)** — Rejeitado: planning loop em chat single-shot piora latência first-token; workflows precisam ser determinísticos.
- **(b) Manter LangGraph nativo em todos os lugares (status quo)** — Rejeitado: replicamos manualmente sub-agent spawning + isolamento + planning em 3 BCs distintos. Custo de manutenção alto e padronização inconsistente.
- **(c) Adotar outro harness** (CrewAI, AutoGen, agno) — Rejeitado: já temos investimento em LangGraph (ADR-005); CrewAI tem padrão de "crew" que conflita com nossa modelagem em BCs; AutoGen é mais voltado a chat multi-agent humano-em-loop genérico.
- **(d) Wrapper interno próprio sobre LangGraph** — Rejeitado: NIH; gastamos sprints reescrevendo o que `deepagents` já entrega.

**Consequências**

✅ **Positivas**:
- Reduz código manual em CTM-04/08/09 — sub-agent spawning, planning, virtual FS prontos
- Padronização entre os 3 BCs multi-agente — mesma topologia mental para devs
- ADR-008 (validators paralelos) implementação fica trivial — `subagents=[brand, portugues]`
- Isolamento de contexto entre sub-agents reduz risco de cross-contamination semântica (Brand não vê histórico do Português, e vice-versa)
- Continua dentro do ecossistema LangChain/LangGraph (não cria ponto de fricção com ADR-005)
- Compatível com tracing MLflow via callbacks LangChain (NFR-026 mantido)

⚠️ **Negativas / Mitigações**:
- **Caixa-preta (RN-009/011)** — virtual FS de `deepagents` pode expor `system_prompts` ou `references/*.md` se `read_file` for chamado por agente sem RBAC.
  - *Mitigação*: wrapper de FS com `principal` injetado; whitelist de paths permitidos por role. Implementação documentada em CTM-08 §componente AccessGuard (Parte 6).
- **Cross-client guard (RN-010)** — sub-agents herdam state mas precisam ter `client_id` injetado em cada tool call.
  - *Mitigação*: BaseTool helper que valida `client_id` na assinatura do tool antes de qualquer query/retrieval; testes de regressão obrigatórios para cada sub-agent novo.
- **Modelo orquestrador** — `deepagents` foi projetado pensando em Sonnet/Opus como orquestrador. Com Gemini Flash default (ADR-004), planning pode degradar (loop infinito, decisões fracas).
  - *Mitigação*: setup híbrido — orquestrador `claude-sonnet-4-6`, sub-agents `gemini-2.5-flash` (custo controlado). PoC tem que medir qualidade do plan com Flash puro antes de fixar.
- **Custo** — orquestrador Sonnet aumenta custo por brief/submissão.
  - *Mitigação*: cap de tokens no plan (max 2k); cache de planos similares; medição via NFR-028 (custo evitado vs. custo real).
- **Maturidade da lib** — `deepagents` tem ~6 meses (LangChain Inc.); API ainda mexendo.
  - *Mitigação*: pinar versão exata em `pyproject.toml`; isolar uso em adapter (`api/chat/harness/deepagents_adapter.py`) que esconde detalhes; trocar harness se descontinuar é um refactor isolado, não cross-cutting.
- **Tracing** — spans aninhados de sub-agents precisam aparecer corretamente no MLflow.
  - *Mitigação*: PoC inclui validação explícita de tracing em runs com 2-3 sub-agents.

🟦 **Neutras**:
- Skills como `SKILL.md + references/*.md` (ADR-007) já são progressive disclosure e casam naturalmente com virtual FS de `deepagents` — não muda o padrão, dá uma camada de execução.
- ADR-002 (engine único) **não conflita** — `deepagents` interno a um BC ≠ deep agent por tenant. Ver nota revisional em ADR-002.

**Pré-requisitos para passar de Proposto para Aceito**

1. **PoC de 1 sprint** em CTM-04 (Shoot for the Moon) implementando Explorer↔Crítico via `create_deep_agent` com 2 sub-agents
2. Validação de tracing MLflow nesse PoC (spans aninhados visíveis, latência por sub-agent)
3. Validação de qualidade do plan com Gemini Flash puro vs. Claude Sonnet híbrido (TODO-DM-08 já mede latência; estender para qualidade)
4. Confirmação de que wrapper FS resolve Caixa-preta sem performance penalty significativa
5. Alinhamento Heitor + Eng sobre custo do híbrido Sonnet/Flash

**Critérios para revisitar**

- `deepagents` ser descontinuado pela LangChain Inc. (improvável em < 12m mas possível)
- Latência first-token de Provocation Engine ultrapassar NFR aceitável (TODO-DM-08)
- Custo do orquestrador Sonnet inviabilizar volume real de submissões
- Surgimento de harness substancialmente melhor (improvável; mercado convergindo)

**Impacto na Arch To-Be (Parte 6)**

- CTM-04, CTM-08, CTM-09 ganham seção "Harness: deepagents" na especificação
- Novo módulo `api/chat/harness/deepagents_adapter.py` (adapter compartilhado)
- Wrapper RBAC-aware para virtual FS em `api/chat/harness/safe_filesystem.py`
- Atualização de `pyproject.toml` para incluir `deepagents` pinado

**Rastreabilidade**: BR-001 (Provocation), BR-017 (Aprovação), BR-018 (Drive), RN-009, RN-010, RN-011, RN-023; NFR-001, NFR-026; relacionado a **ADR-002** (escopo clarificado), **ADR-005** (continua), **ADR-008** (implementação de referência).

**Arquivo proposto**: `docs/adr/ADR-011-deepagents-harness-bc04-bc07.md`

---

## 4. Histórico de Versões

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | 2026-04-28 | Heitor Miranda + Claude | Versão inicial. Catalogados 2 ADRs já aceitos (ADR-001 Workflow Builder com LangGraph, ADR-002 Engine único). Propostos 5 novos ADRs com Status="Proposed": ADR-003 (pgvector), ADR-004 (Gemini Flash default), ADR-005 (LangGraph framework), ADR-006 (Firebase Auth), ADR-007 (Skills como diretórios SKILL.md + references). Cada ADR novo segue Michael Nygard com Context, Decision, Consequences (positivas/negativas/neutras), Alternatives Considered (3-4 cada) e Rastreabilidade a BRs/NFRs/containers. Status: Rascunho aguardando revisão dos decisores. |
| 1.1 | 2026-04-28 | Heitor + Claude | **+3 ADRs propostos**: ADR-008 (validators paralelos LangGraph para FA-13), ADR-009 (Drive read-only com curadoria sugestiva — ajuste vs. pedido literal de espelho bidirecional), ADR-010 (hierarquia de aprovação configurável manual no MVP). Pedido Guga + Bruno Prosperi. ADR-009 requer alinhamento explícito com sponsor antes de Status="Aceito" |
| 1.2 | 2026-04-28 | Heitor + Claude | **Revisão ADR-002** com nota clarificadora: o ADR rejeita "1 agente isolado por tenant", NÃO a biblioteca `deepagents` enquanto harness multi-agente. Adicionadas seções "O que NÃO impede" / "O que impede" para remover ambiguidade. **+1 ADR proposto: ADR-011** — adoção de `deepagents` como harness para BC-04 (Provocation Engine), BC-07 (Approval Validators e Drive CurationAgent); CTM-03 (chat) e CTM-02 (workflows) mantêm LangGraph nativo. Pré-requisitos: PoC em CTM-04 + validação de tracing MLflow + medição de qualidade Gemini Flash vs. Sonnet híbrido + wrapper RBAC para virtual FS (Caixa-preta RN-011). **ADR-008** atualizado com referência a ADR-011 como implementação de referência (com fallback para LangGraph nativo). |
