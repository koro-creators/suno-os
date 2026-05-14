/**
 * Componentes do Shoot for the Moon — motor de serendipidade do sunOS.
 *
 * Spec: docs/specs/large/shoot-for-the-moon/spec.md (SPEC-004)
 *
 * Princípios obrigatórios:
 *  - Vocabulário: Devorar, Provocar, Faísca, Brasa, Inteligência Natural
 *  - Caixa-preta: nunca expor scores numéricos, prompts ou nomes de modelos para creators
 *  - RN-014: outputs de IA SEMPRE marcados via AIBadge
 *  - WCAG AA: contraste, focus ring, prefers-reduced-motion
 */

export { default as AIBadge } from './AIBadge';
export type { AIBadgeState, AIBadgeSize } from './AIBadge';

export { default as AgentPersonaBadge } from './AgentPersonaBadge';
export type { AgentPersona } from './AgentPersonaBadge';

export { default as BisociationZoneBadge } from './BisociationZoneBadge';

export { default as FaiscaCard } from './FaiscaCard';
export type { FaiscaData, ConceptCombined } from './FaiscaCard';

export { default as FaiscaPanel } from './FaiscaPanel';
export type { IntensityMode } from './FaiscaPanel';

export { default as ShootForTheMoonModal } from './ShootForTheMoonModal';
