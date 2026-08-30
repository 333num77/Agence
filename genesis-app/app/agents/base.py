"""Agent harness: prompts load from editable files at call time (UI edits apply
to the next run without restart), and the user profile is injected as context."""
from pathlib import Path

from .. import config
from ..core import user_profile


class Agent:
    name = "agent"
    prompt_file = ""

    def system_prompt(self) -> str:
        path: Path = config.PROMPTS_DIR / self.prompt_file
        body = path.read_text(encoding="utf-8")
        return f"[AGENT:{self.name}]\n{body}"

    def user_context(self) -> str:
        return user_profile.render_context()
