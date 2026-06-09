"""sunOS agent tools — LangChain tools for the ReAct loop."""

from chat.tools.chat_tools import chat_completion
from chat.tools.client_tools import buscar_cliente
from chat.tools.image_tools import generate_image
from chat.tools.prompt_tools import enhance_prompt
from chat.tools.search_tools import web_search
from chat.tools.text_tools import generate_text

ALL_TOOLS = [chat_completion, generate_text, enhance_prompt, web_search]
IMAGE_TOOLS = [generate_image]

__all__ = [
    "chat_completion",
    "generate_text",
    "enhance_prompt",
    "web_search",
    "generate_image",
    "buscar_cliente",
    "ALL_TOOLS",
    "IMAGE_TOOLS",
]
