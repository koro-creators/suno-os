# Template: Spec Small

Use este template para mudanças isoladas: bug fixes, refactors pontuais, ajustes de configuração, hotfixes.

## Formato do Arquivo

Nome: `docs/specs/small/<slug>.spec.md`

Convenção de slug: palavras separadas por hífen, descritivo e curto. Ex: `fix-null-pointer-login`, `refactor-date-utils`, `ajuste-timeout-api`.

## Template

```markdown
---
spec-id: SPEC-XXX
slug: <slug>
nivel-sdd: spec-first
tamanho: small
status: rascunho
criada: <data>
atualizada: <data>
---

# <Título descritivo da mudança>

## Contexto

<1-3 frases explicando o que está acontecendo e por que precisa mudar.
Inclua referência ao bug/ticket se existir.>

## Comportamento Atual

<O que acontece hoje. Seja específico:
- Qual input causa o problema?
- Qual output/comportamento é observado?
- Em que condições isso ocorre?>

## Comportamento Esperado

<O que deve acontecer após a mudança:
- Dado o mesmo input, qual deve ser o output?
- Que comportamento deve ser observado?>

## Arquivos Afetados

<Liste os arquivos que provavelmente precisam ser modificados.
Se não souber com certeza, indique com "(?)" e o agente vai investigar.>

- `caminho/para/arquivo.ts`
- `caminho/para/teste.test.ts`

## Critérios de Aceite

- [ ] <Critério verificável 1>
- [ ] <Critério verificável 2>
- [ ] <Critério verificável 3>
- [ ] Testes existentes continuam passando
- [ ] <Novo teste adicionado se aplicável>

## Restrições

<Qualquer limitação ou cuidado especial. Omita esta seção se não houver.>

## Prompt para Agente

<Resumo direto e implementável para o agente de codificação.
Deve conter tudo que o agente precisa para implementar sem ler o resto.>
```

## Exemplo Preenchido

```markdown
---
spec-id: SPEC-087
slug: fix-null-pointer-login
nivel-sdd: spec-first
tamanho: small
status: rascunho
criada: 2026-02-28
atualizada: 2026-02-28
---

# Fix: NullPointerException no login com email vazio

## Contexto

O endpoint POST /api/auth/login lança NullPointerException quando o campo email é enviado como string vazia. Ticket: BUG-342.

## Comportamento Atual

Quando `email: ""` é enviado no body, o método `UserService.findByEmail()` recebe null após o trim() e lança NullPointerException não tratada, retornando 500 ao cliente.

## Comportamento Esperado

Quando `email: ""` é enviado, o endpoint deve retornar 400 com body `{ "error": "email é obrigatório" }` antes de chegar ao UserService.

## Arquivos Afetados

- `src/controllers/auth.controller.ts` — adicionar validação
- `tests/auth.controller.test.ts` — adicionar caso de teste

## Critérios de Aceite

- [ ] POST /api/auth/login com `email: ""` retorna 400
- [ ] POST /api/auth/login com `email: null` retorna 400
- [ ] POST /api/auth/login sem campo email retorna 400
- [ ] Response body contém mensagem de erro descritiva
- [ ] Login com email válido continua funcionando normalmente
- [ ] Testes existentes passam

## Prompt para Agente

Corrija o NullPointerException no login. No arquivo `src/controllers/auth.controller.ts`, adicione validação no início do método `login()`: se `email` for null, undefined ou string vazia após trim, retorne 400 com `{ "error": "email é obrigatório" }`. Adicione testes em `tests/auth.controller.test.ts` cobrindo os 3 casos (vazio, null, ausente). Não altere a lógica de login existente.
```

## Dicas para Specs Small

1. **Seja cirúrgico** — se você precisa de mais de 5 critérios de aceite, provavelmente é Medium
2. **Inclua o comportamento atual** — o agente precisa entender o que está errado hoje
3. **O Prompt para Agente é o mais importante** — é o que o agente realmente vai consumir
4. **Não inflacione** — resist the urge de transformar um bug em 4 user stories
