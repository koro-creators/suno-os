# ADR-011: Firebase Authentication como Provedor de Identidade

**Status:** Aceito
**Data:** 2026-05-15
**Decisores:** Heitor Miranda, José Lucas
**Origem:** Promovido do SRD Parte 7 ADR-006 (proposto 2026-04-28, já implementado)

---

## Contexto

O sunOS é uma plataforma 100% interna da Suno United Creators e precisa autenticar usuários (creators, líderes, admins) para enforçar RBAC (RN-009) e isolamento de contexto cross-client (RN-010).

O código observado implementa **Firebase Authentication** (projeto `toolbox-67a0e`): frontend usa Firebase JS SDK (`getIdToken()`), backend usa Firebase Admin SDK (`firebase-admin>=6.2.0`). A tabela `Conversation` referencia `user_id: String` — claim do JWT. Não há tabela `users` própria do sunOS — identidade totalmente delegada ao Firebase.

**Drivers:**

- BR-007 (Proteção de IP — Caixa-preta): autenticação obrigatória
- BR-008 (Privacidade): isolamento por usuário
- RN-009 (RBAC): perfis Admin/Líder/Operacional
- NFR-008 (JWT em 100% dos endpoints)
- Restrição: time de 4 devs — preferir provedor managed
- Padrão Toolbox: ecossistema interno Suno já usa Firebase Auth

---

## Decisão

**Firebase Authentication é o único provedor de identidade do sunOS**, com JWT validado em todas as rotas protegidas via dependency FastAPI.

- Login (UI) via Firebase JS SDK — Email/Password no MVP; SSO Google/Microsoft futuro
- Token enviado em header `Authorization: Bearer <JWT>` para `/api/*`
- Backend valida JWT via `firebase-admin` em dependency `get_current_user`
- Claims usados: `uid`, `email`, `email_verified`, custom claims `role` para RBAC
- RBAC usa custom claims Firebase + tabela `users`/`roles` interna para granularidade adicional

---

## Alternativas Consideradas

**Auth0** — rejeitado: custo mensal real (≥$240/mês em produção) sem alinhamento com ecossistema GCP; mais um vendor para gerenciar. Reavaliar se SSO SAML virar requisito firme.

**Keycloak self-hosted** — rejeitado: operação significativa (DB próprio, backups, upgrades, monitoring); time sem expertise; TCO maior que Firebase na escala atual.

**Google Cloud Identity Platform** — rejeitado: overkill no Piloto; funcionalidades avançadas não necessárias; migração do Firebase é trivial quando necessário.

---

## Consequências

**Positivas:**
- Managed identity — sem operar IdP próprio (zero servers para Authn)
- Tokens JWT padronizados com chaves rotacionadas pelo Google
- Custom claims para RBAC simplificam server-side enforcement
- SDKs maduros para frontend (JS) e backend (Python `firebase-admin`)
- Padrão Toolbox — sinergia operacional com ferramentas internas
- Custo zero para volume Suno (Firebase Auth gratuito até dezenas de milhares de MAU)
- MFA disponível quando necessário (BR-007)

**Negativas:**
- Vendor lock-in com Google — mitigação: lock-in já existe (Cloud Run, Cloud SQL, Gemini); IdP é trocável
- SSO corporativo (Google Workspace existente) requer configuração — geralmente trivial
- Cotas do Firebase Spark/Blaze plan — monitorar mensalmente
- Compartilhamento do project `toolbox-67a0e` com Toolbox — avaliar separação no MVP

---

## Rastreabilidade

| Tipo | IDs |
|------|-----|
| BRs | BR-007 (Proteção IP), BR-008 (Privacidade) |
| RNs | RN-009 (RBAC), RN-012 (Auditoria) |
| NFRs | NFR-008 (Auth), NFR-009 (RBAC) |
| Containers | CT-02 (Backend), CP-35 (`firebase.py`), FE-04 (Login), FE-10 (`api.ts`), FE-11 (`firebase.ts`) |
| ADRs | ADR-002 (engine único — `user_id` Firebase é dimensão de personalização), ADR-009 (Gemini + Firebase compartilham hosting GCP) |

## Critérios para Revisitar

- [ ] Projeto `toolbox-67a0e` virar gargalo de cota — avaliar project dedicado `sunos-prod`
- [ ] Requisito SSO corporativo (SAML/OIDC) emergir formalmente
- [ ] Regulamentação exigir controle de identidade totalmente on-premise
