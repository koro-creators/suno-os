"""Prompt enhancement tool — improves user prompts for better AI results."""

import json

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool

from chat.tools.chat_tools import _get_llm

TARGET_INSTRUCTIONS = {
    "chat": (
        "The enhanced prompt will be used in a conversational AI chat. "
        "Make it specific, add context cues, and clarify the desired output format."
    ),
    "image": (
        "The enhanced prompt will be used for AI image generation. "
        "Add visual details: style, lighting, composition, color palette, mood, and medium."
    ),
    "video": (
        "The enhanced prompt will be used for AI video generation. "
        "Add motion details: camera movement, pacing, transitions, duration hints, and mood."
    ),
    "text": (
        "The enhanced prompt will be used for AI text generation. "
        "Clarify the audience, tone, structure, and key points to cover."
    ),
}

SYSTEM_PROMPT = """\
You are a prompt engineering expert. Your job is to take a user's rough prompt \
and enhance it so it produces significantly better results from AI tools.

{target_instruction}

Additional context from the user (may be empty): {context}

IMPORTANT: Respond with ONLY valid JSON in this exact format, no markdown fences:
{{
  "enhanced_prompt": "the improved prompt text",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "reasoning": "brief explanation of what you changed and why"
}}
"""


@tool
def enhance_prompt(prompt: str, target_tool: str = "chat", context: str = "") -> str:
    """Enhance a user prompt to get better results from AI tools.

    Returns enhanced prompt with reasoning.
    """
    try:
        target_instruction = TARGET_INSTRUCTIONS.get(target_tool, TARGET_INSTRUCTIONS["chat"])

        system = SYSTEM_PROMPT.format(
            target_instruction=target_instruction,
            context=context or "None provided.",
        )

        # Use Gemini Flash — cheapest model for this utility task.
        llm = _get_llm("gemini-flash", temperature=0.4)

        messages = [
            SystemMessage(content=system),
            HumanMessage(content=f"Enhance this prompt:\n\n{prompt}"),
        ]

        response = llm.invoke(messages)
        raw = response.content

        # Validate that the response is parseable JSON.
        try:
            parsed = json.loads(raw)
            # Re-serialize to ensure consistent formatting.
            return json.dumps(parsed, ensure_ascii=False, indent=2)
        except json.JSONDecodeError:
            # LLM sometimes wraps in markdown fences — try stripping them.
            cleaned = (
                raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            )
            try:
                parsed = json.loads(cleaned)
                return json.dumps(parsed, ensure_ascii=False, indent=2)
            except json.JSONDecodeError:
                # Return raw response wrapped in a JSON envelope so callers
                # always get a consistent shape.
                fallback = {
                    "enhanced_prompt": raw,
                    "suggestions": [],
                    "reasoning": "Could not parse LLM output as JSON; returning raw text.",
                }
                return json.dumps(fallback, ensure_ascii=False, indent=2)

    except ValueError as exc:
        return json.dumps(
            {"error": str(exc), "enhanced_prompt": prompt, "suggestions": [], "reasoning": ""},
            ensure_ascii=False,
            indent=2,
        )
    except Exception as exc:
        return json.dumps(
            {
                "error": f"Unexpected failure: {exc}",
                "enhanced_prompt": prompt,
                "suggestions": [],
                "reasoning": "",
            },
            ensure_ascii=False,
            indent=2,
        )
