"""Central config. Reads .env (if present) from project root; env vars win.

Vendor-lock guarantee: every external provider (LLM, search, STT) is selected via
env presets. Any OpenAI-compatible endpoint works for the LLM (Groq, OpenRouter,
OpenAI, Ollama, vLLM, LM Studio, ...). Swap = env change, zero code change."""
import os
from pathlib import Path
from urllib.parse import urlparse

BASE_DIR = Path(__file__).resolve().parent.parent


def _load_dotenv() -> None:
    env_file = BASE_DIR / ".env"
    if not env_file.exists():
        return
    for raw in env_file.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


_load_dotenv()

# ── LLM provider (OpenAI-compatible standard) ────────────────────────────────
PROVIDER_PRESETS: dict[str, dict] = {
    "groq": {"base_url": "https://api.groq.com/openai/v1",
             "default_model": "llama-3.3-70b-versatile", "keyless": False},
    "openrouter": {"base_url": "https://openrouter.ai/api/v1",
                   "default_model": "meta-llama/llama-3.3-70b-instruct", "keyless": False},
    "openai": {"base_url": "https://api.openai.com/v1",
               "default_model": "gpt-4o-mini", "keyless": False},
    "ollama": {"base_url": "http://127.0.0.1:11434/v1",
               "default_model": "llama3.1:8b", "keyless": True},
    "custom": {"base_url": "", "default_model": "", "keyless": True},
}


def _resolve_provider() -> tuple[str, str, str, str]:
    """Resolve (name, base_url, api_key, model). Env overrides presets.

    Vendor-neutral rule: LLM_API_KEY alone NEVER implies a vendor endpoint.
    Only GROQ_API_KEY implies the groq preset (legacy compatibility)."""
    name = os.getenv("GENESIS_PROVIDER", "").strip().lower()
    llm_key = os.getenv("LLM_API_KEY", "").strip()
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    base_override = os.getenv("LLM_BASE_URL", "").strip()

    if not name:
        if groq_key:
            name = "groq"
        elif base_override:
            name = "custom"
        elif llm_key:
            raise SystemExit(
                "Genesis config error: LLM_API_KEY set but no endpoint. "
                "Set GENESIS_PROVIDER (groq|openrouter|openai|ollama|custom) "
                "or LLM_BASE_URL. (LLM_API_KEY alone never implies a vendor.)")

    preset = PROVIDER_PRESETS.get(name, {})
    base_url = base_override or preset.get("base_url", "")
    # Model compat chain: LLM_MODEL > GROQ_MODEL (legacy) > preset default
    model = os.getenv("LLM_MODEL", "").strip() or os.getenv("GROQ_MODEL", "").strip() \
        or preset.get("default_model", "")
    # Key resolution: canonical LLM_API_KEY wins; GROQ_API_KEY valid for groq preset
    api_key = llm_key or (groq_key if name == "groq" else "")
    return name, base_url, api_key, model


PROVIDER_NAME, LLM_BASE_URL, LLM_API_KEY, LLM_MODEL = _resolve_provider()

# ── Fail-fast structural validation (actionable messages, at import) ─────────
_config_errors: list[str] = []
if PROVIDER_NAME == "custom" and not LLM_BASE_URL:
    _config_errors.append("GENESIS_PROVIDER=custom requires LLM_BASE_URL")
if PROVIDER_NAME not in PROVIDER_PRESETS and PROVIDER_NAME:
    _config_errors.append(f"Unknown GENESIS_PROVIDER '{PROVIDER_NAME}' "
                          f"(valid: {', '.join(PROVIDER_PRESETS)})")
LLM_JSON_MODE = os.getenv("LLM_JSON_MODE", "auto").strip().lower()  # auto|force|off
if LLM_JSON_MODE not in ("auto", "force", "off"):
    _config_errors.append(f"LLM_JSON_MODE must be auto|force|off (got '{LLM_JSON_MODE}')")
    LLM_JSON_MODE = "auto"
if _config_errors:
    raise SystemExit("Genesis config error(s):\n  - " + "\n  - ".join(_config_errors))

# Native JSON: 'force' always; 'auto' tries native once and falls back at
# runtime on provider rejection (see providers/llm.py); 'off' never sends it.
USE_NATIVE_JSON = LLM_JSON_MODE != "off"
LLM_TIMEOUT = float(os.getenv("LLM_TIMEOUT", "90"))

# ── Search provider (tavily | searxng | mock) ────────────────────────────────
SEARCH_PROVIDER = os.getenv("SEARCH_PROVIDER", "tavily").strip().lower()
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "").strip()
TAVILY_BASE_URL = os.getenv("TAVILY_BASE_URL", "https://api.tavily.com/search").strip()
SEARXNG_BASE = os.getenv("SEARXNG_BASE_URL", "").strip().rstrip("/")
SEARCH_API_KEY = os.getenv("SEARCH_API_KEY", "").strip()  # optional Bearer for either provider
SEARCH_RESULTS = int(os.getenv("SEARCH_RESULTS", "6"))
SEARCH_OK = (SEARCH_PROVIDER == "mock"
             or (SEARCH_PROVIDER == "tavily" and bool(TAVILY_API_KEY))
             or (SEARCH_PROVIDER == "searxng" and bool(SEARXNG_BASE)))

# ── Speech-to-text (optional feature; any /audio/transcriptions server) ─────
STT_API_KEY = os.getenv("STT_API_KEY", "").strip() or os.getenv("GROQ_API_KEY", "").strip()
STT_BASE = os.getenv("STT_BASE_URL", "https://api.groq.com/openai/v1").strip().rstrip("/")
STT_MODEL = os.getenv("STT_MODEL", "whisper-large-v3")
_stt_flag = os.getenv("STT_ENABLED", "auto").strip().lower()
STT_ENABLED = {"auto": bool(STT_API_KEY) or "STT_BASE_URL" in os.environ,
               "1": True, "0": False}.get(_stt_flag, bool(STT_API_KEY))
_stt_host = urlparse(STT_BASE).netloc or "unknown"
STT_PROVIDER_LABEL = f"whisper@{_stt_host}" if "groq" in _stt_host else f"whisper-compat@{_stt_host}"

# ── Verdict thresholds ────────────────────────────────────────────────────────
THRESHOLD_VALIDATE = int(os.getenv("THRESHOLD_VALIDATE", "70"))
THRESHOLD_FIX_FIRST = int(os.getenv("THRESHOLD_FIX_FIRST", "45"))

# ── Global mode: live iff an endpoint exists AND (key present OR preset keyless)
_mode_env = os.getenv("GENESIS_MODE", "").strip().lower()
_keyless_ok = PROVIDER_PRESETS.get(PROVIDER_NAME, {}).get("keyless", False)
if _mode_env == "mock":
    MODE = "mock"
elif _mode_env == "live":
    MODE = "live"
else:
    MODE = "live" if (LLM_BASE_URL and (LLM_API_KEY or _keyless_ok)) else "mock"

DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "genesis.db"
PROMPTS_DIR = Path(__file__).resolve().parent / "agents" / "prompts"
PROFILE_PATH = DATA_DIR / "profile.yaml"

DATA_DIR.mkdir(parents=True, exist_ok=True)


def provider_summary() -> dict:
    """Safe description of active providers (never exposes keys)."""
    return {
        "mode": MODE,
        "llm": {"provider": PROVIDER_NAME or "unset", "base_url": LLM_BASE_URL,
                "model": LLM_MODEL, "native_json": USE_NATIVE_JSON,
                "key_present": bool(LLM_API_KEY),
                "ok": MODE == "mock" or bool(LLM_BASE_URL)},
        "search": {"provider": SEARCH_PROVIDER,
                   "key_present": bool(TAVILY_API_KEY) if SEARCH_PROVIDER == "tavily" else None,
                   "ok": MODE == "mock" or SEARCH_OK or SEARCH_PROVIDER == "mock"},
        "stt": {"provider": STT_PROVIDER_LABEL, "enabled": STT_ENABLED or MODE == "mock"},
    }
