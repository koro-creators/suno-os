---
spec-id: SPEC-010
slug: moon-shot
artefato: tasks
atualizada: 2026-05-15
status: rascunho
versao: 1.0
fase: Momento 2
---

> ⚠️ **Fase: Momento 2** — BR-001 (Moon Shot) é Momento 2 (pós-Piloto). Esta SPEC não entra no Piloto.
> ⚠️ **Nota SPEC-007** — a navegação de Moon foi alterada por SPEC-007 (nav-simplification): Moons não têm página dedicada; são chips no chat da Skill page. O comportamento especificado nesta SPEC deve ser revisado à luz de SPEC-007 antes de implementar.


# Tasks — Moon Shot

## Resumo

| Total | A Fazer | Em Progresso | Concluídas |
|-------|---------|--------------|------------|
| 26 | 26 | 0 | 0 |

## Fase POC

### TASK-001 — Schema SQL para Biblioteca com 3 embeddings
- Arquivos: criar `api/migrations/003_moon_shot.sql`
- Escopo: ALTER `knowledge_documents` + criar `knowledge_graph_edges`, `briefs`, `provocations`, `explorer_runs`, `critic_reviews`, `provocation_feedback`, `diversity_metrics`
- Critérios: tabelas criadas, índices HNSW para os 3 embeddings, FK constraints
- Estimativa: M

### TASK-002 — Bisociation scorer
- Arquivos: criar `api/chat/provocation/bisociation.py`
- Escopo: classificar provocação em zona (Óbvio/Adjacente/Sweet Spot/Radical/Incoerente) por distância cosseno entre embeddings + filtro mechanism_similarity
- Estimativa: M

### TASK-003 — MMR retriever divergente
- Arquivos: criar `api/chat/knowledge/divergent_retrieval.py`
- Escopo: MMR sobre purpose embeddings com λ ajustável, retorna top-k com diversidade
- Estimativa: M

### TASK-004 — Explorer agent (1 persona inicial)
- Arquivos: criar `api/chat/provocation/explorer.py` + `personas/antropofaga.py`
- Escopo: agente LangGraph com prompt de persona Antropófaga, recebe contexto + briefing, gera provocação candidata
- Estimativa: M

### TASK-005 — Critic agent
- Arquivos: criar `api/chat/provocation/critic.py`
- Escopo: agente que pontua Novidade × Coerência × Potencial; rejeita se < 5 ou aprova se média ≥ 8
- Estimativa: M

### TASK-006 — Pipeline LangGraph
- Arquivos: criar `api/chat/provocation/pipeline.py`
- Escopo: orquestra Retrieval → Explorer → Bisociation → Crítico → loop até 5 iter ou aprovação; acumula 3-5 provocações
- Estimativa: G

### TASK-007 — Endpoint POST /chat/moon-shot
- Arquivos: estender `api/chat/router.py`
- Escopo: receber `{client_slug, brief, intensity_mode}`, executar pipeline, retornar provocações
- Estimativa: M

### TASK-008 — Schemas Pydantic Moon Shot
- Arquivos: estender `api/chat/schemas/chat.py` com `MoonShotRequest`, `ProvocationResponse`
- Estimativa: P

### TASK-009 — Componente MoonShotModal (frontend)
- Arquivos: criar `components/moon-shot/MoonShotModal.tsx`
- Escopo: modal com input briefing, animação "Devorando", apresentação de FaiscaPanel
- Estimativa: M

### TASK-010 — FaiscaPanel + FaiscaCard
- Arquivos: criar `components/moon-shot/FaiscaPanel.tsx` + `FaiscaCard.tsx`
- Escopo: layout em scroll horizontal de cards com vocabulário Suno
- Estimativa: M

### TASK-011 — Seed data Biblioteca (50-100 conceitos)
- Arquivos: criar `api/scripts/seed_biblioteca_pocp.py`
- Escopo: importar 50-100 conceitos cross-domain (cinema, ciência, antropologia, vernáculo) com metadados e indexação
- Estimativa: G

### TASK-012 — Teste blind com 3+ creators seniores
- Não-código: organizar sessão, coletar feedback, calcular % de provocações úteis
- Estimativa: M

## Fase Protótipo

### TASK-013 — Graph traverse 2+ hops no retrieval
- Arquivos: estender `divergent_retrieval.py`
- Escopo: a partir das entidades do briefing, percorrer KG em 2 hops, filtrar por mechanism_similarity > 0.5
- Estimativa: G

### TASK-014 — 5 personas adicionais (Cético, Constraint Queen, Carnavalesco, Anciã, Estranho)
- Arquivos: criar 5 arquivos em `api/chat/provocation/personas/`
- Escopo: prompts com paradigmas de raciocínio distintos (DMAD-style)
- Estimativa: G

### TASK-015 — Feedback loop ajustando thresholds
- Arquivos: criar `api/chat/provocation/calibration.py`
- Escopo: agregação periódica de feedback → ajuste de pesos do MMR e do bisociation scorer
- Estimativa: M

### TASK-016 — AgentPersonaBadge + BisociationZoneBadge
- Arquivos: criar 2 componentes em `moon-shot/`
- Escopo: badges visuais com ícone, cor, tooltip explicando paradigma/zona em linguagem de negócio
- Estimativa: P

### TASK-017 — Integração com Sistema Solar (botão em qualquer tela)
- Arquivos: estender `app/layout.tsx` ou `components/chat/ChatPanel.tsx`
- Escopo: adicionar botão flutuante acessível em ≤3 cliques de qualquer skill/cliente
- Estimativa: M

### TASK-018 — Endpoint POST /chat/moon-shot/feedback
- Arquivos: estender `api/chat/router.py` + provocation_feedback table
- Escopo: receber thumbs + motivo, persistir
- Estimativa: P

### TASK-019 — Migrar de ChromaDB para AlloyDB+pgvector (se aplicável)
- Arquivos: scripts de migração
- Estimativa: M

## Fase Piloto

### TASK-020 — Biblioteca expandida 500+ conceitos
- Não-código: rituais de curadoria semanal com líderes
- Estimativa: contínuo

### TASK-021 — Dashboard de métricas para líderes (FR-018)
- Arquivos: criar `app/admin/biblioteca/dashboard/page.tsx`
- Escopo: gráficos de consumo por skill/cliente, conteúdo órfão, correlação contexto×qualidade
- Estimativa: G

### TASK-022 — Cache inteligente de retrieval
- Arquivos: estender `divergent_retrieval.py` + `convergent_retrieval.py`
- Escopo: cache LRU com TTL configurável, invalidação por update na Biblioteca
- Estimativa: M

### TASK-023 — Mensuração mensal de homogeneização
- Arquivos: criar `api/chat/measurement/homogenization.py` + Cloud Scheduler job
- Escopo: cálculo mensal de Mean Pairwise Cosine Distance, Self-BLEU, Compression Ratio + alerta se > 2σ
- Estimativa: G

### TASK-024 — Forced reflection moments (RN-015)
- Arquivos: novo componente `ForcedReflectionInterstitial.tsx` + lógica no frontend
- Escopo: contador de stars na sessão, interrupção a cada N (5 default, 3 para juniores)
- Estimativa: M

## Fase MVP

### TASK-025 — Bloqueio automático de relatório isolado (RN-020)
- Arquivos: estender Safety Gateway (CTM-06)
- Escopo: middleware que valida que todo relatório com user satisfaction inclui set-level diversity
- Estimativa: M

### TASK-026 — Ajuste automático de thresholds via feedback
- Arquivos: estender `calibration.py` para rodar continuamente como job
- Estimativa: M

<!-- REVIEW: Tasks são implementáveis e testáveis isoladamente? -->

## Prompt template para Claude Code

```
Implemente TASK-XXX: <título>.

Spec: docs/specs/large/moon-shot/spec.md
Design: docs/specs/large/moon-shot/design.md
Constitution: docs/specs/large/moon-shot/constitution.md (LEIA antes — princípios obrigatórios)
Plan: docs/specs/large/moon-shot/plan.md

Escopo desta task: <colar do tasks.md>
Arquivos: <colar do tasks.md>

Restrições da constitution a respeitar:
- Vocabulário: Devorar, Provocar, Faísca, Brasa (NÃO gerar/otimizar/eficiência)
- Inline styles + CSS vars (frontend)
- LangGraph sub-graph (não Skill regular)
- 3 embeddings por doc (purpose, mechanism, surface)
- MMR λ=0.3-0.5 + mechanism_similarity > 0.5
- Marcação visual obrigatória de outputs IA (RN-014)
- Caixa-preta: operacionais não veem prompts/scoring
- Koro sempre com K, nunca Coro

Após implementar, rode `npx tsc --noEmit` (frontend) e `pytest` (backend) e reporte.
```
