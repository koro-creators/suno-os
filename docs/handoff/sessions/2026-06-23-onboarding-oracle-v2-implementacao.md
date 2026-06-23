# Handoff — 2026-06-23 — Onboarding Oracle v2: Implementação completa

**Duração aproximada:** ~3h (duas sessões consecutivas, segunda com compactação de contexto)
**Foco:** Implementação do fluxo de onboarding Oracle v2 — migração 6→9 entidades, redesign do wizard step 3, progress panel, HITL validate, wiki e bugfixes estruturais.

## O que foi feito

### Sessão 1 (antes da compactação)
- `lib/onboarding-types.ts` — migrou `ONTOLOGY_ENTITY_TYPES` de 6 nomes PT para 9 códigos EN; adicionou `ENTITY_LABELS`, `ENTITY_ADMIN_ONLY` (CONTRACTED_SCOPE), `ENTITY_CONDITIONAL` (MARTECH_STACK)
- `components/layout/AppShell.tsx` — oculta ChatPanel em rotas `/onboarding/*`
- `components/onboarding/OracleProgressPanel.tsx` — exibe labels PT + badges admin/condicional
- `components/onboarding/EntityValidationCard.tsx` — props `label`, `isAdminOnly`, `isConditional`; cabeçalho com badges
- `components/onboarding/WizardStep3Drive.tsx` — reescrita completa: documentos por tipo (Proposta/Ata/Contrato/Outro) + equipe alocada (cargo + pessoa + "A contratar") + pasta workspace Suno
- `components/wiki/WikiEntityCard.tsx` — exibe `ENTITY_LABELS[entityType]` em vez do código cru
- `components/wiki/WikiPanel.tsx` — layout 3-col (nav lateral 210px + conteúdo); filtragem caixa-preta para não-admin
- `app/clientes/[clientId]/onboarding/validate/page.tsx` — 9 entity cards; CONTRACTED_SCOPE ocultado para não-admin; `visibleEntityTypes` para `allAccepted`

### Sessão 2 (bugfixes identificados pelo advisor)
- `lib/onboarding-types.ts` — adicionou `DocType`, `DocEntry`, `TeamRow` ao arquivo; adicionou `docEntries`/`teamRows` ao `WizardState`
- `contexts/OnboardingOraculoContext.tsx` — `emptyWizardState` inicializa `docEntries` e `teamRows` com defaults; `submitWizard` deriva `selected_doc_ids` de `docEntries` em vez de `selectedDocIds`
- `components/onboarding/WizardStep3Drive.tsx` — `docs`/`teamRows` agora vivem no `wizardState` (não local state); sobrevivem navegação back/forward; handlers chamam `updateWizard()` diretamente
- `components/wiki/WikiPanel.tsx` — nav clicar agora filtra conteúdo para a entidade ativa (antes mostrava todos)
- `app/clientes/[clientId]/wiki/page.tsx` — botões de ação agora em barra full-width (antes centrados a 768px, desalinhados com o layout 3-col)
- `components/onboarding/WizardStep4Confirm.tsx` — pills de entidades exibem `ENTITY_LABELS[et]` em vez de códigos crus (ex: "Perfil do Cliente" em vez de "CLIENT_PROFILE")
- `app/clientes/[clientId]/onboarding/validate/page.tsx` — removida nota contraditória sobre non-admin + CONTRACTED_SCOPE

## Decisões tomadas

- **docEntries/teamRows no WizardState** — alternativa seria localStorage ou state elevado acima do wizard, mas colocar em WizardState foi o menor caminho; fica resetado junto com o wizard ao criar cliente. ADR: implícito (não há alternativas com vantagens claras).
- **WikiPanel nav = filtro de entidade** — clicar na nav mostra só aquela entidade no painel direito (não scroll). Lógica: nav de 9 itens → usuário quer ver 1 entidade por vez. Alternativa (scroll-to) teria sido adequada também.
- **Non-admin + CONTRACTED_SCOPE** — `allAccepted` computa sobre `visibleEntityTypes` (8 para não-admin). O "Finalizar" habilita quando as 8 visíveis estão aprovadas. Backend (ADR-LOCAL-04) é o gate real para transição a ACTIVE. A nota contraditória foi removida.
- **MARTECH_STACK auto-accept** — badge `condicional` foi implementado mas auto-accept (aceitar automaticamente quando conteúdo vazio) NÃO foi implementado. Requer lógica no backend e no mock-mode para detectar "vazio" vs "gerado com conteúdo". Deixado como TODO para fase E.

## Arquivos modificados

```
lib/onboarding-types.ts
contexts/OnboardingOraculoContext.tsx
components/layout/AppShell.tsx
components/onboarding/EntityValidationCard.tsx
components/onboarding/OracleProgressPanel.tsx
components/onboarding/WizardStep3Drive.tsx
components/onboarding/WizardStep4Confirm.tsx
components/wiki/WikiEntityCard.tsx
components/wiki/WikiPanel.tsx
app/clientes/[clientId]/onboarding/validate/page.tsx
app/clientes/[clientId]/wiki/page.tsx
```

## Pendências

- **MARTECH_STACK auto-accept** — mockup previa "aceitar vazio automaticamente"; não implementado. Requer: detecção de conteúdo vazio no validate page + chamada automática a `handleValidate('accept')` no mount. Backend deve reconhecer que MARTECH_STACK vazio = válido.
- **Non-admin validate** — `AuthContext` força `role: 'admin'` em dev-mode (linha ~39). O fluxo non-admin (8 entidades visíveis, CONTRACTED_SCOPE oculto) está implementado mas **nunca testado visualmente**. Para testar: temporariamente forçar `role: 'creator'` no `AuthContext` dev-mode.
- **api/onboarding/constants.py** — ainda contém os 6 nomes PT antigos (não foi alterado nesta sessão). É o backend Python — escopo de sessão separada.
- **Teste visual em browser** — não foi feito nesta sessão porque o Chrome DevTools MCP estava com browser de sessão anterior ocupado. TypeScript passa; código foi revisado manualmente.
- **PR** — não aberto (aguarda confirmação do usuário).

## Próximo passo natural

1. Testar o fluxo completo no browser: `/clientes/[id]/onboarding/wizard` → step 3 (add docs, navegar pra 4 e voltar → docs devem persistir) → step 4 confirm (pills em PT) → progress → validate (9 cards) → wiki (nav funcional)
2. Forçar `role: 'creator'` no AuthContext e verificar que CONTRACTED_SCOPE some da validate + wiki
3. Abrir PR quando validação visual OK

## Aprendizados / pegadinhas

- **Estado local em step desmontado**: Step 3 era montado/desmontado condicionalmente pelo wizard container — `useState` local se perde ao navegar. Padrão correto: estado que precisa sobreviver navegação fica no Context pai.
- **Side effects no render**: Tentei inicializar `docEntries` via IIFE durante render — React não permite efeitos colaterais no corpo do componente. Correto foi inicializar em `emptyWizardState()`.
- **WikiPanel mostrava todos os cards**: `visibleEntities.map` no conteúdo ignorava `activeEntity` — a variável existia mas não era usada para filtrar.
- **TypeScript estrito com `new Set<>` genérico**: `new Set(['CONTRACTED_SCOPE'])` infere `Set<string>`, não `Set<OntologyEntityType>`. Necessário `new Set<OntologyEntityType>(['CONTRACTED_SCOPE'])`.
