# ADR-002: Engine Único com Context Injection — Não Deep Agent por Cliente

**Data:** 2026-04-14
**Status:** Aceito
**Decisores:** Heitor Miranda, José Lucas, William (Carioca)

## Contexto

Na reunião de arquitetura do sunOS (abril 2026), foi proposto criar um "Deep Agent" separado por cliente — essencialmente um Claude Code do marketing para cada marca (Santander, Vivo, Americanas, etc.). Cada Deep Agent teria seus próprios sub-agents, memória, e configuração independente.

A analogia usada foi: "assim como o Claude Code funciona diferente em cada repositório, a gente teria um agente diferente para cada cliente."

## Decisão

**Usar um engine único de agente com context injection por cliente**, em vez de instanciar Deep Agents separados por cliente.

## Justificativa

### 1. Claude Code não é um agente diferente por repo

A analogia está incorreta. Claude Code é o **mesmo engine** em todo repo. O que muda é:
- `CLAUDE.md` (convenções do projeto) → equivale ao **system prompt do skill**
- Arquivos do repo (código) → equivale aos **documentos da Biblioteca**
- Memória (`.claude/memory/`) → equivale ao **histórico de conversas por cliente**

Não existe um "Claude Code do repo X" vs "Claude Code do repo Y". Existe um Claude Code que lê contextos diferentes. O sunOS deve funcionar da mesma forma.

### 2. Deep Agents separados multiplicam custo de manutenção

| Aspecto | 1 engine + N contextos | N deep agents |
|---------|----------------------|---------------|
| Deployment | 1 serviço | N serviços (ou N configs) |
| Atualização de modelo | Muda 1 vez, todos usam | Muda N vezes |
| Bug fix | Corrige 1 vez | Corrige N vezes |
| Monitoring | 1 dashboard | N dashboards |
| Custo Cloud Run | 1 instância escala | N instâncias (min N×$) |
| Consistência | Garantida | Deriva entre agents |

Com 7 clientes, ainda é gerenciável. Com 50 clientes, é inviável.

### 3. O que varia entre clientes é contexto, não arquitetura

| O que muda por cliente | Onde vive no sunOS |
|---|---|
| Tom de voz | Skill reference (`chat/skills/{slug}/references/`) |
| Restrições legais | Skill reference |
| Documentos/brand books | Biblioteca (filtrado por `scope`) |
| Dados de performance | BigQuery (futuro, filtrado por cliente) |
| Histórico de conversas | PostgreSQL (filtrado por `client_id`) |
| Modelo preferido | SkillAdmin.model |

Nenhum desses requer um agente separado. Todos são **injeção de contexto** no mesmo engine.

### 4. A arquitetura atual já suporta isso

O sunOS hoje funciona assim:

```
Request: { message, skill_slug: "copy-social", context_documents: [...] }
    │
    ▼
TopSupervisor (detecta intenção)
    │
    ▼
Orchestrator (carrega skill "copy-social" + references)
    │
    ▼
ContentCreator agent (system prompt com tom de voz + context docs)
    │
    ▼
Resposta contextualizada para o cliente
```

O `skill_slug` + `context_documents` já são o mecanismo de personalização por cliente. Adicionar `client_id` para filtrar histórico de conversas e documentos da Biblioteca completa o modelo.

### 5. Quando Deep Agent per client FARIA sentido

- Se cada cliente tivesse um **workflow de agentes completamente diferente** (não apenas prompts diferentes)
- Se clientes pudessem **criar seus próprios sub-agents** com lógica customizada (ver ADR-001: adiado)
- Se houvesse **isolamento de dados regulatório** (cada cliente em tenant separado) — não é o caso da Suno

Nenhuma dessas condições se aplica hoje.

## Arquitetura Adotada

```
┌─────────────────────────────────────────────┐
│           Engine Único (LangGraph)            │
│                                               │
│  TopSupervisor → Orchestrator → Agent         │
│                                               │
│  Personalização por:                          │
│  ├── skill_slug → system prompt + references  │
│  ├── scope → documentos da Biblioteca         │
│  ├── client_id → histórico de conversas       │
│  └── model → LLM preferido do skill          │
│                                               │
│  Mesmo engine, contexto diferente por cliente  │
└─────────────────────────────────────────────┘
```

## Critérios para Revisitar

Revisitar esta decisão quando:
- [ ] Um cliente pedir um workflow de agentes completamente diferente dos demais
- [ ] Regulamentação exigir isolamento de dados por cliente (tenant separation)
- [ ] Performance degradar porque o engine único não escala para N clientes simultâneos
- [ ] O time identificar que personalização por contexto não é suficiente para um caso específico

## Consequências

- **Positivo:** Um engine para manter, atualizar, e monitorar. Evoluções beneficiam todos os clientes automaticamente.
- **Positivo:** Deploy simples (1 Cloud Run service). Custo previsível.
- **Positivo:** Consistência garantida — mesma qualidade de resposta para todos os clientes.
- **Negativo:** Se um cliente precisar de um workflow radicalmente diferente, será necessário adaptar o engine ou criar uma exceção.
- **Mitigação:** O sistema de skills já permite personalização profunda via system prompts, references, e configuração de modelo. Novas skills são criadas pelo time de engenharia em horas, não semanas.
