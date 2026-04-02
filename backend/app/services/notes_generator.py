"""
Notes generator service — produces structured lecture notes from transcript + summary.

Uses Gemini to generate detailed, structured, study-friendly notes with
timeline markers (when available), key concepts, definitions, and exam points.
"""
from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.configs import DATABASE_URL
from app.db.models import AIOutput, Audio, NoteSection, TranscriptSegment
from app.services import gemini_adapter

logger = logging.getLogger(__name__)
_engine = create_engine(DATABASE_URL)

_NOTES_PROMPT = """You are an expert academic note-taker. Given a lecture transcript and its summary, produce detailed structured notes suitable for exam preparation.

Lecture metadata:
- Filename: {filename}
- Date: {upload_date}
- Subject: {subject_name}
- Duration: {duration}

Summary:
{summary}

Full transcript:
{transcript}

Produce ONLY valid JSON (no markdown, no code fences) with this structure:
{{
  "title": "Descriptive lecture title inferred from content",
  "lecture_summary": "2-3 sentence overview of the lecture",
  "main_concepts": ["concept1", "concept2", ...],
  "sections": [
    {{
      "title": "Section title",
      "content": "Detailed notes for this section in clean academic prose. Use markdown formatting (headers, bullets, bold) within the content.",
      "timestamp_start": null,
      "timestamp_end": null,
      "key_terms": ["term1", "term2"]
    }}
  ],
  "important_terms": [
    {{"term": "Term", "definition": "Clear definition"}}
  ],
  "examples_mentioned": ["Example 1 description", "Example 2 description"],
  "possible_exam_points": ["Point 1", "Point 2"],
  "key_takeaways": ["Takeaway 1", "Takeaway 2"],
  "follow_up_topics": ["Topic to explore further"]
}}

Rules:
- Use ONLY information from the transcript and summary. Do NOT invent facts.
- Convert spoken language into clean, structured academic notes.
- Compress filler words but retain all technical terms exactly as spoken.
- If something is unclear in the transcript, mark it as [unclear] instead of guessing.
- If timestamps are not available, set them to null — do NOT fabricate timestamps.
- Keep the tone clear, concise, and study-friendly.
- Create at least 3 sections for meaningful content organization.
- Each section's content should be detailed, not just a single sentence.
"""


def generate_notes(
    audio_id: str,
    subject_name: str = "Unknown",
) -> dict:
    """Generate structured notes from transcript + summary.

    Returns the parsed notes dict and stores NoteSection rows + AIOutput.
    """
    logger.info(f"[notes_gen] Generating notes for audio {audio_id}")

    # Load transcript and summary
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
            raise RuntimeError("No transcript found — cannot generate notes")

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
    prompt = _NOTES_PROMPT.format(
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
        notes_data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error(f"[notes_gen] Failed to parse notes JSON: {e}")
        logger.debug(f"[notes_gen] Raw response: {cleaned[:500]}")
        # Fallback: create a single section with the raw response as content
        notes_data = {
            "title": f"Lecture Notes — {filename}",
            "lecture_summary": summary or "See transcript for details.",
            "main_concepts": [],
            "sections": [
                {
                    "title": "Lecture Notes",
                    "content": raw_response,
                    "timestamp_start": None,
                    "timestamp_end": None,
                    "key_terms": [],
                }
            ],
            "important_terms": [],
            "examples_mentioned": [],
            "possible_exam_points": [],
            "key_takeaways": [],
            "follow_up_topics": [],
        }

    # Store notes in database
    _store_notes(audio_id, notes_data)

    logger.info(f"[notes_gen] ✓ Generated {len(notes_data.get('sections', []))} note sections")
    return notes_data


def _store_notes(audio_id: str, notes_data: dict) -> None:
    """Store generated notes as NoteSection rows and an AIOutput record."""
    with Session(_engine) as session:
        audio = session.get(Audio, uuid.UUID(audio_id))
        if not audio:
            return

        # Determine subject_id (prefer manual, then inferred)
        subject_id = audio.subject_id or audio.inferred_subject_id

        # Store individual sections
        sections = notes_data.get("sections", [])
        for idx, section in enumerate(sections):
            if not subject_id:
                break  # Can't create note_sections without a subject
            note = NoteSection(
                subject_id=subject_id,
                audio_id=uuid.UUID(audio_id),
                section_order=idx,
                title=section.get("title"),
                content=section.get("content", ""),
                timestamp_start=section.get("timestamp_start"),
                timestamp_end=section.get("timestamp_end"),
            )
            session.add(note)

        # Store full notes as AIOutput
        ai_out = AIOutput(
            audio_id=uuid.UUID(audio_id),
            output_type="notes",
            payload=notes_data,
        )
        session.add(ai_out)
        session.commit()
