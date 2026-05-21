---
spec-id: SPEC-010
slug: moon-shot
artefato: design
atualizada: 2026-05-15
status: rascunho
versao: 1.0
fase: Momento 2
---

> ⚠️ **Fase: Momento 2** — BR-001 (Moon Shot) é Momento 2 (pós-Piloto). Esta SPEC não entra no Piloto.
> ⚠️ **Nota SPEC-007** — a navegação de Moon foi alterada por SPEC-007 (nav-simplification): Moons não têm página dedicada; são chips no chat da Skill page. O comportamento especificado nesta SPEC deve ser revisado à luz de SPEC-007 antes de implementar.


# Design — Moon Shot

## 1. Arquitetura (referencia SRD Parte 6 §CTM-04)

### Visão de Containers (C4 L2)

```
┌──────────────────────────────────────────────────────────┐
│ Frontend (sunOS Next.js)                                 │
│  components/moon-shot/                          │
│    ├── MoonShotModal                              │
│    ├── FaiscaPanel + FaiscaCard                          │
│    └── AgentPersonaBadge + BisociationZoneBadge          │
└────────────────────┬─────────────────────────────────────┘
                     │ POST /chat/moon-shot
                     │ POST /chat/moon-shot/feedback
┌────────────────────▼─────────────────────────────────────┐
│ Backend (sunos-api)                                      │
│                                                          │
│  api/chat/router.py (5 novos endpoints)                  │
│       │                                                  │
│       ▼                                                  │
│  api/chat/provocation/                                   │
│    ├── pipeline.py — orquestra Explorer↔Crítico         │
│    ├── explorer.py — agente Explorer (6 personas)        │
│    ├── critic.py   — agente Crítico (3 dimensões)        │
│    ├── bisociation.py — scorer de zona                   │
│    └── personas/   — Antropófaga, Cético, etc.           │
│                                                          │
│  api/chat/knowledge/                                     │
│    ├── divergent_retrieval.py — MMR + graph traverse    │
│    └── convergent_retrieval.py — similarity search      │
│                                                          │
│  api/chat/measurement/                                   │
│    └── homogenization.py — métricas mensais             │
└──────────────────────────────────────────────────────────┘
```

## 2. Modelo de Dados

### Tabelas novas (referencia SRD Parte 3)

```sql
-- 3 embeddings por item da Biblioteca
ALTER TABLE knowledge_documents
  ADD COLUMN purpose_embedding vector(768),
  ADD COLUMN mechanism_embedding vector(768),
  ADD COLUMN surface_embedding vector(768);

CREATE INDEX idx_kd_purpose ON knowledge_documents
  USING hnsw (purpose_embedding vector_cosine_ops);

-- Knowledge graph
CREATE TABLE knowledge_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id UUID NOT NULL,
  target_entity_id UUID NOT NULL,
  relation_type TEXT NOT NULL,  -- INSTANCE_OF, BLENDS_WITH, BRIDGES, etc.
  weight FLOAT NOT NULL DEFAULT 1.0,
  evidence_doc_id UUID REFERENCES knowledge_documents(id)
);

-- Sessões e provocações
CREATE TABLE briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  text TEXT NOT NULL,
  intensity_mode TEXT NOT NULL CHECK (intensity_mode IN ('adjacente','equilibrado','radical')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE provocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES briefs(id),
  title TEXT NOT NULL,
  narrative TEXT NOT NULL,
  concepts_combined JSONB NOT NULL,  -- [{name, domain, source_doc_id}]
  bisociation_zone TEXT CHECK (bisociation_zone IN ('adjacente','sweet-spot','radical')),
  agent_persona TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  iteration_count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE explorer_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES briefs(id),
  persona TEXT NOT NULL,
  output JSONB NOT NULL,
  retrieved_docs UUID[] NOT NULL,
  trace_id UUID  -- MLflow
);

CREATE TABLE critic_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provocation_id UUID REFERENCES provocations(id),
  novelty_score INT CHECK (novelty_score BETWEEN 0 AND 10),
  coherence_score INT CHECK (coherence_score BETWEEN 0 AND 10),
  potential_score INT CHECK (potential_score BETWEEN 0 AND 10),
  decision TEXT CHECK (decision IN ('approved','rejected','escalated'))
);

CREATE TABLE provocation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provocation_id UUID REFERENCES provocations(id),
  user_id UUID NOT NULL,
  thumbs TEXT CHECK (thumbs IN ('up','down')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Mensuração mensal de homogeneização
CREATE TABLE diversity_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_month DATE NOT NULL,
  mean_pairwise_cosine_distance FLOAT,
  self_bleu FLOAT,
  compression_ratio FLOAT,
  baseline_diff_sigma FLOAT,
  alert_triggered BOOLEAN DEFAULT false,
  computed_at TIMESTAMPTZ DEFAULT now()
);
```

## 3. Pipeline Explorer ↔ Crítico (LangGraph)

```
[brief] → [retrieval divergente]
            ├── MMR over purpose embeddings (λ=0.3-0.5 ajustável)
            ├── graph traverse 2+ hops
            ├── filter mechanism_similarity > 0.5
            └── return cross-domain docs

         → [Explorer agent]
            ├── persona aleatória do pool ativo
            ├── prompt com docs + briefing + history
            └── output: provocação candidata

         → [Bisociation scorer]
            ├── classify zone (Óbvio/Adjacente/Sweet Spot/Radical/Incoerente)
            └── if zone in (Óbvio, Incoerente) → discard, loop back to Explorer

         → [Critic agent]
            ├── score Novidade × Coerência × Potencial
            ├── if any < 5 → reject, loop back to Explorer
            ├── if average ≥ 8 → approve
            └── if iter > 5 → discard

         → accumulate 3-5 approved provocations
         → present to creator
```

## 4. Decisões Técnicas (ADRs derivados)

### ADR-008 (proposto) — Pipeline multi-agente como sub-graph LangGraph
- **Decisão**: Implementar como sub-graph LangGraph dedicado em `api/chat/provocation/pipeline.py`, não como Skill regular nem microservice separado
- **Alternativas**: Skill regular (rejeitada — não suporta loop estruturado); microservice (rejeitada — overhead operacional)
- **Consequências**: Reusa infra existente (LangGraph, MLflow, BaseAgent ABC); aceita acoplamento ao backend principal

### ADR-010 (proposto) — Safety Gateway centralizado
- **Decisão**: Validações de RN-014 (marcação visual), RN-015 (forced reflection), RN-020 (bloqueio de relatório isolado) ficam num middleware único antes da resposta sair do backend
- **Razão**: Centralizar é mais auditável que espalhar nos agents

## 5. Estratégia de Testes

| Nível | Escopo | Framework | Cobertura |
|-------|--------|-----------|-----------|
| Unit | bisociation scorer, MMR, graph traverse | pytest | 90% |
| Integration | Pipeline end-to-end com LLM mock | pytest + langgraph testing | Happy + 3 falhas |
| Eval | Quality scoring com OpenEvals | OpenEvals + datasets | 5 datasets seed |
| Manual | Blind test com 3+ creators seniores | — | 60% aprovação POC |

<!-- REVIEW: A arquitetura faz sentido para a equipe? -->
