'use client';

/**
 * SPEC-015 — Wiki Ontológica context.
 * Thin wrapper over OnboardingOraculoContext for wiki-specific pages.
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

import type { WikiEntity, OntologyEntityType } from '@/lib/onboarding-types';

interface WikiOntologicaContextValue {
  expandedEntities: Set<OntologyEntityType>;
  toggleEntity: (entityType: OntologyEntityType) => void;
  isExpanded: (entityType: OntologyEntityType) => boolean;
}

const WikiOntologicaContext = createContext<WikiOntologicaContextValue | null>(null);

export function WikiOntologicaProvider({ children }: { children: ReactNode }) {
  const [expandedEntities, setExpandedEntities] = useState<Set<OntologyEntityType>>(new Set());

  const toggleEntity = useCallback((entityType: OntologyEntityType) => {
    setExpandedEntities((prev) => {
      const next = new Set(prev);
      if (next.has(entityType)) {
        next.delete(entityType);
      } else {
        next.add(entityType);
      }
      return next;
    });
  }, []);

  const isExpanded = useCallback(
    (entityType: OntologyEntityType) => expandedEntities.has(entityType),
    [expandedEntities]
  );

  return (
    <WikiOntologicaContext.Provider value={{ expandedEntities, toggleEntity, isExpanded }}>
      {children}
    </WikiOntologicaContext.Provider>
  );
}

export function useWikiOntologica(): WikiOntologicaContextValue {
  const ctx = useContext(WikiOntologicaContext);
  if (!ctx) throw new Error('useWikiOntologica must be used within WikiOntologicaProvider');
  return ctx;
}
