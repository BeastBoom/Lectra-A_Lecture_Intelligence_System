"""
Notes consolidator service — merges session-specific notes into a
consolidated subject-level document.

On first session: creates the initial consolidated notes.
On subsequent sessions: uses Gemini to intelligently merge new content,
avoiding duplication and preserving prior notes.
"""
from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.configs import DATABASE_URL
from app.db.models import SubjectNotes, NoteSection, Subject
from app.services import gemini_adapter

logger = logging.getLogger(__name__)
_engine = create_engine(DATABASE_URL)

_MERGE_PROMPT = """You are merging lecture notes for the subject "{subject_name}".

EXISTING consolidated notes (version {version}):
{existing_notes}

NEW notes from the latest lecture session:
{new_notes}

Produce MERGED consolidated notes that:
1. ADD new sections that cover topics not already in the existing notes.
2. UPDATE existing sections when the new notes provide additional clarity, examples, or detail.
3. AVOID duplicating information that is already well-covered.
4. Keep session-specific details (dates, examples) attributed clearly.
5. Maintain a clear, study-friendly structure with headers and bullets.
6. Preserve ALL existing content — never remove prior notes.

Output the merged notes as clean markdown text (NOT JSON). Use headers (##, ###) for organization.
Start directly with the content — no preamble.
"""


def update_consolidated_notes(subject_id: str | uuid.UUID, new_notes_text: str) -> None:
    """Merge new session notes into the subject's consolidated document.

    If no consolidated doc exists yet, creates one directly from the new notes.
    Otherwise, uses Gemini to intelligently merge.
    """
    sid = uuid.UUID(str(subject_id))

    with Session(_engine) as session:
        subject = session.get(Subject, sid)
        if not subject:
            logger.warning(f"[consolidator] Subject {subject_id} not found, skipping")
            return

        # Find existing consolidated notes
        existing = session.scalars(
            select(SubjectNotes)
            .where(SubjectNotes.subject_id == sid)
            .order_by(SubjectNotes.version.desc())
        ).first()

        if not existing:
            # First session — create initial consolidated notes
            doc = SubjectNotes(
                subject_id=sid,
                consolidated_notes=new_notes_text,
                version=1,
                last_updated_at=datetime.now(timezone.utc),
            )
            session.add(doc)
            session.commit()
            logger.info(f"[consolidator] Created initial consolidated notes for subject '{subject.name}'")
            return

        # Subsequent session — merge via Gemini
        prompt = _MERGE_PROMPT.format(
            subject_name=subject.name,
            version=existing.version,
            existing_notes=existing.consolidated_notes or "(empty)",
            new_notes=new_notes_text[:6000],  # Cap to avoid token limits
        )

        try:
            merged = gemini_adapter.generate_text(prompt)
            merged = merged.strip()
        except Exception as e:
            logger.error(f"[consolidator] Gemini merge failed: {e}")
            # Fallback: append new notes under a separator
            merged = (
                (existing.consolidated_notes or "")
                + f"\n\n---\n\n## Session Update (v{existing.version + 1})\n\n"
                + new_notes_text
            )

        # Update the existing record (in-place update, version bump)
        existing.consolidated_notes = merged
        existing.version += 1
        existing.last_updated_at = datetime.now(timezone.utc)
        session.commit()

        logger.info(
            f"[consolidator] ✓ Updated consolidated notes for '{subject.name}' → v{existing.version}"
        )


def build_notes_text_from_sections(audio_id: str) -> str:
    """Build a markdown string from the NoteSection rows for a given audio session."""
    with Session(_engine) as session:
        sections = session.scalars(
            select(NoteSection)
            .where(NoteSection.audio_id == uuid.UUID(audio_id))
            .order_by(NoteSection.section_order)
        ).all()

        if not sections:
            return ""

        parts = []
        for sec in sections:
            header = f"## {sec.title}" if sec.title else ""
            timestamp = ""
            if sec.timestamp_start is not None:
                ts_min = int(sec.timestamp_start // 60)
                ts_sec = int(sec.timestamp_start % 60)
                timestamp = f"*[{ts_min}:{ts_sec:02d}]*  "
            line = f"{header}\n{timestamp}{sec.content}" if header else f"{timestamp}{sec.content}"
            parts.append(line)

        return "\n\n".join(parts)
