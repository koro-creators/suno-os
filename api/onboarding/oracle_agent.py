"""
SPEC-015 — LangGraph Oracle Agent for ontological entity extraction.

Flow: START → extract_entities → END
Gemini Flash extracts/generates content for each entity type from wizard briefing.
Falls back to rich local content if LLM unavailable (no GOOGLE_API_KEY or API error).
"""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Optional

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph
from typing_extensions import TypedDict

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------


class OracleState(TypedDict):
    client_id: str
    client_name: str
    brand_context: str  # descrição da marca (wizard step 1)
    wizard_briefing: str  # sponsor + domínios de referência (wizard)
    language: str  # idioma da saída: "pt-BR" | "en-US" (oracle_config)
    allowed_domains: list[str]  # allow-list de busca web (A3)
    entity_type: str  # which entity to extract
    sources: list[dict]  # resultados Tavily {title,url,content} (A2/A3)
    generated_content: str
    used_fallback: bool  # True se caiu no template local (A5: fallback não-silencioso)
    error: Optional[str]


# Nº de tentativas no Gemini antes de cair no fallback local (A5)
_LLM_MAX_ATTEMPTS = 3

# Termo de busca por entidade (A2) — combinado com o nome da marca.
# CONTRACTED_SCOPE: sem busca web — deriva exclusivamente dos docs do wizard.
_SEARCH_TERMS: dict[str, str] = {
    "CLIENT_PROFILE": "empresa perfil institucional história fundação missão",
    "MARKET_CONTEXT": "mercado setor tendências crescimento oportunidades",
    "COMPETITORS": "concorrentes análise competitiva benchmark mercado",
    "BRAND_VOICE": "tom de voz comunicação identidade verbal",
    "TARGET_PERSONAS": "público-alvo persona perfil consumidor comportamento",
    "LEGAL_CONSTRAINTS": "regulação compliance restrições legais comunicação",
    "BUSINESS_OBJECTIVES": "objetivos estratégia metas crescimento negócio",
    "CONTRACTED_SCOPE": "",
    "MARTECH_STACK": "ferramentas marketing CRM automação analytics tecnologia",
}


# ---------------------------------------------------------------------------
# Fallback content (rich, per entity type, keyed by ONTOLOGY_ENTITY_TYPES)
# ---------------------------------------------------------------------------

_FALLBACK_TEMPLATES: dict[str, str] = {
    "CLIENT_PROFILE": (
        "{name} é uma empresa com atuação consolidada em seu segmento, "
        "reconhecida pela qualidade de seus produtos e serviços. "
        "Sua missão une propósito e resultado, entregando valor consistente ao público que atende."
    ),
    "MARKET_CONTEXT": (
        "O mercado em que {name} atua é dinâmico e em constante evolução, "
        "impulsionado por mudanças no comportamento do consumidor e pela transformação digital. "
        "A marca está posicionada para capturar as principais oportunidades deste cenário."
    ),
    "COMPETITORS": (
        "{name} opera em um mercado com concorrentes consolidados que disputam "
        "atenção por preço ou volume. "
        "O diferencial competitivo da marca está na profundidade de conteúdo e na "
        "curadoria da experiência, criando uma barreira difícil de replicar apenas com escala."
    ),
    "BRAND_VOICE": (
        "{name} comunica-se de forma direta, acolhedora e sem jargões desnecessários. "
        "O tom é confiante sem ser arrogante, próximo sem ser informal demais — "
        "a voz de quem conhece profundamente o assunto e sabe traduzir isso para "
        "quem está aprendendo."
    ),
    "TARGET_PERSONAS": (
        "O público principal de {name} é composto por profissionais e entusiastas "
        "que valorizam qualidade e autenticidade. "
        "São pessoas conectadas, exigentes e dispostas a investir em experiências "
        "que agreguem valor real à sua rotina."
    ),
    "LEGAL_CONSTRAINTS": (
        "A comunicação de {name} deve seguir as diretrizes do CONAR e as regulamentações "
        "aplicáveis ao seu setor. "
        "Evitar claims absolutos sem comprovação e conteúdo que possa ser interpretado "
        "como propaganda enganosa."
    ),
    "BUSINESS_OBJECTIVES": (
        "{name} busca ampliar sua presença digital, aumentar reconhecimento de marca "
        "e converter audiência em clientes qualificados. "
        "O marketing de conteúdo é um pilar estratégico para atingir essas metas "
        "de forma sustentável."
    ),
    "CONTRACTED_SCOPE": (
        "Escopo contratado com a Suno United Creators. "
        "Revise os documentos da proposta comercial para detalhamento completo "
        "dos serviços, volumes e canais acordados."
    ),
    "MARTECH_STACK": "Não identificado no escopo atual",
}


def _fallback_content(entity_type: str, client_name: str) -> str:
    template = _FALLBACK_TEMPLATES.get(entity_type)
    if template:
        return template.format(name=client_name)
    return (
        f"{client_name} — conteúdo de {entity_type} gerado localmente. "
        "Revise e complemente conforme o contexto da marca."
    )


# ---------------------------------------------------------------------------
# LLM singleton (created once, None if GOOGLE_API_KEY missing)
# ---------------------------------------------------------------------------

_llm = None


def _get_llm():
    global _llm
    if _llm is not None:
        return _llm

    api_key = os.environ.get("GOOGLE_API_KEY", "")
    if not api_key:
        logger.warning("GOOGLE_API_KEY not set — oracle agent will use local fallback")
        return None

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI

        _llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)
        logger.info("Oracle agent: Gemini Flash LLM initialized")
    except ImportError:
        logger.warning(
            "langchain_google_genai not available — oracle agent will use local fallback"
        )
        _llm = None
    except Exception as exc:
        logger.warning("Oracle agent: LLM init failed (%s) — will use local fallback", exc)
        _llm = None

    return _llm


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------

_ENTITY_PROMPTS: dict[str, str] = {
    "CLIENT_PROFILE": (
        "Elabore o perfil institucional completo do cliente. "
        "Inclua: história e fundação, missão e visão, modelo de negócio, "
        "produtos/serviços principais e posicionamento no mercado."
    ),
    "MARKET_CONTEXT": (
        "Descreva o contexto de mercado em que o cliente opera. "
        "Inclua: tamanho e maturidade do setor, principais tendências, "
        "oportunidades e ameaças relevantes para a marca."
    ),
    "COMPETITORS": (
        "Mapeie o cenário competitivo do cliente. "
        "Descreva os principais concorrentes diretos e indiretos, "
        "como a marca se diferencia e quais são suas vantagens e vulnerabilidades competitivas."
    ),
    "BRAND_VOICE": (
        "Defina o tom de voz e a identidade verbal da marca. "
        "Inclua: adjetivos que descrevem a voz, o que evitar na comunicação, "
        "exemplos de como falar e como não falar, e estilo de escrita preferido."
    ),
    "TARGET_PERSONAS": (
        "Descreva as personas-alvo da marca. "
        "Para cada persona: perfil demográfico e psicográfico, comportamentos digitais, "
        "dores e motivações, e como a marca resolve seus problemas."
    ),
    "LEGAL_CONSTRAINTS": (
        "Identifique as restrições legais e regulatórias relevantes para a comunicação da marca. "
        "Inclua: setores regulados, termos proibidos, disclaimers obrigatórios "
        "e limitações para comunicação em plataformas digitais."
    ),
    "BUSINESS_OBJECTIVES": (
        "Defina os objetivos de negócio que orientam a estratégia de comunicação. "
        "Inclua: metas de crescimento, indicadores-chave, prioridades estratégicas "
        "e como o marketing contribui para os resultados."
    ),
    "CONTRACTED_SCOPE": (
        "Resuma o escopo contratado com a Suno United Creators. "
        "Baseie-se exclusivamente no briefing e nos documentos fornecidos no wizard. "
        "Inclua: serviços contratados, canais contemplados, volumes acordados "
        "e quaisquer exclusões explícitas do contrato."
    ),
    "MARTECH_STACK": (
        "Mapeie o stack de martech (ferramentas de marketing e tecnologia) da marca. "
        "Se informações sobre ferramentas não estiverem disponíveis no contexto fornecido, "
        "responda exatamente com: 'Não identificado no escopo atual'. "
        "Caso contrário, inclua: CRM, plataformas de automação, ferramentas de analytics, "
        "ad platforms e integrações relevantes."
    ),
}


def _build_prompt(state: OracleState) -> str:
    entity_type = state["entity_type"]
    client_name = state["client_name"]
    brand_context = state.get("brand_context", "").strip()
    wizard_briefing = state.get("wizard_briefing", "").strip()

    instruction = _ENTITY_PROMPTS.get(
        entity_type,
        f"Gere conteúdo ontológico para a categoria '{entity_type}' desta marca.",
    )

    parts = [
        "Você é um especialista em estratégia de marca e comunicação.",
        "",
        f"MARCA: {client_name}",
    ]

    if brand_context:
        parts += ["", "CONTEXTO DA MARCA:", brand_context]

    if wizard_briefing:
        parts += ["", "BRIEFING DO WIZARD:", wizard_briefing]

    sources = state.get("sources") or []
    if sources:
        parts += [
            "",
            "FONTES PESQUISADAS NA WEB (use como base factual; não invente além disto):",
        ]
        for s in sources:
            line = f"- {s.get('title') or s.get('url')}: {s.get('content', '')}"
            parts.append(line)

    if state.get("language") == "en-US":
        closing = (
            "Write in clear, direct American English. "
            "Maximum 3 paragraphs. No headings or bullets — plain prose only."
        )
    else:
        closing = (
            "Escreva em português brasileiro, de forma clara e direta. "
            "Máximo 3 parágrafos. Sem títulos ou bullets — apenas texto corrido."
        )

    parts += ["", f"TAREFA: {instruction}", "", closing]

    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Graph nodes
# ---------------------------------------------------------------------------


async def _research_node(state: OracleState) -> OracleState:
    """A2/A3: pesquisa web (Tavily) restrita aos allowed_domains, antes de gerar.

    Sem domínios ou sem chave → sources=[] e o LLM gera só com o contexto do wizard.
    """
    from .web_search import tavily_search

    domains = state.get("allowed_domains") or []
    entity_type = state["entity_type"]
    term = _SEARCH_TERMS.get(entity_type, "")
    query = f"{state['client_name']} {term}".strip()
    sources = await tavily_search(query, allowed_domains=domains, max_results=4)
    return {**state, "sources": sources}


async def _extract_entities_node(state: OracleState) -> OracleState:
    """Call Gemini Flash to generate content for the given entity_type."""
    llm = _get_llm()
    entity_type = state["entity_type"]
    client_name = state["client_name"]

    if llm is None:
        logger.info(
            "Oracle agent: sem LLM, usando fallback local para %s/%s", client_name, entity_type
        )
        return {
            **state,
            "generated_content": _fallback_content(entity_type, client_name),
            "used_fallback": True,
            "error": "GOOGLE_API_KEY ausente — fallback local",
        }

    from langchain_core.messages import HumanMessage

    try:
        from core.observability import trace_generation
    except ImportError:  # test import root
        from api.core.observability import trace_generation

    prompt = _build_prompt(state)
    last_exc: Optional[Exception] = None

    # A5: retry com backoff (Gemini retorna 503 intermitente) antes do fallback.
    for attempt in range(1, _LLM_MAX_ATTEMPTS + 1):
        try:
            # Langfuse: span de generation (no-op se LANGFUSE_ENABLED off — prod-safe).
            async with trace_generation(
                name=f"oracle:{entity_type}",
                model="gemini-2.5-flash",
                input=prompt,
                metadata={"client": client_name, "attempt": attempt},
            ) as gen:
                response = await llm.ainvoke([HumanMessage(content=prompt)])
                content = (response.content or "").strip()
                if not content:
                    raise ValueError("Empty response from Gemini")
                if gen is not None:
                    try:
                        # Tokens/custo: usa o usage_metadata do Gemini (input/output/total).
                        um = getattr(response, "usage_metadata", None) or {}
                        usage = {
                            "input": um.get("input_tokens"),
                            "output": um.get("output_tokens"),
                            "total": um.get("total_tokens"),
                        }
                        usage = {k: v for k, v in usage.items() if v is not None}
                        gen.update(output=content, usage_details=usage or None)
                    except Exception:  # noqa: BLE001
                        pass
            logger.info(
                "Oracle agent: Gemini gerou conteúdo para %s/%s (tentativa %d)",
                client_name,
                entity_type,
                attempt,
            )
            return {**state, "generated_content": content, "used_fallback": False, "error": None}
        except Exception as exc:
            last_exc = exc
            logger.warning(
                "Oracle agent: Gemini tentativa %d/%d falhou para %s/%s (%s)",
                attempt,
                _LLM_MAX_ATTEMPTS,
                client_name,
                entity_type,
                exc,
            )
            if attempt < _LLM_MAX_ATTEMPTS:
                await asyncio.sleep(1.5 * attempt)  # backoff linear

    logger.warning(
        "Oracle agent: Gemini esgotou %d tentativas para %s/%s — fallback local",
        _LLM_MAX_ATTEMPTS,
        client_name,
        entity_type,
    )
    return {
        **state,
        "generated_content": _fallback_content(entity_type, client_name),
        "used_fallback": True,
        "error": str(last_exc),
    }


# ---------------------------------------------------------------------------
# Graph factory (compiled once on import)
# ---------------------------------------------------------------------------


def build_oracle_graph() -> CompiledStateGraph:
    """Build and compile the oracle graph: START → research → extract → END."""
    graph: StateGraph = StateGraph(OracleState)
    graph.add_node("research", _research_node)
    graph.add_node("extract_entities", _extract_entities_node)
    graph.add_edge(START, "research")
    graph.add_edge("research", "extract_entities")
    graph.add_edge("extract_entities", END)
    compiled = graph.compile()
    logger.info("Oracle graph compiled")
    return compiled


# Module-level singleton — reused across all background task invocations.
_oracle_graph: CompiledStateGraph = build_oracle_graph()


async def invoke_oracle(
    client_id: str,
    client_name: str,
    entity_type: str,
    brand_context: str = "",
    wizard_briefing: str = "",
    language: str = "pt-BR",
    allowed_domains: Optional[list[str]] = None,
) -> tuple[str, Optional[str], list[dict]]:
    """Invoke the oracle graph for a single entity.

    Retorna ``(content, error, sources)``. ``error`` é ``None`` quando o Gemini
    gerou de fato; quando preenchido, o conteúdo veio do **fallback local** (A5).
    ``sources`` são os resultados da busca web (A2/A3) — vazio se sem chave/domínios.
    """
    state: OracleState = {
        "client_id": client_id,
        "client_name": client_name,
        "brand_context": brand_context,
        "wizard_briefing": wizard_briefing,
        "language": language,
        "allowed_domains": allowed_domains or [],
        "entity_type": entity_type,
        "sources": [],
        "generated_content": "",
        "used_fallback": False,
        "error": None,
    }
    result = await _oracle_graph.ainvoke(state)
    content = result.get("generated_content") or _fallback_content(entity_type, client_name)
    error = result.get("error") if result.get("used_fallback") else None
    return content, error, result.get("sources") or []
