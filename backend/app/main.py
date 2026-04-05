"""
Lectra FastAPI application entrypoint.
"""
from __future__ import annotations

import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"  # Fix OpenMP conflict (PyTorch + Anaconda numpy)

import logging
import threading
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ── Logging — configured once, at the entrypoint ─────────────────────────────
logging.basicConfig(
    level=logging.WARNING,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logging.getLogger("app").setLevel(logging.INFO)

logger = logging.getLogger(__name__)
_start_time = time.monotonic()

from app.api.upload import router as upload_router
from app.api.jobs import router as jobs_router
from app.api.audios import router as audios_router
from app.api.results import router as results_router
from app.api.dashboard import router as dashboard_router
from app.api.documents import router as documents_router
from app.api.auth import router as auth_router
from app.api.subjects import router as subjects_router

# ── CORS origins — never use "*" with credentials (browser blocks it) ────────
_raw_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:8000,https://lectra-a-lecture-intelligence-syste.vercel.app",
)
CORS_ORIGINS: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]

# ── Background worker thread ─────────────────────────────────────────────────
_worker_stop = threading.Event()


def _run_worker_poller():
    """Run the job poller loop in a background thread."""
    from app.workers.worker_poller import process_one

    logger.info("Background worker poller started")
    while not _worker_stop.is_set():
        try:
            did_work = process_one()
            if not did_work:
                _worker_stop.wait(timeout=2.0)
        except Exception as exc:
            logger.error(f"Worker poller error: {exc}")
            _worker_stop.wait(timeout=2.0)
    logger.info("Background worker poller stopped")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Validate required env vars at startup
    from app.configs import validate_config
    validate_config()

    # Startup: launch the worker poller in a daemon thread
    worker_thread = threading.Thread(
        target=_run_worker_poller, daemon=True, name="worker-poller"
    )
    worker_thread.start()
    logger.info("Worker poller thread launched")
    yield
    # Shutdown: signal the worker to stop
    _worker_stop.set()
    worker_thread.join(timeout=5)
    logger.info("Worker poller thread joined")


app = FastAPI(
    title="Lectra — Audio Processing Backend",
    version="0.2.0",
    description="Local-first audio processing pipeline for lecture recordings.",
    lifespan=lifespan,
)


# ── Global exception handler — all unhandled errors return structured JSON ────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Unhandled error on {request.method} {request.url.path}: {exc}",
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "An internal server error occurred.",
            "detail": str(exc),
        },
    )


# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(upload_router, prefix="/api", tags=["Upload"])
app.include_router(jobs_router, prefix="/api", tags=["Jobs"])
app.include_router(audios_router, prefix="/api", tags=["Audios"])
app.include_router(results_router, prefix="/api", tags=["Results"])
app.include_router(dashboard_router, prefix="/api", tags=["Dashboard"])
app.include_router(documents_router, prefix="/api", tags=["Documents"])
app.include_router(auth_router, prefix="/api", tags=["Auth"])
app.include_router(subjects_router, prefix="/api", tags=["Subjects"])


@app.get("/", tags=["Health"])
async def health_check() -> dict:
    return {
        "status": "ok",
        "service": "lectra-backend",
        "version": app.version,
        "uptime_seconds": round(time.monotonic() - _start_time, 1),
    }
