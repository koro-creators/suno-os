# Convenções SDD — sunOS

Regras práticas para escrever specs `large` (5 artefatos) e `medium` (1 arquivo) seguindo o padrão estabelecido em SPEC-001 a SPEC-006 deste repo.

## Frontmatter `escopo:` é canônico

Bloco padrão na primeira linha de toda spec:

```yaml
---
spec-id: SPEC-NNN
slug: <slug>
artefato: constitution|spec|design|plan|tasks
nivel-sdd: spec-anchored
tamanho: large|medium|small
status: rascunho|em-revisao|aprovada|implementada|substituido|obsoleta
criada: YYYY-MM-DD
atualizada: YYYY-MM-DD
versao: X.Y
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + Python 3.11"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: <1-2 frases descrevendo o que esta SPEC entrega>
upstream:
  - docs/brd/parteX-...md (BR-XXX)
  - docs/srd/parteX-...md (DO-XX)
  ...
---
```

Para SPECs com pré-condições externas (sponsor alignment, ADR pendente, contrato cliente): adicionar bloco `pre_conditions:` no frontmatter da `constitution.md` (pattern aplicado em SPEC-006 PRE-01..04).

## `<!-- REVIEW -->` markers inline

Vão **no ponto natural de revisão**, não no final do documento. Padrão estabelecido por SPEC-001:

```markdown
## 2. Personas e Jornadas
... (4 personas)
<!-- REVIEW: As 4 personas cobrem todos os atores ou falta alguém? -->
```

Não usar comentários HTML de revisão como TODO; eles são gates do `<!-- REVIEW -->` checkpoint do workflow large da `sdd-koro` skill.

## ADR-LOCAL para decisões scoped à SPEC

Decisões que valem **apenas** para esta SPEC vão em `design.md § "Decisões Locais"` como `ADR-LOCAL-NN`. Não pollute `docs/srd/parte7-ADRs.md` com decisões de implementação.

Cada ADR-LOCAL: status, contexto, decisão, alternativas consideradas com motivos de rejeição, consequências (✅/⚠️). SPEC-005 e SPEC-006 têm 5-6 ADR-LOCAL cada — referência viva.

## Backward-mapping em `tasks.md`

Toda `tasks.md` de spec large termina com 2 tabelas:

1. **Mapa CA ↔ Tasks** — para cada CA do `spec.md §7`, lista as tasks que cobrem
2. **Mapa Tasks ↔ FR/NFR/ADR-LOCAL** — para cada FR/NFR/ADR-LOCAL, lista as tasks

Permite verificação trivial: pegar qualquer FR/CA, ver onde está coberto. SPEC-004 (66 tasks) e SPEC-006 (58 tasks) usam.

## Predecessor SPEC handling

Quando uma SPEC reverte uma decisão de outra SPEC (raro mas acontece — SPEC-005 reverteu SPEC-003):

1. Marcar SPEC antiga: `status: substituido` + `substituido_por: SPEC-NNN` no frontmatter de **todos** os 5 artefatos
2. Adicionar banner top em cada artefato apontando para a nova
3. Na nova SPEC: `predecessor_decision_reversed:` no frontmatter, citando linha exata da SPEC antiga que está sendo revertida

Permite rastrear evolução de decisão sem git archaeology.

## Workflow large — fases tipicamente A–F

Mapeamento padrão para `plan.md`:

| Fase | Marco PRD | Conteúdo típico |
|------|-----------|-----------------|
| A | POC inicial | Foundation: schema, plumbing, dependency injection |
| B | POC end-to-end backend | Domain logic, validators, compilers |
| C | Protótipo | UI / persistência completa, sem polish |
| D | Piloto (cliente real) | Migration produção, runbooks |
| E | MVP estabilizado | Observability, polish, sunset agendado |
| F | (opcional) | Polish adicional / E2E |

Cada fase tem **gate** explícito antes de seguir. Não pular gate.

## Verbos do vocabulário Suno (proibidos em copies)

`gerar`, `otimizar`, `eficiência`, `accelerator`, `smart`, `AI-powered`. Sempre Koro com K, Drive com D.

## Caixa-preta (recorrente)

RN-009/011 generalizado: Operacional não vê Biblioteca, system_prompts, brand-guidelines, conteúdo de outro cliente. Endpoints retornam **404** (não 403) — não revelar existência. Detalhes em `.claude/rules/caixa-preta.md`.
