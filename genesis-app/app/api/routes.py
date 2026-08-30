"""REST + SSE API for the Genesis UI."""
import asyncio
import json

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .. import config
from ..core import user_profile
from ..orchestration import events, orchestrator
from ..providers import stt
from ..store import db
from ..diagnosis import health

router = APIRouter(prefix="/api")


class IdeaIn(BaseModel):
    idea: str


class ProfileIn(BaseModel):
    profile: dict


class PromptIn(BaseModel):
    content: str


@router.post("/validate")
def start_validation(body: IdeaIn):
    idea = (body.idea or "").strip()
    if len(idea) < 12:
        raise HTTPException(400, "Idea is too short (min 12 characters) - describe the problem and your solution in one line.")
    job_id = orchestrator.start_job(idea)
    return {"job_id": job_id, "mode": config.MODE}


@router.get("/stream/{job_id}")
async def stream(job_id: str):
    if not db.get_job(job_id):
        raise HTTPException(404, "Job not found")
    events.hydrate(job_id)

    async def gen():
        sent = 0
        idle = 0
        while True:
            chunk, total = events.get_events(job_id, after=sent)
            for evt in chunk:
                sent += 1
                idle = 0
                yield f"data: {json.dumps(evt, ensure_ascii=False)}\n\n"
            job = db.get_job(job_id)
            if job and job["status"] in ("completed", "failed") and sent >= total:
                yield f"event: done\ndata: {json.dumps({'status': job['status'], 'job_id': job_id})}\n\n"
                return
            idle += 1
            if idle > 2400:  # ~12 min idle safety cutoff (live retries can pause events)
                return
            await asyncio.sleep(0.3)

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.get("/jobs")
def jobs():
    return db.list_jobs()


@router.get("/jobs/{job_id}")
def job_detail(job_id: str):
    job = db.get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@router.post("/jobs/{job_id}/resume")
def resume(job_id: str):
    ok = orchestrator.resume_job(job_id)
    if not ok:
        raise HTTPException(404, "Job not found")
    return {"resumed": True, "job_id": job_id}


@router.get("/result/{job_id}")
def result(job_id: str):
    job = db.get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if not job.get("result"):
        raise HTTPException(409, f"Job is {job['status']}")
    return json.loads(job["result"])


@router.get("/profile")
def get_profile():
    return user_profile.load()


@router.put("/profile")
def put_profile(body: ProfileIn):
    user_profile.save(body.profile)
    return {"saved": True}


@router.get("/prompts")
def get_prompts():
    return {p.stem: p.read_text(encoding="utf-8") for p in sorted(config.PROMPTS_DIR.glob("*.md"))}


@router.put("/prompts/{name}")
def put_prompt(name: str, body: PromptIn):
    path = config.PROMPTS_DIR / f"{name}.md"
    if not path.exists():
        raise HTTPException(404, "Prompt not found")
    path.write_text(body.content, encoding="utf-8")
    return {"saved": True, "note": "Applies to the next run - no restart needed"}


@router.post("/stt")
async def speech_to_text(file: UploadFile = File(...)):
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(413, "Audio too large (max 20MB)")
    try:
        return stt.transcribe(file.filename, content, file.content_type or "audio/webm")
    except Exception as exc:
        raise HTTPException(502, f"STT failed: {exc}")


@router.get("/health")
def health_check():
    return health()
