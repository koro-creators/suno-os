# Workflow Large — Guia Detalhado

Este guia descreve o fluxo completo para specs de tamanho Large, incluindo checkpoints de revisão humana e critérios de transição entre fases.

## Visão Geral do Fluxo

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  CONSTITUTION │────►│    SPECIFY    │────►│    DESIGN     │────►│     PLAN      │────►│    TASKS      │
│              │     │              │     │              │     │              │     │              │
│ Princípios   │     │ Spec funcional│    │ Arquitetura  │     │ Impl. plan   │     │ Breakdown    │
│ imutáveis    │     │ + comportamento│    │ + dados      │     │ + sequência  │     │ atômico      │
└──────────────┘     └──────┬───────┘     └──────┬───────┘     └──────────────┘     └──────┬───────┘
                            │                     │                                         │
                      🔍 REVIEW 1           🔍 REVIEW 2                               🔍 REVIEW 3
                     "Captura o que        "Arquitetura faz                         "Tasks são
                      você quer?"          sentido?"                                implementáveis?"
```

## Fase 1: Constitution

### Input
- Descrição do projeto/feature pelo usuário
- Codebase existente (se brownfield)
- Padrões da equipe/organização

### Ações
1. **Analise o contexto**: Se há codebase existente, examine padrões, libs, convenções
2. **Extraia princípios**: Identifique as regras que devem ser imutáveis
3. **Documente dependências aprovadas**: Liste o que pode ser usado
4. **Defina anti-patterns**: O que nunca deve ser feito

### Critérios de Transição
- ✅ Princípios cobrem: arquitetura, qualidade, segurança
- ✅ Stack definida com versões
- ✅ Anti-patterns listados
- ✅ Usuário validou que os princípios refletem a realidade do projeto

### Dica
Para projetos brownfield, gere a constitution a partir do código existente. Examine `package.json`, configs de linter, testes existentes, e estrutura de diretórios para inferir princípios.

---

## Fase 2: Specify

### Input
- Constitution aprovada
- Descrição funcional do usuário
- Documentação de produto existente (se houver)

### Ações
1. **Mapeie personas e jornadas**: Quem usa e como
2. **Especifique requisitos funcionais**: Com regras de negócio explícitas
3. **Defina comportamento**: Fluxos, estados, I/O, erros
4. **Estabeleça contratos**: APIs, tipos, schemas
5. **Escreva critérios de aceite**: No formato DADO/QUANDO/ENTÃO

### 🔍 REVIEW 1 — Checkpoint de Revisão

Apresente ao usuário:
```
📋 Review da Especificação

Gerei a spec com:
- X requisitos funcionais
- Y critérios de aceite
- Z contratos de interface

Perguntas para validação:
1. A especificação captura o que você realmente quer construir?
2. Há algum fluxo ou caso de uso que está faltando?
3. Os critérios de aceite são suficientes para validar a implementação?
4. Algo está over-engineered para o problema real?

O que você gostaria de ajustar antes de prosseguir para o Design?
```

### Critérios de Transição
- ✅ Todos os fluxos principais documentados
- ✅ Contratos de I/O definidos com tipos
- ✅ Critérios de aceite testáveis
- ✅ **Usuário aprovou no REVIEW 1**

---

## Fase 3: Design

### Input
- Constitution + Spec aprovadas

### Ações
1. **Desenhe a arquitetura**: Use C4 model (contexto → containers → componentes)
2. **Modele dados**: Entidades, relacionamentos, schemas de banco
3. **Registre decisões**: ADRs para cada escolha técnica significativa
4. **Planeje testes**: Estratégia por nível (unit, integration, e2e)
5. **Diagramme fluxos**: Sequência de chamadas, pipelines

### 🔍 REVIEW 2 — Checkpoint de Revisão

Apresente ao usuário:
```
🏗️ Review do Design

Arquitetura proposta:
- <resumo da arquitetura em 2-3 frases>

Decisões técnicas chave:
- ADR-01: <título> — <decisão em 1 frase>
- ADR-02: <título> — <decisão em 1 frase>

Modelo de dados: <N> entidades, <M> relacionamentos

Perguntas para validação:
1. A arquitetura faz sentido para as restrições do projeto?
2. As decisões técnicas (ADRs) estão alinhadas com a visão da equipe?
3. O modelo de dados cobre todas as entidades necessárias?
4. Faltou considerar alguma integração ou dependência?

O que você gostaria de ajustar antes de prosseguir para o Plano?
```

### Critérios de Transição
- ✅ Arquitetura documentada em pelo menos 2 níveis C4
- ✅ Modelo de dados com entidades e relacionamentos
- ✅ Pelo menos 1 ADR para decisões significativas
- ✅ Estratégia de testes definida
- ✅ **Usuário aprovou no REVIEW 2**

---

## Fase 4: Plan

### Input
- Constitution + Spec + Design aprovados

### Ações
1. **Defina stack completa**: Tecnologias por camada com justificativa
2. **Quebre em fases**: Blocos de entrega com estimativas
3. **Mapeie dependências**: O que bloqueia o quê
4. **Identifique riscos**: Com probabilidade, impacto e mitigação
5. **Defina Definition of Done**: Critérios para considerar tudo pronto

### Critérios de Transição
- ✅ Fases sequenciadas com estimativas
- ✅ Dependências mapeadas
- ✅ Riscos identificados com mitigações
- ✅ DoD definido

---

## Fase 5: Tasks

### Input
- Todos os artefatos anteriores aprovados

### Ações
1. **Decomponha em tasks atômicas**: Cada task = 1 unidade implementável
2. **Rastreie para spec**: Cada task referencia critérios de aceite
3. **Defina arquivos**: Cada task lista exatamente o que criar/modificar
4. **Ordene por dependências**: Tasks sem dependência primeiro
5. **Gere prompts individuais**: Cada task tem seu prompt para agente

### 🔍 REVIEW 3 — Checkpoint de Revisão

Apresente ao usuário:
```
📝 Review das Tasks

Geradas <N> tasks distribuídas em <M> fases:
- Fase 1: <N1> tasks — <objetivo>
- Fase 2: <N2> tasks — <objetivo>

Perguntas para validação:
1. As tasks são implementáveis e testáveis isoladamente?
2. A granularidade está adequada? (nem grande demais, nem micro demais)
3. As dependências entre tasks estão corretas?
4. Quer adicionar, remover ou reformular alguma task?

Após sua aprovação, cada task pode ser enviada individualmente ao agente de codificação.
```

### Critérios de Transição
- ✅ Todas as tasks rastreiam para critérios de aceite
- ✅ Cada task tem escopo, arquivos e prompt definidos
- ✅ Dependências explícitas e sequência lógica
- ✅ **Usuário aprovou no REVIEW 3**

---

## Após Aprovação: Implementação

A skill NÃO implementa código diretamente. Ela gera artefatos que o agente de codificação consome. O fluxo pós-aprovação é:

1. **Envie cada task ao agente** (Claude Code, Copilot, Cursor) usando o prompt individual
2. **Inclua a constitution como contexto** em cada sessão
3. **Valide contra os critérios de aceite** após cada task
4. **Atualize o status das tasks** no tasks.md (⬜ → 🔄 → ✅)
5. **Se necessário, atualize a spec** para refletir decisões tomadas durante implementação

## Regra Anti-Over-Engineering

Em QUALQUER fase, se você perceber que está gerando mais artefatos do que o problema justifica, reclassifique para Medium. Sinais de alerta:

- Constitution com mais de 20 princípios
- Spec com mais de 15 requisitos funcionais para uma feature simples
- Design com ADRs para decisões triviais
- Mais de 15 tasks para algo que um dev sênior faria em uma sprint

Melhor ter uma spec Medium bem feita do que uma spec Large inflada.
