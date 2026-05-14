---
documento: BRD Parte 4 — Regras de Negócio (RN-XXX)
projeto: sunOS
cliente: Suno United Creators (uso 100% interno)
bu: Tecnologia e Dados para Marketing
versao: 1.0
data_criacao: 2026-04-28
ultima_atualizacao: 2026-05-14
autor: Heitor Miranda + Claude (assistido)
status: Rascunho
aprovacoes:
  - area: Diretoria Suno United Creators
    aprovador: José Augusto Ketzer (Guga)
    data:
    status: Pendente
  - area: Tecnologia e Dados para Marketing
    aprovador: Heitor Miranda
    data: 2026-04-28
    status: Pendente
fonte_principal: Parte 3 (Requisitos BR-XXX) + FRD Moon Shot + Research foundation engineering serendipity
---

# BRD Parte 4 — Regras de Negócio

## Objetivo

Esta parte materializa os **Requisitos de Negócio (BR-XXX)** da Parte 3 em **regras decisionais formais (RN-XXX)** com lógica explícita SE/ENTÃO/SENÃO. Cada regra pode ser implementada como código, validada por auditoria, ou usada como guideline operacional para tomadas de decisão por humanos.

**RN ≠ FR (Functional Requirement)**: a RN descreve **a lógica de decisão de negócio**, não como o sistema implementa. O FRD/PRD/SRD traduzirão cada RN em mecanismos técnicos.

## Como Usar

- Cada RN tem ID sequencial (RN-001 a RN-034), referencia ≥1 BR da Parte 3
- Lógica formal: **SE** (condição) **ENTÃO** (ação) **SENÃO** (ação alternativa ou comportamento padrão)
- Inputs declaram o que precisa estar disponível (origem, sistema)
- KPIs ligam a regra a métricas de sucesso da Parte 3
- **Confiabilidade** sinaliza a robustez da fonte: Alta (fonte oficial direta), Média (fonte única ou inferência baseada em pesquisa), Baixa (proposta a validar)

## Sumário Executivo (22 RNs)

| ID | Título resumido | BR(s) | Categoria | Confiabilidade |
|----|----------------|-------|-----------|:--------------:|
| **RN-001** | Filtragem de provocações por zona de bisociação | BR-001 | Filtragem | Alta |
| **RN-002** | Convergência do loop Explorer↔Crítico | BR-001 | Filtragem | Alta |
| **RN-003** | Acionamento do Moon Shot | BR-001 | Acionamento | Alta |
| **RN-004** | Avaliação mensal de redução de tempo por skill | BR-002 | Mensuração | Média |
| **RN-005** | Geração e flagging do dashboard executivo | BR-003 | Mensuração | Média |
| **RN-006** | Validação de metadados em ingestão da Biblioteca | BR-004 | Acesso/Curadoria | Alta |
| **RN-007** | Visibilidade de conteúdo de cliente ativo vs. inativo | BR-005 | Acesso | Alta |
| **RN-008** | Detecção de conhecimento crítico em risco | BR-005 | Auditoria | Média |
| **RN-009** | Controle de acesso por perfil (RBAC) | BR-007 | Acesso | Alta |
| **RN-010** | Isolamento de contexto entre clientes | BR-008 | Acesso/Privacidade | Alta |
| **RN-011** | Ocultação da Biblioteca para perfil operacional | BR-007 | Acesso/UX | Alta |
| **RN-012** | Auditabilidade de acessos administrativos | BR-007, BR-009 | Auditoria | Média |
| **RN-013** | Retenção e descarte de logs de IA | BR-009, BR-008 | Auditoria/LGPD | Média |
| **RN-014** | Marcação visual de outputs de IA | BR-010 | UX/Cultura | Alta |
| **RN-015** | Forced reflection moments após N aprovações | BR-010, BR-012 | UX/Cultura | Média |
| **RN-016** | Validação de vocabulário de UI contra Glossário | BR-011 | UX/Cultura | Média |
| **RN-017** | Sugestão de track de onboarding por estágio de carreira | BR-012 | UX | Baixa |
| **RN-018** | Cálculo de custo evitado por execução de skill | BR-013 | Mensuração | Alta |
| **RN-019** | Mensuração mensal e alerta de homogeneização coletiva | BR-014 | Mensuração/Safety | Alta |
| **RN-020** | Bloqueio de relatório com satisfação individual isolada | BR-014 | Mensuração/Safety | Alta |
| **RN-021** | Hierarquia de truncamento de contexto em Skills | BR-015 | Acesso/Qualidade | Alta |
| **RN-022** | Avaliação de duplicidade vs. ferramentas de mercado | BR-016 | Governança | Média |
| **RN-023** | Validators paralelos (Brand, Português, Legal) com Validation Report estruturado | BR-017 | Aprovação | Alta |
| **RN-024** | Aprovador é sempre humano (agente nunca aprova) | BR-017 | Aprovação | Alta |
| **RN-025** | Limite de 3 rounds automáticos antes de escalar humano-humano | BR-017 | Aprovação | Alta |
| **RN-026** | Hierarquia de aprovação configurável por área | BR-017 | Aprovação/Admin | Média |
| **RN-027** | Drive integration é read-only (zero write/delete/move) | BR-018 | Drive/Privacidade | Alta |
| **RN-028** | Intersecção ACL Drive × RBAC sunOS — default deny | BR-018, BR-007 | Drive/Acesso | Alta |
| **RN-029** | Curadoria do Drive por agente é **sugestiva**; humano executa | BR-018, BR-010 | Drive/Cultura | Alta |
| **RN-030** | Re-sync periódico (24h) + webhook para mudanças críticas | BR-018 | Drive/Reliability | Média |

---

## A — Regras de Valor Primário

### RN-001 — Filtragem de provocações por zona de bisociação

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-001 |
| **BR(s) relacionado(s)** | BR-001 (Provocação criativa contra homogeneização) |
| **Dimensão/Subdimensão** | Filtragem / Zona criativa |
| **Variável de decisão** | Classificação de provocação por nível de surpresa relevante |
| **Inputs necessários** | Embedding do briefing (LLM), embedding da provocação, modo do creator (adjacente / equilibrado / radical) — origem: pipeline Moon Shot |
| **Condição** | **SE** distância semântica entre briefing e provocação for **mínima** (zona "óbvio") **ENTÃO** descartar provocação. **SE** distância for **moderada e mappeável** (zona Sweet Spot) **ENTÃO** priorizar. **SE** distância for **extrema sem ponte de sentido** (zona "incoerente") **ENTÃO** descartar. **SENÃO** seguir conforme modo configurado pelo creator |
| **Ação de negócio recomendada** | Apresentar ao creator apenas provocações na zona Sweet Spot por padrão; expandir para zonas adjacentes ou radicais sob demanda explícita |
| **KPIs de sucesso** | ≥60% de provocações classificadas como "úteis" em testes blind (BR-001) · ≥90% de filtragem efetiva de zonas extremas |
| **Fontes** | FRD Moon Shot §FR-011 · Research foundation: Hope, Chan, Kittur & Shahaf 2017 · Chan & Schunn 2014 |
| **Confiabilidade** | **Alta** — operacionalização técnica detalhada no FRD, baseada em literatura empírica |

---

### RN-002 — Convergência do loop Explorer↔Crítico

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-002 |
| **BR(s) relacionado(s)** | BR-001 |
| **Dimensão/Subdimensão** | Filtragem / Multi-agente |
| **Variável de decisão** | Aprovação ou rejeição de provocação após avaliação multi-agente |
| **Inputs necessários** | Provocação gerada pelo Explorer + scores das 3 dimensões avaliadas pelo Crítico (Novidade, Coerência, Potencial Criativo) — origem: pipeline Moon Shot |
| **Condição** | **SE** score médio (Novidade × Coerência × Potencial) ≥ 8 **ENTÃO** aprovar provocação. **SE** qualquer dimensão individual < 5 **ENTÃO** rejeitar e devolver ao Explorer com feedback. **SE** ≥ 5 iterações sem convergência **ENTÃO** interromper e descartar. **SENÃO** continuar iteração |
| **Ação de negócio recomendada** | Garantir que toda provocação apresentada ao creator passou por avaliação adversarial estruturada — protege contra ruído |
| **KPIs de sucesso** | Taxa de aprovação automática estável entre 30%–60% das provocações geradas (sinal de calibração saudável) · Tempo médio de iteração < 20s |
| **Fontes** | FRD §FR-010 |
| **Confiabilidade** | **Alta** — derivado diretamente do FRD com lógica explícita |

---

### RN-003 — Acionamento do Moon Shot

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-003 |
| **BR(s) relacionado(s)** | BR-001 |
| **Dimensão/Subdimensão** | Acionamento / UX |
| **Variável de decisão** | Disparo do pipeline criativo a partir do contexto do creator |
| **Inputs necessários** | Cliente ativo na sessão · Tema/briefing em andamento · Modo de intensidade configurado |
| **Condição** | **SE** creator está em contexto de cliente E aciona Moon Shot **ENTÃO** executar pipeline com contexto automático. **SE** creator não tem contexto de cliente E aciona **ENTÃO** solicitar tema/briefing antes de executar. **SE** pipeline ultrapassar 30s sem resposta **ENTÃO** notificar creator com opção de cancelar. **SENÃO** executar normalmente |
| **Ação de negócio recomendada** | Manter o princípio "3 cliques até o valor" — creator nunca deve preencher formulário longo para receber provocações |
| **KPIs de sucesso** | Tempo médio de resposta < 15s · Taxa de cancelamento por timeout < 5% |
| **Fontes** | FRD §FR-008, princípio "Botão da criatividade, não do desespero" |
| **Confiabilidade** | **Alta** — princípio de UX explícito no FRD |

---

### RN-004 — Avaliação mensal de redução de tempo por skill

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-004 |
| **BR(s) relacionado(s)** | BR-002 (Aceleração operacional) |
| **Dimensão/Subdimensão** | Mensuração / Performance operacional |
| **Variável de decisão** | Saúde de cada skill processual em termos de redução de tempo prometida |
| **Inputs necessários** | Tempo médio histórico (baseline pré-sunOS) por tarefa · Tempo médio atual de execução do skill · Volume de execuções no mês — origem: tracing MLflow + planilha ROI |
| **Condição** | **SE** redução de tempo do skill no mês ≥ 30% E qualidade percebida não regrediu **ENTÃO** marcar como "skill saudável". **SE** redução < 30% por 2 meses consecutivos **ENTÃO** disparar revisão (skill, prompt, contexto, ou baseline incorreta). **SE** qualidade percebida cair > 10% **ENTÃO** revisar mesmo com tempo bom. **SENÃO** monitorar |
| **Ação de negócio recomendada** | Skills que não entregam redução prometida devem ser deprecadas, refatoradas, ou ter baseline ajustada — não se acomoda mediocridade |
| **KPIs de sucesso** | ≥80% das skills ativas com redução ≥30% sustentada por 3+ meses · Cobertura de ≥10 tarefas-alvo (BR-002) |
| **Fontes** | BR-002, Q8 (business case em construção), Parte 1 §2.3 |
| **Confiabilidade** | **Média** — requer baseline confiável que ainda está em construção |

---

### RN-005 — Geração e flagging do dashboard executivo

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-005 |
| **BR(s) relacionado(s)** | BR-003 (Demonstração de ROI) |
| **Dimensão/Subdimensão** | Mensuração / Reporting executivo |
| **Variável de decisão** | Quando gerar dashboard e como sinalizar atenção |
| **Inputs necessários** | KPIs do mês corrente e do mês anterior · Baseline anual · Eventos materiais (saída de cliente, novo skill em produção) |
| **Condição** | **SE** final de mês **ENTÃO** gerar dashboard automaticamente até dia 5 do mês seguinte. **SE** Diretoria solicita ad-hoc **ENTÃO** permitir geração imediata com snapshot do momento. **SE** qualquer KPI variar > 25% mês a mês (subida ou queda) **ENTÃO** flag visual de atenção com explicação textual obrigatória. **SENÃO** exibir tendência normal |
| **Ação de negócio recomendada** | Tornar reporting trimestral à Diretoria orgânico, não emergencial — base para reuniões semanais com Guga |
| **KPIs de sucesso** | Dashboard publicado mensalmente sem atraso · Reuniões semanais usam o dashboard ativamente |
| **Fontes** | BR-003, transcrições reuniões semanais |
| **Confiabilidade** | **Média** — formato do dashboard ainda a definir (PA-05) |

---

## B — Regras de Conhecimento e Inteligência Coletiva

### RN-006 — Validação de metadados em ingestão da Biblioteca

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-006 |
| **BR(s) relacionado(s)** | BR-004 (Repositório institucional) |
| **Dimensão/Subdimensão** | Acesso / Curadoria |
| **Variável de decisão** | Aceitação ou bloqueio de conteúdo na Biblioteca |
| **Inputs necessários** | Conteúdo submetido + campos: título, domínio (cliente \| indústria \| cultura \| metodologia \| referência), tags, cliente associado, fonte, descrição |
| **Condição** | **SE** conteúdo submetido sem título OU sem domínio OU com < 2 tags OU com descrição < 50 caracteres **ENTÃO** bloquear ingestão e exigir correção. **SE** conteúdo for cliente-específico mas sem cliente associado **ENTÃO** bloquear. **SE** todos os metadados obrigatórios estão completos **ENTÃO** aceitar e iniciar indexação dual (vetorial + grafo). **SENÃO** solicitar correção |
| **Ação de negócio recomendada** | Sem metadados estruturados, retrieval divergente do Moon Shot não funciona. Curadoria preguiçosa hoje = serendipidade fraca amanhã |
| **KPIs de sucesso** | 100% dos itens da Biblioteca com metadados completos · Tempo médio de curadoria por item < 5 min |
| **Fontes** | FRD §FR-001 |
| **Confiabilidade** | **Alta** — derivado diretamente do FRD |

---

### RN-007 — Visibilidade de conteúdo de cliente ativo vs. inativo

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-007 |
| **BR(s) relacionado(s)** | BR-005 (Continuidade do repertório), BR-004 |
| **Dimensão/Subdimensão** | Acesso / Catálogo |
| **Variável de decisão** | Visibilidade de conteúdo de cliente conforme status do cliente |
| **Inputs necessários** | Status do cliente (ativo / inativo) · Perfil do usuário · Tipo de retrieval (padrão vs. busca explícita por líder) |
| **Condição** | **SE** cliente status = "ativo" **ENTÃO** exibir conteúdo no Sistema Solar e em todos retrievals padrão. **SE** cliente status = "inativo" **ENTÃO** manter conteúdo na Biblioteca mas ocultar de Sistema Solar e retrievals padrão. **SE** líder solicitar busca explícita por cliente inativo **ENTÃO** permitir acesso. **SENÃO** seguir status do cliente |
| **Ação de negócio recomendada** | Repertório de clientes históricos não desaparece — serve a Moon Shot e a onboarding, sem poluir a operação diária |
| **KPIs de sucesso** | ≥80% das contas históricas críticas com contexto preservado (BR-005) · Zero conhecimento perdido em saídas de clientes |
| **Fontes** | FRD §FR-005, BR-005 |
| **Confiabilidade** | **Alta** |

---

### RN-008 — Detecção de conhecimento crítico em risco

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-008 |
| **BR(s) relacionado(s)** | BR-005 (Continuidade pós-turnover) |
| **Dimensão/Subdimensão** | Auditoria / Risco institucional |
| **Variável de decisão** | Identificação de conhecimento crítico que vive em uma única pessoa |
| **Inputs necessários** | Logs de acesso/contribuição a conteúdos da Biblioteca por usuário, últimos 90 dias · Nível de seniority do usuário · Criticidade do conteúdo (cliente, regras de negócio, etc.) |
| **Condição** | **SE** nos últimos 90 dias um conteúdo crítico foi acessado/contribuído apenas por 1 pessoa **ENTÃO** marcar como "risco de saída". **SE** essa pessoa for de alta seniority OU long-tenure **ENTÃO** escalar alerta para líder da área e RH (futuro). **SE** conteúdo for guideline de cliente ativo **ENTÃO** marcar prioridade alta de captura. **SENÃO** status normal |
| **Ação de negócio recomendada** | Programa proativo de captura de conhecimento (entrevistas, documentação) antes de saída — reduz perda institucional |
| **KPIs de sucesso** | < 10% das contas ativas com regra de negócio acessada por uma única pessoa · Tempo de re-onboarding pós-saída de creator-chave reduz ≥30% |
| **Fontes** | BR-005, Glossário §1 (Inteligência Coletiva), transcrição (saída Stella e Fernando) |
| **Confiabilidade** | **Média** — definição de "crítico" e thresholds requerem calibração com líderes |

---

## C — Regras de Governança, Segurança e IP

### RN-009 — Controle de acesso por perfil (RBAC)

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-009 |
| **BR(s) relacionado(s)** | BR-007 (Proteção do IP) |
| **Dimensão/Subdimensão** | Acesso / RBAC |
| **Variável de decisão** | Operações permitidas por perfil de usuário |
| **Inputs necessários** | Perfil do usuário autenticado (Admin / Líder / Operacional) · Recurso solicitado · Operação solicitada (read/write/delete) |
| **Condição** | **SE** perfil = Admin **ENTÃO** liberar CRUD total na Biblioteca + lógica de skills + system prompts. **SE** perfil = Líder **ENTÃO** liberar CRUD na Biblioteca da sua área + leitura de áreas relacionadas. **SE** perfil = Operacional **ENTÃO** liberar apenas consumo via skills/Moon Shot (sem acesso direto à Biblioteca, lógica de skills ou system prompts). **SENÃO** negar acesso (default deny) |
| **Ação de negócio recomendada** | Default deny: qualquer ambiguidade de permissão é resolvida negando. Caixa-preta protegida nas sete chaves |
| **KPIs de sucesso** | Zero exposição de skills/system prompts a perfis operacionais (auditável) · 100% de operações registradas em log de auditoria |
| **Fontes** | FRD §FR-007, Glossário §1 (Caixa-preta), BR-007, ADR-CAND-002 |
| **Confiabilidade** | **Alta** — derivado de fonte oficial direta |

---

### RN-010 — Isolamento de contexto entre clientes

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-010 |
| **BR(s) relacionado(s)** | BR-008 (Privacidade de dados de clientes) |
| **Dimensão/Subdimensão** | Acesso / Privacidade |
| **Variável de decisão** | Isolamento entre dados de clientes diferentes em skills processuais |
| **Inputs necessários** | Cliente ativo da sessão · Conteúdo da Biblioteca elegível para retrieval · Tag "cross-client" se aplicável |
| **Condição** | **SE** skill processual está em contexto do cliente A **ENTÃO** injetar contexto somente do cliente A. **SE** conteúdo for tagueado como "cross-client" (benchmark de indústria, metodologia genérica) **ENTÃO** permitir injeção com peso reduzido (0.4). **SE** alguma chamada incluir contexto de cliente B em skill de cliente A **ENTÃO** bloquear, auditar e gerar alerta. **SENÃO** seguir filtro padrão por cliente |
| **Ação de negócio recomendada** | Garantia técnica de que dados de Vivo nunca alimentam relatório de Americanas — protege relação de confiança com cada cliente individualmente |
| **KPIs de sucesso** | Zero incidentes de cross-contamination entre clientes (auditável) · 100% das skills processuais com filtro por cliente ativo |
| **Fontes** | FRD §FR-016, BR-008 |
| **Confiabilidade** | **Alta** |

---

### RN-011 — Ocultação da Biblioteca para perfil operacional

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-011 |
| **BR(s) relacionado(s)** | BR-007 (Proteção de IP), BR-006 (Acesso democrático mediado) |
| **Dimensão/Subdimensão** | Acesso / UX |
| **Variável de decisão** | Visibilidade da existência da Biblioteca conforme perfil |
| **Inputs necessários** | Perfil do usuário · Tela/recurso sendo renderizado |
| **Condição** | **SE** perfil = Operacional **ENTÃO** não exibir menu, link, breadcrumb ou referência visual à Biblioteca em qualquer tela. **SE** Operacional tentar acessar URL direta da Biblioteca **ENTÃO** redirecionar para home com mensagem genérica (não revelar existência do recurso). **SE** skill mencionar "contexto da Biblioteca" em output **ENTÃO** substituir por linguagem neutra ("contexto do cliente"). **SENÃO** exibir apenas o que perfil tem direito |
| **Ação de negócio recomendada** | Conforme decisão explícita do Guga: *"a biblioteca o cara não pode saber. A biblioteca é o olho também."* Operacional consome resultado, não infraestrutura |
| **KPIs de sucesso** | Zero menções a "Biblioteca" em interface operacional · Zero acessos diretos bem-sucedidos por operacionais |
| **Fontes** | Transcrição reunião sobre sunOS, ADR-CAND-002, FRD §FR-007, BR-007 |
| **Confiabilidade** | **Alta** — decisão direta do sponsor |

---

### RN-012 — Auditabilidade de acessos administrativos

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-012 |
| **BR(s) relacionado(s)** | BR-007, BR-009 (Auditabilidade) |
| **Dimensão/Subdimensão** | Auditoria / Segurança |
| **Variável de decisão** | Registro e flagging de acessos administrativos suspeitos |
| **Inputs necessários** | User ID · Timestamp · Ação · Escopo · Horário comercial vs. fora · Baseline mensal de acessos administrativos por usuário |
| **Condição** | **SE** perfil = Admin OU Líder acessar dados administrativos (CRUD na Biblioteca, configuração de skills) **ENTÃO** registrar log estruturado com user_id, timestamp, ação, escopo. **SE** acesso for fora de horário comercial sem justificativa **ENTÃO** marcar para revisão semanal. **SE** volume de acessos administrativos por um usuário > 3σ da baseline mensal **ENTÃO** alertar Diretoria. **SENÃO** log padrão |
| **Ação de negócio recomendada** | Substitui parcialmente a ausência de DPO formal — Diretoria fica com visibilidade sobre uso administrativo |
| **KPIs de sucesso** | 100% dos acessos administrativos registrados · Revisão semanal de logs por Heitor (ou delegado) |
| **Fontes** | BR-007, BR-009, Parte 1 §3.4 (sem DPO) |
| **Confiabilidade** | **Média** — thresholds (3σ, horário comercial) requerem calibração inicial |

---

### RN-013 — Retenção e descarte de logs de IA

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-013 |
| **BR(s) relacionado(s)** | BR-009 (Auditabilidade), BR-008 (Privacidade) |
| **Dimensão/Subdimensão** | Auditoria / LGPD |
| **Variável de decisão** | Política de retenção de logs por categoria |
| **Inputs necessários** | Tipo de log (chamada LLM, retrieval, edição) · Idade do log · Presença de dado pessoal de cliente |
| **Condição** | **SE** chamada a LLM em produção **ENTÃO** registrar contexto, prompt, output, modelo, latência, custo. **SE** log persistido < 12 meses **ENTÃO** manter em armazenamento ativo. **SE** log > 12 meses **ENTÃO** mover para armazenamento frio (compliance LGPD). **SE** log envolve dado pessoal identificável de cliente **ENTÃO** aplicar retenção específica conforme política aprovada pela Diretoria (em construção — PA-02). **SENÃO** seguir retenção padrão |
| **Ação de negócio recomendada** | LGPD compliance + auditabilidade sem inflar custo de armazenamento. Política específica para dados pessoais a aprovar antes do Piloto |
| **KPIs de sucesso** | 100% das chamadas LLM com log estruturado · Política LGPD aprovada pela Diretoria antes do Piloto |
| **Fontes** | BR-008, BR-009, LGPD (Lei 13.709/2018), Glossário §5 |
| **Confiabilidade** | **Média** — política específica de dado pessoal ainda em construção |

---

## D — Regras de Adoção, Cultura e UX

### RN-014 — Marcação visual de outputs de IA

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-014 |
| **BR(s) relacionado(s)** | BR-010 (Preservação do ownership criativo) |
| **Dimensão/Subdimensão** | UX / Cultura |
| **Variável de decisão** | Sinalização clara de o que é estímulo de IA vs. peça final do creator |
| **Inputs necessários** | Origem do output (gerado por IA / editado por humano / criado por humano) · Contexto de uso (interno / publicação) |
| **Condição** | **SE** output gerado por IA **ENTÃO** marcar visualmente como "estímulo" / "provocação". **SE** creator integrar output em entregável final **ENTÃO** remover marcação somente após confirmação explícita do creator. **SE** output IA for compartilhado/publicado sem alguma marcação ou confirmação **ENTÃO** bloquear até resolução. **SENÃO** manter marcação |
| **Ação de negócio recomendada** | Princípio "AI provoca, humano cria" precisa ser visível na UX — não basta declarar. Protege ownership e mitiga over-reliance |
| **KPIs de sucesso** | ≥80% de creators seniores em pesquisa qualitativa confirmam sentir ownership · Zero output IA publicado sem confirmação humana explícita |
| **Fontes** | FRD §FA-02, BR-010, research foundation (Wadinambiarachchi 2024, Yuan 2022) |
| **Confiabilidade** | **Alta** |

---

### RN-015 — Forced reflection moments após N aprovações

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-015 |
| **BR(s) relacionado(s)** | BR-010, BR-012 (UX por carreira) |
| **Dimensão/Subdimensão** | UX / Cultura / Cognição |
| **Variável de decisão** | Quando interromper o creator para forçar reflexão crítica |
| **Inputs necessários** | Contagem de stars/aprovações na sessão · Histórico de skip de reflection do usuário · Estágio de carreira (junior/pleno/sênior) |
| **Condição** | **SE** creator deu N stars/aprovações na sessão (N=5 default, configurável) **ENTÃO** interromper e perguntar "Por que essas? Que padrão você vê?". **SE** creator pular reflection ≥3x consecutivas **ENTÃO** escalar sinal para líder (possível over-reliance). **SE** creator é júnior **ENTÃO** N ajustado para baixo (N=3) — proteção extra contra erosão cognitiva. **SENÃO** continuar fluxo normal |
| **Ação de negócio recomendada** | Restaurar engajamento cognitivo que offloading de IA erode (Microsoft Research / MIT Media Lab 2025). Não é fricção decorativa — é proteção de competência |
| **KPIs de sucesso** | Taxa de skip de reflection < 30% (sinal de engajamento real) · Sem queda em métricas neurais/qualitativas de pensamento crítico nos creators frequentes |
| **Fontes** | BR-010, BR-012, research foundation (Lee et al. Microsoft 2025, Kosmyna et al. MIT 2025) |
| **Confiabilidade** | **Média** — N e thresholds requerem A/B testing |

---

### RN-016 — Validação de vocabulário de UI contra Glossário

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-016 |
| **BR(s) relacionado(s)** | BR-011 (Cultura criativa brasileira/Suno) |
| **Dimensão/Subdimensão** | UX / Cultura |
| **Variável de decisão** | Aceitação ou rejeição de copy de UI conforme vocabulário aprovado |
| **Inputs necessários** | Texto de UI sendo proposto · Dicionário do Glossário (Parte 2) · Lista de anti-patterns §9 |
| **Condição** | **SE** texto de UI estiver sendo gerado/editado **ENTÃO** validar contra dicionário do Glossário e lista §9 de termos a evitar. **SE** texto contiver anti-pattern (gerar, otimizar, eficiência, accelerator, departamento de IA, etc.) **ENTÃO** bloquear merge e sugerir alternativa do dicionário. **SE** texto usar vocabulário aprovado (Devorar, Provocar, Faísca, Brasa) **ENTÃO** aceitar. **SENÃO** revisar manualmente |
| **Ação de negócio recomendada** | Vocabulário consistente é vetor cultural — palavras moldam a percepção do produto. *"Devore o briefing"* ≠ *"Otimize sua produtividade"* |
| **KPIs de sucesso** | Zero menções de anti-patterns em copy de produção · Validação cultural com Sponsor (Guga) aprova ≥90% das releases |
| **Fontes** | Glossário §1 e §9, BR-011, research foundation (Brazilian creative cultural layer) |
| **Confiabilidade** | **Média** — aplicação automática requer infraestrutura de validação |

---

### RN-017 — Sugestão de track de onboarding por estágio de carreira

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-017 |
| **BR(s) relacionado(s)** | BR-012 (Diferenciação UX por carreira) |
| **Dimensão/Subdimensão** | UX / Adoção |
| **Variável de decisão** | Track de onboarding sugerida ao novo creator |
| **Inputs necessários** | Tempo de experiência declarado pelo creator · Cargo · Área (criação / mídia / planejamento / outros) |
| **Condição** | **SE** creator é júnior (< 3 anos de experiência) **ENTÃO** sugerir track *"Estou começando uma ideia"* (divergente, abundante). **SE** creator é sênior (≥ 7 anos) **ENTÃO** sugerir track *"Tenho uma ideia, me prova que tá errada"* (devil's advocate, stress-test). **SE** creator é pleno **ENTÃO** apresentar ambas as opções com explicação. **SENÃO** permitir escolha livre |
| **Ação de negócio recomendada** | Respeita as relações diferentes que juniores e seniores têm com IA — maximiza adoção sem despertar resistência identitária |
| **KPIs de sucesso** | NPS de seniores ≥ NPS de juniores (sinal de não-resistência) · Taxa de conclusão de onboarding ≥ 80% |
| **Fontes** | BR-012, research foundation (AI & Society 2025 scoping review) |
| **Confiabilidade** | **Baixa** — proposta a validar com Bruno Prosperi e patrocinadores sócio. Definições de "júnior" e "sênior" podem variar por área |

---

## E — Regras de Mensuração

### RN-018 — Cálculo de custo evitado por execução de skill

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-018 |
| **BR(s) relacionado(s)** | BR-013 (Mensuração de custo evitado) |
| **Dimensão/Subdimensão** | Mensuração / Business case |
| **Variável de decisão** | Custo evitado em uma execução de skill processual |
| **Inputs necessários** | Tempo real de execução do skill · Baseline de tempo manual da tarefa equivalente (planilha ROI) · Custo médio por hora-homem por área |
| **Condição** | **SE** skill processual completou execução **ENTÃO** registrar tempo real. **SE** baseline de tempo manual existe para a tarefa **ENTÃO** calcular custo evitado = (tempo_manual − tempo_skill) × custo_hora_médio_da_área. **SE** baseline não existir **ENTÃO** marcar execução como "baseline pendente" e registrar para futura calibração. **SENÃO** log padrão sem cálculo |
| **Ação de negócio recomendada** | Acumular evidência mensurável para business case (BR-003). Toda execução é insumo do dashboard executivo |
| **KPIs de sucesso** | ≥80% das execuções com custo evitado calculável · Mapeamento das 136 atividades atualizado trimestralmente |
| **Fontes** | BR-013, Q8, Parte 1 §2.3 |
| **Confiabilidade** | **Alta** — lógica direta, depende apenas da curadoria do baseline |

---

### RN-019 — Mensuração mensal e alerta de homogeneização coletiva

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-019 |
| **BR(s) relacionado(s)** | BR-014 (Detecção de homogeneização coletiva) |
| **Dimensão/Subdimensão** | Mensuração / Safety |
| **Variável de decisão** | Disparo de alerta sobre homogeneização criativa coletiva |
| **Inputs necessários** | Amostra representativa de outputs criativos do mês · Baseline pré-sunOS das três métricas (Mean Pairwise Cosine Distance, Self-BLEU, Compression Ratio) · Histórico mensal |
| **Condição** | **SE** final de mês **ENTÃO** calcular as três métricas sobre amostra do mês. **SE** qualquer métrica divergir > 2σ da baseline (na direção de menor diversidade) **ENTÃO** disparar alerta para Sponsor + patrocinadores sócio com plano de mitigação proposto. **SE** divergência persistir 2+ meses consecutivos **ENTÃO** escalar para Diretoria com plano de mitigação executivo. **SE** mitigação não funcionar em 90 dias **ENTÃO** suspender funcionalidade-causa raiz e revisar arquitetura. **SENÃO** arquivar relatório mensal |
| **Ação de negócio recomendada** | Modo de falha existencial do projeto — sucesso individual com colapso coletivo é fracasso disfarçado. Esta regra é a salvaguarda contra o "leveling-up illusion" |
| **KPIs de sucesso** | Diversidade coletiva estável ou crescente após estabilização inicial · Alertas disparados são acionados (não ignorados) |
| **Fontes** | BR-014, research foundation (Doshi & Hauser Science Advances 2024, Padmakumar & He ICLR 2024) |
| **Confiabilidade** | **Alta** — fundamentação científica robusta. Requer baseline pré-sunOS (PA-03) |

---

### RN-020 — Bloqueio de relatório com satisfação individual isolada

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-020 |
| **BR(s) relacionado(s)** | BR-014 (Detecção de homogeneização) |
| **Dimensão/Subdimensão** | Mensuração / Safety / Governance |
| **Variável de decisão** | Permissão para gerar relatório que reporte satisfação individual de creators |
| **Inputs necessários** | Relatório sendo construído · Métricas incluídas · Métricas obrigatórias por categoria |
| **Condição** | **SE** relatório a ser gerado contém aggregate user satisfaction (NPS, thumbs up rate, feedback positivo) **ENTÃO** incluir obrigatoriamente set-level diversity (Mean Pairwise Cosine Distance + Self-BLEU + Compression Ratio) no mesmo relatório. **SE** alguém tentar gerar relatório só com satisfaction **ENTÃO** bloquear emissão e apresentar mensagem explicando o motivo. **SENÃO** permitir geração |
| **Ação de negócio recomendada** | Regra anti-pattern crítica: nunca celebrar adoção individual sem espelhar saúde da diversidade coletiva. Vide research foundation §"What 'creativity working' actually looks like" |
| **KPIs de sucesso** | Zero relatórios oficiais com satisfação isolada · Diretoria habituada a ler ambas as métricas sempre |
| **Fontes** | BR-014, research foundation (ponto crítico Doshi & Hauser) |
| **Confiabilidade** | **Alta** — princípio explícito da research foundation |

---

## F — Regras de Integração e Coexistência

### RN-021 — Hierarquia de truncamento de contexto em Skills

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-021 |
| **BR(s) relacionado(s)** | BR-015 (Integração com Skills), BR-006 (Acesso ao conhecimento) |
| **Dimensão/Subdimensão** | Acesso / Qualidade de output |
| **Variável de decisão** | Como truncar contexto da Biblioteca quando excede capacidade do LLM |
| **Inputs necessários** | Conteúdo elegível para injeção · Pesos por categoria · Limite de context window do modelo ativo |
| **Condição** | **SE** injeção de contexto excede context window do LLM **ENTÃO** truncar começando pelos pesos mais baixos: Referências gerais (0.2) → Contexto de mercado (0.4) → Histórico de campanhas (0.6) → Guidelines de marca (0.8) → Regras de negócio do cliente (1.0, sempre incluir). **SE** truncamento removeu peso ≥ 0.6 **ENTÃO** logar aviso de qualidade potencialmente comprometida. **SE** truncamento atingir Regras de negócio (1.0) **ENTÃO** abortar execução e alertar líder (sinal de cliente com contexto excessivo). **SENÃO** injetar tudo |
| **Ação de negócio recomendada** | Garantir que o crítico-imutável (regras de negócio do cliente) sempre presente, mesmo quando supérfluo é truncado. Outputs nunca quebram brand safety por overflow |
| **KPIs de sucesso** | < 5% das execuções com aviso de truncamento ≥0.6 · Zero abortos por overflow de regras de negócio |
| **Fontes** | FRD §FR-017, BR-015 |
| **Confiabilidade** | **Alta** |

---

### RN-022 — Avaliação de duplicidade vs. ferramentas de mercado

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-022 |
| **BR(s) relacionado(s)** | BR-016 (Não substituir ferramentas de mercado) |
| **Dimensão/Subdimensão** | Governança / Roadmap |
| **Variável de decisão** | Aprovação ou rejeição de feature do roadmap por sobreposição com ferramentas adotadas |
| **Inputs necessários** | Feature proposta · Lista de ferramentas adotadas pelo grupo (Adobe Creative Cloud, Sprinklr, Canva, Salesforce, etc.) · Justificativa de value-add diferencial |
| **Condição** | **SE** feature proposta para roadmap duplica funcionalidade de ferramenta já adotada **ENTÃO** rejeitar OU exigir justificativa explícita de value-add (ex: integração impossível na ferramenta original, lock-in indesejado, custo proibitivo). **SE** workflow precisa gerar saída para ferramenta externa **ENTÃO** implementar via integração (API, webhook), não via clone. **SE** ferramenta de mercado adicionar funcionalidade equivalente à do sunOS **ENTÃO** avaliar depreciação a cada 6 meses. **SENÃO** seguir critério padrão de roadmap |
| **Ação de negócio recomendada** | Disciplina anti-scope-creep — sunOS é camada de inteligência, não substituto de ferramentas de produção. Posicionamento estratégico do sponsor (Q11) |
| **KPIs de sucesso** | Zero features de produção que duplicam ferramentas adotadas · Documentação de integrações ativas atualizada |
| **Fontes** | BR-016, Q11, Parte 1 §1.4 (não-escopo) |
| **Confiabilidade** | **Média** — requer revisão periódica do mercado |

---

---

## G — Regras de Aprovação Hierárquica e Drive (NOVAS — pedido Guga + Bruno Prosperi)

### RN-023 — Validators paralelos com Validation Report estruturado

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-023 |
| **BR(s) relacionado(s)** | BR-017 (Aprovação hierárquica) |
| **Dimensão/Subdimensão** | Aprovação / Pré-validação |
| **Variável de decisão** | Quais agentes validam o asset antes de chegar ao aprovador, e como o resultado é estruturado |
| **Inputs necessários** | Asset finalizado pelo creator · Cliente associado (para Brand Guidelines) · Lista de validators ativos para a área (config) |
| **Condição** | **SE** creator submete asset para aprovação **ENTÃO** disparar agentes validators em paralelo (mínimo: BrandValidator, PortuguêsValidator; configuráveis por área: LegalValidator, AccessibilityValidator etc.). **SE** algum validator falha técnicamente (timeout, erro) **ENTÃO** marcar dimensão como `error` (não bloqueia, mas alerta o aprovador). **SE** todos completam **ENTÃO** consolidar Validation Report estruturado (`{dimensão, status, evidências[], sugestões[]}`) e anexar à submissão. **SENÃO** seguir comportamento padrão |
| **Ação de negócio recomendada** | Aprovador recebe asset + Report — sabe imediatamente onde estão os pontos de atenção sem ter que revisar tudo manualmente |
| **KPIs de sucesso** | ≥80% das revisões evitáveis endereçadas (BR-017) · Tempo médio de validação < 60s P95 |
| **Fontes** | BR-017, FRD Moon Shot §FA-11 (Safety Cultural) |
| **Confiabilidade** | **Alta** — pedido explícito do sponsor com lógica clara |

### RN-024 — Aprovador é sempre humano

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-024 |
| **BR(s) relacionado(s)** | BR-017, BR-010 (Ownership) |
| **Dimensão/Subdimensão** | Aprovação / Governança |
| **Variável de decisão** | Quem decide aprovação final |
| **Inputs necessários** | Submissão + Validation Report + perfil do decisor |
| **Condição** | **SE** asset chega ao status `aguardando-aprovação` **ENTÃO** apenas perfil humano (Aprovador/Líder/Sócio configurado) pode emitir decisão `aprovado | rejeitado | solicitar-ajustes`. **SE** sistema tentar emitir decisão automaticamente (mesmo com Validation Report 100% passed) **ENTÃO** bloquear e logar tentativa como anomalia. **SENÃO** seguir fluxo padrão |
| **Ação de negócio recomendada** | Previne rubber-stamping artificial (humano carimbando IA). UI deixa explícito: "Validado por {agentes}" + "Aprovado por {humano}" — separados |
| **KPIs de sucesso** | Zero aprovações emitidas por agente (auditável) · Em pesquisa qualitativa, aprovadores confirmam que sentem-se decisores reais |
| **Fontes** | BR-017, BR-010, RN-014 (marcação visual) |
| **Confiabilidade** | **Alta** |

### RN-025 — Limite de 3 rounds automáticos

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-025 |
| **BR(s) relacionado(s)** | BR-017 |
| **Dimensão/Subdimensão** | Aprovação / Anti-loop |
| **Variável de decisão** | Quando interromper o ciclo creator→validators→ajustes→re-submissão |
| **Inputs necessários** | Contagem de rounds da submissão atual |
| **Condição** | **SE** rounds < 3 E rejeição por validators **ENTÃO** devolver ao creator com Validation Report e permitir re-submissão. **SE** rounds = 3 E ainda há issues **ENTÃO** escalar para conversa humano-humano (creator + aprovador) — bloquear nova auto-submissão. **SENÃO** seguir fluxo padrão |
| **Ação de negócio recomendada** | Evita loop infinito. Quando há issue persistente, exige conversa direta (humano resolve, não algoritmo) |
| **KPIs de sucesso** | < 5% das submissões escalam para 3+ rounds (sinal de validators bem calibrados) |
| **Fontes** | BR-017, princípio "AI provoca, humano decide" |
| **Confiabilidade** | **Alta** |

### RN-026 — Hierarquia de aprovação configurável por área

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-026 |
| **BR(s) relacionado(s)** | BR-017 |
| **Dimensão/Subdimensão** | Aprovação / Admin |
| **Variável de decisão** | Para qual aprovador encaminhar a submissão |
| **Inputs necessários** | Área do creator · Cliente · Configuração de hierarquia (admin) |
| **Condição** | **SE** creator submete asset E hierarquia para sua área/cliente está configurada **ENTÃO** encaminhar para aprovador definido. **SE** hierarquia ausente OU aprovador inativo (saiu, indisponível) **ENTÃO** escalar para fallback (líder da área) e alertar admin. **SENÃO** rejeitar submissão com mensagem ao creator |
| **Ação de negócio recomendada** | Hierarquia mantida como dado de admin. MVP: configuração manual. Futuro: sync com RH |
| **KPIs de sucesso** | 100% das submissões com aprovador identificado · Zero submissões orfãs |
| **Fontes** | BR-017 |
| **Confiabilidade** | **Média** — depende de processo admin estar mantido |

### RN-027 — Drive integration read-only

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-027 |
| **BR(s) relacionado(s)** | BR-018 (Drive como fonte) |
| **Dimensão/Subdimensão** | Drive / Privacidade |
| **Variável de decisão** | Operações permitidas pelo sunOS contra o Drive |
| **Inputs necessários** | Tipo de operação solicitada · Escopo OAuth concedido |
| **Condição** | **SE** sunOS solicita OAuth ao Google Drive **ENTÃO** pedir apenas escopo `drive.readonly` (e `drive.metadata.readonly`). **SE** algum agente/serviço tenta operação de write/delete/move **ENTÃO** bloquear no client SDK e logar como violação. **SE** descoberta nova de funcionalidade exigir write **ENTÃO** exigir aprovação explícita da Diretoria (sem default). **SENÃO** operar normalmente em read-only |
| **Ação de negócio recomendada** | Garantia técnica (não política) — se sunOS NÃO TEM o escopo, não pode escrever mesmo querendo. Protege contra erro de implementação ou comprometimento |
| **KPIs de sucesso** | Zero operações de write registradas no audit log do Drive · OAuth scope auditável |
| **Fontes** | BR-018, decisão de ajuste vs. pedido literal do Guga |
| **Confiabilidade** | **Alta** |

### RN-028 — Intersecção ACL Drive × RBAC sunOS

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-028 |
| **BR(s) relacionado(s)** | BR-018, BR-007 (Proteção IP) |
| **Dimensão/Subdimensão** | Drive / Acesso |
| **Variável de decisão** | Quem vê qual conteúdo do Drive dentro do sunOS |
| **Inputs necessários** | Usuário autenticado · ACL do arquivo no Drive · Perfil RBAC do usuário no sunOS · Cliente associado |
| **Condição** | **SE** usuário tenta acessar conteúdo do Drive via sunOS **ENTÃO** verificar (a) ACL do Drive permite leitura E (b) RBAC sunOS permite ver conteúdo do cliente associado. **SE** ambos `true` **ENTÃO** liberar acesso. **SE** algum `false` **ENTÃO** negar (default deny) sem revelar existência do recurso. **SENÃO** seguir comportamento default deny |
| **Ação de negócio recomendada** | Operacional não vê conteúdo de cliente fora de seu escopo — mesmo se Drive ACL permitiria. RBAC sunOS é restrição adicional, nunca relaxa |
| **KPIs de sucesso** | Zero exposição de cliente B para usuário do cliente A · Audit log mostra intersecção aplicada |
| **Fontes** | BR-018, BR-007, RN-009 (RBAC) |
| **Confiabilidade** | **Alta** |

### RN-029 — Curadoria do Drive por agente é sugestiva

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-029 |
| **BR(s) relacionado(s)** | BR-018, BR-010 (Ownership) |
| **Dimensão/Subdimensão** | Drive / Cultura |
| **Variável de decisão** | Quem executa as ações de curadoria sugeridas pelo agente |
| **Inputs necessários** | Drive Cleanup Report gerado por agente · Decisão do líder/curador |
| **Condição** | **SE** agente identifica oportunidade de reorganização (duplicata, conteúdo órfão, candidato a Biblioteca) **ENTÃO** registrar no Drive Cleanup Report semanal — NUNCA executar sozinho. **SE** líder revisa e aprova sugestão **ENTÃO** humano executa a ação manualmente (no Drive ou via sunOS curadoria). **SE** sugestão fica >30 dias sem decisão **ENTÃO** repetir no próximo report (sem expirar) |
| **Ação de negócio recomendada** | Mantém princípio "AI provoca, humano cria/organiza" também em curadoria. Humano permanece dono da estrutura do Drive |
| **KPIs de sucesso** | Zero ações executadas pelo agente sem decisão humana · Taxa de adoção de sugestões pelo líder ≥ 50% (sinal de qualidade das sugestões) |
| **Fontes** | BR-018, BR-010, RN-027 |
| **Confiabilidade** | **Alta** |

### RN-030 — Re-sync periódico + webhook crítico

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-030 |
| **BR(s) relacionado(s)** | BR-018 |
| **Dimensão/Subdimensão** | Drive / Reliability |
| **Variável de decisão** | Quando atualizar o estado da Biblioteca a partir do Drive |
| **Inputs necessários** | Timestamp do último sync · Webhook do Google Drive (push notifications) · Lista de pastas monitoradas |
| **Condição** | **SE** janela de 24h desde último sync passou **ENTÃO** disparar re-sync incremental (apenas mudanças via `changes.list`). **SE** webhook do Drive notifica mudança em pasta crítica (Brand Guidelines, regras de negócio) **ENTÃO** disparar sync imediato dessa pasta. **SE** sync falha **ENTÃO** retry exponencial (3 tentativas) e alertar admin. **SENÃO** aguardar próximo ciclo |
| **Ação de negócio recomendada** | Lag esperado ≤ 24h para conteúdo geral, ≤ 5min para conteúdo crítico. Documentar SLA |
| **KPIs de sucesso** | Lag médio ≤ 24h · Lag P95 de pastas críticas ≤ 5min · Zero estados inconsistentes persistentes |
| **Fontes** | BR-018, NFR-005 (Reliability) |
| **Confiabilidade** | **Média** — depende de Google webhook ser confiável (geralmente é) |

---

### RN-031 — Acionamento opt-in obrigatório para Captura de Reuniões

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-031 |
| **BR(s) relacionado(s)** | BR-020 |
| **Dimensão/Subdimensão** | Captura / Privacidade |
| **Variável de decisão** | Quando o sunOS pode iniciar gravação |
| **Inputs necessários** | Tipo de reunião · Usuário autorizado · Confirmação explícita |
| **Condição** | **SE** usuário autorizado clica explicitamente em "Iniciar captura" para uma reunião específica **E** todos os participantes recebem notificação automática **ENTÃO** inicia gravação. **SE** qualquer condição faltar **ENTÃO** não inicia. **SENÃO** permanece off |
| **Ação de negócio recomendada** | Default OFF em qualquer integração de calendário. Sem auto-join. Sem captura passiva |
| **KPIs de sucesso** | Zero capturas sem opt-in registrado · 100% das capturas com notificação aos participantes |
| **Fontes** | BR-020, princípio Caixa-preta |
| **Confiabilidade** | **Alta** |

### RN-032 — HITL obrigatório no seed ontológico inicial

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-032 |
| **BR(s) relacionado(s)** | BR-022 |
| **Dimensão/Subdimensão** | Onboarding / HITL |
| **Variável de decisão** | Quando uma entidade da ontologia sugerida vira parte oficial da Wiki |
| **Inputs necessários** | Sugestão do agente · Validação humana |
| **Condição** | **SE** entidade foi sugerida pelo agente de Discovery **E** humano (Builder de Operações) validou explicitamente (aceitar/rejeitar/editar) **ENTÃO** entidade vira oficial. **SE** >7 dias sem validação **ENTÃO** entidade fica em status PENDING_REVIEW e bloqueia ativação do cliente. **SENÃO** não vira oficial |
| **Ação de negócio recomendada** | Cliente permanece PRE-ACTIVE até no mínimo as 6 entidades core terem decisão humana registrada |
| **KPIs de sucesso** | Zero clientes ativados sem validação completa do seed · Tempo médio de validação <72h após sync |
| **Fontes** | BR-022, BR-010 (ownership humano) |
| **Confiabilidade** | **Alta** |

### RN-033 — Allow-list para pesquisa web no onboarding

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-033 |
| **BR(s) relacionado(s)** | BR-022 |
| **Dimensão/Subdimensão** | Onboarding / Governança de fontes |
| **Variável de decisão** | Quais fontes externas o agente de Discovery pode consultar |
| **Inputs necessários** | URL/domínio · Allow-list atual |
| **Condição** | **SE** domínio está na allow-list configurada pelo admin **ENTÃO** consulta permitida. **SE** não está **ENTÃO** bloqueia e loga tentativa. **SE** conteúdo exige login ou paywall **ENTÃO** bloqueia (sem scraping protegido). **SENÃO** opera normalmente |
| **Ação de negócio recomendada** | Allow-list inicial sugerida: linkedin.com (perfil público apenas), site corporativo do cliente, news públicas (G1, Folha, Estadão, Valor, Meio&Mensagem). Expansão exige aprovação do Comitê de Produto |
| **KPIs de sucesso** | Zero acessos a fontes não autorizadas · 100% das consultas com proveniência rastreável |
| **Fontes** | BR-022, princípio de governança de fontes |
| **Confiabilidade** | **Média** (depende de configuração e disciplina) |

### RN-034 — Bloqueio de chat livre em Skills processuais

| Campo | Valor |
|-------|-------|
| **Regra ID** | RN-034 |
| **BR(s) relacionado(s)** | BR-019 |
| **Dimensão/Subdimensão** | UX / Estruturação |
| **Variável de decisão** | Quando o Chat aceita instrução livre vs. exige inputs estruturados |
| **Inputs necessários** | Skill ativa · Contexto da sessão |
| **Condição** | **SE** Skill processual está ativa **ENTÃO** Chat exige inputs estruturados conforme schema da Skill (form, wizard). **SE** Skill é FA-02 (Moon Shot) **ENTÃO** Chat aceita instrução livre. **SE** Skill é Discovery (chat persistente do consultor) **ENTÃO** Chat aceita instrução livre. **SE** nenhuma Skill ativa **ENTÃO** UI sugere selecionar Skill ou Cliente. Operação em chat genérico é logada para análise de gaps de cobertura |
| **Ação de negócio recomendada** | Chat genérico não é proibido tecnicamente. É desencorajado por UX. Análise periódica de uso de chat genérico revela Skills faltantes |
| **KPIs de sucesso** | >80% das sessões de creators operacionais com Skill ativa · Tendência decrescente de uso de chat genérico ao longo do Piloto |
| **Fontes** | BR-019, ADR-003 |
| **Confiabilidade** | **Alta** |

---

## Matriz de Cobertura — RN ↔ BR

| BR | RNs relacionadas |
|----|------------------|
| BR-001 (Provocação criativa) | RN-001, RN-002, RN-003 |
| BR-002 (Aceleração operacional) | RN-004 |
| BR-003 (ROI) | RN-005 |
| BR-004 (Biblioteca) | RN-006 |
| BR-005 (Continuidade pós-turnover) | RN-007, RN-008 |
| BR-006 (Acesso democrático) | RN-011, RN-021 |
| BR-007 (Proteção de IP) | RN-009, RN-011, RN-012 |
| BR-008 (Privacidade clientes) | RN-010, RN-013 |
| BR-009 (Auditabilidade) | RN-012, RN-013 |
| BR-010 (Ownership) | RN-014, RN-015 |
| BR-011 (Cultura) | RN-016 |
| BR-012 (UX por carreira) | RN-015, RN-017 |
| BR-013 (Mensuração custo) | RN-018 |
| BR-014 (Detecção homogeneização) | RN-019, RN-020 |
| BR-015 (Integração Skills) | RN-021 |
| BR-016 (Coexistência ferramentas) | RN-022 |
| BR-017 (Aprovação hierárquica) | RN-023, RN-024, RN-025, RN-026 |
| BR-018 (Drive interno da Suno) | RN-027, RN-028, RN-029, RN-030 |
| BR-019 (UX estruturada) | RN-034 |
| BR-020 (Captura seletiva) | RN-031 |
| BR-022 (Onboarding Oráculo) | RN-032, RN-033 |

**Cobertura completa**: cada um dos 19+ BRs (BR-001 a BR-022, exceto placeholders) tem ≥1 RN. BRs prioritários (Alta) têm 1-3 RNs cada.

---

## Matriz de Confiabilidade

| Confiabilidade | Quantidade | RNs |
|---------------|:----------:|-----|
| **Alta** | 12 | RN-001, RN-002, RN-003, RN-006, RN-007, RN-009, RN-010, RN-011, RN-014, RN-018, RN-019, RN-020, RN-021 |
| **Média** | 9 | RN-004, RN-005, RN-008, RN-012, RN-013, RN-015, RN-016, RN-022 |
| **Baixa** | 1 | RN-017 |

RNs **Baixa confiabilidade** devem ser priorizadas para validação antes de virarem código ou guideline operacional.

---

## Pontos em aberto / a validar

| ID | Item | Responsável | Prazo sugerido |
|----|------|-------------|----------------|
| PA-06 | Definir baseline pré-sunOS das três métricas de homogeneização (RN-019) | Bruno Prosperi + Heitor | Antes Piloto |
| PA-07 | Aprovar política específica de retenção de dados pessoais (RN-013) | Diretoria + Heitor | Antes Piloto |
| PA-08 | Calibrar thresholds de RN-008 (definição de "crítico", "long-tenure") com líderes | Heitor + sócios | Maio 2026 |
| PA-09 | Validar definições de "júnior/pleno/sênior" por área para RN-017 | Bruno Prosperi (criação), Takai (mídia) | Junho 2026 |
| PA-10 | Definir formato e infraestrutura de validação automática de copy contra Glossário (RN-016) | Heitor + time dev | Antes do Protótipo |
| PA-11 | Aprovar lista atualizada de ferramentas de mercado adotadas (RN-022) | Diretoria | Junho 2026 |

---

## Como esta Parte 4 impacta PRD, SRD e FRD

- **PRD**: cada RN gera ≥1 caso de teste de aceitação por feature; lógicas de UX condicional (RN-014, RN-017) viram comportamentos de produto especificados
- **SRD**: RNs de governança/segurança (RN-009 a RN-013) viram NFRs ISO 25010 — Security, Maintainability, Reliability; RNs de mensuração (RN-018, RN-019) viram requisitos de observabilidade
- **FRD**: RNs já têm operacionalização parcial no FRD Moon Shot — completar o cross-reference entre RN-XXX e FR-XXX é tarefa do PM/Tech Lead durante implementação
- **Design System / UX Specs**: RN-014, RN-016, RN-017 são guidelines diretos para padrões de interface
- **Compliance docs (LGPD)**: RN-013 alimenta política de retenção e descarte; RN-010 alimenta política de isolamento entre clientes

**Regra de validação cruzada**: nenhuma RN deve viver isolada. Cada RN precisa ter (a) ≥1 BR de origem, (b) ≥1 mecanismo técnico no PRD/FRD/SRD, (c) ≥1 KPI mensurável.

---

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-04-28 | Versão inicial. **22 RNs** organizadas em 6 categorias (espelhando a Parte 3). 12 Alta confiabilidade, 9 Média, 1 Baixa. Cobertura completa de todos os 16 BRs. Toda RN com lógica SE/ENTÃO/SENÃO formal, KPIs verificáveis e fonte rastreável. RNs críticas: RN-009 (RBAC), RN-010 (isolamento clientes), RN-011 (caixa-preta da Biblioteca), RN-019 e RN-020 (safety contra homogeneização) |
| 1.1 | 2026-04-28 | **+8 RNs** (RN-023 a RN-030) na nova **Categoria G — Aprovação & Drive**. Cobre BR-017 (4 RNs sobre validators paralelos, aprovador humano, anti-loop, hierarquia configurável) e BR-018 (4 RNs sobre read-only, intersecção ACL/RBAC, curadoria sugestiva, sync periódico+webhook). Todas Alta confiabilidade exceto RN-026 e RN-030 (Média) |
| 1.2 | 2026-05-14 | **+4 RNs** (RN-031 a RN-034). RN-031: opt-in obrigatório para captura de reuniões (BR-020). RN-032: HITL obrigatório no seed ontológico (BR-022). RN-033: allow-list para pesquisa web no onboarding (BR-022). RN-034: bloqueio de chat livre em Skills processuais (BR-019, ADR-003). Matriz RN x BR atualizada com novos BRs. |

---

<!-- REVIEW: Cada RN tem lógica clara o suficiente para virar código? Algum BR ficou sem RN correspondente? Alguma RN está conflitando com outra? Algum threshold (N=5, 30%, 90 dias) precisa de validação prévia antes do Piloto? -->

**Próximos passos**:
1. **Revisar Parte 4** com Heitor Miranda
2. **Validar RNs de Alta confiabilidade** com sponsor antes do Piloto (especialmente RN-009 a RN-014)
3. **Calibrar thresholds quantitativos** (RN-008, RN-012, RN-015, RN-019) com baseline real antes da implementação
4. **BRD completo (4 partes)** está pronto para apresentação consolidada à Diretoria
5. **Iniciar pipeline downstream**: PRD (Feature Map FA-XX, Personas PX-XX, Requisitos Funcionais FR-XXX) e SRD (Arquitetura, NFRs, ADRs)
6. Revisar **FRD Moon Shot** garantindo que cada FR-XXX é rastreável a um BR-XXX e a uma RN-XXX
