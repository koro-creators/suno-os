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
    brand_context: str  # wizard step 2 (contexto de marca)
    wizard_briefing: str  # texto livre do wizard
    allowed_domains: list[str]  # allow-list from wizard step 2 (RN-033)
    entity_type: str  # which entity to extract
    generated_content: str
    provenance: list[dict]  # ProvenanceEntry dicts from web search
    error: Optional[str]


# ---------------------------------------------------------------------------
# Fallback content (rich, per entity type, keyed by ONTOLOGY_ENTITY_TYPES)
# ---------------------------------------------------------------------------

_FALLBACK_TEMPLATES: dict[str, str] = {
    "Perfil do Cliente": (
        "{name} é uma organização com atuação consolidada em seu setor, "
        "reconhecida pela consistência de entrega e pelo relacionamento próximo "
        "com clientes e parceiros. Seu perfil combina expertise técnica com "
        "comunicação acessível, posicionando-se como referência em sua área."
    ),
    "Mercado e Setor": (
        "O mercado em que {name} atua é dinâmico e competitivo, com tendências "
        "de consolidação e crescente digitalização dos processos. O setor apresenta "
        "oportunidades relevantes para marcas que souberem combinar credibilidade, "
        "agilidade e presença digital consistente."
    ),
    "Concorrentes Diretos": (
        "{name} compete com players estabelecidos que disputam atenção por preço "
        "ou volume. O diferencial competitivo da marca está na profundidade de "
        "conteúdo e na curadoria da experiência, criando uma barreira difícil de "
        "replicar apenas com escala ou commoditização."
    ),
    "Personas-Alvo": (
        "O público principal de {name} é composto por profissionais e tomadores "
        "de decisão que valorizam qualidade, confiabilidade e resultados mensuráveis. "
        "São pessoas conectadas, exigentes e dispostas a investir em soluções que "
        "agreguem valor real à sua rotina e negócio."
    ),
    "Histórico de Campanhas": (
        "{name} possui histórico de comunicação focado em construção de autoridade "
        "e geração de demanda. As campanhas anteriores priorizaram conteúdo educativo, "
        "cases de sucesso e presença em canais digitais relevantes para o público-alvo, "
        "com resultados consistentes de engajamento e conversão."
    ),
    "Restrições Legais e Contratuais": (
        "A comunicação de {name} deve observar as diretrizes regulatórias do setor, "
        "evitando afirmações não comprovadas, comparações diretas com concorrentes "
        "sem embasamento e promessas de resultado que possam configurar publicidade "
        "enganosa. Todo conteúdo deve estar alinhado com as políticas internas de "
        "compliance e comunicação institucional."
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
    "Perfil do Cliente": (
        "Elabore um perfil completo desta organização. "
        "Inclua: histórico e fundação, porte e estrutura, principais produtos ou serviços, "
        "missão e valores declarados, presença geográfica e canais de atuação. "
        "Mínimo 100 palavras."
    ),
    "Mercado e Setor": (
        "Analise o mercado e setor em que esta organização atua. "
        "Inclua: tamanho e crescimento do mercado, principais tendências, "
        "oportunidades e ameaças do setor, regulações relevantes e dinâmicas de demanda. "
        "Mínimo 100 palavras."
    ),
    "Concorrentes Diretos": (
        "Identifique e analise os principais concorrentes diretos desta organização. "
        "Para cada concorrente relevante: nome, posicionamento, pontos fortes e fracos, "
        "e como a organização se diferencia. Inclua também concorrentes indiretos relevantes. "
        "Mínimo 100 palavras."
    ),
    "Personas-Alvo": (
        "Descreva as personas-alvo desta organização. "
        "Para cada persona: perfil demográfico e profissional, comportamentos, "
        "dores e desafios, motivações de compra, canais preferidos e como a "
        "organização resolve seus problemas. Mínimo 100 palavras."
    ),
    "Histórico de Campanhas": (
        "Descreva o histórico de campanhas e comunicação desta organização. "
        "Inclua: campanhas relevantes já realizadas, canais utilizados, mensagens-chave, "
        "tom de voz praticado, resultados obtidos e aprendizados. "
        "Se não houver histórico disponível, descreva o tipo de comunicação praticada. "
        "Mínimo 100 palavras."
    ),
    "Restrições Legais e Contratuais": (
        "Liste as restrições legais, regulatórias e contratuais que impactam "
        "a comunicação desta organização. Inclua: restrições do setor regulado, "
        "claims proibidos ou que exigem comprovação, obrigações de disclaimer, "
        "políticas internas de compliance e quaisquer limitações contratuais. "
        "Mínimo 100 palavras."
    ),
}


def _build_prompt(state: OracleState, web_context: str = "") -> str:
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

    if web_context:
        parts += ["", web_context]

    parts += [
        "",
        f"TAREFA: {instruction}",
        "",
        "Escreva em português brasileiro, de forma clara e direta. "
        "Máximo 3 parágrafos. Sem títulos ou bullets — apenas texto corrido."
        + (" Use as informações das fontes web quando relevantes." if web_context else ""),
    ]

    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Graph node
# ---------------------------------------------------------------------------


async def _extract_entities_node(state: OracleState) -> OracleState:
    """
    Fetch web context from allowed domains, then call Gemini Flash to generate
    content for the given entity_type.

    CA-20: all web fetches go through allow-list enforcement in web_search.py.
    """
    from oracle.web_search import fetch_allowed_domains, format_web_context

    llm = _get_llm()
    entity_type = state["entity_type"]
    client_name = state["client_name"]
    allowed_domains: list[str] = state.get("allowed_domains") or []

    # Fetch web context (allow-list enforced, robots.txt respected)
    web_entries = await fetch_allowed_domains(allowed_domains, max_per_domain=1)
    web_context = format_web_context(web_entries)
    provenance = [e.as_dict() for e in web_entries]

    if web_entries:
        logger.info(
            "Oracle agent: fetched %d web sources for %s/%s",
            len(web_entries), client_name, entity_type,
        )

    if llm is None:
        logger.info("Oracle agent: using local fallback for %s/%s", client_name, entity_type)
        return {
            **state,
            "generated_content": _fallback_content(entity_type, client_name),
            "provenance": provenance,
            "error": None,
        }

    try:
        from langchain_core.messages import HumanMessage

        prompt = _build_prompt(state, web_context=web_context)
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        content = (response.content or "").strip()
        if not content:
            raise ValueError("Empty response from Gemini")
        logger.info("Oracle agent: Gemini generated content for %s/%s", client_name, entity_type)
        return {**state, "generated_content": content, "provenance": provenance, "error": None}
    except Exception as exc:
        logger.warning(
            "Oracle agent: Gemini call failed for %s/%s (%s) — using fallback",
            client_name, entity_type, exc,
        )
        return {
            **state,
            "generated_content": _fallback_content(entity_type, client_name),
            "provenance": provenance,
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
    allowed_domains: list[str] | None = None,
) -> tuple[str, list[dict]]:
    """
    Invoke the oracle graph for a single entity.

    Returns (generated_content, provenance_list).
    provenance_list contains ProvenanceEntry dicts from web_search (CA-20).
    """
    state: OracleState = {
        "client_id": client_id,
        "client_name": client_name,
        "brand_context": brand_context,
        "wizard_briefing": wizard_briefing,
        "allowed_domains": allowed_domains or [],
        "entity_type": entity_type,
        "generated_content": "",
        "provenance": [],
        "error": None,
    }
    result = await _oracle_graph.ainvoke(state)
    content = result.get("generated_content") or _fallback_content(entity_type, client_name)
    provenance = result.get("provenance") or []
    return content, provenance
