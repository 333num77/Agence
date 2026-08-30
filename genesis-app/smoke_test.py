"""Synchronous end-to-end smoke test (mock mode): exercises the full pipeline
without any server or API keys. Run:  python smoke_test.py"""
import json
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))  # safe against PYTHONSAFEPATH

from app import config  # noqa: E402
config.MODE = "mock"  # force canned providers

from app.orchestration import events, orchestrator  # noqa: E402
from app.store import db  # noqa: E402

IDEA = ("An AI tool that turns messy startup ideas into evidence-backed "
        "validation reports with cited sources, change suggestions, and a "
        "reject/fix/validate verdict")


def main() -> None:
    import sys as _sys
    if hasattr(_sys.stdout, "reconfigure"):
        _sys.stdout.reconfigure(encoding="utf-8")  # Windows console (cp1252) fix
    db.init_db()
    job_id = "smoke" + uuid.uuid4().hex[:6]
    db.create_job(job_id, IDEA)

    orchestrator.run_job(job_id, IDEA)

    job = db.get_job(job_id)
    log = json.loads(job["events"] or "[]")
    print(f"\n=== events ({len(log)}) ===")
    for e in log:
        print(f"[{e['level']:7}] {e['agent']:12} {e['message'][:110]}")

    print("\n=== result ===")
    print(json.dumps(json.loads(job["result"]), indent=2, ensure_ascii=False))

    assert job["status"] == "completed", f"job status = {job['status']} error={job['error']}"
    result = json.loads(job["result"])
    assert result["verdict"] in ("VALIDATE", "FIX_FIRST", "REJECT")
    assert 0 <= result["score"] <= 100
    print("\nSMOKE TEST PASSED")


if __name__ == "__main__":
    main()
