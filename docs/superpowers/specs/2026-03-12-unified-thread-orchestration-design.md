# Unified Thread Orchestration — Design Spec

## Goal

Evolve Koro Studio from isolated single-agent chats to a unified thread where multiple agents collaborate in sequence, controlled by the user via `@mention` syntax, with full observability of the LangGraph execution graph.

## Context

**Current state:** The frontend has 5 agents (VideoRAG, Copy, Persona, Roteiro, Brief) accessible via sidebar buttons. Each agent runs in isolation — switching agents resets the conversation. The LangGraph graph is `START → router → agent → END` with no inter-agent communication.

**Target state:** A single conversation thread where the user invokes agents inline (`@copy create variations`). All agents share the thread's message history and accumulated RAG context. A supervisor node orchestrates routing, context injection, and execution tracing. A dedicated debug page visualizes the graph execution.

**Persistence:** The codebase already supports AlloyDB via `AsyncPostgresSaver` (activated when `ALLOYDB_URI` env var is set) with `MemorySaver` as fallback. Currently in production `ALLOYDB_URI` is not configured, so threads are ephemeral (lost on Cloud Run cold start/redeploy). Configuring AlloyDB is out of scope for this iteration, but the design is fully compatible — no additional work needed when the URI is set.

## Architecture: Supervisor Graph Pattern

### LangGraph State

```python
import operator

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]  # full thread history (auto-append reducer)
    client_id: str
    agent_id: str          # current agent (from request body)
    context: list[str]     # accumulated RAG chunks (managed by supervisor, max 20)
    trace: Annotated[list[dict], operator.add]  # execution log (append reducer)
```

**Reducer semantics:**
- `messages` uses LangGraph's built-in `add_messages` reducer (auto-append, dedup by ID).
- `trace` uses `operator.add` reducer — each node returns new entries, LangGraph appends them to the existing list automatically.
- `context` has **no reducer** — the supervisor node explicitly manages it: reads `state["context"]`, appends new RAG chunks, applies the 20-chunk FIFO cap, and returns the full merged list. This is intentional because context needs capping logic that a simple append reducer cannot provide.

Each entry in `trace`:
```python
{
    "agent_id": str,
    "started_at": str,       # ISO timestamp
    "ended_at": str,         # ISO timestamp  (None if agent errored)
    "tokens_in": int,
    "tokens_out": int,
    "qdrant_hits": int,      # 0 for non-RAG agents
    "qdrant_scores": list[float],  # relevance scores from Qdrant (empty for non-RAG)
    "context_chunks": int,   # total accumulated context chunks at this step
    "duration_ms": int,
    "error": str | None,     # error message if agent failed, None on success
}
```

### Graph Topology

Each HTTP request (`POST /agent/chat`) executes a single pass through the graph — one user message in, one agent response out. The graph does NOT loop or wait for user input mid-execution.

```
START → supervisor → {videorag | copy | persona | roteiro | brief} → END
```

Thread continuity comes from the checkpointer: each request reads prior state (messages, context, trace) from the checkpoint, processes one turn, and writes the updated state back. The "supervisor pattern" refers to the supervisor node orchestrating context and routing — not a multi-step loop within a single request.

### Supervisor Node (pure logic, no LLM)

The supervisor node executes on every turn:

1. **Read `agent_id` from state** — set by the API layer from the request body (`AgentChatRequest.agent_id`). The frontend resolves @mention → agent_id before sending the request (see Frontend § @mention parser). The supervisor does NOT parse messages. Default: `videorag` for first turn if absent.
2. **RAG context injection** — if the target agent is `videorag`, query Qdrant with the user message filtered by `client_id`. Merge new chunks with existing context and apply FIFO cap:
   ```python
   existing = state.get("context", [])
   new_chunks = [r["text"] for r in qdrant_results]
   merged = (existing + new_chunks)[-20:]  # keep most recent 20
   return {"context": merged, ...}
   ```
   For non-RAG agents, pass `state.context` unchanged (return `{"context": state.get("context", [])}`).
   Since `context` has no reducer annotation, the returned value replaces the previous one — hence the explicit merge.
3. **Build system prompt** — agent's base prompt + accumulated context. **All agents** receive context when it exists: the system prompt includes a `CONTEXTO DOS VÍDEOS INDEXADOS:` section with the accumulated RAG chunks. This allows non-RAG agents (Copy, Persona, Roteiro, Brief) to reference video knowledge gathered by VideoRAG in earlier turns.
4. **Record trace entry** — `agent_id`, `started_at`, `qdrant_hits`, `qdrant_scores`.
5. **Route** — return `agent_id` for conditional edge.

### Qdrant Service Change

`search_chunks()` currently returns `list[str]` (text only, discards scores). Must be extended to return scores alongside text for trace observability:

```python
# New return type
def search_chunks(self, client_id: str, question: str, top_k: int = 5) -> list[dict]:
    """Returns [{"text": str, "score": float}, ...]"""
```

The supervisor extracts `texts` for context injection and `scores` for the trace entry. The single existing caller — `stream_agent()` in `services/agent_service.py` (line ~201) — must be updated to destructure the new dict format: `texts = [r["text"] for r in results]`, `scores = [r["score"] for r in results]`.

### Agent Nodes (identical structure, different prompts)

Each agent node:
1. Receives full state (messages + context).
2. Calls Claude Sonnet 4 via Anthropic Vertex with streaming.
3. Updates trace entry with `ended_at`, `tokens_in`, `tokens_out`, `duration_ms`.
4. Returns `{messages: [AIMessage], trace: updated_trace}`.
5. Edge goes to END. State is persisted via checkpointer for the next request.

**Error handling:** If the Anthropic call fails, the agent node catches the exception, sets `trace[-1]["error"]` with the error message and `ended_at` with the current time, emits a `trace_error` SSE event, and returns an `AIMessage` with a user-facing error string. The graph does NOT retry — the user can retry manually.

### Streaming

Token-level streaming via Anthropic SDK `messages.stream()` → SSE to frontend. Same as today, but with added metadata events:

```
data: {"type": "trace_start", "agent_id": "copy", "qdrant_hits": 5, "context_chunks": 12}
data: {"text": "Here are 3 variations..."}
data: {"text": " for Instagram:"}
...
data: {"type": "trace_end", "tokens_in": 312, "tokens_out": 847, "duration_ms": 1200}
data: [DONE]
```

On error:
```
data: {"type": "trace_start", "agent_id": "copy", "qdrant_hits": 0}
data: {"type": "trace_error", "error": "Anthropic API timeout", "duration_ms": 30000}
data: [DONE]
```

## Frontend Changes

### Chat — Unified Thread

**Remove:** Agent selection from sidebar. Agent buttons no longer reset the conversation.

**Add:**

1. **Agent chips** below the textarea: `VideoRAG` `Copy` `Persona` `Roteiro` `Brief`
   - Clicking a chip inserts `@agentname ` at the start of the textarea.
   - The chip highlights when its `@mention` is detected in the input.
   - If no `@mention` is present, the last-used agent chip is subtly highlighted.

2. **@mention parser** in the send function:
   - Regex: `/^@(videorag|copy|persona|roteiro|brief)\s/i`
   - Extract `agent_id`, strip prefix from displayed message text, send `agent_id` in request body.
   - The message sent to the API does NOT contain the `@agent` prefix — the frontend resolves it to `agent_id` before sending.
   - If no match, use last agent_id from thread (stored in component state).

3. **Agent badge on messages** — each assistant message shows which agent responded (colored badge with agent name), replacing the current static agent label.

4. **Execution card (inline trace)** — rendered from `trace_start` / `trace_end` SSE events:
   - While streaming: shows agent name + "gerando resposta..." with live timer.
   - After completion: shows agent name, duration, token count, context chunks count.

5. **SSE parser update** — the current `readSSEStream` helper parses `{"text": ...}` payloads only. Must be extended to:
   - Detect `type` field in parsed JSON (`trace_start`, `trace_end`, `trace_error`).
   - `trace_start` → set execution card state (agent name, qdrant_hits, start timer).
   - `trace_end` → finalize execution card (duration, tokens).
   - `trace_error` → show error message inline where the response would appear.
   - Text chunks (`{"text": ...}`) continue to be appended to the message as today.

### Sidebar Changes

- Remove agent list buttons from sidebar nav.
- Keep: brand, client selector, Ingestão button, footer.
- Add: "Debug" button under Ferramentas (next to Ingestão).

### New View: DebugView

Accessible via sidebar "Debug" button. Sets `view` state to `"debug"`.

**Layout: 3 panels**

1. **Left — Thread list**: `GET /debug/threads?client_id=X` returns recent threads with summary (agent badges, turn count).
2. **Center — Graph + Timeline**:
   - Graph: constructed from the `trace` array — each trace entry becomes a node (agent name), edges connect entries in sequence. Color-coded by status (completed=green if no error, error=red, active=amber). The supervisor node is implicit (always present between START and the first agent).
   - Timeline: horizontal bars per step showing agent, duration, tokens, Qdrant hits.
3. **Right — Metrics**: aggregated stats for the selected thread — total tokens in/out, estimated cost, Qdrant chunks with avg relevance score, time breakdown per agent.

**Data source:** `GET /debug/thread/{thread_id}` returns the `trace` array from the LangGraph checkpoint state.

**MemorySaver limitation:** When running with MemorySaver (no `ALLOYDB_URI`), thread data is ephemeral. The UI should display a conditional info banner: "Dados disponíveis apenas da sessão atual do servidor." The banner is hidden when AlloyDB checkpointer is active (checked via a `/debug/status` endpoint that returns `{"checkpointer": "memory" | "postgres"}`).

### Thread Enumeration for Debug API

LangGraph's `MemorySaver` does not natively support listing all threads. To power `GET /debug/threads`, the backend maintains a lightweight in-memory dict (`_thread_index: dict[str, ThreadMeta]`) updated on each `stream_agent()` call:

```python
_thread_index[thread_id] = {
    "thread_id": thread_id,
    "client_id": client_id,
    "agents_used": set(),  # updated each turn
    "turn_count": 0,       # incremented each turn
    "last_active": datetime.utcnow().isoformat(),
}
```

`GET /debug/threads?client_id=X` filters this index by `client_id`. This index is also ephemeral with MemorySaver — acceptable since the thread data it references is equally ephemeral. When AlloyDB is active, the debug endpoint can query the checkpoint table directly instead.

## Backend Changes

### Modified: `services/agent_service.py`

- Replace `_build_graph()` with supervisor pattern graph.
- Supervisor node: read `agent_id` from state, manage context accumulation (with 20-chunk cap), record trace with scores.
- All agents receive accumulated context in system prompt (not just VideoRAG).
- Agent nodes: same as today, route to END. Wrap Anthropic call in try/except for trace error recording.
- `stream_agent()`: emit `trace_start`, `trace_end`, and `trace_error` SSE events alongside text chunks.

### Modified: `services/qdrant_service.py`

- `search_chunks()` return type changes from `list[str]` to `list[dict]` (`{"text": str, "score": float}`).
- Internal change only — the raw Qdrant `ScoredPoint` already contains `score`; currently discarded.

### Modified: `models/schemas.py`

- Expand `AgentState` with `trace: list[dict]` field.
- `AgentChatRequest` unchanged (already accepts `agent_id` per request).

### New: `routers/debug.py`

- `GET /debug/threads?client_id=X` — list threads from `_thread_index` (MemorySaver) or checkpoint table (AlloyDB), return summary.
- `GET /debug/thread/{thread_id}` — read checkpoint state, return `trace` + `messages` metadata.
- `GET /debug/status` — return `{"checkpointer": "memory" | "postgres"}` for conditional UI.

### Modified: `routers/agent.py`

- `stream_agent()` yield includes `trace_start`, `trace_end`, and `trace_error` events.

## API Contract

### Existing (unchanged shape)

```
POST /agent/chat
{
  "thread_id": "santander:user-123",
  "client_id": "santander",
  "agent_id": "copy",
  "message": "crie 3 variações para Instagram"
}
→ SSE stream with text + trace events
```

### New

```
GET /debug/threads?client_id=santander
→ [{"thread_id": "...", "agents_used": ["videorag","copy"], "turn_count": 12, "last_active": "..."}]

GET /debug/thread/santander:user-123
→ {
    "thread_id": "...",
    "trace": [...],
    "agents_used": ["videorag", "copy", "persona"],
    "total_tokens_in": 2015,
    "total_tokens_out": 1359,
    "total_duration_ms": 2400,
    "qdrant_chunks": 5,
    "avg_qdrant_score": 0.87
  }

GET /debug/status
→ {"checkpointer": "memory"}
```

**Auth:** Debug endpoints are intended for internal/developer use. No authentication is added in this iteration. Production access control (API key or network-level restriction) should be added before exposing the debug API externally.

## Scope Boundaries

**In scope:**
- Supervisor graph with shared context (all agents receive accumulated RAG context)
- `search_chunks()` returning scores alongside text
- @mention + chips for agent switching (frontend resolves to `agent_id`)
- Inline trace cards in chat (including error states)
- Debug page with graph, timeline, metrics (with MemorySaver limitation banner)
- SSE trace events (`trace_start`, `trace_end`, `trace_error`)
- Context accumulation cap (20 chunks FIFO)

**Out of scope (future):**
- Automatic orchestration (supervisor choosing agents without user input)
- LangSmith / external tracing integration
- AlloyDB checkpointer configuration (code exists but `ALLOYDB_URI` not set in prod)
- Cost billing / usage limits
- Agent-to-agent direct communication (agents only share via state)
- Video upload/ingest integration into the unified thread (ingest stays as separate view)
