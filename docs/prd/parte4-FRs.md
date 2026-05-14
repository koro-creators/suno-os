---
documento: PRD Parte 4 — Requisitos Funcionais (FR-XXX)
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
fonte_brd: docs/brd/parte3-requisitos.md, docs/brd/parte4-regras.md
fonte_prd: docs/prd/parte1-feature-map.md, docs/prd/parte2-personas-jtbd.md, docs/prd/parte3-matriz-persona-jornada.md
fonte_frd: FRD Moon Shot (FR-001 a FR-018, externo) — referenciado, não duplicado
total_frs: 60 (FR-100 a FR-159; FR-001 a FR-018 vivem no FRD Moon Shot)
---

# PRD Parte 4 — Requisitos Funcionais (FR-XXX)

## 1. Introdução

### 1.1. Contexto do Produto

O **sunOS** é o sistema operacional de IA da Suno United Creators — plataforma 100% interna que organiza Skills de IA, Biblioteca de conhecimento (Inteligência Coletiva), Workflows automatizados, agentes ReAct, motor de provocação criativa (Moon Shot) e governança institucional num único produto, navegado pela metáfora de Sistema Solar (Clientes como Planetas, Skills como Órbitas, Moons como sub-áreas). Atende ~300 Creators do grupo United Creators.

### 1.2. Objetivo deste Documento

Este documento é o **catálogo de Requisitos Funcionais (FR-XXX)** do sunOS — comportamentos observáveis e rastreáveis do produto que decompõem as 12 Features (FA-01 a FA-12, Parte 1), atendem as 5 Personas (PX-01 a PX-05, Parte 2) e suas 10 Jornadas (JN-01 a JN-10, Parte 3), e materializam os 16 BRs e 22 RNs do BRD.

**Linguagem RFC 2119**: cada FR usa **MUST** (obrigatório), **SHOULD** (altamente recomendado) ou **MAY** (opcional/condicional).

**Escopo deste documento**: cobre **comportamento de produto** (o que o sistema faz observável pelo usuário). NFRs (performance, segurança, ISO 25010), arquitetura, modelos de dados e ADRs vivem no **SRD**.

### 1.3. Relação com FRD Moon Shot (não-duplicação)

O **FRD Moon Shot** já especifica **FR-001 a FR-018** detalhando a feature FA-02 e parte de FA-01 (retrieval divergente). Esta Parte 4 do PRD:

- **NÃO duplica** FR-001 a FR-018 — referencia diretamente
- **Cobre os FRs ainda não detalhados** em FRD próprio, organizados em faixas separadas (FR-100 a FR-159)
- **Áreas cobertas aqui**: FA-01 Biblioteca (Curadoria, Caixa-preta), FA-03 Skills processuais, FA-04 Chat ReAct, FA-05 Workflows, FA-06 Sistema Solar, FA-07 HITL, FA-08 Multimodal, FA-09 Governança/RBAC, FA-10 Mensuração, FA-11 Safety cultural (não-Moon Shot), FA-12 Admin areas

| Faixa | Origem | Status |
|-------|--------|--------|
| FR-001 a FR-018 | FRD Moon Shot (externo) | Detalhado externamente — referenciar |
| FR-019 a FR-099 | Reservados para expansão futura do FRD Moon Shot | Reservado |
| **FR-100 a FR-159** | **Esta Parte 4 do PRD** | **Detalhado neste documento** |

### 1.4. Convenções

#### Termos RFC 2119

| Termo | Significado | Quando usar |
|-------|-------------|-------------|
| **MUST** | Obrigatório | Sem isso, o produto não funciona ou viola BR/RN crítico |
| **MUST NOT** | Proibido | Comportamento expressamente vetado (Caixa-preta, isolamento clientes) |
| **SHOULD** | Altamente recomendado | Pode ser adiado em casos extremos; impacta qualidade significativamente |
| **MAY** | Opcional/Condicional | Nice-to-have, ativável conforme contexto |

#### Nomenclatura

- **FR-XXX**: Requisito Funcional sequencial
- **FA-XX**: Feature (Parte 1)
- **PX-XX**: Persona (Parte 2)
- **JN-XX**: Jornada (Parte 3)
- **BR-XXX**: Requisito de Negócio (BRD Parte 3)
- **RN-XXX**: Regra de Negócio (BRD Parte 4)

#### Regra de rastreabilidade (validada)

- Cada FR deste documento mapeia para **≥1 BR + ≥1 FA**
- Cada FR cita **≥1 RN aplicável** quando há lógica decisional explícita
- FRs sem rastreabilidade foram cortados no draft

### 1.5. Relação com Outros Artefatos

| Artefato | Relação |
|----------|---------|
| BRD Parte 3 (BR-001 a BR-016) | Cada FR rastreia ≥1 BR (matriz §4) |
| BRD Parte 4 (RN-001 a RN-022) | RNs entram como gates ou comportamentos automatizados nos FRs |
| PRD Parte 1 (FA-01 a FA-12) | FRs agrupados por Feature (§3) |
| PRD Parte 2 (PX-01 a PX-05) | FRs especificam comportamento por Persona quando relevante |
| PRD Parte 3 (JN-01 a JN-10) | FRs aparecem como passos críticos das jornadas |
| FRD Moon Shot (FR-001 a FR-018) | Não duplicado; referenciado |
| SRD | NFRs ISO 25010 e arquitetura derivam destes FRs |

---

## 2. Visão Geral dos FRs

### 2.1. Resumo por Feature

| Feature | Faixa de FRs | Total | Personas Atendidas | Fase Principal |
|---------|--------------|-------|---------------------|----------------|
| FA-01 Biblioteca | FR-100 a FR-108 | 9 | PX-01 (primária), todas (indireto via Caixa-preta) | Protótipo |
| FA-03 Skills processuais | FR-109 a FR-115 | 7 | PX-03 (primária), PX-02, PX-04 | Protótipo |
| FA-04 Chat ReAct | FR-116 a FR-121 | 6 | Todas | Protótipo |
| FA-05 Workflows | FR-122 a FR-127 | 6 | PX-01, PX-03, PX-04 | Piloto |
| FA-06 Sistema Solar | FR-128 a FR-130 | 3 | Todas | Protótipo |
| FA-07 HITL | FR-131 a FR-134 | 4 | Todas | Protótipo |
| FA-08 Multimodal | FR-135 a FR-137 | 3 | PX-02, PX-03 | Piloto / MVP |
| FA-09 Governança/RBAC | FR-138 a FR-143 | 6 | Todas (transversal) | Piloto |
| FA-10 Mensuração | FR-144 a FR-150 | 7 | PX-01 (primária) | Piloto |
| FA-11 Safety cultural (não-Moon Shot) | FR-151 a FR-155 | 5 | PX-02, PX-05, PX-01 | Piloto |
| FA-12 Admin areas | FR-156 a FR-159 | 4 | PX-01 | Protótipo |
| **Subtotal Parte 4** | FR-100 a FR-159 | **60** | — | — |
| FA-02 Moon Shot (FRD externo) | FR-001 a FR-018 | 18 (referenciados) | PX-02, PX-04, PX-05 | POC → Piloto |
| **Total combinado** | — | **78** | — | — |

### 2.2. Resumo por Fase

| Fase | Quantidade FRs (Parte 4) | Features envolvidas | Criticidade |
|------|--------------------------|---------------------|-------------|
| **POC** | (FRs do FRD Moon Shot) | FA-02 | Core externa |
| **Protótipo** | ~30 (FA-01, FA-03, FA-04, FA-06, FA-07, FA-12) | Base operacional | Core |
| **Piloto** | ~24 (FA-05, FA-08, FA-09, FA-10, FA-11) | Cobertura completa | Core + Importante |
| **MVP** | ~6 refinamentos (FA-08 video, métricas avançadas) | Refinamento | Refinado |

### 2.3. Resumo por Criticidade

| Criticidade | Quantidade | Percentual | Observação |
|-------------|------------|------------|------------|
| **Core** | ~38 | ~63% | Sem isso, BR primário falha |
| **Importante** | ~18 | ~30% | Pode ser adiado mas impacta qualidade |
| **Nice-to-have** | ~4 | ~7% | Refinamentos pós-MVP |

---

## 3. Catálogo de FRs por Feature

### 3.1. FA-01 — Biblioteca (Inteligência Coletiva)

> Cobre os FRs de **curadoria, ingestão, indexação, escopo, visibilidade e detecção de risco**. FRs de retrieval divergente para Moon Shot vivem no FRD externo.

---

#### FR-100 — Ingestão multimodal de itens da Biblioteca

**Descrição**

O sistema MUST permitir ingestão de KnowledgeItems nos formatos PDF, DOCX, TXT, áudio (mp3/wav/m4a), vídeo (mp4/mov), imagem (jpg/png/webp) e texto direto, processando-os automaticamente em background com transcrição (áudio/vídeo via Whisper-equivalente), captioning (imagem) e chunking + embedding (vetorial pgvector). O sistema SHOULD notificar o Líder/Curador (PX-01) quando o processamento termina e o item está disponível para retrieval.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-004 (Repositório institucional unificado), BR-006 (Acesso democrático) |
| **JTBD associado** | "Curadoria contínua" (PX-01 implícito); JTBD-27 (PX-05) consome indiretamente |
| **Jornada(s)** | JN-01 (Curadoria), JN-05 (Captura pré-saída) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Upload via UI Admin (`/biblioteca`) | Edição colaborativa em tempo real (não é Google Docs) |
| Validação de formato e tamanho máximo | Indexação de conteúdo confidencial sem aprovação (BR-008) |
| Processamento background com status visível | Substituir CRMs/ERPs do grupo (BR-016) |

**Atores / Personas**

- PX-01 Líder/Curador — executor primário
- PX-02, PX-03, PX-04, PX-05 — beneficiários indiretos via Caixa-preta

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-01 (primária), FA-12 (UX), FA-08 (transcrição/caption) | Curadoria + UX + multimodal |
| **Objetos** | KnowledgeItem, Embedding, AccessLog | Entidades manipuladas |

**Regras de Negócio Associadas**

- RN-006 — validação de metadados (FR-101 detalha)
- RN-013 — retenção e descarte LGPD

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Core |
| **Status** | Em Produção (SPEC-002 knowledge-biblioteca-v2) |

---

#### FR-101 — Validação de metadados obrigatórios na ingestão

**Descrição**

O sistema MUST bloquear a ingestão de KnowledgeItem se algum dos metadados obrigatórios estiver ausente ou inválido: **título** (não vazio), **domínio** ∈ {cliente, indústria, cultura, metodologia, referência}, **≥2 tags**, **descrição ≥50 caracteres**, e **cliente associado** quando o item for cliente-específico. O sistema MUST exibir mensagem clara identificando qual campo está incompleto e MUST NOT enfileirar o item para indexação até que os metadados estejam completos.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-004 (Biblioteca curada com qualidade) |
| **JTBD associado** | Curadoria de PX-01 |
| **Jornada(s)** | JN-01 (passo 3-4) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Validação síncrona no momento do submit | Sugestão automática de tags (FR-103, MAY) |
| Mensagens de erro por campo | Aprovação manual por Admin (não há workflow de revisão neste estágio) |

**Atores / Personas**

- PX-01 Líder/Curador

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-01, FA-12 | Curadoria + UX |
| **Objetos** | KnowledgeItem, Tag, Scope | Validação |

**Regras de Negócio Associadas**

- RN-006 — Validação de metadados (texto integral no BRD Parte 4)

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Core |
| **Status** | Em Produção parcial — completar validação de descrição ≥50 char |

---

#### FR-102 — Indexação dual (vetorial + grafo) automática

**Descrição**

Após validação dos metadados (FR-101), o sistema MUST executar indexação dual em background: **(a) chunking + embedding vetorial** persistido em pgvector com metadados anexos (scope, tags, cliente, domínio), e **(b) inserção no grafo de conhecimento** com nós (KnowledgeItem) e arestas (relações por tag, cliente compartilhado, similarity threshold). O sistema MUST tornar o item disponível para retrieval por Skills (FR-110) e por retrieval divergente do Moon Shot (FRD externo) em ≤5 minutos após upload típico (PDF <10MB).

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-004, BR-006, BR-015 (integração com Skills) |
| **Jornada(s)** | JN-01 (passo 5), JN-02, JN-03 (consumo) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Chunking inteligente (tokens, sentenças) | Re-indexação manual por usuário (Admin pode disparar via FR-159) |
| Status visível de processamento | Garantia de tempo de indexação para arquivos > 100MB |

**Atores / Personas**

- Sistema (background)
- PX-01 monitora status

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-01 | Indexação |
| **Objetos** | KnowledgeItem, Embedding, KnowledgeGraph | Indexação dual |

**Regras de Negócio Associadas**

- (operacional, sem RN específico — derivada do FRD §FA-01)

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Core |
| **Status** | Em Produção parcial — grafo a evoluir |

---

#### FR-103 — Sugestão automática de tags por similaridade

**Descrição**

O sistema MAY sugerir tags ao Líder/Curador no momento de ingestão, baseando-se em embedding similarity com KnowledgeItems existentes (top-N=5 mais similares), apresentando tags mais frequentes desses itens como sugestões aceitáveis com um clique. A sugestão NÃO substitui a validação obrigatória do FR-101 — o usuário ainda MUST aprovar ou editar.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-004 (qualidade da curadoria), BR-006 |
| **Jornada(s)** | JN-01 (passo 3) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Sugestões editáveis | Auto-aplicação sem confirmação |

**Atores / Personas**

- PX-01

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-01, FA-12 | Curadoria assistida |
| **Objetos** | Tag, Embedding | Sugestão |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | MVP |
| **Criticidade** | Nice-to-have |
| **Status** | Proposed |

---

#### FR-104 — Filtragem por escopo Suno global vs. Cliente

**Descrição**

O sistema MUST filtrar a visualização e o retrieval da Biblioteca por escopo: KnowledgeItems com `scope = "suno"` MUST ser elegíveis para retrieval em qualquer cliente; KnowledgeItems com `scope = client_slug` MUST ser elegíveis apenas quando o cliente correspondente está ativo na sessão. Quando uma Skill está ativa em contexto de Cliente A, a injeção MUST combinar conteúdo Suno global + conteúdo do Cliente A, **nunca** do Cliente B (ver FR-141).

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-004, BR-006, BR-008 (privacidade clientes) |
| **Jornada(s)** | JN-03 (execução com Skill), JN-04, JN-09 |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Filtragem hierárquica (Suno + cliente ativo) | Compartilhamento explícito entre clientes (existe via tag "cross-client" peso 0.4 — RN-010) |
| Visibilidade no Admin filtrada por escopo do Líder | Customização por subdomínio do cliente |

**Atores / Personas**

- PX-01 (curadoria)
- PX-03 (consumo via Skill)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-01, FA-03 | Filtragem |
| **Objetos** | Scope, Client, KnowledgeItem | Filtragem |

**Regras de Negócio Associadas**

- RN-010 — isolamento entre clientes (FR-141 detalha)

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Core |
| **Status** | Em Produção |

---

#### FR-105 — Visibilidade por status do Cliente (ativo/inativo)

**Descrição**

O sistema MUST seguir o status do Cliente ao decidir visibilidade dos KnowledgeItems associados: SE cliente = "ativo", o conteúdo MUST aparecer no Sistema Solar (FA-06) e em retrievals padrão; SE cliente = "inativo", o conteúdo MUST ser ocultado do Sistema Solar e dos retrievals padrão **mas preservado na Biblioteca**, sendo recuperável apenas por Líder via busca explícita no Admin (`/biblioteca`).

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-005 (Continuidade pós-turnover de cliente) |
| **Jornada(s)** | JN-01, JN-05 |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Toggle de status no `/clientes` reflete imediatamente | Auto-arquivamento por inatividade temporal |

**Atores / Personas**

- PX-01

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-01, FA-06, FA-12 | Visibilidade |
| **Objetos** | Client, KnowledgeItem | Status-driven visibility |

**Regras de Negócio Associadas**

- RN-007 — visibilidade por status

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Importante |
| **Status** | Proposed |

---

#### FR-106 — Detecção de "conhecimento crítico em risco"

**Descrição**

O sistema MUST executar avaliação periódica (diária) sobre AccessLog dos últimos 90 dias para identificar KnowledgeItems críticos (cliente ativo, regras de negócio, guidelines) acessados ou contribuídos por **uma única pessoa**. Quando detectado, o sistema MUST registrar uma flag "risco de saída" no KnowledgeItem e SHOULD enviar alerta resumido semanal ao Líder/Curador da área. SE a única pessoa for de alta seniority OU long-tenure, o sistema MUST escalar o alerta com prioridade alta.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-005 (Continuidade pós-turnover) |
| **JTBD associado** | JTBD-01 (PX-01) |
| **Jornada(s)** | JN-05 (Captura pré-saída) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Job batch diário | Detecção em tempo real (não é necessário) |
| Alertas agregados semanais | Escalação automática a RH (futuro, depende de integração) |

**Atores / Personas**

- Sistema (background)
- PX-01 (consumidor do alerta)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-01, FA-10 | Detecção + AccessLog |
| **Objetos** | KnowledgeItem, AccessLog, User | Detecção |

**Regras de Negócio Associadas**

- RN-008 — Detecção de conhecimento crítico em risco (thresholds pendentes — PA-08)

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Importante |
| **Status** | Proposed — aguarda calibração de thresholds (PA-08) |

---

#### FR-107 — Versionamento de KnowledgeItems editados

**Descrição**

Quando um Líder edita o conteúdo ou os metadados de um KnowledgeItem existente, o sistema MUST persistir a versão anterior (snapshot) com timestamp e user_id, mantendo histórico acessível via Admin (`/biblioteca` drawer). O sistema MUST re-executar indexação dual (FR-102) sobre a versão atual ao salvar.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-007 (auditabilidade da curadoria), BR-009 (auditabilidade) |
| **Jornada(s)** | JN-01, JN-08 (auditoria) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Histórico textual e de metadados | Diff visual sofisticado (apresentação simples basta) |

**Atores / Personas**

- PX-01

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-01, FA-12 | Versionamento |
| **Objetos** | KnowledgeItem, KnowledgeItemVersion | Histórico |

**Regras de Negócio Associadas**

- RN-012 — auditabilidade de acessos administrativos

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Importante |
| **Status** | Proposed |

---

#### FR-108 — Política de retenção LGPD para Biblioteca

**Descrição**

O sistema MUST aplicar política de retenção definida para KnowledgeItems e seus AccessLogs: por padrão, retenção ativa de 12 meses, transição automática para armazenamento frio após esse período. Para KnowledgeItems contendo dados pessoais identificáveis de cliente, o sistema MUST aplicar política específica aprovada pela Diretoria (em construção — PA-02/PA-07). Toda chamada de descarte ou movimentação para frio MUST gerar log de auditoria.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-008 (privacidade clientes), BR-009 (auditabilidade) |
| **Jornada(s)** | JN-08 (governança) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Job batch mensal de retenção | Anonimização automática (definida caso a caso) |

**Atores / Personas**

- Sistema
- PX-01 (auditoria)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-01, FA-09, FA-10 | Retenção + auditoria |
| **Objetos** | RetentionPolicy, KnowledgeItem, AccessLog | Política |

**Regras de Negócio Associadas**

- RN-013 — Retenção LGPD

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Core (compliance) |
| **Status** | Proposed — aguarda política Diretoria (PA-07) |

---

### 3.2. FA-03 — Skills Processuais com Contexto Automático

> Cobre comportamento das **Skills convergentes**: catálogo, context injection, Moons, hierarquia de truncamento, scoring HITL, avaliação mensal de saúde.

---

#### FR-109 — Catálogo navegável de Skills por Cliente

**Descrição**

O sistema MUST exibir, no Sistema Solar (FA-06) ao selecionar um Cliente (Planeta), as Skills atribuídas a esse Cliente como Órbitas. Cada Skill MUST exibir nome, descrição curta, ícone, tipo (criação/mídia/planejamento) e Score HITL agregado (FR-133). O sistema MUST oferecer ≤3 cliques desde o Sun até a entrada no Chat com Skill ativa.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-002, BR-006, BR-015 |
| **JTBD associado** | JTBD-14, JTBD-16 (PX-03) |
| **Jornada(s)** | JN-03 (passo 1) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Navegação Sun → Planeta → Órbita → Chat | Sincronização tempo real com Admin de Clientes (ADR-002) |
| Score HITL visível na SkillCard | Marketplace de Skills (não-escopo) |

**Atores / Personas**

- PX-02, PX-03, PX-04, PX-05

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-03, FA-06 | Catálogo + navegação |
| **Objetos** | Skill, Client, SkillScore | Exibição |

**Regras de Negócio Associadas**

- RN-003 — princípio ≤3 cliques (compartilhado com Moon Shot)

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Core |
| **Status** | Em Produção |

---

#### FR-110 — Context injection automática a partir da Biblioteca

**Descrição**

Quando o usuário envia mensagem em uma Skill ativa, o sistema MUST executar retrieval automático na Biblioteca (FA-01) usando a tool `search_knowledge`, filtrando por: (a) scope `suno` + scope do cliente ativo (FR-104), (b) tags configuradas na Skill, (c) embedding similarity com a mensagem do usuário. O contexto recuperado MUST ser injetado no prompt do agente **sem ação do operador** (transparente — Caixa-preta para Operacional). O sistema MUST aplicar a hierarquia de truncamento do FR-111 quando o contexto recuperado excede o context window do modelo ativo.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-002, BR-006, BR-015 |
| **JTBD associado** | JTBD-11 (PX-02), JTBD-14 (PX-03), JTBD-23 (PX-04) |
| **Jornada(s)** | JN-03 (passo 4) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Retrieval transparente | Citação visível dos KnowledgeItems para Operacional (Caixa-preta — FR-140) |
| Logs de context injection para auditoria | Configuração manual de retrieval por mensagem (futuro, MAY) |

**Atores / Personas**

- Sistema (background)
- PX-03, PX-02, PX-04, PX-05 (consumo invisível)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-03 (primária), FA-01 (consumo), FA-04 (entrega via Chat) | Context injection |
| **Objetos** | Skill, KnowledgeItem, ContextDocument, Embedding | Retrieval |

**Regras de Negócio Associadas**

- RN-010 — isolamento entre clientes
- RN-011 — Caixa-preta para Operacional
- RN-021 — hierarquia de truncamento (FR-111)

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Core |
| **Status** | Em Produção |

---

#### FR-111 — Hierarquia de truncamento de contexto

**Descrição**

Quando a injeção de contexto (FR-110) excede o context window do modelo ativo, o sistema MUST truncar começando pelas categorias de menor peso até caber, na ordem: **Referências gerais (peso 0.2) → Contexto de mercado (0.4) → Histórico de campanhas (0.6) → Guidelines de marca (0.8)**. As **Regras de negócio do cliente (peso 1.0) MUST sempre ser incluídas**. Se truncamento atingir peso ≥0.6, o sistema MUST registrar warning de "qualidade potencialmente comprometida" no trace MLflow. Se truncamento atingir peso 1.0 (Regras de negócio), o sistema MUST abortar a execução e alertar o Líder.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-006, BR-015 |
| **Jornada(s)** | JN-03 (transversal) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Pesos por categoria configuráveis em código | Configuração de pesos pelo Líder no Admin (futuro) |
| Logs de warning visíveis no dashboard de qualidade | Truncamento automático com aviso ao Operador (silencioso) |

**Atores / Personas**

- Sistema
- PX-01 (consumidor de alertas)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-03, FA-01, FA-10 | Truncamento + auditoria |
| **Objetos** | ContextDocument, ModelConfig | Truncamento |

**Regras de Negócio Associadas**

- RN-021 — Hierarquia de truncamento (texto integral no BRD Parte 4)

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Core |
| **Status** | Proposed |

---

#### FR-112 — Moons (sub-áreas configuráveis por Skill)

**Descrição**

Cada Skill MUST suportar definição de N Moons (sub-áreas) que aparecem como **chips selecionáveis** no PromptTemplateBar do Chat (FA-04). Selecionar um Moon MUST ajustar o system prompt efetivo da Skill com instruções específicas da sub-área (ex: Copy Social → Feed/Carrossel, Stories/Reels, X/Twitter), preservando a base do system prompt da Skill. O sistema MUST permitir múltipla seleção quando aplicável.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-002, BR-015 |
| **Jornada(s)** | JN-03 (passo 2) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Chips no PromptTemplateBar | Páginas dedicadas por Moon (eliminadas em SPEC-007) |

**Atores / Personas**

- PX-03 (uso primário), PX-02, PX-04
- PX-01 (configuração via Admin — FR-156)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-03, FA-04, FA-12 | Moons |
| **Objetos** | Skill, Moon | Hierarquia |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Importante |
| **Status** | Em Produção |

---

#### FR-113 — Versionamento de system prompts

**Descrição**

O sistema MUST persistir histórico versionado dos system prompts de cada Skill. Cada edição via Admin (FR-156) MUST gerar nova versão com timestamp, user_id e diff opcional. O sistema MUST permitir rollback para versão anterior por Admin. Operacional MUST NOT ter acesso ao system prompt em qualquer versão (RN-009/RN-011 — Caixa-preta).

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-007 (proteção IP), BR-009 (auditabilidade) |
| **JTBD associado** | JTBD-02 (PX-01) |
| **Jornada(s)** | JN-10 (config Skill) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Histórico textual + rollback | Branching de prompts (não-escopo) |

**Atores / Personas**

- PX-01 (configuração e auditoria)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-03, FA-09, FA-12 | Versionamento + RBAC |
| **Objetos** | Skill, SystemPrompt, SystemPromptVersion | Histórico |

**Regras de Negócio Associadas**

- RN-009 (RBAC), RN-011 (Caixa-preta), RN-012 (auditoria)

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Core |
| **Status** | Em Produção parcial |

---

#### FR-114 — Avaliação mensal automática de saúde de Skill

**Descrição**

No início de cada mês, o sistema MUST calcular para cada Skill ativa, sobre o mês anterior: (a) **redução média de tempo** (custo evitado calculado pelo FR-149) vs. baseline, (b) **score HITL agregado** (FR-133), (c) **volume de execuções**. SE a redução de tempo do mês ≥30% E score HITL não regrediu >10% mês a mês, marcar como "skill saudável". SE redução <30% por 2 meses consecutivos OU score HITL regrediu >10%, disparar alerta de revisão para o Líder/Curador.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-002 (aceleração mantida) |
| **JTBD associado** | JTBD-07 (PX-01) |
| **Jornada(s)** | JN-08 (governança) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Job batch mensal | Decisão automática de deprecação (humano decide) |
| Dashboard com Skills "em revisão" | Re-treinamento automático de prompt |

**Atores / Personas**

- Sistema
- PX-01

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-03, FA-10 | Avaliação |
| **Objetos** | Skill, SkillScore, ExecutionMetric, TimeBaseline | Avaliação |

**Regras de Negócio Associadas**

- RN-004 — Avaliação mensal de redução de tempo

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Importante |
| **Status** | Proposed |

---

#### FR-115 — Bloqueio de execução sem cliente quando exigido

**Descrição**

Skills que exigem contexto de cliente (configuradas com `require_client = true` no Admin) MUST bloquear execução quando nenhum Cliente está ativo na sessão, exibindo mensagem clara solicitando seleção de Cliente. Skills `require_client = false` (genéricas, ex: Brief Builder não-cliente-específico) MAY operar com contexto Suno global apenas.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-008 (privacidade — evita output sem contexto), BR-015 |
| **Jornada(s)** | JN-03 |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Validação no momento de envio de mensagem | Sugestão automática de Cliente baseado em texto |

**Atores / Personas**

- PX-03

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-03, FA-04 | Validação |
| **Objetos** | Skill, Client | Validação |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Importante |
| **Status** | Em Produção parcial |

---

### 3.3. FA-04 — Chat com Agentes ReAct (streaming SSE)

> Cobre comportamento da **interface conversacional**: streaming, ModelSelector, agentes ReAct, variações, Social Preview, Context Sidebar.

---

#### FR-116 — Streaming SSE multi-modelo

**Descrição**

O sistema MUST entregar respostas do agente via streaming SSE em tempo real (token a token ou chunk a chunk), exibindo indicador visual de modelo ativo (StreamingIndicator com nome do modelo). O usuário MUST conseguir interromper a geração a qualquer momento. Em caso de erro de streaming, o sistema MUST exibir mensagem clara e oferecer retry sem perder o contexto da sessão.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-002, BR-006 |
| **Jornada(s)** | JN-02, JN-03, JN-04, JN-06 (transversal) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| SSE com Gemini Flash, GPT-4o, Claude | Persistência de conversas entre sessões (débito P1, FR a futuro) |
| Indicador de modelo ativo | Roteamento automático multi-modelo (decisão humana via ModelSelector) |

**Atores / Personas**

- Todas

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-04 | Streaming |
| **Objetos** | ChatSession, Message, Agent, ModelChoice | Streaming |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Core |
| **Status** | Em Produção |

---

#### FR-117 — ModelSelector por mensagem

**Descrição**

O usuário MUST conseguir trocar o modelo ativo (Gemini Flash default; Gemini Pro, GPT-4o, Claude alternativas) **a qualquer mensagem** via dropdown discreto adjacente ao input do Chat. A escolha MUST ser persistida na sessão até troca explícita. O sistema MUST registrar o modelo usado em cada mensagem no trace MLflow (FR-145).

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-002, BR-009 (auditabilidade) |
| **Jornada(s)** | JN-02, JN-03, JN-04 |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Dropdown por mensagem | Roteamento automático (decisão de produto: humano escolhe) |

**Atores / Personas**

- PX-02, PX-03, PX-04 (PX-05 vê opção mas pode esconder por default — RN-017 visible reasoning hidden) |

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-04, FA-10 | Seleção + tracing |
| **Objetos** | Message, ModelChoice | Configuração |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Importante |
| **Status** | Em Produção |

---

#### FR-118 — Variações automáticas (3 opções comparativas)

**Descrição**

Quando o usuário solicita "variar" um output da IA, o sistema MUST gerar 3 variações comparativas em paralelo, exibindo-as lado a lado para escolha. Cada variação MUST manter o contexto injetado (FR-110) e ser marcada individualmente como estímulo (RN-014, FR-152). O usuário MUST conseguir estrelar/comentar/promover qualquer variação independentemente.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-002 (eficiência sem custo cognitivo extra) |
| **Jornada(s)** | JN-03 (passo 8) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| 3 variações em paralelo | A/B testing automático (não é o escopo) |

**Atores / Personas**

- PX-02, PX-03

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-04 | Variações |
| **Objetos** | Variation, Message | Comparação |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Importante |
| **Status** | Em Produção |

---

#### FR-119 — Social Preview para Copy Social

**Descrição**

Para outputs gerados pela Skill Copy Social, o sistema MUST renderizar pré-visualização Instagram realista (Feed, Carrossel, Stories, Reels, X/Twitter conforme Moon ativo — FR-112) lado a lado com o texto. O preview MUST refletir formatação real (caracteres por linha, emoji, hashtags). Geração de imagem real (Phase 16, FA-08) MUST integrar quando disponível.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-002 (aceleração visual), BR-010 (preview reduz iteração) |
| **Jornada(s)** | JN-03 (passo 6) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Preview por Moon | Edição visual no preview |
| Marcação como estímulo no preview (RN-014) | Substituir Adobe/Canva |

**Atores / Personas**

- PX-03, PX-02

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-04, FA-08 | Preview |
| **Objetos** | Variation, Moon | Preview |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Importante |
| **Status** | Em Produção (texto); Phase 16 para imagem real |

---

#### FR-120 — Context Sidebar com seções colapsíveis

**Descrição**

O Chat MUST exibir Context Sidebar à direita com seções colapsíveis: (a) **Biblioteca** (visível apenas para Admin/Líder — RN-011 oculta para Operacional), (b) **Agentes** (lista de agentes ativos na sessão), (c) **Validação HITL** (progress bar de feedbacks dados na sessão). Cada seção MUST ser expansível/colapsível com persistência da preferência por usuário.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-006 (acesso adaptado por perfil), BR-007 (Caixa-preta) |
| **Jornada(s)** | JN-02, JN-03, JN-08 |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Seções colapsíveis com persistência | Sincronização cross-device |

**Atores / Personas**

- Todas (com filtragem por perfil)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-04, FA-09, FA-07 | Sidebar |
| **Objetos** | ChatSession, User | Estado UI |

**Regras de Negócio Associadas**

- RN-011 — Caixa-preta para Operacional (FR-140)

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Importante |
| **Status** | Em Produção |

---

#### FR-121 — Persistência de conversas entre sessões

**Descrição**

O sistema MUST persistir todas as ChatSessions com mensagens, modelo usado, Skill/Cliente/Moon ativos e feedbacks HITL, recuperáveis pelo usuário em retorno futuro. O usuário MUST conseguir buscar conversas anteriores por título, cliente ou data. A persistência MUST respeitar política de retenção LGPD (FR-108, RN-013).

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-002 (continuidade), BR-009 (auditabilidade), BR-015 |
| **Jornada(s)** | Todas |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Recuperação completa | Sincronização tempo real entre dispositivos do mesmo usuário |

**Atores / Personas**

- Todas

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-04, FA-10 | Persistência |
| **Objetos** | ChatSession, Message | Persistência |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Core (atualmente débito P1) |
| **Status** | Proposed — débito reconhecido em PRODUCT_HANDOFF.md |

---

### 3.4. FA-05 — Workflows Automatizados

> Cobre **builder visual, schedule, sub-workflows, HITL gates, integrações**.

---

#### FR-122 — Builder visual de Workflow com steps configuráveis

**Descrição**

O sistema MUST oferecer interface visual no Admin (`/workflows`) para compor Workflows como sequência de steps. Cada step MUST ser de um dos tipos: **(a) Tool** (search_knowledge, call_api, send_webhook, search_web), **(b) LLM** (executa Skill com prompt parametrizado), **(c) Condição** (branch SE/ENTÃO baseado em saída anterior), **(d) Ação** (publica, notifica, salva), **(e) HITL gate** (pausa para revisão humana — FR-126). O usuário MUST conseguir reordenar, editar e remover steps sem perder dados intermediários.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-002 (automação sem fila de eng) |
| **JTBD associado** | JTBD-06 (PX-01), JTBD-15, JTBD-18 (PX-03) |
| **Jornada(s)** | JN-07 (passos 1-6) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Composição visual sequencial | Drag-and-drop visual de agentes (ADR-001 — não é esse o escopo) |
| Validação básica de configuração por step | Substituir Zapier/n8n (BR-016) |

**Atores / Personas**

- PX-01, PX-03, PX-04

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-05, FA-12 | Builder |
| **Objetos** | Workflow, Step | Composição |

**Regras de Negócio Associadas**

- RN-022 — avaliação de duplicidade vs. mercado (FR-127)

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Core |
| **Status** | Em Produção (SPEC-003) |

---

#### FR-123 — Compilação para LangGraph StateGraph

**Descrição**

Ao salvar um Workflow, o sistema MUST compilar a definição de steps para LangGraph StateGraph executável, validando consistência (refs entre steps, tipos de saída, dependências). SE houver inconsistência, MUST bloquear salvamento e exibir erro específico. SE compilação OK, Workflow MUST ficar imediatamente disponível para execução manual ou agendada (FR-124).

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-002, BR-015 |
| **Jornada(s)** | JN-07 (passo 6) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Validação de compilação | Engine alternativa (LangGraph é decisão arquitetural — ADR-002) |

**Atores / Personas**

- Sistema (background)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-05 | Engine |
| **Objetos** | Workflow, Step, Execution | Compilação |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Core |
| **Status** | Em Produção |

---

#### FR-124 — Schedule humanizado via Cloud Scheduler

**Descrição**

O usuário MUST conseguir configurar schedule de execução em linguagem humanizada ("Toda segunda às 9h", "Dia 1 do mês às 8h", "A cada 2 horas em horário comercial"). O sistema MUST converter para expressão cron e configurar Cloud Scheduler. SE expressão inválida, MUST exibir erro claro com sugestões. O usuário MUST conseguir pausar/retomar/desativar schedule sem deletar o Workflow.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-002 |
| **Jornada(s)** | JN-07 (passo 4) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Linguagem humanizada simples | Schedule complexo multi-condicional (futuro) |

**Atores / Personas**

- PX-01, PX-03, PX-04

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-05, FA-12 | Schedule |
| **Objetos** | Workflow, Schedule | Configuração |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Core |
| **Status** | Em Produção parcial — Cloud Scheduler real pendente |

---

#### FR-125 — Encadeamento de Workflows (sub-workflows)

**Descrição**

O sistema MUST permitir que um Workflow chame outro Workflow como sub-workflow (step do tipo "sub_workflow"), passando inputs e recebendo outputs. SubWorkflows MUST executar em contexto próprio mas compartilhar tracing/logs com o Workflow pai. O sistema MUST detectar e bloquear loops circulares (Workflow A chama B chama A).

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-002 (modularidade) |
| **Jornada(s)** | JN-07 (variantes complexas como Pesquisa de Mercado — JTBD-20) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Encadeamento simples + detecção de loop | Profundidade ilimitada (limitar a 5 níveis) |

**Atores / Personas**

- PX-01, PX-04

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-05 | Encadeamento |
| **Objetos** | Workflow, SubWorkflow | Modularidade |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Importante |
| **Status** | Em Produção (SPEC-004) |

---

#### FR-126 — HITL gate em Workflow (pausa para revisão humana)

**Descrição**

Step do tipo HITL gate MUST pausar a execução do Workflow no ponto configurado, persistir o estado intermediário, notificar o(s) revisor(es) humano(s) configurado(s) (e-mail + UI badge) e aguardar decisão (aprovar/rejeitar/editar). SE timeout configurado for atingido sem decisão, MUST seguir comportamento default ("escalar" ou "abortar"). Toda decisão humana MUST ser registrada no trace com timestamp, user_id e justificativa opcional.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-002, BR-007 (governança), BR-009 (auditabilidade) |
| **Jornada(s)** | JN-07 (passo 9) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Notificação por e-mail + UI | Notificação via Slack/Teams (futuro, MAY) |
| Audit trail completo | Edição complexa do output no gate (apenas decisão binária + comentário) |

**Atores / Personas**

- PX-01, PX-03 (revisores)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-05, FA-07 | HITL gate |
| **Objetos** | Workflow, HITLGate, Execution | Pausa |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Core |
| **Status** | Em Produção parcial |

---

#### FR-127 — Avaliação de duplicidade vs. ferramentas adotadas

**Descrição**

Ao criar Workflow novo (FR-122), o sistema SHOULD apresentar checklist no Admin perguntando se a funcionalidade duplica ferramenta de mercado já adotada (Adobe Creative Cloud, Sprinklr, Canva, Salesforce, etc.). SE Líder confirma duplicidade, MUST exigir justificativa textual de value-add diferencial antes de salvar. Trimestralmente, o sistema MUST gerar lista de Workflows com flag de duplicidade para revisão estratégica.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-016 (não substituir ferramentas adotadas) |
| **Jornada(s)** | JN-07 (passo 1-2) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Checklist + justificativa | Detecção automática de duplicidade (humano avalia) |

**Atores / Personas**

- PX-01

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-05, FA-12 | Governança |
| **Objetos** | Workflow, ToolDuplicityFlag | Governança |

**Regras de Negócio Associadas**

- RN-022 — Avaliação de duplicidade vs. ferramentas de mercado

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Importante |
| **Status** | Proposed — aguarda lista atualizada de ferramentas (PA-11) |

---

### 3.5. FA-06 — Sistema Solar (Navegação)

---

#### FR-128 — Navegação Sun → Planeta → Órbita em ≤3 cliques

**Descrição**

O sistema MUST garantir que o caminho entre o Sun (home `/`) e o início de uma sessão de Chat com Skill ativa é cumprido em **≤3 cliques** (Sun → clique no Planeta = 1 clique → tela do Cliente; clique na Órbita = 2 cliques → entrada no Chat = 3). O sistema MUST exibir Planetas com **cor e tamanho proporcional ao volume de Skills/atividade do Cliente** (configurável). Ao selecionar Planeta, MUST exibir Órbitas (Skills atribuídas — FR-109) e QuickStats.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-001 (acionamento ≤3 cliques), BR-006 |
| **Jornada(s)** | Todas (entrada) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Navegação visual + QuickStats | Sincronização tempo real com Admin de Clientes (ADR-002) |
| Responsividade desktop primeiro | Mobile nativo (não previsto MVP) |

**Atores / Personas**

- Todas

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-06 | Navegação |
| **Objetos** | Sun, Planet, Orbit, QuickStat | Visualização |

**Regras de Negócio Associadas**

- RN-003 — princípio ≤3 cliques

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Core |
| **Status** | Em Produção (SPEC-007) |

---

#### FR-129 — Moon chips no Chat (sub-áreas selecionáveis)

**Descrição**

Ao entrar no Chat de uma Skill (FR-128), o sistema MUST exibir Moons configurados (FR-112) como **chips selecionáveis no PromptTemplateBar** logo acima do input. A seleção de um Moon MUST ser visualmente destacada e MUST ser persistida na sessão até troca explícita.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-001 (≤3 cliques), BR-002 |
| **Jornada(s)** | JN-02, JN-03, JN-04 |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Chips compactos | Página dedicada de Moon (eliminada em SPEC-007) |

**Atores / Personas**

- Todas

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-06, FA-04 | Navegação |
| **Objetos** | Moon, ChatSession | Seleção |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Importante |
| **Status** | Em Produção |

---

#### FR-130 — Substituição de "Biblioteca" por linguagem neutra para Operacional

**Descrição**

Em qualquer tela do Sistema Solar ou do Chat onde o sistema referencie internamente a Biblioteca como fonte de contexto, para usuários com perfil **Operacional** o sistema MUST substituir o termo por linguagem neutra ("contexto do cliente", "informações relevantes"). A palavra "Biblioteca" MUST NOT aparecer em nenhuma copy, breadcrumb, label ou link visível para Operacional (RN-011 — Caixa-preta).

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-007 (proteção IP) |
| **JTBD associado** | JTBD-05 (PX-01) — garantia de Caixa-preta |
| **Jornada(s)** | JN-03, JN-09 |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Substituição automática por perfil | Branding diferente por perfil (apenas vocabulário) |

**Atores / Personas**

- Todas (especialmente Operacional como destinatário da regra)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-06, FA-09, FA-04 | Caixa-preta |
| **Objetos** | User, Role, UICopy | Substituição |

**Regras de Negócio Associadas**

- RN-011 — Ocultação da Biblioteca para Operacional

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Core |
| **Status** | Proposed |

---

### 3.6. FA-07 — HITL Feedback (Curadoria Contínua)

---

#### FR-131 — Thumbs up/down + comentário inline por mensagem

**Descrição**

Cada mensagem do agente no Chat MUST exibir botões discretos de **thumbs up / thumbs down** e opção de **comentário textual** (campo expandível). O usuário MUST conseguir avaliar sem fricção (1 clique para thumbs; comentário opcional). O feedback MUST ser persistido com user_id, message_id, timestamp e agregado no Score da Skill (FR-133).

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-003 (qualidade percebida), BR-006, BR-010, BR-014 |
| **Jornada(s)** | JN-02, JN-03, JN-04, JN-06 (transversal) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Inline no MessageBubble | Avaliação inter-pares de outputs entre Creators (não previsto) |

**Atores / Personas**

- Todas

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-07, FA-04 | HITL inline |
| **Objetos** | Feedback, Message, User | Avaliação |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Core |
| **Status** | Em Produção |

---

#### FR-132 — Rating 1-5 estrelas por sessão

**Descrição**

Ao final de uma ChatSession (timeout de inatividade ou ação explícita "encerrar sessão"), o sistema MUST oferecer rating 1-5 estrelas + comentário opcional sobre a sessão como um todo. O rating MUST ser opcional (skip permitido) mas SHOULD ser solicitado consistentemente. O rating alimenta o Score agregado por Skill (FR-133) com peso configurável.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-003, BR-006, BR-010 |
| **Jornada(s)** | JN-02, JN-03, JN-04 (passo final) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Modal não-fricativa | Bloqueio de fim de sessão sem rating |

**Atores / Personas**

- Todas

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-07 | Rating |
| **Objetos** | SessionRating, ChatSession | Rating |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Importante |
| **Status** | Em Produção |

---

#### FR-133 — Score HITL agregado por Skill com média móvel

**Descrição**

O sistema MUST calcular Score HITL por Skill como média ponderada de feedbacks (FR-131) e ratings (FR-132) dos últimos 30 dias, exibindo em SkillCard (FR-109) e no dashboard de governança (FR-148). O cálculo MUST descartar outliers (top/bottom 5%) para mitigar feedback enviesado de uso atípico. Score MUST ser atualizado em tempo quase real (≤5min após novo feedback).

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-003, BR-014 |
| **Jornada(s)** | JN-08 |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Média móvel + descarte outliers | Score por usuário individual exposto publicamente |

**Atores / Personas**

- Sistema (cálculo)
- PX-01, PX-02, PX-03 (consumo)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-07, FA-03, FA-10 | Score |
| **Objetos** | SkillScore, Feedback, SessionRating | Agregação |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Core |
| **Status** | Em Produção parcial — descarte outliers a implementar |

---

#### FR-134 — Painel de validação HITL na Sidebar

**Descrição**

A Context Sidebar do Chat (FR-120) MUST exibir seção "Validação HITL" com: progress bar de feedbacks dados na sessão (relativo a meta visível, ex: 5 mensagens), counters de thumbs up/down, status da sessão (ativa/encerrada com rating), e atalho para histórico de feedbacks da Skill. Essa seção MUST ser visível para todas as personas.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-003, BR-006 |
| **Jornada(s)** | JN-02, JN-03 |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Visualização compacta | Edição de feedback dado |

**Atores / Personas**

- Todas

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-07, FA-04 | Sidebar |
| **Objetos** | Feedback, ChatSession | Visualização |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Importante |
| **Status** | Em Produção |

---

### 3.7. FA-08 — Geração e Edição Multimodal (Imagem/Vídeo)

> Cobre geração via Vertex AI; FRs de edição (Phase 16) referenciam SPEC `image-editor` e `video-generation`.

---

#### FR-135 — Image generation via Vertex AI Imagen 4 / Nano Banana

**Descrição**

O sistema MUST permitir ao agente VisualCreator gerar imagens via Vertex AI Imagen 4 (default) ou Nano Banana (alternativo) a partir de prompt textual. A imagem gerada MUST ser marcada visualmente como estímulo/Faísca (FR-152, RN-014) e MUST integrar no Chat (FA-04) como mensagem inline. O sistema MUST registrar custo de geração no trace MLflow (FR-145).

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-002, BR-010 |
| **Jornada(s)** | JN-03 (Copy Social Preview), JN-02 (Faísca visual) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Geração + integração no Chat | Substituir Adobe Firefly (BR-016) |

**Atores / Personas**

- PX-02, PX-03

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-08, FA-04, FA-11 | Geração + marcação |
| **Objetos** | ImageAsset, GenerationConfig | Geração |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto (com Vertex AI key real; hoje em mock) |
| **Criticidade** | Importante |
| **Status** | Em Produção mock |

---

#### FR-136 — Image editing (inpainting / outpainting / enhance)

**Descrição**

O sistema MUST oferecer edição de imagens existentes nos modos: **inpainting** (preencher área mascarada com novo conteúdo), **outpainting** (expandir área da imagem), **enhance/upscale** (aumentar resolução). Cada operação MUST preservar metadados de origem (prompt original, modelo, edits aplicados) e MUST ser marcada como estímulo (FR-152). Detalhes técnicos vivem em SPEC `image-editor` (Phase 16).

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-002, BR-010 |
| **Jornada(s)** | JN-03 |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Inpainting/outpainting/enhance | Edição vetorial complexa (Illustrator) |

**Atores / Personas**

- PX-02, PX-03

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-08 | Edição |
| **Objetos** | ImageAsset, EditMask | Edição |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Importante |
| **Status** | Proposed (Phase 16) |

---

#### FR-137 — Video generation via Vertex AI Veo 3.0/3.1 (T2V e I2V)

**Descrição**

O sistema MUST permitir geração de vídeo via Vertex AI Veo 3.0 e Veo 3.1 nos modos: **Text-to-Video (T2V)** e **Image-to-Video (I2V)**. O vídeo gerado MUST ser marcado como estímulo (FR-152) e MUST exibir custo estimado **antes** da execução (custo de Veo é alto). Operação de geração de vídeo MUST exigir confirmação explícita do usuário antes de disparar. Detalhes em SPEC `video-generation`.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-002, BR-010 |
| **Jornada(s)** | JN-03 (Roteiro de Vídeo) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| T2V e I2V | Renderização 3D |
| Confirmação explícita pré-execução | Áudio generativo (não previsto Phase 16) |

**Atores / Personas**

- PX-02, PX-03

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-08 | Vídeo |
| **Objetos** | VideoAsset, GenerationConfig | Geração |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | MVP |
| **Criticidade** | Importante |
| **Status** | Proposed (Phase 16, P6 do roadmap handoff) |

---

### 3.8. FA-09 — Governança, RBAC e Caixa-preta

---

#### FR-138 — Auth Google + Firebase Custom Claims

**Descrição**

O sistema MUST autenticar usuários via Google OAuth (login Google único) integrado com Firebase Authentication. Cada usuário MUST ter Custom Claims atribuídas indicando perfil (`role` ∈ {Admin, Líder, Operacional}) e área (`area` para Líder). O sistema MUST validar Custom Claims em todas as requisições autenticadas e MUST aplicar default-deny em qualquer ambiguidade.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-007 (proteção IP), BR-008 (privacidade) |
| **Jornada(s)** | Todas |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Google OAuth + Firebase | SSO com IdPs externos além do Google |
| Default deny | DPO formal (Suno não tem — Parte 1 §3.4) |

**Atores / Personas**

- Sistema
- Todas (autenticação)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-09 | Auth |
| **Objetos** | User, Role | Autenticação |

**Regras de Negócio Associadas**

- RN-009 — Controle de acesso por perfil

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Core |
| **Status** | Em Produção (Phase 10) |

---

#### FR-139 — RBAC com 3 perfis (Admin / Líder / Operacional)

**Descrição**

O sistema MUST implementar RBAC com 3 perfis cujas permissões seguem a matriz:

| Recurso | Admin | Líder | Operacional |
|---------|:-----:|:-----:|:-----------:|
| CRUD Biblioteca (qualquer escopo) | Sim | Sim (área dele) | Não |
| CRUD Skills + system prompts | Sim | Sim (área dele) | Não |
| CRUD Workflows | Sim | Sim (área dele) | Sim (próprios) |
| CRUD Clientes | Sim | Sim (área dele) | Não |
| Consumo via Chat / Sistema Solar | Sim | Sim | Sim |
| Acesso ao Dashboard executivo | Sim | Sim (filtrado área) | Não |
| Acesso a logs de auditoria | Sim | Não (resumido) | Não |

Operações fora desta matriz MUST ser negadas com mensagem genérica (não revelar existência do recurso para Operacional — FR-140).

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-007 (primário) |
| **JTBD associado** | JTBD-05 (PX-01) |
| **Jornada(s)** | Todas (transversal) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| 3 perfis com matriz acima | Granularidade fina por recurso individual (futuro) |

**Atores / Personas**

- Todas

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-09 | RBAC |
| **Objetos** | Role, Permission, User | Controle |

**Regras de Negócio Associadas**

- RN-009 (RBAC)

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Core |
| **Status** | Em Produção parcial (Phase 10) |

---

#### FR-140 — Caixa-preta da Biblioteca para perfil Operacional

**Descrição**

Para usuários com perfil Operacional, o sistema MUST: (a) **omitir** menu, link, breadcrumb ou referência visual à Biblioteca em qualquer tela; (b) **redirecionar** acessos diretos a URLs da Biblioteca (`/biblioteca`) para a home do Sistema Solar com mensagem genérica ("recurso não disponível"); (c) **substituir** menções textuais a "Biblioteca" por linguagem neutra em outputs e UI (FR-130). O sistema MUST registrar tentativas de acesso direto não autorizado para auditoria.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-007 (primário) |
| **JTBD associado** | JTBD-05 (PX-01) |
| **Jornada(s)** | JN-09 (onboarding junior), transversal |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Ocultação total de UI + URL | Bloqueio de inferência por análise de output (mitigação parcial) |

**Atores / Personas**

- Operacional (destinatário)
- PX-01 (auditor)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-09, FA-01, FA-06 | Caixa-preta |
| **Objetos** | Role, AccessLog | Ocultação |

**Regras de Negócio Associadas**

- RN-011 — Ocultação da Biblioteca para Operacional

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Core |
| **Status** | Proposed |

---

#### FR-141 — Isolamento de contexto entre Clientes em Skills

**Descrição**

Toda execução de Skill processual (FR-110) MUST filtrar o retrieval da Biblioteca pelo Cliente ativo na sessão, descartando estritamente conteúdo de outros Clientes. EXCEÇÃO: KnowledgeItems tagueados como "cross-client" (benchmark de indústria, metodologia genérica) MAY ser injetados com peso reduzido (0.4 — RN-021). SE alguma chamada incluir contexto de Cliente B em Skill de Cliente A indevidamente, o sistema MUST bloquear a execução, registrar incidente em log de auditoria com severidade alta e gerar alerta para o Líder.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-008 (privacidade clientes) |
| **JTBD associado** | JTBD-19 (PX-03) |
| **Jornada(s)** | JN-03 (transversal) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Filtro estrito + tag cross-client | Compartilhamento explícito ad-hoc entre clientes |

**Atores / Personas**

- Sistema
- PX-01 (auditor)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-09, FA-03, FA-01 | Isolamento |
| **Objetos** | ClientIsolationRule, KnowledgeItem | Isolamento |

**Regras de Negócio Associadas**

- RN-010 — Isolamento de contexto entre clientes

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Core |
| **Status** | Em Produção parcial |

---

#### FR-142 — Auditoria de acessos administrativos

**Descrição**

Todo acesso administrativo (CRUD na Biblioteca, configuração de Skills/Workflows, edição de Clientes) feito por Admin ou Líder MUST gerar **log estruturado** com: user_id, timestamp, ação, escopo (entidade afetada), IP, e horário (commercial vs. fora). Logs MUST ser queryáveis pelo Admin no dashboard de governança (FR-148). SE volume de acessos administrativos por um usuário em um mês exceder 3σ da baseline, MUST gerar alerta para a Diretoria.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-007, BR-009 |
| **JTBD associado** | JTBD-05 (PX-01) |
| **Jornada(s)** | JN-08 |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Logs estruturados + alertas 3σ | UI sofisticada de SIEM |

**Atores / Personas**

- Sistema
- PX-01 (consumidor)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-09, FA-10 | Auditoria |
| **Objetos** | AccessLog, User | Auditoria |

**Regras de Negócio Associadas**

- RN-012 — Auditabilidade de acessos administrativos

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Core |
| **Status** | Proposed |

---

#### FR-143 — Documentação de NDA + processos formais

**Descrição**

O sistema SHOULD manter documento publicado e versionado descrevendo (a) processos de NDA para colaboradores com acesso administrativo, (b) política de revogação de acesso em offboarding, (c) responsabilidades por categoria de log. Esse documento MUST ser referenciado no onboarding de Admin/Líder (FR-153) e MUST ser revisado anualmente.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-007 |
| **Jornada(s)** | JN-08 |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Documento Admin acessível | Workflow legal automatizado |

**Atores / Personas**

- PX-01 + Diretoria

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-09 | Compliance |
| **Objetos** | Policy, User | Compliance |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | MVP |
| **Criticidade** | Importante |
| **Status** | Proposed |

---

### 3.9. FA-10 — Mensuração, Observabilidade e Custo Evitado

---

#### FR-144 — Tracing 100% das chamadas LLM via MLflow

**Descrição**

O sistema MUST persistir trace MLflow de **100% das chamadas a LLMs** em produção, incluindo: contexto injetado (chunks da Biblioteca), prompt sistema + usuário, output completo, modelo usado, latência total, tokens de entrada/saída, custo calculado em USD/BRL, scorers de qualidade aplicados (FR-146), e referência à ChatSession e Workflow Execution se aplicável. Capacidade de **reconstruir** qualquer interação por **≥12 meses** MUST ser garantida.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-009 (auditabilidade) |
| **Jornada(s)** | Todas (transversal) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Tracing 100% chamadas LLM | Tracing de ações UI puras (clicks etc.) |

**Atores / Personas**

- Sistema
- PX-01 (auditor)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-10 | Tracing |
| **Objetos** | Trace, Message, ChatSession | Observabilidade |

**Regras de Negócio Associadas**

- RN-013 — retenção LGPD

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo (dev local) → Piloto (produção) |
| **Criticidade** | Core |
| **Status** | Em Produção parcial |

---

#### FR-145 — Reporting por Cliente / Skill / Usuário em <30s

**Descrição**

O sistema MUST permitir gerar relatório custom (UI ou API) filtrando por Cliente, Skill, Usuário, faixa de datas, com tempo de resposta **<30 segundos** para faixas de até 90 dias. O relatório MUST incluir: volume de execuções, custo total LLM (USD/BRL), tempo médio, score HITL agregado, custo evitado (FR-149), distribuição por modelo. Exportável em CSV e PDF.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-003, BR-009, BR-013 |
| **Jornada(s)** | JN-08 |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Relatório CSV/PDF | Relatórios para clientes externos (sunOS é interno) |

**Atores / Personas**

- PX-01

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-10 | Reporting |
| **Objetos** | Trace, ExecutionMetric | Reporting |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Core |
| **Status** | Proposed |

---

#### FR-146 — Eval framework com scorers customizados

**Descrição**

O sistema MUST implementar Eval framework em 3 camadas: **(a) Tracing** (latência, tokens, custo — coberto por FR-144), **(b) Trajectory** (sequência de tool calls e raciocínio do agente), **(c) Quality** (scorers customizados: tom, formato, routing correto, contexto utilizado). Cada execução MUST receber scores das 3 camadas, persistidos no trace para análise de drift e calibração de Skills.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-002 (qualidade), BR-009 |
| **Jornada(s)** | JN-08 |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| 3 camadas + scorers customizados | Eval contra ground truth fixo (não viável em criatividade) |

**Atores / Personas**

- Sistema
- PX-01 (consumidor de evolução)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-10, FA-07 | Eval |
| **Objetos** | Scorer, Trace | Eval |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo (dev) → Piloto (produção) |
| **Criticidade** | Core |
| **Status** | Em Produção parcial |

---

#### FR-147 — Mensuração mensal das 3 métricas de homogeneização coletiva

**Descrição**

No final de cada mês, o sistema MUST calcular sobre amostra representativa de outputs criativos do mês (Faíscas estreladas, Copy Social aprovado, Personas Sintéticas geradas) as três métricas: **Mean Pairwise Cosine Distance**, **Self-BLEU**, **Compression Ratio**. Comparar com baseline pré-sunOS (PA-03/PA-06) e histórico mensal. SE qualquer métrica divergir >2σ na direção de menor diversidade, MUST disparar alerta automático para Sponsor + patrocinadores sócio com plano de mitigação proposto. SE divergência persistir 2+ meses consecutivos, MUST escalar para Diretoria.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-014 (primário) |
| **JTBD associado** | JTBD-04 (PX-01) |
| **Jornada(s)** | JN-08 |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| 3 métricas mensais + alertas | Cálculo em tempo real (mensal basta) |
| Suspensão de funcionalidade-causa após 90 dias sem mitigação | Censura automática de outputs |

**Atores / Personas**

- Sistema
- PX-01 + Sponsor + sócios + Diretoria

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-10, FA-11, FA-02 | Mensuração coletiva |
| **Objetos** | DiversityMetric, OutputSample | Mensuração |

**Regras de Negócio Associadas**

- RN-019 — Mensuração mensal e alerta de homogeneização

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | MVP |
| **Criticidade** | Core (modo de falha existencial) |
| **Status** | Proposed — depende de baseline (PA-03/PA-06) |

---

#### FR-148 — Dashboard executivo mensal auto-gerado até dia 5

**Descrição**

O sistema MUST gerar **automaticamente** o Dashboard Executivo Mensal até o **dia 5 do mês seguinte** (RN-005), contendo: (a) **tendência mensal de custo evitado** (FR-149) por área e por cliente, (b) **≥3 KPIs de negócio** (win rate em new business, Cannes/Effie shortlist rate, retenção de seniores), (c) **score HITL agregado** por Skill, (d) **3 métricas de homogeneização** (FR-147) co-exibidas com satisfação (FR-150 bloqueia satisfação isolada), (e) **flag visual de variação >25%** mês a mês com explicação textual obrigatória. Dashboard MUST ser geração ad-hoc por Diretoria sob demanda.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-003 (primário), BR-013, BR-014 |
| **JTBD associado** | JTBD-03 (PX-01) |
| **Jornada(s)** | JN-08 (passos 1-3) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Dashboard auto-gerado + ad-hoc | Substituir BI corporativo |
| Variação >25% com explicação obrigatória | Atribuição de receita a creator individual (delicado culturalmente) |

**Atores / Personas**

- Sistema (geração)
- PX-01, Sponsor, Diretoria (consumidores)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-10, FA-12 | Dashboard |
| **Objetos** | Dashboard, BusinessKPI, ExecutionMetric, DiversityMetric | Dashboard |

**Regras de Negócio Associadas**

- RN-005 — Geração e flagging do dashboard
- RN-019, RN-020 (interrelação)

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Core |
| **Status** | Proposed — formato pendente (PA-05) |

---

#### FR-149 — Cálculo de custo evitado por execução de Skill

**Descrição**

Após cada execução de Skill processual concluída, o sistema MUST calcular **custo evitado** = `(tempo_manual_baseline − tempo_skill) × custo_hora_médio_da_área`. SE baseline existe na planilha ROI (`roi_completo_suno.xlsx`, importável), calcular e persistir como ExecutionMetric. SE baseline não existe, marcar execução como `baseline_pending` e listar para curadoria futura. O custo evitado acumulado alimenta o Dashboard (FR-148).

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-013 (primário), BR-003 |
| **JTBD associado** | JTBD-17 (PX-03), JTBD-24 (PX-04) |
| **Jornada(s)** | JN-03, JN-07, JN-08 (consumo) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Cálculo + lista de baselines pendentes | Atribuição financeira individual |

**Atores / Personas**

- Sistema
- PX-01 (consumidor)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-10, FA-03, FA-05 | Custo evitado |
| **Objetos** | ExecutionMetric, ActivityBaseline | Cálculo |

**Regras de Negócio Associadas**

- RN-018 — Cálculo de custo evitado

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Core |
| **Status** | Proposed — depende de import de baseline ROI (PA-04) |

---

#### FR-150 — Bloqueio de relatório com satisfação individual isolada

**Descrição**

O sistema MUST bloquear a geração de qualquer relatório (manual, ad-hoc, automatizado) que reporte **aggregate user satisfaction** (NPS, thumbs up rate, feedback positivo) **sem incluir simultaneamente** as três métricas de set-level diversity (Mean Pairwise Cosine Distance + Self-BLEU + Compression Ratio — FR-147). Quando bloqueado, sistema MUST exibir mensagem clara explicando o anti-pattern e oferecer adição automática das métricas faltantes.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-014 (primário) |
| **Jornada(s)** | JN-08 |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Bloqueio + adição automática | Aprovação por exceção (não há override) |

**Atores / Personas**

- Sistema
- PX-01 (autor de relatório)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-10, FA-11 | Bloqueio anti-pattern |
| **Objetos** | Dashboard, Report | Validação |

**Regras de Negócio Associadas**

- RN-020 — Bloqueio de relatório com satisfação isolada

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | MVP |
| **Criticidade** | Core (princípio research foundation) |
| **Status** | Proposed |

---

### 3.10. FA-11 — Safety Cultural & Ownership Criativo (não-Moon Shot)

> Cobre os FRs de safety cultural que **não** vivem no FRD Moon Shot: marcação de outputs em Skills, validação vocabulário UI, tracks de onboarding, métricas por carreira, validação cultural com Sponsor.

---

#### FR-151 — Tracks de onboarding por estágio de carreira

**Descrição**

Ao primeiro login, o sistema MUST apresentar tela inicial perguntando estágio de carreira do usuário (cargo + anos de experiência). Com base na resposta e em RN-017: SE junior (<3 anos), MUST sugerir track **"Estou começando uma ideia"** (divergente, abundante); SE sênior (≥7 anos), MUST sugerir **"Tenho uma ideia, me prova que tá errada"** (devil's advocate); SE pleno, MUST apresentar ambas com explicação curta. O usuário MUST conseguir pular ou trocar track depois. A escolha define defaults de N para forced reflection (FR-013 do FRD Moon Shot — N=3 junior, N=5 sênior) e visibilidade de visible reasoning.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-012 (primário) |
| **JTBD associado** | JTBD-25 (PX-05), JTBD-09 (PX-02) |
| **Jornada(s)** | JN-09 (passos 2-3) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Sugestão + opção de pular | Bloqueio total de IA para juniores (proteção é via UX adaptado) |

**Atores / Personas**

- PX-02, PX-05 (primários), PX-04 |

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-11 | Tracks |
| **Objetos** | OnboardingTrack, User | Track |

**Regras de Negócio Associadas**

- RN-017 — Sugestão de track por estágio (confiabilidade Baixa — PA-09)

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Importante |
| **Status** | Proposed — depende de PA-09 (definições por área) |

---

#### FR-152 — Marcação visual de outputs IA como estímulo/Faísca

**Descrição**

Todo output gerado por IA no sunOS (mensagens do agente no Chat, variações, imagens geradas, vídeos gerados, Faíscas do Moon Shot, drafts de Skill processual) MUST exibir **marcação visual clara** identificando-o como **"estímulo" / "provocação" / "Faísca"** — nunca como peça final. SE o usuário tenta compartilhar, exportar ou publicar output IA sem confirmação humana explícita ("promover a peça final"), o sistema MUST bloquear a ação até confirmação. A marcação MUST seguir padrão único de design definido no Design System (`/design-system`).

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-010 (primário) |
| **JTBD associado** | JTBD-10 (PX-02), JTBD-28 (PX-05) |
| **Jornada(s)** | JN-02, JN-03, JN-06, JN-09 (transversal) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Marcação visual + confirmação de promoção | Censura por critério moral (não-escopo) |

**Atores / Personas**

- Todas

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-11, FA-04, FA-08, FA-02 (compartilhada) | Marcação |
| **Objetos** | OutputMarker, Variation, ImageAsset, VideoAsset | Marcação |

**Regras de Negócio Associadas**

- RN-014 — Marcação visual de outputs IA

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Core |
| **Status** | Em Produção parcial |

---

#### FR-153 — Validação automática de vocabulário UI contra Glossário

**Descrição**

Em pipeline de CI/CD ou em editor de copy do Admin, o sistema MUST validar todo texto de UI em produção contra o Dicionário do Glossário (BRD Parte 2, §1) e contra a lista de **anti-patterns** (§9 — "gerar", "otimizar", "eficiência", "accelerator", "departamento de IA"). SE texto contiver anti-pattern, MUST bloquear merge/publicação e sugerir alternativa do dicionário (ex: "gerar" → "Provocar"; "eficiência" → "Devorar"). SE texto usar vocabulário aprovado, MUST aceitar.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-011 (cultura brasileira/Suno) |
| **Jornada(s)** | JN-01, JN-10 (Admin); transversal a deploy |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Validação CI + sugestões | Validação de outputs do agente (apenas UI/copy estática) |

**Atores / Personas**

- Devs/PMs/Designers (autores de copy)
- PX-01 (sponsor cultural)

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-11, FA-12 | Validação |
| **Objetos** | VocabRule, UICopy | Validação |

**Regras de Negócio Associadas**

- RN-016 — Validação de vocabulário UI

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Importante |
| **Status** | Proposed — depende de PA-10 (infraestrutura de validação) |

---

#### FR-154 — Métricas de uso segmentadas por estágio de carreira

**Descrição**

O sistema MUST calcular trimestralmente métricas de uso segmentadas por estágio de carreira (junior/pleno/sênior, baseado em FR-151): NPS por segmento, taxa de skip de forced reflection, score HITL agregado, distribuição de uso entre Skills divergentes (Moon Shot) vs. convergentes (Skills processuais). Métricas MUST ser apresentadas no Dashboard executivo (FR-148) com flag se NPS junior < NPS sênior por 2 trimestres (sinal de problema de adoção).

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-012 |
| **Jornada(s)** | JN-08 |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Métricas trimestrais segmentadas | Tracking por usuário individual exposto |

**Atores / Personas**

- Sistema
- PX-01

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-11, FA-10 | Métricas |
| **Objetos** | User, Feedback, ExecutionMetric | Segmentação |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | MVP |
| **Criticidade** | Importante |
| **Status** | Proposed |

---

#### FR-155 — Validação cultural com Sponsor antes de releases maiores

**Descrição**

Para qualquer release classificada como "maior" (mudança de UX significativa, novo agente, novo idioma de copy, mudança em vocabulário/cultura), o sistema MUST exigir checklist de validação cultural com aprovação explícita do Sponsor (Guga) e/ou patrocinadores sócio antes do deploy. Meta: **≥90% das releases** aprovadas culturalmente. O log de aprovação MUST ser persistido e visível no histórico de releases.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-011 |
| **Jornada(s)** | JN-08 |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Checklist de validação | Validação técnica (apenas cultural) |

**Atores / Personas**

- PX-01 + Sponsor + sócios

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-11, FA-12 | Validação cultural |
| **Objetos** | Release, CulturalApproval | Aprovação |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Piloto |
| **Criticidade** | Importante |
| **Status** | Proposed |

---

### 3.11. FA-12 — Admin Areas (CRUD configurável)

---

#### FR-156 — CRUD de Skills com 4 tabs (Identidade, Configuração, Moons, Clientes)

**Descrição**

A tela `/skills` MUST permitir criação, edição e exclusão (Soft delete) de Skills via drawer com 4 tabs: **(a) Identidade** (nome, descrição, ícone, tipo criação/mídia/planejamento), **(b) Configuração** (system prompt versionado — FR-113, modelo preferencial, temperatura, max_tokens), **(c) Moons** (lista de sub-áreas — FR-112), **(d) Clientes** (lista de clientes elegíveis — FR-104). Validação obrigatória dos campos antes de salvar. Acessível apenas para Admin/Líder (FR-139).

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-002, BR-007, BR-015 |
| **JTBD associado** | JTBD-02 (PX-01) |
| **Jornada(s)** | JN-10 (toda) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| CRUD com versionamento | Marketplace público |

**Atores / Personas**

- PX-01

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-12, FA-03, FA-09 | CRUD |
| **Objetos** | Skill, Moon, Client | CRUD |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Core |
| **Status** | Em Produção |

---

#### FR-157 — CRUD de Biblioteca com upload + filter sidebar + drawer

**Descrição**

A tela `/biblioteca` MUST seguir o pattern Model Repo (SPEC-005): table view default + filter sidebar (escopo, tags, status do cliente, tipo de arquivo) + side drawer com detalhes do KnowledgeItem. Upload com validação (FR-101) e progress visível. Operações suportadas: criar, editar metadados, re-indexar, mover entre escopos, soft delete. Acessível apenas para Admin/Líder.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-004, BR-007 |
| **JTBD associado** | Curadoria contínua de PX-01 |
| **Jornada(s)** | JN-01, JN-05 |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| Pattern Model Repo + upload | Edição colaborativa em tempo real |

**Atores / Personas**

- PX-01

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-12, FA-01 | CRUD |
| **Objetos** | KnowledgeItem, Tag, Scope | CRUD |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Core |
| **Status** | Em Produção |

---

#### FR-158 — CRUD de Clientes com condensed cards + drawer (4 tabs)

**Descrição**

A tela `/clientes` MUST exibir Clientes em condensed cards com nome, status (ativo/inativo), métricas resumidas. Drawer de detalhes com 4 tabs: **(a) Identidade** (nome, slug, contato), **(b) Skills** (Skills atribuídas a este Cliente), **(c) Biblioteca** (KnowledgeItems com escopo deste Cliente), **(d) Métricas** (custo evitado, score HITL, volume execuções últimos 30 dias). Toggle de status (ativo/inativo) reflete imediatamente em FR-105. Acessível apenas para Admin/Líder.

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-004, BR-007, BR-015 |
| **Jornada(s)** | JN-01, JN-05 |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| 4 tabs + toggle status | Sincronização em tempo real com Sistema Solar (ADR-002 — estático) |

**Atores / Personas**

- PX-01

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-12 | CRUD |
| **Objetos** | Client, Skill, KnowledgeItem, ExecutionMetric | CRUD |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo |
| **Criticidade** | Core |
| **Status** | Em Produção |

---

#### FR-159 — CRUD de Workflows com schedule humanizado e drawer

**Descrição**

A tela `/workflows` MUST exibir Workflows como cards com nome, schedule humanizado (FR-124), última execução, status. Drawer com detalhes: composição de steps (FR-122), schedule, histórico de execuções (timeline), HITL gates pendentes. Operações: criar, editar (compilação validada — FR-123), duplicar, pausar/retomar/desativar schedule, executar manualmente. Acessível para Admin/Líder; Operacional pode criar Workflows próprios sem schedule (apenas execução manual).

**Contexto de Negócio e Motivação**

| Aspecto | Valor |
|---------|-------|
| **BR(s) atendidos** | BR-002, BR-013 |
| **JTBD associado** | JTBD-06 (PX-01) |
| **Jornada(s)** | JN-07 (toda) |

**Escopo**

| Inclui | Não Inclui |
|--------|------------|
| CRUD + execução manual | Marketplace de Workflows |

**Atores / Personas**

- PX-01, PX-03, PX-04

**Features e Objetos de Domínio Relacionados**

| Tipo | IDs/Nomes | Papel |
|------|-----------|-------|
| **Features** | FA-12, FA-05 | CRUD |
| **Objetos** | Workflow, Step, Execution, HITLGate | CRUD |

**Fase e Prioridade**

| Aspecto | Valor |
|---------|-------|
| **Fase** | Protótipo (CRUD) → Piloto (execução real) |
| **Criticidade** | Core |
| **Status** | Em Produção |

---

### FA-13 — Aprovação Hierárquica (NOVA — pedido Guga + Bruno Prosperi)

#### FR-160 — Submissão de asset para aprovação em ≤2 cliques

**Descrição**: Botão "Submeter para aprovação" MUST estar acessível em qualquer asset/sessão (T-04, T-05, painéis de skill). Ao clicar, sistema MUST capturar automaticamente: cliente associado, contexto, hierarquia configurada (RN-026). Cria `ApprovalRequest` com status `pre-validating`. Total: ≤2 cliques (botão + confirmação).

**BR(s)**: BR-017 · **JTBD**: JTBD-30 · **Jornada**: JN-11 · **Personas**: PX-02, PX-03, PX-05 · **Features**: FA-13 · **Fase**: Protótipo · **Criticidade**: Core

#### FR-161 — Pipeline de validators paralelos

**Descrição**: Sistema MUST executar validators ativos da área em paralelo: BrandValidator (mínimo) + PortuguêsValidator (mínimo) + outros configurados. Timeout máximo 60s por validator. Se algum falha técnicamente (não retorna), MUST marcar dimensão como `error` (não bloqueia, alerta aprovador). Validators são agentes especializados (não LLM genérico).

**BR(s)**: BR-017 · **RN(s)**: RN-023 · **Personas**: (transparente) · **Features**: FA-13 · **Fase**: POC (1 validator) → Protótipo (2 validators) · **Criticidade**: Core

#### FR-162 — BrandValidator com Brand Guidelines da Biblioteca

**Descrição**: BrandValidator MUST consultar Brand Guidelines do cliente curadas na Biblioteca (FA-01) e validar asset contra: tom de voz, vocabulário proibido, restrições visuais, tom emocional permitido. Output: `{status: passed|warning|failed, evidências[], sugestões[]}`. **Pré-requisito**: cliente DEVE ter Brand Guidelines indexadas; sem isso, validator retorna `error` com mensagem clara.

**BR(s)**: BR-017, BR-004 · **RN(s)**: RN-023 · **Features**: FA-13, FA-01 · **Fase**: POC · **Criticidade**: Core

#### FR-163 — PortuguêsValidator (gramática, ortografia, estilo)

**Descrição**: PortuguêsValidator MUST analisar texto em PT-BR e detectar: erros ortográficos, concordância nominal/verbal, regência, pontuação, e desvios de estilo (gerundismo, voz passiva excessiva, jargão publicitário cliché). Output estruturado por trecho com sugestões alternativas. Ignora vocabulário Suno aprovado (Devorar, Faísca, Brasa) — Glossário §1.

**BR(s)**: BR-017 · **RN(s)**: RN-023 · **Features**: FA-13 · **Fase**: POC · **Criticidade**: Core

#### FR-164 — Validation Report estruturado anexado à submissão

**Descrição**: Após pipeline completo, sistema MUST consolidar Validation Report no formato `{submission_id, validators: [{name, status, score, evidências, sugestões}], overall_status, generated_at}`. Anexa à `ApprovalRequest`. Mantém histórico para auditoria (FR-167).

**BR(s)**: BR-017, BR-009 · **RN(s)**: RN-023 · **Features**: FA-13 · **Fase**: Protótipo · **Criticidade**: Core

#### FR-165 — Approval Inbox (tela do aprovador)

**Descrição**: Tela `/approval/inbox` MUST listar submissões pendentes para o aprovador autenticado, com: filtros (cliente, área, prioridade, idade), ordenação (default: mais urgente primeiro), badge de status (`aguardando-validation`, `aguardando-aprovação`, `em-revisão`). Refresh automático a cada 60s ou via WebSocket.

**BR(s)**: BR-017 · **JTBD**: JTBD-32 · **Jornada**: JN-11 · **Personas**: PX-06 · **Features**: FA-13 · **Tela**: T-29 · **Fase**: Protótipo · **Criticidade**: Core

#### FR-166 — Approval Detail (decisão do aprovador)

**Descrição**: Tela `/approval/{id}` MUST exibir: asset original, Validation Report expandido por dimensão, histórico de rounds anteriores (se houver), 3 ações primárias (**Aprovar** / **Rejeitar** / **Solicitar ajustes**). Cada ação MUST permitir comentário estruturado. Decisão "Aprovar" só executa após confirmação explícita do humano (RN-024) — NUNCA pré-marca por confiança no Validation Report.

**BR(s)**: BR-017, BR-010 · **RN(s)**: RN-024, RN-014 · **JTBD**: JTBD-31, JTBD-33 · **Personas**: PX-06 · **Tela**: T-30 · **Fase**: Protótipo · **Criticidade**: Core

#### FR-167 — Auditoria de decisão de aprovação

**Descrição**: Cada decisão MUST ser registrada em log estruturado: `{request_id, decided_by (user_id), decision, decided_at, comment, validation_report_snapshot, round_number}`. **Crítico**: log distingue "Validado por agentes X,Y,Z" de "Aprovado por {humano}" — auditoria deve provar decisão humana. Logs preservados ≥ 5 anos (compliance).

**BR(s)**: BR-017, BR-009 · **RN(s)**: RN-024, RN-012 · **Features**: FA-13, FA-09 · **Fase**: Protótipo · **Criticidade**: Core

#### FR-168 — Anti-loop com limite de 3 rounds

**Descrição**: Sistema MUST bloquear submissão automática a partir do 4º round (rounds = creator submete, validators reportam, creator ajusta, re-submete = 1 round). Quando atingido, MUST escalar exibindo: "Conversa direta com aprovador é o próximo passo" — sugere agendamento ou comentário humano-humano. Não bloqueia decisão final do aprovador (que pode aceitar mesmo após 3+ rounds).

**BR(s)**: BR-017 · **RN(s)**: RN-025 · **Personas**: PX-02, PX-03, PX-05, PX-06 · **Features**: FA-13 · **Fase**: Piloto · **Criticidade**: Importante

#### FR-169 — Hierarquia de aprovação configurável (admin)

**Descrição**: Admin MUST poder configurar mapa `{área, cliente} → aprovador` em `/admin/approval-hierarchy`. Suporta fallback (líder da área se aprovador inativo). Mudanças geram log auditado. MVP: configuração manual; futuro: sync com sistema de RH.

**BR(s)**: BR-017 · **RN(s)**: RN-026 · **Personas**: PX-01 (admin) · **Features**: FA-13, FA-12 · **Fase**: Piloto · **Criticidade**: Core

#### FR-170 — Notificação ao aprovador (in-app + canal externo)

**Descrição**: Quando submissão entra na inbox do aprovador, sistema MUST enviar notificação in-app (badge no menu) + tentar canal externo configurado (email default; Slack opcional via integração). Aprovador pode silenciar notificações por janela de tempo. Não bloqueia operação caso canal externo falhe.

**BR(s)**: BR-017 · **Personas**: PX-06 · **Features**: FA-13 · **Fase**: Protótipo (in-app) → Piloto (email) → MVP (Slack) · **Criticidade**: Importante

---

### FA-14 — Google Drive como Fonte Curada (NOVA — pedido Guga, versão ajustada)

#### FR-171 — Conexão OAuth Google com escopo `drive.readonly`

**Descrição**: Líder MUST poder conectar pasta autorizada do Drive via OAuth Google em `/admin/drive-sync/connect`. Sistema MUST solicitar APENAS escopo `https://www.googleapis.com/auth/drive.readonly` (e `drive.metadata.readonly`). Token armazenado encriptado (Secret Manager). Conexão testada antes de salvar.

**BR(s)**: BR-018 · **RN(s)**: RN-027 · **Personas**: PX-01 · **Features**: FA-14, FA-12 · **Tela**: T-31 · **Fase**: POC · **Criticidade**: Core

#### FR-172 — Sync incremental Drive→sunOS via `changes.list`

**Descrição**: Sistema MUST sincronizar mudanças do Drive para a Biblioteca a cada 24h via Google Drive API `changes.list` (incremental, não full). Para pastas marcadas como críticas (Brand Guidelines), MUST registrar webhook do Drive para sync imediato (≤5min lag P95). Sync MUST falhar com retry exponencial (3 tentativas) antes de alertar admin.

**BR(s)**: BR-018 · **RN(s)**: RN-030 · **Features**: FA-14 · **Fase**: POC (24h) → Piloto (webhook) · **Criticidade**: Core

#### FR-173 — Intersecção ACL Drive × RBAC sunOS (default deny)

**Descrição**: Quando usuário acessa conteúdo do Drive via sunOS, sistema MUST validar (a) ACL do Drive permite leitura para o usuário E (b) RBAC sunOS permite ver conteúdo do cliente associado. Se algum `false` → negar acesso (default deny) sem revelar existência do recurso. Decisão auditada.

**BR(s)**: BR-018, BR-007, BR-008 · **RN(s)**: RN-028, RN-009, RN-010 · **Features**: FA-14, FA-09 · **Fase**: Protótipo · **Criticidade**: Core

#### FR-174 — Garantia técnica de read-only no Drive

**Descrição**: Sistema MUST bloquear toda operação de write/delete/move contra o Drive em camada de SDK client. Se algum agente/serviço tentar tal operação, MUST falhar antes da chamada HTTP e logar como violação `[ATTEMPT_BLOCKED]`. Audit log MUST permitir verificar zero operações de write em qualquer momento.

**BR(s)**: BR-018 · **RN(s)**: RN-027 · **Features**: FA-14 · **Fase**: POC · **Criticidade**: Core

#### FR-175 — Drive Cleanup Report semanal

**Descrição**: Job semanal MUST analisar pastas conectadas e gerar Drive Cleanup Report contendo: (a) duplicatas detectadas (semelhança de embeddings), (b) conteúdo órfão (sem acesso há ≥180 dias), (c) candidatos a curadoria na Biblioteca, (d) nomenclatura inconsistente, (e) arquivos sem owner ativo. Cada item com sugestão de ação. Report entregue ao líder via in-app + email.

**BR(s)**: BR-018 · **RN(s)**: RN-029 · **Personas**: PX-01 · **Features**: FA-14 · **Tela**: T-32 · **Fase**: Piloto · **Criticidade**: Importante

#### FR-176 — Curadoria assistida (líder revisa Cleanup Report)

**Descrição**: Tela T-32 MUST permitir ao líder revisar cada sugestão do Cleanup Report e decidir: **Aceitar e ingerir** (vai para FR-177) · **Aceitar e marcar para reorganização manual no Drive** (líder executa fora do sunOS) · **Rejeitar** (mantém no próximo report) · **Adiar 30d**. Decisão registrada em log.

**BR(s)**: BR-018, BR-010 · **RN(s)**: RN-029 · **Personas**: PX-01 · **Features**: FA-14 · **Fase**: Piloto · **Criticidade**: Importante

#### FR-177 — Ingestão de conteúdo do Drive na Biblioteca

**Descrição**: Quando líder aprova ingestão (FR-176), sistema MUST: (a) baixar conteúdo via Drive API, (b) extrair texto/conteúdo (pipeline multimodal FA-08), (c) submeter via FR-001 do SPEC-004 com metadados obrigatórios (RN-006 — tags ≥ 2, descrição ≥ 50). MUST manter referência ao arquivo original no Drive (`drive_file_id`) para sync futuro.

**BR(s)**: BR-018, BR-004 · **RN(s)**: RN-006 · **Features**: FA-14, FA-01 · **Fase**: Piloto · **Criticidade**: Core

#### FR-178 — Exclusão por cliente (LGPD/contratual)

**Descrição**: Admin MUST poder marcar cliente individual como excluído da integração Drive em `/admin/drive-sync/exclusions`. Quando excluído, sistema MUST: (a) interromper sync de pastas relacionadas, (b) não exibir conteúdo já sincronizado deste cliente, (c) opcionalmente purgar índices vetoriais relacionados (com confirmação dupla). Razão da exclusão registrada.

**BR(s)**: BR-018, BR-008 · **Features**: FA-14, FA-12 · **Fase**: Piloto · **Criticidade**: Core (compliance)

#### FR-179 — Drive Sync Dashboard

**Descrição**: Tela `/admin/drive-sync` MUST exibir: pastas conectadas com status (sync ok / lag / erro), última sync (timestamp), volume de arquivos sincronizados, próximo Cleanup Report agendado, exclusões ativas, total de operações de write tentadas (deve ser 0). Painel de admin para diagnóstico.

**BR(s)**: BR-018 · **RN(s)**: RN-027 (zero writes auditável) · **Personas**: PX-01 · **Features**: FA-14, FA-12 · **Tela**: T-31 · **Fase**: Piloto · **Criticidade**: Importante

---

## 4. Tabela de Rastreamento (BR ↔ FR ↔ Feature)

| BR | Resumo | FRs Associados | Features |
|----|--------|----------------|----------|
| BR-001 (Provocação criativa) | FR-001 a FR-018 (FRD externo); FR-128, FR-129, FR-152 (entrada e marcação no PRD) | FA-02, FA-06, FA-11 |
| BR-002 (Aceleração operacional) | FR-109, FR-110, FR-112, FR-114, FR-115, FR-116, FR-117, FR-118, FR-119, FR-122 a FR-127, FR-149, FR-156, FR-159 | FA-03, FA-04, FA-05, FA-08, FA-10, FA-12 |
| BR-003 (ROI) | FR-131, FR-132, FR-133, FR-145, FR-148, FR-149 | FA-07, FA-10, FA-12 |
| BR-004 (Biblioteca) | FR-100, FR-101, FR-102, FR-103, FR-104, FR-105, FR-107, FR-157, FR-158 | FA-01, FA-12 |
| BR-005 (Continuidade pós-turnover) | FR-105, FR-106, FR-157, FR-158 | FA-01, FA-12 |
| BR-006 (Acesso democrático) | FR-100, FR-104, FR-109, FR-110, FR-116, FR-120, FR-128, FR-131, FR-132, FR-134 | FA-01, FA-03, FA-04, FA-06, FA-07 |
| BR-007 (Proteção IP) | FR-107, FR-113, FR-130, FR-138, FR-139, FR-140, FR-142, FR-143, FR-156, FR-157, FR-158 | FA-01, FA-09, FA-12 |
| BR-008 (Privacidade clientes) | FR-104, FR-108, FR-115, FR-138, FR-141 | FA-01, FA-09 |
| BR-009 (Auditabilidade) | FR-107, FR-117, FR-121, FR-142, FR-144, FR-145, FR-146 | FA-09, FA-10 |
| BR-010 (Ownership criativo) | FR-118, FR-119, FR-131, FR-132, FR-135, FR-136, FR-137, FR-152 | FA-02 (FRD), FA-04, FA-08, FA-11 |
| BR-011 (Cultura brasileira) | FR-153, FR-155 | FA-11, FA-12 |
| BR-012 (UX por carreira) | FR-151, FR-154; FR-013 (FRD Moon Shot — N variável) | FA-11, FA-02 (FRD) |
| BR-013 (Mensuração custo) | FR-145, FR-148, FR-149, FR-159 | FA-05, FA-10, FA-12 |
| BR-014 (Detecção homogeneização) | FR-131, FR-133, FR-147, FR-148, FR-150 | FA-07, FA-10, FA-11 |
| BR-015 (Integração Skills) | FR-100, FR-110, FR-111, FR-115, FR-121, FR-156, FR-158 | FA-01, FA-03, FA-04, FA-12 |
| BR-016 (Coexistência ferramentas) | FR-127, FR-135, FR-136, FR-137 | FA-05, FA-08 |
| BR-017 (Aprovação hierárquica) | FR-160 a FR-170 (11 FRs) | FA-13, FA-01, FA-09, FA-12 |
| BR-018 (Drive como fonte) | FR-171 a FR-179 (9 FRs) | FA-14, FA-01, FA-09, FA-12 |

### 4.1. BRs sem FR Associado

Nenhum BR sem FR neste documento. Cada um dos 16 BRs tem ≥1 FR mapeado, considerando os FRs do FRD Moon Shot (FR-001 a FR-018) para os BRs primariamente atendidos por FA-02 (BR-001).

### 4.2. FRs Derivados (sem BR explícito)

Nenhum FR derivado neste documento. Cada FR-100 a FR-159 rastreia ≥1 BR.

---

## 5. Tabela de FRs por Jornada e Persona

| Persona | Jornada | FRs Chave | Features | Fase |
|---------|---------|-----------|----------|------|
| PX-01 | JN-01 (Curadoria) | FR-100, FR-101, FR-102, FR-104, FR-107, FR-157 | FA-01, FA-12 | Protótipo |
| PX-01 | JN-05 (Captura pré-saída) | FR-105, FR-106, FR-157, FR-158 | FA-01, FA-12 | Piloto |
| PX-01 | JN-08 (Governança) | FR-114, FR-142, FR-144, FR-145, FR-146, FR-147, FR-148, FR-150, FR-154, FR-155 | FA-09, FA-10, FA-11, FA-12 | Piloto |
| PX-01 | JN-10 (Config Skill) | FR-113, FR-156 | FA-03, FA-12 | Protótipo |
| PX-02 | JN-02 (Ideação) | FR-001 a FR-018 (FRD), FR-116, FR-129, FR-131, FR-152 | FA-02 (FRD), FA-04, FA-06, FA-11 | POC + Protótipo |
| PX-02 | JN-06 (Devil's advocate) | FR-001 a FR-018 (FRD), FR-151, FR-152 | FA-02 (FRD), FA-11 | Piloto |
| PX-02 | JN-03 (Refinamento) | FR-110, FR-111, FR-118, FR-131, FR-152 | FA-03, FA-04, FA-07, FA-11 | Protótipo |
| PX-03 | JN-03 (Execução) | FR-109, FR-110, FR-111, FR-112, FR-115, FR-116, FR-118, FR-119, FR-131, FR-141, FR-149 | FA-03, FA-04, FA-07, FA-08, FA-09, FA-10 | Protótipo |
| PX-03 | JN-07 (Workflow) | FR-122 a FR-127, FR-149, FR-159 | FA-05, FA-12 | Piloto |
| PX-04 | JN-04 (Análise) | FR-110, FR-111, FR-112, FR-116, FR-152 | FA-03, FA-04, FA-11 | Protótipo |
| PX-04 | JN-07 (Pesquisa de Mercado) | FR-122 a FR-127, FR-159 | FA-05, FA-12 | Piloto |
| PX-05 | JN-09 (Onboarding) | FR-130, FR-140, FR-151, FR-152, FR-154 | FA-09, FA-11 | Piloto |
| PX-05 | JN-02 (track junior) | FR-001 a FR-018 (FRD com N=3), FR-152 | FA-02 (FRD), FA-11 | Piloto |
| Todas | Transversal | FR-138, FR-139, FR-144 | FA-09, FA-10 | Protótipo → Piloto |

---

## 6. Assunções, Lacunas e Itens a Validar

### 6.1. FRs Inferidos

| FR | Inferido de | Confiança | Status |
|----|-------------|-----------|--------|
| FR-103 (sugestão automática de tags) | Best practice de curadoria assistida + research foundation | Média | Proposto MVP |
| FR-115 (bloqueio de execução sem cliente) | Inferido de RN-010 + JN-03 (skills cliente-específicas) | Alta | Em produção parcial |
| FR-127 (avaliação de duplicidade) | RN-022 + decisão de produto | Alta | Aguarda PA-11 |
| FR-143 (NDA + processos formais) | BR-007 + ausência de DPO formal (Parte 1 §3.4) | Média | MVP |
| FR-154 (métricas por estágio de carreira) | BR-012 + FA-11-08 do feature map | Alta | MVP |
| FR-155 (validação cultural com Sponsor) | RN-016 + FA-11-09 + transcrições | Alta | Piloto |

### 6.2. Ambiguidades Detectadas

| Ambiguidade | Documentos Conflitantes | Resolução Proposta |
|-------------|------------------------|---------------------|
| Operacional pode criar Workflows próprios? | Parte 1 (Operacional consome via Skills) vs. JN-07 (PX-03 configura) | RBAC permite Workflows próprios sem schedule (FR-159); compartilhados exigem Líder |
| Tracks de onboarding (FR-151) interagem com track sênior do Moon Shot? | RN-017 fala "track de onboarding" (FA-11-03); FRD fala "track sênior" (FR-013) | FR-151 define track inicial; FR-013 (FRD) define modos dentro do Moon Shot — independentes mas coerentes |
| Validação automática de vocabulário (FR-153) é gate Piloto ou MVP? | Parte 1 sugere Piloto; PA-10 ainda pendente | Proposto Piloto se PA-10 confirmar viabilidade até Junho 2026 |

### 6.3. Clarificações Necessárias

| Item | Stakeholder | Impacto | Prazo |
|------|-------------|---------|-------|
| Aprovar política de retenção LGPD (PA-02/PA-07) | Diretoria + Heitor | FR-108 e FR-144 ficam bloqueados | Antes do Piloto |
| Calibrar baseline pré-sunOS de homogeneização (PA-03/PA-06) | Bruno Prosperi + Heitor | FR-147 e FR-148 não disparam alertas sem baseline | Antes do Piloto |
| Calibrar thresholds RN-008 ("crítico", "long-tenure") (PA-08) | Heitor + sócios | FR-106 fica subespecificado | Maio 2026 |
| Validar definições por área de junior/pleno/sênior (PA-09) | Bruno Prosperi (criação), Takai (mídia) | FR-151 fica subespecificado | Junho 2026 |
| Definir formato e infraestrutura de validação automática de copy (PA-10) | Heitor + time dev | FR-153 fica bloqueado | Antes do Protótipo |
| Aprovar lista atualizada de ferramentas adotadas (PA-11) | Diretoria | FR-127 fica subespecificado | Junho 2026 |
| Importar baseline ROI das 136 atividades (PA-04) | Heitor + champions | FR-149 não calcula custo evitado em Skills sem baseline | Maio 2026 |
| Decidir formato exato do Dashboard executivo (PA-05) | Heitor + Guga | FR-148 fica subespecificado | Junho 2026 |
| Confirmar PX-05 como persona separada (ASS-PX-01 da Parte 2) | Heitor + Bruno Prosperi | FR-151, FR-154 viram variantes se PX-05 vira track | Maio 2026 |

---

## 7. Cobertura de Features (FA-XX) por FRs

| FA-XX | FRs neste PRD | FRs no FRD Moon Shot | Status |
|-------|---------------|--------------------------------|:------:|
| FA-01 Biblioteca | FR-100 a FR-108 (9 FRs) | — | OK |
| FA-02 Moon Shot | — (referenciada via FR-001 a FR-018 do FRD externo) | FR-001 a FR-018 | OK (no FRD) |
| FA-03 Skills processuais | FR-109 a FR-115 (7 FRs) | — | OK |
| FA-04 Chat ReAct | FR-116 a FR-121 (6 FRs) | — | OK |
| FA-05 Workflows | FR-122 a FR-127 (6 FRs) | — | OK |
| FA-06 Sistema Solar | FR-128 a FR-130 (3 FRs) | — | OK |
| FA-07 HITL | FR-131 a FR-134 (4 FRs) | — | OK |
| FA-08 Multimodal | FR-135 a FR-137 (3 FRs) | — | OK |
| FA-09 Governança/RBAC | FR-138 a FR-143 (6 FRs) | — | OK |
| FA-10 Mensuração | FR-144 a FR-150 (7 FRs) | — | OK |
| FA-11 Safety cultural | FR-151 a FR-155 (5 FRs) | (compartilha FR-013, FR-014 do FRD para forced reflection e marcação) | OK |
| FA-12 Admin areas | FR-156 a FR-159 (4 FRs) | — | OK |

**Cobertura completa**: nenhuma FA órfã. FA-02 (Moon Shot) é a única FA cujos FRs vivem **integralmente no FRD externo** — esta Parte 4 referencia mas não duplica. Demais 11 FAs têm cobertura direta neste documento.

---

## Histórico de Versões

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | 2026-04-28 | Heitor Miranda + Claude (assistido) | Versão inicial. **60 FRs (FR-100 a FR-159)** detalhados neste documento, cobrindo 11 das 12 FAs (FA-01, FA-03 a FA-12). FA-02 (Moon Shot) cobre via referência ao FRD externo (FR-001 a FR-018, 18 FRs). Total combinado: **78 FRs**. Linguagem RFC 2119 (MUST/SHOULD/MAY) aplicada. Cada FR rastreia ≥1 BR + ≥1 FA + ≥1 RN aplicável. Cobertura completa: cada um dos 16 BRs tem ≥1 FR; nenhuma FA órfã. Vocabulário Suno aplicado (Devorar, Provocar, Faísca, Brasa, Caixa-preta, Bioma); anti-patterns evitados. **Koro sempre com K** |
| 1.1 | 2026-04-28 | **+20 FRs** cobrindo as features novas: FR-160 a FR-170 (11 FRs para FA-13 Aprovação Hierárquica) e FR-171 a FR-179 (9 FRs para FA-14 Google Drive). Total documento: **80 FRs**; total combinado com FRD Moon Shot: **98 FRs**. Pedido Guga + Bruno Prosperi. BR-017 e BR-018 cobertos completamente |
