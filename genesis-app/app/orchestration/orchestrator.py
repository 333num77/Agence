"""Orchestrator: stage machine with checkpointing + resume-on-failure.

Stages: intake -> research -> analysis -> critique -> verdict
After every stage the full state is checkpointed to SQLite; a failed job
resumes from its last good stage with zero repeated work."""
import threading
import uuid

from .. import config
from ..agents.analyst import Analyst
from ..agents.critic import Critic
from ..agents.researcher import Researcher
from ..core import user_profile, verdict as verdict_mod
from ..diagnosis import emit_diagnostics
from ..store import db
from . import events

researcher = Researcher()
analyst = Analyst()
critic = Critic()


def start_job(idea: str) -> str:
    job_id = uuid.uuid4().hex[:12]
    db.create_job(job_id, idea)
    t = threading.Thread(target=run_job, args=(job_id, idea), daemon=True)
    t.start()
    return job_id


def resume_job(job_id: str) -> bool:
    job = db.get_job(job_id)
    if not job:
        return False
    import json
    state = json.loads(job["state"] or "{}")
    idea = job["idea"]
    events.hydrate(job_id)
    events.emit(job_id, state.get("stage", "intake"), "orchestrator",
                "Resuming from last checkpoint - no completed work will be repeated",
                level="action")
    db.update_job(job_id, status="running", error=None)
    t = threading.Thread(target=run_job, args=(job_id, idea, state), daemon=True)
    t.start()
    return True


def _checkpoint(job_id: str, stage: str, state: dict) -> str:
    import json
    state["stage"] = stage
    db.update_job(job_id, stage=stage, state=json.dumps(state, ensure_ascii=False))
    events.emit(job_id, stage, "orchestrator", f"Checkpoint saved ? next: {stage}", level="info")
    return stage


def run_job(job_id: str, idea: str, state: dict | None = None) -> None:
    state = dict(state or {})
    stage = state.get("stage", "intake")
    try:
        if stage == "intake":
            events.emit(job_id, "intake", "orchestrator",
                        f"Pipeline started - mode: {config.MODE.upper()}",
                        level="action", detail={"idea": idea})
            emit_diagnostics(job_id)
            profile = user_profile.load()
            events.emit(job_id, "intake", "orchestrator",
                        f"User harness applied: {profile.get('name', 'Founder')} - "
                        f"goals/constraints injected into every agent (no re-explaining)",
                        level="info")
            stage = _checkpoint(job_id, "research", state)

        if stage == "research":
            state["research"] = researcher.run(job_id, "research", idea)
            stage = _checkpoint(job_id, "analysis", state)

        if stage == "analysis":
            state["analysis"] = analyst.run(job_id, "analysis", idea, state["research"]["evidence"])
            stage = _checkpoint(job_id, "critique", state)

        if stage == "critique":
            state["critique"] = critic.run(job_id, "critique", idea,
                                           state["analysis"], state["research"]["evidence"])
            stage = _checkpoint(job_id, "verdict", state)

        if stage == "verdict":
            result = verdict_mod.build(idea, state["analysis"], state["critique"],
                                       state["research"]["evidence"], state["research"]["summary"])
            events.emit(job_id, "verdict", "orchestrator",
                        f"VERDICT: {result['verdict']} - score {result['score']}/100",
                        level="success" if result["verdict"] == "VALIDATE" else "warn",
                        detail=result)
            import json
            db.update_job(job_id, status="completed", stage="verdict", result=json.dumps(result, ensure_ascii=False))

    except Exception as exc:  # stable failure path: clear error + resumable
        events.emit(job_id, stage, "orchestrator",
                    f"Pipeline failed at '{stage}': {exc} - job is resumable from this checkpoint",
                    level="error")
        db.update_job(job_id, status="failed", stage=stage, error=str(exc)[:500])
