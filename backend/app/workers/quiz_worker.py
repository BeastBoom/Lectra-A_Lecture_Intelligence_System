"""
Quiz worker — generates Flashcards and MCQs based on the generated transcript.

Pipeline step after 'generating_notes'. Runs as the 'generating_quiz' state.

Steps:
1. Ensure transcript is available.
2. Call quiz_generator.generate_quiz.
"""
from __future__ import annotations

import logging
import uuid

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.configs import DATABASE_URL
from app.db.models import Audio, Job, Subject, TranscriptSegment

logger = logging.getLogger(__name__)
_engine = create_engine(DATABASE_URL)


def run(job_id: str, audio_id: str, state: str) -> None:
    """Generate quiz from the audio transcript."""
    logger.info(f"[quiz_worker] job={job_id}")

    # ── 1. Load audio and check prerequisites ─────────────────────────────
    with Session(_engine) as session:
        audio = session.get(Audio, uuid.UUID(audio_id))
        if not audio:
            raise RuntimeError(f"Audio {audio_id} not found")

        seg = session.scalars(
            select(TranscriptSegment).where(
                TranscriptSegment.audio_id == uuid.UUID(audio_id)
            )
        ).first()

        if not seg or not seg.text_clean:
            logger.warning(f"[quiz_worker] No transcript for audio {audio_id}, skipping quiz generation")
            return

        current_subject_id = audio.subject_id

    # Get subject name for quiz prompt
    subject_name = "Unknown"
    with Session(_engine) as session:
        if current_subject_id:
            subject = session.get(Subject, current_subject_id)
            if subject:
                subject_name = subject.name

    # ── 2. Generate quiz ────────────────────────────────────────────────
    logger.info(f"[quiz_worker] Generating quiz for subject '{subject_name}'...")
    try:
        from app.services.quiz_generator import generate_quiz
        quiz_data = generate_quiz(audio_id, subject_name)
    except Exception as e:
        logger.error(f"[quiz_worker] Quiz generation failed: {e}")
        # Mark progress but don't fail the entire job
        with Session(_engine) as session:
            job = session.get(Job, uuid.UUID(job_id))
            if job:
                job.progress = {
                    **(job.progress or {}),
                    "has_quiz": False,
                    "quiz_error": str(e)[:500],
                }
                session.commit()
        return

    # ── 3. Update job progress ──────────────────────────────────────────
    with Session(_engine) as session:
        job = session.get(Job, uuid.UUID(job_id))
        if job:
            job.progress = {
                **(job.progress or {}),
                "has_quiz": True,
                "quiz_flashcards": len(quiz_data.get("flashcards", [])),
                "quiz_mcqs": len(quiz_data.get("mcqs", [])),
            }
            session.commit()

    logger.info(f"[quiz_worker] ✓ Quiz generation complete for audio {audio_id}")
