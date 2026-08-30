# Genesis - AI Idea Validation Engine

Idea do ? real web research ? evidence-backed analysis ? red-team critique ?
**VALIDATE / FIX_FIRST / REJECT** verdict (score 0-100, har claim cited).

**Version:** 0.2.0 � Python 3.11+ � FastAPI � Zero-dependency UI

> **No vendor lock, by construction.** Genesis speaks only the OpenAI-compatible chat
> protocol: Groq, OpenAI, OpenRouter, Ollama, vLLM, ya koi bhi self-hosted gateway -
> ek env var ka farq (`GENESIS_PROVIDER` + `LLM_BASE_URL`). Search bhi pluggable hai
> (Tavily, self-hosted SearXNG, ya mock). Koi vendor SDK nahi, koi vendor import nahi -
> har integration plain HTTP hai. Vendor badle ya gayab ho, to code nahi, environment
> badalta hai.

---

## Teen tareeqay (use it your way)

| Mode | Kab | Kaise |
|---|---|---|
| **Web UI** | Manual runs, reports dekhne ke liye | `python run.py` (ya `start.bat`) ? http://127.0.0.1:8787 |
| **CLI** | Terminal/automation, batch runs | `genesis validate "IDEA"` (ya `python cli.py validate "IDEA"`) |
| **SDK** | Apne agent orchestration mein embed | `from app.sdk import Genesis` (in-process) ya `RemoteGenesis` (server) |

### CLI

```bash
python cli.py validate "AI tool that validates startup ideas with cited reports" --mode mock
python cli.py validate "..." --json          # machine-readable (pipelines ke liye)
python cli.py serve --port 8787              # web UI + API
python cli.py history | result JOB_ID | doctor | profile show | prompts show analyst
```

### Python SDK (agent orchestration ke liye)

```python
# 1) In-process - bina server ke:
from app.sdk import Genesis
report = Genesis(mode="live").validate(
    "AI tool for X", on_event=lambda e: print(e["agent"], e["message"]))
print(report["verdict"], report["score"])

# 2) Remote - chalte server se (kisi bhi machine/language se possible):
from app.sdk import RemoteGenesis
report = RemoteGenesis("http://127.0.0.1:8787").validate("idea X")
```

Dono same report dict dete hain: `{score, verdict, breakdown, risks, change_suggestions, next_steps, evidence_used}`.

---

## Providers (no vendor lock)

| Layer | Env | Options |
|---|---|---|
| LLM (agents ka brain) | `GENESIS_PROVIDER` + `LLM_API_KEY` | `groq` � `openrouter` � `openai` � `ollama` (local, keyless) � `custom` (`LLM_BASE_URL`) |
| Model | `LLM_MODEL` | Koi bhi chat model jo endpoint par ho |
| JSON mode | `LLM_JSON_MODE` | `auto` (native, auto-fallback) � `force` � `off` |
| Search (evidence) | `SEARCH_PROVIDER` | `tavily` � `searxng` (self-hosted, free) � `mock` |
| STT (mic, optional) | `STT_ENABLED` + `STT_API_KEY`/`STT_BASE_URL` | Koi bhi Whisper-compatible `/audio/transcriptions` server |

Full schema: [.env.example](.env.example) (har var ka matlab likha hai).

---

## Run (3 steps)

```bash
cd genesis
pip install -r requirements.txt
python run.py          # ya: start.bat (double-click) | genesis serve
```

- **No keys? Koi masla nahi** - **MOCK mode** mein poora pipeline chalta hai
  (canned providers, real orchestration/scoring/UI). Badge top-right par mode dikhata hai.
- **Live mode:** `.env.example` ? `.env` bana kar keys daalo (LLM_API_KEY + TAVILY_API_KEY),
  restart - badge **LIVE**.
- Smoke test (bina server): `python smoke_test.py`

## API

```
POST /api/validate            {idea}          -> {job_id, mode}
GET  /api/stream/{job_id}     (SSE)           -> live events + done event
GET  /api/jobs | /jobs/{id}                   -> history / detail
POST /api/jobs/{id}/resume                    -> failed job ko checkpoint se continue
GET  /api/result/{id}                         -> final verdict JSON
GET/PUT /api/profile                          -> user harness
GET/PUT /api/prompts[/name]                   -> agent prompts (live-editable)
POST /api/stt                (audio file)     -> transcription
GET  /api/health                              -> provider/DB status
```

## Architecture

| Piece | File | Kaam |
|---|---|---|
| Orchestrator | `app/orchestration/orchestrator.py` | 5-stage pipeline, **checkpoint after every stage** |
| Event bus + SSE | `app/orchestration/events.py` | Live agent activity + history replay |
| Agents | `app/agents/` | Researcher, Analyst, Critic (prompts `app/agents/prompts/*.md`, UI-editable) |
| User harness | `data/profile.yaml` | Har agent ko context - naya idea, dobara intro nahi |
| Providers | `app/providers/` | LLM/search/STT - sab env-switchable, retry taxonomy ke saath |
| Verdict scoring | `app/core/verdict.py` | **Deterministic rubric** (demand/competition/evidence/feasibility ? risks) |
| Runtime diagnosis | `app/diagnosis.py` | Health checks, retry events, degraded-mode warnings |
| Job store | `app/store/db.py` | SQLite; failed jobs **resume from checkpoint** |
| SDK | `app/sdk.py` | `Genesis` (in-process) + `RemoteGenesis` (HTTP) |

## Use cases & audience

Detail: [docs/USE_CASES_AND_AUDIENCE.md](docs/USE_CASES_AND_AUDIENCE.md) - short version:

- **Abhi:** pre-seed founders (build/no-build gate), agencies ki discovery sprints, VC scouts ki deal triage, indie hackers ka kill test, accelerators ki application screening, SME PMs ki roadmap triage, hackathon teams.
- **Future:** continuous re-validation ("validation decay"), portfolio dashboards, outcome flywheel dataset (verdict?reality - asli moat), doosre agents ke liye `validate()` primitive, enterprise screening (compliance ke baad).
- **Ignore (abhi):** SOC2-maangne wale enterprises, ChatGPT-satisfied consumers, partner-level VC buyers, mass idea-spammers.

**Positioning:** *evidence-audited validation engine jo ideas ko cited, red-teamed, deterministic go/no-go decision mein badalta hai - sirf ek aur AI opinion nahi.*

## Modification guide

- **Prompts:** UI "Agent prompts" ya `app/agents/prompts/*.md`
- **Apna context:** UI "Profile harness" ya `data/profile.yaml`
- **Provider/model:** `.env` (`GENESIS_PROVIDER`, `LLM_MODEL`, `LLM_BASE_URL`) - code nahi
- **Scoring:** `app/core/verdict.py` + `.env` thresholds
- **Naya agent:** `app/agents/` class + prompt file, orchestrator stage add
- **UI style:** `web/style.css` tokens
- **Deploy (Render):** build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, env vars add

## Quality coverage

- Live SSE feed (auto-reconnect), stage progress, agent badges, mic (optional, health-driven)
- Failure path: retry taxonomy (transport/429/5xx retry; 4xx fast-fail with provider error) ? job failed + Resume
- JSON-mode auto-fallback (provider reject ? prompt-only, ek dafa, retry slot waste nahi)
- Keyless providers supported (Ollama/local vLLM: koi Bearer header nahi bheja jata)
- Input validation, 404/409/413, UI empty/running/failed/completed states, responsive layout
- Mock mode: poora system bina keys testable (`python smoke_test.py`)
