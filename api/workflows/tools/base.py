"""Workflow tool registry — @workflow_tool decorator and WorkflowTool descriptor."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable

from langchain_core.tools import StructuredTool
from pydantic import BaseModel

_REGISTRY: dict[str, "WorkflowTool"] = {}


@dataclass
class WorkflowTool:
    """Descriptor for a tool available in the workflow canvas.

    state_bound=True: func signature is (client_id: str | None) -> str.
    The LLM calls it with no arguments; client_id is injected from run state.

    state_bound=False: func is a LangChain @tool object (has .name, .func,
    .coroutine, .args_schema). The LLM may pass arguments.
    """

    name: str
    func: Callable
    state_bound: bool = False

    def as_lc_tool(
        self,
        *,
        description: str | None = None,
        client_id: str | None = None,
        extra_outputs: dict | None = None,
        step_id: str | None = None,
    ) -> Any:
        """Return a LangChain StructuredTool ready for bind_tools.

        For state-bound tools, client_id is captured in a closure so the LLM
        never sees or provides it (caixa-preta RN-009/010). Tool results are
        also written to extra_outputs for step_logs persistence.
        """

        class _NoArgs(BaseModel):
            pass

        if self.state_bound:
            fn, cid, xouts, sid = self.func, client_id, extra_outputs, step_id

            def _bound() -> str:
                res = fn(cid) or "Dados não disponíveis"
                if not isinstance(res, str):
                    res = str(res)
                if xouts is not None and sid:
                    xouts[sid] = {"output": res}
                return res

            default_desc = (self.func.__doc__ or "").strip() or f"Ferramenta {self.name}"
            return StructuredTool.from_function(
                name=self.name,
                description=description or default_desc,
                func=_bound,
                args_schema=_NoArgs,
            )

        # Regular LangChain @tool — optionally override description.
        base = self.func
        if description:
            return StructuredTool(
                name=base.name,
                description=description,
                func=base.func,
                coroutine=getattr(base, "coroutine", None),
                args_schema=base.args_schema,
            )
        return base

    async def ainvoke(self, config: dict) -> Any:
        """Async-invoke a regular (non-state-bound) tool with resolved config."""
        return await self.func.ainvoke(config)


def workflow_tool(name: str, *, state_bound: bool = False) -> Callable:
    """Decorator that registers a function in the workflow tool registry.

    Usage:
        @workflow_tool("my_tool")
        async def my_tool(...): ...

        @workflow_tool("consultar_ontologia", state_bound=True)
        def consultar_ontologia(client_id: str | None) -> str: ...
    """

    def decorator(fn: Callable) -> Callable:
        _REGISTRY[name] = WorkflowTool(name=name, func=fn, state_bound=state_bound)
        return fn

    return decorator


def register_tool(name: str, lc_tool: Any, aliases: list[str] | None = None) -> None:
    """Register an existing LangChain @tool under one or more workflow tool names."""
    _REGISTRY[name] = WorkflowTool(name=name, func=lc_tool, state_bound=False)
    for alias in aliases or []:
        _REGISTRY[alias] = WorkflowTool(name=alias, func=lc_tool, state_bound=False)


def get_registry() -> dict[str, WorkflowTool]:
    """Return the current tool registry (triggers lazy registration on first call)."""
    return _REGISTRY
