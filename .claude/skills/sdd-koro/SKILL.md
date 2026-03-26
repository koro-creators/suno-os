---
name: sdd-koro
description: |
  Implementa Spec-Driven Development (SDD) adaptativo para projetos de software. Gera especificações técnicas estruturadas que servem como fonte de verdade para agentes de codificação IA. Suporta 3 níveis de SDD (spec-first, spec-anchored, spec-as-source) com workflow adaptativo ao tamanho do problema (small/medium/large). Use quando precisar especificar features, componentes, bug fixes, refactors ou qualquer mudança de código antes de implementar com IA. Triggers: gerar spec, criar especificação, spec-driven, SDD, especificar feature, spec de componente, planejar implementação, design técnico para código, preparar contexto para agente, criar spec para Claude Code, especificação técnica, spec para codificação. Também use quando o usuário disser coisas como "preciso implementar X", "vou construir Y", "quero codar Z" — sempre sugira criar uma spec primeiro.
---

# Skill: SDD Koro — Spec-Driven Development

Geração de especificações técnicas estruturadas que orientam agentes de codificação IA a produzir código previsível, consistente e de alta qualidade.

## Filosofia

O SDD parte de uma premissa simples: **agentes de IA produzem código significativamente melhor quando recebem especificações claras em vez de prompts vagos**. Uma spec não é um documento burocrático — é um contrato técnico que reduz ambiguidade e não-determinismo na geração de código.

A skill implementa três princípios extraídos das referências da indústria (Thoughtworks, GitHub spec-kit, Martin Fowler):

1. **Calibrar cerimônia ao tamanho do problema** — não usar sledgehammer para bugs
2. **Spec define comportamento externo** — I/O, contratos, invariantes, não apenas requisitos de negócio
3. **Humano verifica, não apenas pilota** — checkpoints explícitos de revisão a cada fase

## Escopo do Usuário

Antes de gerar qualquer spec, capture o contexto do usuário:

### Detecção Automática de Contexto

Ao iniciar, leia automaticamente:
1. **CLAUDE.md** — convenções do projeto, stack, restrições
2. **Memória do usuário** — role, preferências, expertise (de `~/.claude/projects/*/memory/`)
3. **Git recente** — `git log --oneline -10` para entender atividade atual
4. **Branch atual** — contexto de onde o trabalho se encaixa

### Perfil de Escopo

Inclua no cabeçalho de toda spec gerada:

```markdown
---
# ... metadados existentes ...
escopo:
  projeto: <nome do projeto>
  stack: <stack detectada>
  autor: <quem solicitou>
  papel: <role do autor no projeto>
  branch: <branch atual>
  contexto: <1 frase sobre o que o time está fazendo agora>
---
```

Isso permite que specs futuras sejam interpretadas no contexto correto por qualquer agente.

## Log de Uso — Melhoria Contínua

Toda spec gerada alimenta um **log de uso** em `docs/specs/_log/usage-log.md`. Este log permite:
- Rastrear padrões de uso (quais tamanhos são mais comuns?)
- Identificar specs que viraram código de qualidade vs. que precisaram de retrabalho
- Melhorar templates com base em feedback real

### Estrutura do Log

```markdown
# SDD Usage Log

## Registro

| Data | Spec ID | Slug | Tamanho | Nível SDD | Autor | Status | Score | Notas |
|------|---------|------|---------|-----------|-------|--------|-------|-------|
| 2026-03-24 | SPEC-001 | chat-real-integration | large | spec-anchored | Heitor | implementada | 4/5 | Spec completa, design preciso |
```

### Score de Qualidade (1-5)

Após implementação, o usuário avalia a spec:

| Score | Significado |
|-------|-------------|
| 5 | Spec perfeita — código gerado sem ajustes |
| 4 | Spec boa — ajustes menores durante implementação |
| 3 | Spec adequada — precisou de esclarecimentos pontuais |
| 2 | Spec incompleta — faltaram cenários importantes |
| 1 | Spec falha — precisou reescrever durante implementação |

### Comando de Avaliação

`"avaliar spec <slug> <score> [notas]"` — registra avaliação no log.

### Insights Automáticos

Ao atingir 10+ specs logadas, a skill analisa o log e sugere melhorias:
- "Suas specs Medium têm score médio 3.2 — considere adicionar mais critérios de aceite"
- "80% das specs Large precisaram de ajuste no design.md — revise o template"
- "Specs com escopo bem definido têm score 0.8 pontos acima da média"

## Classificação de Tamanho (Size Detection)

Antes de gerar qualquer artefato, classifique o problema:

| Tamanho | Critérios | Exemplos |
|---------|-----------|----------|
| **Small** | Mudança isolada, 1 arquivo/função, sem impacto em interfaces | Bug fix, refactor pontual, ajuste de config, hotfix |
| **Medium** | 2-5 arquivos, toca interfaces existentes, feature contida | Nova feature em codebase existente, integração com API, novo endpoint |
| **Large** | 6+ arquivos, novo domínio/módulo, mudanças arquiteturais | Feature complexa, greenfield, migração, novo serviço |

**Regra de ouro**: na dúvida, classifique um nível abaixo. É mais fácil escalar a spec do que sofrer com over-engineering.

## Níveis de SDD

A skill suporta três níveis. O nível padrão é **spec-anchored** para Medium/Large e **spec-first** para Small.

| Nível | Comportamento | Quando usar |
|-------|--------------|-------------|
| **Spec-first** | Spec guia a implementação, pode ser descartada depois | Bug fixes, mudanças pontuais, protótipos |
| **Spec-anchored** | Spec é mantida como living doc junto ao código | Features em produção, APIs, componentes compartilhados |
| **Spec-as-source** | Spec é a fonte de verdade; código é regenerado a partir dela | Módulos estáveis com interface bem definida, contratos de integração |

O usuário pode sobrescrever o nível sugerido a qualquer momento.

## Workflows por Tamanho

### Workflow Small — Spec Leve

Gera um único arquivo. Sem design doc, sem task breakdown.

**Fases**: `Contexto → Escopo → Spec Leve → Log → ✅ Pronto para implementar`

**Output**: `docs/specs/small/<slug>.spec.md`

Leia `references/template-small.md` para o template completo.

**Conteúdo da spec leve:**
1. Escopo (metadados do usuário + projeto)
2. Contexto (1-2 frases: o que está acontecendo, por que precisa mudar)
3. Comportamento atual vs. esperado
4. Arquivos afetados (se conhecidos)
5. Critérios de aceite (checklist verificável)
6. Restrições (se houver)

### Workflow Medium — Spec Completa

Gera spec estruturada com seções técnicas. Opcionalmente inclui task breakdown.

**Fases**: `Contexto → Escopo → Spec Completa → [Tasks] → Log → ✅ Pronto para implementar`

**Output**: `docs/specs/medium/<slug>.spec.md`

Leia `references/template-medium.md` para o template completo.

**Conteúdo da spec completa:**
1. **Escopo** — Metadados do usuário, projeto, branch, contexto
2. **Resumo** — O quê, por quê, para quem
3. **Comportamento Especificado** — Mapeamentos de I/O, pré/pós-condições, fluxos
4. **Interface & Contratos** — APIs, tipos, schemas, integrações
5. **Restrições Técnicas** — Stack, padrões, limites, dependências
6. **Critérios de Aceite** — Checklist verificável com DADO/QUANDO/ENTÃO
7. **Tasks** (opcional) — Breakdown em tarefas atômicas e implementáveis
8. **Notas de Implementação** — Dicas, edge cases, armadilhas conhecidas

### Workflow Large — Spec Completa + Design + Plano

Workflow completo com múltiplos artefatos e checkpoints de revisão humana.

**Fases**: `Constitution → Escopo → Specify → Design → Plan → Tasks → Log → ✅ Pronto para implementar`

**Output**: Pasta `docs/specs/large/<slug>/` com múltiplos arquivos.

Leia `references/template-large.md` para o template completo e `references/workflow-large.md` para o guia detalhado de cada fase.

**Artefatos gerados:**

| Arquivo | Conteúdo |
|---------|----------|
| `constitution.md` | Princípios imutáveis do projeto (memory bank) |
| `spec.md` | Especificação funcional e comportamental completa |
| `design.md` | Arquitetura, modelo de dados, diagramas, decisões técnicas |
| `plan.md` | Plano de implementação com stack, sequência, dependências |
| `tasks.md` | Tarefas atômicas rastreáveis à spec, com estimativas |

**Checkpoints de revisão humana** (marcados com `<!-- REVIEW -->` no documento):
- Após `spec.md`: "A especificação captura o que você realmente quer construir?"
- Após `design.md`: "A arquitetura faz sentido para as restrições do projeto?"
- Após `tasks.md`: "As tarefas são implementáveis e testáveis isoladamente?"

## Comandos e Triggers

| Comando | Ação |
|---------|------|
| `"gerar spec para <descrição>"` | Classifica tamanho automaticamente, gera spec |
| `"spec small: <descrição>"` | Força workflow Small |
| `"spec medium: <descrição>"` | Força workflow Medium |
| `"spec large: <descrição>"` | Força workflow Large |
| `"evoluir spec <slug>"` | Atualiza spec existente (spec-anchored) |
| `"regenerar de spec <slug>"` | Regenera código a partir da spec (spec-as-source) |
| `"listar specs"` | Lista todas as specs em docs/specs/ |
| `"validar spec <slug>"` | Verifica completude e consistência da spec |
| `"promover spec <slug>"` | Eleva nível SDD (first→anchored→source) |
| `"avaliar spec <slug> <score> [notas]"` | Registra avaliação no log de uso |
| `"insights specs"` | Analisa log e sugere melhorias nos templates |

## Estrutura de Diretórios

```
docs/specs/
├── _log/
│   └── usage-log.md           # Log de uso com scores e notas
├── small/
│   ├── fix-null-pointer-login.spec.md
│   └── refactor-date-utils.spec.md
├── medium/
│   ├── user-photo-upload.spec.md
│   └── payment-webhook-integration.spec.md
└── large/
    ├── recommendation-engine/
    │   ├── constitution.md
    │   ├── spec.md
    │   ├── design.md
    │   ├── plan.md
    │   └── tasks.md
    └── auth-migration/
        └── ...
```

## Regras de Escrita de Specs

Estas regras se aplicam a todos os tamanhos. Elas derivam das lições aprendidas documentadas pela Thoughtworks e nas análises de Birgitta Böckeler.

### O que uma spec DEVE conter
- **Comportamento externo verificável** — não descrições vagas de intenção
- **Mapeamentos de entrada e saída** — o que entra, o que sai, em que formato
- **Critérios de aceite testáveis** — um agente de código deve conseguir gerar testes a partir deles
- **Restrições explícitas** — o que o código NÃO deve fazer é tão importante quanto o que deve

### O que uma spec NÃO DEVE conter
- **Detalhes de implementação interna** (a menos que seja spec-as-source)
- **Requisitos genéricos inflados** — se a spec de um bug vira 4 user stories com 16 critérios de aceite, algo está errado
- **Duplicação do código existente** — referencie, não copie
- **Jargão ambíguo** — "o sistema deve ser robusto" não é uma spec, é um desejo

### Princípio anti-over-engineering
Pergunte-se: "Um desenvolvedor sênior lendo esta spec saberia exatamente o que implementar e o que testar, sem informação desnecessária?" Se a resposta for sim, a spec está boa.

## Evolução de Specs (Spec-Anchored)

Para specs no nível spec-anchored, a skill mantém um cabeçalho de metadados:

```markdown
---
spec-id: SPEC-042
slug: user-photo-upload
nivel-sdd: spec-anchored
tamanho: medium
status: implementada  # rascunho | em-revisao | aprovada | implementada | obsoleta
criada: 2026-02-28
atualizada: 2026-02-28
versao: 1.0
escopo:
  projeto: sunos
  stack: Next.js 14 + TypeScript
  autor: Heitor Miranda
  papel: Tech Lead
  branch: develop
  contexto: Implementando ferramentas de IA para o time de criação
arquivos-relacionados:
  - src/features/photo-upload/handler.ts
  - src/features/photo-upload/validator.ts
  - tests/photo-upload.test.ts
---
```

Ao evoluir uma spec (`evoluir spec <slug>`):
1. Leia a spec existente e os arquivos relacionados
2. Identifique o que mudou ou precisa mudar
3. Atualize a spec preservando o histórico (seção "Changelog" no final)
4. Marque o checkpoint de revisão humana
5. Registre a evolução no log de uso

## Regeneração (Spec-as-Source)

Para specs no nível spec-as-source, os arquivos de código gerados incluem o marcador:

```
// GERADO A PARTIR DE SPEC — NÃO EDITE DIRETAMENTE
// Spec: docs/specs/medium/payment-contract.spec.md
// Versão: 1.2 | Gerado em: 2026-02-28
```

Ao regenerar (`regenerar de spec <slug>`):
1. Leia a spec completa
2. Gere o código seguindo todas as restrições e contratos definidos
3. Execute validação contra os critérios de aceite da spec
4. Apresente diff para revisão humana antes de sobrescrever

## Validação de Specs

O comando `validar spec <slug>` verifica:

| Verificação | Descrição |
|-------------|-----------|
| **Completude** | Todas as seções obrigatórias para o tamanho estão presentes? |
| **Testabilidade** | Os critérios de aceite são verificáveis por um teste automatizado? |
| **Consistência** | Contratos de I/O são consistentes entre seções? |
| **Referências** | Arquivos relacionados existem? Specs referenciadas existem? |
| **Tamanho adequado** | A spec não está inflada para o tipo de problema? |
| **Escopo** | Metadados de escopo estão preenchidos? |

Output: relatório em `docs/specs/_validacao/<slug>-validacao.md`

## Integração com Agentes de Codificação

A spec gerada é otimizada para ser consumida como prompt por agentes de codificação (Claude Code, Copilot, Cursor). Para isso:

1. **Cada spec inclui uma seção "Prompt para Agente"** no final, que resume a spec em formato diretamente consumível
2. **Referências a arquivos usam caminhos relativos** a partir da raiz do projeto
3. **Contratos de interface usam a linguagem do projeto** (TypeScript types, Python type hints, etc.)
4. **Critérios de aceite são formatados como assertions** que podem virar testes
5. **Escopo do usuário é incluído** para que o agente entenda o contexto de quem solicitou

## Referências

Para templates detalhados de cada tamanho, leia os arquivos em `references/`:
- `references/template-small.md` — Template para specs Small
- `references/template-medium.md` — Template para specs Medium
- `references/template-large.md` — Templates para specs Large (todos os artefatos)
- `references/workflow-large.md` — Guia detalhado do workflow Large com checkpoints
- `references/writing-guide.md` — Guia de escrita de specs eficazes + antipadrões
