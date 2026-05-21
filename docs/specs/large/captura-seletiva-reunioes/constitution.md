---
spec-id: SPEC-016
slug: captura-seletiva-reunioes
artefato: constitution
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
  contexto: FA-16 — Captura Seletiva de Reuniões. Permite que o Creator faça upload de gravações de reuniões estratégicas, obtenha transcrição automática com diarization (pt-BR), extração estruturada de decisões/próximos passos/entidades/briefings, e proponha atualizações para a Wiki Ontológica do cliente com HITL obrigatório. Sempre opt-in por reunião, nunca automático. Scope Piloto: source_type UPLOAD apenas (GMEET_BOT e TEAMS_BOT são pós-Piloto).
upstream:
  - docs/brd/parte3-requisitos.md (BR-020)
  - docs/brd/parte4-regras.md (RN-031, RN-032, RN-013, RN-009, RN-011, RN-012)
  - docs/prd/parte1-feature-map.md (FA-16)
  - docs/prd/parte4-FRs.md (FR-190–FR-195)
  - docs/srd/parte2-domain-model.md (DO-59 MeetingCapture, DO-60 MeetingTranscript)
  - docs/ux/parte1-inventario-telas.md (T-43 Modal Iniciar Captura, T-44 Revisão de Transcrição, JN-14)
  - docs/brd/parte3-requisitos.md (BR-004, BR-007, BR-008)
pre_conditions:
  - PRE-01: FA-15 (SPEC-015) implementado — tabela `wiki_entities` deve existir e `OntologyEntityType` deve estar disponível em `lib/onboarding-types.ts` para que FR-194 (proposta para Wiki Ontológica) funcione. Bloqueia Fase C em diante.
  - PRE-02: Google Speech-to-Text API habilitada no projeto GCP com quota suficiente para transcrição de arquivos de até 2GB (≤3h de áudio). Verificar antes de Fase A.
  - PRE-03: GCS bucket `sunos-meeting-captures-{env}` criado com lifecycle policy de 12 meses configurada (LGPD Art. 13 + RN-013). Object lifecycle rule: `delete` após `age: 365 dias`. Bloqueia qualquer upload real.
  - PRE-04: Política de privacidade publicada com URL pública e estável (ex: `suno.com.br/privacidade`) para inclusão obrigatória na notificação de participantes (FR-191). Requer alinhamento jurídico antes de deploy em produção. Bloqueia Fase D.
  - PRE-05: Cliente piloto identificado com pelo menos uma gravação de reunião real (≥30 min, ≤6 participantes) disponível para smoke test de diarization e extração. Bloqueia validação de CA-07.
---

# Constitution — Captura Seletiva de Reuniões (FA-16)

Princípios imutáveis que guiam toda implementação desta SPEC. O agente de codificação deve respeitar estes princípios em TODAS as decisões. Quando houver tensão entre velocidade e princípio, o princípio vence.

## 1. Princípios de Arquitetura

1. **Captura é sempre opt-in por reunião (FR-190 + RN-031).** Não há captura automática, programada, em background, ou por inferência de calendário. Toda `MeetingCapture` começa com ação explícita de PX-03 no modal T-43. `consent_confirmed` nunca é `true` por default — requer ação afirmativa do solicitante. Nenhum job, agente ou regra pode criar `MeetingCapture` de forma autônoma.

2. **Notificação a participantes é pré-condição de qualquer gravação (FR-191 + RN-031).** O pipeline de upload não pode ser iniciado antes de todas as notificações obrigatórias serem entregues. Se a notificação falhar para qualquer participante que tenha email registrado, a captura é abortada (`status = CANCELLED`) — sem exceção, sem "retry silencioso", sem "maioria notificada é suficiente". A URL da política de privacidade (PRE-04) deve estar presente em toda notificação enviada.

3. **Transcrição bruta é dado sensível (LGPD Art. 7 + RN-013).** `MeetingTranscript` com conteúdo bruto (`content_raw`) é restrito a participantes da reunião + Líder/Admin do cliente. Nunca exposta a Operacional. GCS lifecycle de 12 meses é a única forma de retenção; não há exceção para "reuniões importantes". Após 12 meses, o áudio bruto e a transcrição bruta são purgados automaticamente pelo lifecycle do GCS — sem intervenção de código.

4. **HITL obrigatório antes de consolidar na Wiki Ontológica (RN-032).** `WikiProposal.status` começa em `pending`; só transita para `accepted`, `edited_accepted` ou `rejected` por decisão explícita de PX-01 (Líder). Nenhum job, agente, regra de confiança alta (mesmo `confidence=high`) ou cron pode mudar o status para `accepted` automaticamente. A UI deve mostrar diff entre entidade Wiki existente e proposta nova antes de qualquer aceite.

5. **Proveniência rastreável em toda extração (FR-193).** Cada `ExtractionItem` carrega `capture_id`, `timestamp_utterance`, `speaker` e `confidence`. Cada `WikiProposal` carrega `ProposalProvenance` completa (ID da captura, título da reunião, data, participantes, IDs dos itens de extração que motivaram a proposta). Dado sem proveniência verificável não pode entrar na Wiki.

6. **Áudio bruto fica exclusivamente em GCS (PRE-03).** `audio_gcs_path` armazena apenas o caminho no bucket — nunca o binário em coluna DB, Redis, ou qualquer outro store. O GCS bucket possui lifecycle policy de 12 meses; não há código de deleção manual no app. O backend nunca devolve conteúdo binário do áudio via API (apenas signed URL com TTL curto se necessário para preview).

## 2. Princípios de Qualidade

1. **SLAs de processamento documentados e monitorados.** Transcrição disponível em ≤1h após upload (p95); extração concluída em ≤30 min após transcrição (p95). Métricas `capture_transcription_latency_seconds` e `capture_extraction_latency_seconds` instrumentadas via Prometheus. Alertas configurados se p95 ultrapassar os limites por ≥2 períodos consecutivos.

2. **Diarization ≥85% para reuniões de até 6 participantes.** Precisão de speaker labels avaliada no smoke test com cliente piloto (PRE-05). Se o modelo de STT retornar `speaker_labels = null` ou cobertura inferior, o pipeline marca `diarization_quality = degraded` e notifica Admin — não falha silenciosamente.

3. **Notificação entregue em ≤2 min do acionamento (FR-191).** Job de envio de notificação tem SLO de 2 minutos do momento em que PX-03 confirma o modal T-43. Falha de envio (bounce, timeout SMTP, erro SendGrid) dispara abortagem da captura imediatamente.

## 3. Princípios de Segurança

1. **Cross-client guard obrigatório (RN-010).** Toda query em tabelas `meeting_captures`, `meeting_transcripts`, `extraction_items`, `wiki_proposals` filtra `client_id` resolvido do JWT. Não é validação pós-fetch — é cláusula `WHERE client_id = :client_id` no SELECT. `client_id` é coluna redundante denormalizada em todas essas tabelas por este motivo.

2. **Transcrição bruta aplica caixa-preta (RN-011).** `GET /api/clients/{slug}/captures/{id}/transcript` retorna **404** para qualquer usuário que não seja participante registrado da reunião, Líder ou Admin do cliente — nunca 403. O endpoint não revela se a transcrição existe ou não para quem não tem acesso. Frontend recebe 404 e redireciona para `/404` sem distinguir os casos (mesmo padrão de SPEC-006 e SPEC-015).

3. **Audit log imutável de todo acesso a transcrição (RN-012).** Toda leitura de `MeetingTranscript` (mesmo para participantes autorizados), toda decisão HITL em `WikiProposal`, e todo acionamento de captura são persistidos em `audit_log_captures` com `event_type`, `user_id`, `capture_id`, `client_id`, `timestamp_utc`, `severity`. A tabela tem trigger PG bloqueando UPDATE e DELETE — imutabilidade garantida em nível de banco.

## 4. Stack e Dependências Aprovadas

| Dependência | Contexto | Propósito | Status |
|-------------|----------|-----------|--------|
| `fastapi` | `api/` | Endpoints REST | Já no projeto |
| `langgraph`, `langchain-core`, `langchain-google-genai` | `api/` | LangGraph StateGraph para pipeline de extração | Já no projeto |
| `google-cloud-speech` | `api/` | Google Speech-to-Text API (STT + diarization pt-BR) | A confirmar em `api/pyproject.toml`; se ausente, adicionar com ADR-LOCAL |
| `google-cloud-storage` | `api/` | GCS upload/download de áudio bruto | A confirmar; provavelmente já presente |
| `sqlalchemy` (2.0) + `asyncpg` | `api/` | Persistência | Já no projeto |
| `alembic` | `api/` | Migrations | Já no projeto |
| `pydantic` v2 | `api/` | Schemas | Já no projeto |
| `sendgrid` ou `smtplib` | `api/` | Notificação email a participantes | Selecionar via ADR-LOCAL-01 desta SPEC |
| `mlflow` | `api/` | Tracing do pipeline de extração | Já no projeto |
| `lucide-react` | Frontend | Ícones (size 14, strokeWidth 1.5) | Já no projeto |
| Next.js 14 App Router | Frontend | Páginas e rotas | Já no projeto |

**Dependências explicitamente proibidas nesta SPEC:**

- Qualquer SDK de bot de videoconferência (Google Meet Bot API, Microsoft Teams Bot Framework) — pós-Piloto, requer nova ADR.
- Qualquer biblioteca de transcrição local (Whisper, faster-whisper) — Google STT é o STT aprovado para o Piloto (GCP nativo, menor superfície de integração).
- `@xyflow/react` — exclusivo do Canvas SPEC-005 (ADR-LOCAL-05 daquela SPEC).

## 5. Dependências de Outras SPECs / Componentes

1. **FA-15 (SPEC-015) — PRE-01 bloqueante.** `wiki_entities` table e `OntologyEntityType` enum devem existir para que `WikiProposal.entity_type` seja tipado corretamente. Sem FA-15 implementado, FR-194 não pode ser ativado.

2. **FA-01 Biblioteca (BC-02).** `MeetingCapture` e `MeetingTranscript` vivem no bounded context BC-02 (Content & Knowledge), confirmado em DO-59/DO-60. Pipeline de extração pode opcionalmente criar `KnowledgeItem`s — se essa integração for necessária no Piloto, consultar `api/chat/ingestion/` e tratar como dependência de Fase C.

3. **FA-09 RBAC.** Roles `Operacional`, `Líder`, `Sócio`, `Admin` precisam estar em produção. RBAC de acesso à transcrição (`participantes + Líder/Admin`) depende de resolução correta do JWT. Sem isso, o guard de caixa-preta não funciona.

4. **CTM-01 Auth Gateway.** JWT com `client_id` e `roles` resolvíveis é pré-requisito de todos os endpoints desta SPEC.

## 6. Anti-patterns Proibidos

1. **Nunca iniciar upload ou transcrição sem todas as notificações confirmadas.** Mesmo que "a maioria" dos participantes tenha email, mesmo que o participante sem email seja o próprio solicitante — a regra é todos com email registrado devem receber notificação antes de qualquer gravação começar.

2. **Nunca auto-merge de WikiProposal sem HITL (RN-032).** Mesmo que `confidence = high` em todos os itens, mesmo que PX-01 "aprove o lote" via workaround externo. O botão de aceite individual por proposta é o único caminho para `accepted`.

3. **Nunca retornar 403 para transcrição não-autorizada — sempre 404 (RN-011).** O endpoint `/api/clients/{slug}/captures/{id}/transcript` não distingue "não existe" de "você não pode ver" para quem está fora da lista de participantes/Líder/Admin.

4. **Nunca armazenar áudio bruto em banco de dados ou Redis.** O binário do áudio fica exclusivamente no GCS bucket com lifecycle de 12 meses. Colunas de banco armazenam apenas `audio_gcs_path` (string).

5. **Nunca compartilhar transcrição entre clientes.** `client_id` no WHERE de toda query. JOIN cross-client é brecha de cross-tenant — proibido mesmo por acidente.

6. **GMEET_BOT e TEAMS_BOT proibidos no Piloto.** `source_type` aceita apenas `UPLOAD` na Fase A–E desta SPEC. Qualquer tentativa de criar captura com `source_type != 'UPLOAD'` retorna 422. Introduzir bot de videoconferência requer nova ADR com escopo, modelo de dados e testes de consentimento, não é extensão desta SPEC.

7. **Nunca elevar source_type sem nova ADR.** Mesmo que cliente piloto solicite integração direta com Google Meet durante o Piloto, a decisão de adicionar `GMEET_BOT` é arquitetural e requer ADR aprovado + alinhamento de privacidade/LGPD antes de implementação.

8. **Nunca logar conteúdo da transcrição em logs estruturados.** Logs registram `capture_id`, `status`, `latency_ms`, `error_type` — nunca trechos de texto da transcrição. Trecho de transcrição em log = dado sensível em sistema de observabilidade sem controle de RBAC equivalente.

## 7. Critérios de Pronto (DoD da SPEC)

A SPEC será considerada implementada quando:

- [ ] FR-190 a FR-195 cobertos por código + testes mapeados para CAs de `spec.md`
- [ ] PRE-01 resolvido (FA-15 em produção com `wiki_entities` disponível)
- [ ] PRE-03 resolvido (GCS bucket criado com lifecycle de 12 meses configurada)
- [ ] PRE-04 resolvido (URL de privacidade publicada e validada juridicamente)
- [ ] Migrations Alembic aplicadas em staging para `meeting_captures`, `meeting_transcripts`, `extraction_items`, `wiki_proposals`, `audit_log_captures`
- [ ] Endpoints REST de captura respondendo 2xx no caminho feliz e 4xx documentados, com testes de contrato (pytest + httpx)
- [ ] T-43 (Modal Iniciar Captura) e T-44 (Revisão de Transcrição) navegáveis em staging com dados seed
- [ ] Pipeline STT processando arquivo de teste com diarization e latência documentada
- [ ] Pipeline de extração LangGraph produzindo itens estruturados com proveniência
- [ ] HITL de WikiProposals funcional com diff antes/depois
- [ ] Audit log imutável validado com teste destrutivo (UPDATE/DELETE em `audit_log_captures` lança exceção)
- [ ] Métrica `capture_transcription_latency_seconds` instrumentada com p95 documentado
- [ ] CLAUDE.md (raiz) atualizado com rota `/captures` + módulo `api/captures/`
- [ ] Handoff de fim de SPEC criado em `docs/handoff/sessions/`

---

**Tudo o que vier a seguir (`spec.md`, `design.md`, `plan.md`, `tasks.md`) deve obedecer literalmente este documento. Se uma decisão de design ou task entrar em conflito com um princípio aqui, a SPEC para — não o princípio.**
