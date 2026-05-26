---
spec-id: SPEC-014
slug: api-remediation-2026-04
artefato: spec
nivel-sdd: spec-anchored
tamanho: medium
status: parcialmente-implementada
criada: 2026-04-28
atualizada: 2026-04-28
versao: 1.0
escopo:
  projeto: sunOS
  origem: SRD Parte 8 §"Inconsistências encontradas (14 — INC-API-01..14)"
---

# API Remediation — 14 Inconsistências (Abril 2026)

## Resumo

A geração do SRD Parte 8 (APIs e Integration Contracts) identificou 14 inconsistências entre o backend FastAPI atual (`api/chat/router.py`, `api/chat/knowledge/router.py`, `api/workflows/router.py`) e os specs aprovados (BRD/PRD/SRD). Este documento:

1. **Categoriza** cada inconsistência por severidade, esforço, risco
2. **Prioriza** por gate (POC / Protótipo / Piloto / MVP)
3. **Documenta** o que JÁ FOI corrigido nesta passada
4. **Define** o que fica como tarefa futura com justificativa

## Status atual

| Status | Quantidade |
|--------|:---:|
| Corrigida nesta passada | 3 (INC-API-03, 06, 07/08) |
| Documentada para próxima sprint | 4 (INC-API-01, 02, 04, 05) |
| Coberta por SPEC separada | 3 (INC-API-09, 10, 11 — SPECs 002 e 003) |
| Backlog médio prazo | 4 (INC-API-12, 13, 14) |

## Inconsistências detalhadas

### Críticas — bloqueadoras de Piloto

#### INC-API-01 — Endpoints sem autenticação
- **Severidade**: Crítica
- **Viola**: NFR-008 (Security), RN-009 (RBAC default deny)
- **Problema**: Nenhum endpoint do `chat/router.py` aplica `Depends(get_current_user)` — qualquer cliente HTTP pode consumir os endpoints
- **Esforço**: M
- **Risco breaking change**: ALTO (frontend atualmente não envia JWT consistentemente)
- **Migração**: Não, mas requer coordenação com frontend para garantir token em todas as chamadas
- **Prioridade**: P0 — antes do Piloto
- **Decisão**: NÃO corrigir nesta passada. Requer:
  1. Auditar `lib/api.ts` para garantir que `getAuthToken()` é usado em TODAS as chamadas
  2. Implementar `Depends(get_current_user)` em todos os endpoints
  3. Smoke test E2E antes de deploy
- **Tarefa futura**: TASK-API-001 (sprint que precede Piloto)

#### INC-API-02 — `GET /chat/conversations` é placeholder vazio
- **Severidade**: Crítica
- **Viola**: BR-006 (acesso democrático), expectativa do FE
- **Problema**: Endpoint retorna lista vazia hardcoded; sem query no DB
- **Esforço**: M
- **Risco breaking change**: BAIXO (frontend já trata lista vazia)
- **Migração**: Não, mas precisa que `conversations` table esteja populada (depende de fluxo de conversas estar persistindo)
- **Prioridade**: P0 — antes do Piloto
- **Decisão**: NÃO corrigir nesta passada. Aguarda persistência de conversas estar estável (débito P1 do PRODUCT_HANDOFF).
- **Tarefa futura**: TASK-API-002

#### INC-API-03 — `ChatRequest` sem `client_slug`
- **Severidade**: Crítica
- **Viola**: BR-008 (privacidade), BR-010 (isolamento), RN-010 (cross-client)
- **Problema**: Sem identificação do cliente, multi-tenant não pode ser enforced server-side
- **Esforço**: P
- **Risco breaking change**: BAIXO (campo opcional)
- **Migração**: Não
- **Prioridade**: P0 — antes do Piloto
- **✅ DECISÃO**: **CORRIGIDO NESTA PASSADA**
  - Adicionado `client_slug: str | None = None` em `ChatRequest`, `TextGenRequest`, `ImageGenRequest`
  - Documentado no docstring que será obrigatório no Piloto
  - Próximo passo (futuro): tornar obrigatório quando frontend estiver enviando consistentemente

#### INC-API-04 — Workflows in-memory (`_workflows: dict`)
- **Severidade**: Crítica
- **Viola**: NFR-005 (Reliability), bloqueador Piloto
- **Problema**: `workflows/router.py` mantém workflows num dict Python — perde dados em restart do Cloud Run
- **Esforço**: G
- **Risco breaking change**: MÉDIO (precisa migration de schema + adaptação de queries)
- **Migração**: SIM (criar tabela `workflows` se não existir, migrar dados)
- **Prioridade**: P0 — antes do Piloto
- **Decisão**: NÃO corrigir nesta passada. Refactor maior — exige spec própria.
- **Tarefa futura**: TASK-API-003 (criar SPEC-006 workflows-persistence)

#### INC-API-05 — Workflows hardcodam `created_by="admin"`
- **Severidade**: Alta
- **Viola**: RN-012 (auditabilidade)
- **Problema**: Quebra audit trail — toda criação aparece como "admin"
- **Esforço**: P (depende de INC-API-01 estar resolvido para extrair user do JWT)
- **Risco breaking change**: BAIXO (campo só de leitura)
- **Migração**: Não (campo já existe no schema)
- **Prioridade**: P0 — antes do Piloto
- **Decisão**: NÃO corrigir nesta passada. Bloqueada por INC-API-01.
- **Tarefa futura**: TASK-API-004 (depende TASK-API-001)

#### INC-API-06 — `knowledge/upload` sem validação de metadados
- **Severidade**: Alta
- **Viola**: RN-006, FR-001 (SPEC-004)
- **Problema**: Permite upload sem tags ou descrição curta — degrada qualidade da Biblioteca
- **Esforço**: P
- **Risco breaking change**: BAIXO (frontend já envia esses campos para uploads novos; uploads antigos não são afetados)
- **Migração**: Não
- **Prioridade**: P1 — antes do Protótipo
- **✅ DECISÃO**: **CORRIGIDO NESTA PASSADA**
  - Adicionada validação: `tags` mínimo 2, `description` mínimo 50 caracteres
  - HTTPException 400 com mensagem clara apontando RN-006/FR-001
  - Frontend deve atualizar formulário para refletir validação (tarefa de UX separada)

### Médias — schemas não-tipados

#### INC-API-07 — `ChatRequest.model: str` em vez de `Literal`
- **Severidade**: Média
- **Viola**: NFR-024 (validação de input)
- **Problema**: Aceita qualquer string como nome de modelo, gera erro só ao chamar LLM
- **Esforço**: P
- **Risco breaking change**: BAIXO (frontend já usa apenas valores válidos)
- **Prioridade**: P1
- **✅ DECISÃO**: **CORRIGIDO NESTA PASSADA**
  - Criado type alias `ChatModel = Literal["gemini-flash", "gemini-pro", "gpt-4o", "claude"]`
  - Aplicado em `ChatRequest.model` e `TextGenRequest.model`

#### INC-API-08 — Outros enums como `str`
- **Severidade**: Média
- **Viola**: NFR-024
- **Problema**: `aspect_ratio`, `content_type`, `tone`, `length`, `target_tool` aceitam qualquer string
- **Esforço**: P
- **Prioridade**: P1
- **✅ DECISÃO**: **CORRIGIDO NESTA PASSADA**
  - Criados type aliases: `ImageModel`, `AspectRatio`, `ContentType`, `Tone`, `Length`, `TargetTool`
  - Aplicados em `ImageGenRequest`, `TextGenRequest`, `EnhancePromptRequest`

### Phase 16 — fora do escopo deste sprint

#### INC-API-09 — Endpoint `image edit` não existe
- **Severidade**: Média
- **Coberta por**: SPEC-003 (image-editor)
- **Decisão**: Implementação faz parte do SPEC-003. Sem ação aqui.

#### INC-API-10 — Endpoint `video gen start` não existe
- **Severidade**: Média
- **Coberta por**: SPEC-002 (video-generation)
- **Decisão**: Implementação faz parte do SPEC-002. Sem ação aqui.

#### INC-API-11 — Endpoint `video gen status` não existe
- **Severidade**: Média
- **Coberta por**: SPEC-002 (video-generation)
- **Decisão**: Implementação faz parte do SPEC-002. Sem ação aqui.

### Backlog médio prazo

#### INC-API-12 — Sem CRUD de Clients no backend
- **Severidade**: Alta
- **Viola**: BR-006, expectativa do Sistema Solar dinâmico
- **Problema**: Frontend lê `data/clients.ts` mocked; admin de Clientes não tem endpoint para persistir
- **Esforço**: G
- **Risco breaking change**: ALTO (refactor do Sistema Solar)
- **Prioridade**: P1 — antes do MVP
- **Decisão**: Refactor cross-cutting. Tarefa futura — possivelmente nova SPEC.
- **Tarefa futura**: TASK-API-005 (Phase 15 do ROADMAP — "Integração Solar ↔ Admin")

#### INC-API-13 — Sem rate limiting middleware
- **Severidade**: Média
- **Viola**: NFR-005 (Reliability), proteção contra abuse
- **Esforço**: M
- **Risco breaking change**: BAIXO se thresholds generosos
- **Prioridade**: P1 — antes do MVP
- **Decisão**: Tarefa futura — escolher biblioteca (slowapi vs. middleware custom).
- **Tarefa futura**: TASK-API-006

#### INC-API-14 — `conversations.id` é VARCHAR; outras tabelas usam UUID
- **Severidade**: Baixa
- **Viola**: consistência de schema
- **Esforço**: M (migração de dados)
- **Risco breaking change**: MÉDIO (joins em código)
- **Prioridade**: P2 — backlog
- **Decisão**: Aguarda próxima migration grande para incorporar.
- **Tarefa futura**: TASK-API-007

## Sumário de execução

### Corrigido nesta passada (3 inconsistências)

| ID | Arquivo | Mudança |
|----|---------|---------|
| INC-API-03 | `api/chat/schemas/chat.py` | Adicionado `client_slug: str | None = None` em ChatRequest, TextGenRequest, ImageGenRequest |
| INC-API-06 | `api/chat/knowledge/router.py` | Validação obrigatória: tags ≥ 2, description ≥ 50 chars |
| INC-API-07/08 | `api/chat/schemas/chat.py` | Type aliases `ChatModel`, `ImageModel`, `AspectRatio`, `ContentType`, `Tone`, `Length`, `TargetTool` aplicados |

### Tarefas futuras criadas

| Task | Inconsistência | Prioridade | Esforço |
|------|---------------|:----------:|:-------:|
| TASK-API-001 | INC-API-01 (auth) | P0 | M |
| TASK-API-002 | INC-API-02 (conversations endpoint) | P0 | M |
| TASK-API-003 | INC-API-04 (workflows persistence) | P0 | G |
| TASK-API-004 | INC-API-05 (workflows audit) | P0 | P (depende TASK-API-001) |
| TASK-API-005 | INC-API-12 (Clients CRUD) | P1 | G |
| TASK-API-006 | INC-API-13 (rate limit) | P1 | M |
| TASK-API-007 | INC-API-14 (UUID consistency) | P2 | M |

## Verificação

- [x] `api/chat/schemas/chat.py` editado sem quebrar imports existentes (Literal importado)
- [x] `api/chat/knowledge/router.py` editado mantendo lógica original
- [ ] Testes pytest devem ser rodados antes de commit (não foi possível neste ambiente)
- [ ] Frontend `lib/api.ts` precisa ser atualizado para incluir `client_slug` em ChatRequest

## Próximos passos

1. **Smoke test manual**: subir API local e testar `/chat/stream` (deve aceitar `client_slug` opcional) e `/knowledge/upload` (deve rejeitar tags vazias e descrição curta)
2. **Frontend update**: atualizar `lib/api.ts` para enviar `client_slug` quando contexto de cliente estiver ativo
3. **Sprint planning**: priorizar TASK-API-001 a 004 para a sprint que precede o Piloto
4. **Documentação**: atualizar `api/CLAUDE.md` com nota sobre Literal types nos schemas

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-04-28 | Versão inicial. 14 inconsistências catalogadas; 3 corrigidas nesta passada (INC-API-03, 06, 07/08); 4 tarefas P0 e 3 P1/P2 documentadas para sprints futuras |
