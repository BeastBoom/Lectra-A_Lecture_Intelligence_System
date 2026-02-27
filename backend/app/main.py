"""
Lectra FastAPI application entrypoint.
"""
from __future__ import annotations

import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"  # Fix OpenMP conflict (PyTorch + Anaconda numpy)

import threading
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.upload import router as upload_router
from app.api.jobs import router as jobs_router
from app.api.audios import router as audios_router
from app.api.results import router as results_router
from app.api.dashboard import router as dashboard_router
from app.api.documents import router as documents_router
from app.api.auth import router as auth_router

logger = logging.getLogger(__name__)

# ── Background worker thread ─────────────────────────────────────────────────
_worker_stop = threading.Event()


def _run_worker_poller():
    """Run the job poller loop in a background thread."""
    from app.workers.worker_poller import process_one
    import time

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
    # Startup: launch the worker poller in a daemon thread
    worker_thread = threading.Thread(target=_run_worker_poller, daemon=True, name="worker-poller")
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

# CORS — permissive for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


@app.get("/", tags=["Health"])
async def health_check() -> dict:
    return {"status": "ok", "service": "lectra-backend"}

