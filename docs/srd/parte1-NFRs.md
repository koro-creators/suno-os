---
documento: SRD Parte 1 - Requisitos Não Funcionais
projeto: sunOS
cliente: Suno United Creators (uso 100% interno)
versao: 1.0
data_criacao: 2026-04-28
ultima_atualizacao: 2026-04-28
autor: Heitor Miranda + Claude (Koro Docs Pipeline)
status: Rascunho
fonte_brd: docs/brd/parte3-requisitos.md, docs/brd/parte4-regras.md
total_nfrs: 28
---

# SRD Parte 1 — Requisitos Não Funcionais (NFRs)

## 1. Introdução

### 1.1. Objetivo

Este documento especifica os **Requisitos Não Funcionais (NFRs)** do sunOS — sistema operacional de IA da Suno United Creators —, definindo atributos de qualidade mensuráveis derivados dos Requisitos de Negócio (BR-XXX) e Regras de Negócio (RN-XXX) do BRD. NFRs complementam os Requisitos Funcionais (FRs) do PRD e guiam decisões arquiteturais, capacidade operacional e governança.

### 1.2. Escopo

NFRs cobrem os 8 atributos de qualidade da **ISO 25010**:

- Performance Efficiency
- Reliability
- Security
- Maintainability
- Compatibility
- Usability
- Portability
- Functional Suitability

Inclui também NFRs de **MLOps/Governança de IA** (Observabilidade, Trace, Eval) por serem dimensões críticas da plataforma — formalmente derivadas de BR-009 (Auditabilidade) e BR-013/014 (Mensuração).

### 1.3. Relação com Outros Artefatos

| Artefato | Relação |
|----------|---------|
| BRD Parte 3 (BR-XXX) | NFRs derivam dos requisitos de negócio (especialmente BR-007/008/009) |
| BRD Parte 4 (RN-XXX) | NFRs operacionalizam regras de governança (RN-009 a RN-013) |
| PRD (FRs)            | NFRs restringem e qualificam Requisitos Funcionais |
| SRD Parte 5 (Arch As-Is) | NFRs são contrastados com capacidade atual (gaps) |
| SRD Parte 6 (Arch To-Be) | NFRs guiam decisões da arquitetura-alvo |
| SRD Parte 7 (ADRs)   | Decisões arquiteturais respondem a tensões entre NFRs |
| SLOs/SLIs            | NFRs são base contratual para métricas operacionais |

### 1.4. Convenções

Termos RFC 2119:

| Termo | Significado |
|-------|-------------|
| **MUST** | Obrigatório para a fase indicada |
| **SHOULD** | Altamente recomendado, evolução prevista |
| **MAY** | Opcional/desejável |

Fases (sincronizadas com PRD/Roadmap):

| Fase | Definição |
|------|-----------|
| **POC** | Provar viabilidade técnica em sandbox interno (≤10 usuários piloto) |
| **Protótipo** | Funcional para grupo restrito (≤30 usuários, 1-2 BUs) |
| **Piloto** | Operação real em 3-5 BUs (≤100 usuários ativos) |
| **MVP** | Operação plena para todo o grupo United Creators |

---

## 2. Visão Geral dos NFRs

### 2.1. Resumo por Categoria ISO 25010

| Categoria ISO 25010 | Quantidade | NFRs |
|---------------------|:----------:|------|
| Performance Efficiency | 4 | NFR-001 a NFR-004 |
| Reliability | 3 | NFR-005 a NFR-007 |
| Security | 6 | NFR-008 a NFR-013 |
| Maintainability | 3 | NFR-014 a NFR-016 |
| Compatibility | 2 | NFR-017, NFR-018 |
| Usability | 3 | NFR-019 a NFR-021 |
| Portability | 2 | NFR-022, NFR-023 |
| Functional Suitability | 2 | NFR-024, NFR-025 |
| MLOps & Governança IA (transversal) | 3 | NFR-026 a NFR-028 |
| **Total** | **28** | — |

### 2.2. Resumo por Fase

| Fase | NFRs Obrigatórios (MUST) | NFRs Desejáveis (SHOULD/MAY) |
|------|--------------------------|------------------------------|
| **POC** | NFR-001, NFR-008, NFR-026 | — |
| **Protótipo** | NFR-001 a NFR-004, NFR-008 a NFR-013, NFR-019, NFR-026 | NFR-005 a NFR-007, NFR-014 a NFR-018 |
| **Piloto** | NFR-001 a NFR-021, NFR-024, NFR-026 a NFR-028 | NFR-022, NFR-023, NFR-025 |
| **MVP** | Todos os 28 | — |

### 2.3. SLOs Globais

| SLO | Métrica (SLI) | Target Piloto | Target MVP | Janela |
|-----|---------------|--------------:|-----------:|--------|
| Disponibilidade | Uptime % do `chat/stream` | 99.0% | 99.5% | Mensal |
| Latência first-token (chat SSE) | P95 (ms) | < 1500ms | < 1000ms | Rolling 7d |
| Latência completa de turn (chat) | P95 (s) | < 30s | < 20s | Rolling 7d |
| Taxa de erro de API | % HTTP 5xx | < 2% | < 1% | Rolling 24h |
| Tracing de chamadas LLM | % com trace MLflow | 100% | 100% | Contínuo |
| Cross-client contamination | Eventos detectados | 0 | 0 | Mensal |

---

## 3. Catálogo de NFRs

### 3.1. Tabela Consolidada

| ID | Categoria ISO | Descrição curta | Métrica-alvo | Prioridade | BR(s) / RN(s) | Fase | Status |
|----|---------------|-----------------|--------------|:----------:|---------------|------|--------|
| NFR-001 | Performance | Latência first-token chat SSE | P95 < 1500ms | Alta | BR-002, RN-003 | Protótipo | Proposed |
| NFR-002 | Performance | Latência completa de turn chat | P95 < 30s (Piloto) | Alta | BR-002 | Protótipo | Proposed |
| NFR-003 | Performance | Latência de retrieval pgvector | P95 < 300ms | Alta | BR-002, BR-006 | Protótipo | Proposed |
| NFR-004 | Performance | Throughput de ingestão Biblioteca | ≥30 docs/min | Média | BR-004 | Piloto | Proposed |
| NFR-005 | Reliability | Disponibilidade do serviço chat | 99.0% Piloto / 99.5% MVP | Alta | BR-002, BR-015 | Piloto | Proposed |
| NFR-006 | Reliability | Tolerância a falha de LLM (fallback) | < 5s para fallback | Alta | BR-002, BR-015 | Piloto | Proposed |
| NFR-007 | Reliability | Recuperação de pipeline ingestão | Retry 3x + DLQ | Média | BR-004 | Piloto | Proposed |
| NFR-008 | Security | Autenticação Firebase JWT em 100% endpoints | 100% rotas protegidas | Alta | BR-007, RN-009 | POC | Proposed |
| NFR-009 | Security | RBAC 3-níveis (Admin/Líder/Operacional) | 0 violações em audit | Alta | BR-007, RN-009 | Protótipo | Proposed |
| NFR-010 | Security | Isolamento de contexto cross-client | 0 incidentes | Alta | BR-008, RN-010 | Protótipo | Proposed |
| NFR-011 | Security | Ocultação da Biblioteca para Operacionais | 0 menções/acessos | Alta | BR-007, RN-011 | Protótipo | Proposed |
| NFR-012 | Security | Compliance LGPD (retenção, anonimização) | Política aprovada | Alta | BR-008, RN-013 | Piloto | Proposed |
| NFR-013 | Security | Secrets em Secret Manager (zero hardcode) | 100% via SM | Alta | BR-007 | POC | Proposed |
| NFR-014 | Maintainability | Cobertura de testes (unit + integration) | unit ≥70% / int ≥50% | Média | — (qualidade interna) | Piloto | Proposed |
| NFR-015 | Maintainability | Lint + format obrigatórios pre-commit | 100% PRs com ruff/ESLint pass | Média | — | Protótipo | Proposed |
| NFR-016 | Maintainability | Documentação de skills via SKILL.md | 100% das skills documentadas | Média | BR-015 | Protótipo | Proposed |
| NFR-017 | Compatibility | Suporte multi-LLM (Gemini/GPT/Claude) | ≥3 modelos comutáveis | Alta | BR-015, BR-016 | Protótipo | Proposed |
| NFR-018 | Compatibility | Compatibilidade com browsers modernos | Chrome/Edge/Safari últimas 2 versões | Média | — | Piloto | Proposed |
| NFR-019 | Usability | Time-to-value (3 cliques até skill útil) | ≤3 cliques | Alta | BR-001, RN-003 | Protótipo | Proposed |
| NFR-020 | Usability | Vocabulário UI alinhado ao Glossário | 0 anti-patterns em produção | Média | BR-011, RN-016 | Piloto | Proposed |
| NFR-021 | Usability | Marcação visual de outputs IA | 100% outputs IA marcados | Alta | BR-010, RN-014 | Protótipo | Proposed |
| NFR-022 | Portability | Deploy em Cloud Run (containers stateless) | Imagem multi-stage funcional | Média | — | Protótipo | Proposed |
| NFR-023 | Portability | Banco gerenciado e portável (PostgreSQL) | Migrations versionadas | Média | — | Piloto | Proposed |
| NFR-024 | Functional Suitability | Filtragem zona de bisociação Sweet Spot | ≥90% filtragem efetiva | Alta | BR-001, RN-001 | Piloto | Proposed |
| NFR-025 | Functional Suitability | Hierarquia de truncamento de contexto | Regras (1.0) sempre presentes | Alta | BR-015, RN-021 | Piloto | Proposed |
| NFR-026 | MLOps/Governança | Tracing MLflow de 100% chamadas LLM | 100% traces persistidos | Alta | BR-009, RN-013 | POC | Proposed |
| NFR-027 | MLOps/Governança | Métricas de homogeneização coletiva mensais | 3 métricas reportadas | Alta | BR-014, RN-019 | Piloto | Proposed |
| NFR-028 | MLOps/Governança | Custo evitado calculável por execução | ≥80% execuções com baseline | Alta | BR-013, RN-018 | Piloto | Proposed |

---

## 4. NFRs Detalhados por Categoria

### 4.1. Performance Efficiency

#### NFR-001 — Latência First-Token do Chat (SSE)

**Descrição**

O endpoint `POST /api/chat/stream` MUST emitir o primeiro evento SSE `text` (token inicial do LLM) dentro do tempo especificado, garantindo percepção de resposta instantânea para o creator.

**Métrica-alvo (SLO)**

| Métrica | Target | Ambiente |
|---------|-------:|----------|
| P50 first-token | < 700ms | Produção |
| P95 first-token | < 1500ms | Produção |
| P99 first-token | < 3000ms | Produção |

**Cenário de Qualidade**

| Elemento | Descrição |
|----------|-----------|
| Fonte do estímulo | Creator (PX-02 ou PX-03) via interface chat |
| Estímulo | Mensagem submetida com `skill_slug` definido |
| Ambiente | Operação normal, ≤50 conexões SSE concorrentes por instância Cloud Run |
| Artefato | `chat/router.py` + `chat/graph/runner.py` + Gemini 2.5 Flash |
| Resposta | Stream SSE inicia com `event: text` |
| Medida | 95% das requisições abrem stream em < 1500ms |

**Rastreabilidade**

| Tipo | IDs |
|------|-----|
| BRs | BR-002 (Aceleração operacional) |
| RNs | RN-003 (Acionamento Moon Shot — princípio "3 cliques até o valor") |

**Fase**: Protótipo | **Prioridade**: Alta | **Status**: Proposed

---

#### NFR-002 — Latência Completa de Turn do Chat

**Descrição**

O sistema MUST completar um turn de chat (`event: done` emitido) dentro do tempo especificado, considerando ReAct loop com até `MAX_REACT_ROUNDS=5` chamadas a tools.

**Métrica-alvo (SLO)**

| Métrica | Target Piloto | Target MVP |
|---------|--------------:|-----------:|
| P50 turn completo | < 12s | < 8s |
| P95 turn completo | < 30s | < 20s |
| Timeout máximo (router) | 60s | 60s |

**Cenário de Qualidade**

| Elemento | Descrição |
|----------|-----------|
| Fonte | Creator interagindo com skill processual |
| Estímulo | Pedido de geração de copy social com 1 documento de contexto |
| Ambiente | ReAct loop com 1-2 tool calls (search_knowledge + generate_text) |
| Artefato | `BaseAgent.run_react()` + `chat/tools/*` + LLM |
| Resposta | SSE `done` emitido após texto final |
| Medida | 95% dos turns completam em < 30s (Piloto) |

**Rastreabilidade**: BR-002, BR-015. Limite explícito de 60s já implementado em `chat/router.py:REQUEST_TIMEOUT`.

**Fase**: Protótipo | **Prioridade**: Alta | **Status**: Proposed

---

#### NFR-003 — Latência de Retrieval pgvector

**Descrição**

A operação `search_similar` (similarity search via cosine distance em `knowledge_chunks`) MUST retornar dentro do tempo especificado, sustentando a qualidade da injeção de contexto pelas skills.

**Métrica-alvo**

| Métrica | Target | Contexto |
|---------|-------:|----------|
| P95 search_similar (top_k=5) | < 300ms | Até 100K chunks indexados |
| P99 search_similar (top_k=5) | < 800ms | Até 100K chunks indexados |
| Hard timeout | 5s | Fallback para resultado vazio |

**Cenário de Qualidade**

| Elemento | Descrição |
|----------|-----------|
| Fonte | Tool `search_knowledge` invocada por agent |
| Estímulo | Embedding de query (768 dims) + filtros opcionais (scope, file_type) |
| Ambiente | PostgreSQL Cloud SQL com extensão pgvector + índice HNSW/IVFFlat |
| Artefato | `chat/knowledge/vector_store.py:search_similar` |
| Resposta | Lista de até 5 chunks ordenados por score |
| Medida | 95% das buscas retornam em < 300ms |

**Rastreabilidade**: BR-002, BR-006, RN-021 (hierarquia de truncamento depende de retrieval rápido).

**Fase**: Protótipo | **Prioridade**: Alta | **Status**: Proposed

---

#### NFR-004 — Throughput de Ingestão na Biblioteca

**Descrição**

O pipeline de ingestão (`chat/ingestion/processor.py`) MUST processar documentos curados pela liderança a uma taxa que sustente curadoria contínua sem virar gargalo operacional.

**Métrica-alvo**

| Métrica | Target | Contexto |
|---------|-------:|----------|
| Throughput médio | ≥ 30 docs/min | PDF ≤ 5MB, ≤ 50 páginas |
| Tempo end-to-end por doc | < 60s | Extração → embedding → upsert |
| Taxa de falha permanente | < 5% | Após 3 retries |

**Rastreabilidade**: BR-004 (≥500 itens curados até final do Piloto implica ingestão diária sustentável).

**Fase**: Piloto | **Prioridade**: Média | **Status**: Proposed

---

### 4.2. Reliability

#### NFR-005 — Disponibilidade do Serviço Chat

**Descrição**

O endpoint `POST /api/chat/stream` MUST manter disponibilidade conforme SLO, considerando manutenção programada como tempo planejado (não conta para downtime).

**Métrica-alvo (SLO)**

| Métrica | Target Piloto | Target MVP | Janela |
|---------|--------------:|-----------:|--------|
| Uptime mensal | 99.0% | 99.5% | Calendário |
| MTTR | < 4h | < 1h | Incidente individual |
| MTBF | > 168h (7d) | > 720h (30d) | Médio anual |

**Cenário de Qualidade**

| Elemento | Descrição |
|----------|-----------|
| Fonte | Falha de instância Cloud Run ou downstream (LLM provider) |
| Estímulo | Crash de container ou indisponibilidade Gemini API |
| Ambiente | Operação 24x7 |
| Artefato | Cloud Run autoscaling + health check `/health` |
| Resposta | Re-spin automático de instância; load balancer remove faulty |
| Medida | Uptime mensal ≥ 99.0% (Piloto) |

**Rastreabilidade**: BR-002, BR-015 (zero downtime durante deploy de Biblioteca/Moon Shot).

**Fase**: Piloto | **Prioridade**: Alta | **Status**: Proposed

---

#### NFR-006 — Tolerância a Falhas de Provedor LLM (Fallback)

**Descrição**

Quando o LLM primário (Gemini 2.5 Flash) falhar, o sistema SHOULD degradar elegantemente: tentar fallback para outro provider configurado (GPT-4o, Claude) ou retornar erro acionável ao usuário em ≤ 5s.

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Tempo de detecção de falha + fallback | < 5s |
| Disponibilidade efetiva (com fallback) | ≥ 99.5% Piloto |
| Mensagens de erro acionáveis (não stack traces) | 100% |

**Cenário de Qualidade**

| Elemento | Descrição |
|----------|-----------|
| Fonte | Provedor LLM (ex.: Gemini API) |
| Estímulo | HTTP 503 ou timeout |
| Ambiente | Operação normal |
| Artefato | `chat/graph/runner.py:_get_llm()` + lógica de retry/fallback |
| Resposta | Tentar próximo provider configurado; se todos falharem, SSE `event: error` com mensagem amigável |
| Medida | 100% das falhas têm fallback OU mensagem clara em ≤5s |

**Observação**: hoje `_get_llm` faz fallback estático para Gemini (linha 70-79); falta lógica dinâmica de circuit breaker — gap a endereçar até Piloto.

**Rastreabilidade**: BR-002, BR-015.

**Fase**: Piloto | **Prioridade**: Alta | **Status**: Proposed

---

#### NFR-007 — Resiliência da Pipeline de Ingestão

**Descrição**

O pipeline de ingestão da Biblioteca SHOULD aplicar retry com backoff exponencial e enviar falhas permanentes para Dead Letter Queue (DLQ) auditável.

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Retries automáticos por doc | 3 (backoff exponencial 1s, 4s, 16s) |
| Documentos em DLQ revisados em ≤ 24h | 100% |
| Perda definitiva de documentos | 0 (reprocessável manualmente) |

**Rastreabilidade**: BR-004.

**Fase**: Piloto | **Prioridade**: Média | **Status**: Proposed

---

### 4.3. Security

#### NFR-008 — Autenticação Firebase JWT Obrigatória

**Descrição**

Todos os endpoints `/api/*` (exceto `/health` e `/`) MUST exigir Firebase JWT válido em header `Authorization: Bearer <token>`. Tokens são validados via `firebase-admin`.

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Endpoints protegidos | 100% (exceto health/root) |
| Tentativas anônimas bloqueadas | 100% |
| Tempo de validação JWT | < 50ms (cache de chaves públicas) |

**Cenário de Qualidade**

| Elemento | Descrição |
|----------|-----------|
| Fonte | Cliente HTTP (frontend ou externo) |
| Estímulo | Request a `/api/chat/stream` sem header `Authorization` |
| Ambiente | Produção / Staging |
| Artefato | Middleware FastAPI de autenticação + `core/firebase.py` |
| Resposta | HTTP 401 Unauthorized + log de tentativa |
| Medida | 100% bloqueio + log estruturado |

**Status atual**: Frontend já anexa token via `lib/api.ts:getAuthToken()`; backend tem `core/firebase.py` mas dependency de auth ainda não está aplicada nos routers — gap a fechar antes do Protótipo.

**Rastreabilidade**: BR-007, RN-009.

**Fase**: POC | **Prioridade**: Alta | **Status**: Proposed

---

#### NFR-009 — RBAC com 3 Perfis (Admin / Líder / Operacional)

**Descrição**

O sistema MUST implementar Role-Based Access Control com 3 perfis conforme RN-009. Permissões aplicadas em backend (default-deny), não apenas em UI.

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Violações de RBAC detectadas em audit semestral | 0 |
| Cobertura RBAC nos endpoints | 100% |
| Default behavior em ambiguidade | Deny |

**Matriz de permissões resumida**

| Recurso | Admin | Líder | Operacional |
|---------|:-----:|:-----:|:-----------:|
| CRUD Biblioteca | ✓ Total | ✓ por área | ✗ (consumo via skills) |
| CRUD Skills + system prompts | ✓ | ✗ | ✗ |
| Workflows próprios | ✓ | ✓ | ✓ (com tools permitidas) |
| Logs de auditoria | ✓ Read | ✓ por área | ✗ |
| Acesso a chat/skill | ✓ | ✓ | ✓ |

**Rastreabilidade**: BR-007, RN-009, RN-011.

**Fase**: Protótipo | **Prioridade**: Alta | **Status**: Proposed

---

#### NFR-010 — Isolamento de Contexto Cross-Client

**Descrição**

Skills processuais MUST nunca incluir contexto de cliente diferente do ativo. Conteúdos tageados como "cross-client" (benchmarks, metodologias genéricas) podem ser injetados com peso reduzido.

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Incidentes de cross-contamination detectados | 0 (anual) |
| Filtros por `client_id` em retrieval | 100% das skills |
| Auditoria automática de outputs | Mensal |

**Cenário de Qualidade**

| Elemento | Descrição |
|----------|-----------|
| Fonte | Creator em sessão do cliente A |
| Estímulo | Skill processual aciona `search_knowledge` |
| Ambiente | Multi-cliente (Vivo, Sicredi, Americanas, etc.) |
| Artefato | `chat/knowledge/vector_store.py:search_similar` com filtro `scope` |
| Resposta | Apenas chunks elegíveis ao cliente A retornados |
| Medida | 0 chunks de cliente B em resultado |

**Rastreabilidade**: BR-008, RN-010.

**Fase**: Protótipo | **Prioridade**: Alta | **Status**: Proposed

---

#### NFR-011 — Caixa-Preta: Ocultação da Biblioteca para Operacionais

**Descrição**

Para perfis Operacionais, a Biblioteca MUST ser invisível: zero menções na UI, redirect transparente em URLs diretas, vocabulário de sistema substitui "Biblioteca" por "contexto do cliente" em qualquer output.

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Menções a "Biblioteca" em UI operacional | 0 |
| Acessos diretos bem-sucedidos por Operacionais | 0 |
| Vocabulário neutro em outputs | 100% |

**Rastreabilidade**: BR-007, RN-011 (decisão direta do sponsor — Caixa-preta como princípio fundacional).

**Fase**: Protótipo | **Prioridade**: Alta | **Status**: Proposed

---

#### NFR-012 — Compliance LGPD

**Descrição**

O sistema MUST estar em conformidade com a LGPD (Lei 13.709/2018) quanto a retenção, anonimização e descarte de dados pessoais que possam transitar em logs LLM, conversas e knowledge_chunks.

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Logs LLM persistidos por ≤ 12 meses (ativo) | 100% |
| Logs > 12 meses movidos para armazenamento frio | 100% |
| Política de retenção de dados pessoais aprovada pela Diretoria | Antes do Piloto |
| Tempo para atender solicitação de exclusão | ≤ 30 dias |

**Rastreabilidade**: BR-008, RN-013, PA-07 (BRD).

**Fase**: Piloto | **Prioridade**: Alta | **Status**: Proposed

---

#### NFR-013 — Secrets em Secret Manager

**Descrição**

Todas as credenciais (GOOGLE_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, DATABASE_URL com password, FIREBASE_PROJECT_ID) MUST ser carregadas de GCP Secret Manager em runtime — zero hardcode em código, zero commit em `.env*`.

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Secrets carregados via Secret Manager em produção | 100% |
| Hits em scan automatizado de secrets em commits | 0 |
| `.env*` em `.gitignore` | Sim |

**Rastreabilidade**: BR-007, restrição "NÃO exponha API keys" (api/CLAUDE.md).

**Fase**: POC | **Prioridade**: Alta | **Status**: Proposed

---

### 4.4. Maintainability

#### NFR-014 — Cobertura de Testes

**Descrição**

O sistema SHOULD manter cobertura mínima de testes automatizados, garantindo que refatorações e novas skills não regridam comportamento existente.

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Cobertura unit (backend Python) | ≥ 70% |
| Cobertura integração (rotas FastAPI) | ≥ 50% |
| Cobertura unit (frontend TS) | ≥ 60% |
| Smoke tests E2E críticos | ≥ 5 fluxos |

**Rastreabilidade**: qualidade interna; pré-condição para evoluir BR-015 sem regressão.

**Fase**: Piloto | **Prioridade**: Média | **Status**: Proposed

---

#### NFR-015 — Lint e Formatação Obrigatórios

**Descrição**

Todo PR MUST passar em `ruff check` + `ruff format` (backend) e `next lint` + `tsc --noEmit` (frontend) antes de merge.

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| PRs mergeados sem lint pass | 0 |
| Falhas de tsc em main | 0 |
| Tempo médio de CI lint | < 90s |

**Rastreabilidade**: convenções de api/CLAUDE.md e CLAUDE.md raiz.

**Fase**: Protótipo | **Prioridade**: Média | **Status**: Proposed

---

#### NFR-016 — Documentação de Skills (SKILL.md + references/)

**Descrição**

Toda skill em `api/chat/skills/<slug>/` MUST conter SKILL.md com overview, quando usar e tools, além de `references/*.md` com domain knowledge consumido pelo `SkillLoader`.

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Skills com SKILL.md | 100% |
| Skills com ≥1 reference | 100% |
| Tempo médio de criação de nova skill | ≤ 4h |

**Rastreabilidade**: BR-015 (integração com Skills existentes).

**Fase**: Protótipo | **Prioridade**: Média | **Status**: Proposed

---

### 4.5. Compatibility

#### NFR-017 — Suporte Multi-LLM

**Descrição**

O sistema MUST suportar comutação entre ≥3 modelos LLM (Gemini 2.5 Flash, GPT-4o, Claude Sonnet) via parâmetro `model` na request, sem alteração de código no agent.

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Modelos suportados | ≥ 3 |
| Tempo para adicionar novo modelo | ≤ 1 dia (apenas adicionar entry em `MODEL_MAP`) |
| Fallback automático | Gemini Flash quando key específica ausente |

**Status atual**: Já implementado em `chat/graph/runner.py:MODEL_MAP` e `_get_llm()`.

**Rastreabilidade**: BR-015, BR-016 (coexistência com ferramentas).

**Fase**: Protótipo | **Prioridade**: Alta | **Status**: Proposed

---

#### NFR-018 — Compatibilidade com Browsers Modernos

**Descrição**

O frontend MUST funcionar em Chrome, Edge, Safari e Firefox nas últimas 2 versões major. SSE (EventSource/fetch streaming) é requisito mínimo.

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Browsers suportados | Chrome, Edge, Safari, Firefox (últimas 2 versões) |
| Mobile (read-only) | Chrome iOS/Android — Piloto+ |
| Polyfills explícitos | Documentados se necessário |

**Fase**: Piloto | **Prioridade**: Média | **Status**: Proposed

---

### 4.6. Usability

#### NFR-019 — Time-to-Value (Princípio "3 Cliques")

**Descrição**

Qualquer creator com sessão ativa MUST conseguir iniciar uma execução de skill (ou Moon Shot) em ≤ 3 cliques a partir da home do Sistema Solar.

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Cliques para chat com skill ativa | ≤ 3 (Home → Cliente → Skill) |
| Tempo até primeiro token útil (incluindo navegação) | < 8s P95 |
| Taxa de abandono em onboarding | < 20% |

**Rastreabilidade**: BR-001, RN-003 (Botão da criatividade, não do desespero).

**Fase**: Protótipo | **Prioridade**: Alta | **Status**: Proposed

---

#### NFR-020 — Vocabulário UI Alinhado ao Glossário

**Descrição**

Toda copy de UI MUST usar termos do Glossário (Devorar, Provocar, Faísca, Brasa, Bioma, Inteligência Coletiva) e NUNCA usar anti-patterns (gerar, otimizar, eficiência, accelerator, departamento de IA).

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Anti-patterns em copy de produção | 0 |
| Validação cultural com sponsor por release | ≥ 1 |
| % de termos do Glossário em UI | ≥ 80% das telas |

**Rastreabilidade**: BR-011, RN-016.

**Fase**: Piloto | **Prioridade**: Média | **Status**: Proposed

---

#### NFR-021 — Marcação Visual de Outputs IA

**Descrição**

Todo output gerado por IA MUST ser visualmente marcado como "estímulo / provocação". Remoção da marcação só após confirmação explícita do creator (ownership preservado).

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Outputs IA marcados | 100% |
| Confirmações explícitas registradas no audit log | 100% |
| Outputs IA publicados sem confirmação | 0 |

**Rastreabilidade**: BR-010, RN-014.

**Fase**: Protótipo | **Prioridade**: Alta | **Status**: Proposed

---

### 4.7. Portability

#### NFR-022 — Deploy em Cloud Run (Containers Stateless)

**Descrição**

O backend MUST ser deployável como container stateless no Cloud Run via imagem multi-stage (`api/Dockerfile`). Build via `cloudbuild.yaml`.

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Imagem final (runtime) | < 500 MB |
| Cold start P95 | < 8s |
| Migração para outro runtime container (GKE) | ≤ 1 sprint de adaptação |

**Status atual**: Já implementado (api/Dockerfile multi-stage + cloudbuild.yaml).

**Fase**: Protótipo | **Prioridade**: Média | **Status**: Proposed

---

#### NFR-023 — Banco PostgreSQL Portável

**Descrição**

A camada de persistência SHOULD usar PostgreSQL standard + extensão pgvector — sem dependência de features proprietárias de Cloud SQL —, permitindo migração para outro provedor PostgreSQL gerenciado se necessário.

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Dependência de extensões | Apenas pgvector + extensions PG core |
| Migrations versionadas | 100% (Alembic ou equivalente) |
| Tempo estimado de re-host (export/import) | < 1 dia |

**Fase**: Piloto | **Prioridade**: Média | **Status**: Proposed

---

### 4.8. Functional Suitability

#### NFR-024 — Filtragem de Provocações por Zona de Bisociação

**Descrição**

O pipeline Moon Shot MUST filtrar provocações por zona semântica (cosseno briefing↔provocação): descartar zona "óbvio" (< 0.5) e zona "incoerente" (> 0.85), priorizar Sweet Spot (0.5–0.85).

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Filtragem efetiva de zonas extremas | ≥ 90% |
| Provocações úteis em testes blind | ≥ 60% |
| Latência da filtragem | < 200ms por candidato |

**Rastreabilidade**: BR-001, RN-001.

**Fase**: Piloto | **Prioridade**: Alta | **Status**: Proposed

---

#### NFR-025 — Hierarquia de Truncamento de Contexto

**Descrição**

Quando contexto injetado excede context window do LLM ativo, o sistema MUST truncar dos pesos mais baixos para os mais altos, preservando sempre Regras de Negócio do cliente (peso 1.0).

**Hierarquia de truncamento**

| Categoria | Peso | Comportamento |
|-----------|:----:|---------------|
| Referências gerais | 0.2 | Primeiras a serem cortadas |
| Contexto de mercado | 0.4 | — |
| Histórico de campanhas | 0.6 | Aviso de qualidade ao truncar |
| Guidelines de marca | 0.8 | Aviso de qualidade ao truncar |
| Regras de negócio do cliente | 1.0 | NUNCA truncar; abortar se overflow |

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Execuções com aviso de truncamento ≥0.6 | < 5% |
| Abortos por overflow de regras de negócio | 0 |

**Rastreabilidade**: BR-015, RN-021.

**Fase**: Piloto | **Prioridade**: Alta | **Status**: Proposed

---

### 4.9. MLOps e Governança de IA (transversal)

#### NFR-026 — Tracing MLflow de 100% das Chamadas LLM

**Descrição**

Toda chamada a LLM em produção MUST ser rastreada em MLflow (`MLFLOW_TRACKING_URI` configurado), com prompt, output, modelo, latência, custo (estimado) e scorers de qualidade quando disponíveis.

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Chamadas LLM com trace persistido | 100% |
| Retenção de traces em armazenamento ativo | ≥ 12 meses |
| Tempo para gerar relatório por skill/cliente | < 30s |

**Status atual**: Decorator `trace_chat_turn` implementado em `chat/eval/tracing.py` (no-op se MLflow indisponível); precisa ser aplicado consistentemente em todos os entrypoints.

**Rastreabilidade**: BR-009, RN-013.

**Fase**: POC | **Prioridade**: Alta | **Status**: Proposed

---

#### NFR-027 — Métricas Mensais de Homogeneização Coletiva

**Descrição**

Mensalmente, o sistema MUST calcular e reportar 3 métricas sobre amostra representativa de outputs criativos:

| Métrica | Significado |
|---------|-------------|
| Mean Pairwise Cosine Distance | Diversidade semântica média entre pares |
| Self-BLEU | Similaridade textual interna (alto = repetitivo) |
| Compression Ratio | Compressibilidade média (alto = padrão) |

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Cobertura mensal | 100% dos meses pós-Piloto |
| Alerta automático em divergência > 2σ vs. baseline | Sim |
| Reporting trimestral à Diretoria | Sim |

**Restrição**: NUNCA reportar satisfação individual (NPS) sem simultânea exibição de set-level diversity (RN-020).

**Rastreabilidade**: BR-014, RN-019, RN-020.

**Fase**: Piloto | **Prioridade**: Alta | **Status**: Proposed

---

#### NFR-028 — Custo Evitado por Execução de Skill

**Descrição**

Para cada execução de skill processual com baseline conhecida, o sistema MUST calcular custo evitado: `(tempo_manual − tempo_skill) × custo_hora_da_área`.

**Métrica-alvo**

| Métrica | Target |
|---------|-------:|
| Execuções com custo evitado calculável | ≥ 80% |
| Atualização do mapeamento de baselines | Trimestral |
| Dashboard executivo com tendência mensal | Disponível dia 5 do mês seguinte |

**Rastreabilidade**: BR-013, RN-018.

**Fase**: Piloto | **Prioridade**: Alta | **Status**: Proposed

---

## 5. Tabela de Rastreabilidade NFR ↔ BR ↔ RN

| NFR | Categoria | BR(s) | RN(s) |
|-----|-----------|-------|-------|
| NFR-001 | Performance | BR-002 | RN-003 |
| NFR-002 | Performance | BR-002 | — |
| NFR-003 | Performance | BR-002, BR-006 | RN-021 |
| NFR-004 | Performance | BR-004 | RN-006 |
| NFR-005 | Reliability | BR-002, BR-015 | — |
| NFR-006 | Reliability | BR-002, BR-015 | — |
| NFR-007 | Reliability | BR-004 | RN-006 |
| NFR-008 | Security | BR-007 | RN-009 |
| NFR-009 | Security | BR-007 | RN-009 |
| NFR-010 | Security | BR-008 | RN-010 |
| NFR-011 | Security | BR-007 | RN-011 |
| NFR-012 | Security | BR-008, BR-009 | RN-013 |
| NFR-013 | Security | BR-007 | — |
| NFR-014 | Maintainability | — | — |
| NFR-015 | Maintainability | — | — |
| NFR-016 | Maintainability | BR-015 | — |
| NFR-017 | Compatibility | BR-015, BR-016 | — |
| NFR-018 | Compatibility | — | — |
| NFR-019 | Usability | BR-001 | RN-003 |
| NFR-020 | Usability | BR-011 | RN-016 |
| NFR-021 | Usability | BR-010 | RN-014 |
| NFR-022 | Portability | — | — |
| NFR-023 | Portability | — | — |
| NFR-024 | Functional Suitability | BR-001 | RN-001, RN-002 |
| NFR-025 | Functional Suitability | BR-015 | RN-021 |
| NFR-026 | MLOps/Governança | BR-009 | RN-013 |
| NFR-027 | MLOps/Governança | BR-014 | RN-019, RN-020 |
| NFR-028 | MLOps/Governança | BR-013 | RN-018 |

**Cobertura BR**: cada um dos 16 BRs do BRD tem ≥1 NFR derivado (verificado por inspeção).
**Cobertura RN**: 14 das 22 RNs viram NFR (as não-cobertas são guidelines de UX/cultura ou processo, não atributos de qualidade técnica).

---

## 6. SLOs, SLIs e Guardrails

### 6.1. Service Level Objectives (SLOs)

| SLO ID | Descrição | SLI | Target Piloto | Target MVP | Janela |
|--------|-----------|-----|--------------:|-----------:|--------|
| SLO-001 | Disponibilidade chat | Uptime % do `/chat/stream` | 99.0% | 99.5% | Mensal |
| SLO-002 | Latência first-token | P95 first-token (ms) | < 1500 | < 1000 | Rolling 7d |
| SLO-003 | Latência turn completo | P95 turn (s) | < 30 | < 20 | Rolling 7d |
| SLO-004 | Erro de API | % HTTP 5xx | < 2% | < 1% | Rolling 24h |
| SLO-005 | Tracing LLM | % chamadas com trace | 100% | 100% | Contínuo |
| SLO-006 | Cross-client isolation | Eventos detectados | 0 | 0 | Mensal |
| SLO-007 | Retrieval pgvector | P95 search_similar (ms) | < 300 | < 200 | Rolling 7d |

### 6.2. Guardrails

| Guardrail | Descrição | Limite | Ação |
|-----------|-----------|-------:|------|
| GR-001 | Custo mensal LLM por usuário ativo | < R$ 80 | Alerta em > R$ 60 |
| GR-002 | Tokens por turn (chat) | < 50K input + 4K output | Truncar e logar |
| GR-003 | Conexões SSE concorrentes por instância | < 50 | Autoscaling ativo |
| GR-004 | Tamanho de arquivo na ingestão | ≤ 50 MB | Rejeitar com mensagem |
| GR-005 | Document chunks por documento | ≤ 1000 | Splitter aplicado |
| GR-006 | Rate limit por usuário (chat) | 60 req/min | HTTP 429 |
| GR-007 | Workflows simultâneos por usuário | ≤ 5 | Fila |

---

## 7. Assunções e Lacunas

### 7.1. Assunções

| ID | Assunção | Impacto se Falsa | Status |
|----|----------|------------------|--------|
| ASS-001 | Cloud SQL com pgvector tem latência aceitável (< 300ms P95) para até 100K chunks | Alto — pode requerer migração para vector DB dedicada | A validar no Protótipo com dados reais |
| ASS-002 | Gemini 2.5 Flash sustenta P95 first-token < 1500ms na região southamerica-east1 | Alto — pode requerer fallback para us-central1 | A medir |
| ASS-003 | Política de retenção LGPD pode ser aprovada antes do Piloto | Médio — pode atrasar Piloto | Pendente Diretoria (PA-07 do BRD) |
| ASS-004 | Time de 4 devs consegue manter cobertura ≥70% sem dedicated SDET | Médio — pode degradar para ≥50% | A acompanhar |
| ASS-005 | Cloud Run autoscaling absorve pico de uso semanal (terças com Diretoria) | Baixo — ajustável via min_instances | Padrão |

### 7.2. Lacunas (TODOs)

| ID | Lacuna | Informação Necessária | Responsável |
|----|--------|----------------------|-------------|
| TODO-NFR-01 | Baseline pré-sunOS das 3 métricas de homogeneização (NFR-027) | Coleta de outputs criativos atuais por 30 dias | Bruno Prosperi + Heitor |
| TODO-NFR-02 | Threshold de horário comercial e 3σ (RN-012 / NFR-009) | Baseline de acessos administrativos | Heitor + log piloto |
| TODO-NFR-03 | SLA contratual interno com Diretoria (NFR-005) | Aprovação formal do 99.0% Piloto | Heitor + Guga |
| TODO-NFR-04 | Política de retenção de dados pessoais (NFR-012) | Aprovação Diretoria antes do Piloto | Heitor + Diretoria |
| TODO-NFR-05 | Definição do custo médio hora-homem por área (NFR-028) | Dado financeiro do CFO | Ronaldo Severino |
| TODO-NFR-06 | Implementação de auth dependency em routers FastAPI (NFR-008) | PR técnico | Time backend |

---

## Histórico de Versões

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | 2026-04-28 | Heitor Miranda + Claude | Versão inicial. **28 NFRs** distribuídos em 8 categorias ISO 25010 + categoria transversal MLOps/Governança IA. Derivados sistematicamente dos 16 BRs e 22 RNs do BRD (especialmente BR-007/008/009/013/014 e RN-009/010/011/013/019/020). Inclui 7 SLOs e 7 Guardrails operacionais. Status: Rascunho aguardando validação técnica e aprovação de SLAs com Diretoria. |
