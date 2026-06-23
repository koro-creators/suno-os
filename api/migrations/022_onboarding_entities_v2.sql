-- SPEC-015 v2: Atualiza CHECK constraint de entity_type para nomes EN
-- Substitui os 6 nomes PT ('Posicionamento','Persona','Competidor','Produto','TomDeVoz','Briefing')
-- pelos 9 nomes EN definidos em constants.py ONTOLOGY_ENTITY_TYPES.
-- Seguro executar em banco vazio (bank de produção está em estado DRAFT sem entidades aceitas).

ALTER TABLE wiki_entities
  DROP CONSTRAINT IF EXISTS wiki_entities_entity_type_check;

ALTER TABLE wiki_entities
  ADD CONSTRAINT wiki_entities_entity_type_check
    CHECK (entity_type IN (
      'CLIENT_PROFILE',
      'MARKET_CONTEXT',
      'COMPETITORS',
      'BRAND_VOICE',
      'TARGET_PERSONAS',
      'LEGAL_CONSTRAINTS',
      'BUSINESS_OBJECTIVES',
      'CONTRACTED_SCOPE',
      'MARTECH_STACK'
    ));
