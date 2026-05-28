---
documento: SRD Parte 7 - Architecture Decision Records (ADRs)
projeto: sunOS
cliente: Suno United Creators (uso 100% interno)
versao: 2.0
data_criacao: 2026-04-28
ultima_atualizacao: 2026-05-15
autor: Heitor Miranda + Claude (Koro Docs Pipeline)
status: Ativo — Índice de Redirecionamento
fonte_adr: docs/adr/
total_adrs: 13
---

# SRD Parte 7 — Architecture Decision Records (ADRs)

> **Atenção (2026-05-15):** O catálogo canônico de ADRs migrou para `docs/adr/`. Este documento é agora um **índice de redirecionamento** — não contém mais o texto completo dos ADRs. Leia as fontes canônicas em `docs/adr/*.md`.

---

## 1. Catálogo Canônico (Fonte Única de Verdade)

Os 13 ADRs do sunOS estão em `docs/adr/` no formato Michael Nygard:

| ADR | Arquivo canônico | Título | Status | Data |
|-----|-----------------|--------|--------|------|
| **ADR-001** | `docs/adr/ADR-001-agent-builder-deferred.md` | Agent Builder — Adiado (superseded por ADR-003) | **Superseded** | 2026-04-14 |
| **ADR-002** | `docs/adr/ADR-002-single-engine-not-deep-agent-per-client.md` | Engine único com context injection (não Deep Agent por cliente) | **Aceito** | 2026-04-14 |
| **ADR-003** | `docs/adr/ADR-003-workflow-builder-visual.md` | Workflow Builder Visual Drag-and-Drop como paradigma operacional | **Aceito** | 2026-05-14 |
| **ADR-004** | `docs/adr/ADR-004-pipeline-extracao-binarios-gcs.md` | Pipeline de extração de binários via GCS | **Aceito** | — |
| **ADR-005** | `docs/adr/ADR-005-chunking-por-tipo-de-documento.md` | Chunking especializado por tipo de documento | **Aceito** | — |
| **ADR-006** | `docs/adr/ADR-006-integracao-google-drive-oauth.md` | Integração Google Drive read-only via OAuth per-operator | **Proposto** | 2026-05-14 |
| **ADR-007** | `docs/adr/ADR-007-cadastro-ontologico-cliente.md` | Cadastro Ontológico de Cliente (SPEC-015 FA-15) | **Proposto** | 2026-05-14 |
| **ADR-008** | `docs/adr/ADR-008-rag-alloydb-pgvector-biblioteca.md` | RAG com AlloyDB + pgvector — Biblioteca Semântica | **Aceito** | 2026-05-14 |
| **ADR-009** | `docs/adr/ADR-009-llm-default-gemini-flash.md` | Gemini 2.5 Flash como LLM Default | **Aceito** | 2026-05-15 |
| **ADR-010** | `docs/adr/ADR-010-langgraph-orchestration-framework.md` | LangGraph como Framework de Orquestração | **Aceito** | 2026-05-15 |
| **ADR-011** | `docs/adr/ADR-011-firebase-auth-identity-provider.md` | Firebase Authentication como Provedor de Identidade | **Aceito** | 2026-05-15 |
| **ADR-012** | `docs/adr/ADR-012-deepagents-harness-bc04-bc07.md` | `deepagents` como Harness para BC-04 e BC-07 | **Proposto** | 2026-05-15 |
| **ADR-013** | `docs/adr/ADR-013-langfuse-llm-observability.md` | Langfuse como Plataforma de Observabilidade LLM (substitui MLflow) | **Aceito** | 2026-05-28 |

---

## 2. ADR-LOCALs (Scoped às SPECs)

Decisões de menor escopo que vivem dentro das SPECs específicas, não no catálogo global:

| SPEC | ADR-LOCAL | Decisão |
|------|-----------|---------|
| SPEC-004 (approval-hierarchy) | ADR-LOCAL-01 | Outbox pattern para publicação atômica de eventos |
| SPEC-004 (approval-hierarchy) | ADR-LOCAL-02 | Polling 30s no MVP (WebSocket é V2) |
| SPEC-004 (approval-hierarchy) | ADR-LOCAL-03 | Compatibilidade com `deepagents` (ADR-012) sem bloquear MVP |
| SPEC-004 (approval-hierarchy) | ADR-LOCAL-04 | Política de fallback quando approver inativo |
| SPEC-004 (approval-hierarchy) | ADR-LOCAL-05 | Validators em paralelo (não LLM genérico único) |
| SPEC-004 (approval-hierarchy) | ADR-LOCAL-06 | Hierarquia de aprovação configurável manualmente |
| SPEC-005 (workflow-builder-canvas) | ADR-LOCAL-01 a -05 | Canvas-specific decisions (ver `design.md` da SPEC-005) |
| SPEC-015 (onboarding-oraculo) | ADR-LOCAL-01 a -05 | Onboarding-specific decisions (ver `design.md` da SPEC-015) |
| SPEC-016 (captura-reunioes) | ADR-LOCAL-01 a -05 | Capture-specific decisions (ver `design.md` da SPEC-016) |

---

## 3. Mapa de Conflitos Resolvidos (v1.x → v2.0)

A versão anterior deste documento (v1.x) usava uma numeração local (SRD ADR-001..011) que conflitava com o catálogo canônico em `docs/adr/`. A tabela abaixo documenta a resolução aplicada em 2026-05-15:

| SRD v1.x (antigo) | Título SRD | Resolução em v2.0 |
|-------------------|------------|-------------------|
| SRD ADR-001 | Agent/Workflow Builder com LangGraph | → `docs/adr/` ADR-001 + ADR-003 (já existiam) |
| SRD ADR-002 | Engine único com context injection | → `docs/adr/` ADR-002 ✓ (idêntico) |
| SRD ADR-003 | pgvector como vector store | → `docs/adr/` ADR-008 (AlloyDB + pgvector, mais completo) |
| SRD ADR-004 | Gemini 2.5 Flash como LLM default | → **Promovido para `docs/adr/` ADR-009** |
| SRD ADR-005 | LangGraph como framework de orquestração | → **Promovido para `docs/adr/` ADR-010** |
| SRD ADR-006 | Firebase Auth como provedor de identidade | → **Promovido para `docs/adr/` ADR-011** |
| SRD ADR-007 | Skills como diretórios SKILL.md + references/ | → Incorporado em ADR-002 + documentado em `api/CLAUDE.md` (já na prática) |
| SRD ADR-008 | Validators paralelos (LangGraph sub-graph) | → **Demovido para ADR-LOCAL-05 em SPEC-004** (scoped a FA-13) |
| SRD ADR-009 | Drive read-only com curadoria sugestiva | → `docs/adr/` ADR-006 (mesma decisão, mais detalhada) |
| SRD ADR-010 | Hierarquia de aprovação configurável | → **Demovido para ADR-LOCAL-06 em SPEC-004** (scoped a FA-13) |
| SRD ADR-011 | `deepagents` harness para BC-04 e BC-07 | → **Promovido para `docs/adr/` ADR-012** (cross-cutting) |

---

## 4. Convenções

Formato Michael Nygard adotado em todos os ADRs canônicos:

- **Status**: `Proposto | Aceito | Superseded by ADR-XXX`
- **Contexto**: forças e drivers (BRs, NFRs, restrições operacionais)
- **Decisão**: o que foi decidido e detalhamento de implementação
- **Alternativas consideradas**: opções rejeitadas com justificativa
- **Consequências**: positivas ✅, negativas ⚠️, neutras
- **Rastreabilidade**: BRs / NFRs / containers afetados / ADRs relacionados
- **Critérios para revisitar**: checklist de quando reabrir a decisão

Para ADR-LOCALs (dentro de SPECs), o formato é compacto: Status, Contexto (1–2 frases), Decisão, Alternativas (lista numerada), Consequências (✅/❌/⚠️).

---

## 5. Histórico de Versões

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | 2026-04-28 | Heitor Miranda + Claude | Versão inicial. 2 ADRs catalogados + 5 propostos (v1 SRD ADR-001..007). |
| 1.1 | 2026-04-28 | Heitor + Claude | +3 ADRs propostos (SRD ADR-008..010): validators paralelos, Drive read-only, hierarquia aprovação. |
| 1.2 | 2026-04-28 | Heitor + Claude | Revisão ADR-002 (nota deepagents). +1 ADR proposto (SRD ADR-011: deepagents). |
| **2.0** | **2026-05-15** | **Heitor + Claude** | **Migração para índice de redirecionamento.** Catálogo canônico movido para `docs/adr/`. 4 ADRs promovidos (SRD ADR-004/005/006/011 → `docs/adr/` ADR-009..012). 2 decisões demovidas para ADR-LOCAL em SPEC-004 (SRD ADR-008/010). SRD ADR-003 absorvido por `docs/adr/` ADR-008. Count total: 8 → 12 ADRs canônicos. |
