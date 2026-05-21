# Handoff — 2026-05-14 — BRD Critique + Cleanup

**Duração aproximada:** ~1h
**Foco:** Autocrítica do BRD (4 partes) e correção de todos os problemas que não exigiam decisão do usuário.

---

## O que foi feito

### Autocrítica gerada (10 pontos)

1. Versionamento inconsistente em 3 das 4 partes (**corrigido**)
2. "Sponsor" com dois significados incompatíveis no mesmo BRD (**corrigido**)
3. §10 duplicada na Parte 2 (**corrigido**)
4. ADR count e SPEC count desatualizados no Glossário (**corrigido**)
5. BR-021 placeholder sem conteúdo (**corrigido — BR escrito**)
6. Escopo do Piloto não visível nos BRs (**corrigido — coluna Fase adicionada**)
7. Sumário da Parte 4 diz "22 RNs" mas há 34 (**corrigido**)
8. KPIs todos "propostos" — **pendente** (exige validação com Guga/Comitê)
9. BR-001 Moon Shot como Alta prioridade no Piloto — **pendente** (escopo já decidido: Momento 2, mas prioridade BR requer discussão)
10. PRE-03 não atualizada pós-FA-16 (**corrigido — PRE-03a + PRE-03b**)

### Parte 1 — Contexto (v1.3 → v1.4)
- Frontmatter `versao` e `ultima_atualizacao` corrigidos (eram 1.0 / 2026-04-28)
- **PRE-03 dividida** em:
  - PRE-03a: dados de trabalho regular (consentimento implícito — regime anterior mantido)
  - PRE-03b: gravação de áudio/vídeo de reuniões — consentimento **explícito** obrigatório (LGPD Art. 7, alinhado a RN-031)

### Parte 2 — Glossário (v1.2 → v1.3)
- Frontmatter `versao` e `ultima_atualizacao` corrigidos
- **§10 duplicada resolvida**: segundo "§10 Governança e Estrutura Operacional" renomeado para §12
- **Ambiguidade "Sponsor" resolvida**:
  - §4: renomeado para "Sponsor Executivo" (= Guga, patrocinador único do projeto)
  - §12: renomeado para "Sponsor de Área" (= sócios por área, formalizado 14/05/2026)
  - Cross-refs bidirecionais entre os dois
- **ADR count**: 2 → 8 ADRs (ADR-001 a ADR-008; ADR-001 superseded por ADR-003)
- Source path ADR corrigido: `docs/adr/` → `docs/srd/parte7-ADRs.md`
- Índice alfabético atualizado ("Sponsor | 4" → "Sponsor Executivo | 4" + "Sponsor de Área | 12")

### Parte 3 — Requisitos (v1.2 → v1.3)
- **Coluna "Fase"** adicionada ao sumário de 22 BRs:
  - Piloto: BR-002 a BR-013, BR-015 a BR-016, BR-018 a BR-019, BR-021, BR-022
  - Momento 2: BR-001 (Moon Shot), BR-014 (homogeneização), BR-017 (Aprovação), BR-020 (Captura)
- **BR-021 escrito** com conteúdo completo (era placeholder desde v1.0):
  - Título: "Wiki Ontológica — repositório de entidades estruturadas por cliente"
  - Prioridade: Alta / Fase: Piloto
  - 10 critérios de aceite (entidades, HITL, PRE_ACTIVE gate, RAG ontológico, caixa-preta)
  - Dependências: BR-018, BR-022, BR-020, BR-007, BR-009
  - Fonte: reuniões 07/05, 13/05, 14/05/2026
- BR-021 adicionado à Matriz BR ↔ OBJ (cobre OBJ-01, 02, 03, 04)
- Seção "Matriz BR ↔ Personas" preenchida com nota de reserva (estava vazia sem indicação)
- Changelog adicionado (seção estava ausente)
- Menções "placeholder" limpas (intro + dependência em BR-022)

### Parte 4 — Regras (v1.2 → v1.3)
- Frontmatter `versao` corrigido (era 1.0, changelog já mostrava 1.2)
- **Sumário**: "(22 RNs)" → "(34 RNs)"
- **RN-031 a RN-034 adicionados à tabela do sumário** (existiam no corpo mas ausentes da tabela)
- **Matriz de Confiabilidade corrigida**:
  - Alta: 12 → 22 (inclui RN-023 a RN-025, RN-027 a RN-029, RN-031, RN-032, RN-034)
  - Média: 9 → 11 (inclui RN-026, RN-030, RN-033)
  - Total: 22 → 34 ✓
- "Cobertura completa: 19+ BRs exceto placeholders" → "22 BRs (BR-001 a BR-022)"
- BR-021 adicionado à Matriz de Cobertura RN ↔ BR

---

## Decisões tomadas

| Decisão | Justificativa | Onde documentada |
|---------|--------------|-----------------|
| PRE-03 → PRE-03a + PRE-03b | Gravação de reuniões (FA-16) tem regime legal diferente: LGPD Art. 7 exige consentimento explícito, não implícito | Parte 1 §5.2, alinhado com RN-031 |
| "Sponsor Executivo" vs "Sponsor de Área" | Dois significados incompatíveis no mesmo documento; distinção óbvia da estrutura de governança | Parte 2 §4 e §12 |
| BR-021 como Alta / Piloto | Wiki Ontológica é dependência de BR-018, BR-022, e pré-requisito do PRE_ACTIVE gate | Parte 3 BR-021 |
| Fase "Momento 2" para BR-001, BR-014, BR-017, BR-020 | Moon Shot e FA-13/FA-16 decididos como Momento 2 em critique do PRD | Parte 3 sumário coluna Fase |

---

## Arquivos modificados

- `docs/brd/parte1-contexto.md` — v1.4
- `docs/brd/parte2-glossario.md` — v1.3
- `docs/brd/parte3-requisitos.md` — v1.3
- `docs/brd/parte4-regras.md` — v1.3

---

## Pendências (não atacadas — exigem decisão)

- **Ponto 8 (KPIs sem validação)**: KPIs da Parte 1 §2.3 todos como "Proposto", baseline "N/D". Exige validação com Guga ou Comitê antes do Piloto.
- **Ponto 9 (BR-001 prioridade)**: BR-001 (Moon Shot) continua como "Alta" prioridade, mas Fase já marcada como Momento 2. A prioridade dentro do Momento 2 ainda precisa ser explicitada (é Alta dentro de Momento 2? Ou rebaixar para Média até chegar lá?).

---

## Próximo passo natural

Os dois pontos pendentes (8 e 9) são rápidos de resolver:
- Ponto 8: definir pelo menos os KPIs do Piloto (UAS, mensagens/semana, workflows ativos) com metas validadas pelo usuário
- Ponto 9: confirmar se BR-001 mantém "Alta" (dentro do Momento 2) ou muda de prioridade

Após isso, BRD estará em estado coeso para apresentação à Diretoria.

---

## Aprendizados / pegadinhas

- **Duas "seções §10"** surgem naturalmente quando features são adicionadas incrementalmente ao glossário — revisão estrutural periódica é necessária.
- **"Sponsor"** é um termo com sobrecarga semântica no contexto da Suno: o sponsor executivo (Guga) e os sponsors de área usam a mesma palavra. Qualquer novo documento deve distinguir desde o início.
- **BR-021 placeholder por 3 semanas**: é o tipo de gap que bloqueia rastreabilidade silenciosamente — outras BRs dependiam dele mas ele não existia. Placeholders com dependências são dívida técnica de documentação.
