---
documento: BRD Parte 3 — Requisitos de Negócio (BR-XXX)
projeto: sunOS
cliente: Suno United Creators (uso 100% interno)
bu: Tecnologia e Dados para Marketing
versao: 1.5
data_criacao: 2026-04-28
ultima_atualizacao: 2026-06-23
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
fonte_principal: Parte 1 (Contexto) + Parte 2 (Glossário) + FRD Moon Shot + Research foundation engineering serendipity
---

# BRD Parte 3 — Requisitos de Negócio

## Objetivo

Esta parte traduz os **5 Objetivos de Negócio** da Parte 1 e as **7 Capacidades de Negócio** da §4.2 em **Requisitos de Negócio formais (BR-XXX)** — cada um com critérios de aceite verificáveis e rastreabilidade clara. BR é um requisito **em linguagem de negócio**: descreve o que o negócio precisa, não como será implementado.

## Como Usar

- BRs estão organizados em **6 categorias temáticas** que correspondem a frentes de valor do projeto
- Cada BR tem ID sequencial (BR-001 a BR-023), prioridade, stakeholder demandante, critérios de aceite e dependências
- **BR ≠ FR (Functional Requirement)**: BR descreve a necessidade; FR descreve a solução. FRs vivem em PRDs/FRDs separados
- **Quando uma feature já tem FRD próprio (ex: Moon Shot), o BR aponta para ele** — nunca duplica
- Critérios de aceite são **verificáveis**, não desejos vagos

## Sumário Executivo (23 BRs)

| ID | Título resumido | Prioridade | Categoria | Fase |
|----|----------------|:----------:|----------|----|
| **BR-001** | Provocação criativa contra homogeneização | Alta | A — Valor primário | Momento 2 |
| **BR-002** | Aceleração operacional via automação inteligente | Alta | A — Valor primário | Piloto |
| **BR-003** | Demonstração contínua de ROI ao sponsor e Diretoria | Alta | A — Valor primário | Piloto |
| **BR-004** | Repositório institucional unificado (Biblioteca) | Alta | B — Conhecimento | Piloto |
| **BR-005** | Continuidade do repertório frente a turnover | Média | B — Conhecimento | Piloto |
| **BR-006** | Acesso democrático ao conhecimento coletivo | Alta | B — Conhecimento | Piloto |
| **BR-007** | Proteção do IP proprietário (caixa-preta) | Alta | C — Governança | Piloto |
| **BR-008** | Privacidade de dados de clientes da Suno | Alta | C — Governança | Piloto |
| **BR-009** | Auditabilidade de operações de IA | Média | C — Governança | Piloto |
| **BR-010** | Preservação do ownership criativo | Alta | D — Adoção e Cultura | Piloto |
| **BR-011** | Respeito à cultura criativa brasileira e da Suno | Média | D — Adoção e Cultura | Piloto |
| **BR-012** | Diferenciação de UX por estágio de carreira | Média | D — Adoção e Cultura | Piloto |
| **BR-013** | Mensuração de custo evitado e impacto operacional | Alta | E — Mensuração | Piloto |
| **BR-014** | Detecção de homogeneização criativa em nível coletivo | Alta | E — Mensuração | Momento 2 |
| **BR-015** | Integração com Skills existentes do sunOS | Alta | F — Integração | Piloto |
| **BR-016** | Não substituir ferramentas de mercado adotadas | Média | F — Integração | Piloto |
| **BR-017** | Fluxo de aprovação hierárquica com pré-validação por agentes | Alta | G — Workflow & Governança | Momento 2 |
| **BR-018** | Drive interno da Suno como fonte curada da Biblioteca e da Wiki Ontológica (v2) | Alta | G — Workflow & Governança | Piloto |
| **BR-019** | Princípio de UX operacional estruturada (software, não chat livre) | Alta | H — Princípios de Experiência | Piloto |
| **BR-020** | Captura seletiva de inputs operacionais via gravação assistida | Média | G — Workflow & Governança | Momento 2 |
| **BR-021** | Wiki Ontológica — repositório de entidades estruturadas por cliente | Alta | G — Workflow & Governança | Piloto |
| **BR-022** | Onboarding automatizado de cliente com Oráculo do Cliente | Alta | G — Workflow & Governança | Piloto |
| **BR-023** | Reuniões como fonte de atualização ontológica | Alta | G — Workflow & Governança | Piloto |

---

## Categoria A — Valor Primário de Negócio

Os três requisitos centrais que justificam a existência do projeto: provocar criatividade, acelerar operação, demonstrar retorno.

---

### BR-001 — Provocação criativa contra homogeneização

**Descrição**: O sunOS deve oferecer capacidade que **provoque** ideias inesperadas em creators (especialmente seniores), combinando conceitos de domínios distantes para combater a tendência observada de **homogeneização criativa coletiva** quando profissionais usam ferramentas de IA generativas. A capacidade deve **provocar, não gerar** — outputs são estímulo para o creator, não peças finais.

**Prioridade**: Alta *(dentro do Momento 2 — ver coluna Fase no sumário)*

**Stakeholders demandantes**: Bruno Prosperi (Sócio Criação), Sergio Katz (CSO/Planejamento), Guga (Sponsor)

**Critérios de Aceite**:
- [ ] Em testes blind, **≥60% das provocações** classificadas como "úteis" por 3+ creators seniores (POC)
- [ ] Score de bisociação médio das provocações aprovadas dentro da **zona Sweet Spot** (cosseno 0.5–0.85) — ver FRD Moon Shot §FR-011
- [ ] Sistema rejeita provocações nas zonas "óbvio demais" e "incoerente demais" automaticamente (≥90% de filtragem efetiva)
- [ ] Em uso real (Piloto), ≥70% de aprovação por creators
- [ ] Capacidade acessível em **≤3 cliques** a partir do contexto de qualquer cliente

**Dependências**: BR-004 (Biblioteca), BR-007 (Proteção de IP), BR-014 (Detecção de homogeneização)

**Fonte**:
- FRD Moon Shot §FA-02
- Research foundation: Doshi & Hauser (Science Advances 2024), Padmakumar & He (ICLR 2024) — leveling-up illusion
- OBJ-02, OBJ-05 (Parte 1)
- Transcrição reunião Guga + Heitor + Bruno Prosperi

---

### BR-002 — Aceleração operacional via automação inteligente

**Descrição**: O sunOS deve **automatizar e acelerar tarefas operacionais recorrentes** (relatórios, análises, planos, briefings, resumos de reunião) preservando qualidade e contexto específico de cada cliente, **liberando creators de trabalho mecânico** para se concentrarem em julgamento estratégico, criatividade e relacionamento.

**Prioridade**: Alta

**Stakeholders demandantes**: Heitor Miranda (Tutela), Ronaldo Severino (CFO), patrocinadores sócio (todos)

**Critérios de Aceite**:
- [ ] Skills processuais reduzem tempo médio de execução de tarefas-alvo em **≥30%** (mensurado em ≥5 tarefas-piloto)
- [ ] Outputs de Skills com contexto da Biblioteca avaliados como "melhores" (vs. sem Biblioteca) em **≥65% dos casos** em A/B test
- [ ] Volume de tarefas automatizadas crescendo mensalmente nos primeiros 6 meses pós-Piloto
- [ ] Skills processuais não exigem que o operador busque contexto manualmente (auditável via FRD §FR-015)
- [ ] Cobertura de ≥10 tarefas-alvo distintas até final do Piloto

**Dependências**: BR-004 (Biblioteca), BR-015 (integração com Skills)

**Fonte**:
- OBJ-01 (Reduzir custo operacional via automação)
- OBJ-02 (Liberar talento criativo)
- FRD Moon Shot §FA-03
- Transcrição Heitor + William

---

### BR-003 — Demonstração contínua de ROI ao sponsor e à Diretoria

**Descrição**: O sunOS deve gerar **evidências mensuráveis e defensáveis de valor** (custo evitado, tempo economizado, impacto em campanhas, novos negócios influenciados) suficientes para sustentar continuidade do investimento, justificar expansões de escopo e responder à pressão de accountability típica de Diretoria.

**Prioridade**: Alta

**Stakeholders demandantes**: Guga (sponsor), Ronaldo Severino (CFO)

**Critérios de Aceite**:
- [ ] **Business case completo** apresentado e aprovado pela Diretoria até **Q3 2026** (cobre ≥80% das 136 atividades catalogadas)
- [ ] **Dashboard executivo** disponível mensalmente com tendência de tempo economizado, custo evitado e adoção
- [ ] **≥3 cases internos documentados por trimestre** com impacto atribuível ao sunOS (ex: campanha que usou Moon Shot, tarefa cuja execução foi acelerada)
- [ ] Reporting do dashboard apresentado nas reuniões semanais de terça com Guga
- [ ] Indicadores triangulam mensuração técnica (KPIs do produto) com mensuração financeira (KPIs do CFO)

**Dependências**: BR-013 (mensuração de custo evitado), BR-014 (mensuração de qualidade coletiva)

**Fonte**:
- OBJ-04 (Habilitar accountability total ao cliente)
- Q8 (business case em construção)
- Parte 1 §2.3 (KPIs propostos)
- Transcrição Heitor + William

---

## Categoria B — Conhecimento e Inteligência Coletiva

Como o sunOS transforma conhecimento individual disperso em patrimônio compartilhado e acionável.

---

### BR-004 — Repositório institucional unificado (Biblioteca)

**Descrição**: O sunOS deve manter uma **base de conhecimento centralizada (Biblioteca)** que consolida referências culturais, cases de clientes, briefings, guidelines de marca, contexto de mercado, metodologias proprietárias e histórico de campanhas — disponível como infraestrutura única para skills processuais e Moon Shot, sem duplicação. A Biblioteca é **invisível para perfis operacionais**: líderes curam, plataforma consome.

**Prioridade**: Alta

**Stakeholders demandantes**: Bruno Prosperi (Criação), Sergio Katz (Planejamento), Heitor (tutela técnica)

**Critérios de Aceite**:
- [ ] Biblioteca com **≥500 itens curados** até final do Piloto (ver FRD §FA-01)
- [ ] Líderes conseguem curar conteúdo em **<5 minutos por item** com metadados obrigatórios completos
- [ ] **Zero conhecimento crítico de cliente** vivendo apenas em cabeças individuais (auditável: cada conta ativa com contexto-mínimo documentado)
- [ ] Biblioteca alimenta **simultaneamente** skills processuais (modo convergente) e Moon Shot (modo divergente)
- [ ] Curadoria contínua sustentada (≥X itens novos/semana após Piloto — definir baseline durante Protótipo)

**Dependências**: BR-007 (governança), BR-005 (captura de turnover)

**Fonte**:
- FRD Moon Shot §FA-01
- Glossário §1 (Inteligência Coletiva)
- OBJ-02 (liberar talento), OBJ-03 (centralizar governança)
- Transcrição reunião sobre sunOS

---

### BR-005 — Continuidade do repertório frente a turnover

**Descrição**: Quando um creator sai da Suno, **seu repertório de referências, cases vividos, know-how operacional e relacionamento com clientes deve permanecer disponível para o coletivo** via Biblioteca, mitigando a perda institucional típica de agências (turnover histórico do setor: ~30%/ano; Suno em 2024: 18%).

**Prioridade**: Média

**Stakeholders demandantes**: Bruno Prosperi (Criação), Guga, RH (futuro), Diretoria

**Critérios de Aceite**:
- [ ] **Processo formalizado de captura de repertório em offboardings** (entrevista, indexação no sunOS) — implantado até final do Piloto
- [ ] **≥80% das contas críticas** com contexto-mínimo documentado na Biblioteca (regras de negócio, tom de voz, histórico, sensibilidades)
- [ ] **Detecção automática de "conhecimento crítico em risco"** — alerta quando contexto importante é acessado/contribuído apenas por uma única pessoa nos últimos 90 dias
- [ ] Após saída de creator-chave (teste real), tempo de re-onboarding do substituto reduz em ≥30% comparado a baseline pré-sunOS

**Dependências**: BR-004 (Biblioteca), BR-006 (acesso democrático)

**Fonte**:
- Glossário §1 (Inteligência Coletiva)
- Transcrição Heitor (perda de contexto com saídas de Stella e Fernando em jan/2025)
- Research foundation (Brazilian creative industry context)

---

### BR-006 — Acesso democrático ao conhecimento coletivo

**Descrição**: **Todo creator do grupo United Creators** deve ter acesso transparente ao conhecimento institucional relevante para seu trabalho, **sem precisar buscar manualmente** em drives compartilhados, e-mails, ou pessoas. O acesso é mediado pelos skills do sunOS (não por interface direta à Biblioteca, conforme BR-007).

**Prioridade**: Alta

**Stakeholders demandantes**: Times consumidores (Criação, Planejamento, Mídia, BI, Growth, Operações, Adm/Financeiro, Eficiência)

**Critérios de Aceite**:
- [ ] **Onboarding de novos creators reduz curva de aprendizado em ≥40%** (mensurado em entrevistas qualitativas com novos entrantes pós-sunOS)
- [ ] **Skills do sunOS injetam contexto de cliente automaticamente**, sem ação do operador (auditável via FRD §FR-015)
- [ ] **Tempo médio para encontrar referência crítica** de cliente <2 minutos (vs. baseline pré-sunOS via Drive/conversas)
- [ ] Contexto injetado é o **mais relevante para a tarefa** (mensurado via feedback do operador em ≥10% das execuções)

**Dependências**: BR-004 (Biblioteca), BR-007 (governança de acesso), BR-015 (integração com Skills)

**Fonte**:
- FRD §FA-03
- Glossário §1 (Inteligência Coletiva)
- PRODUCT_HANDOFF.md (contexto fragmentado)

---

## Categoria C — Governança, Segurança e IP

Como o sunOS protege o que torna a Suno competitiva.

---

### BR-007 — Proteção do IP proprietário da Suno

**Descrição**: O sunOS deve preservar o **IP estratégico da Suno** (skills, system prompts, lógica do Moon Shot, knowledge curado, lógica de avaliação) através de controles que previnem exposição interna ou externa não autorizada. Refletindo o princípio do sponsor: *"Vendemos ideias na essência."* Aplicação prática da metáfora do **Caixa-preta** (Glossário §1).

**Prioridade**: Alta

**Stakeholders demandantes**: Guga (sponsor), Diretoria

**Critérios de Aceite**:
- [ ] **Skills, system prompts e lógica interna não acessíveis a perfis operacionais** (auditável via inspeção de UX e API)
- [ ] **Auditoria de acessos administrativos** (admin/líder) registrada e revisível
- [ ] **Frontend não expõe estrutura interna** de retrieval, scoring, agentes ou knowledge graph
- [ ] **Modelo de RBAC implementado** com 3 níveis: Admin (CRUD total), Líder (CRUD por área), Operacional (consumo via skills)
- [ ] Documentação de processos de NDA e proteção contratual para colaboradores com acesso administrativo

**Dependências**: nenhuma (fundacional)

**Fonte**:
- Glossário §1 (Caixa-preta)
- Transcrição reunião sobre sunOS (Guga: *"isso aqui ninguém pode ver. Esse é o segredo do documento... isso tem que ser as sete chaves"*)
- Parte 1 §5.1 REST-06
- ADR-CAND-002 (FRD)

---

### BR-008 — Privacidade de dados de clientes da Suno

**Descrição**: Dados de clientes da Suno (Vivo, Sicredi, Americanas, MRV, BMG, Cogna, etc.) devem ser tratados respeitando expectativas implícitas da relação cliente-agência e a LGPD, com **isolamento adequado entre clientes** para evitar vazamento cruzado de informação. Premissa: relação cliente-agência permite uso de dados em IA com consentimento implícito (PRE-03 da Parte 1), mas não há cláusulas contratuais explícitas vetando uso de IA externa — situação a ser validada caso a caso.

**Prioridade**: Alta

**Stakeholders demandantes**: Diretoria, Atendimento (representando clientes), Heitor (responsabilidade compartilhada por privacidade — ver Parte 1 §3.4 sobre ausência de DPO)

**Critérios de Aceite**:
- [ ] **Skills processuais nunca incluem contexto de outro cliente** que não o ativo (auditável via FRD §FR-016)
- [ ] **Documentação de retenção e descarte de dados** conforme LGPD publicada e aceita pela Diretoria
- [ ] Caso cliente individual exija veto a uso de IA externa, **mecanismo de isolamento existe** para esse cliente (configurável caso a caso)
- [ ] Logs de auditoria preservam quem acessou que dado de qual cliente
- [ ] Política aprovada pela Diretoria e comunicada formalmente a clientes-chave

**Dependências**: BR-007

**Fonte**:
- Parte 1 §5.1 REST-03 (sem DPO formal), §5.2 PRE-03 e PRE-06
- Q11 (proteção de IP por segurança e estratégia)
- LGPD (Lei 13.709/2018)

---

### BR-009 — Auditabilidade de operações de IA

**Descrição**: Cada interação significativa com IA no sunOS (chat, geração de texto/imagem, retrieval, edição, execução de workflow) deve ser **rastreável** para fins de governança, qualidade, debugging, investigação de incidentes e geração de evidências para o business case (BR-013).

**Prioridade**: Média

**Stakeholders demandantes**: Heitor (tutela técnica), Diretoria

**Critérios de Aceite**:
- [ ] **Tracing de 100% das chamadas a LLMs** em produção (via MLflow — ver Glossário §5)
- [ ] Capacidade de **reconstruir contexto, prompt e output** de qualquer interação significativa por ≥12 meses
- [ ] **Logs estruturados e queryáveis** com latência, modelo usado, custo, scorers de qualidade
- [ ] Capacidade de gerar relatório por cliente, por skill ou por usuário em <30 segundos
- [ ] Compliance documentado: para cada categoria de log, prazo de retenção, fim de uso e responsável

**Dependências**: BR-007, BR-008

**Fonte**:
- Glossário §5 (MLflow, Eval)
- Parte 1 §6 (riscos)
- Best practice setor (LangSmith, Helicone, Datadog AI Observability)

---

## Categoria D — Adoção, Cultura e UX

Como o sunOS é absorvido culturalmente sem destruir o valor humano que a Suno construiu.

---

### BR-010 — Preservação do ownership criativo

**Descrição**: O sunOS deve **provocar e amplificar** — nunca substituir — o creator. Outputs de IA chegam como **estímulo/matéria-prima**, nunca como entregáveis acabados. O criativo permanece autor. Princípio reforçado por research recente: exposição a artefatos de IA *acabados* durante ideação reduz originalidade (Wadinambiarachchi et al., CHI 2024).

**Prioridade**: Alta

**Stakeholders demandantes**: Bruno Prosperi (Criação), Sergio Katz (Planejamento)

**Critérios de Aceite**:
- [ ] Em pesquisa qualitativa pós-Piloto (≥10 creators seniores), **≥80% confirmam sentir ownership** do trabalho final (vs. sentir-se "operador de IA")
- [ ] Outputs de IA marcados visualmente como **"estímulo" / "provocação"**, não como peça final
- [ ] Creators podem **isolar/lockar partes humanas** vs. partes assistidas (via UX, conforme FRD)
- [ ] Sistema **não auto-insere** texto/imagem de IA em documentos do creator sem ação explícita
- [ ] **Forced reflection moments** após N stars/aprovações em sessão (mitigam over-reliance, conforme research foundation)

**Dependências**: BR-001 (provocação criativa)

**Fonte**:
- Glossário §1 (Inteligência Natural)
- Research foundation: Wadinambiarachchi et al. (CHI 2024, N=60), Yuan et al. (Wordcraft, IUI 2022), Maier et al. (arXiv:2510.23324)
- Transcrição (Guga: *"AI sem o componente humano criativo é insuficiente"*)

---

### BR-011 — Respeito à cultura criativa brasileira e da Suno

**Descrição**: O sunOS deve **operar de forma culturalmente consistente** com a tradição criativa brasileira (antropofagia, jeitinho, dupla de criação, mestiçagem) e com o vocabulário institucional da Suno (Smart Growth, Bioma, Creator). Não deve parecer tradução de ferramenta de Silicon Valley. Razão estratégica: Brasil foi nomeado *"Creative Country of the Year"* pelo Cannes Lions 2025 — a cultura criativa local é diferencial competitivo, não obstáculo a adaptar.

**Prioridade**: Média

**Stakeholders demandantes**: Guga, Bruno Prosperi (Criação)

**Critérios de Aceite**:
- [ ] **Vocabulário UI usa termos do Glossário** (Devorar, Provocar, Faísca, Brasa) e **evita anti-patterns** (gerar, otimizar, eficiência, accelerator) — auditável via revisão de copy
- [ ] **Modo "dupla de criação" disponível** com time-boxing de IA (90s in / 5min human / repeat) para preservar fluxo humano (FRD)
- [ ] **Validação cultural com sponsor (Guga) e patrocinadores sócio** antes de cada release maior
- [ ] Personas dos agentes refletem identidade brasileira (ex: A Antropófaga, O Carnavalesco, A Anciã — ver research foundation)
- [ ] Manifesto de produto interno publicado e referenciado em onboarding de novos creators

**Dependências**: BR-010

**Fonte**:
- Glossário §1 (Vocabulário Suno) e §9 (Termos a evitar)
- Research foundation (Brazilian cultural layer: antropofagia, jeitinho, mestiçagem, dupla)
- Deck Crescera SmartGrowth (slide 3 — manifesto Sol/planetas)

---

### BR-012 — Diferenciação de UX por estágio de carreira

**Descrição**: Creators **juniores e seniores têm relações diferentes com IA** — pesquisa setorial mostra que juniores adotam entusiasticamente em ideação (com risco de over-reliance), enquanto seniores são identidade-protetivos e engajam selectivamente para refinamento. O sunOS deve oferecer **modos de uso adaptados a essas diferenças** para maximizar adoção e proteger contra erosão cognitiva.

**Prioridade**: Média

**Stakeholders demandantes**: Bruno Prosperi (Criação)

**Critérios de Aceite**:
- [ ] **≥2 onboarding tracks** disponíveis: *"Estou começando uma ideia"* (junior-leaning, divergente) e *"Tenho uma ideia, me prova que tá errada"* (senior-leaning, devil's advocate)
- [ ] **NPS de creators seniores ≥ NPS de creators juniores** (sinal de não-resistência identitária)
- [ ] **Forced reflection moments** após N stars/aprovações na sessão (mitigam over-reliance, especialmente em juniores)
- [ ] **Visible reasoning hidden by default** — agente não revela "raciocínio" do agente sem ação explícita (preserva o aha do creator)
- [ ] Métricas de uso segmentadas por estágio de carreira (junior/pleno/sênior) acompanhadas trimestralmente

**Dependências**: BR-010

**Fonte**:
- Research foundation: AI & Society 2025 scoping review (57 papers), Microsoft Research Lee et al. 2025, MIT Media Lab Kosmyna et al. 2025, Daker et al. (Creativity Anxiety Scale)

---

## Categoria E — Mensuração

Como saber que o sunOS está funcionando — e como saber que está prejudicando antes de ser tarde demais.

---

### BR-013 — Mensuração de custo evitado e impacto operacional

**Descrição**: O sunOS deve gerar **dados que permitam calcular custo evitado** (horas economizadas × custo médio por hora) e **impacto em métricas de negócio** (qualidade, velocidade, originalidade, win rate de pitches, retenção de clientes) de forma defensável diante de Diretoria e CFO.

**Prioridade**: Alta

**Stakeholders demandantes**: Ronaldo Severino (CFO), Heitor (tutela)

**Critérios de Aceite**:
- [ ] **Mapeamento das 136 atividades catalogadas** (`roi_completo_suno.xlsx`) com horas-homem antes do sunOS e horas-homem com sunOS, atualizado trimestralmente
- [ ] **Dashboard mensal** com tendência de tempo economizado por skill, por área, por cliente
- [ ] **≥3 KPIs de negócio** (não só de produto) acompanhados continuamente: ex. *win rate em new business*, *Cannes/Effie shortlist rate*, *retenção de creators seniores*
- [ ] Capacidade de **atribuir** uso do sunOS a campanhas/peças específicas (via embedding-similarity entre starred provocations e final pitched campaign — ver research foundation)
- [ ] Reporting trimestral à Diretoria com **comparação ano contra ano** após Piloto

**Dependências**: BR-002 (aceleração), BR-003 (ROI), BR-009 (auditabilidade)

**Fonte**:
- Q8 (mapeamento de processos em curso)
- Parte 1 §2.3 (KPIs propostos)
- Research foundation (Cannes Lions Creative Effectiveness weighting, IPA Effectiveness Databank)

---

### BR-014 — Detecção de homogeneização criativa em nível coletivo

**Descrição**: O sunOS deve **monitorar continuamente a diversidade dos outputs criativos no nível do conjunto de creators** (não apenas no nível individual), **alertando antecipadamente** quando o uso de IA está reduzindo a originalidade coletiva. Isso é necessário porque pesquisa setorial documenta que **satisfação individual com IA pode aumentar enquanto diversidade coletiva colapsa** — o "leveling-up illusion" de Doshi & Hauser. Este é o **modo de falha existencial** que o BR-001 visa endereçar.

**Prioridade**: Alta

**Stakeholders demandantes**: Bruno Prosperi (Criação), Heitor (tutela), Diretoria

**Critérios de Aceite**:
- [ ] **Mensuração mensal** de *Mean Pairwise Cosine Distance*, *Self-BLEU* e *Compression Ratio* sobre amostra representativa de outputs criativos do mês (ver research foundation)
- [ ] **Alerta automático** quando alguma das 3 métricas diverge >2σ da baseline pré-sunOS, com escalação para Sponsor e patrocinadores sócio
- [ ] **Relatório trimestral à Diretoria** sobre saúde da diversidade criativa coletiva — independente de relatório de adoção/satisfação individual
- [ ] **Aggregate user satisfaction NUNCA reportado isoladamente** sem simultânea exibição de set-level diversity (regra)
- [ ] Capacidade de suspender funcionalidades específicas se homogeneização persistir após mitigações (controle de safety)

**Dependências**: BR-001 (provocação), BR-009 (auditabilidade)

**Fonte**:
- Research foundation: Doshi & Hauser (Science Advances 2024 — DOI 10.1126/sciadv.adn5290), Padmakumar & He (ICLR 2024), Anderson, Shah & Kreminski (C&C 2024), Shaib et al. (arXiv:2403.00553)
- BR-001 (objetivo de combater homogeneização)

---

## Categoria F — Integração e Coexistência

Como o sunOS se acomoda ao ecossistema técnico e organizacional existente.

---

### BR-015 — Integração com Skills existentes do sunOS

**Descrição**: A Biblioteca e o Moon Shot devem se **integrar com o ecossistema atual de Skills do sunOS** sem fragmentar a experiência ou exigir migração de funcionalidades existentes. Skills atuais (Copy Social, Plano de Mídia, Roteiro de Vídeo, etc.) consomem Biblioteca via context injection transparente; o Moon Shot é acessível como atalho de qualquer tela de skill/cliente.

**Prioridade**: Alta

**Stakeholders demandantes**: Heitor (tutela), Time de desenvolvimento

**Critérios de Aceite**:
- [ ] **Skills existentes** (Copy Social, Plano de Mídia, etc.) consomem Biblioteca via context injection **sem refatoração** dos prompts originais
- [ ] **Botão Moon Shot acessível em qualquer tela** de skill/cliente do sunOS
- [ ] **Zero downtime** das Skills existentes durante deploy da Biblioteca e do Moon Shot
- [ ] **Performance** das Skills existentes não regrida em mais de 10% (latência) após integração
- [ ] **Compatibilidade** mantida com Skills criadas por usuários no admin (sem quebra)

**Dependências**: BR-004 (Biblioteca), BR-001 (Moon Shot)

**Fonte**:
- FRD §FA-03
- Parte 1 §4.2 (capacidades de negócio)

---

### BR-016 — Não substituir ferramentas de mercado adotadas

**Descrição**: O sunOS deve **coexistir com ferramentas de mercado já em uso pelo grupo** (Adobe Firefly, Sprinklr, Canva, Adobe Creative Cloud, Salesforce, etc.), atuando como **camada de inteligência e governança acima delas** — não competindo. Posicionamento estratégico explícito do sponsor: *"Não queremos inventar a roda... queremos apenas ter uma base de conhecimento compartilhada que facilite o uso da inteligência coletiva e centralização do uso de IA."*

**Prioridade**: Média

**Stakeholders demandantes**: Guga (sponsor — Q11), todos os times consumidores

**Critérios de Aceite**:
- [ ] **Roadmap não inclui clones** de funcionalidades de ferramentas adotadas (auditável via review do roadmap a cada 6 meses)
- [ ] **Workflows do sunOS podem orquestrar saídas para ferramentas externas** quando necessário (ex: gerar copy → enviar para Sprinklr para publicação)
- [ ] **Comunicação interna posiciona sunOS como sistema de inteligência coletiva**, não substituto de ferramentas de produção
- [ ] Quando ferramenta de mercado adicionar funcionalidade equivalente, sunOS **deprecia ou desinveste** sua versão se vantagem competitiva for marginal

**Dependências**: nenhuma (princípio estratégico)

**Fonte**:
- Q11 do briefing
- Parte 1 §1.4 (não-escopo)

---

---

## Categoria G — Workflow & Governança (NOVA — adicionada após pedidos do Guga e Bruno Prosperi)

Como o sunOS suporta o fluxo de submissão → pré-validação automática → aprovação humana hierárquica.

---

### BR-017 — Fluxo de aprovação hierárquica com pré-validação por agentes

**Descrição**: Quando um creator finaliza uma sessão/asset que precisa de aprovação superior, o sunOS deve permitir **submissão estruturada para o aprovador (superior direto)**. Antes de chegar ao aprovador, o asset passa por **agentes especializados de pré-validação** (Brand Guidelines do cliente, gramática portuguesa, conformidade legal/regulatória, e demais validações configuráveis), que produzem um **Validation Report** estruturado anexado à submissão. **O aprovador permanece sendo o único decisor humano** — agentes não aprovam, apenas pré-validam e expõem issues encontrados.

**Prioridade**: Alta

**Stakeholders demandantes**: Bruno Prosperi (Sócio Criação), Guga (Sponsor), aprovadores sócio em geral

**Critérios de Aceite**:
- [ ] Creator consegue submeter para aprovação em **≤2 cliques** a partir da tela de sessão
- [ ] Validation Report inclui no mínimo 3 dimensões (Brand, Português, mais 1 configurável por área) — cada uma com status `passed | warning | failed` + evidências
- [ ] Aprovador recebe notificação dentro do sunOS (e por canal externo a definir — email/Slack)
- [ ] **Aprovador é sempre humano** — UI deixa explícito quem aprovou (humano), não quem validou (agente). Auditável
- [ ] **Limite de 3 rounds** automáticos (creator → validators → ajustes → re-submissão) antes de escalar para conversa humano-humano
- [ ] Métrica: ≥80% das revisões evitáveis (erro de português, brand inconsistency) endereçadas antes do aprovador

**Dependências**: BR-004 (Brand Guidelines como conteúdo curado obrigatório na Biblioteca) · BR-007 (RBAC) · BR-009 (Auditabilidade) · BR-010 (Ownership preservado — agente nunca aprova)

**Fonte**: Pedido formal Guga + Bruno Prosperi (28/04/2026), conexão natural com RN-014 (Faísca → Brasa → **Validado**) que já antecipava o fluxo

---

### BR-018 — Drive interno da Suno como fonte curada da Biblioteca e da Wiki Ontológica (v2)

**Descrição**: O sunOS deve integrar-se ao Google Drive corporativo da Suno United Creators como fonte primária de insumo para a Biblioteca e para a Wiki Ontológica de cada cliente. O Drive da Suno está estruturado em pastas que organizam o trabalho da agência por cliente, projeto, área e tipo de conteúdo. Conteúdos relevantes são curados (manualmente pelo Líder, com assistência sugestiva de agentes para identificar oportunidades, duplicatas e conteúdo desatualizado) e ingeridos. A integração é unidirecional read-only. Agentes do sunOS não escrevem, deletam, movem ou alteram arquivos do Drive. Apenas analisam e sugerem reorganização para humanos executarem. Sync respeita o ACL nativo do Drive da Suno cruzado com o RBAC do sunOS (intersecção, default deny). Conteúdo de cliente inativo permanece preservado mas oculto de retrievals padrão (RN-007).

**Mudança vs. v1**: A v1 contemplava integração com Drives externos do cliente, gerando dependências contratuais (REST-08) e complexidades de ACL cross-empresa. A v2 limita o escopo ao Drive interno da Suno (com pastas de cliente dentro), eliminando essas dependências.

**Prioridade**: Alta

**Stakeholders demandantes**: Guga (sponsor), Heitor (Tecnologia), Fabiano (gestão do Drive corporativo da Suno)

**Critérios de Aceite**:
- [ ] Escopo OAuth restrito: aplicação solicita apenas `drive.readonly` e `drive.metadata.readonly` ao Workspace da Suno
- [ ] Conta de serviço dedicada com acesso somente leitura ao Drive corporativo, configurada com auditoria de Acesso ativada no Google Workspace Admin
- [ ] Estrutura de pastas mapeada e versionada. Agentes operam sobre estrutura conhecida (cliente, projeto, tipo de conteúdo). Mudanças na estrutura geram notificação ao admin
- [ ] Sync incremental ≤24h para conteúdo geral. Webhook de sync ≤5min para pastas marcadas como críticas (Brand Guidelines, regras de negócio do cliente, contratos vigentes)
- [ ] Sugestões curatórias (duplicatas, conteúdo desatualizado, pastas órfãs, brand guidelines de cliente ativo sem versão recente) produzidas em report semanal ao Líder. Humano executa as ações sugeridas
- [ ] Bloqueio técnico de operações de escrita no client SDK. Qualquer tentativa de write/delete/move é interceptada, logada como violação e gera alerta admin
- [ ] Auditoria completa. Cada item sincronizado registra origem (caminho no Drive), responsável pela curadoria, data de ingestão
- [ ] Política de retenção: arquivo removido do Drive permanece indexado por 30 dias com flag `obsoleto` antes de ser removido do sunOS, permitindo rollback de remoção acidental no Drive

**Dependências**: BR-004 (Biblioteca), BR-007 (Caixa-preta/RBAC), BR-008 (privacidade cliente), BR-022 (Onboarding usa Drive como fonte do bootstrap)

**Fonte**: Reunião 07/05/2026 (validação no MRV: "qualquer documento que entra no drive de MRB ele atualiza a WIKI automaticamente. Essa trinca a gente tem que começar a fazer na Suno"). Reunião 13/05/2026 (Heitor confirmando estrutura proposta com Fabiano). Decisão de escopo 14/05/2026 (Heitor: "Drive da Suno como repositório único contendo dados do cliente").


---

### BR-020 — Captura seletiva de inputs operacionais via gravação assistida

**Descrição**: O sunOS deve oferecer capacidade de gravação seletiva e estruturada de reuniões operacionais críticas (entrada de job no atendimento, reuniões de fim de dia, apresentações semanais e mensais com cliente, comitês de decisão), com transcrição automática, extração de elementos relevantes (decisões, próximos passos, briefings, mudanças de escopo) e alimentação direta da Wiki Ontológica do cliente correspondente. A captura é sempre opt-in por reunião, nunca por padrão, e respeita Caixa-preta (não acessível a perfis operacionais não autorizados). Aplicação prática da frase do sponsor: "a gente tem que achar um jeito de a gente gravar, e com uma caixa preta, isso não tá à disposição de todo mundo" (Guga, 07/05/2026).

**Prioridade**: Média (Piloto, não Protótipo)

**Stakeholders demandantes**: Guga (sponsor), Elton (Operações/Atendimento), Bruno Prosperi (Criação para apresentações), Cíntia (Planejamento para entrada de job)

**Critérios de Aceite**:
- [ ] Captura é explicitamente acionada por usuário autorizado para cada reunião. Sem auto-join em todas as reuniões da agenda
- [ ] Tipos de reunião suportados no MVP: entrada de job, status semanal, status mensal, comitê de decisão. Outros tipos exigem configuração admin
- [ ] Transcrição gerada em até 1h após o fim da reunião
- [ ] Extração automática produz pelo menos: decisões tomadas (com responsável), próximos passos (com prazo), entidades mencionadas (briefing, cliente, projeto, pessoa) com link para a Wiki Ontológica
- [ ] Conteúdo extraído alimenta a Wiki Ontológica do cliente correspondente, com proveniência rastreável (reunião X, timestamp Y)
- [ ] Acesso à transcrição e ao conteúdo extraído segue RBAC. Operacionais não veem reuniões a que não estiveram presentes (RN-009, RN-011)
- [ ] Auditoria registra cada captura: quem ativou, quando, qual reunião, quem teve acesso ao conteúdo
- [ ] Política de retenção definida: 12 meses transcrição completa, depois cold storage. Conteúdo extraído mantido indefinidamente como parte da Wiki
- [ ] Captura não acontece sem ciência dos participantes. Notificação automática no início da reunião

**Dependências**: BR-007 (RBAC/Caixa-preta), BR-008 (privacidade), BR-022 (Onboarding/Wiki), BR-009 (Auditabilidade)

**Fonte**: Reunião 07/05/2026 (Guga + Thais sobre captura assistida). Reunião 14/05/2026 (validação do conceito com Elton mencionando aprovação de material de mídia como fluxo correlato).

**Observação**: A formulação evita o anti-padrão de "agente que grava toda reunião do calendário", que o próprio Guga e Thais rejeitaram. O foco é em inputs operacionais críticos (Bioma Job), não em conversas casuais.

---

### BR-021 — Wiki Ontológica — repositório de entidades estruturadas por cliente

**Descrição**: O sunOS deve manter uma **Wiki Ontológica** por cliente — repositório estruturado de entidades de negócio que qualificam o cliente em profundidade para todos os agentes da plataforma. A Wiki é o "estado de verdade" do cliente: cada entidade tem tipo, valor, fonte, data de validação e responsável humano. A Wiki é alimentada continuamente por três fluxos: onboarding automatizado (BR-022 / FA-15), sync do Drive corporativo da Suno (BR-018), e captura seletiva de reuniões (BR-020 / BR-023 / FA-16). Cada entidade exige validação humana antes de se tornar oficial (RN-032). Skills processuais do sunOS consultam a Wiki via RAG ontológico antes de gerar outputs.

**Prioridade**: Alta

**Stakeholders demandantes**: Elton (Operações — dono do fluxo), Cíntia (Planejamento — consumidor primário), Heitor (tutela técnica), Guga (sponsor)

**Critérios de Aceite**:
- [ ] Wiki Ontológica existe por cliente, acessível em `/clientes/:slug/wiki`
- [ ] Suporta as 9 entidades backbone (Type A — narrativa): `CLIENT_PROFILE`, `MARKET_CONTEXT`, `COMPETITORS`, `BRAND_VOICE`, `TARGET_PERSONAS`, `LEGAL_CONSTRAINTS`, `BUSINESS_OBJECTIVES`, `CONTRACTED_SCOPE`, `MARTECH_STACK`
- [ ] Cada entidade tem campos: tipo, valor, fonte (Drive / reunião / onboarding / manual), data de validação, responsável (Builder ou Sponsor), status (`PENDING_REVIEW | ACTIVE | ARCHIVED`)
- [ ] Entidade só vira `ACTIVE` após validação humana explícita (HITL obrigatório — RN-032)
- [ ] Cliente permanece `PRE_ACTIVE` até no mínimo as 9 entidades backbone terem status `ACTIVE`
- [ ] `CONTRACTED_SCOPE` acessível apenas a roles `admin`/`sponsor` (guardrail de tier financeiro sensível — ADR-015)
- [ ] `MARTECH_STACK` pode permanecer vazia se cliente não tem ferramentas identificadas (não cria registro fantasma)
- [ ] Skills processuais consultam automaticamente a Wiki do cliente ativo antes de gerar output — sem ação do operador
- [ ] Wiki é caixa-preta para perfis operacionais: conteúdo não exibido diretamente, consumido apenas via Skills (RN-011)
- [ ] Audit log de cada entidade: quem criou, quem aprovou, de que fonte veio, histórico de edições
- [ ] Wiki admite atualização incremental: nova entidade ou edição não invalida as já aprovadas
- [ ] Proveniência rastreável: cada entidade indica a fonte específica (nome do arquivo no Drive, timestamp da reunião, etc.)

**Dependências**: BR-018 (Drive como fonte de seed), BR-022 (Onboarding Oráculo como fluxo de criação), BR-020 (Captura Seletiva como fonte contínua), BR-023 (Reuniões como fonte de atualização ontológica), BR-007 (RBAC / caixa-preta), BR-009 (Auditabilidade)

**Fonte**: Reunião 13/05/2026 (Heitor: *"esse DP agent aqui pra descobrir, seria um oráculo do cliente, ele teria todas as informações do cliente"*). Reunião 07/05/2026 (Guga sobre Drive: *"qualquer documento que entra no drive de MRV ele atualiza a WIKI automaticamente"*). Consolidação 14/05/2026 como entidade central que BR-018, BR-020 e BR-022 alimentam. Revisão 23/06/2026: schema atualizado de 6 para 9 entidades backbone canônicas alinhadas ao ADR-007 v2 e ADR-015 (Oracle Deep Agent Architecture).

---

### BR-022 — Onboarding automatizado de cliente com "Oráculo do Cliente"

**Descrição**: O sunOS deve oferecer fluxo de onboarding de cliente automatizado que combina cadastro inicial, sync com pastas do Drive da Suno, geração automática de ontologia sugerida (Oráculo do Cliente) e validação humana via Time de Operações. O Discovery automatizado consulta as fontes disponíveis (Drive da Suno, briefing inicial do atendimento, pesquisa web em fontes públicas) para propor uma seed inicial de entidades (pessoas-chave, sistemas, objetivos de negócio, contratos vigentes, jornadas-foco, brand voice) que o humano valida antes de virar parte definitiva da Wiki Ontológica. Implementa o conceito de "oráculo do cliente" levantado na reunião de 13/05/2026 por Heitor: "a gente vai ter tipo um oráculo, esse DP agent aqui pra descobrir, seria um oráculo do cliente, ele teria todas as informações do cliente, e os outros agentes vão plugar lá aqui e escolher ele".

**Prioridade**: Alta (Piloto)

**Stakeholders demandantes**: Elton (Sponsor de Operações, dono do fluxo no MVP), Cíntia (Planejamento como consumidor primário do contexto), Guga (sponsor)

**Critérios de Aceite**:
- [ ] Fluxo de onboarding único orquestrado (cadastro + sync inicial + ontologia sugerida + validação) acessível em `/clientes/onboard`
- [ ] Cadastro inicial mínimo concluído em ≤30 minutos: nome, slug, sponsor da conta na Suno, briefing inicial de no máximo 1 página
- [ ] Sync inicial das pastas do cliente no Drive da Suno completa em ≤24h após cadastro
- [ ] Ontologia inicial gerada automaticamente após sync, propondo no mínimo 6 entidades core: pessoas-chave (executivos, decisores), sistemas (CRM, CDP, plataformas usadas), objetivos de negócio, contratos vigentes, jornadas-foco, brand voice
- [ ] Pesquisa web realizada em fontes públicas (perfil corporativo do cliente, LinkedIn de executivos mencionados, notícias relevantes dos últimos 12 meses) com proveniência rastreável de cada fato sugerido
- [ ] Humano valida cada entidade individualmente. Sem auto-aprovação no seed inicial (HITL obrigatório, RN-014)
- [ ] Fontes externas consultadas seguem governança: allow-list de domínios auditada, sem scraping de conteúdo protegido por paywall ou login
- [ ] Time de Operações é dono do fluxo no MVP. Sponsor de Operações (Elton) aprova design final. Builder de Operações (Chamas) executa onboardings na operação
- [ ] Auditoria registra cada onboarding: quem cadastrou, quais entidades foram aceitas, rejeitadas ou editadas, quais fontes foram consultadas, tempo total da validação
- [ ] Cliente fica em status `PRE-ACTIVE` até validação humana da ontologia mínima ser concluída. Skills processuais não acessam cliente em `PRE-ACTIVE`
- [ ] Onboarding deve ser idempotente: re-execução em cliente existente atualiza ontologia sem duplicar entidades

**Dependências**: BR-018 v2 (Drive Suno), BR-021 (Wiki Ontológica), BR-007 (RBAC), BR-009 (Auditabilidade), BR-008 (privacidade cliente)

**Fonte**: Reunião 13/05/2026 (Heitor descrevendo o "oráculo do cliente"). Decisão de design 14/05/2026 (Heitor + Elton sobre dono do fluxo no MVP).

**Observação**: Este BR adota a Hipótese C (Discovery automatizado pesado) da análise de cobertura, em vez de wizard simples.

---

### BR-023 — Reuniões como fonte de atualização ontológica

**Descrição**: As atas de reunião entre time Suno e cliente devem ser processadas como fonte contínua de atualização da ontologia do cliente. Reuniões contêm decisões estratégicas, mudanças de escopo, novos stakeholders e contexto vivo que complementam as fontes estáticas (Drive, onboarding inicial). O processamento deve respeitar restrições rigorosas de privacidade e controle humano, dado que atas tipicamente contêm conteúdo sensível (PII, RH, vida pessoal) misturado com conteúdo relevante para a ontologia.

**Prioridade**: Alta

**Stakeholders demandantes**: Guga (sponsor), Elton (Operações), Cíntia (Planejamento), Heitor (tutela técnica)

**Critérios de Aceite**:

a) **Sanitização obrigatória pré-AI (HITL 1):** Conteúdo sensível — PII de não-stakeholders cadastrados, dados de RH (promoções, demissões, avaliações, salários), informações pessoais (férias, família, saúde), fofoca organizacional e informações de gestão de pessoas — deve ser removido por revisor humano ANTES de qualquer processamento por IA. `indexing_status = 'pending_hitl1'` bloqueia acesso ao pipeline até aprovação explícita.

b) **Retrieval diferenciado por recência:** Sistema deve diferenciar reuniões recentes (< 60 dias) de reuniões antigas (≥ 60 dias) no mecanismo de retrieval. Reuniões recentes usam CAG (transcript sanitizado completo no contexto); reuniões antigas usam RAG (chunks semânticos indexados em pgvector). Transição hot→cold executada por job diário idempotente.

c) **HITL 2 para atualizações ontológicas:** Atualizações propostas pela IA com base em reuniões devem passar por aprovação humana (Admin ou Sponsor) via LangGraph `interrupt()`. A proposta deve incluir: entidade a atualizar, trecho exato da ata que fundamenta a proposta, diff legível antes/depois e score de confiança. Sem aprovação humana, nenhuma entidade é modificada.

d) **Proibição de conteúdo de gestão de pessoas:** Nenhuma informação de gestão de pessoas (avaliações de performance, promoções, demissões, conflitos de equipe, reestruturações organizacionais) pode ser incorporada à ontologia do cliente. Esta restrição é aplicada tanto no checklist do HITL 1 quanto no guardrail de output do Oracle (Guardrail 2 — ADR-016).

- [ ] Upload de nova ata aciona status `pending_hitl1` — conteúdo inacessível ao pipeline de AI até aprovação humana
- [ ] Interface de revisão HITL 1 apresenta checklist de categorias sensíveis ao revisor; aprovação registra `hitl1_approved_by` e `hitl1_approved_at`
- [ ] Reuniões com `indexing_status = 'hot'` (< 60 dias) carregadas como CAG no contexto do Oracle; reuniões `cold` (≥ 60 dias) acessadas via RAG semântico em pgvector
- [ ] Job diário `hot_to_cold` transiciona atas, chunka via `RecursiveCharacterTextSplitter` e indexa em `meeting_chunks` (mesmo schema AlloyDB do ADR-008)
- [ ] Proposta de atualização ontológica gerada pelo Oracle inclui campo `evidence_anchor` com trecho literal da ata que motiva a mudança
- [ ] Revisor (Admin/Sponsor) aprova ou rejeita cada proposta individualmente via UI. Aprovação dispara pipeline embed + GraphRAG seed (ADR-013)
- [ ] Nenhum conteúdo de gestão de pessoas (avaliações, promoções, demissões, conflitos) presente em `sanitized_content` de nenhuma ata (verificável por auditoria)
- [ ] Audit log registra cada ata: quem fez upload, quem aprovou HITL 1, quais proposals HITL 2 foram aprovadas/rejeitadas, tempo total do pipeline
- [ ] Caixa-preta: endpoint de aprovação HITL 1 retorna 404 (não 403) para `meeting_id` de outro cliente (RN-010)
- [ ] Acesso às transcrições segue RBAC: operacionais não veem reuniões a que não estiveram presentes

**Dependências**: BR-021 (Wiki Ontológica como destino das atualizações), BR-020 (Captura Seletiva como fonte de atas), BR-007 (RBAC / caixa-preta), BR-008 (privacidade), BR-009 (Auditabilidade)

**Fonte**: Design session 23/06/2026 (`docs/superpowers/specs/2026-06-23-oracle-deep-agent-design.md`, Decisões 5 e 6). ADR-016 (Pipeline de processamento de reuniões — Dual HITL + CAG/RAG híbrido). Guga 07/05/2026: *"a gente tem que achar um jeito de a gente gravar, e com uma caixa preta, isso não tá à disposição de todo mundo"*.

**Observação**: Este BR especifica as **restrições de negócio** para o processamento de reuniões. A arquitetura técnica (CAG/RAG híbrido, schema de dados, pipelines pós-HITL) está documentada no ADR-016. A feature de captura (gravação, transcrição, notificação de participantes) está em BR-020.

---

## Categoria H — Princípios de Experiência (NOVA — adicionada após validação Guga em 07/05 e 14/05)

Princípios fundacionais que orientam decisões de UX em todas as features do sunOS.

---

### BR-019 — Princípio de UX operacional estruturada (software, não chat livre)

**Descrição**: O sunOS deve oferecer UX operacional estruturada para todas as tarefas de creators e builders, com paradigmas visuais e fluxos guiados em vez de chat livre genérico. O princípio reflete direção formal do sponsor: "a gente não deve ser um chat, a gente deve ser um software. E esse software ou tem drag and drop, ou tem às vezes coisas que tu escolhe... fazer um pix de quanto? Pra quem? De que jeito?" (Guga, 07/05/2026). Para tarefas operacionais, o creator nunca compõe prompts livremente em produção. A UX captura o que precisa via inputs estruturados, escolhas pré-definidas e composição visual. Chat livre é reservado apenas para contextos específicos onde fluxo aberto é apropriado (Moon Shot de provocação criativa, Discovery de consultoria estruturada).

**Prioridade**: Alta (princípio fundacional)

**Stakeholders demandantes**: Guga (sponsor)

**Critérios de Aceite**:
- [ ] Toda Skill processual (FA-03) tem inputs estruturados visíveis no Chat. Operador nunca precisa "saber escrever o prompt" para usar uma Skill
- [ ] Workflow Builder (FA-05) oferece composição visual via drag-and-drop de nodes, conforme ADR-003
- [ ] Chat genérico sem Skill ativa é desencorajado via UX. Tela inicial sugere selecionar Skill ou Cliente. Chat sem contexto não é o uso default
- [ ] Auditoria registra quando usuário usa chat genérico (sem Skill ativa), permitindo análise de gaps de cobertura via Skills
- [ ] Documentação interna e onboarding de novos creators reforça o princípio: usar Skills, não ensinar o sunOS a fazer cada coisa via prompt
- [ ] Exceções autorizadas (chat livre permitido): FA-02 Moon Shot (provocação criativa) e Discovery do consultor estruturado (chat persistente da capacidade absorvida do koro-studio). Outras exceções exigem aprovação do Comitê de Produto

**Anti-padrões a evitar**:
- Chat genérico estilo ChatGPT/Claude como interface principal
- Prompt engineering exposto a creators operacionais
- Workflows sem inputs explícitos (caixa-preta de configuração)
- Skills sem documentação dos inputs esperados

**Dependências**: ADR-003 (Workflow Builder visual), FA-03, FA-04, FA-05, FA-06

**Fonte**:
- Reunião 07/05/2026 (Guga: "não deve ser um chat, deve ser um software")
- Reunião 14/05/2026 (Heitor + Guga: metáfora "app de banco" para Pix)
- Decisão de design Heitor 14/05/2026

**Observação**: Este BR é princípio orientador, não feature. Implementação prática vive em FA-03, FA-05, FA-06 e nos ADRs correspondentes. ADR-001 (que rejeitava drag-and-drop) é superseded por ADR-003 como parte desta atualização.

---

## Matriz de Rastreabilidade — BR ↔ OBJ

Cada BR deve cobrir pelo menos um Objetivo da Parte 1. Matriz garante que nenhum objetivo fica órfão e nenhum BR fica desconectado.

| BR | OBJ-01 (Reduzir custo) | OBJ-02 (Liberar talento) | OBJ-03 (Centralizar IA) | OBJ-04 (Accountability) | OBJ-05 (Posicionamento) |
|----|:---:|:---:|:---:|:---:|:---:|
| BR-001 — Provocação criativa | | ✓ | | | ✓ |
| BR-002 — Aceleração operacional | ✓ | ✓ | | | |
| BR-003 — Demonstração de ROI | | | | ✓ | |
| BR-004 — Biblioteca | | ✓ | ✓ | | |
| BR-005 — Continuidade pós-turnover | | ✓ | ✓ | | |
| BR-006 — Acesso democrático | ✓ | ✓ | | | |
| BR-007 — Proteção de IP | | | ✓ | | ✓ |
| BR-008 — Privacidade de dados | | | ✓ | | |
| BR-009 — Auditabilidade | | | ✓ | ✓ | |
| BR-010 — Ownership criativo | | ✓ | | | ✓ |
| BR-011 — Cultura brasileira | | | | | ✓ |
| BR-012 — UX por carreira | | ✓ | | | |
| BR-013 — Mensuração custo | ✓ | | | ✓ | |
| BR-014 — Detecção homogeneização | | | | ✓ | ✓ |
| BR-015 — Integração com Skills | ✓ | ✓ | | | |
| BR-016 — Coexistência com ferramentas | | | ✓ | | |
| BR-017 — Aprovação hierárquica | ✓ | ✓ | ✓ | ✓ | |
| BR-018 — Drive interno da Suno | ✓ | ✓ | ✓ | | |
| BR-019 — UX operacional estruturada | | ✓ | | | ✓ |
| BR-020 — Captura seletiva | | ✓ | ✓ | ✓ | |
| BR-021 — Wiki Ontológica | ✓ | ✓ | ✓ | ✓ | |
| BR-022 — Onboarding Oráculo do Cliente | ✓ | ✓ | ✓ | ✓ | |
| BR-023 — Reuniões como fonte ontológica | ✓ | ✓ | ✓ | ✓ | |

**Cobertura**: cada um dos 5 OBJ tem ≥3 BRs associados — boa redundância sem inflação.
**Nota**: BR-021 adicionado na v1.3 com linha na rastreabilidade: BR-021 cobre OBJ-01, OBJ-02, OBJ-03, OBJ-04. BR-023 adicionado na v1.5: cobre OBJ-01, OBJ-02, OBJ-03, OBJ-04.


---

## Matriz de Rastreabilidade — BR ↔ Personas

> Esta seção está reservada para a próxima iteração de documentação — mapeamento será feito junto à revisão de personas PX-01 a PX-08.

---

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-04-28 | Versão inicial. 16 BRs em 6 categorias temáticas com critérios de aceite verificáveis e rastreabilidade a OBJs. |
| 1.1 | 2026-04-28 | +BR-017 (Aprovação Hierárquica) e +BR-018 (Drive interno Suno). Nova Categoria G. |
| 1.2 | 2026-05-14 | +BR-019 (UX estruturada — Categoria H), +BR-020 (Captura Seletiva), +BR-022 (Onboarding Oráculo do Cliente). BR-018 atualizado para v2 (Drive limitado ao Drive interno da Suno). Matriz BR ↔ OBJ atualizada. |
| 1.4 | 2026-05-15 | **Ponto 9 resolvido**: BR-001 mantém prioridade **Alta** — explicitada como Alta *dentro do Momento 2*. |
| 1.3 | 2026-05-14 | **+BR-021** (Wiki Ontológica — repositório de entidades estruturadas por cliente). Sumário expandido com coluna **Fase** (Piloto / Momento 2) para cada BR. BR-017, BR-020 marcados como Momento 2 (FA-13, FA-16 movidas). BR-001, BR-014 marcados como Momento 2 (Moon Shot pós-Piloto). Matriz BR ↔ OBJ: BR-021 adicionado. |
| 1.5 | 2026-06-23 | **BR-021 revisado**: schema atualizado de 6 entidades (`pessoa-chave`, `sistema`, `objetivo-de-negocio`, `contrato-vigente`, `jornada-foco`, `brand-voice`) para 9 entidades backbone canônicas (`CLIENT_PROFILE`, `MARKET_CONTEXT`, `COMPETITORS`, `BRAND_VOICE`, `TARGET_PERSONAS`, `LEGAL_CONSTRAINTS`, `BUSINESS_OBJECTIVES`, `CONTRACTED_SCOPE`, `MARTECH_STACK`), alinhado ao redesign Oracle v2 (ADR-007 v2, ADR-015). **+BR-023** (Reuniões como fonte de atualização ontológica): Dual HITL obrigatório, CAG/RAG híbrido com threshold 60 dias, proibição de conteúdo de gestão de pessoas. Fundamento: ADR-016 e design session 23/06/2026. Sumário expandido para 23 BRs. Matriz BR ↔ OBJ: BR-023 adicionado. |