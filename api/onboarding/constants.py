"""
SPEC-015 — Constantes ontológicas do Oráculo do Cliente.

IMPORTANT: Keep in sync with lib/onboarding-types.ts (ONTOLOGY_ENTITY_TYPES).
"""

# Ordered list of entity types — UI derives its card order from this.
# Constitution §6.8: "não hardcodar número de entidades — UI deriva dela".
ONTOLOGY_ENTITY_TYPES: list[str] = [
    "CLIENT_PROFILE",
    "MARKET_CONTEXT",
    "COMPETITORS",
    "BRAND_VOICE",
    "TARGET_PERSONAS",
    "LEGAL_CONSTRAINTS",
    "BUSINESS_OBJECTIVES",
    "CONTRACTED_SCOPE",
    "MARTECH_STACK",
]

# Admin/sponsor-only entities (RN-009 caixa-preta: 404, not 403).
ENTITY_ADMIN_ONLY: set[str] = {"CONTRACTED_SCOPE"}

# Conditional entities — Oracle may generate empty when out of contracted scope.
# Empty content triggers auto-accept (no HITL needed for an empty entity).
ENTITY_CONDITIONAL: set[str] = {"MARTECH_STACK"}

# Valid entity status values
ENTITY_STATUS_VALUES: list[str] = [
    "pending",
    "generated",
    "accepted",
    "regenerating",
]

# Valid client status values (aligned with SPEC-018)
CLIENT_STATUS_VALUES: list[str] = [
    "DRAFT",
    "PRE_ACTIVE",
    "ACTIVE",
    "ARCHIVED",
]

# Valid HITL actions
HITL_ACTIONS: list[str] = [
    "accept",
    "edit_accept",
    "reject_regenerate",
]

# Stub oracle delay (seconds) — simulates async processing per entity
ORACLE_STUB_DELAY_SECONDS: float = 2.0
