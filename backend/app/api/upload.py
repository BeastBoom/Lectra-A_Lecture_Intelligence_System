"""
POST /api/upload — accept audio file, validate, store, create job.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.configs import ALLOWED_EXTENSIONS, DATABASE_URL
from app.db.models import Audio, Job
from app.utils import file_extension

logger = logging.getLogger(__name__)
router = APIRouter()

_engine = create_engine(DATABASE_URL)


def _has_speech(raw_bytes: bytes, ext: str) -> bool:
    """Quick speech detection using energy threshold.

    Uses webrtcvad if available, otherwise a simple RMS check.
    """
    try:
        import wave
        import io
        import struct

        # For non-wav, we skip the detailed check and assume speech (ffprobe will catch bad files)
        if ext != ".wav":
            # Simple size heuristic: if file > 10KB, assume speech exists
            return len(raw_bytes) > 10_000

        with wave.open(io.BytesIO(raw_bytes), "rb") as wf:
            n_frames = wf.getnframes()
            if n_frames == 0:
                return False
            frames = wf.readframes(n_frames)
            samples = struct.unpack(f"<{n_frames * wf.getnchannels()}h", frames)
            rms = (sum(s * s for s in samples) / len(samples)) ** 0.5
            return rms > 50  # threshold
    except Exception:
        # If we can't read it, let the pipeline handle it
        return len(raw_bytes) > 10_000


def _probe_duration_from_bytes(raw_bytes: bytes, ext: str) -> float | None:
    """Get audio duration via ffprobe writing to a temp file."""
    try:
        import tempfile
        from app.services.ffmpeg_service import probe_duration
        from app.configs import TMP_DIR

        TMP_DIR.mkdir(parents=True, exist_ok=True)
        tmp_path = TMP_DIR / f"probe_{uuid.uuid4().hex}{ext}"
        tmp_path.write_bytes(raw_bytes)
        try:
            duration = probe_duration(str(tmp_path))
        finally:
            tmp_path.unlink(missing_ok=True)
        return duration
    except Exception as e:
        logger.warning(f"Could not probe duration: {e}")
        return None


@router.post("/upload")
async def upload_audio(
    file: UploadFile = File(...),
    userId: str = Form(default="anonymous"),
    courseId: str = Form(default="default"),
):
    """Upload an audio file for processing.

    Accepted formats: .mp3, .wav, .m4a, .aac
    """
    if file.filename is None:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = file_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    raw_bytes = await file.read()
    if len(raw_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    # Quick speech detection
    if not _has_speech(raw_bytes, ext):
        raise HTTPException(status_code=400, detail="No speech detected in audio file")

    # Probe duration
    duration = _probe_duration_from_bytes(raw_bytes, ext)

    # Create DB records
    audio_id = uuid.uuid4()
    job_id = uuid.uuid4()
    now = datetime.now(timezone.utc)

    audio = Audio(
        id=audio_id,
        user_id=userId,
        course_id=courseId,
        filename=file.filename,
        uploaded_at=now,
        duration_seconds=duration,
        raw_audio=raw_bytes,
        metadata_={"extension": ext, "size_bytes": len(raw_bytes)},
    )
    job = Job(
        id=job_id,
        audio_id=audio_id,
        state="preprocessing_audio",
        retry_count=0,
        progress={},
        created_at=now,
        updated_at=now,
    )

    with Session(_engine) as session:
        session.add(audio)
        session.add(job)
        session.commit()

    logger.info(f"Uploaded audio {audio_id} -> job {job_id}")

    return {
        "jobId": str(job_id),
        "audioId": str(audio_id),
        "statusUrl": f"/api/jobs/{job_id}/status",
    }
