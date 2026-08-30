#!/usr/bin/env python
"""Genesis CLI shim — `python cli.py <command>` (same as the installed `genesis` command)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.cli import main  # noqa: E402

if __name__ == "__main__":
    sys.exit(main())
