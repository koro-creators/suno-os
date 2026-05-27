"""Skill loader — converts agent skill assignments into LangChain tools.

PRE-04 blocker: Skills Admin not in DB yet (SPEC-017). Mock tools returned.
When SPEC-017 is implemented: query DB for skill's SKILL.md + references/,
build a real tool that calls the chat graph with skill context injected.
"""
from __future__ import annotations

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field


class _SkillInput(BaseModel):
    query: str = Field(..., description="Task or question for this skill")


def skill_to_tool(skill_slug: str) -> StructuredTool:
    """Build a LangChain StructuredTool from a skill slug.

    PRE-04: returns mock tool echoing the query.
    """
    slug_clean = skill_slug.replace("-", "_")

    def _run(query: str) -> str:
        return f"[{skill_slug}] Processado: {query}"

    return StructuredTool.from_function(
        func=_run,
        name=slug_clean,
        description=f"Skill '{skill_slug}': use para tarefas relacionadas a {skill_slug}.",
        args_schema=_SkillInput,
    )
