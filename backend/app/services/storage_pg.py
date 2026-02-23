"""
Postgres bytea blob storage service.

All audio artifacts are stored as bytea in the `artifacts` table.
When a worker needs to operate on a blob it is written to a temp file,
processed, then the result is saved back and the temp file removed.
"""
from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.configs import DATABASE_URL, TMP_DIR
from app.db.models import Artifact


_engine = create_engine(DATABASE_URL)


# ── public API ────────────────────────────────────────────────────────────────

def save_artifact(
    audio_id: str | uuid.UUID,
    artifact_type: str,
    file_path: str | Path,
    original_start: float | None = None,
    extra: dict[str, Any] | None = None,
) -> str:
    """Read bytes from *file_path* and INSERT into ``artifacts`` as bytea.

    Returns the new artifact id (str).
    """
    data = Path(file_path).read_bytes()
    art = Artifact(
        audio_id=uuid.UUID(str(audio_id)),
        artifact_type=artifact_type,
        data=data,
        original_start=original_start,
        extra=extra or {},
    )
    with Session(_engine) as session:
        session.add(art)
        session.commit()
        aid = str(art.id)
    return aid


def save_artifact_bytes(
    audio_id: str | uuid.UUID,
    artifact_type: str,
    data: bytes,
    original_start: float | None = None,
    extra: dict[str, Any] | None = None,
) -> str:
    """Save raw bytes directly (without reading from file)."""
    art = Artifact(
        audio_id=uuid.UUID(str(audio_id)),
        artifact_type=artifact_type,
        data=data,
        original_start=original_start,
        extra=extra or {},
    )
    with Session(_engine) as session:
        session.add(art)
        session.commit()
        aid = str(art.id)
    return aid


def get_artifact(artifact_id: str | uuid.UUID) -> dict[str, Any] | None:
    """Return artifact bytes + metadata, or None."""
    with Session(_engine) as session:
        art = session.get(Artifact, uuid.UUID(str(artifact_id)))
        if art is None:
            return None
        return {
            "id": str(art.id),
            "audio_id": str(art.audio_id),
            "artifact_type": art.artifact_type,
            "data": art.data,
            "original_start": art.original_start,
            "created_at": art.created_at,
            "extra": art.extra,
        }


def list_artifacts(audio_id: str | uuid.UUID) -> list[dict[str, Any]]:
    """Return metadata rows for all artifacts of an audio (no blob data)."""
    with Session(_engine) as session:
        stmt = select(Artifact).where(Artifact.audio_id == uuid.UUID(str(audio_id)))
        rows = session.scalars(stmt).all()
        return [
            {
                "id": str(r.id),
                "audio_id": str(r.audio_id),
                "artifact_type": r.artifact_type,
                "original_start": r.original_start,
                "created_at": r.created_at,
                "extra": r.extra,
            }
            for r in rows
        ]


# ── temp-file helpers ─────────────────────────────────────────────────────────

def write_artifact_to_tmp(artifact_id: str, audio_id: str, extension: str = ".wav") -> Path:
    """Extract artifact blob to a temporary file and return the path.

    The caller is responsible for cleaning up via :func:`cleanup_tmp`.
    """
    art = get_artifact(artifact_id)
    if art is None:
        raise FileNotFoundError(f"Artifact {artifact_id} not found")
    tmp_dir = TMP_DIR / audio_id
    tmp_dir.mkdir(parents=True, exist_ok=True)
    tmp_path = tmp_dir / f"{artifact_id}{extension}"
    tmp_path.write_bytes(art["data"])
    return tmp_path


def write_raw_audio_to_tmp(audio_id: str, raw_bytes: bytes, extension: str = ".mp3") -> Path:
    """Write raw audio bytes to temp and return the path."""
    tmp_dir = TMP_DIR / audio_id
    tmp_dir.mkdir(parents=True, exist_ok=True)
    tmp_path = tmp_dir / f"raw{extension}"
    tmp_path.write_bytes(raw_bytes)
    return tmp_path
