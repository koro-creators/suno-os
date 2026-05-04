---
description: Start the Next.js dev server on port 3005 (3003 default may be busy on this machine).
allowed-tools: Bash
---

# /project:dev

Inicia o frontend em `npm run dev -- -p 3005` (background) e espera o "Ready in" antes de retornar.

Por que 3005 e não a 3003 padrão do `CLAUDE.md`: na máquina do Heitor a 3003 fica frequentemente ocupada por outro processo. 3005 não conflita.

## Verificações que valem rodar antes

- `npx tsc --noEmit` — garante que não há erro de tipo (rápido; falha cedo)
- `bash scripts/check-canvas-imports.sh` — confirma que reactflow/dagre não vazaram para fora de `components/workflows/canvas/`

## Comando

```bash
npm run dev -- -p 3005
```

Após "Ready in", abrir:
- Catálogo: http://localhost:3005/workflows
- Canvas (workflow real): http://localhost:3005/workflows/wf-report-mensal
- Novo workflow (cria + redireciona pro canvas): http://localhost:3005/workflows/new

## Backend (opcional)

Se for testar fluxo end-to-end (não mock-mode):
```bash
cd api && uv run uvicorn main:app --reload --port 8080
```
Aí `NEXT_PUBLIC_API_URL=http://localhost:8080` no `.env.local` do frontend.

## Para parar

Bash background job manageable via TaskList/TaskStop. Não usar `lsof -ti:3005 | kill -9` — bloqueado pelo sandbox por afetar processos compartilhados.
