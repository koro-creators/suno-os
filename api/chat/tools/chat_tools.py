"""Chat/LLM tool — invokes an LLM for chat completion in the ReAct loop."""

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool

from chat.tools.retry import retry_on_error
from config import settings

MODEL_MAP = {
    "gemini-flash": "gemini-2.5-flash",
    "gemini-pro": "gemini-2.5-pro",
    "gpt-4o": "gpt-4o",
    "claude": "claude-sonnet-4",
}


def _get_llm(model: str, temperature: float):
    """Return the appropriate ChatModel based on model name.

    Falls back to Gemini Flash when the requested model's API key is missing.
    """
    import logging

    logger = logging.getLogger(__name__)
    model_id = MODEL_MAP.get(model, "gemini-2.5-flash")

    if model_id.startswith("gpt") and settings.OPENAI_API_KEY:
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=model_id,
            temperature=temperature,
            api_key=settings.OPENAI_API_KEY,
        )

    if model_id.startswith("claude") and settings.ANTHROPIC_API_KEY:
        from langchain_anthropic import ChatAnthropic

        return ChatAnthropic(
            model=model_id,
            temperature=temperature,
            api_key=settings.ANTHROPIC_API_KEY,
        )

    if model_id.startswith("gemini") and settings.GOOGLE_API_KEY:
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model=model_id,
            temperature=temperature,
            google_api_key=settings.GOOGLE_API_KEY,
        )

    # Fallback: Gemini Flash
    if settings.GOOGLE_API_KEY:
        if model != "gemini-flash":
            logger.warning("API key for '%s' not configured, falling back to Gemini Flash", model)
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=temperature,
            google_api_key=settings.GOOGLE_API_KEY,
        )

    raise ValueError("No LLM API key configured. Set GOOGLE_API_KEY in .env")


@tool
def chat_completion(
    message: str,
    model: str = "gemini-flash",
    temperature: float = 0.7,
    system_prompt: str = "",
) -> str:
    """Send a message to an LLM and get a response.

    Used for general conversation and content generation.
    """
    try:
        llm = _get_llm(model, temperature)

        messages = []
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))
        messages.append(HumanMessage(content=message))

        @retry_on_error(max_retries=3, base_delay=1.0)
        def _invoke_llm(llm, msgs):
            return llm.invoke(msgs)

        response = _invoke_llm(llm, messages)
        return response.content

    except ValueError as exc:
        return f"[chat_completion error] {exc}"
    except Exception as exc:
        return f"[chat_completion error] Unexpected failure: {exc}"
