"""User profile harness: persistent context injected into every agent run,
so the user never re-explains themselves on a new idea."""
from pathlib import Path
import threading

import yaml

from .. import config

_lock = threading.Lock()

DEFAULT_PROFILE = {
    "name": "Founder",
    "background": "Solo builder, ships with AI coding tools (vibe coder).",
    "skills": ["AI-assisted development", "product thinking"],
    "budget": "Bootstrap; prefer free tiers until first paying user",
    "target_market": "Global English-speaking, price-sensitive early adopters",
    "goals": "Validate ideas fast, ship a wedge in days not months",
    "constraints": ["Limited time (evenings)", "Minimal upfront cost"],
    "preferences": "Evidence-backed decisions, honest rejection over politeness",
}

_TEMPLATE_COMMENT = """# Genesis user profile (harness)
# Injected into every agent run. Edit here or from the UI (Profile button).
# Fields are free-form; agents read all of them.
"""


def profile_path() -> Path:
    return config.PROFILE_PATH


def load() -> dict:
    if not config.PROFILE_PATH.exists():
        save(DEFAULT_PROFILE)
    return yaml.safe_load(config.PROFILE_PATH.read_text(encoding="utf-8"))


def save(profile: dict) -> None:
    with _lock:
        config.PROFILE_PATH.parent.mkdir(parents=True, exist_ok=True)
        config.PROFILE_PATH.write_text(
            _TEMPLATE_COMMENT + yaml.safe_dump(profile, allow_unicode=True, sort_keys=False),
            encoding="utf-8",
        )


def render_context(profile: dict | None = None) -> str:
    p = profile or load()
    lines = []
    for key, value in p.items():
        if isinstance(value, list):
            value = "; ".join(str(v) for v in value)
        lines.append(f"- {key}: {value}")
    return "\n".join(lines)
