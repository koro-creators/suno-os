---
spec-id: SPEC-007
slug: nav-simplification
nivel-sdd: spec-first
tamanho: medium
status: implementada
criada: 2026-04-16
versao: 1.0
escopo:
  projeto: sunos
  autor: Heitor Miranda
  contexto: Simplificar navegação de 4 níveis para 3 — moons viram suggestions no chat
---

# Spec — Simplificação de Navegação (4 → 3 níveis)

## Resumo

Eliminar o 4º nível de navegação (moon page). O nível 3 (skill page) se torna o chat, com moons como chips selecionáveis que mudam os templates sugeridos. Reduz friction de navegação de 4 clicks para 3.

## Antes vs Depois

| Nível | Antes | Depois |
|-------|-------|--------|
| 1 | Home (sistema solar) | Home (sem mudança) |
| 2 | /[client] (skills do cliente) | /[client] (sem mudança) |
| 3 | /[client]/[skill] (moons como planetas) | /[client]/[skill] → **É O CHAT** com moon chips |
| 4 | /[client]/[skill]/[moon] → chat | **ELIMINADO** — redirect para nível 3 |

## Comportamento

### Skill Page (nível 3) — agora é o chat

1. Moon chips no topo do chat (horizontais, pill style)
2. Primeiro moon selecionado por default
3. Click em moon chip → muda templates e contexto (sem navegar)
4. Query param `?moon=slug` para deep linking e compartilhamento
5. ContextSidebar + HITL + todas as features do chat mantidas

### Moon chips

```
[● Feed/Carrossel] [  Stories/Reels  ] [  X/Twitter  ]
      ↑ selected (sun border + bg)
```

- Pill style: border-subtle, click selects, selected = sun border + sun bg 15%
- Moon name + description tooltip

### Templates

Templates mudam conforme moon selecionada:
- Feed/Carrossel → "Carrossel educação financeira", "Carrossel produto Select"
- Stories/Reels → "Reels com hook", "Stories de bastidores"
- X/Twitter → "Thread X/Twitter"

### Redirect

`/[client]/[skill]/[moon]` → redirects to `/[client]/[skill]?moon=[moon]`

## Critérios de aceite

- [ ] Skill page é o chat com moon chips
- [ ] Moon chips mudam templates
- [ ] URL antiga (/client/skill/moon) redireciona
- [ ] Query param ?moon=slug funciona
- [ ] Social preview funciona baseado na moon selecionada
- [ ] ContextSidebar auto-seleciona docs corretamente
