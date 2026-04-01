"""
Notes worker — generates structured notes, infers subject, and updates
consolidated notes.

Pipeline step after 'summarizing'. Runs as the 'generating_notes' state.

Steps:
1. If no subject assigned → infer subject from transcript
2. Generate structured notes from transcript + summary
3. Update the subject-level consolidated notes
"""
from __future__ import annotations

import logging
import uuid

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.configs import DATABASE_URL
from app.db.models import Audio, Job, Subject, TranscriptSegment, AIOutput

logger = logging.getLogger(__name__)
_engine = create_engine(DATABASE_URL)


def run(job_id: str, audio_id: str, state: str) -> None:
    """Generate notes, infer subject if needed, update consolidated notes."""
    logger.info(f"[notes_worker] job={job_id}")

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
            logger.warning(f"[notes_worker] No transcript for audio {audio_id}, skipping notes generation")
            return

        transcript = seg.text_clean.strip()
        current_subject_id = audio.subject_id
        current_subject_source = audio.subject_source
        user_id = audio.user_id

    # ── 2. Subject inference (if no subject assigned) ─────────────────────
    if not current_subject_id or current_subject_source == "unset":
        logger.info(f"[notes_worker] No subject assigned, inferring...")
        try:
            from app.services.subject_inference import infer_subject
            subject_id, source = infer_subject(transcript, audio_id, user_id)
            current_subject_id = subject_id
        except Exception as e:
            logger.error(f"[notes_worker] Subject inference failed: {e}")
            # Create/use fallback "Uncategorized" subject
            current_subject_id = _ensure_uncategorized_subject(user_id)
            with Session(_engine) as session:
                audio = session.get(Audio, uuid.UUID(audio_id))
                if audio:
                    audio.subject_id = current_subject_id
                    audio.subject_source = "ai_inferred"
                    session.commit()

    # Get subject name for notes prompt
    subject_name = "Unknown"
    with Session(_engine) as session:
        if current_subject_id:
            subject = session.get(Subject, current_subject_id)
            if subject:
                subject_name = subject.name

    # ── 3. Generate structured notes ──────────────────────────────────────
    logger.info(f"[notes_worker] Generating notes for subject '{subject_name}'...")
    try:
        from app.services.notes_generator import generate_notes
        notes_data = generate_notes(audio_id, subject_name)
    except Exception as e:
        logger.error(f"[notes_worker] Notes generation failed: {e}")
        # Mark progress but don't fail the entire job
        with Session(_engine) as session:
            job = session.get(Job, uuid.UUID(job_id))
            if job:
                job.progress = {
                    **(job.progress or {}),
                    "has_notes": False,
                    "notes_error": str(e)[:500],
                }
                session.commit()
        return

    # ── 4. Update consolidated notes ──────────────────────────────────────
    if current_subject_id:
        logger.info(f"[notes_worker] Updating consolidated notes for subject '{subject_name}'...")
        try:
            from app.services.notes_consolidator import (
                update_consolidated_notes,
                build_notes_text_from_sections,
            )
            new_notes_text = build_notes_text_from_sections(audio_id)
            if new_notes_text:
                update_consolidated_notes(current_subject_id, new_notes_text)
        except Exception as e:
            logger.error(f"[notes_worker] Consolidation failed: {e}")
            # Non-fatal — individual session notes are already saved

    # ── 5. Update job progress ────────────────────────────────────────────
    with Session(_engine) as session:
        job = session.get(Job, uuid.UUID(job_id))
        if job:
            job.progress = {
                **(job.progress or {}),
                "has_notes": True,
                "notes_sections": len(notes_data.get("sections", [])),
            }
            session.commit()

    logger.info(f"[notes_worker] ✓ Notes generation complete for audio {audio_id}")


def _ensure_uncategorized_subject(user_id: str | None) -> uuid.UUID:
    """Find or create an 'Uncategorized' subject for the user."""
    with Session(_engine) as session:
        stmt = select(Subject).where(
            Subject.name == "Uncategorized",
            Subject.is_active == True,  # noqa: E712
        )
        if user_id:
            stmt = stmt.where(Subject.user_id == user_id)

        existing = session.scalars(stmt).first()
        if existing:
            return existing.id

        subject = Subject(
            user_id=user_id,
            name="Uncategorized",
            description="Default subject for unclassified lectures",
        )
        session.add(subject)
        session.commit()
        return subject.id
