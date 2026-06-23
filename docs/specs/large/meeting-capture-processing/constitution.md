---
spec-id: SPEC-016
slug: meeting-capture-processing
artefato: constitution
nivel-sdd: spec-anchored
tamanho: medium
status: rascunho
criada: 2026-06-23
atualizada: 2026-06-23
versao: 1.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + Python 3.11"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: "Visão geral, escopo, decisões fundamentais e limites da SPEC-016 — Captura e Processamento de Atas de Reunião"
upstream:
  - docs/brd/parte3-requisitos.md (BR-023)
  - docs/adr/ADR-016-meeting-processing-cag-rag.md (ADR-016)
  - docs/adr/ADR-017-knowledge-layers-guardrails.md (ADR-017)
  - docs/specs/large/onboarding-oraculo-cliente/spec.md (SPEC-015 v2)
---

# SPEC-016 — Constituição: Captura e Processamento de Atas de Reunião

## Visão Geral

Atas de reunião com clientes são a fonte mais viva e contextual de informação estratégica do relacionamento Suno–cliente. Decisões sobre produto, mudanças de posicionamento, ajustes de escopo e redirecionamentos de campanha aparecem primeiro nas reuniões — antes de serem formalizadas em documentos. Ignorar esse sinal significa que a ontologia do cliente (mantida pelo Oracle) envelhece mais rápido que o necessário, e o time Suno opera com contexto desatualizado.

Ao mesmo tempo, reuniões são documentos intrinsecamente mistos: numa mesma hora de gravação convivem a decisão estratégica relevante para a ontologia e o comentário pessoal de um participante sobre sua vida familiar, a discussão de performance de alguém da equipe, ou o rumor sobre uma mudança organizacional não anunciada. Alimentar esse conteúdo bruto no pipeline de AI não é aceitável — viola privacidade, viola as regras de caixa-preta (RN-009/010/011), e introduz ruído que degrada a qualidade das entidades geradas pelo Oracle.

SPEC-016 resolve essa tensão com dois controles humanos obrigatórios dispostos em sequência: **HITL 1** (Content Safety — um revisor humano sanitiza a ata antes de qualquer processamento por AI) e **HITL 2** (Ontology Update Proposal — o Oracle propõe atualizações à ontologia via LangGraph interrupt, e um revisor aprova ou rejeita antes de qualquer escrita). Entre os dois controles, o sistema aplica um mecanismo de retrieval híbrido que maximiza qualidade para atas recentes (CAG — transcript completo no contexto) e escala eficientemente para o backlog histórico (RAG semântico via pgvector).

## Escopo e Limites

SPEC-016 tem escopo deliberadamente fechado na jornada de **captura e processamento** de atas, deixando fora de escopo a gravação automática de reuniões, a integração com Google Calendar, e a transcrição automática de áudio. Esses são problemas adjacentes com complexidades próprias (consentimento, OAuth adicional, custo de Speech-to-Text) e merecem SPECs separadas quando priorizados.

A relação com SPEC-015 (Oracle Deep Agent) é complementar e assimétrica: SPEC-016 define o ciclo de vida do documento (upload → HITL 1 → disponibilização CAG/RAG), enquanto SPEC-015 define o agente que consome esse documento e emite as proposals HITL 2. O contrato entre as duas specs é explícito e mínimo — o campo `hitl1_approved_at IS NOT NULL` como gate de acesso, e o shape do `OntologyUpdateProposal` como contrato de dados. Mudanças no comportamento interno do Oracle não exigem revisão desta SPEC, e vice-versa.

## Decisões Fundamentais

**Dual HITL é não-negociável.** A ordem HITL 1 → AI → HITL 2 não é flexível. Não existe modo "express" que pule a revisão humana de content safety, nem modo "automático" que aplique mudanças ontológicas sem aprovação. Isso decorre diretamente das regras de privacidade e da invariante de caixa-preta do sunOS — não de preferência de design.

**Threshold de 60 dias para CAG/RAG** é o default estabelecido no ADR-016 com base no padrão de acesso observado. É configurável por cliente via variável de ambiente, mas o default de 60 dias deve ser mantido para novos clientes sem configuração explícita.

**RAG cold reutiliza a infra ADR-008.** Não há nova camada de infraestrutura — `meeting_chunks` usa o mesmo cluster AlloyDB e o mesmo padrão de indexação da Biblioteca (L2). Isso é uma decisão consciente de simplicidade operacional: dois caminhos de acesso (CAG e RAG), mas um único sistema de indexação.
