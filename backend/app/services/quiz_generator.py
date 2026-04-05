"""
Quiz generator service — produces Flashcards and MCQs from transcript + summary.

Uses Gemini to generate educational content.
"""
from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import create_engine, select, delete
from sqlalchemy.orm import Session

from app.configs import DATABASE_URL
from app.db.models import AIOutput, Audio, TranscriptSegment
from app.services import gemini_adapter

logger = logging.getLogger(__name__)
_engine = create_engine(DATABASE_URL)

_QUIZ_PROMPT = """You are an expert educator. Given a lecture transcript and its summary, produce a set of Flashcards and Multiple Choice Questions (MCQs) for students to test their knowledge.

Lecture metadata:
- Filename: {filename}
- Date: {upload_date}
- Subject: {subject_name}
- Duration: {duration}

Summary:
{summary}

Full transcript:
{transcript}

Produce ONLY valid JSON (no markdown, no code fences) with this exact structure:
{{
  "flashcards": [
    {{
      "front": "Question or concept to remember?",
      "back": "The answer or definition."
    }}
  ],
  "mcqs": [
    {{
      "question": "The text of the multiple choice question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Explanation for why this is the correct answer."
    }}
  ]
}}

Rules:
- Generate at least 5-10 flashcards representing core concepts and terms.
- Generate at least 5 multiple choice questions.
- For MCQs, provide exactly 4 plausible options. The correctIndex must be an integer between 0 and 3 corresponding to the correct option in the options array.
- Use ONLY information from the transcript and summary. Do NOT invent facts.
- Keep the questions clear, testable, and relevant to the main topics.
"""


def generate_quiz(
    audio_id: str,
    subject_name: str = "Unknown",
) -> dict:
    """Generate flashcards and MCQs from transcript + summary.

    Returns the parsed quiz dict and stores it as an AIOutput.
    """
    logger.info(f"[quiz_gen] Generating quiz for audio {audio_id}")

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
            raise RuntimeError("No transcript found — cannot generate quiz")

        transcript = seg.text_clean.strip()

        # Get summary
        ai_out = session.scalars(
            select(AIOutput).where(
                AIOutput.audio_id == uuid.UUID(audio_id),
                AIOutput.output_type == "summary",
            )
        ).first()
        summary = ""
        if ai_out and ai_out.payload:
            summary = ai_out.payload.get("summary", "") if isinstance(ai_out.payload, dict) else str(ai_out.payload)

        filename = audio.filename or "Unknown"
        upload_date = audio.uploaded_at.strftime("%Y-%m-%d") if audio.uploaded_at else "Unknown"
        duration = f"{int(audio.duration_seconds // 60)}m {int(audio.duration_seconds % 60)}s" if audio.duration_seconds else "Unknown"

    # Build prompt
    prompt = _QUIZ_PROMPT.format(
        filename=filename,
        upload_date=upload_date,
        subject_name=subject_name,
        duration=duration,
        summary=summary,
        transcript=transcript[:8000],  # Cap to avoid token limits
    )

    # Call Gemini
    raw_response = gemini_adapter.generate_text(prompt)

    # Parse JSON response
    cleaned = raw_response.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        quiz_data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error(f"[quiz_gen] Failed to parse quiz JSON: {e}")
        logger.debug(f"[quiz_gen] Raw response: {cleaned[:500]}")
        # Fallback empty quiz
        quiz_data = {
            "flashcards": [],
            "mcqs": []
        }

    # Assign IDs dynamically per item
    for idx, card in enumerate(quiz_data.get("flashcards", [])):
        card["id"] = f"fc-{idx}-{uuid.uuid4().hex[:8]}"

    for idx, mcq in enumerate(quiz_data.get("mcqs", [])):
        mcq["id"] = f"mcq-{idx}-{uuid.uuid4().hex[:8]}"

    # Store quiz
    _store_quiz(audio_id, quiz_data)

    num_flashcards = len(quiz_data.get("flashcards", []))
    num_mcqs = len(quiz_data.get("mcqs", []))
    logger.info(f"[quiz_gen] ✓ Generated {num_flashcards} flashcards and {num_mcqs} MCQs")
    return quiz_data


def _store_quiz(audio_id: str, quiz_data: dict) -> None:
    """Store the full quiz payload as an AIOutput."""
    with Session(_engine) as session:
        # Remove any existing quiz for this audio to avoid duplicates
        session.execute(
            delete(AIOutput).where(
                AIOutput.audio_id == uuid.UUID(audio_id),
                AIOutput.output_type == "quiz_flashcards",
            )
        )
        ai_out = AIOutput(
            audio_id=uuid.UUID(audio_id),
            output_type="quiz_flashcards",
            payload=quiz_data,
        )
        session.add(ai_out)
        session.commit()
