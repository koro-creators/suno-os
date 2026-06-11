'use client';

/**
 * SPEC-015 — Wizard + polling state for Onboarding com Oráculo do Cliente.
 *
 * Mock-mode: when NEXT_PUBLIC_API_URL is unset, uses setTimeout-driven entity
 * progression so the wizard + progress page work without a backend.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { apiAvailable, getApiUrl, getAuthToken } from '@/lib/api';
import {
  ONTOLOGY_ENTITY_TYPES,
  WIZARD_STEP_LABELS,
  type ClientStatus,
  type CreateClientResponse,
  type EntityStatus,
  type HITLAction,
  type OntologyEntityType,
  type OnboardingJobStatus,
  type OracleConfig,
  type StartOnboardingResponse,
  type ValidateEntityResponse,
  type WikiEntity,
  type WizardState,
} from '@/lib/onboarding-types';

// ---------------------------------------------------------------------------
// Default wizard state
// ---------------------------------------------------------------------------

const RANDOM_COLORS = ['#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#22C55E', '#F472B6', '#A3E635'];

function randomColor(): string {
  return RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
}

function emptyWizardState(): WizardState {
  return {
    step: 1,
    name: '',
    slug: '',
    color: randomColor(),
    description: '',
    sponsorName: '',
    sponsorEmail: '',
    oracleConfig: {
      allowedDomains: [],
      language: 'pt-BR',
      depth: 'standard',
    },
    selectedDocIds: [],
    driveFolder: '',
    driveFolderName: null,
  };
}

// ---------------------------------------------------------------------------
// Mock-mode helpers
// ---------------------------------------------------------------------------

function buildMockJobStatus(
  clientId: string,
  slug: string,
  entities: Record<OntologyEntityType, EntityStatus>,
  entitiesDone: number,
  oracleStatus: 'pending' | 'running' | 'done',
): OnboardingJobStatus {
  return {
    clientId,
    clientSlug: slug,
    clientStatus: 'PRE_ACTIVE',
    driveSyncStatus: oracleStatus === 'pending' ? 'pending' : 'done',
    oracleStatus,
    currentEntity: oracleStatus === 'running'
      ? (ONTOLOGY_ENTITY_TYPES[entitiesDone] ?? null)
      : null,
    entitiesDone,
    totalEntities: ONTOLOGY_ENTITY_TYPES.length,
    entities,
    errorDetail: null,
    etaHours: 1,
  };
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface OnboardingOraculoContextValue {
  wizardState: WizardState;
  updateWizard: (patch: Partial<WizardState>) => void;
  resetWizard: () => void;

  // Wizard submit
  submitWizard: () => Promise<CreateClientResponse | null>;
  startOracle: (slug: string) => Promise<StartOnboardingResponse | null>;

  // Polling
  jobStatus: OnboardingJobStatus | null;
  isPolling: boolean;
  startPolling: (slug: string) => void;
  stopPolling: () => void;

  // HITL validation
  validateEntity: (
    slug: string,
    entityType: OntologyEntityType,
    action: HITLAction,
    editedContent?: string,
  ) => Promise<ValidateEntityResponse | null>;

  // Wiki
  wikiEntities: WikiEntity[];
  /**
   * Load wiki entities for a client.
   *
   * includeGenerated=false (default): only accepted entities — Wiki page (T-39).
   * includeGenerated=true: generated + accepted — HITL validate page (T-36)
   * so users can read Oracle stub content before approving.
   */
  loadWiki: (slug: string, includeGenerated?: boolean) => Promise<void>;

  // Errors
  error: string | null;
}

const OnboardingOraculoContext = createContext<OnboardingOraculoContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function OnboardingOraculoProvider({ children }: { children: ReactNode }) {
  const [wizardState, setWizardState] = useState<WizardState>(emptyWizardState);
  const [jobStatus, setJobStatus] = useState<OnboardingJobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [wikiEntities, setWikiEntities] = useState<WikiEntity[]>([]);
  const [error, setError] = useState<string | null>(null);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mockProgressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mock-mode state (used when apiAvailable() is false)
  const mockClientIdRef = useRef<string>('');
  const mockEntitiesRef = useRef<Record<OntologyEntityType, EntityStatus>>(
    Object.fromEntries(ONTOLOGY_ENTITY_TYPES.map((t) => [t, 'pending'])) as Record<OntologyEntityType, EntityStatus>
  );
  const mockEntitiesDoneRef = useRef<number>(0);

  const updateWizard = useCallback((patch: Partial<WizardState>) => {
    setWizardState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetWizard = useCallback(() => {
    setWizardState(emptyWizardState());
    setJobStatus(null);
    setWikiEntities([]);
    setError(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Submit wizard (creates client)
  // ---------------------------------------------------------------------------

  const submitWizard = useCallback(async (): Promise<CreateClientResponse | null> => {
    setError(null);
    if (!apiAvailable()) {
      // Mock-mode: generate fake client
      const fakeId = `mock-${Date.now()}`;
      const fakeSlug = wizardState.slug || 'mock-client';
      mockClientIdRef.current = fakeId;
      mockEntitiesRef.current = Object.fromEntries(
        ONTOLOGY_ENTITY_TYPES.map((t) => [t, 'pending'])
      ) as Record<OntologyEntityType, EntityStatus>;
      mockEntitiesDoneRef.current = 0;
      return {
        id: fakeId,
        slug: fakeSlug,
        name: wizardState.name || 'Mock Client',
        status: 'PRE_ACTIVE',
        jobId: `job-${Date.now()}`,
      };
    }

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(getApiUrl('/api/clients'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: wizardState.name,
          slug: wizardState.slug,
          color: wizardState.color,
          description: wizardState.description,
          sponsor_name: wizardState.sponsorName,
          sponsor_email: wizardState.sponsorEmail,
          oracle_config: {
            allowed_domains: wizardState.oracleConfig.allowedDomains,
            language: wizardState.oracleConfig.language,
            depth: wizardState.oracleConfig.depth,
          },
          selected_doc_ids: wizardState.selectedDocIds,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        setError(`Erro ao criar cliente: ${res.status} ${text}`);
        return null;
      }

      const data = await res.json();
      return {
        id: data.id,
        slug: data.slug,
        name: data.name,
        status: data.status as ClientStatus,
        jobId: data.job_id,
      };
    } catch (err) {
      setError(`Erro de rede: ${String(err)}`);
      return null;
    }
  }, [wizardState]);

  // ---------------------------------------------------------------------------
  // Start oracle job
  // ---------------------------------------------------------------------------

  const startOracle = useCallback(async (slug: string): Promise<StartOnboardingResponse | null> => {
    setError(null);
    if (!apiAvailable()) {
      return { jobId: `job-mock`, status: 'started', etaHours: 1 };
    }

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(getApiUrl(`/api/clients/${slug}/onboarding/start`), {
        method: 'POST',
        headers,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        setError(`Erro ao iniciar Oráculo: ${res.status} ${text}`);
        return null;
      }

      const data = await res.json();
      return { jobId: data.job_id, status: 'started', etaHours: data.eta_hours };
    } catch (err) {
      setError(`Erro de rede: ${String(err)}`);
      return null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Polling (ADR-LOCAL-01: 5s interval with backoff to 30s)
  // ---------------------------------------------------------------------------

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (mockProgressRef.current) {
      clearTimeout(mockProgressRef.current);
      mockProgressRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const startPolling = useCallback((slug: string) => {
    stopPolling();
    setIsPolling(true);

    if (!apiAvailable()) {
      // Mock-mode: simulate entity progression via setTimeout
      const simulateMockProgress = () => {
        const done = mockEntitiesDoneRef.current;
        if (done >= ONTOLOGY_ENTITY_TYPES.length) {
          setJobStatus(
            buildMockJobStatus(
              mockClientIdRef.current,
              slug,
              mockEntitiesRef.current,
              ONTOLOGY_ENTITY_TYPES.length,
              'done',
            )
          );
          setIsPolling(false);
          return;
        }

        const entityType = ONTOLOGY_ENTITY_TYPES[done];
        mockEntitiesRef.current = {
          ...mockEntitiesRef.current,
          [entityType]: 'generated',
        };
        mockEntitiesDoneRef.current = done + 1;

        setJobStatus(
          buildMockJobStatus(
            mockClientIdRef.current,
            slug,
            { ...mockEntitiesRef.current },
            mockEntitiesDoneRef.current,
            mockEntitiesDoneRef.current < ONTOLOGY_ENTITY_TYPES.length ? 'running' : 'done',
          )
        );

        if (mockEntitiesDoneRef.current < ONTOLOGY_ENTITY_TYPES.length) {
          mockProgressRef.current = setTimeout(simulateMockProgress, 1500);
        } else {
          setIsPolling(false);
        }
      };

      // Initial status
      setJobStatus(
        buildMockJobStatus(
          mockClientIdRef.current,
          slug,
          mockEntitiesRef.current,
          0,
          'running',
        )
      );

      mockProgressRef.current = setTimeout(simulateMockProgress, 800);
      return;
    }

    const poll = async () => {
      try {
        const token = await getAuthToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(getApiUrl(`/api/clients/${slug}/onboarding/status`), { headers });
        if (!res.ok) {
          if (res.status === 404) {
            setError('Cliente não encontrado');
            stopPolling();
            return;
          }
          return; // transient error, keep polling
        }

        const data = await res.json();
        const status: OnboardingJobStatus = {
          clientId: data.client_id,
          clientSlug: data.client_slug,
          clientStatus: data.client_status,
          driveSyncStatus: data.drive_sync_status,
          oracleStatus: data.oracle_status,
          currentEntity: data.current_entity,
          entitiesDone: data.entities_done,
          totalEntities: data.total_entities,
          entities: data.entities,
          errorDetail: data.error_detail,
          etaHours: data.eta_hours,
        };
        setJobStatus(status);

        // Stop polling when all entities are generated (UI redirect handles navigation)
        if (data.oracle_status === 'done') {
          stopPolling();
        }
      } catch {
        // network error — keep polling
      }
    };

    poll();
    pollingIntervalRef.current = setInterval(poll, 5000);
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // ---------------------------------------------------------------------------
  // HITL validate entity
  // ---------------------------------------------------------------------------

  const validateEntity = useCallback(async (
    slug: string,
    entityType: OntologyEntityType,
    action: HITLAction,
    editedContent?: string,
  ): Promise<ValidateEntityResponse | null> => {
    setError(null);

    if (!apiAvailable()) {
      // Mock-mode: update local mock entities state
      mockEntitiesRef.current = {
        ...mockEntitiesRef.current,
        [entityType]: action === 'reject_regenerate' ? 'regenerating' : 'accepted',
      };

      const allAccepted = ONTOLOGY_ENTITY_TYPES.every(
        (t) => mockEntitiesRef.current[t] === 'accepted'
      );

      // Mock regeneration
      if (action === 'reject_regenerate') {
        setTimeout(() => {
          mockEntitiesRef.current = {
            ...mockEntitiesRef.current,
            [entityType]: 'generated',
          };
        }, 3000);
      }

      return {
        entityType,
        status: action === 'reject_regenerate' ? 'regenerating' : 'accepted',
        badge: action === 'edit_accept' ? 'hitl' : 'seed_auto',
        clientStatus: allAccepted ? 'ACTIVE' : undefined,
      };
    }

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        getApiUrl(`/api/clients/${slug}/entities/${entityType}/validate`),
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action,
            edited_content: editedContent ?? null,
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        // Caixa-preta: treat 404 as "not found"
        if (res.status === 404) {
          setError('Entidade não encontrada');
          return null;
        }
        setError(`Erro ao validar entidade: ${res.status} ${text}`);
        return null;
      }

      const data = await res.json();
      return {
        entityType: data.entity_type,
        status: data.status,
        badge: data.badge,
        clientStatus: data.client_status ?? undefined,
      };
    } catch (err) {
      setError(`Erro de rede: ${String(err)}`);
      return null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Wiki
  // ---------------------------------------------------------------------------

  const loadWiki = useCallback(async (slug: string, includeGenerated = false): Promise<void> => {
    setError(null);

    if (!apiAvailable()) {
      // Mock-mode: build wiki from mockEntitiesRef state
      const now = new Date().toISOString();
      // FR-185: backdate first entity so the stale alert is visible in mock mode
      const staleTimestamp = new Date(Date.now() - 80 * 3600 * 1000).toISOString();
      const visibleStatuses: EntityStatus[] = includeGenerated
        ? ['generated', 'accepted']
        : ['accepted'];
      const mockWiki: WikiEntity[] = ONTOLOGY_ENTITY_TYPES
        .filter((t) => visibleStatuses.includes(mockEntitiesRef.current[t]))
        .map((t, idx) => ({
          id: `mock-${t}`,
          clientId: mockClientIdRef.current || 'mock',
          entityType: t,
          content: `[Conteúdo mock do Oráculo para ${t}]`,
          provenance: [{ source: 'Briefing', excerpt: `Dado de onboarding para ${t}` }],
          status: mockEntitiesRef.current[t],
          badge: 'seed_auto' as const,
          // First entity gets a backdated timestamp to demo the 72h staleness alert
          createdAt: idx === 0 ? staleTimestamp : now,
          updatedAt: now,
        }));
      setWikiEntities(mockWiki);
      return;
    }

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = includeGenerated
        ? getApiUrl(`/api/clients/${slug}/wiki?include_generated=true`)
        : getApiUrl(`/api/clients/${slug}/wiki`);

      const res = await fetch(url, { headers });
      if (!res.ok) {
        if (res.status === 404) {
          // Caixa-preta: redirect to 404 (handled by caller)
          setError('404');
          return;
        }
        setError(`Erro ao carregar wiki: ${res.status}`);
        return;
      }

      const data = await res.json();
      const entities: WikiEntity[] = (data.entities || []).map((e: Record<string, unknown>) => ({
        id: e.id as string,
        clientId: e.client_id as string,
        entityType: e.entity_type as OntologyEntityType,
        content: e.content as string,
        provenance: (e.provenance as Array<{ source: string; excerpt?: string }>) || [],
        status: e.status as EntityStatus,
        badge: e.badge as 'seed_auto' | 'hitl' | 'capture',
        createdAt: e.created_at as string,
        updatedAt: e.updated_at as string,
      }));
      setWikiEntities(entities);
    } catch (err) {
      setError(`Erro de rede: ${String(err)}`);
    }
  }, []);

  return (
    <OnboardingOraculoContext.Provider
      value={{
        wizardState,
        updateWizard,
        resetWizard,
        submitWizard,
        startOracle,
        jobStatus,
        isPolling,
        startPolling,
        stopPolling,
        validateEntity,
        wikiEntities,
        loadWiki,
        error,
      }}
    >
      {children}
    </OnboardingOraculoContext.Provider>
  );
}

export function useOnboardingOraculo(): OnboardingOraculoContextValue {
  const ctx = useContext(OnboardingOraculoContext);
  if (!ctx) throw new Error('useOnboardingOraculo must be used within OnboardingOraculoProvider');
  return ctx;
}
