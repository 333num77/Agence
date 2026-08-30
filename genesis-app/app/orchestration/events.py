"""Event bus: every pipeline step emits events consumed live via SSE.

Events are kept in memory (for the live stream) and persisted on the job row
(history replay after refresh / resume)."""
import json
import threading
from datetime import datetime, timezone

from ..store import db

_lock = threading.Lock()
_streams: dict[str, list[dict]] = {}


def emit(job_id: str, stage: str, agent: str, message: str,
         level: str = "info", detail: dict | None = None) -> dict:
    evt = {
        "ts": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
        "stage": stage,
        "agent": agent,
        "level": level,  # info | action | success | warn | error
        "message": message,
    }
    if detail:
        evt["detail"] = detail
    with _lock:
        _streams.setdefault(job_id, []).append(evt)
        job = db.get_job(job_id)
        if job:
            try:
                log = json.loads(job.get("events") or "[]")
            except json.JSONDecodeError:
                log = []
            log.append(evt)
            db.update_job(job_id, events=log)
    return evt


def get_events(job_id: str, after: int = 0) -> tuple[list[dict], int]:
    with _lock:
        stream = _streams.get(job_id, [])
        return stream[after:], len(stream)


def hydrate(job_id: str) -> list[dict]:
    """Load persisted events into the live stream (used on resume/reconnect)."""
    job = db.get_job(job_id)
    if not job:
        return []
    with _lock:
        try:
            stored = json.loads(job.get("events") or "[]")
        except json.JSONDecodeError:
            stored = []
        _streams[job_id] = list(stored)
        return stored
