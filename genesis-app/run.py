import sys
from pathlib import Path

# AutoClaw's bundled Python sets PYTHONSAFEPATH — add project root explicitly
sys.path.insert(0, str(Path(__file__).resolve().parent))

import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8787, reload=False)
