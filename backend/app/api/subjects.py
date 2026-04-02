"""
Subject CRUD + subject notes endpoints.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

from app.configs import DATABASE_URL
from app.db.models import Audio, NoteSection, Subject, SubjectNotes

router = APIRouter()
_engine = create_engine(DATABASE_URL)


# ── Schemas ──────────────────────────────────────────────────────────────────

class CreateSubjectRequest(BaseModel):
    name: str
    description: str | None = None
    user_id: str | None = None


class UpdateSubjectRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None


# ── Helpers ──────────────────────────────────────────────────────────────────

def _subject_dict(s: Subject, session: Session | None = None) -> dict:
    """Serialize a Subject to dict. Optionally includes session_count."""
    d = {
        "id": str(s.id),
        "name": s.name,
        "description": s.description,
        "isActive": s.is_active,
        "createdAt": s.created_at.isoformat() if s.created_at else None,
        "updatedAt": s.updated_at.isoformat() if s.updated_at else None,
        "userId": s.user_id,
    }
    if session:
        count = session.scalar(
            select(func.count(Audio.id)).where(Audio.subject_id == s.id)
        ) or 0
        d["sessionCount"] = count
    return d


# ── GET /api/subjects ────────────────────────────────────────────────────────

@router.get("/subjects")
async def list_subjects(user_id: str | None = None, include_inactive: bool = False):
    """List all subjects, optionally filtered by user_id."""
    with Session(_engine) as session:
        stmt = select(Subject).order_by(Subject.name)
        if user_id:
            stmt = stmt.where(Subject.user_id == user_id)
        if not include_inactive:
            stmt = stmt.where(Subject.is_active == True)  # noqa: E712
        subjects = session.scalars(stmt).all()
        return {
            "subjects": [_subject_dict(s, session) for s in subjects],
        }


# ── POST /api/subjects ───────────────────────────────────────────────────────

@router.post("/subjects")
async def create_subject(body: CreateSubjectRequest):
    """Create a new subject."""
    if not body.name or not body.name.strip():
        raise HTTPException(status_code=400, detail="Subject name is required")

    with Session(_engine) as session:
        # Check for duplicate name for this user
        stmt = select(Subject).where(
            Subject.name == body.name.strip(),
            Subject.is_active == True,  # noqa: E712
        )
        if body.user_id:
            stmt = stmt.where(Subject.user_id == body.user_id)
        existing = session.scalars(stmt).first()
        if existing:
            raise HTTPException(status_code=409, detail="A subject with this name already exists")

        subject = Subject(
            name=body.name.strip(),
            description=body.description,
            user_id=body.user_id,
        )
        session.add(subject)
        session.commit()
        session.refresh(subject)
        return _subject_dict(subject)


# ── GET /api/subjects/{id} ───────────────────────────────────────────────────

@router.get("/subjects/{subject_id}")
async def get_subject(subject_id: str):
    """Get a subject by ID."""
    try:
        sid = uuid.UUID(subject_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid subject ID format")

    with Session(_engine) as session:
        subject = session.get(Subject, sid)
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        return _subject_dict(subject, session)


# ── PATCH /api/subjects/{id} ─────────────────────────────────────────────────

@router.patch("/subjects/{subject_id}")
async def update_subject(subject_id: str, body: UpdateSubjectRequest):
    """Update a subject's name, description, or active status."""
    try:
        sid = uuid.UUID(subject_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid subject ID format")

    with Session(_engine) as session:
        subject = session.get(Subject, sid)
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")

        if body.name is not None:
            subject.name = body.name.strip()
        if body.description is not None:
            subject.description = body.description
        if body.is_active is not None:
            subject.is_active = body.is_active

        subject.updated_at = datetime.now(timezone.utc)
        session.commit()
        session.refresh(subject)
        return _subject_dict(subject, session)


# ── DELETE /api/subjects/{id} ────────────────────────────────────────────────

@router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: str):
    """Soft-delete a subject (set is_active=False)."""
    try:
        sid = uuid.UUID(subject_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid subject ID format")

    with Session(_engine) as session:
        subject = session.get(Subject, sid)
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")

        subject.is_active = False
        subject.updated_at = datetime.now(timezone.utc)
        session.commit()

        return {"message": "Subject deactivated", "id": subject_id}


# ── GET /api/subjects/{id}/notes ─────────────────────────────────────────────

@router.get("/subjects/{subject_id}/notes")
async def get_subject_notes(subject_id: str):
    """Get consolidated notes and individual sections for a subject."""
    try:
        sid = uuid.UUID(subject_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid subject ID format")

    with Session(_engine) as session:
        subject = session.get(Subject, sid)
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")

        # Consolidated notes
        consolidated = session.scalars(
            select(SubjectNotes)
            .where(SubjectNotes.subject_id == sid)
            .order_by(SubjectNotes.version.desc())
        ).first()

        # Individual sections (ordered by audio, then section_order)
        sections = session.scalars(
            select(NoteSection)
            .where(NoteSection.subject_id == sid)
            .order_by(NoteSection.created_at, NoteSection.section_order)
        ).all()

        return {
            "subjectId": str(subject.id),
            "subjectName": subject.name,
            "consolidatedNotes": consolidated.consolidated_notes if consolidated else None,
            "version": consolidated.version if consolidated else 0,
            "lastUpdatedAt": consolidated.last_updated_at.isoformat() if consolidated else None,
            "sections": [
                {
                    "id": str(sec.id),
                    "audioId": str(sec.audio_id),
                    "sectionOrder": sec.section_order,
                    "title": sec.title,
                    "content": sec.content,
                    "timestampStart": sec.timestamp_start,
                    "timestampEnd": sec.timestamp_end,
                    "createdAt": sec.created_at.isoformat() if sec.created_at else None,
                }
                for sec in sections
            ],
        }


# ── GET /api/subjects/{id}/sessions ──────────────────────────────────────────

@router.get("/subjects/{subject_id}/sessions")
async def get_subject_sessions(subject_id: str):
    """List audio sessions associated with a subject."""
    try:
        sid = uuid.UUID(subject_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid subject ID format")

    with Session(_engine) as session:
        audios = session.scalars(
            select(Audio)
            .where(Audio.subject_id == sid)
            .order_by(Audio.uploaded_at.desc())
        ).all()

        return {
            "subjectId": subject_id,
            "sessions": [
                {
                    "audioId": str(a.id),
                    "title": a.filename,
                    "durationSeconds": a.duration_seconds,
                    "uploadedAt": a.uploaded_at.isoformat() if a.uploaded_at else None,
                    "subjectSource": a.subject_source,
                }
                for a in audios
            ],
        }


# ── PATCH /api/audios/{id}/subject ───────────────────────────────────────────

@router.patch("/audios/{audio_id}/subject")
async def update_audio_subject(audio_id: str, subject_id: str | None = None):
    """Re-assign an audio to a different subject."""
    try:
        aid = uuid.UUID(audio_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid audio ID format")

    with Session(_engine) as session:
        audio = session.get(Audio, aid)
        if not audio:
            raise HTTPException(status_code=404, detail="Audio not found")

        if subject_id:
            try:
                sid = uuid.UUID(subject_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid subject ID format")

            subject = session.get(Subject, sid)
            if not subject:
                raise HTTPException(status_code=404, detail="Subject not found")

            audio.subject_id = sid
            audio.subject_source = "manual"
        else:
            audio.subject_id = None
            audio.subject_source = "unset"

        session.commit()

        return {
            "audioId": audio_id,
            "subjectId": str(audio.subject_id) if audio.subject_id else None,
            "subjectSource": audio.subject_source,
        }
