# sunOS API

Backend multi-agent (FastAPI + LangGraph) para ferramentas de IA do sunohub.

## Quick Start

```bash
cd api
uv sync
cp .env.example .env  # configure API keys
uv run uvicorn main:app --port 8080 --reload
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| POST | /api/chat/stream | Chat streaming (SSE) |
| POST | /api/chat/generate-text | Text generation (batch) |
| POST | /api/chat/generate-image | Image generation |
| POST | /api/chat/enhance-prompt | Prompt enhancement |
| GET | /api/chat/conversations | List conversations |

## Architecture

See `CLAUDE.md` for detailed conventions and `docs/specs/` in the root repo for the full SPEC-001 v2 specification.

## Eval

```bash
uv run pytest tests/  # unit tests
uv run python -m chat.eval  # run eval scorers against datasets
```
