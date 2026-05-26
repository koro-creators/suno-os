---
spec-id: SPEC-016
slug: captura-seletiva-reunioes
artefato: spec
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
  contexto: FA-16 — Captura Seletiva de Reuniões. Opt-in por reunião, upload de gravação, transcrição automática com diarization (pt-BR), extração estruturada, e proposta de atualização da Wiki Ontológica com HITL obrigatório.
upstream:
  - docs/brd/parte3-requisitos.md (BR-020, BR-004, BR-007, BR-008)
  - docs/brd/parte4-regras.md (RN-031, RN-032, RN-013, RN-009, RN-011, RN-012)
  - docs/prd/parte4-FRs.md (FR-190–FR-195)
  - docs/srd/parte2-domain-model.md (DO-59 MeetingCapture, DO-60 MeetingTranscript)
  - docs/ux/parte1-inventario-telas.md (T-43, T-44, JN-14)
---

# Especificação — FA-16 Captura Seletiva de Reuniões (SPEC-016)

## 1. Resumo da Feature

**O quê**: Permite que o Creator (PX-03) faça upload de gravações de reuniões estratégicas para processamento no sunOS. O sistema envia notificação obrigatória a todos os participantes, transcreve automaticamente em pt-BR com diarization (speaker labels + timestamps por utterance), extrai estruturadamente decisões, próximos passos, entidades e briefings emergentes, e propõe atualizações para a Wiki Ontológica do cliente — com HITL obrigatório de PX-01 antes de qualquer consolidação.

**Por quê**: Reuniões estratégicas com clientes contêm decisões, contexto de mercado e briefings que hoje não são capturados de forma estruturada. Sem captura, o sunOS opera com conhecimento desatualizado sobre o cliente, gerando outputs desalinhados. Com FA-16, o conhecimento produzido em reuniões alimenta a Wiki Ontológica de forma rastreável e auditável (BR-020).

**Para quem**:
- **PX-03 (Creator / Analista)**: aciona o opt-in, faz o upload, acompanha o status de transcrição
- **PX-01 (Líder de Área / Curador)**: revisa as propostas de atualização da Wiki via HITL (T-44)
- **PX-07 (Sponsor de Área)**: beneficiário em reuniões estratégicas; pode revisar Wiki pós-HITL

**Fase**: Piloto — `source_type: UPLOAD` apenas. GMEET_BOT e TEAMS_BOT são pós-Piloto.

**Escopo incluído**:
- Opt-in por reunião com allow-list de tipos configurável (T-43)
- Notificação obrigatória a todos os participantes com email registrado
- Upload de arquivo de gravação (formatos: .mp3, .mp4, .m4a, .wav, .webm; máx 2GB)
- Transcrição automática pt-BR com diarization via Google STT
- Extração estruturada: decisões, próximos passos, entidades, briefings
- Proposta para Wiki Ontológica com HITL gate (PX-01)
- RBAC restrito na transcrição bruta + audit log imutável

**Escopo excluído (pós-Piloto ou outras SPECs)**:
- Integração com bots de videoconferência (GMEET_BOT, TEAMS_BOT)
- Captura em tempo real / streaming STT
- Resumo automático de reunião (além da extração estruturada)
- Exportação de transcrição para PDF/Notion

---

## 2. Personas e Jornadas

### PX-03 — Creator / Analista

- **Perfil**: profissional da área (ex: Analista de Planejamento, Creator de Conteúdo) que participa de reuniões estratégicas com clientes
- **Objetivo**: registrar decisões e próximos passos da reunião no sunOS sem esforço manual de transcrição
- **Tela principal**: T-43 (Modal "Iniciar Captura")

### PX-01 — Líder de Área / Curador

- **Perfil**: líder responsável pela curadoria do conhecimento do cliente; receptor das propostas de atualização da Wiki
- **Objetivo**: revisar e aceitar/rejeitar/editar propostas de atualização da Wiki Ontológica geradas pela extração
- **Tela principal**: T-44 (Revisão de Transcrição e propostas HITL)

### PX-07 — Sponsor de Área

- **Perfil**: sócio/sponsor de área que participa de reuniões estratégicas e consome o resultado na Wiki
- **Objetivo**: beneficiar-se do conhecimento capturado nas reuniões sem precisar fazer o upload manualmente
- **Acesso**: Wiki Ontológica pós-HITL (`/clientes/[slug]/wiki`)

### JN-14 — Jornada Completa de Captura de Reunião (8 passos)

```
Passo 1 — Opt-in: PX-03 abre modal T-43, preenche título/participantes/tipo de reunião
Passo 2 — Allow-list check: backend valida se tipo de reunião está na allow-list do cliente
Passo 3 — Notificação: sistema envia email a TODOS os participantes com email em ≤2 min
           → se qualquer notificação falhar: captura abortada (status = CANCELLED)
           → se todas entregues: status = NOTIFIED
Passo 4 — Reunião ocorre: PX-03 realiza a reunião e grava o arquivo
Passo 5 — Upload: PX-03 faz upload do arquivo de gravação no modal/T-44
           → status = UPLOADED → TRANSCRIBING
Passo 6 — Transcrição: Google STT processa em ≤1h (p95)
           → retorna utterances com speaker labels e timestamps
           → status = TRANSCRIBING → EXTRACTING
Passo 7 — Extração: LangGraph StateGraph extrai itens estruturados em ≤30 min
           → gera WikiProposals (status = pending) para revisão PX-01
           → status = EXTRACTING → DONE
Passo 8 — Revisão Wiki HITL: PX-01 acessa T-44, revisa diff, decide por proposta
           → aceita / edita+aceita / rejeita cada WikiProposal individualmente
           → audit log registra cada decisão
```

---

## 3. Requisitos Funcionais

### RF-01 — Opt-in por reunião com allow-list (FR-190)

**Prioridade**: Core

- Acionado explicitamente por PX-03 via modal T-43 — nunca automático
- Backend valida se `meeting_type` está na allow-list do cliente antes de criar a captura
- Allow-list configurável por Admin (não hardcoded); default: `["estratégica", "briefing", "kickoff", "retrospectiva"]`
- `consent_confirmed` deve ser marcado explicitamente pelo solicitante no modal — nunca `true` por default
- Captura com tipo fora da allow-list: rejeitada com 422 antes de qualquer notificação ser enviada

**Regras**:
- RN-031: opt-in explícito por reunião
- Cada `MeetingCapture` é independente — opt-in de uma reunião não autoriza capturas futuras

### RF-02 — Notificação obrigatória a todos os participantes (FR-191)

**Prioridade**: Core (bloqueante para todo o pipeline)

- Após criação da captura em status `DRAFT`, o backend envia email a todos os participantes com email registrado
- Conteúdo obrigatório no email: título da reunião, data, propósito da captura, URL da política de privacidade (PRE-04)
- SLO de entrega: ≤2 min do acionamento do opt-in
- Se a notificação falhar para qualquer participante com email: captura abortada imediatamente (`status = CANCELLED`)
- Captura só avança para `NOTIFIED` quando todas as notificações obrigatórias foram entregues com sucesso
- Participantes sem email registrado: registrados como `notification_sent = null` (sem obrigatoriedade)
- Resultado de cada notificação registrado em `participants[].notification_sent` e `notification_confirmed`

### RF-03 — Upload de gravação e transcrição automática (FR-192)

**Prioridade**: Core

- Upload aceita: `.mp3`, `.mp4`, `.m4a`, `.wav`, `.webm`; tamanho máximo 2GB
- Arquivo armazenado em GCS (`audio_gcs_path`); nunca em banco de dados
- Google Speech-to-Text API processa em pt-BR com diarization habilitada
- Resultado: lista de utterances com `speaker_label`, `start_time`, `end_time`, `transcript_text`
- Precisão de diarization ≥85% para reuniões com ≤6 participantes (avaliada com PRE-05)
- SLO de transcrição: ≤1h (p95) após confirmação do upload
- Se STT retornar qualidade de diarization degradada (`speaker_labels = null`): marcar `diarization_quality = degraded`, notificar Admin — não falhar silenciosamente

### RF-04 — Extração estruturada pós-transcrição (FR-193)

**Prioridade**: Core

Após transcrição concluída, pipeline LangGraph extrai em ≤30 min:

| Tipo (`ExtractionItemType`) | Conteúdo extraído |
|-----------------------------|-------------------|
| `DECISION` | Decisão tomada na reunião |
| `NEXT_STEP` | Ação a executar (com responsável e prazo, se mencionados) |
| `ENTITY` | Clientes, concorrentes, produtos, pessoas citadas |
| `BRIEFING` | Briefing emergente ou contexto novo sobre o cliente |

Cada item carrega obrigatoriamente: `item_type`, `content`, `confidence` (alta/média/baixa), `timestamp_utterance` (HH:MM:SS), `speaker`.
Itens `NEXT_STEP` incluem opcionalmente: `responsible`, `deadline_mentioned`.

**Regras**:
- Pipeline roda assincronamente após `status = TRANSCRIBING → EXTRACTING`
- Confiança é hint para PX-01 priorizar — não trigger de auto-aceite
- `BRIEFING` emergente não entra na Wiki sem HITL, mesmo que confiança seja alta

### RF-05 — Proposta para Wiki Ontológica com HITL (FR-194)

**Prioridade**: Core

- Pipeline de extração gera `WikiProposal`s vinculadas a `ExtractionItem`s
- `WikiProposal.entity_type` usa `OntologyEntityType` de `lib/onboarding-types.ts` (dependência PRE-01)
- Toda proposta começa em `status = pending` — nunca é criada em `accepted`
- UI T-44 exibe diff entre entidade Wiki existente (`before_content`) e proposta nova (`proposed_content`)
- PX-01 decide por proposta individualmente: aceitar / editar+aceitar / rejeitar
- Ação `edit_accept` requer `edited_content` não vazio
- Cada decisão auditada: `reviewed_by`, `reviewed_at`, `action`, diff antes/depois

**Regras**:
- RN-032: HITL obrigatório; sem "Aceitar todas" ou aprovação em lote
- Sem auto-merge mesmo para `confidence = high`

### RF-06 — RBAC e audit log de acesso (FR-195)

**Prioridade**: Core

- Transcrição bruta (`GET /api/clients/{slug}/captures/{id}/transcript`): restrita a participantes registrados da reunião + Líder/Admin do cliente
  - Qualquer outro usuário recebe 404 (caixa-preta — RN-011)
- Itens de extração seguem RBAC da sessão (mesmos que a transcrição)
- `WikiProposal`s: visíveis a PX-01 (Líder) e Admin; invisíveis a Operacional (404)
- Audit log `audit_log_captures` registra obrigatoriamente:
  - Criação de captura: `user_id`, `capture_id`, `participants`, `meeting_type`
  - Cada notificação enviada: `participant_email`, `status`, `timestamp`
  - Cada acesso à transcrição: `user_id`, `capture_id`, `timestamp`
  - Cada decisão HITL: `user_id`, `proposal_id`, `action`, `reviewed_at`
- Audit log é append-only — trigger PG bloqueia UPDATE e DELETE

---

## 4. Critérios de Aceite

<!-- REVIEW: Os 16 CAs cobrem todos os FRs e os caminhos de erro críticos? Verificar especialmente: CA-04 (abort por notificação) e CA-12 (caixa-preta transcrição) em teste de contrato. -->

### RF-01 — Opt-in e allow-list

- [ ] **CA-01**: DADO modal T-43 aberto, QUANDO PX-03 tenta criar captura sem marcar `consent_confirmed`, ENTÃO o botão de confirmar permanece desabilitado e nenhuma captura é criada.

- [ ] **CA-02**: DADO `meeting_type = "comercial"` fora da allow-list do cliente, QUANDO PX-03 tenta criar a captura, ENTÃO o backend retorna 422 com `{"detail": "Tipo de reunião não permitido"}` antes de qualquer notificação ser enviada.

- [ ] **CA-16**: DADO Admin acessa configurações do cliente, QUANDO edita a allow-list de tipos de reunião, ENTÃO a alteração persiste e valida novas capturas sem deploy (allow-list não é hardcoded).

### RF-02 — Notificação

- [ ] **CA-03**: DADO captura criada com 3 participantes, todos com email registrado, QUANDO opt-in é confirmado, ENTÃO email com título da reunião, propósito e URL de privacidade é enviado a todos os 3 em ≤2 min.

- [ ] **CA-04**: DADO captura com 2 participantes — um com email, outro sem — e envio de email para o participante com email falha (ex: bounce), QUANDO notificação é processada, ENTÃO captura muda para `status = CANCELLED` e PX-03 recebe alerta de abortagem.

### RF-03 — Upload e transcrição

- [ ] **CA-05**: DADO captura em status `NOTIFIED`, QUANDO PX-03 faz upload de arquivo `.webm` de 150MB, ENTÃO arquivo é armazenado em GCS (`audio_gcs_path` populado) e captura avança para `UPLOADED → TRANSCRIBING`.

- [ ] **CA-06**: DADO transcrição concluída, QUANDO status é verificado, ENTÃO `MeetingTranscript` contém lista de utterances com `speaker_label`, `start_time`, `end_time` e `transcript_text` preenchidos.

- [ ] **CA-07**: DADO arquivo de gravação real do cliente piloto (PRE-05) com ≤6 participantes, QUANDO transcrição é processada, ENTÃO precisão de speaker labels avaliada manualmente é ≥85% dos utterances.

### RF-04 — Extração

- [ ] **CA-08**: DADO transcrição disponível, QUANDO pipeline de extração completa, ENTÃO extração é concluída em ≤30 min com pelo menos 1 item de cada tipo que apareça no conteúdo da reunião.

- [ ] **CA-09**: DADO extração concluída, QUANDO qualquer `ExtractionItem` é inspecionado, ENTÃO contém `item_type`, `content`, `confidence`, `timestamp_utterance` e `speaker` preenchidos.

- [ ] **CA-18**: DADO item extraído de tipo `NEXT_STEP`, QUANDO conteúdo da utterance menciona responsável e prazo, ENTÃO `responsible` e `deadline_mentioned` estão preenchidos no `ExtractionItem`.

### RF-05 — WikiProposal e HITL

- [ ] **CA-10**: DADO extração concluída com WikiProposals geradas, QUANDO PX-01 acessa T-44, ENTÃO cada proposta exibe diff entre conteúdo Wiki existente (`before_content`) e proposta nova (`proposed_content`) antes de qualquer ação.

- [ ] **CA-11**: DADO WikiProposal em status `pending`, QUANDO nenhum usuário interage (nem job, nem agente, mesmo com `confidence = high`), ENTÃO status permanece `pending` indefinidamente — sem auto-aceite.

- [ ] **CA-17**: DADO PX-01 clica "Aceitar" em uma WikiProposal, ENTÃO `status` muda para `accepted`, `reviewed_by` e `reviewed_at` são registrados, e audit log registra a decisão com diff.

### RF-06 — RBAC e caixa-preta

- [ ] **CA-12**: DADO usuário com role Operacional não-participante da reunião, QUANDO faz `GET /api/clients/{slug}/captures/{id}/transcript`, ENTÃO resposta é HTTP 404 com `{"detail": "Captura não disponível"}` — nunca 403.

- [ ] **CA-13**: DADO ciclo de vida de 12 meses configurado no GCS bucket (PRE-03), QUANDO objeto de áudio completa 12 meses de criação, ENTÃO objeto é deletado automaticamente pelo lifecycle do GCS sem intervenção de código da aplicação.

- [ ] **CA-19**: DADO `meeting_transcripts.content_text` persistido em banco de dados (dado sensível — RN-013), QUANDO 12 meses completam desde `meeting_captures.created_at`, ENTÃO job de purge agendado substitui `content_text` por `NULL` (ou `[REDACTED — LGPD 12m]`) e registra em audit log. Nota: `speaker_segments` e `word_count` não são texto bruto e podem ser retidos para auditoria de qualidade de diarization; apenas `content_text` é sensível.

- [ ] **CA-14**: DADO qualquer criação de captura, envio de notificação, acesso à transcrição ou decisão HITL, QUANDO operação ocorre, ENTÃO registro correspondente aparece em `audit_log_captures` com `user_id`, `capture_id`, `event_type` e `timestamp_utc`.

- [ ] **CA-15**: DADO teste de regressão de cross-client, QUANDO `GET /api/clients/{slug}/captures/{id}/transcript` é feito com JWT de cliente diferente do `client_id` da captura, ENTÃO resposta é HTTP 404 (nunca 200 nem 403).

---

## 5. Contratos TypeScript

<!-- REVIEW: Os tipos cobrem todos os estados do pipeline? Verificar que MeetingCaptureStatus inclui todos os estados da máquina definida na §8 e que WikiProposal.entity_type importa corretamente de SPEC-015. -->

```typescript
// lib/captures-types.ts

// Importar de SPEC-015 — PRE-01 obrigatório
import type { OntologyEntityType } from './onboarding-types';

export type MeetingCaptureStatus =
  | 'DRAFT'
  | 'NOTIFIED'
  | 'UPLOADED'
  | 'TRANSCRIBING'
  | 'EXTRACTING'
  | 'DONE'
  | 'ERROR'
  | 'CANCELLED';

export type ExtractionItemType = 'DECISION' | 'NEXT_STEP' | 'ENTITY' | 'BRIEFING';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type ProposalAction = 'accept' | 'edit_accept' | 'reject';
export type ProposalStatus = 'pending' | 'accepted' | 'edited_accepted' | 'rejected';

export interface Participant {
  name: string;
  email?: string;
  notification_sent?: boolean | null; // null = sem email registrado (não obrigatório)
  notification_confirmed?: boolean;
}

export interface MeetingCapture {
  capture_id: string;
  client_id: string;
  title: string;
  meeting_type: string;
  participants: Participant[];
  recorded_at: string;         // ISO date — data em que a reunião ocorreu
  source_type: 'UPLOAD';       // Piloto only — GMEET_BOT e TEAMS_BOT são pós-Piloto
  consent_confirmed: boolean;
  status: MeetingCaptureStatus;
  duration_seconds?: number;
  audio_gcs_path?: string;     // caminho no GCS, nunca o binário
  created_by: string;          // user_id de PX-03
  created_at: string;          // ISO datetime
}

export interface ExtractionItem {
  item_id: string;
  capture_id: string;
  client_id: string;
  item_type: ExtractionItemType;
  content: string;
  confidence: ConfidenceLevel;
  timestamp_utterance?: string; // HH:MM:SS referente à utterance de origem
  speaker?: string;
  responsible?: string;         // para NEXT_STEP — se mencionado
  deadline_mentioned?: string;  // para NEXT_STEP — se mencionado
}

export interface ProposalProvenance {
  capture_id: string;
  meeting_title: string;
  recorded_at: string;
  participants: string[];           // nomes dos participantes
  extraction_item_ids: string[];    // IDs dos ExtractionItems que motivaram a proposta
}

export interface WikiProposal {
  proposal_id: string;
  capture_id: string;
  client_id: string;
  entity_type: OntologyEntityType;  // importado de lib/onboarding-types.ts (PRE-01)
  before_content?: string;          // conteúdo atual da entidade na Wiki (null = entidade nova)
  proposed_content: string;
  provenance: ProposalProvenance;
  status: ProposalStatus;
  reviewed_by?: string;             // user_id de PX-01
  reviewed_at?: string;             // ISO datetime
  edited_content?: string;          // preenchido apenas em edit_accept
}

export interface ProposalReviewRequest {
  action: ProposalAction;
  edited_content?: string;          // obrigatório se action === 'edit_accept'
}
```

---

## 6. Schemas Pydantic

```python
# api/captures/schemas.py
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, field_validator, model_validator


class MeetingCaptureStatus(str, Enum):
    DRAFT = "DRAFT"
    NOTIFIED = "NOTIFIED"
    UPLOADED = "UPLOADED"
    TRANSCRIBING = "TRANSCRIBING"
    EXTRACTING = "EXTRACTING"
    DONE = "DONE"
    ERROR = "ERROR"
    CANCELLED = "CANCELLED"


class ExtractionItemType(str, Enum):
    DECISION = "DECISION"
    NEXT_STEP = "NEXT_STEP"
    ENTITY = "ENTITY"
    BRIEFING = "BRIEFING"


class ConfidenceLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ProposalAction(str, Enum):
    ACCEPT = "accept"
    EDIT_ACCEPT = "edit_accept"
    REJECT = "reject"


class ParticipantCreate(BaseModel):
    name: str
    email: Optional[str] = None


class CaptureCreate(BaseModel):
    title: str
    meeting_type: str
    participants: List[ParticipantCreate]
    recorded_at: str  # ISO datetime — data em que a reunião ocorreu
    consent_confirmed: bool

    @field_validator("consent_confirmed")
    @classmethod
    def consent_must_be_true(cls, v: bool) -> bool:
        if not v:
            raise ValueError("consent_confirmed deve ser true para criar uma captura")
        return v


class ProposalReview(BaseModel):
    action: ProposalAction
    edited_content: Optional[str] = None  # obrigatório para edit_accept

    @model_validator(mode="after")
    def require_content_for_edit(self) -> "ProposalReview":
        if self.action == ProposalAction.EDIT_ACCEPT and not self.edited_content:
            raise ValueError("edited_content é obrigatório para action=edit_accept")
        return self
```

---

## 7. Endpoints REST

```
# Gerenciamento de capturas
POST   /api/clients/{slug}/captures
  → Criar MeetingCapture (opt-in); valida allow-list; status = DRAFT

POST   /api/clients/{slug}/captures/{id}/notify
  → Enviar notificações a participantes; se qualquer falhar: status = CANCELLED
  → Status em sucesso: DRAFT → NOTIFIED

POST   /api/clients/{slug}/captures/{id}/upload
  → Upload do arquivo de áudio para GCS; dispara job STT assíncrono
  → Status: NOTIFIED → UPLOADED → TRANSCRIBING

GET    /api/clients/{slug}/captures/{id}/status
  → Polling: status atual + progresso de transcrição e extração

GET    /api/clients/{slug}/captures/{id}/transcript
  → Transcrição bruta com utterances (RBAC restrito: participantes + Líder/Admin)
  → 404 para qualquer outro usuário (caixa-preta — RN-011)

GET    /api/clients/{slug}/captures/{id}/extractions
  → Lista de ExtractionItems pós-extração

# WikiProposals (HITL)
POST   /api/clients/{slug}/captures/{id}/proposals
  → Criado pelo pipeline de extração (internal); não exposto a usuários finais diretamente

GET    /api/clients/{slug}/captures/{id}/proposals
  → Listar WikiProposals para revisão por PX-01

PATCH  /api/clients/{slug}/captures/{id}/proposals/{prop_id}
  → Aceitar / editar+aceitar / rejeitar proposta (body: ProposalReview)

# Listagem
GET    /api/clients/{slug}/captures
  → Listar capturas do cliente (paginado; filtros: status, date_range)
```

**Convenções de erro**:

| Situação | Status | body.detail |
|----------|--------|-------------|
| Tipo de reunião fora da allow-list | 422 | `"Tipo de reunião não permitido"` |
| Captura não encontrada ou sem permissão | 404 | `"Captura não disponível"` |
| Transcrição não autorizada (caixa-preta) | 404 | `"Captura não disponível"` |
| Arquivo muito grande (>2GB) | 413 | `"Arquivo excede o limite de 2GB"` |
| Formato não suportado | 422 | `"Formato de arquivo não suportado"` |
| `edit_accept` sem `edited_content` | 422 | `"edited_content é obrigatório para edit_accept"` |

---

## 8. Máquinas de Estado

### MeetingCapture

```
                    allow-list fail
                    ┌─────────────────────────────────► [CANCELLED]
                    │
[DRAFT] ──notify──► [NOTIFIED] ──upload──► [UPLOADED] ──stt_start──► [TRANSCRIBING]
            │                       │                                       │
            │  notif fail ≥1        │ upload_fail                    stt_complete
            ▼                       ▼                                       │
        [CANCELLED]            [ERROR] ◄────────────────────────────────── │
                                                                     extraction_start
                                                                           ▼
        [DONE] ◄──────────────────────────────────────────────── [EXTRACTING]
                                                                           │
                                                                    extraction_fail
                                                                           ▼
                                                                       [ERROR]
```

Transições de CANCELLED: qualquer estado não-terminal pode transitar para CANCELLED por ação de Admin.
Transições de ERROR: estados TRANSCRIBING e EXTRACTING podem transitar para ERROR por falha do pipeline.

### WikiProposal

```
[pending] ──hitl_accept──────────► [accepted]
     │
     ├──hitl_edit_accept──────────► [edited_accepted]
     │
     └──hitl_reject───────────────► [rejected]
```

`pending` é o único estado inicial. Não há transição automática de `pending` — requer ação de PX-01.

---

## 9. Rastreabilidade

### Mapa FR ↔ RF ↔ CAs

| FR | RF | CAs cobertos |
|----|----|--------------|
| FR-190 | RF-01 | CA-01, CA-02, CA-16 |
| FR-191 | RF-02 | CA-03, CA-04 |
| FR-192 | RF-03 | CA-05, CA-06, CA-07 |
| FR-193 | RF-04 | CA-08, CA-09, CA-18 |
| FR-194 | RF-05 | CA-10, CA-11, CA-17 |
| FR-195 | RF-06 | CA-12, CA-13, CA-14, CA-15, CA-19 |

### Mapa RN ↔ Princípios ↔ CAs

| RN | Princípio constitution | CA |
|----|------------------------|----|
| RN-031 | §1.1 (opt-in), §1.2 (notificação bloqueante) | CA-01, CA-03, CA-04 |
| RN-032 | §1.4 (HITL obrigatório) | CA-11, CA-17 |
| RN-013 | §1.3 (LGPD 12 meses) | CA-13, CA-19 |
| RN-011 | §3.2 (caixa-preta 404) | CA-12, CA-15 |
| RN-010 | §3.1 (cross-client guard) | CA-15 |
| RN-012 | §3.3 (audit log imutável) | CA-14 |
