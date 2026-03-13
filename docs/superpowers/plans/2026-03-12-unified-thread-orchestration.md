# Unified Thread Orchestration — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve Koro Studio from isolated single-agent chats to a unified thread with @mention agent switching, shared RAG context, execution tracing, and a debug observability page.

**Architecture:** Single-pass LangGraph supervisor graph (`START → supervisor → agent → END`). The supervisor node handles routing and context setup. The production streaming path (`stream_agent()`) manages context accumulation, system prompt construction, trace recording, and SSE trace events directly — this is the same pattern as today, extended with shared context and trace metadata. The graph nodes serve as the structural contract and non-streaming fallback.

**Tech Stack:** LangGraph 0.2.70+, Anthropic Vertex (Claude Sonnet 4), Qdrant, FastAPI SSE, React 19, Vite 8

**Spec:** `docs/superpowers/specs/2026-03-12-unified-thread-orchestration-design.md`

---

## File Structure

### Backend (`/Users/heitormiranda/projects/koro/videorag-api/`)

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `models/schemas.py` | Add `trace` field with `operator.add` reducer to `AgentState` |
| Modify | `services/qdrant_service.py` | Return `[{"text", "score"}]` from `search_chunks()` |
| Modify | `services/agent_service.py` | Supervisor graph, shared context, trace, thread index |
| Modify | `routers/agent.py` | Pass through pre-formatted JSON from `stream_agent()` |
| Create | `routers/debug.py` | Debug API: threads list, thread detail, status |
| Modify | `app.py` | Include debug router + update `search_chunks()` callers |
| Modify | `tests/test_qdrant_service.py` | Update for new `search_chunks()` return type |
| Modify | `tests/test_agent_service.py` | Add context sharing, merge, system prompt tests |
| Create | `tests/test_debug_router.py` | Tests for debug API endpoints |

### Frontend (`/Users/heitormiranda/projects/koro/koro-studio/src/`)

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `config.js` | Add `color` to agents, remove `system` field |
| Modify | `App.jsx` | Remove agent sidebar, add Debug nav, remove `agent` prop |
| Modify | `views/ChatView.jsx` | Remove `agent` prop, add chips, @mention, badges, trace cards |
| Modify | `views/ChatView.css` | Styles for chips, badges, execution cards |
| Create | `views/DebugView.jsx` | 3-panel debug page |
| Create | `views/DebugView.css` | Debug page styles |

---

## Chunk 1: Backend Data Layer

### Task 1: Extend `search_chunks()` to return scores + update all callers

**Files:**
- Modify: `services/qdrant_service.py:96-125`
- Modify: `app.py:328,347` (other callers)
- Test: `tests/test_qdrant_service.py`

- [ ] **Step 1: Update test for new return type**

In `tests/test_qdrant_service.py`, update `test_search_chunks_filters_by_client_id`:

```python
# Add .score to mock hits (after lines 90-93):
hit1 = MagicMock()
hit1.payload = {"client_id": "client_a", "text": "chunk texto 1"}
hit1.score = 0.95
hit2 = MagicMock()
hit2.payload = {"client_id": "client_a", "text": "chunk texto 2"}
hit2.score = 0.87

# Update assertion (replace line 106):
assert results == [
    {"text": "chunk texto 1", "score": 0.95},
    {"text": "chunk texto 2", "score": 0.87},
]
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/heitormiranda/projects/koro/videorag-api
python -m pytest tests/test_qdrant_service.py::test_search_chunks_filters_by_client_id -v
```

Expected: FAIL — returns `list[str]` but test expects `list[dict]`

- [ ] **Step 3: Update `search_chunks()` implementation**

In `services/qdrant_service.py`, replace line 125:

```python
# Old:
return [text for hit in results if (text := hit.payload.get("text")) is not None]

# New:
return [
    {"text": text, "score": hit.score}
    for hit in results
    if (text := hit.payload.get("text")) is not None
]
```

- [ ] **Step 4: Update `test_client_isolation` for new return type**

```python
# Add .score to mocks:
hit_a = MagicMock()
hit_a.payload = {"client_id": "client_a", "text": "dado do cliente A"}
hit_a.score = 0.92

# Update assertion (line 152):
assert results_a == [{"text": "dado do cliente A", "score": 0.92}]

# Same for hit_b:
hit_b = MagicMock()
hit_b.payload = {"client_id": "client_b", "text": "dado do cliente B"}
hit_b.score = 0.88

# Update assertion (line 170):
assert results_b == [{"text": "dado do cliente B", "score": 0.88}]
```

- [ ] **Step 5: Update callers in `app.py`**

Two endpoints in `app.py` call `search_chunks()` and expect `list[str]`. Update them to extract text:

At line 328 (`POST /query`):
```python
# Old:
analysis_texts = qdrant_service.search_chunks(client_id, request.question)
# ...
context = "\n\n---\n\n".join(analysis_texts)

# New:
results = qdrant_service.search_chunks(client_id, request.question)
if not results:
    return {"answer": "[MOCK] Nenhuma análise encontrada para este cliente.", "sources": [], "client_id": client_id}
context = "\n\n---\n\n".join(r["text"] for r in results)
```

At line 347 (`GET /query/stream`):
```python
# Old:
analysis_texts = qdrant_service.search_chunks(client_id, question)
if not analysis_texts:
    answer = _mock_query(question)
else:
    context = "\n\n---\n\n".join(analysis_texts)

# New:
results = qdrant_service.search_chunks(client_id, question)
if not results:
    answer = _mock_query(question)
else:
    context = "\n\n---\n\n".join(r["text"] for r in results)
```

- [ ] **Step 6: Run all tests**

```bash
cd /Users/heitormiranda/projects/koro/videorag-api
python -m pytest tests/ -v
```

Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
cd /Users/heitormiranda/projects/koro/videorag-api
git add services/qdrant_service.py tests/test_qdrant_service.py app.py
git commit -m "feat(qdrant): return scores alongside text from search_chunks()"
```

---

### Task 2: Expand `AgentState` with `trace` field

**Files:**
- Modify: `models/schemas.py`
- Test: `tests/test_agent_service.py`

- [ ] **Step 1: Write test for trace field**

Add to `tests/test_agent_service.py`:

```python
class TestAgentState:
    """Verifica o AgentState TypedDict."""

    def test_trace_field_exists(self):
        from models.schemas import AgentState
        import typing
        hints = typing.get_type_hints(AgentState, include_extras=True)
        assert "trace" in hints

    def test_trace_has_add_reducer(self):
        """trace deve usar operator.add como reducer."""
        from models.schemas import AgentState
        import typing
        hints = typing.get_type_hints(AgentState, include_extras=True)
        trace_hint = hints["trace"]
        assert hasattr(trace_hint, "__metadata__"), "trace deve ser Annotated"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/heitormiranda/projects/koro/videorag-api
python -m pytest tests/test_agent_service.py::TestAgentState -v
```

Expected: FAIL — `trace` not in AgentState

- [ ] **Step 3: Add `trace` field to `AgentState`**

In `models/schemas.py`:

```python
# Add import at top:
import operator

# Update AgentState:
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    client_id: str
    agent_id: str
    context: list[str]
    trace: Annotated[list[dict], operator.add]
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/heitormiranda/projects/koro/videorag-api
python -m pytest tests/test_agent_service.py -v
```

Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/heitormiranda/projects/koro/videorag-api
git add models/schemas.py tests/test_agent_service.py
git commit -m "feat(schema): add trace field with operator.add reducer to AgentState"
```

---

## Chunk 2: Backend Orchestration

### Task 3: Rewrite graph + stream_agent with supervisor pattern

The graph uses a supervisor node for routing. However, `stream_agent()` remains the production execution path (bypasses graph invocation, manages its own Anthropic streaming and checkpoint writes) — this is the same pattern as today. The supervisor + agent nodes exist for the structural contract and `ainvoke()` fallback.

**Files:**
- Modify: `services/agent_service.py`
- Test: `tests/test_agent_service.py`

- [ ] **Step 1: Write tests for helper functions**

Add to `tests/test_agent_service.py`:

```python
class TestBuildSystemPrompt:
    """Verifica construção de system prompt com contexto compartilhado."""

    def test_all_agents_receive_context(self):
        from services.agent_service import AGENT_PROMPTS, _build_system_prompt
        context = ["chunk sobre vídeo de crédito imobiliário"]
        for agent_id in AGENT_PROMPTS:
            prompt = _build_system_prompt(agent_id, context)
            assert "CONTEXTO DOS VÍDEOS INDEXADOS" in prompt
            assert "crédito imobiliário" in prompt

    def test_no_context_returns_base_prompt(self):
        from services.agent_service import AGENT_PROMPTS, _build_system_prompt
        prompt = _build_system_prompt("videorag", [])
        assert prompt == AGENT_PROMPTS["videorag"]
        assert "CONTEXTO" not in prompt


class TestMergeContext:
    """Verifica merge de contexto com FIFO cap."""

    def test_appends_new_chunks(self):
        from services.agent_service import _merge_context
        assert _merge_context(["a", "b"], ["c"]) == ["a", "b", "c"]

    def test_fifo_cap_at_20(self):
        from services.agent_service import _merge_context
        existing = [f"old_{i}" for i in range(18)]
        new = [f"new_{i}" for i in range(5)]
        result = _merge_context(existing, new)
        assert len(result) == 20
        assert result[0] == "old_3"  # oldest evicted
        assert result[-1] == "new_4"

    def test_empty_existing(self):
        from services.agent_service import _merge_context
        assert _merge_context([], ["a", "b"]) == ["a", "b"]

    def test_empty_new(self):
        from services.agent_service import _merge_context
        assert _merge_context(["a"], []) == ["a"]
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/heitormiranda/projects/koro/videorag-api
python -m pytest tests/test_agent_service.py::TestBuildSystemPrompt tests/test_agent_service.py::TestMergeContext -v
```

Expected: FAIL — functions not defined

- [ ] **Step 3: Implement helper functions**

Add to `services/agent_service.py` after `AGENT_PROMPTS` dict:

```python
MAX_CONTEXT_CHUNKS = 20


def _build_system_prompt(agent_id: str, context: list[str]) -> str:
    """Build system prompt: base prompt + accumulated RAG context for ALL agents."""
    base = AGENT_PROMPTS.get(agent_id, "")
    if not context:
        return base
    context_block = "\n\n---\n\n".join(context)
    return f"{base}\n\nCONTEXTO DOS VÍDEOS INDEXADOS:\n{context_block}"


def _merge_context(existing: list[str], new_chunks: list[str]) -> list[str]:
    """Merge new RAG chunks into existing context with FIFO cap at 20."""
    merged = existing + new_chunks
    return merged[-MAX_CONTEXT_CHUNKS:]
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/heitormiranda/projects/koro/videorag-api
python -m pytest tests/test_agent_service.py::TestBuildSystemPrompt tests/test_agent_service.py::TestMergeContext -v
```

Expected: ALL PASS

- [ ] **Step 5: Rewrite `_build_graph()` with supervisor**

Replace `_build_graph` in `services/agent_service.py`:

```python
def _build_graph(checkpointer):
    builder = StateGraph(AgentState)

    def supervisor_node(state: AgentState) -> dict:
        """Routing + context setup. Lightweight — heavy lifting is in stream_agent()."""
        # agent_id is pre-set in state by the caller; we only read it for routing
        agent_id = state.get("agent_id", "videorag")
        existing_context = state.get("context") or []

        # RAG injection for videorag (non-streaming path only)
        new_chunks = []
        if agent_id == "videorag" and _qdrant_svc:
            msgs = state.get("messages", [])
            if msgs:
                last_msg = msgs[-1].content if hasattr(msgs[-1], "content") else str(msgs[-1])
                try:
                    results = _qdrant_svc.search_chunks(state.get("client_id", ""), last_msg)
                    new_chunks = [r["text"] for r in results]
                except Exception as exc:
                    logger.warning("Qdrant search falhou (%s)", exc)

        merged = _merge_context(existing_context, new_chunks)
        return {"context": merged}

    async def agent_node(state: AgentState) -> dict:
        """Generic agent node (non-streaming fallback path)."""
        agent_id = state["agent_id"]
        context = state.get("context") or []
        system = _build_system_prompt(agent_id, context)
        messages = _langchain_to_anthropic(state["messages"])

        try:
            response = await _anthropic_client.messages.create(
                model=ANTHROPIC_MODEL, max_tokens=2000, system=system, messages=messages,
            )
            return {"messages": [AIMessage(content=response.content[0].text)]}
        except Exception as exc:
            return {"messages": [AIMessage(content=f"[ERRO] {exc}")]}

    builder.add_node("supervisor", supervisor_node)
    for aid in AGENT_PROMPTS:
        builder.add_node(aid, agent_node)

    builder.add_edge(START, "supervisor")
    builder.add_conditional_edges(
        "supervisor", lambda state: state["agent_id"],
        {aid: aid for aid in AGENT_PROMPTS},
    )
    for aid in AGENT_PROMPTS:
        builder.add_edge(aid, END)

    return builder.compile(checkpointer=checkpointer)
```

- [ ] **Step 6: Add thread index + rewrite `stream_agent()`**

Add module-level state:
```python
_thread_index: dict[str, dict] = {}
```

Replace `stream_agent`:

```python
async def stream_agent(request: AgentChatRequest) -> AsyncIterator[str]:
    """Yield JSON chunks including trace events. Production streaming path."""
    import time
    import json
    from datetime import datetime, timezone

    if not _anthropic_client or not _graph:
        yield json.dumps({"type": "trace_error", "error": "AgentService não inicializado"})
        return

    config = {"configurable": {"thread_id": request.thread_id}}
    started_at = datetime.now(timezone.utc).isoformat()

    # 1. Retrieve existing state from checkpoint
    try:
        snapshot = await _graph.aget_state(config)
        vals = snapshot.values or {}
        existing_messages = vals.get("messages", [])
        existing_context = vals.get("context", [])
    except Exception:
        existing_messages = []
        existing_context = []

    # 2. Qdrant search for VideoRAG
    new_chunks: list[str] = []
    qdrant_hits = 0
    qdrant_scores: list[float] = []

    if request.agent_id == "videorag" and _qdrant_svc:
        try:
            results = _qdrant_svc.search_chunks(request.client_id, request.message)
            new_chunks = [r["text"] for r in results]
            qdrant_scores = [r["score"] for r in results]
            qdrant_hits = len(results)
        except Exception as exc:
            logger.warning("Qdrant search falhou (%s)", exc)

    merged_context = _merge_context(existing_context, new_chunks)

    # 3. Build system prompt (ALL agents get context)
    system = _build_system_prompt(request.agent_id, merged_context)

    # 4. Emit trace_start
    yield json.dumps({
        "type": "trace_start",
        "agent_id": request.agent_id,
        "qdrant_hits": qdrant_hits,
        "context_chunks": len(merged_context),
    })

    # 5. Build messages
    api_messages = _langchain_to_anthropic(existing_messages)
    api_messages.append({"role": "user", "content": request.message})

    # 6. Stream
    full_text = ""
    tokens_in = 0
    tokens_out = 0
    start = time.monotonic()

    try:
        async with _anthropic_client.messages.stream(
            model=ANTHROPIC_MODEL, max_tokens=2000, system=system, messages=api_messages,
        ) as stream:
            async for text in stream.text_stream:
                full_text += text
                yield json.dumps({"text": text})
            final = await stream.get_final_message()
            tokens_in = final.usage.input_tokens
            tokens_out = final.usage.output_tokens
    except Exception as exc:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        logger.error("Streaming falhou para %s: %s", request.agent_id, exc)
        yield json.dumps({"type": "trace_error", "error": str(exc), "duration_ms": elapsed_ms})
        # Persist error
        trace_entry = {
            "agent_id": request.agent_id, "started_at": started_at,
            "ended_at": datetime.now(timezone.utc).isoformat(),
            "tokens_in": 0, "tokens_out": 0,
            "qdrant_hits": qdrant_hits, "qdrant_scores": qdrant_scores,
            "context_chunks": len(merged_context), "duration_ms": elapsed_ms,
            "error": str(exc),
        }
        try:
            await _graph.aupdate_state(config, {
                "messages": [HumanMessage(content=request.message), AIMessage(content=f"[ERRO] {exc}")],
                "client_id": request.client_id, "agent_id": request.agent_id,
                "context": merged_context, "trace": [trace_entry],
            }, as_node=request.agent_id)
        except Exception:
            pass
        return

    elapsed_ms = int((time.monotonic() - start) * 1000)

    # 7. Emit trace_end
    yield json.dumps({
        "type": "trace_end",
        "tokens_in": tokens_in, "tokens_out": tokens_out, "duration_ms": elapsed_ms,
    })

    # 8. Persist state + trace (single complete entry)
    trace_entry = {
        "agent_id": request.agent_id, "started_at": started_at,
        "ended_at": datetime.now(timezone.utc).isoformat(),
        "tokens_in": tokens_in, "tokens_out": tokens_out,
        "qdrant_hits": qdrant_hits, "qdrant_scores": qdrant_scores,
        "context_chunks": len(merged_context), "duration_ms": elapsed_ms,
        "error": None,
    }
    await _graph.aupdate_state(config, {
        "messages": [HumanMessage(content=request.message), AIMessage(content=full_text)],
        "client_id": request.client_id, "agent_id": request.agent_id,
        "context": merged_context, "trace": [trace_entry],
    }, as_node=request.agent_id)

    # 9. Update thread index
    if request.thread_id not in _thread_index:
        _thread_index[request.thread_id] = {
            "thread_id": request.thread_id, "client_id": request.client_id,
            "agents_used": [], "turn_count": 0, "last_active": "",  # list not set (JSON-serializable; spec says set but set isn't serializable)
        }
    idx = _thread_index[request.thread_id]
    if request.agent_id not in idx["agents_used"]:
        idx["agents_used"].append(request.agent_id)
    idx["turn_count"] += 1
    idx["last_active"] = datetime.now(timezone.utc).isoformat()
```

- [ ] **Step 7: Run all tests**

```bash
cd /Users/heitormiranda/projects/koro/videorag-api
python -m pytest tests/ -v
```

Expected: ALL PASS

- [ ] **Step 8: Commit**

```bash
cd /Users/heitormiranda/projects/koro/videorag-api
git add services/agent_service.py tests/test_agent_service.py
git commit -m "feat(agent): supervisor graph, shared context, trace events, thread index"
```

---

### Task 4: Update SSE router

**Files:**
- Modify: `routers/agent.py`

- [ ] **Step 1: Update the SSE generator**

`stream_agent()` now yields pre-formatted JSON strings. Remove the `json.dumps({'text': chunk})` wrapper.

Replace `routers/agent.py` entirely:

```python
"""routers/agent.py — SSE endpoint for LangGraph multi-agent chat."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import AgentChatRequest
from services import agent_service

router = APIRouter()


@router.post("/agent/chat")
async def agent_chat(request: AgentChatRequest):
    if agent_service._graph is None:
        raise HTTPException(status_code=503, detail="AgentService não disponível")

    async def generate():
        async for chunk in agent_service.stream_agent(request):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
```

- [ ] **Step 2: Commit**

```bash
cd /Users/heitormiranda/projects/koro/videorag-api
git add routers/agent.py
git commit -m "refactor(router): pass through pre-formatted JSON from stream_agent()"
```

---

### Task 5: Create debug router with tests

**Files:**
- Create: `routers/debug.py`
- Create: `tests/test_debug_router.py`
- Modify: `app.py`

- [ ] **Step 1: Create `routers/debug.py`**

```python
"""routers/debug.py — Debug/observability endpoints for thread inspection."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from services import agent_service

router = APIRouter(prefix="/debug", tags=["debug"])


@router.get("/status")
async def debug_status():
    checkpointer_type = "memory"
    if agent_service._checkpointer_cm is not None:
        checkpointer_type = "postgres"
    return {"checkpointer": checkpointer_type}


@router.get("/threads")
async def debug_threads(client_id: str = Query(...)):
    threads = [
        meta for meta in agent_service._thread_index.values()
        if meta["client_id"] == client_id
    ]
    threads.sort(key=lambda t: t.get("last_active", ""), reverse=True)
    return threads


@router.get("/thread/{thread_id:path}")
async def debug_thread(thread_id: str):
    if agent_service._graph is None:
        raise HTTPException(503, "AgentService não disponível")

    config = {"configurable": {"thread_id": thread_id}}
    try:
        snapshot = await agent_service._graph.aget_state(config)
        values = snapshot.values or {}
    except Exception as exc:
        raise HTTPException(404, f"Thread não encontrada: {exc}")

    trace = values.get("trace", [])
    agents_used = list({e["agent_id"] for e in trace if "agent_id" in e})
    total_tokens_in = sum(e.get("tokens_in", 0) for e in trace)
    total_tokens_out = sum(e.get("tokens_out", 0) for e in trace)
    total_duration_ms = sum(e.get("duration_ms", 0) for e in trace)
    all_scores = [s for e in trace for s in e.get("qdrant_scores", [])]
    qdrant_chunks = sum(e.get("qdrant_hits", 0) for e in trace)
    avg_score = round(sum(all_scores) / len(all_scores), 2) if all_scores else 0

    return {
        "thread_id": thread_id,
        "trace": trace,
        "agents_used": agents_used,
        "total_tokens_in": total_tokens_in,
        "total_tokens_out": total_tokens_out,
        "total_duration_ms": total_duration_ms,
        "qdrant_chunks": qdrant_chunks,
        "avg_qdrant_score": avg_score,
    }
```

- [ ] **Step 2: Write tests for debug endpoints**

Create `tests/test_debug_router.py`:

```python
"""Tests for routers/debug.py"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
import pytest


class TestDebugStatus:
    def test_returns_memory_when_no_postgres(self):
        from routers.debug import debug_status
        import asyncio
        with patch("services.agent_service._checkpointer_cm", None):
            result = asyncio.get_event_loop().run_until_complete(debug_status())
        assert result == {"checkpointer": "memory"}

    def test_returns_postgres_when_cm_exists(self):
        from routers.debug import debug_status
        import asyncio
        with patch("services.agent_service._checkpointer_cm", MagicMock()):
            result = asyncio.get_event_loop().run_until_complete(debug_status())
        assert result == {"checkpointer": "postgres"}


class TestDebugThreads:
    def test_filters_by_client_id(self):
        from routers.debug import debug_threads
        import asyncio
        fake_index = {
            "sant:1": {"thread_id": "sant:1", "client_id": "santander", "agents_used": ["videorag"], "turn_count": 2, "last_active": "2026-03-12T21:00:00Z"},
            "vivo:1": {"thread_id": "vivo:1", "client_id": "vivo", "agents_used": ["copy"], "turn_count": 1, "last_active": "2026-03-12T20:00:00Z"},
        }
        with patch("services.agent_service._thread_index", fake_index):
            result = asyncio.get_event_loop().run_until_complete(debug_threads(client_id="santander"))
        assert len(result) == 1
        assert result[0]["thread_id"] == "sant:1"

    def test_returns_empty_for_unknown_client(self):
        from routers.debug import debug_threads
        import asyncio
        with patch("services.agent_service._thread_index", {}):
            result = asyncio.get_event_loop().run_until_complete(debug_threads(client_id="unknown"))
        assert result == []
```

- [ ] **Step 3: Run debug tests**

```bash
cd /Users/heitormiranda/projects/koro/videorag-api
python -m pytest tests/test_debug_router.py -v
```

Expected: ALL PASS

- [ ] **Step 4: Register router in `app.py`**

Add after existing `app.include_router(agent_router, prefix="")`:

```python
from routers.debug import router as debug_router
app.include_router(debug_router, prefix="")
```

- [ ] **Step 5: Run full test suite**

```bash
cd /Users/heitormiranda/projects/koro/videorag-api
python -m pytest tests/ -v
```

Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
cd /Users/heitormiranda/projects/koro/videorag-api
git add routers/debug.py tests/test_debug_router.py app.py
git commit -m "feat(debug): add debug API endpoints with tests"
```

---

## Chunk 3: Frontend

### Task 6: Update config.js — add colors, remove system prompts

**Files:**
- Modify: `src/config.js`

- [ ] **Step 1: Add `color` and remove `system` from each agent**

Update the `AGENTS` array in `config.js`. Remove the `system` property (now server-side only). Add a `color` property:

```js
export const AGENTS = [
  {
    id: "videorag",
    label: "VideoRAG",
    iconName: "Play",
    color: "#3b82f6",
    placeholder: "Pergunte sobre os vídeos indexados...",
    hint: "Análise de campanhas em vídeo",
  },
  {
    id: "copy",
    label: "Copy",
    iconName: "PenTool",
    color: "#f59e0b",
    placeholder: "Descreva o produto, tom e canal...",
    hint: "Geração de textos publicitários",
  },
  {
    id: "persona",
    label: "Persona",
    iconName: "UserRound",
    color: "#8b5cf6",
    placeholder: "Descreva a persona ou solicite uma simulação...",
    hint: "Simulação de consumidor sintético",
  },
  {
    id: "roteiro",
    label: "Roteiro",
    iconName: "Clapperboard",
    color: "#22c55e",
    placeholder: "Descreva o conceito, produto e duração...",
    hint: "Roteiros e filmes publicitários",
  },
  {
    id: "brief",
    label: "Brief",
    iconName: "FileSearch",
    color: "#ec4899",
    placeholder: "Cole ou descreva o brief aqui...",
    hint: "Análise e estruturação de briefs",
  },
];
```

- [ ] **Step 2: Commit**

```bash
cd /Users/heitormiranda/projects/koro/koro-studio
git add src/config.js
git commit -m "refactor(config): add agent colors, remove server-side system prompts"
```

---

### Task 7: Refactor App.jsx — remove agent sidebar, add Debug

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Update imports**

Replace the current import block:

```jsx
import { useState, useEffect } from "react";
import {
  Upload,
  Menu,
  X,
  MessageSquare,
  Activity,
} from "lucide-react";
import { API_BASE, CLIENTS } from "./config";
import ChatView from "./views/ChatView";
import IngestView from "./views/IngestView";
import DebugView from "./views/DebugView";
import "./App.css";
```

Remove: `Play, PenTool, UserRound, Clapperboard, FileSearch` imports, `AGENTS` import.
Remove: `ICON_MAP` const and `getAgentIcon` function.
Add: `MessageSquare, Activity` icons, `DebugView` import.

- [ ] **Step 2: Remove agent state, simplify component**

Remove `const [agent, setAgent] = useState(AGENTS[0])` state.
Remove `const AgentIcon = getAgentIcon(agent)`.

- [ ] **Step 3: Replace sidebar agents nav with Chat + Debug buttons**

Replace the `<nav className="sidebar-agents">` block (lines 79-98) with:

```jsx
<nav className="sidebar-nav" aria-label="Navegação">
  <div className="sidebar-section-label">Navegação</div>
  <button
    className="agent-btn"
    data-active={view === "chat"}
    onClick={() => { setView("chat"); setSidebarOpen(false); }}
    aria-current={view === "chat" ? "page" : undefined}
  >
    <span className="agent-btn-icon" aria-hidden="true"><MessageSquare size={16} /></span>
    <span className="agent-btn-label">Chat</span>
  </button>
</nav>
```

In the `sidebar-ingest` section (Ferramentas), add a Debug button after Ingestão:

```jsx
<button
  className="agent-btn"
  data-active={view === "debug"}
  onClick={() => { setView("debug"); setSidebarOpen(false); }}
  aria-current={view === "debug" ? "page" : undefined}
  aria-label="Debug"
>
  <span className="agent-btn-icon" aria-hidden="true"><Activity size={16} /></span>
  <span className="agent-btn-label">Debug</span>
</button>
```

- [ ] **Step 4: Update main content rendering**

Replace the `<main>` block:

```jsx
<main className="main">
  {view === "chat" && <ChatView clientId={clientId} />}
  {view === "ingest" && <IngestView clientId={clientId} />}
  {view === "debug" && <DebugView clientId={clientId} />}
</main>
```

Note: `ChatView` no longer receives `agent` or `AgentIcon` props.

- [ ] **Step 5: Create placeholder DebugView**

Create `src/views/DebugView.jsx` with a minimal placeholder (full implementation in Task 9):

```jsx
export default function DebugView({ clientId }) {
  return <div style={{ padding: 40, color: '#94a3b8' }}>Debug — {clientId} (em construção)</div>
}
```

- [ ] **Step 6: Verify app compiles**

```bash
cd /Users/heitormiranda/projects/koro/koro-studio
npm run build
```

Expected: Build succeeds (no prop type errors since JSX has no TypeScript)

- [ ] **Step 7: Commit**

```bash
cd /Users/heitormiranda/projects/koro/koro-studio
git add src/App.jsx src/views/DebugView.jsx
git commit -m "refactor(sidebar): remove agent buttons, add Chat and Debug nav"
```

---

### Task 8: Refactor ChatView — remove agent prop, add unified thread

This is the largest frontend task. `ChatView` currently receives `agent` as a prop and uses `agent.id`, `agent.hint`, `agent.placeholder` throughout. We replace this with internal state driven by @mention selection.

**Files:**
- Modify: `src/views/ChatView.jsx`
- Modify: `src/views/ChatView.css`

- [ ] **Step 1: Update ChatView signature and internal state**

Change the component signature and add new state:

```jsx
// Old:
export default function ChatView({ agent, clientId, AgentIcon }) {

// New:
export default function ChatView({ clientId }) {
```

Add new state at top of component:

```jsx
import { AGENTS, API_BASE, FALLBACKS } from "../config";

// Inside component:
const [lastAgent, setLastAgent] = useState("videorag")
const [traceInfo, setTraceInfo] = useState(null)

// Derived values:
const currentAgent = AGENTS.find(a => a.id === lastAgent) || AGENTS[0]
const isVideoRAG = lastAgent === "videorag"
```

- [ ] **Step 2: Update agent-dependent code**

Replace all `agent.id` with `lastAgent`, `agent.hint` with `currentAgent.hint`, `agent.placeholder` with `currentAgent.placeholder`:

In the greeting effect:
```jsx
useEffect(() => {
  setMessages([
    { id: 0, role: "system-greeting", agent: lastAgent, content: currentAgent.hint },
  ]);
  setThreadId(`${clientId}:user-${Date.now()}`);
  setPendingFiles([]);
  inputRef.current?.focus();
}, [clientId]); // Remove agent dependency — only reset on client change
```

In `sendAgentChat` — this function is called by both the normal `send()` path and the upload flow. Add @mention parsing at the top and replace all `agent.id` references with `agentId`:

```jsx
async function sendAgentChat(text) {
  // Parse @mention
  const mentionMatch = text.match(/^@(videorag|copy|persona|roteiro|brief)\s/i);
  let agentId = lastAgent;
  let cleanText = text;
  if (mentionMatch) {
    agentId = mentionMatch[1].toLowerCase();
    cleanText = text.slice(mentionMatch[0].length);
    setLastAgent(agentId);
  }

  setLoading(true);
  setTraceInfo(null); // Clear stale trace card

  // ... (existing message setup) ...

  body: JSON.stringify({
    thread_id: threadId, client_id: clientId,
    agent_id: agentId, message: cleanText,
  })

  // Fallback:
  FALLBACKS[agentId] || "Erro ao conectar."
```

Store `agentId` on assistant messages:
```jsx
const asstMsg = { id: asstId, role: "assistant", content: "", streaming: true, agentId };
```

**Also update the upload flow caller** (around line 212 in current code) — no changes needed since it calls `sendAgentChat(text)` which now handles `agentId` internally via `lastAgent`.

In `resetChat`:
```jsx
setMessages([
  { id: 0, role: "system-greeting", agent: lastAgent, content: currentAgent.hint },
]);
```

Update textarea placeholder:
```jsx
placeholder={currentAgent.placeholder}
```

- [ ] **Step 3: Update `readSSEStream` for trace events**

Replace the SSE parser to handle `trace_start`, `trace_end`, `trace_error`:

```jsx
const readSSEStream = async (res, asstId) => {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value).split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const d = line.slice(6);
      if (d === "[DONE]") break;
      try {
        const p = JSON.parse(d);
        if (p.type === "trace_start") {
          setTraceInfo({
            agentId: p.agent_id, qdrantHits: p.qdrant_hits,
            contextChunks: p.context_chunks, startTime: Date.now(), status: "streaming",
          });
        } else if (p.type === "trace_end") {
          setTraceInfo(prev => prev ? {
            ...prev, status: "done",
            tokensIn: p.tokens_in, tokensOut: p.tokens_out, durationMs: p.duration_ms,
          } : null);
        } else if (p.type === "trace_error") {
          setTraceInfo(prev => prev ? {
            ...prev, status: "error", error: p.error, durationMs: p.duration_ms,
          } : null);
        } else if (p.text) {
          full += p.text;
          const snap = full;
          setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: snap } : m));
        }
      } catch { /* ignore parse errors */ }
    }
  }
  setMessages(p => p.map(m => m.id === asstId ? { ...m, streaming: false } : m));
};
```

Call as: `await readSSEStream(res, asstId);` (agent_id comes from the SSE `trace_start` event)

- [ ] **Step 4: Add agent chips below textarea**

Add chip row after the textarea wrapper:

```jsx
<div className="agent-chips">
  {AGENTS.map(a => {
    const mentionActive = input.toLowerCase().startsWith(`@${a.id} `);
    const isDefault = !input.match(/^@\w/) && lastAgent === a.id;
    return (
      <button
        key={a.id}
        className={`agent-chip ${mentionActive || isDefault ? 'active' : ''}`}
        style={{ '--agent-color': a.color }}
        onClick={() => {
          const cleaned = input.replace(/^@\w+\s*/i, '');
          setInput(`@${a.id} ${cleaned}`);
          inputRef.current?.focus();
        }}
      >
        {a.label}
      </button>
    );
  })}
</div>
```

- [ ] **Step 5: Add agent badge on assistant messages**

In the message rendering JSX, add a badge for assistant messages:

```jsx
{msg.role === "assistant" && msg.agentId && (
  <span
    className="agent-badge"
    style={{ '--agent-color': AGENTS.find(a => a.id === msg.agentId)?.color || '#888' }}
  >
    {AGENTS.find(a => a.id === msg.agentId)?.label || msg.agentId}
  </span>
)}
```

- [ ] **Step 6: Add execution card**

After the last assistant message (or as part of the streaming message), render the trace info:

```jsx
{traceInfo && (
  <div className={`execution-card ${traceInfo.status}`}>
    <span className="execution-agent">
      {AGENTS.find(a => a.id === traceInfo.agentId)?.label || traceInfo.agentId}
    </span>
    {traceInfo.status === "streaming" && (
      <span className="execution-status">gerando resposta...</span>
    )}
    {traceInfo.status === "done" && (
      <>
        <span className="execution-duration">{(traceInfo.durationMs / 1000).toFixed(1)}s</span>
        <span className="execution-tokens">{traceInfo.tokensIn + traceInfo.tokensOut} tokens</span>
        {traceInfo.contextChunks > 0 && (
          <span className="execution-context">{traceInfo.contextChunks} chunks</span>
        )}
      </>
    )}
    {traceInfo.status === "error" && (
      <span className="execution-error">{traceInfo.error}</span>
    )}
  </div>
)}
```

- [ ] **Step 7: Add CSS for chips, badges, execution cards**

Append to `src/views/ChatView.css`:

```css
/* Agent chips */
.agent-chips { display: flex; gap: 6px; padding: 8px 0 0; flex-wrap: wrap; }
.agent-chip {
  font-size: 12px; padding: 4px 12px; border-radius: 16px;
  border: 1px solid var(--agent-color, #555); background: transparent;
  color: var(--agent-color, #aaa); cursor: pointer; transition: all 0.15s;
}
.agent-chip:hover, .agent-chip.active {
  background: color-mix(in srgb, var(--agent-color) 15%, transparent);
  border-color: var(--agent-color);
}

/* Agent badge */
.agent-badge {
  font-size: 10px; padding: 2px 8px; border-radius: 4px;
  background: color-mix(in srgb, var(--agent-color) 15%, transparent);
  color: var(--agent-color); font-weight: 500; margin-bottom: 4px; display: inline-block;
}

/* Execution card */
.execution-card {
  display: flex; align-items: center; gap: 12px; font-size: 11px;
  padding: 6px 12px; border-radius: 6px; background: #1e1e2e;
  border: 1px solid #2a2a3e; color: #94a3b8; margin-top: 4px;
}
.execution-card.streaming { border-color: #f59e0b40; }
.execution-card.done { border-color: #22c55e40; }
.execution-card.error { border-color: #ef444440; }
.execution-agent { font-weight: 600; color: #e2e8f0; }
.execution-status { color: #f59e0b; }
.execution-duration { font-family: monospace; }
.execution-tokens { color: #64748b; }
.execution-context { color: #3b82f6; }
.execution-error { color: #ef4444; }
```

- [ ] **Step 8: Verify in browser**

```bash
cd /Users/heitormiranda/projects/koro/koro-studio
npm run dev
```

Test:
1. App loads without errors
2. Agent chips appear below textarea
3. Clicking a chip inserts `@agentname ` prefix
4. Active chip highlights correctly
5. Sending `@copy crie variações` shows Copy badge on response
6. Execution card shows during/after streaming
7. Sending without @mention uses last agent

- [ ] **Step 9: Commit**

```bash
cd /Users/heitormiranda/projects/koro/koro-studio
git add src/views/ChatView.jsx src/views/ChatView.css
git commit -m "feat(chat): unified thread with agent chips, @mention, badges, trace cards"
```

---

### Task 9: Implement DebugView

**Files:**
- Replace: `src/views/DebugView.jsx` (placeholder from Task 7)
- Create: `src/views/DebugView.css`

- [ ] **Step 1: Write full DebugView component**

Replace the placeholder `src/views/DebugView.jsx` with the full 3-panel implementation. The component:
- Fetches `/debug/threads?client_id=X` for thread list
- Fetches `/debug/status` for checkpointer type (shows banner if memory)
- Fetches `/debug/thread/{id}` for selected thread detail
- Renders: thread list (left), graph + timeline (center), metrics (right)

Use `AGENTS` from config for color mapping. See the spec's DebugView section for exact layout and data.

(Full JSX code: ~150 lines. See spec section "New View: DebugView" for data contracts. The component follows the same patterns as ChatView — `useState` + `useEffect` for data fetching, no external state management.)

- [ ] **Step 2: Write DebugView CSS**

Create `src/views/DebugView.css` with dark theme styles matching the existing app. 3-column flex layout with `#13131f` panel backgrounds, `#1e1e2e` card backgrounds, monospace fonts for metrics.

- [ ] **Step 3: Import CSS in DebugView**

```jsx
import './DebugView.css'
```

- [ ] **Step 4: Verify in browser**

Click Debug in sidebar → see 3-panel layout. Send some chat messages first, then verify threads appear in the debug list.

- [ ] **Step 5: Build check**

```bash
cd /Users/heitormiranda/projects/koro/koro-studio
npm run build
```

Expected: No errors

- [ ] **Step 6: Commit**

```bash
cd /Users/heitormiranda/projects/koro/koro-studio
git add src/views/DebugView.jsx src/views/DebugView.css
git commit -m "feat(debug): implement DebugView with graph, timeline, metrics panels"
```

---

## Chunk 4: Integration

### Task 10: End-to-end verification

- [ ] **Step 1: Run all backend tests**

```bash
cd /Users/heitormiranda/projects/koro/videorag-api
python -m pytest tests/ -v
```

Expected: ALL PASS

- [ ] **Step 2: Build frontend**

```bash
cd /Users/heitormiranda/projects/koro/koro-studio
npm run build
```

Expected: Build succeeds

- [ ] **Step 3: Manual E2E test**

Start backend (`uvicorn app:app --reload`) and frontend (`npm run dev`):

1. Sidebar shows Chat, Ingestão, Debug — no agent buttons
2. Type `@videorag quais vídeos temos?` → VideoRAG chip highlights → trace card → agent badge
3. Type `@copy crie 3 variações para Instagram` → Copy chip highlights → trace card shows context chunks from prior RAG
4. Type without @mention → uses last agent (Copy)
5. Click Debug → thread appears → select it → graph, timeline, metrics render correctly
6. Metrics show token counts, duration, qdrant chunks

- [ ] **Step 4: Final commit**

```bash
cd /Users/heitormiranda/projects/koro/koro-studio
git add -A
git commit -m "feat: unified thread orchestration — integration verified"
```
