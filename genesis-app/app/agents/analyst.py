"""Analyst: evidence-backed analysis (every claim must cite evidence ids)."""
import json

from ..core import evidence as ev
from ..diagnosis import with_retry
from ..orchestration import events
from ..providers import llm
from .base import Agent


class Analyst(Agent):
    name = "analyst"
    prompt_file = "analyst.md"

    def run(self, job_id: str, stage: str, idea: str, evidence: list[dict]) -> dict:
        def emit(msg, level="info", detail=None):
            events.emit(job_id, stage, self.name, msg, level, detail)

        compact = ev.compact_for_prompt(evidence)
        emit(f"Analyzing {len(compact)} evidence items.", level="action")

        user_msg = (
            f"{self.user_context()}\n\nIDEA:\n{idea}\n\n"
            f"EVIDENCE (real web items, cite by id only):\n{json.dumps(compact, ensure_ascii=False)}\n\n"
            "Produce the analysis JSON. Cite evidence ids for every claim."
        )
        out = with_retry(job_id, stage, self.name, "Analysis",
                         lambda: llm.chat(job_id, stage, self.name, self.system_prompt(), user_msg))

        valid_ids = {e["id"] for e in evidence}
        for sig in out.get("demand_signals", []):
            sig["evidence_ids"] = [i for i in (sig.get("evidence_ids") or []) if i in valid_ids]
        comp = out.get("competition") or {}
        comp["evidence_ids"] = [i for i in (comp.get("evidence_ids") or []) if i in valid_ids]

        emit("Analysis complete - claims are evidence-backed", level="success")
        return out
