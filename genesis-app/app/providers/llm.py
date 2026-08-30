"""LLM provider: any OpenAI-compatible endpoint (Groq, OpenRouter, OpenAI,
Ollama, vLLM, LM Studio, ...) via env presets - no vendor lock.

Retry taxonomy: transport errors / 429 (Retry-After honored) / 5xx are retried;
4xx fails fast with the provider's own error surfaced. JSON-mode 'auto' falls
back from native response_format to prompt-only on the first provider rejection
(without consuming a normal retry slot)."""
import json
import re
import threading

import httpx

from .. import config
from ..orchestration import events

_RETRIES = 2
_native_json_disabled = threading.Event()  # flipped when a provider rejects response_format


def _use_native_json() -> bool:
    if config.LLM_JSON_MODE == "force":
        return True
    if config.LLM_JSON_MODE == "off" or _native_json_disabled.is_set():
        return False
    return config.USE_NATIVE_JSON


def chat(job_id: str, stage: str, agent: str, system: str, user: str,
         json_mode: bool = True, temperature: float = 0.4) -> dict | str:
    if config.MODE == "mock":
        return _mock(agent, user)
    if not config.LLM_BASE_URL:
        raise RuntimeError("LLM base URL is not configured (set GENESIS_PROVIDER or LLM_BASE_URL)")

    headers: dict = {}
    if config.LLM_API_KEY:  # keyless providers (Ollama/vLLM) get no Bearer at all
        headers["Authorization"] = f"Bearer {config.LLM_API_KEY}"

    def _payload(native_json: bool) -> dict:
        messages = [
            {"role": "system", "content": f"{system}\n\n[AGENT:{agent}]"},
            {"role": "user", "content": user},
        ]
        if json_mode and not native_json:
            messages[1]["content"] += ("\n\nReturn ONLY a single valid JSON object. "
                                       "No prose, no markdown fences.")
        payload: dict = {"model": config.LLM_MODEL, "messages": messages,
                         "temperature": temperature}
        if json_mode and native_json:
            payload["response_format"] = {"type": "json_object"}
        return payload

    last_err: Exception | None = None
    attempt = 0
    native = _use_native_json() if json_mode else False
    while attempt <= _RETRIES:
        try:
            r = httpx.post(f"{config.LLM_BASE_URL}/chat/completions",
                           headers=headers, json=_payload(native),
                           timeout=config.LLM_TIMEOUT)
            # Provider rejected native JSON mode ? reshape once, retry immediately
            if (native and r.status_code in (400, 422) and "response_format"
                    in json.dumps(_payload(native))):
                _native_json_disabled.set()
                native = False
                events.emit(job_id, stage, agent,
                            "Provider rejected native JSON mode - falling back to "
                            "prompt-only JSON (one-time, not counted as failure)",
                            level="warn")
                continue
            if r.status_code >= 400:
                body = r.text[:160].replace("\n", " ")
                raise RuntimeError(f"{config.PROVIDER_NAME or 'provider'} HTTP {r.status_code}: {body}")
            data = r.json()
            content = ((data.get("choices") or [{}])[0].get("message") or {}).get("content")
            if content is None or content == "":
                err = data.get("error") or {}
                raise RuntimeError(f"empty completion: {str(err)[:160] or data}")
            if not json_mode:
                return content
            return _safe_json(content)
        except httpx.HTTPStatusError:
            raise  # not used (raise_for_status not called), kept for clarity
        except RuntimeError as exc:
            # 4xx-class provider errors are terminal; others may be retried
            msg = str(exc)
            if re.search(r"HTTP 4\d\d", msg) and "HTTP 429" not in msg:
                events.emit(job_id, stage, agent, f"LLM call failed: {msg}", level="error")
                raise
            last_err = exc
            attempt += 1
            if attempt <= _RETRIES:
                events.emit(job_id, stage, agent,
                            f"LLM call failed (attempt {attempt}/{_RETRIES + 1}): {msg} - retrying",
                            level="warn")
        except Exception as exc:  # transport errors, timeouts, JSON decode
            last_err = exc
            attempt += 1
            if attempt <= _RETRIES:
                events.emit(job_id, stage, agent,
                            f"LLM call failed (attempt {attempt}/{_RETRIES + 1}): {exc} - retrying",
                            level="warn")
    raise RuntimeError(f"LLM provider unavailable ({config.PROVIDER_NAME or 'unset'}): {last_err}")


def _safe_json(content: str) -> dict:
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


def _mock(agent: str, user: str) -> dict:
    """Deterministic canned responses shaped exactly like the real prompts demand."""
    if agent == "researcher":
        tail = user.split("IDEA:", 1)[-1]
        words = [w for w in re.findall(r"[a-zA-Z]{4,}", tail)][:4] or ["idea", "market", "tool"]
        base = " ".join(words[:3])
        return {"queries": [
            f"{base} demand evidence 2026",
            f"{base} competitors pricing",
            f"{base} user complaints reddit",
            f"{base} market size",
        ]}
    if agent == "analyst":
        seed = len(user) % 5
        return {
            "demand_signals": [
                {"claim": "Users actively complain about existing solutions", "evidence_ids": ["E1", "E2"]},
                {"claim": "Search interest and tool roundups show an active category", "evidence_ids": ["E3"]},
            ],
            "competition": {"exists": True,
                            "players": ["Incumbent tool A", "Incumbent tool B", "Free alternative C"],
                            "evidence_ids": ["E2", "E4"]},
            "audience": "Solo builders and small product teams",
            "monetization": "Freemium + usage credits; $9-29/mo band",
            "feasibility": {"score": 6 + seed % 3, "notes": "Solo builder can ship the wedge with AI tooling"},
            "strengths": ["Clear pain point in existing workflows", "Audience reachable via communities"],
        }
    if agent == "critic":
        return {
            "risks": [
                {"severity": "high", "risk": "Differentiation vs free LLM chat is unproven; must show evidence-audit value",
                 "evidence_ids": ["E5"]},
                {"severity": "medium", "risk": "Acquisition cost may exceed early ARPU at low prices"},
                {"severity": "low", "risk": "Category hype may fade before launch"},
            ],
            "fatal": [],
            "change_suggestions": [
                "Narrow the wedge to one audience and one workflow",
                "Lead with the evidence/audit trail as the paid differentiator",
            ],
            "rejection_reason": None,
        }
    raise NotImplementedError(f"no mock response defined for agent '{agent}'")
