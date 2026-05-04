---
documento: BRD Parte 2 — Glossário (Business Vocabulary)
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
fonte_principal: docs/brd/parte1-contexto.md + PRODUCT_HANDOFF.md + transcrições + deck Crescera
---

# BRD Parte 2 — Glossário (Business Vocabulary)

## Objetivo

Este glossário define os termos utilizados no projeto sunOS, garantindo alinhamento de linguagem entre Diretoria, time de produto, sócios patrocinadores, champions e times consumidores. É a referência oficial — em caso de divergência sobre significado de qualquer termo, este documento prevalece.

O glossário foi organizado em **seções temáticas** (não puramente alfabéticas) para que um leitor novo no projeto consiga construir o contexto de forma progressiva. Use o **Índice Alfabético** abaixo para busca rápida.

## Como Usar

- Cada termo inclui **definição**, **contexto de uso** e **fonte rastreável**
- Acrônimos estão consolidados na **Seção 8** (após o glossário)
- Termos a evitar (sinônimos não-oficiais, jargão antigo) estão na **Seção 9**
- Toda afirmação tem fonte; pontos sem confirmação clara estão marcados como `[A validar]`

---

## Índice Alfabético

| Termo | Seção |
|-------|-------|
| ADR (Architecture Decision Record) | 6 |
| Agent / Agente | 5 |
| Atendimento | 4 |
| Biblioteca | 3 |
| Bioma Agentic | 1 |
| Bioma Job | 1 |
| Bioma Zero | 1 |
| BRD / PRD / SRD / UX | 6 |
| Caixa-preta | 1 |
| Champion | 4 |
| Cliente | 7 |
| Creator | 1 |
| DPO | 4 |
| Eval | 5 |
| Ferrari na garagem | 1 |
| Gemini Flash | 7 |
| HITL (Human in the Loop) | 5 |
| Inteligência Coletiva | 1 |
| Koro Creators | 2 |
| LangGraph | 5 |
| Lima | 7 |
| LLM (Large Language Model) | 5 |
| Ludi | 2 |
| MLflow | 5 |
| Moon | 3 |
| Nava | 7 |
| Órbita | 3 |
| Paim | 2 |
| Patrocinador Sócio | 4 |
| Planeta | 3 |
| RAG (Retrieval-Augmented Generation) | 5 |
| ReAct | 5 |
| Revo | 2 |
| Sistema Solar | 3 |
| Skill | 3 |
| Smart Growth | 1 |
| Sponsor | 4 |
| SSE (Server-Sent Events) | 5 |
| Sun (o Sol) | 3 |
| Suno (empresa) | 2 |
| sunOS | 3 |
| System Prompt | 5 |
| Toolbox | 2 |
| Tutela técnica | 4 |
| United Creators (holding) | 2 |
| Vertex AI | 7 |
| Workflow | 3 |
| Aprovação Hierárquica | 10 |
| Aprovador | 4 |
| Brand Validator | 10 |
| Drive Cleanup Report | 10 |
| Drive Sync | 10 |
| Pré-validação | 10 |
| Português Validator | 10 |
| Rubber-stamping (anti-pattern) | 9 |
| Submissão para aprovação | 10 |
| Validation Report | 10 |

---

## 1. Identidade e Vocabulário Proprietário Suno

| Termo | Definição | Contexto de Uso | Fonte |
|-------|-----------|-----------------|-------|
| **Suno United Creators** | Marca-mãe do grupo. Designa o conjunto de seis empresas operacionais sob a holding **United Creators Participações Ltda.**, com identidade unificada e governança comum. Não confundir com a empresa operacional **Suno** (Seção 2) | Documentos institucionais, comunicação externa, referência ao grupo como um todo | Deck Crescera SmartGrowth (slide 9), Parte 1 §1.1 |
| **Smart Growth** | Conceito proprietário da Suno que descreve a integração de **Marca + Mídia/Performance + Martech** em uma engrenagem única de geração de valor. Não é apenas posicionamento — é uma metodologia de operação ambidextra (criatividade + tecnologia) que orienta a entrega da agência | Pitches comerciais, manifesto institucional, pilar da estratégia da empresa e do projeto sunOS | Deck Crescera SmartGrowth (slide 2), Q3 do briefing, Parte 1 §1.1 e §4 |
| **Creator** | Profissional da Suno (~300 pessoas em 2026). O termo substitui "publicitário" ou "funcionário" e reflete o princípio de que **toda pessoa do grupo cria valor**, independentemente do departamento — redator, diretor de mídia, planejador, analista de BI, financeiro, todos são creators | Comunicação interna, identidade cultural, vocabulário institucional. Aparece em e-mails, contratos e materiais oficiais | Deck Crescera SmartGrowth (slide 7) |
| **Inteligência Coletiva** | Capacidade da Suno de transformar conhecimento individual disperso (vivido por cada creator nos seus clientes e projetos) em **patrimônio compartilhado e acionável** pelo grupo todo. É o problema de negócio central que o sunOS resolve | Justificativa do projeto sunOS, narrativa de "antes do sunOS, conhecimento ficava em e-mails e cabeças de pessoas que podiam sair amanhã" | Transcrição Heitor + William, Q11 |
| **Bioma Zero** | **Camada de liderança** do grupo Suno United Creators. São os sócios e gestores que orquestram equipes, definem estratégia e assumem responsabilidade pela operação. No contexto do sunOS, são os principais usuários administrativos (configuração de skills, governança, decisões cross-time) | Vocabulário interno usado por Guga em reuniões estratégicas. No sunOS, define o nível de acesso administrativo | Transcrição reunião sobre sunOS (Guga + Heitor + Bruno Prosperi), Deck Crescera (manifesto BIOMAS slide 20) |
| **Bioma Job** | **Camada de execução** do grupo. São os times dedicados que executam o trabalho do dia a dia para um ou mais clientes — multidisciplinares, em sprint. No contexto do sunOS, são os usuários operacionais (criativos, mídia, planejamento, etc. que usam Skills, Biblioteca e Workflows no fluxo diário) | Vocabulário interno; descreve a estrutura organizacional de squads | Transcrição reunião sobre sunOS, Deck Crescera (slide 20) |
| **Bioma Agentic** | **Nova camada conceitual** introduzida pelo sunOS — composta por **agentes de IA** que ampliam a capacidade dos Biomas Zero e Job. Não substitui pessoas; opera como "creator artificial" sob supervisão humana, orquestrado por Skills e Workflows | Conceito-chave para discutir a evolução organizacional habilitada pelo sunOS | Transcrição reunião sobre sunOS (Guga: *"A nova camada que a gente está construindo"*) |
| **Caixa-preta** | Expressão informal do Guga, útil para **traduzir** para diferentes audiências o conceito de proteção de propriedade intelectual da Suno: skills, system prompts, knowledge curado e lógica de avaliação ficam fechados (não inspecionáveis) por princípio de governança e segurança estratégica. *"Esse é o segredo do documento. Isso aqui ninguém pode ver."* | Comunicação interna sobre o porquê de certos artefatos do sunOS não serem expostos | Transcrição reunião sobre sunOS, Parte 1 §5.1 |
| **Ferrari na garagem** | Metáfora fundadora da Koro Creators que descreve o problema de mercado que ela resolve: *"empresas investem pesado em ferramentas mas não extraem valor delas"*. No contexto do sunOS, captura a justificativa para investir em produto + governança + capacitação, não apenas em ferramentas | Discurso institucional Koro, justificativa de investimento em sunOS, narrativa para sponsors | Site institucional Koro Creators |

## 2. Estrutura do Grupo United Creators

| Termo | Definição | Contexto de Uso | Fonte |
|-------|-----------|-----------------|-------|
| **United Creators (holding)** | Pessoa jurídica **United Creators Participações Ltda.** que controla as seis empresas operacionais do grupo. Não tem operação direta com clientes — é a camada de governança societária | Contratos, demonstrações financeiras, decisões estruturais. NÃO é onde produtos como sunOS são contratados/operados | Dossiê executivo Guga Ketzer |
| **Suno (empresa)** | A empresa operacional principal — agência de publicidade e criação. **Não confundir** com Suno United Creators (a marca-mãe). Quando se diz "a Suno fez tal campanha", normalmente se refere a esta empresa | Contratos com clientes de criação, relatórios operacionais | Dossiê executivo Guga Ketzer |
| **Paim** | Agência publicitária histórica de Porto Alegre, fundada em 1991 por César Paim. Em fevereiro/2021 firmou associação com a Suno United Creators, dando origem à operação no eixo sul. Atende clientes como Renner, Grendene e Camicado | Operação no Rio Grande do Sul, replicação de práticas entre escritórios | Dossiê executivo, PRODUCT_HANDOFF.md |
| **Revo** | Empresa do grupo United Creators, distinta da Paim. Escopo, posicionamento e clientes específicos `[A validar com Heitor]` | Necessária definição precisa para diferenciá-la da Paim | Confirmação Heitor (briefing) |
| **Koro Creators** | Empresa operacional do grupo dedicada a **martech, dados e inteligência artificial**. Fundada em 19 de julho de 2023. Slogan interno: *"Ferrari na garagem"*. **Não confundir** com a tutela técnica do sunOS — a Koro é uma empresa de serviços ao mercado; o sunOS é um produto interno tutelado pela área de Tecnologia e Dados para Marketing (que tem sobreposição de pessoas com a Koro). **Sempre escrever Koro com K, nunca Coro** | Comercialização de serviços de martech para clientes do grupo, contratação direta para projetos de dados | Site institucional Koro Creators, Q6, transcrições |
| **Ludi** | Empresa operacional do grupo dedicada a **comunicação para o mercado de games (gaming)** | Atendimento de marcas/produtos de games | Dossiê executivo |
| **Toolbox** | **Produto SaaS** do grupo United Creators, sob responsabilidade do sócio Leonardo Yukio Takai. Comercializa **análises avançadas (martech, dados, BI)** para clientes externos — atende tanto **grandes empresas** quanto **SMBs**. **Separado do sunOS**: o Toolbox é externo (vendido para o mercado); o sunOS é interno (uso exclusivo do grupo). Roadmap, escopo e modelo de negócio são independentes — possíveis sinergias tecnológicas futuras serão tratadas caso a caso | Importante para evitar confusão de escopo: produto vendido a clientes externos é Toolbox, **não** sunOS | Confirmação Heitor do briefing |

## 3. Produto sunOS — Entidades Centrais

| Termo | Definição | Contexto de Uso | Fonte |
|-------|-----------|-----------------|-------|
| **sunOS** | Sistema operacional de IA da Suno United Creators. Plataforma interna unificada que organiza skills, agentes, biblioteca de conhecimento, workflows e governança de IA em um único produto, navegado pela metáfora de Sistema Solar. Uso 100% interno. **Sempre minúsculo o "sun"; sempre maiúsculo o "OS"** | Documentação do projeto, comunicação interna, referência ao produto como um todo | `docs/handoff/PRODUCT_HANDOFF.md`, este BRD |
| **Sistema Solar** | **Metáfora visual de navegação** do sunOS — clientes do grupo são planetas, capacidades de IA (Skills) são órbitas em volta de cada planeta, sub-áreas (Moons) são luas em volta de cada Skill. Inspirada no manifesto Suno *"Sol porque a gente acredita em alinhamento. Como os planetas que orbitam a sua volta..."* | Interface do sunOS, vocabulário de UX, comunicação sobre o produto | Deck Crescera SmartGrowth (slide 3), `app/` (rotas `[clientSlug]`) |
| **Sun (o Sol)** | Centro do Sistema Solar. Representa a **organização Suno United Creators** que dá identidade comum a todos os clientes/planetas. No produto, é o ponto de entrada (home `/`) e o símbolo de alinhamento | Interface do sunOS, identidade visual | Deck Crescera SmartGrowth (slide 3), `app/page.tsx` |
| **Planeta** | Representação visual de um **cliente** no Sistema Solar. Cada planeta tem cor, tamanho (proporcional ao volume de skills) e órbitas. Exemplos atuais: Vivo, Americanas, Sicredi, MRV, Cogna | UX, navegação | `data/clients.ts`, `components/solar/PlanetNode.tsx` |
| **Órbita** | Representação visual de uma **Skill** em torno de um cliente (planeta). Sinaliza que aquela capacidade de IA está disponível e configurada para aquele cliente específico | UX | `components/solar/OrbitRing.tsx` |
| **Skill** | **Capacidade de IA configurável** que a Suno disponibiliza no sunOS para uma tarefa específica. Cada Skill tem: nome, descrição, **system prompt** proprietário, modelo de IA preferencial, temperatura, **moons** (sub-áreas), **referências curadas** (RAG) e clientes associados. Exemplos atuais: Copy Social, Plano de Mídia, Roteiro de Vídeo, Texto de Rádio, Persona Sintética, Brief Builder, Análise de Mercado, Report Performance | Ponto central do produto. Tudo o que o creator faz no sunOS começa pela escolha de uma Skill | `docs/handoff/PRODUCT_HANDOFF.md`:487, `docs/specs/large/sunohub-tools-integration/spec.md` |
| **Moon** | **Sub-área de uma Skill** — granulariza a configuração para variações específicas de uso. Ex: a Skill *Copy Social* tem moons *Feed/Carrossel*, *Stories/Reels*, *X/Twitter*. Cada moon pode ter ajustes próprios de prompt e referências, mas herda o comportamento da Skill-mãe | Configuração de Skills, UX de chat (chips de moon dentro do template area) | `docs/handoff/PRODUCT_HANDOFF.md`:488, SPEC-007 |
| **Biblioteca** | **Base de conhecimento multimodal** compartilhada do sunOS. Armazena documentos (PDF, áudio, vídeo, imagem, texto) por escopo (*Suno* global ou por cliente), com tags e busca semântica via vetorização (pgvector). Alimenta automaticamente os agentes durante chat e workflows | Curadoria de conhecimento (admin), consumo via chat (auto-seleção por scope/tags) | `docs/handoff/PRODUCT_HANDOFF.md`:489, `app/biblioteca/` |
| **Workflow** | **Automação encadeada** que combina Skills, Tools e validações humanas em um fluxo executado por agendamento (cron) ou disparo manual. Compilado para LangGraph StateGraph. Exemplos prontos: *Report Mensal*, *Plano de Mídia*, *Monitor de Anomalias*, *Pesquisa de Mercado* | Automação de tarefas recorrentes, redução de trabalho manual de creators | `docs/handoff/PRODUCT_HANDOFF.md`:491, `app/workflows/` |

## 4. Papéis e Pessoas

| Termo | Definição | Contexto de Uso | Fonte |
|-------|-----------|-----------------|-------|
| **Sponsor** | **Patrocinador executivo único** do projeto sunOS. No caso, **José Augusto "Guga" Ketzer** (Fundador e Presidente da Suno United Creators). Detém a autoridade final sobre direção, orçamento e continuidade do projeto. Reúne-se semanalmente (terças) com Heitor Miranda | Decisões estratégicas, aprovações de orçamento, mudanças de escopo grandes | Q14, Parte 1 §3.1.1 |
| **Tutela técnica** | Responsabilidade pela **arquitetura, decisão técnica e direção estratégica** do projeto sunOS. Atribuída a **Heitor Miranda** (Diretor Executivo, Tecnologia e Dados para Marketing). Mandato formalizado em 24/02/2026 | Lidera time de desenvolvimento, escreve specs, conduz roadmap, presta contas ao sponsor | Q5, Q6, Q7a, Parte 1 §3.1.1 |
| **Patrocinador Sócio** | Sócio do grupo Suno United Creators que **patrocina o projeto sunOS sem atuação operacional**. Provê voz da sua área (Criação, Mídia, Financeiro) na evolução do produto, mas não executa entregas. Atualmente: Bruno Prosperi (Criação), Leonardo Yukio Takai (Mídia), Ronaldo Severino (CFO) | Validação estratégica, garantia de patrocínio cross-grupo | Confirmação ajustada Q19, Parte 1 §3.1.3 |
| **Champion** | Profissional embarcado em uma área de negócio (Criação, Mídia, Planejamento, etc.) que **direciona demandas, valida soluções e dissemina o uso do sunOS** dentro de sua área. Não é cargo técnico — é papel cultural. Necessário 1+ champion por área para escalar adoção sem sobrecarregar o time central | Identificação de oportunidades de Skills/Workflows, feedback de uso, treinamento informal | Transcrição reunião sobre sunOS (Heitor: *"tem que ter um champion em cada área"*), Parte 1 §3.1.4 |
| **Atendimento** | Função clássica de agência responsável pela **interface com o cliente** e gestão de contas. No contexto do sunOS, são consumidores potenciais (acessam Biblioteca, podem disparar Workflows de relatório) e fonte de input para configuração de Clientes/Planetas | Gestão de relacionamento, briefing, coordenação interdepartamental | Dossiê executivo, contexto de mercado |
| **Cliente** | No contexto do sunOS, **cliente** refere-se a **clientes da Suno** (Vivo, Americanas, Sicredi, etc.) — não a usuários do sunOS. Cada cliente é um Planeta no Sistema Solar. **Não confundir**: usuários do sunOS são creators internos | UX, configuração admin, escopo de Biblioteca | Parte 1 §3.3, `data/clients.ts` |
| **DPO (Data Protection Officer)** | Encarregado de proteção de dados, conforme LGPD. **Não existe formalmente na Suno** atualmente. Governance e privacidade são responsabilidade combinada do time do projeto sunOS e da Diretoria | Importante registrar a ausência: implica que decisões de privacidade são tomadas no nível do projeto, não delegadas a uma função especializada | Confirmação briefing (sem DPO), Parte 1 §3.4 |

## 5. Inteligência Artificial e Dados (em linguagem de negócio)

| Termo | Definição | Contexto de Uso | Fonte |
|-------|-----------|-----------------|-------|
| **LLM (Large Language Model)** | **Modelo de linguagem de grande escala** — software de IA capaz de entender e gerar texto, imagem, código ou outros formatos. No sunOS, são o "cérebro" por trás dos agentes. Modelos disponíveis: Gemini Flash (default), GPT-4o, Claude, Imagen 4 | Decisões de qual modelo usar para cada Skill | Generalidade do mercado, `lib/api.ts` |
| **System Prompt** | **Instrução-base** que define o comportamento da IA para uma Skill específica. É o "DNA" da Skill — o que torna o *Copy Social* diferente do *Plano de Mídia*. No sunOS, system prompts são **caixa-preta** (Seção 1) | Configuração de Skills, propriedade intelectual da Suno | `docs/handoff/PRODUCT_HANDOFF.md`:498 |
| **Agent / Agente** | **Instância de IA** que orquestra ferramentas (tools) e Skills para realizar uma tarefa. Diferente de um simples "chatbot" — um agente toma decisões sobre quais ferramentas usar, em que ordem. No sunOS: ContentCreator, VisualCreator, Conversational | Conversas no chat, execução de Workflows | `docs/handoff/PRODUCT_HANDOFF.md`:492, `api/chat/agents/` |
| **ReAct** | **Padrão de agente** (Reason + Act) — o agente alterna entre raciocinar sobre a tarefa e agir (chamar ferramentas, gerar texto). Padrão técnico adotado no sunOS para todos os agentes | Justifica por que respostas do sunOS levam alguns segundos: o agente está raciocinando entre passos | `docs/specs/large/sunohub-tools-integration/spec.md` |
| **RAG (Retrieval-Augmented Generation)** | Técnica em que a IA, antes de responder, **busca informação relevante** em uma base de conhecimento (no caso, a Biblioteca do sunOS). Faz a IA responder com fatos do contexto da Suno, não apenas com seu treinamento genérico | Toda interação com Biblioteca ativa é RAG por trás | `docs/handoff/PRODUCT_HANDOFF.md`, `api/chat/knowledge/` |
| **HITL (Human in the Loop)** | **Sistema de avaliação humana** dos outputs da IA. No sunOS, cada resposta da IA pode receber thumbs up/down, comentário, e cada sessão recebe rating (1-5). Esses dados alimentam a melhoria contínua de Skills e a avaliação de Champions/líderes sobre a qualidade da plataforma | Feedback loop, governança de qualidade, dados para evolução | `docs/handoff/PRODUCT_HANDOFF.md`:490 |
| **Eval (Avaliação)** | **Framework de mensuração de qualidade** das respostas da IA, em três camadas: (1) **Tracing** via MLflow (latência, tokens, routing); (2) **Trajectory** (o agente seguiu o fluxo correto?); (3) **Quality** (o output é bom para a Skill?) — com scorers customizados de tom, formato, routing e contexto | Garantia de qualidade técnica do sunOS, base para reportar ROI da plataforma | `docs/specs/large/sunohub-tools-integration/spec.md` |
| **MLflow** | **Plataforma de tracing e avaliação** de IA usada no sunOS. Captura cada interação com modelos para análise de custo, latência e qualidade | Operação técnica; relatórios de uso e custo | `docs/specs/large/sunohub-tools-integration/spec.md` |
| **LangGraph** | **Framework de orquestração de agentes** (StateGraph) usado no backend do sunOS. Permite construir fluxos complexos de IA com decisões e ramificações | Construção de Workflows e Skills compostas | `docs/handoff/PRODUCT_HANDOFF.md`:495 |
| **SSE (Server-Sent Events)** | **Protocolo de streaming** que permite ao chat do sunOS exibir respostas da IA palavra por palavra, ao vivo, em vez de esperar a resposta completa. Reduz a percepção de latência | Experiência de chat, justificativa de UX responsiva | `docs/handoff/PRODUCT_HANDOFF.md`:499 |

## 6. Frameworks e Pipeline de Documentação Koro

| Termo | Definição | Contexto de Uso | Fonte |
|-------|-----------|-----------------|-------|
| **BRD (Business Requirements Document)** | **Documento de Requisitos de Negócio**. Primeira etapa do pipeline de documentação Koro. Composto por 4 partes: Contexto (Parte 1), Glossário (Parte 2 — este documento), Requisitos de Negócio BR-XXX (Parte 3), Regras de Negócio RN-XXX (Parte 4) | Linha de base estratégica para qualquer projeto Koro | Skill `brd-koro`, este documento |
| **PRD (Product Requirements Document)** | **Documento de Requisitos de Produto**. Detalha Features, Personas, Jobs-to-be-Done, Requisitos Funcionais (FR-XXX), Roadmap. Posterior ao BRD | Camada de produto/UX | Skill `prd-koro` |
| **SRD (Solution Requirements Document)** | **Documento de Requisitos de Solução**. Detalha NFRs (ISO 25010), Domain Model, Data Model, Arquitetura As-Is e To-Be (C4), ADRs, APIs. **Toda discussão de stack, infraestrutura e tecnologia vai aqui — não no BRD** | Camada técnica/arquitetural | Skill `srd-koro`, instrução do briefing |
| **UX (Documentação de UX Koro)** | Quinto pilar do pipeline. Mapeia Inventário de Telas (T-XX), Arquitetura da Informação, Screen Specs, Design System e UI Specs | Camada de design e interface | Skill `ux-koro` |
| **SDD (Spec-Driven Development)** | **Metodologia de desenvolvimento orientado por especificações** já em uso ativo no projeto sunOS. Para cada feature significativa, gera 5 artefatos (Constitution, Spec, Design, Plan, Tasks) antes da implementação. Atualmente o sunOS tem 7 SPECs (SPEC-001 a SPEC-007) e mais 2 em rascunho (SPEC-002 video-generation e SPEC-003 image-editor) | Toda nova feature do sunOS deve passar por SDD antes de codificação | Skill `sdd-koro`, `docs/specs/` |
| **ADR (Architecture Decision Record)** | **Registro de Decisão Arquitetural**. Documenta uma decisão técnica significativa, suas alternativas avaliadas e consequências. O sunOS tem 2 ADRs aprovados (ADR-001 e ADR-002) | Documentação de decisões irreversíveis ou de alto impacto | `docs/adr/`, skill `adr-creator` |

## 7. Parceiros, Clientes e Tecnologias Externas

| Termo | Definição | Contexto de Uso | Fonte |
|-------|-----------|-----------------|-------|
| **Vertex AI** | **Plataforma de IA do Google Cloud** que disponibiliza modelos como Gemini, Imagen, Veo. É a principal plataforma de IA usada no sunOS | Integrações backend, custo de IA | `lib/api.ts`, `api/chat/tools/` |
| **Gemini Flash** | **Modelo de IA do Google** (família Gemini, versão Flash 2.5). É o modelo padrão do sunOS por relação custo-benefício favorável | Default para chat e geração de texto | `api/chat/`, PRODUCT_HANDOFF |
| **Lima** | **Parceiro externo** especializado em implementação Adobe (CDP, Salesforce stack). A Suno colabora com a Lima em projetos como MRV. Possível parceira de capacidade técnica complementar | Discussões de fusão "branca" (cultural, não jurídica), entrega conjunta a clientes | Transcrições de reuniões |
| **Nava** | **Parceiro externo** brasileiro de transformação digital (jornada de aplicativos, cibersegurança). Discussões em curso sobre parceria estratégica | Possível canal de venda da Suno em projetos onde tecnologia é a porta de entrada | Transcrições de reuniões |
| **Cliente (lista atual)** | Clientes ativos da Suno em 2026: **Vivo, Americanas, Sicredi, MRV, BMG, Cogna, Aramis, Hortifruti Natural da Terra, Hashdex, Cantu Pneus, Samsung, Stone (em prospecção)**. Via Suno/Paim: Renner, Grendene, Camicado | Referência ao escopo de Planetas no Sistema Solar | Dossiê executivo Guga Ketzer, transcrições |

---

## 10. Workflow & Governança (NOVA — Aprovação + Drive)

| Termo | Definição | Contexto de Uso | Fonte |
|-------|-----------|-----------------|-------|
| **Aprovação Hierárquica** | Fluxo no sunOS em que um asset finalizado pelo creator é submetido a um aprovador humano (superior direto) para decisão final, **após** passar por agentes de pré-validação. O sunOS materializa a hierarquia interna da Suno como dado configurável | Toda submissão `aguardando-aprovação` segue esta lógica | BR-017, RN-024, RN-026 |
| **Submissão para aprovação** | Ação em que o creator envia uma sessão/asset para o aprovador. Cria um `ApprovalRequest` que carrega o conteúdo, contexto, e Validation Report | UX, modelo de dados | BR-017, FR-160+ |
| **Pré-validação** | Conjunto de checagens automáticas executadas por agentes especializados ANTES de o asset chegar ao aprovador humano. Não substitui o aprovador — produz contexto estruturado para a decisão | Pipeline de aprovação | BR-017, RN-023 |
| **Validation Report** | Documento estruturado anexado a cada submissão, contendo o resultado de cada validator (status `passed | warning | failed | error`, evidências, sugestões). Visível ao aprovador e ao creator | UX da Approval Inbox | BR-017, RN-023 |
| **Brand Validator** | Agente especializado que valida o asset contra as Brand Guidelines do cliente (tom de voz, restrições visuais, vocabulário proibido). Requer Brand Guidelines curadas na Biblioteca como pré-requisito | Pipeline de pré-validação | BR-017, BR-004 |
| **Português Validator** | Agente especializado que valida ortografia, gramática, concordância e estilo do conteúdo em PT-BR | Pipeline de pré-validação | BR-017 |
| **Aprovador** | Pessoa humana com poder de decisão sobre uma submissão. Geralmente o superior direto do creator, configurável por área e cliente. **Sempre humano** — agentes nunca aprovam (RN-024) | Hierarquia organizacional, RBAC | BR-017, RN-024 |
| **Drive Sync** | Mecanismo que mantém a Biblioteca sincronizada com pastas autorizadas do Google Drive da Suno. Sempre **read-only** (sunOS lê do Drive, nunca escreve) | Integração Drive | BR-018, RN-027 |
| **Drive Cleanup Report** | Relatório semanal gerado por agentes que analisa a estrutura do Drive monitorado e sugere reorganização: duplicatas, conteúdo órfão, candidatos à curadoria. **Sugestivo** — humano executa | Curadoria assistida | BR-018, RN-029 |
| **Rubber-stamping** (anti-pattern) | Padrão tóxico em que o aprovador humano apenas "carimba" decisões sugeridas por IA, sem análise crítica. RN-024 e UX são desenhados para prevenir. Aprovador deve sentir-se decisor real | Princípio de design | RN-024, BR-010 |

---

## 8. Acrônimos e Siglas

| Sigla | Significado Completo | Definição rápida | Fonte |
|-------|---------------------|------------------|-------|
| **ADR** | Architecture Decision Record | Ver §6 | `docs/adr/` |
| **AI** | Artificial Intelligence | Inteligência artificial | Generalidade |
| **AOR** | Agency of Record | AgÃªncia oficial de um cliente em determinada disciplina (criação, mídia, etc.) | Setor publicitário |
| **API** | Application Programming Interface | Interface de comunicação entre softwares | Generalidade |
| **BRD** | Business Requirements Document | Ver §6 | Skill `brd-koro` |
| **BU** | Business Unit | Unidade de negócio | Generalidade |
| **CDP** | Customer Data Platform | Plataforma de unificação de dados de cliente (Adobe, Salesforce, Segment, etc.) | Setor martech |
| **CFO** | Chief Financial Officer | Diretor financeiro. No grupo: Ronaldo Severino | Generalidade |
| **CMO** | Chief Marketing Officer | Diretor de marketing. Persona-cliente do sunOS | Setor |
| **CRM** | Customer Relationship Management | Sistema de gestão de relacionamento com cliente (Salesforce, HubSpot, etc.) | Setor martech |
| **CTO** | Chief Technology Officer | Diretor de tecnologia | Generalidade |
| **DPO** | Data Protection Officer | Ver §4 | LGPD |
| **HITL** | Human in the Loop | Ver §5 | PRODUCT_HANDOFF |
| **IP** | Intellectual Property | Propriedade intelectual. Crítico no contexto Suno (*"vendemos ideias na essência"*) | Generalidade |
| **KPI** | Key Performance Indicator | Indicador de desempenho-chave. No sunOS: ver Parte 1 §2.3 | Generalidade |
| **LGPD** | Lei Geral de Proteção de Dados | Lei brasileira de privacidade (Lei 13.709/2018) | Brasil |
| **LLM** | Large Language Model | Ver §5 | Setor IA |
| **NPS** | Net Promoter Score | Indicador de satisfação. ENPS = versão para colaboradores. Suno: ENPS 66 | Generalidade |
| **PRD** | Product Requirements Document | Ver §6 | Skill `prd-koro` |
| **RAG** | Retrieval-Augmented Generation | Ver §5 | Setor IA |
| **RBAC** | Role-Based Access Control | Controle de acesso por papel (admin/creator no sunOS) | Generalidade |
| **ROI** | Return on Investment | Retorno sobre investimento. Justificativa central do sunOS | Generalidade |
| **SaaS** | Software as a Service | Modelo de software como serviço. **Não-escopo** do sunOS (uso interno) | Generalidade |
| **SDD** | Spec-Driven Development | Ver §6 | Skill `sdd-koro` |
| **SMB** | Small and Medium Businesses | Pequenas e médias empresas. Mercado-alvo do **Toolbox**, não do sunOS | Setor |
| **SRD** | Solution Requirements Document | Ver §6 | Skill `srd-koro` |
| **SSE** | Server-Sent Events | Ver §5 | Web/HTTP |

---

## 9. Termos a Evitar e Sinônimos Não-Oficiais

Esta seção registra **termos que devem ser evitados** dentro do projeto sunOS, e indica o termo oficial correspondente.

| Termo a evitar | Termo oficial | Razão |
|----------------|---------------|-------|
| Coro, Côro, Coro Creators | **Koro** ou **Koro Creators** | Confusão de transcrição. Sempre escrever com K |
| Funcionário (referindo-se à Suno) | **Creator** | Vocabulário institucional Suno |
| Agência interna de IA | **sunOS** | sunOS é produto, não agência |
| Departamento de IA | **Tutela técnica do sunOS** sob a área de Tecnologia e Dados para Marketing | Não há "departamento de IA" formal |
| Plataforma SaaS | **Plataforma interna** | sunOS é uso 100% interno; SaaS sugere comercialização |
| Cliente do sunOS | **Creator** (usuário interno) | "Cliente" no sunOS = cliente da Suno (Planeta), não usuário |
| Bot, ChatGPT, GPT (genérico) | **Agente** ou **Skill** | Bot/GPT é conotação técnica genérica; sunOS opera com agentes orquestrados |
| Banco de dados (referindo-se a Biblioteca) | **Biblioteca** | Biblioteca implica curadoria humana, não armazenamento bruto |
| Bioma (sem qualificador) | **Bioma Zero**, **Bioma Job** ou **Bioma Agentic** | "Bioma" sozinho é ambíguo. SPEC-005 trocou "BIOMAS" por "CLIENTES" no Sistema Solar; o termo "Bioma" hoje refere-se a **camadas organizacionais**, não a clientes |
| Funil tradicional | **Smart Growth** | Smart Growth é o funil incrementado próprio da Suno |
| AI agency / agência AI-native | **Agência ambidestra** | Posicionamento Guga: lado esquerdo (criatividade) + lado direito (tech) |

---

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-04-28 | Versão inicial. ~50 termos organizados em 7 seções temáticas + acrônimos + termos a evitar. Vocabulário proprietário Suno (Smart Growth, Bioma Zero/Job/Agenting, Inteligência Natural, Caixa-preta) catalogado com fonte. Estrutura do grupo (6 empresas) clarificada. Toolbox isolado como produto separado. **Koro** sempre com K (regra explícita) |
| 1.1 | 2026-04-28 | Correções de revisão do Heitor: (a) **Bioma Agenting → Bioma Agentic** em todo o documento (índice + §1); (b) **Inteligência Natural removida** do glossário; (c) **Ferrari na garagem movida** de §2 para §1 (vocabulário proprietário); (d) **Caixa-preta** redefinida como expressão informal do Guga, útil para tradução comunicacional (não como princípio rígido de arquitetura); (e) **SUP e SUPA removidas** do glossário; (f) **Paim e Revo separadas** em duas entradas distintas (eram tratadas como sinônimos por engano) — Revo marcada `[A validar]` por falta de definição precisa; (g) **Toolbox redefinido**: SaaS para clientes externos (grandes empresas + SMBs) com análises avançadas em martech/dados/BI — não é exclusivo de SMB |
| 1.2 | 2026-04-28 | **+10 termos** na nova **§10 Workflow & Governança** cobrindo features Aprovação (Aprovação Hierárquica, Submissão, Pré-validação, Validation Report, Brand Validator, Português Validator, Aprovador) e Drive (Drive Sync, Drive Cleanup Report) + anti-pattern Rubber-stamping. Pedido Guga + Bruno Prosperi |

---

<!-- REVIEW: Os termos cobrem o vocabulário que você precisa alinhar com Diretoria, sponsors e champions? Há algum termo proprietário Suno que não está aqui e deveria estar? Algum termo aqui está com definição imprecisa? -->

**Próximos passos**:
1. Revisar Parte 2 com Heitor Miranda
2. Validar termos proprietários da Suno com sponsor (Guga) e patrocinadores sócios — especialmente *Bioma Zero/Job/Agentic* e a definição precisa de **Revo** (atualmente marcada como `[A validar]`)
3. Iniciar Parte 3 (Requisitos de Negócio BR-XXX) — derivados dos Objetivos da Parte 1 (OBJ-01 a OBJ-05) e endereçando as Capacidades de Negócio da Parte 1 §4.2
4. Cada termo desta Parte 2 deve aparecer pelo menos uma vez nas Partes 3 e 4 (regra de consistência do pipeline Koro)
