"""Bridges LangChain @tool functions from chat/tools/ into the workflow registry.

Each import is guarded so the workflow module can load even when individual
chat tool dependencies (OpenAI, etc.) are missing in the test environment.
"""

from .base import register_tool

try:
    from chat.tools.text_tools import generate_text as _generate_text
except ImportError:
    _generate_text = None

try:
    from chat.tools.image_tools import generate_image as _generate_image
except ImportError:
    _generate_image = None

try:
    from chat.tools.search_tools import web_search as _web_search
except ImportError:
    _web_search = None


def _register() -> None:
    if _generate_text is not None:
        register_tool("generate_text", _generate_text, aliases=["text_generation"])
    if _generate_image is not None:
        register_tool("generate_image", _generate_image)
    if _web_search is not None:
        register_tool("search_knowledge", _web_search, aliases=["web_search"])


_register()
