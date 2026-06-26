"""Workflow tool registry — import this module to trigger auto-registration.

Adding a new tool:
  1. Create api/workflows/tools/my_tool.py
  2. Decorate the function with @workflow_tool("tool_name")
  3. Import the module here (one line below)

For state-bound tools (need client_id from run state, LLM passes no args):
  @workflow_tool("my_tool", state_bound=True)
  def my_tool(client_id: str | None) -> str: ...

For chat tool bridges (already @tool decorated in chat/tools/):
  Add to chat_bridge.py using register_tool().
"""

from . import chat_bridge, cliente, ontologia, reuniao  # noqa: F401 — trigger registration
from .base import WorkflowTool, get_registry, register_tool, workflow_tool

__all__ = ["WorkflowTool", "workflow_tool", "register_tool", "get_registry"]
