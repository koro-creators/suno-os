---
spec-id: SPEC-016
slug: captura-seletiva-reunioes
artefato: design
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-05-15
atualizada: 2026-05-15
versao: 1.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + Python 3.11"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: "Captura seletiva de reuniões com opt-in por reunião, notificação a participantes, transcrição via Google STT com diarization, extração LLM de decisões/ações/entidades e HITL para atualização da Wiki Ontológica."
upstream:
  - docs/specs/large/onboarding-oraculo-cliente/spec.md (FA-15 / SPEC-015)
pre_conditions:
  PRE-01: "SPEC-015 implementado — tabela wiki_entities existe e está em produção (staging)"
  PRE-02: "Google Cloud Speech-to-Text API habilitada no projeto GCP"
  PRE-03: "GCS bucket sunos-captures criado com lifecycle delete policy de 12 meses"
  PRE-04: "Política de privacidade publicada em URL acessível (para notificação aos participantes)"
  PRE-05: "Cliente piloto identificado com pelo menos uma gravação real disponível"
---

# Design — FA-16 Captura Seletiva de Reuniões (SPEC-016)

## 1. Arquitetura

### 1.1 Visão de Contexto

```
[PX-03 / PX-01]
      │ HTTP (Next.js App Router)
      ▼
[sunOS Frontend — Next.js 14]
      │ REST API
      ▼
[sunOS Backend — FastAPI]
  ├── CaptureRouter (api/capture/)
  │     ├── opt-in CRUD (título, participantes, allow-list check)
  │     ├── Notifier (email a participantes via SMTP/SendGrid)
  │     ├── Upload endpoint (multipart → GCS bucket)
  │     ├── Status endpoint (polling)
  │     └── Wiki Proposal endpoints (CRUD + HITL review)
  ├── TranscriptionJob (FastAPI BackgroundTask)
  │     └── Google Cloud Speech-to-Text API (diarization + pt-BR)
  ├── ExtractionAgent (LangGraph StateGraph)
  │     └── Gemini Flash via LangChain
  └── WikiProposerService
        └── integra wiki_entities de SPEC-015
              │
              ▼
[PostgreSQL — Cloud SQL]   [GCS: sunos-captures/]
[Google STT API]           [Gemini Flash API]
[SMTP / SendGrid]
```

### 1.2 Componentes Frontend (novos)

```
app/
  clientes/
    [clientSlug]/
      captures/
        new/page.tsx              # T-43: Iniciar Captura (opt-in + participantes + upload)
        [captureId]/page.tsx      # T-44: Revisão (transcript + extractions + proposals)

components/
  capture/
    CaptureInitForm.tsx           # formulário opt-in: título, tipo, participantes, allow-list check
    ParticipantList.tsx           # lista de participantes com status de notificação por e-mail
    AudioUploader.tsx             # drag & drop upload, formatos aceitos (mp3/mp4/wav/m4a), progress bar
    TranscriptViewer.tsx          # transcrição completa com diarization (speaker label + timestamp)
    ExtractionPanel.tsx           # lista de itens extraídos agrupados por tipo (DECISION/NEXT_STEP/ENTITY/BRIEFING)
    WikiProposalCard.tsx          # card de proposta com diff antes/depois (before_content × proposed_content)
    ProposalActionBar.tsx         # Aceitar / Editar / Rejeitar (ação HITL por proposta)

contexts/
  CaptureContext.tsx              # estado do flow T-43 + polling de status para T-44
```

### 1.3 Componentes Backend (novos)

```
api/
  capture/
    __init__.py
    router.py           # endpoints REST (opt-in CRUD, notify, upload, status, transcript, extractions, proposals)
    schemas.py          # Pydantic v2: CaptureCreate, ParticipantCreate, CaptureStatus,
                        #   TranscriptResponse, ExtractionItem, WikiProposalCreate, ProposalReview
    service.py          # lógica de negócio: allow-list check, RBAC gate, HITL validation, audit log,
                        #   wiki merge após accept, caixa-preta 404
    models.py           # SQLAlchemy 2.x: meeting_captures, meeting_transcripts,
                        #   extraction_items, wiki_proposals, capture_allowlist
    transcriber.py      # Google STT integration: upload para GCS → STT recognize → diarized transcript
    extractor.py        # LangGraph StateGraph: transcript → decisões/ações/entidades/briefings com confiança
    notifier.py         # email notification a participantes (SMTP / SendGrid)
    wiki_proposer.py    # gera WikiProposal a partir de extraction_items; integra com wiki_entities (SPEC-015)
```

---

## 2. Modelo de Dados

### 2.1 Tabelas

```sql
-- Captura (opt-in por reunião)
CREATE TABLE meeting_captures (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID         NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  meeting_type    VARCHAR(100),                        -- referência a capture_allowlist.meeting_type
  participants    JSONB        NOT NULL DEFAULT '[]',  -- Participant[] {email, name, notified_at?}
  recorded_at     TIMESTAMPTZ  NOT NULL,
  source_type     VARCHAR(20)  NOT NULL DEFAULT 'UPLOAD',  -- apenas UPLOAD no Piloto
  consent_confirmed BOOLEAN    NOT NULL DEFAULT FALSE,
  status          VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
  -- DRAFT → NOTIFIED → UPLOADED → TRANSCRIBING → EXTRACTING → DONE | ERROR
  audio_gcs_path  TEXT,                                -- gs://sunos-captures/<client_id>/<id>.<ext>
  duration_seconds INTEGER,
  notified_at     TIMESTAMPTZ,
  notification_errors JSONB,                           -- [{email, error}] — emails que falharam
  created_by      UUID         NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ  DEFAULT now(),
  updated_at      TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX idx_captures_client  ON meeting_captures(client_id);
CREATE INDEX idx_captures_status  ON meeting_captures(status);

-- Transcrição processada
CREATE TABLE meeting_transcripts (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  capture_id       UUID    NOT NULL UNIQUE REFERENCES meeting_captures(id) ON DELETE CASCADE,
  client_id        UUID    NOT NULL,              -- desnormalizado: cross-client guard
  content_text     TEXT    NOT NULL,              -- transcrição raw em texto corrido
  speaker_segments JSONB   NOT NULL DEFAULT '[]', -- SpeakerSegment[] {speaker, start_s, end_s, text}
  word_count       INTEGER,
  language         VARCHAR(10) DEFAULT 'pt-BR',
  stt_confidence   FLOAT,                         -- confiança média retornada pelo STT
  processed_at     TIMESTAMPTZ DEFAULT now()
);

-- Itens extraídos pelo agente LangGraph
CREATE TABLE extraction_items (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  capture_id           UUID        NOT NULL REFERENCES meeting_captures(id) ON DELETE CASCADE,
  client_id            UUID        NOT NULL,           -- desnormalizado
  item_type            VARCHAR(20) NOT NULL,           -- DECISION | NEXT_STEP | ENTITY | BRIEFING
  content              TEXT        NOT NULL,
  confidence           VARCHAR(10) NOT NULL,           -- high | medium | low
  timestamp_utterance  VARCHAR(10),                    -- HH:MM:SS na gravação
  speaker              VARCHAR(100),
  responsible          VARCHAR(255),                   -- para NEXT_STEP: quem ficou responsável
  deadline_mentioned   VARCHAR(100),                   -- para NEXT_STEP: prazo mencionado (free text)
  created_at           TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_extractions_capture ON extraction_items(capture_id);

-- Propostas de atualização da Wiki Ontológica (HITL)
CREATE TABLE wiki_proposals (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  capture_id       UUID        NOT NULL REFERENCES meeting_captures(id) ON DELETE CASCADE,
  client_id        UUID        NOT NULL,              -- desnormalizado
  entity_type      VARCHAR(30) NOT NULL,              -- OntologyEntityType (de SPEC-015)
  before_content   TEXT,                              -- snapshot do conteúdo atual em wiki_entities
  proposed_content TEXT        NOT NULL,              -- conteúdo sugerido pelo LLM
  provenance       JSONB       NOT NULL,              -- ProposalProvenance {capture_id, extraction_item_ids[], rationale}
  status           VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | accepted | edited_accepted | rejected
  reviewed_by      UUID        REFERENCES users(id),
  reviewed_at      TIMESTAMPTZ,
  edited_content   TEXT,                              -- preenchido quando action = edit_accept
  created_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_proposals_capture       ON wiki_proposals(capture_id);
CREATE INDEX idx_proposals_client_status ON wiki_proposals(client_id, status);

-- Allow-list de tipos de reunião configurável por Admin
CREATE TABLE capture_allowlist (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID         REFERENCES clients(id),  -- NULL = default global (todos os clientes)
  meeting_type VARCHAR(100) NOT NULL,
  description  TEXT,
  enabled      BOOLEAN      DEFAULT TRUE,
  created_by   UUID         REFERENCES users(id),
  created_at   TIMESTAMPTZ  DEFAULT now(),
  UNIQUE(client_id, meeting_type)
);
```

### 2.2 Relacionamentos

```
meeting_captures (1) ──── (1) meeting_transcripts
meeting_captures (1) ──── (N) extraction_items
meeting_captures (1) ──── (N) wiki_proposals
wiki_proposals   (N) ──── (1) wiki_entities  [JOIN: (client_id, entity_type) — FK lógico para SPEC-015]
```

### 2.3 Status de meeting_captures

```
DRAFT
  │── POST /notify ──► NOTIFIED
                          │── POST /upload ──► UPLOADED
                                                  │── [BackgroundTask STT] ──► TRANSCRIBING
                                                                                    │── [BackgroundTask Extraction] ──► EXTRACTING
                                                                                                                            │── (sucesso) ──► DONE
                                                                                                                            └── (falha)   ──► ERROR
```

---

## 3. Decisões Técnicas (ADR-LOCAL)

### ADR-LOCAL-01: Google Cloud Speech-to-Text vs. Whisper para transcrição

- **Status**: Aceita
- **Contexto**: Precisão ≥ 85% com diarization, suporte a pt-BR, billing consolidado no GCP. Alternativas avaliam custo e dependência externa.
- **Decisão**: Google Cloud Speech-to-Text v1p1beta1 com `diarizationConfig` habilitada. Arquivo de áudio já em GCS → STT lê direto via `gcs_uri` (sem re-upload).
- **Alternativas rejeitadas**:
  - Whisper (OpenAI/local) — requer infra GPU (Cloud Run não tem GPU nativa barato) ou custo OpenAI adicional; diarization não nativa
  - AssemblyAI — terceiro externo adicional, billing separado, latência de API variável
- **Consequências**: ✅ GCP nativo, billing consolidado, suporte pt-BR de boa qualidade. ⚠️ Custo por minuto de áudio (estimar: ~USD 0,016/min speech-to-text + ~USD 0,001/min diarization para Piloto)

### ADR-LOCAL-02: Upload ONLY no Piloto (sem meeting bot)

- **Status**: Aceita
- **Contexto**: Integração de bot com Google Meet ou Microsoft Teams exige processo de aprovação de API (OAuth de escopo amplo, verificação de app pelo Google/Microsoft), com prazo imprevisível.
- **Decisão**: `source_type = UPLOAD` exclusivo no Piloto. Usuário baixa a gravação da plataforma (Meet, Teams, Zoom) e faz upload manual via `AudioUploader.tsx`.
- **Alternativas rejeitadas**:
  - GMEET_BOT — processo de aprovação Google Meet Add-on lento (semanas a meses)
  - TEAMS_BOT — mesmo problema de certificação Microsoft; OAuth scope sensível
- **Consequências**: ✅ Zero dependência de aprovação externa. ✅ Sem escopo OAuth adicional. ⚠️ Fricção de UX ("baixar e re-subir") aceitável no Piloto com volume baixo (≤ 5 reuniões/semana)

### ADR-LOCAL-03: FastAPI BackgroundTasks para jobs de STT e Extração

- **Status**: Aceita
- **Contexto**: Consistência com SPEC-015 ADR-LOCAL-02. STT pode levar 10-60 min para gravações longas; extração ≤ 30 min. Cloud Run timeout = 3600s.
- **Decisão**: FastAPI BackgroundTasks com checkpoint de status em `meeting_captures.status`. Se o processo reiniciar em `TRANSCRIBING`, o job é retomado na próxima request de status (re-enqueue automático no startup).
- **Alternativas rejeitadas**:
  - Cloud Tasks — zero overhead no Piloto; adiciona complexidade de configuração
  - Celery + Redis — mais infra, desnecessária para volume do Piloto
- **Consequências**: ✅ Zero infra adicional. ⚠️ Job perde estado em reinício de instância — mitigado por checkpoint no DB e retomada automática

### ADR-LOCAL-04: Polling para status de transcrição (intervalo 10s)

- **Status**: Aceita
- **Contexto**: Transcrição leva minutos (não segundos como o Oráculo do SPEC-015). Consistência com ADR-LOCAL-01 de SPEC-015, adaptando o intervalo.
- **Decisão**: `GET /api/captures/{id}/status` com intervalo de 10s (STT pode levar muito mais que o Oráculo). Sem SSE ou WebSocket na v1.
- **Alternativas rejeitadas**:
  - SSE — adiciona complexidade de gestão de conexão; para processo de minutos, polling é suficiente
  - Intervalo 5s como SPEC-015 — desnecessário; STT não muda status a cada 5s
- **Consequências**: ✅ Simples. ⚠️ Lag máximo de 10s entre STT completar e UI atualizar — aceitável para processo que leva minutos

### ADR-LOCAL-05: Allow-list configurável via tabela (não hardcoded)

- **Status**: Aceita
- **Contexto**: Cada área da Suno tem tipos de reunião válidos distintos (Daily, All-hands, Reunião de cliente, etc.). Hardcoded não permite customização por cliente sem deploy.
- **Decisão**: Tabela `capture_allowlist` com `client_id` opcional (NULL = default global). Admin configura via CRUD. No Piloto: sem tipos bloqueados por padrão (allow-list vazia = todos permitidos).
- **Alternativas rejeitadas**:
  - Enum hardcoded em `schemas.py` — inflexível; requer deploy para cada novo tipo
  - Config em `oracle_config` JSONB de clients (SPEC-015) — misturaria responsabilidades
- **Consequências**: ✅ Configurável por cliente sem deploy. ⚠️ Admin deve configurar allow-list antes do go-live se quiser restrição por tipo

---

## 4. Diagramas de Fluxo

### 4.1 Sequência: Upload → DONE

```
PX-03        Frontend      Backend       GCS       Google STT    Gemini Flash
  |              |             |           |            |              |
  |-- POST /captures (opt-in) ─────────► |           |              |
  |              |◄─ {capture_id, status:DRAFT}       |              |
  |-- POST /{id}/notify ────────────────►|           |              |
  |              |◄─ {status:NOTIFIED, sent:N, errors:[]}           |
  |-- POST /{id}/upload (multipart) ────►|           |              |
  |              |             |─── upload ──────────►|              |
  |              |             |◄─── gcs_path ────────|              |
  |              |◄─ {status:UPLOADED}  |             |              |
  |  <inicia polling 10s>      |         |            |              |
  |              |─── GET /{id}/status ─►|            |              |
  |              |◄─ {status:TRANSCRIBING}             |              |
  |              |             |─── STT recognize ───►|              |
  |              |             |◄─── transcript ───────|              |
  |              |             |─── [extractor BG] ───────────────────►|
  |              |◄─ {status:EXTRACTING}               |              |
  |              |             |◄─── extractions ──────────────────────|
  |              |◄─ {status:DONE}      |             |              |
  |-- GET /{id}/transcript ─────────────►             |              |
  |              |◄─ {speaker_segments, content_text} |              |
  |-- GET /{id}/extractions ────────────►             |              |
  |              |◄─ {items:[DECISION,NEXT_STEP,...]} |              |
  |-- POST /{id}/proposals ─────────────►             |              |
  |              |◄─ {proposals:[{id,entity_type,...}]}              |
  |-- GET /{id}/proposals ──────────────►             |              |
  |  <T-44: HITL review>       |         |            |              |
  |-- PATCH /proposals/{pid} (accept) ──►             |              |
  |              |◄─ {status:accepted, wiki_updated:true}            |
```

### 4.2 Sequência: Acesso não autorizado (caixa-preta)

```
PX-06 (Operacional sem permissão)   Backend
  |                                     |
  |─── GET /captures/{id}/transcript ──►|
  |                                     |── SELECT WHERE id=$1 AND client_id=$user_client
  |                                     |── (0 rows: cross-client ou não existe)
  |◄── 404 {"detail": "Captura não encontrada"} ─|
  |                                     |── audit_log INSERT (DENIED_CROSS_CLIENT, severity=WARN)
```

---

## 5. Estratégia de Testes

| Nível | Escopo | Framework | Cobertura |
|-------|--------|-----------|-----------|
| Unitário | `service.py` (allow-list check, RBAC gate, HITL validation, wiki merge) | pytest | 90%+ em funções críticas |
| Integração | Endpoints (upload, notify, transcript RBAC, proposals CRUD) + DB | pytest + httpx + SQLAlchemy test session | Todos os CAs |
| Mock STT | BackgroundTask com mock Google STT (retorna transcript fixture pt-BR) | pytest + unittest.mock | Fluxo completo DRAFT → DONE |
| Mock LLM | ExtractionAgent com mock Gemini Flash | pytest + unittest.mock | Extração dos 4 item_types com confiança |
| E2E manual | JN-14 com gravação real no cliente Piloto | Manual | Happy path + CA-12 (caixa-preta transcript) |

**Nota**: testes de integração usam banco de dados real (test database), não mock de DB. Pattern estabelecido em `api/tests/` existente.

<!-- REVIEW: ADR-LOCAL-01 (Google STT): custo por minuto de áudio foi estimado para o volume do Piloto? Confirmar quota GCP antes de Fase C. ADR-LOCAL-03 (BackgroundTasks): para gravações longas (>60 min), o job de STT pode exceder o timeout de Cloud Run (3600s)? Avaliar chunking se necessário. -->
