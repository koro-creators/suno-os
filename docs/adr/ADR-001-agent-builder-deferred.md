# ADR-001: Agent Builder No-Code — Adiado

**Data:** 2026-04-14
**Status:** Rejeitado (para agora)
**Decisores:** Heitor Miranda, José Lucas, William (Carioca)

## Contexto

Na reunião de arquitetura do sunOS (abril 2026), foi discutida a criação de um Agent Builder — interface no-code onde usuários "builders" poderiam criar seus próprios sub-agents com skills, knowledge bases e políticas. A visão era permitir que diretores de marketing ou gerentes de conta criassem agents especializados para seus times.

## Decisão

**Não implementar Agent Builder no-code neste momento.** O Skill Editor existente (edição de system prompts, configuração de modelo, atribuição de documentos da Biblioteca) é suficiente para a fase atual.

## Justificativa

### 1. Não há demanda real validada

- O sunOS tem 7 clientes e 8 skills. Nenhum usuário pediu para criar um agent novo nos últimos 6 meses.
- Os "builders" identificados (diretores de marketing) na prática pedem para o time de engenharia criar o que precisam. Não há evidência de que usariam uma interface no-code.
- Construir a ferramenta antes de validar a necessidade é meta-engenharia.

### 2. Escopo desproporcional ao time

- O time tem 4 desenvolvedores (Zé, Carioca, Fabinho, Yuri).
- Um Agent Builder funcional (com composição de skills, versionamento, políticas, testes, rollback) é o que Langchain (200+ engenheiros), Crew AI, e AutoGen tentam resolver há anos.
- O esforço consumiria meses de desenvolvimento que seriam melhor investidos em validar o produto com usuários reais.

### 3. O Skill Editor já cobre 90% da necessidade

O sunOS já possui:
- Edição de system prompts por skill (`/skills/[id]` → tab Configuração)
- Configuração de modelo, temperatura, max tokens
- Atribuição de documentos da Biblioteca por skill
- Atribuição de clientes por skill
- Versionamento de skills

Isso é, na prática, um "builder" — só que sem a complexidade de compor workflows de agentes. Para criar um novo skill, um admin edita o prompt e atribui knowledge. Não precisa de interface de workflow visual.

### 4. Risco de over-engineering

Construir plataforma-de-plataforma (ferramenta para construir ferramentas) antes de validar que as ferramentas base funcionam é a armadilha clássica de startups de AI.

## Caminho Alternativo

| Fase | O que | Quando |
|------|-------|--------|
| **Agora** | Time de engenharia cria skills e agents. Hardcoded. Mede qualidade com eval. | Abril-Maio 2026 |
| **Quando tiver 10+ skills validados** | Skill Editor evolui: mais campos, preview de comportamento, clone skill | Q3 2026 |
| **Quando tiver demanda real de builders** | Agent Builder simplificado: templates + composição básica | Quando 3+ pessoas pedirem |

## Critérios para Revisitar

Revisitar esta decisão quando:
- [ ] Mais de 3 usuários não-engenheiros pedirem para criar agents
- [ ] Existirem 15+ skills validados com eval score > 4.0
- [ ] O time de engenharia for gargalo para criação de novos skills (> 2 semanas de fila)

## Consequências

- **Positivo:** Time foca em validar o produto com usuários reais em vez de construir infraestrutura especulativa.
- **Negativo:** Se um diretor quiser um agent novo, precisa pedir ao time de engenharia. Tempo de resposta: dias, não minutos.
- **Mitigação:** Skill Editor é self-service para configurações simples (mudar prompt, trocar modelo, adicionar docs).
