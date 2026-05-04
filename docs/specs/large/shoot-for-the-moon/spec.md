---
spec-id: SPEC-004
slug: shoot-for-the-moon
artefato: spec
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-04-28
atualizada: 2026-04-28
versao: 1.0
---

# Especificação — Shoot for the Moon

## 1. Visão Geral

**O quê**: Motor de serendipidade criativa do sunOS que provoca conexões inesperadas entre conceitos distantes, amplificando a capacidade de ideação das equipes criativas. Combinado a uma **Biblioteca de Conhecimento** (infraestrutura invisível) que alimenta também **Skills processuais** com contexto preciso de cliente.

**Por quê**: Quando creators usam ferramentas de IA generativa padrão (ChatGPT, Gemini, Claude), pesquisa documenta **homogeneização criativa coletiva** — satisfação individual sobe enquanto diversidade coletiva colapsa (Doshi & Hauser, *Science Advances* 2024). A Suno precisa de um motor que **provoque, não gere** — engenharia de "fitting surprise" que combata o leveling-up illusion.

**Para quem**:
- **PX-02 Criativo Sênior**: principal beneficiário — recebe provocações que tiram do território conceitual habitual
- **PX-04 Planejamento Estratégico**: usa para mapeamento de territórios de marca
- **PX-01 Líder/Curador**: cura a Biblioteca que alimenta o motor
- **PX-03 Operador Processual**: beneficiado indiretamente via Skills com context injection
- **PX-05 Creator Júnior**: ganha modo "começando uma ideia" com salvaguardas extras

**Escopo incluído**:
- Biblioteca de Conhecimento (FA-01) com indexação dual (vetor + grafo) e curadoria por líderes
- Motor Shoot for the Moon (FA-02) com debate multi-agente Explorer↔Crítico, retrieval divergente MMR + graph traverse, scoring de bisociação
- Integração Biblioteca-Skills (FA-03) — context injection transparente em skills processuais
- 3 níveis de retrieval: convergente (skills), divergente (Shoot for the Moon), híbrido (admin)
- 6 personas brasileiras de agente: Antropófaga, Cético, Constraint Queen, Carnavalesco, Anciã, Estranho
- Mensuração de homogeneização coletiva (input para RN-019/020)

**Escopo excluído**:
- Geração de peças criativas finais (creator faz isso)
- Personalização individual por creator (todos usam mesmo motor)
- Modo colaborativo real-time (múltiplos creators na mesma sessão)
- Visualização do knowledge graph para usuários (admin only)
- Ingestão automática sem curadoria humana

## 2. Personas e Jornadas

### PX-01 Líder/Curador
**Job**: Manter Biblioteca rica e diversa para alimentar Shoot for the Moon e Skills.
**Jornada**: Identifica referência → cataloga via interface admin → metadados obrigatórios → indexação automática (vetor + grafo).

### PX-02 Criativo Sênior
**Job**: Sair de territórios conceituais habituais.
**Jornada**: Em contexto de cliente/briefing → clica "Shoot for the Moon" → vê 3-5 cards de Faísca → marca úteis → integra como inspiração no trabalho.

### PX-04 Planejamento Estratégico
**Job**: Mapear espaço conceitual de marca.
**Jornada**: Constrói brief → aciona Shoot for the Moon → testa hipóteses contra combinações inesperadas → identifica territórios inexplorados.

### PX-03 Operador Processual
**Job**: Entregar tarefas operacionais com qualidade e velocidade.
**Jornada**: Abre skill processual para cliente X → context injection automática (transparente) → recebe output já calibrado para o cliente.

### PX-05 Creator Júnior
**Job**: Aprender e contribuir com criatividade sem over-reliance em IA.
**Jornada**: Onboarding "Começando uma ideia" → modo divergente com forced reflection a cada 3 stars.

<!-- REVIEW: A especificação captura o que o Guga quer construir? -->

## 3. Requisitos Funcionais (FR-001 a FR-018)

### Biblioteca (FA-01)

**FR-001 — Ingestão com metadados obrigatórios**
O sistema MUST permitir que perfis Líder/Admin adicionem conteúdo à Biblioteca via interface web, exigindo: título, domínio (cliente | indústria | cultura | metodologia | referência), tags (mínimo 2), cliente associado (se cliente-específico), fonte original, descrição (mínimo 50 caracteres). Sem metadados completos → bloquear ingestão.

**FR-002 — Indexação dual (vetor + grafo)**
O sistema MUST indexar todo conteúdo simultaneamente em (a) vector store com 3 embeddings (purpose, mechanism, surface) gerados via modelo configurável, e (b) knowledge graph com extração automática de entidades e relações via LLM. Extração SHOULD ser revisável pelo curador antes de confirmação.

**FR-003 — Retrieval convergente para Skills**
O sistema MUST fornecer endpoint de retrieval otimizado para precisão (similarity search com λ=0.7-1.0), filtrável por cliente e domínio, retornando top-k documentos mais relevantes. Endpoint MUST suportar filtro por metadados.

**FR-004 — Retrieval divergente para Shoot for the Moon**
O sistema MUST fornecer endpoint otimizado para diversidade: (a) MMR com λ=0.3-0.5 sobre purpose embeddings, (b) graph traverse 2+ hops a partir de entidades do tema, (c) injeção de conteúdo de domínios diferentes do domínio do cliente ativo, (d) filtro adicional `mechanism_similarity > 0.5` para evitar mash-ups aleatórios. Parâmetro λ SHOULD ser ajustável via slider de intensidade (FR-014).

**FR-005 — Catálogo cliente ativo vs. inativo**
O sistema MUST organizar conteúdo por cliente. Conteúdo de cliente inativo MUST permanecer na Biblioteca mas NOT ser surfado em retrieval padrão (apenas em busca explícita por líder).

**FR-006 — Catálogo cultural cross-domain**
O sistema MUST manter seção dedicada a conteúdo cross-domain não-cliente (referências culturais, tendências, arquétipos, movimentos artísticos, filosofia, ciência). Esta seção é o combustível primário do Shoot for the Moon.

**FR-007 — Controle de acesso por perfil (RBAC)**
3 níveis: Admin (CRUD total), Líder (CRUD na Biblioteca da sua área + leitura áreas relacionadas), Operacional (sem acesso direto — consumo apenas via Skills/Shoot for the Moon). Existência da Biblioteca MUST NOT ser exposta na interface de operacionais (RN-011).

### Shoot for the Moon (FA-02)

**FR-008 — Acionamento em ≤3 cliques**
Botão "Shoot for the Moon" MUST estar acessível em qualquer tela de skill/cliente. Ao clicar: (a) captura contexto atual (cliente, tema/briefing), (b) executa pipeline em background, (c) apresenta resultado em ≤15s mediano, ≤30s P95.

**FR-009 — Agente Explorer com persona criativa divergente**
Agente LLM MUST receber contexto do briefing + contexto cross-domain da Biblioteca via FR-004, e propor conexões entre o universo do cliente e domínios inesperados. Explorer MUST receber histórico da sessão para evitar repetição. Persona SHOULD ser configurável pelo líder (Antropófaga, Cético, Constraint Queen, Carnavalesco, Anciã, Estranho).

**FR-010 — Agente Crítico com avaliação estruturada**
Agente avaliador MUST pontuar cada provocação em 3 dimensões (Novidade, Coerência, Potencial Criativo) em escala 0-10. MUST rejeitar provocações com score < 5 em qualquer dimensão e devolver ao Explorer. Loop MUST convergir em ≤5 iterações.

**FR-011 — Scoring de bisociação**
Sistema MUST calcular distância semântica entre conceitos combinados em cada provocação e classificar em zonas: Óbvio (descartado), Adjacente, Sweet Spot (priorizado), Radical, Incoerente (descartado). Thresholds configuráveis e calibráveis por modelo de embedding.

**FR-012 — Apresentação de provocações**
Sistema MUST apresentar 3-5 provocações em format card com: título provocativo, conceitos combinados (com domínio de origem), narrativa de conexão (2-3 frases), indicador visual de intensidade. MUST NOT exibir scores numéricos, nomes de agentes técnicos, ou terminologia técnica. Linguagem evocativa.

**FR-013 — Feedback do usuário por provocação**
Sistema MUST permitir thumbs up/down por provocação. SHOULD coletar motivo opcional ("óbvio", "incoerente", "inspirador", "irrelevante"). Dados MUST alimentar ajuste de thresholds e pesos.

**FR-014 — Controle de intensidade criativa**
Sistema SHOULD oferecer controle (slider/toggle) que ajusta distância criativa: Adjacente | Equilibrado (default) | Radical. Controle MUST ajustar simultaneamente: λ do MMR, raio de hops do graph, thresholds de bisociação.

### Integração Biblioteca-Skills (FA-03)

**FR-015 — Context injection automática em Skills**
Sistema MUST interceptar toda chamada de skill processual e: (a) identificar cliente ativo, (b) buscar top-k contexto via FR-003, (c) injetar no prompt antes do LLM. Processo MUST ser transparente ao usuário.

**FR-016 — Filtro por cliente em Skills**
Sistema MUST filtrar retrieval pelo cliente ativo. Conteúdo de outros clientes MUST NOT ser incluído. Exceção: conteúdo tagueado "cross-client" PODE ser incluído com peso reduzido (0.4).

**FR-017 — Hierarquia de truncamento de contexto**
Quando context window é insuficiente, MUST truncar começando pelos pesos mais baixos: regras de negócio do cliente (1.0, sempre incluir) > guidelines de marca (0.8) > histórico de campanhas (0.6) > contexto de mercado (0.4) > referências gerais (0.2).

**FR-018 — Dashboard de métricas de consumo**
Sistema SHOULD fornecer dashboard ao líder com: conteúdos mais consumidos por skill, skills com mais feedback positivo/negativo, correlação contexto injetado × qualidade percebida, conteúdo "órfão" (nunca consumido).

## 4. Critérios de Aceite (resumo — completos por fase no plan.md)

- **POC**: ≥60% das provocações classificadas como "úteis" por 3+ creators seniores em testes blind. Score de bisociação médio na zona Sweet Spot. Tempo de resposta < 30s P95.
- **Protótipo**: ≥70% aprovação em uso real. Skills com context injection avaliados como melhores em ≥65% dos casos.
- **Piloto**: ≥75% aprovação. ≥3 campanhas reais com referência a provocações do Shoot for the Moon. Líderes usando dashboard ativamente.
- **MVP**: Mensuração contínua de homogeneização ativa. Detecção de divergência > 2σ funcional.

## 5. Fora de Escopo

- Geração de peças criativas finais (peça final é do creator, não da máquina)
- Personalização individual por creator (sistema é coletivo)
- Modo colaborativo real-time
- Visualização do knowledge graph para operacionais
- Ingestão automática (web scraping) sem curadoria
- Personas customizadas pelo creator (apenas líder configura)
- Geração de prompts personalizados pelo usuário (caixa-preta)

## Rastreabilidade

| FR | BR origem | RN derivada | FA | Tela |
|----|-----------|-------------|-----|------|
| FR-001 | BR-004 | RN-006 | FA-01 | T-13 |
| FR-002 | BR-004 | RN-006 | FA-01 | T-13 (admin) |
| FR-003 | BR-006, BR-002 | RN-021 | FA-01, FA-03 | (transparente) |
| FR-004 | BR-001 | RN-001 | FA-02 | T-06, T-07 |
| FR-005 | BR-005 | RN-007 | FA-01 | T-15 |
| FR-006 | BR-001, BR-006 | — | FA-01 | T-13 |
| FR-007 | BR-007 | RN-009, RN-011 | FA-01, FA-09 | T-13 |
| FR-008 | BR-001 | RN-003 | FA-02 | T-06 |
| FR-009 | BR-001 | RN-001 | FA-02 | (backend) |
| FR-010 | BR-001 | RN-002 | FA-02 | (backend) |
| FR-011 | BR-001 | RN-001 | FA-02 | (backend) |
| FR-012 | BR-001, BR-010 | RN-014 | FA-02 | T-07, T-08 |
| FR-013 | BR-001 | — | FA-02 | T-07 |
| FR-014 | BR-012 | RN-001 | FA-02 | T-06, T-07 |
| FR-015 | BR-002, BR-006 | RN-021 | FA-03 | (transparente) |
| FR-016 | BR-008 | RN-010 | FA-03 | (transparente) |
| FR-017 | BR-006 | RN-021 | FA-03 | (transparente) |
| FR-018 | BR-013 | — | FA-03 | T-24 (dashboard) |

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-04-28 | Materialização do rascunho original do Guga como SPEC-004 SDD large. 18 FRs (FR-001 a FR-018) consolidados a partir de BRDs/PRDs/SRDs/UXs já gerados pelos agentes do pipeline Koro |
