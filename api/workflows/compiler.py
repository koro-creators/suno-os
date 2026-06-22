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

import json
import logging
import operator
import re
from collections import defaultdict
from datetime import datetime, timezone
from typing import Annotated, Any, Callable, TypedDict

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, ToolMessage
from langgraph.graph import END, START, StateGraph, add_messages
from langgraph.graph.state import CompiledStateGraph
from langgraph.types import interrupt

from config import settings

try:
    from langchain_anthropic import ChatAnthropic
except ImportError:
    ChatAnthropic = None  # type: ignore[assignment,misc]

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
except ImportError:
    ChatGoogleGenerativeAI = None  # type: ignore[assignment,misc]

try:
    from langchain_openai import ChatOpenAI
except ImportError:
    ChatOpenAI = None  # type: ignore[assignment,misc]

try:
    from agents import repository as agents_repository
    from core.db import get_sync_session
    from models.skill import Skill
    from workflows import repository as workflows_repository
    from workflows.tools import get_registry as _get_registry_fn
except ImportError:
    from api.agents import repository as agents_repository
    from api.core.db import get_sync_session
    from api.models.skill import Skill
    from api.workflows import repository as workflows_repository
    from api.workflows.tools import get_registry as _get_registry_fn

logger = logging.getLogger(__name__)


def _last_value(_old: str, new: str) -> str:
    """Reducer for `current_step`: concurrent writers (fan-in) just race to
    set "last one wins" — the field is informational only, never read back
    for routing (see `_make_condition`, which reads `steps_output` instead)."""
    return new


# ---------------------------------------------------------------------------
# State schema
# ---------------------------------------------------------------------------


class WorkflowState(TypedDict):
    workflow_id: str
    run_id: str
    client_id: str | None  # resolved from the run; powers client-scoped tools (ontologia)
    # Annotated com reducers: nodes em paralelo (fan-out/fan-in, ex. condition
    # com 2 entradas in_a/in_b) escrevem essas chaves no mesmo superstep.
    # Sem reducer, LangGraph levanta INVALID_CONCURRENT_GRAPH_UPDATE.
    steps_output: Annotated[dict[str, Any], operator.or_]
    current_step: Annotated[str, _last_value]
    status: str
    messages: Annotated[list[BaseMessage], add_messages]
    human_input: str | None
    started_at: str
    model: str
    error: str | None
    _depth: int
    config_overrides: dict


# ---------------------------------------------------------------------------
# Tool registry — auto-discovered from workflows/tools/
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# LLM factory — mirrors api/chat/tools/chat_tools.py::_get_llm
# ---------------------------------------------------------------------------

LLM_MODEL_MAP = {
    "gemini-flash": "gemini-2.5-flash",
    "gemini-pro": "gemini-2.5-pro",
    "gpt-4o": "gpt-4o",
    "claude": "claude-sonnet-4",
}


def _get_llm(model: str, temperature: float = 0.7) -> Any:
    """Instantiate the LangChain chat model for a workflow `llm` step.

    Falls back to Gemini Flash if the requested model's API key is missing,
    same as the chat agents' `_get_llm`.
    """
    model_id = LLM_MODEL_MAP.get(model, "gemini-2.5-flash")

    if model_id.startswith("gpt") and settings.OPENAI_API_KEY and ChatOpenAI is not None:
        return ChatOpenAI(model=model_id, temperature=temperature, api_key=settings.OPENAI_API_KEY)

    if model_id.startswith("claude") and settings.ANTHROPIC_API_KEY and ChatAnthropic is not None:
        return ChatAnthropic(
            model=model_id, temperature=temperature, api_key=settings.ANTHROPIC_API_KEY
        )

    if (
        model_id.startswith("gemini")
        and settings.GOOGLE_API_KEY
        and ChatGoogleGenerativeAI is not None
    ):
        return ChatGoogleGenerativeAI(
            model=model_id, temperature=temperature, google_api_key=settings.GOOGLE_API_KEY
        )

    # Fallback: always use Gemini Flash if available
    if settings.GOOGLE_API_KEY and ChatGoogleGenerativeAI is not None:
        if model != "gemini-flash":
            logger.warning(
                "API key for model '%s' not configured, falling back to Gemini Flash", model
            )
        return ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=temperature,
            google_api_key=settings.GOOGLE_API_KEY,
        )

    raise ValueError("No LLM API key configured. Set GOOGLE_API_KEY in .env")


def _get_tool_registry() -> dict:
    return _get_registry_fn()


def _lookup_agent_context(agent_id: str | None) -> str | None:
    """Load agent instructions + assigned skill descriptions for an llm step.

    Returns a combined system-prompt string: the agent's own instructions
    followed by a block listing each assigned skill's name and description,
    so the LLM can reason about which tools to invoke based on its expertise.
    Returns None when agent_id is absent or the agent no longer exists.
    """
    if not agent_id:
        return None

    session = get_sync_session()
    try:
        agent = agents_repository.get_agent(session, agent_id)
        if not agent:
            return None

        parts: list[str] = []
        if agent.get("instructions"):
            parts.append(agent["instructions"])

        slugs: list[str] = agent.get("assigned_skills") or []
        if slugs:
            skills = (
                session.query(Skill)
                .filter(Skill.slug.in_(slugs), Skill.status == "active")
                .all()
            )
            for s in skills:
                if s.system_prompt and s.system_prompt.strip():
                    parts.append(
                        f"## Skill: {s.name}\n{s.system_prompt.strip()}"
                    )
    finally:
        session.close()

    return "\n\n".join(parts) if parts else None


# Keep old name as alias so tests that import it directly still work.
_lookup_agent_instructions = _lookup_agent_context




def _lookup_workflow_definition(workflow_id: str) -> dict | None:
    """Fetch a persisted workflow (for `workflow`/sub-workflow steps).

    Opens its own short-lived session — sub-workflow compilation happens
    inside a node_fn, outside the request-scoped session.
    """
    session = get_sync_session()
    try:
        return workflows_repository.get_workflow(session, workflow_id)
    finally:
        session.close()


async def _run_react_llm_step(
    step: dict,
    embedded_tool_steps: list[dict],
    effective_outputs: dict,
    client_id: str | None,
    agent_instructions: str | None,
    resolve_template: Any,
    default_model: str,
    extra_outputs: dict | None = None,
) -> str:
    """ReAct tool-use loop: LLM decides which tools to invoke.

    Builds LangChain tools from connected tool steps, using each step's
    `introduction` field as the tool description so the LLM can reason about
    when to use each one. State-bound tools (consultar_ontologia/consultar_cliente)
    are wrapped with client_id in a closure so the LLM can choose to call them
    without needing to pass any arguments. Runs until the LLM returns a plain text
    response (no tool_calls) or MAX_ITER is reached.
    """
    registry = _get_tool_registry()

    # Build LangChain tools from connected tool steps.
    # Each tool's `introduction` field overrides its default description so the
    # LLM can reason about when to invoke it based on the user's wording.
    lc_tools: list[Any] = []
    for ts in embedded_tool_steps:
        tname = ts.get("tool_name", "")
        intro = (ts.get("introduction") or "").strip()
        wf_tool = registry.get(tname)
        if wf_tool is None:
            continue
        lc_tools.append(
            wf_tool.as_lc_tool(
                description=intro or None,
                client_id=client_id,
                extra_outputs=extra_outputs,
                step_id=ts["id"],
            )
        )

    def _extract_text(content: Any) -> str:
        """Extract plain text from an LLM response content field.

        Handles both string responses (Gemini/OpenAI) and list-of-blocks
        responses (Claude/Anthropic), where each block is a dict with
        {"type": "text", "text": "..."}.
        """
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            return " ".join(
                block.get("text", "") if isinstance(block, dict) else str(block)
                for block in content
                if not isinstance(block, dict) or block.get("type") == "text"
            ).strip()
        return str(content) if content else ""

    prompt = step.get("prompt", "")
    resolved = resolve_template(prompt, effective_outputs)

    llm = _get_llm(step.get("model") or default_model)

    if not lc_tools:
        # No bindable tools — plain completion with agent context.
        msgs: list[Any] = []
        if agent_instructions:
            msgs.append(SystemMessage(content=agent_instructions))
        msgs.append(HumanMessage(content=resolved))
        resp = await llm.ainvoke(msgs)
        return _extract_text(resp.content)

    llm_with_tools = llm.bind_tools(lc_tools)

    msgs = []
    if agent_instructions:
        msgs.append(SystemMessage(content=agent_instructions))
    msgs.append(HumanMessage(content=resolved))

    MAX_ITER = 5
    for _ in range(MAX_ITER):
        resp = await llm_with_tools.ainvoke(msgs)
        msgs.append(resp)

        if not getattr(resp, "tool_calls", None):
            return _extract_text(resp.content)

        for tc in resp.tool_calls:
            matched = next((t for t in lc_tools if t.name == tc["name"]), None)
            if matched:
                try:
                    tool_output = str(await matched.ainvoke(tc["args"]))
                except Exception as exc:  # noqa: BLE001
                    tool_output = f"Erro ao executar {tc['name']}: {exc}"
            else:
                tool_output = f"Ferramenta '{tc['name']}' não encontrada."
            msgs.append(ToolMessage(content=tool_output, tool_call_id=tc["id"]))
            if extra_outputs is not None:
                for ts in embedded_tool_steps:
                    if ts.get("tool_name") == tc["name"] and ts["id"] not in extra_outputs:
                        extra_outputs[ts["id"]] = {"output": tool_output}

    # Fallback: return the last text content found in the message chain.
    for m in reversed(msgs):
        text = _extract_text(getattr(m, "content", None))
        if text:
            return text
    return ""


# ---------------------------------------------------------------------------
# Condition evaluation — shared by the `condition` node and _make_condition's
# fallback (v1 / condition attached to a non-condition step type).
# ---------------------------------------------------------------------------


def _evaluate_condition(actual: Any, operator: str, value: Any) -> str:
    """Compara `actual` com `value` e retorna "then" ou "else".

    `actual` ja foi resolvido pelo chamador: "output" do step anterior
    (campo vazio) ou o literal digitado no campo "Campo" (campo preenchido).
    """
    # Normaliza bool vs string "true"/"false" digitada no campo: em Python
    # `True == "true"` e False e `float("true")` falha, entao sem isso a
    # comparacao cairia sempre em "else" quando `actual`/`value` vem de um
    # step `condition` (output e booleano) e o outro lado foi digitado como
    # texto "true"/"false".
    bool_strings = ("true", "false")
    if (
        isinstance(actual, bool)
        and isinstance(value, str)
        and value.strip().lower() in bool_strings
    ):
        value = value.strip().lower() == "true"
    elif (
        isinstance(value, bool)
        and isinstance(actual, str)
        and actual.strip().lower() in bool_strings
    ):
        actual = actual.strip().lower() == "true"

    # `value` vem da UI como string; `actual` pode ser numero, bool, str etc.
    # Tenta comparar numericamente quando ambos convertem pra float (ex.:
    # actual=5 (int), value="10" -> 5.0 < 10.0), senao cai pra comparacao
    # direta dos valores originais.
    cmp_actual, cmp_value = actual, value
    if operator in ("eq", "neq", "gt", "lt"):
        try:
            cmp_actual, cmp_value = float(actual), float(value)
        except (TypeError, ValueError):
            cmp_actual, cmp_value = actual, value

    if operator == "eq":
        return "then" if cmp_actual == cmp_value else "else"
    elif operator == "neq":
        return "then" if cmp_actual != cmp_value else "else"
    elif operator == "gt":
        try:
            return "then" if cmp_actual is not None and cmp_actual > cmp_value else "else"
        except TypeError:
            return "else"
    elif operator == "lt":
        try:
            return "then" if cmp_actual is not None and cmp_actual < cmp_value else "else"
        except TypeError:
            return "else"
    elif operator == "contains":
        return "then" if str(value) in str(actual) else "else"
    return "else"


# ---------------------------------------------------------------------------
# Compiler
# ---------------------------------------------------------------------------


class WorkflowCompiler:
    """Compiles a workflow definition dict into a LangGraph CompiledStateGraph."""

    def __init__(self) -> None:
        pass

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
                # `cond` no formato v2 (vindo do drawer) so tem field/operator/
                # value — then/else sao edges, nao chaves do dict. Usar .get()
                # com fallback pra END evita KeyError aqui (que travaria o run
                # em "running" pra sempre, pois compile() roda fora do
                # try/except de run_with_logs).
                graph.add_conditional_edges(
                    step["id"],
                    self._make_condition(cond, step_id=step["id"]),
                    {"then": cond.get("then", END), "else": cond.get("else", END)},
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

        # For `condition` steps: map in_a (CAMPO source) / in_b (VALOR source)
        # target handles to the source step that feeds each one. Legacy `in`
        # edges (single-input, pre-SPEC-005) count as in_a.
        condition_inputs: dict[str, dict[str, str]] = {}
        for edge in edges:
            tgt = steps_by_id.get(edge["target_step_id"])
            if tgt is None or tgt["type"] != "condition":
                continue
            handle = edge["target_handle"]
            input_key = "in_a" if handle in ("in", "in_a") else "in_b" if handle == "in_b" else None
            if input_key:
                source_id = edge["source_step_id"]
                condition_inputs.setdefault(edge["target_step_id"], {})[input_key] = source_id

        # For `merge` steps: collect the source steps feeding the single
        # `in` handle, sorted for deterministic aggregation order.
        merge_inputs: dict[str, list[str]] = defaultdict(list)
        for edge in edges:
            tgt = steps_by_id.get(edge["target_step_id"])
            if tgt is not None and tgt["type"] == "merge":
                merge_inputs[edge["target_step_id"]].append(edge["source_step_id"])
        for sources in merge_inputs.values():
            sources.sort()

        # For `llm` steps: collect tool data connections (tool_0/1/2 handles).
        # Tool steps connected here are "embedded" — they are NOT independent
        # graph nodes; instead they execute inside the LLM node when it runs
        # (option-2 semantics: tool fires only when its LLM is triggered).
        connected_inputs: dict[str, list[str]] = defaultdict(list)
        for edge in edges:
            tgt = steps_by_id.get(edge["target_step_id"])
            if (
                tgt is not None
                and tgt["type"] == "llm"
                and edge["target_handle"] == "tool_0"
            ):
                connected_inputs[edge["target_step_id"]].append(edge["source_step_id"])
        for sources in connected_inputs.values():
            sources.sort()

        # Build the embedded-tool index and the exclusion set.
        embedded_tool_steps: dict[str, list[dict]] = {}
        excluded_from_graph: set[str] = set()
        for llm_id, tool_ids in connected_inputs.items():
            tool_dicts = [
                steps_by_id[tid]
                for tid in tool_ids
                if steps_by_id.get(tid, {}).get("type") == "tool"
            ]
            if tool_dicts:
                embedded_tool_steps[llm_id] = tool_dicts
                excluded_from_graph.update(s["id"] for s in tool_dicts)

        for step in steps:
            if step["id"] in excluded_from_graph:
                continue
            base_fn = self._make_step_node(
                step,
                definition.get("default_model", "gemini-flash"),
                input_sources=condition_inputs.get(step["id"]),
                merge_inputs=merge_inputs.get(step["id"]),
                connected_inputs=connected_inputs.get(step["id"]),
                embedded_tool_steps=embedded_tool_steps.get(step["id"]),
            )
            if step["type"] == "merge" and step.get("merge_policy") == "any":
                node_fn = self._make_merge_any_node(step, base_fn)
            elif step.get("_error_target"):
                node_fn = self._wrap_with_error_routing(step, base_fn)
            else:
                node_fn = base_fn
            graph.add_node(step["id"], node_fn)

        # Group edges by source for handle-aware routing.
        # Edges from embedded tool steps are now internal to the LLM node —
        # exclude them from the graph-level wiring.
        edges_by_source: dict[str, list[dict]] = {}
        for edge in edges:
            if edge["source_step_id"] in excluded_from_graph:
                continue
            edges_by_source.setdefault(edge["source_step_id"], []).append(edge)
        # Stable order — guarantees deterministic StateGraph construction so
        # the v1↔v2 byte-equivalence test (CA-26) is reliable.
        for src in edges_by_source:
            edges_by_source[src].sort(key=lambda e: (e["source_handle"], e["target_step_id"]))

        in_degree: dict[str, int] = {
            sid: 0 for sid in steps_by_id if sid not in excluded_from_graph
        }
        for edge in edges:
            src, tgt = edge["source_step_id"], edge["target_step_id"]
            if src in excluded_from_graph or tgt in excluded_from_graph:
                continue
            in_degree[tgt] = in_degree.get(tgt, 0) + 1

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
            if step["id"] in excluded_from_graph:
                continue
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
            mapping.setdefault("then", END)
            mapping.setdefault("else", END)
            cond = source_step.get("condition") or {
                "field": "",
                "operator": "eq",
                "value": None,
            }
            graph.add_conditional_edges(src_id, self._make_condition(cond, step_id=src_id), mapping)
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

    def _make_step_node(
        self,
        step: dict,
        default_model: str,
        input_sources: dict[str, str] | None = None,
        merge_inputs: list[str] | None = None,
        connected_inputs: list[str] | None = None,
        embedded_tool_steps: list[dict] | None = None,
    ) -> Callable:
        step_type = step["type"]
        step_id = step["id"]
        step_config = step.get("config", {})

        async def node_fn(state: WorkflowState) -> dict:
            resolved_config = self._resolve_templates(step_config, state.get("steps_output", {}))
            extra_outputs: dict = {}

            if step_type == "tool":
                tool_name = step.get("tool_name", "")
                wf_tool = _get_tool_registry().get(tool_name)
                if wf_tool is None:
                    result = {"error": f"Tool '{tool_name}' not found in registry"}
                elif wf_tool.state_bound:
                    result = wf_tool.func(state.get("client_id"))
                else:
                    result = await wf_tool.ainvoke(resolved_config)

            elif step_type == "llm":
                effective_outputs = dict(state.get("steps_output", {}))
                agent_id = step.get("agent_id")
                agent_instructions = _lookup_agent_instructions(agent_id)

                if agent_id and embedded_tool_steps:
                    # ReAct mode: LLM decides which tools to call based on
                    # their `introduction` descriptions. State-bound tools are
                    # real LangChain tools with client_id captured in a closure
                    # — the LLM chooses if/when to invoke them.
                    result = await _run_react_llm_step(
                        step=step,
                        embedded_tool_steps=embedded_tool_steps,
                        effective_outputs=effective_outputs,
                        client_id=state.get("client_id"),
                        agent_instructions=agent_instructions,
                        resolve_template=self._resolve_template_string,
                        default_model=default_model,
                        extra_outputs=extra_outputs,
                    )
                else:
                    # Deterministic mode: run all tools first, then call LLM.
                    if embedded_tool_steps:
                        registry = _get_tool_registry()
                        for tool_step in embedded_tool_steps:
                            tsid = tool_step["id"]
                            tname = tool_step.get("tool_name", "")
                            tconfig = self._resolve_templates(
                                tool_step.get("config", {}), effective_outputs
                            )
                            wf_tool = registry.get(tname)
                            if wf_tool is None:
                                tresult = {"error": f"Tool '{tname}' not found in registry"}
                            elif wf_tool.state_bound:
                                tresult = wf_tool.func(state.get("client_id"))
                            else:
                                tresult = await wf_tool.ainvoke(tconfig)
                            if not isinstance(tresult, (dict, list)):
                                tresult = {"output": tresult}
                            extra_outputs[tsid] = tresult
                            effective_outputs[tsid] = tresult
                    prompt = step.get("prompt", "")
                    resolved_prompt = self._resolve_template_string(prompt, effective_outputs)
                    no_tpl = "{{previous}}" not in prompt and "{{steps." not in prompt
                    if connected_inputs and no_tpl:
                        context = {sid: effective_outputs.get(sid) for sid in connected_inputs}
                        resolved_prompt = (
                            f"Dados recebidos:\n{json.dumps(context, ensure_ascii=False, indent=2)}"
                            f"\n\n{resolved_prompt}"
                        )
                    if agent_instructions:
                        resolved_prompt = f"{agent_instructions}\n\n{resolved_prompt}"
                    llm = _get_llm(step.get("model") or default_model)
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
                cond = step.get("condition") or {}
                field = cond.get("field") or ""
                operator = cond.get("operator", "eq")
                cond_value = cond.get("value") or ""

                prev_outputs = state.get("steps_output", {})
                last_output = list(prev_outputs.values())[-1] if prev_outputs else {}
                # "output" e a chave universal que steps anteriores gravam em
                # steps_output (ver wrapping no fim de node_fn).
                prev_output_value = (
                    last_output.get("output") if isinstance(last_output, dict) else None
                )

                def _resolve_input(handle: str, literal: str) -> Any:
                    # Campo/Valor preenchidos (modo "Avancado") sao usados
                    # literalmente. Vazios: se houver edge conectada no handle
                    # in_a/in_b, usa o "output" desse step especifico; senao
                    # cai no output do step anterior (comportamento legado).
                    if literal:
                        return literal
                    source_id = (input_sources or {}).get(handle)
                    if source_id is not None:
                        source_output = prev_outputs.get(source_id)
                        return (
                            source_output.get("output") if isinstance(source_output, dict) else None
                        )
                    return prev_output_value

                actual = _resolve_input("in_a", field)
                value = _resolve_input("in_b", cond_value)

                branch = _evaluate_condition(actual, operator, value)
                result = {
                    "output": branch == "then",
                    "field": field,
                    "operator": operator,
                    "value": value,
                    "actual": actual,
                    "branch": branch,
                }

            elif step_type == "action":
                tool_name = step.get("tool_name", "")
                wf_tool = _get_tool_registry().get(tool_name)
                if wf_tool and not wf_tool.state_bound:
                    result = await wf_tool.ainvoke(resolved_config)
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
                sub_def = _lookup_workflow_definition(target_wf_id) if target_wf_id else None
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
                        sub_graph = sub_compiler.compile(sub_definition, edges=sub_def.get("edges"))

                        # 5. Criar state inicial do sub-workflow e executar
                        sub_state = {
                            "workflow_id": target_wf_id,
                            "run_id": state.get("run_id", "") + f"_sub_{step_id}",
                            "client_id": state.get("client_id"),
                            "steps_output": {},
                            "current_step": "",
                            "status": "running",
                            "messages": [],
                            "human_input": None,
                            "started_at": datetime.now(timezone.utc).isoformat(),
                            "model": sub_def.get("default_model")
                            or state.get("model", "gemini-flash"),
                            "error": None,
                            "_depth": current_depth + 1,
                            "config_overrides": resolved_mapping,
                        }
                        sub_result = await sub_graph.ainvoke(sub_state)
                        # Pegar o final output (ultimo valor em steps_output)
                        sub_outputs = sub_result.get("steps_output", {})
                        result = list(sub_outputs.values())[-1] if sub_outputs else sub_result

            elif step_type == "merge":
                # `merge_policy='any'` is handled upstream by
                # `_make_merge_any_node`, which only falls back to this
                # branch if every predecessor produced empty output — so
                # this is the common path for `'all'` (and the fallback for
                # `'any'`). Aggregates each predecessor's output by step id
                # (CA-11).
                outputs = state.get("steps_output", {})
                merged = {sid: outputs.get(sid) for sid in (merge_inputs or [])}
                result = {"merged": merged, "policy": step.get("merge_policy") or "all"}

            else:
                result = {"error": f"Unknown step type: {step_type}"}

            # Resultados escalares (string/numero/bool de llm, generate_text,
            # web_search, etc.) sao embrulhados em {"output": ...} para que
            # `condition`/templates acessem via field/placeholder "output" de
            # forma uniforme, igual a steps que ja retornam dict (tool error,
            # merge). Dicts/listas (ja "navegaveis") passam direto.
            if not isinstance(result, (dict, list)):
                result = {"output": result}

            new_outputs = {**state.get("steps_output", {}), **extra_outputs, step_id: result}
            return {"current_step": step_id, "steps_output": new_outputs}

        return node_fn

    # ------------------------------------------------------------------
    # Condition factory
    # ------------------------------------------------------------------

    def _make_condition(self, condition: dict, step_id: str | None = None) -> Callable:
        def router(state: WorkflowState) -> str:
            # Caminho normal (step_type="condition"): o node_fn ja calculou o
            # branch usando o output do step anterior (capturado antes de
            # gravar o proprio resultado em steps_output) e gravou em
            # steps_output[step_id]["branch"]. So reaproveitar aqui garante
            # que o routing usa exatamente a mesma avaliacao exibida no
            # Run History — sem reler "last_output" (que a essa altura já
            # seria o proprio resultado do condition, nao o do step anterior).
            if step_id is not None:
                own = state.get("steps_output", {}).get(step_id)
                if isinstance(own, dict) and "branch" in own:
                    return own["branch"]

            # Fallback (v1 legacy / condition anexada a um step que nao e do
            # tipo "condition"): mesma regra do node_fn — campo/valor vazios
            # caem no "output" do step anterior; preenchidos sao literais.
            field = condition.get("field") or ""
            operator = condition.get("operator", "eq")
            cond_value = condition.get("value") or ""
            outputs = state.get("steps_output", {})
            last_output = list(outputs.values())[-1] if outputs else {}
            prev_output_value = last_output.get("output") if isinstance(last_output, dict) else None
            actual = field if field else prev_output_value
            value = cond_value if cond_value else prev_output_value
            return _evaluate_condition(actual, operator, value)

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
            if isinstance(last, dict):
                last = last.get("output", last)
            result = result.replace("{{previous}}", str(last))
        return result
