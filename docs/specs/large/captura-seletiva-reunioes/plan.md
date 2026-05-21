---
spec-id: SPEC-016
slug: captura-seletiva-reunioes
artefato: plan
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
  contexto: "Plano de implementação faseado (A–F) para FA-16, cobrindo schema DB, notificação, STT, extração LangGraph, HITL Wiki e RBAC/audit."
upstream:
  - docs/specs/large/captura-seletiva-reunioes/design.md (SPEC-016 design)
  - docs/specs/large/onboarding-oraculo-cliente/spec.md (FA-15 / SPEC-015)
---

# Plano de Implementação — FA-16 Captura Seletiva de Reuniões (SPEC-016)

## 1. Stack Tecnológica

| Camada | Tecnologia | Versão | Justificativa |
|--------|-----------|--------|---------------|
| Frontend pages | Next.js App Router | 14 | Padrão do projeto |
| Frontend state | React Context | — | CaptureContext (polling + flow T-43/T-44) |
| Frontend UI | Inline styles + Lucide React | — | Padrão do projeto (sem Tailwind classes) |
| Backend API | FastAPI | 0.110+ | Padrão do projeto |
| Async jobs | FastAPI BackgroundTasks | — | Consistência com SPEC-015 ADR-LOCAL-02 (v1 Piloto) |
| STT | Google Cloud Speech-to-Text | v1p1beta1 | GCP nativo, suporte pt-BR + diarization (ADR-LOCAL-01) |
| Agent extração | LangGraph StateGraph | 0.2+ | Extração por categoria com retry seletivo |
| LLM | Gemini Flash (LangChain) | — | Padrão de custo/performance do projeto |
| DB | PostgreSQL (Cloud SQL shared) | 15 | Padrão do projeto |
| ORM | SQLAlchemy | 2.x | Padrão do projeto |
| Validação | Pydantic v2 | 2.x | Padrão do projeto |
| Storage áudio | Google Cloud Storage | — | Bucket `sunos-captures`, lifecycle delete 12 meses (LGPD) |
| Notificação | SMTP / SendGrid | — | Email simples a participantes (PRE-04) |

---

## 2. Fases de Implementação

### Fase A — Foundation Backend (estimativa: 2–3 dias)

⚠️ **BLOQUEADA PRE-01**: tabela `wiki_entities` de SPEC-015 deve existir em staging antes do início.

- **Objetivo**: Schema de DB (5 tabelas), modelos SQLAlchemy, schemas Pydantic, router com stubs.
- **Entregáveis**:
  - Migration SQL (`meeting_captures`, `meeting_transcripts`, `extraction_items`, `wiki_proposals`, `capture_allowlist`)
  - `api/capture/schemas.py` — todos os tipos Pydantic v2 (CaptureCreate, CaptureStatus, TranscriptResponse, ExtractionItem, WikiProposalCreate, ProposalReview)
  - `api/capture/models.py` — SQLAlchemy 2.x models
  - `api/capture/router.py` — endpoints com stubs (POST /captures, GET /status, POST /upload, etc.)
  - `api/capture/service.py` — funções stub com TODO comments + caixa-preta 404 pattern
  - Registro do router em `api/main.py`

### Fase B — Notificação + Upload (estimativa: 2–3 dias)

- **Objetivo**: Opt-in flow, allow-list check, notificação a participantes por e-mail, upload para GCS.
- **Pré-requisitos**: Fase A + PRE-02 (STT API habilitada) + PRE-03 (GCS bucket criado).
- **Entregáveis**:
  - `api/capture/notifier.py` — envio de e-mail via SMTP/SendGrid com template de aviso de gravação + link política de privacidade (PRE-04)
  - Endpoint `POST /captures/{id}/notify` funcional
  - GCS upload endpoint `POST /captures/{id}/upload` (multipart, formatos mp3/mp4/wav/m4a)
  - Allow-list CRUD em `service.py` + endpoints `GET/POST/PATCH /capture-allowlist`
  - `components/capture/CaptureInitForm.tsx` — formulário opt-in
  - `components/capture/ParticipantList.tsx` — lista com status de notificação
  - `components/capture/AudioUploader.tsx` — drag & drop + progress bar
  - `app/clientes/[clientSlug]/captures/new/page.tsx` — T-43 (parcial: até upload)

### Fase C — Transcrição (estimativa: 3–4 dias)

- **Objetivo**: Google STT integration com diarization, armazenamento de transcript, polling de status.
- **Pré-requisitos**: Fase B.
- **Entregáveis**:
  - `api/capture/transcriber.py` — Google STT client: `gcs_uri` → STT → `SpeakerSegment[]` + `content_text`
  - BackgroundTask de STT integrado ao endpoint de upload (dispara após GCS path salvo)
  - Endpoint `GET /captures/{id}/status` (polling)
  - Endpoint `GET /captures/{id}/transcript` (com RBAC gate — apenas PX-01 Admin/Curador)
  - `components/capture/TranscriptViewer.tsx` — segmentos com speaker label + timestamp
  - `contexts/CaptureContext.tsx` — polling 10s com backoff
  - T-44 page (`app/.../captures/[captureId]/page.tsx`) parcial — exibe transcript
  - Testes: mock Google STT com fixture de transcript pt-BR

### Fase D — Agente de Extração (estimativa: 3–5 dias)

- **Objetivo**: LangGraph StateGraph que extrai DECISION / NEXT_STEP / ENTITY / BRIEFING do transcript com campo `confidence`.
- **Pré-requisitos**: Fase C.
- **Entregáveis**:
  - `api/capture/extractor.py` — LangGraph StateGraph: node por item_type + node de agregação
  - BackgroundTask de extração (dispara após STT completar, atualiza status → EXTRACTING → DONE)
  - Endpoint `GET /captures/{id}/extractions`
  - `components/capture/ExtractionPanel.tsx` — lista agrupada por tipo, badge de confiança
  - T-44 page atualizada — exibe extraction panel
  - Testes unitários: mock Gemini Flash com fixture de extração; verificar os 4 item_types + confiança

### Fase E — HITL + Wiki Integration (estimativa: 3–4 dias)

⚠️ **BLOQUEADA PRE-01**: SPEC-015 deve estar em staging para que `wiki_entities` aceite merge.

- **Objetivo**: Propostas de atualização de Wiki com diff before/after, revisão HITL por PX-01, merge aprovado em `wiki_entities`.
- **Pré-requisitos**: Fase D + PRE-01 (SPEC-015 implementado em staging).
- **Entregáveis**:
  - `api/capture/wiki_proposer.py` — gera `wiki_proposals` a partir de `extraction_items`; snapshot `before_content` de `wiki_entities`
  - Endpoint `POST /captures/{id}/proposals` (gera propostas)
  - Endpoint `GET /captures/{id}/proposals`
  - Endpoint `PATCH /proposals/{proposal_id}` (HITL: accept / edit_accept / reject) + merge em `wiki_entities` no accept
  - `components/capture/WikiProposalCard.tsx` — diff side-by-side before/after
  - `components/capture/ProposalActionBar.tsx` — Aceitar / Editar / Rejeitar
  - T-44 page completa — seção de proposals após extractions
  - Testes: flow HITL accept → wiki_entities atualizado; reject → wiki_entities inalterado

### Fase F — RBAC + Audit + Piloto (estimativa: 2–3 dias)

- **Objetivo**: RBAC gate para transcrição (caixa-preta), audit log de acesso, smoke test com cliente real.
- **Pré-requisitos**: Fases A–E + PRE-04 (política privacidade publicada) + PRE-05 (cliente piloto disponível).
- **Entregáveis**:
  - RBAC middleware/guard em `service.py`: `GET /transcript` apenas para Admin/Curador (404 para Operacional)
  - Audit log INSERT em cada acesso negado (`DENIED_CROSS_CLIENT`, `DENIED_RBAC`) e em cada decisão HITL (`PROPOSAL_ACCEPTED`, `PROPOSAL_REJECTED`)
  - Testes de integração cobrindo todos os CAs (CA-01 a CA-16)
  - CA-12 (caixa-preta transcript) testado com perfil Operacional real
  - Lifecycle policy GCS verificada (objeto expira em 12 meses)
  - Deploy em staging + smoke test JN-14 ponta-a-ponta com cliente piloto
  - Runbook: como executar captura do zero (upload → HITL → wiki atualizada)

---

## 3. Sequência e Dependências

```
[PRE-01: SPEC-015 em staging]
         │
         ▼
    Fase A (Foundation Backend)
         │
         ├──► Fase B (Notify + Upload)
         │              │
         │              └──► Fase C (Transcrição)
         │                           │
         │                           └──► Fase D (Extração)
         │                                        │
         │                    [PRE-01: wiki_entities disponível para merge]
         │                                        │
         └────────────────────────────────────────►Fase E (HITL + Wiki)
                                                            │
                                                            └──► Fase F (RBAC + Piloto)
```

**Fases B, C e D são sequenciais** por dependência de dados (precisa de upload para transcrever, transcript para extrair).

**Fase A pode iniciar imediatamente** desde que PRE-01 seja satisfeito (tabela `wiki_entities` existe).

---

## 4. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Google STT latência > 60 min para gravações longas (> 2h) | Média | Alto | Chunking em segmentos de 30 min; processar em paralelo e concatenar segmentos |
| Precisão diarization < 85% (ruído, sotaque, overlap de fala) | Média | Médio | Pós-processamento heurístico; T-44 permite correção manual de speaker labels |
| PRE-01 (SPEC-015) não pronto antes de Fase E | Média | Médio | Fases A–D independentes de wiki_entities; Fase E espera até SPEC-015 estar em staging |
| E-mail de notificação rejeitado por spam filter | Baixa | Alto | Remetente @suno.com.br com SPF/DKIM configurado; fallback in-app notification |
| LGPD: participante solicita exclusão de transcrição | Baixa | Alto | Endpoint `DELETE /captures/{id}` com hard delete em GCS + soft delete de metadata no DB (manter audit log) |
| Quota STT esgotada em Piloto | Baixa | Médio | Monitorar quota GCP; Piloto ≤ 5 reuniões/semana × ~60 min = ~300 min/semana (≈ USD 5/semana) |
| BackgroundTask morto por reinício do Cloud Run durante STT longo | Baixa | Médio | Checkpoint `status=TRANSCRIBING` no DB; na próxima request de status, re-enqueue automático |

---

## 5. Critérios de Pronto (Definition of Done)

- [ ] Migration SQL executada em staging sem erro
- [ ] `npx tsc --noEmit` sem erros
- [ ] Todos os CAs (CA-01 a CA-16) verificados manualmente ou em teste automatizado
- [ ] CA-12 (caixa-preta transcript) testado com perfil Operacional real
- [ ] JN-14 completo executado com cliente piloto real (gravação de reunião real)
- [ ] Audit log de acesso persistindo corretamente (testar accept + reject + cross-client)
- [ ] Lifecycle policy GCS configurada e verificada (objeto de teste expira conforme esperado)
- [ ] Política de privacidade (PRE-04) linkada no e-mail de notificação
- [ ] `docs/specs/large/captura-seletiva-reunioes/spec.md` status → `implementada`
- [ ] Handoff doc criado em `docs/handoff/sessions/`
