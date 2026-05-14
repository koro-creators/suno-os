# ADR-003: Workflow Builder Visual Drag-and-Drop como Paradigma Operacional

**Data:** 2026-05-14
**Status:** Aceito
**Substitui:** [ADR-001](./ADR-001-agent-builder-deferred.md)
**Decisores:** Heitor Miranda, José Lucas, William (Carioca), com direção do sponsor Guga Ketzer

## Contexto

ADR-001, aceito em 14/04/2026, decidiu por "Workflow Builder com steps configuráveis (similar a GitHub Actions YAML com UI)" e explicitamente rejeitou drag-and-drop visual de nodes. Essa decisão foi tomada quando a feature de workflows ainda estava em design e não havia direcionamento claro do sponsor executivo.

Em 07/05 e 14/05/2026, o sponsor executivo (Guga) formalizou nova direção de UX: "a gente não deve ser um chat, a gente deve ser um software. E esse software ou tem drag and drop, ou tem às vezes coisas que tu escolhe." A direção é clara: software estruturado com paradigmas visuais explícitos, não chat genérico nem YAML técnico.

Em paralelo, a feature de Workflows do sunOS já evoluiu em código para implementação com drag-and-drop visual de nodes (validada com time de produto em 13/05/2026). A implementação atual já contradiz a decisão de ADR-001.

## Decisão

Adotar drag-and-drop visual de nodes como paradigma da feature FA-05 (Workflows). Manter wizards para tarefas com inputs estruturados (Skills processuais em FA-03) e chat estruturado/contextual para contextos onde fluxo livre é apropriado (Moon Shot em FA-02 e Discovery em chat persistente).

## Justificativa

1. **Alinhamento com direção do sponsor.** Guga foi explícito em 07/05 e 14/05/2026 sobre o paradigma desejado.

2. **Reflete o estado real do código.** A implementação atual já é drag-and-drop. ADR-001 estava desatualizado em relação ao código produzido.

3. **Não viola BR-016 (não substituir ferramentas de mercado).** O Workflow Builder do sunOS compõe Skills/Tools próprias do sunOS, não tools genéricas como Zapier ou n8n. A composição é semântica em cima do domínio da Suno (Plano de Mídia, Análise Concorrencial, Persona Sintética, Brand Voice Validator), não orquestração técnica de APIs genéricas. Isto diferencia o sunOS de orquestradores horizontais.

4. **Apoia BR-019 (Princípio de UX estruturada).** Drag-and-drop é a manifestação visual de composição estruturada. É o oposto de chat livre.

## Consequências

### Positivas
- Alinhamento explícito com sponsor executivo
- Reflete o código real, eliminando dívida documental
- Paradigma claro para Builders construírem automações setoriais sem dependência de engenharia
- Reduz curva de aprendizado em relação a YAML/configuração textual

### Negativas
- Cresce complexidade de UX (mais primitivos visuais)
- Exige design system robusto para nodes, conexões, validações
- Maior superfície de teste de regressão visual
- Risco de virar Zapier-like se não houver disciplina semântica

### Mitigações
- Biblioteca curada de nodes pré-construídos pelo Time Central, evitando que Builders criem nodes ad-hoc
- Validação semântica obrigatória de conexões (output type deve ser compatível com input type esperado)
- Templates por área (Plano de Mídia, Report Mensal, etc.) como ponto de partida
- Limite de nodes por workflow (sugestão inicial: 20 nodes) para evitar workflows monstrengos

## Componentes do Builder Visual (escopo MVP)

| Componente | Função | Origem |
|------------|--------|--------|
| Node de Skill | Executa uma Skill processual (Copy Social, Plano de Mídia, etc.) | Time Central |
| Node de Tool | Chama uma tool (search_knowledge, query_data, send_slack, etc.) | Time Central |
| Node de Condicional | Branch SE/ENTÃO baseado em output anterior | Time Central |
| Node de HITL Gate | Pausa para revisão humana | Time Central |
| Node de Ferramenta Externa | Chama serviço externo (Adobe Firefly, Sprinklr, etc.) | Time Central via integração validada |
| Node de Modelo LLM | Permite escolher modelo específico se necessário | Time Central |
| Node de Conhecimento | Busca na Biblioteca/Wiki Ontológica | Time Central |
| Conector | Liga output de um node ao input de outro | Sistema |

## O que NAO é

- Não é Zapier/n8n. A diferença é semântica, não técnica. Composição é em cima do domínio da Suno.
- Não é editor de código. Builders configuram via UI visual. Acesso ao código compilado (LangGraph StateGraph) é restrito ao Time Central.
- Não é livre. Conexões inválidas são bloqueadas. Templates obrigatórios para áreas específicas (Mídia tem template obrigatório de Plano de Mídia).

## Estado de transição

| Ação | Quando | Responsável |
|------|--------|-------------|
| ADR-001 marcado como Superseded | 2026-05-14 | Heitor |
| FA-05 (PRD) atualizado para refletir drag-and-drop | 2026-05-14 | Heitor + Mayra |
| FR-122 reescrito (remover restrição) | 2026-05-14 | Heitor |
| BR-019 criado (princípio de UX estruturada) | 2026-05-14 | Heitor |
| Documentação interna de nodes disponíveis | Antes do Workshop de Junho | Time Central |

## Changelog

| Data | Mudança |
|------|---------|
| 2026-05-14 | Versão inicial. Supersede ADR-001 com base em direção do sponsor (Guga) e estado do código. |
