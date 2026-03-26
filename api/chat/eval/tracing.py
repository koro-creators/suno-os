"""MLflow tracing decorator for chat turns. No-op when MLflow is unavailable."""
from __future__ import annotations

import functools
import logging
import time

logger = logging.getLogger(__name__)


def trace_chat_turn(func):
    """Decorator that logs each chat turn to MLflow. No-op if MLflow unavailable."""
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        start = time.monotonic()
        try:
            import mlflow
        except ImportError:
            return await func(*args, **kwargs)

        # Extract params from kwargs
        message = kwargs.get("message", "")
        skill_slug = kwargs.get("skill_slug", "")
        model = kwargs.get("model", "")
        conversation_id = kwargs.get("conversation_id", "")

        try:
            with mlflow.start_run(nested=True, run_name=f"sunos-chat-{str(conversation_id)[:8]}"):
                mlflow.log_params({
                    "message": str(message)[:500],
                    "skill_slug": skill_slug,
                    "model": model,
                    "conversation_id": str(conversation_id) if conversation_id else "new",
                })

                result = await func(*args, **kwargs)

                latency_ms = (time.monotonic() - start) * 1000
                mlflow.log_metrics({"latency_ms": latency_ms})

                return result
        except Exception:
            logger.debug("trace_chat_turn: MLflow tracing failed", exc_info=True)
            return await func(*args, **kwargs)

    return wrapper
