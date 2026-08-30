"""Genesis CLI — `genesis` command (or `python cli.py`).

Commands:
  validate "IDEA"   Run a full validation (live events printed to terminal)
  serve             Start the web UI + API server (http://127.0.0.1:8787)
  result JOB_ID     Print a stored verdict report
  history           List past runs
  profile show      Show the user harness (context injected into agents)
  prompts show NAME Show an agent's editable prompt
  doctor            Provider/DB health check

Flags: --json (machine-readable), --mode mock|live, --provider NAME"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))  # safe against PYTHONSAFEPATH

if os.name == "nt":
    os.system("")  # enable ANSI colors on Windows 10+

GREEN, YELLOW, RED, CYAN, DIM, RESET, BOLD = (
    "\033[32m", "\033[33m", "\033[31m", "\033[36m", "\033[2m", "\033[0m", "\033[1m")

COLORS = {"info": RESET, "action": CYAN, "success": GREEN, "warn": YELLOW, "error": RED}


def _pre_setup(args: argparse.Namespace) -> None:
    if getattr(args, "mode", None):
        os.environ["GENESIS_MODE"] = args.mode
    if getattr(args, "provider", None):
        os.environ["GENESIS_PROVIDER"] = args.provider


def cmd_validate(args: argparse.Namespace) -> int:
    _pre_setup(args)
    from app import config  # noqa: E402  (import after env setup)
    from app.orchestration import events, orchestrator  # noqa: E402
    from app.store import db  # noqa: E402

    idea = args.idea.strip()
    if len(idea) < 12:
        print("Idea thora detail mein do (12+ characters).", file=sys.stderr)
        return 2

    db.init_db()
    job_id = orchestrator.start_job(idea)
    if not args.json:
        print(f"{DIM}job {job_id} · mode {config.MODE.upper()} · "
              f"llm {config.PROVIDER_NAME or 'unset'} · search {config.SEARCH_PROVIDER}{RESET}")

    import time
    deadline = time.time() + args.timeout
    sent = 0
    while time.time() < deadline:
        chunk, _ = events.get_events(job_id, after=sent)
        for evt in chunk:
            sent += 1
            if args.json:
                continue  # --json purity: stdout par sirf final JSON document
            color = COLORS.get(evt.get("level"), RESET)
            ts = (evt.get("ts") or "")[11:19]
            print(f"{DIM}{ts}{RESET} {color}{evt['agent']:<12}{RESET} {evt['message']}", file=sys.stderr)
        job = db.get_job(job_id)
        if job and job["status"] in ("completed", "failed"):
            if job["status"] == "failed":
                print(f"{RED}FAILED: {job.get('error')}{RESET}", file=sys.stderr)
                print(f"Resume with: genesis resume {job_id}", file=sys.stderr)
                return 5
            result = json.loads(job["result"])
            if args.json:
                print(json.dumps(result, indent=2, ensure_ascii=False))
            else:
                _print_report(result)
            return 0
        time.sleep(0.25)
    print("Timed out — job abhi bhi chal raha hai: genesis result " + job_id, file=sys.stderr)
    return 8


def _print_report(r: dict) -> None:
    verdict_colors = {"VALIDATE": GREEN, "FIX_FIRST": YELLOW, "REJECT": RED}
    color = verdict_colors.get(r["verdict"], RESET)
    print(f"\n{BOLD}{'=' * 62}{RESET}")
    print(f"{BOLD}VERDICT: {color}{r['verdict']}{RESET}   {BOLD}score: {r['score']}/100{RESET}")
    print(f"{'=' * 62}")
    bd = r.get("breakdown", {})
    for k, v in bd.items():
        print(f"  {k:<20} {v}")
    if r.get("audience"):
        print(f"\n{BOLD}Audience:{RESET} {r['audience']}")
    if r.get("monetization"):
        print(f"{BOLD}Monetization:{RESET} {r['monetization']}")
    for title, key in (("Strengths", "strengths"), ("Risks", "risks"),
                       ("Change suggestions", "change_suggestions"), ("Next steps", "next_steps")):
        items = r.get(key) or []
        if not items:
            continue
        print(f"\n{BOLD}{title}:{RESET}")
        for item in items:
            if isinstance(item, dict):
                print(f"  - [{item.get('severity', '?')}] {item.get('risk', item)}")
            else:
                print(f"  - {item}")
    ev = r.get("evidence_used") or {}
    print(f"\n{DIM}evidence: {ev.get('count', 0)} items, {ev.get('domain_diversity', 0)} domains{RESET}")


def cmd_serve(args: argparse.Namespace) -> int:
    _pre_setup(args)
    import uvicorn  # noqa: E402
    uvicorn.run("app.main:app", host=args.host, port=args.port, reload=False)
    return 0


def cmd_result(args: argparse.Namespace) -> int:
    from app.store import db  # noqa: E402
    db.init_db()
    job = db.get_job(args.job_id)
    if not job:
        print("Job not found", file=sys.stderr)
        return 2
    if not job.get("result"):
        print(f"Job is {job['status']} (stage {job['stage']})", file=sys.stderr)
        return 3
    print(job["result"] if args.json else json.dumps(json.loads(job["result"]), indent=2, ensure_ascii=False))
    return 0


def cmd_history(args: argparse.Namespace) -> int:
    from app.store import db  # noqa: E402
    db.init_db()
    rows = db.list_jobs(limit=50)
    if args.json:
        print(json.dumps(rows, indent=2, ensure_ascii=False))
        return 0
    if not rows:
        print("No runs yet.")
        return 0
    for r in rows:
        print(f"{r['id']}  {r['status']:<9} {r['created_at'][:16]}  {r['idea'][:58]}")
    return 0


def cmd_profile(args: argparse.Namespace) -> int:
    from app.core import user_profile  # noqa: E402
    if args.action == "show":
        print(json.dumps(user_profile.load(), indent=2, ensure_ascii=False))
        return 0
    print("Use the web UI (Profile harness) ya data/profile.yaml edit karo.", file=sys.stderr)
    return 0


def cmd_prompts(args: argparse.Namespace) -> int:
    from app import config  # noqa: E402
    path = config.PROMPTS_DIR / f"{args.name}.md"
    if not path.exists():
        print("Prompt not found (researcher | analyst | critic)", file=sys.stderr)
        return 2
    print(path.read_text(encoding="utf-8"))
    return 0


def cmd_resume(args: argparse.Namespace) -> int:
    from app.orchestration import orchestrator  # noqa: E402
    ok = orchestrator.resume_job(args.job_id)
    if not ok:
        print("Job not found", file=sys.stderr)
        return 3
    print("Resumed. Watch progress: genesis result " + args.job_id)
    return 0


def cmd_doctor(args: argparse.Namespace) -> int:
    from app.diagnosis import health  # noqa: E402
    import json as _json  # noqa: E402
    status = health()
    if args.json:
        print(_json.dumps(status, indent=2))
    else:
        for name, value in status.items():
            if isinstance(value, dict):
                ok = value.get("ok", value.get("reachable", value.get("enabled", True)))
                mark = f"{GREEN}OK{RESET}" if ok else f"{RED}DEGRADED{RESET}"
                extras = {k: v for k, v in value.items() if k not in ("ok", "reachable")}
                print(f"{name:<8} {mark}  {_json.dumps(extras, ensure_ascii=False)}")
            else:
                print(f"{name:<8} {value}")
    return 0


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")  # Windows console (cp1252) fix
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(prog="genesis",
                                     description="Genesis — AI idea validation engine")
    parser.add_argument("--version", action="version",
                        version=f"genesis {__import__('app').__version__}")
    parser.add_argument("--no-color", action="store_true", help="disable ANSI colors")
    sub = parser.add_subparsers(dest="command", required=True)

    p_val = sub.add_parser("validate", help="run a full idea validation")
    p_val.add_argument("idea")
    p_val.add_argument("--json", action="store_true", help="machine-readable output")
    p_val.add_argument("--mode", choices=["mock", "live"])
    p_val.add_argument("--provider", help="GENESIS_PROVIDER override (groq|openrouter|openai|ollama|custom)")
    p_val.add_argument("--timeout", type=float, default=600.0)
    p_val.set_defaults(func=cmd_validate)

    p_serve = sub.add_parser("serve", help="start web UI + API")
    p_serve.add_argument("--host", default="127.0.0.1")
    p_serve.add_argument("--port", type=int, default=8787)
    p_serve.add_argument("--mode", choices=["mock", "live"])
    p_serve.add_argument("--provider")
    p_serve.set_defaults(func=cmd_serve)

    p_res = sub.add_parser("result", help="print a stored verdict")
    p_res.add_argument("job_id")
    p_res.add_argument("--json", action="store_true")
    p_res.set_defaults(func=cmd_result)

    p_rsm = sub.add_parser("resume", help="resume a failed job from its checkpoint")
    p_rsm.add_argument("job_id")
    p_rsm.set_defaults(func=cmd_resume)

    p_hist = sub.add_parser("history", help="list past runs")
    p_hist.add_argument("--json", action="store_true")
    p_hist.set_defaults(func=cmd_history)

    p_prof = sub.add_parser("profile", help="user harness")
    p_prof.add_argument("action", choices=["show"])
    p_prof.set_defaults(func=cmd_profile)

    p_pr = sub.add_parser("prompts", help="show an editable agent prompt")
    p_pr.add_argument("name", choices=["researcher", "analyst", "critic"])
    p_pr.set_defaults(func=cmd_prompts)

    p_doc = sub.add_parser("doctor", help="provider/DB health check")
    p_doc.add_argument("--json", action="store_true")
    p_doc.set_defaults(func=cmd_doctor)

    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
