"""Genesis SDK - use the validation engine from Python, two ways:

1. In-process (no server needed):
    from app.sdk import Genesis
    report = Genesis().validate("my idea", on_event=print)

2. Remote (server running, cross-language/machine):
    from app.sdk import RemoteGenesis
    report = RemoteGenesis("http://127.0.0.1:8787").validate("my idea")

Both implement the same GenesisProtocol and return the same report dict:
{score, verdict, breakdown, risks, change_suggestions, next_steps, evidence_used, ...}

Event contract (every on_event dict):
{ts: ISO-8601 UTC, stage: intake|research|analysis|critique|verdict,
 agent: orchestrator|researcher|analyst|critic|diagnostics,
 level: info|action|success|warn|error, message: str, detail?: dict}

Typed errors (app.errors): GenesisError � GenesisUsageError � JobNotFound �
JobNotFinished � JobFailed (resumable) � ConfigError � ProviderError �
TransportError � GenesisTimeout (job keeps running, resumable)."""
from __future__ import annotations

import json
import os
import threading
import time
import uuid
from collections.abc import Callable
from typing import Any, Protocol

import httpx

from .errors import (GenesisError, GenesisTimeout, JobFailed, JobNotFound,
                     JobNotFinished, TransportError)


class Event(Protocol):
    ts: str
    stage: str
    agent: str
    level: str
    message: str


class GenesisProtocol(Protocol):
    def validate(self, idea: str, on_event: Callable[[dict], None] | None = None,
                 timeout: float = 600.0) -> dict[str, Any]: ...
    def history(self, limit: int = 50) -> list[dict]: ...
    def result(self, job_id: str) -> dict[str, Any]: ...


class Genesis:
    """In-process client. Runs the full pipeline without starting the web server.

    mode is applied for the duration of the run only (env is restored
    afterwards), so a host application's own mode is never clobbered."""

    def __init__(self, mode: str | None = None) -> None:
        self._mode = mode

    def validate(self, idea: str, on_event: Callable[[dict], None] | None = None,
                 timeout: float = 600.0) -> dict[str, Any]:
        from .orchestration import events, orchestrator
        from .store import db

        prev = os.environ.get("GENESIS_MODE")
        try:
            if self._mode:
                os.environ["GENESIS_MODE"] = self._mode
            db.init_db()
            job_id = uuid.uuid4().hex[:12]
            db.create_job(job_id, idea)
            worker = threading.Thread(target=orchestrator.run_job,
                                      args=(job_id, idea), daemon=True)
            worker.start()

            deadline = time.time() + timeout
            sent = 0
            while time.time() < deadline:
                chunk, _ = events.get_events(job_id, after=sent)
                for evt in chunk:
                    sent += 1
                    if on_event:
                        on_event(evt)
                job = db.get_job(job_id)
                if job and job["status"] == "completed":
                    return json.loads(job["result"])
                if job and job["status"] == "failed":
                    raise JobFailed(job_id, job.get("error") or "unknown error")
                time.sleep(0.2)
            raise GenesisTimeout(job_id, timeout)
        finally:
            if prev is None:
                os.environ.pop("GENESIS_MODE", None)
            else:
                os.environ["GENESIS_MODE"] = prev

    def result(self, job_id: str) -> dict[str, Any]:
        from .store import db
        db.init_db()
        job = db.get_job(job_id)
        if not job:
            raise JobNotFound(job_id)
        if not job.get("result"):
            raise JobNotFinished(job_id)
        return json.loads(job["result"])

    def history(self, limit: int = 50) -> list[dict]:
        from .store import db
        db.init_db()
        return db.list_jobs(limit=limit)


class RemoteGenesis:
    """HTTP client for a running Genesis server (UI/CLI share the same API)."""

    def __init__(self, base_url: str = "http://127.0.0.1:8787") -> None:
        self.base_url = base_url.rstrip("/")
        self._client = httpx.Client(timeout=30.0)

    def _get(self, path: str) -> dict:
        r = self._client.get(f"{self.base_url}{path}")
        return self._check(r)

    def _check(self, r: httpx.Response) -> dict:
        if r.status_code == 404:
            raise JobNotFound(r.url.path)
        if r.status_code == 409:
            raise JobNotFinished(r.url.path)
        if r.status_code == 400:
            from .errors import GenesisUsageError
            raise GenesisUsageError((r.json().get("detail") if r.headers.get("content-type", "").startswith("application/json") else None) or r.text[:200])
        if r.status_code >= 500:
            raise TransportError(f"server error {r.status_code}: {r.text[:200]}")
        r.raise_for_status()
        return r.json()

    def health(self) -> dict:
        return self._get("/api/health")

    def validate(self, idea: str, on_event: Callable[[dict], None] | None = None,
                 timeout: float = 600.0) -> dict[str, Any]:
        r = self._client.post(f"{self.base_url}/api/validate", json={"idea": idea})
        self._check(r)
        job_id = r.json()["job_id"]

        deadline = time.time() + timeout
        with httpx.stream("GET", f"{self.base_url}/api/stream/{job_id}",
                          timeout=httpx.Timeout(30.0, read=60.0)) as stream:
            for line in stream.iter_lines():
                if time.time() > deadline:
                    raise GenesisTimeout(job_id, timeout)
                if line.startswith("data: "):
                    evt = json.loads(line[6:])
                    if on_event:
                        on_event(evt)
                elif line.startswith("event: done"):
                    break

        res = self._client.get(f"{self.base_url}/api/result/{job_id}")
        if res.status_code == 409:
            job = self._client.get(f"{self.base_url}/api/jobs/{job_id}").json()
            raise JobFailed(job_id, job.get("error") or f"job {job['status']}")
        return self._check(res)

    def result(self, job_id: str) -> dict[str, Any]:
        return self._get(f"/api/result/{job_id}")

    def history(self, limit: int = 50) -> list[dict]:
        return self._get(f"/api/jobs?limit={limit}")

    def resume(self, job_id: str) -> dict:
        r = self._client.post(f"{self.base_url}/api/jobs/{job_id}/resume")
        return self._check(r)
