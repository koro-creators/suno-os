# Guia de Escrita de Specs Eficazes

Este guia consolida as melhores práticas e anti-padrões identificados nas referências da indústria (Thoughtworks, GitHub spec-kit, Martin Fowler/Birgitta Böckeler) e na experiência prática com agentes de codificação.

## Princípios Fundamentais

### 1. Spec é contrato, não documentação

Uma spec não é um PRD, não é uma user story, não é um documento para stakeholders. É um **contrato técnico** que um agente de codificação consome para produzir código. A spec deve responder:

- O que o código faz (comportamento externo)?
- O que entra e o que sai (I/O)?
- O que o código NÃO deve fazer (restrições)?
- Como sei que está funcionando (critérios testáveis)?

### 2. Especificidade mata ambiguidade

Agentes de IA são excepcionais em reconhecimento de padrões, mas ruins em adivinhação. Prompts vagos forçam o modelo a fazer suposições — e algumas estarão erradas.

**Ruim**: "O sistema deve lidar com erros graciosamente"
**Bom**: "Se o upload falhar por timeout da S3, retorne 503 com body `{ error: 'storage_unavailable', retryAfter: 30 }` e registre o erro no logger com nível 'error'"

### 3. Comportamento externo, não implementação interna

Descreva O QUÊ, não COMO — a menos que o COMO seja uma restrição real do projeto.

**Ruim**: "Use um loop for para iterar sobre os itens e aplicar um map"
**Bom**: "Transforme a lista de itens aplicando desconto proporcional ao tier do cliente"

**Exceção legítima**: "Use sharp (não imagemagick) para thumbnails — é a lib padronizada no projeto"

### 4. Testabilidade é obrigatória

Se um critério de aceite não pode gerar um teste automatizado, ele não é um critério de aceite — é um desejo.

**Ruim**: "A interface deve ser intuitiva"
**Bom**: "O formulário de upload deve ter campos: file (required), description (optional, max 500 chars), albumId (required, select dropdown populado via GET /api/albums)"

## Formatos e Convenções

### Critérios de Aceite — DADO/QUANDO/ENTÃO

```
- [ ] CA-01: DADO um usuário autenticado com role "editor"
       QUANDO envia POST /api/articles com body válido
       ENTÃO recebe 201 com { id, slug, createdAt }
       E o artigo aparece em GET /api/articles
```

Para specs Small, critérios mais simples são aceitáveis:
```
- [ ] POST com email vazio retorna 400
- [ ] Testes existentes continuam passando
```

### Contratos de Interface

Sempre defina na linguagem do projeto:

```typescript
// TypeScript
interface CreateArticleRequest {
  title: string;          // 1-200 chars
  body: string;           // 1-50000 chars, markdown
  tags?: string[];        // max 10 tags
  publishAt?: string;     // ISO 8601, futuro
}
```

```python
# Python
@dataclass
class CreateArticleRequest:
    title: str         # 1-200 chars
    body: str          # 1-50000 chars, markdown
    tags: list[str] = field(default_factory=list)  # max 10
    publish_at: datetime | None = None  # futuro
```

### Tabelas de Erro

Para APIs, use tabelas padronizadas:

```
| Condição | HTTP | Body | Quando |
|----------|------|------|--------|
| Email vazio | 400 | { error: "email_required" } | Validação |
| Email duplicado | 409 | { error: "email_exists" } | Criação |
| Não autenticado | 401 | { error: "unauthorized" } | Middleware |
```

### Referências a Código Existente

Referencie, não copie:

**Ruim**: Copiar 50 linhas do handler existente na spec
**Bom**: "Seguir o mesmo padrão de error handling de `src/middleware/error.ts` (linhas 15-30)"

## Anti-Padrões a Evitar

### 🚫 AP-01: Inflação de Requisitos (The Kiro Problem)

**Sintoma**: Um bug simples vira 4 user stories com 16 critérios de aceite.
**Causa**: Aplicar workflow Large em problema Small.
**Solução**: Classificar tamanho ANTES de escrever qualquer coisa. Na dúvida, Small.

**Exemplo real** (citado por Böckeler): Kiro transformou um pequeno bug de categorização em requisitos incluindo "User story: As a developer, I want the transformation function to handle edge cases gracefully" — completamente desnecessário.

### 🚫 AP-02: Fadiga de Markdown (The Spec-Kit Problem)

**Sintoma**: Dezenas de arquivos markdown repetitivos que ninguém quer revisar.
**Causa**: Gerar artefatos por obrigação do workflow, não por necessidade.
**Solução**: Gerar apenas os artefatos que agregam valor. Specs Small = 1 arquivo. Specs Medium = 1 arquivo. Specs Large = 5 arquivos MAX.

### 🚫 AP-03: Falso Senso de Controle

**Sintoma**: Spec elaborada com checklists e princípios, mas o agente ignora metade.
**Causa**: Context window grande ≠ atenção uniforme. Agentes frequentemente ignoram instruções em documentos muito longos.
**Solução**: 
- Seção "Prompt para Agente" condensada e autocontida
- Restrições mais críticas no INÍCIO do documento
- Constitution curta e assertiva (max 15 princípios)

### 🚫 AP-04: Spec como PRD

**Sintoma**: Spec cheia de contexto de negócio mas sem comportamento técnico.
**Causa**: Confundir público-alvo. A spec é para o agente de código, não para o PO.
**Solução**: Separar claramente "por quê" (1-2 frases de contexto) de "o quê" (comportamento especificado detalhado).

### 🚫 AP-05: Duplicação do Codebase

**Sintoma**: Spec que reescreve classes e funções existentes.
**Causa**: Agente pesquisou o código e copiou tudo na spec durante a fase de research.
**Solução**: Referenciar com caminhos. "Seguir padrão de `src/services/base.service.ts`" em vez de copiar o conteúdo.

### 🚫 AP-06: Over-specification de Implementação

**Sintoma**: "Use um for loop indexado de 0 a length-1 para iterar sobre o array"
**Causa**: Tratar o agente como executor burro em vez de par programador inteligente.
**Solução**: Especificar comportamento e restrições; deixar decisões de implementação para o agente.

## Checklist de Qualidade

Antes de considerar uma spec pronta, verifique:

**Completude**
- [ ] Todos os fluxos (principal, alternativos, erro) estão documentados?
- [ ] Contratos de I/O definidos com tipos na linguagem do projeto?
- [ ] Critérios de aceite são verificáveis por teste automatizado?

**Concisão**
- [ ] Nenhuma seção repete informação de outra seção?
- [ ] Contexto de negócio limitado ao essencial (max 1 parágrafo)?
- [ ] Nenhum código existente foi copiado (apenas referenciado)?

**Adequação ao Tamanho**
- [ ] Small: máximo 1 página, 5 critérios?
- [ ] Medium: máximo 3 páginas, 10 critérios?
- [ ] Large: máximo 5 artefatos, nenhum com mais de 5 páginas?

**Consumibilidade por Agente**
- [ ] Seção "Prompt para Agente" é autocontida?
- [ ] Restrições mais críticas aparecem cedo no documento?
- [ ] Constitution (se Large) tem no máximo 15 princípios?

## Referências da Indústria

- Böckeler, B. (2025). "Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl". Martin Fowler's blog.
- GitHub (2025). "Spec-driven development with AI". GitHub Blog.
- Liu, S. (2025). "Desenvolvimento orientado por especificações". Thoughtworks Insights.
- Tessl (2025). "Spec-Driven Development concepts". Tessl Docs.
