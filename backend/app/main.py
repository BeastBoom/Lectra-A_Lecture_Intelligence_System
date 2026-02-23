"""
Lectra FastAPI application entrypoint.
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.upload import router as upload_router
from app.api.jobs import router as jobs_router
from app.api.audios import router as audios_router
from app.api.results import router as results_router
from app.api.dashboard import router as dashboard_router
from app.api.documents import router as documents_router

app = FastAPI(
    title="Lectra — Audio Processing Backend",
    version="0.2.0",
    description="Local-first audio processing pipeline for lecture recordings.",
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


@app.get("/", tags=["Health"])
async def health_check() -> dict:
    return {"status": "ok", "service": "lectra-backend"}
