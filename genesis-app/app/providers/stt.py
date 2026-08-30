"""Speech-to-text via Groq Whisper (optional feature). Future: TTS here too.

STT is deliberately optional: missing key = feature disabled, pipeline unaffected."""
from .. import config


def transcribe(filename: str, content: bytes, mime: str = "audio/webm") -> dict:
    if config.MODE == "mock":
        return {"text": "A tool that turns messy startup ideas into evidence-backed validation reports",
                "mock": True}
    if not config.STT_ENABLED:
        raise RuntimeError("STT disabled: set STT_API_KEY (ya STT_ENABLED=1 for keyless local server)")

    import httpx
    r = httpx.post(
        f"{config.STT_BASE}/audio/transcriptions",
        headers={"Authorization": f"Bearer {config.STT_API_KEY}"},
        files={"file": (filename or "audio.webm", content, mime)},
        data={"model": config.STT_MODEL, "response_format": "json"},
        timeout=120,
    )
    r.raise_for_status()
    return {"text": r.json().get("text", "")}


# Future TTS hook (wire here when your provider ships TTS):
# def speak(text: str) -> bytes: ...
