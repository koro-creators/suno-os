---
documento: BRD Parte 3 — Requisitos de Negócio (BR-XXX)
projeto: sunOS
cliente: Suno United Creators (uso 100% interno)
bu: Tecnologia e Dados para Marketing
versao: 1.0
data_criacao: 2026-04-28
ultima_atualizacao: 2026-04-28
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
fonte_principal: Parte 1 (Contexto) + Parte 2 (Glossário) + FRD Shoot for the Moon + Research foundation engineering serendipity
---

# BRD Parte 3 — Requisitos de Negócio

## Objetivo

Esta parte traduz os **5 Objetivos de Negócio** da Parte 1 e as **7 Capacidades de Negócio** da §4.2 em **Requisitos de Negócio formais (BR-XXX)** — cada um com critérios de aceite verificáveis e rastreabilidade clara. BR é um requisito **em linguagem de negócio**: descreve o que o negócio precisa, não como será implementado.

## Como Usar

- BRs estão organizados em **6 categorias temáticas** que correspondem a frentes de valor do projeto
- Cada BR tem ID sequencial (BR-001 a BR-016), prioridade, stakeholder demandante, critérios de aceite e dependências
- **BR ≠ FR (Functional Requirement)**: BR descreve a necessidade; FR descreve a solução. FRs vivem em PRDs/FRDs separados
- **Quando uma feature já tem FRD próprio (ex: Shoot for the Moon), o BR aponta para ele** — nunca duplica
- Critérios de aceite são **verificáveis**, não desejos vagos

## Sumário Executivo (16 BRs)

| ID | Título resumido | Prioridade | Categoria |
|----|----------------|:----------:|----------|
| **BR-001** | Provocação criativa contra homogeneização | Alta | A — Valor primário |
| **BR-002** | Aceleração operacional via automação inteligente | Alta | A — Valor primário |
| **BR-003** | Demonstração contínua de ROI ao sponsor e Diretoria | Alta | A — Valor primário |
| **BR-004** | Repositório institucional unificado (Biblioteca) | Alta | B — Conhecimento |
| **BR-005** | Continuidade do repertório frente a turnover | Média | B — Conhecimento |
| **BR-006** | Acesso democrático ao conhecimento coletivo | Alta | B — Conhecimento |
| **BR-007** | Proteção do IP proprietário (caixa-preta) | Alta | C — Governança |
| **BR-008** | Privacidade de dados de clientes da Suno | Alta | C — Governança |
| **BR-009** | Auditabilidade de operações de IA | Média | C — Governança |
| **BR-010** | Preservação do ownership criativo | Alta | D — Adoção e Cultura |
| **BR-011** | Respeito à cultura criativa brasileira e da Suno | Média | D — Adoção e Cultura |
| **BR-012** | Diferenciação de UX por estágio de carreira | Média | D — Adoção e Cultura |
| **BR-013** | Mensuração de custo evitado e impacto operacional | Alta | E — Mensuração |
| **BR-014** | Detecção de homogeneização criativa em nível coletivo | Alta | E — Mensuração |
| **BR-015** | Integração com Skills existentes do sunOS | Alta | F — Integração |
| **BR-016** | Não substituir ferramentas de mercado adotadas | Média | F — Integração |
| **BR-017** | Fluxo de aprovação hierárquica com pré-validação por agentes | Alta | G — Workflow & Governança |
| **BR-018** | Google Drive como fonte curada da Biblioteca (read-only + curadoria sugestiva) | Média | F — Integração |

---

## Categoria A — Valor Primário de Negócio

Os três requisitos centrais que justificam a existência do projeto: provocar criatividade, acelerar operação, demonstrar retorno.

---

### BR-001 — Provocação criativa contra homogeneização

**Descrição**: O sunOS deve oferecer capacidade que **provoque** ideias inesperadas em creators (especialmente seniores), combinando conceitos de domínios distantes para combater a tendência observada de **homogeneização criativa coletiva** quando profissionais usam ferramentas de IA generativas. A capacidade deve **provocar, não gerar** — outputs são estímulo para o creator, não peças finais.

**Prioridade**: Alta

**Stakeholders demandantes**: Bruno Prosperi (Sócio Criação), Sergio Katz (CSO/Planejamento), Guga (Sponsor)

**Critérios de Aceite**:
- [ ] Em testes blind, **≥60% das provocações** classificadas como "úteis" por 3+ creators seniores (POC)
- [ ] Score de bisociação médio das provocações aprovadas dentro da **zona Sweet Spot** (cosseno 0.5–0.85) — ver FRD Shoot for the Moon §FR-011
- [ ] Sistema rejeita provocações nas zonas "óbvio demais" e "incoerente demais" automaticamente (≥90% de filtragem efetiva)
- [ ] Em uso real (Piloto), ≥70% de aprovação por creators
- [ ] Capacidade acessível em **≤3 cliques** a partir do contexto de qualquer cliente

**Dependências**: BR-004 (Biblioteca), BR-007 (Proteção de IP), BR-014 (Detecção de homogeneização)

**Fonte**:
- FRD Shoot for the Moon §FA-02
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
- FRD Shoot for the Moon §FA-03
- Transcrição Heitor + William

---

### BR-003 — Demonstração contínua de ROI ao sponsor e à Diretoria

**Descrição**: O sunOS deve gerar **evidências mensuráveis e defensáveis de valor** (custo evitado, tempo economizado, impacto em campanhas, novos negócios influenciados) suficientes para sustentar continuidade do investimento, justificar expansões de escopo e responder à pressão de accountability típica de Diretoria.

**Prioridade**: Alta

**Stakeholders demandantes**: Guga (sponsor), Ronaldo Severino (CFO)

**Critérios de Aceite**:
- [ ] **Business case completo** apresentado e aprovado pela Diretoria até **Q3 2026** (cobre ≥80% das 136 atividades catalogadas)
- [ ] **Dashboard executivo** disponível mensalmente com tendência de tempo economizado, custo evitado e adoção
- [ ] **≥3 cases internos documentados por trimestre** com impacto atribuível ao sunOS (ex: campanha que usou Shoot for the Moon, tarefa cuja execução foi acelerada)
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

**Descrição**: O sunOS deve manter uma **base de conhecimento centralizada (Biblioteca)** que consolida referências culturais, cases de clientes, briefings, guidelines de marca, contexto de mercado, metodologias proprietárias e histórico de campanhas — disponível como infraestrutura única para skills processuais e Shoot for the Moon, sem duplicação. A Biblioteca é **invisível para perfis operacionais**: líderes curam, plataforma consome.

**Prioridade**: Alta

**Stakeholders demandantes**: Bruno Prosperi (Criação), Sergio Katz (Planejamento), Heitor (tutela técnica)

**Critérios de Aceite**:
- [ ] Biblioteca com **≥500 itens curados** até final do Piloto (ver FRD §FA-01)
- [ ] Líderes conseguem curar conteúdo em **<5 minutos por item** com metadados obrigatórios completos
- [ ] **Zero conhecimento crítico de cliente** vivendo apenas em cabeças individuais (auditável: cada conta ativa com contexto-mínimo documentado)
- [ ] Biblioteca alimenta **simultaneamente** skills processuais (modo convergente) e Shoot for the Moon (modo divergente)
- [ ] Curadoria contínua sustentada (≥X itens novos/semana após Piloto — definir baseline durante Protótipo)

**Dependências**: BR-007 (governança), BR-005 (captura de turnover)

**Fonte**:
- FRD Shoot for the Moon §FA-01
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

**Descrição**: O sunOS deve preservar o **IP estratégico da Suno** (skills, system prompts, lógica do Shoot for the Moon, knowledge curado, lógica de avaliação) através de controles que previnem exposição interna ou externa não autorizada. Refletindo o princípio do sponsor: *"Vendemos ideias na essência."* Aplicação prática da metáfora do **Caixa-preta** (Glossário §1).

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

**Descrição**: A Biblioteca e o Shoot for the Moon devem se **integrar com o ecossistema atual de Skills do sunOS** sem fragmentar a experiência ou exigir migração de funcionalidades existentes. Skills atuais (Copy Social, Plano de Mídia, Roteiro de Vídeo, etc.) consomem Biblioteca via context injection transparente; o Shoot for the Moon é acessível como atalho de qualquer tela de skill/cliente.

**Prioridade**: Alta

**Stakeholders demandantes**: Heitor (tutela), Time de desenvolvimento

**Critérios de Aceite**:
- [ ] **Skills existentes** (Copy Social, Plano de Mídia, etc.) consomem Biblioteca via context injection **sem refatoração** dos prompts originais
- [ ] **Botão Shoot for the Moon acessível em qualquer tela** de skill/cliente do sunOS
- [ ] **Zero downtime** das Skills existentes durante deploy da Biblioteca e do Shoot for the Moon
- [ ] **Performance** das Skills existentes não regrida em mais de 10% (latência) após integração
- [ ] **Compatibilidade** mantida com Skills criadas por usuários no admin (sem quebra)

**Dependências**: BR-004 (Biblioteca), BR-001 (Shoot for the Moon)

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

### BR-018 — Google Drive como fonte curada da Biblioteca

**Descrição**: O sunOS deve integrar-se ao **Google Drive da Suno como fonte primária de insumo para a Biblioteca**. Conteúdos relevantes do Drive são curados (manualmente pelo líder, com **assistência sugestiva de agentes** para identificar oportunidades, duplicatas, conteúdo desatualizado) e ingeridos na Biblioteca. **A integração é unidirecional read-only**: agentes não escrevem, deletam, movem ou alteram arquivos do Drive — apenas analisam e sugerem reorganização para humanos executarem. Sync respeita **ACL do Drive ∩ RBAC do sunOS** (intersecção, default deny).

**Prioridade**: Média

**Stakeholders demandantes**: Guga (Sponsor), líderes/curadores de cada área

**Critérios de Aceite**:
- [ ] Líder consegue conectar uma pasta autorizada do Drive ao sunOS via OAuth Google
- [ ] Sync **read-only** — auditável: nenhuma operação de write/delete/move emitida pelo sunOS no Drive
- [ ] **Intersecção ACL Drive × RBAC sunOS** funcional: usuário só vê conteúdo que pode ver em ambos os sistemas
- [ ] Agentes geram **Drive Cleanup Report** semanal sugerindo: duplicatas, conteúdo órfão sem acesso há ≥180 dias, arquivos com nomenclatura inconsistente, candidatos a curadoria na Biblioteca
- [ ] Líder revisa sugestões e executa (ou rejeita) — log de execução armazenado
- [ ] Re-sync periódico de **24h** + webhook do Google para mudanças críticas em pastas monitoradas
- [ ] Zero violação ACL durante Piloto (auditável)
- [ ] Cliente individual pode ser **excluído** da integração se contrato/política exigir

**Dependências**: BR-004 (Biblioteca) · BR-007 (Proteção IP) · BR-008 (Privacidade clientes) · consentimento contratual cliente-a-cliente

**Fonte**: Pedido Guga (28/04/2026). Versão ajustada vs. pedido original: Guga pediu "espelho bidirecional + agentes que organizam Drive"; ajuste recomendado e aprovado: **Drive como fonte read-only + curadoria sugestiva** (riscos LGPD, ACL, perda de dados, e violação de RN-011 da caixa-preta foram bloqueadores para a versão literal)

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
| BR-018 — Google Drive como fonte | ✓ | ✓ | ✓ | | |

**Cobertura**: cada um dos 5 OBJ tem ≥3 BRs associados — boa redundância sem inflação.

---

## Matriz de Rastreabilidade — BR ↔ Personas (do FRD Shoot for the Moon)

Liga os BRs do BRD com as personas detalhadas no FRD para coerência cross-document.

| BR | PX-01 Líder/Curador | PX-02 Criativo Sênior | PX-03 Operador | PX-04 Planner |
|----|:---:|:---:|:---:|:---:|
| BR-001 — Provocação criativa | | ✓ Primário | | ✓ Primário |
| BR-002 — Aceleração operacional | | | ✓ Primário | |
| BR-003 — ROI ao sponsor | (Métricas) | | | |
| BR-004 — Biblioteca | ✓ Primário | (Indireto) | (Indireto) | (Indireto) |
| BR-005 — Continuidade turnover | ✓ Primário | (Beneficiário) | (Beneficiário) | (Beneficiário) |
| BR-006 — Acesso democrático | | ✓ | ✓ Primário | ✓ |
| BR-007 — Proteção IP | ✓ Primário | | | |
| BR-008 — Privacidade clientes | ✓ | | ✓ | |
| BR-009 — Auditabilidade | ✓ Primário | | | |
| BR-010 — Ownership criativo | | ✓ Primário | | ✓ |
| BR-011 — Cultura brasileira | ✓ | ✓ | ✓ | ✓ |
| BR-012 — UX por carreira | | ✓ Primário | | (Beneficiário) |
| BR-013 — Mensuração custo | ✓ | | (Beneficiário indireto) | |
| BR-014 — Detecção homogeneização | ✓ Primário | (Beneficiário) | | |
| BR-015 — Integração Skills | ✓ Tutela | (Beneficiário) | ✓ Primário | (Beneficiário) |
| BR-016 — Coexistência ferramentas | ✓ | (Beneficiário) | (Beneficiário) | (Beneficiário) |

---

## Como esta Parte 3 impacta PRD, SRD e FRD

A Parte 3 **fornece a baseline de necessidade** que será desdobrada em outros artefatos do pipeline Koro. A relação:

| Artefato | Relação com Parte 3 |
|----------|---------------------|
| **PRD (Product Requirements Document)** | Cada BR vira ≥1 Feature (FA-XX) no Feature Map; BRs viram Jobs-to-be-Done por Persona; critérios de aceite de BRs alimentam testes de aceitação de PRD |
| **SRD (Solution Requirements Document)** | BRs de governança (BR-007 a BR-009) viram NFRs ISO 25010 (Security, Maintainability); BR-013/014 viram requisitos de observabilidade; BRs de integração (BR-015) viram especificações de API/integração |
| **FRD (Feature Requirement Document)** | Já existe FRD para Shoot for the Moon — alinhado com BR-001, BR-004, BR-006, BR-007, BR-010. **FRD é tradução técnica dos BRs**: o que um BR diz como "necessidade", o FRD diz como "FR-XXX" |
| **UX Specs** | BR-010 (ownership), BR-011 (cultura), BR-012 (career stage) são guidelines diretos para UI/UX |

**Regra de consistência**: nenhum FR/feature em PRD ou FRD deve existir sem rastreabilidade a um BR. Se aparecer, ou precisamos adicionar BR aqui (negócio justifica), ou cortar do PRD/FRD (sem justificativa de negócio).

---

## Pontos em aberto / a validar antes da Parte 4 (Regras de Negócio)

| ID | Item | Responsável | Prazo sugerido |
|----|------|-------------|----------------|
| PA-01 | Validar critérios de aceite quantitativos (≥60% aprovação, ≥30% redução de tempo, etc.) com sponsor antes de virarem compromissos contratuais | Heitor + Guga | Maio 2026 |
| PA-02 | Confirmar com Diretoria a política de auditoria/retenção de logs (BR-008 e BR-009) — necessária base para Parte 4 (RN-XXX) | Heitor + Diretoria | Antes Parte 4 |
| PA-03 | Definir baseline pré-sunOS de métricas de homogeneização (BR-014) — sem baseline, alertas não funcionam | Bruno Prosperi + Heitor | Antes Piloto |
| PA-04 | Validar a lista de tarefas-alvo prioritárias para BR-002 (≥10 tarefas) | Heitor + champions | Maio 2026 |
| PA-05 | Definir frequência e formato dos relatórios trimestrais à Diretoria (BR-014) | Heitor + Guga | Junho 2026 |

---

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-04-28 | Versão inicial. **16 BRs** organizados em 6 categorias (Valor primário, Conhecimento, Governança, Adoção/Cultura, Mensuração, Integração). Derivados dos 5 OBJ da Parte 1 + 7 capacidades de negócio §4.2 + FRD Shoot for the Moon + research foundation engineering serendipity. Matrizes de rastreabilidade BR↔OBJ e BR↔Personas. Cada BR tem critérios de aceite verificáveis e fonte rastreável. Referências ao FRD onde aplicável (sem duplicação) |
| 1.1 | 2026-04-28 | **+2 BRs** (BR-017 Aprovação hierárquica · BR-018 Google Drive como fonte) na nova **Categoria G — Workflow & Governança**. Pedido formal de Guga + Bruno Prosperi. Versão ajustada do Drive (read-only + curadoria sugestiva) vs. pedido literal (espelho bidirecional) — ajuste justificado por riscos LGPD/ACL/IP/RN-011 |

---

<!-- REVIEW: Os 16 BRs cobrem o que o negócio realmente precisa? Algum BR está com critérios de aceite vagos? Algum BR fala de "como" e deveria virar FR no PRD/FRD? Algum BR essencial está faltando? -->

**Próximos passos**:
1. Revisar Parte 3 com Heitor Miranda
2. Validar BRs com sponsor (Guga) e patrocinadores sócio
3. Ajustar critérios de aceite quantitativos antes que virem compromissos formais
4. Iniciar **Parte 4 — Regras de Negócio (RN-XXX)** com lógica SE/ENTÃO/SENÃO derivada dos BRs (especialmente BR-001, BR-006, BR-007, BR-008, BR-014)
5. Em paralelo: revisar **FRD Shoot for the Moon** para garantir que cada FR está rastreável a um BR aprovado aqui
