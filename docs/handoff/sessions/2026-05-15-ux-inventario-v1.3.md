# Handoff — 2026-05-15 — UX Inventário v1.3

**Duração aproximada:** ~45min (retomada de contexto comprimido)
**Foco:** Atualizar `docs/ux/parte1-inventario-telas.md` para refletir as evoluções do BRD v1.3/1.4/1.5 — fase Piloto vs. Momento 2, BR-021 (Wiki Ontológica), PRE-03b LGPD.

---

## O que foi feito

### UX Parte 1 — Inventário de Telas (v1.2 → v1.3)

**Fase corrigida para Momento 2 (9 telas):**

| Tela | Feature | BRD justificativa |
|------|---------|-------------------|
| T-06, T-07, T-08 | FA-02 Moon Shot | BR-001 = Momento 2 |
| T-26 | FA-10 Homogeneização | BR-014 = Momento 2 |
| T-29, T-30, T-31 | FA-13 Aprovação | BR-017 = Momento 2 |
| T-37, T-38 | FA-16 Captura Seletiva | BR-020 = Momento 2 |

Prioridade dessas telas mudou de `P0/P1/P2` para `M2 (Momento 2)`.

**Nova tela T-39 — Wiki Ontológica:**
- Nome: "Wiki Ontológica — Painel de Entidades do Cliente"
- FA: FA-15 / BR-021
- Rota: `/clientes/[clientSlug]/wiki`
- Personas: PX-01 (curadoria), PX-07 (aprovação)
- Fase: P2 Piloto (BR-021 é Piloto)
- Subsections §11.7.21 a §11.7.28 inseridas dentro da seção §11.7 (FA-15)
- HITL obrigatório (RN-032), gate PRE_ACTIVE/ACTIVE (FR-184), caixa-preta Operacional (RN-011)
- Badge de origem por entidade: `seed automático` / `revisado HITL` / `atualizado via captura [ID reunião]`

**T-37 — PRE-03b explicitado:**
- Alerta de conformidade: adicionado `PRE-03b — LGPD Art. 7`
- Sub-bullet de badge "Participantes externos" reescrito: exige **consentimento explícito** antes de transcrição
- Tooltip informativo adicionado

**Seções marcadas como Momento 2:**
- `## 4. FA-02 — Moon Shot (Momento 2)`
- `## 11.5. FA-13 — Aprovação Hierárquica (Momento 2)`
- `## 11.8. FA-16 — Captura Seletiva de Reuniões (Momento 2)`

**Convenção M2 adicionada:**
- Nota de rodapé da tabela: `M2 = Momento 2 (pós-Piloto)` incluída

**§1.1 Escopo atualizado:**
- Features Momento 2 identificadas inline: `FA-02 *(Momento 2)*`, `FA-13 *(Momento 2)*`, `FA-16 *(Momento 2)*`

**Cobertura FA:**
- FA-02: `T-06, T-07, T-08 (Momento 2)`
- FA-13: `T-29, T-30, T-31 (Momento 2)`
- FA-15: `T-34, T-35, T-36, T-39`
- FA-16: `T-37, T-38 (Momento 2) — PRE-03b, LGPD Art. 7`

**Totais atualizados:** 39 telas (18 existentes + 1 em refactor + 20 a construir)

**§1.4 Objetos de Domínio — 5 novos DOs adicionados:**

| DO | Objeto | Feature | Telas |
|----|--------|---------|-------|
| DO-55 | WikiEntity (entidade ontológica do cliente) | FA-15, BR-021 | T-36, T-38, T-39 |
| DO-56 | EntityUpdateProposal (proposta de atualização de reunião) | FA-16, BR-021 | T-38, T-39 |
| DO-57 | ClientSeed (estado PRE_ACTIVE / ACTIVE) | FA-15 | T-34, T-35, T-36, T-39 |
| DO-58 | MeetingCapture (reunião com captura ativada) | FA-16 | T-37, T-38 |
| DO-59 | MeetingTranscript / TranscriptSegment | FA-16 | T-38 |

**UX Parte 2 — Arquitetura de Informação (v1.0 → v1.1):**
- **§5.7 Moon Shot**: header marcado `(Momento 2)`
- **§5.6 Mensuração**: T-26 anotado como `Momento 2` (BR-014)
- **§5.8–5.11 novos módulos**: FA-13 Aprovação (M2), FA-14 Drive Suno (Piloto), FA-15 Onboarding Oráculo (Piloto, inclui T-39 + gate PRE_ACTIVE/ACTIVE + caixa-preta wiki), FA-16 Captura Seletiva (M2, PRE-03b)
- **§10.2 Módulos Paralelos**: tabela ampliada com Aprovações, Drive Suno, rotas `/clientes/[slug]/wiki` e `/onboarding/*`; PX-08 em Workflows
- **§12 Visibilidade**: 5 novas linhas (T-29/30/31, T-32/33, T-37/38, T-39)
- **§15.2 Componentes**: 11 novos (T-29 a T-39): ApprovalInbox, SubmissionDetail, DriveSyncDashboard, OnboardingWizardOráculo, EntityValidationStepper, CaptureOptInModal, TranscriptReviewPanel, WikiDiffPanel, WikiOntologicaPanel, etc.
- **§15.3 Contexts**: OnboardingOraculoContext, MeetingCaptureContext, WikiOntologicaContext

**§12 Fluxos por Jornada — 3 mudanças:**
- **JN-13 atualizado**: término do fluxo agora inclui `T-39` (Wiki Ontológica acessível pós-ACTIVE) além de T-17
- **JN-15 adicionada**: Sponsor/Líder acessa T-39 diretamente para editar entidades sem precisar de reunião (jornada recorrente pós-onboarding)
- **JN-17 adicionada**: Governança Setorial — Sponsor percorre T-39 → T-24 → T-25 → T-20/T-21 para acompanhar adoção e ajustar workflows da área
- Nota do §12 atualizada: referencia PRD Parte 3 v1.2 (17 jornadas formalizadas, JN-00 a JN-17)

---

## Decisões tomadas

| Decisão | Justificativa |
|---------|--------------|
| T-39 como P2 Piloto (não M2) | BR-021 (Wiki Ontológica) é explicitamente Piloto no BRD Parte 3 |
| T-26 como M2 | BR-014 (Homogeneização Coletiva) é Momento 2 no BRD |
| FA-11 Safety — sem alteração de fase | BR-012/BR-013 estão no range Piloto (BR-002 a BR-013) |
| PRE-03b em T-37 | Gravação de reuniões requer consentimento explícito LGPD Art. 7 (decisão BRD 14/05) |
| JN-15 como jornada própria (não extensão de JN-13) | Wiki consultada diretamente é recorrente e tem atores distintos (PX-07 sem wizard) — merece fluxo separado |

---

## Arquivos modificados

- `docs/ux/parte1-inventario-telas.md` — v1.3
- `docs/ux/parte2-arquitetura-informacao.md` — v1.1

---

## Pendências

- **UX Parte 3** (Screen Specs): pode precisar de atualização análoga pós-FA-15/FA-16

---

## Próximo passo natural

Criar SPEC-007 para FA-15 (Onboarding com Oráculo do Cliente) usando `/project:new-spec` — a UX agora está completa o suficiente para suportar o SDD. Alternativamente, revisar UX Parte 2 (AI) para refletir as fases Momento 2.

---

## Aprendizados / pegadinhas

- **Não confundir fase de BRD (Piloto/Momento 2) com prioridade UX (P0/P1/P2):** são escalas diferentes. Criada notação `M2 (Momento 2)` para distinguir de P0/P1/P2 dentro do Piloto.
- **BR-014 (Homogeneização) afeta T-26** — a tela de Homogeneização Coletiva estava como `P2 (MVP)` mas BR-014 é Momento 2. Não é só semântica: sinaliza para o time de design que essa tela não entra no Piloto.
- **Scripts Python Part 1 sem write:** bug clássico de sessão longa — o primeiro script não tinha o `f.write()`. Aplicado em correção separada.
