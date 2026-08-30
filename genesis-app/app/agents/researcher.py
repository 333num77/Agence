"""Researcher: plans queries, runs web search, builds the evidence package."""
from ..core import evidence as ev
from ..diagnosis import with_retry
from ..orchestration import events
from ..providers import llm, search
from .base import Agent


class Researcher(Agent):
    name = "researcher"
    prompt_file = "researcher.md"

    def run(self, job_id: str, stage: str, idea: str) -> dict:
        def emit(msg, level="info", detail=None):
            events.emit(job_id, stage, self.name, msg, level, detail)

        emit("Planning research queries…", level="action")
        plan = with_retry(job_id, stage, self.name, "Query planning",
                          lambda: llm.chat(job_id, stage, self.name, self.system_prompt(),
                                           f"{self.user_context()}\n\nIDEA:\n{idea}"))
        queries = [q for q in (plan.get("queries") or []) if isinstance(q, str)][:4]
        if not queries:
            queries = [f"{idea[:60]} demand evidence", f"{idea[:60]} competitors pricing"]
        emit(f"Research plan ready: {len(queries)} queries", level="success",
             detail={"queries": queries})

        raw_items: list[dict] = []
        for i, q in enumerate(queries, start=1):
            emit(f"Searching ({i}/{len(queries)}): {q}", level="action")
            results = with_retry(job_id, stage, self.name, f"Search: {q}",
                                 lambda q=q: search.search(job_id, stage, q))
            items = ev.make_items(idea, q, results)
            raw_items.extend(items)
            emit(f"{len(items)} results captured", level="info")

        evidence = ev.dedupe_and_rank(raw_items)
        summary = ev.summarize(evidence)
        emit(f"Evidence package built: {summary['count']} items across "
             f"{summary['domain_diversity']} domains", level="success", detail=summary)
        return {"queries": queries, "evidence": evidence, "summary": summary}
