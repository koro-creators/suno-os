# Teste Piloto — 15/06/2026

Runbook para abrir o sunOS ao time interno. Duas partes: **(A)** checklist do admin antes de liberar; **(B)** guia do testador (copiar/colar no canal do time).

URLs:
- Frontend: `https://sunos-frontend-mx3edyv2za-uw.a.run.app`
- API: `https://sunos-api-mx3edyv2za-uw.a.run.app`

---

## A. Checklist do admin (segunda de manhã)

### 1. Convidar testadores (~10 min)

Em `/configuracoes` → aba **Usuários** → convidar cada testador pelo **e-mail Google** que a pessoa vai usar no login, com role `creator` (ou `admin` para quem precisa das páginas de admin). O login casa por e-mail antes do primeiro acesso (bootstrap), então o convite basta — não precisa esperar a pessoa logar.

> Quem não foi convidado vê: "Sua conta não foi convidada para o sunOS. Fale com um administrador."

### 2. Smoke test E2E (~15 min, com uma conta NÃO-admin)

| # | Passo | Esperado |
|---|-------|----------|
| 1 | Login Google com conta convidada (role creator) | Entra na Home (sistema solar) |
| 2 | Navegar Home → Cliente → Skill → Chat | 4 níveis funcionam |
| 3 | Enviar mensagem no chat | Stream de resposta em tempo real |
| 4 | **F5 na página do chat** | Histórico da conversa recarrega (fix PRs #47/#48) |
| 5 | `/clientes` → Novo cliente → wizard 4 passos | Oráculo gera 6 entidades (~50s, barra de progresso) |
| 6 | Validar as 6 entidades (aceitar/editar) | Cliente vira ACTIVE após 6/6 |
| 7 | Thumbs up/down numa resposta do chat | Feedback registrado no sidebar |
| 8 | `/workflows` → abrir um workflow no canvas → executar | StepLogs aparecem na execução |
| 9 | `/aprovacoes` → aprovar/rejeitar uma submissão | Notificação no sino do header |
| 10 | Com a conta creator, acessar `/configuracoes` direto pela URL | Redireciona (caixa-preta — sem "acesso negado") |

Se o passo 4 falhar: verificar se o deploy da main pós-PR #48 concluiu (`Deploy — API (prod)` no Actions).

### 3. Avisos operacionais

- **Não fazer deploy durante o horário de teste** — as chaves de integração configuradas em `/configuracoes` → Integrações vivem em memória e somem a cada deploy/restart (pendência B-2, KMS).
- API e frontend escalam até 10/5 instâncias — suficiente para o piloto.

---

## B. Guia do testador (copiar/colar)

**sunOS — o que testar nesta semana**

Acesse `<URL do frontend>` e faça login com sua conta Google (seu e-mail já foi convidado). Foco do teste: **onboarding de cliente com Oráculo** e **chat com skills**.

**Roteiro sugerido (~20 min):**
1. Explore o sistema solar: Home → escolha um cliente → escolha uma skill → converse no chat.
2. Crie um cliente novo em Clientes → Novo: preencha o briefing, dispare o Oráculo e aguarde as 6 entidades (~1 min). Revise cada uma — aceite, edite ou rejeite.
3. Volte ao chat e use os templates de prompt. Dê 👍/👎 nas respostas (isso alimenta nosso ciclo de qualidade).
4. Recarregue a página no meio de uma conversa — o histórico deve voltar.

**Limitações conhecidas (não reportar como bug):**
- **Google Drive**: integração ainda não disponível ("em breve" no wizard é esperado).
- **Geração de imagem**: retorna placeholder (integração Vertex AI pendente).
- **Notificações**: só no sino do header — e-mail/push ainda não enviam.
- **Histórico de conversa** é por navegador (se trocar de máquina, a conversa não segue).

**Reporte de bugs:** descreva o que fez, o que esperava e o que aconteceu (print ajuda) no canal do projeto. Qualquer tela de erro genérico ou comportamento estranho vale reporte — mesmo que pareça pequeno.

---

## Histórico

- 10/06/2026 — Criado. PRs #47 (identidade JWT no chat/onboarding) e #48 (fix 422 conversas) mergeados e deployados; smoke de API em prod verde (health 200, conversas 401 sem auth, X-User-ID rejeitado em produção); auditoria de GRANTs 31/31 OK.
