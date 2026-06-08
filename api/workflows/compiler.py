"""Workflow Compiler — converts WorkflowDefinition JSON into a LangGraph StateGraph.

SPEC-005 Phase B introduces a v2 path that reads first-class edges from
`workflow_edges` (passed in alongside the definition) instead of the v1
implicit-linkage shape (`step.next_step` + `step.condition.then|else`).

The selector is the presence of an `edges` list:
  • If the caller supplies edges (or `definition.edges` is non-empty), the
    compiler routes through `_compile_v2_with_edges`.
  • Otherwise it falls through to `_compile_v1_legacy` (the original
    implementation, untouched apart from being moved to a private method).

CA-26 of spec.md mandates byte-equivalence: a *linear* v1 workflow compiled
v1-style produces the same LangGraph topology as the same workflow once
migrated and compiled v2-style. The migration JIT (TASK-B06) preserves
the order so this invariant holds.

Logging carries `compiler_version` so dashboards can confirm the v1
fallback decays to zero before sunset (Fase D / E).
"""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Annotated, Any, Callable, TypedDict

from langchain_core.messages import BaseMessage, HumanMessage
from langgraph.graph import END, START, StateGraph, add_messages
from langgraph.graph.state import CompiledStateGraph
from langgraph.types import interrupt

logger = logging.getLogger(__name__)


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
    _depth: int
    config_overrides: dict


# ---------------------------------------------------------------------------
# Tool registry — lazy-loads existing chat tools to avoid circular imports
# ---------------------------------------------------------------------------

TOOL_REGISTRY: dict[str, Any] = {}


def _load_tool_registry() -> None:
    """Lazy-load tools from chat/tools/ into the registry."""
    global TOOL_REGISTRY
    if TOOL_REGISTRY:
        return
    # The tool objects are the @tool-decorated functions; their module-level
    # names match the function names (generate_text / generate_image /
    # web_search), NOT the *_tool aliases this used to import (which silently
    # ImportError'd, leaving the registry empty and every tool step failing).
    try:
        from chat.tools.text_tools import generate_text

        TOOL_REGISTRY["generate_text"] = generate_text
        TOOL_REGISTRY["text_generation"] = generate_text
    except ImportError:
        pass
    try:
        from chat.tools.image_tools import generate_image

        TOOL_REGISTRY["generate_image"] = generate_image
    except ImportError:
        pass
    try:
        from chat.tools.search_tools import web_search

        TOOL_REGISTRY["search_knowledge"] = web_search
        TOOL_REGISTRY["web_search"] = web_search
    except ImportError:
        pass


# ---------------------------------------------------------------------------
# Compiler
# ---------------------------------------------------------------------------


class WorkflowCompiler:
    """Compiles a workflow definition dict into a LangGraph CompiledStateGraph."""

    def __init__(self) -> None:
        _load_tool_registry()

    def compile(
        self,
        definition: dict,
        edges: list[dict] | None = None,
    ) -> CompiledStateGraph:
        """Compile WorkflowDefinition JSON -> LangGraph StateGraph.

        v2 path is taken when `edges` is non-empty (passed explicitly or
        embedded in `definition.edges`). Otherwise the v1 fallback runs.
        Existing callers that don't pass `edges` and don't add `edges` to
        their definition transparently keep the v1 behaviour.
        """
        steps: list[dict] = definition.get("steps", [])
        if not steps:
            raise ValueError("Workflow must have at least one step")

        # Resolve edges: explicit kwarg wins, then definition.edges, then v1.
        resolved_edges = edges if edges is not None else definition.get("edges", [])

        if resolved_edges:
            logger.info(
                "compile(): version=v2 steps=%d edges=%d",
                len(steps),
                len(resolved_edges),
            )
            return self._compile_v2_with_edges(definition, resolved_edges)

        logger.info("compile(): version=v1_fallback steps=%d", len(steps))
        return self._compile_v1_legacy(definition)

    # ------------------------------------------------------------------
    # v1 — legacy linkage via step.next_step / step.condition
    # ------------------------------------------------------------------

    def _compile_v1_legacy(self, definition: dict) -> CompiledStateGraph:
        """Original v1 compiler, kept verbatim for retrocompat (1 release)."""
        steps: list[dict] = definition.get("steps", [])
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
    # v2 — first-class edges with fan-out + handle routing
    # ------------------------------------------------------------------

    # Special key used in WorkflowState.steps_output to signal that a node's
    # error handle should route the run. Picked deliberately namespaced so
    # it can never collide with a user step id.
    _ERROR_ROUTE_KEY = "__error_route__"

    def _compile_v2_with_edges(self, definition: dict, edges: list[dict]) -> CompiledStateGraph:
        """Build the StateGraph from explicit edges (SPEC-005 constitution §2)."""
        steps: list[dict] = definition.get("steps", [])
        graph = StateGraph(WorkflowState)
        steps_by_id: dict[str, dict] = {s["id"]: s for s in steps}

        # First pass: stamp `_error_target` on steps that have an error edge.
        # Done before node creation so the wrapped node_fn can read the target.
        for edge in edges:
            if edge["source_handle"] == "error":
                src = steps_by_id.get(edge["source_step_id"])
                if src is not None:
                    src["_error_target"] = edge["target_step_id"]

        for step in steps:
            base_fn = self._make_step_node(
                step,
                definition.get("default_model", "gemini-flash"),
            )
            if step["type"] == "merge" and step.get("merge_policy") == "any":
                node_fn = self._make_merge_any_node(step, base_fn)
            elif step.get("_error_target"):
                node_fn = self._wrap_with_error_routing(step, base_fn)
            else:
                node_fn = base_fn
            graph.add_node(step["id"], node_fn)

        # Group edges by source for handle-aware routing.
        edges_by_source: dict[str, list[dict]] = {}
        for edge in edges:
            edges_by_source.setdefault(edge["source_step_id"], []).append(edge)
        # Stable order — guarantees deterministic StateGraph construction so
        # the v1↔v2 byte-equivalence test (CA-26) is reliable.
        for src in edges_by_source:
            edges_by_source[src].sort(key=lambda e: (e["source_handle"], e["target_step_id"]))

        in_degree: dict[str, int] = {sid: 0 for sid in steps_by_id}
        for edge in edges:
            in_degree[edge["target_step_id"]] = in_degree.get(edge["target_step_id"], 0) + 1

        # START → entry nodes (every step with in_degree 0). Spec-005 has at
        # least one entry (validator catches `no_entry_node`); we sort for
        # determinism if the user has multiple entries.
        entries = sorted(sid for sid, deg in in_degree.items() if deg == 0)
        if not entries:
            # Defensive fallback to first declared step. Validator should have
            # blocked this PUT, but compile() must not crash on bad data.
            entries = [steps[0]["id"]]
        for entry in entries:
            graph.add_edge(START, entry)

        # Per-source wiring.
        for source_id, source_edges in edges_by_source.items():
            source_step = steps_by_id.get(source_id)
            if source_step is None:
                continue
            self._wire_source_v2(graph, source_step, source_edges)

        # Any node with no outbound edge — and no error handle — points to END.
        for step in steps:
            if step["id"] in edges_by_source:
                continue
            if step.get("_error_target"):
                # Node has only an error handle; happy path goes to END.
                continue
            graph.add_edge(step["id"], END)

        return graph.compile()

    def _wire_source_v2(
        self,
        graph: StateGraph,
        source_step: dict,
        source_edges: list[dict],
    ) -> None:
        """Wire outgoing edges of a single source step into the StateGraph.

        - condition: maps `then`/`else` → respective targets.
        - hitl: maps `approved`/`rejected`/`modified` → targets via routing fn.
        - tool/llm/action/workflow/merge: regular `add_edge`. Multiple targets
          on the same handle (typically `out`) become parallel fan-out — that
          is the native LangGraph behaviour. `error` becomes a separate edge
          that the executor's wrapper (TASK-B05) routes to on exception.
        """
        src_id = source_step["id"]
        src_type = source_step["type"]

        if src_type == "condition":
            mapping: dict[str, str] = {}
            for edge in source_edges:
                # `then`/`else` are the only legal handles for condition; the
                # validator already rejected anything else.
                mapping[edge["source_handle"]] = edge["target_step_id"]
            mapping.setdefault("else", END)
            cond = source_step.get("condition") or {
                "field": "",
                "operator": "eq",
                "value": None,
            }
            graph.add_conditional_edges(src_id, self._make_condition(cond), mapping)
            return

        if src_type == "hitl":
            mapping = {edge["source_handle"]: edge["target_step_id"] for edge in source_edges}
            mapping.setdefault("approved", END)

            def hitl_router(state: WorkflowState, _src=src_id, _map=mapping) -> str:
                last = state.get("steps_output", {}).get(_src, {})
                if isinstance(last, dict):
                    if last.get("error") and "rejected" in _map:
                        return "rejected"
                    if last.get("modified") and "modified" in _map:
                        return "modified"
                return "approved"

            graph.add_conditional_edges(src_id, hitl_router, mapping)
            return

        # tool / llm / action / workflow / merge:
        #   - happy-path edges: become regular `add_edge` (fan-out = multiple).
        #   - error edge: handled via add_conditional_edges so the wrapper's
        #     state marker can route to either the happy targets or the
        #     error target without LangGraph waiting on impossible branches.
        happy_targets = sorted(
            {e["target_step_id"] for e in source_edges if e["source_handle"] != "error"}
        )
        error_target = next(
            (e["target_step_id"] for e in source_edges if e["source_handle"] == "error"),
            None,
        )

        if error_target is None:
            for tgt in happy_targets:
                graph.add_edge(src_id, tgt)
            return

        # `_error_target` is also stamped onto the step itself for
        # `_wrap_with_error_routing` to read; here we wire the LangGraph
        # routing.
        source_step["_error_target"] = error_target
        if not happy_targets:
            # All happy paths absent: fallback to END for the OK case.
            mapping = {"ok": END, "error": error_target}

            def err_only_router(state: WorkflowState, _src=src_id) -> str:
                marker = state.get("steps_output", {}).get(self._ERROR_ROUTE_KEY)
                return "error" if marker == _src else "ok"

            graph.add_conditional_edges(src_id, err_only_router, mapping)
            return

        # Happy path: dispatch to all happy targets in parallel (fan-out).
        # Error path: dispatch to the single error target. LangGraph
        # add_conditional_edges expects a single destination per branch in
        # the standard form, so we build a small router that returns either
        # the literal "error" key or the literal "happy" key, then map keys
        # to multi-target lists via a custom add_conditional_edges signature.
        mapping = {"happy": happy_targets, "error": error_target}

        def err_router(state: WorkflowState, _src=src_id) -> str:
            marker = state.get("steps_output", {}).get(self._ERROR_ROUTE_KEY)
            return "error" if marker == _src else "happy"

        graph.add_conditional_edges(src_id, err_router, mapping)

    # ------------------------------------------------------------------
    # Wrappers for v2 special semantics
    # ------------------------------------------------------------------

    def _wrap_with_error_routing(self, step: dict, base_fn: Callable) -> Callable:
        """Wrap a node fn so that exceptions emit an error-route marker.

        Without this wrapper, an exception inside `base_fn` would propagate
        and kill the LangGraph run. With it, the exception is captured and
        the step writes a state marker that `err_router` (added in
        `_wire_source_v2`) reads to route to the user's error target.
        """
        step_id = step["id"]
        error_route_key = self._ERROR_ROUTE_KEY

        async def wrapped(state: WorkflowState) -> dict:
            try:
                return await base_fn(state)
            except Exception as exc:  # noqa: BLE001 — explicit catch is the point
                logger.warning(
                    "step %s raised %s — routing through error handle",
                    step_id,
                    exc.__class__.__name__,
                )
                outputs = {
                    **state.get("steps_output", {}),
                    step_id: {"error": str(exc), "exception": exc.__class__.__name__},
                    error_route_key: step_id,
                }
                return {"current_step": step_id, "steps_output": outputs}

        return wrapped

    def _make_merge_any_node(self, step: dict, base_fn: Callable) -> Callable:
        """Merge node with `merge_policy='any'`.

        Limitation (documented in ADR-LOCAL-04): LangGraph natively waits
        for all predecessors before invoking a node, so true cancellation
        of pending sibling branches requires an external wrapper around
        the whole graph (deferred to a follow-up). What this implementation
        guarantees in V1 is the *semantic* result the user expects:

          • The merge node returns the first predecessor output it sees as
            non-empty (deterministic by step-id sort).
          • Subsequent predecessor outputs are ignored.
          • Tasks are not actually cancelled; their work is wasted but
            their result is dropped. This is the V1 trade-off.

        The TODO-DESIGN-A in design.md tracks promoting this to real
        cancellation once the executor wrapper lands.
        """
        step_id = step["id"]

        async def merge_any(state: WorkflowState) -> dict:
            outputs = state.get("steps_output", {})
            # Deterministic "first" — sort the predecessor outputs by step id
            # and pick the first non-None / non-empty value.
            picked = None
            for sid in sorted(outputs.keys()):
                if sid == step_id or sid.startswith("__"):
                    continue
                val = outputs[sid]
                if val is not None and val != "" and val != {}:
                    picked = val
                    break
            # Fall back to the regular base_fn if nothing was picked (rare;
            # implies all predecessors produced empty output).
            if picked is None:
                return await base_fn(state)
            new_outputs = {**outputs, step_id: {"merged": picked, "policy": "any"}}
            return {"current_step": step_id, "steps_output": new_outputs}

        return merge_any

    # ------------------------------------------------------------------
    # Node factory
    # ------------------------------------------------------------------

    def _make_step_node(self, step: dict, default_model: str) -> Callable:
        step_type = step["type"]
        step_id = step["id"]
        step_config = step.get("config", {})

        async def node_fn(state: WorkflowState) -> dict:
            resolved_config = self._resolve_templates(step_config, state.get("steps_output", {}))

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

            elif step_type == "workflow":
                target_wf_id = step.get("workflow_id")
                input_mapping = step.get("input_mapping") or {}

                # 1. Buscar definition do sub-workflow
                from workflows.router import _workflows

                sub_def = _workflows.get(target_wf_id) if target_wf_id else None
                if not target_wf_id or not sub_def:
                    result = {"error": f"Workflow '{target_wf_id}' not found"}
                else:
                    # 2. Verificar depth ANTES de compilar
                    current_depth = state.get("_depth", 0)
                    if current_depth >= 3:
                        result = {"error": "max_depth_exceeded: maximum nesting depth is 3"}
                    else:
                        # 3. Resolver input_mapping templates
                        resolved_mapping = self._resolve_templates(
                            input_mapping, state.get("steps_output", {})
                        )

                        # 4. Compilar sub-workflow
                        sub_compiler = WorkflowCompiler()
                        sub_definition = sub_def["definition"]
                        sub_graph = sub_compiler.compile(sub_definition)

                        # 5. Criar state inicial do sub-workflow e executar
                        sub_state = {
                            "workflow_id": target_wf_id,
                            "run_id": state.get("run_id", "") + f"_sub_{step_id}",
                            "steps_output": {},
                            "current_step": "",
                            "status": "running",
                            "messages": [],
                            "human_input": None,
                            "started_at": datetime.now(timezone.utc).isoformat(),
                            "model": sub_definition.get(
                                "default_model",
                                state.get("model", "gemini-flash"),
                            ),
                            "error": None,
                            "_depth": current_depth + 1,
                            "config_overrides": resolved_mapping,
                        }
                        sub_result = await sub_graph.ainvoke(sub_state)
                        # Pegar o final output (ultimo valor em steps_output)
                        sub_outputs = sub_result.get("steps_output", {})
                        result = list(sub_outputs.values())[-1] if sub_outputs else sub_result

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

    def _resolve_templates(self, config: dict, steps_output: dict) -> dict:
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
