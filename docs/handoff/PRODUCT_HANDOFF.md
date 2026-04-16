# sunOS — Product Handoff Document

**Data:** 2026-04-16
**De:** Heitor Miranda (Tech Lead)
**Para:** Product Manager / Product Owner
**Projeto:** sunOS — Sistema Operacional de IA da Suno United Creators
**Repo:** https://github.com/koro-creators/suno-os

---

## 1. Visão do Produto

### O que é

O sunOS é a **plataforma interna de IA** da Suno United Creators. Centraliza todas as iniciativas de inteligência artificial da agência em um único sistema operacional que organiza skills de IA por cliente usando uma metáfora de sistema solar.

### Problema que resolve

Times de criação, mídia, planejamento, BI e financeiro da Suno executam dezenas de atividades repetitivas que podem ser aceleradas por IA — mas cada time usa ferramentas diferentes, sem padronização, sem rastreabilidade e sem avaliação de qualidade. O sunOS unifica tudo em uma plataforma com chat contextualizado, biblioteca de conhecimento, e automação de workflows.

### Para quem

| Persona | Quem é | Como usa o sunOS |
|---------|--------|------------------|
| **Criativo (P2)** | Redatores, designers, social media | Chat com IA para gerar copies, roteiros, posts |
| **Estrategista (P3)** | Planejadores, analistas de mídia, BI | Análise de mercado, planos de mídia, reports |
| **Admin (P4)** | Tech lead, gerentes, diretores | Configura skills, gerencia biblioteca, cria workflows |
| **Viewer** | Time operacional | Usa os outputs gerados pelos agents |

### Proposta de valor

- **IA contextualizada**: cada skill tem o tom de voz do cliente, restrições legais, e conhecimento da marca injetados automaticamente
- **Avaliação contínua**: todo output é avaliado (thumbs up/down + comentário), gerando dados para melhorar os agents
- **Automação**: workflows agendam tarefas recorrentes (reports, análises, monitoramento) sem depender do time de eng
- **Multi-formato**: gera texto, imagem, vídeo, apresentações — tudo via chat ou workflow

---

## 2. Status Atual

### Funcional hoje

| Feature | Status | Rota |
|---------|--------|------|
| **Sistema Solar** (Home) | Produção | `/` |
| **Navegação 4 níveis** | Produção | `/ → /cliente → /skill → /chat` |
| **Chat com IA real** (Gemini Flash) | Produção | `/cliente/skill/moon` |
| **Social Preview** (Instagram/Meta) | Produção | Chat de Copy Social |
| **Skills Admin** (CRUD) | Produção | `/skills` |
| **Biblioteca** (knowledge base) | Produção (v2 com upload) | `/biblioteca` |
| **Clientes Admin** (CRUD) | Produção | `/clientes` |
| **HITL Feedback** | Produção | Sidebar do chat |
| **Workflow Builder** | Produção | `/workflows` |
| **Auth (Google Login)** | Produção | `/login` |
| **RBAC** (admin/creator) | Produção | Firebase Custom Claims |
| **Dark/Light theme** | Produção | Toggle no header |

### Em desenvolvimento

| Feature | Status | Spec |
|---------|--------|------|
| Deploy staging (Cloud Run) | Pendente (precisa de projeto GCP) | — |
| Testes de integração com API keys reais | Pendente | SPEC-001 |
| Busca global (Cmd+K) | Planejado | — |
| Sidebar recentes dinâmico | Planejado | — |

### Métricas do codebase

| Métrica | Valor |
|---------|-------|
| Commits | 50+ |
| Arquivos frontend | ~70 (.tsx/.ts) |
| Arquivos backend | ~50 (.py) |
| Skills de IA | 8 configurados |
| Clientes | 5 (Suno, Vivo, Americanas, Sicredi, Samsung) |
| Documentos na Biblioteca | 31+ mocados + upload real |
| Workflow templates | 4 pré-configurados |
| Specs (SDD) | 4 (SPEC-001 a SPEC-004) |
| ADRs | 2 (ADR-001, ADR-002) |

---

## 3. Mapa de Funcionalidades

### 3.1 Sistema Solar (Home)

**O que faz:** Visualização orbital dos clientes como planetas. Cada cliente tem skills (órbitas) e moons (sub-áreas). Navegação horizontal em 4 níveis.

**Quem usa:** Todos os usuários — é o ponto de entrada.

**Limitações:** Dados dos clientes no sistema solar são estáticos (`data/clients.ts`). Não reflete mudanças do admin de Clientes (deliberado — ver ADR-002).

### 3.2 Chat com IA

**O que faz:** Chat contextualizado por cliente + skill + moon. A IA recebe: system prompt do skill, tom de voz do cliente, documentos da Biblioteca ativos. Respostas via streaming real (Gemini Flash).

**Quem usa:** Criativos e estrategistas.

**Features especiais:**
- **Prompt Templates:** botões pré-definidos por moon (ex: "Carrossel educação financeira")
- **Social Preview:** no Copy Social, output renderizado como preview de Instagram (carousel, stories, post)
- **Variações:** auto-gera 3 opções de conteúdo para comparação
- **HITL:** thumbs up/down + comentário em cada resposta, avaliação de sessão (1-5)
- **Context Sidebar:** mostra documentos da Biblioteca ativos, agentes, painel de validação

**Limitações:**
- Modelo padrão é Gemini Flash (GPT-4o e Claude disponíveis se API keys configuradas)
- ImageGen é mock (precisa Vertex AI key para Imagen 4)
- Conversas não persistem entre sessões (state local)

### 3.3 Skills Admin

**O que faz:** CRUD de skills de IA. Cada skill tem: identidade (nome, tipo, ícone), configuração (system prompt, modelo, temperatura), moons (sub-áreas), e clientes atribuídos.

**Quem usa:** Admins (P4).

**Rota:** `/skills`

**Skills existentes:**

| Skill | Tipo | Score |
|-------|------|-------|
| Copy Social | Criação | ★ 4.8 |
| Texto de Rádio | Criação | ★ 4.2 |
| Roteiro de Vídeo | Criação | ★ 4.1 |
| Plano de Mídia | Mídia | ★ 3.9 |
| Report Performance | Mídia | ★ 4.5 |
| Persona Sintética | Planejamento | ★ 3.6 |
| Brief Builder | Planejamento | ★ 4.3 |
| Análise de Mercado | Planejamento | ★ 3.2 |

### 3.4 Biblioteca (Knowledge Base)

**O que faz:** Base de conhecimento multimodal. Documentos com tags e escopo (Suno global ou por cliente). Upload real de arquivos (PDF, áudio, vídeo, imagem) com processamento automático. Busca semântica via pgvector.

**Quem usa:** Admins alimentam, todos consomem via chat.

**Rota:** `/biblioteca`

**Capacidades:**
- Upload de arquivos (PDF, DOCX, TXT, imagens, áudio, vídeo)
- Processamento automático: transcrição (áudio/vídeo), caption (imagem), chunking + embeddings
- Thumbnails gerados por tipo de arquivo
- Ícones por formato (PDF vermelho, áudio amarelo, vídeo roxo, etc.)
- Busca semântica via `search_knowledge` tool do agent
- Filtro por escopo (Suno/clientes) + tags + tipo de arquivo
- Auto-seleção no chat por scope/tags do skill

### 3.5 Clientes Admin

**O que faz:** CRUD de clientes com 4 tabs: Identidade (nome, cor, contato), Skills (toggle on/off), Biblioteca (docs atribuídos), Métricas (sessões, feedbacks, score).

**Quem usa:** Admins.

**Rota:** `/clientes`

**Clientes atuais:** Suno, Vivo, Americanas, Sicredi, Samsung.

### 3.6 HITL (Human in the Loop)

**O que faz:** Sistema de feedback em duas camadas. Thumbs up/down + comentário por mensagem (inline no chat). Painel de validação no sidebar com: progress bar, counters, status da sessão, histórico de feedbacks, avaliação de sessão (1-5 estrelas).

**Quem usa:** Criativos avaliam outputs, admins monitoram scores.

**Onde aparece:** Sidebar direito do chat + score nos SkillCards.

### 3.7 Workflow Builder

**O que faz:** Interface para criar automações de IA. Cada workflow é uma sequência de steps (tool, LLM, condição, ação, HITL) que compila para LangGraph StateGraph. Suporta agendamento via Cloud Scheduler e encadeamento de workflows.

**Quem usa:** Admins e builders (analistas de mídia, BI, financeiro).

**Rota:** `/workflows`

**Templates disponíveis:**
1. Report Mensal — consulta dados → gera análise → notifica Slack
2. Plano de Mídia — busca knowledge → gera plano → revisão humana
3. Monitor de Anomalias — consulta dados → analisa → condição → alerta
4. Pesquisa de Mercado — busca web → síntese → contexto → report

**Capacidades:**
- Criar/editar/deletar workflows
- Builder visual com steps configuráveis
- Agendamento cron (ex: "segunda 9h")
- HITL: steps que pausam para revisão humana
- Encadeamento: um workflow pode chamar outro como sub-workflow
- Histórico de execuções com timeline + logs por step

### 3.8 Auth + RBAC

**O que faz:** Login via Google (Firebase Auth). Roles via Custom Claims.

| Role | Acesso |
|------|--------|
| **Admin** | Tudo: Skills, Biblioteca, Clientes, Workflows |
| **Creator** | Chat, visualizar Biblioteca e Skills |

**Dev bypass:** Em `NODE_ENV=development`, auth é opcional para facilitar testes.

---

## 4. Decisões de Produto Tomadas

### ADR-001: Workflow Builder — Aceito (revisado)

**Decisão:** Implementar Workflow Builder usando LangGraph como engine.

**Por que sim:**
- 48+ atividades mapeadas nos times que podem ser automatizadas (lista crescendo)
- Time de 4 devs não escala se toda automação depender deles
- Usuários são técnicos (analistas, coordenadores) — sabem configurar steps
- LangGraph dá escalabilidade do momento zero (cada workflow = StateGraph)

**O que NÃO é:** Drag-and-drop visual de composição de agentes. É configuração de steps sequenciais com tools compartilhadas.

**Doc completo:** `docs/adr/ADR-001-agent-builder-deferred.md`

### ADR-002: Engine Único (não Deep Agent por cliente)

**Decisão:** Usar um engine único de agente com context injection por cliente, em vez de instanciar Deep Agents separados.

**Por que:**
- Claude Code não é um agente diferente por repo — é o mesmo engine com contexto diferente
- N deep agents = N× custo de manutenção
- O que varia entre clientes é contexto (prompts, docs, histórico), não arquitetura
- `skill_slug` + `context_documents` já implementa personalização

**Quando revisitar:** Se regulamentação exigir isolamento por cliente, ou workflow radicalmente diferente.

**Doc completo:** `docs/adr/ADR-002-single-engine-not-deep-agent-per-client.md`

---

## 5. Arquitetura (Visão PM)

```
┌─────────────────────────────────────────────┐
│             USUÁRIO (Browser)                │
│                                              │
│  Login Google → sunOS (Next.js)              │
│  ├── Sistema Solar (home)                    │
│  ├── Chat com IA (streaming)                 │
│  ├── Admin (Skills, Biblioteca, Clientes)    │
│  └── Workflows (builder, execução)           │
└──────────────────┬──────────────────────────┘
                   │ HTTPS
                   ▼
┌──────────────────────────────────────────────┐
│            BACKEND (FastAPI)                  │
│                                              │
│  LangGraph: orquestra agents + tools         │
│  ├── Chat streaming (Gemini Flash)           │
│  ├── Geração de texto (variações)            │
│  ├── Geração de imagem (mock/Imagen 4)       │
│  ├── Busca na Biblioteca (pgvector)          │
│  └── Workflow executor (steps + schedule)    │
│                                              │
│  PostgreSQL: conversas, docs, workflows      │
│  GCS: arquivos uploadados                    │
│  MLflow: tracing + evaluation                │
└──────────────────────────────────────────────┘
                   │
          ┌────────┼────────┐
          ▼        ▼        ▼
     Google AI   Firebase   Cloud
     (Gemini)    (Auth)     Scheduler
```

### Modelos de IA em uso

| Modelo | Uso | Status |
|--------|-----|--------|
| **Gemini 2.5 Flash** | Chat, TextGen, processamento multimodal | Ativo (default) |
| GPT-4o | Alternativa (se key configurada) | Disponível |
| Claude Sonnet | Alternativa (se key configurada) | Disponível |
| Imagen 4 | Geração de imagens | Mock (precisa Vertex AI key) |

### Dependências externas

| Serviço | Uso | Status |
|---------|-----|--------|
| Firebase Auth | Login Google + RBAC | Configurado (projeto `koro-creators`) |
| Google AI API | Gemini Flash (chat, text, multimodal) | Configurado |
| PostgreSQL | Dados persistidos (Cloud SQL) | Local dev |
| GCS | Armazenamento de arquivos | A configurar |
| Cloud Scheduler | Agendamento de workflows | A configurar |
| MLflow | Tracing + evaluation | Local dev |

---

## 6. Roadmap

### Concluído (Phases 1-10 + SPECs)

| Phase | O que | Quando |
|-------|-------|--------|
| 1 | Protótipo base (sistema solar, 4 níveis) | 2026-03-23 |
| 2 | AI UX Patterns (templates, variações, actions) | 2026-03-23 |
| 3 | Skills Admin (CRUD, editor, version history) | 2026-03-24 |
| 4 | Biblioteca v1 (docs texto, tags, scopes) | 2026-03-24 |
| 5 | HITL Feedback (thumbs, sessão, scores) | 2026-03-24 |
| 6 | Clientes Admin (CRUD, métricas) | 2026-03-24 |
| 7 | Navegação + Automações dev | 2026-03-24 |
| 8 | Backend FastAPI + LangGraph | 2026-03-26 |
| 9 | Frontend ↔ Backend integration | 2026-03-26 |
| 10 | Auth + RBAC (Firebase) | 2026-03-26 |
| SPEC-001 | Chat real + tools integration | 2026-03-26 |
| SPEC-002 | Knowledge + Biblioteca v2 (multimodal, pgvector) | 2026-04-15 |
| SPEC-003 | Workflow Builder (compiler, executor, UI) | 2026-04-15 |
| SPEC-004 | Workflow chaining (sub-workflows) | 2026-04-16 |

### Em progresso

| Item | O que falta |
|------|-------------|
| Deploy staging | Criar projeto GCP dedicado, configurar secrets |
| Testes com API keys reais | ImageGen (Vertex AI), VideoGen (Veo) |

### Próximo (priorizado)

| Prioridade | Feature | Impacto |
|:---:|---------|---------|
| **P0** | **Deploy staging** — colocar o produto acessível para testes | Desbloqueia validação com usuários |
| **P1** | **Testes com usuários reais** — 3-5 criativos usando Copy Social | Validação de produto |
| **P2** | **Busca global (Cmd+K)** — buscar skills, docs, clientes | UX |
| **P3** | **Sidebar recentes** — últimos clientes/skills visitados | UX |
| **P4** | **Onboarding** — welcome screen, empty states | Adoção |
| **P5** | **VideoGen** — integrar Veo 3.1 | Feature |

---

## 7. Métricas e Sucesso

### KPIs propostos (a validar com PM)

| KPI | Meta | Como medir |
|-----|------|-----------|
| **Adoção** | 10+ usuários ativos semanais | Firebase Analytics |
| **Engajamento** | 50+ mensagens de chat/semana | MLflow traces |
| **Qualidade** | Score médio HITL > 4.0 | Feedbacks no ContextSidebar |
| **Automação** | 5+ workflows ativos com schedule | PostgreSQL workflows table |
| **Economia de tempo** | 30% redução em tarefas repetitivas | Survey com times |

### Feedback coletado até agora

- HITL implementado mas sem dados reais (apenas dev testing)
- Eval framework (scorers de tone, format, routing, context) configurado mas precisa de dados reais
- 48+ atividades mapeadas como candidatas a automação (levantamento em andamento)

---

## 8. Usuários e Stakeholders

### Sponsor

- **Guga** — Reuniões semanais (terça-feira) sobre direção do produto

### Time de desenvolvimento

| Pessoa | Papel | Foco |
|--------|-------|------|
| **Heitor Miranda** | Tech Lead | Arquitetura, specs, direção técnica |
| **José Lucas (Zé)** | Dev Lead | Plataforma, front/back, infraestrutura |
| **William (Carioca)** | AI Engineer | Arquitetura de agents, eval, harness |
| **Fabinho** | Dev | Auxiliar do Zé, construção, aprendendo AI |
| **Yuri** | Process/Design | Mapeamento de processos, UX, entrevistas |

### Times internos (usuários futuros)

| Time | Atividades mapeadas | Contato |
|------|:---:|---------|
| **Planejamento** | 24 | A definir |
| **Mídia** | 6 | A definir |
| **BI** | 5 | A definir |
| **Growth / Dados** | 6 | A definir |
| **Operações** | 4 | A definir |
| **Adm / Financeiro** | 2 | A definir |
| **Eficiência** | 1 | A definir |

### Entrevistas

- Em andamento com todos os times acima
- Objetivo: mapear atividades automatizáveis além das 48 já identificadas
- Responsável: Heitor + Yuri

---

## 9. Riscos e Débitos

### Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|:---:|:---:|-----------|
| API keys de IA não disponíveis | Média | Alto | Fallback para mock em tudo |
| Custo de LLM escalar com uso | Alta | Médio | Gemini Flash (barato), rate limits por workflow |
| Usuários não adotarem | Média | Alto | Testes com 3-5 users antes de rollout |
| Time pequeno (4 devs) | Alta | Alto | Workflow Builder empodera outros times |
| Deploy bloqueado por infra | Média | Alto | Projeto GCP dedicado em setup |

### Débitos técnicos

| Débito | Impacto | Prioridade |
|--------|---------|:---:|
| Conversas não persistem entre sessões | UX ruim para uso real | P1 |
| Sistema solar usa dados estáticos | Não reflete admin de Clientes | P3 |
| ImageGen é mock (sem Vertex AI) | Copy Social sem visual real | P2 |
| Sem testes automatizados (pytest) | Risco de regressão | P2 |
| 3 vulnerabilidades de dependência no GitHub | Segurança | P2 |
| ROADMAP.md desatualizado | Documentação | P3 |

---

## 10. Como Testar

### Ambiente local

```bash
cd /Users/heitormiranda/projects/koro/sunos

# Backend (porta 8080)
cd api && uv run uvicorn main:app --host 0.0.0.0 --port 8080 --reload

# Frontend (porta 3003) — em outro terminal
npx next dev -p 3003
```

| URL | O que é |
|-----|---------|
| http://localhost:3003 | Frontend (login ou home) |
| http://localhost:8080 | Backend health check |
| http://localhost:8080/docs | Swagger API docs |

### Credenciais

- **Login:** Google Auth (`@korocreators.com` ou Google pessoal com acesso)
- **Dev bypass:** em development, auth é opcional
- **Admin role:** configurado via Firebase Custom Claims

### Fluxos para validar

| # | Fluxo | Steps |
|---|-------|-------|
| 1 | **Chat básico** | Home → Santander → Copy Social → Feed → enviar mensagem → receber resposta Gemini |
| 2 | **Social Preview** | No chat Copy Social → gerar carrossel → ver slides lado a lado + variações |
| 3 | **Skills Admin** | `/skills` → ver catálogo → clicar card → editar prompt → salvar |
| 4 | **Biblioteca** | `/biblioteca` → ver docs → filtrar por scope/tags → upload arquivo |
| 5 | **Clientes** | `/clientes` → ver grid → clicar → ver tabs (Skills, Biblioteca, Métricas) |
| 6 | **Workflows** | `/workflows` → criar workflow → adicionar steps → executar → ver resultado |
| 7 | **HITL** | No chat → dar thumbs up/down → ver painel de validação no sidebar |
| 8 | **Dark/Light** | Toggle no header → verificar ambos os temas |

### Bugs conhecidos

- Social Preview: parsing de slides pode falhar com formatos inesperados da IA
- Workflows: execução precisa de backend rodando (sem fallback mock)
- Upload: precisa de GCS configurado para uploads reais (mock funciona sem)

---

## 11. Glossário

| Termo | Definição |
|-------|-----------|
| **Skill** | Capacidade de IA configurável (ex: Copy Social, Plano de Mídia). Tem system prompt, modelo, moons. |
| **Moon** | Sub-área de um skill (ex: Copy Social → Feed/Carrossel, Stories/Reels, X/Twitter). |
| **Biblioteca** | Base de conhecimento com documentos por cliente/escopo. Alimenta os agents com contexto. |
| **HITL** | Human in the Loop — sistema de feedback onde humanos avaliam outputs da IA. |
| **Workflow** | Automação que encadeia tools (IA, dados, ações) em steps sequenciais com agendamento. |
| **Agent** | Instância de IA que orquestra tools e skills para responder a uma tarefa. |
| **Tool** | Função atômica que o agent pode chamar (generate_text, search_knowledge, etc.). |
| **Scope** | Escopo de um documento: "suno" (global) ou slug do cliente (ex: "santander"). |
| **LangGraph** | Framework de orquestração de agents (StateGraph). Engine do backend. |
| **SDD** | Spec-Driven Development — metodologia de specs antes de implementar. |
| **ADR** | Architecture Decision Record — documenta decisões técnicas e suas razões. |
| **System Prompt** | Instruções que definem o comportamento da IA para um skill específico. |
| **SSE** | Server-Sent Events — protocolo de streaming para respostas do chat em tempo real. |
| **pgvector** | Extensão do PostgreSQL para busca vetorial (similarity search). |
| **Cloud Run** | Serviço serverless do Google Cloud para deploy de containers. |

---

## Documentação Técnica Complementar

| Documento | Path | Conteúdo |
|-----------|------|----------|
| Convenções frontend | `CLAUDE.md` | Stack, design system, restrições |
| Convenções backend | `api/CLAUDE.md` | Padrões, skills system, agent pattern |
| Roadmap | `docs/ROADMAP.md` | Phases 1-16 com status |
| ADR-001 | `docs/adr/ADR-001-agent-builder-deferred.md` | Workflow Builder (aceito) |
| ADR-002 | `docs/adr/ADR-002-single-engine-not-deep-agent-per-client.md` | Engine único |
| SPEC-001 | `docs/specs/large/sunohub-tools-integration/` | Backend + Chat real |
| SPEC-002 | `docs/specs/large/knowledge-biblioteca-v2/` | Knowledge multimodal |
| SPEC-003 | `docs/specs/large/workflow-builder/` | Workflow Builder |
| SPEC-004 | `docs/specs/large/workflow-chaining/` | Encadeamento de workflows |
| SDD Log | `docs/specs/_log/usage-log.md` | Histórico de specs |
| ROI Atividades | (externo) `roi_completo_suno.xlsx` | 136 atividades mapeadas |
