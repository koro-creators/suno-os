# Caixa-preta — RN-009 / RN-010 / RN-011 generalizado

Padrão de segurança recorrente em todas as SPECs do sunOS (FA-13, FA-14, e por extensão qualquer endpoint que toca dados de cliente). Originalmente em RN-011 (Biblioteca), foi promovido a invariante geral de domínio.

## Regra fundamental

**Operacional não pode saber que existe o que não pode ver.**

Isso significa:

- Endpoints retornam **404 genérico** quando o usuário não tem permissão, **nunca 403**
- Mensagens de erro padronizadas: `"Documento não disponível"` / `"Workflow não encontrado"` — sem distinguir "não existe" de "você não pode ver"
- Não há endpoint que liste recursos de outro cliente (mesmo só metadata/IDs)
- UI: rota `/admin/<x>` em frontend redireciona para `/404` para usuário sem RBAC, não exibe "Acesso negado"
- Search hits cross-tenant filtrados antes de chegar ao response

## Cross-client guard (RN-010)

Toda query filtra `client_id` resolvido do JWT/contexto. **Não é opcional**:

```python
# OK
SELECT * FROM workflows WHERE client_id = current_user_client_id() AND id = $1

# RUIM (vaza existência cross-tenant via 404 vs 403 inconsistente)
workflow = SELECT * FROM workflows WHERE id = $1
if workflow.client_id != current_user_client_id(): raise HTTPException(403)

# CERTO
workflow = SELECT * FROM workflows WHERE id = $1 AND client_id = current_user_client_id()
if not workflow: raise HTTPException(404)
```

`client_id` é coluna **redundante denormalizada** em tabelas de domínio (drive_documents, workflow_runs, etc.) justamente para o filtro ser barato e à prova de JOIN errado.

## Padrão Python (`api/`)

```python
def _require_workflow(workflow_id: str) -> dict:
    wf = _workflows.get(workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    # Aqui já filtra client_id no SELECT (omitido no in-memory mock)
    return wf
```

## Padrão TypeScript (frontend)

Quando frontend recebe 404 de API caixa-preta, **não distinguir** de "recurso realmente não existe":

```typescript
if (response.status === 404) {
  router.replace('/404'); // ou render <NotFound />
  return;
}
```

Não fazer logging que distingua os casos no frontend (mesmo que backend audit log faça).

## Audit log (server-side OK)

`audit_log_*` table registra a decisão real (`DENIED_CROSS_CLIENT`, `DENIED_RBAC`, `OK`) com `severity` e detalhe — esse é interno, não vaza pro user.

## Anti-patterns

1. ❌ `if not user.has_permission(): raise HTTPException(403)`
2. ❌ Endpoint público que enumera IDs (`GET /api/workflows/list?owner=*`)
3. ❌ Mensagem de erro "Workflow X belongs to another tenant"
4. ❌ Frontend mostrar "Permission denied" em página dedicada com nome do recurso
5. ❌ Cache (Redis/etc.) sem prefixo de `client_id` na chave

## Onde isto aparece

- SPEC-004 (FA-13 Aprovação Hierárquica) — constitution §2.2
- SPEC-006 (FA-14 Drive Read-Only) — constitution §2.3, anti-patterns 6
- API endpoints `/api/approval/*`, `/api/drive/*`, `/api/workflows/*`, `/api/biblioteca/*`
