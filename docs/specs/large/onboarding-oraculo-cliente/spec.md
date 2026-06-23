---
spec-id: SPEC-015
slug: onboarding-oraculo-cliente
artefato: spec
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-01-15
atualizada: 2026-06-23
versao: 2.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + Python 3.11"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: "Oracle v2: deep agent com subagentes por entidade, 9 entidades backbone Type A, HITL 2 via LangGraph interrupt, Dual HITL para reuniões"
predecessor_decision_reversed: "SPEC-015 v1 §3: Oracle como LangGraph 2-nós com 6 entidades hardcoded"
upstream:
  - docs/brd/parte3-requisitos.md (BR-021, BR-022)
  - docs/adr/ADR-007-cadastro-ontologico-cliente.md (ADR-007 v2)
  - docs/adr/ADR-015-oracle-deep-agent-architecture.md (ADR-015)
  - docs/adr/ADR-016-meeting-processing-cag-rag.md (ADR-016)
  - docs/adr/ADR-017-knowledge-layers-guardrails.md (ADR-017)
---

# Especificação — Oracle do Cliente v2 (SPEC-015)

> **Atenção:** Esta é a versão 2.0 desta spec. A versão 1.0 (2026-05-15) cobria Oracle como LangGraph 2-nós com 6 entidades hardcoded — está substituída por completo. Ver changelog ao final.

---

## 1. Resumo Executivo e Problema

### O quê

O Oracle do Cliente é o mecanismo de onboarding ontológico do sunOS: um deep agent (`create_deep_agent`, LangChain/LangGraph) que gera automaticamente as **9 entidades backbone Type A** de um cliente a partir de documentos do Drive Suno, proposta comercial e pesquisa web em allow-list. Após geração, um gate HITL obrigatório por entidade controla o que entra na Wiki Ontológica. A Wiki Ontológica (`/clientes/[slug]/wiki`) é a view persistente dessas entidades — consumida por RAG semântica (pgvector), Skills e Workflows do cliente.

### Problema resolvido

O Oracle v1 (`api/onboarding/oracle_agent.py`) é um LangGraph de 2 nós (`_research_node → _extract_entities_node`) invocado 9 vezes em série pelo caller externo. Os 6 entity_types hardcoded da v1 (`Posicionamento`, `Persona`, `Competidor`, `Produto`, `TomDeVoz`, `Briefing`) divergem do BRD (BR-021, BR-022). A ferramenta `search_wiki` faz `SELECT *` em vez de busca semântica (context stuffing, não RAG). E há um bug ativo: `add_reunion_context_to_oraculo` busca `entity_type="Briefings"` (plural) mas o banco grava `"Briefing"` (singular) — silent no-op.

Esta SPEC v2 define os requisitos para a reescrita completa do Oracle sob a arquitetura de deep agent documentada em ADR-015, usando o schema canônico de 9 entidades definido em ADR-007 v2.

### Por que agora

Três forças convergem:

1. **BR-021 e BR-022** exigem 9 entidades distintas (incluindo `CONTRACTED_SCOPE` e `MARTECH_STACK`) que a v1 não tem.
2. **RAG semântica estruturada** (L1 da arquitetura de camadas — ADR-017) requer `wiki_entities.embedding vector(768)` por entidade individual, incompatível com o JSONB da v1.
3. **HITL 2 para reuniões** (Ciclos 2 e 3) requer LangGraph interrupt nativo — o grafo linear `research → extract → END` não suporta.

### Para quem

| Persona | Papel no Oracle |
|---------|----------------|
| PX-01 (Líder de Área / Curador) | Conduz o wizard de onboarding, valida entidades no HITL gate |
| PX-07 (Sponsor de Área) | Aprova/rejeita propostas de atualização no HITL 2; edita Wiki diretamente |
| PX-04 (Admin) | Monitora clientes em PRE_ACTIVE, acessa audit log, aprova HITL 2 |
| PX-06 (Operacional) | Consome contexto via RAG — não vê a Wiki, não tem acesso ao HITL |

---

## 2. Personas e Jornadas

### PX-01 — Líder de Área / Curador

- **Perfil**: profissional da área (ex: Líder de Mídia, Planejamento), responsável pela curadoria do conhecimento do cliente
- **Objetivo no Oracle**: cadastrar novo cliente e garantir que todas as 9 entidades ontológicas estão corretas antes de ativar a conta
- **Jornada JN-13 — Onboarding inicial**:
  - `/clientes/new` → Wizard 4 passos → dispara Oracle
  - Aguarda conclusão (objetivo ≤5 min para 9 entidades em paralelo)
  - Valida entidade a entidade no HITL gate (T-36)
  - Após 9ª entidade aceita: cliente passa para ACTIVE
  - Acessa Wiki Ontológica (T-39)
- **Restrição**: não acessa `CONTRACTED_SCOPE` diretamente (somente via aprovação delegada ao Sponsor)

### PX-07 — Sponsor de Área

- **Perfil**: sócio/sponsor responsável pela área, acesso direto à Wiki e ao HITL 2
- **Objetivo no Oracle**: aprovar ou rejeitar propostas de atualização de entidades existentes (HITL 2); manter Wiki atualizada manualmente
- **Jornada JN-15 — Edição direta na Wiki**:
  - `/clientes/[slug]/wiki` → edita entidade inline → salva
- **Jornada JN-16 — Revisão HITL 2**:
  - Recebe notificação in-app de proposta de atualização
  - `/clientes/[slug]/wiki/hitl-review?entity=BRAND_VOICE&proposal=<uuid>` → visualiza diff → aprova ou rejeita
- **Acesso privilegiado**: único role (junto com Admin) que vê `CONTRACTED_SCOPE`

### PX-04 — Admin

- **Perfil**: admin do sistema
- **Objetivo**: monitorar clientes em PRE_ACTIVE, ver audit log, aprovar HITL 2 quando Sponsor não disponível
- **Fluxo**: painel de admin com lista de clientes PRE_ACTIVE + `pending_since` + alerta se ≥72h; endpoint `/api/clients/{slug}/wiki/audit`

<!-- REVIEW: As 3 personas ativas (PX-01, PX-07, PX-04) cobrem todos os atores do Oracle? PX-06 (Operacional) é intencionalmente excluído — consome RAG mas não tem acesso à Wiki (caixa-preta, RN-011). Confirmar se há persona "Analista Suno" distinta de PX-01 ou se é o mesmo role. -->

---

## 3. Requisitos Funcionais

### FR-001 — Execução paralela de subagentes para as 9 entidades backbone

**Prioridade**: Core  
**ADR**: ADR-015

O Oracle deve ser implementado como um único deep agent principal (`create_deep_agent`) que despacha **9 subagentes especializados em paralelo** (`concurrency=9`), um por entity_type.

Subagentes e entidades mapeadas:

| Subagente | entity_type | Tipo |
|-----------|-------------|------|
| `subagent-profile` | `CLIENT_PROFILE` | Type A |
| `subagent-market` | `MARKET_CONTEXT` | Type A |
| `subagent-competitors` | `COMPETITORS` | Type A |
| `subagent-brand` | `BRAND_VOICE` | Type A |
| `subagent-personas` | `TARGET_PERSONAS` | Type A |
| `subagent-legal` | `LEGAL_CONSTRAINTS` | Type A |
| `subagent-objectives` | `BUSINESS_OBJECTIVES` | Type A |
| `subagent-contract` | `CONTRACTED_SCOPE` | Type A |
| `subagent-martech` | `MARTECH_STACK` | Type A |

**Regras**:
- RN-F001-01: cada subagente recebe contexto **isolado** — não herda contexto do agente principal nem de outros subagentes
- RN-F001-02: o agente principal planeja via `write_todos` quais subagentes executar antes de despachá-los
- RN-F001-03: cada subagente retorna resultado compacto (`entity_type`, `content`, `confidence`, `sources_used`, `proposed_update_flag`)
- RN-F001-04: subagentes não persistem diretamente no banco — o agente principal orquestra persistência pós-HITL
- RN-F001-05: o agente principal usa virtual filesystem com namespace `/{client_id}/oracle/` — paths fora deste namespace são bloqueados (caixa-preta)

### FR-002 — subagent-contract deve ler proposta comercial PDF e JDs Suno

**Prioridade**: Core  
**ADR**: ADR-015, ADR-007

`subagent-contract` (entidade `CONTRACTED_SCOPE`) é um subagente especializado que lê dois tipos de documento heterogêneos:

1. **Proposta comercial final e/ou contrato assinado** — PDF enviado pelo cliente via upload no wizard
2. **Job descriptions das pessoas e departamentos da Suno** relevantes ao escopo contratado

Extrai obrigatoriamente: serviços contratados por área (criação/mídia/planejamento/data), tier financeiro, SLAs implícitos, responsáveis internos Suno por área.

**Regras**:
- RN-F002-01: proposta comercial é um input obrigatório do wizard — sem ela, `CONTRACTED_SCOPE` fica com `status=PENDING_REVIEW` e o Oracle avisa o Admin
- RN-F002-02: output tem flag `min_role=sponsor` — somente roles `admin` e `sponsor` acessam via row-level filter em `wiki_entities`
- RN-F002-03: Operacional recebe 404 ao tentar acessar `CONTRACTED_SCOPE` — nunca 403 (caixa-preta, `.claude/rules/caixa-preta.md`)

### FR-003 — subagent-martech deve verificar existência de martech antes de popular

**Prioridade**: Core  
**ADR**: ADR-015, ADR-007

Nem todos os clientes possuem stack de martech. O `subagent-martech` deve verificar explicitamente se há menção a ferramentas, integrações ou plataformas de dados nos documentos disponíveis antes de gerar conteúdo.

**Regras**:
- RN-F003-01: se não houver evidência suficiente de martech, o subagente retorna `status=EMPTY` e não cria registro em `wiki_entities`
- RN-F003-02: o Oracle não cria entidade fantasma com conteúdo inventado para `MARTECH_STACK`
- RN-F003-03: a ausência de `MARTECH_STACK` não bloqueia o gate `PRE_ACTIVE → ACTIVE` — a entidade vazia é tratada como "não aplicável" e conta como processada

### FR-004 — HITL 2 deve expor payload estruturado para aprovação humana

**Prioridade**: Core  
**ADR**: ADR-015

HITL 2 é o mecanismo de aprovação humana antes de persistir uma atualização de entidade **existente** (Ciclos 2 e 3). Implementado via LangGraph interrupt nativo do harness `deepagents`.

Payload do interrupt:

```python
@dataclass
class OntologyUpdateProposal:
    entity_id: str       # UUID do registro em wiki_entities
    entity_type: str     # ex: "BRAND_VOICE"
    evidence_anchor: str # trecho da fonte que suporta a mudança
    proposed_change: str # diff semântico: o que muda e por quê
    confidence: float    # score do subagente (0.0–1.0)
    source_path: str     # Drive path ou URL da fonte
```

**Regras**:
- RN-F004-01: HITL 2 é acionado somente em Ciclos 2 e 3 — no Ciclo 1 (onboarding inicial) não há entidade anterior para contradizer
- RN-F004-02: condições de acionamento: (a) subagente detecta contradição com entidade `ACTIVE` existente, ou (b) `confidence < 0.75` no delta proposto
- RN-F004-03: o agente principal pausa toda a execução via LangGraph interrupt ao detectar o primeiro `proposed_update_flag=True`
- RN-F004-04: revisor (Admin ou Sponsor) aprova ou rejeita via UI; se aprovado, executa pipelines pós-HITL 2 (FR-011)
- RN-F004-05: se rejeitado, entidade permanece com conteúdo anterior — sem alteração

<!-- REVIEW: O comportamento de "pausar toda a execução" ao primeiro proposed_update_flag é correto? Considerar se múltiplas entidades com flag simultâneo devem ser agrupadas em uma única tela de revisão em vez de interrupções sequenciais. -->

### FR-005 — Guardrail de input: somente documentos aprovados e reuniões pós-HITL 1

**Prioridade**: Core  
**ADR**: ADR-017

O Oracle somente processa fontes que passaram pelos gates de qualidade:

**Documentos Drive:**
- RN-F005-01: somente documentos com `status = 'ready'` ou `status = 'approved'` no Drive são lidos pelos subagentes
- RN-F005-02: documentos em draft ou pendentes de revisão são ignorados pelo Oracle

**Reuniões:**
- RN-F005-03: somente atas que passaram pelo HITL 1 (sanitização humana, `sanitized_content` não-nulo) são processadas pelo Oracle
- RN-F005-04: atas sem sanitização são invisíveis para todos os subagentes

**Cross-tenant:**
- RN-F005-05: o Oracle nunca lê `system_prompts`, `brand_guidelines` ou documentos de outros clientes — mesmo que o `client_id` seja explicitamente passado como argumento
- RN-F005-06: virtual filesystem garante isolamento por namespace `/{client_id}/oracle/`

### FR-006 — Guardrail de output: PII filter e sensitive topic detector

**Prioridade**: Core  
**ADR**: ADR-017

Antes de persistir qualquer entidade gerada, o agente principal aplica dois filtros no output de cada subagente:

**PII Filter:**
- RN-F006-01: nomes de pessoas físicas são removidos ou anonimizados do conteúdo gerado
- RN-F006-02: exceção: stakeholders **explicitamente cadastrados** na tabela `stakeholders` podem ser mencionados nominalmente
- RN-F006-03: PII filter com recall ≥ 99% — ver NFR-002

**Sensitive Topic Detector:**
- RN-F006-04: valores financeiros específicos no output são filtrados (exceto em `CONTRACTED_SCOPE`, que tem acesso restrito)
- RN-F006-05: dados de RH (demissões, promoções, avaliações de performance) são filtrados
- RN-F006-06: informações de concorrência confidencial detectadas são flagadas para revisão humana, não filtradas automaticamente

### FR-007 — Guardrail de acesso: CONTRACTED_SCOPE restrito a admin e sponsor

**Prioridade**: Core  
**ADR**: ADR-007, ADR-015

`CONTRACTED_SCOPE` (E8) contém tier financeiro sensível. Acesso diferenciado obrigatório:

**Backend:**
- RN-F007-01: a coluna `min_role` em `wiki_entities` para registros de `CONTRACTED_SCOPE` é setada como `'sponsor'` pelo `subagent-contract`
- RN-F007-02: toda query em `wiki_entities` que retorne `CONTRACTED_SCOPE` deve verificar `role` do JWT contra `min_role`
- RN-F007-03: operadores com role insuficiente recebem 404 genérico — nunca 403 (caixa-preta)
- RN-F007-04: endpoint `/api/clients/{slug}/wiki` exclui automaticamente registros com `min_role > role_do_jwt` da response

**Frontend:**
- RN-F007-05: a Wiki Ontológica não exibe card de `CONTRACTED_SCOPE` para usuários sem permissão — a entidade é simplesmente omitida da view (não exibida como "acesso restrito")

### FR-008 — Oracle deve suportar três ciclos de execução

**Prioridade**: Core  
**ADR**: ADR-015

O agente principal determina via `write_todos` qual ciclo está executando e adapta o plano:

**Ciclo 1 — Onboarding inicial:**
- Trigger: novo cliente cadastrado no wizard com proposta comercial enviada
- Comportamento: todos os 9 subagentes em paralelo, nenhuma entidade anterior, nenhum HITL 2
- Resultado: 9 registros novos em `wiki_entities` com `status=PENDING_REVIEW`

**Ciclo 2 — Revisão periódica:**
- Trigger: job agendado (cron) — entidades com `updated_at > 180 dias` marcadas como `STALE`
- Comportamento: somente subagentes correspondentes às entidades stale; subagentes recebem conteúdo atual para gerar delta; HITL 2 quando `proposed_update_flag=True`
- RN-F008-01: somente entidades com `status=STALE` são processadas no Ciclo 2

**Ciclo 3 — Revisão programática por evento:**
- Trigger: evento externo (nova ata aprovada pós-HITL 1, novo documento no Drive, mudança de proposta comercial)
- Comportamento: o evento identifica os `entity_types` afetados; somente os subagentes relevantes são despachados
- RN-F008-02: o evento carrega `affected_entity_types: list[str]` — o agente principal usa essa lista como filtro do plano

### FR-009 — wiki_entities deve ter coluna embedding vector(768)

**Prioridade**: Core (bloqueante para produção)  
**ADR**: ADR-007

A tabela `wiki_entities` deve ter a coluna `embedding vector(768)` obrigatória para RAG semântica (camada L1 da arquitetura de conhecimento).

```sql
ALTER TABLE wiki_entities ADD COLUMN embedding vector(768);

CREATE INDEX idx_wiki_entities_embedding
  ON wiki_entities USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

**Regras**:
- RN-F009-01: o embedding é calculado via `text-embedding-004` (Gemini, 768 dimensões) — mesmo modelo em `api/chat/knowledge/embeddings.py`
- RN-F009-02: embedding é calculado no Pipeline 1 pós-HITL (FR-011) — não na geração pelo subagente
- RN-F009-03: entidades existentes sem embedding recebem job de reindexação retroativa antes da migração para produção
- RN-F009-04: custo de embedding: somente reembed quando entidade é atualizada — nunca recalcular embedding de entidade com `status=ACTIVE` sem mudança de conteúdo

### FR-010 — search_wiki e consultar_ontologia devem usar pgvector cosine similarity

**Prioridade**: Core  
**ADR**: ADR-007, ADR-003

As ferramentas de busca na ontologia devem migrar de `SELECT *` (context stuffing) para busca semântica com pgvector.

**Padrão de query:**

```sql
SELECT entity_type, content, 1 - (embedding <=> $query_embedding) AS similarity
FROM wiki_entities
WHERE client_id = $client_id
  AND status = 'ACTIVE'
  AND (min_role = 'operator' OR $user_role IN ('sponsor', 'admin'))
ORDER BY embedding <=> $query_embedding
LIMIT 5;
```

**Regras**:
- RN-F010-01: `search_wiki` e `consultar_ontologia` seguem o padrão já implementado em `api/chat/knowledge/document_search.py`
- RN-F010-02: filtro por `entity_type` opcional — quando presente, restringe a busca ao tipo solicitado
- RN-F010-03: threshold de similaridade mínima: 0.75 (abaixo disso, não retornar o chunk)
- RN-F010-04: cross-tenant guard obrigatório: `WHERE client_id = $client_id` sempre presente, resolvido do JWT

<!-- REVIEW: Threshold de 0.75 para cosine similarity é adequado para buscas em entidades ontológicas de alto nível? Considerar que entidades Type A são textos densos (≥100 palavras) — um threshold muito alto pode rejeitar resultados válidos com paráfrases. -->

### FR-011 — Pipelines pós-HITL 2 devem ser executados após aprovação humana

**Prioridade**: Core  
**ADR**: ADR-015, ADR-013

Após aprovação humana de uma proposta de atualização (HITL 2), dois pipelines executam em sequência:

**Pipeline 1 — Embed entity:**
```
approved_update
→ UPDATE wiki_entities SET content = new_content WHERE id = entity_id AND client_id = $client_id
→ embed_text(new_content, model="text-embedding-004")
→ UPDATE wiki_entities SET embedding = new_embedding WHERE id = entity_id
→ invalidate_cache L1
```

**Pipeline 2 — Extract named entities (GraphRAG seed):**
```
approved_update
→ LLMGraphTransformer (ADR-013)
→ UPSERT knowledge_entities (badge=oracle_seed) + entity_relationships
→ enqueue para indexação pgvector
```

**Regras**:
- RN-F011-01: Pipeline 1 é síncrono em relação à resposta do revisor — o usuário vê a entidade atualizada imediatamente
- RN-F011-02: Pipeline 2 é assíncrono (job enfileirado) — não bloqueia a resposta ao revisor
- RN-F011-03: cross-tenant guard obrigatório em todas as queries dos dois pipelines

### FR-012 — Wiki Ontológica deve exibir 9 entidades com badges e proveniência

**Prioridade**: Core  
**ADR**: ADR-007

View persistente em `/clientes/[clientSlug]/wiki` exibindo as entidades ativas do cliente.

**Regras**:
- RN-F012-01: somente clientes com `status = ACTIVE` têm Wiki acessível
- RN-F012-02: Operacional acessa `/api/clients/{slug}/wiki` → 404 (RN-011 — caixa-preta)
- RN-F012-03: a Wiki exibe somente entidades com `status = ACTIVE` — entidades `PENDING_REVIEW`, `ARCHIVED` ou `EMPTY` são omitidas (exceto para Admin, que vê todas)
- RN-F012-04: cada entidade exibe badge de origem: `seed automático` / `revisado HITL` / `atualizado Oracle [data]` / `atualizado direto [data]`
- RN-F012-05: PX-01 e PX-07 podem editar entidades inline sem Oráculo — edição direta
- RN-F012-06: `CONTRACTED_SCOPE` é omitido da Wiki para roles sem permissão (FR-007)

### FR-013 — Gate PRE_ACTIVE → ACTIVE requer aprovação de todas as entidades aplicáveis

**Prioridade**: Core

Um cliente passa de `PRE_ACTIVE` para `ACTIVE` somente após aprovação explícita de todas as entidades aplicáveis no HITL gate.

**Regras**:
- RN-F013-01: entidades aplicáveis = as 9 entidades backbone exceto `MARTECH_STACK` quando `status=EMPTY` (não aplicável ao cliente)
- RN-F013-02: a transição é automática — ocorre imediatamente ao aceitar a última entidade pendente
- RN-F013-03: `PRE_ACTIVE` bloqueia Skills processuais, Moon Shot e Workflows (backend hard-block, 404)
- RN-F013-04: Admin vê lista de clientes `PRE_ACTIVE` com `pending_since`; alerta in-app se `pending_since ≥ 72h`

### FR-014 — Wizard de cadastro em 4 passos com proposta comercial obrigatória

**Prioridade**: Core

Wizard de onboarding de novo cliente integrado ao disparo do Oracle.

Passos:
- **Passo 1 (Metadados)**: nome, slug (único, `^[a-z0-9-]+$`), setor, porte (SMB/Mid/Enterprise), website oficial
- **Passo 2 (Oracle config)**: profundidade de pesquisa (superficial/padrão/profunda), domínios da allow-list (editável, default: site oficial + LinkedIn + Glassdoor + portais do setor), idiomas
- **Passo 3 (Documentos)**: upload de proposta comercial PDF (obrigatório) + OAuth Drive (escopo `drive.readonly`) — os dois inputs que alimentam o Oracle
- **Passo 4 (Confirmação)**: resumo dos 3 passos + botão "Disparar Oracle"

**Regras**:
- RN-F014-01: upload da proposta comercial é obrigatório para avançar do passo 3
- RN-F014-02: validação inline por passo (não só no submit final)
- RN-F014-03: auto-save do estado entre passos, TTL 24h
- RN-F014-04: input humano ativo ≤5 minutos (excluindo espera do Oracle)

### FR-015 — Dual HITL para reuniões

**Prioridade**: Core (Ciclos 2 e 3)  
**ADR**: ADR-016

Reuniões têm dois gates HITL independentes antes de alimentar o Oracle:

**HITL 1 — Content safety (fora do deep agent, antes do AI ler):**
- RN-F015-01: trigger: upload de nova ata de reunião
- RN-F015-02: revisor humano (PX-01 ou PX-07) sanitiza o conteúdo: remove PII, conteúdo de RH (demissões, promoções, avaliações), menções pessoais (férias, família), informações de gestão de pessoas
- RN-F015-03: somente após aprovação humana o conteúdo é gravado em `meeting_transcripts.sanitized_content`
- RN-F015-04: atas sem `sanitized_content` são invisíveis para todos os subagentes (FR-005, RN-F005-03)

**HITL 2 — Ontology update proposal (dentro do deep agent, via LangGraph interrupt):**
- RN-F015-05: trigger: deep agent detecta informação da ata que atualiza/contradiz entidade existente
- RN-F015-06: agent propõe via `OntologyUpdateProposal` (FR-004): qual entidade, trecho de evidência, mudança proposta
- RN-F015-07: revisor (Admin/Sponsor) aprova ou rejeita via UI de revisão
- RN-F015-08: se aprovado, executa pipelines pós-HITL 2 (FR-011)

<!-- REVIEW: O HITL 1 de reuniões está descrito aqui e também em SPEC-016 (meeting capture). Confirmar se a spec de meeting capture é apenas a captura da ata, ou se o HITL 1 também é escopo da SPEC-016 (e esta seção é apenas um sumário da dependência). -->

---

## 4. Requisitos Não-Funcionais

### NFR-001 — Latência de onboarding inicial < 5 min para 9 entidades em paralelo

**ADR**: ADR-015

- NFR-001-01: com 9 subagentes em `concurrency=9`, o tempo total é limitado pelo subagente mais lento
- NFR-001-02: objetivo p95: ≤5 min para onboarding inicial completo (Ciclo 1, todos os 9 subagentes)
- NFR-001-03: cada subagente individualmente: objetivo ≤90s p95
- NFR-001-04: polling de status: intervalo inicial 5s, backoff exponencial até 30s após 5min sem progresso
- NFR-001-05: alerta in-app para Admin se Oracle não completar em ≤30 min com `error_detail`

### NFR-002 — PII filter com recall ≥ 99%

**ADR**: ADR-017

- NFR-002-01: nenhum nome de pessoa física (exceto stakeholders explicitamente cadastrados) pode vazar para `wiki_entities.content` após o filtro
- NFR-002-02: PII filter aplicado em **todos** os subagentes, não somente nos que processam documentos com dados de pessoas
- NFR-002-03: falso negativo (PII que passa) é mais grave que falso positivo (dado não-PII filtrado) — calibrar conservadoramente

### NFR-003 — Custo de embedding: somente reembed quando entidade é atualizada

**ADR**: ADR-007

- NFR-003-01: embedding calculado apenas no Pipeline 1 pós-HITL (FR-011) — nunca recalcular embedding de entidade `ACTIVE` sem mudança de conteúdo
- NFR-003-02: job de reindexação retroativa (entidades existentes sem embedding) executado uma única vez como parte da migração
- NFR-003-03: não chamar `text-embedding-004` para leituras de entidade (somente para writes)

### NFR-004 — Auditabilidade completa do HITL

- NFR-004-01: todo evento de HITL gate (Ciclo 1) persistido em `entity_hitl_events`: `id`, `client_id`, `entity_type`, `action` (accept/edit/reject), `before_text`, `after_text`, `user_id`, `timestamp_utc`
- NFR-004-02: toda aprovação/rejeição de HITL 2 persistida: `proposal_id`, `entity_id`, `reviewer_id`, `decision`, `timestamp_utc`
- NFR-004-03: audit log imutável (append-only) — acessível somente para Admin via `/api/clients/{slug}/wiki/audit`

### NFR-005 — Cross-tenant isolation

- NFR-005-01: toda query em `wiki_entities` filtra `client_id` resolvido do JWT — nunca filtrar só por `id` e depois verificar `client_id`
- NFR-005-02: virtual filesystem do Oracle usa namespace `/{client_id}/oracle/` — wrapper com `client_id` injetado bloqueia paths fora do namespace
- NFR-005-03: `CONTRACTED_SCOPE` com 404 genérico para roles sem permissão (nunca 403)

### NFR-006 — Resiliência do Oracle

- NFR-006-01: job do Oracle retomável — se processo reinicia durante onboarding, retoma a partir do último subagente completado
- NFR-006-02: subagente com falha individual não cancela os demais — o agente principal marca aquela entidade como `FAILED` e continua
- NFR-006-03: rate limit Gemini Flash: semáforo por `client_id` para onboarding simultâneo de vários clientes; backoff exponencial por subagente

---

## 5. Critérios de Aceite

### Ciclo 1 — Onboarding inicial

- [ ] **CA-001**: DADO Ciclo 1 disparado para cliente novo com proposta comercial enviada, QUANDO Oracle executa, ENTÃO 9 subagentes são despachados em paralelo com `concurrency=9` e cada um recebe somente o contexto do seu `entity_type`
- [ ] **CA-002**: DADO subagent-contract executando no Ciclo 1, QUANDO lê proposta comercial, ENTÃO extrai serviços contratados por área, tier financeiro, SLAs implícitos e responsáveis Suno
- [ ] **CA-003**: DADO subagent-martech executando para cliente sem menção a ferramentas/integrações, QUANDO subagente verifica evidência, ENTÃO retorna `status=EMPTY` e nenhum registro é criado em `wiki_entities`
- [ ] **CA-004**: DADO subagent-martech executando para cliente com stack de martech documentada, QUANDO subagente encontra evidência, ENTÃO cria registro em `wiki_entities` com `status=PENDING_REVIEW`
- [ ] **CA-005**: DADO Ciclo 1 concluído, QUANDO todas as 9 entidades têm `status=PENDING_REVIEW` (ou `EMPTY` para `MARTECH_STACK`), ENTÃO UI redireciona automaticamente para HITL gate (T-36)
- [ ] **CA-006**: DADO oracle com status `oracle_failed`, QUANDO Admin verifica, ENTÃO alerta in-app é gerado com `error_detail` e cliente permanece em `PRE_ACTIVE`

<!-- REVIEW: CA-005 assume que MARTECH_STACK EMPTY não bloqueia o redirecionamento para T-36. Confirmar se o Admin deve ser notificado sobre a ausência de martech antes de prosseguir ou se é silencioso. -->

### HITL gate — Ciclo 1

- [ ] **CA-007**: DADO entidade `CLIENT_PROFILE` com `status=PENDING_REVIEW`, QUANDO PX-01 clica "Aceitar", ENTÃO `entity.status = ACTIVE`, auditoria registrada em `entity_hitl_events`, UI avança para próxima entidade
- [ ] **CA-008**: DADO entidade `MARKET_CONTEXT` gerada, QUANDO PX-01 edita texto e clica "Aceitar edição", ENTÃO conteúdo editado salvo, `diff(original, editado)` no audit log, status = `ACTIVE`
- [ ] **CA-009**: DADO entidade `COMPETITORS` gerada, QUANDO PX-01 clica "Rejeitar e Regenerar", ENTÃO Oracle regenera somente esta entidade; UI aguarda e exibe nova versão
- [ ] **CA-010**: DADO UI T-36, QUANDO PX-01 inspeciona, ENTÃO NÃO há botão "Aceitar todas" nem "Pular"
- [ ] **CA-011**: DADO `CONTRACTED_SCOPE` com `status=PENDING_REVIEW`, QUANDO PX-01 (sem role sponsor) tenta acessar, ENTÃO entidade é omitida da UI (não exibe "acesso restrito") — somente Admin/Sponsor visualizam e aprovam
- [ ] **CA-012**: DADO todas as entidades aplicáveis aceitas (incluindo `CONTRACTED_SCOPE` aprovado por Sponsor/Admin), QUANDO última entidade é aceita, ENTÃO `client.status = ACTIVE` automaticamente e redirect para `/clientes/{slug}/wiki`

### HITL 2 — Ciclos 2 e 3

- [ ] **CA-013**: DADO subagente no Ciclo 2 detecta contradição com entidade `ACTIVE` existente com `confidence ≥ 0.75`, QUANDO agente principal consolida, ENTÃO LangGraph interrupt emite `OntologyUpdateProposal` com `entity_id`, `evidence_anchor`, `proposed_change`, `confidence` e `source_path`
- [ ] **CA-014**: DADO `OntologyUpdateProposal` emitido, QUANDO Sponsor acessa tela de revisão, ENTÃO visualiza diff entre conteúdo atual e proposto, com trecho de evidência da fonte
- [ ] **CA-015**: DADO Sponsor aprova `OntologyUpdateProposal`, QUANDO pipeline pós-HITL 2 executa, ENTÃO `wiki_entities.content` é atualizado, `embedding` é recalculado com `text-embedding-004` e `knowledge_entities` recebe upsert com `badge=oracle_seed`
- [ ] **CA-016**: DADO Sponsor rejeita `OntologyUpdateProposal`, QUANDO decisão é registrada, ENTÃO entidade permanece com conteúdo anterior e rejeição é auditada
- [ ] **CA-017**: DADO subagente no Ciclo 2 com `confidence < 0.75`, QUANDO agente principal consolida, ENTÃO HITL 2 é acionado mesmo sem contradição explícita (baixa confiança é suficiente)

### Guardrails

- [ ] **CA-018**: DADO Oracle em execução, QUANDO subagente tenta ler documento com `status ≠ 'ready'` e `status ≠ 'approved'`, ENTÃO documento é ignorado e não entra no contexto do subagente
- [ ] **CA-019**: DADO ata de reunião sem `sanitized_content`, QUANDO qualquer subagente lista fontes disponíveis, ENTÃO ata é invisível (não aparece na lista de fontes)
- [ ] **CA-020**: DADO output de subagente contendo nome de pessoa física (não cadastrada em `stakeholders`), QUANDO PII filter é aplicado, ENTÃO nome é removido antes de persistir em `wiki_entities`
- [ ] **CA-021**: DADO PX-06 (Operacional) faz `GET /api/clients/{slug}/wiki`, ENTÃO resposta é HTTP 404 com body `{"detail": "Recurso não disponível"}` (RN-011)
- [ ] **CA-022**: DADO PX-06 faz `GET /api/clients/{slug}/wiki/CONTRACTED_SCOPE`, ENTÃO resposta é HTTP 404 — nunca 403
- [ ] **CA-023**: DADO Sponsor (role `sponsor`) faz `GET /api/clients/{slug}/wiki`, ENTÃO response inclui `CONTRACTED_SCOPE` na lista de entidades
- [ ] **CA-024**: DADO Operacional faz `GET /api/clients/{slug}/wiki`, ENTÃO response não inclui `CONTRACTED_SCOPE` (omitido, não erro)

### RAG semântica

- [ ] **CA-025**: DADO entidade `BRAND_VOICE` com `status=ACTIVE` e `embedding` preenchido, QUANDO `search_wiki(query="tom de voz formal", client_id=x)` é chamado, ENTÃO retorna `BRAND_VOICE` como resultado via cosine similarity (pgvector) — não via `SELECT *`
- [ ] **CA-026**: DADO query com similaridade coseno abaixo de 0.75, QUANDO `search_wiki` executa, ENTÃO nenhum resultado é retornado para aquela entidade (threshold enforcement)
- [ ] **CA-027**: DADO entidade atualizada via Pipeline 1 pós-HITL 2, QUANDO `search_wiki` é executado após atualização, ENTÃO busca usa o embedding recalculado (cache L1 invalidado)

### Wiki Ontológica

- [ ] **CA-028**: DADO `client.status = ACTIVE`, QUANDO PX-01 acessa `/clientes/[slug]/wiki`, ENTÃO exibe entidades com `status=ACTIVE` com badges corretos
- [ ] **CA-029**: DADO PX-07 edita entidade inline e salva, ENTÃO conteúdo atualizado, badge muda para `atualizado direto [data]`, Pipeline 1 pós-HITL 2 executa (reembed)
- [ ] **CA-030**: DADO `client.status = PRE_ACTIVE`, QUANDO qualquer usuário acessa `/clientes/[slug]/wiki`, ENTÃO 404 — Wiki só existe para `ACTIVE`

### Gate PRE_ACTIVE

- [ ] **CA-031**: DADO client em `PRE_ACTIVE`, QUANDO backend recebe request de execução de Skill ou Workflow, ENTÃO 404 com `{"detail": "Cliente não disponível"}`
- [ ] **CA-032**: DADO Admin no painel de clientes, QUANDO há cliente em `PRE_ACTIVE` há ≥ 72h, ENTÃO alerta in-app visível com `pending_since`

---

## 6. Fora de Escopo

- **SPEC-016 (FA-16)**: captura de reuniões — o upload, storage e HITL 1 de atas são escopo da SPEC-016; esta SPEC assume que as atas já estão sanitizadas e disponíveis
- **Integração RAG AlloyDB/pgvector full-text (ADR-008)**: camada L2 (Biblioteca) — SPEC separada de integração RAG
- **UI de diff visual de versões históricas da Wiki**: backlog
- **Exportação da Wiki para PDF/Notion**: backlog
- **Notificações por email**: somente in-app alerts nesta SPEC
- **Row-level security nativo PostgreSQL para `CONTRACTED_SCOPE`**: hoje filtro na camada de aplicação; migração para RLS nativo é fase posterior (documentada em ADR-007 §Pendências)
- **Setup híbrido orquestrador Sonnet + subagentes Flash**: documentado como opção em ADR-015 se qualidade do plan Gemini degradar; não é escopo desta SPEC
- **Rate limiting por `client_id` para onboarding simultâneo**: NFR documentado; implementação é fase posterior (ADR-015 §Pendências)

---

## 7. Mapa FR ↔ ADR

| FR | Título | ADRs que endereçam |
|----|--------|--------------------|
| FR-001 | Execução paralela de 9 subagentes | ADR-015 (arquitetura deep agent), ADR-010 (LangGraph), ADR-012 (deepagents harness) |
| FR-002 | subagent-contract lê proposta + JDs | ADR-015 (comportamentos específicos), ADR-007 (CONTRACTED_SCOPE schema) |
| FR-003 | subagent-martech verifica existência | ADR-015 (subagent-martech), ADR-007 (MARTECH_STACK condicional) |
| FR-004 | HITL 2 payload estruturado | ADR-015 (HITL 2), ADR-010 (LangGraph interrupt) |
| FR-005 | Guardrail de input | ADR-017 (Knowledge Layers Guardrails), `.claude/rules/caixa-preta.md` |
| FR-006 | Guardrail de output (PII + sensitive) | ADR-017 (guardrails) |
| FR-007 | Guardrail de acesso CONTRACTED_SCOPE | ADR-007 (E8 acesso restrito), `.claude/rules/caixa-preta.md` |
| FR-008 | Três ciclos de execução | ADR-015 (ciclos de execução) |
| FR-009 | wiki_entities.embedding vector(768) | ADR-007 (schema atualizado), ADR-003 (pgvector) |
| FR-010 | search_wiki e consultar_ontologia via pgvector | ADR-007 (migração semantic RAG), ADR-003 |
| FR-011 | Pipelines pós-HITL 2 | ADR-015 (pipelines pós-HITL), ADR-013 (LLMGraphTransformer) |
| FR-012 | Wiki Ontológica 9 entidades | ADR-007 (schema v2), `.claude/rules/caixa-preta.md` |
| FR-013 | Gate PRE_ACTIVE → ACTIVE | ADR-007 (Type A lifecycle) |
| FR-014 | Wizard 4 passos com proposta obrigatória | ADR-015 (Ciclo 1 trigger) |
| FR-015 | Dual HITL para reuniões | ADR-016 (Meeting Processing CAG/RAG) |

---

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-05-15 | Versão original — Oracle como LangGraph 2-nós, 6 entidades hardcoded, HITL gate simples por entidade. Cobertura de FR-180 a FR-185, BR-021, JN-13, JN-15, T-34/35/36/39. |
| 2.0 | 2026-06-23 | Reescrita completa motivada pelo redesign do Oracle como deep agent (design doc `2026-06-23-oracle-deep-agent-design.md`). Migração para 9 entidades backbone Type A (ADR-007 v2). Arquitetura de subagentes em paralelo (ADR-015). HITL 2 via LangGraph interrupt. Dual HITL para reuniões (ADR-016). Guardrails de input/output/acesso (ADR-017). RAG semântica via pgvector (FR-009, FR-010). 3 ciclos de execução (onboarding, periódico, por evento). |
