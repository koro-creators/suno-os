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
_SEARCH_TERMS: dict[str, str] = {
    "Posicionamento": "posicionamento de marca proposta de valor diferenciais",
    "Persona": "público-alvo persona perfil de cliente",
    "Competidor": "concorrentes mercado análise competitiva",
    "Produto": "produtos serviços portfólio",
    "TomDeVoz": "tom de voz comunicação identidade verbal",
    "Briefing": "marca comunicação campanha briefing",
}


# ---------------------------------------------------------------------------
# Fallback content (rich, per entity type, keyed by ONTOLOGY_ENTITY_TYPES)
# ---------------------------------------------------------------------------

_FALLBACK_TEMPLATES: dict[str, str] = {
    "Posicionamento": (
        "{name} é uma marca que se posiciona como referência em seu segmento, "
        "combinando expertise técnica com comunicação acessível. "
        "Seu diferencial está na consistência de entrega e no relacionamento próximo com o público."
    ),
    "Persona": (
        "O público principal de {name} é composto por profissionais e entusiastas "
        "que valorizam qualidade e autenticidade. "
        "São pessoas conectadas, exigentes e dispostas a investir em experiências "
        "que agreguem valor real à sua rotina."
    ),
    "Competidor": (
        "{name} opera em um mercado com concorrentes consolidados que disputam "
        "atenção por preço ou volume. "
        "O diferencial competitivo da marca está na profundidade de conteúdo e na "
        "curadoria da experiência, "
        "o que cria uma barreira difícil de replicar apenas com escala."
    ),
    "Produto": (
        "O portfólio de {name} reúne soluções desenvolvidas para atender às "
        "necessidades específicas de seu público, "
        "com foco em resultado prático e experiência de uso. "
        "Cada produto carrega a identidade da marca: clara, direta e comprometida com a entrega."
    ),
    "TomDeVoz": (
        "{name} comunica-se de forma direta, acolhedora e sem jargões desnecessários. "
        "O tom é confiante sem ser arrogante, próximo sem ser informal demais — "
        "a voz de quem conhece profundamente o assunto e sabe traduzir isso para "
        "quem está aprendendo."
    ),
    "Briefing": (
        "{name} tem como norte criar conteúdo que informe, engaje e converta, "
        "sempre alinhado à sua proposta de valor central. "
        "Cada briefing deve refletir clareza de objetivo, linguagem adequada à "
        "persona e chamada para ação relevante."
    ),
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
    "Posicionamento": (
        "Elabore o posicionamento estratégico da marca. "
        "Descreva em 2-3 parágrafos: proposta de valor, diferenciais competitivos "
        "e como a marca se apresenta no mercado."
    ),
    "Persona": (
        "Descreva a persona principal do público da marca. "
        "Inclua: perfil demográfico, comportamentos, dores, motivações e como a "
        "marca resolve seus problemas."
    ),
    "Competidor": (
        "Analise o cenário competitivo da marca. "
        "Descreva os principais tipos de concorrentes, como a marca se diferencia "
        "e quais são seus pontos fortes frente à concorrência."
    ),
    "Produto": (
        "Descreva o portfólio de produtos ou serviços da marca. "
        "Inclua: categorias principais, proposta de cada produto, benefícios para "
        "o usuário e como se relacionam com o posicionamento."
    ),
    "TomDeVoz": (
        "Defina o tom de voz da marca. "
        "Inclua: adjetivos que descrevem a voz, o que evitar na comunicação, "
        "exemplos de como falar e como não falar, e o estilo de escrita preferido."
    ),
    "Briefing": (
        "Crie um briefing padrão para produção de conteúdo da marca. "
        "Inclua: objetivos de comunicação, mensagens-chave, estrutura sugerida de "
        "conteúdo e diretrizes de chamada para ação."
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
                        gen.update(output=content)
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
