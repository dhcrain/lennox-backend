from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import load_config
from app.connections import ConnectionManager
from app.routes import router, ws_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
_LOGGER = logging.getLogger("lennox_backend.main")

STATIC_DIR = Path(__file__).parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.config = load_config()
    app.state.manager = ConnectionManager(app.state.config.units)
    app.state.manager.start_all()
    yield
    await app.state.manager.stop_all()


app = FastAPI(title="Lennox E30 Backend", lifespan=lifespan)
app.include_router(router)
app.include_router(ws_router)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, dict) else {"code": "error", "message": str(exc.detail)}
    return JSONResponse(status_code=exc.status_code, content={"error": detail})


@app.get("/health")
def health():
    return {"status": "ok"}


if STATIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
else:
    _LOGGER.warning("app/static not found — run `npm run build` in frontend/ to serve the UI")
