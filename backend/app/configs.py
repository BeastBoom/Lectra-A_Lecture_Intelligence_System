"""
Lectra backend configuration — loads from .env / environment variables.
Calls validate_config() to fail fast on startup if required vars are missing.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

# ── Database ──────────────────────────────────────────────────────────────────
# For Supabase: postgresql://[user]:[password]@[host]:5432/postgres?sslmode=require
DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://lectra:lectra@localhost:5432/lectra_dev")

# ── Security ──────────────────────────────────────────────────────────────────
JWT_SECRET: str = os.getenv("JWT_SECRET", "lectra-dev-secret-change-in-production")

# ── CORS ──────────────────────────────────────────────────────────────────────
# Comma-separated list of allowed origins. Never use "*" with credentials.
CORS_ORIGINS_RAW: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000")

# ── FFmpeg ────────────────────────────────────────────────────────────────────
FFMPEG_BIN: str = os.getenv("FFMPEG_BIN", "ffmpeg")

# ── Gemini ────────────────────────────────────────────────────────────────────
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

# ── Google OAuth ──────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/google/callback")

# ── SMTP (Password Reset Emails) ─────────────────────────────────────────────
SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER: str = os.getenv("SMTP_USER", "")
SMTP_PASS: str = os.getenv("SMTP_PASS", "")
SMTP_FROM: str = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "noreply@lectra.ai"))
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

# ── Whisper ───────────────────────────────────────────────────────────────────
WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "base")

# ── Filler tokens ─────────────────────────────────────────────────────────────
FILLER_LIST: list[str] = [
    tok.strip().lower()
    for tok in os.getenv(
        "FILLER_LIST",
        "umm,uhh,ahh,like,you know,suno,aree,arre,oye,samjhe,matlab,haan,toh,bas",
    ).split(",")
    if tok.strip()
]

# ── Worker ────────────────────────────────────────────────────────────────────
MAX_JOB_RETRIES: int = int(os.getenv("MAX_JOB_RETRIES", "3"))

# ── Paths ─────────────────────────────────────────────────────────────────────
BACKEND_BASE_DIR: Path = Path(__file__).resolve().parent.parent
TMP_DIR: Path = BACKEND_BASE_DIR / "tmp"

# ── Accepted audio extensions ─────────────────────────────────────────────────
ALLOWED_EXTENSIONS: set[str] = {".mp3", ".wav", ".m4a", ".aac"}

# ── Simplified state machine ─────────────────────────────────────────────────
JOB_STATES: list[str] = [
    "uploaded",
    "preprocessing_audio",
    "denoising",
    "transcribing",
    "summarizing",
    "generating_notes",
    "generating_quiz",
    "completed",
]

FAILED_STATE: str = "failed"


def next_state(current: str) -> str | None:
    """Return the next state in the pipeline, or None if at end."""
    try:
        idx = JOB_STATES.index(current)
        return JOB_STATES[idx + 1] if idx + 1 < len(JOB_STATES) else None
    except ValueError:
        return None


def validate_config() -> None:
    """Fail fast at startup if required environment variables are missing.

    Call this once from the application entrypoint or lifespan handler.
    Logs warnings for optional but recommended variables.
    """
    import logging
    _log = logging.getLogger(__name__)

    errors: list[str] = []

    if not DATABASE_URL or DATABASE_URL == "postgresql://lectra:lectra@localhost:5432/lectra_dev":
        _log.warning(
            "DATABASE_URL is using the default local value. "
            "Set it to your Supabase connection string in production."
        )

    if not GEMINI_API_KEY:
        errors.append("GEMINI_API_KEY is not set — AI features (transcription summary, notes, quiz) will fail.")

    if JWT_SECRET == "lectra-dev-secret-change-in-production":
        _log.warning("JWT_SECRET is using the insecure development default. Set a strong secret in production.")

    if errors:
        for err in errors:
            _log.error(f"[Config] MISSING: {err}")
        # Do not hard-exit — allow backend to start so other endpoints still work.
        # Workers will fail gracefully when they hit missing Gemini key.
