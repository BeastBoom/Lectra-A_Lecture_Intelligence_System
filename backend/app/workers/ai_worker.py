"""
AI worker — single Gemini API call to summarize the transcript.

FAILS HARD if transcript is empty or missing.
"""
from __future__ import annotations

import logging
import uuid

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.configs import DATABASE_URL
from app.db.models import Job, TranscriptSegment, AIOutput
from app.services import gemini_adapter

logger = logging.getLogger(__name__)
_engine = create_engine(DATABASE_URL)


def run(job_id: str, audio_id: str, state: str) -> None:
    """Summarize the transcript via a single Gemini call."""
    logger.info(f"[summarize] job={job_id}")

    # ── 1. Load and validate transcript ───────────────────────────────────
    with Session(_engine) as session:
        stmt = select(TranscriptSegment).where(
            TranscriptSegment.audio_id == uuid.UUID(audio_id),
        )
        seg = session.scalars(stmt).first()

        if not seg:
            raise RuntimeError("FATAL: No transcript row found. Transcription step must have failed.")

        if not seg.text_clean or len(seg.text_clean.strip()) == 0:
            raise RuntimeError(
                "FATAL: Transcript is empty. Will NOT call Gemini with empty text. "
                "Check the audio file and Whisper output."
            )

        transcript = seg.text_clean.strip()

    logger.info(f"[summarize] Transcript: {len(transcript)} chars — calling Gemini...")

    # ── 2. Single Gemini call ─────────────────────────────────────────────
    summary = gemini_adapter.summarize(transcript)

    if not summary or len(summary.strip()) == 0:
        raise RuntimeError("FATAL: Gemini returned an empty summary.")

    logger.info(f"[summarize] ✓ Summary: {len(summary)} chars")

    # ── 3. Store result ───────────────────────────────────────────────────
    with Session(_engine) as session:
        ai_out = AIOutput(
            audio_id=uuid.UUID(audio_id),
            output_type="summary",
            payload={"summary": summary},
        )
        session.add(ai_out)

        job = session.get(Job, uuid.UUID(job_id))
        if job:
            job.progress = {"has_transcript": True, "has_summary": True}

        session.commit()

    logger.info(f"[summarize] ✓ Summary saved")
