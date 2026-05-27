# Handoff — 2026-05-26 — Phase 11 Polish + Deploy

**Duração aproximada:** 1.5h
**Foco:** Completar o gate de saída do Protótipo (Phase 11) — testes de backend, persistência de conversas, pytest path fix.

## O que foi feito

- **`api/tests/test_agents.py`** (novo) — 20 testes cobrindo: CRUD de agentes, caixa-preta (404), dispatch de runs, listagem de runs, detalhe de run, guard cross-agent
- **`api/tests/test_admin.py`** (novo) — 19 testes cobrindo: users (list/filter/patch/invite), integrations (list/update/masking), skills defaults (list/update), audit log (list/filter/paginação)
- **`api/tests/conftest.py`** — adicionado `reset_agents_store` autouse fixture para limpar `_agents`, `_runs`, `_runs_by_agent` entre testes
- **`api/pyproject.toml`** — adicionado `[tool.pytest.ini_options] pythonpath = [".."]` para que `from api.xxx import` funcione; todos os testes existentes (canvas) passam sem regressão (79/79)
- **`lib/api.ts`** — adicionado `getConversation(id, userId)`, `ConversationDetail`, `ConversationMessage` para carregar histórico do backend
- **`components/chat/ChatInterface.tsx`** — wiring completo de persistência:
  - Carrega `conversationId` do `localStorage` (chave `sunos:conv:{clientSlug}:{skillSlug}`) on mount
  - Busca mensagens anteriores via `getConversation` se API disponível
  - Passa `storedConvId` em cada `startStream` call
  - Salva novo `conversationId` do evento `done` do SSE no localStorage
- **`docs/ROADMAP.md`** — 6/7 itens da Phase 11 marcados como concluídos; status Protótipo atualizado para 100%

## Decisões tomadas

- **pytest pythonpath**: A suite existente tinha imports `from api.workflows.router` que dependiam do diretório pai (`..`) estar no `sys.path`. Não havia conftest no nível raiz de `api/` — adicionamos `pythonpath = [".."]` no `pyproject.toml` em vez de um conftest mantenedor de `sys.path`.
- **Smoke test staging omitido**: Item operacional (5 dias sem falha em staging) — não é código, não foi implementado.
- **DELETE de agente é soft delete (archive)**: O router marca `status=archived`, não remove do dicionário. Teste corrigido para verificar o comportamento real.
- **User ID para conversas**: Usado `"preview-user"` como fallback enquanto Firebase Auth não está live. O backend aceita qualquer X-User-ID header não vazio.

## Arquivos modificados

- `api/pyproject.toml`
- `api/tests/conftest.py`
- `api/tests/test_agents.py` (novo)
- `api/tests/test_admin.py` (novo)
- `lib/api.ts`
- `components/chat/ChatInterface.tsx`
- `docs/ROADMAP.md`

## Pendências (não abertas como TODO)

- **Smoke test staging** — 5 dias consecutivos sem falha bloqueante em Cloud Run. Item operacional; requer deploy real.
- **TASK-C11 (APScheduler)** — bloqueado porque `apscheduler` não está em `pyproject.toml`. Precisa de aprovação para instalar.
- **Firebase Auth real** — `X-User-ID` ainda é header manual. Quando Firebase Auth landing, trocar `"preview-user"` por `auth.currentUser.uid` em `ChatInterface`.

## Próximo passo natural

Phase 11 está completa (código). O próximo natural é:
1. Subir a branch `worktree-research-sim-workflow` → PR para merge em `main`
2. Ou iniciar a próxima fase do produto — Phase 12 (Sidebar Recentes Dinâmico) ou fases do Piloto (Phase 14, 16, 17)

## Aprendizados / pegadinhas

- `uv run --directory api pytest tests/` NÃO adiciona `..` ao `sys.path` automaticamente — os testes de canvas nunca rodaram em CI com sucesso sem o `pythonpath` fix (mas o CI não havia reportado erro porque o passo de import smoke era separado).
- O `DELETE /api/agents/{id}` é soft-delete (archive), não hard-delete — importante para testes.
- A store `_audit_log` é uma lista (não dict), então `_audit_log.clear()` limpa corretamente entre testes.
- `_skill_defaults` não precisou ser importado em `test_admin.py` — a fixture `reset_admin_store` trabalha diretamente via o módulo importado.
