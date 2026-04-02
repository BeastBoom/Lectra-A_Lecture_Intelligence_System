"""
Subject inference service — uses Gemini to classify transcripts into EXISTING subjects only.

Never creates new arbitrary subjects. Falls back to 'Uncategorized' if no match.
"""
from __future__ import annotations

import json
import logging
import uuid

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.configs import DATABASE_URL
from app.db.models import Audio, Subject
from app.services import gemini_adapter

logger = logging.getLogger(__name__)
_engine = create_engine(DATABASE_URL)

_INFERENCE_PROMPT = """You are a subject/course classifier for university lectures.
Given a transcript excerpt and a list of existing subjects, determine the BEST matching subject from the list.

IMPORTANT: You MUST choose from the existing subjects listed below. Do NOT invent new subjects.

Existing subjects:
{existing_subjects}

Transcript excerpt (first 3000 chars):
{transcript_excerpt}

Respond with ONLY valid JSON (no markdown, no code fences):
{{
  "subject_name": "Exact name from the existing subjects list above",
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation of why this subject matches"
}}

Rules:
- You MUST pick one of the existing subjects listed above. Do NOT create or suggest new subject names.
- If the transcript clearly matches a subject, use that exact name with high confidence.
- If no subject is a good match, use "Uncategorized" with low confidence.
- If the transcript is too short or unclear, use "Uncategorized" with low confidence.
- Do NOT guess — if uncertain, set confidence below 0.5 and use "Uncategorized".
"""


def infer_subject(
    transcript: str,
    audio_id: str,
    user_id: str | None = None,
) -> tuple[uuid.UUID, str]:
    """Infer the subject from transcript content using EXISTING subjects only.

    Returns (subject_id, subject_source) where subject_source is 'ai_inferred'.
    Falls back to 'Uncategorized' if no good match or no existing subjects.
    """
    # Load existing subjects for the user
    with Session(_engine) as session:
        stmt = select(Subject).where(Subject.is_active == True)  # noqa: E712
        if user_id:
            stmt = stmt.where(Subject.user_id == user_id)
        existing = session.scalars(stmt).all()
        existing_names = [s.name for s in existing]
        existing_map = {s.name.lower().strip(): s.id for s in existing}

    # If no existing subjects at all, go straight to Uncategorized
    if not existing_names:
        logger.info("[subject_inference] No existing subjects found, using 'Uncategorized'")
        subject_id = _ensure_uncategorized(user_id)
        _update_audio(audio_id, subject_id)
        return subject_id, "ai_inferred"

    # Build prompt with existing subjects only
    subjects_str = "\n".join(f"- {name}" for name in existing_names)
    excerpt = transcript[:3000] if len(transcript) > 3000 else transcript

    prompt = _INFERENCE_PROMPT.format(
        existing_subjects=subjects_str,
        transcript_excerpt=excerpt,
    )

    # Call Gemini
    try:
        raw_response = gemini_adapter.generate_text(prompt)
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        result = json.loads(cleaned)
    except (json.JSONDecodeError, Exception) as e:
        logger.warning(f"[subject_inference] Failed to parse Gemini response: {e}")
        result = {"subject_name": "Uncategorized", "confidence": 0.0}

    subject_name = result.get("subject_name", "Uncategorized").strip()
    confidence = float(result.get("confidence", 0.0))

    logger.info(f"[subject_inference] Inferred: '{subject_name}' (confidence={confidence})")

    # Low confidence fallback
    if confidence < 0.4:
        subject_name = "Uncategorized"

    # Match against existing subjects ONLY
    matched_key = subject_name.lower().strip()
    if matched_key in existing_map:
        subject_id = existing_map[matched_key]
        logger.info(f"[subject_inference] Matched existing subject: '{subject_name}'")
    else:
        # AI returned a name not in the list — fall back to Uncategorized
        logger.info(f"[subject_inference] '{subject_name}' not in existing subjects, using 'Uncategorized'")
        subject_id = _ensure_uncategorized(user_id)

    _update_audio(audio_id, subject_id)
    return subject_id, "ai_inferred"


def _ensure_uncategorized(user_id: str | None) -> uuid.UUID:
    """Find or create an 'Uncategorized' subject."""
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


def _update_audio(audio_id: str, subject_id: uuid.UUID) -> None:
    """Update audio record with inferred subject."""
    with Session(_engine) as session:
        audio = session.get(Audio, uuid.UUID(audio_id))
        if audio:
            audio.inferred_subject_id = subject_id
            if audio.subject_source == "unset":
                audio.subject_id = subject_id
                audio.subject_source = "ai_inferred"
            session.commit()
