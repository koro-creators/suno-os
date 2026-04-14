"""Retry decorator with exponential backoff for LLM API calls."""

import functools
import logging
import time

logger = logging.getLogger(__name__)


def retry_on_error(
    max_retries: int = 3, base_delay: float = 1.0, max_delay: float = 30.0
):
    """Retry decorator with exponential backoff for LLM API calls."""

    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt == max_retries:
                        break
                    delay = min(base_delay * (2**attempt), max_delay)
                    logger.warning(
                        "Retry %d/%d for %s after error: %s (waiting %.1fs)",
                        attempt + 1,
                        max_retries,
                        func.__name__,
                        str(e),
                        delay,
                    )
                    time.sleep(delay)
            raise last_exception

        return wrapper

    return decorator
