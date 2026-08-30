"""SQLite job store (stdlib sqlite3, one short-lived connection per call)."""
import json
import sqlite3
import threading
from datetime import datetime, timezone

from .. import config

_write_lock = threading.Lock()


def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(config.DB_PATH, timeout=10)
    c.row_factory = sqlite3.Row
    return c


def init_db() -> None:
    with _write_lock, _conn() as c:
        c.execute(
            """CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                idea TEXT NOT NULL,
                status TEXT NOT NULL,          -- running|completed|failed
                stage TEXT NOT NULL,
                state TEXT NOT NULL DEFAULT '{}',
                result TEXT,
                error TEXT,
                events TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )"""
        )


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def create_job(job_id: str, idea: str) -> None:
    with _write_lock, _conn() as c:
        c.execute(
            "INSERT INTO jobs (id, idea, status, stage, state, events, created_at, updated_at)"
            " VALUES (?, ?, 'running', 'intake', '{}', '[]', ?, ?)",
            (job_id, idea, _now(), _now()),
        )


def update_job(job_id: str, **fields) -> None:
    allowed = {"status", "stage", "state", "result", "error", "events"}
    sets, vals = [], []
    for k, v in fields.items():
        if k not in allowed:
            continue
        sets.append(f"{k} = ?")
        vals.append(v if isinstance(v, str) else json.dumps(v, ensure_ascii=False))
    sets.append("updated_at = ?")
    vals.append(_now())
    vals.append(job_id)
    with _write_lock, _conn() as c:
        c.execute(f"UPDATE jobs SET {', '.join(sets)} WHERE id = ?", vals)


def get_job(job_id: str):
    with _conn() as c:
        row = c.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    return dict(row) if row else None


def list_jobs(limit: int = 50):
    with _conn() as c:
        rows = c.execute(
            "SELECT id, idea, status, stage, result, error, created_at, updated_at"
            " FROM jobs ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
    out = []
    for r in rows:
        d = dict(r)
        if d.get("result"):
            try:
                d["result"] = json.loads(d["result"])
            except json.JSONDecodeError:
                pass
        out.append(d)
    return out
