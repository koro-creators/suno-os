---
spec-id: SPEC-016
slug: meeting-capture-processing
artefato: spec
nivel-sdd: spec-anchored
tamanho: medium
status: rascunho
criada: 2026-06-23
atualizada: 2026-06-23
versao: 1.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + Python 3.11"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: "Captura, sanitização (HITL 1), processamento CAG/RAG e integração com ontologia (HITL 2) de atas de reunião de cliente"
upstream:
  - docs/brd/parte3-requisitos.md (BR-023)
  - docs/adr/ADR-016-meeting-processing-cag-rag.md (ADR-016)
  - docs/adr/ADR-017-knowledge-layers-guardrails.md (ADR-017)
  - docs/specs/large/onboarding-oraculo-cliente/spec.md (SPEC-015 v2)
---

# SPEC-016 — Captura e Processamento de Atas de Reunião

## 1. Resumo

### Problema

Reuniões com clientes contêm dois tipos de conteúdo coexistentes e incompatíveis:

1. **Informação estratégica valiosa:** decisões sobre produto, posicionamento, objetivos de negócio, mudanças de escopo — conteúdo que deveria alimentar e atualizar a ontologia do cliente mantida pelo Oracle.
2. **Conteúdo sensível intransigente:** PII de pessoas não cadastradas, informações de RH (promoções, demissões, avaliações), vida pessoal dos participantes, fofoca organizacional, planos de reestruturação confidenciais — conteúdo que nunca deve ser processado por AI nem exposto a outros usuários.

O pipeline de documentos da Biblioteca (SPEC-011, ADR-008) não distingue esses dois tipos — aplica RAG semântico diretamente. Alimentá-lo com atas brutas violaria as regras da caixa-preta (RN-009/010/011) e exporia dados sensíveis no output do Oracle.

Adicionalmente, o padrão de consulta de reuniões varia com o tempo: atas recentes são consultadas de forma integral ("o que foi decidido sobre X nessa reunião?"), enquanto atas antigas são consultadas de forma pontual e retrospectiva. Um único mecanismo de retrieval não atende bem os dois padrões.

### Solução

A solução adota dois controles humanos obrigatórios (Dual HITL) e um mecanismo de retrieval híbrido (CAG para hot, RAG para cold):

- **HITL 1 — Content Safety:** um revisor humano (Admin Suno ou Sponsor do cliente) sanitiza a ata antes de qualquer processamento por AI. Somente o conteúdo aprovado pelo revisor entra no pipeline.
- **HITL 2 — Ontology Update Proposal:** quando o Oracle identifica informação que atualiza ou contradiz uma entidade da ontologia, propõe a mudança com evidência (trecho exato da ata). Um revisor aprova ou rejeita antes de qualquer escrita no banco.
- **CAG para atas hot (< 60 dias):** transcript sanitizado completo injetado no contexto — preserva thread de conversa para queries de decisão.
- **RAG para atas cold (≥ 60 dias):** chunks semânticos indexados em pgvector — escala para backlog longo sem saturar context window.

<!-- REVIEW: O threshold de 60 dias é adequado para o ritmo de reuniões dos clientes Suno? Pode ser configurável por cliente? -->

---

## 2. Personas

### 2.1 Admin Suno

**Papel:** Membro da equipe interna Suno com role `admin`.

**Jornadas:**
- Recebe notificação de nova ata pendente de revisão HITL 1.
- Revisa o conteúdo bruto, remove itens sensíveis, aprova a versão sanitizada.
- Recebe proposals de HITL 2 gerados pelo Oracle e aprova/rejeita atualizações ontológicas.
- Acessa todas as atas e reuniões do cliente (incluindo conteúdo sanitizado).

### 2.2 Sponsor do Cliente

**Papel:** Representante do cliente com role `sponsor`.

**Jornadas:**
- Pode visualizar atas sanitizadas do seu próprio cliente.
- Pode aprovar/rejeitar proposals HITL 2 (se delegado pelo Admin Suno).
- Não vê o conteúdo bruto pré-HITL 1.
- Não vê atas de outros clientes (caixa-preta).

### 2.3 Analista / Operador

**Papel:** Usuário operacional com role `operator` ou `viewer`.

**Jornadas:**
- Usa o chat com Oracle e Koro — o contexto de reuniões é injetado automaticamente via CAG/RAG, de forma transparente.
- Não acessa diretamente o painel de atas.
- Não participa do processo de revisão HITL.

<!-- REVIEW: O Analista deve ter acesso de leitura ao painel de atas (somente visualização, sem aprovar)? Isso não está definido no design doc original. -->

---

## 3. Requisitos Funcionais

### FR-001 — Formatos de upload aceitos

O sistema deve aceitar upload de ata de reunião nos seguintes formatos:

- PDF (ata escrita ou exportação de transcrição)
- DOCX (ata em Word)
- Transcrição exportada do Google Meet (`.txt` ou `.vtt`)
- Transcrição exportada do Zoom (`.txt`)

O upload deve registrar a ata com `indexing_status = 'pending_hitl1'` e `raw_content` preenchido. O conteúdo bruto não deve ser acessível ao pipeline de AI enquanto este status permanecer.

**Campos obrigatórios no upload:** título da reunião, data da reunião, client_id (resolvido do contexto do usuário).

### FR-002 — HITL 1: revisão humana de conteúdo (Content Safety)

Após o upload de uma nova ata, um revisor humano (Admin Suno ou Sponsor) deve sanitizar o conteúdo antes de qualquer processamento por AI.

**Itens obrigatórios de remoção (checklist de revisão):**

| Categoria | Exemplos |
|-----------|----------|
| PII de não-cadastrados | Nomes de pessoas físicas não registradas como stakeholders |
| Conteúdo de RH | Promoções, demissões, avaliações de performance, salários |
| Vida pessoal | Férias, família, saúde, situações pessoais mencionadas em reunião |
| Fofoca organizacional | Comentários informais sobre terceiros, rumores, reclamações pessoais |
| Informação de gestão confidencial | Reestruturações, cortes de budget não anunciados, planos de demissão |

**Resultado da aprovação HITL 1:**
- Campo `meeting_transcripts.sanitized_content` preenchido com conteúdo aprovado.
- Campo `indexing_status` atualizado de `pending_hitl1` para `hot`.
- Campos `hitl1_approved_at` e `hitl1_approved_by` preenchidos.

**Gate programático:** Nenhum endpoint de AI acessa `meeting_transcripts` com `indexing_status = 'pending_hitl1'`. O gate é aplicado na camada de aplicação antes de qualquer tool do Oracle.

### FR-003 — Disponibilização via CAG para atas hot

Atas com menos de 60 dias de idade (contados a partir de `created_at`) devem ser disponibilizadas via Context-Augmented Generation (CAG): o transcript sanitizado completo é carregado no contexto do Oracle e do Koro para queries que requerem leitura integral.

**Comportamento de carregamento:**
- Atas hot ordenadas por `meeting_date DESC` (mais recentes primeiro).
- Carregamento até ≈70% da janela de contexto disponível (budget configurável).
- Atas que não couberem no budget permanecem `hot` no banco mas ficam fora do contexto da query corrente; serão incluídas na próxima transição cold.

**Prompt caching:** Prefixo estático do transcript sanitizado deve ser cacheado para reduzir custo em queries repetidas na mesma sessão (via Gemini context caching ou Anthropic `cache_control`).

### FR-004 — Indexação via RAG para atas cold

Atas com 60 dias ou mais de idade devem ser chunadas e indexadas no pgvector para recuperação semântica.

**Parâmetros de chunking:**
- Splitter: `RecursiveCharacterTextSplitter` com separadores `["\n\n", "\n", " "]`.
- `chunk_size = 512` tokens (estimativa conservadora de caracteres ÷ 4).
- `chunk_overlap = 102` tokens (20% de 512 — preserva contexto de fala entre parágrafos).

**Indexação:** mesma infraestrutura AlloyDB + pgvector do ADR-008 (tabela `meeting_chunks`), com `source_type = 'meeting_transcript'` e `meeting_id` como metadata.

**Sem deleção:** `sanitized_content` é preservado após transição cold. O banco é a fonte de verdade; o índice pgvector é derivado e pode ser reconstruído.

### FR-005 — Job diário de transição hot→cold

Um job diário deve identificar atas com `indexing_status = 'hot'` e `created_at < NOW() - INTERVAL '60 days'`, executar a indexação cold (FR-004) e atualizar `indexing_status` para `cold`.

**Idempotência:** O job é idempotente. Falha na transição de uma ata individual é não-fatal — a ata permanece `hot` e será tentada novamente na próxima execução. Erros individuais são logados e não interrompem o processamento das demais atas do lote.

**Sem janela de manutenção:** O job deve ser seguro para execução em horário de pico (sem locks de tabela, sem degradação de queries concorrentes).

### FR-006 — HITL 2: proposta de atualização ontológica

Quando o Oracle Deep Agent (SPEC-015) identifica, ao processar uma ata sanitizada, informação que atualiza ou contradiz uma entidade existente da ontologia do cliente, ele deve emitir uma proposta de atualização via LangGraph `interrupt()` e aguardar revisão humana antes de prosseguir.

**Trigger:** subagente do Oracle detecta divergência ou complemento relevante para uma das 9 entidades backbone (`CLIENT_PROFILE`, `MARKET_CONTEXT`, `COMPETITORS`, `BRAND_VOICE`, `TARGET_PERSONAS`, `LEGAL_CONSTRAINTS`, `BUSINESS_OBJECTIVES`, `CONTRACTED_SCOPE`, `MARTECH_STACK`).

**Comportamento de pausa:** o grafo LangGraph é interrompido via `interrupt()`. Nenhuma escrita em `wiki_entities` ocorre até a decisão humana ser recebida.

**Decisão do revisor:**
- **Aprovado:** Pipeline pós-HITL 2 executa (FR-007, FR-008).
- **Rejeitado:** Mudança descartada. Feedback opcional armazenado para refinamento futuro.

**Limiar de confiança:** Proposals com `confidence < 0.5` podem ser configuradas para auto-skip (sem interromper o grafo) — configurável por cliente via variável de ambiente.

### FR-007 — Payload da proposta HITL 2

Cada proposta emitida pelo Oracle deve incluir os seguintes campos obrigatórios:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `entity_id` | `str` | Identificador da entidade a atualizar (ex: `CLIENT_PROFILE`, `MARKET_CONTEXT`) |
| `evidence_anchor` | `str` | Trecho exato da ata sanitizada que motiva a mudança (citação literal) |
| `proposed_change` | `str` | Diff em formato legível (texto anterior → texto proposto) |
| `confidence` | `float` | Score de confiança do subagente no range 0.0–1.0 |

A UI de revisão deve exibir todos os quatro campos lado a lado para o revisor tomar a decisão.

### FR-008 — Guardrail: somente conteúdo sanitizado entra no pipeline de AI

**Regra absoluta:** O Oracle e qualquer outra ferramenta de AI no sunOS deve acessar exclusivamente `meeting_transcripts.sanitized_content` — nunca `raw_content`.

**Implementação programática:**
- Toda query de acesso a reuniões deve incluir `hitl1_approved_at IS NOT NULL` como condição obrigatória.
- `indexing_status = 'pending_hitl1'` deve ser tratado como inexistência pelo pipeline de AI (retorno vazio, não erro).
- O endpoint de aprovação HITL 1 é o único que lê `raw_content` (para exibição ao revisor humano).

Isso faz parte do Guardrail 1 (Input) definido no ADR-017.

### FR-009 — Controle de acesso por role

O acesso a atas de reunião deve ser restrito de acordo com o papel do usuário:

| Role | O que pode acessar |
|------|--------------------|
| `admin` | Todas as atas do cliente (raw + sanitized), painel HITL 1, proposals HITL 2 |
| `sponsor` | Atas sanitizadas do seu cliente, proposals HITL 2 (se delegado) |
| `operator`, `viewer` | Apenas via contexto injetado automaticamente no chat (CAG/RAG) — sem acesso direto ao painel |

**Caixa-preta (RN-010):** Endpoints de atas retornam 404 genérico (nunca 403) para `meeting_id` de outro cliente — não revelam a existência do recurso. `client_id` deve ser coluna de filtro obrigatória em toda query (padrão `.claude/rules/caixa-preta.md`).

---

## 4. Requisitos Não-Funcionais

### NFR-001 — SLA de resolução do HITL 1

A aprovação do HITL 1 deve ocorrer em menos de 24 horas após o upload da ata (SLA interno). Superado o prazo sem aprovação, o sistema deve:
- Emitir notificação de escalada para Admin Suno.
- Manter a ata em `pending_hitl1` (não processar automaticamente sem revisão humana).

### NFR-002 — Latência de disponibilização pós-HITL 1

Após a aprovação do HITL 1, a ata deve estar disponível via CAG no contexto do Oracle em menos de 5 minutos. O `indexing_status` passa de `pending_hitl1` para `hot` de forma síncrona com a chamada de aprovação — sem job assíncrono intermediário para o path hot.

### NFR-003 — Parâmetros de chunking cold

O chunking de atas cold deve usar parágrafo como unidade semântica com sobreposição de 20%:
- `chunk_size = 512`
- `chunk_overlap = 102` (exatamente 20% de 512)
- Separadores: `["\n\n", "\n", " "]` (parágrafos → linhas → palavras)

Esses parâmetros são consistentes com o padrão ADR-008 (Biblioteca), garantindo paridade de qualidade de retrieval entre L2 e L4.

### NFR-004 — Isolamento de client_id

Nenhuma query de ata pode retornar resultados de outro cliente. `client_id` deve ser coluna denormalizada em `meeting_transcripts` e `meeting_chunks`, presente como filtro obrigatório em todas as queries — sem dependência de JOIN para derivar o cliente.

### NFR-005 — Preservação do conteúdo bruto

`raw_content` não deve ser deletado após HITL 1 ou após transição cold. O banco é a fonte de verdade; índices são derivados e reconstruíveis. Retenção conforme política de dados do cliente.

---

## 5. Critérios de Aceite

### CA-001 (cobre FR-001)
**Dado** que um Admin Suno acessa o painel de upload de atas,  
**Quando** faz upload de um arquivo PDF, DOCX, `.txt` ou `.vtt` com título e data preenchidos,  
**Então** o sistema registra a ata com `indexing_status = 'pending_hitl1'`, exibe notificação de "aguardando revisão" e não disponibiliza o conteúdo para nenhuma ferramenta de AI.

### CA-002 (cobre FR-001)
**Dado** que um Admin Suno tenta fazer upload de um formato não suportado (ex: `.mp3`, `.mp4`),  
**Quando** submete o arquivo,  
**Então** o sistema retorna erro de validação "Formato não suportado" sem criar registro no banco.

### CA-003 (cobre FR-002)
**Dado** que existe uma ata com `indexing_status = 'pending_hitl1'`,  
**Quando** o revisor aprova com `sanitized_content` preenchido,  
**Então** o sistema atualiza `indexing_status` para `'hot'`, registra `hitl1_approved_at` e `hitl1_approved_by`, e a ata passa a ser acessível via CAG em até 5 minutos (NFR-002).

### CA-004 (cobre FR-002)
**Dado** que o Oracle recebe uma query sobre reuniões de um cliente,  
**Quando** existe uma ata com `indexing_status = 'pending_hitl1'`,  
**Então** o Oracle não recebe nenhum conteúdo daquela ata — como se ela não existisse.

### CA-005 (cobre FR-003)
**Dado** que existem 3 atas com `indexing_status = 'hot'` (< 60 dias) para um cliente,  
**Quando** o Oracle executa uma query que exige contexto de reuniões,  
**Então** os três transcripts sanitizados são injetados no contexto, ordenados do mais recente para o mais antigo, sem fragmentação por chunks.

### CA-006 (cobre FR-003 + NFR-001)
**Dado** que um cliente tem 20 atas hot que somadas excedem 70% do context window,  
**Quando** o Oracle carrega reuniões,  
**Então** apenas as atas mais recentes que cabem no budget de tokens são incluídas, sem erro de runtime; as demais permanecem `hot` no banco.

### CA-007 (cobre FR-004)
**Dado** que uma ata tem `indexing_status = 'hot'` e `created_at < NOW() - INTERVAL '60 days'`,  
**Quando** o job diário executa,  
**Então** a ata é chunada com `chunk_size=512` e `chunk_overlap=102`, indexada em `meeting_chunks` no pgvector, e `indexing_status` é atualizado para `'cold'`.

### CA-008 (cobre FR-005)
**Dado** que o job de transição falha ao processar uma ata específica (ex: erro de embedding),  
**Quando** o job completa,  
**Então** a ata problemática permanece `hot` (não vai para um estado de erro terminal), o erro é logado, e as demais atas do lote são processadas normalmente.

### CA-009 (cobre FR-006)
**Dado** que o Oracle lê uma ata sanitizada e identifica que a entidade `MARKET_CONTEXT` deve ser atualizada,  
**Quando** o subagente detecta a divergência com confiança ≥ 0.5,  
**Então** o grafo LangGraph é interrompido via `interrupt()`, nenhuma escrita ocorre em `wiki_entities`, e o revisor recebe a proposta com os 4 campos obrigatórios (FR-007).

### CA-010 (cobre FR-006)
**Dado** que o Oracle emite uma proposta de atualização ontológica com `confidence = 0.3`,  
**E** o limiar de confiança do cliente está configurado em `min_confidence_for_hitl2 = 0.5`,  
**Quando** o subagente tenta emitir o interrupt,  
**Então** a proposta é descartada silenciosamente, o grafo continua sem interrupção, e nenhuma escrita em `wiki_entities` ocorre.

### CA-011 (cobre FR-007)
**Dado** que o revisor recebe uma proposta HITL 2,  
**Quando** visualiza o painel de revisão,  
**Então** vê exibidos: `entity_id` (qual entidade), `evidence_anchor` (trecho exato da ata), `proposed_change` (diff antes/depois), `confidence` (score numérico) — todos obrigatórios, sem campo ausente.

### CA-012 (cobre FR-007 + FR-006)
**Dado** que o revisor aprova uma proposta HITL 2,  
**Quando** a aprovação é confirmada,  
**Então** o pipeline pós-HITL 2 executa: (1) `wiki_entities.content` é atualizado com o texto proposto, (2) embedding é recomputado via `text-embedding-004` e atualizado em `wiki_entities.embedding`, (3) `LLMGraphTransformer` extrai entidades nomeadas para `knowledge_entities` com `badge='oracle_seed'`.

### CA-013 (cobre FR-007 + FR-006)
**Dado** que o revisor rejeita uma proposta HITL 2,  
**Quando** a rejeição é confirmada,  
**Então** nenhuma escrita ocorre em `wiki_entities`, o feedback opcional é armazenado, e o grafo do Oracle retoma a execução normal.

### CA-014 (cobre FR-008)
**Dado** que existe uma ata com `raw_content` preenchido e `sanitized_content` nulo (não aprovada),  
**Quando** qualquer tool do Oracle tenta buscar conteúdo de reuniões daquele cliente,  
**Então** a ata não aparece nos resultados — tanto na busca CAG quanto no índice RAG — como se não existisse.

### CA-015 (cobre FR-009)
**Dado** que um usuário com role `operator` tenta acessar diretamente o painel de atas,  
**Quando** faz a requisição,  
**Então** recebe 404 genérico (não 403) — sem revelar a existência do painel ou das atas.

### CA-016 (cobre FR-009 + NFR-004)
**Dado** que um usuário com role `admin` do Cliente A tenta acessar ata do Cliente B (por manipulação de ID),  
**Quando** faz a requisição,  
**Então** recebe 404 genérico — sem revelar que o recurso existe em outro cliente (caixa-preta RN-010).

### CA-017 (cobre NFR-001)
**Dado** que uma ata foi uploadada e está `pending_hitl1` há mais de 24 horas,  
**Quando** o SLA é atingido sem aprovação,  
**Então** o sistema emite notificação de escalada para Admin Suno e mantém a ata em `pending_hitl1` sem auto-processar.

---

## 6. Fora de Escopo

Os seguintes itens estão explicitamente fora do escopo desta SPEC:

- **Gravação automática de reuniões:** integração com API do Google Meet ou Zoom para captura automática de transcrições (future scope — requer análise de privacidade e consentimento).
- **Integração com Google Calendar:** detecção automática de reuniões do calendário e pré-criação de registros (future scope — SPEC separada).
- **Transcrição automática de áudio:** upload de arquivos de áudio/vídeo com transcrição automática por Whisper ou Speech-to-Text (future scope).
- **Edição colaborativa da ata:** múltiplos revisores editando a ata simultaneamente em tempo real (out of scope para o piloto — HITL 1 é single-reviewer).
- **Versionamento de atas sanitizadas:** histórico de edições do `sanitized_content` (future scope — por ora, last-write-wins).
- **Configuração de threshold por cliente via UI:** `min_confidence_for_hitl2` é configurável via variável de ambiente no piloto, não via interface de usuário.

---

## 7. Dependências

### 7.1 SPEC-015 v2 — Oracle Deep Agent

SPEC-016 e SPEC-015 são complementares: SPEC-016 define o ciclo de vida da ata (upload → HITL 1 → CAG/RAG), enquanto SPEC-015 define o agente que consome as atas sanitizadas (CAG/RAG) e emite proposals HITL 2 via `interrupt()`.

**Contrato entre specs:**
- SPEC-015 lê de `meeting_transcripts` somente registros com `hitl1_approved_at IS NOT NULL` — gate definido em SPEC-016.
- SPEC-015 emite `OntologyUpdateProposal` com os campos de FR-007 — estrutura definida em SPEC-016.
- SPEC-016 não define o comportamento interno do Oracle após HITL 2 — isso é responsabilidade de SPEC-015.

### 7.2 ADR-016 — Meeting Processing CAG/RAG

Fonte decisional dos mecanismos técnicos de CAG (FR-003), RAG (FR-004), job hot→cold (FR-005), e dual HITL (FR-002, FR-006). Esta SPEC traduz as decisões do ADR-016 em requisitos verificáveis com critérios de aceite.

### 7.3 ADR-017 — Knowledge Layers & Guardrails

Fonte do Guardrail 1 (Input) que formaliza FR-008, e do Guardrail 3 (Acesso) que formaliza FR-009. A prioridade de retrieval L1 > L2 > L5 > L3 > L4 (reuniões como L4) é definida no ADR-017 e impacta como o Oracle ordena fontes de contexto ao usar atas.

### 7.4 Caixa-preta (RN-009/010/011)

Regras de segurança de isolamento de cliente aplicadas em FR-009, CA-015 e CA-016. Documentadas em `.claude/rules/caixa-preta.md`.

### 7.5 ADR-008 — RAG AlloyDB + pgvector

A infra de pgvector usada para atas cold (FR-004) reutiliza o mesmo cluster AlloyDB e o mesmo padrão de chunking/indexação definidos no ADR-008 para a Biblioteca (L2). Tabela `meeting_chunks` segue o mesmo schema de `document_search.py`, com `source_type = 'meeting_transcript'` diferenciando os registros.

### 7.6 ADR-013 — GraphRAG LLMGraphTransformer

Pipeline pós-HITL 2 (CA-012, passo 3) usa `LLMGraphTransformer` do ADR-013 para extrair entidades nomeadas do conteúdo aprovado e upsert em `knowledge_entities` com `badge='oracle_seed'`.
