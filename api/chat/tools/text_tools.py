"""Text generation tool — produces formatted content by type, tone, and length."""

from langchain_core.tools import tool

from chat.tools.chat_tools import _get_llm

CONTENT_TYPES = {
    "social_post": "a social media post (concise, engaging, with hooks)",
    "article": "a well-structured article (intro, body, conclusion)",
    "caption": "an image/video caption (short, punchy, hashtag-ready)",
    "email": "a professional email (subject line, greeting, body, sign-off)",
    "script": "a script with dialogue or narration (scene direction, spoken lines)",
}

TONES = {
    "formal": "Use formal, polished language. Avoid contractions and slang.",
    "casual": "Use relaxed, conversational language. Contractions are fine.",
    "professional": "Use clear, business-appropriate language. Be direct and respectful.",
    "creative": "Use vivid, imaginative language. Metaphors and wordplay are welcome.",
    "friendly": "Use warm, approachable language. Be personable and encouraging.",
}

LENGTHS = {
    "short": "approximately 100 words",
    "medium": "approximately 300 words",
    "long": "approximately 600 words",
}


def _build_generation_prompt(
    prompt: str, content_type: str, tone: str, length: str
) -> str:
    """Build a structured system prompt for text generation."""
    type_desc = CONTENT_TYPES.get(content_type, CONTENT_TYPES["social_post"])
    tone_desc = TONES.get(tone, TONES["creative"])
    length_desc = LENGTHS.get(length, LENGTHS["medium"])

    return (
        f"You are an expert content writer. Generate {type_desc}.\n\n"
        f"Tone: {tone_desc}\n"
        f"Target length: {length_desc}.\n\n"
        f"Write the content based on the user's prompt. "
        f"Output ONLY the generated content, no meta-commentary."
    )


@tool
def generate_text(
    prompt: str,
    content_type: str = "social_post",
    tone: str = "creative",
    length: str = "medium",
    model: str = "gemini-flash",
) -> str:
    """Generate formatted text content based on type, tone, and length parameters."""
    try:
        from langchain_core.messages import HumanMessage, SystemMessage

        system_prompt = _build_generation_prompt(prompt, content_type, tone, length)
        llm = _get_llm(model, temperature=0.7)

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt),
        ]

        response = llm.invoke(messages)
        return response.content

    except ValueError as exc:
        return f"[generate_text error] {exc}"
    except Exception as exc:
        return f"[generate_text error] Unexpected failure: {exc}"
