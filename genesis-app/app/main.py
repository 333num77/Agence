"""Genesis - AI-native idea validation engine (wedge v0.1)."""
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .api.routes import router
from .store import db

app = FastAPI(title="Genesis Engine", version="0.1.0")
app.include_router(router)

WEB_DIR = Path(__file__).resolve().parent.parent / "web"

@app.on_event("startup")
def startup() -> None:
    db.init_db()


@app.get("/")
def index():
    return FileResponse(WEB_DIR / "index.html")


app.mount("/static", StaticFiles(directory=WEB_DIR), name="static")
