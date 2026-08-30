"""Evidence package: raw search results become normalized, deduped, ranked items."""
import re
from urllib.parse import urlparse


def _domain(url: str) -> str:
    try:
        return urlparse(url).netloc.removeprefix("www.")
    except Exception:
        return "unknown"


def _tokens(text: str) -> set[str]:
    return {t for t in re.findall(r"[a-z0-9]{3,}", text.lower())}


def make_items(idea: str, query: str, results: list[dict]) -> list[dict]:
    idea_tokens = _tokens(idea + " " + query)
    items = []
    for r in results:
        title = (r.get("title") or "").strip()
        url = (r.get("url") or "").strip()
        content = (r.get("content") or r.get("snippet") or "").strip()
        if not title or not url:
            continue
        text = f"{title} {content}"
        overlap = len(_tokens(text) & idea_tokens)
        items.append({
            "title": title[:180],
            "url": url,
            "domain": _domain(url),
            "quote": content[:280],
            "query": query,
            "relevance": overlap,
        })
    return items


def dedupe_and_rank(items: list[dict], cap: int = 15) -> list[dict]:
    seen_urls: set[str] = set()
    unique: list[dict] = []
    for it in sorted(items, key=lambda x: x["relevance"], reverse=True):
        key = it["url"].rstrip("/").lower()
        if key in seen_urls:
            continue
        seen_urls.add(key)
        unique.append(it)
    unique.sort(key=lambda x: x["relevance"], reverse=True)
    for i, it in enumerate(unique[:cap], start=1):
        it["id"] = f"E{i}"
    return unique[:cap]


def summarize(evidence: list[dict]) -> dict:
    domains = sorted({e["domain"] for e in evidence})
    return {"count": len(evidence), "domains": domains, "domain_diversity": len(domains)}


def compact_for_prompt(evidence: list[dict]) -> list[dict]:
    return [
        {"id": e["id"], "title": e["title"], "domain": e["domain"], "quote": e["quote"]}
        for e in evidence
    ]
