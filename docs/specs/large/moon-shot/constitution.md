---
spec-id: SPEC-010
slug: moon-shot
artefato: constitution
atualizada: 2026-05-15
status: rascunho
versao: 1.0
fase: Momento 2
escopo:
  projeto: sunOS
  stack: "Frontend: Next.js 14 + TS + Tailwind | Backend: FastAPI + LangGraph + Python 3.11"
  autor: Heitor Miranda
  papel: Diretor Executivo, Tecnologia e Dados para Marketing
  branch: master
  contexto: Motor de serendipidade criativa + Biblioteca de conhecimento + Skills processuais (rascunho original do Guga, materializado)
---
> ⚠️ **Fase: Momento 2** — BR-001 (Moon Shot) é Momento 2 (pós-Piloto). Esta SPEC não entra no Piloto.
> ⚠️ **Nota SPEC-007** — a navegação de Moon foi alterada por SPEC-007 (nav-simplification): Moons não têm página dedicada; são chips no chat da Skill page. O comportamento especificado nesta SPEC deve ser revisado à luz de SPEC-007 antes de implementar.

# Constitution — Moon Shot (SPEC-010)

Princípios imutáveis que governam a feature **Moon Shot** — motor de serendipidade criativa do sunOS — e suas dependências (Biblioteca de Conhecimento, Skills processuais com context injection).

Esta constitution **complementa** SPEC-001 (sunohub-tools-integration). Onde houver conflito, ela prevalece para escopo Moon Shot.

## Princípios de Arquitetura

1. **Inteligência Natural primeiro** — IA provoca, humano cria. Toda saída do sistema é **estímulo**, nunca peça final. Outputs marcados visualmente como Faísca/Brasa/Validado (RN-014).

2. **Caixa-preta protegida** — System prompts, lógica do Explorer/Crítico, scoring de bisociação e knowledge curado são IP da Suno. Operacionais consomem; nunca inspecionam (RN-009, RN-011).

3. **3 cliques até o valor** — Creator não preenche formulário longo. Contexto é capturado automaticamente da sessão. *"Devore o briefing"* funciona em até 3 cliques (RN-003).

4. **Zona Sweet Spot é o produto** — Provocações na zona "óbvio" ou "incoerente" são descartadas. O valor é entregar provocações **relevantes mas surpreendentes** (RN-001).

5. **Multi-agente cognitivamente diverso** — Explorer, Crítico e personas brasileiras (Antropófaga, Cético, Constraint Queen, Carnavalesco, Anciã, Estranho) usam **paradigmas de raciocínio diferentes**, não só estilos diferentes. DMAD-style.

6. **Tripartite embedding** — Cada item da Biblioteca tem 3 embeddings (purpose, mechanism, surface) seguindo Hope/Chan/Kittur/Shahaf 2017. Surface variety NÃO substitui structural alignment.

7. **Mesma Biblioteca, dois modos de retrieval** — Skills processuais usam retrieval convergente (precisão, λ alto); Moon Shot usa divergente (diversidade, MMR λ=0.3-0.5 + graph traverse 2+ hops).

8. **Backward compatible** — Não quebra Skills existentes nem o Sistema Solar. Integra-se via context injection transparente.

## Princípios de Qualidade

1. **Mensuração coletiva é mandatória** — Set-level diversity (Mean Pairwise Cosine Distance, Self-BLEU, Compression Ratio) **NUNCA** pode ser omitida em relatório que reporte aggregate user satisfaction (RN-020). Doshi & Hauser leveling-up illusion é o modo de falha existencial.

2. **Forced reflection** — A cada N stars/aprovações na sessão (N=5 default, N=3 para juniores), interromper com pergunta reflexiva. Mitiga over-reliance documentado por Microsoft Research / MIT Media Lab 2025 (RN-015).

3. **Eval em 3 camadas** — MLflow tracing (cada request) + Trajectory eval (agente seguiu fluxo correto?) + Quality eval (output útil?). Pareamento Bradley-Terry em 10-20% das sessões.

4. **Latência visível** — Animação "Devorando referências..." durante processamento. Time-out 30s com opção de cancelar.

5. **Ownership preservado** — Em pesquisa qualitativa pós-Piloto, ≥80% dos creators seniores devem confirmar sentir-se autores do trabalho final.

## Princípios de Segurança

1. **Nenhuma API key no frontend** — Vertex AI, Anthropic, OpenAI keys ficam em GCP Secret Manager.
2. **Auth Firebase JWT obrigatório** — Mesmo padrão SPEC-001.
3. **Isolamento entre clientes** — Retrieval respeita `client_slug`. Conteúdo cross-client só com tag explícita e peso reduzido (RN-010).
4. **Caixa-preta bidirecional** — Creators não veem prompts; Diretoria não vê dados pessoais sem propósito documentado.

## Padrões Obrigatórios

### Frontend
- Componentes em `components/moon-shot/`
- Inline styles + CSS variables (`--void`, `--sun`, `--nebula`)
- Lucide icons size 14, strokeWidth 1.5
- Animação "Devorando" em globals.css com `prefers-reduced-motion` respeitado
- Vocabulário UI: **Devorar, Provocar, Faísca, Brasa, Inteligência Natural** (Glossário §1)
- ANTI-padrões PROIBIDOS: gerar, otimizar, eficiência, accelerator (Glossário §9)

### Backend
- Provocation Engine como módulo separado em `api/chat/provocation/`
- LangGraph multi-agente (sub-graph dedicado, não Skill regular — ver ADR-008 proposto)
- pgvector com 3 colunas vector(768): `purpose_embedding`, `mechanism_embedding`, `surface_embedding`
- MMR retriever customizado em `api/chat/knowledge/divergent_retrieval.py`
- Bisociation scorer em `api/chat/provocation/bisociation.py`

## Dependências Aprovadas

**Frontend:** zero deps novas (lucide-react já presente).

**Backend:**
- `langgraph` (já presente)
- `langchain-google-genai`, `langchain-anthropic`, `langchain-openai` (já presentes)
- `pgvector` (já presente)
- `sentence-transformers` para cálculo de Self-BLEU e Compression Ratio (NOVA — justificada para mensuração de homogeneização RN-019)

**NÃO usar:**
- LangChain puro fora do LangGraph
- Vector stores externos (Pinecone, Weaviate) — pgvector é decisão fechada (ADR-003)
- Frameworks de agente alternativos (CrewAI, agno) — LangGraph é decisão fechada (ADR-005)

## Anti-patterns Proibidos

1. **Reportar satisfação individual sem diversidade coletiva** — RN-020 (modo de falha existencial)
2. **Esconder marcação visual de output IA** — RN-014
3. **Auto-inserir output IA em documento do creator** — preserva ownership
4. **Personas estilisticamente diferentes mas cognitivamente iguais** — DMAD anti-pattern; cada persona DEVE ter paradigma de raciocínio próprio
5. **Surface diversity como proxy de structural diversity** — Chan & Schunn 2014 evidência: pure surface variety NÃO melhora criatividade
6. **Provocações nas zonas extremas (óbvio, incoerente) entregues ao creator** — descarte automático
7. **Notificações durante deep work do creator** — neuroscience evidence (Kounios & Beeman): kills aha moment
8. **UI traduzida de Silicon Valley** — viola RN-016 e BR-011 (cultura brasileira)

## Referências Obrigatórias

- BRD: `/docs/brd/parte1-contexto.md` a `parte4-regras.md` (16 BRs, 22 RNs)
- PRD: `/docs/prd/parte1-feature-map.md` a `parte5-roadmap-fases.md` (FA-01, FA-02, FA-03)
- SRD: `/docs/srd/parte2-domain-model.md` (BC-04 Insight & Provocation)
- SRD: `/docs/srd/parte4-data-flows-dfd.md` (DFL-02)
- SRD: `/docs/srd/parte6-arch-to-be.md` (CTM-04 Provocation Engine)
- UX: `/docs/ux/parte3-screen-specs.md` (T-06, T-07, T-08, T-09)
- Research foundation original (compartilhada pelo Guga): "Engineering serendipity"
