---
spec-id: SPEC-015
slug: onboarding-oraculo-cliente
artefato: spec
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-05-15
atualizada: 2026-05-15
versao: 1.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + Python 3.11"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: FA-15 — wizard de onboarding de cliente + Oráculo + HITL + Wiki Ontológica
upstream:
  - docs/brd/parte3-requisitos.md (BR-021, BR-022, BR-018)
  - docs/brd/parte4-regras.md (RN-032, RN-033, RN-009, RN-011, RN-012)
  - docs/prd/parte4-FRs.md (FR-180–FR-185)
  - docs/ux/parte1-inventario-telas.md (T-34, T-35, T-36, T-39)
---

# Especificação — FA-15 Onboarding com Oráculo do Cliente (SPEC-015)

## 1. Visão Geral

**O quê**: Wizard de onboarding de novo cliente em 4 passos que dispara o "Oráculo do Cliente" — Deep Agent LangGraph que gera automaticamente seed de 6 entidades ontológicas a partir de documentos do Drive Suno e pesquisa web em allow-list. Após geração, HITL gate obrigatório (RN-032) por entidade. Cliente ativa para status ACTIVE somente após aprovação de todas as 6 entidades. Wiki Ontológica (`/clientes/[slug]/wiki`) é a view persistente dessas entidades — acessível pós-ACTIVE para Admin e Curador; invisível (404) para Operacional (RN-011).

**Por quê**: Hoje, onboarding de um novo cliente no sunOS é manual — Admin preenche informações básicas, e as Skills não têm contexto ontológico do cliente, gerando outputs genéricos. O Oráculo resolve isso: transforma documentos do cliente em conhecimento estruturado que alimenta RAG e Skills de forma rastreável e auditável (BR-021).

**Para quem**:
- **PX-01 (Líder de Área / Curador)**: conduz o wizard e valida as entidades no HITL
- **PX-07 (Sponsor de Área)**: acessa a Wiki pós-onboarding para editar entidades diretamente (JN-15)
- **Admin (PX-04)**: monitora clientes em PRE_ACTIVE, acessa log de auditoria

**Escopo incluído**:
- Wizard 4 passos (T-34) + job de sync Drive (dependência de FA-14)
- Oráculo Deep Agent: seed das 6 entidades ontológicas (T-35)
- HITL gate entidade-a-entidade (T-36)
- Wiki Ontológica: view + edição inline (T-39)
- Gate PRE_ACTIVE → ACTIVE automático
- Caixa-preta para Operacional

**Escopo excluído (Momento 2 ou outras SPECs)**:
- Captura de reuniões (FA-16, SPEC separada)
- Integração com RAG AlloyDB+pgvector (ADR-008) — sera tratada em SPEC de integração RAG
- Diff visual de versões da Wiki (backlog)
- Exportação de Wiki para PDF/Notion

---

## 2. Personas e Jornadas

### PX-01 — Líder de Área / Curador

- **Perfil**: profissional da área (ex: Líder de Mídia, Planejamento), responsável pela curadoria do conhecimento do cliente
- **Objetivo**: cadastrar novo cliente e garantir que as entidades ontológicas estão corretas antes de ativar a conta
- **Jornada JN-13**: `/clientes/new` → Wizard passo 1-4 → aguarda Oráculo → valida entidade a entidade (T-36) → cliente ACTIVE → acessa Wiki (T-39)

### PX-07 — Sponsor de Área

- **Perfil**: sócio/sponsor responsável pela área, acesso direto à Wiki sem passar pelo wizard
- **Objetivo**: editar entidades ontológicas do cliente para mantê-las atualizadas após onboarding
- **Jornada JN-15**: `/clientes/[slug]/wiki` → edita entidade inline → salva (sem regeneração completa)

### Admin (PX-04)

- **Perfil**: admin do sistema
- **Objetivo**: monitorar clientes presos em PRE_ACTIVE, ver log de auditoria HITL
- **Fluxo**: painel de admin com lista de clientes PRE_ACTIVE + tempo pendente + alerta se ≥72h

<!-- REVIEW: As 3 personas cobrem todos os atores desta feature? PX-06 (Operacional) é intencionalmente excluído — tem acesso 404 à Wiki (RN-011). -->

---

## 3. Requisitos Funcionais

### RF-01 — Wizard de cadastro em 4 passos (FR-180)

**Prioridade**: Core

Passos:
- **Passo 1 (Metadados)**: nome, slug (URL-friendly, único, validação inline), setor, porte (SMB/Mid/Enterprise), website oficial
- **Passo 2 (Oráculo)**: profundidade de pesquisa (superficial/padrão/profunda), domínios permitidos (allow-list editável, default: site oficial + LinkedIn + Glassdoor + portais de notícia do setor), idiomas
- **Passo 3 (Drive)**: OAuth flow para conectar pasta Drive Suno internal do cliente (FA-14-01, escopo `drive.readonly`)
- **Passo 4 (Confirmação)**: resumo dos 3 passos + botão "Disparar Oráculo"

**Regras**:
- RN-W01: validação inline por passo (não só no submit final)
- RN-W02: auto-save do estado entre passos, TTL 24h
- RN-W03: input humano ativo ≤5 minutos (excluindo espera do Oráculo)
- RN-W04: slug deve ser único e URL-friendly (`/^[a-z0-9-]+$/`)

### RF-02 — Trigger e progresso do Drive Sync (FR-181)

**Prioridade**: Core

Ao confirmar passo 3, dispara job assíncrono de sync inicial do Drive:
- Job retorna `eta_hours` estimado (default: "até 24h")
- UI exibe barra de progresso baseada em polling do status do job (`/api/clients/{slug}/onboarding/status`)
- Alerta in-app para Admin se job não completar em ≤72h com `error_detail`

### RF-03 — Oráculo: seed das 6 entidades (FR-182)

**Prioridade**: Core

Após sync completo do Drive, o Oráculo executa geração das 6 entidades:

| # | Entidade | Código |
|---|----------|--------|
| 1 | Perfil do Cliente | `PROFILE` |
| 2 | Mercado e Setor | `MARKET` |
| 3 | Concorrentes Diretos | `COMPETITORS` |
| 4 | Personas-Alvo | `TARGET_PERSONAS` |
| 5 | Histórico de Campanhas | `CAMPAIGN_HISTORY` |
| 6 | Restrições Legais e Contratuais | `LEGAL_CONSTRAINTS` |

**Regras**:
- Cada entidade: ≥100 palavras de conteúdo substantivo
- Cada claim: proveniência rastreável (`Drive/{filename}` ou `Web/{url}` ou `Briefing`)
- Conclusão em ≤30 min (objetivo ≤15 min p95)
- Status da entidade inicial: `generated` (aguarda HITL)

### RF-04 — Pesquisa web com allow-list (FR-183)

**Prioridade**: Alta

Oráculo consulta apenas domínios da allow-list do passo 2. Para cada consulta web:
- Registra: URL, `datetime_utc`, trecho citado, entidade destino
- Bloqueia: domínios fora da allow-list, paywall, login-required, `robots.txt Disallow`
- Allow-list padrão pré-populada no passo 2 (editável pelo usuário)

### RF-05 — HITL gate entidade-a-entidade (FR-184)

**Prioridade**: Core

UI de validação (T-36) para PX-01:
- Navegar entidade por entidade em sequência (e.g., `/clientes/[slug]/onboarding/validate?entity=0`)
- 3 ações por entidade:
  - **Aceitar**: marca `status: accepted`, registra auditoria
  - **Editar e Aceitar**: textarea expansível inline, salva diff `(original, editado)`, marca `status: accepted`
  - **Rejeitar e Regenerar**: Oráculo regenera só aquela entidade; UI volta a esta entidade após nova geração
- Sem "Aceitar tudo" ou "Pular" (RN-032)
- Mostra proveniência de cada claim antes da decisão
- Cada decisão auditada: `timestamp`, `user_id`, `entity_type`, `action`, `before_text`, `after_text`

### RF-06 — Gate PRE_ACTIVE → ACTIVE (FR-185)

**Prioridade**: Core

- Cliente criado entra em `PRE_ACTIVE` imediatamente após disparo do wizard
- `PRE_ACTIVE` bloqueia: Skills processuais, Moon Shot, Workflows (backend hard-block, 404)
- `ACTIVE` só após aprovação explícita de **todas** as 6 entidades pelo HITL gate
- Transição `PRE_ACTIVE → ACTIVE` automática ao aceitar a 6ª entidade — sem passo adicional
- Admin vê lista de clientes PRE_ACTIVE com `pending_since`
- Alerta in-app se `pending_since` ≥72h

### RF-07 — Wiki Ontológica (T-39, BR-021)

**Prioridade**: Core (Piloto)

View persistente das entidades do cliente em `/clientes/[clientSlug]/wiki`:
- Exibe as 6 entidades em cards/seções expansíveis
- Edição inline para PX-01 e PX-07 (não requer Oráculo — edição direta)
- Badge de origem por entidade: `seed automático` / `revisado HITL` / `atualizado via captura [ID reunião]`
- Histórico simplificado: mostra última edição (who + when)
- **Caixa-preta para Operacional**: `/api/clients/{slug}/wiki` → 404 para role Operacional (RN-011)
- Gate: apenas visível se `client.status === ACTIVE`

---

## 4. Comportamento Especificado

### 4.1 Fluxo Principal — JN-13 (Onboarding Completo)

```
PX-01 acessa /clientes/new
  → Wizard Passo 1: Metadados → salvo em PRE_ACTIVE draft
  → Wizard Passo 2: Oráculo config → salvo
  → Wizard Passo 3: OAuth Drive → conectado
  → Wizard Passo 4: Confirmação → "Disparar Oráculo"
    → client.status = PRE_ACTIVE
    → job: drive_sync_initial(client_slug) [assíncrono]
    → UI: T-35 (Progresso Seed)
      → polling /api/clients/{slug}/onboarding/status
      → drive_sync: pending → running → completed
      → oracle_seed: pending → running → entity_1_done ... → completed
    → UI: redireciona para T-36 (Validação HITL)
      → Entidade 1 de 6: exibe conteúdo + proveniência + 3 ações
      → Aceitar → próxima entidade
      → Editar+Aceitar → editor inline → próxima entidade
      → Rejeitar+Regenerar → aguarda regeneração → mostra entidade regenerada
      → Após entidade 6 aprovada:
        → client.status = ACTIVE (automático)
        → redirect para /clientes/{slug}/wiki (T-39)
```

### 4.2 Fluxo Alternativo — JN-15 (Edição direta na Wiki)

```
PX-07 acessa /clientes/[slug]/wiki (client.status === ACTIVE)
  → Visualiza 6 entidades em cards
  → Clica em entidade → editor inline expansível
  → Salva → entity.status = "updated_direct"
  → Badge atualizado
  → Auditoria registrada
```

### 4.3 Fluxo de Erro — Operacional tenta acessar Wiki

```
PX-06 (Operacional) GET /api/clients/{slug}/wiki
  → Backend: verifica role → Operacional
  → Responde: HTTP 404 (não 403)
  → Mensagem: "Recurso não disponível"
Frontend rota /clientes/[slug]/wiki para PX-06:
  → redirect para /404
```

### 4.4 Máquina de Estados do Cliente (Onboarding)

```
[DRAFT] ──wizard_submitted──► [PRE_ACTIVE] ──all_entities_accepted──► [ACTIVE]
                                    │
                                    └──admin_cancel──► [CANCELLED]
```

Estados adicionais da entidade ontológica:

```
[pending] ──oracle_generated──► [generated] ──hitl_accept──► [accepted]
                                     │
                                     └──hitl_reject──► [regenerating] ──oracle_done──► [generated]
```

### 4.5 Fluxos de Erro

| Condição | Response Backend | UI |
|----------|-----------------|-----|
| Slug já existe | 422 `slug_already_exists` | Erro inline no passo 1 |
| Drive OAuth falha | 400 `drive_auth_failed` | Toast + retry no passo 3 |
| Drive sync timeout (>72h) | Job `status: failed` | Alerta in-app para Admin |
| Oráculo timeout (>30 min) | Job `status: oracle_failed` | Mensagem + opção de retry manual |
| Entidade sem proveniência | Oráculo rejeitado em validação | Regeneração obrigatória (mesma que Rejeitar) |
| PX-06 acessa Wiki | 404 | redirect /404 |
| Entidade aceita com <100 palavras | 422 na API | Editor mostra aviso (não bloqueia se PX-01 escolhe aceitar assim mesmo — é decisão dele) |

---

## 5. Requisitos Não-Funcionais

### RNF-01: Performance

- Oráculo completa em ≤30 min; objetivo ≤15 min p95
- Polling de status: intervalo inicial 5s, backoff até 30s após 5min sem progresso
- Wiki load: ≤500ms após ACTIVE (dados já em DB)

### RNF-02: Segurança

- `client_id` em toda query (RN-010)
- Wiki: 404 para Operacional (RN-011)
- Drive OAuth: escopo `drive.readonly`, per-operator (ADR-006)
- Allow-list enforced no agente, não só na UI
- Audit log imutável (append-only)

### RNF-03: Auditabilidade (RN-012)

- Todo evento de HITL persistido: `entity_hitl_events` table
- Campos: `id`, `client_id`, `entity_type`, `action` (accept/edit/reject), `before_text`, `after_text`, `user_id`, `timestamp_utc`
- Audit log acessível para Admin em `/api/clients/{slug}/wiki/audit`

### RNF-04: Resiliência

- Job de Oráculo retomável: se processo reinicia, retoma a partir da última entidade completa
- Auto-save do wizard: estado persistido por até 24h

---

## 6. Interface & Contratos

### 6.1 Endpoints (backend `api/`)

```
POST   /api/clients                              # Criar cliente + iniciar PRE_ACTIVE
GET    /api/clients/{slug}/onboarding/status     # Polling: drive_sync + oracle + entities
POST   /api/clients/{slug}/onboarding/validate/{entity_type}  # Aceitar/Editar/Rejeitar entidade
POST   /api/clients/{slug}/onboarding/regenerate/{entity_type} # Regenerar entidade rejeitada
GET    /api/clients/{slug}/wiki                  # Wiki (404 para Operacional)
PATCH  /api/clients/{slug}/wiki/{entity_type}    # Edição direta (PX-01/PX-07)
GET    /api/clients/{slug}/wiki/audit            # Audit log (Admin only)
GET    /api/clients?status=PRE_ACTIVE            # Lista clientes pendentes (Admin)
```

### 6.2 Tipos Principais

```typescript
// lib/onboarding-types.ts
export type ClientStatus = 'DRAFT' | 'PRE_ACTIVE' | 'ACTIVE' | 'CANCELLED';

export type OntologyEntityType =
  | 'PROFILE'
  | 'MARKET'
  | 'COMPETITORS'
  | 'TARGET_PERSONAS'
  | 'CAMPAIGN_HISTORY'
  | 'LEGAL_CONSTRAINTS';

export const ONTOLOGY_ENTITY_TYPES: OntologyEntityType[] = [
  'PROFILE', 'MARKET', 'COMPETITORS',
  'TARGET_PERSONAS', 'CAMPAIGN_HISTORY', 'LEGAL_CONSTRAINTS',
];

export type EntityStatus = 'pending' | 'generated' | 'regenerating' | 'accepted';

export type EntityBadge = 'seed_auto' | 'hitl_reviewed' | 'capture_update';

export interface WikiEntity {
  entity_type: OntologyEntityType;
  content: string;            // texto estruturado ≥100 palavras
  status: EntityStatus;
  badge: EntityBadge;
  provenance: ProvenanceEntry[];
  last_updated_at: string;    // ISO 8601
  last_updated_by: string;    // user_id
}

export interface ProvenanceEntry {
  source_type: 'drive' | 'web' | 'briefing';
  reference: string;          // filename ou URL
  cited_excerpt: string;
  retrieved_at: string;       // ISO 8601 (para web)
}

export interface OnboardingStatus {
  client_status: ClientStatus;
  drive_sync: 'pending' | 'running' | 'completed' | 'failed';
  oracle_seed: 'pending' | 'running' | 'completed' | 'failed';
  entities: Record<OntologyEntityType, EntityStatus>;
  eta_hours?: number;
  error_detail?: string;
}
```

```python
# api/onboarding/schemas.py (Pydantic v2)
from enum import Enum
from pydantic import BaseModel, field_validator

class ClientStatus(str, Enum):
    DRAFT = "DRAFT"
    PRE_ACTIVE = "PRE_ACTIVE"
    ACTIVE = "ACTIVE"
    CANCELLED = "CANCELLED"

class OntologyEntityType(str, Enum):
    PROFILE = "PROFILE"
    MARKET = "MARKET"
    COMPETITORS = "COMPETITORS"
    TARGET_PERSONAS = "TARGET_PERSONAS"
    CAMPAIGN_HISTORY = "CAMPAIGN_HISTORY"
    LEGAL_CONSTRAINTS = "LEGAL_CONSTRAINTS"

ENTITY_ORDER = list(OntologyEntityType)  # sequência canônica para HITL

class HITLAction(str, Enum):
    ACCEPT = "accept"
    EDIT_ACCEPT = "edit_accept"
    REJECT_REGENERATE = "reject_regenerate"

class ValidateEntityRequest(BaseModel):
    action: HITLAction
    edited_content: str | None = None  # obrigatório se action == edit_accept

    @field_validator("edited_content")
    @classmethod
    def require_content_for_edit(cls, v, info):
        if info.data.get("action") == HITLAction.EDIT_ACCEPT and not v:
            raise ValueError("edited_content obrigatório para edit_accept")
        return v
```

### 6.3 Eventos de Progresso (SSE ou polling)

Polling endpoint `GET /api/clients/{slug}/onboarding/status` retorna `OnboardingStatus` JSON. Frontend usa polling simples (sem SSE na v1):

- Intervalo: 5s nos primeiros 5 min
- Backoff: +5s a cada resposta sem mudança, cap em 30s

---

## 7. Critérios de Aceite

### Wizard (T-34)

- [ ] **CA-01**: DADO `/clientes/new`, QUANDO PX-01 preenche passo 1 com slug duplicado, ENTÃO erro inline "Slug já utilizado" sem avançar
- [ ] **CA-02**: DADO passo 1 preenchido, QUANDO PX-01 fecha o browser e retorna em ≤24h, ENTÃO wizard retoma no passo 1 com dados preenchidos
- [ ] **CA-03**: DADO passo 4 confirmado, QUANDO PX-01 clica "Disparar Oráculo", ENTÃO `client.status = PRE_ACTIVE` e job drive_sync é disparado assincronamente

### Progresso do Oráculo (T-35)

- [ ] **CA-04**: DADO job drive_sync rodando, QUANDO T-35 renderiza, ENTÃO exibe barra de progresso com ETA estimado
- [ ] **CA-05**: DADO oracle_seed concluído, QUANDO todas as 6 entidades têm status `generated`, ENTÃO UI redireciona automaticamente para T-36
- [ ] **CA-06**: DADO oracle_seed com status `oracle_failed`, QUANDO Admin verifica, ENTÃO alerta in-app é gerado com `error_detail`

### HITL Gate (T-36)

- [ ] **CA-07**: DADO entidade `PROFILE` gerada, QUANDO PX-01 clica "Aceitar", ENTÃO `entity.status = accepted`, auditoria registrada, UI avança para entidade seguinte
- [ ] **CA-08**: DADO entidade `MARKET` gerada, QUANDO PX-01 edita texto e clica "Aceitar edição", ENTÃO conteúdo editado salvo, `diff(original, editado)` no audit log, status = accepted
- [ ] **CA-09**: DADO entidade `COMPETITORS` gerada, QUANDO PX-01 clica "Rejeitar e Regenerar", ENTÃO Oráculo regenera só esta entidade; UI aguarda e exibe nova versão
- [ ] **CA-10**: DADO UI T-36, QUANDO PX-01 inspeciona, ENTÃO NÃO há botão "Aceitar todas" nem "Pular" (RN-032)
- [ ] **CA-11**: DADO 6ª entidade aceita (`LEGAL_CONSTRAINTS`), QUANDO aceita, ENTÃO `client.status = ACTIVE` automaticamente e redirect para T-39

### Wiki Ontológica (T-39)

- [ ] **CA-12**: DADO `client.status = ACTIVE`, QUANDO PX-01 acessa `/clientes/[slug]/wiki`, ENTÃO exibe 6 entidades com badges corretos
- [ ] **CA-13**: DADO entidade aceita pelo HITL, QUANDO wiki exibe, ENTÃO badge mostra `revisado HITL` (não `seed automático`)
- [ ] **CA-14**: DADO PX-07 edita entidade inline e salva, ENTÃO conteúdo atualizado, badge muda para `atualizado direto`, auditoria registrada
- [ ] **CA-15**: DADO PX-06 (Operacional) faz `GET /api/clients/{slug}/wiki`, ENTÃO resposta é HTTP 404 com body `{"detail": "Recurso não disponível"}` (RN-011)
- [ ] **CA-16**: DADO rota `/clientes/[slug]/wiki` acessada por PX-06, QUANDO frontend recebe 404, ENTÃO redirect para `/404` (não exibe "Acesso negado")
- [ ] **CA-17**: DADO `client.status = PRE_ACTIVE`, QUANDO qualquer usuário acessa `/clientes/[slug]/wiki`, ENTÃO 404 (Wiki só existe para ACTIVE)

### Gate PRE_ACTIVE

- [ ] **CA-18**: DADO client em `PRE_ACTIVE`, QUANDO backend recebe request de execução de Skill/Workflow, ENTÃO 404 com `{"detail": "Cliente não disponível"}`
- [ ] **CA-19**: DADO Admin no painel de clientes, QUANDO há cliente em PRE_ACTIVE há ≥72h, ENTÃO alerta in-app visível

### Allow-list (FR-183)

- [ ] **CA-20**: DADO allow-list configurada com 3 domínios, QUANDO Oráculo executa pesquisa web, ENTÃO NÃO há requests para domínios fora da lista no log de proveniência

---

## 8. Fora de Escopo

- Integração com RAG AlloyDB/pgvector (SPEC separada pós-ACTIVE)
- FA-16 Captura Seletiva de Reuniões (SPEC separada)
- Badge `atualizado via captura [ID reunião]` (implementado em FA-16)
- Exportação da Wiki para PDF/Notion
- Diff visual de versões históricas da Wiki
- Notificações por email (apenas in-app alerts nesta SPEC)
- Permissão granular por entidade (PX-01 e PX-07 têm acesso total a todas as entidades na Wiki)

---

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-05-15 | Versão inicial — cobertura de FR-180 a FR-185, BR-021, JN-13, JN-15, T-34/35/36/39 |
