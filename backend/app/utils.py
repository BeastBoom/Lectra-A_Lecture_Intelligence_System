"""
Shared utilities for the Lectra backend.
"""
from __future__ import annotations

import os
import shutil
import uuid
from pathlib import Path

from app.configs import TMP_DIR


def generate_uuid() -> str:
    """Generate a new UUID-4 string."""
    return str(uuid.uuid4())


def ensure_tmp_dir(audio_id: str) -> Path:
    """Create and return a temp directory for a given audio_id inside backend/tmp/."""
    d = TMP_DIR / audio_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def cleanup_tmp_dir(audio_id: str) -> None:
    """Remove the temp directory for a given audio_id."""
    d = TMP_DIR / audio_id
    if d.exists():
        shutil.rmtree(d, ignore_errors=True)


def safe_filename(filename: str) -> str:
    """Sanitise a user-provided filename (keep only basename)."""
    return os.path.basename(filename)


def file_extension(filename: str) -> str:
    """Return lowercased file extension including the dot, e.g. '.mp3'."""
    return Path(filename).suffix.lower()
