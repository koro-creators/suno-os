# Onboarding — Oráculo (pesquisa real) + Drive read-only

> Backlog de tasks para transformar o onboarding de cliente de "casca navegável" em
> funcionalidade real. O **fluxo/orquestração** (wizard 4 passos → job async → progresso →
> HITL → Wiki Ontológica) já está sólido e testado E2E (06/06/2026). O que é **stub** é a
> **inteligência**: o Oráculo não pesquisa e o Drive não conecta. Este doc separa o trabalho
> em duas frentes (A = Oráculo, B = Drive) com tasks, dependências e decisões em aberto.

**Criado:** 06/06/2026 · **Specs:** SPEC-015 (Oráculo do Cliente), SPEC-006 (Drive Read-Only / FA-14)

---

## Estado atual (evidências)

### Oráculo
- Job roda como **BackgroundTask** (correto): [api/onboarding/router.py:123](../../api/onboarding/router.py#L123) → `run_oracle_agent`.
- O agente LangGraph **tenta Gemini** (`gemini-2.0-flash`, **sem tools**) e cai em **template hardcoded** se falhar: [api/onboarding/oracle_agent.py:40-77](../../api/onboarding/oracle_agent.py#L40) (fallback) e [oracle_agent.py:110](../../api/onboarding/oracle_agent.py#L110) (LLM sem tools).
- **`brand_context=""` e `wizard_briefing=""` hardcoded** — nem a descrição do cliente chega ao agente: [api/onboarding/service.py:155-156](../../api/onboarding/service.py#L155).
- `allowed_domains` é **coletado na UI** ([components/onboarding/WizardStep2Oracle.tsx](../../components/onboarding/WizardStep2Oracle.tsx)) mas **nunca lido** pelo agente.
- Web search é **mock** e **nunca chamado**: [api/chat/tools/search_tools.py](../../api/chat/tools/search_tools.py) (`TODO: Integrate Tavily or SerpAPI`).
- **Consequência:** a Wiki Ontológica hoje é boilerplate genérico (no teste E2E veio o template de fallback verbatim — o Gemini caiu em erro/timeout).

### Drive
- Todos os endpoints são **stub**: [api/drive/router.py](../../api/drive/router.py) — `/auth` retorna `"#oauth-not-configured"` ([router.py:155](../../api/drive/router.py#L155)); callback simula tokens **em memória**; `_run_sync_job` dorme 2s e devolve arquivos fake.
- Login Firebase **não dá acesso ao Drive**: `GoogleAuthProvider` é criado **sem escopos** de Drive em [lib/firebase.ts:24](../../lib/firebase.ts#L24). Acessar Drive exige consentimento **adicional** (`drive.readonly`).
- Tabela `drive_tokens` **existe mas não é usada**: [api/migrations/005_drive_tokens.sql](../../api/migrations/005_drive_tokens.sql) (com `TODO(Fase D): KMS antes de produção`).

---

## Frente A — Oráculo faz pesquisa de verdade

| Task | Descrição | Depende | Estado |
|------|-----------|---------|--------|
| **A1** | Passar contexto do wizard ao agente: `brand_context` = `client.description`; `wizard_briefing` = sponsor + domínios. Ajustado `run_oracle_agent` e `regenerate_entity_stub` (helper `_oracle_inputs`). | — | ✅ 06/06 |
| **A2** | Web search real via **Tavily** (`api/onboarding/web_search.py`, httpx — sem nova dep). Graceful sem chave. Secret `sunos-tavily-api-key` criado + wired no deploy. | chave Tavily | ✅ 06/06 |
| **A3** | Busca **restrita aos `allowed_domains`** (Tavily `include_domains`); `provenance` cita as URLs reais encontradas (`_build_provenance`). | A2 | ✅ 06/06 |
| **A4** | Nó `research` no LangGraph (START → research → extract → END) injeta as fontes no prompt antes de gerar cada entidade. | A2, A3 | ✅ 06/06 |
| **A5** | **Robustez do Gemini**: retry/backoff (3 tentativas) + fallback **não-silencioso** (`invoke_oracle` retorna `(content, error)`; provenance vira "Fallback local" quando aplicável). | — | ✅ 06/06 |
| **A6** | Idioma da saída segue `oracle_config.language` (pt-BR/en-US) no prompt. | A1 | ✅ 06/06 |
| **A7** | Alimentar o Oráculo com **docs do Drive** selecionados (`selected_doc_ids`) como contexto. | Frente B | pendente |

## Frente B — Drive read-only (OAuth baseado na conta Google)

| Task | Descrição | Depende | Estado |
|------|-----------|---------|--------|
| **B1** | Criar credenciais OAuth no GCP (`GOOGLE_OAUTH_CLIENT_ID/SECRET`), tela de consentimento, escopos `drive.readonly` + `drive.metadata.readonly`. Guardar em Secret Manager. | **setup externo (usuário)** | pendente |
| **B2** | Implementar o **OAuth Flow real** (`google-auth-oauthlib`): `/drive/auth` (redirect real) + `/drive/callback` (troca code→tokens). Substituir o stub. | B1 | pendente |
| **B3** | **Persistir tokens** na `drive_tokens` (refresh_token) por `user_id` (Firebase UID). Refresh automático ao expirar. | B2 | pendente |
| **B4** | **Criptografia** dos tokens (Cloud KMS) — nunca texto plano em prod. | B3 | pendente |
| **B5** | Listar/baixar arquivos **reais** via Drive API (substituir `_run_sync_job` fake) + curadoria. | B3 | pendente |
| **B6** | Ligar a **seleção de docs no Step 3** do wizard ao backend (hoje "Drive não disponível"). | B5 | pendente |

> **Sobre a dúvida "conectar baseado no login":** o login Firebase só prova identidade
> (sem escopo de Drive). O caminho é **autorização incremental** — pedir o escopo
> `drive.readonly` por cima da conta Google logada, recebendo um `refresh_token` guardado
> no servidor (B2/B3). Não dá para reusar o ID token do Firebase para ler o Drive.

---

## Sequência recomendada

1. ~~**A1**~~ ✅ → conteúdo específico do cliente.
2. ~~**A5 + A6**~~ ✅ (robustez + idioma).
3. ~~**A2 → A3 → A4**~~ ✅ (pesquisa real com Tavily, restrita a domínios). **Frente A do Oráculo concluída** (falta só A7, que depende do Drive).
4. **Frente B** (Drive) — **parada** (DEC-3 = decidir depois).
5. **A7** (integra Drive ao Oráculo — fecha o ciclo). Depende da Frente B.

## Decisões

- **DEC-1 (A2):** ✅ **Tavily** — implementado. `TAVILY_API_KEY` no `api/.env` (local) e secret `sunos-tavily-api-key` (prod).
- **DEC-2 (B4):** _(aberta)_ KMS já no MVP ou coluna preparada + plaintext só em dev? A migration prevê KMS antes de prod.
- **DEC-3 (B1):** ✅ **decidir depois** — Frente B parada; foco na Frente A (Oráculo).

## Log

- **06/06/2026** — Doc criado após teste E2E do onboarding (tudo funciona até a Wiki; inteligência é stub).
- **06/06/2026** — **A1, A5, A6 concluídas.** Oráculo agora recebe `brand_context` (descrição) + `wizard_briefing` (sponsor/domínios) + idioma; retry no Gemini (3x) com fallback não-silencioso (provenance distingue "Oráculo Gemini" de "Fallback local"). Suíte 116 verde, ruff limpo. Decisões: Tavily (A2), Frente B adiada. **Bônus:** corrigida regressão pré-existente do `test_admin` (PR #32 removeu `_FIREBASE_ADMIN_AVAILABLE`; fixture agora mocka `_verify_token`).
- **06/06/2026** — **🐛 BUG CRÍTICO corrigido (teste ao vivo Playwright):** `gemini-2.0-flash` foi **descontinuado pelo Google** (404 NOT_FOUND) — **era a causa real** do conteúdo sempre genérico (caía no fallback, não usava o LLM). Trocado para **`gemini-2.5-flash`** (probe confirmou: 2.0 e 1.5 mortos; 2.5-flash ok). Após o fix, o Oráculo gera conteúdo específico da marca usando as fontes do Tavily (validado: cliente "Havaianas" → conteúdo + provenance com URLs reais). **Observação:** domínios genéricos (wikipedia.org) trazem ruído de homônimo; onboarding real deve usar os domínios do próprio cliente.
- **06/06/2026** — **A2, A3, A4 concluídas.** Busca web real via Tavily (`web_search.py`, httpx) restrita aos `allowed_domains`; nó `research` no LangGraph injeta as fontes no prompt; `provenance` cita URLs reais. Secret `sunos-tavily-api-key` criado + wired no `deploy-api.yml`. Probe ao vivo confirmou busca real (wikipedia 3 results; suno.com.br 0 — pouco indexado). +4 testes offline (120 verde). **Frente A do Oráculo concluída** (resta A7, que depende do Drive — Frente B parada).
