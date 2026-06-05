"""
SPEC-015 TASK-B02 — Web search tool with allow-list enforcement.

FR-183: Oráculo consulta apenas domínios da allow-list configurada no wizard passo 2.
RN-033: Allow-list enforced no agent, não só na UI.
CA-20: Nenhuma request para domínios fora da allow-list no log de proveniência.

Rules:
- Only fetches from domains explicitly in oracle_config.allowed_domains
- Respects robots.txt Disallow before fetching
- Blocks paywall / login-required silently (log only, no error raised)
- Every fetched URL returns a ProvenanceEntry with source, excerpt, retrieved_at
"""

from __future__ import annotations

import logging
import re
import urllib.robotparser
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------


class ProvenanceEntry:
    def __init__(self, source: str, excerpt: str, retrieved_at: str):
        self.source = source
        self.excerpt = excerpt
        self.retrieved_at = retrieved_at

    def as_dict(self) -> dict:
        return {
            "source_type": "web",
            "reference": self.source,
            "cited_excerpt": self.excerpt,
            "retrieved_at": self.retrieved_at,
        }


# ---------------------------------------------------------------------------
# Domain / URL helpers
# ---------------------------------------------------------------------------


def _normalise_url(raw: str) -> str:
    """Add https:// if scheme is missing."""
    raw = raw.strip()
    if not raw.startswith(("http://", "https://")):
        raw = "https://" + raw
    return raw


def _domain_of(url: str) -> str:
    return urlparse(url).netloc.lower().lstrip("www.")


def _is_allowed_domain(url: str, allowed_domains: list[str]) -> bool:
    """
    Returns True only if the URL's domain matches (or is a subdomain of)
    one of the allowed domains.

    CA-20: This is the enforcement point — if False, the URL is never fetched.
    """
    url_domain = _domain_of(url)
    for allowed in allowed_domains:
        allowed_norm = allowed.strip().lower().lstrip("www.").split("/")[0]
        if url_domain == allowed_norm or url_domain.endswith("." + allowed_norm):
            return True
    return False


# ---------------------------------------------------------------------------
# robots.txt check (RN-033)
# ---------------------------------------------------------------------------

_robots_cache: dict[str, urllib.robotparser.RobotFileParser] = {}


async def _is_robots_allowed(url: str) -> bool:
    """
    Check robots.txt for the given URL.
    Returns True if scraping is allowed, False if Disallowed.
    Silently allows if robots.txt cannot be fetched (fail-open for availability).
    """
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"

    if robots_url not in _robots_cache:
        rp = urllib.robotparser.RobotFileParser()
        rp.set_url(robots_url)
        try:
            import httpx

            async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
                resp = await client.get(robots_url)
                if resp.status_code == 200:
                    rp.parse(resp.text.splitlines())
                else:
                    rp.allow_all = True
        except Exception:
            rp.allow_all = True
        _robots_cache[robots_url] = rp

    rp = _robots_cache[robots_url]
    return rp.can_fetch("*", url)


# ---------------------------------------------------------------------------
# HTML text extraction
# ---------------------------------------------------------------------------

_TAG_RE = re.compile(r"<[^>]+>")
_WHITESPACE_RE = re.compile(r"\s+")


def _extract_text(html: str, max_chars: int = 2000) -> str:
    """Strip HTML tags and collapse whitespace. Returns up to max_chars."""
    # Remove script / style blocks
    html = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", html, flags=re.DOTALL | re.IGNORECASE)
    text = _TAG_RE.sub(" ", html)
    text = _WHITESPACE_RE.sub(" ", text).strip()
    return text[:max_chars]


# ---------------------------------------------------------------------------
# Paywall / auth detection
# ---------------------------------------------------------------------------

_PAYWALL_SIGNALS = [
    "subscribe to read",
    "create an account",
    "sign in to continue",
    "login to view",
    "this content is for subscribers",
    "acesse com sua conta",
    "faça login para continuar",
    "conteúdo exclusivo para assinantes",
]


def _looks_like_paywall(text: str) -> bool:
    lowered = text.lower()
    return any(signal in lowered for signal in _PAYWALL_SIGNALS)


# ---------------------------------------------------------------------------
# Core fetch function
# ---------------------------------------------------------------------------


async def fetch_url(
    url: str,
    allowed_domains: list[str],
    user_agent: str = "SunOS-Oraculo/1.0",
) -> Optional[ProvenanceEntry]:
    """
    Fetch a single URL respecting allow-list and robots.txt.

    Returns ProvenanceEntry if successful, None otherwise.
    Never raises — all failures are logged and return None (silent skip).
    """
    url = _normalise_url(url)

    # CA-20: Allow-list enforcement — hard block
    if not _is_allowed_domain(url, allowed_domains):
        logger.warning("Oracle web_search: domain NOT in allow-list, skipping: %s", url)
        return None

    # RN-033: robots.txt check
    robots_ok = await _is_robots_allowed(url)
    if not robots_ok:
        logger.info("Oracle web_search: robots.txt Disallow for %s — skipping", url)
        return None

    try:
        import httpx

        headers = {
            "User-Agent": user_agent,
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        }
        async with httpx.AsyncClient(
            timeout=10.0,
            follow_redirects=True,
            headers=headers,
        ) as client:
            resp = await client.get(url)

        if resp.status_code != 200:
            logger.info("Oracle web_search: HTTP %d for %s — skipping", resp.status_code, url)
            return None

        content_type = resp.headers.get("content-type", "")
        if "text/html" not in content_type and "text/plain" not in content_type:
            logger.info("Oracle web_search: non-HTML content-type at %s — skipping", url)
            return None

        text = _extract_text(resp.text, max_chars=3000)

        if _looks_like_paywall(text):
            logger.info("Oracle web_search: paywall detected at %s — skipping", url)
            return None

        if len(text) < 100:
            logger.info("Oracle web_search: too little content at %s — skipping", url)
            return None

        excerpt = text[:800].strip()
        retrieved_at = datetime.now(timezone.utc).isoformat()

        logger.info("Oracle web_search: fetched %d chars from %s", len(text), url)
        return ProvenanceEntry(source=url, excerpt=excerpt, retrieved_at=retrieved_at)

    except Exception as exc:
        logger.warning("Oracle web_search: fetch failed for %s (%s)", url, exc)
        return None


# ---------------------------------------------------------------------------
# Batch fetch from allowed domains
# ---------------------------------------------------------------------------


async def fetch_allowed_domains(
    allowed_domains: list[str],
    max_per_domain: int = 1,
) -> list[ProvenanceEntry]:
    """
    Fetch content from each allowed domain.
    Returns list of successful ProvenanceEntry objects.

    For each domain, tries the root URL (https://domain/).
    Silently skips failed/blocked domains.
    """
    if not allowed_domains:
        return []

    results: list[ProvenanceEntry] = []

    for domain in allowed_domains:
        url = _normalise_url(domain)
        entry = await fetch_url(url, allowed_domains)
        if entry:
            results.append(entry)
            if len(results) >= max_per_domain * len(allowed_domains):
                break

    return results


def format_web_context(entries: list[ProvenanceEntry]) -> str:
    """Format provenance entries as context text for the LLM prompt."""
    if not entries:
        return ""

    lines = ["CONTEXTO WEB (fontes autorizadas):"]
    for i, entry in enumerate(entries, 1):
        lines.append(f"\n[Fonte {i}] {entry.source}")
        lines.append(entry.excerpt)

    return "\n".join(lines)
