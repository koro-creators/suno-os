"""Bridges LangChain @tool functions from chat/tools/ into the workflow registry.

Each import is guarded so the workflow module can load even when individual
chat tool dependencies (OpenAI, etc.) are missing in the test environment.
"""
from .base import register_tool


def _register() -> None:
    try:
        from chat.tools.text_tools import generate_text
        register_tool("generate_text", generate_text, aliases=["text_generation"])
    except ImportError:
        pass

    try:
        from chat.tools.image_tools import generate_image
        register_tool("generate_image", generate_image)
    except ImportError:
        pass

    try:
        from chat.tools.search_tools import web_search
        register_tool("search_knowledge", web_search, aliases=["web_search"])
    except ImportError:
        pass


_register()
