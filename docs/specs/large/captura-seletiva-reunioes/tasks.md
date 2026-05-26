---
spec-id: SPEC-016
slug: captura-seletiva-reunioes
artefato: tasks
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-05-15
atualizada: 2026-05-15
versao: 1.0
---

# Tasks — Captura Seletiva de Reuniões (FA-16)

Backlog atômico de 27 tasks. Cada task é implementável e testável isoladamente (com suas dependências satisfeitas). A ordem dos IDs reflete a sequência sugerida em `plan.md`.

**Convenções.**
- Paths absolutos a partir da raiz do repo (`/Users/heitormiranda/projects/koro/sunos/`).
- **CAs** referenciam `spec.md §7`.
- **Rastreabilidade** = FRs / RNs / ADR-LOCAIs relacionados.
- **Pré-requisito** = TASK-* que deve estar concluída antes.
- Estimativas em dias úteis.

## Resumo

| Fase | Tasks | Estimativa |
|------|-------|------------|
| A — Foundation Backend | A01–A04 | 4–5 dias |
| B — Notify + Upload | B01–B05 | 6–8 dias |
| C — Transcrição | C01–C04 | 5–6 dias |
| D — Agente de Extração | D01–D05 | 6–7 dias |
| E — HITL + Wiki Integration | E01–E05 | 7–8 dias |
| F — RBAC + Audit + Piloto | F01–F04 | 4–5 dias |
| **Total** | **27 tasks** | **32–39 dias** |

---

## Fase A — Foundation Backend

### TASK-A01 — Migration SQL: tabelas de captura

**Fase**: A | **Estimativa**: 1 dia | **Pré-requisito**: nenhum

**Objetivo**: Criar as 5 tabelas de domínio para FA-16 via script de migration numerado sequencialmente.

**Entregáveis**:
- `api/migrations/004_capture_tables.sql` — cria `meeting_captures`, `meeting_transcripts`, `extraction_items`, `wiki_proposals`, `capture_allowlist` com índices, constraints e colunas `client_id` redundantes para cross-tenant guard

**Critérios de Pronto**:
- [ ] Tabela `meeting_captures`: colunas `id`, `client_id`, `organizer_user_id`, `meeting_type`, `status` (enum: PENDING_UPLOAD | UPLOADING | TRANSCRIBING | EXTRACTING | AWAITING_REVIEW | DONE | ABORTED), `audio_gcs_path`, `created_at`, `updated_at`
- [ ] Tabela `meeting_transcripts`: colunas `id`, `capture_id` (FK), `client_id`, `content_jsonb` (utterances com speaker + timestamp), `raw_text`, `duration_seconds`, `created_at`
- [ ] Tabela `extraction_items`: colunas `id`, `capture_id` (FK), `client_id`, `item_type` (enum: DECISION | NEXT_STEP | ENTITY | BRIEFING), `content`, `confidence` (float 0–1), `source_timestamp_start`, `source_timestamp_end`, `created_at`
- [ ] Tabela `wiki_proposals`: colunas `id`, `capture_id` (FK), `client_id`, `extraction_item_id` (FK nullable), `entity_slug`, `before_content`, `proposed_content`, `status` (enum: PENDING | ACCEPTED | EDITED_ACCEPTED | REJECTED), `reviewed_by`, `reviewed_at`, `created_at`
- [ ] Tabela `capture_allowlist`: colunas `id`, `client_id`, `meeting_type`, `scope` (CLIENT | GLOBAL), `created_by`, `created_at`
- [ ] Todos os índices em `client_id`, `capture_id` e colunas de status criados
- [ ] Script executa sem erro em banco de desenvolvimento limpo
- [ ] Script é idempotente com `IF NOT EXISTS`

**Rastreabilidade**: RF-01, RF-03, RF-06; CA-01, CA-02

---

### TASK-A02 — SQLAlchemy models + Pydantic schemas

**Fase**: A | **Estimativa**: 1 dia | **Pré-requisito**: TASK-A01

**Objetivo**: Criar os modelos ORM e schemas de validação para todas as entidades de captura.

**Entregáveis**:
- `api/captures/__init__.py` — init do módulo
- `api/captures/models.py` — classes SQLAlchemy: `MeetingCapture`, `MeetingTranscript`, `ExtractionItem`, `WikiProposal`, `CaptureAllowlist`
- `api/captures/schemas.py` — Pydantic v2: `CaptureCreate`, `CaptureResponse`, `ParticipantCreate`, `TranscriptResponse`, `ExtractionItemResponse`, `ProposalReview`, `ProposalBatchResponse`, `AllowlistEntry`

**Critérios de Pronto**:
- [ ] Enums `CaptureStatus`, `ExtractionItemType`, `ProposalStatus` definidos em `schemas.py` e importados nos models
- [ ] `CaptureCreate` valida `meeting_type` contra allowlist (campo, não lógica — lógica fica no service)
- [ ] `ProposalReview` aceita `action: Literal["accept", "edit_accept", "reject"]` e campo `edited_content: str | None`
- [ ] Relacionamentos ORM (`capture.transcripts`, `capture.extraction_items`, `capture.proposals`) definidos com `lazy="select"`
- [ ] `from api.captures.schemas import CaptureCreate` importa sem erro em ambiente de testes
- [ ] Sem campos de outro cliente expostos (sem JOINs cruzados nos relacionamentos)

**Rastreabilidade**: RF-01, RF-04, RF-05, RF-06; CA-01, CA-13

---

### TASK-A03 — CaptureRouter stubs (501 Not Implemented)

**Fase**: A | **Estimativa**: 0,5 dia | **Pré-requisito**: TASK-A02

**Objetivo**: Registrar todos os endpoints de captura no FastAPI com respostas 501, garantindo contratos de URL antes da implementação.

**Entregáveis**:
- `api/captures/router.py` — FastAPI `APIRouter` com prefixo `/api/captures`, todos os endpoints declarados
- `api/main.py` — adição de `app.include_router(capture_router)`

**Critérios de Pronto**:
- [ ] Endpoints declarados: `POST /`, `GET /{capture_id}`, `GET /{capture_id}/status`, `GET /{capture_id}/transcript`, `POST /{capture_id}/audio`, `POST /{capture_id}/proposals`, `PATCH /proposals/{proposal_id}`, `GET /allowlist`, `POST /allowlist`, `DELETE /allowlist/{entry_id}`
- [ ] Todos retornam `HTTP 501 Not Implemented` com body `{"detail": "not implemented"}`
- [ ] `GET /` (listar) não existe — prevenção de enumeração (RN-009)
- [ ] `npx tsc --noEmit` passa no frontend sem erros (mudança é só backend)
- [ ] `uvicorn api.main:app` sobe sem erro de import

**Rastreabilidade**: RF-01, RF-02, RF-03, RF-04, RF-05, RF-06; CA-01

---

### TASK-A04 — CaptureService: allow-list check, RBAC gate, audit log writer

**Fase**: A | **Estimativa**: 1,5 dias | **Pré-requisito**: TASK-A03

**Objetivo**: Implementar a camada de serviço com as três funções transversais que todos os endpoints usarão.

**Entregáveis**:
- `api/captures/service.py` — classe `CaptureService` com métodos: `check_allowlist(client_id, meeting_type)`, `require_capture(capture_id, client_id)` (retorna 404 genérico se inexistente ou cross-tenant), `gate_transcript_access(capture, user)` (404 para Operacional não-participante), `write_audit(action, capture_id, user_id, detail)`
- `api/captures/audit.py` — `AuditWriter` que insere em tabela de audit log existente com campos `action`, `resource_id`, `client_id`, `user_id`, `detail_jsonb`, `severity`

**Critérios de Pronto**:
- [ ] `require_capture` faz SELECT com filtro `AND client_id = current_client_id` — nunca SELECT por `id` isolado seguido de comparação de `client_id`
- [ ] `require_capture` lança `HTTPException(status_code=404, detail="Captura não disponível")` — jamais 403
- [ ] `gate_transcript_access` retorna 404 para Operacional que não está em `capture.participants` — caixa-preta pattern
- [ ] `check_allowlist` consulta `capture_allowlist` filtrando por `client_id` e por `scope = GLOBAL`; retorna `bool`
- [ ] `write_audit` é chamado de dentro da transação do caller (recebe `db` session)
- [ ] Testes unitários de `require_capture` e `gate_transcript_access` com mocks de DB passam

**Rastreabilidade**: RF-01, RF-06; RN-009, RN-011, RN-031; CA-15, CA-16, ADR-LOCAL-01

---

## Fase B — Notify + Upload

### TASK-B01 — Notifier: email de aviso a participantes

**Fase**: B | **Estimativa**: 1 dia | **Pré-requisito**: TASK-A04

**Objetivo**: Implementar o serviço de notificação obrigatória que avisa participantes antes de qualquer gravação ser processada.

**Entregáveis**:
- `api/captures/notifier.py` — `ParticipantNotifier` com método `notify_all(capture, participants)`: envia email via SendGrid/SMTP com link de política de privacidade; lança `NotificationFailedError` se qualquer envio falhar; timeout por envio de 30s; total máximo de 2 min
- `api/captures/schemas.py` — adicionar `NotificationResult` e `NotificationFailedError`

**Critérios de Pronto**:
- [ ] Se qualquer email falhar (bounce, timeout, SMTP error), lança `NotificationFailedError` — captura é abortada (status `ABORTED`) pelo caller
- [ ] Tempo total de `notify_all` não excede 120s (deadline da RN-032); implementado com `asyncio.wait_for`
- [ ] Email contém: nome do participante, nome da reunião, link de privacidade configurável por cliente, instrução de opt-out
- [ ] `notify_all` em modo mock (sem `SENDGRID_API_KEY`) loga aviso e retorna sucesso — sem crash em desenvolvimento
- [ ] Testes unitários com mock de SMTP: cenário de sucesso, cenário de falha parcial (1 de 3 falha), cenário de timeout

**Rastreabilidade**: RF-02; RN-032; CA-03, CA-04

---

### TASK-B02 — Endpoint de upload de áudio para GCS

**Fase**: B | **Estimativa**: 1,5 dias | **Pré-requisito**: TASK-B01

**Objetivo**: Implementar o endpoint `POST /api/captures/{capture_id}/audio` que recebe o arquivo, valida formato e faz streaming para GCS.

**Entregáveis**:
- `api/captures/router.py` — implementar `POST /{capture_id}/audio` (substituir stub 501)
- `api/captures/storage.py` — `GCSUploader` com método `upload_audio(capture_id, client_id, file, ext)`: faz streaming multipart para `gs://sunos-captures/{client_id}/{capture_id}/audio.{ext}`; retorna GCS URI

**Critérios de Pronto**:
- [ ] Formatos aceitos: `.mp3`, `.mp4`, `.m4a`, `.wav`, `.webm` — qualquer outro retorna HTTP 422 com detalhe de formato inválido
- [ ] Tamanho máximo: 2 GB — excedido retorna HTTP 413
- [ ] GCS path segue convenção exata: `sunos-captures/{client_id}/{capture_id}/audio.{ext}`
- [ ] Upload é streaming (não carrega arquivo inteiro em memória) — usa `google-cloud-storage` upload em chunks
- [ ] Após upload bem-sucedido: atualiza `meeting_captures.audio_gcs_path` e `status = TRANSCRIBING`; dispara `BackgroundTask` de transcrição (TASK-C02)
- [ ] Falha no GCS retorna HTTP 502 e não altera status da captura
- [ ] `require_capture` é chamado antes do upload (cross-tenant guard)

**Rastreabilidade**: RF-03; CA-05, CA-06, ADR-LOCAL-02

---

### TASK-B03 — Allow-list CRUD endpoints

**Fase**: B | **Estimativa**: 1 dia | **Pré-requisito**: TASK-A04

**Objetivo**: Permitir que Admin configure quais tipos de reunião podem ser capturadas, por cliente ou globalmente.

**Entregáveis**:
- `api/captures/router.py` — implementar `GET /allowlist`, `POST /allowlist`, `DELETE /allowlist/{entry_id}` (substituir stubs 501)

**Critérios de Pronto**:
- [ ] `GET /allowlist` filtra por `client_id` do JWT — nunca retorna entries de outro cliente
- [ ] `POST /allowlist` exige role Admin ou Líder; valida `meeting_type` não-vazio e `scope` em `[CLIENT, GLOBAL]`
- [ ] `DELETE /allowlist/{entry_id}` exige role Admin; retorna 404 (não 403) se entry não existe ou pertence a outro cliente
- [ ] `scope = GLOBAL` só pode ser criado por Admin com flag `is_platform_admin=true`
- [ ] Testes unitários: criação por Admin, tentativa de criação por Operacional (deve retornar 404 — caixa-preta), listagem filtrada por cliente

**Rastreabilidade**: RF-01; RN-009, RN-011; CA-01, CA-02

---

### TASK-B04 — Frontend: CaptureInitForm, ParticipantList, AudioUploader

**Fase**: B | **Estimativa**: 2 dias | **Pré-requisito**: TASK-B02

**Objetivo**: Criar os três componentes React do fluxo de nova captura.

**Entregáveis**:
- `components/captures/CaptureInitForm.tsx` — formulário com campos: título da reunião, tipo (dropdown populado da allowlist), data/hora; submit chama `POST /api/captures`
- `components/captures/ParticipantList.tsx` — lista editável de participantes (add por email, remove); exibe status de notificação por participante (pendente / enviado / falhou)
- `components/captures/AudioUploader.tsx` — drag-and-drop ou file picker; barra de progresso de upload; exibe erro de formato/tamanho antes do envio; estado desabilitado enquanto notificações pendentes

**Critérios de Pronto**:
- [ ] Todos os componentes usam `'use client'` e inline styles (sem classes Tailwind)
- [ ] Design tokens: `--void`, `--deep`, `--nebula`, `--sun`, `--text-primary`, `--border-subtle` — sem hex hardcoded
- [ ] `AudioUploader` bloqueia submit se `notification_status !== 'all_sent'`
- [ ] `AudioUploader` valida extensão no cliente antes do POST (`.mp3 .mp4 .m4a .wav .webm`)
- [ ] `ParticipantList` exibe badge por participante com cor `--sun` para enviado, vermelho para falhou
- [ ] `npx tsc --noEmit` passa após criação dos componentes

**Rastreabilidade**: RF-01, RF-02, RF-03; CA-03, CA-05

---

### TASK-B05 — Página nova captura (T-43)

**Fase**: B | **Estimativa**: 1 dia | **Pré-requisito**: TASK-B04

**Objetivo**: Montar a página completa de criação de captura compondo os três componentes de TASK-B04.

**Entregáveis**:
- `app/clientes/[clientSlug]/captures/new/page.tsx` — page Server Component que resolve `clientSlug` para `client_id`; renderiza `CaptureInitForm` + `ParticipantList` + `AudioUploader` em sequência de 3 passos (wizard linear)

**Critérios de Pronto**:
- [ ] Rota `/clientes/[clientSlug]/captures/new` acessível sem erro 404
- [ ] Fluxo de 3 passos: (1) dados da reunião, (2) participantes + notificação, (3) upload — avança só quando passo anterior concluído
- [ ] Passo 2 exibe spinner e resultado de `notify_all` antes de habilitar passo 3
- [ ] Em caso de falha de notificação: exibe mensagem "Notificação falhou — captura cancelada" e redireciona para listagem
- [ ] `npx tsc --noEmit` passa

**Rastreabilidade**: RF-01, RF-02, RF-03; CA-03, CA-04, CA-05

---

## Fase C — Transcrição

### TASK-C01 — transcriber.py: integração Google STT

**Fase**: C | **Estimativa**: 2 dias | **Pré-requisito**: TASK-B02

**Objetivo**: Implementar o cliente de transcrição que envia áudio do GCS para Google Cloud Speech-to-Text v2 com diarização e retorna utterances estruturadas.

**Entregáveis**:
- `api/captures/transcriber.py` — `Transcriber` com método `transcribe(gcs_uri, language_code)`: chama `google.cloud.speech_v2`; habilita `speaker_diarization` (max 6 speakers); retorna lista de `Utterance(speaker_tag, start_time, end_time, text)`; máximo de 1h de áudio (rejeita com erro claro se exceder)
- `api/captures/schemas.py` — adicionar `Utterance`, `TranscriptContent`

**Critérios de Pronto**:
- [ ] Diarização habilitada: `DiarizationConfig(enable_speaker_diarization=True, min_speaker_count=1, max_speaker_count=6)`
- [ ] Retorna erro explícito `AudioTooLongError` se duração > 3600s
- [ ] Conteúdo persistido em `meeting_transcripts.content_jsonb` como lista de `Utterance` serializada
- [ ] Modo mock (sem `GOOGLE_APPLICATION_CREDENTIALS`): retorna transcript sintético de 3 utterances — sem crash em desenvolvimento
- [ ] Testes unitários com mock de `SpeechClient`: resposta com 2 speakers, caso de áudio > 1h (deve lançar `AudioTooLongError`)

**Rastreabilidade**: RF-03; RN-013; CA-07, CA-08, ADR-LOCAL-03

---

### TASK-C02 — BackgroundTask de STT: disparo e checkpoint

**Fase**: C | **Estimativa**: 1 dia | **Pré-requisito**: TASK-C01

**Objetivo**: Integrar `Transcriber` como tarefa assíncrona disparada após upload, com atualização de status na tabela `meeting_captures`.

**Entregáveis**:
- `api/captures/tasks.py` — função `run_transcription(capture_id: str, db: Session)`: busca captura, chama `Transcriber.transcribe`, persiste `MeetingTranscript`, atualiza `capture.status = EXTRACTING` (ou `ABORTED` em falha)
- `api/captures/router.py` — no endpoint de upload, adicionar `background_tasks.add_task(run_transcription, capture_id, db)`

**Critérios de Pronto**:
- [ ] `capture.status` atualizado para `TRANSCRIBING` imediatamente ao início; `EXTRACTING` ao término com sucesso; `ABORTED` em falha com `detail` do erro gravado
- [ ] Falha de STT não propaga exceção para o processo principal (capturada dentro de `run_transcription`)
- [ ] Log estruturado com `capture_id`, `client_id`, `duration_seconds`, `status_transition` em cada transição
- [ ] Transcrição salva em `meeting_transcripts` com `capture_id` e `client_id` corretos (cross-tenant safe)

**Rastreabilidade**: RF-03; CA-07, CA-08, CA-09

---

### TASK-C03 — Frontend: TranscriptViewer

**Fase**: C | **Estimativa**: 1,5 dias | **Pré-requisito**: TASK-C01

**Objetivo**: Criar o componente de visualização da transcrição com speaker labels, timestamps e gate de RBAC no frontend.

**Entregáveis**:
- `components/captures/TranscriptViewer.tsx` — renderiza lista de utterances agrupadas por speaker; exibe `Speaker 1`, `Speaker 2` etc. (ou nome se disponível); timestamp HH:MM:SS clicável para jump; gate: se `transcript === null` (usuário sem acesso), exibe placeholder "Transcrição não disponível" sem mencionar motivo

**Critérios de Pronto**:
- [ ] RBAC gate no frontend: se API retornar 404 em `GET /transcript`, renderiza `<TranscriptGate />` com mensagem neutra — sem "sem permissão" ou "acesso negado"
- [ ] Speaker labels alternados por cor (variáveis CSS, não hex)
- [ ] Timestamps formatados como `HH:MM:SS` a partir de `start_time` em segundos
- [ ] Componente recebe `transcript: TranscriptContent | null` como prop — sem fetch interno
- [ ] `npx tsc --noEmit` passa

**Rastreabilidade**: RF-03, RF-06; RN-009, RN-011; CA-10, CA-15

---

### TASK-C04 — Polling de status e progress UI (T-44 parcial)

**Fase**: C | **Estimativa**: 1 dia | **Pré-requisito**: TASK-C02

**Objetivo**: Implementar o endpoint de status e o hook de polling no frontend para acompanhamento em tempo real do progresso da captura.

**Entregáveis**:
- `api/captures/router.py` — implementar `GET /{capture_id}/status`: retorna `{ status, progress_percent, updated_at }`; usa `require_capture` para cross-tenant guard
- `hooks/useCaptureStatus.ts` — hook React que faz polling a cada 10s em `GET /api/captures/{captureId}/status`; para automaticamente quando status é `DONE` ou `ABORTED`; retorna `{ status, progressPercent, isTerminal }`
- `components/captures/CaptureProgressBar.tsx` — barra de progresso com label de fase atual baseado em `status`

**Critérios de Pronto**:
- [ ] Fases mapeadas na UI: `UPLOADING → "Enviando áudio"`, `TRANSCRIBING → "Transcrevendo"`, `EXTRACTING → "Extraindo itens"`, `AWAITING_REVIEW → "Pronto para revisão"`, `DONE → "Concluído"`, `ABORTED → "Erro"`
- [ ] Polling para automaticamente (`clearInterval`) quando `isTerminal = true`
- [ ] Hook não faz polling se `captureId` for `null`
- [ ] `GET /{capture_id}/status` retorna 404 (não 403) para capture de outro cliente

**Rastreabilidade**: RF-03; CA-09, CA-11

---

## Fase D — Agente de Extração

### TASK-D01 — extractor.py: prompts e constantes

**Fase**: D | **Estimativa**: 1 dia | **Pré-requisito**: TASK-C02

**Objetivo**: Definir os prompts de extração para cada tipo de item, com instrução de confiança e referência de timestamp.

**Entregáveis**:
- `api/captures/extractor.py` — módulo com constante `EXTRACTION_PROMPTS: dict[ExtractionItemType, str]`; cada prompt instrui o LLM a: extrair itens do tipo, atribuir `confidence` float 0–1, referenciar `source_timestamp_start` e `source_timestamp_end` das utterances fonte

**Critérios de Pronto**:
- [ ] Prompts para os 4 tipos: `DECISION` (o que foi decidido, por quem, com qual justificativa), `NEXT_STEP` (ação, responsável, prazo mencionado), `ENTITY` (pessoas, empresas, produtos mencionados com contexto), `BRIEFING` (resumo executivo da reunião)
- [ ] Todos os prompts incluem instrução: "Retorne JSON com campos: `content`, `confidence` (0.0–1.0), `source_timestamp_start` (segundos), `source_timestamp_end` (segundos)"
- [ ] Prompts escritos em português (idioma dos conteúdos Suno)
- [ ] Sem vocabulário proibido: não usar "gerar", "otimizar", "eficiência", "accelerator", "smart", "AI-powered"

**Rastreabilidade**: RF-04; CA-12

---

### TASK-D02 — LangGraph StateGraph do extrator

**Fase**: D | **Estimativa**: 2 dias | **Pré-requisito**: TASK-D01

**Objetivo**: Implementar o grafo LangGraph que executa os 4 tipos de extração em paralelo e agrega os resultados.

**Entregáveis**:
- `api/captures/extractor.py` — classe `ExtractionGraph` com `StateGraph`; 4 nodes paralelos: `extract_decisions`, `extract_next_steps`, `extract_entities`, `extract_briefing`; node final `aggregate` que une resultados; método `run(transcript: TranscriptContent) -> list[ExtractionItemCreate]`

**Critérios de Pronto**:
- [ ] Os 4 nodes são executados em paralelo (`asyncio.gather` ou LangGraph parallel edges) — latência = max dos 4, não soma
- [ ] Cada node usa Gemini Flash como LLM padrão (via `langchain_google_genai`)
- [ ] Retorno do LLM validado contra schema `ExtractionItemCreate` via Pydantic — itens malformados descartados com log de aviso
- [ ] `ExtractionGraph` aceita `mock_mode=True` para testes — retorna lista estática de 6 itens sem chamar LLM
- [ ] Timeout por node: 60s; timeout total: 90s

**Rastreabilidade**: RF-04; ADR-LOCAL-04; CA-12, CA-13

---

### TASK-D03 — BackgroundTask de extração: disparo e checkpoint

**Fase**: D | **Estimativa**: 1 dia | **Pré-requisito**: TASK-D02

**Objetivo**: Integrar `ExtractionGraph` como tarefa assíncrona disparada após transcrição, com persistência dos itens extraídos.

**Entregáveis**:
- `api/captures/tasks.py` — adicionar função `run_extraction(capture_id: str, db: Session)`: busca `MeetingTranscript`, chama `ExtractionGraph.run`, persiste lista de `ExtractionItem`, atualiza `capture.status = AWAITING_REVIEW`; em falha: `status = ABORTED`
- `api/captures/tasks.py` — ao final de `run_transcription`, disparar `run_extraction` (chain de background tasks)

**Critérios de Pronto**:
- [ ] `capture.status` atualizado para `EXTRACTING` no início; `AWAITING_REVIEW` no sucesso; `ABORTED` em falha
- [ ] `ExtractionItem` persistidos com `client_id` correto (redundante, para cross-tenant guard)
- [ ] Falha na extração não apaga a transcrição já salva
- [ ] Log estruturado com `capture_id`, `items_extracted`, `item_types`, `duration_ms`

**Rastreabilidade**: RF-04; CA-12, CA-13, CA-14

---

### TASK-D04 — Frontend: ExtractionPanel

**Fase**: D | **Estimativa**: 1,5 dias | **Pré-requisito**: TASK-D02

**Objetivo**: Criar o painel de visualização dos itens extraídos agrupados por tipo com badges de confiança.

**Entregáveis**:
- `components/captures/ExtractionPanel.tsx` — exibe lista de `ExtractionItem` agrupada por `item_type`; para cada item: texto do conteúdo, badge de confiança colorido (verde ≥0.8, amarelo 0.5–0.79, vermelho <0.5), timestamp de referência clicável

**Critérios de Pronto**:
- [ ] Agrupamento por tab ou seção colapsável: Decisões | Próximos Passos | Entidades | Briefing
- [ ] Badge de confiança usa `--sun` para ≥0.8, laranja para 0.5–0.79, vermelho para <0.5 — sem hex hardcoded
- [ ] Timestamp clicável ao lado do item sincroniza `TranscriptViewer` para utterance correspondente (prop callback `onTimestampClick(seconds)`)
- [ ] Componente recebe `items: ExtractionItem[]` como prop — sem fetch interno
- [ ] `npx tsc --noEmit` passa

**Rastreabilidade**: RF-04; CA-12, CA-13

---

### TASK-D05 — Testes unitários do extrator

**Fase**: D | **Estimativa**: 1 dia | **Pré-requisito**: TASK-D02

**Objetivo**: Cobrir o `ExtractionGraph` com testes de unidade usando mocks de LLM e de transcrição.

**Entregáveis**:
- `api/tests/unit/test_extractor.py` — testes unitários com `pytest` + `unittest.mock`

**Critérios de Pronto**:
- [ ] Cenário: transcrição com 5 utterances → 4 tipos de item extraídos (usando `mock_mode=True`)
- [ ] Cenário: LLM retorna JSON malformado → item descartado, demais itens preservados, log de aviso emitido
- [ ] Cenário: LLM retorna `confidence` fora de 0–1 → item descartado (Pydantic valida)
- [ ] Cenário: timeout de node (mock `asyncio.wait_for` para lançar `TimeoutError`) → captura status `ABORTED`
- [ ] Cobertura do módulo `extractor.py` ≥ 80% (`pytest --cov=api/captures/extractor`)

**Rastreabilidade**: RF-04; CA-12, CA-13, CA-14

---

## Fase E — HITL + Wiki Integration

### TASK-E01 — wiki_proposer.py: geração de propostas

**Fase**: E | **Estimativa**: 1,5 dias | **Pré-requisito**: TASK-D03

**Objetivo**: Implementar o gerador de WikiProposals que mapeia extraction_items para propostas de atualização de entidades na Wiki Ontológica.

**Entregáveis**:
- `api/captures/wiki_proposer.py` — classe `WikiProposer` com método `generate_proposals(capture_id, items: list[ExtractionItem], db) -> list[WikiProposalCreate]`: para cada item de tipo relevante (ENTITY, DECISION), busca `wiki_entities` por `entity_slug`; faz snapshot de `before_content`; propõe `proposed_content` via LLM (Gemini Flash); retorna lista de `WikiProposalCreate`

**Critérios de Pronto**:
- [ ] `before_content` é snapshot imutável: lido de `wiki_entities.content` no momento da proposta, nunca atualizado retroativamente
- [ ] Se entidade não existe na Wiki, `before_content = null` e `entity_slug` é inferido do nome da entidade
- [ ] Query de `wiki_entities` filtra `client_id` — sem acesso cross-tenant
- [ ] Modo mock (sem LLM configurado): retorna propostas com `proposed_content = before_content + " [ATUALIZAÇÃO PROPOSTA]"`
- [ ] Método `generate_proposals` é idempotente: segunda chamada com mesmo `capture_id` não duplica propostas existentes

**Rastreabilidade**: RF-05; ADR-LOCAL-05; CA-02, CA-13

---

### TASK-E02 — Endpoint POST /proposals: criação em lote

**Fase**: E | **Estimativa**: 1 dia | **Pré-requisito**: TASK-E01

**Objetivo**: Implementar o endpoint que cria WikiProposals em lote a partir dos extraction_items de uma captura.

**Entregáveis**:
- `api/captures/router.py` — implementar `POST /{capture_id}/proposals` (substituir stub 501): chama `WikiProposer.generate_proposals`, persiste em `wiki_proposals`, retorna `ProposalBatchResponse`

**Critérios de Pronto**:
- [ ] Endpoint exige `capture.status = AWAITING_REVIEW` — retorna 409 em qualquer outro status
- [ ] `require_capture` aplicado — 404 genérico para capture não-encontrada ou cross-tenant
- [ ] Resposta inclui `total_proposed`, `proposals[]` com `id`, `entity_slug`, `before_content`, `proposed_content`, `status`
- [ ] Proposta já existente para o mesmo `capture_id + extraction_item_id`: retorna 200 com propostas existentes (idempotência)
- [ ] Audit log gravado: `action = "proposals.created"`, `detail = { "count": N }`

**Rastreabilidade**: RF-05; CA-13, CA-14

---

### TASK-E03 — Endpoint PATCH /proposals/{id}: lógica HITL

**Fase**: E | **Estimativa**: 2 dias | **Pré-requisito**: TASK-E02

**Objetivo**: Implementar a ação de revisão HITL com três branches: accept, edit_accept e reject, cada um com efeito distinto na Wiki.

**Entregáveis**:
- `api/captures/router.py` — implementar `PATCH /proposals/{proposal_id}` (substituir stub 501): valida `ProposalReview`, executa branch de ação, persiste resultado
- `api/captures/wiki_merge.py` — `WikiMerger` com métodos: `merge(proposal)` (accept → upsert `wiki_entities` com `proposed_content`), `merge_edited(proposal, edited_content)` (edit_accept → upsert com `edited_content`), `noop(proposal)` (reject → apenas marca status)

**Critérios de Pronto**:
- [ ] `accept`: atualiza `wiki_entities.content = proposed_content`, `proposal.status = ACCEPTED`, `proposal.reviewed_by`, `proposal.reviewed_at`
- [ ] `edit_accept`: atualiza `wiki_entities.content = edited_content`, `proposal.status = EDITED_ACCEPTED`; `edited_content` não pode ser vazio
- [ ] `reject`: `proposal.status = REJECTED`; `wiki_entities` não é modificada
- [ ] Wiki update e proposal status update em transação única — sem inconsistência parcial
- [ ] Apenas Líder ou Admin pode executar PATCH — Operacional recebe 404 (caixa-preta)
- [ ] Audit log gravado para cada ação: `action = "proposal.{action}"`, `detail = { "entity_slug", "before", "after" }`
- [ ] Proposta já revisada retorna 409 (não permite rerevisão)

**Rastreabilidade**: RF-05; RN-012; CA-14, CA-15, CA-16

---

### TASK-E04 — Frontend: WikiProposalCard e ProposalActionBar

**Fase**: E | **Estimativa**: 2 dias | **Pré-requisito**: TASK-E03

**Objetivo**: Criar os componentes de revisão HITL com diff visual antes/depois e barra de ações.

**Entregáveis**:
- `components/captures/WikiProposalCard.tsx` — card com: nome da entidade, diff visual (before em fundo vermelho claro, proposed em fundo verde claro), badge de tipo (`ENTITY` / `DECISION`), estado de revisão (pendente / aceito / rejeitado)
- `components/captures/ProposalActionBar.tsx` — barra com três botões: "Aceitar" (submit `action: accept`), "Editar e Aceitar" (abre textarea inline, submit `action: edit_accept`), "Rejeitar" (submit `action: reject`); desabilitados se proposta já revisada

**Critérios de Pronto**:
- [ ] Diff visual: `before_content` e `proposed_content` exibidos lado a lado ou em blocos sobrepostos com cores semânticas (não hex hardcoded)
- [ ] Botão "Editar e Aceitar": abre textarea pré-preenchida com `proposed_content`; submit desabilitado se textarea vazia
- [ ] Estado revisado: todos os 3 botões desabilitados + badge de status (`--sun` para aceito, cinza para rejeitado)
- [ ] Componentes usam `'use client'` e inline styles
- [ ] `npx tsc --noEmit` passa

**Rastreabilidade**: RF-05; CA-14, CA-15

---

### TASK-E05 — Página T-44 completa: visualização de captura

**Fase**: E | **Estimativa**: 2 dias | **Pré-requisito**: TASK-E04, TASK-C03, TASK-D04

**Objetivo**: Montar a página completa de detalhe de captura compondo transcrição, painel de extração e propostas HITL em layout unificado.

**Entregáveis**:
- `app/clientes/[clientSlug]/captures/[captureId]/page.tsx` — page Server Component que carrega capture, transcript (com gate de RBAC), extraction_items e proposals; passa dados como props para componentes client
- `components/captures/CaptureDetailLayout.tsx` — layout em duas colunas: esquerda `TranscriptViewer` (60%), direita `ExtractionPanel` + `WikiProposalCard` list (40%); `CaptureProgressBar` no topo quando status não é terminal

**Critérios de Pronto**:
- [ ] Rota `/clientes/[clientSlug]/captures/[captureId]` funciona sem erro 404
- [ ] Se transcript retorna 404 (usuário sem acesso): `TranscriptViewer` mostra placeholder, sem crash de página
- [ ] `ExtractionPanel` e `WikiProposalCard` ocultos se extraction_items estiver vazio (capture ainda processando)
- [ ] `CaptureProgressBar` desaparece quando `status` é `DONE` ou `ABORTED`
- [ ] Clique em timestamp em `ExtractionPanel` faz scroll/highlight na utterance correspondente em `TranscriptViewer`
- [ ] `npx tsc --noEmit` passa

**Rastreabilidade**: RF-03, RF-04, RF-05, RF-06; CA-09, CA-10, CA-11, CA-13, CA-14, CA-15

---

## Fase F — RBAC + Audit + Piloto

### TASK-F01 — RBAC middleware para GET /transcript: caixa-preta

**Fase**: F | **Estimativa**: 1 dia | **Pré-requisito**: TASK-A04

**Objetivo**: Implementar o endpoint `GET /{capture_id}/transcript` com gate de RBAC que retorna 404 genérico para quem não tem acesso.

**Entregáveis**:
- `api/captures/router.py` — implementar `GET /{capture_id}/transcript` (substituir stub 501): chama `require_capture` + `gate_transcript_access`; retorna `TranscriptResponse`

**Critérios de Pronto**:
- [ ] Usuários com acesso: participantes da reunião (listados em `meeting_captures.participant_emails`) + roles Líder e Admin do cliente
- [ ] Operacional não-participante: recebe `HTTP 404` com body `{"detail": "Transcrição não disponível"}` — sem distinção de "não existe" vs "sem permissão"
- [ ] Usuário de outro cliente: recebe `HTTP 404` (cross-tenant guard de `require_capture`)
- [ ] Acesso bem-sucedido: `write_audit` chamado com `action = "transcript.accessed"`
- [ ] Acesso negado: `write_audit` chamado com `action = "transcript.denied"` e `severity = "warn"` — audit interno, não exposto no response

**Rastreabilidade**: RF-06; RN-009, RN-011; CA-15, CA-16, ADR-LOCAL-01

---

### TASK-F02 — Audit log completo: acesso e ações HITL

**Fase**: F | **Estimativa**: 1 dia | **Pré-requisito**: TASK-F01, TASK-E03

**Objetivo**: Garantir que todos os eventos sensíveis de FA-16 sejam registrados no audit log com campos estruturados.

**Entregáveis**:
- `api/captures/audit.py` — expandir `AuditWriter` com método `flush_pending(db)` para batch-insert; constantes de `AuditAction` para todos os eventos de FA-16
- `api/captures/router.py` — verificar que todos os endpoints chamam `write_audit` nos pontos corretos

**Critérios de Pronto**:
- [ ] Eventos auditados: `capture.created`, `notification.sent`, `notification.failed`, `audio.uploaded`, `transcription.completed`, `extraction.completed`, `transcript.accessed`, `transcript.denied`, `proposal.accept`, `proposal.edit_accept`, `proposal.reject`
- [ ] Cada registro contém: `action`, `capture_id`, `client_id`, `user_id`, `detail_jsonb`, `severity` (`info` / `warn` / `error`), `created_at`
- [ ] Nenhuma mensagem de audit expõe cross-tenant info (campos de outro cliente)
- [ ] Query de audit log filtra por `client_id` — sem endpoint público que liste audit de outros clientes

**Rastreabilidade**: RF-06; RN-031; CA-16

---

### TASK-F03 — Testes de integração: cobertura de CAs

**Fase**: F | **Estimativa**: 2 dias | **Pré-requisito**: TASK-F01, TASK-E03

**Objetivo**: Criar suite de testes de integração cobrindo os 16 CAs, com ênfase no CA-12 (caixa-preta com usuário Operacional real).

**Entregáveis**:
- `api/tests/integration/test_capture_flow.py` — suite de integração com `pytest` + `httpx.AsyncClient`; usa banco de testes em memória (SQLite) ou fixture de PostgreSQL temporário

**Critérios de Pronto**:
- [ ] CA-01: criação de captura com `meeting_type` na allowlist → 201; `meeting_type` fora → 422
- [ ] CA-03/04: `notify_all` chamado → emails enviados (mock SMTP); falha de notificação → captura abortada
- [ ] CA-05/06: upload de `.wav` → GCS path gravado; upload de `.pdf` → 422
- [ ] CA-07/08: transcript com diarização → utterances com `speaker_tag` distintos (mock STT)
- [ ] CA-09/11: polling de status reflete transições corretas
- [ ] CA-12: Operacional não-participante tentando `GET /transcript` → 404 com body exato `{"detail": "Transcrição não disponível"}` — caixa-preta verificado
- [ ] CA-13/14: extração produz itens nos 4 tipos; HITL accept → wiki_entities atualizado
- [ ] CA-15/16: Líder aceita proposta → audit log registra; Operacional tenta aceitar → 404
- [ ] Cobertura dos endpoints de captura ≥ 80%

**Rastreabilidade**: RF-01, RF-02, RF-03, RF-04, RF-05, RF-06; RN-009, RN-011; CA-01 a CA-16

---

### TASK-F04 — Deploy staging + runbook + smoke test JN-14

**Fase**: F | **Estimativa**: 1 dia | **Pré-requisito**: TASK-F03

**Objetivo**: Preparar o ambiente de staging, documentar o runbook operacional e executar smoke test com gravação real do cliente JN-14.

**Entregáveis**:
- `api/captures/README.md` — runbook: como iniciar uma captura, como debugar falha de STT, como reverter uma wiki_proposal aceita por engano, variáveis de ambiente necessárias
- `.env.example` em `api/` — adicionar variáveis: `GCS_CAPTURES_BUCKET`, `GOOGLE_STT_LANGUAGE_CODE`, `SENDGRID_API_KEY`, `CAPTURE_NOTIFICATION_TIMEOUT_SECONDS`

**Critérios de Pronto**:
- [ ] Deploy em Cloud Run staging sem erro de startup (`uvicorn` inicia, healthcheck `/health` retorna 200)
- [ ] Smoke test JN-14: upload de gravação real (≤10min), transcrição completa, ≥3 extraction_items, ≥1 wiki_proposal gerada
- [ ] Smoke test RBAC: usuário Operacional do cliente JN-14 não consegue ler transcrição (404 verificado em staging)
- [ ] Runbook revisado por ao menos 1 membro do time que não implementou
- [ ] Variáveis de ambiente documentadas com tipo, default e obrigatoriedade

**Rastreabilidade**: RF-01, RF-02, RF-03, RF-04, RF-05, RF-06; CA-01 a CA-16

---

## Mapa CA ↔ Tasks

| CA | Descrição resumida | Tasks que cobrem |
|----|-------------------|-----------------|
| CA-01 | Opt-in bloqueado se `meeting_type` não está na allow-list | A01, A03, A04, B03 |
| CA-02 | Allow-list configurável por Admin por cliente | A01, B03, E01 |
| CA-03 | Notificação enviada a todos antes do upload | B01, B05 |
| CA-04 | Falha de notificação aborta captura (nunca processa sem notificar) | B01, B05 |
| CA-05 | Upload aceita formatos `.mp3 .mp4 .m4a .wav .webm` | B02, B04 |
| CA-06 | Upload rejeita outros formatos com 422 | B02, B04 |
| CA-07 | Transcrição com diarização retorna speaker labels distintos | C01 |
| CA-08 | Transcrição de áudio > 1h é rejeitada com erro explícito | C01 |
| CA-09 | Status de captura atualizado em cada transição de fase | C02, C04, D03 |
| CA-10 | Frontend exibe fase atual da captura com label legível | C04, E05 |
| CA-11 | Polling para automaticamente quando captura é terminal | C04 |
| CA-12 | Operacional não-participante não pode ler transcrição (caixa-preta: 404) | A04, F01, F03 |
| CA-13 | Extração produz itens com `confidence` e `source_timestamp`; todos os 4 tipos disponíveis | D01, D02, D03, D05, E01, E02 |
| CA-14 | HITL accept → wiki_entities atualizado; reject → sem alteração | E02, E03, E05 |
| CA-15 | Apenas participantes + Líder/Admin acessam transcrição | A04, C03, E05, F01 |
| CA-16 | Todas as ações HITL e acessos a transcrição registrados em audit log | A04, F01, F02 |

---

## Mapa Tasks ↔ RF / RN / ADR-LOCAL

| Item | Descrição resumida | Tasks |
|------|-------------------|-------|
| RF-01 | Opt-in + allow-list check | A01, A03, A04, B03, B04, B05, F03 |
| RF-02 | Notificação obrigatória participantes (≤2 min, aborta se falha) | B01, B05, F03 |
| RF-03 | Upload áudio + transcrição Google STT (≤1h, diarization) | B02, C01, C02, C03, C04, E05, F03, F04 |
| RF-04 | Extração LLM (decisões, ações, entidades, briefings, confiança) | D01, D02, D03, D04, D05, F03, F04 |
| RF-05 | Wiki Proposal HITL (diff view, approve/edit/reject) | E01, E02, E03, E04, E05, F03, F04 |
| RF-06 | RBAC transcript (participantes + Líder/Admin) + audit log | A04, C03, E05, F01, F02, F03, F04 |
| RN-009 | Caixa-preta: 404 genérico, não 403, para recursos não-visíveis | A04, B03, E03, F01, F03 |
| RN-011 | Cross-client guard: filtro `client_id` obrigatório em toda query | A01, A04, B02, B03, C01, C02, D03, E01, E02, F01, F02 |
| RN-012 | Imutabilidade de registros de auditoria e decisões HITL | E03 |
| RN-013 | Limite de duração de áudio para STT (≤1h) | C01 |
| RN-031 | Notificação de participantes antes de qualquer processamento | B01, F02 |
| RN-032 | Timeout total de notificação: 120s | B01 |
| ADR-LOCAL-01 | Audit log interno para acesso a transcrição (não exposto no response) | A04, F01, F02 |
| ADR-LOCAL-02 | Upload streaming para GCS (sem carregar arquivo em memória) | B02 |
| ADR-LOCAL-03 | Modo mock para STT sem credenciais (desenvolvimento local) | C01 |
| ADR-LOCAL-04 | Nodes de extração em paralelo (latência = max, não soma) | D02 |
| ADR-LOCAL-05 | `before_content` é snapshot imutável no momento da proposta | E01 |

<!-- REVIEW: Os 16 CAs estão todos cobertos por ao menos uma task? As estimativas por fase (A 4–5d, B 6–8d, C 5–6d, D 6–7d, E 7–8d, F 4–5d) batem com a capacidade do time? Alguma task crítica ausente (ex: seed de roles para Líder/Admin no cliente JN-14 antes do smoke test; migration de rollback/down script)? -->

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-05-15 | Criação inicial — 27 tasks, 6 fases |
