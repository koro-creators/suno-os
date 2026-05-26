"""
Async retry utilities with exponential backoff for LLM and external API calls.

Usage — functional:
    result = await with_retry(some_coroutine(), max_attempts=3)

Usage — decorator:
    @retryable(max_attempts=3, base_delay=1.0)
    async def call_llm(...):
        ...
"""

from __future__ import annotations

import asyncio
import functools
import logging
from typing import Any, Awaitable, Callable, TypeVar

logger = logging.getLogger(__name__)

T = TypeVar("T")

# Substrings that indicate a retryable transient error from any LLM provider.
_RETRYABLE_SIGNALS = frozenset(
    [
        "429",
        "503",
        "502",
        "timeout",
        "rate limit",
        "rate_limit",
        "overloaded",
        "resource exhausted",
        "service unavailable",
        "quota exceeded",
        "quota_exceeded",
        "too many requests",
        "deadline",
    ]
)


def _is_retryable(exc: Exception) -> bool:
    """Return True if the exception looks like a transient API error."""
    error_str = str(exc).lower()
    return any(signal in error_str for signal in _RETRYABLE_SIGNALS)


async def with_retry(
    coro: Awaitable[T],
    *,
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
) -> T:
    """Retry a coroutine with exponential backoff on transient errors.

    Args:
        coro: An awaitable to execute (e.g. ``some_async_fn()``).
        max_attempts: Total number of attempts (including the first).
        base_delay: Initial delay in seconds; doubled on each retry.
        max_delay: Upper bound for the per-attempt delay.

    Returns:
        The result of the coroutine on success.

    Raises:
        The last exception if all attempts are exhausted or the error is
        not retryable.
    """
    last_exc: Exception | None = None

    for attempt in range(max_attempts):
        try:
            return await coro
        except Exception as exc:
            last_exc = exc
            if not _is_retryable(exc) or attempt == max_attempts - 1:
                raise
            delay = min(base_delay * (2**attempt), max_delay)
            logger.warning(
                "Retryable error on attempt %d/%d — waiting %.1fs before retry. Error: %s",
                attempt + 1,
                max_attempts,
                delay,
                exc,
            )
            await asyncio.sleep(delay)

    # Should never reach here, but satisfies type checker.
    raise last_exc  # type: ignore[misc]


def retryable(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
) -> Callable[[Callable[..., Awaitable[T]]], Callable[..., Awaitable[T]]]:
    """Decorator that wraps an async function with exponential-backoff retry logic.

    Only retries on transient errors (rate limit, 429, 503, timeout, overloaded).
    Non-retryable exceptions propagate immediately.

    Example::

        @retryable(max_attempts=3, base_delay=1.0)
        async def call_gemini(prompt: str) -> str:
            ...
    """

    def decorator(func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> T:
            last_exc: Exception | None = None

            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as exc:
                    last_exc = exc
                    if not _is_retryable(exc) or attempt == max_attempts - 1:
                        raise
                    delay = min(base_delay * (2**attempt), max_delay)
                    logger.warning(
                        "Retryable error in '%s' on attempt %d/%d — waiting %.1fs. Error: %s",
                        func.__name__,
                        attempt + 1,
                        max_attempts,
                        delay,
                        exc,
                    )
                    await asyncio.sleep(delay)

            raise last_exc  # type: ignore[misc]

        return wrapper

    return decorator
