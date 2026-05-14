---
spec-id: SPEC-004
slug: moon-shot
artefato: plan
atualizada: 2026-04-28
versao: 1.0
---

# Plano de Implementação — Moon Shot

## 1. Stack

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | Next.js 14 + TS + componentes em `moon-shot/` | Padrão sunOS |
| Pipeline agents | LangGraph sub-graph | ADR-008 |
| Vector store | pgvector (3 embeddings por doc) | ADR-003 |
| Knowledge graph | tabelas adjacência em PostgreSQL | sem Neo4j (CLAUDE.md) |
| LLM | Gemini Flash (default) + Claude (Crítico) | ADR-004 |
| Embeddings | text-embedding-3-large via Vertex AI | ADR-006 |
| Mensuração | sentence-transformers (Self-BLEU, Compression Ratio) | NOVA dep justificada |
| Tracing | MLflow (já configurado) | SPEC-001 |

## 2. Fases

### POC (4-6 semanas)
**Objetivo**: Validar que o motor produz provocações genuinamente úteis.
**Entregáveis**:
- Backend: pipeline mínimo Explorer↔Crítico em LangGraph
- Backend: bisociation scorer com sentence-transformers
- Backend: retrieval divergente com MMR (sem graph traverse ainda)
- Frontend: MoonShotModal + FaiscaPanel + FaiscaCard (mock data)
- Biblioteca seed: 50-100 conceitos cross-domain manualmente curados
**Critérios de saída**:
- ≥60% das provocações classificadas como "úteis" por 3+ creators seniores
- Tempo P95 < 30s
- Score de bisociação médio na zona Sweet Spot

### Protótipo (3-4 semanas)
**Objetivo**: Integrar com sunOS, ativar Biblioteca real, fechar loop de feedback.
**Entregáveis**:
- Backend: graph traverse 2+ hops
- Backend: 6 personas (Antropófaga, Cético, etc.)
- Backend: feedback loop alimentando ajuste de thresholds
- Frontend: integração com Sistema Solar (botão acessível em qualquer skill/cliente)
- Frontend: AgentPersonaBadge + BisociationZoneBadge
- Biblioteca: 200+ conceitos com taxonomia consolidada
- Migração para AlloyDB + pgvector se ChromaDB foi usado no POC
**Critérios de saída**:
- ≥70% aprovação em uso real
- Skills com context injection: ≥65% melhores que sem injection
- Líderes conseguem curar conteúdo em <5min/item

### Piloto (4-6 semanas)
**Objetivo**: Uso real em múltiplas áreas e clientes; calibração de thresholds.
**Entregáveis**:
- Biblioteca: 500+ conceitos
- Todas as áreas com acesso ao Moon Shot
- Dashboard de métricas para líderes (FR-018)
- Cache inteligente operacional
- Mensuração mensal de homogeneização ativa (RN-019)
- Forced reflection moments (RN-015)
**Critérios de saída**:
- ≥75% aprovação
- ≥3 campanhas reais que referenciaram provocações
- Diretoria recebendo relatório trimestral com diversidade coletiva

### MVP (contínuo)
**Objetivo**: Produto estável + melhoria contínua.
**Entregáveis**:
- Pipeline de curadoria contínua (rituais semanais com líderes)
- Ajuste automático de thresholds via feedback agregado
- Detecção e bloqueio automático de homogeneização (RN-020)
- Backlog de extensões: personas customizáveis, modo colaborativo, integração com Obsidian, exportação para Miro/FigJam

## 3. Sequência

```
POC ──► Protótipo ──► Piloto ──► MVP
  │           │           │         │
  │           │           │         └─► Mensuração contínua + extensões
  │           │           └─► Validação real, métricas
  │           └─► Integração + Biblioteca completa
  └─► Validação técnica isolada
```

## 4. Riscos e Mitigações

| Risco | Prob | Impacto | Mitigação |
|-------|:---:|:---:|-----------|
| Provocações percebidas como aleatórias | Alta | Alto | Calibração iterativa thresholds + POC com seniores antes |
| Biblioteca pobre → Moon Shot fraco | Alta | Alto | Seed cultural robusto + curadoria semanal |
| Líderes não curam Biblioteca | Média | Alto | Demonstrar ROI da curadoria; champions |
| Latência > 15s | Média | Médio | Cache de embeddings, paralelização |
| Homogeneização das provocações | Média | Alto | Monitoramento de diversidade + rotação de personas |
| Exposição de IP (caixa-preta vazada) | Baixa | Crítico | RBAC + audit logs + frontend sem acesso direto |

## 5. Definition of Done (por fase)

- [ ] Critérios de aceite atendidos
- [ ] `npx tsc --noEmit` + `pytest` passando
- [ ] MLflow capturando 100% das runs
- [ ] Documentação atualizada (README do módulo + spec.md)
- [ ] Code review por code-reviewer agent
- [ ] Smoke test E2E em ambiente staging
