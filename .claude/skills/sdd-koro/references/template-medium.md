# Template: Spec Medium

Use este template para features contidas, integrações com APIs, novos endpoints, componentes que tocam 2-5 arquivos e interfaces existentes.

## Formato do Arquivo

Nome: `docs/specs/medium/<slug>.spec.md`

## Template

```markdown
---
spec-id: SPEC-XXX
slug: <slug>
nivel-sdd: spec-anchored  # padrão para medium
tamanho: medium
status: rascunho
criada: <data>
atualizada: <data>
versao: 1.0
arquivos-relacionados: []
---

# <Título da Feature/Componente>

## 1. Resumo

**O quê**: <Uma frase descrevendo o que será construído>
**Por quê**: <Motivação de negócio ou técnica>
**Para quem**: <Usuário/sistema consumidor>
**Tamanho estimado**: <Número de arquivos a criar/modificar>

## 2. Comportamento Especificado

### 2.1 Fluxo Principal

<Descreva o fluxo principal passo a passo. Use numeração.>

1. <Passo 1>
2. <Passo 2>
3. <Passo 3>

### 2.2 Fluxos Alternativos

<Descreva variações do fluxo principal.>

**FA-01: <Nome do fluxo alternativo>**
- Condição de entrada: <quando este fluxo é ativado>
- Comportamento: <o que acontece>

### 2.3 Fluxos de Erro

<Descreva como o sistema lida com erros.>

| Condição de Erro | Resposta Esperada | Código HTTP |
|------------------|-------------------|-------------|
| <condição> | <resposta> | <código> |

## 3. Interface & Contratos

### 3.1 APIs / Endpoints

<Para cada endpoint ou interface exposta:>

**`<MÉTODO> <path>`**

Request:
```
<schema/tipo do request body>
```

Response (sucesso):
```
<schema/tipo do response body>
```

Response (erro):
```
<schema/tipo do error body>
```

### 3.2 Tipos / Schemas

<Defina os tipos de dados na linguagem do projeto.>

```typescript
// Exemplo em TypeScript
interface PhotoUploadRequest {
  file: File;
  albumId: string;
  description?: string;
}

interface PhotoUploadResponse {
  id: string;
  url: string;
  thumbnailUrl: string;
  createdAt: string;
}
```

### 3.3 Integrações

<Serviços externos, APIs, SDKs que serão usados.>

| Serviço | Propósito | Referência |
|---------|-----------|------------|
| <serviço> | <para quê> | <link docs> |

## 4. Restrições Técnicas

### 4.1 Stack & Padrões

- **Linguagem**: <linguagem e versão>
- **Framework**: <framework>
- **Padrões de código**: <referência a style guide, linter, etc>

### 4.2 Performance

- <Requisito de performance, se aplicável>

### 4.3 Segurança

- <Requisito de segurança, se aplicável>

### 4.4 Limites e Dependências

- <Dependências de outros módulos/serviços>
- <Limites conhecidos>

## 5. Critérios de Aceite

### Critérios Funcionais

- [ ] **CA-01**: DADO <pré-condição> QUANDO <ação> ENTÃO <resultado esperado>
- [ ] **CA-02**: DADO <pré-condição> QUANDO <ação> ENTÃO <resultado esperado>
- [ ] **CA-03**: DADO <pré-condição> QUANDO <ação> ENTÃO <resultado esperado>

### Critérios Não-Funcionais

- [ ] **CA-NF-01**: <Critério de performance/segurança/acessibilidade>

### Critérios de Regressão

- [ ] Testes existentes continuam passando
- [ ] <Funcionalidade adjacente X continua funcionando>

## 6. Tasks (Opcional)

<Breakdown em tarefas atômicas. Cada task deve ser implementável e testável isoladamente.>

### TASK-01: <Título>
- **Escopo**: <O que esta task implementa>
- **Arquivos**: <Arquivos a criar/modificar>
- **Depende de**: <Outras tasks, se houver>
- **Critérios**: <CA-XX relacionados>

### TASK-02: <Título>
- **Escopo**: <...>
- **Arquivos**: <...>
- **Depende de**: <...>
- **Critérios**: <...>

## 7. Notas de Implementação

<Dicas, edge cases, armadilhas conhecidas, decisões de design que o agente deve saber.>

- <Nota 1>
- <Nota 2>

## 8. Prompt para Agente

<Resumo estruturado e direto para o agente de codificação.
Deve ser autocontido — tudo que o agente precisa para implementar.>
```

## Exemplo de Seção "Prompt para Agente" para Medium

```markdown
## 8. Prompt para Agente

Implemente a feature de upload de fotos para o sistema de álbuns.

**Stack**: TypeScript, Node.js 20, Express, Prisma ORM, S3.

**Criar**:
1. `src/features/photo-upload/handler.ts` — Controller para POST /api/photos/upload
   - Aceitar multipart/form-data com campos: file, albumId, description
   - Validar: max 10MB (413), formatos JPG/PNG/WebP (415), albumId existe (404)
   - Upload para S3 bucket (env.PHOTO_BUCKET), gerar thumbnail 200x200 com sharp
   - Salvar metadata no banco via Prisma (model Photo)
   - Retornar 201 com { id, url, thumbnailUrl, createdAt }

2. `src/features/photo-upload/validator.ts` — Middleware de validação
   - Multer config: fileFilter para mime types, limits para tamanho
   - Validação de albumId via Prisma query

3. `tests/photo-upload.test.ts` — Testes de integração
   - Upload válido → 201 + estrutura correta
   - Arquivo > 10MB → 413
   - Formato .gif → 415
   - albumId inexistente → 404
   - Thumbnail dimensões corretas

**Modificar**:
4. `src/routes/api.ts` — Adicionar rota POST /api/photos/upload

**Restrições**:
- Thumbnail processing deve ser async (não bloquear response)
- Usar presigned URLs para o campo url do response
- Seguir padrões de error handling existentes em src/middleware/error.ts
```

## Dicas para Specs Medium

1. **Seções 3 e 5 são as mais críticas** — Interface/Contratos e Critérios de Aceite são o que realmente guia o agente
2. **Não detalhe implementação interna** — descreva o quê, não o como (a menos que haja uma razão técnica forte)
3. **O breakdown de Tasks é opcional** — use quando a feature tem 3+ partes que fazem sentido implementar em sequência
4. **Tipos na linguagem do projeto** — defina interfaces/types na linguagem real, não em pseudocódigo
5. **Prompt para Agente deve ser autocontido** — o agente não deveria precisar ler o resto da spec
