# Handoff — 2026-06-23 — Oracle Deep Agent v2: redesign completo

**Duração aproximada:** ~4h (sessão longa incluindo contexto comprimido)  
**Foco:** Redesign arquitetural completo do Oracle de onboarding: de LangGraph 2-nós com 6 entidades hardcoded para deep agent com 9 entidades canônicas, subagentes paralelos, dual HITL para reuniões e 5 camadas de conhecimento.

---

## O que foi feito

### Análise e diagnóstico
- Auditou `api/onboarding/oracle_agent.py` — encontrou bug ativo: `add_reunion_context_to_oraculo` busca `entity_type="Briefings"` (plural) mas DB grava `"Briefing"` (singular) → silent no-op, integração de reuniões quebrada silenciosamente
- Identificou divergência entre 3 fontes: ADR-007 v1 (5 entidades), SPEC-015 v1 (6 entidades), implementação (6 diferentes) — voltou ao BRD como fonte autoritativa (BR-021, BR-022)
- Confirmou que `search_wiki` e `consultar_ontologia` fazem `SELECT *` (context stuffing), não RAG semântica
- ADR-012 NÃO está relacionado ao Oracle (é para BC-04 Moon Shot + BC-07 Drive/Approval) — ponto de confusão corrigido pelo usuário

### Decisões arquiteturais tomadas (sessão de design)
1. **Oracle = 1 deep agent + 9 subagentes** (não dois agentes separados) — ver `design.md`
2. **9 entidades backbone Type A**: CLIENT_PROFILE, MARKET_CONTEXT, COMPETITORS, BRAND_VOICE, TARGET_PERSONAS, LEGAL_CONSTRAINTS, BUSINESS_OBJECTIVES, CONTRACTED_SCOPE, MARTECH_STACK
3. **STAKEHOLDERS é Type B** (registry acumulativo, não Oracle-gerado, lifecycle próprio)
4. **CONTRACTED_SCOPE** lê proposta comercial PDF + JDs Suno; acesso restrito a admin/sponsor
5. **MARTECH_STACK** é condicional — subagente verifica antes de popular
6. **wiki_entities precisa de coluna** `embedding vector(768)` para RAG semântica
7. **5 camadas L1–L5** com prioridade L1 > L2 > L5 > L3 > L4
8. **Reuniões: CAG < 60 dias, RAG ≥ 60 dias** (hot/cold)
9. **Dual HITL**: HITL 1 (content safety, fora do agente) + HITL 2 (ontology proposal, LangGraph interrupt)
10. **3 guardrails**: Input, Output, Acesso

### Documentos gerados (Agent Team Workflow — 14 agentes paralelos)
- **Design doc**: `docs/superpowers/specs/2026-06-23-oracle-deep-agent-design.md` (contexto canônico da sessão)
- **ADR-007 v2**: reescrito com 9 entidades, Type A/B, schema de DB atualizado (261 linhas)
- **ADR-015** (novo): Oracle deep agent architecture (353 linhas)
- **ADR-016** (novo): Meeting processing + CAG/RAG + dual HITL (449 linhas)
- **ADR-017** (novo): Knowledge layers L1–L5 + guardrails (471 linhas)
- **SPEC-015 v2**: spec.md reescrita (34KB, 15+ FRs, versão 2.0)
- **SPEC-016** (nova): Meeting capture spec.md + constitution.md (22KB + 4.3KB)
- **SRD parte2**: atualizado com 9 entidades, Type B, MeetingTranscript como domain object
- **SRD parte6**: atualizado com Oracle v2 arch, camadas L1–L5, guardrails
- **BRD parte3**: atualizado com BR-021 (9 entidades) + BR-023 (reuniões como fonte)
- **Diagramas D1–D5**: em `docs/architecture/` (Mermaid, todos verificados)

---

## Decisões tomadas

| Decisão | Por quê | Onde documentado |
|---------|---------|-----------------|
| Um deep agent (não dois) | LangChain deep agent suporta subagentes com contexto isolado nativamente; dois agentes = plumbing desnecessário | ADR-015, design doc |
| 9 entidades (não 6) | BRD é fonte autoritativa; BR-021 exigia CONTRACTED_SCOPE e MARTECH_STACK ausentes na v1 | ADR-007 v2, BRD parte3 |
| STAKEHOLDERS como Type B | Lifecycle radicalmente diferente (acumulativo, não substituível) | ADR-007 v2 |
| CAG < 60d / RAG ≥ 60d | Reuniões recentes precisam de leitura completa; query esporádica retroativa = chunk suficiente | ADR-016 |
| HITL 1 fora do agente | Conteúdo sensível de reuniões não pode ser lido pelo AI antes de sanitização humana | ADR-016, SPEC-016 |
| HITL 2 via LangGraph interrupt | Único mecanismo nativo que pausa execução do deep agent aguardando resposta humana | ADR-015 |

---

## Arquivos modificados

### Documentação nova (criados)
- `docs/superpowers/specs/2026-06-23-oracle-deep-agent-design.md`
- `docs/adr/ADR-015-oracle-deep-agent-architecture.md`
- `docs/adr/ADR-016-meeting-processing-cag-rag.md`
- `docs/adr/ADR-017-knowledge-layers-guardrails.md`
- `docs/specs/large/meeting-capture-processing/spec.md`
- `docs/specs/large/meeting-capture-processing/constitution.md`
- `docs/architecture/D1-oracle-deep-agent-architecture.md`
- `docs/architecture/D2-meeting-dual-hitl-pipeline.md`
- `docs/architecture/D3-knowledge-layers.md`
- `docs/architecture/D4-oracle-guardrails.md`
- `docs/architecture/D5-data-schema.md`

### Documentação atualizada
- `docs/adr/ADR-007-cadastro-ontologico-cliente.md` (v1→v2, 9 entidades)
- `docs/specs/large/onboarding-oraculo-cliente/spec.md` (SPEC-015 v2)
- `docs/srd/parte2-domain-model.md` (9 entidades, MeetingTranscript)
- `docs/srd/parte6-arch-to-be.md` (Oracle v2 arch, camadas L1–L5)
- `docs/brd/parte3-requisitos.md` (BR-021 rev, BR-023 novo)

### Código NÃO tocado (intencionalmente — só documentação nesta sessão)
- `api/onboarding/oracle_agent.py` (bug ativo documentado, implementação = próxima sessão)
- `api/chat/tools/wiki_search.py` (migração para RAG = próxima sessão)
- `api/workflows/compiler.py` (migração para RAG = próxima sessão)

---

## Pendências (não abertas como TODO)

1. **Bug ativo**: `add_reunion_context_to_oraculo` busca `"Briefings"` (plural) → corrigir para `"Briefing"` em `api/onboarding/oracle_agent.py:add_reunion_context_to_oraculo`
2. **Migration wiki_entities**: `ALTER TABLE wiki_entities ADD COLUMN embedding vector(768)` + `ADD COLUMN role_visibility TEXT`
3. **Reescrever oracle_agent.py**: migrar de LangGraph 2-nós para `create_deep_agent` com 9 subagentes (SPEC-015 v2 é o FR formal)
4. **Migrar search_wiki**: `api/chat/tools/wiki_search.py` para pgvector cosine similarity
5. **Migrar consultar_ontologia**: `api/workflows/compiler.py` para pgvector cosine similarity
6. **HITL 1 UI**: tela de sanitização de reuniões para Admin (não existe ainda)
7. **HITL 2 UI**: tela de aprovação de proposta ontológica com evidence anchor
8. **Tabela meeting_transcripts**: criar migration e model SQLAlchemy
9. **SPEC-015 plan.md + tasks.md**: não foram reescritos nesta sessão (v1 ainda existe)
10. **ADR-013 update**: adicionar badge `oracle_seed` como origin type (mencionado no design mas não editado)
11. **ADR-008 update**: reposicionar Biblioteca como L2 na hierarquia das camadas

---

## Próximo passo natural

Implementação do bug fix imediato (`"Briefings"` → `"Briefing"` + migration `wiki_entities.embedding`) como quick win, depois partir para a reescrita de `oracle_agent.py` seguindo SPEC-015 v2 (FR-001 a FR-010).

Antes de começar a implementação: ler ADR-015 completo + SPEC-015 v2 spec.md + design doc para garantir contexto arquitetural completo.

---

## Aprendizados / pegadinhas

- **ADR-012 ≠ Oracle**: O ADR-012 é para BC-04 (Moon Shot) e BC-07 (Drive/Approval) — não tem relação com o Oracle de onboarding. Corrigi o pré-contexto incorreto quando usuário apontou.
- **BRD como árbitro**: Quando 3 fontes divergem (ADR vs SPEC vs implementação), voltar ao BRD resolve — BR-021 já tinha as respostas certas.
- **Workflow tool para doc gen**: Funcionou excelentemente para parallelizar 14 documentos em 5 fases dependentes. 14 agentes, 103 tool calls, ~14 minutos. Todos os documentos com qualidade validada.
- **Agents escrevem em worktree path**: Workflow agents sem `isolation: 'worktree'` escrevem no working directory da sessão — funcionou corretamente com paths absolutos no prompt.
- **STAKEHOLDERS é Type B, não Type A**: Crucial para separar o que o Oracle faz do que é acumulado ao longo do tempo. Decisão do usuário que mudou o design.
