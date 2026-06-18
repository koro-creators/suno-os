# ADR-014: Infraestrutura de Deploy — Piloto (Cloud SQL, Cloud Run, Cloud SQL defer AlloyDB)

**Status:** Aceito
**Data:** 2026-05-28
**Decisores:** Heitor Miranda
**Origem:** Análise de infraestrutura pré-Phase 11 (deploy)

---

## Contexto

O sunOS precisa sair do desenvolvimento local para um ambiente de staging/piloto real antes de chegar a usuários da Suno United Creators. A decisão de infraestrutura precisa equilibrar:

- **Custo mínimo** durante protótipo/piloto (10-50 usuários internos)
- **Segurança mínima não-negociável** (Firebase JWT, secrets em Secret Manager, DB privado)
- **Sem over-engineering** — evitar complexidade que não traz valor agora
- **Coerência com ADRs existentes** (ADR-008 AlloyDB, ADR-011 Firebase, ADR-010 LangGraph)

---

## Decisão

### 1. Topologia: dois Cloud Run services (monolito por domínio)

```
Internet
  ├── Cloud Run: sunos-frontend   (Next.js 14)
  │     └── chama sunos-api via NEXT_PUBLIC_API_URL (HTTP público + Firebase JWT)
  └── Cloud Run: sunos-api        (FastAPI monolítico — todos os módulos)
        ├── Cloud SQL: sunos-db   (PostgreSQL 15 + pgvector, IP privado via VPC Connector)
        ├── GCS: sunos-{project}  (memory files, drive cache, attachments)
        └── Secret Manager        (chaves LLM, Langfuse, Firebase SA)
```

**Não microserviços.** O backend tem 10+ módulos (`chat`, `agents`, `workflows`, `biblioteca`, `onboarding`, `approval`, `admin`, `drive`, `tools`, `reunioes`) mas são deployados como **uma única imagem** no Cloud Run. Separar em serviços independentes adicionaria:
- 10+ Cloud Run services para operar e monitorar
- Latência de rede em calls síncronas entre módulos (ex: `agents` → `chat/graph`)
- Tracing distribuído obrigatório desde o dia 1
- Custo operacional 5-10x maior sem ganho real para 50 usuários

A modularização interna por pasta (Bounded Context) preserva a capacidade de split físico futuro sem reescrita.

### 2. Banco: Cloud SQL PostgreSQL 15 + pgvector (AlloyDB deferido)

**ADR-008 decidiu AlloyDB** para o pipeline RAG da Biblioteca Semântica. Essa decisão continua válida para quando o RAG real for ativado. **Para o piloto, Cloud SQL é adotado** pelos seguintes motivos:

| Critério | Cloud SQL (`db-g1-small`) | AlloyDB (mínimo) |
|----------|--------------------------|------------------|
| Custo mensal | ~$30-50 | ~$350+ |
| pgvector | ✅ | ✅ |
| GraphRetriever (LangChain) | ❌ | ✅ |
| Setup time | 5 min | 20 min + cluster |
| Necessidade atual | Sim (dados relacionais + vetores básicos) | Não (RAG com GraphRetriever é Fase D) |

**Trigger para migrar para AlloyDB:** quando `search_knowledge` (Biblioteca semântica com GraphRetriever) for implementada em produção (Fase D+) — provavelmente >1k queries vetoriais/dia.

### 3. GCS: um bucket, prefixos por feature

```
gs://sunos-{GCP_PROJECT_ID}/
  memory-files/{agent_id}/{filename}     (agentes — Fase D)
  drive-cache/{client_id}/{doc_id}       (Drive sync — SPEC-006)
  attachments/{session_id}/{filename}    (futuros chat attachments)
```

Um bucket com IAM granular por prefix. Não criar bucket por feature — overhead sem benefício.

### 4. Região: `us-west1` (Oregon)

Consistência com os demais componentes GCP do stack Koro/Suno que já rodam em `us-west1`. Manter todos os serviços na mesma região elimina egress cross-region entre Cloud Run, Cloud SQL e GCS, e simplifica VPC Connector e regras de firewall.

### 5. Segurança mínima

| Controle | Implementação |
|----------|--------------|
| Autenticação de usuário | Firebase JWT — validado em todo endpoint de negócio |
| Secrets | Cloud Secret Manager — nunca env vars hardcoded |
| Acesso ao DB | VPC Connector + IP privado — Cloud SQL sem IP público |
| Service accounts | SA separado por Cloud Run service, roles mínimas |
| Cloud Run auth | `--allow-unauthenticated` (frontend é app web pública, backend valida Firebase JWT na camada de aplicação) |
| Imagens | Artifact Registry (não Docker Hub) |

---

## Alternativas Consideradas

**AlloyDB desde o piloto** — rejeitado: custo $350+/mês injustificável para 50 usuários; GraphRetriever não é usado ainda; setup mais complexo para devs.

**GKE** — rejeitado: overkill massivo. Cloud Run auto-escala, tem cold start aceitável com `min-instances=1`, e não requer gestão de nodes, node pools, ingress controllers, etc.

**Microserviços desde o início** — rejeitado: os módulos do backend compartilham estado em memória (in-memory stores da Fase C), chamam funções uns dos outros sincroneamente, e são deployados/testados pelo mesmo time ao mesmo ritmo. Split prematuro geraria overhead sem benefício.

**Redis/Memorystore** — rejeitado: APScheduler in-process (Fase C) é suficiente para o piloto. Cloud Scheduler (Fase D) não precisa de Redis.

---

## Consequências

**Positivas:**
- Custo estimado de piloto: ~$100-150/mês total (Cloud Run + Cloud SQL + GCS + outros)
- Deploy em <10 minutos via Cloud Build após primeira configuração
- Monolito facilita debugging e tracing (logs unificados no Cloud Logging)
- Path claro para split em Fase D: fronteiras de módulo já desenhadas no código

**Negativas:**
- AlloyDB e GraphRetriever dependem de migração posterior — risco de retrabalho quando chegar a hora (mitigação: Cloud SQL tem pg_dump → AlloyDB import path)
- `--allow-unauthenticated` no backend significa que Firebase JWT é a **única** barreira de auth — qualquer endpoint que esquecer a validação fica exposto (mitigação: middleware de auth genérico no FastAPI)
- Cloud Run cold start com `min-instances=0` no frontend pode causar lentidão ocasional (mitigação: aceitar para frontend; backend tem `min-instances=1`)

---

## Rastreabilidade

| Tipo | IDs |
|------|-----|
| ADRs relacionados | ADR-008 (AlloyDB — deferido), ADR-011 (Firebase Auth), ADR-013 (Langfuse) |
| NFRs | NFR-005 (disponibilidade), NFR-008/009 (RBAC/Auth), NFR-026 (Observabilidade) |
| BRs | BR-009 (Governança) |
| Phase | Phase 11 (deploy/CI) |

## Critérios para Revisitar

- [ ] Volume de usuários ultrapassa 50 (avaliar min-instances e tier Cloud SQL)
- [ ] RAG com GraphRetriever implementado → migrar para AlloyDB (ADR-008)
- [ ] APScheduler cause problemas em produção → migrar para Cloud Scheduler (SPEC-021 Fase D)
- [ ] Módulo backend causa gargalo isolado → avaliar split em Cloud Run separado
