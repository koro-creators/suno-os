"""
Quality scorers for sunOS chat outputs.
Each scorer takes (input, output) and returns a score 0-1 with reasoning.
Used with eval datasets for CI quality checks.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ScoreResult:
    name: str
    score: float  # 0.0 to 1.0
    reasoning: str


def tone_scorer(input_text: str, output_text: str, expected_tone: str) -> ScoreResult:
    """Score whether the output matches the expected tone (formal, casual, creative, etc.)."""
    # For now, heuristic scoring. TODO: LLM-as-Judge with Gemini Flash
    tone_indicators = {
        "formal": ["prezado", "conforme", "informamos", "solicitamos", "atenciosamente"],
        "casual": ["oi", "fala", "beleza", "show", "top", "\U0001f60a"],
        "creative": ["imagine", "surpreenda", "inovador", "revolucion", "\u2728"],
        "professional": ["resultado", "m\u00e9trica", "performance", "otimizar", "estrat\u00e9gia"],
    }

    indicators = tone_indicators.get(expected_tone, [])
    if not indicators:
        return ScoreResult(name="tone", score=0.5, reasoning=f"Unknown tone: {expected_tone}")

    lower_output = output_text.lower()
    matches = sum(1 for ind in indicators if ind in lower_output)
    score = min(matches / max(len(indicators) * 0.3, 1), 1.0)

    return ScoreResult(
        name="tone",
        score=score,
        reasoning=f"Found {matches}/{len(indicators)} tone indicators for '{expected_tone}'",
    )


def format_scorer(output_text: str, expected_format: str) -> ScoreResult:
    """Score whether the output follows the expected format."""
    format_checks = {
        "social_post": lambda t: len(t) < 2000 and not t.startswith("#"),
        "article": lambda t: len(t) > 200 and "\n" in t,
        "script": lambda t: any(kw in t.lower() for kw in ["cena", "locu\u00e7\u00e3o", "corta", "fade"]),
        "radio": lambda t: any(kw in t.lower() for kw in ["loc:", "trilha:", "efeito:", "tempo:"]),
        "media_plan": lambda t: any(kw in t.lower() for kw in ["budget", "canal", "kpi", "cpm"]),
    }

    checker = format_checks.get(expected_format)
    if not checker:
        return ScoreResult(name="format", score=0.5, reasoning=f"Unknown format: {expected_format}")

    passed = checker(output_text)
    return ScoreResult(
        name="format",
        score=1.0 if passed else 0.0,
        reasoning=f"Format check '{expected_format}': {'passed' if passed else 'failed'}",
    )


def routing_scorer(actual_intent: str, expected_intent: str) -> ScoreResult:
    """Score whether the supervisor routed to the correct intent."""
    score = 1.0 if actual_intent == expected_intent else 0.0
    return ScoreResult(
        name="routing",
        score=score,
        reasoning=f"Expected '{expected_intent}', got '{actual_intent}'",
    )


def context_scorer(output_text: str, context_documents: list[str]) -> ScoreResult:
    """Score whether the output used information from the context documents."""
    if not context_documents:
        return ScoreResult(name="context", score=1.0, reasoning="No context documents provided")

    lower_output = output_text.lower()
    used_count = 0
    for doc in context_documents:
        # Check if key phrases from the document appear in the output
        doc_words = set(doc.lower().split())
        # Sample some distinctive words (longer ones are more likely to be meaningful)
        distinctive = [w for w in doc_words if len(w) > 6][:10]
        if any(w in lower_output for w in distinctive):
            used_count += 1

    score = used_count / len(context_documents) if context_documents else 0
    return ScoreResult(
        name="context",
        score=score,
        reasoning=f"Used {used_count}/{len(context_documents)} context documents",
    )
