"""Workflow Compiler — converts WorkflowDefinition JSON into a LangGraph StateGraph.

The compiler reads a definition dict (with a `steps` list) and produces a
compiled LangGraph graph that can be invoked or streamed by the executor.
"""

from __future__ import annotations

import re
from typing import Annotated, Any, Callable, TypedDict

from langchain_core.messages import BaseMessage, HumanMessage
from langgraph.graph import END, START, StateGraph, add_messages
from langgraph.graph.state import CompiledStateGraph
from langgraph.types import interrupt


# ---------------------------------------------------------------------------
# State schema
# ---------------------------------------------------------------------------


class WorkflowState(TypedDict):
    workflow_id: str
    run_id: str
    steps_output: dict[str, Any]
    current_step: str
    status: str
    messages: Annotated[list[BaseMessage], add_messages]
    human_input: str | None
    started_at: str
    model: str
    error: str | None


# ---------------------------------------------------------------------------
# Tool registry — lazy-loads existing chat tools to avoid circular imports
# ---------------------------------------------------------------------------

TOOL_REGISTRY: dict[str, Any] = {}


def _load_tool_registry() -> None:
    """Lazy-load tools from chat/tools/ into the registry."""
    global TOOL_REGISTRY
    if TOOL_REGISTRY:
        return
    try:
        from chat.tools.text_tools import text_generation_tool

        TOOL_REGISTRY["generate_text"] = text_generation_tool
        TOOL_REGISTRY["text_generation"] = text_generation_tool
    except ImportError:
        pass
    try:
        from chat.tools.image_tools import generate_image_tool

        TOOL_REGISTRY["generate_image"] = generate_image_tool
    except ImportError:
        pass
    try:
        from chat.tools.search_tools import web_search_tool

        TOOL_REGISTRY["search_knowledge"] = web_search_tool
    except ImportError:
        pass


# ---------------------------------------------------------------------------
# Compiler
# ---------------------------------------------------------------------------


class WorkflowCompiler:
    """Compiles a workflow definition dict into a LangGraph CompiledStateGraph."""

    def __init__(self) -> None:
        _load_tool_registry()

    def compile(self, definition: dict) -> CompiledStateGraph:
        """Compile WorkflowDefinition JSON -> LangGraph StateGraph."""
        steps: list[dict] = definition.get("steps", [])
        if not steps:
            raise ValueError("Workflow must have at least one step")

        graph = StateGraph(WorkflowState)

        for step in steps:
            node_fn = self._make_step_node(
                step,
                definition.get("default_model", "gemini-flash"),
            )
            graph.add_node(step["id"], node_fn)

        # Edges: START -> first step
        graph.add_edge(START, steps[0]["id"])

        for step in steps:
            if step.get("condition"):
                cond = step["condition"]
                graph.add_conditional_edges(
                    step["id"],
                    self._make_condition(cond),
                    {"then": cond["then"], "else": cond.get("else", END)},
                )
            elif step.get("next_step"):
                graph.add_edge(step["id"], step["next_step"])
            else:
                graph.add_edge(step["id"], END)

        return graph.compile()

    # ------------------------------------------------------------------
    # Node factory
    # ------------------------------------------------------------------

    def _make_step_node(self, step: dict, default_model: str) -> Callable:
        step_type = step["type"]
        step_id = step["id"]
        step_config = step.get("config", {})

        async def node_fn(state: WorkflowState) -> dict:
            resolved_config = self._resolve_templates(
                step_config, state.get("steps_output", {})
            )

            if step_type == "tool":
                tool_name = step.get("tool_name", "")
                tool = TOOL_REGISTRY.get(tool_name)
                if tool:
                    result = await tool.ainvoke(resolved_config)
                else:
                    result = {"error": f"Tool '{tool_name}' not found in registry"}

            elif step_type == "llm":
                prompt = step.get("prompt", "")
                resolved_prompt = self._resolve_template_string(
                    prompt, state.get("steps_output", {})
                )
                # LLM call via langchain — resolve model alias
                from langchain_google_genai import ChatGoogleGenerativeAI
                from config import settings

                MODEL_MAP = {
                    "gemini-flash": "gemini-2.5-flash",
                    "gemini-pro": "gemini-2.5-pro",
                }
                model_name = MODEL_MAP.get(default_model, default_model)
                llm = ChatGoogleGenerativeAI(
                    model=model_name,
                    google_api_key=settings.GOOGLE_API_KEY,
                )
                response = await llm.ainvoke([HumanMessage(content=resolved_prompt)])
                result = response.content

            elif step_type == "hitl":
                last_output = state.get("steps_output", {})
                result = interrupt(
                    {
                        "step_id": step_id,
                        "step_name": step.get("name", ""),
                        "output_to_review": last_output,
                        "instructions": step_config.get(
                            "review_instructions",
                            "Revise o output abaixo.",
                        ),
                    }
                )
                if isinstance(result, dict) and not result.get("approved", True):
                    return {"error": "Rejeitado na revisao humana", "status": "failed"}

            elif step_type == "condition":
                result = {"evaluated": True}

            elif step_type == "action":
                tool_name = step.get("tool_name", "")
                tool = TOOL_REGISTRY.get(tool_name)
                if tool:
                    result = await tool.ainvoke(resolved_config)
                else:
                    result = {
                        "action": tool_name,
                        "status": "mock",
                        "message": f"Action '{tool_name}' not yet implemented",
                    }

            else:
                result = {"error": f"Unknown step type: {step_type}"}

            new_outputs = {**state.get("steps_output", {}), step_id: result}
            return {"current_step": step_id, "steps_output": new_outputs}

        return node_fn

    # ------------------------------------------------------------------
    # Condition factory
    # ------------------------------------------------------------------

    def _make_condition(self, condition: dict) -> Callable:
        field = condition.get("field", "")
        operator = condition.get("operator", "eq")
        value = condition.get("value")

        def router(state: WorkflowState) -> str:
            outputs = state.get("steps_output", {})
            last_output = list(outputs.values())[-1] if outputs else {}
            actual = last_output.get(field) if isinstance(last_output, dict) else None

            if operator == "eq":
                return "then" if actual == value else "else"
            elif operator == "neq":
                return "then" if actual != value else "else"
            elif operator == "gt":
                return "then" if actual is not None and actual > value else "else"
            elif operator == "lt":
                return "then" if actual is not None and actual < value else "else"
            elif operator == "contains":
                return "then" if value in str(actual) else "else"
            return "else"

        return router

    # ------------------------------------------------------------------
    # Template resolution
    # ------------------------------------------------------------------

    def _resolve_templates(
        self, config: dict, steps_output: dict
    ) -> dict:
        """Resolve template references in config values."""
        resolved = {}
        for key, val in config.items():
            if isinstance(val, str):
                resolved[key] = self._resolve_template_string(val, steps_output)
            else:
                resolved[key] = val
        return resolved

    def _resolve_template_string(self, template: str, steps_output: dict) -> str:
        """Replace {{steps.step_id.field}} and {{previous}} placeholders."""

        def replace_ref(match: re.Match) -> str:
            ref_path = match.group(1)  # e.g. "step_1.output"
            parts = ref_path.split(".")
            step_id = parts[0] if parts else ""
            output = steps_output.get(step_id, "")
            if len(parts) > 1 and isinstance(output, dict):
                return str(output.get(parts[1], output))
            return str(output)

        result = re.sub(r"\{\{steps\.([^}]+)\}\}", replace_ref, template)
        # Also replace {{previous}} with last step output
        if "{{previous}}" in result and steps_output:
            last = list(steps_output.values())[-1]
            result = result.replace("{{previous}}", str(last))
        return result
