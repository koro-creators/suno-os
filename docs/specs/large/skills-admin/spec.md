---
spec-id: SPEC-017
slug: skills-admin
artefato: spec
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-05-26
atualizada: 2026-05-26
versao: 1.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + Python 3.11"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: "Requisitos funcionais, não-funcionais e critérios de aceite do Skills Admin."
upstream:
  - docs/prd/parte1-feature-map.md (FA-12-01, FA-03, FA-09)
  - docs/brd/parte3-requisitos.md (BR-002, BR-004, BR-007, BR-015)
  - docs/brd/parte4-regras.md (RN-006, RN-009, RN-016)
---

# Spec — SPEC-017 — Skills Admin

## 1. Visão Geral

Skills Admin (`/skills`) é a interface administrativa que permite Líderes (P3) e Admins (P4) gerenciar o catálogo completo de Skills de IA do sunOS. Cobre criação, edição (4 tabs), versionamento, atribuição de moons e clientes, e arquivamento — com proteção de `system_prompt` via Caixa-preta.

A versão atual (protótipo) implementa toda a UI com React Context (sem backend). Esta SPEC especifica o caminho para produção: persistência PostgreSQL + RBAC backend + audit log.

## 2. Personas e Jornadas

| Persona | Objetivo principal | Jornadas cobertas |
|---------|-------------------|-------------------|
| PX-01 Líder/Curador (primário) | Criar e manter skills alinhadas aos clientes e processos | JN-01 (criação), JN-07 (curadoria) |
| PX-04 Admin | Governar catálogo, RBAC, configurações avançadas | JN-08 (governance) |
| PX-02 Criativo Sênior (beneficiário indireto) | Skills bem configuradas = outputs melhores | — |
| PX-03 Operador Processual (excluído) | Não acessa — Caixa-preta | — |

<!-- REVIEW: Há persona de PX-07 Sponsor de Área que pode precisar ver listagem de skills atribuídas a seu cliente? Definir se Sponsor vê view somente-leitura ou está no mesmo tier de acesso. -->

## 3. Requisitos Funcionais

### 3.1. Listagem (`/skills`)

| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| FR-SKA-001 | Exibir todas as skills em table view (Pattern Model Repo) com colunas: nome, slug, tipo, status, clientes atribuídos, última atualização | P0 |
| FR-SKA-002 | Filter sidebar com filtros: tipo (chat/multimodal/workflow), status (active/archived/draft), cliente atribuído | P0 |
| FR-SKA-003 | Busca full-text por nome e slug (debounced 300ms, mínimo 2 chars) | P0 |
| FR-SKA-004 | Ordenação por nome (A-Z/Z-A) e última atualização (mais recente/mais antiga) | P1 |
| FR-SKA-005 | Botão "Nova Skill" que abre `/skills/new` | P0 |
| FR-SKA-006 | Clicar em skill abre side drawer com preview; "Editar" navega para `/skills/[skillId]` | P1 |

### 3.2. Criação e Edição (`/skills/new`, `/skills/[skillId]`)

| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| FR-SKA-007 | **Tab Identidade**: campos name (obrigatório), slug (auto-gerado + editável, único), description, type (enum), icon (seletor), status (active/draft) | P0 |
| FR-SKA-008 | **Tab Configuração**: campos model (seletor: Gemini Flash default / GPT-4o / Claude Sonnet), temperature (slider 0.0–2.0), maxTokens (input 100–8000) | P0 |
| FR-SKA-009 | **Tab Configuração — `system_prompt`**: textarea visível SOMENTE para perfis P3 e P4; campo omitido do form inteiramente para P1/P2 | P0 |
| FR-SKA-010 | **Tab Moons**: listar moons associadas, adicionar (busca por nome), remover, reordenar via drag (ordem determina exibição no chat) | P1 |
| FR-SKA-011 | **Tab Clientes**: listar clientes disponíveis, atribuir/desatribuir via toggle; reflite junction `skill_clients` | P1 |
| FR-SKA-012 | Validar slug: apenas lowercase, alfanumérico e hífens; único no DB; erro inline se duplicado | P0 |
| FR-SKA-013 | Auto-gerar slug a partir do name (lowercase, espaços→hífens, remove acentos) no frontend | P1 |
| FR-SKA-014 | Salvar cria nova versão (version_number incremental); versão anterior preservada no DB | P1 |
| FR-SKA-015 | Visualizar histórico de versões (data, version_number, preview do nome/status) | P2 |

### 3.3. Segurança e Integridade

| ID | Requisito | Prioridade |
|----|-----------|:----------:|
| FR-SKA-016 | Backend endpoint `GET /api/skills/[id]` retorna `404` para qualquer request autenticado como P1/P2 | P0 |
| FR-SKA-017 | Audit log de alterações a `system_prompt`: registrar user_id, timestamp, hash SHA-256 do conteúdo anterior | P0 |
| FR-SKA-018 | Arquivar skill referenciada em workflow com status `active` retorna `409 Conflict` com lista de workflows afetados | P0 |
| FR-SKA-019 | Listagem `/api/skills` retorna apenas skills do mesmo `client_scope` do usuário autenticado (quando aplicável) | P1 |
| FR-SKA-020 | Soft delete via `status = 'archived'`; não remover registro do DB | P0 |

<!-- REVIEW: FR-SKA-009 assume que P3 (Líder) sempre vê system_prompt. Confirmar se há cenário onde Líder de outro cliente não deveria ver system_prompt de skill de outro cliente. -->

## 4. Requisitos Não-Funcionais

| ID | Requisito | Métrica |
|----|-----------|---------|
| NFR-SKA-001 | Listagem com ≤200 skills renderiza sem paginação em ≤500ms (p95) | Performance |
| NFR-SKA-002 | 100% dos requests P1/P2 a `/api/skills/*` retornam 404 (zero falsos negativos) | Segurança |
| NFR-SKA-003 | `system_prompt` ausente em todos os payloads de API para P1/P2 — verificável via teste de integração | Segurança |
| NFR-SKA-004 | 100% das alterações de `system_prompt` registradas no audit log | Auditabilidade |
| NFR-SKA-005 | RBAC enforcement no backend (não apenas UI-gate); resistente a bypass via curl direto | Segurança |
| NFR-SKA-006 | Slug conflict detection via DB unique constraint — sem race conditions em criações simultâneas | Integridade |

## 5. Restrições

| ID | Restrição |
|----|-----------|
| REST-SKA-01 | `data/clients.ts` NÃO é modificado por esta SPEC — Solar System permanece estático (ADR-002) |
| REST-SKA-02 | Sem instalação de novas dependências npm fora de Tailwind + Lucide (CLAUDE.md) |
| REST-SKA-03 | `system_prompt` não pode ser armazenado na Biblioteca (FA-01) nesta versão — ver ADR-LOCAL-01 em design.md |
| REST-SKA-04 | Visual das páginas do Solar System (Home, Client, Skill, Moon) não pode ser alterado |

## 6. Critérios de Aceite

| ID | Cenário | Resultado Esperado |
|----|---------|--------------------|
| CA-SKA-001 | Líder cria skill com type=chat, slug válido, status=active, sem system_prompt | Skill aparece na listagem com status active; version_number = 1 |
| CA-SKA-002 | Líder edita `system_prompt` de skill existente via Tab Configuração | Alteração salva; nova versão criada; audit log registra hash anterior + user_id |
| CA-SKA-003 | Operacional faz `GET /api/skills/abc-123` com JWT P2 | Resposta `{"detail":"Not found"}` com status 404 |
| CA-SKA-004 | Líder tenta arquivar skill referenciada em workflow com status active | Resposta 409; mensagem lista slugs dos workflows afetados |
| CA-SKA-005 | Admin cria skill com slug igual a skill existente | Erro inline no campo slug: "Slug já em uso"; form não submete |
| CA-SKA-006 | Líder adiciona moon "Pesquisa" à skill via Tab Moons | Moon aparece na listagem do tab; registrada em `moon_skills` com order_index |
| CA-SKA-007 | Líder atribui skill ao cliente "Santander" via Tab Clientes | Atribuição salva em `skill_clients`; cliente aparece como atribuído no tab |
| CA-SKA-008 | Líder arquiva skill sem dependências | Skill some da listagem default; aparece com filter status=archived; dados preservados |
| CA-SKA-009 | Operacional tenta navegar para `/skills` no browser | Redirecionado para `/404` via RBAC middleware |
| CA-SKA-010 | Líder edita nome de skill existente e salva | `version_number` incrementa; versão anterior acessível no histórico de versões |
