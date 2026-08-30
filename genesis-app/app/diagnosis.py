"""Runtime diagnosis: non-blocking health checks + provider resilience helpers.

Design goal: choti moti problems run-time par pakdi jayein aur theek hon
(retry/backoff, degraded-mode events) without disturbing the pipeline."""
import time

import httpx

from . import config
from .orchestration import events


def health() -> dict:
    status = config.provider_summary()
    status["db"] = {"ok": True}
    llm = status["llm"]
    if config.MODE == "live" and config.LLM_BASE_URL:
        # Any server answer (2xx/401/403/404) = reachable; only network errors are not.
        headers = {"Authorization": f"Bearer {config.LLM_API_KEY}"} if config.LLM_API_KEY else {}
        try:
            r = httpx.get(f"{config.LLM_BASE_URL}/models", headers=headers, timeout=8)
            llm["reachable"] = True
            llm["status_code"] = r.status_code
        except Exception as exc:
            llm["reachable"] = False
            llm["error"] = str(exc)[:160]
    return status


def emit_diagnostics(job_id: str) -> dict:
    status = health()
    llm = status["llm"]
    core_ok = [
        bool(llm.get("ok", True)) and llm.get("reachable", True) is not False,
        bool(status["search"].get("ok", True)),
        bool(status["db"].get("ok", True)),
    ]
    if all(core_ok):
        events.emit(job_id, "intake", "diagnostics",
                    f"System check passed — mode: {config.MODE.upper()}, "
                    f"llm: {config.PROVIDER_NAME or 'unset'}, search: {config.SEARCH_PROVIDER}",
                    level="success", detail=status)
    else:
        bad = []
        if not core_ok[0]:
            bad.append("llm")
        if not core_ok[1]:
            bad.append("search")
        if not core_ok[2]:
            bad.append("db")
        events.emit(job_id, "intake", "diagnostics",
                    f"Degraded components: {', '.join(bad)} — pipeline will retry and clearly report failures",
                    level="warn", detail=status)
    return status


def with_retry(job_id: str, stage: str, agent: str, label: str, fn, retries: int = 2, backoff: float = 1.5):
    """Run fn() with retries + backoff; emit what is happening so the UI stays honest."""
    attempt = 0
    while True:
        try:
            return fn()
        except Exception as exc:
            attempt += 1
            if attempt > retries:
                events.emit(job_id, stage, agent,
                            f"{label} failed after {attempt} attempts: {exc}",
                            level="error")
                raise
            wait = backoff * attempt
            events.emit(job_id, stage, agent,
                        f"{label} failed (attempt {attempt}/{retries + 1}): {exc} — retrying in {wait:.1f}s",
                        level="warn")
            time.sleep(wait)
