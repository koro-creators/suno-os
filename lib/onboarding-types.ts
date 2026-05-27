/**
 * Types for SPEC-015 — Onboarding com Oráculo do Cliente
 */

// ---------------------------------------------------------------------------
// Ontology constants — must stay in sync with api/onboarding/constants.py
// ---------------------------------------------------------------------------

export const ONTOLOGY_ENTITY_TYPES = [
  'Posicionamento',
  'Persona',
  'Competidor',
  'Produto',
  'TomDeVoz',
  'Briefing',
] as const;

export type OntologyEntityType = (typeof ONTOLOGY_ENTITY_TYPES)[number];

// ---------------------------------------------------------------------------
// Client status (SPEC-018 aligned)
// ---------------------------------------------------------------------------

export type ClientStatus = 'DRAFT' | 'PRE_ACTIVE' | 'ACTIVE' | 'ARCHIVED';

// ---------------------------------------------------------------------------
// Entity / Wiki types
// ---------------------------------------------------------------------------

export type EntityStatus = 'pending' | 'generated' | 'accepted' | 'regenerating';
export type EntityBadge = 'seed_auto' | 'hitl' | 'capture';

export interface ProvenanceEntry {
  source: string;  // e.g. "Drive/arquivo.pdf" | "Web/https://..." | "Briefing"
  excerpt?: string;
}

export interface WikiEntity {
  id: string;
  clientId: string;
  entityType: OntologyEntityType;
  content: string;
  provenance: ProvenanceEntry[];
  status: EntityStatus;
  badge: EntityBadge;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// HITL validation
// ---------------------------------------------------------------------------

export type HITLAction = 'accept' | 'edit_accept' | 'reject_regenerate';

export interface ValidateEntityRequest {
  action: HITLAction;
  editedContent?: string;  // Required when action === 'edit_accept'
}

export interface ValidateEntityResponse {
  entityType: OntologyEntityType;
  status: EntityStatus;
  badge: EntityBadge;
  clientStatus?: ClientStatus;  // Set when last entity accepted → PRE_ACTIVE → ACTIVE
}

// ---------------------------------------------------------------------------
// Onboarding job status (polling)
// ---------------------------------------------------------------------------

export type JobPhaseStatus = 'pending' | 'running' | 'done' | 'error';

export interface EntityProgress {
  entityType: OntologyEntityType;
  status: EntityStatus;
}

export interface OnboardingJobStatus {
  clientId: string;
  clientSlug: string;
  clientStatus: ClientStatus;
  driveSyncStatus: JobPhaseStatus;
  oracleStatus: JobPhaseStatus;
  currentEntity: OntologyEntityType | null;
  entitiesDone: number;
  totalEntities: number;
  entities: Record<OntologyEntityType, EntityStatus>;
  errorDetail: string | null;
  etaHours: number;
}

// ---------------------------------------------------------------------------
// Wizard (4-step form state)
// ---------------------------------------------------------------------------

export interface OracleConfig {
  allowedDomains: string[];
  language: 'pt-BR' | 'en-US';
  depth: 'shallow' | 'standard' | 'deep';
}

export interface WizardState {
  step: 1 | 2 | 3 | 4;
  // Step 1: metadata
  name: string;
  slug: string;
  color: string;
  description: string;
  sponsorName: string;
  sponsorEmail: string;
  // Step 2: oracle config
  oracleConfig: OracleConfig;
  // Step 3: drive docs
  selectedDocIds: string[];
  // Step 4: ready to confirm
}

export const WIZARD_STEP_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Dados do Cliente',
  2: 'Configurar Oráculo',
  3: 'Documentos Drive',
  4: 'Confirmar',
};

// ---------------------------------------------------------------------------
// API response shapes (from backend)
// ---------------------------------------------------------------------------

export interface CreateClientResponse {
  id: string;
  slug: string;
  name: string;
  status: ClientStatus;
  jobId: string;
}

export interface StartOnboardingResponse {
  jobId: string;
  status: 'started';
  etaHours: number;
}

// ---------------------------------------------------------------------------
// Wiki page shape
// ---------------------------------------------------------------------------

export interface WikiPageData {
  clientId: string;
  clientSlug: string;
  clientName: string;
  entities: WikiEntity[];
}

// ---------------------------------------------------------------------------
// FR-185 — Staleness utility
// ---------------------------------------------------------------------------

/**
 * Returns true when a wiki entity has been waiting for review (status
 * 'pending' or 'generated') for longer than `thresholdHours` (default 72h).
 */
export function isEntityStale(
  entity: { status: EntityStatus; createdAt?: string | number },
  thresholdHours = 72,
): boolean {
  if (entity.status !== 'pending' && entity.status !== 'generated') return false;
  if (!entity.createdAt) return false;
  const ageMs = Date.now() - new Date(entity.createdAt).getTime();
  return ageMs >= thresholdHours * 3600 * 1000;
}
