"""
Transcription worker — runs Whisper ASR on denoised audio, then removes fillers.

FAILS HARD if Whisper returns an empty transcript.
"""
from __future__ import annotations

import logging
import uuid

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.configs import DATABASE_URL
from app.db.models import Artifact, Job, TranscriptSegment
from app.services import whisper_adapter, storage_pg
from app.services.filler_filter import remove_fillers

logger = logging.getLogger(__name__)
_engine = create_engine(DATABASE_URL)


def run(job_id: str, audio_id: str, state: str) -> None:
    """Transcribe the denoised audio and store clean transcript."""
    logger.info(f"[transcribe] job={job_id}")

    # ── 1. Load denoised artifact ─────────────────────────────────────────
    with Session(_engine) as session:
        stmt = select(Artifact).where(
            Artifact.audio_id == uuid.UUID(audio_id),
            Artifact.artifact_type == "denoised_v1",
        )
        denoised = session.scalars(stmt).first()
        if not denoised:
            raise RuntimeError("FATAL: No denoised artifact found — cannot transcribe.")
        if not denoised.data or len(denoised.data) < 1000:
            raise RuntimeError(
                f"FATAL: Denoised artifact is too small ({len(denoised.data) if denoised.data else 0} bytes). "
                "Audio was not processed properly."
            )
        denoised_id = str(denoised.id)
        denoised_size = len(denoised.data)

    logger.info(f"[transcribe] Denoised artifact: {denoised_size} bytes")

    # ── 2. Write to temp file for Whisper ─────────────────────────────────
    tmp_path = storage_pg.write_artifact_to_tmp(denoised_id, audio_id, ".wav")
    try:
        # Verify the temp file is valid
        file_size = tmp_path.stat().st_size
        if file_size < 1000:
            raise RuntimeError(f"FATAL: Temp audio file is only {file_size} bytes — too small for Whisper.")

        logger.info(f"[transcribe] Running Whisper on {file_size} byte file...")

        # ── 3. Run Whisper ────────────────────────────────────────────────
        raw_text = whisper_adapter.transcribe(str(tmp_path))

        # ── 4. HARD VALIDATION — fail if empty ───────────────────────────
        if not raw_text or len(raw_text.strip()) == 0:
            raise RuntimeError(
                "FATAL: Whisper returned an empty transcript. "
                "The audio may contain no recognizable speech, or the file format is unsupported. "
                "Pipeline stopped — will NOT call Gemini with empty text."
            )

        logger.info(f"[transcribe] Raw transcript: {len(raw_text)} chars")

        # ── 5. Remove filler words ────────────────────────────────────────
        clean_text = remove_fillers(raw_text)
        if not clean_text or len(clean_text.strip()) == 0:
            # Filler removal ate everything — use raw text instead
            logger.warning("[transcribe] Filler removal produced empty text, using raw transcript")
            clean_text = raw_text

        logger.info(f"[transcribe] Clean transcript: {len(clean_text)} chars")

    finally:
        tmp_path.unlink(missing_ok=True)

    # ── 6. Store transcript ───────────────────────────────────────────────
    with Session(_engine) as session:
        seg = TranscriptSegment(
            audio_id=uuid.UUID(audio_id),
            speaker_label="lecturer",
            start=0.0,
            end=0.0,
            text_raw=raw_text,
            text_clean=clean_text,
        )
        session.add(seg)

        job = session.get(Job, uuid.UUID(job_id))
        if job:
            job.progress = {"has_transcript": True}

        session.commit()

    logger.info(f"[transcribe] ✓ Transcript saved ({len(clean_text)} chars)")
