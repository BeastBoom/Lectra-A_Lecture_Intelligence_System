"""
Denoise worker — apply noise reduction to standardized audio.
"""
from __future__ import annotations

import logging
import uuid

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.configs import DATABASE_URL
from app.db.models import Artifact
from app.services import denoise_service, storage_pg
from app.utils import ensure_tmp_dir

logger = logging.getLogger(__name__)
_engine = create_engine(DATABASE_URL)


def run(job_id: str, audio_id: str, state: str) -> None:
    """Load standardized artifact → denoise → save denoised_v1 artifact."""
    logger.info(f"[denoise] job={job_id} audio={audio_id}")

    # Find standardized artifact
    with Session(_engine) as session:
        stmt = select(Artifact).where(
            Artifact.audio_id == uuid.UUID(audio_id),
            Artifact.artifact_type == "standardized",
        )
        art = session.scalars(stmt).first()
        if art is None:
            raise ValueError(f"No standardized artifact for audio {audio_id}")
        artifact_id = str(art.id)

    # Write to temp, denoise, save back
    tmp_dir = ensure_tmp_dir(audio_id)
    input_path = storage_pg.write_artifact_to_tmp(artifact_id, audio_id, ".wav")
    output_path = tmp_dir / "denoised_v1.wav"

    try:
        denoise_service.denoise_audio(input_path, output_path)
        storage_pg.save_artifact(
            audio_id=audio_id,
            artifact_type="denoised_v1",
            file_path=output_path,
        )
        logger.info(f"[denoise] Saved denoised_v1 artifact for audio {audio_id}")
    finally:
        input_path.unlink(missing_ok=True)
        output_path.unlink(missing_ok=True)
