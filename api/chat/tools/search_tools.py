"""Web search tool — searches the web for information.

Currently returns mock/placeholder results. Swap the implementation inside
`_execute_search` when a real provider is configured.

TODO: Integrate Tavily (https://tavily.com) or SerpAPI (https://serpapi.com)
      for production use. Both have LangChain-native integrations:
      - `langchain_community.tools.tavily_search.TavilySearchResults`
      - `langchain_community.utilities.SerpAPIWrapper`
"""

from langchain_core.tools import tool


def _mock_search(query: str, num_results: int) -> list[dict]:
    """Return placeholder search results for development/testing."""
    results = []
    for i in range(1, num_results + 1):
        results.append(
            {
                "title": f"Result {i}: {query}",
                "snippet": (
                    f"This is a placeholder snippet for result {i} "
                    f"matching the query '{query}'. Replace this mock with "
                    f"a real search API integration."
                ),
                "url": f"https://example.com/search?q={query.replace(' ', '+')}&r={i}",
            }
        )
    return results


def _execute_search(query: str, num_results: int) -> list[dict]:
    """Execute a web search. Swap this implementation for a real provider.

    TODO: Integrate with Tavily or SerpAPI. Example with Tavily:

        import httpx
        from config import settings

        response = httpx.post(
            "https://api.tavily.com/search",
            json={
                "api_key": settings.TAVILY_API_KEY,
                "query": query,
                "max_results": num_results,
            },
            timeout=10.0,
        )
        response.raise_for_status()
        data = response.json()
        return [
            {"title": r["title"], "snippet": r["content"], "url": r["url"]}
            for r in data.get("results", [])
        ]
    """
    return _mock_search(query, num_results)


def _format_results(results: list[dict]) -> str:
    """Format search results into a readable string."""
    if not results:
        return "No results found."

    lines = []
    for i, r in enumerate(results, 1):
        lines.append(
            f"[{i}] {r['title']}\n"
            f"    {r['snippet']}\n"
            f"    URL: {r['url']}"
        )
    return "\n\n".join(lines)


@tool
def web_search(query: str, num_results: int = 5) -> str:
    """Search the web for information. Returns search results as formatted text."""
    try:
        num_results = max(1, min(num_results, 10))
        results = _execute_search(query, num_results)
        return _format_results(results)

    except Exception as exc:
        return f"[web_search error] {exc}"
