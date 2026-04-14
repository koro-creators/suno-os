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

    Raises ValueError for unknown models.
    Returns an error string (instead of raising) when the API key is missing.
    """
    model_id = MODEL_MAP.get(model)
    if model_id is None:
        raise ValueError(
            f"Unknown model '{model}'. Choose from: {', '.join(MODEL_MAP.keys())}"
        )

    if model in ("gemini-flash", "gemini-pro"):
        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY is not configured.")
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model=model_id,
            temperature=temperature,
            google_api_key=settings.GOOGLE_API_KEY,
        )

    if model == "gpt-4o":
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not configured.")
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=model_id,
            temperature=temperature,
            api_key=settings.OPENAI_API_KEY,
        )

    if model == "claude":
        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY is not configured.")
        from langchain_anthropic import ChatAnthropic

        return ChatAnthropic(
            model=model_id,
            temperature=temperature,
            api_key=settings.ANTHROPIC_API_KEY,
        )

    raise ValueError(f"Unhandled model '{model}'.")


@tool
def chat_completion(
    message: str,
    model: str = "gemini-flash",
    temperature: float = 0.7,
    system_prompt: str = "",
) -> str:
    """Send a message to an LLM and get a response. Used for general conversation and content generation."""
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
