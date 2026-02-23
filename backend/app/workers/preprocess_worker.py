"""
Preprocess worker — convert raw audio to standardized mono 16k WAV.

Handles both 'validating' and 'preprocessing_audio' states.
"""
from __future__ import annotations

import logging
import uuid

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.configs import DATABASE_URL
from app.db.models import Audio
from app.services import ffmpeg_service, storage_pg
from app.utils import ensure_tmp_dir, cleanup_tmp_dir

logger = logging.getLogger(__name__)
_engine = create_engine(DATABASE_URL)


def run(job_id: str, audio_id: str, state: str) -> None:
    """Read raw blob → write temp file → ffmpeg mono 16k → save artifact."""
    logger.info(f"[preprocess] job={job_id} audio={audio_id} state={state}")

    # Get raw audio bytes from DB
    with Session(_engine) as session:
        audio = session.get(Audio, uuid.UUID(audio_id))
        if audio is None:
            raise ValueError(f"Audio {audio_id} not found")
        raw_bytes = audio.raw_audio
        ext = (audio.metadata_ or {}).get("extension", ".mp3")

    # Write to temp
    tmp_dir = ensure_tmp_dir(audio_id)
    raw_path = storage_pg.write_raw_audio_to_tmp(audio_id, raw_bytes, ext)
    standardized_path = tmp_dir / "standardized.wav"

    try:
        # Convert to mono 16k, loudnorm, trim silence
        ffmpeg_service.convert_to_mono_16k(raw_path, standardized_path)

        # Save artifact to DB
        storage_pg.save_artifact(
            audio_id=audio_id,
            artifact_type="standardized",
            file_path=standardized_path,
            extra={"sample_rate": 16000, "channels": 1},
        )
        logger.info(f"[preprocess] Saved standardized artifact for audio {audio_id}")
    finally:
        # Cleanup temp files (keep dir for next stages)
        raw_path.unlink(missing_ok=True)
