# Template: Spec Large

Use este template para features complexas, greenfield, migrações, novos serviços, mudanças arquiteturais que tocam 6+ arquivos ou introduzem novos domínios.

## Formato de Diretório

```
docs/specs/large/<slug>/
├── constitution.md   # Princípios imutáveis do projeto
├── spec.md           # Especificação funcional e comportamental
├── design.md         # Arquitetura, modelo de dados, decisões técnicas
├── plan.md           # Plano de implementação
└── tasks.md          # Tarefas atômicas rastreáveis
```

---

## Template: constitution.md

```markdown
---
spec-id: SPEC-XXX
slug: <slug>
artefato: constitution
atualizada: <data>
---

# Constitution — <Nome do Projeto/Feature>

Princípios imutáveis que guiam toda implementação neste escopo. O agente de codificação deve respeitar estes princípios em TODAS as decisões.

## Princípios de Arquitetura

1. <Princípio 1 — ex: "Toda comunicação entre serviços é assíncrona via eventos">
2. <Princípio 2 — ex: "Nenhuma lógica de negócio no controller, apenas no domain layer">
3. <Princípio 3>

## Princípios de Qualidade

1. <Princípio — ex: "Todo endpoint público tem teste de integração">
2. <Princípio — ex: "Cobertura mínima de 80% em módulos de domínio">
3. <Princípio>

## Princípios de Segurança

1. <Princípio — ex: "Nenhum segredo hardcoded; tudo via variáveis de ambiente">
2. <Princípio>

## Padrões Obrigatórios

- **Linguagem**: <linguagem e versão>
- **Formatação**: <prettier/black/etc com config>
- **Linter**: <eslint/ruff/etc com config>
- **Testes**: <framework de teste>
- **Nomenclatura**: <convenção de nomes>

## Dependências Aprovadas

<Liste libs/frameworks que PODEM ser usados. Qualquer dependência fora desta lista precisa de justificativa.>

| Dependência | Versão | Propósito |
|-------------|--------|-----------|
| <dep> | <ver> | <para quê> |

## Anti-patterns Proibidos

<O que o agente NÃO deve fazer, nunca.>

1. <Anti-pattern — ex: "Não usar any em TypeScript; sempre tipar">
2. <Anti-pattern — ex: "Não fazer queries SQL diretas; usar ORM">
3. <Anti-pattern>
```

---

## Template: spec.md

```markdown
---
spec-id: SPEC-XXX
slug: <slug>
artefato: spec
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: <data>
atualizada: <data>
versao: 1.0
---

# Especificação — <Nome da Feature>

## 1. Visão Geral

**O quê**: <Descrição concisa do que será construído>
**Por quê**: <Motivação de negócio>
**Para quem**: <Personas/sistemas consumidores>
**Escopo**: <O que está incluído E o que está explicitamente excluído>

## 2. Personas e Jornadas

### Persona: <Nome>
- **Perfil**: <descrição>
- **Objetivo**: <o que quer alcançar>
- **Jornada principal**: <passos que realiza>

<!-- REVIEW: A especificação captura o que você realmente quer construir? -->

## 3. Requisitos Funcionais

### RF-01: <Título>
- **Descrição**: <O que o sistema deve fazer>
- **Prioridade**: Alta | Média | Baixa
- **Regras de negócio**:
  - RN-01: SE <condição> ENTÃO <ação> SENÃO <ação alternativa>

### RF-02: <Título>
- **Descrição**: <...>
- **Prioridade**: <...>

## 4. Comportamento Especificado

### 4.1 Fluxos Principais

<Descreva cada fluxo principal numerado, com I/O explícitos.>

### 4.2 Fluxos de Erro

| Código | Condição | Resposta | Ação do Sistema |
|--------|----------|----------|-----------------|
| <cod> | <condição> | <resposta ao user> | <ação interna> |

### 4.3 Estados e Transições

<Se o domínio tem máquina de estados, descreva aqui.>

```
[Estado A] --evento--> [Estado B] --evento--> [Estado C]
```

## 5. Requisitos Não-Funcionais

### RNF-01: Performance
- <Requisito mensurável — ex: "P95 latência < 200ms para listagem">

### RNF-02: Segurança
- <Requisito — ex: "Autenticação via JWT, autorização por roles">

### RNF-03: Escalabilidade
- <Requisito — ex: "Suportar 1000 req/s no endpoint de busca">

## 6. Interface & Contratos

### 6.1 APIs

<Para cada endpoint, defina request/response com tipos.>

### 6.2 Eventos / Mensagens

<Se houver comunicação assíncrona.>

### 6.3 Tipos Compartilhados

<Schemas/interfaces que cruzam boundaries.>

## 7. Critérios de Aceite

- [ ] **CA-01**: DADO <pré-condição> QUANDO <ação> ENTÃO <resultado>
- [ ] **CA-02**: ...

## 8. Fora de Escopo

<Liste explicitamente o que NÃO será feito nesta spec.>

- <Item 1>
- <Item 2>
```

---

## Template: design.md

```markdown
---
spec-id: SPEC-XXX
slug: <slug>
artefato: design
atualizada: <data>
---

# Design — <Nome da Feature>

## 1. Arquitetura

### 1.1 Visão de Contexto (C4 Nível 1)

<Descreva o sistema no contexto de sistemas externos e usuários.>

### 1.2 Visão de Containers (C4 Nível 2)

<Componentes técnicos: serviços, bancos, filas, etc.>

### 1.3 Visão de Componentes (C4 Nível 3)

<Módulos internos do container principal afetado.>

## 2. Modelo de Dados

### 2.1 Entidades

<Defina entidades com campos e tipos.>

```sql
-- Exemplo
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES albums(id),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  file_size_bytes INTEGER NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 Relacionamentos

<Diagrama ou descrição textual dos relacionamentos.>

## 3. Decisões Técnicas (ADRs)

### ADR-01: <Título da Decisão>
- **Status**: Aceita
- **Contexto**: <Por que esta decisão é necessária>
- **Decisão**: <O que foi decidido>
- **Alternativas consideradas**: <O que mais foi avaliado>
- **Consequências**: <Trade-offs e implicações>

<!-- REVIEW: A arquitetura faz sentido para as restrições do projeto? -->

## 4. Diagramas de Fluxo

<Fluxos de dados, sequência de chamadas, pipelines de processamento.>

## 5. Estratégia de Testes

| Nível | Escopo | Framework | Cobertura alvo |
|-------|--------|-----------|----------------|
| Unitário | Lógica de domínio | <framework> | 80%+ |
| Integração | Endpoints, DB | <framework> | Fluxos críticos |
| E2E | Jornadas completas | <framework> | Happy paths |
```

---

## Template: plan.md

```markdown
---
spec-id: SPEC-XXX
slug: <slug>
artefato: plan
atualizada: <data>
---

# Plano de Implementação — <Nome da Feature>

## 1. Stack Tecnológica

| Camada | Tecnologia | Versão | Justificativa |
|--------|-----------|--------|---------------|
| <camada> | <tech> | <ver> | <por quê> |

## 2. Fases de Implementação

### Fase 1: <Nome> (Estimativa: X dias)
- **Objetivo**: <O que esta fase entrega>
- **Pré-requisitos**: <O que precisa estar pronto>
- **Entregáveis**: <O que é produzido>

### Fase 2: <Nome> (Estimativa: X dias)
- **Objetivo**: <...>
- **Pré-requisitos**: <...>
- **Entregáveis**: <...>

## 3. Sequência e Dependências

```
Fase 1 ──► Fase 2 ──► Fase 3
              │
              └──► Fase 2b (paralelo)
```

## 4. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| <risco> | Alta/Média/Baixa | Alto/Médio/Baixo | <ação> |

## 5. Critérios de Pronto (Definition of Done)

- [ ] Código implementado e revisado
- [ ] Testes passando (unitários + integração)
- [ ] Documentação atualizada
- [ ] Spec atualizada para refletir estado final
- [ ] Deploy em staging validado
```

---

## Template: tasks.md

```markdown
---
spec-id: SPEC-XXX
slug: <slug>
artefato: tasks
atualizada: <data>
---

# Tasks — <Nome da Feature>

## Resumo

| Total | A Fazer | Em Progresso | Concluídas |
|-------|---------|--------------|------------|
| <N> | <N> | <N> | <N> |

## Tasks

### TASK-001: <Título descritivo>
- **Fase**: <Fase do plan.md>
- **Escopo**: <O que implementar — 2-3 frases>
- **Arquivos**:
  - Criar: `<caminho>`
  - Modificar: `<caminho>`
- **Depende de**: <TASK-XXX ou "nenhuma">
- **Critérios de aceite**: CA-01, CA-02
- **Estimativa**: P/M/G
- **Status**: ⬜ A Fazer | 🔄 Em Progresso | ✅ Concluída

<!-- REVIEW: As tarefas são implementáveis e testáveis isoladamente? -->

### TASK-002: <Título>
- **Fase**: <...>
- **Escopo**: <...>
- **Arquivos**: <...>
- **Depende de**: <...>
- **Critérios de aceite**: <...>
- **Estimativa**: <...>
- **Status**: ⬜

### Prompt para Agente (por Task)

Cada task pode ser enviada individualmente ao agente:

> Implemente TASK-001: <título>.
> Spec: docs/specs/large/<slug>/spec.md
> Design: docs/specs/large/<slug>/design.md
> Constitution: docs/specs/large/<slug>/constitution.md
>
> Escopo específico desta task: <escopo>
> Arquivos: <lista>
> Restrições: <da constitution>
> Critérios de aceite a verificar: <lista>
```

## Dicas para Specs Large

1. **Constitution é o artefato mais poderoso** — ele define guardrails que o agente deve respeitar em TODAS as tasks
2. **Gere os artefatos em ordem**: constitution → spec → design → plan → tasks. Cada um informa o próximo
3. **Use os checkpoints `<!-- REVIEW -->`** — pause e peça validação humana antes de prosseguir
4. **Tasks devem ser atômicas** — cada task deve ser implementável sem contexto das outras (exceto suas dependências explícitas)
5. **Não replique o codebase** — referencie arquivos existentes, não copie conteúdo
6. **Se o design.md ficar muito longo**, considere separar ADRs em arquivos individuais: `design/adr-001-<titulo>.md`
