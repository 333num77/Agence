"""Search provider: tavily | searxng | mock - env-switchable, no vendor lock.

Contract (frozen): query -> [{title, url, content}]
SearXNG prerequisite: instance must allow JSON format (settings.yml -> formats: [html, json])."""
import hashlib

import httpx

from .. import config


def search(job_id: str, stage: str, query: str) -> list[dict]:
    provider = config.SEARCH_PROVIDER
    if config.MODE == "mock" or provider == "mock":
        return _mock(query)
    if provider == "searxng":
        if not config.SEARXNG_BASE:
            raise RuntimeError("SEARCH_PROVIDER=searxng but SEARXNG_BASE_URL is not set")
        return _searxng(query)
    if provider == "tavily" and not config.TAVILY_API_KEY:
        raise RuntimeError("SEARCH_PROVIDER=tavily but TAVILY_API_KEY is not set "
                           "(ya SEARCH_PROVIDER=searxng/mock use karo)")
    return _tavily(query)


def _auth_header() -> dict:
    return {"Authorization": f"Bearer {config.SEARCH_API_KEY}"} if config.SEARCH_API_KEY else {}


def _tavily(query: str) -> list[dict]:
    body: dict = {"query": query, "max_results": config.SEARCH_RESULTS,
                  "search_depth": "basic", "include_answer": False}
    if config.TAVILY_API_KEY:  # legacy body auth only when key exists
        body["api_key"] = config.TAVILY_API_KEY
    r = httpx.post(config.TAVILY_BASE_URL, headers=_auth_header(),
                   json=body, timeout=30)
    r.raise_for_status()
    data = r.json()
    return [
        {"title": x.get("title", ""), "url": x.get("url", ""), "content": x.get("content", "")}
        for x in data.get("results", [])
    ]


def _searxng(query: str) -> list[dict]:
    """Self-hosted SearXNG JSON API - free, private, zero vendor lock."""
    r = httpx.get(f"{config.SEARXNG_BASE}/search",
                  params={"q": query, "format": "json"},
                  headers={"Accept": "application/json", **_auth_header()},
                  timeout=30)
    r.raise_for_status()
    data = r.json()
    return [
        {"title": x.get("title", ""), "url": x.get("url", ""), "content": x.get("content", "")}
        for x in data.get("results", [])[: config.SEARCH_RESULTS]
    ]


_MOCK_SITES = [
    ("reddit.com", "r/SaaS discussion: \"{kw}\" - what people actually complain about"),
    ("g2.com", "Reviews roundup for tools matching \"{kw}\" - ratings and complaints"),
    ("techcrunch.com", "Funding and launches in the \"{kw}\" space"),
    ("producthunt.com", "\"{kw}\" tool launch thread - early adopter feedback"),
    ("medium.com", "Founder post-mortem: building a \"{kw}\" product"),
    ("stripe.com", "Pricing benchmarks for \"{kw}\" SaaS tools"),
]


def _mock(query: str) -> list[dict]:
    kw = query[:60]
    h = int(hashlib.md5(query.encode()).hexdigest(), 16)
    count = 4 + (h % 3)
    out = []
    for i in range(count):
        domain, title = _MOCK_SITES[(h + i) % len(_MOCK_SITES)]
        out.append({
            "title": title.format(kw=kw),
            "url": f"https://www.{domain}/mock/{h % 9999}-{i}",
            "content": f"[mock evidence for '{kw}'] Sentiment and demand signals gathered for the query. "
                       f"Mentions pricing, complaints, and alternatives relevant to the idea.",
        })
    return out
