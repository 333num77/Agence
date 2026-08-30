"""Critic: red-team the idea; propose changes or rejection with reasons."""
import json

from ..core import evidence as ev
from ..diagnosis import with_retry
from ..orchestration import events
from ..providers import llm
from .base import Agent


class Critic(Agent):
    name = "critic"
    prompt_file = "critic.md"

    def run(self, job_id: str, stage: str, idea: str, analysis: dict, evidence: list[dict]) -> dict:
        def emit(msg, level="info", detail=None):
            events.emit(job_id, stage, self.name, msg, level, detail)

        compact = ev.compact_for_prompt(evidence)
        emit("Red-teaming the idea.", level="action")

        user_msg = (
            f"{self.user_context()}\n\nIDEA:\n{idea}\n\n"
            f"ANALYST SUMMARY:\n{json.dumps(analysis, ensure_ascii=False)}\n\n"
            f"EVIDENCE (cite by id):\n{json.dumps(compact, ensure_ascii=False)}\n\n"
            "Produce the critique JSON. Be brutally honest - a saved failure is cheaper than a built failure."
        )
        out = with_retry(job_id, stage, self.name, "Critique",
                         lambda: llm.chat(job_id, stage, self.name, self.system_prompt(), user_msg))

        valid_ids = {e["id"] for e in evidence}
        for risk in out.get("risks", []):
            risk["evidence_ids"] = [i for i in (risk.get("evidence_ids") or []) if i in valid_ids]

        high = sum(1 for r in out.get("risks", []) if r.get("severity") == "high")
        emit(f"Critique complete: {len(out.get('risks', []))} risks "
             f"({high} high), fatal issues: {len(out.get('fatal', []))}", level="success")
        return out
