"""
SPEC-015 — LangGraph Oracle Agent for ontological entity extraction.

Flow: START → extract_entities → END
Gemini Flash extracts/generates content for each entity type from wizard briefing.
Falls back to rich local content if LLM unavailable (no GOOGLE_API_KEY or API error).
"""

from __future__ import annotations

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
    brand_context: str      # wizard step 2 (contexto de marca)
    wizard_briefing: str    # texto livre do wizard
    entity_type: str        # which entity to extract
    generated_content: str
    error: Optional[str]


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
        "São pessoas conectadas, exigentes e dispostas a investir em experiências que agreguem valor real à sua rotina."
    ),
    "Competidor": (
        "{name} opera em um mercado com concorrentes consolidados que disputam atenção por preço ou volume. "
        "O diferencial competitivo da marca está na profundidade de conteúdo e na curadoria da experiência, "
        "o que cria uma barreira difícil de replicar apenas com escala."
    ),
    "Produto": (
        "O portfólio de {name} reúne soluções desenvolvidas para atender às necessidades específicas de seu público, "
        "com foco em resultado prático e experiência de uso. "
        "Cada produto carrega a identidade da marca: clara, direta e comprometida com a entrega."
    ),
    "TomDeVoz": (
        "{name} comunica-se de forma direta, acolhedora e sem jargões desnecessários. "
        "O tom é confiante sem ser arrogante, próximo sem ser informal demais — "
        "a voz de quem conhece profundamente o assunto e sabe traduzir isso para quem está aprendendo."
    ),
    "Briefing": (
        "{name} tem como norte criar conteúdo que informe, engaje e converta, "
        "sempre alinhado à sua proposta de valor central. "
        "Cada briefing deve refletir clareza de objetivo, linguagem adequada à persona e chamada para ação relevante."
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
        _llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.7)
        logger.info("Oracle agent: Gemini Flash LLM initialized")
    except ImportError:
        logger.warning("langchain_google_genai not available — oracle agent will use local fallback")
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
        "Descreva em 2-3 parágrafos: proposta de valor, diferenciais competitivos e como a marca se apresenta no mercado."
    ),
    "Persona": (
        "Descreva a persona principal do público da marca. "
        "Inclua: perfil demográfico, comportamentos, dores, motivações e como a marca resolve seus problemas."
    ),
    "Competidor": (
        "Analise o cenário competitivo da marca. "
        "Descreva os principais tipos de concorrentes, como a marca se diferencia e quais são seus pontos fortes frente à concorrência."
    ),
    "Produto": (
        "Descreva o portfólio de produtos ou serviços da marca. "
        "Inclua: categorias principais, proposta de cada produto, benefícios para o usuário e como se relacionam com o posicionamento."
    ),
    "TomDeVoz": (
        "Defina o tom de voz da marca. "
        "Inclua: adjetivos que descrevem a voz, o que evitar na comunicação, exemplos de como falar e como não falar, e o estilo de escrita preferido."
    ),
    "Briefing": (
        "Crie um briefing padrão para produção de conteúdo da marca. "
        "Inclua: objetivos de comunicação, mensagens-chave, estrutura sugerida de conteúdo e diretrizes de chamada para ação."
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
        f"Você é um especialista em estratégia de marca e comunicação.",
        f"",
        f"MARCA: {client_name}",
    ]

    if brand_context:
        parts += [f"", f"CONTEXTO DA MARCA:", brand_context]

    if wizard_briefing:
        parts += [f"", f"BRIEFING DO WIZARD:", wizard_briefing]

    parts += [
        f"",
        f"TAREFA: {instruction}",
        f"",
        f"Escreva em português brasileiro, de forma clara e direta. "
        f"Máximo 3 parágrafos. Sem títulos ou bullets — apenas texto corrido.",
    ]

    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Graph node
# ---------------------------------------------------------------------------


async def _extract_entities_node(state: OracleState) -> OracleState:
    """Call Gemini Flash to generate content for the given entity_type."""
    llm = _get_llm()
    entity_type = state["entity_type"]
    client_name = state["client_name"]

    if llm is None:
        logger.info("Oracle agent: using local fallback for %s/%s", client_name, entity_type)
        return {
            **state,
            "generated_content": _fallback_content(entity_type, client_name),
            "error": None,
        }

    try:
        from langchain_core.messages import HumanMessage
        prompt = _build_prompt(state)
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        content = (response.content or "").strip()
        if not content:
            raise ValueError("Empty response from Gemini")
        logger.info("Oracle agent: Gemini generated content for %s/%s", client_name, entity_type)
        return {**state, "generated_content": content, "error": None}
    except Exception as exc:
        logger.warning(
            "Oracle agent: Gemini call failed for %s/%s (%s) — using fallback",
            client_name, entity_type, exc,
        )
        return {
            **state,
            "generated_content": _fallback_content(entity_type, client_name),
            "error": str(exc),
        }


# ---------------------------------------------------------------------------
# Graph factory (compiled once on import)
# ---------------------------------------------------------------------------


def build_oracle_graph() -> CompiledStateGraph:
    """Build and compile the oracle extraction graph."""
    graph: StateGraph = StateGraph(OracleState)
    graph.add_node("extract_entities", _extract_entities_node)
    graph.add_edge(START, "extract_entities")
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
) -> str:
    """Invoke the oracle graph for a single entity. Returns generated_content."""
    state: OracleState = {
        "client_id": client_id,
        "client_name": client_name,
        "brand_context": brand_context,
        "wizard_briefing": wizard_briefing,
        "entity_type": entity_type,
        "generated_content": "",
        "error": None,
    }
    result = await _oracle_graph.ainvoke(state)
    return result.get("generated_content") or _fallback_content(entity_type, client_name)
